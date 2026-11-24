<script lang="ts">
  /* «Tutte le attività» (C1): elenco completo con stato, scadenza, ricerca e filtro (C3). */
  import { AREE, BATTERIE } from "../lib/energia";
  import { archivio, segnaFatta, type Attivita, type StatoAttivita } from "../lib/dati.svelte";
  import { formatoDurata, passaFiltro, vista } from "../lib/vista.svelte";
  import Icona from "./Icona.svelte";
  import FiltroAree from "./FiltroAree.svelte";

  let { onApri }: { onApri: (a: Attivita | null) => void } = $props();

  const STATI: Record<StatoAttivita, string> = {
    "da-pianificare": "Da pianificare",
    "in-settimana": "In settimana",
    "non-ci-sta": "Non ci sta",
    fatta: "Fatta",
  };
  const areaDi = (id: string) => AREE.find((a) => a.id === id)!;
  const giorno = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" });

  let ricerca = $state("");
  let ordine = $state<"scadenza" | "titolo" | "recenti">("scadenza");

  /* Senza scadenza in fondo; le fatte sempre dopo le aperte. */
  const elenco = $derived.by(() => {
    const testo = ricerca.trim().toLowerCase();
    return archivio.dati.attivita
      .filter((a) => passaFiltro(a, vista.filtro) && (!testo || a.titolo.toLowerCase().includes(testo)))
      .sort((a, b) => {
        const fatte = Number(a.stato === "fatta") - Number(b.stato === "fatta");
        if (fatte) return fatte;
        if (ordine === "titolo") return a.titolo.localeCompare(b.titolo, "it");
        if (ordine === "recenti") return b.creata.localeCompare(a.creata);
        return (a.scadenza ?? "9999").localeCompare(b.scadenza ?? "9999") || a.titolo.localeCompare(b.titolo, "it");
      });
  });
  const aperte = $derived(archivio.dati.attivita.filter((a) => a.stato !== "fatta").length);
  const nascoste = $derived(archivio.dati.attivita.length - archivio.dati.attivita.filter((a) => passaFiltro(a, vista.filtro)).length);
  const adesso = new Date();
  const oggi = `${adesso.getFullYear()}-${String(adesso.getMonth() + 1).padStart(2, "0")}-${String(adesso.getDate()).padStart(2, "0")}`;
</script>

<section class="week" aria-labelledby="tutte-titolo">
  <header class="pane-head">
    <h1 id="tutte-titolo">Tutte le attività</h1>
    <p class="week-empty">
      {aperte} {aperte === 1 ? "aperta" : "aperte"}{nascoste ? ` · ${nascoste} nascoste dal filtro` : ""}
    </p>
  </header>

  <div class="list-tools">
    <label class="search">
      <Icona nome="cerca" />
      <span class="visually-hidden">Cerca per titolo</span>
      <input class="input" type="search" bind:value={ricerca} placeholder="Cerca" />
    </label>
    <label class="field-inline">
      <span class="muted">Ordina</span>
      <select class="input" bind:value={ordine}>
        <option value="scadenza">per scadenza</option>
        <option value="titolo">per titolo</option>
        <option value="recenti">più recenti</option>
      </select>
    </label>
    <FiltroAree />
  </div>

  {#if archivio.dati.attivita.length === 0}
    <div class="empty">
      <p>Nessuna attività ancora.</p>
      <button type="button" class="ink-button" onclick={() => onApri(null)}>Crea la prima attività</button>
    </div>
  {:else if elenco.length === 0}
    <div class="empty"><p>Nessuna attività con questo filtro o questa ricerca.</p></div>
  {:else}
    <ul class="task-list">
      {#each elenco as a (a.id)}
        {@const ar = areaDi(a.area)}
        <li class="task-row" class:done={a.stato === "fatta"} style:--tone={ar.colore}>
          <label class="task-check" title={a.stato === "fatta" ? "Segna da fare" : "Segna fatta"}>
            <input type="checkbox" checked={a.stato === "fatta"} onchange={(e) => segnaFatta(a.id, e.currentTarget.checked)} aria-label="Fatta: {a.titolo}" />
          </label>
          <button type="button" class="task-open" onclick={() => onApri(a)}>
            <span class="task-area" title={ar.nome} aria-label={ar.nome}>{ar.icona}</span>
            <span class="task-title">{a.titolo}</span>
            <span class="task-costs">
              {#each BATTERIE as b (b.id)}
                {#if a.costi[b.id]}
                  <span class="task-cost" title="{b.nome}: {a.costi[b.id]}" aria-label="{b.nome} {a.costi[b.id]}">{b.icona}<i aria-hidden="true">{"●".repeat(a.costi[b.id])}</i></span>
                {/if}
              {/each}
            </span>
            <span class="task-meta">{formatoDurata(a.durata)}</span>
            <span class="task-meta task-due" class:late={a.scadenza && a.scadenza < oggi && a.stato !== "fatta"}>
              {a.scadenza ? `entro ${giorno.format(new Date(a.scadenza + "T12:00"))}` : ""}
            </span>
            <span class="task-state" data-stato={a.stato}>{STATI[a.stato]}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>
