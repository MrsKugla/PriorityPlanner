import { describe, expect, it } from "vitest";
import { colonnaRitmo, fasceDelGiorno, FASCE_FERIALI, FASCE_FESTIVE, festivo, leggiFasce, totaleAuto, type Calendario } from "./fasce";

const cal = (feste: Calendario["feste"] = []): Calendario => ({ fasce: { feriali: [...FASCE_FERIALI], festive: [...FASCE_FESTIVE] }, feste });
const g = (k: string) => new Date(`${k}T10:00`);
// 2026-11-23 è lunedì.

describe("giorni festivi e notte 0–3:30", () => {
  it("sabato ha la notte, domenica seguita da lunedì feriale no", () => {
    expect(fasceDelGiorno(g("2026-11-28"), cal()).at(-1)!.inizio).toBe(1440);
    expect(fasceDelGiorno(g("2026-11-29"), cal()).some((f) => f.inizio >= 1440)).toBe(false);
  });

  it("domenica prima di un lunedì di ferie ha la notte e usa la colonna Sab", () => {
    const c = cal([{ id: "1", dal: "2026-11-30", al: "2026-12-01", nome: "Ferie" }]);
    expect(fasceDelGiorno(g("2026-11-29"), c).at(-1)!.inizio).toBe(1440);
    expect(colonnaRitmo(g("2026-11-29"), c)).toBe(5);
    expect(festivo(g("2026-12-01"), c)).toBe(true);
    expect(colonnaRitmo(g("2026-12-01"), c)).toBe(6);
  });

  it("un feriale usa la sua colonna e le fasce feriali", () => {
    expect(colonnaRitmo(g("2026-11-25"), cal())).toBe(2);
    expect(fasceDelGiorno(g("2026-11-25"), cal())).toHaveLength(13);
  });
});

describe("leggiFasce", () => {
  it("legge le fasce festive con la notte dopo mezzanotte", () => {
    const r = leggiFasce([{ inizio: "21:00", fine: "00:00" }, { inizio: "00:00", fine: "03:30" }]);
    expect(r).toEqual({ fasce: [{ inizio: 1260, fine: 1440 }, { inizio: 1440, fine: 1650 }] });
  });

  it("rifiuta due fasce sovrapposte di giorno", () => {
    expect(leggiFasce([{ inizio: "09:00", fine: "10:00" }, { inizio: "09:30", fine: "11:00" }])).toHaveProperty("errore");
  });
});

it("totale del giorno = 40% arrotondato", () => {
  expect(totaleAuto(Array(13).fill(2))).toBe(10);
});
