// Lưu lá số trong trình duyệt (localStorage) và mã hóa vào URL để chia sẻ. Mọi thao tác bọc try/catch:
// localStorage có thể bị chặn (chế độ riêng tư) — ứng dụng vẫn chạy bình thường.
import { chuanHoaNhap, type NhapLieu } from "../engine";

const KHOA = "tuvi.la-so-da-luu.v1";
const KHOA_GIAO_DIEN = "tuvi.giao-dien";

export interface LaSoDaLuu { id: string; nhap: NhapLieu; luc: number }

export function docLuu(): LaSoDaLuu[] {
  try {
    const ds = JSON.parse(localStorage.getItem(KHOA) ?? "[]") as LaSoDaLuu[];
    return ds.flatMap((x) => {
      const kt = chuanHoaNhap(x.nhap);
      return kt.ok ? [{ id: x.id, nhap: kt.nhap, luc: x.luc }] : [];
    });
  } catch {
    return [];
  }
}

function ghiLuu(ds: LaSoDaLuu[]): boolean {
  try {
    localStorage.setItem(KHOA, JSON.stringify(ds));
    return true;
  } catch {
    return false;
  }
}

const khoaNhap = (n: NhapLieu) => [n.nam, n.thang, n.ngay, n.gio, n.phut, n.gioi_tinh, n.mien].join("|");

export function luuLaSo(nhap: NhapLieu): LaSoDaLuu[] {
  const ds = docLuu().filter((x) => khoaNhap(x.nhap) !== khoaNhap(nhap));
  ds.unshift({ id: crypto.randomUUID(), nhap, luc: Date.now() });
  ghiLuu(ds.slice(0, 50));
  return docLuu();
}

export function xoaLaSo(id: string): LaSoDaLuu[] {
  ghiLuu(docLuu().filter((x) => x.id !== id));
  return docLuu();
}

// ---- URL: #c=<base64url(JSON)> — không đưa họ tên vào link chia sẻ
const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

export function maHoaNhap(n: NhapLieu): string {
  const { ho_ten: _bo, ...khac } = n;
  return b64(JSON.stringify(khac));
}

export function giaiMaNhap(bam: string): NhapLieu | null {
  const m = /[#&]c=([A-Za-z0-9_-]+)/.exec(bam);
  if (!m) return null;
  try {
    const kt = chuanHoaNhap(JSON.parse(unb64(m[1])));
    return kt.ok ? kt.nhap : null;
  } catch {
    return null;
  }
}

export type GiaoDien = "tu_dong" | "sang" | "toi";
export function docGiaoDien(): GiaoDien {
  try {
    const v = localStorage.getItem(KHOA_GIAO_DIEN);
    return v === "sang" || v === "toi" || v === "tu_dong" ? v : "toi";
  } catch {
    return "toi";
  }
}
export function ghiGiaoDien(v: GiaoDien) {
  try { localStorage.setItem(KHOA_GIAO_DIEN, v); } catch { /* bỏ qua */ }
}
