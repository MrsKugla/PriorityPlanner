/* Batterie e aree approvate in revisione (A1, A2, C2): solo icona nell'interfaccia, il nome sta nella legenda e nel title. */

export type Batteria = { id: "mentale" | "emotiva" | "sociale" | "sensoriale" | "fisica"; nome: string; icona: string; colore: string };
export type Area = { id: "lavoro" | "famiglia" | "amici" | "salute" | "casa" | "me"; nome: string; icona: string; colore: string };

export const BATTERIE: readonly Batteria[] = [
  { id: "mentale", nome: "Mentale", icona: "🧠", colore: "#4f68d6" },
  { id: "emotiva", nome: "Emotiva", icona: "❤️‍🩹", colore: "#c8433a" },
  { id: "sociale", nome: "Sociale", icona: "💬", colore: "#d99a2b" },
  { id: "sensoriale", nome: "Sensoriale", icona: "🎧", colore: "#3f9c9c" },
  { id: "fisica", nome: "Fisica", icona: "💪", colore: "#5a9a4a" },
];

export const AREE: readonly Area[] = [
  { id: "lavoro", nome: "Lavoro", icona: "💼", colore: "#3b6fb6" },
  { id: "famiglia", nome: "Famiglia", icona: "👪", colore: "#8e5bb5" },
  { id: "amici", nome: "Amici", icona: "🧡", colore: "#d9822b" },
  { id: "salute", nome: "Salute", icona: "🩺", colore: "#2e8b6e" },
  { id: "casa", nome: "Casa", icona: "🏠", colore: "#8a6d3b" },
  { id: "me", nome: "Me stessa", icona: "🌱", colore: "#4a9bb0" },
];
