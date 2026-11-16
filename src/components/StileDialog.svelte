<script lang="ts">
  import { aspetto, applica, STILI, type Stile } from "../lib/aspetto.svelte";

  /* La scelta resta locale finché non premi «Applica»; «Annulla» tiene lo stile di prima (come in GridApp). */
  let finestra: HTMLDialogElement;
  let scelta = $state<Stile>(aspetto.stile);

  export function apri(): void {
    scelta = aspetto.stile;
    finestra.showModal();
  }

  function conferma(evento: SubmitEvent): void {
    evento.preventDefault();
    aspetto.stile = scelta;
    applica();
    finestra.close();
  }
</script>

<dialog class="sheet glass" bind:this={finestra} aria-labelledby="stile-titolo">
  <form class="style-form" onsubmit={conferma}>
    <h2 id="stile-titolo">Stile</h2>
    <fieldset class="style-choices">
      <legend class="visually-hidden">Scegli lo stile dell'app</legend>
      {#each Object.entries(STILI) as [id, s] (id)}
        <label class="style-choice" data-choice={id}>
          <input type="radio" name="stile" value={id} bind:group={scelta} />
          <span class="style-choice-swatch" style:--choice-field={aspetto.tema === "dark" ? s.scuro : s.chiaro} aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="style-choice-text"><strong>{s.nome}</strong><small>{s.nota}</small></span>
        </label>
      {/each}
    </fieldset>
    <div class="dialog-actions">
      <button type="button" class="text-button" onclick={() => finestra.close()}>Annulla</button>
      <button type="submit" class="ink-button">Applica</button>
    </div>
  </form>
</dialog>
