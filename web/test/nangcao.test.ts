import { describe, expect, it } from "vitest";
import { anLaSo } from "../src/engine/anSao";
import { LuanGiai } from "../src/engine/luanGiai";
import { nangCao, xacDinhBo, xetNamTuoi } from "../src/engine/nangCao";

describe("nâng cao: tam tai / năm tuổi (§20)", () => {
  it("tuổi Thân/Tý/Thìn: tam tai Dần-Mão-Thìn, đúng thứ tự năm", () => {
    expect(xetNamTuoi("Tý", 2022).tam_tai_thu).toBe(1); // 2022 Nhâm Dần
    expect(xetNamTuoi("Tý", 2023).tam_tai_thu).toBe(2);
    expect(xetNamTuoi("Tý", 2024).tam_tai_thu).toBe(3); // Giáp Thìn
  });
  it("năm tuổi, xung, tam hợp; năm không liên quan không gắn nhãn", () => {
    expect(xetNamTuoi("Ngọ", 2026).loai).toBe("nam_tuoi"); // 2026 Bính Ngọ
    expect(xetNamTuoi("Tý", 2026).loai).toBe("xung");
    expect(xetNamTuoi("Tý", 2020).loai).toBe("nam_tuoi"); // Canh Tý
    expect(xetNamTuoi("Tý", 2021).loai).toBe("khong"); // Sửu
    expect(xetNamTuoi("Tý", 2028).loai).toBe("tam_hop"); // Mậu Thân
  });
  it("năm vừa tuổi vừa tam tai vẫn giữ cả hai nhãn", () => {
    const r = xetNamTuoi("Thìn", 2024); // Giáp Thìn
    expect(r.loai).toBe("nam_tuoi");
    expect(r.tam_tai_thu).toBe(3);
    expect(r.nhan_dinh).toContain("Tam Tai");
  });
  it("mỗi chi tuổi có đúng 3 năm tam tai trong 12 năm", () => {
    for (const chi of ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"])
      expect(Array.from({ length: 12 }, (_, i) => xetNamTuoi(chi, 2024 + i)).filter((x) => x.tam_tai_thu)).toHaveLength(3);
  });
});

describe("nâng cao: bộ chính tinh & trùng phùng", () => {
  const ls = anLaSo(10, 12, 7, 15, 3, "nam"); // Quý Hợi, lá số bất kỳ
  const lg = new LuanGiai(ls);
  it("xác định được bộ cho Mệnh, vô chính diệu thì mượn xung", () => {
    const bo = xacDinhBo(lg);
    if (lg.chinhTinh(ls.menh).length === 0) expect(bo?.muon).toBe(true);
    expect(bo === null || ["Sát – Phá – Tham", "Cơ – Nguyệt – Đồng – Lương", "Tử – Phủ – Vũ – Tướng (– Liêm)"].includes(bo.ten)).toBe(true);
  });
  it("chạy mọi năm xem không lỗi; tam trùng phùng chỉ khi đủ 3 lớp", () => {
    for (let n = 2000; n <= 2060; n++) {
      const nc = nangCao(lg, 1983, n);
      for (const x of nc.trung_phung?.tam_trung_hung ?? []) expect(x.hung.every((l) => l.length > 0)).toBe(true);
    }
  });
});
