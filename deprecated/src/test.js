import { fetchProject } from "./query.js";

(async () => {
  const proj = await fetchProject(53);
  console.log(proj);
})();
