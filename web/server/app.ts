// Máy chủ nhỏ: phục vụ web tĩnh (dist/) và /api/health. Mọi tính toán chạy ở trình duyệt.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

export interface TuyChon {
  /** Thư mục web tĩnh (dist/). */
  thuMucTinh?: string;
  /** Origin được phép gọi API từ trang khác (vd web đặt ở GitHub Pages). */
  corsOrigin?: string;
}

const KIEU: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2",
};

const TIEU_DE_AN_TOAN: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'",
};

function guiJson(res: ServerResponse, ma: number, noiDung: unknown, them: Record<string, string> = {}) {
  const body = JSON.stringify(noiDung);
  res.writeHead(ma, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...TIEU_DE_AN_TOAN, ...them });
  res.end(body);
}

export function taoUngDung(opt: TuyChon = {}) {
  const thuMuc = opt.thuMucTinh ? resolve(opt.thuMucTinh) : null;

  async function tinh(req: IncomingMessage, res: ServerResponse, duongDan: string) {
    if (!thuMuc) return guiJson(res, 404, { loi: ["Không có web tĩnh."] });
    const tep = join(thuMuc, normalize(duongDan === "/" ? "/index.html" : duongDan));
    const thu = async (p: string) => (p.startsWith(thuMuc) && (await stat(p).then((s) => s.isFile(), () => false)) ? p : null);
    let p = await thu(tep);
    const laTaiNguyen = duongDan.startsWith("/assets/");
    if (!p && !extname(duongDan)) p = await thu(join(thuMuc, "index.html")); // SPA
    if (!p) return guiJson(res, 404, { loi: ["Không tìm thấy."] });
    res.writeHead(200, {
      "Content-Type": KIEU[extname(p)] ?? "application/octet-stream",
      "Cache-Control": laTaiNguyen ? "public, max-age=31536000, immutable" : "no-cache",
      ...TIEU_DE_AN_TOAN,
    });
    if (req.method === "HEAD") return res.end();
    createReadStream(p).pipe(res);
  }

  return async function xuLy(req: IncomingMessage, res: ServerResponse) {
    try {
      const url = new URL(req.url ?? "/", "http://x");
      const cors: Record<string, string> = opt.corsOrigin ? { "Access-Control-Allow-Origin": opt.corsOrigin, "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" } : {};
      if (url.pathname.startsWith("/api/")) {
        if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
        for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);
        if (url.pathname === "/api/health" && req.method === "GET") return guiJson(res, 200, { ok: true }, cors);
        return guiJson(res, 404, { loi: ["API không tồn tại."] }, cors);
      }
      if (req.method !== "GET" && req.method !== "HEAD") return guiJson(res, 405, { loi: ["Phương thức không hỗ trợ."] });
      return await tinh(req, res, decodeURIComponent(url.pathname));
    } catch (e) {
      console.error("[server]", (e as Error).message);
      if (!res.headersSent) guiJson(res, 500, { loi: ["Lỗi máy chủ."] });
      else res.end();
    }
  };
}
