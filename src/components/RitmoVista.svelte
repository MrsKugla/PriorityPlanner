<script lang="ts">
  /* «Il mio ritmo» (B1, B2, B3, B6): livelli col pennello, feste e ferie, fasce orarie. */
  import { BATTERIE } from "../lib/energia";
  import {
    aggiungiFesta, archivio, salvaRegole, copiaLunedi, copiaRitmo, eliminaFesta, eliminaRitmo, ripristinaFasce,
    ritmoDellaSettimana, salva, salvaFasce, type BatteriaId,
  } from "../lib/dati.svelte";
  import { chiaveData, etichetta, fasceDellaColonna, leggiFasce, lunedi, totaleAuto, type Fascia } from "../lib/fasce";

  const COLONNE = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
  const NOTE_COLONNE = ["", "", "", "", "", "anche le feste seguite da un festivo", "anche le feste seguite da un feriale"];

  let scheda = $state<"livelli" | "feste" | "fasce" | "regole">("livelli");
  let ritmoId = $state(ritmoDellaSettimana(chiaveData(lunedi(new Date()))).id);
  let batteria = $state<BatteriaId>("mentale");
  let pennello = $state(3);
  let confermaElimina = $state(false);

  const ritmo = $derived(archivio.dati.ritmi.find((r) => r.id === ritmoId) ?? archivio.dati.ritmi[0]);
  const coloreBatteria = $derived(BATTERIE.find((b) => b.id === batteria)!.colore);

  /* ---------- Pennello: tocco o trascinamento sulle caselle ---------- */
  let dipingo = false;
  function dipingi(el: Element | null): void {
    const cella = el?.closest<HTMLElement>("[data-cella]");
    if (!cella) return;
    const c = Number(cella.dataset.c);
    const i = Number(cella.dataset.i);
    if (ritmo.livelli[c][i][batteria] === pennello) return;
    ritmo.livelli[c][i][batteria] = pennello;
    salva();
  }
  function inizia(e: PointerEvent): void {
    if (!(e.target as Element).closest("[data-cella]")) return;
    dipingo = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dipingi(e.target as Element);
  }
  function muovi(e: PointerEvent): void {
    if (dipingo) dipingi(document.elementFromPoint(e.clientX, e.clientY));
  }
  const ferma = () => (dipingo = false);

  function nuovoRitmo(): void {
    ritmoId = copiaRitmo(ritmo, `${ritmo.nome} (copia)`).id;
  }
  function elimina(): void {
    if (!confermaElimina) return void (confermaElimina = true);
    eliminaRitmo(ritmo.id);
    ritmoId = archivio.dati.ritmi[0].id;
    confermaElimina = false;
  }

  function cambiaTotale(c: number, valore: string): void {
    const n = Number(valore);
    if (valore === "" || !Number.isFinite(n)) delete ritmo.totali[c][batteria];
    else ritmo.totali[c][batteria] = Math.max(0, Math.round(n));
    salva();
  }

  /* ---------- Feste e ferie ---------- */
  let festaDal = $state("");
  let festaAl = $state("");
  let festaNome = $state("");
  const giornoLungo = new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const mostraData = (k: string) => giornoLungo.format(new Date(`${k}T12:00`));
  function nuovaFesta(e: SubmitEvent): void {
    e.preventDefault();
    aggiungiFesta(festaDal, festaAl || festaDal, festaNome);
    festaDal = festaAl = festaNome = "";
  }

  /* ---------- Fasce orarie ---------- */
  type Riga = { inizio: string; fine: string };
  const hhmm = (m: number) => `${String(Math.floor((m % 1440) / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const righe = (l: readonly Fascia[]): Riga[] => l.map((f) => ({ inizio: hhmm(f.inizio), fine: hhmm(f.fine) }));
  let feriali = $state<Riga[]>([]);
  let festive = $state<Riga[]>([]);
  let erroreFasce = $state("");
  let fasceSalvate = $state(false);
  function apriFasce(): void {
    feriali = righe(archivio.dati.fasce.feriali);
    festive = righe(archivio.dati.fasce.festive);
    erroreFasce = "";
    fasceSalvate = false;
  }
  function salvaLeFasce(): void {
    const fe = leggiFasce(feriali);
    const fs = leggiFasce(festive);
    if ("errore" in fe) return void (erroreFasce = `Feriali, ${fe.errore}`);
    if ("errore" in fs) return void (erroreFasce = `Festive, ${fs.errore}`);
    salvaFasce(fe.fasce, fs.fasce);
    apriFasce();
    fasceSalvate = true;
  }
  function ripristina(): void {
    ripristinaFasce();
    apriFasce();
    fasceSalvate = true;
  }
</script>

<section class="week" aria-labelledby="ritmo-titolo">
  <header class="pane-head">
    <h1 id="ritmo-titolo">Il mio ritmo</h1>
    <div class="seg" role="tablist" aria-label="Sezioni">
      <label class="seg-item"><input type="radio" name="scheda" value="livelli" bind:group={scheda} /><span>Livelli</span></label>
      <label class="seg-item"><input type="radio" name="scheda" value="feste" bind:group={scheda} /><span>Feste e ferie</span></label>
      <label class="seg-item"><input type="radio" name="scheda" value="fasce" bind:group={scheda} onchange={apriFasce} /><span>Fasce orarie</span></label>
      <label class="seg-item"><input type="radio" name="scheda" value="regole" bind:group={scheda} /><span>Regole</span></label>
    </div>
  </header>

  {#if scheda === "livelli"}
    <div class="list-tools">
      <label class="field-inline">
        <span class="muted">Ritmo</span>
        <select class="input" bind:value={ritmoId} onchange={() => (confermaElimina = false)}>
          {#each archivio.dati.ritmi as r (r.id)}<option value={r.id}>{r.nome}</option>{/each}
        </select>
      </label>
      <label class="field-inline">
        <span class="visually-hidden">Nome del ritmo</span>
        <input class="input rhythm-name" bind:value={ritmo.nome} onchange={salva} maxlength="40" aria-label="Nome del ritmo" />
      </label>
      <button type="button" class="text-button" onclick={nuovoRitmo}>Nuovo da copia</button>
      {#if archivio.dati.ritmi.length > 1}
        <button type="button" class="text-button danger" onclick={elimina}>{confermaElimina ? "Conferma eliminazione" : "Elimina"}</button>
      {/if}
    </div>

    <div class="list-tools brush-tools">
      <div class="pick-row" role="radiogroup" aria-label="Batteria da colorare">
        {#each BATTERIE as b (b.id)}
          <label class="pick" title={b.nome} style:--tone={b.colore}>
            <input type="radio" name="batteria" value={b.id} bind:group={batteria} aria-label={b.nome} />
            <span aria-hidden="true">{b.icona}</span>
          </label>
        {/each}
      </div>
      <div class="pick-row brush" role="radiogroup" aria-label="Livello del pennello" style:--tone={coloreBatteria}>
        {#each [0, 1, 2, 3] as n (n)}
          <label class="dot-pick" title="Livello {n}">
            <input type="radio" name="pennello" value={n} bind:group={pennello} aria-label="Livello {n}" />
            <span class="swatch" style:--lv={n} aria-hidden="true">{n}</span>
          </label>
        {/each}
      </div>
      <button type="button" class="text-button" onclick={() => copiaLunedi(ritmo)}>Copia lunedì su mar–ven</button>
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="rhythm-grid" style:--tone={coloreBatteria} onpointerdown={inizia} onpointermove={muovi} onpointerup={ferma} onpointercancel={ferma}>
      {#each COLONNE as nome, c (nome)}
        {@const fasce = fasceDellaColonna(c, archivio.dati)}
        {@const visibili = fasce.map((_, i) => ritmo.livelli[c][i][batteria])}
        {@const auto = totaleAuto(visibili)}
        <div class="rhythm-col" class:holiday={c >= 5}>
          <h2 class="day-head" title={NOTE_COLONNE[c]}><span class="day-date">{nome}</span></h2>
          {#each fasce as fascia, i (fascia.inizio)}
            {@const lv = ritmo.livelli[c][i][batteria]}
            <button
              type="button"
              class="rhythm-cell"
              data-cella
              data-c={c}
              data-i={i}
              style:--lv={lv}
              aria-label="{nome} {etichetta(fascia)}: livello {lv}"
              onclick={(e) => e.detail === 0 && dipingi(e.currentTarget)}
            >
              <span class="slot-time">{etichetta(fascia)}</span>
              <b>{lv}</b>
            </button>
          {/each}
          <label class="rhythm-total" title="Totale del giorno: vuoto = automatico (40% delle fasce)">
            <span class="muted">Totale</span>
            <input
              class="input input-num"
              type="number"
              min="0"
              max="99"
              value={ritmo.totali[c][batteria] ?? ""}
              placeholder={String(auto)}
              onchange={(e) => cambiaTotale(c, e.currentTarget.value)}
            />
          </label>
        </div>
      {/each}
    </div>
    <p class="rhythm-hint">Scegli una batteria e un livello, poi tocca o trascina sulle caselle. Il totale vuoto vale il 40% della colonna; scrivi un numero per cambiarlo. Una festa in settimana usa la colonna Sab se il giorno dopo è festivo, altrimenti Dom.</p>
  {:else if scheda === "feste"}
    <div class="settings">
      <form class="field-row" onsubmit={nuovaFesta}>
        <label class="field"><span>Dal</span><input class="input" type="date" bind:value={festaDal} required /></label>
        <label class="field"><span>Al (facoltativo)</span><input class="input" type="date" bind:value={festaAl} min={festaDal} /></label>
        <label class="field grow"><span>Nome (facoltativo)</span><input class="input" bind:value={festaNome} placeholder="Es. Ferie di Natale" maxlength="40" /></label>
        <button type="submit" class="ink-button add-btn">Aggiungi</button>
      </form>
      {#if archivio.dati.feste.length}
        <ul class="plain-list">
          {#each archivio.dati.feste as f (f.id)}
            <li>
              <span>🎉 {mostraData(f.dal)}{f.al !== f.dal ? ` → ${mostraData(f.al)}` : ""}</span>
              <span class="muted grow">{f.nome}</span>
              <button type="button" class="text-button danger" onclick={() => eliminaFesta(f.id)} aria-label="Elimina {f.nome || mostraData(f.dal)}">Elimina</button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="muted">Nessuna festa o ferie segnata. Sabato e domenica sono sempre festivi.</p>
      {/if}
    </div>
  {:else if scheda === "regole"}
    <div class="settings">
      <fieldset class="field">
        <legend>Cuscinetto dopo un'attività con un costo 3</legend>
        <div class="seg" role="radiogroup" aria-label="Cuscinetto">
          {#each [0, 15, 30] as m (m)}
            <label class="seg-item">
              <input type="radio" name="cuscinetto" value={m} checked={archivio.dati.regole.cuscinetto === m} onchange={() => salvaRegole({ ...archivio.dati.regole, cuscinetto: m })} />
              <span>{m ? `${m} min` : "Nessuno"}</span>
            </label>
          {/each}
        </div>
      </fieldset>
      <label class="field">
        <span>Massimo di attività pesanti ❤️‍🩹 o 💬 (costo 3) al giorno</span>
        <input class="input input-num" type="number" min="0" max="9" value={archivio.dati.regole.maxPesanti} onchange={(e) => salvaRegole({ ...archivio.dati.regole, maxPesanti: Math.max(0, Math.min(9, Math.round(Number(e.currentTarget.value) || 0))) })} />
      </label>
      <p class="muted">Le regole valgono dalla prossima volta che premi «Proponi settimana».</p>
    </div>
  {:else}
    <div class="settings">
      <div class="slot-editors">
        {#each [{ titolo: "Giorni feriali", lista: feriali }, { titolo: "Giorni festivi", lista: festive }] as gruppo (gruppo.titolo)}
          <fieldset class="field slot-editor">
            <legend>{gruppo.titolo}</legend>
            {#each gruppo.lista as r, i (i)}
              <div class="slot-edit">
                <input class="input" type="time" bind:value={r.inizio} aria-label="{gruppo.titolo}, fascia {i + 1}, inizio" />
                <span aria-hidden="true">–</span>
                <input class="input" type="time" bind:value={r.fine} aria-label="{gruppo.titolo}, fascia {i + 1}, fine" />
                <button type="button" class="text-button" onclick={() => gruppo.lista.splice(i, 1)} aria-label="Togli la fascia {i + 1}">Togli</button>
              </div>
            {/each}
            <button type="button" class="text-button" onclick={() => gruppo.lista.push({ inizio: gruppo.lista.at(-1)?.fine ?? "09:00", fine: "" })}>+ Fascia</button>
          </fieldset>
        {/each}
      </div>
      <p class="muted">Un buco tra due fasce è una pausa. Le fasce festive dopo mezzanotte (es. 00:00–03:30) valgono solo se anche il giorno dopo è festivo.</p>
      {#if erroreFasce}<p class="notice" role="alert">{erroreFasce}</p>{/if}
      {#if fasceSalvate}<p class="muted" role="status">Fasce salvate. I ritmi tengono i livelli delle prime fasce; quelle nuove partono da 3.</p>{/if}
      <div class="dialog-actions">
        <button type="button" class="text-button" onclick={ripristina}>Ripristina le predefinite</button>
        <button type="button" class="ink-button" onclick={salvaLeFasce}>Salva le fasce</button>
      </div>
    </div>
  {/if}
</section>
