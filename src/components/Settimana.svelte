<script lang="ts">
  /* Vista Settimana (B4, B7, B8, C1): «Proponi settimana», carte proposte (tratteggiate) e bloccate (🔒),
     «Da pianificare» e «Non ci sta». Tocca una carta per sceglierla, poi un comando o una fascia dove spostarla. */
  import { BATTERIE, AREE } from "../lib/energia";
  import {
    aggiungiFesta, archivio, bloccaTutte, cambiaBlocco, eliminaFesta, minutiDi, proponiSettimana, ritmoDellaSettimana,
    scegliRitmo, segnaFatta, sposta, togliDallaSettimana, type Attivita,
  } from "../lib/dati.svelte";
  import { formatoDurata, passaFiltro, vista } from "../lib/vista.svelte";
  import {
    chiaveData, etichetta, fasceDelGiorno, festaDelGiorno, festivo, giorniDellaSettimana, indiceSettimana, lunedi, ora, type Fascia,
  } from "../lib/fasce";

  let { onApri }: { onApri: (a: Attivita) => void } = $props();

  const oggi = new Date();
  const inizio = lunedi(oggi);
  const chiaveSettimana = chiaveData(inizio);
  const giorni = giorniDellaSettimana(inizio);
  const chiavi = giorni.map(chiaveData);
  const daGiorno = indiceSettimana(oggi);

  const nomeGiorno = new Intl.DateTimeFormat("it-IT", { weekday: "short" });
  const nomeMese = new Intl.DateTimeFormat("it-IT", { month: "long" });
  const fine = giorni[6];
  const titolo =
    inizio.getMonth() === fine.getMonth()
      ? `${inizio.getDate()}–${fine.getDate()} ${nomeMese.format(fine)}`
      : `${inizio.getDate()} ${nomeMese.format(inizio)} – ${fine.getDate()} ${nomeMese.format(fine)}`;
  const areaDi = (id: string) => AREE.find((a) => a.id === id)!;
  const orario = (a: Attivita) => (a.posto ? `${ora(a.posto.inizio)}–${ora(a.posto.fine)}` : "");

  const ritmo = $derived(ritmoDellaSettimana(chiaveSettimana));
  const inSettimana = $derived(archivio.dati.attivita.filter((a) => a.posto && chiavi.includes(a.posto.data)));
  const daPianificare = $derived(archivio.dati.attivita.filter((a) => a.stato === "da-pianificare" && passaFiltro(a, vista.filtro)));
  const nonCiSta = $derived(archivio.dati.attivita.filter((a) => a.stato === "non-ci-sta" && passaFiltro(a, vista.filtro)));
  const proposte = $derived(inSettimana.filter((a) => !a.posto!.bloccato && a.stato !== "fatta").length);

  let scelta = $state<string | null>(null);
  let esito = $state("");
  const attivitaScelta = $derived(archivio.dati.attivita.find((a) => a.id === scelta) ?? null);

  /* Carte che cominciano in una fascia, e attività lunghe che la attraversano («↳»). */
  function nellaFascia(chiave: string, f: Fascia) {
    const qui = inSettimana.filter((a) => a.posto!.data === chiave && a.posto!.inizio < f.fine && a.posto!.fine > f.inizio);
    return qui
      .map((a) => ({ a, inizia: a.posto!.inizio >= f.inizio, nascosta: !passaFiltro(a, vista.filtro) }))
      .sort((x, y) => x.a.posto!.inizio - y.a.posto!.inizio);
  }

  function proponi(): void {
    const fuori = proponiSettimana(giorni, daGiorno, ritmo, minutiDi(new Date()));
    scelta = null;
    esito = fuori ? `${fuori} non ci ${fuori === 1 ? "sta" : "stanno"}: il motivo è in «Non ci sta».` : "Tutto pianificato.";
  }

  function scegli(id: string): void {
    scelta = scelta === id ? null : id;
  }

  function mettiQui(chiave: string, f: Fascia): void {
    if (!scelta) return;
    sposta(scelta, chiave, f.inizio);
    scelta = null;
  }

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
      {#if proposte}
        <button type="button" class="text-button" onclick={() => bloccaTutte(chiavi)}>Accetta tutte ({proposte})</button>
      {/if}
      <button type="button" class="ink-button" onclick={proponi} disabled={archivio.fase !== "pronto"}>Proponi settimana</button>
    </div>
  </header>

  {#if attivitaScelta}
    <div class="pick-bar" role="toolbar" aria-label="Attività scelta">
      <span class="pick-title">{areaDi(attivitaScelta.area).icona} {attivitaScelta.titolo}</span>
      <span class="muted">Tocca una fascia per metterla lì.</span>
      {#if attivitaScelta.posto}
        <button type="button" class="text-button" onclick={() => cambiaBlocco(attivitaScelta.id)}>{attivitaScelta.posto.bloccato ? "🔓 Sblocca" : "🔒 Blocca"}</button>
        <button type="button" class="text-button" onclick={() => { togliDallaSettimana(attivitaScelta.id); scelta = null; }}>Togli</button>
        <button type="button" class="text-button" onclick={() => segnaFatta(attivitaScelta.id, attivitaScelta.stato !== "fatta")}>{attivitaScelta.stato === "fatta" ? "Da fare" : "Fatta"}</button>
      {/if}
      <button type="button" class="text-button" onclick={() => onApri(attivitaScelta)}>Modifica</button>
      <button type="button" class="text-button" onclick={() => (scelta = null)}>Chiudi</button>
    </div>
  {:else if esito || vista.tornate}
    <p class="week-note" role="status">
      {#if vista.tornate}{vista.tornate} {vista.tornate === 1 ? "attività è tornata" : "attività sono tornate"} dalla settimana scorsa. {/if}{esito}
    </p>
  {/if}

  <div class="week-body">
    <aside class="tray" aria-label="Attività fuori dalla settimana">
      <h2>Da pianificare <span class="muted">{daPianificare.length}</span></h2>
      <ul>
        {#each daPianificare as a (a.id)}
          <li>
            <button type="button" class="tray-card" class:picked={scelta === a.id} onclick={() => scegli(a.id)} style:--tone={areaDi(a.area).colore}>
              <span aria-hidden="true">{areaDi(a.area).icona}</span>
              <span class="grow">{a.titolo}</span>
              <span class="muted">{formatoDurata(a.durata)}</span>
            </button>
          </li>
        {:else}
          <li class="muted tray-empty">Niente da pianificare.</li>
        {/each}
      </ul>
      {#if nonCiSta.length}
        <h2>Non ci sta <span class="muted">{nonCiSta.length}</span></h2>
        <ul>
          {#each nonCiSta as a (a.id)}
            <li>
              <button type="button" class="tray-card" class:picked={scelta === a.id} onclick={() => scegli(a.id)} style:--tone={areaDi(a.area).colore}>
                <span aria-hidden="true">{areaDi(a.area).icona}</span>
                <span class="grow">{a.titolo}<small>{a.motivo}</small></span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </aside>

    <div class="week-grid" class:placing={!!scelta}>
      {#each giorni as giorno, gi (chiavi[gi])}
        {@const fasce = fasceDelGiorno(giorno, archivio.dati)}
        {@const festa = festaDelGiorno(giorno, archivio.dati)}
        <div class="day" class:today={gi === daGiorno} class:past={gi < daGiorno} class:holiday={festivo(giorno, archivio.dati)}>
          <h2 class="day-head">
            <span class="day-name">{nomeGiorno.format(giorno)}</span>
            <span class="day-date">{giorno.getDate()}</span>
            {#if gi === daGiorno}<span class="today-chip">oggi</span>{/if}
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
              {@const voci = nellaFascia(chiavi[gi], fascia)}
              {#if i > 0 && fascia.inizio !== fasce[i - 1].fine}
                <li class="pause" aria-label="Pausa">pausa {ora(fasce[i - 1].fine)}–{ora(fascia.inizio)}</li>
              {/if}
              <li class="slot" class:has-cards={voci.length > 0} style:--span={Math.max(1, (fascia.fine - fascia.inizio) / 60)}>
                {#if scelta}
                  <button type="button" class="slot-drop" onclick={() => mettiQui(chiavi[gi], fascia)} aria-label="Metti {attivitaScelta?.titolo} {nomeGiorno.format(giorno)} {etichetta(fascia)}"></button>
                {/if}
                <span class="slot-time">{etichetta(fascia)}</span>
                {#each voci as { a, inizia, nascosta } (a.id)}
                  {#if nascosta}
                    <span class="hidden-mark" title="Occupata da un'attività nascosta dal filtro"></span>
                  {:else if inizia}
                    <button
                      type="button"
                      class="card"
                      class:proposed={!a.posto!.bloccato}
                      class:done={a.stato === "fatta"}
                      class:picked={scelta === a.id}
                      style:--tone={areaDi(a.area).colore}
                      onclick={() => scegli(a.id)}
                      aria-label="{a.titolo}, {orario(a)}, {a.posto!.bloccato ? 'bloccata' : 'proposta'}{a.stato === 'fatta' ? ', fatta' : ''}"
                    >
                      <span class="card-top">
                        <span class="card-area" aria-hidden="true">{areaDi(a.area).icona}</span>
                        <span class="card-title">{a.titolo}</span>
                        {#if a.posto!.bloccato}<span class="card-lock" aria-hidden="true">🔒</span>{/if}
                      </span>
                      <span class="card-why">{orario(a)} · {a.posto!.perche}</span>
                    </button>
                  {:else}
                    <span class="card-cont">↳ {a.titolo}</span>
                  {/if}
                {/each}
              </li>
            {/each}
          </ol>
        </div>
      {/each}
    </div>
  </div>

  <footer class="legend" aria-label="Legenda">
    {#each BATTERIE as b (b.id)}<span><span class="legend-icon" style:--tone={b.colore}>{b.icona}</span>{b.nome}</span>{/each}
    <span class="legend-sep" aria-hidden="true"></span>
    {#each AREE as a (a.id)}<span><span class="legend-icon" style:--tone={a.colore}>{a.icona}</span>{a.nome}</span>{/each}
  </footer>
</section>
