// Thông tin hiển thị thêm trên lá số (theo cách web tracuutuvi.com): nạp âm, can cung, lai nhân, chủ mệnh/thân, ngũ hành sao.
// Chỉ để hiển thị, không tham gia chấm điểm luận giải.
import { CAN, canCung, CHI, DAN, mv, type LaSo } from "./anSao";
import { triThuc } from "./kb";

const NAP_AM = [
  "Hải Trung Kim", "Lô Trung Hỏa", "Đại Lâm Mộc", "Lộ Bàng Thổ", "Kiếm Phong Kim", "Sơn Đầu Hỏa",
  "Giản Hạ Thủy", "Thành Đầu Thổ", "Bạch Lạp Kim", "Dương Liễu Mộc", "Tuyền Trung Thủy", "Ốc Thượng Thổ",
  "Tích Lịch Hỏa", "Tùng Bách Mộc", "Trường Lưu Thủy", "Sa Trung Kim", "Sơn Hạ Hỏa", "Bình Địa Mộc",
  "Bích Thượng Thổ", "Kim Bạch Kim", "Phúc Đăng Hỏa", "Thiên Hà Thủy", "Đại Trạch Thổ", "Thoa Xuyến Kim",
  "Tang Đố Mộc", "Đại Khê Thủy", "Sa Trung Thổ", "Thiên Thượng Hỏa", "Thạch Lựu Mộc", "Đại Hải Thủy",
];

/** Tên nạp âm của cặp can chi (VD Quý Mùi → Dương Liễu Mộc). Can/chi theo chỉ số 1-based như CAN/CHI. */
export function tenNapAm(can: number, chi: number): string {
  let n = can - 1;
  while (n % 12 !== chi - 1) n += 10; // số thứ tự trong 60 hoa giáp
  return NAP_AM[Math.floor(n / 2)];
}

const SINH: Record<string, string> = { Kim: "Thuy", Thuy: "Moc", Moc: "Hoa", Hoa: "Tho", Tho: "Kim" };
const KHAC: Record<string, string> = { Kim: "Moc", Moc: "Tho", Tho: "Thuy", Thuy: "Hoa", Hoa: "Kim" };
const VN: Record<string, string> = { Kim: "Kim", Moc: "Mộc", Thuy: "Thủy", Hoa: "Hỏa", Tho: "Thổ" };

/** "Cục Thủy sinh Mệnh Mộc"... Cục = ngũ hành của cục, Mệnh = bản mệnh (nạp âm năm sinh). */
export function quanHeCucMenh(cuc: string, menh: string): string {
  const c = `Cục ${VN[cuc]}`, m = `Mệnh ${VN[menh]}`;
  if (cuc === menh) return `${c} bình hòa ${m}`;
  if (SINH[cuc] === menh) return `${c} sinh ${m}`;
  if (SINH[menh] === cuc) return `${m} sinh ${c}`;
  if (KHAC[cuc] === menh) return `${c} khắc ${m}`;
  return `${m} khắc ${c}`;
}

/** Lai nhân: cung đầu tiên (đếm từ Dần) có can trùng can năm sinh. */
export function laiNhan(ls: LaSo): string {
  const canNam = CAN.indexOf(ls.input.can_nam);
  for (let i = 0; i < 12; i++) {
    const chi = mv(DAN, i);
    if (canCung(canNam, chi) === canNam) return ls.cung_chuc[chi];
  }
  return "";
}

// Theo chi năm sinh. Chủ mệnh: mới đối chiếu 1 lá số (Mùi → Vũ Khúc), phần còn lại theo bảng truyền thống.
const CHU_MENH = ["", "Tham Lang", "Cự Môn", "Lộc Tồn", "Văn Khúc", "Liêm Trinh", "Vũ Khúc", "Phá Quân", "Vũ Khúc", "Liêm Trinh", "Văn Khúc", "Lộc Tồn", "Cự Môn"];
const CHU_THAN = ["", "Linh Tinh", "Thiên Tướng", "Thiên Lương", "Thiên Đồng", "Văn Xương", "Thiên Cơ", "Hỏa Tinh", "Thiên Tướng", "Thiên Lương", "Thiên Đồng", "Văn Xương", "Thiên Cơ"];
export const chuMenh = (ls: LaSo): string => CHU_MENH[CHI.indexOf(ls.input.chi_nam)];
export const chuThan = (ls: LaSo): string => CHU_THAN[CHI.indexOf(ls.input.chi_nam)];

const VIET_TAT = ["", "G", "Ấ", "B", "Đ", "M", "K", "C", "T", "N", "Q"];
/** Can chi viết tắt của cung, VD "N.Tuất". */
export const canChiCung = (ls: LaSo, chi: number): string => `${VIET_TAT[canCung(CAN.indexOf(ls.input.can_nam), chi)]}.${CHI[chi]}`;

/** Tiểu hạn đặt ở cung này vào năm có địa chi nào (nam thuận, nữ nghịch từ cung khởi). */
export function chiNamTieuHan(ls: LaSo, chiCungTH: number): string {
  const chieu = ls.input.gioi_tinh === "nam" ? 1 : -1;
  return CHI[mv(CHI.indexOf(ls.input.chi_nam), (chiCungTH - ls.tieu_han_khoi) * chieu)];
}

/** Ngũ hành của sao (key "Kim"/"Moc"/"Thuy"/"Hoa"/"Tho"), sao lưu lấy theo sao gốc; sao vòng không có thì null. */
export function hanhSao(ten: string): string | null {
  const tt = triThuc();
  const goc = ten.replace(/^Lưu /, "");
  return tt.phu.get(goc)?.hanh ?? tt.chinh.get(goc)?.ngu_hanh ?? null;
}
