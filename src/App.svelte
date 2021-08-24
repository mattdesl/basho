<script>
  import InfiniteScroll from "./components/InfiniteScroll.svelte";
  import {
    fetchOrderedTokensByOwner,
    fetchTokensByProject,
  } from "./query";
  import { onMount } from "svelte";
  import TokenGrid from "./components/TokenGrid.svelte";
  import blur from "./blur";

  const fetchTokensByProjectCached = fetchTokensByProject;
  const fetchOrderedTokensByOwnerCached = fetchOrderedTokensByOwner;

  function getRoute() {
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

  let { route, params } = getRoute();
  params = (params || "").toLowerCase();

  let tokens = [];
  let hasMore = true;
  let lastId = null;
  let hasLoaded = false;
  let firstProject;

  export let theme = "light";
  let background;

  $: {
    document.body.classList.remove("theme-dark");
    if (theme === "dark") document.body.classList.add("theme-dark");
    background = theme === "dark" ? "hsl(0, 0%, 1%)" : "hsl(0, 0%, 99%)";
  }

  export let padding = 20;
  export let margin = 0;
  export let maxWidth = Infinity;
  export let quality = "generator";
  export let columns = 3;

  function resize () {
    if (window.innerWidth < 730) {
      columns = 1;
      padding = 10;
    } else if (window.innerWidth < 1024) {
      padding = 10;
      columns = 2;
    } else {
      padding = 20;
      columns = 3;
    }
  }

  resize();

  onMount(() => {
    resize();
    hasLoaded = false;
    lastId = null;
    hasMore = true;
    tokens = [];
    (async () => {
      await nextPage();
      hasLoaded = true;
    })();
  });

  async function loadImage(src, opts = {}) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      if (opts.crossOrigin) image.crossOrigin = opts.crossOrigin;
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error(`Could not load image at ${src})`));
      image.src = src;
    });
  }

  async function nextPage() {
    const limit = 12;
    let results;
    // if (route === "/gallery") {
    //   results = await fetchOrderedTokensByOwnerCached(params, {
    //     limit,
    //     lastId,
    //   });
    // }
    if (route === "/project") {
      results = await fetchTokensByProjectCached(params, {
        limit,
        lastId,
      });
    }

    // apply projects
    // console.time("unwrap");
    // results = await unwrapTokenProjects(results);
    // console.timeEnd("unwrap");

    hasMore = results.length >= limit;
    if (results.length > 0) {
      lastId = results[results.length - 1].id;
    }

    firstProject = results.length ? results[0].project : null;

    const curThumb =
      quality === "generator" || quality === "thumb" ? "thumb" : quality;
    const promises = results.map(async (token) => {
      const image = await loadImage(
        `https://api.artblocks.io/${curThumb}/${token.id}`
      );
      // const blurImage = blur(image, {
      //   radius: 5,
      //   maxSize: 32,
      // });
      return { image, token };
    });
    promises.forEach((e) => tokens.push(e));
    tokens = tokens;
  }
</script>

<!-- <div class="backdrop" /> -->

<main class="content">
  {#if route === "/"}
    <div>Homepage</div>
  {:else if route === "/gallery" || route === "/project"}
    {#if !params}
      <div>must specify a parameter - /gallery/ADDRESS</div>
    {:else if hasLoaded}
      {#if tokens.length === 0}
        <div>no tokens for parameter {params}</div>
      {:else}
        <header class="header">
          {#if route === "/gallery"}
            <div class="owned">Owned Tokens</div>
            <div class="owner">{params}</div>
          {:else if !firstProject}
            <div class="error">project does not exist</div>
          {:else}
            <div class="project-name">{firstProject.name}</div>
            <div class="project-artist">by {firstProject.artistName}</div>
          {/if}
        </header>
        <TokenGrid
          {padding}
          {margin}
          {maxWidth}
          {columns}
          {background}
          embed={quality === "generator"}
          {tokens}
        />
        <!-- <InfiniteScroll {hasMore} elementScroll={null} on:loadMore={nextPage} /> -->
        {#if hasMore}
          <div class='load-more-container'>
            <button class="load-more" on:click={nextPage}>load more</button>
          </div>
        {/if}
      {/if}
    {:else}
      <div class="loader" />
    {/if}
  {/if}
</main>

<svelte:window on:resize|passive={resize} />

<style>
  :global(body),
  :global(html) {
    font-size: 12px;
    font-family: "Source Code Pro", "Andale Mono", "Courier New", monospace;
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
  }
  :global(body) {
    background: hsl(0, 0%, 99%);
    overflow-x: hidden;
    color: black;
  }
  :global(body.theme-dark) {
    background: hsl(0, 0%, 1%);
    overflow-x: hidden;
    color: white;
  }
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* background: rgb(95, 95, 95); */
    /* background: radial-gradient(
      circle,
      rgba(255, 255, 255, 1) 0%,
      rgba(240, 240, 240, 1) 200%
    ); */
  }
  .content {
    /* display: none; */
  }
  .header {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    margin-top: 40px;
    margin-left: 40px;
    margin-bottom: 20px;
  }
  .load-more-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 50px;
    box-sizing: border-box;
    
  }
  .load-more {
    padding: 10px;
    appearance: none;
    border: none;
    font: inherit;
    background: none;
    text-decoration: underline;

    font-size: 14px;
    font-weight: 400;
    cursor: pointer;
  }
  .project-name {
    font-size: 32px;
    -webkit-font-smoothing: antialiased;
    font-weight: 300;
  }
  .project-artist {
    margin-top: 10px;
    font-size: 12px;
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
  }
  .loader {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
  }
</style>
