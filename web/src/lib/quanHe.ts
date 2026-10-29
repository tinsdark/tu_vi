// Quan hệ giữa các cung: cung nào chiếu vào cung đang xem, sao nào ở đó giúp hay làm xấu nó.
// Không tính lại gì: lấy đúng các khoản cát/sát mà engine đã dùng để chấm điểm cung (phan_tich.cat / .sat),
// gom theo cung nguồn. Riêng cung giáp engine chỉ dùng cho các cách "giáp" nên ở đây chỉ liệt kê, không có điểm.
import { CHI, dungOCung, type KetQuaCung, type KetQuaTinh } from "../engine";

export type LoaiQuanHe = "ban" | "xung" | "tam_hop" | "giap";

export const TEN_QUAN_HE: Record<LoaiQuanHe, string> = { ban: "Bản cung", xung: "Xung chiếu", tam_hop: "Tam hợp", giap: "Giáp" };

export interface SaoGop { sao: string; diem: number }

export interface QuanHeCung {
  /** Địa chi 1..12 của cung nguồn. */
  chi: number;
  loai: LoaiQuanHe;
  /** Tên cung chức tại đó (Mệnh, Phúc Đức…). */
  ten: string;
  cat: SaoGop[];
  sat: SaoGop[];
  /** Tổng điểm cát + sát của riêng cung này (sát là số âm). Cung giáp luôn là 0 vì engine không tính điểm. */
  tong: number;
  /** false với cung giáp: chỉ để tham khảo. */
  tinhDiem: boolean;
}

export interface QuanHeCuaCung {
  chi: number;
  ten: string;
  quanHe: QuanHeCung[];
  tongCat: number;
  tongSat: number;
  diem100: number;
  xepLoai: string;
  tuanTriet: string[];
  voChinhDieu: boolean;
}

const mv = (chi: number, n: number) => ((((chi - 1 + n) % 12) + 12) % 12) + 1;
const lam = (x: number) => Math.round(x * 100) / 100;

/** Bốn cung chiếu vào `chi` theo tam phương tứ chính, cộng hai cung giáp. */
export function cungLienQuan(chi: number): { chi: number; loai: LoaiQuanHe }[] {
  return [
    { chi, loai: "ban" },
    { chi: mv(chi, 6), loai: "xung" },
    { chi: mv(chi, 4), loai: "tam_hop" },
    { chi: mv(chi, -4), loai: "tam_hop" },
    { chi: mv(chi, -1), loai: "giap" },
    { chi: mv(chi, 1), loai: "giap" },
  ];
}

export function quanHeCuaCung(kq: KetQuaTinh, chi: number): QuanHeCuaCung {
  const ls = kq.la_so;
  const ten = ls.cung_chuc[chi];
  const k: KetQuaCung = kq.bao_cao.cung[ten];
  const o = dungOCung(ls);
  const quanHe = cungLienQuan(chi).map(({ chi: c, loai }): QuanHeCung => {
    if (loai === "giap") {
      const ten_ = (ds: { ten: string }[]) => ds.map((s) => ({ sao: s.ten, diem: 0 }));
      return { chi: c, loai, ten: ls.cung_chuc[c], cat: ten_(o[c].tot), sat: ten_(o[c].xau), tong: 0, tinhDiem: false };
    }
    const tai = (ds: { sao: string; cung: string; diem: number }[]) => ds.filter((x) => CHI.indexOf(x.cung) === c).map((x) => ({ sao: x.sao, diem: x.diem }));
    const cat = tai(k.phan_tich.cat);
    const sat = tai(k.phan_tich.sat);
    return { chi: c, loai, ten: ls.cung_chuc[c], cat, sat, tong: lam([...cat, ...sat].reduce((a, x) => a + x.diem, 0)), tinhDiem: true };
  });
  return {
    chi, ten, quanHe,
    tongCat: k.phan_tich.tong_cat, tongSat: k.phan_tich.tong_sat,
    diem100: k.diem100, xepLoai: k.xep_loai, tuanTriet: k.tuan_triet, voChinhDieu: k.phan_tich.vo_chinh_dieu,
  };
}
