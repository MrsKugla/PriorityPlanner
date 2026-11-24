<script lang="ts">
  /* Importa / Esporta (D4, C1–C6), in Il mio ritmo › Regole. Le conferme stanno nella pagina, non in finestre del sistema. */
  import { archivio, type Dati } from "../lib/dati.svelte";
  import {
    dispositivo, esporta, importa, leggiBackup, leggiFileDaImportare, ripristinaBackup, salvaDispositivo, type DaImportare,
  } from "../lib/scambio.svelte";

  const quando = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const data = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "data sconosciuta" : quando.format(d);
  };

  let campoNome: HTMLInputElement;
  let messaggio = $state("");
  let errore = $state("");
  let lavoro = $state(false);
  let daImportare = $state<DaImportare | null>(null);
  let backup = $state<Dati | null>(null);
  let confermaBackup = $state(false);

  leggiBackup().then((b) => (backup = b)).catch(() => (backup = null));

  async function passo(azione: () => Promise<void>): Promise<void> {
    messaggio = "";
    errore = "";
    lavoro = true;
    try {
      await azione();
    } catch (e) {
      errore = e instanceof Error ? e.message : String(e);
    } finally {
      lavoro = false;
    }
  }

  const suEsporta = () =>
    passo(async () => {
      if (!dispositivo.nome) {
        errore = "Prima scrivi il nome di questo dispositivo: finisce nel nome del file.";
        campoNome.focus();
        return;
      }
      const nome = await esporta();
      if (nome) messaggio = `Salvato: ${nome}.`;
    });

  const suImporta = () =>
    passo(async () => {
      daImportare = await leggiFileDaImportare();
    });

  const confermaImporta = () =>
    passo(async () => {
      if (!daImportare) return;
      await importa(daImportare);
      backup = await leggiBackup();
      messaggio = `Dati importati (${daImportare.dati.attivita.length} attività). Quelli di prima sono nella copia qui sotto.`;
      daImportare = null;
    });

  function suRipristina(): void {
    if (!backup) return;
    ripristinaBackup(backup);
    confermaBackup = false;
    messaggio = "Tornati i dati di prima dell'ultima importazione.";
  }
</script>

<fieldset class="field exchange">
  <legend>Spostare i dati tra dispositivi</legend>
  <p class="muted">Esporta salva un file con tutte le attività, i ritmi e le regole. Su un altro dispositivo, Importa lo apre e sostituisce tutto. Stile, tema e filtro restano su ogni dispositivo.</p>
  <label class="field">
    <span>Nome di questo dispositivo</span>
    <input class="input" bind:this={campoNome} value={dispositivo.nome} placeholder="Tablet, Telefono, PC" maxlength="30" onchange={(e) => salvaDispositivo(e.currentTarget.value)} />
  </label>
  <div class="dialog-actions exchange-actions">
    <button type="button" class="ink-button" onclick={suEsporta} disabled={lavoro || archivio.fase !== "pronto"}>Esporta</button>
    <button type="button" class="text-button" onclick={suImporta} disabled={lavoro || archivio.fase !== "pronto"}>Importa…</button>
  </div>

  {#if daImportare}
    <div class="exchange-confirm" role="alertdialog" aria-labelledby="imp-titolo">
      <p id="imp-titolo"><strong>Sostituire tutti i dati?</strong></p>
      <ul class="plain-list">
        <li>File: {data(daImportare.esportato)}{daImportare.dispositivo ? `, da «${daImportare.dispositivo}»` : ""} · {daImportare.dati.attivita.length} attività</li>
        <li>Adesso qui: {data(archivio.dati.aggiornato)} · {archivio.dati.attivita.length} attività</li>
      </ul>
      <p class="muted">I dati di adesso restano in una copia: puoi tornarci con «Torna ai dati prima dell'ultima importazione».</p>
      <div class="dialog-actions">
        <button type="button" class="text-button" onclick={() => (daImportare = null)}>Annulla</button>
        <button type="button" class="ink-button" onclick={confermaImporta} disabled={lavoro}>Sostituisci</button>
      </div>
    </div>
  {/if}

  {#if backup}
    {#if confermaBackup}
      <div class="exchange-confirm" role="alertdialog" aria-labelledby="bk-titolo">
        <p id="bk-titolo"><strong>Tornare ai dati del {data(backup.aggiornato)}?</strong> ({backup.attivita.length} attività) Quelli di adesso si perdono.</p>
        <div class="dialog-actions">
          <button type="button" class="text-button" onclick={() => (confermaBackup = false)}>Annulla</button>
          <button type="button" class="ink-button" onclick={suRipristina}>Torna indietro</button>
        </div>
      </div>
    {:else}
      <button type="button" class="text-button exchange-back" onclick={() => (confermaBackup = true)}>Torna ai dati prima dell'ultima importazione</button>
    {/if}
  {/if}

  {#if errore}<p class="notice" role="alert">{errore}</p>{/if}
  {#if messaggio}<p class="muted" role="status">{messaggio}</p>{/if}
</fieldset>
