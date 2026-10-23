// Viết kết quả luận thành văn xuôi — port từ tools/tuvi/viet_van.py (phần không cần mạng).
// Nguyên tắc: LLM CHỈ viết saoLai, không thêm ý. Mỗi câu kết thúc bằng [ID] trỏ về một nhận định trong báo cáo;
// hậu kiểm bỏ mọi câu không có ID hợp lệ. Phần gọi Claude nằm ở server/ (giữ API key phía server).
import { vietMau } from "./vanNen";
import { VONG_BAC_SI, VONG_THAI_TUE, VONG_TRANG_SINH } from "./boCuc";
import { triThuc } from "./kb";
import { CHINH_TINH } from "./luanGiai";
import type { BaoCao, NhanDinh } from "./types";

export { vietMau };

export const HUONG_DAN = `Bạn là người biên tập, viết saoLai kết quả luận giải một lá số Tử Vi (JSON, máy đã lập và chấm sẵn) thành văn tiếng Việt cho người KHÔNG biết tử vi đọc hiểu. Bạn KHÔNG phải thầy bói và KHÔNG được luận thêm bất cứ điều gì: engine luận, bạn chỉ diễn đạt.

Trong JSON có trường "ban_nhap": bản nháp máy đã ghép, đúng nội dung và đúng mã. Hãy viết saoLai bản nháp cho mượt, ấm và dễ hiểu hơn, KHÔNG đổi ý.

Quy tắc bắt buộc (hậu kiểm tự động sẽ bỏ câu vi phạm):
1. Chỉ dùng ý có trong JSON. Không thêm sao, cung, nhận định, con số, dự đoán hay lời khuyên nào không có trong đó.
2. Mỗi câu kết thúc bằng mã trong ngoặc vuông đúng như trường "id" trong JSON, ví dụ [CT.Tử Vi.Mệnh]. Câu gộp nhiều ý thì ghi nhiều mã: [CC21][PT.Lộc Tồn]. Mã đặc biệt: [TQ] thông tin chung lá số; [CD.<tên chủ đề>] xếp loại một chủ đề; [DH] đại hạn hiện tại.
3. Mỗi mục CHỈ được trích mã thuộc mục đó: mục chủ đề dùng các mã trong "diem_manh", "diem_yeu", "luu_y", "trung_tinh" của đúng chủ đề đó (cộng [CD.<chủ đề>]); mục Tổng quan dùng mã trong "nen", "than", [TQ]; mục Hạn năm dùng mã trong "han". Không kéo sao của mục này sang mục khác.
4. Sao ở cung khác chỉ được nêu đúng như JSON ghi (ví dụ 'X từ cung Y xung chiếu Z'): không viết như thể sao nằm tại cung đang luận.
5. Điểm là "điểm nội tại /100" (tương quan giữa các cung của chính lá số này). Nói bằng lời thường kèm bậc ("khoảng 60/100, mức khá"). Không đổi nhãn mức, không đổi điểm. TUYỆT ĐỐI không nói "cao/thấp hơn X% lá số khác", không nói percentile.
6. Giữ đúng chiều: câu nào JSON xếp 'diem_manh' thì là điểm sáng, 'diem_yeu' là điểm cần lưu ý. Khi chủ đề vừa có điểm sáng vừa có hạn chế phải có một câu nói hai mặt cùng tồn tại. Khi có "luu_y" (Tuần/Triệt, vô chính diệu) và "trung_tinh" thì nhắc, vì đó là khung của cung.
7. Chủ đề "Gia đình" luôn tách ba tiểu mục Cha mẹ / Con cái / Anh em.
8. Mục Hạn năm: nêu đại hạn, rồi ĐÚNG ba phần trong han.luu_nien.ket_luan: trọng tâm rủi ro → nên/tránh theo từng cung → mặt thuận. Không thêm khuyến nghị khác.
9. Ngoài mã nhận định, không dùng ngoặc vuông ở bất cứ đâu (tên cách cục viết trong «»).

Cách viết (không được trái các quy tắc trên):
- Xưng hô nhất quán: gọi người xem là "bạn". Giọng ấm, điềm đạm, không dọa; chuyện nặng (tang sự, tai nạn, bệnh) nói nhẹ và kèm hướng phòng tránh nếu JSON có.
- Mở mỗi mục bằng một câu kết luận (mức nào, điểm mạnh chính là gì), rồi mới tới chi tiết.
- Mỗi nhận định = điều quan sát + nghĩa của nó trong đời sống. Tên sao để trong ngoặc, không làm chủ ngữ.
- Nối câu bằng liên từ tự nhiên (vì vậy, tuy nhiên, bù saoLai, bên cạnh đó), không liệt kê chấm-phẩy, không dùng mũi tên.
- Dùng xu hướng, không phán tuyệt đối: "có xu hướng", "dễ", "cần để ý" thay vì "sẽ", "chắc chắn", "nhất định".
- Mỗi mục 3–6 câu liền mạch; chọn 2–3 ý mạnh nhất, ý còn saoLai gộp, không nhồi mọi sao, không câu cụt.
- Mục: Tổng quan, Tính cách, Sự nghiệp, Tài chính, Tình cảm – hôn nhân, Sức khỏe, Gia đình, Hạn năm (nếu có). Tiêu đề mục dạng '# Tên mục'.
- Nếu JSON thiếu dữ liệu cho một mục, viết ngắn đúng phần có, không lấp bằng kiến thức tử vi của bạn.

Ví dụ (chỉ để học giọng, không dùng nội dung):
THÔ: "Sát tinh ở cả bản cung (Đà La, Linh Tinh) và xung/hội chiếu (Thiên Hình ở Thiên Di) → cung Phu Thê bị cản [PHI_TUYEN]; Hôn nhân saoLanh nhạt, khó nói [PT.Linh Tinh.Phu Thê]."
VIẾT LẠI: "Đường tình cảm của bạn có phần trắc trở: ngay trong cung hôn nhân đã có vài yếu tố gây cản, saoLai thêm ảnh hưởng từ các mối quan hệ bên ngoài [PHI_TUYEN], nên hai bạn dễ nguội saoLanh và khó nói chuyện với nhau [PT.Linh Tinh.Phu Thê]. Bạn nên chủ động trò chuyện thẳng thắn và vun đắp nhiều hơn bình thường [PT.Linh Tinh.Phu Thê]."`;

/** Bỏ phần chỉ để hiển thị/gỡ lỗi trước khi gửi LLM (giảm token): mỗi cung chỉ giữ tóm tắt — mọi nhận định có mã đã nằm trong chu_de / nen / than / han. */
export function rutGonChoLlm(kq: BaoCao): unknown {
  const out = JSON.parse(JSON.stringify(kq)) as Record<string, any>;
  out.ban_nhap = vietMau(kq); // bản nháp lớp nền (đúng nội dung, đúng mã): LLM chỉ làm cho mượt hơn
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
  for (const [t, cd] of Object.entries(kq.chu_de)) {
    cho[t] = new Set([`CD.${t}`, ...idsTrong([cd.diem_manh, cd.diem_yeu, cd.luu_y, cd.trung_tinh])]);
    if (TOPIC_THAN[kq.than.cu] === t) cho[t].add(`THAN.${kq.than.cu}`); // câu 'cung này cũng là cung Thân cư'
  }
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

// ---------- hậu kiểm nội dung (spec Phần 3 §29): ngoài mã [ID], LLM không được thêm sao, con số, đổi nhãn mức hay phán tuyệt đối
const NHAN_MUC = ["rất thấp", "thấp", "trung bình", "khá", "tốt", "rất tốt"];
const CUM_CAM = /chắc chắn (sẽ|là|bị|rằng)|nhất định (sẽ|phải|bị)|tuyệt đối (sẽ|không thể)|\bsẽ (ly hôn|ly dị|chết|phá sản|giàu to|đổ vỡ)|vô phương cứu|định mệnh đã an bài/i;
const CUNG_TEN = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"];

/** Mọi tên sao đã biết (chính tinh, phụ tinh, các vòng); loại tên trùng tên cung (Phúc Đức). */
function tuDienSao(): string[] {
  const ten = new Set<string>([...CHINH_TINH, ...[...triThuc().phu.keys()], ...VONG_BAC_SI, ...VONG_THAI_TUE, ...VONG_TRANG_SINH]);
  return [...ten].filter((t) => t.includes(" ") && !CUNG_TEN.includes(t));
}

/** Bỏ mã [..] và «..» để kiểm số/sao trên phần lời. */
const phanLoi = (c: string) => c.replace(/\[[^[\]]+\]/g, " ");

/**
 * Bỏ từng câu: nêu tên sao không có trong báo cáo, con số không có trong bản nháp/đại hạn, nhãn mức khác nhãn của chủ đề, hoặc có cụm phán tuyệt đối.
 * Trả [văn đã lọc, số câu bị bỏ]. Chạy SAU hauKiemTheoMuc.
 */
export function hauKiemNoiDung(van: string, kq: BaoCao): [string, number] {
  const nguon = JSON.stringify(rutGonChoLlm(kq));
  const duoc = new Set(tuDienSao().filter((t) => nguon.includes(t)));
  const lạ = tuDienSao().filter((t) => !duoc.has(t));
  const so = new Set<string>([...(vietMau(kq).replace(/\[[^[\]]+\]/g, " ").match(/\d+/g) ?? []), "100", "30"]);
  const d = kq.han?.dai_han;
  if (d) for (let t = d.tu_tuoi; t < d.tu_tuoi + 10; t++) so.add(String(t));
  if (kq.han) { so.add(String(kq.han.tuoi_am)); so.add(String(kq.han.nam_xem)); }
  let hien: string | null = null;
  let bo = 0;
  const giu: string[] = [];
  for (const dong of van.split(/\r?\n/)) {
    if (!dong.trim()) { giu.push(dong); continue; }
    if (dong.trimStart().startsWith("#")) {
      const ten = dong.replace(/^[#\s]+/, "").trim();
      hien = Object.keys(kq.chu_de).find((k) => ten.startsWith(k)) ?? null;
      giu.push(dong);
      continue;
    }
    const cauGiu: string[] = [];
    for (const c of dong.trim().split(/(?<=[\].!?])\s+/)) {
      const loi = phanLoi(c);
      const nhan = hien ? [...loi.toLowerCase().matchAll(/\bmức (rất thấp|thấp|trung bình|khá|tốt|rất tốt)\b/g)].map((m) => m[1]) : [];
      const sai =
        lạ.some((t) => loi.includes(t)) ||
        (loi.match(/\d+/g) ?? []).some((n) => !so.has(n)) ||
        (hien !== null && nhan.some((n) => NHAN_MUC.includes(n) && n !== kq.chu_de[hien!].xep_loai.toLowerCase())) ||
        CUM_CAM.test(loi);
      if (sai) bo += 1; else cauGiu.push(c);
    }
    if (cauGiu.length) giu.push(cauGiu.join(" "));
  }
  return [giu.join("\n"), bo];
}

/** Hậu kiểm đầy đủ cho văn do AI viết: đúng mục/mã trước, rồi đúng nội dung. */
export function hauKiemDayDu(van: string, kq: BaoCao): [string, number] {
  const [a, b1] = hauKiemTheoMuc(van, kq);
  const [c, b2] = hauKiemNoiDung(a, kq);
  return [c, b1 + b2];
}

/** Một nhận định → 'nội dung [mã]' (dấu chấm giữa câu đổi thành chấm phẩy; ngoặc vuông chỉ dành cho mã). */
export function ve(n: NhanDinh): string {
  let txt = n.nhan_dinh.trim().replace(/\.\s+/g, "; ").replace(/\.+$/, "");
  txt = txt.replace(/\[([^[\]]+)\]/g, "«$1»");
  return `${txt} [${n.id}]`;
}

const TOPIC_THAN: Record<string, string> = { "Mệnh": "Tính cách", "Phúc Đức": "Tính cách", "Quan Lộc": "Sự nghiệp", "Thiên Di": "Sự nghiệp", "Tài Bạch": "Tài chính", "Phu Thê": "Tình cảm – hôn nhân" };

/** Lời nhắc + dữ liệu để DÁN vào bất kỳ chatbot nào (không cần API). Không chứa tên người dùng. Văn trả về dán saoLai web để hậu kiểm theo mục. */
export function lenhChoAi(kq: BaoCao): string {
  return `${HUONG_DAN}\n\n--- DỮ LIỆU LÁ SỐ (JSON) ---\n${JSON.stringify(rutGonChoLlm(kq))}`;
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
