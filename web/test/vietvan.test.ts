import { describe, expect, it } from "vitest";
import { HOA_GIAI } from "../src/engine/vanNen";
import { anLaSo, baoCao, LuanGiai, triThuc, vietMau, hauKiemTheoMuc, hauKiemDayDu, hauKiemNoiDung, rutGonChoLlm } from "../src/engine";

function mau(i: number) {
  const nam = 1930 + ((i * 37) % 90);
  const ls = anLaSo(((nam - 4) % 10) + 1, ((nam - 4) % 12) + 1, (i % 12) + 1, (i % 29) + 1, (i % 12) + 1, i % 2 ? "nam" : "nu");
  return baoCao(new LuanGiai(ls, triThuc()), nam, nam + 30);
}

describe("phân loại điểm mạnh/yếu", () => {
  it("sát tinh đắc địa được gắn dao_dau, vẫn âm (giảm hại), và không bao giờ là điểm sáng của chủ đề", () => {
    let thay = 0;
    for (let i = 0; i < 300; i++) {
      const kq = mau(i);
      for (const k of Object.values(kq.cung)) for (const n of k.nhan_dinh) if (n.dao_dau) { thay++; expect(n.diem).toBeLessThan(0); }
      for (const cd of Object.values(kq.chu_de)) for (const n of cd.diem_manh) expect(n.dao_dau).toBeUndefined(); // sát đắc địa chỉ có thể là mặt cần lưu ý
    }
    expect(thay).toBeGreaterThan(20);
  });
});

describe("lớp nền văn xuôi (spec Phần 3 §24–§26)", () => {
  const phan = (van: string) => van.split("\n").filter((d) => d.trim() && !d.startsWith("#"));
  const cauCuaDoan = (d: string) => d.split(/(?<=[\].!?])\s+/).filter(Boolean);

  it("không nói percentile dân số, mỗi chủ đề nêu điểm /100 đúng bằng điểm báo cáo", () => {
    for (let i = 0; i < 100; i++) {
      const kq = mau(i);
      const van = vietMau(kq);
      expect(van).not.toMatch(/(cao|thấp) hơn khoảng|% lá số|top \d|phân vị/);
      for (const [ten, cd] of Object.entries(kq.chu_de)) {
        const dong = van.split("\n").find((d) => d.includes(`[CD.${ten}]`))!;
        expect(dong).toContain(`khoảng ${cd.diem100}/100`);
        expect(dong.toLowerCase()).toContain(cd.xep_loai.toLowerCase());
      }
    }
  });

  it("mỗi chủ đề là một đoạn, 3–10 câu, không dồn mọi nhận định (R7)", () => {
    for (let i = 0; i < 100; i++) {
      const kq = mau(i);
      const dong = phan(vietMau(kq));
      expect(dong.length).toBe(1 + Object.keys(kq.chu_de).length + 1); // Tổng quan + các chủ đề + Hạn
      Object.keys(kq.chu_de).forEach((_, k) => {
        const n = cauCuaDoan(dong[1 + k]).length;
        expect(n, dong[1 + k]).toBeGreaterThanOrEqual(2);
        expect(n, dong[1 + k]).toBeLessThanOrEqual(12);
      });
    }
  });

  it("không còn ký hiệu máy: mũi tên, 'xung/hội chiếu' dạng liệt kê, dấu ';' ngay sau mã; xưng 'bạn'", () => {
    for (let i = 0; i < 100; i++) {
      const van = vietMau(mau(i));
      expect(van).not.toContain("→");
      expect(van).not.toMatch(/\]\s*;/);
      expect(van).not.toMatch(/\blá số ở mức\b/);
      expect(van).toMatch(/\bbạn\b/);
    }
  });

  it("mọi câu đều có mã hợp lệ và đúng mục (hậu kiểm theo mục không bỏ câu nào)", () => {
    for (let i = 0; i < 300; i++) {
      const kq = mau(i);
      const van = vietMau(kq);
      const [giu, bo] = hauKiemTheoMuc(van, kq);
      expect(bo, `lá ${i}`).toBe(0);
      expect(giu).toBe(van);
    }
  });

  it("câu hòa giải: đặt sau mặt tối, và một báo cáo không lặp nguyên văn một biến thể", () => {
    for (let i = 0; i < 150; i++) {
      const dong = phan(vietMau(mau(i)));
      const hg = (c: string) => HOA_GIAI.some((h) => c.startsWith(h.replace(/\.$/, "")));
      const tatCa = dong.flatMap(cauCuaDoan).filter(hg);
      expect(new Set(tatCa).size, `lá ${i}`).toBe(tatCa.length);
      for (const d of dong) {
        const cs = cauCuaDoan(d);
        const k = cs.findIndex(hg);
        if (k < 0) continue;
        expect(k, d).toBe(cs.length - 1); // hòa giải luôn là câu cuối đoạn
        expect(cs.slice(0, k).some((c) => /^(Tuy nhiên|Bên cạnh đó|Ngược lại|Cần lưu ý)/.test(c)), d).toBe(true); // đã nêu mặt tối trước đó
      }
    }
  });

  it("Gia đình: nêu hết mặt sáng của cả nhà trước rồi mới tới phần cần giữ ý (không đan xen từng cặp)", () => {
    for (let i = 0; i < 150; i++) {
      const kq = mau(i);
      const idx = Object.keys(kq.chu_de).indexOf("Gia đình");
      const cs = cauCuaDoan(phan(vietMau(kq))[1 + idx]);
      const loai = cs.map((c) => (/^(Ngược lại|Còn|Ngoài ra|Cần lưu ý)/.test(c) ? "t" : "s"));
      const dau = loai.indexOf("t");
      if (dau >= 0) expect(loai.slice(dau, -1).includes("s") && !HOA_GIAI.some((h) => cs[loai.lastIndexOf("s")]?.startsWith(h.replace(/\.$/, ""))), cs.join(" ")).toBe(false);
    }
  });

  it("không lặp nguyên một câu nhận định giữa hai chủ đề", () => {
    for (let i = 0; i < 100; i++) {
      const ca = phan(vietMau(mau(i))).flatMap(cauCuaDoan).filter((c) => !/\[(CD\.|TQ|DH)/.test(c));
      const dem = new Map<string, number>();
      for (const c of ca) dem.set(c, (dem.get(c) ?? 0) + 1);
      const lap = [...dem].filter(([, n]) => n > 1);
      expect(lap).toEqual([]);
    }
  });
});

describe("hậu kiểm nội dung văn do AI viết (spec Phần 3 §29)", () => {
  it("văn lớp nền của chính web không bao giờ bị bỏ câu nào", () => {
    for (let i = 0; i < 300; i++) {
      const kq = mau(i);
      const van = vietMau(kq);
      const [giu, bo] = hauKiemDayDu(van, kq);
      expect(bo, `lá ${i}`).toBe(0);
      expect(giu).toBe(van);
    }
  });

  const kq = mau(5);
  const ten = Object.keys(kq.chu_de)[1]; // chủ đề thứ hai
  const cd = kq.chu_de[ten];
  const nhanDung = cd.xep_loai.toLowerCase();
  const nhanSai = ["rất thấp", "thấp", "trung bình", "khá", "tốt", "rất tốt"].find((n) => n !== nhanDung)!;
  const them = (cau: string) => hauKiemNoiDung(`# ${ten}\n${cau}`, kq);

  it("giữ câu hợp lệ, bỏ câu nêu sao không có trong báo cáo", () => {
    expect(them(`Bạn ở mức ${nhanDung} (khoảng ${cd.diem100}/100) [CD.${ten}].`)[1]).toBe(0);
    const chiMenh = JSON.stringify(rutGonChoLlm(kq));
    const saoLa = [...triThuc().phu.keys()].filter((t) => t.includes(" ")).find((t) => !chiMenh.includes(t))!;
    expect(saoLa).toBeTruthy();
    expect(them(`Bạn có ${saoLa} rất mạnh [CD.${ten}].`)[1]).toBe(1);
  });

  it("bỏ câu có con số lạ hoặc nhãn mức khác nhãn của chủ đề", () => {
    expect(them(`Bạn đạt khoảng ${cd.diem100 === 77 ? 78 : 77}/100 [CD.${ten}].`)[1]).toBe(1);
    expect(them(`Về ${ten.toLowerCase()}, bạn ở mức ${nhanSai} [CD.${ten}].`)[1]).toBe(1);
  });

  it("bỏ câu phán tuyệt đối", () => {
    expect(them(`Bạn chắc chắn sẽ giàu [CD.${ten}].`)[1]).toBe(1);
    expect(them(`Hôn nhân của bạn nhất định phải đổ vỡ [CD.${ten}].`)[1]).toBe(1);
  });

  it("không đếm số bên trong mã [ID]", () => {
    expect(them(`Bạn hợp nghề này [CC21][CD.${ten}].`)[1]).toBe(0);
  });
});
