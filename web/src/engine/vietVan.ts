// Viết kết quả luận thành văn xuôi — port từ tools/tuvi/viet_van.py (phần không cần mạng).
// Nguyên tắc: LLM CHỈ viết lại, không thêm ý. Mỗi câu kết thúc bằng [ID] trỏ về một nhận định trong báo cáo;
// hậu kiểm bỏ mọi câu không có ID hợp lệ. Phần gọi Claude nằm ở server/ (giữ API key phía server).
import { HANH_VN } from "./luanGiai";
import type { BaoCao, NhanDinh } from "./types";

export const HUONG_DAN = `Bạn là người viết lời luận cho một lá số Tử Vi đã được máy lập và chấm sẵn (JSON). Việc của bạn: viết thành văn tiếng Việt liền mạch, dễ hiểu cho người không học tử vi, như một thầy luận giải cẩn thận — KHÔNG phải một người phát minh thêm nhận định.

Quy tắc bắt buộc (hậu kiểm tự động sẽ bỏ câu vi phạm):
1. Chỉ dùng ý có trong JSON. Không thêm sao, cung, nhận định, con số, dự đoán hay lời khuyên nào không có trong đó.
2. Mỗi câu kết thúc bằng mã trong ngoặc vuông đúng như trường "id" trong JSON, ví dụ [CT.Tử Vi.Mệnh]. Câu gộp nhiều ý thì ghi nhiều mã: [CC21][PT.Lộc Tồn]. Mã đặc biệt: [TQ] thông tin chung lá số; [CD.<tên chủ đề>] xếp loại một chủ đề; [DH] đại hạn hiện tại.
3. Mỗi mục CHỈ được trích mã thuộc mục đó: mục chủ đề dùng các mã trong "diem_manh", "diem_yeu", "luu_y", "trung_tinh" của đúng chủ đề đó (cộng [CD.<chủ đề>]); mục Tổng quan dùng mã trong "nen", "than", [TQ]; mục Hạn năm dùng mã trong "han". Không kéo sao của mục này sang mục khác.
4. Sao ở cung khác chỉ được nêu đúng như JSON ghi (ví dụ 'X từ cung Y xung chiếu Z → ...'): không viết như thể sao nằm tại cung đang luận.
5. Điểm là "điểm nội tại /100" (tương quan giữa các cung của chính lá số này). Nói bằng lời thường kèm bậc ("khoảng 60/100, mức khá"). TUYỆT ĐỐI không nói "cao/thấp hơn X% lá số khác", không nói percentile.
6. Giữ đúng chiều: câu nào JSON xếp 'diem_manh' thì là điểm sáng, 'diem_yeu' là điểm cần lưu ý. Khi có "cau_dan" (chủ đề vừa tốt vừa hung) dùng nó làm câu mở trước khi nêu hai mặt. Khi có "luu_y" (Tuần/Triệt, vô chính diệu) và "trung_tinh" (chính tinh/nhận định trung tính) phải nhắc, vì đó là khung của cung.
7. Chủ đề "Gia đình" luôn tách ba tiểu mục Cha mẹ / Con cái / Anh em theo nhãn có sẵn trong câu.
8. Mục Hạn năm: nêu đại hạn, rồi ĐÚNG ba phần trong han.luu_nien.ket_luan: trọng tâm rủi ro → nên/tránh theo từng cung → mặt thuận. Không thêm khuyến nghị khác.

Cách viết cho hay (không được trái các quy tắc trên): 
- Mở mỗi mục bằng một câu tóm tắt xếp loại, rồi nối các ý bằng từ nối tự nhiên (vì vậy, tuy nhiên, bù lại...) thay vì liệt kê rời rạc; đặt điểm sáng và điểm cần lưu ý cạnh nhau để người đọc thấy bức tranh hai mặt.
- Liên hệ các yếu tố nền với nhau CHỈ bằng những gì JSON có: ví dụ Thân cư (than) gắn với mục tương ứng, Bản Mệnh–Cục (nen) gắn với nền chung.
- Mỗi mục 3–6 câu. Mục: Tổng quan, Tính cách, Sự nghiệp, Tài chính, Tình cảm – hôn nhân, Sức khỏe, Gia đình, Hạn năm (nếu có). Tiêu đề mục dạng '# Tên mục'.
- Ngoài mã nhận định, không dùng ngoặc vuông ở bất cứ đâu (tên cách cục viết trong «»).
- Giọng trung tính, không hù dọa, không khẳng định chắc chắn chuyện tương lai.`;

/** Bỏ phần chỉ để hiển thị/gỡ lỗi trước khi gửi LLM (giảm token): mỗi cung chỉ giữ tóm tắt — mọi nhận định có mã đã nằm trong chu_de / nen / than / han. */
export function rutGonChoLlm(kq: BaoCao): unknown {
  const out = JSON.parse(JSON.stringify(kq)) as Record<string, any>;
  out.cung = Object.fromEntries(Object.entries<any>(out.cung).map(([ten, v]) => [ten, { chi: v.chi, xep_loai: v.xep_loai, diem100: v.diem100, chinh_tinh: v.chinh_tinh, tuan_triet: v.tuan_triet }]));
  return out;
}

/** Mọi ID hợp lệ trong báo cáo. */
export function tapId(kq: BaoCao): Set<string> {
  const ids = new Set<string>();
  const duyet = (x: unknown): void => {
    if (Array.isArray(x)) x.forEach(duyet);
    else if (x && typeof x === "object") {
      const o = x as Record<string, unknown>;
      if ("id" in o && "nhan_dinh" in o) ids.add(o.id as string);
      Object.values(o).forEach(duyet);
    }
  };
  duyet(kq);
  ids.add("TQ");
  for (const ten of Object.keys(kq.chu_de)) ids.add(`CD.${ten}`);
  if (kq.han?.dai_han) ids.add("DH");
  return ids;
}

/** Giữ câu có ít nhất 1 ID hợp lệ; trả [văn đã lọc, số câu bị bỏ]. */
export function hauKiem(van: string, ids: Set<string>): [string, number] {
  const giu: string[] = [];
  let bo = 0;
  for (const dong of van.split(/\r?\n/)) {
    if (!dong.trim() || dong.trimStart().startsWith("#")) {
      giu.push(dong);
      continue;
    }
    const cauGiu: string[] = [];
    for (const c of dong.trim().split(/(?<=[\].!?])\s+/)) {
      const ma = [...c.matchAll(/\[([^[\]]+)\]/g)].map((m) => m[1]);
      if (ma.length && ma.every((m) => ids.has(m))) cauGiu.push(c);
      else bo += 1;
    }
    if (cauGiu.length) giu.push(cauGiu.join(" "));
  }
  return [giu.join("\n"), bo];
}

const idsTrong = (x: unknown): Set<string> => {
  const r = new Set<string>();
  const duyet = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(duyet);
    else if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if ("id" in o && "nhan_dinh" in o) r.add(o.id as string);
      Object.values(o).forEach(duyet);
    }
  };
  duyet(x);
  return r;
};

/** Mục nào được trích những mã nào (§2: không kéo sao của mục này sang mục khác). Khóa = tên mục (đầu tiêu đề). */
export function mucChoPhep(kq: BaoCao): Record<string, Set<string>> {
  const cho: Record<string, Set<string>> = {
    "Tổng quan": new Set(["TQ", "DH", ...Object.keys(kq.chu_de).map((t) => `CD.${t}`), ...idsTrong(kq.nen), ...idsTrong(kq.than)]),
  };
  for (const [t, cd] of Object.entries(kq.chu_de)) cho[t] = new Set([`CD.${t}`, ...idsTrong([cd.diem_manh, cd.diem_yeu, cd.luu_y, cd.trung_tinh])]);
  if (kq.han) cho["Hạn năm"] = new Set(["DH", "TQ", ...idsTrong(kq.han)]);
  return cho;
}

/** Như hauKiem nhưng câu trong mục nào chỉ được trích mã thuộc mục đó; trả [văn đã lọc, số câu bị bỏ]. */
export function hauKiemTheoMuc(van: string, kq: BaoCao): [string, number] {
  const cho = mucChoPhep(kq);
  const tatCa = tapId(kq);
  let hien: string | null = null;
  const giu: string[] = [];
  let bo = 0;
  for (const dong of van.split(/\r?\n/)) {
    if (!dong.trim()) { giu.push(dong); continue; }
    if (dong.trimStart().startsWith("#")) {
      const ten = dong.replace(/^[#\s]+/, "").trim();
      hien = Object.keys(cho).find((k) => ten.startsWith(k)) ?? null;
      giu.push(dong);
      continue;
    }
    const ok = hien ? cho[hien] : tatCa;
    const cauGiu: string[] = [];
    for (const c of dong.trim().split(/(?<=[\].!?])\s+/)) {
      const ma = [...c.matchAll(/\[([^[\]]+)\]/g)].map((m) => m[1]);
      if (ma.length && ma.every((m) => ok.has(m))) cauGiu.push(c);
      else bo += 1;
    }
    if (cauGiu.length) giu.push(cauGiu.join(" "));
  }
  return [giu.join("\n"), bo];
}

/** Một nhận định → 'nội dung [mã]' (dấu chấm giữa câu đổi thành chấm phẩy; ngoặc vuông chỉ dành cho mã). */
export function ve(n: NhanDinh): string {
  let txt = n.nhan_dinh.trim().replace(/\.\s+/g, "; ").replace(/\.+$/, "");
  txt = txt.replace(/\[([^[\]]+)\]/g, "«$1»");
  return `${txt} [${n.id}]`;
}

/** Một nhận định → một câu kết thúc bằng mã. */
export const cau = (n: NhanDinh, tienTo = ""): string => `${tienTo}${ve(n)}.`;

/** Nhiều nhận định → MỘT câu 'Tiền tố: A [mã]; B [mã].'; `daDung` để bỏ nhận định đã nêu ở mục trước. */
export function gop(ds: NhanDinh[], tienTo: string, daDung?: Set<string>): string {
  const muc: string[] = [];
  for (const n of ds) {
    if (daDung) {
      const khoa = JSON.stringify([n.id, n.nhan_dinh]); // cùng mã nhưng khác nội dung vẫn là ý khác nhau
      if (daDung.has(khoa)) continue;
      daDung.add(khoa);
    }
    muc.push(ve(n));
  }
  return muc.length ? `${tienTo}${muc.join("; ")}.` : "";
}

/** Không dùng LLM: ghép nhận định nổi bật thành đoạn văn theo chủ đề (mỗi mục một đoạn, không lặp ý giữa các mục). */
export function vietMau(kq: BaoCao): string {
  const l = kq.la_so;
  const tong = [`Mệnh tại ${kq.menh_tai}, ${l.am_duong_nam_nu}, Bản Mệnh ${HANH_VN[l.ban_menh]}, Cục ${HANH_VN[l.cuc.hanh]} ${l.cuc.so} [TQ].`,
    "Điểm /100 ở các mục dưới chỉ phản ánh tương quan nội tại giữa các cung của chính lá số này, không so với lá số khác [TQ].",
    ...[gop(kq.nen, "Nền lá số: "), gop(kq.than.nhan_dinh, "Cung Thân: ")].filter(Boolean)];
  const out: string[] = ["# Tổng quan", tong.join(" ")];
  const daDung = new Set<string>();
  for (const [ten, cd] of Object.entries(kq.chu_de)) {
    out.push(`\n# ${ten}`);
    const dong = [`Nhìn chung ${cd.xep_loai.toLowerCase()} (khoảng ${cd.diem100}/100) [CD.${ten}].`];
    if (cd.cau_dan) dong.push(`${cd.cau_dan.replace(/\.+$/, "")} [CD.${ten}].`);
    dong.push(...[gop(cd.luu_y, "Lưu ý cấu trúc: ", daDung), gop(cd.trung_tinh, "Chính tinh và nhận định trung tính: ", daDung), gop(cd.diem_manh, "Điểm sáng: ", daDung), gop(cd.diem_yeu, "Cần lưu ý: ", daDung)].filter(Boolean));
    out.push(dong.join(" "));
  }
  if (kq.han?.dai_han) {
    const d = kq.han.dai_han;
    out.push(`\n# Hạn năm ${kq.han.nam_xem}`);
    const luu = gop(kq.han.luu_nien.ghi_chu, `Trong năm ${kq.han.nam_xem}: `);
    out.push([`Đang ở đại hạn ${d.tu_tuoi}–${d.tu_tuoi + 9} tuổi tại ${d.chi}; Mệnh đại hạn ${d.danh_gia["Mệnh"].xep_loai.toLowerCase()} [DH].`, ...(luu ? [luu] : []), ...kq.han.luu_nien.ket_luan.map((n) => cau(n))].join(" "));
  }
  return out.join("\n");
}

export type CheDoVan = "mau" | "llm";

/** Văn từ mẫu đã qua hậu kiểm. */
export function vietVanMau(kq: BaoCao): { van: string; che_do: CheDoVan; bo: number } {
  const [van, bo] = hauKiem(vietMau(kq), tapId(kq));
  return { van, che_do: "mau", bo };
}

/** Câu → các mảnh văn bản và mã tham chiếu, để giao diện biến [ID] thành liên kết xem quy tắc. */
export function tachMa(cau: string): { text: string; ma?: string }[] {
  const out: { text: string; ma?: string }[] = [];
  let i = 0;
  for (const m of cau.matchAll(/\[([^[\]]+)\]/g)) {
    if (m.index! > i) out.push({ text: cau.slice(i, m.index) });
    out.push({ text: m[0], ma: m[1] });
    i = m.index! + m[0].length;
  }
  if (i < cau.length) out.push({ text: cau.slice(i) });
  return out;
}
