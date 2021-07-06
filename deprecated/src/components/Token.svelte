<script>
  import { onMount } from "svelte";

  export let token;
  export let width;
  export let childWidth;
  export let childHeight;
  export let image;
  export let padding = 5;
  export let embed = false;

  let innerWidth, innerHeight, height, container;
  $: {
    height = getHeight(width, childWidth, childHeight);
    innerWidth = Math.floor(width - padding * 2);
    innerHeight = Math.floor(height - padding * 2);
    if (image) {
      Object.assign(image.style, {
        top: `${padding}px`,
        left: `${padding}px`,
        width: `${innerWidth}px`,
        height: `${innerHeight}px`,
      });
    }
  }

  $: {
    const newImage = image;
    if (newImage && newImage.parentElement)
      newImage.parentElement.removeChild(newImage);
    if (container && newImage) {
      container.appendChild(newImage);
      newImage.classList.remove("token-image");
      newImage.classList.add("token-image");
    }
  }

  function getHeight(width, childWidth, childHeight) {
    const aspect = childWidth / childHeight;
    return width / aspect;
  }
</script>

<div
  class="token-container"
  class:embed
  style="width: {width}px; height: {height}px;"
  bind:this={container}
>
  {#if embed}
    <iframe
      class="token-frame"
      src={`https://api.artblocks.io/generator/${token.id}`}
      style="top: {padding}px; left: {padding}px; width: {innerWidth}px; height: {innerHeight}px"
      title={token.id}
      scrolling="no"
    />
  {/if}
  <!-- <img
    class="token-image"
    style="top: {padding}px; left: {padding}px; width: {innerWidth}px; height: {innerHeight}px"
    src="https://api.artblocks.io/thumb/{token.id}"
    alt={token.id}
  /> -->
</div>

<style>
  .token-container {
    overflow: hidden;
    display: inline-block;
    /* box-sizing: content-box; */
    margin: 0;
    position: relative;
  }
  :global(.token-container.embed .token-image) {
    /* display: none; */
  }
  .token-frame {
    border: 0;
    z-index: 1;
    position: absolute;
    border-radius: 1px;
    overflow: hidden;
  }
  :global(.token-image) {
    position: absolute;
    width: 100%;
    height: auto;
    border-radius: 1px;
    overflow: hidden;
  }
</style>
