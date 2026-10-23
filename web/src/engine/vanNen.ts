// Lớp nền của văn xuôi (spec Phần 3 §24–§26): ghép nhận định đã luận thành đoạn văn dễ đọc, KHÔNG cần LLM.
// Đây cũng là bản hiện ra khi LLM tắt/lỗi/hậu kiểm hỏng. Chỉ đổi cách DIỄN ĐẠT; mọi ý và mọi con số vẫn lấy từ báo cáo,
// và mỗi câu vẫn kết thúc bằng [mã] trỏ về nhận định gốc để hậu kiểm theo mục.
import { triThuc } from "./kb";
import { HANH_VN } from "./luanGiai";
import type { BaoCao, KetQuaChuDe, NhanDinh } from "./types";

// ---------- tiện ích câu chữ
const bo = (s: string) => s.trim().replace(/\.+$/, "");
/** Hạ chữ đầu khi nối sau liên từ — trừ tên sao/cung (hai âm tiết đầu cùng viết hoa: "Thái Âm", "Hóa Kỵ", "Phu Thê"). */
const thuong = (s: string) => (!s || /^\p{Lu}\p{Ll}*\s\p{Lu}/u.test(s) ? s : s[0].toLowerCase() + s.slice(1));
const hoa = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const mo = (s: string) => s.replace(/\[([^[\]]+)\]/g, "«$1»"); // ngoặc vuông chỉ dành cho mã
/** Bỏ mũi tên và dấu chấm giữa câu: văn thường không dùng ký hiệu. */
const sach = (s: string) => mo(bo(s)).replace(/\s*→\s*/g, ", ").replace(/\.\s+/g, "; ");
const noi = (a: string[]): string => (a.length <= 1 ? (a[0] ?? "") : `${a.slice(0, -1).join(", ")} và ${a[a.length - 1]}`);
/** Câu kết thúc bằng mã. */
const cau = (txt: string, ...ma: string[]): string => `${bo(txt)} ${ma.map((m) => `[${m}]`).join("")}.`;

const MUC_SANG: Record<string, string> = { M: "miếu", V: "vượng", "Đ": "đắc", B: "bình", H: "hãm" };

// ---------- một nhận định → một mệnh đề đọc được (không có mã, không có dấu chấm cuối)
function menhDe(n: NhanDinh): string {
  const t = n.nhan_dinh.trim();
  const id = n.id;
  if (id === "CAT_XH") {
    const sao = [...new Set(n.nhan ?? [])];
    return `Có thêm các sao hỗ trợ từ những cung khác chiếu về${sao.length ? ` (${noi(sao.slice(0, 4))}${sao.length > 4 ? ", …" : ""})` : ""}, giúp cung ${n.cung ?? "này"} được nâng đỡ`;
  }
  if (id === "PHI_TUYEN") {
    const sao = [...new Set(n.nhan ?? [])];
    return `Quanh cung ${n.cung ?? "này"} có nhiều sao gây cản trở${sao.length ? ` (${noi(sao.slice(0, 4))}${sao.length > 4 ? ", …" : ""})` : ""}, nên cần cẩn trọng`;
  }
  if (/^CC\d+/.test(id)) { // "[Tên cách — PHÁ CÁCH] mô tả"
    const m = /^\[(.+?)(?: — (PHÁ CÁCH))?\]\s*(.*)$/s.exec(t);
    if (m) {
      const [, ten, pha, mt] = m;
      return `Theo cách «${ten}»${pha ? " (cách này bị phá nên giảm hiệu lực)" : ""}, ${sach(thuong(mt)).replace(/:\s+/g, ", ")}`;
    }
  }
  if (id.startsWith("BO.") || id === "BO") {
    const m = /^([^.—]{1,30}) — (.*)$/s.exec(t);
    return m ? `Bộ sao «${m[1]}»: ${sach(thuong(m[2]))}` : `Bộ sao ở Mệnh của bạn: ${sach(t)}`;
  }
  { // sao mượn hoặc sao hội/xung chiếu: "Sao từ cung X (chi) xung|hội chiếu Y (chi) → hệ quả"
    const m = /^(.+?) từ cung (.+?) \(.+?\) (xung|hội) chiếu .+? \(.+?\) → (.*)$/s.exec(t);
    if (m) return `${hoa(sach(thuong(m[4]).replace(/\s*\(sao nằm ở cung[^)]*\)/, "")))} (do ${m[1]} ở cung ${m[2]} chiếu sang)`; // hệ quả trước, nguồn trong ngoặc
  }
  return sach(t).replace(/\s*\(sao nằm ở cung[^)]*\)/, "");
}

/** Ưu tiên khi chọn 2–3 ý mạnh nhất (R7): ý riêng của sao/cách trước, tổng hợp hội chiếu sau cùng. */
const uuTien = (n: NhanDinh): number => (n.id === "CAT_XH" || n.id === "PHI_TUYEN" ? 2 : n.id.startsWith("PT") ? 1 : 0);
const chon = (ds: NhanDinh[], toiDa: number, dau: 1 | -1): NhanDinh[] =>
  [...ds].sort((a, b) => uuTien(a) - uuTien(b) || dau * (b.diem - a.diem)).slice(0, toiDa);

// ---------- một chủ đề → một đoạn (R4: kết luận trước, chi tiết sau)
function cauNen(ten: string, cd: KetQuaChuDe, kq: BaoCao): string | null {
  const cungs = Object.keys(cd.cung);
  if (cungs.length !== 1) return null; // chủ đề gộp nhiều cung (Gia đình) tách tiểu mục riêng
  const k = kq.cung[cungs[0]];
  const ds = k.chinh_tinh_sang.filter(([, m]) => m);
  if (k.muon_tu) {
    const sao = k.chinh_tinh_sang.map(([s]) => s);
    const dac = /;\s*(.+?)\.\s*Không tự động/s.exec(cd.luu_y.find((n) => n.id === "VCD")?.nhan_dinh ?? "")?.[1];
    return cau(`Cung ${cungs[0]} của bạn không có chính tinh, nên khi luận phải mượn sao ở cung đối diện (${noi(sao)}) và độ mạnh được tính giảm đi; điều này không tự động là xấu${dac && !/^mượn/.test(dac) ? `, ${thuong(dac.replace(/^thường luận /, "thường "))}` : ""}`, `CD.${ten}`, "VCD");
  }
  if (!ds.length) return null;
  const tot = ds.some(([, m]) => m === "M" || m === "V") ? "ở thế tốt" : ds.some(([, m]) => m === "Đ") ? "ở thế khá" : ds.every(([, m]) => m === "H") ? "ở thế yếu" : "ở thế bình thường";
  return cau(`Cung ${cungs[0]} của bạn có chính tinh ${tot} (${ds.map(([s, m]) => `${s} ${MUC_SANG[m!]}`).join(", ")})`, `CD.${ten}`);
}

/** Khung của cung (Tuần/Triệt, vô chính diệu) → một câu thường. */
function cauLuuY(n: NhanDinh): string {
  const t = n.nhan_dinh;
  if (n.id === "TT") {
    const triet = /Triệt/.test(t);
    const tuan = /Tuần/.test(t);
    const ten = triet && tuan ? "Tuần và Triệt" : triet ? "Triệt" : "Tuần";
    return `Cung này có ${ten} đi qua: điều tốt ở đây bị giảm lực, điều xấu cũng bớt hung${triet ? "; Triệt tác động mạnh ở nửa đầu đời" : ""}${tuan ? `${triet ? ", " : "; "}Tuần rõ hơn từ khoảng 30 tuổi` : ""}`;
  }
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
  const nenTot = kq.cung[cung].chinh_tinh_dac;
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

/** "Thất Sát miếu" — nền chính tinh của cung chủ, tên sao đặt trong ngoặc ở câu mở (R1). */
function nenChu(cung: string, kq: BaoCao): string {
  const k = kq.cung[cung];
  const ds = k.chinh_tinh_sang.filter(([, m]) => m).map(([s, m]) => `${s} ${MUC_SANG[m!]}`);
  if (k.muon_tu) return `cung ${cung} không có chính tinh, mượn ${noi(k.chinh_tinh_sang.map(([s]) => s))} từ cung đối diện`;
  return ds.length ? `${noi(ds)} ở cung ${cung}` : `cung ${cung}`;
}

function doanKeChuyen(ten: string, cd: KetQuaChuDe, kq: BaoCao, daDung: Set<string>): string | null {
  const bang = triThuc().keChuyen;
  const kc = bang.chu_de[ten];
  if (!kc) return null;
  const ma = `CD.${ten}`;
  const hd = hinhDang(cd, kq);
  const cung = Object.keys(cd.cung)[0];
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
  const khung = cd.luu_y.filter((n) => n.id !== "VCD" && !daDung.has(n.id + n.nhan_dinh));
  khung.forEach((n) => daDung.add(n.id + n.nhan_dinh));

  const s: string[] = [cau((kc.mo_dau[hd] as string).replace("{nhan}", cd.xep_loai.toLowerCase()).replace("{d}", String(cd.diem100)).replace("{nen}", nenChu(cung, kq)), ma)];
  const diemTua = (tienTo: string) => mua.forEach((n, i) => s.push(cau(i === 0 && !tienTo ? menhDe(n) : i === 0 ? `${tienTo}${thuong(menhDe(n))}` : `Ngoài ra, ${thuong(menhDe(n))}`, n.id)));
  const canhCau = (tienTo: string) => canh.forEach((n) => s.push(cau(`${tienTo}${thuong(menhDe(n))}`, n.id)));

  if (hd === "A" || hd === "E") { diemTua(""); canhCau("Chỉ cần để ý: "); }
  else if (hd === "B") { diemTua(""); canhCau("Nhưng cần để ý: "); }
  else if (hd === "C") { diemTua("Điểm đỡ cho bạn: "); canhCau("Cần để ý: "); }
  else { canhCau("Cần lưu ý: "); diemTua("Dù vậy vẫn có điểm tựa: "); }
  for (const n of khung) s.push(cau(cauLuuY(n), n.id));

  const loai = canh[0] ? loaiCanh(canh[0], bang.nhom_sao, kc.nhom_rieng) : "";
  const viec = canh[0] ? kc.viec_nen_lam[loai] ?? kc.viec_nen_lam.chung : kc.tan_dung;
  s.push(cau(`${canh[0] ? "Việc nên làm" : "Gợi ý"}: ${viec}`, canh[0]?.id ?? ma));
  return s.join(" ");
}

function doanChuDe(ten: string, cd: KetQuaChuDe, kq: BaoCao, daDung: Set<string>): string {
  const ke = doanKeChuyen(ten, cd, kq, daDung);
  if (ke) return ke;
  const ma = `CD.${ten}`;
  const s: string[] = [cau(`Về ${ten.toLowerCase()}, bạn ở mức ${cd.xep_loai.toLowerCase()} (khoảng ${cd.diem100}/100)`, ma)];
  const nen = cauNen(ten, cd, kq);
  if (nen) s.push(nen);
  // khung cung + chính tinh mô tả (nền tảng)
  const khung = cd.luu_y.filter((n) => n.id !== "VCD" && !daDung.has(n.id + n.nhan_dinh));
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
    hungCau.forEach(({ goi, t, id }, i) => {
      const tt = nhac(t, goi) ? t : `về ${goi}, ${t}`;
      s.push(cau(i === 0 ? (sangCau.length ? `Ngược lại, ${tt}` : `Cần lưu ý, ${tt}`) : i === 1 ? `Còn ${tt}` : `Ngoài ra, ${tt}`, id));
    });
    if (sangCau.length && hungCau.length) s.push(cau(hoaGiai(ten, kq), ma));
    return s.join(" ");
  }

  for (const n of khung) s.push(cau(cauLuuY(n), n.id));
  for (const n of trung.slice(0, 2)) s.push(cau(hoa(menhDe(n)), n.id));
  const sang = chon(conDung(cd.diem_manh), 2, 1);
  const hung = chon(conDung([...cd.diem_yeu]), 2, -1);
  sang.forEach((n, i) => s.push(cau(i ? `Ngoài ra, ${thuong(menhDe(n))}` : menhDe(n), n.id)));
  hung.forEach((n, i) => s.push(cau(`${i ? "Bên cạnh đó" : sang.length ? "Tuy nhiên" : "Cần lưu ý"}, ${thuong(menhDe(n))}`, n.id)));
  if (sang.length && hung.length) s.push(cau(hoaGiai(ten, kq), ma)); // hòa giải đặt SAU khi đã nêu cả hai mặt
  return s.join(" ");
}

// ---------- tổng quan
const NEN_CUC: Record<string, string> = {
  cuc_sinh_menh: "Cục sinh cho Mệnh, nghĩa là hoàn cảnh nâng đỡ và bạn dễ phát huy được năng lực.",
  tuong_hoa: "Mệnh và Cục cùng hành, nghĩa là nền lá số thuận hòa và ổn định.",
  menh_sinh_cuc: "Mệnh sinh cho Cục, nghĩa là bạn hao sức cho hoàn cảnh nên dễ làm nhiều hưởng ít.",
  menh_khac_cuc: "Mệnh khắc Cục, nghĩa là bạn chủ động cải tạo hoàn cảnh nhưng khá vất vả.",
  cuc_khac_menh: "Cục khắc Mệnh, nghĩa là hoàn cảnh có nhiều trở ngại nên cần tu dưỡng và kiên trì.",
};
const NEN_SAO: Record<string, (sao: string) => string> = {
  dong_hanh: (s) => `Sao chủ Mệnh (${s}) cùng hành với bản mệnh, nên mặt tốt của sao được phát huy trọn vẹn.`,
  sao_sinh_menh: (s) => `Sao chủ Mệnh (${s}) sinh cho bản mệnh, nên bạn được nâng đỡ và dễ nhờ vào tính chất tốt của sao.`,
  menh_sinh_sao: (s) => `Bản mệnh của bạn nuôi sao chủ Mệnh (${s}), nên bạn làm hết sức nhưng dễ đuối nếu ôm đồm; bù lại sao phát huy được mặt tốt.`,
  sao_khac_menh: (s) => `Sao chủ Mệnh (${s}) khắc bản mệnh, nên mặt tốt của sao bị giảm bớt và bạn dễ chịu áp lực từ chính tính chất của sao.`,
  menh_khac_sao: (s) => `Bản mệnh của bạn kiềm chế được sao chủ Mệnh (${s}), nên bạn kiểm soát tốt tính chất của sao nhưng phần hưởng thụ bị kìm, hơi khắc khổ.`,
};

function cauNenLaSo(n: NhanDinh): string {
  const loai = n.id.replace(/^NEN\./, "");
  if (NEN_CUC[loai]) return cau(NEN_CUC[loai], n.id);
  if (loai === "am_duong") {
    const thuan = /thuận lý/.test(n.nhan_dinh);
    return cau(`Đại hạn của bạn đi theo chiều ${thuan ? "thuận" : "nghịch"}; đây chỉ là đặc điểm kỹ thuật của lá số, không quyết định cuộc đời thuận hay nghịch`, n.id);
  }
  if (loai.startsWith("sao_chu.")) {
    const f = NEN_SAO[loai.slice(8)];
    const sao = /^(.+?) \(/.exec(n.nhan_dinh)?.[1];
    if (f && sao) return cau(bo(f(sao)), n.id);
  }
  if (loai.startsWith("tuan_triet.")) {
    const m = /án cung (\S+) \((.+?)\)/.exec(n.nhan_dinh); // "án cung <địa chi> (<cung chức>)"
    const ten = /Triệt/.test(n.nhan_dinh) ? "Triệt" : "Tuần";
    return cau(`Cung ${m ? `${m[2]} (tại ${m[1]}) ` : ""}của bạn có ${ten} đi qua, ảnh hưởng đến cả đời nên đáng chú ý ngay từ đầu: điều tốt ở đây giảm lực, điều xấu cũng bớt hung`, n.id);
  }
  return cau(sach(n.nhan_dinh), n.id);
}

function cauThan(kq: BaoCao): string[] {
  const out: string[] = [];
  const [a, b] = kq.than.nhan_dinh;
  const m = /^Thân cư [^:]+: (.*)$/s.exec(a.nhan_dinh);
  out.push(cau(`Cung Thân của bạn nằm ở cung ${kq.than.cu}${m ? `: ${sach(thuong(m[1]))}` : ""}`, a.id));
  if (b) out.push(cau(sach(b.nhan_dinh), b.id));
  return out;
}

// ---------- hạn năm
function doanHan(kq: BaoCao): string | null {
  const h = kq.han;
  if (!h?.dai_han) return null;
  const d = h.dai_han;
  const s: string[] = [cau(`Năm ${h.nam_xem}, bạn đang ở đại hạn ${d.tu_tuoi}–${d.tu_tuoi + 9} tuổi, nhìn chung ở mức ${d.danh_gia["Mệnh"].xep_loai.toLowerCase()}`, "DH")];
  const kl = h.luu_nien.ket_luan;
  const kn: Record<string, { muc: string }> = triThuc().cfg.han.khuyen_nghi;
  const ruiRo = kl.find((n) => n.id === "HAN.rui_ro");
  if (ruiRo) {
    const phan = ruiRo.nhan_dinh.replace(/\s*;\s*ngoài tam phương lưu niên nhưng là cung trọng yếu/g, "");
    const sau = phan.slice(phan.lastIndexOf(" — ") >= 0 ? phan.lastIndexOf(" — ") + 3 : phan.indexOf(": ") + 2).replace(/\.$/, "");
    const goc: string[] = [];
    for (const seg of sau.split("; ")) {
      const m = /^(.+?) \((\S+)\): (.+)$/.exec(seg);
      if (!m) continue;
      const nghia = [...m[3].matchAll(/\(([^()]+)\)/g)].map((x) => x[1]);
      if (nghia.length) goc.push(`${kn[m[1]]?.muc ?? m[1].toLowerCase()} (dễ gặp ${noi(nghia)})`);
    }
    if (goc.length) {
      const bo3 = /bộ Mệnh – Tài Bạch – Quan Lộc/.test(ruiRo.nhan_dinh);
      s.push(cau(`Điều cần để ý nhất trong năm là ${noi(goc.slice(0, 3))}${bo3 ? "; vì cả ba mảng này cùng chịu ảnh hưởng nên đây là năm cần thận trọng" : ""}`, ruiRo.id));
    } else s.push(cau(sach(ruiRo.nhan_dinh), ruiRo.id));
  }
  for (const n of kl.filter((x) => x.id.startsWith("HAN.nen_tranh."))) {
    const m = /^Về (.+?): nên (.+?); tránh (.+?)\.?$/s.exec(n.nhan_dinh);
    s.push(cau(m ? `Về ${m[1]}, bạn nên ${bo(m[2])} và tránh ${bo(m[3])}` : sach(n.nhan_dinh), n.id));
  }
  const ky = h.luu_nien.ghi_chu.find((n) => n.id === "LN.song_ky");
  if (ky) s.push(cau(`Năm nay có hai lớp vận Hóa Kỵ chồng nhau (đại hạn và lưu niên), nên việc thuộc cung đó dễ vướng mắc, cần thận trọng`, ky.id));
  const thuan = kl.find((n) => n.id === "HAN.mat_thuan");
  if (thuan) {
    const m = /→ tận dụng cho (.+?) theo hướng (.+?)\.?$/s.exec(thuan.nhan_dinh);
    s.push(cau(m ? `Mặt thuận của năm là có sao hỗ trợ ở các mảng ${m[1]}; bạn nên tận dụng theo hướng ${bo(m[2])}` : sach(thuan.nhan_dinh), thuan.id));
  }
  return s.join(" ");
}

/** Lớp nền: toàn bộ văn xuôi không dùng LLM, mỗi mục một đoạn. */
export function vietMau(kq: BaoCao): string {
  const l = kq.la_so;
  const tong: string[] = [
    cau(`Lá số của bạn có Mệnh tại cung ${kq.menh_tai} (${l.am_duong_nam_nu}), bản mệnh ${HANH_VN[l.ban_menh]}, cục ${HANH_VN[l.cuc.hanh]} ${l.cuc.so}`, "TQ"),
    cau("Điểm /100 ở các mục dưới chỉ so các cung trong chính lá số của bạn với nhau, không so với người khác", "TQ"),
    ...kq.nen.map(cauNenLaSo),
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
  return out.join("\n");
}
