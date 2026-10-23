// Gọi một mô hình ngôn ngữ để viết lại báo cáo thành văn. Không gắn với một nhà cung cấp:
//  - TUVI_LLM_BASE_URL (+ TUVI_LLM_MODEL, TUVI_LLM_API_KEY): mọi API kiểu OpenAI /chat/completions (OpenAI, Gemini, DeepSeek, Groq, OpenRouter, Ollama chạy máy mình...).
//  - ANTHROPIC_API_KEY: Claude.
// Hậu kiểm theo mục (hauKiemTheoMuc) không phụ thuộc mô hình nào — mô hình yếu hơn chỉ làm nhiều câu bị bỏ hơn, không làm sai cung.
import Anthropic from "@anthropic-ai/sdk";
import { HUONG_DAN, rutGonChoLlm } from "../src/engine/vietVan";
import type { VietLlm } from "./app";

export interface CauHinhOpenAi {
  base: string;
  model: string;
  key?: string;
  fetchFn?: typeof fetch;
  hetGio?: number;
}

/** API tương thích OpenAI: POST {base}/chat/completions. */
export function taoVietLlmOpenAi(c: CauHinhOpenAi): VietLlm {
  const url = `${c.base.replace(/\/+$/, "")}/chat/completions`;
  const goi = c.fetchFn ?? fetch;
  return async (bc) => {
    const r = await goi(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(c.key ? { Authorization: `Bearer ${c.key}` } : {}) },
      body: JSON.stringify({
        model: c.model,
        temperature: 0.4,
        messages: [{ role: "system", content: HUONG_DAN }, { role: "user", content: JSON.stringify(rutGonChoLlm(bc)) }],
      }),
      signal: AbortSignal.timeout(c.hetGio ?? 120_000),
    });
    if (!r.ok) throw new Error(`API trả ${r.status}`);
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const txt = j.choices?.[0]?.message?.content;
    if (!txt) throw new Error("API không trả văn");
    return txt;
  };
}

function taoVietLlmClaude(model: string): VietLlm {
  return async (bc) => {
    const client = new Anthropic({ timeout: 120_000, maxRetries: 1 });
    const msg = await client.beta.messages.create({
      model,
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

/** Chọn nhà cung cấp theo biến môi trường; không có gì thì undefined (server chỉ phục vụ văn mẫu). `mota` để in ra khi khởi động. */
export function chonVietLlm(env: NodeJS.ProcessEnv = process.env): { vietLlm?: VietLlm; mota: string } {
  if (env.TUVI_LLM_BASE_URL) {
    if (!env.TUVI_LLM_MODEL) return { mota: "tắt — có TUVI_LLM_BASE_URL nhưng thiếu TUVI_LLM_MODEL" };
    return { vietLlm: taoVietLlmOpenAi({ base: env.TUVI_LLM_BASE_URL, model: env.TUVI_LLM_MODEL, key: env.TUVI_LLM_API_KEY }), mota: `bật, API kiểu OpenAI (${env.TUVI_LLM_BASE_URL}), model ${env.TUVI_LLM_MODEL}` };
  }
  if (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN) {
    const model = env.TUVI_MODEL ?? "claude-opus-5-5";
    return { vietLlm: taoVietLlmClaude(model), mota: `bật, Claude ${model}` };
  }
  return { mota: "tắt — đặt TUVI_LLM_BASE_URL + TUVI_LLM_MODEL (API kiểu OpenAI) hoặc ANTHROPIC_API_KEY" };
}
