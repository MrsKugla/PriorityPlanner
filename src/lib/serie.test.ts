import { describe, expect, it } from "vitest";
import type { Serie } from "./dati.svelte";
import { FASCE_FERIALI, FASCE_FESTIVE, giorniDellaSettimana, type Calendario } from "./fasce";
import { occorrenze, testoSerie } from "./serie";

const cal = (feste: Calendario["feste"] = []): Calendario => ({ fasce: { feriali: [...FASCE_FERIALI], festive: [...FASCE_FESTIVE] }, feste });
const costi = { mentale: 1, emotiva: 0, sociale: 0, sensoriale: 0, fisica: 2 };
const settimana = (n = 0): Date[] => giorniDellaSettimana(new Date(2026, 10, 23 + 7 * n));

const serie = (extra: Partial<Serie>): Serie => ({
  id: "s1", titolo: "Serie", area: "me", costi, durata: 60, tipo: "giorni", giorni: [0], volte: 1, ogniSettimane: 1, ora: null,
  inizio: "2026-11-23", fine: null, inPausa: false, saltaFeste: false, recupera: false, creata: "2026-11-23T08:00:00.000Z", ...extra,
});

describe("occorrenze", () => {
  it("1 · Palestra lun e gio alle 18:00: due occorrenze a orario fisso, nessun doppione", () => {
    const s = serie({ titolo: "Palestra", giorni: [0, 3], ora: 1080 });
    const nuove = occorrenze(s, settimana(), 0, cal(), new Set());
    expect(nuove.map((a) => a.giornoSerie)).toEqual(["2026-11-23", "2026-11-26"]);
    for (const a of nuove) {
      expect(a.orarioFisso).toEqual({ data: a.giornoSerie, inizio: 1080 });
      expect(a.stato).toBe("in-settimana");
      expect(a.posto).toEqual({ data: a.giornoSerie, inizio: 1080, fine: 1140, bloccato: true, perche: "orario fisso" });
      expect(a.serie).toBe("s1");
    }
    const esistenti = new Set(nuove.map((a) => `s1|${a.giornoSerie}`));
    expect(occorrenze(s, settimana(), 0, cal(), esistenti)).toEqual([]);
  });

  it("2 · Medicine ogni giorno a ora libera, creata mercoledì: mer–dom con soloGiorno", () => {
    const s = serie({ titolo: "Medicine", giorni: [0, 1, 2, 3, 4, 5, 6] });
    const nuove = occorrenze(s, settimana(), 2, cal(), new Set());
    expect(nuove.map((a) => a.giornoSerie)).toEqual(["2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29"]);
    for (const a of nuove) {
      expect(a.soloGiorno).toBe(a.giornoSerie);
      expect(a.stato).toBe("da-pianificare");
      expect(a.orarioFisso).toBeNull();
      expect(a.posto).toBeNull();
    }
  });

  it("3 · Corsa 2 volte a settimana: lunedì#1 e lunedì#2, anche a metà settimana", () => {
    const s = serie({ titolo: "Corsa", tipo: "volte", volte: 2, giorni: [] });
    const nuove = occorrenze(s, settimana(), 3, cal(), new Set());
    expect(nuove.map((a) => a.giornoSerie)).toEqual(["2026-11-23#1", "2026-11-23#2"]);
    expect(nuove.every((a) => a.stato === "da-pianificare" && a.soloGiorno === null)).toBe(true);
    expect(occorrenze(s, settimana(), 0, cal(), new Set(["s1|2026-11-23#1"])).map((a) => a.giornoSerie)).toEqual(["2026-11-23#2"]);
  });

  it("4 · Pulizie ogni 2 settimane di sabato: sì, no, sì", () => {
    const s = serie({ titolo: "Pulizie", giorni: [5], ogniSettimane: 2 });
    expect(occorrenze(s, settimana(0), 0, cal(), new Set()).map((a) => a.giornoSerie)).toEqual(["2026-11-28"]);
    expect(occorrenze(s, settimana(1), 0, cal(), new Set())).toEqual([]);
    expect(occorrenze(s, settimana(2), 0, cal(), new Set()).map((a) => a.giornoSerie)).toEqual(["2026-12-12"]);
  });

  it("5 · l'occorrenza saltata (già in esistenti) non viene ricreata", () => {
    const s = serie({ titolo: "Palestra", giorni: [0], ora: 1080 });
    expect(occorrenze(s, settimana(), 0, cal(), new Set(["s1|2026-11-23"]))).toEqual([]);
  });

  it("6 · Riunione al lunedì, salta feste: nessuna occorrenza se il lunedì è in ferie", () => {
    const s = serie({ titolo: "Riunione", giorni: [0], saltaFeste: true });
    const ferie = cal([{ id: "f", dal: "2026-11-23", al: "2026-11-27", nome: "Ferie" }]);
    expect(occorrenze(s, settimana(), 0, ferie, new Set())).toEqual([]);
    expect(occorrenze(s, settimana(), 0, cal(), new Set())).toHaveLength(1);
    expect(occorrenze({ ...s, saltaFeste: false }, settimana(), 0, ferie, new Set())).toHaveLength(1);
  });

  it("6b · saltaFeste non esclude il fine settimana", () => {
    const s = serie({ giorni: [5, 6], saltaFeste: true });
    expect(occorrenze(s, settimana(), 0, cal(), new Set())).toHaveLength(2);
  });

  it("7 · in pausa o con fine passata: niente", () => {
    expect(occorrenze(serie({ giorni: [0, 1], inPausa: true }), settimana(), 0, cal(), new Set())).toEqual([]);
    expect(occorrenze(serie({ giorni: [0, 1], fine: "2026-11-22" }), settimana(), 0, cal(), new Set())).toEqual([]);
    expect(occorrenze(serie({ tipo: "volte", volte: 3, fine: "2026-11-22" }), settimana(), 0, cal(), new Set())).toEqual([]);
    expect(occorrenze(serie({ giorni: [0, 1, 2], fine: "2026-11-24" }), settimana(), 0, cal(), new Set())).toHaveLength(2);
  });

  it("prima dell'inizio: niente", () => {
    expect(occorrenze(serie({ giorni: [0, 1, 2], inizio: "2026-11-25" }), settimana(), 0, cal(), new Set()).map((a) => a.giornoSerie)).toEqual(["2026-11-25"]);
    expect(occorrenze(serie({ giorni: [0], inizio: "2026-11-30" }), settimana(), 0, cal(), new Set())).toEqual([]);
  });
});

describe("testoSerie", () => {
  it("descrive ora, volte e cadenza", () => {
    expect(testoSerie(serie({ ora: 1080 }))).toBe("18:00");
    expect(testoSerie(serie({ ora: null }))).toBe("orario libero");
    expect(testoSerie(serie({ tipo: "volte", volte: 2 }))).toBe("2× sett.");
    expect(testoSerie(serie({ ora: 1080, ogniSettimane: 2 }))).toBe("18:00 · ogni 2 sett.");
  });
});
