// Khóa web bằng mật khẩu. Trong source chỉ có băm PBKDF2 (khoa.json), không có mật khẩu.
// Lưu ý: web tĩnh nên đây là chốt chặn phía trình duyệt, đủ ngăn người lạ vào xem; không phải bảo mật cấp máy chủ.
import khoa from "./khoa.json";

const KHOA_PHIEN = "tuvi_mo_khoa";

export interface MaKhoa { salt: string; lan: number; bam: string }

const tuHex = (s: string) => Uint8Array.from(s.match(/../g) ?? [], (b) => parseInt(b, 16));
const raHex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");

/** Băm giống tools/doi_mat_khau.mjs rồi so sánh hằng thời gian. */
export async function kiemTraMatKhau(mk: string, ma: MaKhoa = khoa): Promise<boolean> {
  if (!globalThis.crypto?.subtle) throw new Error("Trình duyệt cần HTTPS (hoặc localhost) để kiểm tra mật khẩu.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(mk.normalize("NFC")), "PBKDF2", false, ["deriveBits"]);
  const bam = raHex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: tuHex(ma.salt), iterations: ma.lan }, key, 256));
  let lech = bam.length ^ ma.bam.length;
  for (let i = 0; i < ma.bam.length; i++) lech |= bam.charCodeAt(i) ^ ma.bam.charCodeAt(i);
  return lech === 0;
}

export function daMoKhoa(): boolean {
  try { return sessionStorage.getItem(KHOA_PHIEN) === khoa.bam; } catch { return false; }
}

export function ghiMoKhoa(): void {
  try { sessionStorage.setItem(KHOA_PHIEN, khoa.bam); } catch { /* chế độ riêng tư: hỏi lại mỗi lần tải */ }
}
