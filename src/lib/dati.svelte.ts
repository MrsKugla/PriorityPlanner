/* Modello dati (A1, A2) e salvataggio. Nell'app Tauri i dati stanno in dati.json nella cartella dati dell'app
   (comandi Rust leggi_dati / scrivi_dati); nel browser di sviluppo in localStorage. */
import { invoke, isTauri } from "@tauri-apps/api/core";
import type { Area, Batteria } from "./energia";
import { FASCE_FERIALI, FASCE_FESTIVE, type Calendario, type Fascia, type Festa } from "./fasce";

export type BatteriaId = Batteria["id"];
export type AreaId = Area["id"];
/** Costo da 0 a 3 per ogni batteria. */
export type Costi = Record<BatteriaId, number>;
export type StatoAttivita = "da-pianificare" | "in-settimana" | "non-ci-sta" | "fatta";

export interface OrarioFisso {
  /** Giorno in formato AAAA-MM-GG. */
  data: string;
  /** Minuti dalla mezzanotte. */
  inizio: number;
}

export interface Attivita {
  id: string;
  titolo: string;
  area: AreaId;
  costi: Costi;
  /** Minuti. */
  durata: number;
  /** AAAA-MM-GG oppure null. */
  scadenza: string | null;
  orarioFisso: OrarioFisso | null;
  /** 0 = lunedì … 6 = domenica, oppure null. */
  giornoPreferito: number | null;
  stato: StatoAttivita;
  creata: string;
}

/** Un modello compila i campi di una nuova attività (es. «Telefonata medico»). */
export interface Modello {
  id: string;
  nome: string;
  titolo: string;
  area: AreaId;
  costi: Costi;
  durata: number;
}

/** Un ritmo (B3, B6): livello 0–3 per colonna (lun…dom) × fascia × batteria, più i totali del giorno corretti a mano. */
export interface Ritmo {
  id: string;
  nome: string;
  /** 7 colonne; lun–ven seguono le fasce feriali, sab–dom le festive (stessa lunghezza). */
  livelli: Costi[][];
  /** Per colonna: totale scelto a mano per una batteria; assente = automatico (40%). */
  totali: Partial<Costi>[];
}

export interface Dati extends Calendario {
  formato: 1;
  aggiornato: string;
  attivita: Attivita[];
  modelli: Modello[];
  ritmi: Ritmo[];
  /** Lunedì della settimana (AAAA-MM-GG) → id del ritmo scelto; assente = il primo ritmo. */
  settimane: Record<string, string>;
}

export const FORMATO = 1;
const CHIAVE_BROWSER = "priority-planner.dati.v1";
const AREE_VALIDE: readonly AreaId[] = ["lavoro", "famiglia", "amici", "salute", "casa", "me"];
const STATI_VALIDI: readonly StatoAttivita[] = ["da-pianificare", "in-settimana", "non-ci-sta", "fatta"];
export const BATTERIE_IDS: readonly BatteriaId[] = ["mentale", "emotiva", "sociale", "sensoriale", "fisica"];

export const costiZero = (): Costi => ({ mentale: 0, emotiva: 0, sociale: 0, sensoriale: 0, fisica: 0 });
export const nuovoId = (): string => crypto.randomUUID();
const costiUguali = (n: number): Costi => ({ mentale: n, emotiva: n, sociale: n, sensoriale: n, fisica: n });

/* Un ritmo nuovo parte con tutte le fasce a livello 2: abbastanza per provare il bottone, da colorare poi. */
function ritmoBase(nome: string, cal: Calendario): Ritmo {
  return {
    id: nuovoId(),
    nome,
    livelli: Array.from({ length: 7 }, (_, c) => (c < 5 ? cal.fasce.feriali : cal.fasce.festive).map(() => costiUguali(2))),
    totali: Array.from({ length: 7 }, () => ({})),
  };
}

/* Dopo un cambio delle fasce, ogni colonna ha tante righe quante fasce: si tengono le prime, le nuove partono da 2. */
function adattaRitmo(r: Ritmo, cal: Calendario): void {
  for (let c = 0; c < 7; c++) {
    const n = (c < 5 ? cal.fasce.feriali : cal.fasce.festive).length;
    const col = (r.livelli[c] ?? []).slice(0, n);
    while (col.length < n) col.push(costiUguali(2));
    r.livelli[c] = col;
    r.totali[c] ??= {};
  }
  r.livelli.length = 7;
  r.totali.length = 7;
}

function vuoti(): Dati {
  const cal: Calendario = { fasce: { feriali: [...FASCE_FERIALI], festive: [...FASCE_FESTIVE] }, feste: [] };
  return { formato: FORMATO, aggiornato: new Date().toISOString(), attivita: [], modelli: [], ...cal, ritmi: [ritmoBase("Normale", cal)], settimane: {} };
}

/* Controlla e ripulisce un file letto dal disco: un campo strano diventa il suo valore neutro, invece di rompere l'app. */
const livello = (n: unknown): number => (typeof n === "number" && Number.isFinite(n) ? Math.min(3, Math.max(0, Math.round(n))) : 0);
const data = (s: unknown): string | null => (typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
function costi(c: unknown): Costi {
  const r = costiZero();
  if (c && typeof c === "object") for (const b of BATTERIE_IDS) r[b] = livello((c as Record<string, unknown>)[b]);
  return r;
}
const area = (a: unknown): AreaId => (AREE_VALIDE.includes(a as AreaId) ? (a as AreaId) : "me");
const durata = (d: unknown): number => (typeof d === "number" && d >= 5 ? Math.round(d) : 30);

export function leggiDati(testo: string): Dati {
  const grezzi = JSON.parse(testo) as Record<string, unknown>;
  if (grezzi.formato !== FORMATO) throw new Error(`Formato dei dati sconosciuto: ${String(grezzi.formato)}`);
  const attivita = (Array.isArray(grezzi.attivita) ? grezzi.attivita : []).map((g: Record<string, unknown>): Attivita => {
    const of = g.orarioFisso as Record<string, unknown> | null;
    const dataFissa = of ? data(of.data) : null;
    return {
      id: typeof g.id === "string" ? g.id : nuovoId(),
      titolo: typeof g.titolo === "string" ? g.titolo : "",
      area: area(g.area),
      costi: costi(g.costi),
      durata: durata(g.durata),
      scadenza: data(g.scadenza),
      orarioFisso: of && dataFissa && typeof of.inizio === "number" ? { data: dataFissa, inizio: of.inizio } : null,
      giornoPreferito: typeof g.giornoPreferito === "number" && g.giornoPreferito >= 0 && g.giornoPreferito <= 6 ? g.giornoPreferito : null,
      stato: STATI_VALIDI.includes(g.stato as StatoAttivita) ? (g.stato as StatoAttivita) : "da-pianificare",
      creata: typeof g.creata === "string" ? g.creata : new Date().toISOString(),
    };
  });
  const modelli = (Array.isArray(grezzi.modelli) ? grezzi.modelli : []).map((g: Record<string, unknown>): Modello => ({
    id: typeof g.id === "string" ? g.id : nuovoId(),
    nome: typeof g.nome === "string" ? g.nome : "Modello",
    titolo: typeof g.titolo === "string" ? g.titolo : "",
    area: area(g.area),
    costi: costi(g.costi),
    durata: durata(g.durata),
  }));
  const base = vuoti();
  const leggiFasceSalvate = (l: unknown, predefinite: Fascia[]): Fascia[] => {
    if (!Array.isArray(l) || !l.length) return predefinite;
    const ok = l.every((f) => f && typeof f.inizio === "number" && typeof f.fine === "number" && f.fine > f.inizio);
    return ok ? l.map((f) => ({ inizio: f.inizio, fine: f.fine })) : predefinite;
  };
  const fasceGrezze = (grezzi.fasce ?? {}) as Record<string, unknown>;
  const cal: Calendario = {
    fasce: { feriali: leggiFasceSalvate(fasceGrezze.feriali, base.fasce.feriali), festive: leggiFasceSalvate(fasceGrezze.festive, base.fasce.festive) },
    feste: (Array.isArray(grezzi.feste) ? grezzi.feste : []).flatMap((g: Record<string, unknown>): Festa[] => {
      const dal = data(g.dal);
      const al = data(g.al) ?? dal;
      return dal && al ? [{ id: typeof g.id === "string" ? g.id : nuovoId(), dal, al: al < dal ? dal : al, nome: typeof g.nome === "string" ? g.nome : "" }] : [];
    }),
  };
  const ritmi = (Array.isArray(grezzi.ritmi) ? grezzi.ritmi : []).map((g: Record<string, unknown>): Ritmo => {
    const r: Ritmo = {
      id: typeof g.id === "string" ? g.id : nuovoId(),
      nome: typeof g.nome === "string" ? g.nome : "Ritmo",
      livelli: (Array.isArray(g.livelli) ? g.livelli : []).map((col: unknown) => (Array.isArray(col) ? col.map(costi) : [])),
      totali: (Array.isArray(g.totali) ? g.totali : []).map((t: unknown) => {
        const r: Partial<Costi> = {};
        if (t && typeof t === "object") for (const b of BATTERIE_IDS) {
          const v = (t as Record<string, unknown>)[b];
          if (typeof v === "number" && v >= 0) r[b] = Math.round(v);
        }
        return r;
      }),
    };
    adattaRitmo(r, cal);
    return r;
  });
  const settimane: Record<string, string> = {};
  if (grezzi.settimane && typeof grezzi.settimane === "object")
    for (const [k, v] of Object.entries(grezzi.settimane)) if (data(k) && typeof v === "string") settimane[k] = v;
  return {
    formato: FORMATO,
    aggiornato: typeof grezzi.aggiornato === "string" ? grezzi.aggiornato : new Date().toISOString(),
    attivita,
    modelli,
    ...cal,
    ritmi: ritmi.length ? ritmi : [ritmoBase("Normale", cal)],
    settimane,
  };
}

type Caricamento = "carico" | "pronto" | "errore";

/* Stato condiviso. `errore` blocca il salvataggio: un file illeggibile non viene mai sovrascritto. */
export const archivio = $state<{ fase: Caricamento; errore: string; dati: Dati }>({ fase: "carico", errore: "", dati: vuoti() });

export async function carica(): Promise<void> {
  try {
    const testo = isTauri() ? await invoke<string | null>("leggi_dati") : localStorage.getItem(CHIAVE_BROWSER);
    archivio.dati = testo ? leggiDati(testo) : vuoti();
    archivio.fase = "pronto";
  } catch (e) {
    archivio.errore = String(e);
    archivio.fase = "errore";
  }
}

/* Le scritture vanno in fila e si raccolgono per 250 ms: una pennellata trascinata su 20 caselle scrive una volta sola. */
let coda: Promise<void> = Promise.resolve();
let attesa: number | undefined;
function scrivi(): void {
  attesa = undefined;
  archivio.dati.aggiornato = new Date().toISOString();
  const testo = JSON.stringify(archivio.dati, null, 2);
  coda = coda
    .then(() => (isTauri() ? invoke<void>("scrivi_dati", { contenuto: testo }) : localStorage.setItem(CHIAVE_BROWSER, testo)))
    .catch((e) => {
      archivio.errore = `Salvataggio non riuscito: ${String(e)}`;
    });
}
export function salva(): void {
  if (archivio.fase !== "pronto") return;
  clearTimeout(attesa);
  attesa = window.setTimeout(scrivi, 250);
}
/* Chiudere l'app subito dopo una modifica non deve perderla. */
addEventListener("pagehide", () => {
  if (attesa !== undefined) {
    clearTimeout(attesa);
    scrivi();
  }
});

export function salvaAttivita(a: Attivita): void {
  const i = archivio.dati.attivita.findIndex((x) => x.id === a.id);
  if (i >= 0) archivio.dati.attivita[i] = a;
  else archivio.dati.attivita.push(a);
  salva();
}

export function eliminaAttivita(id: string): void {
  archivio.dati.attivita = archivio.dati.attivita.filter((a) => a.id !== id);
  salva();
}

export function segnaFatta(id: string, fatta: boolean): void {
  const a = archivio.dati.attivita.find((x) => x.id === id);
  if (!a) return;
  a.stato = fatta ? "fatta" : "da-pianificare";
  salva();
}

export function salvaModello(m: Modello): void {
  const i = archivio.dati.modelli.findIndex((x) => x.nome.toLowerCase() === m.nome.toLowerCase());
  if (i >= 0) archivio.dati.modelli[i] = { ...m, id: archivio.dati.modelli[i].id };
  else archivio.dati.modelli.push(m);
  salva();
}

export function eliminaModello(id: string): void {
  archivio.dati.modelli = archivio.dati.modelli.filter((m) => m.id !== id);
  salva();
}

/* ---------- Ritmi (B3, B6) ---------- */

/** Il ritmo della settimana che inizia in quel lunedì (AAAA-MM-GG); senza scelta, il primo. */
export function ritmoDellaSettimana(lunediChiave: string): Ritmo {
  const d = archivio.dati;
  return d.ritmi.find((r) => r.id === d.settimane[lunediChiave]) ?? d.ritmi[0];
}

export function scegliRitmo(lunediChiave: string, id: string): void {
  archivio.dati.settimane[lunediChiave] = id;
  salva();
}

/** Un ritmo nuovo parte da una copia di uno esistente (B6). */
export function copiaRitmo(da: Ritmo, nome: string): Ritmo {
  const r: Ritmo = { id: nuovoId(), nome, livelli: $state.snapshot(da.livelli), totali: $state.snapshot(da.totali) };
  archivio.dati.ritmi.push(r);
  salva();
  return archivio.dati.ritmi.at(-1)!;
}

export function eliminaRitmo(id: string): void {
  if (archivio.dati.ritmi.length < 2) return;
  archivio.dati.ritmi = archivio.dati.ritmi.filter((r) => r.id !== id);
  for (const [k, v] of Object.entries(archivio.dati.settimane)) if (v === id) delete archivio.dati.settimane[k];
  salva();
}

/** «Copia lunedì su mar–ven»: livelli e totali corretti a mano. */
export function copiaLunedi(r: Ritmo): void {
  for (let c = 1; c < 5; c++) {
    r.livelli[c] = r.livelli[0].map((x) => ({ ...x }));
    r.totali[c] = { ...r.totali[0] };
  }
  salva();
}

/* ---------- Fasce e feste (B1, B2) ---------- */

export function salvaFasce(feriali: Fascia[], festive: Fascia[]): void {
  archivio.dati.fasce = { feriali, festive };
  for (const r of archivio.dati.ritmi) adattaRitmo(r, archivio.dati);
  salva();
}

export function ripristinaFasce(): void {
  salvaFasce([...FASCE_FERIALI], [...FASCE_FESTIVE]);
}

export function aggiungiFesta(dal: string, al: string, nome: string): void {
  archivio.dati.feste.push({ id: nuovoId(), dal, al: al < dal ? dal : al, nome: nome.trim() });
  archivio.dati.feste.sort((a, b) => a.dal.localeCompare(b.dal));
  salva();
}

export function eliminaFesta(id: string): void {
  archivio.dati.feste = archivio.dati.feste.filter((f) => f.id !== id);
  salva();
}
