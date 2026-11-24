<script lang="ts">
  /* «Nuova attività» e modifica (C1): titolo, area, durata e 5 costi con le sole icone; vincoli di tempo facoltativi.
     Un modello salvato compila titolo, area, durata e costi. */
  import { AREE, BATTERIE } from "../lib/energia";
  import {
    archivio, costiZero, eliminaAttivita, eliminaModello, nuovoId, salvaAttivita, salvaModello,
    type Attivita, type AreaId, type Costi,
  } from "../lib/dati.svelte";
  import { formatoDurata } from "../lib/vista.svelte";

  const DURATE = [15, 30, 60, 90, 120];
  const GIORNI = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];

  let finestra: HTMLDialogElement;
  let campoTitolo: HTMLInputElement;
  let originale = $state<Attivita | null>(null);
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

  const minutiInOra = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  export function apri(attivita: Attivita | null = null): void {
    originale = attivita;
    titolo = attivita?.titolo ?? "";
    area = attivita?.area ?? "lavoro";
    durata = attivita?.durata ?? 30;
    costi = { ...(attivita?.costi ?? costiZero()) };
    scadenza = attivita?.scadenza ?? "";
    giornoPreferito = attivita?.giornoPreferito == null ? "" : String(attivita.giornoPreferito);
    fisso = !!attivita?.orarioFisso;
    fissoData = attivita?.orarioFisso?.data ?? "";
    fissoOra = attivita?.orarioFisso ? minutiInOra(attivita.orarioFisso.inizio) : "09:00";
    comeModello = false;
    nomeModello = "";
    modelloScelto = "";
    confermaElimina = false;
    finestra.showModal();
    campoTitolo.focus();
  }

  function usaModello(): void {
    const m = archivio.dati.modelli.find((x) => x.id === modelloScelto);
    if (!m) return;
    titolo = m.titolo;
    area = m.area;
    durata = m.durata;
    costi = { ...m.costi };
  }

  function conferma(evento: SubmitEvent): void {
    evento.preventDefault();
    const [h, m] = fissoOra.split(":").map(Number);
    salvaAttivita({
      id: originale?.id ?? nuovoId(),
      titolo: titolo.trim(),
      area,
      costi: { ...costi },
      durata,
      scadenza: scadenza || null,
      orarioFisso: fisso && fissoData ? { data: fissoData, inizio: h * 60 + m } : null,
      giornoPreferito: giornoPreferito === "" ? null : Number(giornoPreferito),
      stato: originale?.stato ?? "da-pianificare",
      creata: originale?.creata ?? new Date().toISOString(),
    });
    if (comeModello) salvaModello({ id: nuovoId(), nome: (nomeModello || titolo).trim(), titolo: titolo.trim(), area, costi: { ...costi }, durata });
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
</script>

<dialog class="sheet glass task-sheet" bind:this={finestra} aria-labelledby="attivita-titolo">
  <form class="task-form" onsubmit={conferma}>
    <h2 id="attivita-titolo">{originale ? "Modifica attività" : "Nuova attività"}</h2>

    {#if !originale && archivio.dati.modelli.length}
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

    <div class="dialog-actions">
      {#if originale}
        <button type="button" class="text-button danger" onclick={elimina}>{confermaElimina ? "Conferma eliminazione" : "Elimina"}</button>
      {/if}
      <span class="grow"></span>
      <button type="button" class="text-button" onclick={() => finestra.close()}>Annulla</button>
      <button type="submit" class="ink-button">Salva</button>
    </div>
  </form>
</dialog>
