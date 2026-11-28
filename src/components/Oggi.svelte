<script lang="ts">
  /* Vista Oggi (B1, B2, A4): check-in sempre modificabile in cima, poi solo «Adesso» e «Dopo», in grande.
     Ogni cambio di faccina ricalcola da adesso a domenica. L'ora si aggiorna da sola. */
  import { AREE, BATTERIE } from "../lib/energia";
  import { archivio, cambiaCheckin, minutiDi, saltaOccorrenza, segnaFatta, serieDi, umoreDi, BATTERIE_IDS, type Attivita, type Umore } from "../lib/dati.svelte";
  import { passaFiltro, vista } from "../lib/vista.svelte";
  import { chiaveData, ora } from "../lib/fasce";
  import FiltroAree from "./FiltroAree.svelte";

  const UMORI: { id: Umore; icona: string; nome: string }[] = [
    { id: "bene", icona: "🙂", nome: "Bene" },
    { id: "cosi", icona: "😐", nome: "Così così" },
    { id: "no", icona: "😣", nome: "Giorno no" },
  ];
  const areaDi = (id: string) => AREE.find((a) => a.id === id)!;
  const iconaDi = Object.fromEntries(BATTERIE.map((b) => [b.id, b.icona]));
  const dataLunga = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" });

  let orologio = $state(new Date());
  $effect(() => {
    const t = setInterval(() => (orologio = new Date()), 15_000);
    return () => clearInterval(t);
  });

  const chiave = $derived(chiaveData(orologio));
  const ieri = $derived(chiaveData(new Date(orologio.getFullYear(), orologio.getMonth(), orologio.getDate() - 1)));
  const adesso = $derived(minutiDi(orologio));
  const umore = $derived(umoreDi(chiave));

  type Voce = { a: Attivita; inizio: number; fine: number };
  /* Le attività di oggi, più quelle della notte di ieri (dopo mezzanotte), in minuti di oggi. */
  const voci = $derived.by((): Voce[] =>
    archivio.dati.attivita
      .flatMap((a): Voce[] => {
        const p = a.posto;
        if (!p) return [];
        if (p.data === chiave) return [{ a, inizio: p.inizio, fine: p.fine }];
        if (p.data === ieri && p.fine > 1440) return [{ a, inizio: p.inizio - 1440, fine: p.fine - 1440 }];
        return [];
      })
      .filter((v) => passaFiltro(v.a, vista.filtro))
      .sort((x, y) => x.inizio - y.inizio),
  );
  const inCorso = $derived(voci.find((v) => v.a.stato !== "fatta" && v.inizio <= adesso && adesso < v.fine) ?? null);
  const dopo = $derived(voci.find((v) => v.a.stato !== "fatta" && v.inizio > adesso && v !== inCorso) ?? null);
  const fatte = $derived(voci.filter((v) => v.a.stato === "fatta").length);

  let esito = $state("");
  function scegli(u: Umore): void {
    const fuori = cambiaCheckin(u, new Date());
    if (fuori < 0) return;
    esito = `Ricalcolato da adesso a domenica${fuori ? `: ${fuori} non ci ${fuori === 1 ? "sta" : "stanno"}, il motivo è in Settimana › «Non ci sta»` : ""}.`;
  }

  const tra = (min: number): string => (min < 60 ? `tra ${min} min` : `tra ${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60}` : ""}`);
</script>

{#snippet carta(v: Voce)}
  <article class="today-card" class:proposed={!v.a.posto!.bloccato} style:--tone={areaDi(v.a.area).colore}>
    <div class="today-card-top">
      <span class="task-area" aria-hidden="true">{areaDi(v.a.area).icona}</span>
      <h3>{#if serieDi(v.a)}<span class="ripete" role="img" aria-label="Si ripete">↻</span> {/if}{v.a.titolo}</h3>
      {#if v.a.posto!.bloccato}<span aria-label="bloccata">🔒</span>{/if}
    </div>
    <p class="today-card-meta">
      <span>{ora(v.inizio)}–{ora(v.fine)}</span>
      <span class="today-costs" aria-label="Costi">
        {#each BATTERIE_IDS.filter((b) => v.a.costi[b] > 0) as b (b)}<span>{iconaDi[b]}{v.a.costi[b]}</span>{/each}
      </span>
    </p>
    <div class="today-card-actions">
      <button type="button" class="ink-button" onclick={() => segnaFatta(v.a.id, true)}>Fatta</button>
      {#if serieDi(v.a)}<button type="button" class="text-button" onclick={() => saltaOccorrenza(v.a.id)}>Salta</button>{/if}
    </div>
  </article>
{/snippet}

<section class="today" aria-labelledby="today-title">
  <header class="pane-head">
    <h1 id="today-title">Oggi <span class="muted today-date">{dataLunga.format(orologio)} · {ora(adesso)}</span></h1>
    <FiltroAree />
  </header>

  <div class="checkin" role="radiogroup" aria-label="Come stai oggi">
    <span class="muted">Come stai?</span>
    <div class="seg">
      {#each UMORI as u (u.id)}
        <label class="seg-item" title={u.nome}>
          <input type="radio" name="umore" value={u.id} checked={umore === u.id} onchange={() => scegli(u.id)} />
          <span><span aria-hidden="true">{u.icona}</span> {u.nome}</span>
        </label>
      {/each}
    </div>
    {#if esito}<span class="muted" role="status">{esito}</span>{/if}
  </div>

  <div class="today-body">
    <section aria-labelledby="now-title">
      <h2 id="now-title">Adesso</h2>
      {#if inCorso}
        {@render carta(inCorso)}
      {:else if dopo}
        <p class="today-empty">Pausa</p>
      {:else}
        <p class="today-empty">Per oggi basta</p>
        <p class="muted">{fatte === 1 ? "1 attività fatta" : `${fatte} attività fatte`} oggi.</p>
        <button type="button" class="text-button today-next" onclick={() => (vista.schermata = "settimana")}>Guarda la settimana →</button>
      {/if}
    </section>
    {#if dopo}
      <section aria-labelledby="next-title">
        <h2 id="next-title">Dopo <span class="muted">{tra(dopo.inizio - adesso)}</span></h2>
        {@render carta(dopo)}
      </section>
    {:else if inCorso}
      <section aria-labelledby="next-title">
        <h2 id="next-title">Dopo</h2>
        <p class="today-empty">Per oggi basta</p>
        <p class="muted">{fatte === 1 ? "1 attività fatta" : `${fatte} attività fatte`} oggi.</p>
      </section>
    {/if}
  </div>
</section>
