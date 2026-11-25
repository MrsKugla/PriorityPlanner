<script lang="ts">
  /* I giorni di una serie (Fase 6): 7 rettangoli L M M G V S D accesi nel colore dell'area, spenti grigi, e accanto il testo
     («18:00», «2× sett.», «orario libero», «ogni 2 sett.»). Con `onCambia` e tipo «giorni» i rettangoli sono bottoni. */
  import type { Serie } from "../lib/dati.svelte";
  import { testoSerie } from "../lib/serie";

  type Forma = Pick<Serie, "tipo" | "giorni" | "volte" | "ogniSettimane" | "ora">;
  let { serie, tone, piccola = false, onCambia }: { serie: Forma; tone: string; piccola?: boolean; onCambia?: (giorno: number) => void } = $props();

  const SIGLE = ["L", "M", "M", "G", "V", "S", "D"];
  const NOMI = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];
  const interattiva = $derived(!!onCambia && serie.tipo === "giorni");
  const accesi = $derived(NOMI.filter((_, i) => serie.giorni.includes(i)).join(", "));
</script>

<span class="giorni-serie" class:piccola style:--tone={tone}>
  {#if serie.tipo === "giorni"}
    {#if interattiva}
      <span class="giorni-serie-set" role="group" aria-label="Giorni della settimana">
        {#each SIGLE as sigla, i (i)}
          {@const acceso = serie.giorni.includes(i)}
          <button type="button" class="giorno-serie" class:on={acceso} aria-pressed={acceso} aria-label={NOMI[i]} title={NOMI[i]} onclick={() => onCambia?.(i)}>{sigla}</button>
        {/each}
      </span>
    {:else}
      <span class="giorni-serie-set" role="img" aria-label="Giorni: {accesi || 'nessuno'}">
        {#each SIGLE as sigla, i (i)}
          <span class="giorno-serie" class:on={serie.giorni.includes(i)} aria-hidden="true">{sigla}</span>
        {/each}
      </span>
    {/if}
  {/if}
  <span class="giorni-serie-testo">{testoSerie(serie)}</span>
</span>
