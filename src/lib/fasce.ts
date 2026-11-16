/* Fasce orarie predefinite (revisione B1, Q7). Minuti dalla mezzanotte; 1440 = mezzanotte del giorno dopo. */

export type Fascia = { inizio: number; fine: number };

export const FASCE_FERIALI: readonly Fascia[] = [
  [420, 540], [540, 600], [600, 660], [660, 720], [720, 780], [780, 840], [840, 900],
  [900, 960], [960, 1020], [1020, 1080], [1080, 1200], [1200, 1320], [1320, 1440],
].map(([inizio, fine]) => ({ inizio, fine }));

/* L'ultima fascia festiva (0–3:30) esiste solo se il giorno dopo è anch'esso festivo. */
export const FASCE_FESTIVE: readonly Fascia[] = [
  [360, 480], [480, 600], [600, 720], [720, 840], [870, 960], [960, 1080], [1080, 1230], [1260, 1440], [1440, 1650],
].map(([inizio, fine]) => ({ inizio, fine }));

/* Fino alla Fase 2 (elenco «Feste e ferie») sono festivi solo sabato e domenica. */
export const festivo = (giorno: Date): boolean => giorno.getDay() === 0 || giorno.getDay() === 6;

export function fasceDelGiorno(giorno: Date): readonly Fascia[] {
  if (!festivo(giorno)) return FASCE_FERIALI;
  const domani = new Date(giorno);
  domani.setDate(giorno.getDate() + 1);
  return festivo(domani) ? FASCE_FESTIVE : FASCE_FESTIVE.slice(0, -1);
}

export function ora(minuti: number): string {
  const m = minuti % 1440;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}:${String(r).padStart(2, "0")}` : String(h);
}

export const etichetta = (f: Fascia): string => `${ora(f.inizio)}–${ora(f.fine)}`;

/* Lunedì della settimana che contiene `oggi`, a mezzanotte locale. */
export function lunedi(oggi: Date): Date {
  const d = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
