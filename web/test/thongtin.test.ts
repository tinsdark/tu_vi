import { describe, expect, it } from "vitest";
import { anLaSo, CAN, CHI, napAm } from "../src/engine";
import { canChiCung, canLuong, chiNamTieuHan, chuMenh, chuThan, laiNhan, quanHeCucMenh, tenNapAm } from "../src/engine/thongTin";

describe("thông tin hiển thị (đối chiếu lá số mẫu tracuutuvi.com: Quý Mùi, tháng 4, ngày 11, giờ Mùi, nam)", () => {
  const ls = anLaSo(10, 8, 4, 11, 8, "nam");
  it("nạp âm 30 tên khớp hành của napAm", () => {
    const hanhTen: Record<string, string> = { Kim: "Kim", Moc: "Mộc", Thuy: "Thủy", Hoa: "Hỏa", Tho: "Thổ" };
    for (let can = 1; can <= 10; can++) for (let chi = 1; chi <= 12; chi++) {
      if ((can - chi) % 2 !== 0) continue; // cặp can chi hợp lệ cùng tính chẵn lẻ
      expect(tenNapAm(can, chi).endsWith(hanhTen[napAm(can, chi)]), `${CAN[can]} ${CHI[chi]}`).toBe(true);
    }
    expect(tenNapAm(10, 8)).toBe("Dương Liễu Mộc");
  });
  it("lai nhân, chủ mệnh/thân, quan hệ cục-mệnh", () => {
    expect(laiNhan(ls)).toBe("Phụ Mẫu");
    expect(ls.cung_chuc[ls.than]).toBe("Phúc Đức");
    expect(chuMenh(ls)).toBe("Vũ Khúc");
    expect(chuThan(ls)).toBe("Thiên Tướng");
    expect(quanHeCucMenh(ls.cuc.hanh, ls.ban_menh)).toBe("Cục Thủy sinh Mệnh Mộc");
  });
  it("can chi cung và chi năm tiểu hạn", () => {
    expect(canChiCung(ls, 11)).toBe("N.Tuất");
    expect(canChiCung(ls, 4)).toBe("Ấ.Mão");
    expect(canChiCung(ls, 3)).toBe("G.Dần");
    expect(chiNamTieuHan(ls, 12)).toBe("Tỵ");
    expect(chiNamTieuHan(ls, 8)).toBe("Sửu");
  });
});

describe("lưu nguyệt khởi từ tiểu hạn (đối chiếu Th.n trên lá số mẫu, năm xem 2026)", () => {
  it("tháng 8 ở Hợi, 9 ở Tý, 4 ở Mùi, 7 ở Tuất", async () => {
    const { tinhLaSo, chuanHoaNhap } = await import("../src/engine");
    const r = chuanHoaNhap({ nam: 2003, thang: 5, ngay: 11, gio: 14, phut: 45, gioi_tinh: "nam", mien: "bac", nam_xem: 2026 });
    if (!r.ok) throw new Error(r.loi.join());
    const kq = tinhLaSo(r.nhap);
    const t = Object.fromEntries(kq.bao_cao.han!.luu_nguyet.map((m) => [m.chi, m.thang]));
    expect([t["Hợi"], t["Tý"], t["Mùi"], t["Tuất"]]).toEqual([8, 9, 4, 7]);
  });
});

describe("lá số mẫu thứ 2 (Quý Mùi, 28/3/2003 13:45, nam — tracuutuvi.com)", () => {
  it("lai nhân, quan hệ Cục–Mệnh, can chi, chân ô, độ sáng Văn Xương", async () => {
    const { tinhLaSo, chuanHoaNhap, dungOCung } = await import("../src/engine");
    const r = chuanHoaNhap({ nam: 2003, thang: 3, ngay: 28, gio: 13, phut: 45, gioi_tinh: "nam", mien: "bac", nam_xem: 2026 });
    if (!r.ok) throw new Error(r.loi.join());
    const kq = tinhLaSo(r.nhap);
    const ls = kq.la_so;
    expect(laiNhan(ls)).toBe("Điền Trạch");
    expect(quanHeCucMenh(ls.cuc.hanh, ls.ban_menh)).toBe("Cục Mộc bình hòa Mệnh Mộc");
    expect(canChiCung(ls, 4)).toBe("Ấ.Mão");
    expect(chiNamTieuHan(ls, 4)).toBe("Dậu");
    const t = Object.fromEntries(kq.bao_cao.han!.luu_nguyet.map((m) => [m.chi, m.thang]));
    expect([t["Tý"], t["Thân"], t["Mão"]]).toEqual([7, 3, 10]);
    expect(dungOCung(ls)[4].tot.find((s) => s.ten === "Văn Xương")?.muc).toBe("Đ");
  });
});

describe("cân lượng khớp 3 lá số mẫu tracuutuvi.com", () => {
  it.each([
    [[10, 8, 4, 11, 8, "nam"], "3 lượng 3 chỉ"],
    [[10, 8, 2, 26, 8, "nam"], "4 lượng 0 chỉ"],
    [[10, 8, 11, 12, 2, "nu"], "3 lượng 9 chỉ"],
    [[1, 9, 12, 2, 4, "nu"], "3 lượng 0 chỉ"],
  ] as const)("%j", (a, kq) => {
    expect(canLuong(anLaSo(a[0], a[1], a[2], a[3], a[4], a[5]))).toBe(kq);
  });
});

describe("lá số nữ (Quý Mùi, 5/12/2003 2:30 — tiểu hạn nghịch)", () => {
  it("lai nhân, chân ô, Văn Xương Dậu", async () => {
    const { tinhLaSo, chuanHoaNhap, dungOCung } = await import("../src/engine");
    const r = chuanHoaNhap({ nam: 2003, thang: 12, ngay: 5, gio: 2, phut: 30, gioi_tinh: "nu", mien: "bac", nam_xem: 2026 });
    if (!r.ok) throw new Error(r.loi.join());
    const kq = tinhLaSo(r.nhap);
    expect(laiNhan(kq.la_so)).toBe("Mệnh");
    expect(canChiCung(kq.la_so, 12)).toBe("Q.Hợi");
    const t = Object.fromEntries(kq.bao_cao.han!.luu_nguyet.map((m) => [m.chi, m.thang]));
    expect([t["Hợi"], t["Tý"]]).toEqual([7, 8]);
    expect(chiNamTieuHan(kq.la_so, 12)).toBe("Dậu");
    expect(dungOCung(kq.la_so)[10].tot.find((s) => s.ten === "Văn Xương")?.muc).toBe("Đ");
  });
});

describe("lá số dương nữ Giáp Thân (11/1/2005 6:30)", () => {
  const ls = anLaSo(1, 9, 12, 2, 4, "nu");
  it("nạp âm, chủ mệnh/thân, quan hệ khắc, lai nhân, tiểu hạn nghịch", () => {
    expect(tenNapAm(1, 9)).toBe("Tuyền Trung Thủy");
    expect([chuMenh(ls), chuThan(ls)]).toEqual(["Liêm Trinh", "Thiên Lương"]);
    expect(quanHeCucMenh(ls.cuc.hanh, ls.ban_menh)).toBe("Mệnh Thủy khắc Cục Hỏa");
    expect(laiNhan(ls)).toBe("Mệnh");
    expect(canChiCung(ls, 11)).toBe("G.Tuất");
  });
});
