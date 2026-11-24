use std::{fs, io::ErrorKind, path::PathBuf};
use tauri::Manager;

/// I dati dell'app: un solo file JSON nella cartella dati dell'app (offline, senza account).
fn file_dati(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let cartella = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&cartella).map_err(|e| e.to_string())?;
    Ok(cartella.join("dati.json"))
}

/// Contenuto del file, oppure `None` al primo avvio.
#[tauri::command]
fn leggi_dati(app: tauri::AppHandle) -> Result<Option<String>, String> {
    match fs::read_to_string(file_dati(&app)?) {
        Ok(testo) => Ok(Some(testo)),
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Scrive prima un file temporaneo e poi lo rinomina: un'interruzione non lascia mai un file a metà.
#[tauri::command]
fn scrivi_dati(app: tauri::AppHandle, contenuto: String) -> Result<(), String> {
    let file = file_dati(&app)?;
    let temporaneo = file.with_extension("json.tmp");
    fs::write(&temporaneo, contenuto).map_err(|e| e.to_string())?;
    fs::rename(&temporaneo, &file).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![leggi_dati, scrivi_dati]);
    // L'updater di Tauri esiste solo su desktop: su Android l'app controlla le release di GitHub dal frontend.
    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init());
    builder
        .run(tauri::generate_context!())
        .expect("Errore durante l'avvio di Priority Planner");
}
