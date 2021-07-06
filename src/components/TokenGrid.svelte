<script>
  import { onMount } from "svelte";
  import Token from "./Token.svelte";

  export let columns = 4;
  export let tokens = [];
  export let embed = false;
  export let background = "black";
  export let padding = 0;
  export let margin = 0;
  export let maxWidth = Infinity;

  let xoff = 0;
  let columnSplit;
  let windowWidth;
  let tokenWidth;

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

  function randomChar() {
    const list =
      "⡀⡁⡂⡃⡄⡅⡆⡇⡈⡉⡊⡋⡌⡍⡎⡏⡐⡑⡒⡓⡔⡕⡖⡗⡘⡙⡚⡛⡜⡝⡞⡟⡠⡡⡢⡣⡤⡥⡦⡧⡨⡩⡪⡫⡬⡭⡮⡯⡰⡱⡲⡳⡴⡵⡶⡷⡸⡹⡺⡻⡼⡽⡾⡿⢀⢁⢂⢃⢄⢅⢆⢇⢈⢉⢊⢋⢌⢍⢎⢏⢐⢑⢒⢓⢔⢕⢖⢗⢘⢙⢚⢛⢜⢝⢞⢟⢠⢡⢢⢣⢤⢥⢦⢧⢨⢩⢪⢫⢬⢭⢮⢯⢰⢱⢲⢳⢴⢵⢶⢷⢸⢹⢺⢻⢼⢽⢾⢿⣀⣁⣂⣃⣄⣅⣆⣇⣈⣉⣊⣋⣌⣍⣎⣏⣐⣑⣒⣓⣔⣕⣖⣗⣘⣙⣚⣛⣜⣝⣞⣟⣠⣡⣢⣣⣤⣥⣦⣧⣨⣩⣪⣫⣬⣭⣮⣯⣰⣱⣲⣳⣴⣵⣶⣷⣸⣹⣺⣻⣼⣽⣾⣿";
    return list[Math.floor(Math.random() * list.length)];
  }

  function resize() {
    // windowWidth = window.innerWidth;
    windowWidth = Math.min(
      maxWidth,
      document.documentElement.clientWidth - margin * 2
    );
    xoff = (document.documentElement.clientWidth - windowWidth) / 2;
  }
</script>

<div
  class="token-grid"
  style="margin: {margin}px; margin-bottom: 0; padding-top: {padding}px; padding-bottom: {padding +
    margin}px; padding-left: {padding}px; margin-left: {margin + xoff}px;"
>
  {#each columnSplit as tokens}
    <div class="token-column" style="width: {tokenWidth}px">
      {#each tokens as promise}
        {#await promise}
          <div
            class="placeholder-token"
            style="width: {tokenWidth}px; height: {tokenWidth}px"
          >
            {randomChar()}
          </div>
        {:then result}
          <Token
            {embed}
            {background}
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
    /* background: red; */
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
