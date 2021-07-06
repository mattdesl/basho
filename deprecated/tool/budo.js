import minimist from "minimist";
import fs from "fs/promises";
import path from "path";
import * as esbuild from "esbuild";
import * as logger from "./logger.js";
import createServer from "./server.js";
import createBundler from "./bundler.js";
import createWatcher from "./watch.js";
import writeHTML from "./html/write.js";
import mkdirp from "mkdirp";
import chalk from "chalk";
import prettyBytes from "pretty-bytes";

export async function cli(args) {
  let command = "start";
  if (args[0] === "preview") {
    command = "preview";
    args.shift();
  } else if (args[0] === "build") {
    command = "build";
    args.shift();
  }

  const argv = minimist(args, {
    string: ["dir", "name", "title"],
    alias: {
      dir: "d",
    },
  });

  const entryPoints = argv._;
  const name = path.basename(argv.name || "index");
  if (/\.(htm|html)$/i.test(name)) {
    name = path.basename(name, path.extname(name));
  }

  const mode = command === "start" ? "development" : "production";
  const title = argv.title || "";
  const format = argv.format || "esm";

  const cwd = argv.cwd || process.cwd();
  const dir = argv.dir || cwd;
  const bundler = createBundler(esbuild, {
    mode,
    entryPoints,
    format,
    write: false,
    minify: mode === "production",
    entryNames: "[dir]/[name]-[hash]",
    outdir: dir,
  });

  // start rebuilding now
  bundler.rebuild();

  if (command === "build") {
    const results = await bundler.get();
    const html = await writeHTML(results, { dir, title, format });
    const filePath = path.join(dir, `${name}.html`);

    logger.log(`Writing to ${chalk.magenta(path.relative(cwd, dir) + "/")}`);

    await fs.writeFile(filePath, html);

    const outDir = path.resolve(dir);
    const writes = results.outputFiles.map(async (file) => {
      const buf = Buffer.from(file.contents);
      const curOutDir = path.resolve(path.dirname(file.path));
      if (curOutDir !== outDir) {
        await mkdirp(curOutDir);
      }

      logger.log(
        `  ${chalk.dim("" + path.relative(dir, file.path))} ${chalk.green(
          prettyBytes(buf.byteLength)
        )}`
      );
      return fs.writeFile(file.path, buf);
    });

    await Promise.all(writes);
    await bundler.dispose();
  } else if (command === "start") {
    const server = await createServer({
      bundler,
      dir,
      port: 9966,
    });

    const watcher = createWatcher();

    bundler.on("files", ({ outgoing, incoming }) => {
      outgoing.forEach((f) => watcher.unwatch(f));
      incoming.forEach((f) => watcher.add(f));
      // console.log("outgoing", outgoing);
      // console.log("incoming", incoming);
    });

    bundler.on("error", ({ errors }) => {
      logger.log("Error...");
    });
    bundler.on("error-resolved", ({ errors }) => {
      logger.log("Error Resolved!");
    });

    let delay = 0;
    let delayTimeout = null;
    watcher.on("change", (file) => {
      clearTimeout(delayTimeout);
      delayTimeout = setTimeout(rebuild, delay);
    });
  } else {
    throw new Error(`Unsupported command ${command}`);
  }

  // Trigger a rebuild of the bundler
  // Without actually reloading the page
  // bundler.rebuild();
  // rebuild();

  function rebuild() {
    bundler.rebuild();
    server.reload();
  }
}

// if (!module.parent) {
cli(process.argv.slice(2));
// }
