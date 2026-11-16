<script lang="ts">
  import { BATTERIE, AREE } from "../lib/energia";
  import { fasceDelGiorno, etichetta, ora, festivo, lunedi } from "../lib/fasce";

  const oggi = new Date();
  const inizio = lunedi(oggi);
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
</script>

<section class="week" aria-labelledby="week-title">
  <header class="pane-head">
    <h1 id="week-title">Settimana {titolo}</h1>
    <p class="week-empty">Ancora nessuna attività in questa settimana.</p>
  </header>

  <div class="week-grid">
    {#each giorni as giorno (giorno.toDateString())}
      {@const fasce = fasceDelGiorno(giorno)}
      <div class="day" class:today={stessoGiorno(giorno, oggi)} class:holiday={festivo(giorno)}>
        <h2 class="day-head">
          <span class="day-name">{nomeGiorno.format(giorno)}</span>
          <span class="day-date">{giorno.getDate()}</span>
          {#if stessoGiorno(giorno, oggi)}<span class="today-chip">oggi</span>{/if}
        </h2>
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
