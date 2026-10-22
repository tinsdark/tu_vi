import { describe, expect, it } from "vitest";
import { anLaSo, CUNG_CHUC, dungOCung, quyTac, thongTinSao, tinCay, veLaSo, VI_TRI_LUOI } from "../src/engine";

const ls = anLaSo(7, 7, 5, 16, 5, "nam");

describe("bố cục hiển thị", () => {
  it("mỗi sao (trừ 4 Hóa) xuất hiện đúng một lần trên lưới", () => {
    const o = dungOCung(ls);
    const dem = Object.values(o).reduce((a, c) => a + c.chinh.length + c.tot.length + c.xau.length + c.trung.length + [c.bac_si, c.thai_tue, c.trang_sinh].filter(Boolean).length, 0);
    expect(dem).toBe(Object.keys(ls.sao).length - 4);
    for (const c of Object.values(o)) expect(c.bac_si && c.thai_tue && c.trang_sinh).toBeTruthy(); // 3 vòng phủ đủ 12 cung
  });
  it("12 địa chi có vị trí lưới khác nhau, chừa giữa lưới", () => {
    const vt = Object.values(VI_TRI_LUOI).map((p) => p.join(","));
    expect(new Set(vt).size).toBe(12);
    for (const [r, c] of Object.values(VI_TRI_LUOI)) expect(r === 0 || r === 3 || c === 0 || c === 3).toBe(true);
  });
  it("SVG có đủ 12 cung, chính tinh, và thoát ký tự đặc biệt", () => {
    const svg = veLaSo(ls, "Lá số", 'A <&> "B"');
    for (const c of CUNG_CHUC) expect(svg).toContain(c.toUpperCase());
    expect(svg).toContain("Tham Lang");
    expect(svg).toContain("A &lt;&amp;&gt; &quot;B&quot;");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
  });
});

describe("tra cứu quy tắc", () => {
  it("cách cục có nguồn: xanh khi ≥ 2 nguồn, vàng khi 1, xám khi chưa có", () => {
    expect(["xanh", "vang"]).toContain(tinCay("CC04"));
    expect(quyTac("CC04").nguon.length).toBeGreaterThan(0);
    expect(tinCay("CC21")).toBe(quyTac("CC21").nguon.length >= 2 ? "xanh" : "vang");
    expect(tinCay("CC54")).toBe("xam"); // cách chưa xác nhận web
  });
  it("phụ tinh theo cung = vàng; chính tinh theo cung, nền, phi tuyến = xám", () => {
    expect(tinCay("PT.Hóa Kỵ.Tài Bạch")).toBe("vang");
    expect(quyTac("PT.Hóa Kỵ.Tài Bạch").nguon[0]).toMatch(/^https:/);
    expect(tinCay("PT.Thiên Y")).toBe("xam");
    for (const id of ["CT.Tử Vi.Mệnh", "NEN.tuong_hoa", "PHI_TUYEN", "LN.Lưu Kình Dương", "THAN.Mệnh", "CD.Sự nghiệp"]) expect(tinCay(id)).toBe("xam");
  });
  it("thông tin sao: chính tinh có độ sáng 12 cung và nghĩa theo cung", () => {
    const t = thongTinSao("Thiên Phủ");
    expect(t.loai).toBe("chinh_tinh");
    expect(t.do_sang).toHaveLength(12);
    expect(Object.keys(t.theo_cung)).toHaveLength(12);
    const x = thongTinSao("Văn Xương");
    expect(x.loai).toBe("phu_tinh");
    expect(x.do_sang.find((d) => d.chi === "Ngọ")?.muc).toBe("H");
    expect(thongTinSao("Lưu Kình Dương").loai).toBe("phu_tinh");
  });
});

import { moTaDieuKien } from "../src/engine";
describe("mô tả điều kiện cách cục", () => {
  it("mọi cách cục đều mô tả được, không rơi về JSON thô", () => {
    for (const id of Array.from({ length: 57 }, (_, i) => `CC${String(i + 1).padStart(2, "0")}`)) {
      const q = quyTac(id);
      for (const dk of [q.cach!.thanh, q.cach!.pha].filter(Boolean)) {
        const dong = moTaDieuKien(dk as Record<string, unknown>);
        expect(dong.length, id).toBeGreaterThan(0);
        expect(dong.map((d) => d.text).join(" "), id).not.toMatch(/[{}"]/);
      }
    }
  });
});
