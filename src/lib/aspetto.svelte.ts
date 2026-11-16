/* Stile e tema (revisione D5): stile e chiaro/scuro sono due attributi separati sulla radice, come in GridApp. */

export type Stile = "glass" | "neu" | "skeu" | "clay";
export type Tema = "light" | "dark";

export const STILI: Record<Stile, { nome: string; nota: string; chiaro: string; scuro: string }> = {
  glass: { nome: "Liquid glass", nota: "Vetro trasparente su una luce sfumata", chiaro: "#e9ece6", scuro: "#0b0f0d" },
  neu: { nome: "Neumorfismo", nota: "Fasce incavate, carte in rilievo", chiaro: "#e4e2da", scuro: "#25292a" },
  skeu: { nome: "Skeuomorfismo", nota: "Agenda di carta, pelle, ceramica e ottone", chiaro: "#e6dcc8", scuro: "#2b2119" },
  clay: { nome: "Claymorphism", nota: "Forme gonfie e opache, come argilla", chiaro: "#daddd5", scuro: "#191f1c" },
};

const CHIAVE = "priority-planner.aspetto.v1";

function leggi(): { stile: Stile; tema: Tema } {
  try {
    const salvato = JSON.parse(localStorage.getItem(CHIAVE) ?? "{}");
    const stile: Stile = salvato.stile in STILI ? salvato.stile : "glass";
    const tema: Tema = salvato.tema === "dark" ? "dark" : salvato.tema === "light" ? "light" : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    return { stile, tema };
  } catch {
    return { stile: "glass", tema: "light" };
  }
}

export const aspetto = $state(leggi());

export function applica(): void {
  const radice = document.documentElement;
  radice.dataset.style = aspetto.stile;
  radice.dataset.theme = aspetto.tema;
  const colore = STILI[aspetto.stile][aspetto.tema === "dark" ? "scuro" : "chiaro"];
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", colore);
  localStorage.setItem(CHIAVE, JSON.stringify(aspetto));
}
