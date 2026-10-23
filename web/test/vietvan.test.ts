import { describe, expect, it } from "vitest";
import { anLaSo, baoCao, LuanGiai, triThuc, ve, vietMau } from "../src/engine";

function mau(i: number) {
  const nam = 1930 + ((i * 37) % 90);
  const ls = anLaSo(((nam - 4) % 10) + 1, ((nam - 4) % 12) + 1, (i % 12) + 1, (i % 29) + 1, (i % 12) + 1, i % 2 ? "nam" : "nu");
  return baoCao(new LuanGiai(ls, triThuc()), nam, nam + 30);
}

describe("văn mẫu và phân loại điểm mạnh/yếu", () => {
  it("sát tinh đắc địa được gắn dao_dau, giữ điểm dương, và không vào điểm mạnh/yếu của chủ đề", () => {
    let thay = 0;
    for (let i = 0; i < 300; i++) {
      const kq = mau(i);
      for (const k of Object.values(kq.cung)) for (const n of k.nhan_dinh) if (n.dao_dau) { thay++; expect(n.diem).toBeLessThan(0); }
      for (const cd of Object.values(kq.chu_de)) for (const n of [...cd.diem_manh, ...cd.diem_yeu]) expect(n.dao_dau).toBeUndefined();
    }
    expect(thay).toBeGreaterThan(20);
  });

  it("không nói percentile dân số (điểm nội tại /100) và không lặp ý giữa các chủ đề", () => {
    for (let i = 0; i < 100; i++) {
      const kq = mau(i);
      const van = vietMau(kq);
      expect(van).not.toMatch(/(cao|thấp) hơn khoảng|% lá số|top \d|phân vị/);
      for (const [ten, cd] of Object.entries(kq.chu_de)) {
        const dong = van.split("\n").find((d) => d.includes(`[CD.${ten}]`))!;
        expect(dong).toContain(`khoảng ${cd.diem100}/100`);
      }
      const duy = new Map(Object.values(kq.chu_de).flatMap((cd) => [...cd.diem_manh, ...cd.diem_yeu]).map((n) => [JSON.stringify([n.id, n.nhan_dinh]), n]));
      for (const n of duy.values()) expect(van.split(ve(n)).length - 1, ve(n)).toBe(1);
    }
  });

  it("mỗi chủ đề là một đoạn duy nhất (không còn mỗi nhận định một dòng)", () => {
    const dong = vietMau(mau(3)).split("\n").filter((d) => d.trim() && !d.startsWith("#"));
    expect(dong.length).toBe(1 + 6 + 1); // Tổng quan + 6 chủ đề + Hạn
  });
});
