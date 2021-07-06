<script>
  import InfiniteScroll from "./components/InfiniteScroll.svelte";
  import {
    fetchPlatform,
    fetchTokensByOwner,
    fetchTokensByProject,
  } from "./query";
  import { onMount } from "svelte";

  function route() {
    const paths = window.location.pathname
      .replace(/^[\/\\]/, "")
      .split("/")
      .filter(Boolean);
    const route = paths.length ? `/${paths[0]}` : "/";
    const opts = paths.length >= 2 ? { params: paths[1] } : undefined;
    return {
      route,
      ...opts,
    };
  }

  // const owner = "0xcAb81F14A3Fc98034a05bAb30f8D0E53e978c833";
  const owner = "0xcAb81F14A3Fc98034a05bAb30f8D0E53e978c833";
  let tokens = [];
  let hasMore = true;
  let lastId = null;
  let showLoadMore = false;

  onMount(() => {
    showLoadMore = false;
    lastId = null;
    hasMore = true;
    tokens = [];
    (async () => {
      await nextPage();
      showLoadMore = true;
    })();
  });

  async function nextPage() {
    const limit = 10;
    const results = await fetchTokensByProject(53, {
      limit,
      lastId,
    });
    hasMore = results.length >= limit;
    if (results.length > 0) {
      lastId = results[results.length - 1].id;
    }
    results.forEach((e) => tokens.push(e));
    tokens = tokens;
  }
</script>

<div class="grid">
  {#each tokens as token}
    <div class="grid-item">
      <img src="https://api.artblocks.io/thumb/{token.id}" alt={token.id} />
      <!-- <iframe
        src={`https://api.artblocks.io/generator/${token.id}`}
        title={token.id}
        scrolling="no"
      /> -->
    </div>
  {/each}

  {#if showLoadMore && hasMore}
    <button class="load-more" on:click={nextPage}>load more</button>
  {/if}
</div>

<style>
  :global(body, html) {
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    background: hsl(0, 0%, 5%);
  }
  :global(html) {
    overflow-y: scroll;
  }

  .grid {
    display: grid;
    margin: 0;
    grid-template-columns: repeat(3, minmax(10rem, 1fr));
    grid-gap: 10px;
    padding: 10px;
  }
  .grid-item {
    overflow: hidden;
    width: 100%;
    height: 100%;
    /* border-radius: 4px; */
  }
  .grid-item img {
    width: 100%;
    height: auto;
  }
  .grid-item iframe {
    border: 0;
    width: 256px;
    height: 256px;
  }
  .load-more {
    border: 2px dashed lightGray;
    border-radius: 20px;
    cursor: pointer;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    appearance: none;
    outline: none;
    font: 14px monospace;
    background: transparent;
    color: currentColor;
  }
</style>
