import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { anLaSo, baoCao, hauKiemTheoMuc, HUONG_DAN, LuanGiai, lenhChoAi } from "../src/engine";
import { chonVietLlm, taoVietLlmOpenAi } from "../server/llm";

const bc = baoCao(new LuanGiai(anLaSo(7, 7, 5, 15, 5, "nam")), 1990, 2026);
let mayChu: Server | null = null;
afterEach(() => new Promise<void>((r) => (mayChu ? mayChu.close(() => r()) : r())));

async function apiGia(tra: (body: any, auth: string | undefined) => { ma: number; json: unknown }) {
  const thay: { url?: string; auth?: string; body?: any } = {};
  mayChu = createServer((req, res) => {
    const manh: Buffer[] = [];
    req.on("data", (m) => manh.push(m));
    req.on("end", () => {
      thay.url = req.url;
      thay.auth = req.headers.authorization;
      thay.body = JSON.parse(Buffer.concat(manh).toString("utf8"));
      const r = tra(thay.body, thay.auth);
      res.writeHead(r.ma, { "Content-Type": "application/json" });
      res.end(JSON.stringify(r.json));
    });
  });
  await new Promise<void>((r) => mayChu!.listen(0, "127.0.0.1", r));
  return { base: `http://127.0.0.1:${(mayChu!.address() as AddressInfo).port}/v1`, thay };
}

describe("AI qua API kiểu OpenAI (mô hình bất kỳ)", () => {
  it("gửi system = quy tắc, user = báo cáo rút gọn; trả văn; kèm hậu kiểm theo mục", async () => {
    const { base, thay } = await apiGia(() => ({ ma: 200, json: { choices: [{ message: { content: "# Tổng quan\nCâu đúng [TQ]. Câu bịa [XXX]." } }] } }));
    const viet = taoVietLlmOpenAi({ base: `${base}/`, model: "mo-hinh-bat-ky", key: "khoa-gia" });
    const txt = await viet(bc);
    expect(thay.url).toBe("/v1/chat/completions");
    expect(thay.auth).toBe("Bearer khoa-gia");
    expect(thay.body.model).toBe("mo-hinh-bat-ky");
    expect(thay.body.messages[0]).toEqual({ role: "system", content: HUONG_DAN });
    const nd = JSON.parse(thay.body.messages[1].content);
    expect(nd.chu_de).toBeTruthy();
    expect(Object.values<any>(nd.cung)[0].nhan_dinh).toBeUndefined(); // đã rút gọn
    expect(hauKiemTheoMuc(txt, bc)).toEqual(["# Tổng quan\nCâu đúng [TQ].", 1]);
  });

  it("không có key vẫn gọi được (Ollama chạy máy mình); API lỗi → ném lỗi để server rơi về văn mẫu", async () => {
    const a = await apiGia(() => ({ ma: 200, json: { choices: [{ message: { content: "ok [TQ]" } }] } }));
    expect(await taoVietLlmOpenAi({ base: a.base, model: "llama" })(bc)).toBe("ok [TQ]");
    expect(a.thay.auth).toBeUndefined();
    await new Promise<void>((r) => mayChu!.close(() => r()));
    const b = await apiGia(() => ({ ma: 429, json: {} }));
    await expect(taoVietLlmOpenAi({ base: b.base, model: "x" })(bc)).rejects.toThrow(/429/);
    const c = await apiGia(() => ({ ma: 200, json: { choices: [] } }));
    await expect(taoVietLlmOpenAi({ base: c.base, model: "x" })(bc)).rejects.toThrow(/không trả văn/);
  });

  it("chọn nhà cung cấp theo biến môi trường", () => {
    expect(chonVietLlm({}).vietLlm).toBeUndefined();
    expect(chonVietLlm({ TUVI_LLM_BASE_URL: "http://x/v1" }).vietLlm).toBeUndefined(); // thiếu model
    expect(chonVietLlm({ TUVI_LLM_BASE_URL: "http://x/v1", TUVI_LLM_MODEL: "m" }).mota).toMatch(/OpenAI/);
    expect(chonVietLlm({ ANTHROPIC_API_KEY: "k" }).mota).toMatch(/Claude/);
    expect(chonVietLlm({ TUVI_LLM_BASE_URL: "http://x/v1", TUVI_LLM_MODEL: "m", ANTHROPIC_API_KEY: "k" }).mota).toMatch(/OpenAI/); // OpenAI-compat được ưu tiên
  });
});

describe("dán tay qua chatbot (không cần API)", () => {
  it("lời nhắc = quy tắc + JSON rút gọn, không chứa tên người dùng; văn dán lại được hậu kiểm theo mục", () => {
    const lenh = lenhChoAi(bc);
    expect(lenh.startsWith(HUONG_DAN)).toBe(true);
    const json = lenh.slice(lenh.indexOf("(JSON) ---\n") + "(JSON) ---\n".length);
    expect(JSON.parse(json).chu_de).toBeTruthy();
    expect(lenh).not.toContain("chi_tiet_diem");
    const sao = Object.keys(bc.chu_de)[0];
    expect(hauKiemTheoMuc(`# ${sao}\nCâu đúng [CD.${sao}]. Câu không mã.`, bc)).toEqual([`# ${sao}\nCâu đúng [CD.${sao}].`, 1]);
  });
});
