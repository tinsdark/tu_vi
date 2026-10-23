// Chạy: npm run server  (PORT mặc định 8787). Cần ANTHROPIC_API_KEY để bật AI viết văn; không có thì chỉ trả văn mẫu.
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { coKhoa, MODEL, taoVietLlm } from "./llm";
import { taoUngDung } from "./app";

const vietLlm = taoVietLlm();

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, "..", "dist");
const port = Number(process.env.PORT ?? 8787);
const xuLy = taoUngDung({
  vietLlm,
  thuMucTinh: existsSync(dist) ? dist : undefined,
  corsOrigin: process.env.TUVI_CORS_ORIGIN,
  tinCayProxy: process.env.TUVI_TIN_CAY_PROXY === "1",
  gioiHanMoiGio: Number(process.env.TUVI_GIOI_HAN_MOI_GIO ?? 20),
});
createServer(xuLy).listen(port, () => {
  console.log(`Tử Vi server: http://localhost:${port}  (AI viết văn: ${coKhoa() ? `bật, model ${MODEL}` : "tắt — thiếu ANTHROPIC_API_KEY"}; web tĩnh: ${existsSync(dist) ? "có" : "chưa build"})`);
});
