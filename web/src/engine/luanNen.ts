// Lời luận cho các yếu tố nền ở ô giữa lá số (bản mệnh, cục, chủ mệnh, chủ thân, cân lượng, lai nhân, Thân cư, âm dương, Tứ Hóa).
// Chỉ để hiển thị trong ngăn kéo; không tham gia chấm điểm. Dữ liệu: data/knowledge/yeu_to_nen.json (AI tổng hợp, chưa đối chiếu sách).
import yeuTo from "@kb/yeu_to_nen.json";
import { CAN, CHI, type LaSo } from "./anSao";
import { triThuc } from "./kb";
import { canLuong, chuMenh, chuThan, laiNhan, quanHeCucMenh, tenNapAm } from "./thongTin";
import { NEN_CUC } from "./vanNen";
import type { BaoCao } from "./types";

export type NenId = "am_duong" | "ban_menh" | "cuc" | "chu_menh" | "chu_than" | "can_luong" | "lai_nhan" | "than_cu" | "tu_hoa";

export interface LuanNen {
  tieu_de: string;
  /** Dữ kiện của lá số này (đúng như hiện ở ô giữa). */
  du_kien: string;
  doan: string[];
  ghi_chu?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const D = yeuTo as any;
const HANH_CUC: Record<string, string> = { Thuy: "Thủy", Moc: "Mộc", Kim: "Kim", Tho: "Thổ", Hoa: "Hỏa" };
const SO_CUC = ["", "", "nhị", "tam", "tứ", "ngũ", "lục"];

/** Tổng cân lượng theo chỉ (3 lượng 3 chỉ → 33). */
export const tongChiCanLuong = (ls: LaSo): number => {
  const m = /(\d+) lượng (\d+) chỉ/.exec(canLuong(ls));
  return m ? Number(m[1]) * 10 + Number(m[2]) : 0;
};

export function luanNen(id: NenId, ls: LaSo, bc: BaoCao | null): LuanNen {
  const i = ls.input;
  switch (id) {
    case "am_duong": {
      const doan = D.am_duong[ls.am_duong_nam_nu] as string;
      return { tieu_de: "Âm dương", du_kien: ls.am_duong_nam_nu, doan: [doan] };
    }
    case "ban_menh": {
      const ten = tenNapAm(CAN.indexOf(i.can_nam), CHI.indexOf(i.chi_nam));
      const doan = [D.nap_am[ten] as string];
      const k = bc?.nen[0]?.id.replace(/^NEN\./, "") ?? "";
      doan.push(`${quanHeCucMenh(ls.cuc.hanh, ls.ban_menh)}. ${NEN_CUC[k] ?? ""}`.trim());
      return { tieu_de: "Bản mệnh (nạp âm)", du_kien: ten, doan };
    }
    case "cuc":
      return { tieu_de: "Cục mệnh", du_kien: `${HANH_CUC[ls.cuc.hanh]} ${SO_CUC[ls.cuc.so]} cục`, doan: [D.cuc[ls.cuc.hanh] as string, `${quanHeCucMenh(ls.cuc.hanh, ls.ban_menh)}.`] };
    case "chu_menh": {
      const sao = chuMenh(ls);
      return { tieu_de: "Chủ mệnh", du_kien: sao, doan: [D.chu_menh[sao] as string], ghi_chu: "Chủ mệnh tra theo chi năm sinh." };
    }
    case "chu_than": {
      const sao = chuThan(ls);
      return { tieu_de: "Chủ thân", du_kien: sao, doan: [D.chu_than[sao] as string], ghi_chu: "Chủ thân tra theo chi năm sinh." };
    }
    case "can_luong": {
      const tong = tongChiCanLuong(ls);
      const muc = (D.can_luong as { den: number; text: string }[]).find((m) => tong <= m.den)!;
      return { tieu_de: "Cân lượng (cân xương)", du_kien: canLuong(ls), doan: [muc.text], ghi_chu: "Cân lượng là phép luận dân gian, mang tính tham khảo; đây là mô tả theo mức nặng nhẹ, không phải lời đoán gốc của từng mức." };
    }
    case "lai_nhan": {
      const cung = laiNhan(ls);
      return { tieu_de: "Lai nhân", du_kien: `cung ${cung}`, doan: [D.lai_nhan[cung] as string], ghi_chu: "Lai nhân là cung đầu tiên (đếm từ Dần) có can trùng can năm sinh." };
    }
    case "than_cu": {
      const cung = ls.cung_chuc[ls.than];
      const txt = triThuc().cfg.than_cu[cung] as string | undefined;
      const doan = [txt ?? `Thân cư ${cung}.`];
      if (bc) doan.push(`Cung ${cung} đang ở mức ${bc.than.xep_loai.toLowerCase()} (khoảng ${bc.than.diem100}/100).`);
      return { tieu_de: "Thân cư", du_kien: `cung ${cung}`, doan };
    }
    case "tu_hoa": {
      const tt = triThuc();
      const doan = Object.entries(ls.tu_hoa).map(([hoa, sao]) => {
        const cung = ls.cung_chuc[ls.sao[sao]];
        const goc = (D.tu_hoa[hoa] as string).replace("{cung}", cung);
        const rieng = tt.tuHoa[`${sao}|${hoa}`];
        return `${hoa.replace("Hóa ", "")}: ${sao} ở cung ${cung}. ${goc}${rieng ? ` ${rieng}` : ""}`;
      });
      return { tieu_de: "Tứ Hóa", du_kien: Object.entries(ls.tu_hoa).map(([h, s]) => `${h.replace("Hóa ", "")}: ${s}`).join(" · "), doan };
    }
  }
}
