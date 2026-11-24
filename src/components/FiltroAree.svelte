<script lang="ts">
  /* Filtro solo visivo (C3): Tutte · 💼 Lavoro · 🏡 Personale. */
  import { vista, type Filtro } from "../lib/vista.svelte";

  const SCELTE: { id: Filtro; testo: string; titolo: string }[] = [
    { id: "tutte", testo: "Tutte", titolo: "Tutte le attività" },
    { id: "lavoro", testo: "💼", titolo: "Solo lavoro" },
    { id: "personale", testo: "🏡", titolo: "Solo vita personale" },
  ];
</script>

<div class="seg" role="radiogroup" aria-label="Filtro">
  {#each SCELTE as s (s.id)}
    <label class="seg-item" title={s.titolo}>
      <input type="radio" name="filtro" value={s.id} bind:group={vista.filtro} aria-label={s.titolo} />
      <span aria-hidden="true">{s.testo}</span>
    </label>
  {/each}
</div>
