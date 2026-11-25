<script lang="ts">
  /* «Nuova attività» e modifica (C1): titolo, area, durata e 5 costi con le sole icone; vincoli di tempo facoltativi.
     Un modello salvato compila titolo, area, durata e costi.
     Fase 6: l'interruttore «Si ripete» crea una serie; l'occorrenza di una serie si modifica «Solo questa volta» o
     «Anche le prossime»; `apriSerie` apre la serie stessa, con le volte di questa settimana. */
  import { AREE, BATTERIE } from "../lib/energia";
  import {
    archivio, costiZero, eliminaAttivita, eliminaModello, eliminaSerie, nuovoId, ripristinaOccorrenza, salvaAttivita, salvaModello,
    salvaSerie, serieDi,
    type Attivita, type AreaId, type Costi, type Serie, type StatoAttivita,
  } from "../lib/dati.svelte";
  import { chiaveData, indiceSettimana, lunedi, ora } from "../lib/fasce";
  import { formatoDurata } from "../lib/vista.svelte";
  import GiorniSerie from "./GiorniSerie.svelte";

  const DURATE = [15, 30, 60, 90, 120];
  const GIORNI = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];
  const STATI: Record<StatoAttivita, string> = {
    "da-pianificare": "Da pianificare",
    "in-settimana": "In settimana",
    "non-ci-sta": "Non ci sta",
    fatta: "Fatta",
    saltata: "Saltata",
  };
  const giornoBreve = new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short" });

  type Modo = "nuova" | "attivita" | "occorrenza" | "serie";

  let finestra: HTMLDialogElement;
  let campoTitolo: HTMLInputElement;
  let modo = $state<Modo>("nuova");
  let originale = $state<Attivita | null>(null);
  let serieOrig = $state<Serie | null>(null);
  let titolo = $state("");
  let area = $state<AreaId>("lavoro");
  let durata = $state(30);
  let costi = $state<Costi>(costiZero());
  let scadenza = $state("");
  let giornoPreferito = $state("");
  let fisso = $state(false);
  let fissoData = $state("");
  let fissoOra = $state("09:00");
  let comeModello = $state(false);
  let nomeModello = $state("");
  let modelloScelto = $state("");
  let confermaElimina = $state(false);

  /* Serie */
  let ripete = $state(false);
  let sTipo = $state<"giorni" | "volte">("giorni");
  let sGiorni = $state<number[]>([]);
  let sVolte = $state(2);
  let sOgni = $state(1);
  let sOraLibera = $state(true);
  let sOra = $state("18:00");
  let sInizio = $state("");
  let sFine = $state("");
  let sPausa = $state(false);
  let sFeste = $state(false);
  let sRecupera = $state(false);
  let scegliAmbito = $state(false);
  let errore = $state("");

  const minutiInOra = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const areaDi = (id: string) => AREE.find((a) => a.id === id)!;
  const serieVisibile = $derived(modo === "occorrenza" || modo === "serie" || (modo === "nuova" && ripete));
  /* Forma della serie in costruzione: alimenta GiorniSerie e la serie salvata (ora in minuti, null = libero). */
  const forma = $derived.by(() => {
    const [h, m] = sOra.split(":").map(Number);
    const minuti = sTipo === "giorni" && !sOraLibera && !Number.isNaN(h) ? h * 60 + (m || 0) : null;
    return { tipo: sTipo, giorni: sGiorni, volte: sVolte, ogniSettimane: sOgni, ora: minuti };
  });

  /* Le volte di questa settimana della serie aperta, saltate comprese (C3). */
  const dellaSettimana = $derived.by(() => {
    if (modo !== "serie" || !serieOrig) return [];
    const lun = lunedi(new Date());
    const da = chiaveData(lun);
    const a = chiaveData(new Date(lun.getFullYear(), lun.getMonth(), lun.getDate() + 6));
    return archivio.dati.attivita
      .filter((x) => x.serie === serieOrig!.id && x.giornoSerie && x.giornoSerie.slice(0, 10) >= da && x.giornoSerie.slice(0, 10) <= a)
      .sort((x, y) => x.giornoSerie!.localeCompare(y.giornoSerie!, "it", { numeric: true }));
  });

  function etichettaVolta(a: Attivita): string {
    const g = a.giornoSerie!;
    if (g.includes("#")) return `Volta ${g.split("#")[1]}`;
    return giornoBreve.format(new Date(g + "T12:00"));
  }

  function predefinitiSerie(): void {
    sTipo = "giorni";
    sGiorni = [indiceSettimana(new Date())];
    sVolte = 2;
    sOgni = 1;
    sOraLibera = true;
    sOra = "18:00";
    sInizio = chiaveData(new Date());
    sFine = "";
    sPausa = false;
    sFeste = false;
    sRecupera = false;
  }

  function leggiSerie(s: Serie): void {
    sTipo = s.tipo;
    sGiorni = [...s.giorni];
    sVolte = s.volte;
    sOgni = s.ogniSettimane;
    sOraLibera = s.ora === null;
    sOra = s.ora === null ? "18:00" : minutiInOra(s.ora);
    sInizio = s.inizio;
    sFine = s.fine ?? "";
    sPausa = s.inPausa;
    sFeste = s.saltaFeste;
    sRecupera = s.recupera;
  }

  function azzera(): void {
    scadenza = "";
    giornoPreferito = "";
    fisso = false;
    fissoData = "";
    fissoOra = "09:00";
    comeModello = false;
    nomeModello = "";
    modelloScelto = "";
    confermaElimina = false;
    scegliAmbito = false;
    errore = "";
  }

  function mostra(): void {
    finestra.showModal();
    campoTitolo.focus();
  }

  export function apri(attivita: Attivita | null = null): void {
    azzera();
    originale = attivita;
    serieOrig = null;
    titolo = attivita?.titolo ?? "";
    area = attivita?.area ?? "lavoro";
    durata = attivita?.durata ?? 30;
    costi = { ...(attivita?.costi ?? costiZero()) };
    predefinitiSerie();
    const s = attivita ? serieDi(attivita) : undefined;
    if (attivita && s) {
      modo = "occorrenza";
      serieOrig = s;
      ripete = true;
      leggiSerie(s);
    } else {
      modo = attivita ? "attivita" : "nuova";
      ripete = false;
      scadenza = attivita?.scadenza ?? "";
      giornoPreferito = attivita?.giornoPreferito == null ? "" : String(attivita.giornoPreferito);
      fisso = !!attivita?.orarioFisso;
      fissoData = attivita?.orarioFisso?.data ?? "";
      fissoOra = attivita?.orarioFisso ? minutiInOra(attivita.orarioFisso.inizio) : "09:00";
    }
    mostra();
  }

  export function apriSerie(s: Serie): void {
    azzera();
    modo = "serie";
    originale = null;
    serieOrig = s;
    titolo = s.titolo;
    area = s.area;
    durata = s.durata;
    costi = { ...s.costi };
    ripete = true;
    leggiSerie(s);
    mostra();
  }

  function usaModello(): void {
    const m = archivio.dati.modelli.find((x) => x.id === modelloScelto);
    if (!m) return;
    titolo = m.titolo;
    area = m.area;
    durata = m.durata;
    costi = { ...m.costi };
  }

  function cambiaGiorno(g: number): void {
    sGiorni = sGiorni.includes(g) ? sGiorni.filter((x) => x !== g) : [...sGiorni, g];
  }

  /** Messaggio di errore della serie, o «» se va bene. */
  function controllaSerie(): string {
    if (sTipo === "giorni" && sGiorni.length === 0) return "Scegli almeno un giorno.";
    if (!sInizio) return "Scegli da quando parte.";
    if (sFine && sFine < sInizio) return "«Fino al» non può essere prima di «Dal».";
    return "";
  }

  function costruisciSerie(): Serie {
    return {
      id: serieOrig?.id ?? nuovoId(),
      titolo: titolo.trim(),
      area,
      costi: { ...costi },
      durata,
      tipo: sTipo,
      giorni: [...sGiorni].sort((a, b) => a - b),
      volte: Math.min(7, Math.max(1, Math.round(Number(sVolte)) || 1)),
      ogniSettimane: Math.min(4, Math.max(1, Math.round(Number(sOgni)) || 1)),
      ora: forma.ora,
      inizio: sInizio,
      fine: sFine || null,
      inPausa: sPausa,
      saltaFeste: sFeste,
      recupera: sRecupera,
      creata: serieOrig?.creata ?? new Date().toISOString(),
    };
  }

  function conferma(evento: SubmitEvent): void {
    evento.preventDefault();
    if (modo === "nuova" && ripete) {
      errore = controllaSerie();
      if (errore) return;
      salvaSerie(costruisciSerie(), "nuova");
      salvaModelloSeServe();
      finestra.close();
    } else if (modo === "occorrenza") {
      scegliAmbito = true;
    } else if (modo === "serie") {
      errore = controllaSerie();
      if (errore) return;
      salvaSerie(costruisciSerie(), "prossime");
      finestra.close();
    } else {
      salvaNormale();
      salvaModelloSeServe();
      finestra.close();
    }
  }

  function salvaModelloSeServe(): void {
    if (comeModello) salvaModello({ id: nuovoId(), nome: (nomeModello || titolo).trim(), titolo: titolo.trim(), area, costi: { ...costi }, durata });
  }

  function salvaNormale(): void {
    const [h, m] = fissoOra.split(":").map(Number);
    const orarioFisso = fisso && fissoData ? { data: fissoData, inizio: h * 60 + m } : null;
    /* Un orario fisso decide il posto; altrimenti resta quello di prima, con la nuova durata. */
    const vecchio = originale?.posto ?? null;
    const posto = orarioFisso
      ? { data: orarioFisso.data, inizio: orarioFisso.inizio, fine: orarioFisso.inizio + durata, bloccato: true, perche: "orario fisso" }
      : vecchio && !originale?.orarioFisso
        ? { ...vecchio, fine: vecchio.inizio + durata }
        : null;
    const stato = originale?.stato === "fatta" ? "fatta" : posto ? "in-settimana" : originale?.stato === "non-ci-sta" ? "non-ci-sta" : "da-pianificare";
    salvaAttivita({
      id: originale?.id ?? nuovoId(),
      titolo: titolo.trim(),
      area,
      costi: { ...costi },
      durata,
      scadenza: scadenza || null,
      orarioFisso,
      giornoPreferito: giornoPreferito === "" ? null : Number(giornoPreferito),
      stato,
      creata: originale?.creata ?? new Date().toISOString(),
      posto,
      motivo: stato === "non-ci-sta" ? (originale?.motivo ?? null) : null,
      serie: originale?.serie ?? null,
      giornoSerie: originale?.giornoSerie ?? null,
      soloGiorno: originale?.soloGiorno ?? null,
    });
  }

  /* «Solo questa volta»: la normale salvaAttivita sull'occorrenza; il legame con la serie resta. */
  function soloQuestaVolta(): void {
    if (!originale) return;
    const p = originale.posto;
    salvaAttivita({
      ...originale,
      titolo: titolo.trim(),
      area,
      costi: { ...costi },
      durata,
      posto: p ? { ...p, fine: p.inizio + durata } : null,
    });
    finestra.close();
  }

  function ancheLeProssime(): void {
    errore = controllaSerie();
    if (errore) {
      scegliAmbito = false;
      return;
    }
    salvaSerie(costruisciSerie(), "prossime");
    finestra.close();
  }

  function elimina(): void {
    if (!originale) return;
    if (!confermaElimina) {
      confermaElimina = true;
      return;
    }
    eliminaAttivita(originale.id);
    finestra.close();
  }

  function eliminaLaSerie(): void {
    if (!serieOrig) return;
    if (!confermaElimina) {
      confermaElimina = true;
      return;
    }
    eliminaSerie(serieOrig.id);
    finestra.close();
  }
</script>

<dialog class="sheet glass task-sheet" bind:this={finestra} aria-labelledby="attivita-titolo">
  <form class="task-form" onsubmit={conferma}>
    <h2 id="attivita-titolo">{modo === "serie" ? "Modifica serie" : modo === "nuova" ? "Nuova attività" : "Modifica attività"}</h2>

    {#if modo === "nuova" && archivio.dati.modelli.length}
      <div class="field-row">
        <label class="field grow">
          <span>Parti da un modello</span>
          <select class="input" bind:value={modelloScelto} onchange={usaModello}>
            <option value="">Nessuno</option>
            {#each archivio.dati.modelli as m (m.id)}<option value={m.id}>{m.nome}</option>{/each}
          </select>
        </label>
        {#if modelloScelto}
          <button type="button" class="text-button" onclick={() => { eliminaModello(modelloScelto); modelloScelto = ""; }}>Elimina modello</button>
        {/if}
      </div>
    {/if}

    <label class="field">
      <span>Titolo</span>
      <input class="input" bind:this={campoTitolo} bind:value={titolo} required maxlength="80" autocomplete="off" placeholder="Es. Chiamare mamma" />
    </label>

    <fieldset class="field">
      <legend>Area</legend>
      <div class="pick-row">
        {#each AREE as a (a.id)}
          <label class="pick" title={a.nome} style:--tone={a.colore}>
            <input type="radio" name="area" value={a.id} bind:group={area} aria-label={a.nome} />
            <span aria-hidden="true">{a.icona}</span>
          </label>
        {/each}
      </div>
    </fieldset>

    <fieldset class="field">
      <legend>Durata · {formatoDurata(durata)}</legend>
      <div class="pick-row">
        {#each DURATE as d (d)}
          <label class="pick pick-text">
            <input type="radio" name="durata" value={d} bind:group={durata} />
            <span>{formatoDurata(d)}</span>
          </label>
        {/each}
        <label class="field-inline">
          <span class="visually-hidden">Altra durata in minuti</span>
          <input class="input input-num" type="number" min="5" max="720" step="5" bind:value={durata} />
          <span aria-hidden="true">min</span>
        </label>
      </div>
    </fieldset>

    <fieldset class="field">
      <legend>Quanto consuma</legend>
      <div class="cost-grid">
        {#each BATTERIE as b (b.id)}
          <div class="cost-row" role="radiogroup" aria-label={b.nome} style:--tone={b.colore}>
            <span class="cost-icon" title={b.nome} aria-hidden="true">{b.icona}</span>
            {#each [0, 1, 2, 3] as n (n)}
              <label class="dot-pick" title="{b.nome}: {n}">
                <input type="radio" name="costo-{b.id}" value={n} bind:group={costi[b.id]} aria-label="{b.nome} {n}" />
                <span aria-hidden="true">{n}</span>
              </label>
            {/each}
          </div>
        {/each}
      </div>
    </fieldset>

    {#if modo === "nuova"}
      <label class="check">
        <input type="checkbox" bind:checked={ripete} />
        <span>Si ripete</span>
      </label>
    {/if}

    {#if serieVisibile}
      <fieldset class="field serie-box">
        <legend>Quando si ripete</legend>
        <div class="seg" role="radiogroup" aria-label="Tipo di ripetizione">
          <label class="seg-item"><input type="radio" name="serie-tipo" value="giorni" bind:group={sTipo} /><span>Giorni precisi</span></label>
          <label class="seg-item"><input type="radio" name="serie-tipo" value="volte" bind:group={sTipo} /><span>N volte a settimana</span></label>
        </div>

        <GiorniSerie serie={forma} tone={areaDi(area).colore} onCambia={cambiaGiorno} />

        <div class="field-row">
          {#if sTipo === "volte"}
            <label class="field">
              <span>Volte a settimana</span>
              <input class="input input-num" type="number" min="1" max="7" step="1" bind:value={sVolte} required />
            </label>
          {/if}
          <label class="field">
            <span>Ogni</span>
            <select class="input" bind:value={sOgni}>
              <option value={1}>settimana</option>
              {#each [2, 3, 4] as n (n)}<option value={n}>{n} settimane</option>{/each}
            </select>
          </label>
        </div>

        {#if sTipo === "giorni"}
          <div class="field-row">
            <label class="check">
              <input type="checkbox" bind:checked={sOraLibera} />
              <span>Orario libero</span>
            </label>
            {#if !sOraLibera}
              <label class="field">
                <span>Ora</span>
                <input class="input" type="time" bind:value={sOra} step="300" required />
              </label>
            {/if}
          </div>
        {/if}

        <div class="field-row">
          <label class="field grow"><span>Dal</span><input class="input" type="date" bind:value={sInizio} required /></label>
          <label class="field grow"><span>Fino al</span><input class="input" type="date" bind:value={sFine} /></label>
        </div>

        <label class="check"><input type="checkbox" bind:checked={sPausa} /><span>In pausa</span></label>
        <label class="check"><input type="checkbox" bind:checked={sFeste} /><span>Salta feste e ferie</span></label>
        <label class="check"><input type="checkbox" bind:checked={sRecupera} /><span>Recupera se salti</span></label>

        {#if errore}<p class="serie-errore" role="alert">{errore}</p>{/if}
      </fieldset>
    {:else}
      <div class="field-row">
        <label class="field grow">
          <span>Scadenza</span>
          <input class="input" type="date" bind:value={scadenza} />
        </label>
        <label class="field grow">
          <span>Giorno preferito</span>
          <select class="input" bind:value={giornoPreferito}>
            <option value="">Qualsiasi</option>
            {#each GIORNI as g, i (g)}<option value={String(i)}>{g}</option>{/each}
          </select>
        </label>
      </div>

      <label class="check">
        <input type="checkbox" bind:checked={fisso} />
        <span>Orario fisso</span>
      </label>
      {#if fisso}
        <div class="field-row">
          <label class="field grow"><span>Giorno</span><input class="input" type="date" bind:value={fissoData} required /></label>
          <label class="field grow"><span>Ora</span><input class="input" type="time" bind:value={fissoOra} step="300" required /></label>
        </div>
      {/if}
    {/if}

    {#if modo === "serie"}
      <section class="serie-settimana" aria-labelledby="serie-sett-titolo">
        <h3 id="serie-sett-titolo">Questa settimana</h3>
        {#if dellaSettimana.length === 0}
          <p class="muted">Nessuna volta questa settimana.</p>
        {:else}
          <ul class="serie-volte">
            {#each dellaSettimana as v (v.id)}
              <li class="serie-volta" data-stato={v.stato}>
                <span class="serie-volta-giorno">{etichettaVolta(v)}</span>
                <span class="muted">{v.posto ? `${ora(v.posto.inizio)}–${ora(v.posto.fine)}` : ""}</span>
                <span class="task-state" data-stato={v.stato}>{STATI[v.stato]}</span>
                {#if v.stato === "saltata"}
                  <button type="button" class="text-button" onclick={() => ripristinaOccorrenza(v.id)}>Ripristina</button>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}

    {#if modo === "nuova" || modo === "attivita"}
      <label class="check">
        <input type="checkbox" bind:checked={comeModello} />
        <span>Salva anche come modello</span>
      </label>
      {#if comeModello}
        <label class="field">
          <span>Nome del modello</span>
          <input class="input" bind:value={nomeModello} placeholder={titolo || "Es. Telefonata medico"} maxlength="60" />
        </label>
      {/if}
    {/if}

    {#if scegliAmbito}
      <div class="serie-ambito" role="group" aria-label="Cosa vuoi modificare">
        <p>Questa attività fa parte di una serie. Cosa modifichi?</p>
        <div class="dialog-actions">
          <button type="button" class="text-button" onclick={() => (scegliAmbito = false)}>Indietro</button>
          <span class="grow"></span>
          <button type="button" class="text-button" onclick={soloQuestaVolta}>Solo questa volta</button>
          <button type="button" class="ink-button" onclick={ancheLeProssime}>Anche le prossime</button>
        </div>
      </div>
    {:else}
      <div class="dialog-actions">
        {#if modo === "attivita"}
          <button type="button" class="text-button danger" onclick={elimina}>{confermaElimina ? "Conferma eliminazione" : "Elimina"}</button>
        {:else if modo === "occorrenza" || modo === "serie"}
          <button type="button" class="text-button danger" onclick={eliminaLaSerie}>{confermaElimina ? "Conferma eliminazione serie" : "Elimina serie"}</button>
        {/if}
        <span class="grow"></span>
        <button type="button" class="text-button" onclick={() => finestra.close()}>Annulla</button>
        <button type="submit" class="ink-button">Salva</button>
      </div>
    {/if}
  </form>
</dialog>
