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
  /** Câu đã được gộp vào một câu "trái chiều" (id XD.*) vì nói ngược với câu khác cùng trục: còn trong danh sách để điểm không đổi, không hiển thị. */
  an?: boolean;
  /** Phụ tinh ±1 (Thiên Mã, Thiên Khốc…): hiện câu luận nhưng KHÔNG tính vào điểm mạnh/yếu hay phép đếm §4.8. */
  nho?: boolean;
}

export interface KhoanSao { sao: string; cung: string; vi_tri: string; diem: number }

/** Phân tích điểm một cung theo công thức spec v3 (§4.9): nhìn tap_ban_cung vs danh sách base là thấy ngay nguồn sao có đúng không. */
export interface PhanTichDiem {
  cung_chu: string;
  tap_ban_cung: string[]; tap_xung: string[]; tap_tam_hop: string[];
  base: { sao: string; do_sang: string; diem: number; hoa_cuu: boolean }[];
  tong_base: number; vo_chinh_dieu: boolean;
  cat: KhoanSao[]; tong_cat: number;
  sat: KhoanSao[]; tong_sat: number;
  cach_cuc: number;
  raw_truoc_triet: number; k_triet_tuan: number; raw_sau_triet: number;
  n_chinh_tinh_mv: number; san_ap_dung: number; score_cuoi: number;
}

export interface KetQuaCung {
  cung: string;
  chi: string;
  diem: number;
  xep_loai: string;
  /** Điểm nội tại /100 (bội số 5): tương quan giữa các cung của CHÍNH lá số này, không phải percentile so với lá số khác. */
  diem100: number;
  /** Phân tích điểm: tổng theo loại (chính tinh chủ, phụ tinh cát/sát, cách cục…), phần Tuần/Triệt đã giảm, trừ phi tuyến, quy đổi, sàn/trần. */
  phan_tich: PhanTichDiem;
  /** Sát tinh ở xung/hội chiếu (nguồn của câu cảnh báo gián tiếp theo chủ đề). */
  sat_xh: { sao: string; cung: string; chi: string; quan_he: QuanHe }[];
  chinh_tinh_dac: boolean;
  /** Chính tinh của cung kèm độ sáng (hoặc sao mượn khi vô chính diệu) và cung mượn. */
  chinh_tinh_sang: [string, string | null][];
  muon_tu: [string, string] | null;
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
  /** Câu 'cung chủ': mọi chính tinh của cung chủ kèm độ sáng. */
  khung: string;
  /** §4.8: số câu sáng/hung và có vi phạm khớp điểm–nội dung trước khi ép hay không. */
  kiem_khop: { sang: number; hung: number; vi_pham_kha: boolean; vi_pham_tb: boolean };
  /** Câu dẫn hòa giải khi chủ đề vừa có điểm sáng mạnh vừa có điểm hung rõ. */
  cau_dan: string | null;
  /** Lưu ý cấu trúc của cung chủ đề (VD vô chính diệu). */
  luu_y: NhanDinh[];
  /** Chính tinh/phụ tinh của cung chủ có điểm đúng 0 (vẫn phải được luận, không xếp sáng/hung). */
  trung_tinh: NhanDinh[];
  /** Phụ tinh ±1 của cung chủ (đã sắp theo ưu tiên và cắt): không tính điểm, chỉ để luận đủ. */
  sao_nho: NhanDinh[];
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
