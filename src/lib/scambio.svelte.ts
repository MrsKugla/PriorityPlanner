/* Importa / Esporta (D4, C1–C6): un file JSON con tutti i dati, spostato a mano tra tablet, telefono e PC.
   Restano sul dispositivo stile, tema, filtro, schermata e il nome del dispositivo (localStorage). */
import { invoke, isTauri } from "@tauri-apps/api/core";
import { apriSettimana, archivio, leggiDati, salva, type Dati } from "./dati.svelte";
import { chiaveData } from "./fasce";
import { vista } from "./vista.svelte";

const CHIAVE_DISPOSITIVO = "priority-planner.dispositivo.v1";
const CHIAVE_BACKUP_BROWSER = "priority-planner.backup-importazione.v1";

export const dispositivo = $state({ nome: localStorage.getItem(CHIAVE_DISPOSITIVO) ?? "" });

export function salvaDispositivo(nome: string): void {
  dispositivo.nome = nome.trim();
  localStorage.setItem(CHIAVE_DISPOSITIVO, dispositivo.nome);
}

/** Il file esportato: tutto dati.json più chi, quando e con quale versione l'ha scritto. */
export type FileEsportato = Dati & { esportato: string; dispositivo: string; versioneApp: string };

/** «1.10.0» > «1.9.3». */
export function piuNuova(a: string, b: string): boolean {
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
}

const perNome = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9-]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "dispositivo";

/** Esporta tutto. Restituisce il nome del file salvato, o null se hai annullato. */
export async function esporta(): Promise<string | null> {
  const ora = new Date();
  const file: FileEsportato = {
    ...($state.snapshot(archivio.dati) as Dati),
    esportato: ora.toISOString(),
    dispositivo: dispositivo.nome,
    versioneApp: __APP_VERSION__,
  };
  const nome = `priority-planner_${chiaveData(ora)}_${perNome(dispositivo.nome)}.json`;
  const testo = JSON.stringify(file, null, 2);
  if (isTauri()) return invoke<string | null>("esporta_file", { nome, contenuto: testo });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([testo], { type: "application/json" }));
  a.download = nome;
  a.click();
  URL.revokeObjectURL(a.href);
  return nome;
}

/** Un file letto e controllato, pronto da confermare. */
export interface DaImportare {
  dati: Dati;
  esportato: string;
  dispositivo: string;
}

async function scegliFile(): Promise<string | null> {
  if (isTauri()) return invoke<string | null>("importa_file");
  // Il tsconfig non include ES2024, quindi niente Promise.withResolvers.
  return new Promise((risolvi) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = () => (input.files?.[0] ? input.files[0].text().then(risolvi) : risolvi(null));
    input.oncancel = () => risolvi(null);
    input.click();
  });
}

/** Apre la finestra «Apri file» e controlla il file. null = annullato; un errore ha già il testo per l'utente. */
export async function leggiFileDaImportare(): Promise<DaImportare | null> {
  const testo = await scegliFile();
  if (testo === null) return null;
  let grezzi: Record<string, unknown>;
  try {
    grezzi = JSON.parse(testo);
  } catch {
    throw new Error("Questo non è un file di Priority Planner.");
  }
  if (typeof grezzi.versioneApp === "string" && piuNuova(grezzi.versioneApp, __APP_VERSION__))
    throw new Error(`Il file viene dalla versione ${grezzi.versioneApp}, questa app è la ${__APP_VERSION__}. Aggiorna l'app su questo dispositivo, poi riprova.`);
  if (!Array.isArray(grezzi.attivita) || !Array.isArray(grezzi.ritmi)) throw new Error("Questo non è un file di Priority Planner.");
  let dati: Dati;
  try {
    dati = leggiDati(testo);
  } catch {
    throw new Error("Il file viene da una versione più nuova dell'app. Aggiorna l'app su questo dispositivo, poi riprova.");
  }
  return {
    dati,
    esportato: typeof grezzi.esportato === "string" ? grezzi.esportato : dati.aggiornato,
    dispositivo: typeof grezzi.dispositivo === "string" ? grezzi.dispositivo : "",
  };
}

function sostituisci(dati: Dati): void {
  archivio.dati = dati;
  salva();
  vista.tornate = apriSettimana();
}

/** Sostituisce tutti i dati, dopo una copia di quelli attuali in backup-importazione.json. */
export async function importa(f: DaImportare): Promise<void> {
  const copia = JSON.stringify($state.snapshot(archivio.dati), null, 2);
  if (isTauri()) await invoke("scrivi_backup", { contenuto: copia });
  else localStorage.setItem(CHIAVE_BACKUP_BROWSER, copia);
  sostituisci(f.dati);
}

/** La copia fatta prima dell'ultima importazione, o null se non c'è. */
export async function leggiBackup(): Promise<Dati | null> {
  const testo = isTauri() ? await invoke<string | null>("leggi_backup") : localStorage.getItem(CHIAVE_BACKUP_BROWSER);
  return testo ? leggiDati(testo) : null;
}

export function ripristinaBackup(dati: Dati): void {
  sostituisci(dati);
}
