/* Modello dati (A1, A2) e salvataggio. Nell'app Tauri i dati stanno in dati.json nella cartella dati dell'app
   (comandi Rust leggi_dati / scrivi_dati); nel browser di sviluppo in localStorage. */
import { invoke, isTauri } from "@tauri-apps/api/core";
import type { Area, Batteria } from "./energia";
import {
  chiaveData, colonnaRitmo, FASCE_FERIALI, FASCE_FESTIVE, fasceDelGiorno, fasceDellaColonna, giorniDellaSettimana, indiceSettimana,
  lunedi, totaleAuto, type Calendario, type Fascia, type Festa,
} from "./fasce";
import { proponi, type GiornoPiano } from "./pianificatore";
import { occorrenze } from "./serie";

export type BatteriaId = Batteria["id"];
export type AreaId = Area["id"];
/** Costo da 0 a 3 per ogni batteria. */
export type Costi = Record<BatteriaId, number>;
export type StatoAttivita = "da-pianificare" | "in-settimana" | "non-ci-sta" | "fatta" | "saltata";
/** Check-in del giorno (B5, A4): 🙂 bene, 😐 così così, 😣 Giorno no. */
export type Umore = "bene" | "cosi" | "no";

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
  /** Dove sta nella settimana; null = da pianificare o non ci sta. */
  posto: Posto | null;
  /** Perché non ci sta (es. «gio–ven: 💪 finita»); null altrimenti. */
  motivo: string | null;
  /** Id della serie di cui è un'occorrenza; null per le attività normali. */
  serie: string | null;
  /** «2026-11-24» (giorni) o «2026-11-23#2» (volte: lunedì#n); null per le normali. */
  giornoSerie: string | null;
  /** Giorni con ora libera: il pianificatore la mette solo in quel giorno (AAAA-MM-GG). */
  soloGiorno: string | null;
}

/** Un'attività che si ripete (Fase 6). */
export interface Serie {
  id: string;
  titolo: string;
  area: AreaId;
  costi: Costi;
  durata: number;
  /** Giorni precisi oppure N volte a settimana. */
  tipo: "giorni" | "volte";
  /** 0 = lunedì … 6 = domenica; usato con tipo «giorni». */
  giorni: number[];
  /** 1–7; usato con tipo «volte». */
  volte: number;
  /** 1–4; conta dalle settimane da lunedi(inizio). */
  ogniSettimane: number;
  /** Minuti dalla mezzanotte; null = orario libero; solo con tipo «giorni». */
  ora: number | null;
  inizio: string;
  /** Ultimo giorno incluso. */
  fine: string | null;
  inPausa: boolean;
  saltaFeste: boolean;
  recupera: boolean;
  creata: string;
}

/** Il posto di un'attività in un giorno. Minuti dalla mezzanotte di `data` (≥ 1440 = dopo mezzanotte). */
export interface Posto {
  data: string;
  inizio: number;
  fine: number;
  /** true = confermata o spostata a mano (bordo pieno, 🔒); false = proposta (tratteggiata). */
  bloccato: boolean;
  /** «Perché qui» in una riga. */
  perche: string;
}

/** Regole del bottone (A3, B4). */
export interface Regole {
  /** Minuti liberi dopo un'attività con un costo 3: 0, 15 o 30. */
  cuscinetto: number;
  /** Massimo di attività pesanti emotive o sociali al giorno. */
  maxPesanti: number;
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
  regole: Regole;
  /** Lunedì dell'ultima settimana aperta: serve a riportare le attività non fatte (B8). */
  ultimaSettimana: string;
  /** Data → check-in scelto; assente = 🙂. */
  checkin: Record<string, Umore>;
  /** Data → quanto scende ogni batteria quel giorno (A1). Il ritmo non cambia. */
  cali: Record<string, Partial<Costi>>;
  /** Attività che si ripetono (Fase 6). */
  serie: Serie[];
}

export const FORMATO = 1;
const CHIAVE_BROWSER = "priority-planner.dati.v1";
const AREE_VALIDE: readonly AreaId[] = ["lavoro", "famiglia", "amici", "salute", "casa", "me"];
const STATI_VALIDI: readonly StatoAttivita[] = ["da-pianificare", "in-settimana", "non-ci-sta", "fatta", "saltata"];
export const BATTERIE_IDS: readonly BatteriaId[] = ["mentale", "emotiva", "sociale", "sensoriale", "fisica"];

export const costiZero = (): Costi => ({ mentale: 0, emotiva: 0, sociale: 0, sensoriale: 0, fisica: 0 });
export const nuovoId = (): string => crypto.randomUUID();
const costiUguali = (n: number): Costi => ({ mentale: n, emotiva: n, sociale: n, sensoriale: n, fisica: n });

/* Un ritmo nuovo parte con tutte le fasce a livello 3: ogni attività può entrare finché non colori dove hai meno energia
   (con livello 2 ovunque un'attività con un costo 3 non entrerebbe mai). Il totale del giorno limita comunque il carico. */
const LIVELLO_INIZIALE = 3;
function ritmoBase(nome: string, cal: Calendario): Ritmo {
  return {
    id: nuovoId(),
    nome,
    livelli: Array.from({ length: 7 }, (_, c) => (c < 5 ? cal.fasce.feriali : cal.fasce.festive).map(() => costiUguali(LIVELLO_INIZIALE))),
    totali: Array.from({ length: 7 }, () => ({})),
  };
}

/* Dopo un cambio delle fasce, ogni colonna ha tante righe quante fasce: si tengono le prime, le nuove partono dal livello iniziale. */
function adattaRitmo(r: Ritmo, cal: Calendario): void {
  for (let c = 0; c < 7; c++) {
    const n = (c < 5 ? cal.fasce.feriali : cal.fasce.festive).length;
    const col = (r.livelli[c] ?? []).slice(0, n);
    while (col.length < n) col.push(costiUguali(LIVELLO_INIZIALE));
    r.livelli[c] = col;
    r.totali[c] ??= {};
  }
  r.livelli.length = 7;
  r.totali.length = 7;
}

function vuoti(): Dati {
  const cal: Calendario = { fasce: { feriali: [...FASCE_FERIALI], festive: [...FASCE_FESTIVE] }, feste: [] };
  return {
    formato: FORMATO, aggiornato: new Date().toISOString(), attivita: [], modelli: [], ...cal,
    ritmi: [ritmoBase("Normale", cal)], settimane: {}, regole: { ...REGOLE_PREDEFINITE }, ultimaSettimana: "", checkin: {}, cali: {}, serie: [],
  };
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
export const REGOLE_PREDEFINITE: Regole = { cuscinetto: 15, maxPesanti: 1 };
function leggiRegole(r: unknown): Regole {
  const g = (r ?? {}) as Record<string, unknown>;
  return {
    cuscinetto: g.cuscinetto === 0 || g.cuscinetto === 15 || g.cuscinetto === 30 ? g.cuscinetto : REGOLE_PREDEFINITE.cuscinetto,
    maxPesanti: typeof g.maxPesanti === "number" && g.maxPesanti >= 0 && g.maxPesanti <= 9 ? Math.round(g.maxPesanti) : REGOLE_PREDEFINITE.maxPesanti,
  };
}
function leggiPosto(p: unknown): Posto | null {
  const g = p as Record<string, unknown> | null;
  const giorno = g ? data(g.data) : null;
  if (!g || !giorno || typeof g.inizio !== "number" || typeof g.fine !== "number" || g.fine <= g.inizio) return null;
  return { data: giorno, inizio: g.inizio, fine: g.fine, bloccato: g.bloccato === true, perche: typeof g.perche === "string" ? g.perche : "" };
}
function leggiSerie(g: Record<string, unknown>): Serie {
  const intero = (n: unknown, min: number, max: number): number =>
    typeof n === "number" && Number.isFinite(n) && Math.round(n) >= min && Math.round(n) <= max ? Math.round(n) : min;
  const giorni = [...new Set((Array.isArray(g.giorni) ? g.giorni : []).filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= 6))].sort((x, y) => x - y);
  const tipo = g.tipo === "volte" ? "volte" : "giorni";
  return {
    id: typeof g.id === "string" ? g.id : nuovoId(),
    titolo: typeof g.titolo === "string" ? g.titolo : "",
    area: area(g.area),
    costi: costi(g.costi),
    durata: durata(g.durata),
    tipo,
    giorni,
    volte: intero(g.volte, 1, 7),
    ogniSettimane: intero(g.ogniSettimane, 1, 4),
    ora: tipo === "giorni" && typeof g.ora === "number" && Number.isFinite(g.ora) ? g.ora : null,
    inizio: data(g.inizio) ?? chiaveData(new Date()),
    fine: data(g.fine),
    inPausa: g.inPausa === true,
    saltaFeste: g.saltaFeste === true,
    recupera: g.recupera === true,
    creata: typeof g.creata === "string" ? g.creata : new Date().toISOString(),
  };
}

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
      posto: leggiPosto(g.posto),
      motivo: typeof g.motivo === "string" ? g.motivo : null,
      serie: typeof g.serie === "string" ? g.serie : null,
      giornoSerie: typeof g.giornoSerie === "string" ? g.giornoSerie : null,
      soloGiorno: data(g.soloGiorno),
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
    serie: (Array.isArray(grezzi.serie) ? grezzi.serie : []).map(leggiSerie),
    aggiornato: typeof grezzi.aggiornato === "string" ? grezzi.aggiornato : new Date().toISOString(),
    attivita,
    modelli,
    ...cal,
    ritmi: ritmi.length ? ritmi : [ritmoBase("Normale", cal)],
    settimane,
    regole: leggiRegole(grezzi.regole),
    ultimaSettimana: data(grezzi.ultimaSettimana) ?? "",
    checkin: leggiCheckin(grezzi.checkin),
    cali: leggiCali(grezzi.cali),
  };
}

const UMORI: readonly Umore[] = ["bene", "cosi", "no"];
function leggiCheckin(c: unknown): Record<string, Umore> {
  const r: Record<string, Umore> = {};
  if (c && typeof c === "object") for (const [k, v] of Object.entries(c)) if (data(k) && UMORI.includes(v as Umore)) r[k] = v as Umore;
  return r;
}
function leggiCali(c: unknown): Record<string, Partial<Costi>> {
  const r: Record<string, Partial<Costi>> = {};
  if (c && typeof c === "object")
    for (const [k, v] of Object.entries(c)) {
      if (!data(k) || !v || typeof v !== "object") continue;
      const calo: Partial<Costi> = {};
      for (const b of BATTERIE_IDS) {
        const n = (v as Record<string, unknown>)[b];
        if (typeof n === "number" && n > 0) calo[b] = livello(n);
      }
      r[k] = calo;
    }
  return r;
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
  a.stato = fatta ? "fatta" : a.posto ? "in-settimana" : "da-pianificare";
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

/* ---------- Settimana e «Proponi settimana» (B4, B5, B8) ---------- */

/** Prepara i giorni per il pianificatore: fasce del giorno, livelli e totale dalla colonna del ritmo della settimana,
    meno il calo di quel giorno (A1), mai sotto 0. */
export function giorniPiano(giorni: readonly Date[], ritmo: Ritmo): GiornoPiano[] {
  const d = archivio.dati;
  return giorni.map((g) => {
    const chiave = chiaveData(g);
    const calo = d.cali[chiave] ?? {};
    const meno = (x: Costi): Costi => {
      const r = { ...x };
      for (const b of BATTERIE_IDS) r[b] = Math.max(0, r[b] - (calo[b] ?? 0));
      return r;
    };
    const fasce = fasceDelGiorno(g, d);
    const c = colonnaRitmo(g, d);
    const livelli = fasce.map((_, i) => meno(ritmo.livelli[c][i]));
    const visibili = fasceDellaColonna(c, d).map((_, i) => ritmo.livelli[c][i]);
    const totale = costiZero();
    for (const b of BATTERIE_IDS) totale[b] = ritmo.totali[c][b] ?? totaleAuto(visibili.map((x) => x[b]));
    return { chiave, fasce, livelli, totale: meno(totale) };
  });
}

/** Minuti dalla mezzanotte. */
export const minutiDi = (t: Date): number => t.getHours() * 60 + t.getMinutes();

/** Applica la proposta da `daGiorno` (oggi) a domenica; oggi il tempo libero parte da `adesso` (minuti).
    Restituisce quante attività non ci stanno. */
export function proponiSettimana(giorni: readonly Date[], daGiorno: number, ritmo: Ritmo, adesso = 0): number {
  const esiti = proponi(giorniPiano(giorni, ritmo), daGiorno, $state.snapshot(archivio.dati.attivita) as Attivita[], archivio.dati.regole, adesso);
  let fuori = 0;
  for (const a of archivio.dati.attivita) {
    const e = esiti.get(a.id);
    if (!e) continue;
    if (e.tipo === "posto") {
      a.posto = { data: e.data, inizio: e.inizio, fine: e.fine, bloccato: e.bloccato, perche: e.perche };
      a.stato = "in-settimana";
      a.motivo = null;
    } else {
      a.posto = null;
      a.stato = "non-ci-sta";
      a.motivo = e.motivo;
      fuori++;
    }
  }
  salva();
  return fuori;
}

/* ---------- Check-in e Giorno no (B5, A1–A4) ---------- */

const CALI: Record<Umore, Partial<Costi>> = {
  bene: {},
  cosi: { mentale: 1, emotiva: 1 },
  no: { mentale: 1, emotiva: 1, sociale: 1, sensoriale: 1, fisica: 1 },
};

export const umoreDi = (chiave: string): Umore => archivio.dati.checkin[chiave] ?? "bene";

/** Cambia il check-in di oggi e ricalcola da adesso a domenica. Entrando in 😣 o uscendone si sbloccano
    le attività di oggi non ancora iniziate (non gli orari fissi); altrimenti si ricalcolano solo le proposte.
    Restituisce quante attività non ci stanno, o -1 se non è cambiato niente. */
export function cambiaCheckin(umore: Umore, ora = new Date()): number {
  const d = archivio.dati;
  const chiave = chiaveData(ora);
  const prima = umoreDi(chiave);
  if (prima === umore) return -1;
  const adesso = minutiDi(ora);
  if (umore === "bene") {
    delete d.checkin[chiave];
    delete d.cali[chiave];
  } else {
    d.checkin[chiave] = umore;
    d.cali[chiave] = { ...CALI[umore] };
  }
  if (prima === "no" || umore === "no")
    for (const a of d.attivita)
      if (a.posto?.data === chiave && a.stato !== "fatta" && !a.orarioFisso && a.posto.inizio >= adesso) a.posto.bloccato = false;
  const lun = lunedi(ora);
  return proponiSettimana(giorniDellaSettimana(lun), indiceSettimana(ora), ritmoDellaSettimana(chiaveData(lun)), adesso);
}

/** «Accetta tutte»: blocca le proposte di questi giorni. */
export function bloccaTutte(chiavi: readonly string[]): void {
  for (const a of archivio.dati.attivita) if (a.posto && chiavi.includes(a.posto.data)) a.posto.bloccato = true;
  salva();
}

export function cambiaBlocco(id: string): void {
  const a = archivio.dati.attivita.find((x) => x.id === id);
  if (!a?.posto) return;
  a.posto.bloccato = !a.posto.bloccato;
  salva();
}

/** Spostata a mano: resta lì (bloccata) anche con una nuova proposta. */
export function sposta(id: string, data: string, inizio: number): void {
  const a = archivio.dati.attivita.find((x) => x.id === id);
  if (!a) return;
  a.posto = { data, inizio, fine: inizio + a.durata, bloccato: true, perche: "messa qui da te" };
  if (a.stato !== "fatta") a.stato = "in-settimana";
  a.motivo = null;
  salva();
}

export function togliDallaSettimana(id: string): void {
  const a = archivio.dati.attivita.find((x) => x.id === id);
  if (!a) return;
  a.posto = null;
  a.motivo = null;
  a.stato = "da-pianificare";
  salva();
}

export function salvaRegole(r: Regole): void {
  archivio.dati.regole = r;
  salva();
}

/* Un'occorrenza di serie «da oggi in poi»: i giorni precisi dal giorno stesso, le «volte» dal lunedì di questa settimana. */
const dallOggi = (a: Attivita, ora: Date): boolean => {
  const g = a.giornoSerie;
  if (!g) return false;
  return g.slice(0, 10) >= (g.includes("#") ? chiaveData(lunedi(ora)) : chiaveData(ora));
};

/** La serie di un'occorrenza, se esiste ancora; undefined = attività normale (niente ↻). */
export function serieDi(a: Attivita): Serie | undefined {
  return a.serie ? archivio.dati.serie.find((s) => s.id === a.serie) : undefined;
}

/** Crea le occorrenze mancanti della settimana che inizia in `lun`, dal giorno `daGiorno`. Idempotente. */
export function generaOccorrenze(lun: Date, daGiorno: number): void {
  const d = archivio.dati;
  const esistenti = new Set<string>();
  for (const a of d.attivita) if (a.serie && a.giornoSerie) esistenti.add(`${a.serie}|${a.giornoSerie}`);
  const giorni = giorniDellaSettimana(lun);
  const nuove = d.serie.flatMap((s) => occorrenze(s, giorni, daGiorno, d, esistenti));
  if (!nuove.length) return;
  d.attivita.push(...nuove);
  salva();
}

export function salvaSerie(s: Serie, ambito: "nuova" | "prossime", ora = new Date()): void {
  const d = archivio.dati;
  const i = d.serie.findIndex((x) => x.id === s.id);
  if (i >= 0) d.serie[i] = s;
  else d.serie.push(s);
  if (ambito === "prossime") {
    const bloccata = (a: Attivita): boolean => !!a.posto && a.posto.bloccato && a.posto.perche !== "orario fisso";
    d.attivita = d.attivita.filter((a) => a.serie !== s.id || !dallOggi(a, ora) || a.stato === "fatta" || a.stato === "saltata" || bloccata(a));
    for (const a of d.attivita) {
      if (a.serie !== s.id || a.stato === "fatta" || !dallOggi(a, ora)) continue;
      a.titolo = s.titolo;
      a.area = s.area;
      a.costi = { ...s.costi };
      a.durata = s.durata;
      if (a.posto) a.posto.fine = a.posto.inizio + a.durata;
    }
  }
  generaOccorrenze(lunedi(ora), indiceSettimana(ora));
  salva();
}

export function eliminaSerie(id: string, ora = new Date()): void {
  const d = archivio.dati;
  d.serie = d.serie.filter((s) => s.id !== id);
  d.attivita = d.attivita.filter((a) => a.serie !== id || a.stato === "fatta" || !dallOggi(a, ora));
  for (const a of d.attivita) {
    if (a.serie !== id || a.stato === "fatta") continue;
    a.serie = null;
    a.giornoSerie = null;
    a.soloGiorno = null;
  }
  salva();
}

export function saltaOccorrenza(id: string): void {
  const a = archivio.dati.attivita.find((x) => x.id === id);
  if (!a) return;
  a.stato = "saltata";
  a.posto = null;
  a.motivo = null;
  salva();
}

export function ripristinaOccorrenza(id: string): void {
  const a = archivio.dati.attivita.find((x) => x.id === id);
  if (!a) return;
  a.motivo = null;
  if (a.orarioFisso) {
    const { data, inizio } = a.orarioFisso;
    a.stato = "in-settimana";
    a.posto = { data, inizio, fine: inizio + a.durata, bloccato: true, perche: "orario fisso" };
  } else {
    a.stato = "da-pianificare";
    a.posto = null;
  }
  salva();
}

/** Fine settimana (B8): le non fatte delle settimane passate e quelle in «Non ci sta» tornano da pianificare.
    Le occorrenze di serie scadute tornano solo se la serie recupera, altrimenti sono saltate.
    L'app non cancella niente. Restituisce quante attività sono tornate. */
export function apriSettimana(ora = new Date()): number {
  const d = archivio.dati;
  const lun = lunedi(ora);
  const chiave = chiaveData(lun);
  if (d.ultimaSettimana === chiave) {
    generaOccorrenze(lun, indiceSettimana(ora));
    return 0;
  }
  let tornate = 0;
  for (const a of d.attivita) {
    if (a.stato === "fatta" || a.stato === "saltata") continue;
    const s = serieDi(a);
    if (s && a.giornoSerie && a.giornoSerie.slice(0, 10) < chiave) {
      a.posto = null;
      a.motivo = null;
      if (s.recupera) {
        a.soloGiorno = null;
        a.orarioFisso = null;
        a.stato = "da-pianificare";
        tornate++;
      } else a.stato = "saltata";
      continue;
    }
    const passata = a.posto && a.posto.data < chiave;
    if (passata || a.stato === "non-ci-sta") {
      a.posto = null;
      a.motivo = null;
      a.stato = "da-pianificare";
      tornate++;
    }
  }
  const primaVolta = !d.ultimaSettimana;
  d.ultimaSettimana = chiave;
  generaOccorrenze(lun, 0);
  salva();
  return primaVolta ? 0 : tornate;
}
