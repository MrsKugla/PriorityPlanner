import { describe, expect, it } from "vitest";
import { proponi, type GiornoPiano } from "./pianificatore";
import type { Attivita, Costi, Regole } from "./dati.svelte";

const C = (p: Partial<Costi> = {}): Costi => ({ mentale: 0, emotiva: 0, sociale: 0, sensoriale: 0, fisica: 0, ...p });
const REGOLE: Regole = { cuscinetto: 15, maxPesanti: 1 };
const CHIAVI = ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29"];

/* Giorno con fasce 9–10, 10–11, 11–12, pausa, 14–16; livello e totale uguali per tutte le batterie. */
function giorno(chiave: string, livello = 2, totale = 6, livelli?: Costi[]): GiornoPiano {
  const fasce = [{ inizio: 540, fine: 600 }, { inizio: 600, fine: 660 }, { inizio: 660, fine: 720 }, { inizio: 840, fine: 960 }];
  return { chiave, fasce, livelli: livelli ?? fasce.map(() => C({ mentale: livello, emotiva: livello, sociale: livello, sensoriale: livello, fisica: livello })), totale: C({ mentale: totale, emotiva: totale, sociale: totale, sensoriale: totale, fisica: totale }) };
}
const settimana = (fn: (k: string, i: number) => GiornoPiano = (k) => giorno(k)) => CHIAVI.map(fn);

let n = 0;
function att(p: Partial<Attivita>): Attivita {
  n++;
  return {
    id: p.id ?? `a${n}`, titolo: p.titolo ?? `Attività ${n}`, area: "lavoro", costi: C(), durata: 60, scadenza: null, orarioFisso: null,
    giornoPreferito: null, stato: "da-pianificare", creata: "", posto: null, motivo: null, ...p,
  };
}

describe("proponi", () => {
  it("mette l'orario fisso esattamente lì e bloccato", () => {
    const e = proponi(settimana(), 0, [att({ id: "fisso", orarioFisso: { data: "2026-11-24", inizio: 600 } })], REGOLE);
    expect(e.get("fisso")).toMatchObject({ tipo: "posto", data: "2026-11-24", inizio: 600, fine: 660, bloccato: true });
  });

  it("rispetta il livello della fascia: un costo 3 non entra dove il livello è 2", () => {
    const e = proponi(settimana(), 0, [att({ id: "x", costi: C({ fisica: 3 }) })], REGOLE);
    expect(e.get("x")).toEqual({ tipo: "nonCiSta", motivo: "lun–dom: 💪 bassa" });
  });

  it("rispetta il totale del giorno e spiega il motivo raggruppato per giorni", () => {
    const giorni = settimana((k, i) => giorno(k, 3, i < 3 ? 4 : 1));
    const e = proponi(giorni, 0, [att({ id: "y", costi: C({ fisica: 2 }) })], REGOLE);
    expect(e.get("y")).toMatchObject({ tipo: "posto" });
    const pieno = proponi(giorni, 3, [att({ id: "z", costi: C({ fisica: 2 }) })], REGOLE);
    expect(pieno.get("z")).toEqual({ tipo: "nonCiSta", motivo: "gio–dom: 💪 finita" });
  });

  it("al massimo un'attività pesante emotiva o sociale al giorno", () => {
    const giorni = [giorno(CHIAVI[0], 3, 30)];
    const e = proponi(giorni, 0, [att({ id: "p1", costi: C({ emotiva: 3 }) }), att({ id: "p2", costi: C({ sociale: 3 }) })], REGOLE);
    expect(e.get("p2")).toEqual({ tipo: "nonCiSta", motivo: "lun: c'è già un impegno pesante" });
  });

  it("un'attività lunga occupa fasce consecutive; la pausa le interrompe", () => {
    const giorni = [giorno(CHIAVI[0], 2, 30)];
    const e = proponi(giorni, 0, [att({ id: "lunga", durata: 180 })], REGOLE);
    expect(e.get("lunga")).toMatchObject({ inizio: 540, fine: 720 });
    const troppo = proponi(giorni, 0, [att({ id: "l4", durata: 240 })], REGOLE);
    expect(troppo.get("l4")).toEqual({ tipo: "nonCiSta", motivo: "lun: nessuno spazio libero" });
  });

  it("più attività brevi nella stessa fascia; il cuscinetto lascia 15 minuti dopo un costo 3", () => {
    const giorni = [{ ...giorno(CHIAVI[0], 3, 30), fasce: [{ inizio: 540, fine: 600 }], livelli: [C({ mentale: 3, emotiva: 3, sociale: 3, sensoriale: 3, fisica: 3 })] }];
    const e = proponi(giorni, 0, [att({ id: "b1", durata: 20, titolo: "a", costi: C({ mentale: 3 }) }), att({ id: "b2", durata: 20, titolo: "b" })], REGOLE);
    expect(e.get("b1")).toMatchObject({ inizio: 540, fine: 560 });
    expect(e.get("b2")).toMatchObject({ inizio: 575, fine: 595 });
  });

  it("prima la scadenza più vicina, poi il costo più alto; preferisce il giorno preferito", () => {
    const giorni = [giorno(CHIAVI[0], 2, 30)].map((g) => ({ ...g, fasce: [g.fasce[0]], livelli: [g.livelli[0]] }));
    const e = proponi(giorni, 0, [att({ id: "dopo", costi: C({ mentale: 2 }) }), att({ id: "prima", scadenza: "2026-11-23" })], REGOLE);
    expect(e.get("prima")).toMatchObject({ tipo: "posto" });
    expect(e.get("dopo")).toMatchObject({ tipo: "nonCiSta" });
    const pref = proponi(settimana(), 0, [att({ id: "ven", giornoPreferito: 4 })], REGOLE);
    expect(pref.get("ven")).toMatchObject({ data: "2026-11-27", perche: expect.stringContaining("giorno preferito") });
  });

  it("non tocca i giorni passati e le attività bloccate", () => {
    const bloccata = att({ id: "b", stato: "in-settimana", posto: { data: "2026-11-25", inizio: 540, fine: 600, bloccato: true, perche: "" } });
    const e = proponi(settimana(), 2, [bloccata, att({ id: "n" })], REGOLE);
    expect(e.has("b")).toBe(false);
    const nuova = e.get("n");
    expect(nuova?.tipo === "posto" && nuova.data >= "2026-11-25").toBe(true);
  });

  it("oggi il tempo libero parte da adesso: niente prima dell'ora attuale", () => {
    const e = proponi(settimana(), 2, [att({ id: "ora", durata: 30, giornoPreferito: 2 })], REGOLE, 630);
    expect(e.get("ora")).toMatchObject({ tipo: "posto", data: "2026-11-25", inizio: 630 });
  });

  it("con adesso, le proposte già iniziate restano; quelle che devono ancora arrivare si ricalcolano", () => {
    const proposta = (id: string, inizio: number) =>
      att({ id, stato: "in-settimana", posto: { data: "2026-11-25", inizio, fine: inizio + 60, bloccato: false, perche: "" } });
    const e = proponi(settimana(), 2, [proposta("iniziata", 540), proposta("futura", 840)], REGOLE, 570);
    expect(e.has("iniziata")).toBe(false);
    expect(e.get("futura")).toMatchObject({ tipo: "posto" });
  });

  it("è deterministica: stessi dati, stessa proposta, in qualsiasi ordine", () => {
    const lista = Array.from({ length: 12 }, (_, i) => att({ id: `d${i}`, titolo: `T${i}`, durata: 30 + (i % 3) * 30, costi: C({ mentale: i % 3, fisica: (i + 1) % 3 }), area: i % 2 ? "casa" : "lavoro" }));
    const a = proponi(settimana(), 0, lista, REGOLE);
    const b = proponi(settimana(), 0, [...lista].reverse(), REGOLE);
    expect([...b].sort()).toEqual([...a].sort());
  });
});
