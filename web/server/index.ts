// Chạy: npm run server  (PORT mặc định 8787). Phục vụ web tĩnh trong dist/ (npm run build trước).
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { taoUngDung } from "./app";

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, "..", "dist");
const port = Number(process.env.PORT ?? 8787);
const xuLy = taoUngDung({
  thuMucTinh: existsSync(dist) ? dist : undefined,
  corsOrigin: process.env.TUVI_CORS_ORIGIN,
});
createServer(xuLy).listen(port, () => {
  console.log(`Tử Vi server: http://localhost:${port}  (web tĩnh: ${existsSync(dist) ? "có" : "chưa build"})`);
});
