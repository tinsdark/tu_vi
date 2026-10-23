// Tra cứu quy tắc theo ID mà engine in ra (CC21, CT.Tử Vi.Mệnh, PT.Hóa Kỵ.Tài Bạch ...): nguồn, độ tin cậy, mô tả.
// Độ tin cậy: xanh = ≥ 2 nguồn đối chiếu · vàng = 1 nguồn · xám = AI tổng hợp / mô hình tự đặt, chưa đối chiếu.
import { triThuc, type CachCuc, type TriThuc } from "./kb";

export type TinCay = "xanh" | "vang" | "xam";

export interface ThongTinQuyTac {
  id: string;
  tieu_de: string;
  tin_cay: TinCay;
  ly_do_tin_cay: string;
  mo_ta: string;
  nguon: string[];
  trang_thai?: string;
  ghi_chu?: string;
  cach?: CachCuc;
}

export const NHAN_TIN_CAY: Record<TinCay, string> = {
  xanh: "Nhiều nguồn đồng thuận",
  vang: "Có 1 nguồn web đối chiếu",
  xam: "AI tổng hợp / mô hình tự đặt, chưa đối chiếu",
};

const urls = (x: unknown): string[] => (typeof x === "string" ? x.match(/https?:\/\/[^\s,;)"']+/g) ?? [] : []);

const TINH: Record<string, [string, string]> = {
  NEN: ["Nền: Mệnh – Cục, âm dương, sao chủ Mệnh", "Quan hệ ngũ hành Bản Mệnh với Cục và với chính tinh chủ Mệnh; âm dương nam nữ thuận hay nghịch lý. Quy tắc phổ thông do AI tổng hợp."],
  THAN: ["Cung Thân", "Thân cư cung nào và so sánh điểm nội tại của Mệnh với cung Thân cư để nói tiền vận / hậu vận."],
  VCD: ["Cung vô chính diệu", "Cung không có chính tinh thì mượn chính tinh cung xung chiếu, giảm lực (hệ số trong cau_hinh_luan_giai.json); kèm ghi chú riêng theo cung (Tử Tức: con muộn/ít; Huynh Đệ: anh chị em ít gần gũi). Không tự động là xấu."],
  TT: ["Tuần / Triệt", "Tuần, Triệt làm giảm lực các sao trong cung; Triệt mạnh trước ~30 tuổi, Tuần mạnh sau ~30 tuổi."],
  PHI_TUYEN: ["Sát tinh quanh cung & chấm điểm phi tuyến", "Câu cảnh báo sinh từ sát tinh thật: ở bản cung, ở xung/hội chiếu, hoặc cả hai (kèm cung nguồn). Điểm = tốt × 1/(1 + nặng/K) + xấu, sát ở bản cung nặng hơn xung chiếu, xung chiếu nặng hơn tam hợp. K và trọng số là MÔ HÌNH của tác giả, không có sách nào ghi con số."],
  CAT_XH: ["Cát tinh từ xung/hội chiếu", "Cát tinh ở cung xung chiếu/tam hợp được nêu thành câu riêng khi tổng lực đủ lớn, để nhãn điểm khớp với nội dung người đọc thấy (đối xứng với câu sát tinh)."],
  XC: ["Sát tinh từ cung xung/hội chiếu", "Sao nằm ở cung khác nhưng xung/hội chiếu cung của chủ đề: luôn ghi rõ cung nguồn và quan hệ, nói hệ quả gián tiếp — không bao giờ viết như sao nằm tại chính cung chủ đề."],
  HAN: ["Kết luận hạn năm", "Gom lưu sát tinh theo cung gốc bị chiếu → nên/tránh theo lĩnh vực của cung đó; mặt thuận lấy từ Hóa Lộc/Quyền/Khoa đại hạn và lưu cát tinh. Lời khuyên là bảng tham số của tác giả (cau_hinh_luan_giai.json → han.khuyen_nghi)."],
  LN: ["Lưu niên", "Sao lưu theo can chi năm xem (Lưu Thái Tuế, Lộc Tồn, Kình, Đà, Mã, Tứ Hóa...) rơi vào tam phương cung Thái Tuế của năm."],
  CD: ["Tổng hợp theo chủ đề", "Điểm nội tại /100 (bội số 5) của cung chủ đề theo mô hình tự đặt; không phải percentile so với lá số khác. Có sàn khi chính tinh miếu/vượng và kéo về vùng giữa khi vừa tốt vừa hung rõ."],
  TQ: ["Thông tin chung lá số", "Mệnh, âm dương, Bản Mệnh, Cục."],
  DH: ["Đại hạn hiện tại", "Đại hạn 10 năm đang chạy và xếp loại cung Mệnh đại hạn."],
};

export function quyTac(id: string, tt: TriThuc = triThuc()): ThongTinQuyTac {
  const goc = id.split(".")[0];
  if (/^CC\d+$/.test(id)) {
    const cc = tt.cach.find((c) => c.id === id);
    if (cc) {
      const n = cc.web?.length ?? 0;
      return {
        id, tieu_de: `Cách cục: ${cc.ten}`, tin_cay: !cc.xac_nhan_web ? "xam" : n >= 2 ? "xanh" : "vang",
        ly_do_tin_cay: cc.xac_nhan_web ? `${n} nguồn web đã đối chiếu điều kiện/tên cách` : "Chỉ có trong kiến thức AI, chưa thấy trên web",
        mo_ta: cc.ket_luan, nguon: cc.web ?? [], trang_thai: cc.xac_nhan_web ? "da_gan_nguon" : "draft_ai_tong_hop", ghi_chu: cc.doi_chieu, cach: cc,
      };
    }
  }
  if (goc === "CT") {
    return { id, tieu_de: `Chính tinh theo cung: ${id.split(".").slice(1).join(" tại ")}`, tin_cay: "xam", ly_do_tin_cay: "Bảng 14 chính tinh × 12 cung do AI tổng hợp, chưa đối chiếu sách", mo_ta: "Nhận định cho chính tinh khi đóng ở cung chức này; độ sáng lấy từ bảng đã chốt (do_sang_chot.json).", nguon: [], trang_thai: tt.meta.chinh_tinh_cung.trang_thai };
  }
  if (goc === "BO") {
    return { id, tieu_de: `Bộ chính tinh: ${id.split(".").slice(1).join(" tại ")}`, tin_cay: "xam", ly_do_tin_cay: "AI tổng hợp từ kiến thức phổ thông", mo_ta: "Luận riêng cho tổ hợp chính tinh đồng cung ở một vị trí cụ thể.", nguon: [], trang_thai: tt.meta.bo_sao.trang_thai };
  }
  if (goc === "PT") {
    const [, sao, cung] = id.split(".");
    if (cung && tt.phuCung[sao]) {
      const nguon = urls((tt.phuCung[sao] as Record<string, unknown>)._nguon);
      return { id, tieu_de: `${sao} tại ${cung}`, tin_cay: "vang", ly_do_tin_cay: "Đã viết lại sau khi đọc trang từng sao trên tracuulasotuvi.com (1 nguồn web); trang này dẫn sách nhưng không ghi trang nên chưa kiểm được", mo_ta: "Nghĩa riêng của phụ tinh khi đóng ở cung chức này.", nguon, trang_thai: tt.meta.phu_cung.trang_thai, ghi_chu: tt.meta.phu_cung.canh_bao };
    }
    return { id, tieu_de: `Phụ tinh: ${sao}`, tin_cay: "xam", ly_do_tin_cay: "Ý nghĩa chung do AI tổng hợp, đối chiếu phân loại tốt/xấu với lasotuvi", mo_ta: "Ý nghĩa chung của phụ tinh (chưa có câu riêng cho cung này).", nguon: [], trang_thai: tt.meta.phu_tinh.trang_thai };
  }
  const [tieu, mo] = TINH[goc] ?? ["Quy tắc", "Quy tắc của bộ luận giải."];
  return { id, tieu_de: tieu, tin_cay: "xam", ly_do_tin_cay: "Quy tắc phổ thông do AI tổng hợp hoặc phép tính của mô hình", mo_ta: mo, nguon: [] };
}

export const tinCay = (id: string, tt: TriThuc = triThuc()): TinCay => quyTac(id, tt).tin_cay;

export interface ThongTinSao {
  ten: string;
  loai: "chinh_tinh" | "phu_tinh" | "vong";
  hanh?: string;
  mo_ta: string;
  tot_khi?: string;
  xau_khi?: string;
  do_sang: { chi: string; muc: string }[];
  theo_cung: Record<string, string>;
  dac_dia?: string[];
}

/** Thông tin một sao để hiển thị khi bấm vào sao trên lá số. */
export function thongTinSao(ten: string, tt: TriThuc = triThuc()): ThongTinSao {
  const ct = tt.chinh.get(ten);
  const CHI12 = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
  const doSang = CHI12.flatMap((chi, i) => {
    const m = tt.sang(ten, i + 1);
    return m ? [{ chi, muc: m }] : [];
  });
  if (ct) {
    const theoCung: Record<string, string> = {};
    for (const [cung, v] of Object.entries(tt.maTran[ten] ?? {})) theoCung[cung] = v[1];
    return { ten, loai: "chinh_tinh", hanh: ct.ngu_hanh, mo_ta: ct.tinh_chat, tot_khi: ct.tot_khi, xau_khi: ct.xau_khi, do_sang: doSang, theo_cung: theoCung };
  }
  const p = tt.phu.get(ten) ?? tt.phu.get(ten.replace(/^(Lưu|ĐH) /, ""));
  const pc = tt.phuCung[p?.ten ?? ten];
  const theoCung: Record<string, string> = {};
  if (pc) for (const [k, v] of Object.entries(pc)) if (!k.startsWith("_")) theoCung[k] = v;
  return { ten, loai: p ? "phu_tinh" : "vong", hanh: p?.hanh, mo_ta: p?.y_nghia ?? "Sao thuộc các vòng an theo can/chi (Bác Sĩ, Thái Tuế, Tràng Sinh...).", do_sang: doSang, theo_cung: theoCung, dac_dia: p?.dac_dia };
}

// ---- Mô tả điều kiện cách cục (DSL trong cach_cuc.json) bằng tiếng Việt cho người đọc
const VUNG: Record<string, string> = {
  ban_cung: "tại cung đó", xung: "ở cung xung chiếu", tam_hop: "ở hai cung tam hợp", tam_hop_ca_ban: "ở cung đó hoặc tam hợp",
  ban_xung: "ở cung đó hoặc xung chiếu", tam_phuong: "trong tam phương tứ chính", giap: "ở hai cung giáp", than: "ở cung Thân",
};
const NHOM: Record<string, string> = {
  luc_cat: "lục cát (Tả, Hữu, Xương, Khúc, Khôi, Việt)", luc_sat: "lục sát", tu_sat: "tứ sát (Kình, Đà, Hỏa, Linh)",
  tam_hoa_cat: "Hóa Lộc/Quyền/Khoa", loc: "Lộc (Lộc Tồn, Hóa Lộc)", dao_hoa: "đào hoa", cat_tinh: "cát tinh (lục cát, Lộc Tồn, Hóa Lộc/Quyền/Khoa)",
  hung_pha: "sát tinh hoặc Hóa Kỵ", giai_than: "giải thần", tu_khong: "Tuần/Triệt/Không", hinh_ky: "Hình, Kỵ, Kình",
};
const sao = (x: unknown): string => (typeof x === "string" ? NHOM[x] ?? x : (x as string[]).join(", "));

/** Điều kiện DSL → danh sách dòng mô tả (có thụt lề bằng cấp). */
export function moTaDieuKien(dk: Record<string, any>, cap = 0): { cap: number; text: string }[] {
  const v = dk.o ? ` ${VUNG[dk.o] ?? dk.o}` : "";
  if (dk.all) return [{ cap, text: "Đồng thời thỏa tất cả:" }, ...(dk.all as Record<string, any>[]).flatMap((d) => moTaDieuKien(d, cap + 1))];
  if (dk.any) return [{ cap, text: "Thỏa một trong các trường hợp:" }, ...(dk.any as Record<string, any>[]).flatMap((d) => moTaDieuKien(d, cap + 1))];
  if (dk.not) return [{ cap, text: "KHÔNG xảy ra:" }, ...moTaDieuKien(dk.not, cap + 1)];
  const L = (text: string) => [{ cap, text }];
  if ("co" in dk) return L(`có ${dk.co}${v}`);
  if ("co_ca" in dk) return L(`có đủ ${sao(dk.co_ca)}${v}`);
  if ("co_mot" in dk) return L(`có ít nhất một trong ${sao(dk.co_mot)}${v}`);
  if ("khong_co" in dk) return L(`không có ${sao(dk.khong_co)}${v}`);
  if (dk.dem) return L(`có từ ${dk.dem.toi_thieu} sao trở lên trong ${sao(dk.dem.nhom ?? dk.dem.dem)}${dk.dem.o ? ` ${VUNG[dk.dem.o] ?? dk.dem.o}` : ""}`);
  if ("chi" in dk) return L(`cung đóng ở: ${(dk.chi as string[]).join(", ")}`);
  if ("vcd" in dk) return L(dk.vcd ? "cung không có chính tinh (vô chính diệu)" : "cung có chính tinh");
  if (dk.sang) return L(`${dk.sang.sao} có độ sáng ${(dk.sang.thuoc as string[]).join("/")}`);
  if (dk.sao_tai_chi) return L(`${dk.sao_tai_chi.sao} đóng ở ${(dk.sao_tai_chi.chi as string[]).join(", ")}`);
  if ("tuan_triet" in dk) return L(dk.tuan_triet ? "cung bị Tuần hoặc Triệt" : "cung không bị Tuần/Triệt");
  if (dk.can_nam) return L(`sinh năm can ${(dk.can_nam as string[]).join(", ")}`);
  if (dk.vung_trung) return L(`cung đó trùng cung ${(dk.vung_trung as string[]).slice(1).join("/")}`);
  return L(JSON.stringify(dk));
}
