<script lang="ts">
  import { BATTERIE, AREE } from "../lib/energia";
  import { aggiungiFesta, archivio, eliminaFesta, ritmoDellaSettimana, scegliRitmo } from "../lib/dati.svelte";
  import { passaFiltro, vista } from "../lib/vista.svelte";
  import { chiaveData, etichetta, fasceDelGiorno, festaDelGiorno, festivo, indiceSettimana, lunedi, ora } from "../lib/fasce";

  const oggi = new Date();
  const inizio = lunedi(oggi);
  const chiaveSettimana = chiaveData(inizio);
  const giorni = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inizio);
    d.setDate(inizio.getDate() + i);
    return d;
  });

  const nomeGiorno = new Intl.DateTimeFormat("it-IT", { weekday: "short" });
  const nomeMese = new Intl.DateTimeFormat("it-IT", { month: "long" });
  const stessoGiorno = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const fine = giorni[6];
  const titolo =
    inizio.getMonth() === fine.getMonth()
      ? `${inizio.getDate()}–${fine.getDate()} ${nomeMese.format(fine)}`
      : `${inizio.getDate()} ${nomeMese.format(inizio)} – ${fine.getDate()} ${nomeMese.format(fine)}`;

  const daPianificare = $derived(archivio.dati.attivita.filter((a) => a.stato === "da-pianificare" && passaFiltro(a, vista.filtro)).length);
  const ritmo = $derived(ritmoDellaSettimana(chiaveSettimana));

  /* 🎉 su un giorno feriale: aggiunge o toglie una festa di un solo giorno. Un giorno dentro un intervallo più lungo si cambia in «Feste e ferie». */
  function cambiaFesta(giorno: Date): void {
    const k = chiaveData(giorno);
    const festa = festaDelGiorno(giorno, archivio.dati);
    if (!festa) aggiungiFesta(k, k, "");
    else if (festa.dal === festa.al) eliminaFesta(festa.id);
  }
</script>

<section class="week" aria-labelledby="week-title">
  <header class="pane-head">
    <h1 id="week-title">Settimana {titolo}</h1>
    <div class="head-tools">
      <label class="field-inline">
        <span class="muted">Ritmo</span>
        <select class="input" value={ritmo.id} onchange={(e) => scegliRitmo(chiaveSettimana, e.currentTarget.value)}>
          {#each archivio.dati.ritmi as r (r.id)}<option value={r.id}>{r.nome}</option>{/each}
        </select>
      </label>
      <p class="week-empty">
        {#if daPianificare}
          <button type="button" class="link-button" onclick={() => (vista.schermata = "tutte")}>{daPianificare} da pianificare</button>
        {:else}
          Ancora nessuna attività in questa settimana.
        {/if}
      </p>
    </div>
  </header>

  <div class="week-grid">
    {#each giorni as giorno (giorno.toDateString())}
      {@const fasce = fasceDelGiorno(giorno, archivio.dati)}
      {@const festa = festaDelGiorno(giorno, archivio.dati)}
      <div class="day" class:today={stessoGiorno(giorno, oggi)} class:holiday={festivo(giorno, archivio.dati)}>
        <h2 class="day-head">
          <span class="day-name">{nomeGiorno.format(giorno)}</span>
          <span class="day-date">{giorno.getDate()}</span>
          {#if stessoGiorno(giorno, oggi)}<span class="today-chip">oggi</span>{/if}
          {#if indiceSettimana(giorno) < 5}
            <button
              type="button"
              class="party"
              class:on={!!festa}
              onclick={() => cambiaFesta(giorno)}
              disabled={!!festa && festa.dal !== festa.al}
              aria-pressed={!!festa}
              title={festa ? (festa.dal !== festa.al ? `Fa parte di «${festa.nome || "Ferie"}»: cambiala in Il mio ritmo › Feste e ferie` : "Torna giorno feriale") : "Segna come festivo"}
            >🎉</button>
          {/if}
        </h2>
        {#if festa?.nome}<p class="day-note">{festa.nome}</p>{/if}
        <ol class="slots">
          {#each fasce as fascia, i (fascia.inizio)}
            {#if i > 0 && fascia.inizio !== fasce[i - 1].fine}
              <li class="pause" aria-label="Pausa">pausa {ora(fasce[i - 1].fine)}–{ora(fascia.inizio)}</li>
            {/if}
            <li class="slot" style:--span={Math.max(1, (fascia.fine - fascia.inizio) / 60)}>
              <span class="slot-time">{etichetta(fascia)}</span>
            </li>
          {/each}
        </ol>
      </div>
    {/each}
  </div>

  <footer class="legend" aria-label="Legenda">
    {#each BATTERIE as b (b.id)}<span><span class="legend-icon" style:--tone={b.colore}>{b.icona}</span>{b.nome}</span>{/each}
    <span class="legend-sep" aria-hidden="true"></span>
    {#each AREE as a (a.id)}<span><span class="legend-icon" style:--tone={a.colore}>{a.icona}</span>{a.nome}</span>{/each}
  </footer>
</section>
