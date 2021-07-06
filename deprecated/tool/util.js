import { fileURLToPath } from "url";
import * as path from "path";

export const dirname = (url) => path.dirname(fileURLToPath(url));
