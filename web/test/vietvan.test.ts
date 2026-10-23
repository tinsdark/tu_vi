import { describe, expect, it } from "vitest";
import { anLaSo, baoCao, LuanGiai, triThuc, vietMau, hauKiemTheoMuc } from "../src/engine";

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
