// Đổi Dương lịch → Âm lịch Việt Nam — port 1:1 từ tools/tuvi/lich_am.py (xem docs/08-lich-am.md).
// Thuật toán thiên văn: Meeus, Astronomical Algorithms 2nd ed. (sóc ch.49, kinh độ Mặt Trời ch.25, ΔT Espenak–Meeus).
import muiGio from "../data/mui_gio_vn.json";
import { CAN, CHI } from "./anSao";
import { floorDiv, mod, pyRoundInt, toFixedPy } from "./py";

const RAD = Math.PI / 180;

// ---------------------------------------------------------------- ngày Julius
/** JDN nguyên của một ngày dương lịch (Gregory từ 15/10/1582, Julius trước đó). */
export function jdTuNgay(d: number, m: number, y: number): number {
  const a = floorDiv(14 - m, 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  let jd = d + floorDiv(153 * mm + 2, 5) + 365 * yy + floorDiv(yy, 4) - 32083;
  if (jd >= 2299161) jd = d + floorDiv(153 * mm + 2, 5) + 365 * yy + floorDiv(yy, 4) - floorDiv(yy, 100) + floorDiv(yy, 400) - 32045;
  return jd;
}

export interface Ngay { y: number; m: number; d: number }

export function ngayTuJd(jd: number): Ngay {
  let b: number, c: number;
  if (jd > 2299160) {
    const a = jd + 32044;
    b = floorDiv(4 * a + 3, 146097);
    c = a - floorDiv(b * 146097, 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = floorDiv(4 * c + 3, 1461);
  const e = c - floorDiv(1461 * d, 4);
  const m = floorDiv(5 * e + 2, 153);
  return { y: b * 100 + d - 4800 + floorDiv(m, 10), m: m + 3 - 12 * floorDiv(m, 10), d: e - floorDiv(153 * m + 2, 5) + 1 };
}

export function deltaT(nam: number): number {
  let t = nam - 2000;
  let s: number;
  if (nam >= 2005 && nam < 2050) s = 62.92 + 0.32217 * t + 0.005589 * t * t;
  else if (nam >= 1986 && nam < 2005) s = 63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5;
  else if (nam >= 1961 && nam < 1986) { t = nam - 1975; s = 45.45 + 1.067 * t - t * t / 260 - t ** 3 / 718; }
  else if (nam >= 1941 && nam < 1961) { t = nam - 1950; s = 29.07 + 0.407 * t - t * t / 233 + t ** 3 / 2547; }
  else if (nam >= 1920 && nam < 1941) { t = nam - 1920; s = 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t ** 3; }
  else if (nam >= 1900 && nam < 1920) { t = nam - 1900; s = -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t ** 3 - 0.000197 * t ** 4; }
  else if (nam >= 2050 && nam < 2150) s = -20 + 32 * ((nam - 1820) / 100) ** 2 - 0.5628 * (2150 - nam);
  else { const u = (nam - 1820) / 100; s = -20 + 32 * u * u; }
  return s / 86400;
}

// ---------------------------------------------------------------- sóc (Meeus ch. 49)
const HE_HANH_TINH = [325, 165, 164, 126, 110, 62, 60, 56, 47, 42, 40, 37, 35, 23];

/** Thời điểm trăng non thứ k (k=0 ~ 6/1/2000), trả JDE (giờ TT). */
export function soc(k: number): number {
  const t = k / 1236.85;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * t ** 2 - 0.000000150 * t ** 3 + 0.00000000073 * t ** 4;
  const e = 1 - 0.002516 * t - 0.0000074 * t * t;
  const m = (2.5534 + 29.10535670 * k - 0.0000014 * t * t - 0.00000011 * t ** 3) * RAD;
  const mp = (201.5643 + 385.81693528 * k + 0.0107582 * t * t + 0.00001238 * t ** 3 - 0.000000058 * t ** 4) * RAD;
  const f = (160.7108 + 390.67050284 * k - 0.0016118 * t * t - 0.00000227 * t ** 3 + 0.000000011 * t ** 4) * RAD;
  const om = (124.7746 - 1.56375588 * k + 0.0020672 * t * t + 0.00000215 * t ** 3) * RAD;
  const s = Math.sin;
  jde += (-0.40720 * s(mp) + 0.17241 * e * s(m) + 0.01608 * s(2 * mp) + 0.01039 * s(2 * f)
    + 0.00739 * e * s(mp - m) - 0.00514 * e * s(mp + m) + 0.00208 * e * e * s(2 * m)
    - 0.00111 * s(mp - 2 * f) - 0.00057 * s(mp + 2 * f) + 0.00056 * e * s(2 * mp + m)
    - 0.00042 * s(3 * mp) + 0.00042 * e * s(m + 2 * f) + 0.00038 * e * s(m - 2 * f)
    - 0.00024 * e * s(2 * mp - m) - 0.00017 * s(om) - 0.00007 * s(mp + 2 * m)
    + 0.00004 * s(2 * mp - 2 * f) + 0.00004 * s(3 * m) + 0.00003 * s(mp + m - 2 * f)
    + 0.00003 * s(2 * mp + 2 * f) - 0.00003 * s(mp + m + 2 * f) + 0.00003 * s(mp - m + 2 * f)
    - 0.00002 * s(mp - m - 2 * f) - 0.00002 * s(3 * mp + m) + 0.00002 * s(4 * mp));
  const a = [299.77 + 0.107408 * k - 0.009173 * t * t, 251.88 + 0.016321 * k, 251.83 + 26.651886 * k,
    349.42 + 36.412478 * k, 84.66 + 18.206239 * k, 141.74 + 53.303771 * k, 207.14 + 2.453732 * k,
    154.84 + 7.306860 * k, 34.52 + 27.261239 * k, 207.19 + 0.121824 * k, 291.34 + 1.844379 * k,
    161.72 + 24.198154 * k, 239.56 + 25.513099 * k, 331.55 + 3.592518 * k];
  let tong = 0;
  for (let i = 0; i < a.length; i++) tong += HE_HANH_TINH[i] * 1e-6 * s(a[i] * RAD);
  return jde + tong;
}

/** Kinh độ biểu kiến Mặt Trời (độ, 0..360) tại JDE — Meeus ch. 25. */
export function kinhDoMatTroi(jde: number): number {
  const t = (jde - 2451545.0) / 36525;
  const l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  const m = (357.52911 + 35999.05029 * t - 0.0001537 * t * t) * RAD;
  const c = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(m) + (0.019993 - 0.000101 * t) * Math.sin(2 * m) + 0.000289 * Math.sin(3 * m);
  const om = (125.04 - 1934.136 * t) * RAD;
  return mod(l0 + c - 0.00569 - 0.00478 * Math.sin(om), 360);
}

const ut = (jde: number): number => jde - deltaT(2000 + (jde - 2451545.0) / 365.25);

// ---------------------------------------------------------------- múi giờ lịch (KHÔNG phải giờ đồng hồ)
export type Mien = "bac" | "nam";

export function muiGioLich(namDuong: number, mien: Mien = "bac"): number {
  if (namDuong < 1968) return 8;
  if (mien === "nam" && namDuong < 1976) return 8;
  return 7;
}

export const ngaySoc = (k: number, tz: number): number => Math.floor(ut(soc(k)) + 0.5 + tz / 24);

/** Chỉ số 0..11 của 30° Mặt Trời đã đi lúc 0h ngày jdn (giờ địa phương tz). 9 = sau Đông chí (270°). */
export function cungTrungKhi(jdn: number, tz: number): number {
  const jdUt = jdn - 0.5 - tz / 24;
  const nam = 2000 + (jdUt - 2451545.0) / 365.25;
  return Math.floor(kinhDoMatTroi(jdUt + deltaT(nam)) / 30);
}

const kGan = (jdn: number): number => pyRoundInt((jdn - 2451550.1) / 29.530588853);

export function dauThangChua(jdn: number, tz: number): [number, number] {
  let k = kGan(jdn) + 1;
  while (ngaySoc(k, tz) > jdn) k -= 1;
  return [k, ngaySoc(k, tz)];
}

export function thang11(nam: number, tz: number): [number, number] {
  let [k, nm] = dauThangChua(jdTuNgay(31, 12, nam), tz);
  if (cungTrungKhi(nm, tz) >= 9) k -= 1;
  return [k, ngaySoc(k, tz)];
}

function thangNhuanSau11(k11: number, tz: number): number | null {
  let truoc = cungTrungKhi(ngaySoc(k11 + 1, tz), tz);
  for (let i = 2; i < 15; i++) {
    const sau = cungTrungKhi(ngaySoc(k11 + i, tz), tz);
    if (sau === truoc) return i - 1;
    truoc = sau;
  }
  return null;
}

export interface AmLich { ngay: number; thang: number; nam: number; nhuan: boolean }

export function duongSangAm(d: number, m: number, y: number, mien: Mien = "bac"): AmLich {
  const tz = muiGioLich(y, mien);
  const jdn = jdTuNgay(d, m, y);
  const [k, dau] = dauThangChua(jdn, tz);
  let [k11, a11] = thang11(y - 1, tz);
  let [k11b, b11] = thang11(y, tz);
  if (b11 <= dau) {
    [k11, a11] = [k11b, b11];
    [k11b, b11] = thang11(y + 1, tz);
  }
  const soThang = k11b - k11;
  let i = k - k11;
  let nhuan = false;
  if (soThang === 13) {
    const vt = thangNhuanSau11(k11, tz);
    if (vt !== null && i >= vt) {
      nhuan = i === vt;
      i -= 1;
    }
  }
  const thang = mod(10 + i, 12) + 1;
  const nam = ngayTuJd(a11).y + (i >= 2 ? 1 : 0);
  return { ngay: jdn - dau + 1, thang, nam, nhuan };
}

/** Cảnh báo khi sóc rơi trong ±phut phút quanh nửa đêm (ngày mùng 1 có thể lệch 1 so với lịch in). */
export function satNuaDem(d: number, m: number, y: number, mien: Mien = "bac", phut = 10): string[] {
  const tz = muiGioLich(y, mien);
  const [k] = dauThangChua(jdTuNgay(d, m, y), tz);
  const ket: string[] = [];
  for (const kk of [k, k + 1]) {
    const tuNuaDem = mod(ut(soc(kk)) + 0.5 + tz / 24, 1) * 1440;
    const lech = Math.min(tuNuaDem, 1440 - tuNuaDem);
    if (lech < phut) ket.push(`Sóc mùng 1 ${kk === k ? "tháng này" : "tháng sau"} cách nửa đêm ${toFixedPy(lech, 1)} phút — ngày âm có thể lệch 1`);
  }
  return ket;
}

// ---------------------------------------------------------------- can chi
export const canChiNam = (namAm: number): [number, number] => [mod(namAm - 4, 10) + 1, mod(namAm - 4, 12) + 1];

export function canChiNgay(d: number, m: number, y: number): [number, number] {
  const jdn = jdTuNgay(d, m, y);
  return [mod(jdn + 9, 10) + 1, mod(jdn + 1, 12) + 1];
}

const CAN_GIENG: Record<number, number> = { 1: 3, 6: 3, 2: 5, 7: 5, 3: 7, 8: 7, 4: 9, 9: 9, 5: 1, 10: 1 };
export function canChiThang(thangAm: number, namAm: number): [number, number] {
  const canNam = canChiNam(namAm)[0];
  return [mod(CAN_GIENG[canNam] - 1 + thangAm - 1, 10) + 1, mod(thangAm + 1, 12) + 1];
}

/** 23:00–00:59 = Tý (1), 01:00–02:59 = Sửu ... 21:00–22:59 = Hợi. */
export const chiGio = (gio: number, phut = 0): number => mod(floorDiv(gio * 60 + phut + 60, 120), 12) + 1;

// ---------------------------------------------------------------- giờ sinh
export interface QuyUoc {
  ty_muon: "ngay_sau" | "ngay_do";
  thang_nhuan: "nhu_thang_truoc" | "nhu_thang_sau" | "chia_nua";
  mui_gio_lich_su: boolean;
  gio_mat_troi: boolean;
}
export const QUY_UOC_MAC_DINH: QuyUoc = { ty_muon: "ngay_sau", thang_nhuan: "nhu_thang_truoc", mui_gio_lich_su: true, gio_mat_troi: false };

/** Mốc thời gian "naive" (không múi giờ) tính bằng giây từ epoch, dùng lịch Gregory đều. */
const JDN_EPOCH = 2440588;
const gregJdn = (y: number, m: number, d: number): number => {
  const a = floorDiv(14 - m, 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + floorDiv(153 * mm + 2, 5) + 365 * yy + floorDiv(yy, 4) - floorDiv(yy, 100) + floorDiv(yy, 400) - 32045;
};
const naiveSec = (y: number, m: number, d: number, h: number, mi: number): number => (gregJdn(y, m, d) - JDN_EPOCH) * 86400 + h * 3600 + mi * 60;

interface DT { y: number; m: number; d: number; h: number; mi: number }
function tuNaiveSec(sec: number): DT {
  const days = floorDiv(sec, 86400);
  const r = sec - days * 86400;
  const g = ngayTuJd(days + JDN_EPOCH);
  return { ...g, h: Math.floor(r / 3600), mi: Math.floor((r % 3600) / 60) };
}

/** Giờ treo tường tại VN (tzdata Asia/Ho_Chi_Minh) → giây UTC; giờ mơ hồ lấy lần đầu, giờ không tồn tại dùng offset trước khi đổi (như Python fold=0). */
function tuongSangUtc(wall: number): number {
  const mocs: number[] = [-Infinity, ...muiGio.doi.map((x) => x[0])];
  const offs: number[] = [muiGio.ban_dau, ...muiGio.doi.map((x) => x[1])];
  for (let i = 0; i < offs.length; i++) {
    const u = wall - offs[i];
    const het = i + 1 < mocs.length ? mocs[i + 1] : Infinity;
    if (u >= mocs[i] && u < het) return u;
  }
  for (let i = 0; i + 1 < offs.length; i++) if (wall - offs[i] >= mocs[i + 1] && wall - offs[i + 1] < mocs[i + 1]) return wall - offs[i];
  return wall - offs[offs.length - 1];
}

/** Đổi giờ ĐỒNG HỒ trên giấy khai sinh → giờ dùng để an (UTC+7 chuẩn, hoặc giờ mặt trời địa phương). */
export function gioDongHoSangGioTinh(dt: DT, mien: Mien, quyUoc: Partial<QuyUoc> = {}, kinhDo?: number): DT {
  const q = { ...QUY_UOC_MAC_DINH, ...quyUoc };
  const wall = naiveSec(dt.y, dt.m, dt.d, dt.h, dt.mi);
  const utc = q.mui_gio_lich_su && !(mien === "bac" && dt.y >= 1955) ? tuongSangUtc(wall) : wall - 7 * 3600;
  if (q.gio_mat_troi) {
    if (kinhDo === undefined) throw new Error("gio_mat_troi cần kinh_do nơi sinh");
    return tuNaiveSec(utc + Math.trunc((kinhDo / 15) * 3600));
  }
  return tuNaiveSec(utc + 7 * 3600);
}

export interface KetQuaLich {
  an_sao: { can_nam: number; chi_nam: number; thang: number; ngay: number; gio: number; gioi_tinh: "nam" | "nu" };
  am_lich: AmLich;
  can_chi: { nam: string; thang: string; ngay: string; gio: string };
  gio_tinh: string;
  quy_uoc: QuyUoc;
  canh_bao: string[];
}

const p2 = (n: number) => String(n).padStart(2, "0");

/** Từ ngày giờ DƯƠNG LỊCH (giờ đồng hồ) → tham số cho anLaSo + thông tin lịch. */
export function tuDuongLich(nam: number, thang: number, ngay: number, gio: number, phut: number, gioiTinh: "nam" | "nu",
  mien: Mien = "nam", quyUoc: Partial<QuyUoc> = {}, kinhDo?: number): KetQuaLich {
  const q = { ...QUY_UOC_MAC_DINH, ...quyUoc };
  const dt = gioDongHoSangGioTinh({ y: nam, m: thang, d: ngay, h: gio, mi: phut }, mien, q, kinhDo);
  let nl: Ngay = { y: dt.y, m: dt.m, d: dt.d };
  if (q.ty_muon === "ngay_sau" && dt.h === 23) nl = ngayTuJd(jdTuNgay(nl.d, nl.m, nl.y) + 1);
  const { ngay: d, thang: m, nam: y, nhuan } = duongSangAm(nl.d, nl.m, nl.y, mien);
  let thangAn = m;
  if (nhuan && (q.thang_nhuan === "nhu_thang_sau" || (q.thang_nhuan === "chia_nua" && d > 15))) thangAn = (m % 12) + 1;
  const [canNam, chiNam] = canChiNam(y);
  const cg = chiGio(dt.h, dt.mi);
  const cn = canChiNgay(nl.d, nl.m, nl.y);
  const ct = canChiThang(m, y);
  const canhBao = [
    ...satNuaDem(nl.d, nl.m, nl.y, mien),
    ...(nhuan ? [`Sinh tháng ${m} nhuận — an theo tháng ${thangAn} (quy ước ${q.thang_nhuan})`] : []),
    ...(y < 1945 ? ["Năm trước 1945: chưa rõ lịch VN thời đó dùng múi giờ nào (Hiệp Kỷ lịch), ngày âm có thể lệch"] : []),
  ];
  return {
    an_sao: { can_nam: canNam, chi_nam: chiNam, thang: thangAn, ngay: d, gio: cg, gioi_tinh: gioiTinh },
    am_lich: { ngay: d, thang: m, nam: y, nhuan },
    can_chi: { nam: `${CAN[canNam]} ${CHI[chiNam]}`, thang: `${CAN[ct[0]]} ${CHI[ct[1]]}`, ngay: `${CAN[cn[0]]} ${CHI[cn[1]]}`, gio: CHI[cg] },
    gio_tinh: `${dt.y}-${p2(dt.m)}-${p2(dt.d)}T${p2(dt.h)}:${p2(dt.mi)}`,
    quy_uoc: q,
    canh_bao: canhBao,
  };
}
