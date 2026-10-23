// Gọi Claude để viết lại báo cáo thành văn. Tách riêng để server và script kiểm (kiem-llm.ts) dùng chung một đường gọi.
import Anthropic from "@anthropic-ai/sdk";
import { HUONG_DAN, rutGonChoLlm } from "../src/engine/vietVan";
import type { VietLlm } from "./app";

export const MODEL = process.env.TUVI_MODEL ?? "claude-opus-5-5";
export const coKhoa = (): boolean => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

/** Không có key thì trả undefined (server chỉ phục vụ văn mẫu). */
export function taoVietLlm(): VietLlm | undefined {
  if (!coKhoa()) return undefined;
  return async (bc) => {
    const client = new Anthropic({ timeout: 120_000, maxRetries: 1 });
    const msg = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: HUONG_DAN,
      messages: [{ role: "user", content: JSON.stringify(rutGonChoLlm(bc)) }],
    });
    if (msg.stop_reason === "refusal") throw new Error(`Model từ chối (${msg.stop_details?.category ?? "?"})`);
    return msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  };
}
