<script lang="ts">
  import Settimana from "./components/Settimana.svelte";
  import Oggi from "./components/Oggi.svelte";
  import TutteAttivita from "./components/TutteAttivita.svelte";
  import RitmoVista from "./components/RitmoVista.svelte";
  import AttivitaDialog from "./components/AttivitaDialog.svelte";
  import StileDialog from "./components/StileDialog.svelte";
  import Icona from "./components/Icona.svelte";
  import Aggiornamento from "./components/Aggiornamento.svelte";
  import { aspetto, applica, STILI } from "./lib/aspetto.svelte";
  import { controllaAggiornamenti } from "./lib/aggiornamento.svelte";
  import { apriSettimana, archivio, carica } from "./lib/dati.svelte";
  import { chiaveData, lunedi } from "./lib/fasce";
  import { vista } from "./lib/vista.svelte";

  carica().then(() => {
    if (archivio.fase === "pronto") vista.tornate = apriSettimana(chiaveData(lunedi(new Date())));
  });
  controllaAggiornamenti();

  let stile: StileDialog;
  let attivita: AttivitaDialog;

  function cambiaTema(): void {
    aspetto.tema = aspetto.tema === "dark" ? "light" : "dark";
    applica();
  }
</script>

<div class="light-field" aria-hidden="true"></div>

<div class="shell">
  <header class="bar glass">
    <div class="wordmark">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
      <span>Priority Planner</span>
      <small class="version">v{__APP_VERSION__}</small>
    </div>
    <nav class="seg nav" aria-label="Schermate">
      <label class="seg-item"><input type="radio" name="schermata" value="oggi" bind:group={vista.schermata} /><span>Oggi</span></label>
      <label class="seg-item"><input type="radio" name="schermata" value="settimana" bind:group={vista.schermata} /><span>Settimana</span></label>
      <label class="seg-item"><input type="radio" name="schermata" value="tutte" bind:group={vista.schermata} /><span>Tutte le attività</span></label>
      <label class="seg-item"><input type="radio" name="schermata" value="ritmo" bind:group={vista.schermata} /><span>Il mio ritmo</span></label>
    </nav>
    <div class="bar-actions">
      <Aggiornamento />
      <button class="ink-button new-task" type="button" onclick={() => attivita.apri()} disabled={archivio.fase !== "pronto"} aria-haspopup="dialog" title="Nuova attività">
        <Icona nome="piu" />
        <span>Nuova</span>
      </button>
      <button class="icon-button" type="button" onclick={cambiaTema} aria-label={aspetto.tema === "dark" ? "Passa al tema chiaro" : "Passa al tema scuro"} title={aspetto.tema === "dark" ? "Tema chiaro" : "Tema scuro"}>
        <Icona nome={aspetto.tema === "dark" ? "sole" : "luna"} />
      </button>
      <button class="style-select" type="button" onclick={() => stile.apri()} aria-haspopup="dialog">
        <Icona nome="stile" />
        <span>{STILI[aspetto.stile].nome}</span>
      </button>
    </div>
  </header>

  {#if archivio.errore}
    <p class="notice" role="alert">
      {archivio.fase === "errore" ? "Non riesco a leggere i dati salvati, quindi non li modifico." : ""}
      {archivio.errore}
    </p>
  {/if}

  <main class="pane glass">
    {#if vista.schermata === "oggi"}
      <Oggi />
    {:else if vista.schermata === "ritmo"}
      <RitmoVista />
    {:else if vista.schermata === "tutte"}
      <TutteAttivita onApri={(a) => attivita.apri(a)} />
    {:else}
      <Settimana onApri={(a) => attivita.apri(a)} />
    {/if}
  </main>
</div>

<AttivitaDialog bind:this={attivita} />
<StileDialog bind:this={stile} />
