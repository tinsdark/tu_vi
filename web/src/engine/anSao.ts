// Engine an sao Tử Vi — port 1:1 từ tools/tuvi/an_sao.py (Python là bản tham chiếu; test/parity.test.ts so khớp từng sao).
// Quy ước: địa chi 1..12 = Tý..Hợi, thiên can 1..10 = Giáp..Quý, giờ 1..12 = Tý..Hợi.
import { mod } from "./py";

export const CAN = ["", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
export const CHI = ["", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
export const [TY, SUU, DAN, MAO, THIN, TI, NGO, MUI, THAN, DAU, TUAT, HOI] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const CUNG_CHUC = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc",
  "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"] as const;
export type TenCung = (typeof CUNG_CHUC)[number];

/** Chỗ các phái khác nhau — khớp data/knowledge/bien_the.json */
export interface Profile {
  tu_hoa_canh: "am_dong" | "dong_am";
  tu_hoa_nham: "ta_phu" | "thien_phu";
  khoi_viet: "khau_quyet" | "lasotuvi";
  hoa_linh_ty_dau_suu: "hoa_mao_linh_tuat" | "hoa_tuat_linh_mao";
  pha_toai: "khau_quyet" | "lasotuvi";
  thien_giai: "khong_nhay" | "nhay_cung";
  luu_ha: "thai_thu_lang" | "thien_luong" | "ngu_hanh";
  thien_tru_quy: "tuat" | "hoi";
  thien_quy: "nghich" | "thuan";
  luu_nguyet: "tieu_han" | "thai_tue";
}

export const PROFILE_MAC_DINH: Profile = {
  tu_hoa_canh: "am_dong",
  tu_hoa_nham: "ta_phu",
  khoi_viet: "khau_quyet",
  hoa_linh_ty_dau_suu: "hoa_mao_linh_tuat",
  pha_toai: "khau_quyet",
  thien_giai: "khong_nhay",
  luu_ha: "thai_thu_lang",
  thien_tru_quy: "tuat",
  thien_quy: "nghich",
  luu_nguyet: "tieu_han",
};

export type GioiTinh = "nam" | "nu";

export interface LaSo {
  input: { can_nam: string; chi_nam: string; thang: number; ngay: number; gio: string; gioi_tinh: GioiTinh; profile: Profile };
  am_duong_nam_nu: string;
  ban_menh: string;
  cuc: { hanh: string; so: number };
  menh: number;
  than: number;
  sao: Record<string, number>;
  tu_hoa: Record<string, string>;
  tuan: number[];
  triet: number[];
  cung_chuc: Record<number, string>;
  dai_han: Record<number, number>;
  tieu_han_khoi: number;
}

/** Dịch cung trên địa bàn; buoc dương = thuận, âm = nghịch. */
export const mv = (viTri: number, buoc: number): number => mod(viTri - 1 + buoc, 12) + 1;

const HANH_NAP_AM: Record<number, string> = { 1: "Kim", 2: "Thuy", 3: "Hoa", 4: "Tho", 5: "Moc" };
export function napAm(can: number, chi: number): string {
  const soCan = Math.floor((can + 1) / 2);
  const soChi = [TY, SUU, NGO, MUI].includes(chi) ? 0 : [DAN, MAO, THAN, DAU].includes(chi) ? 1 : 2;
  let tong = soCan + soChi;
  if (tong > 5) tong -= 5;
  return HANH_NAP_AM[tong];
}

export const CUC_SO: Record<string, number> = { Thuy: 2, Moc: 3, Kim: 4, Tho: 5, Hoa: 6 };

const CAN_DAN: Record<number, number> = { 1: 3, 6: 3, 2: 5, 7: 5, 3: 7, 8: 7, 4: 9, 9: 9, 5: 1, 10: 1 };
/** Ngũ hổ độn: can của cung Dần theo can năm, rồi đếm thuận. */
export const canCung = (canNam: number, chiCung: number): number => mod(CAN_DAN[canNam] - 1 + mod(chiCung - DAN, 12), 10) + 1;

export function viTriTuVi(cuc: number, ngay: number): number {
  const x = mod(-ngay, cuc);
  const q = Math.floor((ngay + x) / cuc);
  const goc = mv(DAN, q - 1);
  return mv(goc, x % 2 ? -x : x);
}

const BANG_TU_HOA: Record<number, string[]> = {
  1: ["Liêm Trinh", "Phá Quân", "Vũ Khúc", "Thái Dương"],
  2: ["Thiên Cơ", "Thiên Lương", "Tử Vi", "Thái Âm"],
  3: ["Thiên Đồng", "Thiên Cơ", "Văn Xương", "Liêm Trinh"],
  4: ["Thái Âm", "Thiên Đồng", "Thiên Cơ", "Cự Môn"],
  5: ["Tham Lang", "Thái Âm", "Hữu Bật", "Thiên Cơ"],
  6: ["Vũ Khúc", "Tham Lang", "Thiên Lương", "Văn Khúc"],
  7: ["Thái Dương", "Vũ Khúc", "Thái Âm", "Thiên Đồng"],
  8: ["Cự Môn", "Thái Dương", "Văn Khúc", "Văn Xương"],
  9: ["Thiên Lương", "Tử Vi", "Tả Phù", "Vũ Khúc"],
  10: ["Phá Quân", "Cự Môn", "Thái Âm", "Tham Lang"],
};

export function anLaSo(canNam: number, chiNam: number, thang: number, ngay: number, gio: number,
  gioiTinh: GioiTinh, profile?: Partial<Profile>): LaSo {
  const p: Profile = { ...PROFILE_MAC_DINH, ...(profile ?? {}) };
  const duongNamAmNu = (canNam % 2 === 1) === (gioiTinh === "nam");
  const chieu = duongNamAmNu ? 1 : -1;

  const menh = mv(DAN, (thang - 1) - (gio - 1));
  const than = mv(DAN, (thang - 1) + (gio - 1));
  const hanhCuc = napAm(canCung(canNam, menh), menh);
  const cuc = CUC_SO[hanhCuc];

  const sao: Record<string, number> = {};
  const dat = (ten: string, viTri: number) => { sao[ten] = viTri; };

  // --- 14 chính tinh
  const tv = viTriTuVi(cuc, ngay);
  for (const [ten, buoc] of [["Tử Vi", 0], ["Thiên Cơ", -1], ["Thái Dương", -3], ["Vũ Khúc", -4], ["Thiên Đồng", -5], ["Liêm Trinh", -8]] as const) dat(ten, mv(tv, buoc));
  const tp = mod(6 - tv - 1, 12) + 1; // đối xứng Tử Vi qua trục Dần–Thân
  for (const [ten, buoc] of [["Thiên Phủ", 0], ["Thái Âm", 1], ["Tham Lang", 2], ["Cự Môn", 3], ["Thiên Tướng", 4], ["Thiên Lương", 5], ["Thất Sát", 6], ["Phá Quân", 10]] as const) dat(ten, mv(tp, buoc));

  // --- Vòng Lộc Tồn (Bác Sĩ)
  const loc = ({ 1: DAN, 2: MAO, 3: TI, 4: NGO, 5: TI, 6: NGO, 7: THAN, 8: DAU, 9: HOI, 10: TY } as Record<number, number>)[canNam];
  dat("Lộc Tồn", loc);
  dat("Kình Dương", mv(loc, 1));
  dat("Đà La", mv(loc, -1));
  ["Bác Sĩ", "Lực Sĩ", "Thanh Long", "Tiểu Hao", "Tướng Quân", "Tấu Thư", "Phi Liêm", "Hỷ Thần", "Bệnh Phù", "Đại Hao", "Phục Binh", "Quan Phủ"]
    .forEach((ten, i) => dat(ten, mv(loc, i * chieu)));

  // --- Vòng Thái Tuế
  ["Thái Tuế", "Thiếu Dương", "Tang Môn", "Thiếu Âm", "Quan Phù", "Tử Phù", "Tuế Phá", "Long Đức", "Bạch Hổ", "Phúc Đức", "Điếu Khách", "Trực Phù"]
    .forEach((ten, i) => dat(ten, mv(chiNam, i)));
  dat("Thiên Không", mv(chiNam, 1));
  dat("Nguyệt Đức", mv(chiNam, 5));
  dat("Thiên Đức", mv(chiNam, 9));

  // --- Vòng Tràng Sinh theo cục
  const ts = ({ 2: THAN, 5: THAN, 3: HOI, 4: TI, 6: DAN } as Record<number, number>)[cuc];
  ["Tràng Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"]
    .forEach((ten, i) => dat(ten, mv(ts, i * chieu)));

  // --- Theo giờ
  dat("Văn Xương", mv(TUAT, -(gio - 1)));
  dat("Văn Khúc", mv(THIN, gio - 1));
  dat("Thai Phụ", mv(sao["Văn Khúc"], 2));
  dat("Phong Cáo", mv(sao["Văn Khúc"], -2));
  dat("Địa Kiếp", mv(HOI, gio - 1));
  dat("Địa Không", mv(HOI, -(gio - 1)));
  const nhomNamMap: Record<number, number> = { [THAN]: 0, [TY]: 0, [THIN]: 0, [DAN]: 1, [NGO]: 1, [TUAT]: 1, [TI]: 2, [DAU]: 2, [SUU]: 2 };
  const nhomNam = nhomNamMap[chiNam] ?? 3;
  let [khoiHoa, khoiLinh] = ([[DAN, TUAT], [SUU, MAO], [MAO, TUAT], [DAU, TUAT]] as const)[nhomNam];
  if (nhomNam === 2 && p.hoa_linh_ty_dau_suu === "hoa_tuat_linh_mao") [khoiHoa, khoiLinh] = [TUAT, MAO];
  dat("Hỏa Tinh", mv(khoiHoa, (gio - 1) * chieu));
  dat("Linh Tinh", mv(khoiLinh, -(gio - 1) * chieu));

  // --- Theo tháng
  dat("Tả Phù", mv(THIN, thang - 1));
  dat("Hữu Bật", mv(TUAT, -(thang - 1)));
  dat("Thiên Hình", mv(DAU, thang - 1));
  dat("Thiên Riêu", mv(SUU, thang - 1));
  dat("Thiên Y", mv(SUU, thang - 1));
  dat("Địa Giải", mv(MUI, thang - 1));
  dat("Thiên Giải", mv(THAN, (thang - 1) * (p.thien_giai === "nhay_cung" ? 2 : 1)));

  // --- Theo ngày
  dat("Tam Thai", mv(sao["Tả Phù"], ngay - 1));
  dat("Bát Tọa", mv(sao["Hữu Bật"], -(ngay - 1)));
  dat("Ân Quang", mv(sao["Văn Xương"], ngay - 2));
  dat("Thiên Quý", mv(sao["Văn Khúc"], (ngay - 2) * (p.thien_quy === "thuan" ? 1 : -1)));

  // --- Theo can năm
  let khoi: number, viet: number;
  if (p.khoi_viet === "khau_quyet") {
    [khoi, viet] = ({ 1: [SUU, MUI], 5: [SUU, MUI], 2: [TY, THAN], 6: [TY, THAN], 3: [HOI, DAU], 4: [HOI, DAU], 7: [NGO, DAN], 8: [NGO, DAN], 9: [MAO, TI], 10: [MAO, TI] } as Record<number, number[]>)[canNam];
  } else { // bảng trong lasotuvi
    khoi = [0, SUU, TY, HOI, DAU, MUI, TY, MUI, NGO, TI, MAO][canNam];
    viet = mv(THIN, THIN - khoi);
  }
  dat("Thiên Khôi", khoi);
  dat("Thiên Việt", viet);
  dat("Thiên Quan", [0, MUI, THIN, TI, DAN, MAO, DAU, HOI, DAU, TUAT, NGO][canNam]);
  dat("Thiên Phúc", [0, DAU, THAN, TY, HOI, MAO, DAN, NGO, TI, NGO, TI][canNam]);
  dat("Văn Tinh", mv(loc, 3));
  dat("Đường Phù", mv(loc, 5));
  dat("Quốc Ấn", mv(loc, 8));
  const luuHa = [0, DAU, TUAT, MUI, THIN, TI, NGO, THAN, MAO, HOI, DAN];
  if (p.luu_ha === "thien_luong") { luuHa[4] = THAN; luuHa[7] = THIN; }
  else if (p.luu_ha === "ngu_hanh") { luuHa[4] = THAN; luuHa[7] = MAO; luuHa[8] = THIN; }
  dat("Lưu Hà", luuHa[canNam]);
  dat("Thiên Trù", [0, TI, NGO, TY, TI, NGO, THAN, DAN, NGO, DAU, p.thien_tru_quy === "tuat" ? TUAT : HOI][canNam]);

  // --- Theo chi năm
  dat("Long Trì", mv(THIN, chiNam - 1));
  dat("Phượng Các", mv(TUAT, -(chiNam - 1)));
  dat("Giải Thần", sao["Phượng Các"]);
  dat("Thiên Khốc", mv(NGO, -(chiNam - 1)));
  dat("Thiên Hư", mv(NGO, chiNam - 1));
  dat("Hồng Loan", mv(MAO, -(chiNam - 1)));
  dat("Thiên Hỷ", mv(sao["Hồng Loan"], 6));
  const ma = ({ 0: DAN, 1: THAN, 2: HOI, 3: TI } as Record<number, number>)[nhomNam];
  dat("Thiên Mã", ma);
  dat("Hoa Cái", mv(ma, 2));
  dat("Kiếp Sát", mv(ma, 3));
  dat("Đào Hoa", mv(ma, 7));
  const coMap: Record<number, number> = { [HOI]: DAN, [TY]: DAN, [SUU]: DAN, [DAN]: TI, [MAO]: TI, [THIN]: TI, [TI]: THAN, [NGO]: THAN, [MUI]: THAN };
  const co = coMap[chiNam] ?? HOI;
  dat("Cô Thần", co);
  dat("Quả Tú", mv(co, -4));
  // chi_nam % 3: 1 = Tý Ngọ Mão Dậu, 0 = Dần Thân Tỵ Hợi, 2 = Thìn Tuất Sửu Mùi
  const phaToai: Record<number, number> = p.pha_toai === "khau_quyet" ? { 1: TI, 0: DAU, 2: SUU } : { 0: TI, 1: DAU, 2: SUU };
  dat("Phá Toái", phaToai[chiNam % 3]);
  dat("Thiên Tài", mv(menh, chiNam - 1));
  dat("Thiên Thọ", mv(than, chiNam - 1));
  dat("Đẩu Quân", mv(chiNam, -(thang - 1) + (gio - 1)));

  // --- Cố định / theo cung
  dat("Thiên La", THIN);
  dat("Địa Võng", TUAT);
  dat("Thiên Thương", mv(menh, 5));
  dat("Thiên Sứ", mv(menh, 7));

  // --- Tứ Hóa
  const bang = BANG_TU_HOA[canNam].slice();
  if (canNam === 7 && p.tu_hoa_canh === "dong_am") { bang[2] = "Thiên Đồng"; bang[3] = "Thái Âm"; }
  if (canNam === 9 && p.tu_hoa_nham === "thien_phu") bang[2] = "Thiên Phủ";
  const tuHoa: Record<string, string> = {};
  ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"].forEach((h, i) => { tuHoa[h] = bang[i]; });
  for (const [hoa, goc] of Object.entries(tuHoa)) dat(hoa, sao[goc]);

  // --- Tuần, Triệt
  const hetTuan = mv(chiNam, 10 - canNam);
  const tuan = [mv(hetTuan, 1), mv(hetTuan, 2)];
  const triet = ({ 1: [THAN, DAU], 6: [THAN, DAU], 2: [NGO, MUI], 7: [NGO, MUI], 3: [THIN, TI], 8: [THIN, TI], 4: [DAN, MAO], 9: [DAN, MAO], 5: [TY, SUU], 10: [TY, SUU] } as Record<number, number[]>)[canNam];

  // --- Cung chức, đại hạn, tiểu hạn
  const cungChuc: Record<number, string> = {};
  CUNG_CHUC.forEach((ten, i) => { cungChuc[mv(menh, i)] = ten; });
  const daiHan: Record<number, number> = {};
  for (let i = 0; i < 12; i++) daiHan[mv(menh, i * chieu)] = cuc + 10 * i;
  const khoiTieuHan = ({ 0: TUAT, 1: THIN, 2: MUI, 3: SUU } as Record<number, number>)[nhomNam];

  return {
    input: { can_nam: CAN[canNam], chi_nam: CHI[chiNam], thang, ngay, gio: CHI[gio], gioi_tinh: gioiTinh, profile: p },
    am_duong_nam_nu: (canNam % 2 ? "Dương" : "Âm") + (gioiTinh === "nam" ? " Nam" : " Nữ"),
    ban_menh: napAm(canNam, chiNam),
    cuc: { hanh: hanhCuc, so: cuc },
    menh, than, sao, tu_hoa: tuHoa, tuan, triet,
    cung_chuc: cungChuc, dai_han: daiHan, tieu_han_khoi: khoiTieuHan,
  };
}

/** Gom sao theo địa chi (giữ thứ tự chèn như Python). */
export function theoCung(laSo: LaSo): Record<number, string[]> {
  const ds: Record<number, string[]> = {};
  for (let c = 1; c <= 12; c++) ds[c] = [];
  for (const [ten, vt] of Object.entries(laSo.sao)) ds[vt].push(ten);
  return ds;
}
