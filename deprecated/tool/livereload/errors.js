import escapeHTML from "escape-html";

const CSS_SYMBOL = Symbol.for("basho--error-css");
const POPUP_SYMBOL = Symbol.for("basho--error-css");

if (!window[CSS_SYMBOL]) {
  window[CSS_SYMBOL] = true;
  addStyle(`
    .basho--error-container {
      z-index: 10000000000;
      padding: 12px;
      font-family: "Andale Mono", "Courier New", monospace;
      font-size: 14px;
    }
    .basho--error-container h1 {
      margin: 0;
      margin-bottom: 20px;
      color: red;
      font-weight: 700;
      font-size: 24px;
    }
    .basho--error-container .basho--error-file {
      font-weight: 700;
    }
    .basho--error-container .basho--error-header {
    }
    .basho--error-container .basho--error-code {
      white-space: pre;
      font-size: 12px;
      padding: 20px;
      overflow: auto;
    }
  `);
}

function div() {
  return document.createElement("div");
}

export default function errors(data) {
  [...document.querySelectorAll(".basho--error-container")].forEach((e) => {
    if (e.parentElement) e.parentElement.removeChild(e);
  });

  const container = div();
  container.className = "basho--error-container";
  document.body.appendChild(container);
  const h1 = document.createElement("h1");
  h1.textContent = "Build Error";
  container.appendChild(h1);
  data.forEach((err) => {
    const { location, notes = [], pluginName = "", text = "" } = err;
    const {
      column,
      file,
      length,
      line,
      lineText,
      namespace = "",
      suggestion = "",
    } = location;

    const body = div();
    const header = div();
    const fileEl = div();
    const code = div();
    fileEl.className = "basho--error-file";
    fileEl.textContent = `${file}:${line}:${column}`;
    header.className = "basho--error-header";
    header.textContent = text;
    code.className = "basho--error-code";
    const pointer = Array(column).fill(" ").join("") + "^";
    const escaped = escapeHTML(lineText);
    // const lines = scaped.split("\n");
    // if (lineText)
    // code.innerHTML =  + "\n" + pointer;
    code.innerHTML = escaped;

    body.appendChild(fileEl);
    body.appendChild(header);
    body.appendChild(code);
    container.appendChild(body);
  });
}

function addStyle(styleString) {
  const style = document.createElement("style");
  style.textContent = styleString;
  document.head.append(style);
}
