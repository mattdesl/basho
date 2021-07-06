<script>
  import InfiniteScroll from "./components/InfiniteScroll.svelte";
  import {
    fetchPlatform,
    fetchTokensByOwner,
    fetchTokensByProject,
    unwrapTokenProject,
    unwrapTokenProjects,
  } from "./query";
  import { onMount } from "svelte";
  import TokenGrid from "./components/TokenGrid.svelte";

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

  // const owner = "0xcAb81F14A3Fc98034a05bAb30f8D0E53e978c833";
  // const owner = "0xcAb81F14A3Fc98034a05bAb30f8D0E53e978c833";
  let { route, params } = getRoute();
  params = (params || "").toLowerCase();

  let tokens = [];
  let hasMore = true;
  let lastId = null;
  let hasLoaded = false;

  export let quality = "thumb";

  onMount(() => {
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
    const limit = 4;
    let results;
    if (route === "/gallery") {
      results = await fetchTokensByOwner(params, {
        limit,
        lastId,
      });
    } else {
      results = await fetchTokensByProject(params, {
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

    const curThumb =
      quality === "generator" || quality === "thumb" ? "thumb" : quality;
    const promises = results.map(async (token) => {
      token = await unwrapTokenProject(token);
      return loadImage(`https://api.artblocks.io/${curThumb}/${token.id}`).then(
        (image) => ({ image, token })
      );
    });
    promises.forEach((e) => tokens.push(e));
    tokens = tokens;
    console.log(tokens);
  }
</script>

{#if route === "/"}
  <div>Homepage</div>
{:else if route === "/gallery" || route === "/project"}
  {#if !params}
    <div>must specify a parameter - /gallery/ADDRESS</div>
  {:else if hasLoaded}
    {#if tokens.length === 0}
      <div>no tokens for parameter {params}</div>
    {:else}
      <TokenGrid embed={quality === "generator"} {tokens} />
    {/if}
  {:else}
    <div>loading</div>
  {/if}
{/if}

<style>
  :global(body, html) {
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    background: hsl(0, 0%, 5%);
    color: white;
  }
  :global(body) {
    overflow-x: hidden;
  }
</style>
