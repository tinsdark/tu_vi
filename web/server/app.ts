// Máy chủ nhỏ: (1) /api/viet-van — nhận DỮ LIỆU SINH, tự lập lá số và luận ở server, gọi LLM viết văn, hậu kiểm;
// (2) phục vụ web tĩnh (dist/). API key không bao giờ ra trình duyệt; client không gửi được prompt tùy ý.
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { chuanHoaNhap, hauKiemDayDu, tinhLaSo, vietVanMau, type BaoCao } from "../src/engine";

export type VietLlm = (bc: BaoCao) => Promise<string>;

export interface TuyChon {
  /** Hàm gọi LLM; không có thì chỉ trả văn mẫu. */
  vietLlm?: VietLlm;
  /** Thư mục web tĩnh (dist/). */
  thuMucTinh?: string;
  /** Số lần gọi LLM tối đa mỗi IP mỗi giờ. */
  gioiHanMoiGio?: number;
  /** Sau reverse proxy: lấy IP khách từ X-Forwarded-For (chỉ bật khi thật sự đứng sau proxy tin cậy). */
  tinCayProxy?: boolean;
  /** Số lần gọi LLM đồng thời tối đa. */
  dongThoiToiDa?: number;
  /** Origin được phép gọi API từ trang khác (vd web đặt ở GitHub Pages). */
  corsOrigin?: string;
  now?: () => number;
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

async function docBody(req: IncomingMessage, toiDa = 8 * 1024): Promise<unknown> {
  const manh: Buffer[] = [];
  let tong = 0;
  for await (const m of req) {
    tong += (m as Buffer).length;
    if (tong > toiDa) throw Object.assign(new Error("Dữ liệu gửi lên quá lớn."), { ma: 413 });
    manh.push(m as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(manh).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Dữ liệu không phải JSON."), { ma: 400 });
  }
}

export function taoUngDung(opt: TuyChon = {}) {
  const now = opt.now ?? Date.now;
  const gioiHan = opt.gioiHanMoiGio ?? 20;
  const dongThoiToiDa = opt.dongThoiToiDa ?? 4;
  const thuMuc = opt.thuMucTinh ? resolve(opt.thuMucTinh) : null;
  const nhatKyIp = new Map<string, { dem: number; het: number }>();
  const boNho = new Map<string, { van: string; bo: number }>(); // cache kết quả LLM theo dữ liệu sinh
  let dangChay = 0;

  const choPhepIp = (ip: string): boolean => {
    const t = now();
    const e = nhatKyIp.get(ip);
    if (!e || e.het <= t) {
      nhatKyIp.set(ip, { dem: 1, het: t + 3_600_000 });
      if (nhatKyIp.size > 10_000) for (const [k, v] of nhatKyIp) if (v.het <= t) nhatKyIp.delete(k);
      return true;
    }
    if (e.dem >= gioiHan) return false;
    e.dem += 1;
    return true;
  };

  async function vietVan(req: IncomingMessage, res: ServerResponse) {
    let raw: unknown;
    try {
      raw = await docBody(req);
    } catch (e) {
      return guiJson(res, (e as { ma?: number }).ma ?? 400, { loi: [(e as Error).message] });
    }
    const kt = chuanHoaNhap(raw);
    if (!kt.ok) return guiJson(res, 400, { loi: kt.loi });
    const bc = tinhLaSo(kt.nhap).bao_cao;
    const mau = () => vietVanMau(bc);
    if (!opt.vietLlm) return guiJson(res, 200, { ...mau(), ly_do: "Máy chủ chưa bật AI viết văn nên hiển thị bản ghép theo mẫu." });

    // khóa cache: chỉ phụ thuộc vào báo cáo (không có tên người dùng)
    const khoa = createHash("sha256").update(JSON.stringify(bc)).digest("hex");
    const co = boNho.get(khoa);
    if (co) return guiJson(res, 200, { van: co.van, che_do: "llm", bo: co.bo, cache: true });

    const xff = opt.tinCayProxy ? String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() : "";
    const ip = xff || (req.socket.remoteAddress ?? "?");
    if (!choPhepIp(ip)) return guiJson(res, 429, { ...mau(), ly_do: "Bạn đã dùng hết lượt AI trong giờ này; hiển thị bản ghép theo mẫu." }, { "Retry-After": "3600" });
    if (dangChay >= dongThoiToiDa) return guiJson(res, 503, { ...mau(), ly_do: "Máy chủ đang bận; hiển thị bản ghép theo mẫu." }, { "Retry-After": "30" });
    dangChay += 1;
    try {
      const [van, bo] = hauKiemDayDu(await opt.vietLlm(bc), bc);
      if (!van.trim()) throw new Error("Văn rỗng sau hậu kiểm");
      boNho.set(khoa, { van, bo });
      if (boNho.size > 500) boNho.delete(boNho.keys().next().value as string);
      return guiJson(res, 200, { van, che_do: "llm", bo });
    } catch (e) {
      console.error("[viet-van] LLM lỗi:", (e as Error).name, (e as Error).message.slice(0, 200)); // không ghi dữ liệu người dùng
      return guiJson(res, 200, { ...mau(), ly_do: "AI không phản hồi được; hiển thị bản ghép theo mẫu." });
    } finally {
      dangChay -= 1;
    }
  }

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
        if (url.pathname === "/api/health" && req.method === "GET") return guiJson(res, 200, { ok: true, llm: Boolean(opt.vietLlm) }, cors);
        if (url.pathname === "/api/viet-van" && req.method === "POST") return await vietVan(req, res);
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
