/* Stato dell'interfaccia: schermata aperta e filtro Lavoro / Personale (C3).
   Il filtro cambia solo cosa vedi: l'energia resta una sola. Si ricorda tra un avvio e l'altro. */
import type { Attivita } from "./dati.svelte";

export type Schermata = "settimana" | "tutte" | "ritmo";
export type Filtro = "tutte" | "lavoro" | "personale";

const CHIAVE = "priority-planner.vista.v1";

function leggi(): { schermata: Schermata; filtro: Filtro } {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) ?? "{}");
    return {
      schermata: s.schermata === "tutte" || s.schermata === "ritmo" ? s.schermata : "settimana",
      filtro: s.filtro === "lavoro" || s.filtro === "personale" ? s.filtro : "tutte",
    };
  } catch {
    return { schermata: "settimana", filtro: "tutte" };
  }
}

export const vista = $state({ ...leggi(), tornate: 0 });

$effect.root(() => {
  $effect(() => localStorage.setItem(CHIAVE, JSON.stringify({ schermata: vista.schermata, filtro: vista.filtro })));
});

/** Personale = tutte le aree tranne Lavoro. */
export function passaFiltro(a: Attivita, filtro: Filtro): boolean {
  if (filtro === "tutte") return true;
  return filtro === "lavoro" ? a.area === "lavoro" : a.area !== "lavoro";
}

/** 90 → «1 h 30». */
export function formatoDurata(minuti: number): string {
  const h = Math.floor(minuti / 60);
  const m = minuti % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m}` : `${h} h`;
}
