<script lang="ts">
  import { aggiornamento } from "../lib/aggiornamento.svelte";

  const stato = $derived(aggiornamento.stato);
</script>

{#if stato.fase === "disponibile"}
  <button class="update-button" type="button" onclick={stato.installa} title="Installa la versione {stato.versione}">
    <span class="update-dot" aria-hidden="true"></span>
    Aggiorna a v{stato.versione}
  </button>
{:else if stato.fase === "scarico"}
  <span class="update-button" role="status" aria-live="polite">
    Scarico v{stato.versione}{stato.percento === null ? "…" : ` ${stato.percento}%`}
  </span>
{:else if stato.fase === "errore"}
  <span class="update-button update-error" role="status" title={stato.messaggio}>Aggiornamento non riuscito: riprova al prossimo avvio</span>
{/if}

<style>
  .update-button {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    border: 0;
    border-radius: var(--radius-control);
    background: var(--signal);
    color: var(--on-signal);
    font-size: 15px;
    font-weight: 700;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  button.update-button { transition: transform .35s var(--ease-press); }
  button.update-button:active { transform: scale(.96); }
  .update-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
  .update-error { background: var(--glass-strong); color: var(--muted); font-weight: 500; }
</style>
