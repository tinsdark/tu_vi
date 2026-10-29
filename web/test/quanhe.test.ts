import { describe, expect, it } from "vitest";
import { CHI, chuanHoaNhap, tinhLaSo } from "../src/engine";
import { cungLienQuan, quanHeCuaCung } from "../src/lib/quanHe";

function laSoMau() {
  const kt = chuanHoaNhap({ nam: 1990, thang: 5, ngay: 15, gio: 8, phut: 30, gioi_tinh: "nam", mien: "nam" });
  if (!kt.ok) throw new Error(kt.loi.join("; "));
  return tinhLaSo(kt.nhap);
}

describe("quan hệ giữa các cung", () => {
  it("tam phương tứ chính: xung chiếu cách 6, tam hợp cách ±4, giáp cách ±1 (vòng 12 chi)", () => {
    const ds = cungLienQuan(1);
    expect(ds.find((x) => x.loai === "xung")!.chi).toBe(7);
    expect(ds.filter((x) => x.loai === "tam_hop").map((x) => x.chi).sort((a, b) => a - b)).toEqual([5, 9]);
    expect(ds.filter((x) => x.loai === "giap").map((x) => x.chi).sort((a, b) => a - b)).toEqual([2, 12]); // vòng: Tý giáp Sửu và Hợi
    expect(cungLienQuan(12).find((x) => x.loai === "xung")!.chi).toBe(6);
  });

  it("với mọi cung: tổng điểm các cung nguồn khớp tổng cát/sát engine đã tính (trước khi kẹp trần)", () => {
    const kq = laSoMau();
    for (let chi = 1; chi <= 12; chi++) {
      const q = quanHeCuaCung(kq, chi);
      const k = kq.bao_cao.cung[kq.la_so.cung_chuc[chi]];
      const cat = q.quanHe.filter((x) => x.tinhDiem).flatMap((x) => x.cat).reduce((a, x) => a + x.diem, 0);
      const sat = q.quanHe.filter((x) => x.tinhDiem).flatMap((x) => x.sat).reduce((a, x) => a + x.diem, 0);
      const catEngine = k.phan_tich.cat.reduce((a, x) => a + x.diem, 0);
      const satEngine = k.phan_tich.sat.reduce((a, x) => a + x.diem, 0);
      expect(cat, `cát ${CHI[chi]}`).toBeCloseTo(catEngine, 6);
      expect(sat, `sát ${CHI[chi]}`).toBeCloseTo(satEngine, 6);
    }
  });

  it("không có cung nào bị bỏ sót hay đếm hai lần; sát luôn là số âm, cát luôn dương", () => {
    const kq = laSoMau();
    const q = quanHeCuaCung(kq, 1);
    expect(q.quanHe).toHaveLength(6);
    expect(new Set(q.quanHe.map((x) => x.chi)).size).toBe(6);
    for (const x of q.quanHe.filter((y) => y.tinhDiem)) {
      expect(x.cat.every((s) => s.diem > 0)).toBe(true);
      expect(x.sat.every((s) => s.diem < 0)).toBe(true);
    }
  });

  it("cung giáp chỉ liệt kê, không tính điểm", () => {
    const q = quanHeCuaCung(laSoMau(), 5);
    for (const g of q.quanHe.filter((x) => x.loai === "giap")) {
      expect(g.tinhDiem).toBe(false);
      expect(g.tong).toBe(0);
    }
  });
});
