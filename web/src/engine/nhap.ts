// Dữ liệu người dùng nhập: kiểm tra và chuẩn hóa. Dùng chung cho giao diện và server (server không tin client).
import { PROFILE_MAC_DINH, type GioiTinh, type Profile } from "./anSao";
import { QUY_UOC_MAC_DINH, type Mien, type QuyUoc } from "./lichAm";

export interface NhapLieu {
  nam: number; thang: number; ngay: number; gio: number; phut: number;
  gioi_tinh: GioiTinh;
  mien: Mien;
  quy_uoc: QuyUoc;
  kinh_do?: number;
  profile: Profile;
  nam_xem: number;
  ho_ten?: string;
}

export const NAM_TOI_THIEU = 1900;
export const NAM_TOI_DA = 2100;

/** Giá trị hợp lệ của từng lựa chọn phái (khớp data/knowledge/bien_the.json). */
export const LUA_CHON_PROFILE: { [K in keyof Profile]: { gia_tri: Profile[K][]; nhan: string; mo_ta: string } } = {
  tu_hoa_canh: { gia_tri: ["am_dong", "dong_am"], nhan: "Tứ Hóa tuổi Canh", mo_ta: "Khoa/Kỵ rơi vào Thái Âm/Thiên Đồng (phổ biến) hay Thiên Đồng/Thái Âm" },
  tu_hoa_nham: { gia_tri: ["ta_phu", "thien_phu"], nhan: "Hóa Khoa tuổi Nhâm", mo_ta: "Tả Phù (phổ biến) hay Thiên Phủ" },
  khoi_viet: { gia_tri: ["khau_quyet", "lasotuvi"], nhan: "Thiên Khôi, Thiên Việt", mo_ta: "Theo khẩu quyết phổ biến hay theo bảng của lasotuvi" },
  hoa_linh_ty_dau_suu: { gia_tri: ["hoa_mao_linh_tuat", "hoa_tuat_linh_mao"], nhan: "Hỏa/Linh tuổi Tỵ Dậu Sửu", mo_ta: "Hỏa khởi Mão, Linh khởi Tuất (khẩu quyết) hay ngược lại" },
  pha_toai: { gia_tri: ["khau_quyet", "lasotuvi"], nhan: "Phá Toái", mo_ta: "Theo khẩu quyết hay theo lasotuvi" },
  thien_giai: { gia_tri: ["khong_nhay", "nhay_cung"], nhan: "Thiên Giải", mo_ta: "Đếm thuận từ Thân (2 nguồn VN) hay nhảy cung (lasotuvi)" },
  luu_ha: { gia_tri: ["thai_thu_lang", "thien_luong", "ngu_hanh"], nhan: "Lưu Hà (tuổi Đinh, Canh, Tân)", mo_ta: "Thái Thứ Lang / Thiên Lương / cách Ngũ Hành" },
  thien_tru_quy: { gia_tri: ["tuat", "hoi"], nhan: "Thiên Trù tuổi Quý", mo_ta: "Tuất (lasotuvi) hay Hợi (iztro)" },
  thien_quy: { gia_tri: ["nghich", "thuan"], nhan: "Thiên Quý", mo_ta: "Từ Văn Khúc đếm nghịch (lasotuvi) hay thuận (iztro)" },
  luu_nguyet: { gia_tri: ["tieu_han", "thai_tue"], nhan: "Lưu nguyệt", mo_ta: "Tháng Giêng khởi từ cung tiểu hạn (tracuutuvi.com) hay từ cung Thái Tuế" },
};

export const LUA_CHON_QUY_UOC = {
  ty_muon: ["ngay_sau", "ngay_do"],
  thang_nhuan: ["nhu_thang_truoc", "nhu_thang_sau", "chia_nua"],
} as const;

const soNguyen = (x: unknown, lo: number, hi: number): x is number => typeof x === "number" && Number.isInteger(x) && x >= lo && x <= hi;

function ngayHopLe(y: number, m: number, d: number): boolean {
  const t = new Date(Date.UTC(2000, m - 1, d));
  t.setUTCFullYear(y);
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** Kiểm tra dữ liệu thô (từ form hoặc JSON). Trả về dữ liệu đã chuẩn hóa hoặc danh sách lỗi (tiếng Việt). */
export function chuanHoaNhap(raw: unknown, namHienTai = new Date().getFullYear()): { ok: true; nhap: NhapLieu } | { ok: false; loi: string[] } {
  const loi: string[] = [];
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const { nam, thang, ngay, gio, phut } = r;
  if (!soNguyen(nam, NAM_TOI_THIEU, NAM_TOI_DA)) loi.push(`Năm sinh phải từ ${NAM_TOI_THIEU} đến ${NAM_TOI_DA}.`);
  if (!soNguyen(thang, 1, 12)) loi.push("Tháng sinh phải từ 1 đến 12.");
  if (!soNguyen(ngay, 1, 31)) loi.push("Ngày sinh phải từ 1 đến 31.");
  if (!soNguyen(gio, 0, 23)) loi.push("Giờ sinh phải từ 0 đến 23.");
  if (!soNguyen(phut, 0, 59)) loi.push("Phút sinh phải từ 0 đến 59.");
  if (!loi.length && !ngayHopLe(nam as number, thang as number, ngay as number)) loi.push("Ngày dương lịch không tồn tại.");
  if (r.gioi_tinh !== "nam" && r.gioi_tinh !== "nu") loi.push("Giới tính phải là nam hoặc nữ.");
  const mien = r.mien ?? "nam";
  if (mien !== "bac" && mien !== "nam") loi.push("Nơi sinh phải là miền Bắc hoặc miền Nam.");

  const qr = (r.quy_uoc && typeof r.quy_uoc === "object" ? r.quy_uoc : {}) as Record<string, unknown>;
  const quyUoc: QuyUoc = { ...QUY_UOC_MAC_DINH };
  for (const k of ["ty_muon", "thang_nhuan"] as const) {
    if (qr[k] === undefined) continue;
    if ((LUA_CHON_QUY_UOC[k] as readonly unknown[]).includes(qr[k])) (quyUoc[k] as unknown) = qr[k];
    else loi.push(`Quy ước ${k} không hợp lệ.`);
  }
  for (const k of ["mui_gio_lich_su", "gio_mat_troi"] as const) {
    if (qr[k] === undefined) continue;
    if (typeof qr[k] === "boolean") quyUoc[k] = qr[k] as boolean;
    else loi.push(`Quy ước ${k} phải là đúng/sai.`);
  }
  let kinhDo: number | undefined;
  if (r.kinh_do !== undefined && r.kinh_do !== null && r.kinh_do !== "") {
    if (typeof r.kinh_do === "number" && r.kinh_do >= 100 && r.kinh_do <= 110) kinhDo = r.kinh_do;
    else loi.push("Kinh độ nơi sinh phải từ 100 đến 110 (độ Đông).");
  }
  if (quyUoc.gio_mat_troi && kinhDo === undefined) loi.push("Dùng giờ mặt trời thì phải nhập kinh độ nơi sinh.");

  const pr = (r.profile && typeof r.profile === "object" ? r.profile : {}) as Record<string, unknown>;
  const profile: Profile = { ...PROFILE_MAC_DINH };
  for (const k of Object.keys(LUA_CHON_PROFILE) as (keyof Profile)[]) {
    if (pr[k] === undefined) continue;
    if ((LUA_CHON_PROFILE[k].gia_tri as readonly unknown[]).includes(pr[k])) (profile[k] as unknown) = pr[k];
    else loi.push(`Lựa chọn phái "${k}" không hợp lệ.`);
  }

  const namXem = r.nam_xem === undefined ? namHienTai : r.nam_xem;
  if (!soNguyen(namXem, NAM_TOI_THIEU, NAM_TOI_DA + 150)) loi.push("Năm xem hạn không hợp lệ.");
  else if (typeof nam === "number" && namXem < nam) loi.push("Năm xem hạn không được trước năm sinh.");
  let hoTen: string | undefined;
  if (r.ho_ten !== undefined && r.ho_ten !== null) {
    if (typeof r.ho_ten === "string" && r.ho_ten.length <= 80) hoTen = r.ho_ten.trim() || undefined;
    else loi.push("Tên quá dài (tối đa 80 ký tự).");
  }
  if (loi.length) return { ok: false, loi };
  return {
    ok: true,
    nhap: { nam: nam as number, thang: thang as number, ngay: ngay as number, gio: gio as number, phut: phut as number, gioi_tinh: r.gioi_tinh as GioiTinh, mien: mien as Mien, quy_uoc: quyUoc, kinh_do: kinhDo, profile, nam_xem: namXem as number, ho_ten: hoTen },
  };
}
