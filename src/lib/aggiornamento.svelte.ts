/* Aggiornamenti: all'avvio l'app guarda l'ultima release su GitHub.
   Windows: plugin updater di Tauri (pacchetto firmato, verificato con la chiave pubblica in tauri.conf.json).
   Android: il plugin non esiste; si legge la release dall'API di GitHub e si apre il link dell'APK. */
import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";

const REPO = "MrsKugla/PriorityPlanner";
const android = /Android/i.test(navigator.userAgent);

type Stato =
  | { fase: "nessuno" }
  | { fase: "disponibile"; versione: string; installa: () => Promise<void> }
  | { fase: "scarico"; versione: string; percento: number | null }
  | { fase: "errore"; versione: string; messaggio: string };

export const aggiornamento = $state<{ stato: Stato }>({ stato: { fase: "nessuno" } });

/* true se `a` è una versione SemVer più nuova di `b` (solo MAJOR.MINOR.PATCH). */
export function piuNuova(a: string, b: string): boolean {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  return false;
}

async function controllaWindows(): Promise<void> {
  const update = await check();
  if (!update) return;
  const versione = update.version;
  aggiornamento.stato = {
    fase: "disponibile",
    versione,
    installa: async () => {
      let totale = 0;
      let scaricati = 0;
      aggiornamento.stato = { fase: "scarico", versione, percento: null };
      try {
        await update.downloadAndInstall((evento) => {
          if (evento.event === "Started") totale = evento.data.contentLength ?? 0;
          else if (evento.event === "Progress") {
            scaricati += evento.data.chunkLength;
            aggiornamento.stato = { fase: "scarico", versione, percento: totale ? Math.round((scaricati / totale) * 100) : null };
          }
        });
        await relaunch();
      } catch (e) {
        aggiornamento.stato = { fase: "errore", versione, messaggio: String(e) };
      }
    },
  };
}

async function controllaAndroid(): Promise<void> {
  const risposta = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } });
  if (!risposta.ok) return;
  const release: { tag_name: string; assets: { name: string; browser_download_url: string }[] } = await risposta.json();
  const apk = release.assets.find((a) => a.name.endsWith(".apk"));
  if (!apk || !piuNuova(release.tag_name, __APP_VERSION__)) return;
  aggiornamento.stato = {
    fase: "disponibile",
    versione: release.tag_name.replace(/^v/, ""),
    installa: () => openUrl(apk.browser_download_url),
  };
}

/* Senza rete o senza release il controllo tace: l'app funziona offline. */
export async function controllaAggiornamenti(): Promise<void> {
  if (!isTauri()) return;
  try {
    await (android ? controllaAndroid() : controllaWindows());
  } catch (e) {
    console.warn("Controllo aggiornamenti non riuscito:", e);
  }
}
