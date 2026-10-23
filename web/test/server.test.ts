import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { taoUngDung, type TuyChon } from "../server/app";

let mayChu: Server | null = null;

async function khoiDong(opt: TuyChon = {}) {
  mayChu = createServer(taoUngDung(opt));
  await new Promise<void>((r) => mayChu!.listen(0, "127.0.0.1", r));
  const goc = `http://127.0.0.1:${(mayChu!.address() as AddressInfo).port}`;
  return { goc };
}
afterEach(() => new Promise<void>((r) => (mayChu ? mayChu.close(() => r()) : r())));

describe("API", () => {
  it("health", async () => {
    const a = await khoiDong();
    expect(await (await fetch(`${a.goc}/api/health`)).json()).toEqual({ ok: true });
  });

  it("API không tồn tại → 404; CORS chỉ mở cho origin cấu hình", async () => {
    const { goc } = await khoiDong({ corsOrigin: "https://tuvi.example" });
    const r = await fetch(`${goc}/api/health`);
    expect(r.headers.get("access-control-allow-origin")).toBe("https://tuvi.example");
    expect((await fetch(`${goc}/api/khong-co`, { method: "OPTIONS" })).status).toBe(204);
    expect((await fetch(`${goc}/api/viet-van`, { method: "POST", body: "{}" })).status).toBe(404);
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
