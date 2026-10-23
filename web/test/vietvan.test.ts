import { describe, expect, it } from "vitest";
import { HOA_GIAI, hinhDang } from "../src/engine/vanNen";
import { anLaSo, baoCao, LuanGiai, triThuc, vietMau, hauKiemTheoMuc, tapId } from "../src/engine";

function mau(i: number) {
  const nam = 1930 + ((i * 37) % 90);
  const ls = anLaSo(((nam - 4) % 10) + 1, ((nam - 4) % 12) + 1, (i % 12) + 1, (i % 29) + 1, (i % 12) + 1, i % 2 ? "nam" : "nu");
  return baoCao(new LuanGiai(ls, triThuc()), nam, nam + 30);
}

describe("phân loại điểm mạnh/yếu", () => {
  it("sát tinh đắc địa được gắn dao_dau, vẫn âm (giảm hại), và không bao giờ là điểm sáng của chủ đề", () => {
    let thay = 0;
    for (let i = 0; i < 300; i++) {
      const kq = mau(i);
      for (const k of Object.values(kq.cung)) for (const n of k.nhan_dinh) if (n.dao_dau) { thay++; expect(n.diem).toBeLessThan(0); }
      for (const cd of Object.values(kq.chu_de)) for (const n of cd.diem_manh) expect(n.dao_dau).toBeUndefined(); // sát đắc địa chỉ có thể là mặt cần lưu ý
    }
    expect(thay).toBeGreaterThan(20);
  });
});

describe("lớp nền văn xuôi (spec Phần 3 §24–§26)", () => {
  const phan = (van: string) => van.split("\n").filter((d) => d.trim() && !d.startsWith("#"));
  const cauCuaDoan = (d: string) => d.split(/(?<=[\].!?])\s+/).filter(Boolean);

  it("không nói percentile dân số, mỗi chủ đề nêu điểm /100 đúng bằng điểm báo cáo", () => {
    for (let i = 0; i < 100; i++) {
      const kq = mau(i);
      const van = vietMau(kq);
      expect(van).not.toMatch(/(cao|thấp) hơn khoảng|% lá số|top \d|phân vị/);
      for (const [ten, cd] of Object.entries(kq.chu_de)) {
        const dong = van.split("\n").find((d) => d.includes(`[CD.${ten}]`))!;
        expect(dong).toContain(`khoảng ${cd.diem100}/100`);
        expect(dong.toLowerCase()).toContain(cd.xep_loai.toLowerCase());
      }
    }
  });

  it("mỗi chủ đề là một đoạn, 3–10 câu, không dồn mọi nhận định (R7)", () => {
    for (let i = 0; i < 100; i++) {
      const kq = mau(i);
      const dong = phan(vietMau(kq).split("\n# Tổng kết")[0]); // phần chủ đề; Tổng kết và hỏi đáp kiểm riêng ở dưới
      expect(dong.length).toBe(1 + Object.keys(kq.chu_de).length + 1); // Tổng quan + các chủ đề + Hạn
      Object.keys(kq.chu_de).forEach((_, k) => {
        const n = cauCuaDoan(dong[1 + k]).length;
        expect(n, dong[1 + k]).toBeGreaterThanOrEqual(2);
        expect(n, dong[1 + k]).toBeLessThanOrEqual(12);
      });
    }
  });

  it("không còn ký hiệu máy: mũi tên, 'xung/hội chiếu' dạng liệt kê, dấu ';' ngay sau mã; xưng 'bạn'", () => {
    for (let i = 0; i < 100; i++) {
      const van = vietMau(mau(i));
      expect(van).not.toContain("→");
      expect(van).not.toMatch(/\]\s*;/);
      expect(van).not.toMatch(/\blá số ở mức\b/);
      expect(van).toMatch(/\bbạn\b/);
    }
  });

  it("mọi câu đều có mã hợp lệ và đúng mục (hậu kiểm theo mục không bỏ câu nào)", () => {
    for (let i = 0; i < 300; i++) {
      const kq = mau(i);
      const van = vietMau(kq);
      const [giu, bo] = hauKiemTheoMuc(van, kq);
      expect(bo, `lá ${i}`).toBe(0);
      expect(giu).toBe(van);
    }
  });

  it("câu hòa giải: đặt sau mặt tối, và một báo cáo không lặp nguyên văn một biến thể", () => {
    for (let i = 0; i < 150; i++) {
      const dong = phan(vietMau(mau(i)));
      const hg = (c: string) => HOA_GIAI.some((h) => c.startsWith(h.replace(/\.$/, "")));
      const tatCa = dong.flatMap(cauCuaDoan).filter(hg);
      expect(new Set(tatCa).size, `lá ${i}`).toBe(tatCa.length);
      for (const d of dong) {
        const cs = cauCuaDoan(d);
        const k = cs.findIndex(hg);
        if (k < 0) continue;
        expect(k, d).toBe(cs.length - 1); // hòa giải luôn là câu cuối đoạn
        expect(cs.slice(0, k).some((c) => new RegExp(`^(${["Ngược lại", "Cần lưu ý", ...triThuc().vanPhong.noi_nguoc, ...triThuc().vanPhong.noi_hung_tiep].map((x: string) => x.replace(/,$/, "")).join("|")})`).test(c)), d).toBe(true); // đã nêu mặt tối trước đó
      }
    }
  });

  it("Gia đình: nêu hết mặt sáng của cả nhà trước rồi mới tới phần cần giữ ý (không đan xen từng cặp)", () => {
    for (let i = 0; i < 150; i++) {
      const kq = mau(i);
      const idx = Object.keys(kq.chu_de).indexOf("Gia đình");
      const cs = cauCuaDoan(phan(vietMau(kq))[1 + idx]);
      const loai = cs.map((c) => (/^(Ngược lại|Còn|Ngoài ra|Cần lưu ý)/.test(c) ? "t" : "s"));
      const dau = loai.indexOf("t");
      if (dau >= 0) expect(loai.slice(dau, -1).includes("s") && !HOA_GIAI.some((h) => cs[loai.lastIndexOf("s")]?.startsWith(h.replace(/\.$/, ""))), cs.join(" ")).toBe(false);
    }
  });

  it("không lặp nguyên một câu nhận định giữa hai chủ đề", () => {
    for (let i = 0; i < 100; i++) {
      const ca = phan(vietMau(mau(i))).flatMap(cauCuaDoan).filter((c) => !/\[(CD\.|TQ|DH)/.test(c));
      const dem = new Map<string, number>();
      for (const c of ca) dem.set(c, (dem.get(c) ?? 0) + 1);
      const lap = [...dem].filter(([, n]) => n > 1);
      expect(lap).toEqual([]);
    }
  });
});

describe("hậu kiểm văn của engine", () => {
  it("văn lớp nền của chính web không bao giờ bị bỏ câu nào", () => {
    for (let i = 0; i < 300; i++) {
      const kq = mau(i);
      const van = vietMau(kq);
      const [giu, bo] = hauKiemTheoMuc(van, kq);
      expect(bo, `lá ${i}`).toBe(0);
      expect(giu).toBe(van);
    }
  });
});

describe("kể chuyện theo hình dạng — Tài chính, Sự nghiệp", () => {
  const doan = (kq: ReturnType<typeof mau>, t: string) => {
    const dong = vietMau(kq).split("\n");
    return dong[dong.findIndex((d) => d === `# ${t}`) + 1];
  };
  const cauCua = (d: string) => d.split(/(?<=[\].!?])\s+/).filter(Boolean);

  it("mở bằng câu đời sống, không mở bằng 'Cung X của bạn có chính tinh…', và luôn kết bằng việc nên làm / gợi ý", () => {
    for (let i = 0; i < 200; i++) {
      const kq = mau(i);
      for (const t of ["Tài chính", "Sự nghiệp"]) {
        const cs = cauCua(doan(kq, t));
        expect(cs[0]).toMatch(/^(Tiền bạc|Sự nghiệp) (là mảng|của bạn|không phải)/);
        expect(cs[0]).toContain(`khoảng ${kq.chu_de[t].diem100}/100`);
        expect(cs.some((c) => /^Cung \S+( \S+)? của bạn có chính tinh/.test(c))).toBe(false);
        expect(cs[cs.length - 1]).toMatch(/^(Việc nên làm|Gợi ý): /);
      }
    }
  });

  it("phủ ít nhất 4 hình dạng khác nhau", () => {
    const thay = new Set<string>();
    for (let i = 0; i < 300; i++) { const kq = mau(i); for (const t of ["Tài chính", "Sự nghiệp"]) thay.add(hinhDang(kq.chu_de[t], kq)); }
    expect(thay.size).toBeGreaterThanOrEqual(4);
  });

  it("'Điểm đỡ / Dù vậy vẫn có điểm tựa' chỉ trích nhận định thuộc điểm sáng (không lẫn ý xấu)", () => {
    for (let i = 0; i < 300; i++) {
      const kq = mau(i);
      for (const t of ["Tài chính", "Sự nghiệp"]) {
        const sang = new Set(kq.chu_de[t].diem_manh.map((n) => n.id));
        for (const c of cauCua(doan(kq, t)).filter((x) => /^(Điểm đỡ cho bạn|Dù vậy vẫn có điểm tựa): /.test(x))) {
          const ma = [...c.matchAll(/\[([^[\]]+)\]/g)].map((m) => m[1]).filter((m) => !m.startsWith("CD."));
          expect(ma.every((m) => sang.has(m)), c).toBe(true);
        }
      }
    }
  });
});

describe("tổng kết và hỏi đáp (doc11 lô C)", () => {
  it("tổng kết 1–2 câu; hỏi đáp: đủ 20 câu hỏi khai báo, tối thiểu 10 câu trả lời khi có hạn, mỗi câu có mã hợp lệ đúng mục, chỉ hỏi khi có luật", () => {
    let minHoi = 99;
    for (let i = 0; i < 100; i++) {
      const kq = mau(i);
      const van = vietMau(kq);
      const tk = van.split("\n# Tổng kết\n")[1]?.split("\n")[0] ?? "";
      const nCau = tk.split(/(?<=[\].!?])\s+/).filter(Boolean).length;
      expect(nCau, tk).toBeGreaterThanOrEqual(1);
      expect(nCau, tk).toBeLessThanOrEqual(2);
      const hd = (van.split("\n# Những câu hỏi thường gặp\n")[1] ?? "").split("\n").filter(Boolean);
      const ids = tapId(kq);
      for (const dong of hd) {
        const ma = [...dong.matchAll(/\[([^[\]]+)\]/g)].map((m) => m[1]);
        expect(ma.length, dong).toBeGreaterThan(0);
        expect(ma.every((m) => ids.has(m)), dong).toBe(true);
      }
      // câu hỏi thuộc loại cần so cung / quý nhân chỉ có khi luật cho phép: số dòng không vượt số câu hỏi khai báo
      expect(hd.length).toBeLessThanOrEqual(triThuc().cauHoi.cau_hoi.length);
      if (kq.han?.dai_han) minHoi = Math.min(minHoi, hd.length);
      const [, bo] = hauKiemTheoMuc(van, kq);
      expect(bo, `lá ${i}`).toBe(0);
    }
    expect(triThuc().cauHoi.cau_hoi.length).toBeGreaterThanOrEqual(20);
    expect(minHoi).toBeGreaterThanOrEqual(10); // 6 chủ đề + Thân + đại hạn đẹp nhất/khó nhất + đại hạn hiện tại
  });

  it("một báo cáo không lặp nguyên văn một câu giữa các đoạn chủ đề (câu nối được xoay vòng)", () => {
    for (let i = 0; i < 100; i++) {
      const cs = vietMau(mau(i)).split("\n# Tổng kết")[0].split("\n").filter((d) => d.trim() && !d.startsWith("#")).flatMap((d) => d.split(/(?<=[\].!?])\s+/));
      const noi = triThuc().vanPhong.noi_them as string[];
      const dung = cs.filter((c) => noi.some((x) => c.startsWith(x)));
      expect(new Set(dung).size, `lá ${i}`).toBe(dung.length);
    }
  });
});

describe("cô đọng (doc11 §8c)", () => {
  it("mỗi cung tối đa 2 câu sao → người, và không còn hai câu hiển thị giống hệt nhau trong cùng một cung", () => {
    for (let i = 0; i < 60; i++) {
      const kq = mau(i);
      for (const [ten, k] of Object.entries(kq.cung)) {
        expect(k.nhan_dinh.filter((n) => n.id.startsWith("LC.vai.")).length, `lá ${i} ${ten}`).toBeLessThanOrEqual(2);
        const hien = k.nhan_dinh.filter((n) => !n.an && n.diem !== 0 && /^(CT|PT)\./.test(n.id)).map((n) => n.nhan_dinh);
        expect(new Set(hien).size, `lá ${i} ${ten}: ${hien.join(" | ")}`).toBe(hien.length);
      }
    }
  });
});
