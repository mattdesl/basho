<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  export let token;
  export let width;
  export let childWidth;
  export let childHeight;
  export let image;
  export let blurImage = null;
  export let padding = 5;
  export let embed = false;
  export let background = "black";
  export let labelDetail = false;

  let showLabel = false;

  let tokenNumber;

  $: {
    const C = 1000000;
    const idNum = token && token.id ? parseInt(token.id, 10) : 0;
    tokenNumber = idNum < C ? idNum : Math.floor(idNum % C);
  }

  let innerWidth, innerHeight, height, container;
  $: {
    height = getHeight(width, childWidth, childHeight);
    innerWidth = Math.floor(width - padding * 2);
    innerHeight = Math.floor(height - padding * 2);
    const styleOpt = {
      top: `${padding}px`,
      left: `${padding}px`,
      width: `${innerWidth}px`,
      height: `${innerHeight}px`,
    };
    if (image) {
      Object.assign(image.style, styleOpt);
    }
    if (blurImage) {
      Object.assign(blurImage.style, styleOpt);
    }
  }

  $: {
    const newImage = image;
    if (newImage && newImage.parentElement)
      newImage.parentElement.removeChild(newImage);
    if (container) empty(container);
    if (container && newImage) {
      container.appendChild(newImage);
      newImage.classList.remove("token-image");
      newImage.classList.add("token-image");
    }
    if (container && blurImage) {
      container.appendChild(blurImage);
      blurImage.classList.remove("token-image");
      blurImage.classList.add("token-image");
    }
  }

  function empty(el) {
    while (el.firstChild) {
      el.removeChild(el.lastChild);
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
  on:mouseenter={() => {
    showLabel = true;
  }}
  on:mouseleave={() => {
    showLabel = false;
  }}
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
  <!-- <a class="image-link" href={`/token/${token.id}`}> -->
    <div class="image-container" bind:this={container} />
  <!-- </a> -->
  {#if true}
    <div class="label-container" style="padding: {padding}px;">
      <div class="label" style="">
        <div class="token-id">
          {#if labelDetail}
            {token.project.name}
          {/if}
          #{tokenNumber}
        </div>
        {#if labelDetail}<div class="token-artist">
            {token.project.artistName}
          </div>{/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .token-container {
    /* overflow: hidden; */
    display: inline-block;

    /* box-sizing: content-box; */
    margin: 0;
    position: relative;
    margin-bottom: 10px;
  }
  :global(.token-container.embed .token-image) {
    /* display: none; */
  }
  .label-container {
    opacity: 0.5;
    position: absolute;
    z-index: 2;
    left: 0;
    bottom: 0px;
    width: 100%;
    min-width: 200px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    box-sizing: border-box;
    /* transition: all 1s ease-out; */
  }
  .label {
    /* position: absolute; */
    /* bottom: 0; */
    /* left: 0; */
    /* padding: 5px; */
    /* padding: 10px; */
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
    top: 20px;
    font-size: 10px;
    /* line-height: 8px; */
    /* margin: 10px; */
    /* backdrop-filter: blur(20px); */
    /* will-change: backdrop-filter; */
    /* background: white; */
    /* background: hsl(0, 0%, 15%); */
    /* background: hsl(0, 0%, 1%); */
    /* background: rgba(0, 0, 0, 0.33); */
    /* transform: translateY(100%); */
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    /* border-bottom-left-radius: 1px; */
    /* border-bottom-right-radius: 1px; */
    /* border-top-right-radius: 5px; */
    /* transition: all 0.1s ease-out; */
    /* color: black; */
  }
  .status {
    font-size: 9px;
    margin-bottom: 1px;
    text-transform: uppercase;
  }
  .label div {
    /* line-height: 1.5; */
  }
  .token-id {
    margin-bottom: 2px;
  }
  .showLabel .label {
    /* transform: translateY(0%); */
    /* transition: all 0.1s ease-out; */
  }
  .token-frame {
    border: 0;
    z-index: 1;
    position: absolute;
    /* border-radius: 5px; */
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
