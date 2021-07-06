import express from "express";
import serveStatic from "sirv";
import * as URL from "url";
import WebSocket from "ws";
import getPort from "get-port";
import * as logger from "./logger.js";
import path from "path";
import mime from "mime/lite.js";
import liveReloadMiddleware from "./livereload/middleware.js";
import rightNow from "right-now";

import writeHTML from "./html/write.js";

const IS_DEV = process.env.NODE_ENV !== "production";
const DEFAULT_PORT = 9966;

export default async function createServer(opts = {}) {
  const { bundler, title = "" } = opts;
  const cwd = opts.cwd || process.cwd();
  const dir = opts.dir || cwd;

  const srcJS = "";
  const srcCSS = "";

  const app = createServerApp();
  const port = await getServerPort();
  const server = await new Promise((resolve, reject) => {
    const server = app
      .listen(port, () => resolve(server))
      .once("error", reject);
  });

  logger.connect(`http://localhost:${port}/`);

  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    // console.log("Client connected");
    bundler.get().then((result) => {
      if (result.errors && result.errors.length) {
        // console.log(result.errors[0].text);
        ws.send(JSON.stringify({ event: "error", data: result.errors }));
      }
    });
  });

  return {
    port,
    server,
    reload,
    close() {
      return server.close();
    },
  };

  function reload() {
    const data = JSON.stringify({ event: "reload-js" });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  async function bundlerMiddleware(req, res, next) {
    const pathname = URL.parse(req.url).pathname;
    const result = await bundler.get();
    for (let data of result.outputFiles) {
      const name = path.relative(dir, data.path);
      if (pathname === `/${name}`) {
        res.set("Content-Type", mime.getType(name));
        res.status(200);
        res.send(Buffer.from(data.contents));
        return;
      }
    }
    return next(null);
  }

  function createServerApp() {
    const app = express();

    app.use(liveReloadMiddleware());
    app.use((req, res, next) => {
      const pathname = URL.parse(req.url).pathname;
      if (pathname === "/" || /^\/index(\.html?)?$/i.test(pathname)) {
        sendDefaultIndex(req, res);
      } else {
        next(null);
      }
    });

    app.use(bundlerMiddleware);

    app.use(
      serveStatic(dir, {
        dev: IS_DEV,
      })
    );

    app.use((req, res, next) => {
      const pathname = URL.parse(req.url).pathname;
      if (pathname === "/favicon.ico") {
        res.sendStatus(204);
      } else {
        next(null);
      }
    });

    return app;

    async function sendDefaultIndex(req, res) {
      const results = await bundler.get();
      const html = await writeHTML(results, { dir, title });
      res.set("Content-Type", "text/html");
      res.status(200);
      res.send(html);
    }
  }
}

async function getServerPort() {
  let port = process.env.PORT;
  if (!port) {
    const basePort = DEFAULT_PORT;
    port = await getPort({ port: basePort });
    if (port !== basePort) {
      logger.warn(`Port ${basePort} is in use; using port ${port}`);
    }
  }
  return port;
}
