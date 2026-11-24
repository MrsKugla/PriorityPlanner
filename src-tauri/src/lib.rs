use std::{fs, io::ErrorKind, path::PathBuf};
use tauri::Manager;

/// Cartella dati dell'app (offline, senza account).
fn cartella_dati(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let cartella = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&cartella).map_err(|e| e.to_string())?;
    Ok(cartella)
}

/// Contenuto di un file della cartella dati, oppure `None` se non esiste.
fn leggi(file: PathBuf) -> Result<Option<String>, String> {
    match fs::read_to_string(file) {
        Ok(testo) => Ok(Some(testo)),
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Scrive prima un file temporaneo e poi lo rinomina: un'interruzione non lascia mai un file a metà.
fn scrivi(file: PathBuf, contenuto: String) -> Result<(), String> {
    let temporaneo = file.with_extension("json.tmp");
    fs::write(&temporaneo, contenuto).map_err(|e| e.to_string())?;
    fs::rename(&temporaneo, &file).map_err(|e| e.to_string())
}

/// I dati dell'app: un solo file JSON. `None` al primo avvio.
#[tauri::command]
fn leggi_dati(app: tauri::AppHandle) -> Result<Option<String>, String> {
    leggi(cartella_dati(&app)?.join("dati.json"))
}

#[tauri::command]
fn scrivi_dati(app: tauri::AppHandle, contenuto: String) -> Result<(), String> {
    scrivi(cartella_dati(&app)?.join("dati.json"), contenuto)
}

/// Copia dei dati fatta prima dell'ultima importazione (C5): una sola, sovrascritta a ogni importazione.
#[tauri::command]
fn leggi_backup(app: tauri::AppHandle) -> Result<Option<String>, String> {
    leggi(cartella_dati(&app)?.join("backup-importazione.json"))
}

#[tauri::command]
fn scrivi_backup(app: tauri::AppHandle, contenuto: String) -> Result<(), String> {
    scrivi(cartella_dati(&app)?.join("backup-importazione.json"), contenuto)
}

/* Esporta / Importa (C1, C2). Su Windows le finestre «Salva» e «Apri» del sistema; su Android il plugin Kotlin
   `FilePlugin` apre «Salva come» / «Apri» e scrive o legge il `content://` scelto con il ContentResolver
   (i plugin ufficiali dialog + fs creano file vuoti su Android, bug plugins-workspace #3356). */

#[cfg(target_os = "android")]
struct FileAndroid(tauri::plugin::PluginHandle<tauri::Wry>);

#[cfg(target_os = "android")]
fn file_android(app: &tauri::AppHandle) -> &tauri::plugin::PluginHandle<tauri::Wry> {
    &app.state::<FileAndroid>().inner().0
}

/// Salva `contenuto` in un file scelto dall'utente. Restituisce il nome del file, oppure `None` se ha annullato.
#[tauri::command]
async fn esporta_file(app: tauri::AppHandle, nome: String, contenuto: String) -> Result<Option<String>, String> {
    #[cfg(target_os = "android")]
    {
        let r: serde_json::Value = file_android(&app)
            .run_mobile_plugin_async("salva", serde_json::json!({ "nome": nome, "contenuto": contenuto }))
            .await
            .map_err(|e| e.to_string())?;
        Ok(r.get("nome").and_then(|n| n.as_str()).map(String::from))
    }
    #[cfg(not(target_os = "android"))]
    {
        use tauri_plugin_dialog::DialogExt;
        let Some(scelto) = app.dialog().file().add_filter("Priority Planner", &["json"]).set_file_name(&nome).blocking_save_file() else {
            return Ok(None);
        };
        let percorso = scelto.into_path().map_err(|e| e.to_string())?;
        fs::write(&percorso, contenuto).map_err(|e| e.to_string())?;
        Ok(percorso.file_name().map(|n| n.to_string_lossy().into_owned()))
    }
}

/// Legge un file scelto dall'utente. `None` se ha annullato.
#[tauri::command]
async fn importa_file(app: tauri::AppHandle) -> Result<Option<String>, String> {
    #[cfg(target_os = "android")]
    {
        let r: serde_json::Value = file_android(&app)
            .run_mobile_plugin_async("apri", serde_json::json!({}))
            .await
            .map_err(|e| e.to_string())?;
        Ok(r.get("contenuto").and_then(|n| n.as_str()).map(String::from))
    }
    #[cfg(not(target_os = "android"))]
    {
        use tauri_plugin_dialog::DialogExt;
        let Some(scelto) = app.dialog().file().add_filter("Priority Planner", &["json"]).blocking_pick_file() else {
            return Ok(None);
        };
        let percorso = scelto.into_path().map_err(|e| e.to_string())?;
        fs::read_to_string(percorso).map(Some).map_err(|e| e.to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![leggi_dati, scrivi_dati, leggi_backup, scrivi_backup, esporta_file, importa_file]);
    // L'updater di Tauri esiste solo su desktop: su Android l'app controlla le release di GitHub dal frontend.
    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init());
    #[cfg(target_os = "android")]
    let builder = builder.plugin(
        tauri::plugin::Builder::<tauri::Wry>::new("file")
            .setup(|app, api| {
                let handle = api.register_android_plugin("it.priorityplanner.app", "FilePlugin")?;
                app.manage(FileAndroid(handle));
                Ok(())
            })
            .build(),
    );
    builder
        .run(tauri::generate_context!())
        .expect("Errore durante l'avvio di Priority Planner");
}
