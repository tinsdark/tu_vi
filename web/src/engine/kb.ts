// Cơ sở tri thức (data/knowledge/*.json) — dùng chung với bản Python. Kiểu lỏng vì JSON do người/AI soạn.
import cachCuc from "@kb/cach_cuc.json";
import cauHinh from "@kb/cau_hinh_luan_giai.json";
import chinhTinh from "@kb/chinh_tinh.json";
import chinhTinhTaiChi from "@kb/chinh_tinh_tai_chi.json";
import chinhTinhTaiCungChuc from "@kb/chinh_tinh_tai_cung_chuc.json";
import doSang from "@kb/do_sang.json";
import keChuyen from "@kb/ke_chuyen.json";
import doSangChot from "@kb/do_sang_chot.json";
import phuTinh from "@kb/phu_tinh.json";
import phuTinhTaiCungChuc from "@kb/phu_tinh_tai_cung_chuc.json";
import cauHoi from "@kb/cau_hoi.json";
import lienCung from "@kb/luan_lien_cung.json";
import trucLuan from "@kb/truc_luan.json";
import vanPhong from "@kb/van_phong.json";
import tuHoaLuan from "@kb/tu_hoa_luan.json";
import { CHI } from "./anSao";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Dk = Record<string, any>;

export interface PhuTinh { ten: string; hanh: string; diem: number; tag: string[]; y_nghia: string; dac_dia?: string[] }
export interface CachCuc {
  id: string; ten: string; loai?: string; pham_vi?: string | string[]; thanh: Dk; pha?: Dk; diem: number; diem_pha?: number;
  linh_vuc?: string[]; ket_luan: string; ket_luan_theo_cung?: Record<string, string>; ket_luan_pha?: string; xac_nhan_web?: boolean; web?: string[]; doi_chieu?: string;
}

export interface TrucLuan { id: string; ten: string; xd?: string; duong: { nhan: string; cau: string[] }; am: { nhan: string; cau: string[] } }

export class TriThuc {
  cfg: any = cauHinh;
  phu = new Map<string, PhuTinh>((phuTinh as any).sao.map((s: PhuTinh) => [s.ten, s]));
  nhom: Record<string, string[]> = (phuTinh as any).nhom;
  chinh = new Map<string, any>((chinhTinh as any).sao.map((s: any) => [s.ten, s]));
  boSao: any = chinhTinhTaiChi;
  maTran: Record<string, Record<string, [number, string, string]>> = (chinhTinhTaiCungChuc as any).ma_tran;
  cach: CachCuc[] = (cachCuc as any).cach;
  phaChung: any = (cachCuc as any)._meta.pha_chung;
  tuHoa: Record<string, string> = (tuHoaLuan as any).to_hop;
  /** Trục luận từng cung (tools/sinh_truc_luan.py): phát hiện các câu của cùng một cung nói ngược nhau. */
  truc: Record<string, TrucLuan[]> = (trucLuan as any).truc;
  /** Luận liên cung (doc11 lô B): Tuần/Triệt theo cung, sao → người, so cung với cung. Dữ liệu chạy cho mọi cung/sao có trong bảng. */
  lienCung: any = lienCung;
  /** Danh sách câu hỏi thường gặp (doc11 lô C). */
  cauHoi: any = cauHoi;
  /** Kho câu nối và mẫu tổng kết/hỏi đáp của lớp văn xuôi (doc11 lô C). */
  vanPhong: any = vanPhong;
  /** Bảng kể chuyện cho văn xuôi (chỉ web dùng): hình dạng chủ đề + "việc nên làm". */
  keChuyen: any = keChuyen;
  phuCung: Record<string, Record<string, string>> = (phuTinhTaiCungChuc as any).sao;
  /** `_meta` từng file tri thức (trạng thái, nguồn) — dùng để hiển thị độ tin cậy. */
  meta = {
    chinh_tinh: (chinhTinh as any)._meta,
    chinh_tinh_cung: (chinhTinhTaiCungChuc as any)._meta,
    bo_sao: (chinhTinhTaiChi as any)._meta,
    phu_tinh: (phuTinh as any)._meta,
    phu_cung: (phuTinhTaiCungChuc as any)._meta,
    tu_hoa: (tuHoaLuan as any)._meta,
    cach_cuc: (cachCuc as any)._meta,
    do_sang: (doSangChot as any)._meta,
  };
  private doSang = new Map<string, Record<string, string | null>>();

  constructor() {
    for (const s of (doSang as any).sao) this.doSang.set(s.ten.toLowerCase(), s.theo_chi);
    for (const [ten, s] of Object.entries((doSangChot as any).sao)) this.doSang.set(ten.toLowerCase(), (s as any).theo_chi);
  }

  sang(sao: string, chi: number): string | null {
    return this.doSang.get(sao.toLowerCase())?.[CHI[chi]] ?? null;
  }
}

let mau: TriThuc | null = null;
export const triThuc = (): TriThuc => (mau ??= new TriThuc());
