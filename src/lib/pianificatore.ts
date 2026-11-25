/* Il bottone «Proponi settimana» (A3, B4, B7). Modulo puro e deterministico: stessi dati = stessa proposta.

   1. Occupano il posto per primi: attività fatte o bloccate in settimana, proposte nei giorni passati, orari fissi.
      Le occorrenze `saltata` sono ignorate del tutto (niente posto, niente esito).
      Oggi conta l'ora attuale (`adesso`): le proposte già iniziate restano e il tempo prima di adesso non è libero.
   2. Le altre, in ordine: prima le occorrenze con giorno preciso (`soloGiorno`), poi le altre occorrenze di una serie
      (costo totale più alto, poi titolo e id), infine le attività normali: scadenza più vicina, poi costo totale più alto
      (poi titolo e id, per non dipendere dall'ordine).
   3. Una posizione è valida se: c'è tempo libero (attività lunghe = fasce consecutive vuote, la pausa interrompe),
      ogni fascia occupata ha il livello ≥ costo per ogni batteria, il totale del giorno non si supera
      e il giorno non ha già il massimo di attività pesanti ❤️‍🩹 / 💬.
      Con `soloGiorno` l'unico giorno valido è quello. Due occorrenze della stessa serie non stanno nello stesso giorno.
   4. Tra le valide vince quella con più energia libera; il giorno preferito vale molto, la stessa area nello stesso giorno un po' meno.
   5. Chi non entra riceve il motivo, raggruppato per giorni consecutivi («gio–ven: 💪 finita»). */
import { BATTERIE } from "./energia";
import type { Attivita, BatteriaId, Costi, Regole } from "./dati.svelte";
import type { Fascia } from "./fasce";

export interface GiornoPiano {
  chiave: string;
  fasce: readonly Fascia[];
  /** Livelli per fascia, nello stesso ordine di `fasce`. */
  livelli: readonly Costi[];
  totale: Costi;
}

export type Esito =
  | { tipo: "posto"; data: string; inizio: number; fine: number; bloccato: boolean; perche: string }
  | { tipo: "nonCiSta"; motivo: string };

const IDS = BATTERIE.map((b) => b.id) as BatteriaId[];
const ICONA = Object.fromEntries(BATTERIE.map((b) => [b.id, b.icona])) as Record<BatteriaId, string>;
const NOMI_GIORNO = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

export const pesante = (c: Costi): boolean => c.emotiva === 3 || c.sociale === 3;
const conCuscinetto = (c: Costi): boolean => IDS.some((b) => c[b] === 3);
const costoTotale = (c: Costi): number => IDS.reduce((s, b) => s + c[b], 0);

type Intervallo = [number, number];

class Giorno {
  libero: Intervallo[][];
  usato: Costi = { mentale: 0, emotiva: 0, sociale: 0, sensoriale: 0, fisica: 0 };
  pesanti = 0;
  aree = new Map<string, number>();
  serie = new Set<string>();
  constructor(readonly g: GiornoPiano) {
    this.libero = g.fasce.map((f) => [[f.inizio, f.fine]]);
  }

  /** Toglie [da, a) dal tempo libero delle fasce che tocca; restituisce gli indici delle fasce toccate. */
  occupa(da: number, a: number): number[] {
    const toccate: number[] = [];
    this.g.fasce.forEach((f, i) => {
      if (f.fine <= da || f.inizio >= a) return;
      toccate.push(i);
      this.libero[i] = this.libero[i].flatMap(([x, y]): Intervallo[] => {
        if (y <= da || x >= a) return [[x, y]];
        const resto: Intervallo[] = [];
        if (x < da) resto.push([x, da]);
        if (y > a) resto.push([a, y]);
        return resto;
      });
    });
    return toccate;
  }

  consuma(a: Attivita): void {
    for (const b of IDS) this.usato[b] += a.costi[b];
    if (pesante(a.costi)) this.pesanti++;
    this.aree.set(a.area, (this.aree.get(a.area) ?? 0) + 1);
    if (a.serie !== null) this.serie.add(a.serie);
  }

  vuota(i: number): boolean {
    const f = this.g.fasce[i];
    return this.libero[i].length === 1 && this.libero[i][0][0] === f.inizio && this.libero[i][0][1] === f.fine;
  }
}

type Candidato = { inizio: number; fine: number; fasce: number[] };

/* Tutte le posizioni con abbastanza tempo libero in un giorno, nell'ordine delle fasce. */
function posizioni(g: Giorno, durata: number): Candidato[] {
  const out: Candidato[] = [];
  const fasce = g.g.fasce;
  for (let i = 0; i < fasce.length; i++) {
    const breve = g.libero[i].find(([x, y]) => y - x >= durata);
    if (breve) {
      out.push({ inizio: breve[0], fine: breve[0] + durata, fasce: [i] });
      continue;
    }
    // Attività lunga: fasce consecutive, contigue e vuote a partire da questa.
    if (!g.vuota(i)) continue;
    let fine = fasce[i].fine;
    const usate = [i];
    for (let j = i + 1; fine - fasce[i].inizio < durata && j < fasce.length; j++) {
      if (fasce[j].inizio !== fasce[j - 1].fine || !g.vuota(j)) break;
      fine = fasce[j].fine;
      usate.push(j);
    }
    if (fine - fasce[i].inizio >= durata && usate.length > 1) out.push({ inizio: fasce[i].inizio, fine: fasce[i].inizio + durata, fasce: usate });
  }
  return out;
}

const minimo = (g: Giorno, fasce: number[], b: BatteriaId) => Math.min(...fasce.map((i) => g.g.livelli[i][b]));

/* Motivi raggruppati per giorni consecutivi: «lun–mer: 💪 finita · gio: nessuno spazio libero». */
function riassumi(motivi: { giorno: number; testo: string }[]): string {
  const parti: string[] = [];
  for (let k = 0; k < motivi.length; ) {
    let h = k;
    while (h + 1 < motivi.length && motivi[h + 1].testo === motivi[k].testo && motivi[h + 1].giorno === motivi[h].giorno + 1) h++;
    const giorni = h > k ? `${NOMI_GIORNO[motivi[k].giorno]}–${NOMI_GIORNO[motivi[h].giorno]}` : NOMI_GIORNO[motivi[k].giorno];
    parti.push(`${giorni}: ${motivi[k].testo}`);
    k = h + 1;
  }
  return parti.join(" · ");
}

const ggmm = (k: string) => `${Number(k.slice(8))}/${Number(k.slice(5, 7))}`;

/** `adesso` = minuti dalla mezzanotte nel giorno `daGiorno`; 0 = tutto il giorno è ancora da pianificare. */
export function proponi(
  giorni: readonly GiornoPiano[], daGiorno: number, attivita: readonly Attivita[], regole: Regole, adesso = 0,
): Map<string, Esito> {
  const stato = giorni.map((g) => new Giorno(g));
  const indice = new Map(giorni.map((g, i) => [g.chiave, i]));
  const esiti = new Map<string, Esito>();

  const metti = (a: Attivita, d: number, inizio: number, fine: number) => {
    const g = stato[d];
    const finoA = conCuscinetto(a.costi) ? fine + regole.cuscinetto : fine;
    g.occupa(inizio, finoA);
    g.consuma(a);
  };

  // 1. Quello che resta fermo.
  const daPianificare: Attivita[] = [];
  for (const a of attivita) {
    if (a.stato === "saltata") continue;
    const d = a.posto ? indice.get(a.posto.data) : undefined;
    const passata = d !== undefined && (d < daGiorno || (d === daGiorno && a.posto!.inizio < adesso));
    if (a.posto && d !== undefined && (a.stato === "fatta" || a.posto.bloccato || passata)) {
      metti(a, d, a.posto.inizio, a.posto.fine);
      continue;
    }
    if (a.stato === "fatta") continue;
    if (a.orarioFisso) {
      const f = indice.get(a.orarioFisso.data);
      if (f === undefined) continue;
      const fine = a.orarioFisso.inizio + a.durata;
      metti(a, f, a.orarioFisso.inizio, fine);
      esiti.set(a.id, { tipo: "posto", data: a.orarioFisso.data, inizio: a.orarioFisso.inizio, fine, bloccato: true, perche: "orario fisso" });
      continue;
    }
    daPianificare.push(a);
  }
  // Oggi il tempo prima di adesso è passato.
  if (adesso > 0 && stato[daGiorno]) stato[daGiorno].occupa(0, adesso);

  // 2. Ordine: giorno preciso, serie, normali.
  const gruppo = (a: Attivita) => (a.soloGiorno !== null ? 0 : a.serie !== null ? 1 : 2);
  daPianificare.sort(
    (a, b) =>
      gruppo(a) - gruppo(b) ||
      (gruppo(a) === 2 ? (a.scadenza ?? "9999").localeCompare(b.scadenza ?? "9999") : 0) ||
      costoTotale(b.costi) - costoTotale(a.costi) ||
      a.titolo.localeCompare(b.titolo, "it") ||
      a.id.localeCompare(b.id),
  );

  // 3–5. Una alla volta.
  const ultimo = giorni.length - 1;
  for (const a of daPianificare) {
    const scaduta = a.scadenza !== null && a.scadenza < giorni[daGiorno].chiave;
    let migliore: { d: number; c: Candidato; punti: number } | null = null;
    const motivi: { giorno: number; testo: string }[] = [];

    // Con `soloGiorno` l'unico giorno valido è quello (fuori dalla settimana o già passato: nessun giorno).
    const unico = a.soloGiorno !== null ? (indice.get(a.soloGiorno) ?? -1) : null;
    const primo = unico === null ? daGiorno : unico;
    const fino = unico === null ? ultimo : unico;
    for (let d = Math.max(primo, daGiorno); d <= fino; d++) {
      const g = stato[d];
      if (a.scadenza && !scaduta && giorni[d].chiave > a.scadenza) break;
      if (a.serie !== null && a.soloGiorno === null && g.serie.has(a.serie)) {
        motivi.push({ giorno: d, testo: "c'è già oggi" });
        continue;
      }
      const tempo = posizioni(g, a.durata);
      if (!tempo.length) {
        motivi.push({ giorno: d, testo: "nessuno spazio libero" });
        continue;
      }
      if (pesante(a.costi) && g.pesanti >= regole.maxPesanti) {
        motivi.push({ giorno: d, testo: "c'è già un impegno pesante" });
        continue;
      }
      const finita = IDS.find((b) => g.usato[b] + a.costi[b] > g.g.totale[b]);
      if (finita) {
        motivi.push({ giorno: d, testo: `${ICONA[finita]} finita` });
        continue;
      }
      const bassa = new Map<BatteriaId, number>();
      for (const c of tempo) {
        const manca = IDS.find((b) => minimo(g, c.fasce, b) < a.costi[b]);
        if (manca) {
          bassa.set(manca, (bassa.get(manca) ?? 0) + 1);
          continue;
        }
        const punti =
          IDS.reduce((s, b) => s + (g.g.totale[b] - g.usato[b] - a.costi[b]) + (minimo(g, c.fasce, b) - a.costi[b]), 0) +
          (a.giornoPreferito === d ? 50 : 0) -
          3 * (g.aree.get(a.area) ?? 0) -
          (scaduta ? 10 * d : 0);
        if (!migliore || punti > migliore.punti) migliore = { d, c, punti };
      }
      if (bassa.size) {
        const [b] = [...bassa].sort((x, y) => y[1] - x[1] || IDS.indexOf(x[0]) - IDS.indexOf(y[0]))[0];
        if (!tempo.some((c) => !IDS.some((x) => minimo(g, c.fasce, x) < a.costi[x]))) motivi.push({ giorno: d, testo: `${ICONA[b]} bassa` });
      }
    }

    if (!migliore) {
      const oltre = a.scadenza && !scaduta && a.scadenza < giorni[ultimo].chiave ? ` · scade il ${ggmm(a.scadenza)}` : "";
      esiti.set(a.id, { tipo: "nonCiSta", motivo: (riassumi(motivi) || "nessun giorno disponibile") + oltre });
      continue;
    }
    const { d, c } = migliore;
    metti(a, d, c.inizio, c.fine);
    const g = stato[d];
    const dominante = IDS.filter((b) => a.costi[b] > 0).sort((x, y) => a.costi[y] - a.costi[x] || IDS.indexOf(x) - IDS.indexOf(y))[0];
    const perche = [
      a.giornoPreferito === d ? "giorno preferito" : "",
      scaduta ? "scaduta: prima possibile" : a.scadenza ? `entro il ${ggmm(a.scadenza)}` : "",
      dominante ? `${ICONA[dominante]} ${minimo(g, c.fasce, dominante)}/3 qui` : "fascia libera",
    ].filter(Boolean);
    esiti.set(a.id, { tipo: "posto", data: giorni[d].chiave, inizio: c.inizio, fine: c.fine, bloccato: false, perche: perche.join(" · ") });
  }
  return esiti;
}
