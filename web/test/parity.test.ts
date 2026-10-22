// So khớp engine TypeScript với engine Python (tham chiếu) trên dữ liệu ngẫu nhiên cố định seed.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { anLaSo, type GioiTinh, type Profile } from "../src/engine/anSao";
import { triThuc } from "../src/engine/kb";
import { duongSangAm, tuDuongLich, type Mien } from "../src/engine/lichAm";
import { baoCao, LuanGiai } from "../src/engine/luanGiai";
import { hauKiem, tapId, vietMau, vietVanMau } from "../src/engine/vietVan";

const nap = (ten: string) => JSON.parse(readFileSync(join(process.env.TUVI_GOLDEN!, ten), "utf8"));
/** Chuẩn hóa -0 (Python in "-0.0", JS không phân biệt khi serialize) để toEqual không bắt lỗi giả. */
const chuan = <T>(x: T): T => JSON.parse(JSON.stringify(x));

/** Python dump int-key dict thành key chuỗi; JS cũng vậy khi so toEqual với object có key số. */
describe("lịch âm: TS = Python", () => {
  const g = nap("lich.json");
  it("duongSangAm trên ngày ngẫu nhiên 1900–2100", () => {
    const sai: unknown[] = [];
    for (const c of g.ngay) {
      const [d, m, y, mien] = c.vao as [number, number, number, Mien];
      const r = duongSangAm(d, m, y, mien);
      if (r.ngay !== c.ra[0] || r.thang !== c.ra[1] || r.nam !== c.ra[2] || r.nhuan !== c.ra[3]) sai.push({ vao: c.vao, ts: r, py: c.ra });
    }
    expect(sai).toEqual([]);
    expect(g.ngay.length).toBeGreaterThan(500);
  });
  const chayDayDu = (ds: any[]) => {
    const sai: unknown[] = [];
    for (const c of ds) {
      const v = c.vao;
      const r = tuDuongLich(v.nam, v.thang, v.ngay, v.gio, v.phut, v.gioi_tinh, v.mien, v.quy_uoc, v.kinh_do);
      try { expect(r).toEqual(c.ra); } catch { sai.push({ vao: v, ts: r, py: c.ra }); }
    }
    return sai;
  };
  it("tuDuongLich đầy đủ (quy ước, múi giờ lịch sử, giờ mặt trời, cảnh báo)", () => expect(chayDayDu(g.day_du)).toEqual([]));
  it("tuDuongLich quanh các mốc đổi giờ lịch sử, giờ Tý muộn", () => expect(chayDayDu(g.kho)).toEqual([]));
});

describe("an sao: TS = Python", () => {
  const g = nap("an_sao.json");
  it("toàn bộ lá số (sao, Tứ Hóa, Tuần, Triệt, đại hạn, profile)", () => {
    const sai: unknown[] = [];
    for (const c of g) {
      const v = c.vao;
      const r = anLaSo(v.can_nam, v.chi_nam, v.thang, v.ngay, v.gio, v.gioi_tinh as GioiTinh, (v.profile ?? undefined) as Partial<Profile> | undefined);
      try { expect(JSON.parse(JSON.stringify(r))).toEqual(c.ra); } catch { sai.push({ vao: v }); }
      if (sai.length > 5) break;
    }
    expect(sai).toEqual([]);
    expect(g.length).toBeGreaterThan(1000);
  });
});

describe("luận giải: TS = Python", () => {
  const g = nap("luan.json");
  const tt = triThuc();
  it("báo cáo đầy đủ (chấm cung, Thân, hạn, lưu nguyệt, chủ đề) trùng Python", () => {
    const sai: unknown[] = [];
    for (const c of g) {
      const v = c.vao;
      const ls = anLaSo(v.can_nam, v.chi_nam, v.thang, v.ngay, v.gio, v.gioi_tinh, v.profile ?? undefined);
      const r = JSON.parse(JSON.stringify(baoCao(new LuanGiai(ls, tt), v.nam_xem ? v.nam_sinh : undefined, v.nam_xem ?? undefined)));
      try { expect(r).toEqual(chuan(c.bao_cao)); } catch (e) { sai.push({ vao: v, loi: String(e).slice(0, 1500) }); if (sai.length >= 2) break; }
    }
    expect(sai).toEqual([]);
    expect(g.length).toBeGreaterThan(50);
  });
  it("văn mẫu + hậu kiểm trùng Python", () => {
    for (const c of g) {
      if (!c.van) continue;
      const v = c.vao;
      const ls = anLaSo(v.can_nam, v.chi_nam, v.thang, v.ngay, v.gio, v.gioi_tinh, v.profile ?? undefined);
      const kq = baoCao(new LuanGiai(ls, tt), v.nam_sinh, v.nam_xem);
      expect(vietMau(kq)).toBe(c.viet_mau);
      const r = vietVanMau(kq);
      expect(r.van).toBe(c.van);
      expect(r.bo).toBe(c.bo);
      expect([...tapId(kq)].sort()).toEqual(c.ids);
    }
  });
  it("hậu kiểm bỏ câu không mã hoặc mã bịa", () => {
    const c = g[0];
    const text = "# Tổng quan\nCâu hợp lệ một mã [TQ]. Câu không có mã nào.\nCâu mã bịa [KHONG.TON.TAI]. Câu hai mã [TQ][CD.Sự nghiệp].\n\n# Tài chính\nCâu cuối [CD.Tài chính].";
    const [van, bo] = hauKiem(text, new Set(c.ids));
    expect([van, bo]).toEqual(c.hau_kiem);
  });
});
