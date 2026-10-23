export type { TenCung } from "./anSao";

/** Vị trí của cung nguồn so với cung đang luận: bản cung, xung chiếu, tam hợp, hoặc cung liên quan nằm ngoài tam phương tứ chính. */
export type QuanHe = "ban_cung" | "xung" | "tam_hop" | "lien_quan";

export interface NhanDinh {
  id: string;
  diem: number;
  nhan_dinh: string;
  ly_do?: string;
  linh_vuc?: string[];
  cung?: string;
  /** Metadata nguồn: sao/cung nào sinh ra nhận định này (không bao giờ gán sao của cung này sang mục của cung khác). */
  cung_nguon?: string;
  chi_nguon?: string;
  quan_he?: QuanHe;
  nhan?: string[];
  /** Ghi chú cấu trúc (VD cung vô chính diệu) — hiển thị riêng, không tính điểm mạnh/yếu. */
  luu_y?: boolean;
  /** Sát tinh đắc địa: điểm bị lật dương nhưng câu luận vẫn mô tả mặt xấu → không xếp vào điểm mạnh/yếu. */
  dao_dau?: boolean;
}

export interface KetQuaCung {
  cung: string;
  chi: string;
  diem: number;
  xep_loai: string;
  /** Điểm nội tại /100 (bội số 5): tương quan giữa các cung của CHÍNH lá số này, không phải percentile so với lá số khác. */
  diem100: number;
  /** Sát tinh ở xung/hội chiếu (nguồn của câu cảnh báo gián tiếp theo chủ đề). */
  sat_xh: { sao: string; cung: string; chi: string; quan_he: QuanHe }[];
  /** Chính tinh miếu/vượng và sát tinh chỉ đến từ xung/hội chiếu → đã áp sàn 'trung bình'. */
  san_chinh_tinh: boolean;
  chinh_tinh_dac: boolean;
  chinh_tinh: string[];
  tuan_triet: string[];
  nhan_dinh: NhanDinh[];
  chi_tiet_diem: [string, string, string, number][];
}

export interface KetQuaThan {
  cu: string;
  chi: string;
  xep_loai: string;
  diem100: number;
  nhan_dinh: NhanDinh[];
}

export interface KetQuaChuDe {
  diem100: number;
  xep_loai: string;
  diem_manh: NhanDinh[];
  diem_yeu: NhanDinh[];
  /** Câu dẫn hòa giải khi chủ đề vừa có điểm sáng mạnh vừa có điểm hung rõ. */
  cau_dan: string | null;
  /** Lưu ý cấu trúc của cung chủ đề (VD vô chính diệu). */
  luu_y: NhanDinh[];
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
    /** Kết luận hành động: trọng tâm rủi ro → nên/tránh → mặt thuận. */
    ket_luan: NhanDinh[];
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
