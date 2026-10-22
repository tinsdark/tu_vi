import { describe, expect, it } from "vitest";
import { anLaSo, CAN, CHI, napAm } from "../src/engine";
import { canChiCung, chiNamTieuHan, chuMenh, chuThan, laiNhan, quanHeCucMenh, tenNapAm } from "../src/engine/thongTin";

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
