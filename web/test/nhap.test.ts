import { describe, expect, it } from "vitest";
import { chuanHoaNhap, tinhLaSo } from "../src/engine";

const OK = { nam: 1990, thang: 6, ngay: 8, gio: 8, phut: 30, gioi_tinh: "nam", mien: "nam", nam_xem: 2026 };

describe("chuanHoaNhap", () => {
  it("điền mặc định và chuẩn hóa", () => {
    const r = chuanHoaNhap(OK);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.nhap.quy_uoc).toEqual({ ty_muon: "ngay_sau", thang_nhuan: "nhu_thang_truoc", mui_gio_lich_su: true, gio_mat_troi: false });
      expect(r.nhap.profile.luu_ha).toBe("thai_thu_lang");
    }
  });
  it("năm xem mặc định là năm hiện tại", () => {
    const { nam_xem: _bo, ...khong } = OK;
    const r = chuanHoaNhap(khong, 2031);
    expect(r.ok && r.nhap.nam_xem).toBe(2031);
  });
  it.each([
    [{ ...OK, nam: 1899 }, /Năm sinh/],
    [{ ...OK, thang: 13 }, /Tháng sinh/],
    [{ ...OK, ngay: 31, thang: 4 }, /không tồn tại/],
    [{ ...OK, nam: 1900, thang: 2, ngay: 29 }, /không tồn tại/],
    [{ ...OK, gio: 24 }, /Giờ sinh/],
    [{ ...OK, gioi_tinh: "khac" }, /Giới tính/],
    [{ ...OK, mien: "trung" }, /miền/],
    [{ ...OK, nam_xem: 1980 }, /trước năm sinh/],
    [{ ...OK, quy_uoc: { gio_mat_troi: true } }, /kinh độ/],
    [{ ...OK, quy_uoc: { ty_muon: "tuy_thich" } }, /ty_muon/],
    [{ ...OK, profile: { thien_giai: "bay_bam" } }, /thien_giai/],
    [{ ...OK, ho_ten: "x".repeat(81) }, /quá dài/],
    [null, /Năm sinh/],
    ["chuoi", /Năm sinh/],
  ])("từ chối dữ liệu sai %#", (vao, mau) => {
    const r = chuanHoaNhap(vao);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.loi.join("|")).toMatch(mau);
  });
  it("năm nhuận 29/2 hợp lệ", () => expect(chuanHoaNhap({ ...OK, nam: 2000, thang: 2, ngay: 29 }).ok).toBe(true));
});

describe("tinhLaSo", () => {
  it("8/6/1990 08:30 nam miền Nam: Canh Ngọ, tháng 5 âm ngày 16, giờ Thìn (khớp Python)", () => {
    const r = chuanHoaNhap(OK);
    if (!r.ok) throw new Error("nhập sai");
    const k = tinhLaSo(r.nhap);
    expect(k.lich.am_lich).toEqual({ ngay: 16, thang: 5, nam: 1990, nhuan: false });
    expect(k.lich.can_chi).toEqual({ nam: "Canh Ngọ", thang: "Nhâm Ngọ", ngay: "Giáp Thìn", gio: "Thìn" });
    expect(k.la_so.input.can_nam).toBe("Canh");
    expect(k.bao_cao.han?.tuoi_am).toBe(37);
    expect(Object.keys(k.bao_cao.cung)).toHaveLength(12);
  });
});
