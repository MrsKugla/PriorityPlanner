/* Stile e tema (revisione D5): stile e chiaro/scuro sono due attributi separati sulla radice, come in GridApp. */

export type Stile = "tern" | "neu" | "skeu" | "clay";
export type Tema = "light" | "dark";

export const STILI: Record<Stile, { nome: string; nota: string; chiaro: string; scuro: string }> = {
  tern: { nome: "Tern", nota: "Isole chiare su un tavolo caldo, un solo accento azzurro", chiaro: "#efefec", scuro: "#08080a" },
  neu: { nome: "Neumorfismo", nota: "Fasce incavate, carte in rilievo", chiaro: "#e4e2da", scuro: "#25292a" },
  skeu: { nome: "Skeuomorfismo", nota: "Agenda di carta, pelle, ceramica e ottone", chiaro: "#e6dcc8", scuro: "#2b2119" },
  clay: { nome: "Claymorphism", nota: "Forme gonfie e opache, come pasta da modellare", chiaro: "#d5e3f4", scuro: "#1f2338" },
};

const CHIAVE = "priority-planner.aspetto.v1";

function leggi(): { stile: Stile; tema: Tema } {
  try {
    const salvato = JSON.parse(localStorage.getItem(CHIAVE) ?? "{}");
    /* Uno stile che non esiste più (es. «glass», tolto nella 0.9.0) torna a Tern. */
    const stile: Stile = salvato.stile in STILI ? salvato.stile : "tern";
    const tema: Tema = salvato.tema === "dark" ? "dark" : salvato.tema === "light" ? "light" : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    return { stile, tema };
  } catch {
    return { stile: "tern", tema: "light" };
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
