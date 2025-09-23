import { cfg } from "./config";
import { createServer } from "./server.js";
import { ensureAssetsDir } from "./api/assets";

ensureAssetsDir(cfg);

const server = createServer(cfg);
console.log(`Server running at http://localhost:${server.port}`);
