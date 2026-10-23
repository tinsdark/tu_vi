import { describe, expect, it } from "vitest";
import { CUNG_CHUC, quyTac, thongTinSao, triThuc } from "../src/engine";

describe("ý nghĩa phụ tinh theo từng cung", () => {
  const tt = triThuc();
  const CUNG = [...CUNG_CHUC];

  it("mọi phụ tinh đều có đủ 12 cung, mỗi ô là một câu hoàn chỉnh", () => {
    for (const ten of tt.phu.keys()) {
      const t = thongTinSao(ten);
      expect(Object.keys(t.theo_cung).sort(), ten).toEqual([...CUNG].sort());
      for (const [cung, cau] of Object.entries(t.theo_cung)) {
        expect(cau.length, `${ten} ${cung}`).toBeGreaterThanOrEqual(10);
        expect(cau.trim(), `${ten} ${cung}`).toMatch(/[.!]$/);
        expect(cau, `${ten} ${cung}`).not.toContain("→");
      }
    }
  });

  it("độ tin cậy: sao có _nguon (đã đối chiếu web) là vàng, sao không có là xám — không nhận nhầm AI tự soạn là đã kiểm", () => {
    expect(quyTac("PT.Văn Khúc.Mệnh").tin_cay).toBe("vang");
    expect(quyTac("PT.Thiên Hình.Mệnh").tin_cay).toBe("xam");
    expect(quyTac("PT.Tang Môn.Tài Bạch").tin_cay).toBe("xam");
    for (const ten of tt.phu.keys()) {
      const co = Boolean((tt.phuCung[ten] as Record<string, unknown>)._nguon);
      expect(quyTac(`PT.${ten}.Mệnh`).tin_cay, ten).toBe(co ? "vang" : "xam");
    }
  });
});
