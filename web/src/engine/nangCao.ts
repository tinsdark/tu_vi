// Logic nâng cao (spec Phần 2 §18, §20, §21): bộ chính tinh, tam tai / năm tuổi, trùng phùng đại hạn × lưu niên.
// Tách khỏi baoCao() có chủ đích: báo cáo cốt lõi đang được so khớp 1:1 với engine Python (test/parity.test.ts);
// phần này là lớp bổ sung chỉ có ở web. Cơ chế nhận diện là xác định (deterministic); nghĩa luận là dữ liệu [VERIFY] theo từng phái.
import { anLaSo, CAN, canCung, CHI, mv } from "./anSao";
import { LuanGiai } from "./luanGiai";

// ---------- §18 Bộ chính tinh
interface BoSao { ma: string; ten: string; sao: string[]; nghe: string; tinh_cach: string }
const BO: BoSao[] = [
  { ma: "sat_pha_tham", ten: "Sát – Phá – Tham", sao: ["Thất Sát", "Phá Quân", "Tham Lang"],
    nghe: "biến động, khai phá, dám mạo hiểm; hợp khởi nghiệp, kỹ thuật, kinh doanh tự thân, quân/cảnh, nghề cạnh tranh mạnh",
    tinh_cach: "nền tính cách thích thay đổi, dám làm dám chịu, không chịu khuôn khổ" },
  { ma: "co_nguyet_dong_luong", ten: "Cơ – Nguyệt – Đồng – Lương", sao: ["Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương"],
    nghe: "ổn định, tham mưu, phục vụ; hợp công chức, hành chính, nghiên cứu, giáo dục, kế toán, nghề cần tỉ mỉ và đều đặn",
    tinh_cach: "nền tính cách ôn hòa, cẩn trọng, thiên về tham mưu hơn xông pha" },
  { ma: "tu_phu_vu_tuong", ten: "Tử – Phủ – Vũ – Tướng (– Liêm)", sao: ["Tử Vi", "Thiên Phủ", "Vũ Khúc", "Thiên Tướng", "Liêm Trinh"],
    nghe: "tổ chức, quản lý, quyền lực; hợp quản lý, tài chính/ngân hàng, lãnh đạo, nghề có hệ thống và thứ bậc",
    tinh_cach: "nền tính cách có nguyên tắc, thích trật tự và vị thế" },
];

export interface KetQuaBo {
  ten: string; sao_menh: string[];
  /** Mệnh vô chính diệu: bộ xác định theo chính tinh mượn từ cung xung. */
  muon: boolean;
  /** Mệnh chỉ có Thái Dương/Cự Môn: bộ lấy theo tam phương hội nhiều sao nhất (cách xếp tùy phái — [VERIFY]). */
  theo_tam_phuong: boolean;
  nghe: string; tinh_cach: string; ghi_chu?: string;
}

/** §18.2 — bộ của Mệnh. Trả null nếu không xác định được (hòa hoặc không có chính tinh trong tam phương). */
export function xacDinhBo(lg: LuanGiai): KetQuaBo | null {
  const menh = lg.ls.menh;
  let cts = lg.chinhTinh(menh);
  const muon = cts.length === 0;
  if (muon) cts = lg.chinhTinh(mv(menh, 6));
  const tim = (ds: string[]) => BO.find((b) => ds.some((s) => b.sao.includes(s)));
  let b = tim(cts);
  let theoTp = false;
  if (!b) { // chỉ Thái Dương / Cự Môn: đếm chính tinh trong tam phương tứ chính
    const dem = BO.map((x) => ({ x, n: lg.saoTrong(menh, "tam_phuong").filter((s) => x.sao.includes(s)).length })).sort((p, q) => q.n - p.n);
    if (dem[0].n === 0 || dem[0].n === dem[1].n) return null;
    b = dem[0].x;
    theoTp = true;
  }
  return {
    ten: b.ten, sao_menh: cts, muon, theo_tam_phuong: theoTp, nghe: b.nghe, tinh_cach: b.tinh_cach,
    ghi_chu: muon ? "Mệnh vô chính diệu, bộ xác định theo chính tinh mượn từ cung xung chiếu."
      : theoTp ? "Mệnh có Thái Dương/Cự Môn, bộ xác định theo chính tinh hội chiếu trong tam phương (cách xếp tùy phái)." : undefined,
  };
}

// ---------- §20 Tam tai & năm tuổi
const TAM_HOP_NHOM: string[][] = [["Thân", "Tý", "Thìn"], ["Dần", "Ngọ", "Tuất"], ["Tỵ", "Dậu", "Sửu"], ["Hợi", "Mão", "Mùi"]];
const TAM_TAI_NAM: string[][] = [["Dần", "Mão", "Thìn"], ["Thân", "Dậu", "Tuất"], ["Hợi", "Tý", "Sửu"], ["Tỵ", "Ngọ", "Mùi"]];
const TU_HANH_XUNG: string[][] = [["Dần", "Thân", "Tỵ", "Hợi"], ["Thìn", "Tuất", "Sửu", "Mùi"], ["Tý", "Ngọ", "Mão", "Dậu"]];

export interface KetQuaTuoi {
  chi_tuoi: string; chi_nam: string;
  loai: "nam_tuoi" | "xung" | "tam_tai" | "tam_hop" | "tu_hanh_xung" | "khong";
  tam_tai_thu?: 1 | 2 | 3;
  nhan_dinh: string;
}

const chiCuaNam = (nam: number): string => CHI[((((nam - 4) % 12) + 12) % 12) + 1];

/** §20 — quan hệ giữa chi tuổi đương số và chi của năm xem. Chỉ gắn nhãn đúng năm trúng, không gắn mọi năm. Tam tai là cờ độc lập (có năm vừa là năm tuổi vừa là tam tai). */
export function xetNamTuoi(chiTuoi: string, namXem: number): KetQuaTuoi {
  const chiNam = chiCuaNam(namXem);
  const nhom = TAM_HOP_NHOM.findIndex((n) => n.includes(chiTuoi));
  const i = TAM_TAI_NAM[nhom].indexOf(chiNam);
  const tamTai = i >= 0 ? { tam_tai_thu: (i + 1) as 1 | 2 | 3 } : {};
  const cauTamTai = i >= 0 ? ` Đồng thời là năm thứ ${i + 1}/3 của hạn Tam Tai (${TAM_TAI_NAM[nhom].join(" – ")}).` : "";
  const base = { chi_tuoi: chiTuoi, chi_nam: chiNam, ...tamTai };
  if (chiNam === chiTuoi) return { ...base, loai: "nam_tuoi", nhan_dinh: `Năm ${chiNam} trùng tuổi ${chiTuoi} (năm tuổi, Thái Tuế đáo Mệnh): nhiều biến động, nên chủ động giữ nhịp ổn định.${cauTamTai}` };
  if (CHI[mv(CHI.indexOf(chiTuoi), 6)] === chiNam) return { ...base, loai: "xung", nhan_dinh: `Năm ${chiNam} xung trực tiếp tuổi ${chiTuoi} (lục xung): năm dễ có biến động lớn.${cauTamTai}` };
  if (i >= 0) return { ...base, loai: "tam_tai", nhan_dinh: `Năm ${chiNam} là năm thứ ${i + 1}/3 của hạn Tam Tai với tuổi ${chiTuoi} (${TAM_TAI_NAM[nhom].join(" – ")}): nên thận trọng việc lớn.` };
  if (TAM_HOP_NHOM[nhom].includes(chiNam)) return { ...base, loai: "tam_hop", nhan_dinh: `Năm ${chiNam} tam hợp với tuổi ${chiTuoi}: năm tương đối thuận.` };
  if (TU_HANH_XUNG.some((g) => g.includes(chiTuoi) && g.includes(chiNam))) return { ...base, loai: "tu_hanh_xung", nhan_dinh: `Năm ${chiNam} thuộc nhóm tứ hành xung với tuổi ${chiTuoi}: chi khắc nhau, nên đề phòng.` };
  return { ...base, loai: "khong", nhan_dinh: "" };
}

// ---------- §21 Trùng phùng đại hạn × lưu niên
const SAT_GOC = ["Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp"];
const HOA_CAT = ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa"];
const CUNG_TRONG_YEU = ["Mệnh", "Tài Bạch", "Quan Lộc", "Phu Thê", "Tật Ách"];

export interface TrungPhung { cung: string; chi: string; hung: string[][]; cat: string[][]; so_lop_hung: number; so_lop_cat: number }
export interface KetQuaTrungPhung {
  cung: TrungPhung[];
  /** Cung có đủ 3 lớp cùng hung / cùng cát. */
  tam_trung_hung: TrungPhung[];
  nam_dot_pha: TrungPhung[];
  song_ky: { chi: string; cung: string; kieu: "trung" | "xung" } | null;
  canh_bao: string[];
  thuan: string[];
}

/** §21 — đếm số lớp hung/cát (gốc, đại hạn, lưu niên) trùng trên cùng cung trọng yếu. Cần đã có đại hạn; thiếu thì chỉ còn 2 lớp và không bao giờ đủ "tam". */
export function trungPhung(lg: LuanGiai, namSinh: number, namXem: number): KetQuaTrungPhung | null {
  const ls = lg.ls;
  const tuoi = namXem - namSinh + 1;
  const dh = Object.entries(ls.dai_han).map(([c, t]) => [Number(c), t] as const).find(([, t]) => t <= tuoi && tuoi < t + 10)?.[0];
  const { luu } = lg.saoLuu(namXem);
  const hc = lg.tt.cfg.han;
  const tenCung = (chi: number) => ls.cung_chuc[chi];

  // lớp A — gốc: sát tinh / Hóa Kỵ / Hóa cát / Lộc Tồn ngay tại cung
  const goc = (chi: number) => {
    const ds = lg.cung[chi];
    const hung = SAT_GOC.filter((s) => ds.includes(s));
    const cat = HOA_CAT.filter((h) => ls.sao[ls.tu_hoa[h]] === chi);
    if (ls.sao[ls.tu_hoa["Hóa Kỵ"]] === chi) hung.push("Hóa Kỵ");
    if (ds.includes("Lộc Tồn")) cat.push("Lộc Tồn");
    return { hung, cat };
  };
  // lớp B — đại hạn: Tứ Hóa đại hạn + Kình/Đà đại hạn (Lộc Tồn theo can cung đại hạn)
  const lopB = new Map<number, { hung: string[]; cat: string[] }>();
  const dongB = (chi: number) => { let l = lopB.get(chi); if (!l) lopB.set(chi, (l = { hung: [], cat: [] })); return l; };
  let kyDh: number | undefined;
  if (dh) {
    const { hoaDh } = lg.tuHoaDaiHan(dh);
    for (const [ten, chi] of Object.entries(hoaDh)) {
      if (ten === "ĐH Hóa Kỵ") { dongB(chi).hung.push(ten); kyDh = chi; }
      else if (HOA_CAT.some((h) => ten === `ĐH ${h}`)) dongB(chi).cat.push(ten);
    }
    const canDh = canCung(CAN.indexOf(ls.input.can_nam), dh);
    const sao = anLaSo(canDh, canDh % 2 ? 1 : 2, 1, 1, 1, "nam", ls.input.profile).sao;
    for (const s of ["Kình Dương", "Đà La"]) dongB(sao[s]).hung.push(`ĐH ${s}`);
    dongB(sao["Lộc Tồn"]).cat.push("ĐH Lộc Tồn");
  }
  // lớp C — lưu niên
  const lopC = (chi: number) => ({
    hung: Object.keys(hc.luu_sat).filter((k) => luu[k] === chi),
    cat: (hc.luu_cat as string[]).filter((k) => luu[k] === chi),
  });

  const cung: TrungPhung[] = [];
  for (let chi = 1; chi <= 12; chi++) {
    if (!CUNG_TRONG_YEU.includes(tenCung(chi))) continue;
    const a = goc(chi), b = lopB.get(chi) ?? { hung: [], cat: [] }, c = lopC(chi);
    const hung = [a.hung, b.hung, c.hung], cat = [a.cat, b.cat, c.cat];
    cung.push({ cung: tenCung(chi), chi: CHI[chi], hung, cat, so_lop_hung: hung.filter((l) => l.length).length, so_lop_cat: cat.filter((l) => l.length).length });
  }
  const mo = (l: string[][]) => l.flat().join(", ");
  const tamHung = cung.filter((x) => x.so_lop_hung === 3);
  const tamCat = cung.filter((x) => x.so_lop_cat === 3);
  const canhBao: string[] = [];
  for (const x of tamHung) canhBao.push(`Tam trùng phùng hung tại ${x.cung} (${x.chi}): ${mo(x.hung)} — cảnh báo nặng cho việc thuộc cung này.`);
  for (const x of cung.filter((y) => y.so_lop_hung === 2)) canhBao.push(`Hai lớp hung chồng tại ${x.cung} (${x.chi}): ${mo(x.hung)} — cần lưu ý.`);
  let songKy: KetQuaTrungPhung["song_ky"] = null;
  const kyLuu = luu["Lưu Hóa Kỵ"];
  if (kyDh !== undefined) {
    if (kyDh === kyLuu) songKy = { chi: CHI[kyLuu], cung: tenCung(kyLuu), kieu: "trung" };
    else if (mv(kyDh, 6) === kyLuu) songKy = { chi: `${CHI[kyDh]} xung ${CHI[kyLuu]}`, cung: `${tenCung(kyDh)} xung ${tenCung(kyLuu)}`, kieu: "xung" };
  }
  if (songKy) canhBao.push(`Song Kỵ (ĐH Hóa Kỵ ${songKy.kieu === "trung" ? "trùng" : "xung"} Lưu Hóa Kỵ) tại ${songKy.cung} (${songKy.chi}): thị phi, trắc trở rõ hơn; mức độ tùy phái.`);
  return {
    cung, tam_trung_hung: tamHung, nam_dot_pha: tamCat, song_ky: songKy, canh_bao: canhBao,
    thuan: tamCat.map((x) => `Tam trùng phùng cát tại ${x.cung} (${x.chi}): ${mo(x.cat)} — năm đột phá về việc thuộc cung này.`),
  };
}

// ---------- gói gọn cho giao diện
export interface KetQuaNangCao { bo: KetQuaBo | null; tuoi?: KetQuaTuoi; trung_phung?: KetQuaTrungPhung }

export function nangCao(lg: LuanGiai, namSinh?: number, namXem?: number): KetQuaNangCao {
  const kq: KetQuaNangCao = { bo: xacDinhBo(lg) };
  if (namSinh && namXem) {
    kq.tuoi = xetNamTuoi(lg.ls.input.chi_nam, namXem);
    kq.trung_phung = trungPhung(lg, namSinh, namXem) ?? undefined;
  }
  return kq;
}
