// Bố cục lá số để hiển thị: gom sao vào từng cung theo cách lá số truyền thống (chính tinh, phụ tinh tốt/xấu, các vòng sao).
import { CHI, DAN, DAU, HOI, MAO, MUI, NGO, SUU, THAN, THIN, TI, TUAT, TY, type LaSo } from "./anSao";
import { CHINH_TINH } from "./luanGiai";
import { triThuc, type TriThuc } from "./kb";

/** (hàng, cột) của từng địa chi trên lưới 4×4 (hàng 0 = trên). Giữa lưới (2×2) là ô thông tin. */
export const VI_TRI_LUOI: Record<number, [number, number]> = {
  [TI]: [0, 0], [NGO]: [0, 1], [MUI]: [0, 2], [THAN]: [0, 3], [THIN]: [1, 0], [DAU]: [1, 3],
  [MAO]: [2, 0], [TUAT]: [2, 3], [DAN]: [3, 0], [SUU]: [3, 1], [TY]: [3, 2], [HOI]: [3, 3],
};

export const VONG_BAC_SI = ["Bác Sĩ", "Lực Sĩ", "Thanh Long", "Tiểu Hao", "Tướng Quân", "Tấu Thư", "Phi Liêm", "Hỷ Thần", "Bệnh Phù", "Đại Hao", "Phục Binh", "Quan Phủ"];
export const VONG_THAI_TUE = ["Thái Tuế", "Thiếu Dương", "Tang Môn", "Thiếu Âm", "Quan Phù", "Tử Phù", "Tuế Phá", "Long Đức", "Bạch Hổ", "Phúc Đức", "Điếu Khách", "Trực Phù"];
export const VONG_TRANG_SINH = ["Tràng Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"];
const VONG = new Set([...VONG_BAC_SI, ...VONG_THAI_TUE, ...VONG_TRANG_SINH]);

export interface SaoHienThi { ten: string; muc: string | null }
export interface OCung {
  chi: number;
  ten: string;
  la_than: boolean;
  dai_han: number;
  chinh: { ten: string; muc: string | null; hoa: string[] }[];
  tot: SaoHienThi[];
  xau: SaoHienThi[];
  trung: SaoHienThi[];
  bac_si: string;
  thai_tue: string;
  trang_sinh: string;
  tuan: boolean;
  triet: boolean;
}

export function dungOCung(ls: LaSo, tt: TriThuc = triThuc()): Record<number, OCung> {
  const o: Record<number, OCung> = {};
  for (let chi = 1; chi <= 12; chi++) {
    o[chi] = {
      chi, ten: ls.cung_chuc[chi], la_than: chi === ls.than, dai_han: ls.dai_han[chi], chinh: [], tot: [], xau: [], trung: [],
      bac_si: "", thai_tue: "", trang_sinh: "", tuan: ls.tuan.includes(chi), triet: ls.triet.includes(chi),
    };
  }
  const hoaCua: Record<string, string[]> = {};
  for (const [hoa, goc] of Object.entries(ls.tu_hoa)) (hoaCua[goc] ??= []).push(hoa.replace("Hóa ", ""));
  for (const [ten, chi] of Object.entries(ls.sao)) {
    const c = o[chi];
    if (CHINH_TINH.includes(ten)) c.chinh.push({ ten, muc: tt.sang(ten, chi), hoa: hoaCua[ten] ?? [] });
    else if (VONG_BAC_SI.includes(ten)) c.bac_si = ten;
    else if (VONG_THAI_TUE.includes(ten)) c.thai_tue = ten;
    else if (VONG_TRANG_SINH.includes(ten)) c.trang_sinh = ten;
    else if (!VONG.has(ten) && !ten.startsWith("Hóa ")) {
      const d = tt.phu.get(ten)?.diem ?? 0;
      const s = { ten, muc: tt.sang(ten, chi) };
      (d > 0 ? c.tot : d < 0 ? c.xau : c.trung).push(s);
    }
  }
  return o;
}

export const tenChi = (chi: number): string => CHI[chi];
