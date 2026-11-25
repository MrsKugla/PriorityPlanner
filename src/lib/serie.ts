/* Attività che si ripetono (Fase 6): quali occorrenze creare in una settimana. Puro: niente stato, niente archivio. */
import { chiaveData, festaDelGiorno, type Calendario } from "./fasce";
import type { Attivita, Serie } from "./dati.svelte";

const MS_SETTIMANA = 7 * 24 * 3600 * 1000;

const daChiave = (k: string): Date => {
  const [a, m, g] = k.split("-").map(Number);
  return new Date(a, m - 1, g);
};

/** Lunedì della settimana di `g`. */
function lunediDi(g: Date): Date {
  const d = new Date(g.getFullYear(), g.getMonth(), g.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

/** La settimana che inizia in `lun` conta per la serie? (dal lunedì di `inizio`, ogni `ogniSettimane`). */
function settimanaValida(s: Serie, lun: Date): boolean {
  const n = Math.round((lun.getTime() - lunediDi(daChiave(s.inizio)).getTime()) / MS_SETTIMANA);
  return n >= 0 && n % Math.max(1, s.ogniSettimane) === 0;
}

/** Le occorrenze da creare nei `giorni` di una settimana (lun…dom), dal giorno `daGiorno` (0 = lunedì).
    `esistenti` ha le chiavi `${serie}|${giornoSerie}` di tutte le attività con serie, saltate e fatte comprese. */
export function occorrenze(
  s: Serie, giorni: Date[], daGiorno: number, cal: Calendario, esistenti: Set<string>, creata: string = new Date().toISOString(),
): Attivita[] {
  if (s.inPausa || !giorni.length || !settimanaValida(s, giorni[0])) return [];
  const base = (giornoSerie: string): Attivita => ({
    id: crypto.randomUUID(), titolo: s.titolo, area: s.area, costi: { ...s.costi }, durata: s.durata,
    scadenza: null, orarioFisso: null, giornoPreferito: null, stato: "da-pianificare", creata, posto: null, motivo: null,
    serie: s.id, giornoSerie, soloGiorno: null,
  });
  const nuove: Attivita[] = [];

  if (s.tipo === "volte") {
    const lun = giorni[0];
    const fineSett = giorni[giorni.length - 1];
    if (chiaveData(fineSett) < s.inizio || (s.fine !== null && chiaveData(lun) > s.fine)) return [];
    for (let n = 1; n <= s.volte; n++) {
      const chiave = `${chiaveData(lun)}#${n}`;
      if (!esistenti.has(`${s.id}|${chiave}`)) nuove.push(base(chiave));
    }
    return nuove;
  }

  for (let i = Math.max(0, daGiorno); i < giorni.length; i++) {
    if (!s.giorni.includes(i)) continue;
    const g = giorni[i];
    const k = chiaveData(g);
    if (k < s.inizio || (s.fine !== null && k > s.fine)) continue;
    if (s.saltaFeste && festaDelGiorno(g, cal)) continue;
    if (esistenti.has(`${s.id}|${k}`)) continue;
    const a = base(k);
    if (s.ora !== null) {
      a.orarioFisso = { data: k, inizio: s.ora };
      a.stato = "in-settimana";
      a.posto = { data: k, inizio: s.ora, fine: s.ora + s.durata, bloccato: true, perche: "orario fisso" };
    } else a.soloGiorno = k;
    nuove.push(a);
  }
  return nuove;
}

const hhmm = (m: number): string => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** «18:00», «orario libero», «2× sett.», più « · ogni 2 sett.» se non è ogni settimana. */
export function testoSerie(s: Pick<Serie, "tipo" | "volte" | "ogniSettimane" | "ora">): string {
  const base = s.tipo === "volte" ? `${s.volte}× sett.` : s.ora === null ? "orario libero" : hhmm(s.ora);
  return s.ogniSettimane > 1 ? `${base} · ogni ${s.ogniSettimane} sett.` : base;
}
