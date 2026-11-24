/* Modello dati (A1, A2) e salvataggio. Nell'app Tauri i dati stanno in dati.json nella cartella dati dell'app
   (comandi Rust leggi_dati / scrivi_dati); nel browser di sviluppo in localStorage. */
import { invoke, isTauri } from "@tauri-apps/api/core";
import type { Area, Batteria } from "./energia";

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

export interface Dati {
  formato: 1;
  aggiornato: string;
  attivita: Attivita[];
  modelli: Modello[];
}

export const FORMATO = 1;
const CHIAVE_BROWSER = "priority-planner.dati.v1";
const AREE_VALIDE: readonly AreaId[] = ["lavoro", "famiglia", "amici", "salute", "casa", "me"];
const STATI_VALIDI: readonly StatoAttivita[] = ["da-pianificare", "in-settimana", "non-ci-sta", "fatta"];
const BATTERIE_IDS: readonly BatteriaId[] = ["mentale", "emotiva", "sociale", "sensoriale", "fisica"];

export const costiZero = (): Costi => ({ mentale: 0, emotiva: 0, sociale: 0, sensoriale: 0, fisica: 0 });
export const nuovoId = (): string => crypto.randomUUID();

function vuoti(): Dati {
  return { formato: FORMATO, aggiornato: new Date().toISOString(), attivita: [], modelli: [] };
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
  return { formato: FORMATO, aggiornato: typeof grezzi.aggiornato === "string" ? grezzi.aggiornato : new Date().toISOString(), attivita, modelli };
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

/* Le scritture vanno in fila: due modifiche rapide non si sovrappongono sul disco. */
let coda: Promise<void> = Promise.resolve();
function salva(): void {
  if (archivio.fase !== "pronto") return;
  archivio.dati.aggiornato = new Date().toISOString();
  const testo = JSON.stringify(archivio.dati, null, 2);
  coda = coda
    .then(() => (isTauri() ? invoke<void>("scrivi_dati", { contenuto: testo }) : localStorage.setItem(CHIAVE_BROWSER, testo)))
    .catch((e) => {
      archivio.errore = `Salvataggio non riuscito: ${String(e)}`;
    });
}

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
