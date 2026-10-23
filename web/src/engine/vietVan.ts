// Văn xuôi của chính engine (không dùng AI). Mỗi câu kết thúc bằng [ID] trỏ về một nhận định trong báo cáo;
// hậu kiểm bỏ mọi câu không có ID hợp lệ hoặc nằm sai mục.
import { vietMau } from "./vanNen";
import type { BaoCao, NhanDinh } from "./types";

export { vietMau };

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
    cho[t] = new Set([`CD.${t}`, ...idsTrong([cd.diem_manh, cd.diem_yeu, cd.luu_y, cd.trung_tinh, cd.sao_nho])]);
    if (TOPIC_THAN[kq.than.cu] === t) cho[t].add(`THAN.${kq.than.cu}`); // câu 'cung này cũng là cung Thân cư'
  }
  if (kq.han) cho["Hạn năm"] = new Set(["DH", "TQ", ...idsTrong(kq.han)]);
  // mục tổng hợp cuối bài: chỉ trích mã chủ đề, Thân và so cung (không có sao riêng lẻ)
  cho["Tổng kết"] = new Set(["TQ", ...Object.keys(kq.chu_de).map((t) => `CD.${t}`), ...idsTrong(kq.than)]);
  cho["Những câu hỏi thường gặp"] = new Set([
    "DH", ...Object.keys(kq.chu_de).map((t) => `CD.${t}`), ...idsTrong(kq.so_cung), ...idsTrong(kq.than), ...idsTrong(kq.dai_han_ca_doi ?? []),
    ...idsTrong(Object.values(kq.chu_de).map((cd) => [cd.diem_manh, cd.diem_yeu])), ...idsTrong(kq.han?.luu_nien.ket_luan ?? []),
    ...[...tapId(kq)].filter((i) => /^CC\d+$/.test(i)), // cách quý nhân: mã cách ở bất kỳ cung nào
  ]);
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

const TOPIC_THAN: Record<string, string> = { "Mệnh": "Tính cách", "Phúc Đức": "Tính cách", "Quan Lộc": "Sự nghiệp", "Thiên Di": "Sự nghiệp", "Tài Bạch": "Tài chính", "Phu Thê": "Tình cảm – hôn nhân" };

/** Văn từ mẫu đã qua hậu kiểm. */
export function vietVanMau(kq: BaoCao): { van: string; bo: number } {
  const [van, bo] = hauKiem(vietMau(kq), tapId(kq));
  return { van, bo };
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
