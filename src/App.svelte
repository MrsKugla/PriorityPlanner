<script lang="ts">
  import Settimana from "./components/Settimana.svelte";
  import StileDialog from "./components/StileDialog.svelte";
  import Icona from "./components/Icona.svelte";
  import { aspetto, applica, STILI } from "./lib/aspetto.svelte";

  let stile: StileDialog;

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
    <div class="bar-actions">
      <button class="icon-button" type="button" onclick={cambiaTema} aria-label={aspetto.tema === "dark" ? "Passa al tema chiaro" : "Passa al tema scuro"} title={aspetto.tema === "dark" ? "Tema chiaro" : "Tema scuro"}>
        <Icona nome={aspetto.tema === "dark" ? "sole" : "luna"} />
      </button>
      <button class="style-select" type="button" onclick={() => stile.apri()} aria-haspopup="dialog">
        <Icona nome="stile" />
        <span>{STILI[aspetto.stile].nome}</span>
      </button>
    </div>
  </header>

  <main class="pane glass">
    <Settimana />
  </main>
</div>

<StileDialog bind:this={stile} />
