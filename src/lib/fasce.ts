/* Fasce orarie, giorni festivi e colonna del ritmo (B1, B2, B3). Funzioni pure: i dati arrivano come `Calendario`.
   Minuti dalla mezzanotte; una fascia con inizio ≥ 1440 è «notturna» (es. 0–3:30 = 1440–1650) e appartiene al giorno che finisce. */

export type Fascia = { inizio: number; fine: number };
export type Festa = { id: string; dal: string; al: string; nome: string };
export type Calendario = { fasce: { feriali: Fascia[]; festive: Fascia[] }; feste: Festa[] };

const coppie = (l: number[][]): Fascia[] => l.map(([inizio, fine]) => ({ inizio, fine }));

/* Le fasce di Benedetta, predefinite e modificabili (B1). */
export const FASCE_FERIALI: readonly Fascia[] = coppie([
  [420, 540], [540, 600], [600, 660], [660, 720], [720, 780], [780, 840], [840, 900],
  [900, 960], [960, 1020], [1020, 1080], [1080, 1200], [1200, 1320], [1320, 1440],
]);
export const FASCE_FESTIVE: readonly Fascia[] = coppie([
  [360, 480], [480, 600], [600, 720], [720, 840], [870, 960], [960, 1080], [1080, 1230], [1260, 1440], [1440, 1650],
]);

/** Data locale AAAA-MM-GG (non UTC: a mezzanotte toISOString sbaglierebbe giorno). */
export function chiaveData(g: Date): string {
  return `${g.getFullYear()}-${String(g.getMonth() + 1).padStart(2, "0")}-${String(g.getDate()).padStart(2, "0")}`;
}

export function giornoDopo(g: Date): Date {
  const d = new Date(g);
  d.setDate(g.getDate() + 1);
  return d;
}

/** 0 = lunedì … 6 = domenica. */
export const indiceSettimana = (g: Date): number => (g.getDay() + 6) % 7;

/** Sabato, domenica e ogni giorno dentro un intervallo di «Feste e ferie». */
export function festivo(g: Date, cal: Calendario): boolean {
  if (indiceSettimana(g) >= 5) return true;
  const k = chiaveData(g);
  return cal.feste.some((f) => f.dal <= k && k <= f.al);
}

/** La festa di quel singolo giorno, se c'è (per il pulsante 🎉). */
export function festaDelGiorno(g: Date, cal: Calendario): Festa | undefined {
  const k = chiaveData(g);
  return cal.feste.find((f) => f.dal <= k && k <= f.al);
}

export const notturna = (f: Fascia): boolean => f.inizio >= 1440;

/** Le fasce notturne esistono solo se anche il giorno dopo è festivo (Q7). */
export function fasceDelGiorno(g: Date, cal: Calendario): readonly Fascia[] {
  if (!festivo(g, cal)) return cal.fasce.feriali;
  return festivo(giornoDopo(g), cal) ? cal.fasce.festive : cal.fasce.festive.filter((f) => !notturna(f));
}

/* Quale colonna del ritmo usa un giorno: lun–ven la propria; un giorno festivo usa il sabato
   se anche il giorno dopo è festivo (c'è la notte), altrimenti la domenica. */
export function colonnaRitmo(g: Date, cal: Calendario): number {
  if (!festivo(g, cal)) return indiceSettimana(g);
  return festivo(giornoDopo(g), cal) ? 5 : 6;
}

/** Le fasce mostrate in una colonna del ritmo: lun–ven feriali, sabato festive con la notte, domenica senza. */
export function fasceDellaColonna(colonna: number, cal: Calendario): readonly Fascia[] {
  if (colonna < 5) return cal.fasce.feriali;
  return colonna === 5 ? cal.fasce.festive : cal.fasce.festive.filter((f) => !notturna(f));
}

/** Totale del giorno automatico (B3): il 40% della somma dei livelli delle fasce, arrotondato. */
export const QUOTA_TOTALE = 0.4;
export function totaleAuto(livelli: readonly number[]): number {
  return Math.round(livelli.reduce((s, n) => s + n, 0) * QUOTA_TOTALE);
}

export function ora(minuti: number): string {
  const m = minuti % 1440;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}:${String(r).padStart(2, "0")}` : String(h);
}

export const etichetta = (f: Fascia): string => `${ora(f.inizio)}–${ora(f.fine)}`;

/* Legge un elenco di fasce scritte come orari «HH:MM» e lo mette in ordine sul giorno:
   una fascia che riparte da un'ora più bassa della precedente cade dopo mezzanotte (+1440).
   Restituisce le fasce o il primo errore in italiano. */
export function leggiFasce(righe: { inizio: string; fine: string }[]): { fasce: Fascia[] } | { errore: string } {
  if (!righe.length) return { errore: "Serve almeno una fascia." };
  const fasce: Fascia[] = [];
  let giorno = 0;
  for (const [i, r] of righe.entries()) {
    const min = (s: string) => {
      const [h, m] = s.split(":").map(Number);
      return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
    };
    let inizio = min(r.inizio) + giorno;
    let fine = min(r.fine) + giorno;
    if (Number.isNaN(inizio) || Number.isNaN(fine)) return { errore: `Fascia ${i + 1}: orario mancante.` };
    const prima = fasce.at(-1);
    /* Si passa a dopo mezzanotte solo da una fascia serale (fine ≥ 18) a una del mattino presto (< 12). */
    if (prima && inizio < prima.fine && prima.fine >= 1080 && min(r.inizio) < 720) {
      giorno += 1440;
      inizio += 1440;
      fine += 1440;
    }
    if (fine <= inizio) fine += 1440;
    if (prima && inizio < prima.fine) return { errore: `Fascia ${i + 1}: si sovrappone alla precedente.` };
    if (fine - inizio > 6 * 60) return { errore: `Fascia ${i + 1}: dura più di 6 ore.` };
    if (fine > 1440 + 12 * 60) return { errore: `Fascia ${i + 1}: va oltre il mattino dopo.` };
    fasce.push({ inizio, fine });
  }
  return { fasce };
}

/* Lunedì della settimana che contiene `oggi`, a mezzanotte locale. */
export function lunedi(oggi: Date): Date {
  const d = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  d.setDate(d.getDate() - indiceSettimana(d));
  return d;
}

/* I 7 giorni da quel lunedì a domenica. */
export function giorniDellaSettimana(lun: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => new Date(lun.getFullYear(), lun.getMonth(), lun.getDate() + i));
}
