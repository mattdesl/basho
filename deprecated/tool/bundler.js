import * as logger from "./logger.js";
import chalk from "chalk";
import rightNow from "right-now";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";
import path from "path";
import svelte from "esbuild-svelte";
import { EventEmitter } from "events";
import glslx from "esbuild-plugin-glslx";

const loaderTypes = {
  file: [
    "png",
    "jpg",
    "jpeg",
    "gif",
    "svg",
    "bmp",
    "gltf",
    "glb",
    "mp4",
    "webm",
    "webp",
    "ogg",
    "mp3",
    "ttf",
    "woff",
    "woff2",
    "otf",
  ],
  text: [
    "glsl",
    "vert",
    "frag",
    "geom",
    "vs",
    "fs",
    "gs",
    "vsh",
    "fsh",
    "gsh",
    "vshader",
    "fshader",
    "gshader",
  ],
};

const defaultLoaders = {};
Object.entries(loaderTypes).forEach(([type, list]) => {
  list.forEach((f) => {
    defaultLoaders[`.${f}`] = type;
  });
});

export default function Bundler(esbuild, opts = {}) {
  opts = { ...opts };

  const { mode = "development" } = opts;
  const isDev = mode !== "production";
  delete opts.mode;

  const curOptions = {
    incremental: isDev,
    metafile: isDev,
    format: "esm",
    bundle: true,
    sourcemap: "external",
    plugins: [glslx(), svelte()],
    logLevel: "error",
    ...opts,
    loader: {
      ...defaultLoaders,
      ...opts.loader,
    },
  };

  const dependencies = new Set();
  const emitter = new EventEmitter();

  let hasError = false;
  let resultPromise;

  Object.assign(emitter, {
    async get() {
      if (!resultPromise) {
        return this.rebuild();
      } else {
        return resultPromise;
      }
    },
    rebuild() {
      let old = resultPromise || Promise.resolve();
      resultPromise = old.then((last) => {
        return rebuildAsync(last);
      });
      return resultPromise;
    },
    dispose() {
      if (resultPromise) {
        return resultPromise.then((result) => {
          if (result.rebuild) result.rebuild.dispose();
        });
      } else {
        return Promise.resolve();
      }
    },
  });

  return emitter;

  async function rebuildAsync(last) {
    let firstBuild = !last || !last.rebuild;
    const lastTime = rightNow();
    const wasError = hasError;
    let result;
    try {
      if (firstBuild) {
        result = await esbuild.build(curOptions);
      } else {
        result = await last.rebuild();
      }
      hasError = false;
    } catch (error) {
      hasError = true;
      result = {
        errors: error.errors ? Array.from(error.errors) : [],
        warnings: [],
        outputFiles: [],
      };
    }
    const now = rightNow();
    const time = prettyMs(now - lastTime);
    if (!hasError) {
      logger.log(
        `${firstBuild ? "Bundled" : "Rebundled"} in ${chalk.green(time)}`
      );
    }
    if (firstBuild || !hasError) checkDeps(result);
    checkErrors(result);
    if (wasError !== hasError) {
      if (hasError) emitter.emit("error", result);
      else emitter.emit("error-resolved", result);
    }
    return result;
  }

  function checkErrors(result) {
    result.errors.forEach((e) => {
      // console.error("ERROR", e.text);
    });
    result.warnings.forEach((e) => {
      // console.warn("WARN", e.text);
    });
  }

  function checkDeps(result) {
    const files = result.metafile
      ? Object.keys(result.metafile.inputs).filter(
          (f) => !f.startsWith("fakecss:")
        )
      : [...curOptions.entryPoints];

    if (result.errors) {
      result.errors.forEach((e) => {
        files.push(e.location.file);
        e.notes.forEach((n) => {
          if (n.location && n.location.file) {
            files.push(n.location.file);
          }
        });
      });
    }

    handleInputFiles(files);
  }

  function handleInputFiles(files) {
    let incoming = files.filter((f) => !dependencies.has(f));
    let outgoing = [...dependencies].filter((f) => !files.includes(f));
    incoming = [...new Set(incoming)];
    outgoing = [...new Set(outgoing)];
    dependencies.clear();
    files.forEach((f) => dependencies.add(f));
    if (incoming.length || outgoing.length) {
      emitter.emit("files", { incoming, outgoing });
    }
  }
}
