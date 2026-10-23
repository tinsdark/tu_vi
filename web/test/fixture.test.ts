// Hồi quy trên các lá số mẫu (spec scoring v3 §16): kỳ vọng là NHÃN + hướng điểm. Bản Python: tools/tuvi/test_fixture_la_so.py (kỳ vọng không đạt được ghi ở đó).
import { describe, expect, it } from "vitest";
import { anLaSo, baoCao, LuanGiai, tuDuongLich } from "../src/engine";

const THU = ["Rất thấp", "Thấp", "Trung bình", "Khá", "Tốt", "Rất tốt"];
const laSo = (...a: Parameters<typeof tuDuongLich>) => { const r = tuDuongLich(...a).an_sao; return anLaSo(r.can_nam, r.chi_nam, r.thang, r.ngay, r.gio, r.gioi_tinh); };
const kq = {
  la1: baoCao(new LuanGiai(laSo(2003, 5, 11, 14, 45, "nam", "bac", {}, undefined))),
  la2: baoCao(new LuanGiai(laSo(2003, 12, 14, 21, 45, "nu", "bac", {}, undefined))),
  la4: baoCao(new LuanGiai(anLaSo(1, 11, 9, 14, 4, "nam"))), // Giáp Tuất tháng 9 ngày 14 giờ Mão, Dương Nam, Mệnh Mùi (Liêm–Sát)
};
const bac = (k: keyof typeof kq, muc: string) => THU.indexOf(kq[k].chu_de[muc].xep_loai);

describe("fixture §16", () => {
  it("lá 1: Tử Vi miếu không ra 35; Phủ–Liêm ≥ khá; khung liệt kê đủ chính tinh", () => {
    expect(bac("la1", "Tài chính")).toBeGreaterThanOrEqual(THU.indexOf("Trung bình"));
    expect(kq.la1.chu_de["Tài chính"].diem100).toBeGreaterThan(35);
    expect(bac("la1", "Tính cách")).toBeGreaterThanOrEqual(THU.indexOf("Khá"));
    expect(kq.la1.chu_de["Tính cách"].khung).toMatch(/Liêm Trinh.*Thiên Phủ|Thiên Phủ.*Liêm Trinh/);
  });
  it("lá 2: Gia đình không bị 35/Thấp; Tính cách ≥ trung bình", () => {
    expect(bac("la2", "Tính cách")).toBeGreaterThanOrEqual(THU.indexOf("Trung bình"));
    expect(["Rất thấp", "Thấp"]).not.toContain(kq.la2.chu_de["Gia đình"].xep_loai);
  });
  it("lá 4: nền tảng = Liêm Trinh + Thất Sát bản cung; Vũ Khúc hóa Khoa không là hạn chế; Sức khỏe ≈ trung bình", () => {
    expect(kq.la4.chu_de["Tính cách"].khung).toContain("Liêm Trinh (đắc) + Thất Sát (đắc)");
    const sn = kq.la4.chu_de["Sự nghiệp"];
    expect(sn.diem_yeu.some((n) => (n.nhan ?? []).includes("Vũ Khúc") && n.diem < 0)).toBe(false);
    expect(sn.trung_tinh.some((n) => n.id === "CT.Vũ Khúc.Quan Lộc" && n.diem === 0)).toBe(true);
    expect(kq.la4.chu_de["Sức khỏe"].xep_loai).toBe("Trung bình");
  });
  it("Tuần + Triệt cùng án Phụ Mẫu/Phúc Đức (lá 4): nén ×0.6×0.8", () => {
    const p = kq.la4.cung["Phụ Mẫu"];
    expect(p.tuan_triet).toEqual(["Tuần", "Triệt"]);
    expect(p.phan_tich.k_triet_tuan).toBeCloseTo(0.48, 3);
  });
  it("§4.7: bảng nhãn công khai (35 không phải trung bình)", () => {
    const dn = new LuanGiai(anLaSo(1, 11, 9, 14, 4, "nam")).tt.cfg.diem_noi_tai;
    const nhan = (d: number) => dn.bac.find(([han]: [number, string]) => d <= han)![1];
    expect([nhan(30), nhan(35), nhan(45), nhan(50), nhan(60), nhan(65), nhan(75), nhan(80), nhan(90), nhan(95)]).toEqual(["Rất thấp", "Thấp", "Thấp", "Trung bình", "Trung bình", "Khá", "Khá", "Tốt", "Tốt", "Rất tốt"]);
  });
});
