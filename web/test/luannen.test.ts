import { describe, expect, it } from "vitest";
import yeuTo from "../../data/knowledge/yeu_to_nen.json";
import { anLaSo, baoCao, CAN, CHI, CUNG_CHUC, LuanGiai, luanNen, tenNapAm, type NenId } from "../src/engine";

const NEN_ID: NenId[] = ["am_duong", "ban_menh", "cuc", "chu_menh", "chu_than", "can_luong", "lai_nhan", "than_cu", "tu_hoa"];
const D = yeuTo as any;

describe("luận các yếu tố nền ở ô giữa", () => {
  it("bảng dữ liệu phủ hết: 60 hoa giáp → 30 nạp âm, 5 cục, 12 chi → chủ mệnh/chủ thân, 12 cung lai nhân, 4 âm dương", () => {
    const tenNap = new Set<string>();
    for (let n = 0; n < 60; n++) tenNap.add(tenNapAm((n % 10) + 1, (n % 12) + 1));
    expect(tenNap.size).toBe(30);
    for (const t of tenNap) expect(D.nap_am[t], t).toBeTruthy();
    for (const h of ["Thuy", "Moc", "Kim", "Tho", "Hoa"]) expect(D.cuc[h], h).toBeTruthy();
    for (const c of CUNG_CHUC) expect(D.lai_nhan[c], c).toBeTruthy();
    for (const a of ["Dương Nam", "Dương Nữ", "Âm Nam", "Âm Nữ"]) expect(D.am_duong[a], a).toBeTruthy();
  });

  it("mọi lá số: cả 9 mục đều có lời luận, câu hoàn chỉnh, không rỗng, không còn {cung}", () => {
    for (let i = 0; i < 300; i++) {
      const nam = 1930 + ((i * 37) % 90);
      const ls = anLaSo(((nam - 4) % 10) + 1, ((nam - 4) % 12) + 1, (i % 12) + 1, (i % 29) + 1, (i % 12) + 1, i % 2 ? "nam" : "nu");
      const bc = baoCao(new LuanGiai(ls), nam, nam + 30);
      for (const id of NEN_ID) {
        const l = luanNen(id, ls, bc);
        expect(l.du_kien.length, `${id} lá ${i}`).toBeGreaterThan(0);
        expect(l.doan.length, `${id} lá ${i}`).toBeGreaterThan(0);
        for (const d of l.doan) {
          expect(d.trim().length, `${id} lá ${i}`).toBeGreaterThan(10);
          expect(d, `${id} lá ${i}`).not.toMatch(/\{cung\}|undefined/);
          expect(d.trim(), `${id} lá ${i}`).toMatch(/[.!]$/);
        }
      }
    }
  });

  it("Tứ Hóa luận đủ bốn hóa, mỗi hóa nêu đúng cung chứa sao đó", () => {
    const ls = anLaSo(10, 8, 4, 11, 8, "nam"); // Quý Mùi
    const l = luanNen("tu_hoa", ls, null);
    expect(l.doan).toHaveLength(4);
    for (const [hoa, sao] of Object.entries(ls.tu_hoa)) {
      const d = l.doan.find((x) => x.startsWith(hoa.replace("Hóa ", "")))!;
      expect(d).toContain(sao);
      expect(d).toContain(`cung ${ls.cung_chuc[ls.sao[sao]]}`);
    }
  });

  it("cân lượng: mọi tổng từ 21 đến 71 chỉ đều rơi vào một mức", () => {
    for (let t = 21; t <= 71; t++) expect((D.can_luong as { den: number }[]).some((m) => t <= m.den), String(t)).toBe(true);
    void CAN; void CHI;
  });
});
