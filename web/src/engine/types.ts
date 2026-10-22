export type { TenCung } from "./anSao";

export interface NhanDinh {
  id: string;
  diem: number;
  nhan_dinh: string;
  ly_do?: string;
  linh_vuc?: string[];
  cung?: string;
  /** Sát tinh đắc địa: điểm bị lật dương nhưng câu luận vẫn mô tả mặt xấu → không xếp vào điểm mạnh/yếu. */
  dao_dau?: boolean;
}

export interface KetQuaCung {
  cung: string;
  chi: string;
  diem: number;
  xep_loai: string;
  phan_vi: number;
  chinh_tinh: string[];
  tuan_triet: string[];
  nhan_dinh: NhanDinh[];
  chi_tiet_diem: [string, string, string, number][];
}

export interface KetQuaThan {
  cu: string;
  chi: string;
  xep_loai: string;
  phan_vi: number;
  nhan_dinh: NhanDinh[];
}

export interface KetQuaChuDe {
  phan_vi: number;
  xep_loai: string;
  diem_manh: NhanDinh[];
  diem_yeu: NhanDinh[];
  cung: Record<string, string>;
}

export interface DanhGiaDaiHan { chi: string; xep_loai: string; diem: number; noi_bat: NhanDinh[] }

export interface KetQuaHan {
  tuoi_am: number;
  nam_xem: number;
  dai_han: null | {
    chi: string; cung_goc: string; tu_tuoi: number; can: string;
    tu_hoa: Record<string, string>;
    danh_gia: Record<string, DanhGiaDaiHan>;
  };
  tieu_han: { chi: string; cung_goc: string; xep_loai: string; diem: number };
  luu_nien: {
    thai_tue_tai: string; xep_loai: string; diem: number;
    tu_hoa: Record<string, string>; sao_luu: Record<string, string>; ghi_chu: NhanDinh[];
  };
  luu_nguyet: { thang: number; chi: string; cung_goc: string; diem: number; nhan_xet: string }[];
}

export interface BaoCao {
  la_so: { input: import("./anSao").LaSo["input"]; am_duong_nam_nu: string; ban_menh: string; cuc: { hanh: string; so: number } };
  menh_tai: string;
  nen: NhanDinh[];
  than: KetQuaThan;
  cung: Record<string, KetQuaCung>;
  chu_de: Record<string, KetQuaChuDe>;
  han?: KetQuaHan;
}
