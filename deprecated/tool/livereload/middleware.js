import liveReloadInjector from "inject-lr-script";
import * as esbuild from "esbuild";
import * as URL from "url";
import path from "path";
import { dirname } from "../util.js";

const __dirname = dirname(import.meta.url);
const script = path.resolve(__dirname, "./inject.js");

export default function liveMiddleware() {
  const url = "/basho/livereload.js";
  const liveInjector = liveReloadInjector({
    local: true,
    path: url,
    async: false,
    defer: false,
  });
  let bundle = esbuild
    .build({
      bundle: true,
      write: false,
      format: "iife",
      entryPoints: [script],
    })
    .catch((err) => {
      /* should be printed by esbuild */
    });
  return async function handler(req, res, next) {
    const pathname = URL.parse(req.url).pathname;
    if (pathname === url) {
      let result;
      try {
        result = await bundle;
      } catch (err) {
        /* should be printed by esbuild */
      }
      if (result && result.outputFiles && result.outputFiles[0]) {
        const src = result.outputFiles[0].text;
        res.set("Content-Type", "application/javascript");
        res.status(200);
        res.send(src);
      } else {
        res.status(500);
        res.send("error bundling livereload");
      }
    } else {
      liveInjector(req, res, next);
    }
  };
}
