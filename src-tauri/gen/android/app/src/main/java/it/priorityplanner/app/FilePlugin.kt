package it.priorityplanner.app

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.result.ActivityResult
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

@InvokeArg
class SalvaArgs {
  lateinit var nome: String
  lateinit var contenuto: String
}

/* Esporta / Importa su Android (C1, C2): «Salva come» e «Apri» del sistema, poi scrittura e lettura del
   content:// scelto con il ContentResolver. Funziona con Download, Drive e le altre app che offrono file.
   Chiamato da Rust (esporta_file / importa_file), non dal JavaScript. */
@TauriPlugin
class FilePlugin(private val activity: Activity) : Plugin(activity) {
  private var daScrivere: String? = null

  @Command
  fun salva(invoke: Invoke) {
    val args = invoke.parseArgs(SalvaArgs::class.java)
    daScrivere = args.contenuto
    val intent = Intent(Intent.ACTION_CREATE_DOCUMENT)
      .addCategory(Intent.CATEGORY_OPENABLE)
      .setType("application/json")
      .putExtra(Intent.EXTRA_TITLE, args.nome)
    startActivityForResult(invoke, intent, "salvato")
  }

  @ActivityCallback
  fun salvato(invoke: Invoke, result: ActivityResult) {
    val testo = daScrivere
    daScrivere = null
    val uri = result.data?.data
    if (result.resultCode != Activity.RESULT_OK || uri == null || testo == null) {
      invoke.resolve(JSObject())
      return
    }
    try {
      val byte = testo.toByteArray(Charsets.UTF_8)
      // "wt" tronca un file esistente; alcuni fornitori (es. Drive) accettano solo "w".
      val flusso = try { activity.contentResolver.openOutputStream(uri, "wt") } catch (e: Exception) { null }
        ?: activity.contentResolver.openOutputStream(uri, "w")
        ?: throw IllegalStateException("il file scelto non si può aprire")
      flusso.use { it.write(byte); it.flush() }
      invoke.resolve(JSObject().put("nome", nomeDi(uri)))
    } catch (e: Exception) {
      invoke.reject("Salvataggio non riuscito: ${e.message}")
    }
  }

  @Command
  fun apri(invoke: Invoke) {
    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT)
      .addCategory(Intent.CATEGORY_OPENABLE)
      .setType("*/*")
    startActivityForResult(invoke, intent, "aperto")
  }

  @ActivityCallback
  fun aperto(invoke: Invoke, result: ActivityResult) {
    val uri = result.data?.data
    if (result.resultCode != Activity.RESULT_OK || uri == null) {
      invoke.resolve(JSObject())
      return
    }
    try {
      val testo = activity.contentResolver.openInputStream(uri)?.use { it.readBytes().toString(Charsets.UTF_8) }
        ?: throw IllegalStateException("il file scelto non si può aprire")
      invoke.resolve(JSObject().put("contenuto", testo))
    } catch (e: Exception) {
      invoke.reject("Lettura non riuscita: ${e.message}")
    }
  }

  private fun nomeDi(uri: Uri): String {
    activity.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use {
      if (it.moveToFirst()) return it.getString(0) ?: ""
    }
    return uri.lastPathSegment ?: ""
  }
}
