// Chạy: npm run server  (PORT mặc định 8787). Cần ANTHROPIC_API_KEY để bật AI viết văn; không có thì chỉ trả văn mẫu.
import Anthropic from "@anthropic-ai/sdk";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { HUONG_DAN } from "../src/engine/vietVan";
import { taoUngDung, type VietLlm } from "./app";

const MODEL = process.env.TUVI_MODEL ?? "claude-opus-5-5";
const coKhoa = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

const vietLlm: VietLlm | undefined = coKhoa
  ? async (bc) => {
      const client = new Anthropic({ timeout: 120_000, maxRetries: 1 });
      const msg = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 8000,
        output_config: { effort: "medium" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system: HUONG_DAN,
        messages: [{ role: "user", content: JSON.stringify(bc) }],
      });
      if (msg.stop_reason === "refusal") throw new Error(`Model từ chối (${msg.stop_details?.category ?? "?"})`);
      return msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    }
  : undefined;

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
  console.log(`Tử Vi server: http://localhost:${port}  (AI viết văn: ${coKhoa ? `bật, model ${MODEL}` : "tắt — thiếu ANTHROPIC_API_KEY"}; web tĩnh: ${existsSync(dist) ? "có" : "chưa build"})`);
});
