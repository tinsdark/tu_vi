// Lớp nền của văn xuôi (spec Phần 3 §24–§26): ghép nhận định đã luận thành đoạn văn dễ đọc, KHÔNG cần LLM.
// Đây cũng là bản hiện ra khi LLM tắt/lỗi/hậu kiểm hỏng. Chỉ đổi cách DIỄN ĐẠT; mọi ý và mọi con số vẫn lấy từ báo cáo,
// và mỗi câu vẫn kết thúc bằng [mã] trỏ về nhận định gốc để hậu kiểm theo mục.
import { triThuc } from "./kb";
import { HANH_VN } from "./luanGiai";
import type { BaoCao, KetQuaChuDe, NhanDinh } from "./types";

// ---------- tiện ích câu chữ
const bo = (s: string) => s.trim().replace(/\.+$/, "");
/** Ngân sách câu cho một đoạn chủ đề: người đọc cần ý chính, không cần mọi sao. Phần còn lại vẫn có ở thẻ chủ đề. */
const TOI_DA_CAU = 7;
type CauUu = { t: string; u: number }; // u: độ ưu tiên (nhỏ = quan trọng); u = 0 luôn giữ
/** Giữ các câu quan trọng nhất trong ngân sách, vẫn theo thứ tự viết ra. */
function chonNganSach(ds: CauUu[], toiDa = TOI_DA_CAU): string[] {
  if (ds.length <= toiDa) return ds.map((x) => x.t);
  const giu = new Set<number>();
  ds.forEach((x, i) => { if (x.u === 0) giu.add(i); });
  [...ds.keys()].filter((i) => ds[i].u > 0).sort((a, b) => ds[a].u - ds[b].u || a - b).slice(0, Math.max(0, toiDa - giu.size)).forEach((i) => giu.add(i));
  return ds.filter((_, i) => giu.has(i)).map((x) => x.t);
}

/** Hạ chữ đầu khi nối sau liên từ — trừ tên sao/cung (hai âm tiết đầu cùng viết hoa: "Thái Âm", "Hóa Kỵ", "Phu Thê"). */
const thuong = (s: string) => (!s || /^\p{Lu}\p{Ll}*\s\p{Lu}/u.test(s) ? s : s[0].toLowerCase() + s.slice(1));
const hoa = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const mo = (s: string) => s.replace(/\[([^[\]]+)\]/g, "«$1»"); // ngoặc vuông chỉ dành cho mã
/** Gọi cung bằng lĩnh vực ("công việc", "tiền bạc"…): người xem không cần biết tên cung chức. Riêng Mệnh và Thân giữ nguyên. */
const linhVuc = (cung: string): string => triThuc().vanPhong.linh_vuc[cung] ?? cung;
/** Bỏ dấu vết kỹ thuật khỏi câu văn: nguồn "(do X ở cung Y chiếu sang)", "(sao nằm ở cung …)", tên cung chức → lĩnh vực. Tên sao đầy đủ vẫn có ở hàng "Cơ sở" dưới đoạn. */
function lamSach(s: string): string {
  let r = s.replace(/\s*\(do .+? chiếu sang\)/g, "").replace(/\s*\(sao nằm ở cung[^)]*\)/g, "").replace(/chính tinh/g, "sao chủ");
  for (const [cung, v] of Object.entries<string>(triThuc().vanPhong.linh_vuc)) {
    r = r.replace(new RegExp(`cung ${cung}(?![\\p{L}])`, "gu"), `mảng ${v}`).replace(new RegExp(`(?<![\\p{L}])${cung}(?![\\p{L}])`, "gu"), v);
  }
  return r;
}
/** Bỏ mũi tên và dấu chấm giữa câu: văn thường không dùng ký hiệu. */
const sach = (s: string) => lamSach(mo(bo(s)).replace(/\s*→\s*/g, ", ").replace(/\.\s+/g, "; "));
const noi = (a: string[]): string => (a.length <= 1 ? (a[0] ?? "") : `${a.slice(0, -1).join(", ")} và ${a[a.length - 1]}`);
/** Câu kết thúc bằng mã. */
const cau = (txt: string, ...ma: string[]): string => `${bo(txt)} ${ma.map((m) => `[${m}]`).join("")}.`;

/** Chọn biến thể câu nối theo vị trí (chủ đề, câu) để một báo cáo không lặp nguyên văn; bảng ở data/knowledge/van_phong.json. */
const bienThe = (khoa: string, k: number): string => { const ds: string[] = triThuc().vanPhong[khoa]; return ds[k % ds.length]; };

// ---------- một nhận định → một mệnh đề đọc được (không có mã, không có dấu chấm cuối)
/** Kết luận của một cách cục bằng lời thường: bỏ tên cách, tên sao; chỉ giữ ý nghĩa. Cách xuyên cung chỉ lấy phần hệ quả sau dấu hai chấm. */
function cauCach(n: NhanDinh): string {
  const m = /^\[(.+?)(?: — (PHÁ CÁCH))?\]\s*(.*)$/s.exec(n.nhan_dinh.trim());
  if (!m) return sach(n.nhan_dinh);
  const [, , pha, mt] = m;
  const dd: Record<string, string> = triThuc().vanPhong.cach_de_doc;
  let txt = dd[pha ? `${n.id}.pha` : n.id] ?? (pha ? undefined : dd[n.id]);
  if (txt === undefined) {
    txt = mt;
    const macDinh = /^Gặp từ 2 sát tinh\/Hóa Kỵ ở bản cung và xung chiếu: cách bị giảm nhiều\.\s*(.*)$/s.exec(txt); // câu phá cách mặc định
    if (macDinh) txt = `Thế này bị giảm nhiều vì có nhiều yếu tố xấu đi kèm; ${macDinh[1]}`;
    else if (/^CC(6[4-9]|[7-9]\d|10\d)$/.test(n.id)) txt = txt.split(": ").pop()!; // cách xuyên cung: bỏ phần liệt kê sao
  }
  return hoa(sach(txt));
}

function menhDe(n: NhanDinh): string {
  const t = n.nhan_dinh.trim();
  const id = n.id;
  const lv = n.cung ? linhVuc(n.cung) : "phần này";
  if (id === "CAT_XH") return `Có thêm nhiều yếu tố hỗ trợ từ xung quanh, giúp ${lv} được nâng đỡ`;
  if (id === "PHI_TUYEN") return `Quanh ${lv} có nhiều yếu tố gây cản trở, nên cần cẩn trọng`;
  if (/^CC\d+/.test(id)) return cauCach(n);
  if (id.startsWith("BO.") || id === "BO") {
    const m = /^([^.—]{1,30}) — (.*)$/s.exec(t);
    return hoa(sach(m ? m[2] : t));
  }
  if (id.startsWith("LC.vai.")) { // sao → người: bỏ danh sách sao, chỉ nói quan hệ với ai và hệ quả
    const vai = /ứng với (.+)$/.exec(n.ly_do ?? "")?.[1] ?? "những người liên quan";
    const ket = triThuc().lienCung.vai_nguoi.nhom[id.slice(7)]?.ket ?? "";
    return `Quan hệ với ${vai} nhìn chung ${ket}`;
  }
  { // sao mượn hoặc sao hội/xung chiếu: "Sao từ cung X (chi) xung|hội chiếu Y (chi) → hệ quả" — chỉ giữ hệ quả
    const m = /^(.+?) từ cung (.+?) \(.+?\) (xung|hội) chiếu .+? \(.+?\) → (.*)$/s.exec(t);
    if (m) return hoa(sach(thuong(m[4])));
  }
  return sach(t);
}

/** Ưu tiên khi chọn 2–3 ý mạnh nhất (R7): ý riêng của sao/cách trước, tổng hợp hội chiếu sau cùng. */
const uuTien = (n: NhanDinh): number => (n.id === "CAT_XH" || n.id === "PHI_TUYEN" ? 2 : n.id.startsWith("PT") ? 1 : 0);
const chon = (ds: NhanDinh[], toiDa: number, dau: 1 | -1): NhanDinh[] =>
  [...ds].sort((a, b) => uuTien(a) - uuTien(b) || dau * (b.diem - a.diem)).slice(0, toiDa);

// ---------- một chủ đề → một đoạn (R4: kết luận trước, chi tiết sau)
const lvChuDe = (cung: string): string => (cung === "Mệnh" ? "tính cách và bản thân" : linhVuc(cung));

function cauNen(ten: string, cd: KetQuaChuDe, kq: BaoCao): string | null {
  const cungs = Object.keys(cd.cung);
  if (cungs.length !== 1) return null; // chủ đề gộp nhiều cung (Gia đình) tách tiểu mục riêng
  const k = kq.cung[cungs[0]];
  const ds = k.chinh_tinh_sang.filter(([, m]) => m);
  const lv = lvChuDe(cungs[0]);
  if (k.muon_tu) {
    const dac = /;\s*(.+?)\.\s*Không tự động/s.exec(cd.luu_y.find((n) => n.id === "VCD")?.nhan_dinh ?? "")?.[1];
    return cau(`Phần ${lv} của bạn không có sao chủ riêng nên dựa nhiều vào ảnh hưởng từ bên cạnh, độ vững vì vậy kém hơn con số một chút${dac && !/^mượn/.test(dac) ? `; ${thuong(sach(dac.replace(/^thường luận /, "thường ")))}` : ""}`, `CD.${ten}`, "VCD");
  }
  if (!ds.length) return null;
  const tot = ds.some(([, m]) => m === "M" || m === "V") ? "khá vững" : ds.some(([, m]) => m === "Đ") ? "ở mức khá" : ds.every(([, m]) => m === "H") ? "còn yếu" : "bình thường";
  return cau(`Phần nền của ${lv} ${tot}`, `CD.${ten}`);
}

/** Khung của cung (Tuần/Triệt, trái chiều, sao → người) → một câu thường, không tên sao. */
function cauLuuY(n: NhanDinh): string {
  const t = n.nhan_dinh;
  if (n.id === "TT") {
    const m = /^(?:Tuần và Triệt|Triệt|Tuần) án [^:]+:\s*(.+?)\.?$/s.exec(t); // câu riêng của từng cung: "Triệt án Quan Lộc: việc đang thuận dễ bị đứt giữa chừng…"
    if (m) return hoa(sach(m[1]));
    const triet = /Triệt/.test(t);
    const tuan = /Tuần/.test(t);
    const ten = triet && tuan ? "Tuần và Triệt" : triet ? "Triệt" : "Tuần";
    return `Phần này có ${ten} (yếu tố chặn lại) đi qua nên điều tốt giảm lực, điều xấu cũng bớt hung${triet ? "; mạnh nhất ở nửa đầu đời" : ""}${tuan ? `${triet ? ", " : "; "}rõ hơn từ khoảng 30 tuổi` : ""}`;
  }
  if (n.id.startsWith("XD.")) { // trái chiều: bỏ tên sao trong ngoặc
    return sach(t.replace(/\s*\([^()]*\)/g, "").replace("các sao tác động lên cung này nói ngược nhau", "có tín hiệu trái chiều"));
  }
  if (n.id.startsWith("LC.vai.")) return menhDe(n);
  return sach(t);
}

/** Câu hòa giải "sáng + tối cùng tồn tại" (spec §14.3): nhiều biến thể, chọn theo thứ tự chủ đề để một báo cáo không lặp nguyên văn. */
export const HOA_GIAI = [
  "Hai mặt này cùng có mặt, nên đừng chỉ nhìn vào một phía.",
  "Nói cách khác, thuận lợi và trở ngại ở đây đi song song với nhau.",
  "Vì vậy hãy tận dụng phần thuận lợi và chủ động đề phòng phần còn lại.",
  "Cả hai mặt đều có thật, và cách bạn ứng xử có thể làm mặt này hay mặt kia nổi lên.",
  "Tóm lại đây không phải mục hoàn toàn thuận hay hoàn toàn khó, mà là có cả hai.",
  "Điều này cho thấy mục này cần giữ cân bằng giữa phát huy và đề phòng.",
];
const hoaGiai = (ten: string, kq: BaoCao): string => HOA_GIAI[Math.max(0, Object.keys(kq.chu_de).indexOf(ten)) % HOA_GIAI.length];

// ---------- kể chuyện theo "hình dạng" của mục (tầng tổng hợp, không LLM)
export type HinhDang = "A" | "B" | "C" | "D" | "E";

/** Nhận ra hình dạng của một mục: nền (chính tinh cung chủ) tốt/yếu × mặt thuận/mặt nhiễu có đáng kể không. */
export function hinhDang(cd: KetQuaChuDe, kq: BaoCao): HinhDang {
  const cung = Object.keys(cd.cung)[0];
  const nenTot = kq.cung[cung].chinh_tinh_dac && !kq.cung[cung].muon_tu; // cung vô chính diệu mượn sao thì không gọi là "nền tốt"
  const cong = cd.diem_manh.reduce((t, n) => t + Math.max(0, n.diem), 0);
  const tru = cd.diem_yeu.reduce((t, n) => t + Math.abs(Math.min(0, n.diem)), 0);
  // ngưỡng đo trên 1600 mục ngẫu nhiên: trung vị cộng ≈ 6.8, trừ ≈ 4.6
  if (nenTot) return tru >= 5 ? "B" : "A";
  if (cong >= 5) return "C";
  return tru >= 4 ? "D" : "E";
}

/** Loại điều cần canh của một nhận định tiêu cực, để tra "việc nên làm". */
function loaiCanh(n: NhanDinh, nhom: Record<string, string[]>, rieng: Record<string, string> = {}): string {
  if (n.id.startsWith("XC")) return ({ "Mệnh": "tam_the", "Phúc Đức": "tam_trang", "Thiên Di": "moi_truong" } as Record<string, string>)[n.cung_nguon ?? ""] ?? "chung";
  const dem = new Map<string, number>();
  for (const sao of n.nhan ?? []) if (rieng[sao]) { dem.set(rieng[sao], (dem.get(rieng[sao]) ?? 0) + 1); }
  if (dem.size) return [...dem].sort((a, b) => b[1] - a[1])[0][0];
  for (const sao of n.nhan ?? []) for (const [loai, ds] of Object.entries(nhom)) if (ds.includes(sao)) dem.set(loai, (dem.get(loai) ?? 0) + 1);
  return [...dem].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "chung";
}

/** Lưu ý cấu trúc đưa vào văn xuôi: bỏ VCD (đã nói ở câu mở), VCD_TT (lời lưu ý về điểm số, chỉ hiện ở thẻ) và LC.* (câu liên cung, chỉ chen vào khi đoạn còn chỗ — xem cauLienCung), chỉ giữ 1 câu "trái chiều" (XD.*) để đoạn không phình (R7). */
function khungVan(cd: KetQuaChuDe, daDung: Set<string>): NhanDinh[] {
  let xd = 0;
  return cd.luu_y.filter((n) => {
    if (n.id === "VCD" || n.id === "VCD_TT" || n.id.startsWith("LC.") || daDung.has(n.id + n.nhan_dinh)) return false;
    return !n.id.startsWith("XD.") || ++xd <= 1;
  });
}

/** Một chi tiết nhỏ (phụ tinh ±1) quan trọng nhất của mục (đã sắp theo ưu tiên): không nêu tên sao, mang đúng mã của nó.
 *  Chỉ 1 câu để đoạn không phình (R7); danh sách đầy đủ vẫn hiện ở thẻ chủ đề. */
function cauSaoNho(cd: KetQuaChuDe, daDung: Set<string>): string[] {
  const out: string[] = [];
  for (const n of cd.sao_nho) {
    if (out.length >= 1) break;
    const k = JSON.stringify([n.id, n.nhan_dinh]);
    if (daDung.has(k)) continue;
    daDung.add(k);
    out.push(cau(`Một chi tiết nhỏ cũng đáng để ý: ${thuong(menhDe(n))}`, n.id));
  }
  return out;
}

function doanKeChuyen(ten: string, cd: KetQuaChuDe, kq: BaoCao, daDung: Set<string>): string | null {
  const bang = triThuc().keChuyen;
  const kc = bang.chu_de[ten];
  if (!kc) return null;
  const ma = `CD.${ten}`;
  const hd = hinhDang(cd, kq);
  const moi = (ds: NhanDinh[]) => ds.filter((n) => {
    const k = JSON.stringify([n.id, n.nhan_dinh]);
    if (daDung.has(k)) return false;
    daDung.add(k);
    return true;
  });
  const nenYeu = hd === "C" || hd === "D" || hd === "E";
  // mô tả trung tính của chính tinh chỉ đưa vào khi nền tốt (khi nền yếu, câu đó có thể là mặt hạn chế đã được Hóa cát "cứu")
  const mua = chon(moi(nenYeu ? [...cd.diem_manh] : [...cd.trung_tinh, ...cd.diem_manh]), 2, 1);
  const canh = chon(moi([...cd.diem_yeu]), 1, -1);
  const khung = khungVan(cd, daDung);
  khung.forEach((n) => daDung.add(n.id + n.nhan_dinh));

  const vt = Math.max(0, Object.keys(kq.chu_de).indexOf(ten)); // vị trí chủ đề: gốc để chọn biến thể câu nối
  const moDau = (kc.mo_dau[hd] as string).replace(/\s*\(mức \{nhan\}, khoảng \{d\}\/100, dựa trên \{nen\}\)/, bienThe("mo_dau_duoi", vt));
  const s: CauUu[] = [{ t: cau(moDau.replace("{nhan}", cd.xep_loai.toLowerCase()).replace("{d}", String(cd.diem100)).replace("{nen}", ""), ma), u: 0 }];
  const them = (t: string, u: number) => s.push({ t, u });
  const diemTua = (tienTo: string) => mua.forEach((n, i) => them(cau(i === 0 && !tienTo ? menhDe(n) : i === 0 ? `${tienTo}${thuong(menhDe(n))}` : `${bienThe("noi_them", vt + i)} ${thuong(menhDe(n))}`, n.id), i === 0 ? 1 : 3));
  const canhCau = (tienTo: string) => canh.forEach((n) => them(cau(`${tienTo}${thuong(menhDe(n))}`, n.id), 1));

  if (hd === "A" || hd === "E") { diemTua(""); canhCau(bienThe("canh_nhe", vt)); }
  else if (hd === "B") { diemTua(""); canhCau(bienThe("canh_vua", vt)); }
  else if (hd === "C") { diemTua(bienThe("diem_tua", vt)); canhCau(bienThe("canh_nang", vt)); }
  else { canhCau("Cần lưu ý: "); diemTua("Dù vậy vẫn có điểm tựa: "); }
  khung.forEach((n, i) => them(cau(cauLuuY(n), n.id), i === 0 ? 2 : 5));

  const loai = canh[0] ? loaiCanh(canh[0], bang.nhom_sao, kc.nhom_rieng) : "";
  const viec = canh[0] ? kc.viec_nen_lam[loai] ?? kc.viec_nen_lam.chung : kc.tan_dung;
  cauSaoNho(cd, daDung).forEach((t) => them(t, 5));
  them(cau(`${canh[0] ? "Việc nên làm" : "Gợi ý"}: ${viec}`, canh[0]?.id ?? ma), 0);
  return chonNganSach(s).join(" ");
}

function doanChuDe(ten: string, cd: KetQuaChuDe, kq: BaoCao, daDung: Set<string>): string {
  const ke = doanKeChuyen(ten, cd, kq, daDung);
  if (ke) return ke;
  const ma = `CD.${ten}`;
  const s: string[] = [cau(`Về ${ten.toLowerCase()}, bạn ở mức ${cd.xep_loai.toLowerCase()} (khoảng ${cd.diem100}/100)`, ma)];
  const nen = cauNen(ten, cd, kq);
  if (nen) s.push(nen);
  // khung cung + chính tinh mô tả (nền tảng)
  const khung = khungVan(cd, daDung);
  khung.forEach((n) => daDung.add(n.id + n.nhan_dinh));
  const trung = cd.trung_tinh.filter((n) => !daDung.has(n.id + n.nhan_dinh));
  trung.forEach((n) => daDung.add(n.id + n.nhan_dinh));
  const conDung = (ds: NhanDinh[]) => ds.filter((n) => {
    const k = JSON.stringify([n.id, n.nhan_dinh]);
    if (daDung.has(k)) return false;
    daDung.add(k);
    return true;
  });

  if (ten === "Gia đình") {
    const TM: [string, string][] = [["Cha mẹ", "cha mẹ"], ["Con cái", "con cái"], ["Anh em", "anh chị em"]];
    const nhac = (t: string, goi: string) => t.toLowerCase().slice(0, 45).includes(goi); // câu đã nhắc đối tượng thì không thêm "Về ..." nữa
    const sangCau: string[] = [];
    const hungCau: { goi: string; t: string; id: string }[] = [];
    for (const [m, goi] of TM) {
      const lay = (ds: NhanDinh[]) => ds.filter((n) => n.nhan_dinh.startsWith(`${m}: `)).map((n) => ({ ...n, nhan_dinh: n.nhan_dinh.slice(m.length + 2) }));
      const sang = chon(conDung(lay(cd.diem_manh)), 1, 1);
      const hung = chon(conDung(lay(cd.diem_yeu)), 1, -1);
      const y = [...lay(cd.trung_tinh).slice(0, 1), ...sang].slice(0, 1);
      if (y.length) { const t = thuong(menhDe(y[0])); sangCau.push(cau(nhac(t, goi) ? hoa(t) : `Về ${goi}, ${t}`, y[0].id)); }
      if (hung.length) hungCau.push({ goi, t: thuong(menhDe(hung[0])), id: hung[0].id });
    }
    s.push(...sangCau);
    s.push(...cauSaoNho(cd, daDung)); // thuộc nhóm "mặt sáng/trung tính": đặt trước phần cần giữ ý
    hungCau.forEach(({ goi, t, id }, i) => {
      const tt = nhac(t, goi) ? t : `về ${goi}, ${t}`;
      s.push(cau(i === 0 ? (sangCau.length ? `Ngược lại, ${tt}` : `Cần lưu ý, ${tt}`) : i === 1 ? `Còn ${tt}` : `Ngoài ra, ${tt}`, id));
    });
    if (sangCau.length && hungCau.length) s.push(cau(hoaGiai(ten, kq), ma));
    return s.join(" ");
  }

  const gd: CauUu[] = s.map((t, i) => ({ t, u: i === 0 ? 0 : 1 })); // câu mở đầu và câu nền
  const them = (t: string, u: number) => gd.push({ t, u });
  khung.forEach((n, i) => them(cau(cauLuuY(n), n.id), i === 0 ? 2 : 5));
  trung.slice(0, 2).forEach((n, i) => them(cau(hoa(menhDe(n)), n.id), i === 0 ? 3 : 5));
  const sang = chon(conDung(cd.diem_manh), 2, 1);
  const hung = chon(conDung([...cd.diem_yeu]), 2, -1);
  const vt = Math.max(0, Object.keys(kq.chu_de).indexOf(ten));
  sang.forEach((n, i) => them(cau(i ? `${bienThe("noi_them", vt + i)} ${thuong(menhDe(n))}` : menhDe(n), n.id), i === 0 ? 1 : 3));
  hung.forEach((n, i) => them(cau(`${i ? bienThe("noi_hung_tiep", vt + i) : sang.length ? bienThe("noi_nguoc", vt) : "Cần lưu ý,"} ${thuong(menhDe(n))}`, n.id), i === 0 ? 1 : 3));
  cauSaoNho(cd, daDung).forEach((t) => them(t, 5)); // sao phụ: ưu tiên thấp; câu hòa giải luôn là câu cuối đoạn
  // câu liên cung (sao → người, Hóa × Tuần/Triệt): ưu tiên thấp nhất, chỉ 1 câu; đầy đủ vẫn hiện ở thẻ chủ đề
  const lienCung = cd.luu_y.find((n) => n.id.startsWith("LC.") && !daDung.has(n.id + n.nhan_dinh));
  if (lienCung) { daDung.add(lienCung.id + lienCung.nhan_dinh); them(cau(cauLuuY(lienCung), lienCung.id), 6); }
  const ket = chonNganSach(gd, sang.length && hung.length ? TOI_DA_CAU - 1 : TOI_DA_CAU);
  if (sang.length && hung.length) ket.push(cau(hoaGiai(ten, kq), ma)); // hòa giải đặt SAU khi đã nêu cả hai mặt, luôn là câu cuối
  return ket.join(" ");
}

// ---------- tổng quan
export const NEN_CUC: Record<string, string> = {
  cuc_sinh_menh: "Cục nuôi dưỡng bản mệnh, nên hoàn cảnh nâng đỡ và bạn dễ phát huy được năng lực.",
  tuong_hoa: "Bản mệnh và cục hợp nhau, nên nền lá số thuận hòa và ổn định.",
  menh_sinh_cuc: "Bản mệnh nuôi cục, nghĩa là bạn hao sức cho hoàn cảnh nên dễ làm nhiều hưởng ít.",
  menh_khac_cuc: "Bản mệnh khắc cục, nghĩa là bạn chủ động cải tạo hoàn cảnh nhưng khá vất vả.",
  cuc_khac_menh: "Cục khắc bản mệnh, nghĩa là hoàn cảnh có nhiều trở ngại nên cần tu dưỡng và kiên trì.",
};
/** Quan hệ giữa sao chủ của cung Mệnh và bản mệnh, nói bằng lời thường (tên sao ở hàng "Cơ sở"). */
const NEN_SAO: Record<string, string> = {
  dong_hanh: "Sao chủ của cung Mệnh cùng hành với bản mệnh, nên mặt tốt của bạn được phát huy trọn vẹn.",
  sao_sinh_menh: "Sao chủ của cung Mệnh nuôi bản mệnh, nên bạn được nâng đỡ và dễ nhờ vào mặt tốt của chính mình.",
  menh_sinh_sao: "Bản mệnh nuôi sao chủ của cung Mệnh, nên bạn làm hết sức nhưng dễ đuối nếu ôm đồm; bù lại mặt tốt được phát huy.",
  sao_khac_menh: "Sao chủ của cung Mệnh khắc bản mệnh, nên mặt tốt bị giảm bớt và bạn dễ chịu áp lực từ chính tính nết của mình.",
  menh_khac_sao: "Bạn kiểm soát tốt tính nết của chính mình nhưng hơi kìm chuyện hưởng thụ nên dễ sống khắc khổ.",
};

function cauNenLaSo(n: NhanDinh): string | null {
  const loai = n.id.replace(/^NEN\./, "");
  if (NEN_CUC[loai]) return cau(NEN_CUC[loai], n.id);
  if (loai === "am_duong") return null; // chiều đại hạn chỉ là chi tiết kỹ thuật, đã có ở tab Hạn
  if (loai.startsWith("sao_chu.") && NEN_SAO[loai.slice(8)]) return cau(bo(NEN_SAO[loai.slice(8)]), n.id);
  if (loai.startsWith("tuan_triet.")) {
    const m = /án cung (\S+) \((.+?)\)/.exec(n.nhan_dinh); // "án cung <địa chi> (<cung chức>)"
    const ten = /Triệt/.test(n.nhan_dinh) ? "Triệt" : "Tuần";
    const cung = !m || m[2] === "Mệnh" ? "Cung Mệnh của bạn" : `Cung Thân của bạn (thuộc mảng ${linhVuc(m[2])})`;
    return cau(`${cung} có ${ten} (yếu tố chặn lại) đi qua, ảnh hưởng đến cả đời nên đáng chú ý ngay từ đầu: điều tốt giảm lực, điều xấu cũng bớt hung`, n.id);
  }
  return cau(sach(n.nhan_dinh), n.id);
}

function cauThan(kq: BaoCao): string[] {
  const out: string[] = [];
  const [a, b] = kq.than.nhan_dinh;
  const m = /^Thân cư [^:]+: (.*)$/s.exec(a.nhan_dinh);
  const lv = kq.than.cu === "Mệnh" ? "bản thân (cùng cung Mệnh)" : linhVuc(kq.than.cu);
  out.push(cau(`Cung Thân (nơi vận về sau gắn vào) của bạn thuộc mảng ${lv}${m ? `: ${sach(thuong(m[1]))}` : ""}`, a.id));
  if (b) out.push(cau(sach(b.nhan_dinh), b.id));
  return out;
}

/** Câu "điều cần để ý nhất trong năm" từ han.luu_nien.ket_luan (dùng cho đoạn Hạn năm và hỏi đáp). */
function cauRuiRo(kq: BaoCao): string | null {
  const ruiRo = kq.han?.luu_nien.ket_luan.find((n) => n.id === "HAN.rui_ro");
  if (!ruiRo) return null;
  const kn: Record<string, { muc: string }> = triThuc().cfg.han.khuyen_nghi;
  const phan = ruiRo.nhan_dinh.replace(/\s*;\s*ngoài tam phương lưu niên nhưng là cung trọng yếu/g, "");
  const sau = phan.slice(phan.lastIndexOf(" — ") >= 0 ? phan.lastIndexOf(" — ") + 3 : phan.indexOf(": ") + 2).replace(/\.$/, "");
  const goc: string[] = [];
  for (const seg of sau.split("; ")) {
    const m = /^(.+?) \((\S+)\): (.+)$/.exec(seg);
    if (!m) continue;
    const nghia = [...m[3].matchAll(/\(([^()]+)\)/g)].map((x) => x[1]);
    if (nghia.length) goc.push(`${kn[m[1]]?.muc ?? m[1].toLowerCase()} (dễ gặp ${noi(nghia)})`);
  }
  if (!goc.length) return cau(sach(ruiRo.nhan_dinh), ruiRo.id);
  const bo3 = /bộ Mệnh – Tài Bạch – Quan Lộc/.test(ruiRo.nhan_dinh);
  return cau(`Điều cần để ý nhất trong năm là ${noi(goc.slice(0, 3))}${bo3 ? "; vì cả ba mảng này cùng chịu ảnh hưởng nên đây là năm cần thận trọng" : ""}`, ruiRo.id);
}

/** Câu "mặt thuận của năm" từ han.luu_nien.ket_luan (dùng cho đoạn Hạn năm và hỏi đáp). */
function cauMatThuan(kq: BaoCao): string | null {
  const thuan = kq.han?.luu_nien.ket_luan.find((n) => n.id === "HAN.mat_thuan");
  if (!thuan) return null;
  const m = /→ tận dụng cho (.+?) theo hướng (.+?)\.?$/s.exec(thuan.nhan_dinh);
  return cau(m ? `Mặt thuận của năm là có sao hỗ trợ ở các mảng ${m[1]}; bạn nên tận dụng theo hướng ${bo(m[2])}` : sach(thuan.nhan_dinh), thuan.id);
}

// ---------- hạn năm
function doanHan(kq: BaoCao): string | null {
  const h = kq.han;
  if (!h?.dai_han) return null;
  const d = h.dai_han;
  const s: string[] = [cau(`Năm ${h.nam_xem}, bạn đang ở giai đoạn ${d.tu_tuoi}–${d.tu_tuoi + 9} tuổi (một đại hạn, tức 10 năm), nhìn chung ở mức ${d.danh_gia["Mệnh"].xep_loai.toLowerCase()}`, "DH")];
  const kl = h.luu_nien.ket_luan;
  const cauRR = cauRuiRo(kq);
  if (cauRR) s.push(cauRR);
  for (const n of kl.filter((x) => x.id.startsWith("HAN.nen_tranh."))) {
    const m = /^Về (.+?): nên (.+?); tránh (.+?)\.?$/s.exec(n.nhan_dinh);
    s.push(cau(m ? `Về ${m[1]}, bạn nên ${bo(m[2])} và tránh ${bo(m[3])}` : sach(n.nhan_dinh), n.id));
  }
  const ky = h.luu_nien.ghi_chu.find((n) => n.id === "LN.song_ky");
  if (ky) s.push(cau(`Năm nay có hai yếu tố bất lợi cùng dồn vào một mảng (một từ giai đoạn 10 năm, một riêng của năm), nên việc thuộc mảng đó dễ vướng mắc, cần thận trọng`, ky.id));
  const cauMT = cauMatThuan(kq);
  if (cauMT) s.push(cauMT);
  return s.join(" ");
}

/** Tổng kết 2–3 câu sinh từ luật: mảng thuận nhất, mảng cần chú tâm nhất (chênh từ ngưỡng thì mới gọi tên, nếu không nói là đồng đều), rồi cung Thân. */
function doanTongKet(kq: BaoCao): string | null {
  const tk = triThuc().vanPhong.tong_ket;
  const kcb = triThuc().keChuyen.chu_de;
  const xep = Object.entries(kq.chu_de).sort((a, b) => b[1].diem100 - a[1].diem100);
  if (xep.length < 2) return null;
  const [tenCao, cao] = xep[0];
  const [tenThap, thap] = xep[xep.length - 1];
  const dien = (m: string, r: Record<string, string>) => Object.entries(r).reduce((t, [k, v]) => t.replace(`{${k}}`, v), m);
  const s: string[] = [];
  if (cao.diem100 - thap.diem100 >= tk.chenh_toi_thieu) {
    const tanDung: string | undefined = kcb[tenCao]?.tan_dung;
    const viec: string | undefined = kcb[tenThap]?.viec_nen_lam?.chung;
    s.push(cau(dien(tanDung ? tk.manh : tk.manh_khong_viec, { ten: tenCao.toLowerCase(), d: String(cao.diem100), viec: tanDung ?? "" }), `CD.${tenCao}`));
    s.push(cau(dien(viec ? tk.yeu : tk.yeu_khong_viec, { ten: tenThap.toLowerCase(), d: String(thap.diem100), viec: viec ?? "" }), `CD.${tenThap}`));
  } else {
    s.push(cau(dien(tk.dong_deu, { cao: tenCao.toLowerCase(), dc: String(cao.diem100), thap: tenThap.toLowerCase(), dt: String(thap.diem100) }), `CD.${tenCao}`, `CD.${tenThap}`));
  }
  return s.join(" ");
}

/** Hỏi–đáp (data/knowledge/cau_hoi.json): mỗi câu hỏi chỉ được trả lời bằng đúng kết quả engine đã tính (chủ đề, so cung, cung Thân, dòng thời gian đại hạn, hạn năm, cách quý nhân); không đủ luật thì không hỏi. */
function dongHoiDap(kq: BaoCao): string[] {
  const vp = triThuc().vanPhong.hoi_dap;
  const hoiSc: Record<string, string> = Object.fromEntries((triThuc().lienCung.so_cung.cap as { a: string; b: string; hoi: string }[]).map((c) => [`SC.${c.a}.${c.b}`, c.hoi]));
  const dien = (m: string, r: Record<string, string>) => Object.entries(r).reduce((t, [k, v]) => t.replace(`{${k}}`, v), m);
  const mo = (hoi: string, traLoi: string) => dien(vp.mo, { hoi, tra_loi: traLoi });
  const out: string[] = [];
  for (const q of triThuc().cauHoi.cau_hoi as Record<string, string>[]) {
    let dong: string[] = [];
    if (q.loai === "chu_de") {
      const cd = kq.chu_de[q.ten];
      if (!cd) continue;
      dong = [cau(dien(vp.chu_de, { hoi: q.hoi, nhan: cd.xep_loai.toLowerCase(), d: String(cd.diem100), ten: q.ten }), `CD.${q.ten}`)]; // chỉ trỏ về mục chi tiết, không nhắc lại câu đã có
    } else if (q.loai === "so_cung") {
      const n = kq.so_cung.find((x) => x.id === `SC.${q.a}.${q.b}`);
      if (!n) continue;
      const chinh = n.nhan_dinh.split(/(?<=\.)\s+/)[0]; // chỉ câu so sánh; lưu ý kèm theo đã có ở thẻ cung
      dong = [cau(dien(vp.so_cung, { hoi: hoiSc[n.id], tra_loi: thuong(sach(chinh)) }), n.id)];
    } else if (q.loai === "than") {
      const b = kq.than.nhan_dinh[1];
      if (b) dong = [cau(mo(q.hoi, thuong(sach(b.nhan_dinh.split(/(?<=\.)\s+/)[0]))), b.id)]; // chỉ kết luận chính, phần Tuần/Triệt đã có ở Tổng quan
    } else if (q.loai === "dai_han") {
      const ds = kq.dai_han_ca_doi ?? [];
      const m = ds.length > 1 ? ds.find((x) => x.nhan === q.nhan) : undefined;
      if (m) dong = [cau(mo(q.hoi, `giai đoạn ${m.tu_tuoi}–${m.den_tuoi} tuổi (một đại hạn), xếp loại ${m.xep_loai.toLowerCase()}; đây là giai đoạn ${m.nhan} trong cả đời của bạn`), m.id)];
    } else if (q.loai === "dai_han_nay") {
      const d = kq.han?.dai_han;
      if (d) dong = [cau(dien(vp.dai_han_nay, { hoi: q.hoi, tu: String(d.tu_tuoi), den: String(d.tu_tuoi + 9), nhan: d.danh_gia["Mệnh"].xep_loai.toLowerCase() }), "DH")];
    } else if (q.loai === "dai_han_ke") {
      const d = kq.han?.dai_han;
      const ds = kq.dai_han_ca_doi ?? [];
      const nay = d ? ds.find((x) => x.tu_tuoi === d.tu_tuoi) : undefined;
      const ke = nay ? ds.find((x) => x.tu_tuoi === nay.tu_tuoi + 10) : undefined;
      if (nay && ke) {
        const hieu = ke.diem - nay.diem;
        const sc = vp.so_sanh;
        dong = [cau(dien(vp.dai_han_ke, { hoi: q.hoi, tu: String(ke.tu_tuoi), den: String(ke.den_tuoi), nhan: ke.xep_loai.toLowerCase(), so_sanh: Math.abs(hieu) < vp.dai_han_chenh ? sc.ngang : hieu > 0 ? sc.hon : sc.kem }), ke.id, nay.id)];
      }
    } else if (q.loai === "quy_nhan") {
      const cach: { txt: string; id: string }[] = [];
      for (const k of Object.values(kq.cung)) {
        for (const n of k.nhan_dinh) {
          const m = /^\[(.+?)\]/.exec(n.nhan_dinh); // bỏ cách bị phá ("— PHÁ CÁCH")
          if (n.id.startsWith("CC") && n.diem > 0 && !n.an && (n.linh_vuc ?? []).includes(q.linh_vuc) && m && !m[1].includes("PHÁ CÁCH") && !cach.some((c) => c.id === n.id)) cach.push({ txt: cauCach(n), id: n.id });
        }
      }
      if (cach.length) {
        const ds = cach.slice(0, 2);
        dong = [cau(dien(vp.quy_nhan, { hoi: q.hoi, cach: ds.map((c) => thuong(bo(c.txt))).join("; ") }), ...ds.map((c) => c.id))];
      }
    }
    if (dong.length) out.push(dong.join(" "));
  }
  return out;
}

/** Lớp nền: toàn bộ văn xuôi không dùng LLM, mỗi mục một đoạn. */
export function vietMau(kq: BaoCao): string {
  const l = kq.la_so;
  const tong: string[] = [
    cau(`Mệnh của bạn nằm ở cung ${kq.menh_tai}, bản mệnh ${HANH_VN[l.ban_menh]}, cục ${HANH_VN[l.cuc.hanh]} ${l.cuc.so}`, "TQ"),
    ...[...new Set(kq.nen.map(cauNenLaSo).filter((x): x is string => x !== null))], // hai sao cùng quan hệ với bản mệnh cho cùng một câu: chỉ nêu một lần
    ...cauThan(kq),
  ];
  const out: string[] = ["# Tổng quan", tong.join(" ")];
  const daDung = new Set<string>();
  for (const [ten, cd] of Object.entries(kq.chu_de)) {
    out.push(`\n# ${ten}`);
    out.push(doanChuDe(ten, cd, kq, daDung));
  }
  const han = doanHan(kq);
  if (han) {
    out.push(`\n# Hạn năm ${kq.han!.nam_xem}`);
    out.push(han);
  }
  const tk = doanTongKet(kq);
  if (tk) out.push("\n# Tổng kết", tk);
  const hd = dongHoiDap(kq);
  if (hd.length) out.push(`\n# ${triThuc().vanPhong.hoi_dap.tieu_de}`, ...hd);
  return out.join("\n");
}
