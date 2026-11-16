<script lang="ts">
  /* Icone dei comandi: tratto unico da 1.8, disegnate a mano. Batterie e aree usano le emoji approvate (C2). */
  let { nome }: { nome: "sole" | "luna" | "stile" } = $props();
</script>

<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
  {#if nome === "sole"}
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
  {:else if nome === "luna"}
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  {:else}
    <path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z" />
    <circle cx="7.5" cy="11" r="1.2" />
    <circle cx="10.5" cy="7" r="1.2" />
    <circle cx="15" cy="7.5" r="1.2" />
  {/if}
</svg>
