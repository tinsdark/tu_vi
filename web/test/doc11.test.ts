// doc11 lô A: chọn nhánh giới tính (L1), dòng thời gian đại hạn (L7).
import { describe, expect, it } from "vitest";
import { anLaSo } from "../src/engine/anSao";
import { chonGioi, dongThoiGianDaiHan, LuanGiai } from "../src/engine/luanGiai";

describe("doc11 L1", () => {
  it("chonGioi giữ đúng nhánh giới tính", () => {
    const c = "Nếu bạn là nữ, chồng tốt; nếu bạn là nam, vợ tốt.";
    expect(chonGioi(c, "nam")).toBe("Vợ tốt.");
    expect(chonGioi(c, "nu")).toBe("Chồng tốt");
    expect(chonGioi("Câu không phân nhánh.", "nam")).toBe("Câu không phân nhánh.");
  });
});

describe("doc11 L7", () => {
  it("dòng thời gian đại hạn: đủ mốc, đúng một đẹp nhất và một khó nhất", () => {
    const moc = dongThoiGianDaiHan(new LuanGiai(anLaSo(7, 1, 5, 8, 4, "nu")), 2000);
    expect(moc.length).toBeGreaterThanOrEqual(10);
    expect(moc.filter((m) => m.nhan === "đẹp nhất")).toHaveLength(1);
    expect(moc.filter((m) => m.nhan === "khó nhất")).toHaveLength(1);
    expect(moc.every((m, i) => i === 0 || m.tu_tuoi === moc[i - 1].tu_tuoi + 10)).toBe(true);
  });
});
