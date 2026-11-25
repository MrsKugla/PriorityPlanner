<script lang="ts">
  /* «Tutte le attività» (C1): elenco completo con stato, scadenza, ricerca e filtro (C3).
     Fase 6: in cima il gruppo «Si ripetono» (una riga per serie); le singole volte compaiono solo se da pianificare o non ci stanno. */
  import { AREE, BATTERIE } from "../lib/energia";
  import { archivio, segnaFatta, serieDi, type Attivita, type Serie, type StatoAttivita } from "../lib/dati.svelte";
  import { formatoDurata, passaFiltro, vista } from "../lib/vista.svelte";
  import Icona from "./Icona.svelte";
  import FiltroAree from "./FiltroAree.svelte";
  import GiorniSerie from "./GiorniSerie.svelte";

  let { onApri, onApriSerie }: { onApri: (a: Attivita | null) => void; onApriSerie: (s: Serie) => void } = $props();

  const STATI: Record<StatoAttivita, string> = {
    "da-pianificare": "Da pianificare",
    "in-settimana": "In settimana",
    "non-ci-sta": "Non ci sta",
    fatta: "Fatta",
    saltata: "Saltata",
  };
  const areaDi = (id: string) => AREE.find((a) => a.id === id)!;
  const giorno = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" });

  let ricerca = $state("");
  let ordine = $state<"scadenza" | "titolo" | "recenti">("scadenza");

  /* Le singole volte di una serie stanno qui solo se aspettano di essere messe (da pianificare o non ci stanno). */
  const inElenco = (a: Attivita): boolean => !serieDi(a) || a.stato === "da-pianificare" || a.stato === "non-ci-sta";
  const passaServie = (s: Serie): boolean => (vista.filtro === "tutte" ? true : vista.filtro === "lavoro" ? s.area === "lavoro" : s.area !== "lavoro");
  const corrisponde = (titolo: string): boolean => {
    const testo = ricerca.trim().toLowerCase();
    return !testo || titolo.toLowerCase().includes(testo);
  };

  /* Senza scadenza in fondo; le fatte sempre dopo le aperte. */
  const elenco = $derived.by(() =>
    archivio.dati.attivita
      .filter((a) => inElenco(a) && passaFiltro(a, vista.filtro) && corrisponde(a.titolo))
      .sort((a, b) => {
        const fatte = Number(a.stato === "fatta") - Number(b.stato === "fatta");
        if (fatte) return fatte;
        if (ordine === "titolo") return a.titolo.localeCompare(b.titolo, "it");
        if (ordine === "recenti") return b.creata.localeCompare(a.creata);
        return (a.scadenza ?? "9999").localeCompare(b.scadenza ?? "9999") || a.titolo.localeCompare(b.titolo, "it");
      }),
  );
  const serie = $derived(
    archivio.dati.serie.filter((s) => passaServie(s) && corrisponde(s.titolo)).sort((a, b) => a.titolo.localeCompare(b.titolo, "it")),
  );
  const visibili = $derived(archivio.dati.attivita.filter(inElenco));
  const aperte = $derived(visibili.filter((a) => a.stato !== "fatta").length);
  const nascoste = $derived(visibili.length - visibili.filter((a) => passaFiltro(a, vista.filtro)).length);
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

  {#if archivio.dati.attivita.length === 0 && archivio.dati.serie.length === 0}
    <div class="empty">
      <p>Nessuna attività ancora.</p>
      <button type="button" class="ink-button" onclick={() => onApri(null)}>Crea la prima attività</button>
    </div>
  {:else if elenco.length === 0 && serie.length === 0}
    <div class="empty"><p>Nessuna attività con questo filtro o questa ricerca.</p></div>
  {:else}
    <ul class="task-list">
      {#if serie.length}
        <li class="group-head" aria-hidden="true">Si ripetono</li>
        {#each serie as s (s.id)}
          {@const ar = areaDi(s.area)}
          <li class="task-row serie-row" class:paused={s.inPausa} style:--tone={ar.colore}>
            <button type="button" class="task-open serie-open" onclick={() => onApriSerie(s)}>
              <span class="task-area" title={ar.nome} aria-label={ar.nome}>{ar.icona}</span>
              <span class="task-title"><span class="ripete" aria-hidden="true">↻</span> {s.titolo}</span>
              <GiorniSerie serie={s} tone={ar.colore} piccola />
              {#if s.inPausa}<span class="task-state">in pausa</span>{/if}
            </button>
          </li>
        {/each}
      {/if}
      {#if serie.length && elenco.length}<li class="group-head" aria-hidden="true">Attività</li>{/if}
      {#each elenco as a (a.id)}
        {@const ar = areaDi(a.area)}
        <li class="task-row" class:done={a.stato === "fatta"} style:--tone={ar.colore}>
          <label class="task-check" title={a.stato === "fatta" ? "Segna da fare" : "Segna fatta"}>
            <input type="checkbox" checked={a.stato === "fatta"} onchange={(e) => segnaFatta(a.id, e.currentTarget.checked)} aria-label="Fatta: {a.titolo}" />
          </label>
          <button type="button" class="task-open" onclick={() => onApri(a)}>
            <span class="task-area" title={ar.nome} aria-label={ar.nome}>{ar.icona}</span>
            <span class="task-title">{#if serieDi(a)}<span class="ripete" role="img" aria-label="Si ripete">↻</span> {/if}{a.titolo}</span>
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
