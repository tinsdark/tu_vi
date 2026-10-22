// Vẽ lá số ra chuỗi SVG (để tải ảnh / in). Giao diện web dùng bản HTML (BanCo.tsx); cả hai dùng chung dungOCung.
import type { LaSo } from "./anSao";
import { CHI } from "./anSao";
import { dungOCung, VI_TRI_LUOI } from "./boCuc";
import { HANH_VN } from "./luanGiai";

const W = 250;
const H = 260;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function veLaSo(ls: LaSo, tieuDe = "Lá số Tử Vi", hoTen?: string): string {
  const o = dungOCung(ls);
  const out: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${4 * W} ${4 * H}" width="${4 * W}" height="${4 * H}" font-family="'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif">`,
    "<style>.k{fill:#fff;stroke:#555}.t{font-size:13px}.ct{font-size:15px;font-weight:700}.tot{fill:#1a7f37}.xau{fill:#b42318}.nho{font-size:11px;fill:#666}.cc{font-size:14px;font-weight:700;fill:#1f3a8a}.tt{font-size:12px;font-weight:700;fill:#fff}</style>",
    `<rect x="0" y="0" width="${4 * W}" height="${4 * H}" fill="#fafafa"/>`,
  ];
  for (let chi = 1; chi <= 12; chi++) {
    const c = o[chi];
    const [r, col] = VI_TRI_LUOI[chi];
    const x = col * W;
    const y = r * H;
    out.push(`<rect class="k" x="${x}" y="${y}" width="${W}" height="${H}"/>`);
    out.push(`<text class="cc" x="${x + W / 2}" y="${y + 18}" text-anchor="middle">${esc((c.ten + (c.la_than ? " · THÂN" : "")).toUpperCase())}</text>`);
    out.push(`<text class="nho" x="${x + 6}" y="${y + 18}">${CHI[chi]}</text>`);
    out.push(`<text class="nho" x="${x + W - 6}" y="${y + 18}" text-anchor="end">${c.dai_han}</text>`);
    let dy = y + 40;
    for (const s of c.chinh) {
      const hoa = s.hoa.length ? ` · ${s.hoa.join("/")}` : "";
      out.push(`<text class="ct ${s.muc === "H" ? "xau" : "tot"}" x="${x + W / 2}" y="${dy}" text-anchor="middle">${esc(s.ten)} (${s.muc ?? ""})${esc(hoa)}</text>`);
      dy += 19;
    }
    const cot = [dy + 4, dy + 4];
    ([[c.tot, "tot"], [c.xau, "xau"]] as const).forEach(([ds, lop], i) => {
      for (const s of ds) {
        out.push(`<text class="t ${lop}" x="${x + 8 + i * (W / 2)}" y="${cot[i] + 12}">${esc(s.ten)}${s.muc === "H" ? " (H)" : ""}</text>`);
        cot[i] += 15;
      }
    });
    const yy = Math.max(...cot) + 12;
    if (c.trung.length && yy < y + H - 28) out.push(`<text class="nho" x="${x + 8}" y="${yy}">${esc(c.trung.map((s) => s.ten).join(", ").slice(0, 60))}</text>`);
    out.push(`<text class="nho" x="${x + 6}" y="${y + H - 8}">${esc(c.bac_si)}</text>`);
    out.push(`<text class="nho" x="${x + W / 2}" y="${y + H - 8}" text-anchor="middle">${esc(c.trang_sinh)}</text>`);
    out.push(`<text class="nho" x="${x + W - 6}" y="${y + H - 22}" text-anchor="end">${esc(c.thai_tue)}</text>`);
    [c.tuan && "Tuần", c.triet && "Triệt"].filter(Boolean).forEach((m, i) => {
      out.push(`<rect x="${x + 6 + i * 52}" y="${y + H - 40}" width="46" height="17" rx="3" fill="#111"/><text class="tt" x="${x + 29 + i * 52}" y="${y + H - 27}" text-anchor="middle">${m}</text>`);
    });
  }
  const i = ls.input;
  const dong = [
    tieuDe + (hoTen ? ` — ${hoTen}` : ""),
    `Năm ${i.can_nam} ${i.chi_nam} · tháng ${i.thang} · ngày ${i.ngay} · giờ ${i.gio}`,
    ls.am_duong_nam_nu,
    `Bản Mệnh: ${HANH_VN[ls.ban_menh]} · Cục: ${HANH_VN[ls.cuc.hanh]} ${ls.cuc.so}`,
    `Mệnh tại ${CHI[ls.menh]} · Thân tại ${CHI[ls.than]}`,
    "Màu: xanh = sao tốt / sáng, đỏ = sao xấu / hãm",
    "Số góc phải mỗi ô: tuổi bắt đầu đại hạn",
  ];
  dong.forEach((d, k) => out.push(`<text x="${2 * W}" y="${H + 60 + k * 30}" text-anchor="middle" font-size="${k === 0 ? 22 : 16}"${k === 0 ? ' font-weight="700"' : ""}>${esc(d)}</text>`));
  out.push("</svg>");
  return out.join("\n");
}
