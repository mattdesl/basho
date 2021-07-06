<script>
  import { onMount } from "svelte";
  import Token from "./Token.svelte";

  export let columns = 3;
  export let tokens = [];
  export let embed = false;

  let columnSplit;
  let windowWidth;
  let tokenWidth;

  const padding = 5;

  $: tokenWidth = Math.floor((windowWidth - padding * 2) / columns);
  $: columnSplit = createLayout(tokens, columns);

  // let elements = [];
  // $: updateLayout(tokens, columns, windowWidth);

  onMount(() => {
    resize();
  });

  function createLayout(tokens, columnCount) {
    const split = Array(columnCount)
      .fill()
      .map(() => []);
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const row = Math.floor(i / columnCount);
      const col = Math.floor(i % columnCount);
      split[col].push(token);
    }
    return split;
  }

  function resize() {
    // windowWidth = window.innerWidth;
    windowWidth = document.documentElement.clientWidth;
  }
</script>

<div
  class="token-grid"
  style="padding-top: {padding}px; padding-bottom: {padding}px; padding-left: {padding}px;"
>
  {#each columnSplit as tokens}
    <div class="token-column" style="width: {tokenWidth}px">
      {#each tokens as promise}
        {#await promise}
          <div
            class="placeholder-token"
            style="width: {tokenWidth}px; height: {tokenWidth}px"
          >
            loading
          </div>
        {:then result}
          <Token
            {embed}
            image={result.image}
            token={result.token}
            childWidth={result.image.width}
            childHeight={result.image.height}
            width={tokenWidth}
            {padding}
          />
        {/await}
      {/each}
    </div>
  {/each}
</div>

<svelte:window on:resize|passive={resize} />

<style>
  .token-grid {
    color: white;
    display: flex;
    margin: 0;
    flex-grow: 0;
    flex-shrink: 0;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: row;
  }
  .token-grid::-webkit-scrollbar {
    /* display: none; */
  }
  .placeholder-token {
    display: flex;
    justify-content: center;
    align-items: center;
    background: red;
  }
  .token-column {
    display: flex;
    flex-grow: 0;
    flex-shrink: 0;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;
  }
</style>
