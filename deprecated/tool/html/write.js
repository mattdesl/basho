import maxstache from "maxstache";
import fs from "fs/promises";
import path from "path";
import { dirname } from "../util.js";

const __dirname = dirname(import.meta.url);
const templateFile = path.resolve(__dirname, "template.html");

export default async function write(
  results,
  { title = "", format = "esm", dir = process.cwd() } = {}
) {
  const defaultHTML = await fs.readFile(templateFile, "utf8");
  const outputFiles = results.outputFiles;
  const type = format === "esm" ? ' type="module"' : "";
  const scripts = outputFiles
    .filter((f) => /\.js$/i.test(f.path))
    .map((f) => {
      const name = path.relative(dir, f.path);
      return `    <script src="${name}"${type}></script>`;
    })
    .join("\n");

  const css = outputFiles
    .filter((f) => /\.css$/i.test(f.path))
    .map((f) => {
      const name = path.relative(dir, f.path);
      return `    <link href="${name}" rel="stylesheet">`;
    })
    .join("\n");

  return maxstache(defaultHTML, {
    title: title ? `\n    <title>${title}</title>` : "",
    style: `\n${css}`,
    script: `\n${scripts}`,
  });
}
