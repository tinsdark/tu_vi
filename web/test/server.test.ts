import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { taoUngDung, type TuyChon } from "../server/app";

const NHAP = { nam: 1990, thang: 6, ngay: 8, gio: 8, phut: 30, gioi_tinh: "nam", mien: "nam", nam_xem: 2026 };
let mayChu: Server | null = null;

async function khoiDong(opt: TuyChon = {}) {
  mayChu = createServer(taoUngDung(opt));
  await new Promise<void>((r) => mayChu!.listen(0, "127.0.0.1", r));
  const goc = `http://127.0.0.1:${(mayChu!.address() as AddressInfo).port}`;
  const post = (body: unknown, raw?: string) => fetch(`${goc}/api/viet-van`, { method: "POST", headers: { "Content-Type": "application/json" }, body: raw ?? JSON.stringify(body) });
  return { goc, post };
}
afterEach(() => new Promise<void>((r) => (mayChu ? mayChu.close(() => r()) : r())));

describe("API viết văn", () => {
  it("health báo AI bật/tắt", async () => {
    const a = await khoiDong();
    expect(await (await fetch(`${a.goc}/api/health`)).json()).toEqual({ ok: true, llm: false });
  });

  it("dữ liệu sai → 400, báo lỗi tiếng Việt, không gọi LLM", async () => {
    let goi = 0;
    const { post } = await khoiDong({ vietLlm: async () => { goi++; return ""; } });
    const r = await post({ ...NHAP, ngay: 31, thang: 2 });
    expect(r.status).toBe(400);
    expect((await r.json()).loi).toContain("Ngày dương lịch không tồn tại.");
    expect((await post(null, "{hỏng")).status).toBe(400);
    expect((await post({ ...NHAP, profile: { luu_ha: "bay_bam" } })).status).toBe(400);
    expect(goi).toBe(0);
  });

  it("không có LLM → trả văn mẫu đã hậu kiểm, kèm lý do", async () => {
    const { post } = await khoiDong();
    const j = await (await post(NHAP)).json();
    expect(j.che_do).toBe("mau");
    expect(j.van).toContain("# Tổng quan");
    expect(j.bo).toBe(0);
    expect(j.ly_do).toMatch(/chưa bật/);
  });

  it("LLM: câu không mã/mã bịa bị bỏ; kết quả được cache theo dữ liệu sinh", async () => {
    let goi = 0;
    let prompt: unknown;
    const { post } = await khoiDong({
      vietLlm: async (bc) => { goi++; prompt = bc; return "# Tổng quan\nCâu đúng [TQ]. Câu bịa không mã. Câu mã giả [XXX].\nCâu chủ đề [CD.Sự nghiệp]."; },
    });
    const j = await (await post(NHAP)).json();
    expect(j).toEqual({ van: "# Tổng quan\nCâu đúng [TQ].\nCâu chủ đề [CD.Sự nghiệp].", che_do: "llm", bo: 2 });
    expect((prompt as { chu_de: object }).chu_de).toBeTruthy();
    // tên người dùng không được đi vào prompt, và cùng dữ liệu sinh chỉ gọi LLM 1 lần
    const j2 = await (await post({ ...NHAP, ho_ten: "Nguyễn Văn A" })).json();
    expect(j2.cache).toBe(true);
    expect(goi).toBe(1);
    expect(JSON.stringify(prompt)).not.toContain("Nguyễn Văn A");
  });

  it.each([
    ["LLM ném lỗi", async () => { throw new Error("hết hạn mức"); }],
    ["văn rỗng sau hậu kiểm", async () => "Toàn câu không có mã nào."],
  ])("%s → rơi về văn mẫu", async (_ten, vietLlm) => {
    const { post } = await khoiDong({ vietLlm });
    const j = await (await post(NHAP)).json();
    expect(j.che_do).toBe("mau");
    expect(j.ly_do).toMatch(/không phản hồi/);
  });

  it("giới hạn lượt AI theo IP mỗi giờ; hết lượt vẫn trả văn mẫu", async () => {
    let t = 1_000_000;
    const { post } = await khoiDong({ vietLlm: async () => "Câu [TQ].", gioiHanMoiGio: 2, now: () => t });
    expect((await post({ ...NHAP, nam: 1991 })).status).toBe(200);
    expect((await post({ ...NHAP, nam: 1992 })).status).toBe(200);
    const r = await post({ ...NHAP, nam: 1993 });
    expect(r.status).toBe(429);
    expect(r.headers.get("retry-after")).toBe("3600");
    expect((await r.json()).che_do).toBe("mau");
    t += 3_600_001; // sang giờ mới
    expect((await post({ ...NHAP, nam: 1994 })).status).toBe(200);
  });

  it("body quá lớn → 413", async () => {
    const { post } = await khoiDong();
    expect((await post(null, JSON.stringify({ ho_ten: "x".repeat(20_000) }))).status).toBe(413);
  });

  it("CORS chỉ mở cho origin cấu hình", async () => {
    const { goc } = await khoiDong({ corsOrigin: "https://tuvi.example" });
    const r = await fetch(`${goc}/api/health`);
    expect(r.headers.get("access-control-allow-origin")).toBe("https://tuvi.example");
    expect((await fetch(`${goc}/api/viet-van`, { method: "OPTIONS" })).status).toBe(204);
  });
});

describe("web tĩnh", () => {
  it("phục vụ index, assets, SPA fallback; chặn path traversal", async () => {
    const dist = mkdtempSync(join(tmpdir(), "tuvi-dist-"));
    mkdirSync(join(dist, "assets"));
    writeFileSync(join(dist, "index.html"), "<!doctype html><title>Tử Vi</title>");
    writeFileSync(join(dist, "assets", "a.js"), "console.log(1)");
    const { goc } = await khoiDong({ thuMucTinh: dist });
    const g = await fetch(`${goc}/`);
    expect(g.status).toBe(200);
    expect(await g.text()).toContain("Tử Vi");
    expect(g.headers.get("x-content-type-options")).toBe("nosniff");
    const js = await fetch(`${goc}/assets/a.js`);
    expect(js.headers.get("content-type")).toMatch(/javascript/);
    expect(js.headers.get("cache-control")).toMatch(/immutable/);
    expect((await fetch(`${goc}/la-so/abc`)).status).toBe(200); // SPA
    writeFileSync(join(dist, "..", "bi-mat.txt"), "TUYET-MAT");
    for (const duong of ["/%2e%2e/bi-mat.txt", "/..%2fbi-mat.txt", "/%2e%2e/%2e%2e/etc/passwd.txt", "/assets/../../bi-mat.txt"]) {
      const r = await fetch(`${goc}${duong}`);
      expect(r.status, duong).toBe(404);
      expect(await r.text()).not.toContain("TUYET-MAT");
    }
    expect(await (await fetch(`${goc}/%2e%2e/%2e%2e/etc/passwd`)).text()).not.toContain("root:"); // không có đuôi → SPA, không lộ file
    expect((await fetch(`${goc}/assets/khong-co.js`)).status).toBe(404);
  });
});
