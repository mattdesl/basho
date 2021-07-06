import connect from "./ws-listener.js";
import errors from "./errors.js";

const GLOBAL_SYMBOL = Symbol.for("basho-livereload");

function init() {
  if (window[GLOBAL_SYMBOL]) return;

  const protocol = window.location.protocol;
  const ssl = protocol === "https:";
  const host = window.location.host;
  const uri = `${ssl ? "wss" : "ws"}://${host}`;

  const io = connect({
    uri,
    log: true,
  });

  io.on("data", (msg) => {
    const { event, data } = JSON.parse(msg);
    if (event === "reload-js") {
      window.location.reload();
    } else if (event === "error") {
      errors(data);
    }
  });

  io.on("reconnected", () => {
    // window.location.reload();
  });

  window[GLOBAL_SYMBOL] = io;
}

init();
