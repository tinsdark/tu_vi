// Viết kết quả luận thành văn xuôi — port từ tools/tuvi/viet_van.py (phần không cần mạng).
// Nguyên tắc: LLM CHỈ viết lại, không thêm ý. Mỗi câu kết thúc bằng [ID] trỏ về một nhận định trong báo cáo;
// hậu kiểm bỏ mọi câu không có ID hợp lệ. Phần gọi Claude nằm ở server/ (giữ API key phía server).
import { HANH_VN } from "./luanGiai";
import type { BaoCao, NhanDinh } from "./types";

export const HUONG_DAN = `Bạn viết lại kết quả luận lá số Tử Vi (JSON) thành văn tiếng Việt dễ đọc cho người không học tử vi.
Quy tắc bắt buộc:
- Chỉ dùng ý có trong JSON. Không thêm nhận định, dự đoán, con số hay lời khuyên nào không có trong đó.
- Mỗi câu kết thúc bằng mã nhận định trong ngoặc vuông, đúng như trường "id" trong JSON, ví dụ: ... [CT.Tử Vi.Mệnh]. Câu gộp nhiều ý thì ghi nhiều mã: [CC21][PT.Lộc Tồn].
- Viết theo mục: Tổng quan, Tính cách, Sự nghiệp, Tài chính, Tình cảm – hôn nhân, Sức khỏe, Gia đình, Hạn năm (nếu có). Mỗi mục 3–6 câu.
- Ngoài mã nhận định, không dùng ngoặc vuông ở bất cứ đâu (tên cách cục viết trong «»).
- Câu nêu xếp loại một chủ đề dùng mã [CD.<tên chủ đề>]; câu nêu thông tin chung của lá số dùng [TQ]; câu nêu đại hạn hiện tại dùng [DH].
- Nói rõ mức độ (xếp loại, phân vị) bằng lời thường; khi nhận định tốt và xấu cùng có, nêu cả hai.
- Giọng trung tính, không hù dọa, không khẳng định chắc chắn chuyện tương lai.`;

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

/** Một nhận định → một câu kết thúc bằng mã (dấu chấm giữa câu đổi thành chấm phẩy). */
export function cau(n: NhanDinh, tienTo = ""): string {
  let txt = n.nhan_dinh.trim().replace(/\.\s+/g, "; ").replace(/\.+$/, "");
  txt = txt.replace(/\[([^[\]]+)\]/g, "«$1»"); // ngoặc vuông chỉ dành cho mã
  return `${tienTo}${txt} [${n.id}].`;
}

/** Không dùng LLM: ghép câu từ nhận định nổi bật theo chủ đề. */
export function vietMau(kq: BaoCao): string {
  const l = kq.la_so;
  const out: string[] = ["# Tổng quan", `Mệnh tại ${kq.menh_tai}, ${l.am_duong_nam_nu}, Bản Mệnh ${HANH_VN[l.ban_menh]}, Cục ${HANH_VN[l.cuc.hanh]} ${l.cuc.so} [TQ].`];
  out.push(...[...kq.nen, ...kq.than.nhan_dinh].map((n) => cau(n)));
  for (const [ten, cd] of Object.entries(kq.chu_de)) {
    out.push(`\n# ${ten}`);
    out.push(`Nhìn chung ${cd.xep_loai.toLowerCase()} (khoảng top ${100 - cd.phan_vi}% nếu so với mọi lá số) [CD.${ten}].`);
    out.push(...cd.diem_manh.map((n) => cau(n, "Điểm mạnh: ")));
    out.push(...cd.diem_yeu.map((n) => cau(n, "Cần lưu ý: ")));
  }
  if (kq.han?.dai_han) {
    const d = kq.han.dai_han;
    out.push(`\n# Hạn năm ${kq.han.nam_xem}`);
    out.push(`Đang ở đại hạn ${d.tu_tuoi}–${d.tu_tuoi + 9} tuổi tại ${d.chi}; Mệnh đại hạn ${d.danh_gia["Mệnh"].xep_loai.toLowerCase()} [DH].`);
    out.push(...kq.han.luu_nien.ghi_chu.map((n) => cau(n)));
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
