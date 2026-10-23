// Bộ luận giải — port 1:1 từ tools/tuvi/luan_giai.py (xem docs/06, docs/07). test/parity.test.ts so khớp báo cáo với Python.
import { anLaSo, CAN, canCung, CHI, CUNG_CHUC, mv, theoCung, type LaSo } from "./anSao";
import { triThuc, type Dk, type TriThuc } from "./kb";
import { pyRound, toFixedPy } from "./py";
import type { BaoCao, KetQuaChuDe, KetQuaCung, KetQuaHan, KetQuaThan, NhanDinh, QuanHe } from "./types";

export const CHINH_TINH = ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ",
  "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"];
const SINH: Record<string, string> = { Moc: "Hoa", Hoa: "Tho", Tho: "Kim", Kim: "Thuy", Thuy: "Moc" };
const KHAC: Record<string, string> = { Moc: "Tho", Tho: "Thuy", Thuy: "Hoa", Hoa: "Kim", Kim: "Moc" };
/** Tên hành để HIỂN THỊ (mã nội bộ không dấu). */
export const HANH_VN: Record<string, string> = { Kim: "Kim", Moc: "Mộc", Thuy: "Thủy", Hoa: "Hỏa", Tho: "Thổ" };

export const THU_TU_CUNG = ["Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê", "Thiên Di", "Tật Ách", "Phúc Đức",
  "Điền Trạch", "Phụ Mẫu", "Tử Tức", "Huynh Đệ", "Nô Bộc"];

const dauSo = (x: number): string => (x >= 0 ? `+${x}` : `${x}`);
const sapXep = (a: string[]): string => [...a].sort().join("\u0000");

type Vung = "ban_cung" | "xung" | "tam_hop" | "tam_hop_ca_ban" | "ban_xung" | "tam_phuong" | "giap" | "than";
/** sao chồng lên lá số gốc: chi → danh sách tên sao (giữ thứ tự chèn). */
export type SaoThem = Map<number, string[]>;

export class LuanGiai {
  cung: Record<number, string[]>;
  gocHoa: Record<string, string>;
  chiCua = new Map<string, number>();

  constructor(public ls: LaSo, public tt: TriThuc = triThuc(), saoThem?: SaoThem) {
    this.cung = theoCung(ls);
    this.gocHoa = { ...ls.tu_hoa };
    for (const [c, ds] of saoThem ?? []) this.cung[c].push(...ds);
    for (const [chi, ten] of Object.entries(ls.cung_chuc)) this.chiCua.set(ten, Number(chi));
    for (const c of ls.tuan) this.cung[c].push("Tuần");
    for (const c of ls.triet) this.cung[c].push("Triệt");
  }

  // ---------- vùng ảnh hưởng
  vung(chi: number, o: Vung | string = "ban_cung"): number[] {
    const v: Record<string, number[]> = {
      ban_cung: [chi], xung: [mv(chi, 6)], tam_hop: [mv(chi, 4), mv(chi, -4)],
      tam_hop_ca_ban: [chi, mv(chi, 4), mv(chi, -4)], ban_xung: [chi, mv(chi, 6)],
      tam_phuong: [chi, mv(chi, 4), mv(chi, -4), mv(chi, 6)], giap: [mv(chi, -1), mv(chi, 1)], than: [this.ls.than],
    };
    return v[o];
  }

  saoTrong(chi: number, o: Vung | string = "ban_cung"): string[] {
    return this.vung(chi, o).flatMap((c) => this.cung[c]);
  }

  /** (thông tin phụ tinh, hệ số) — sao lưu/đại hạn dùng thông tin sao gốc nhân hệ số. */
  phu(s: string) {
    const p = this.tt.phu.get(s);
    if (p) return { p, heSo: 1 };
    const i = s.indexOf(" ");
    const tienTo = i < 0 ? s : s.slice(0, i);
    const goc = i < 0 ? "" : s.slice(i + 1);
    const hs = this.tt.cfg.he_so_sao_luu;
    if (Object.hasOwn(hs, tienTo) && this.tt.phu.has(goc)) return { p: this.tt.phu.get(goc)!, heSo: hs[tienTo] as number };
    return { p: null, heSo: 0 };
  }

  chinhTinh(chi: number): string[] {
    return this.cung[chi].filter((s) => CHINH_TINH.includes(s));
  }

  // ---------- DSL điều kiện (cach_cuc.json → _meta.dsl)
  private ds(x: string | string[]): string[] {
    if (typeof x === "string") return this.tt.nhom[x] ?? [x];
    return x;
  }

  khop(dk: Dk, chi: number): boolean {
    if ("all" in dk) return (dk.all as Dk[]).every((d) => this.khop(d, chi));
    if ("any" in dk) return (dk.any as Dk[]).some((d) => this.khop(d, chi));
    if ("not" in dk) return !this.khop(dk.not, chi);
    const co = this.saoTrong(chi, dk.o ?? "ban_cung");
    if ("co" in dk) return co.includes(dk.co);
    if ("co_ca" in dk) return this.ds(dk.co_ca).every((s) => co.includes(s));
    if ("co_mot" in dk) return this.ds(dk.co_mot).some((s) => co.includes(s));
    if ("khong_co" in dk) return !this.ds(dk.khong_co).some((s) => co.includes(s));
    if ("dem" in dk) {
      const d = dk.dem;
      const ds = this.ds(d.nhom || d.dem);
      const vung = this.saoTrong(chi, d.o ?? "ban_cung");
      return ds.filter((s) => vung.includes(s)).length >= d.toi_thieu;
    }
    if ("chi" in dk) return (dk.chi as string[]).includes(CHI[chi]);
    if ("vcd" in dk) return (this.chinhTinh(chi).length === 0) === dk.vcd;
    if ("sang" in dk) {
      const s = dk.sang.sao as string;
      const muc = s in this.ls.sao ? this.tt.sang(s, this.ls.sao[s]) : null;
      return s in this.ls.sao && muc !== null && (dk.sang.thuoc as string[]).includes(muc);
    }
    if ("sao_tai_chi" in dk) return (dk.sao_tai_chi.chi as string[]).includes(CHI[this.ls.sao[dk.sao_tai_chi.sao]]);
    if ("tuan_triet" in dk) return (this.cung[chi].includes("Tuần") || this.cung[chi].includes("Triệt")) === dk.tuan_triet;
    if ("can_nam" in dk) return (dk.can_nam as string[]).includes(this.ls.input.can_nam);
    if ("vung_trung" in dk) {
      const [a, b] = dk.vung_trung as [string, string];
      const A = new Set(this.vung(chi, a));
      const B = new Set(this.vung(chi, b));
      return A.size === B.size && [...A].every((x) => B.has(x));
    }
    throw new Error(`Điều kiện không hiểu: ${JSON.stringify(dk)}`);
  }

  // ---------- Lớp 1: nền
  nen(): NhanDinh[] {
    const cfg = this.tt.cfg.menh_cuc;
    const menh = this.ls.ban_menh;
    const cuc = this.ls.cuc.hanh;
    const k = SINH[cuc] === menh ? "cuc_sinh_menh" : cuc === menh ? "tuong_hoa" : KHAC[menh] === cuc ? "menh_khac_cuc" : SINH[menh] === cuc ? "menh_sinh_cuc" : "cuc_khac_menh";
    const ket: NhanDinh[] = [{ nhan_dinh: cfg[k].luan, diem: cfg[k].diem, ly_do: `Bản Mệnh ${HANH_VN[menh]}, Cục ${HANH_VN[cuc]} (${k})`, id: `NEN.${k}` }];
    const ly = this.ls.am_duong_nam_nu;
    const thuan = ly === "Dương Nam" || ly === "Âm Nữ";
    ket.push({
      nhan_dinh: thuan
        ? `Âm dương thuận lý: đại hạn an theo chiều thuận (đặc tính kỹ thuật của ${ly}); một số trường phái cho là đời ít trắc trở hơn.`
        : `Âm dương nghịch lý: chỉ nghĩa là đại hạn an theo chiều nghịch (đặc tính kỹ thuật của ${ly}), không đồng nghĩa cuộc đời nghịch cảnh.`,
      diem: 0, ly_do: ly, id: "NEN.am_duong",
    });
    // sao chủ Mệnh vs Bản Mệnh — mỗi câu có vế HỆ QUẢ cho đương số ('Mệnh X sinh/khắc Sao Y → mô tả → hệ quả')
    const bang = this.tt.cfg.sao_chu_ban_menh;
    for (const s of this.chinhTinh(this.ls.menh)) {
      const h: string = this.tt.chinh.get(s).ngu_hanh;
      const kk = h === menh ? "dong_hanh" : SINH[h] === menh ? "sao_sinh_menh" : SINH[menh] === h ? "menh_sinh_sao" : KHAC[h] === menh ? "sao_khac_menh" : "menh_khac_sao";
      const LUAN: Record<string, string> = {
        dong_hanh: `cùng hành Bản Mệnh ${HANH_VN[menh]} → đồng khí → sao phát huy trọn vẹn mặt tốt`,
        sao_sinh_menh: `${HANH_VN[h]} sinh Bản Mệnh ${HANH_VN[menh]} → sao nuôi Mệnh → được nâng đỡ, dễ nhờ vào tính chất của sao`,
        menh_sinh_sao: `Bản Mệnh ${HANH_VN[menh]} sinh ${HANH_VN[h]} → sinh xuất, hao khí nuôi sao → tận lực, dễ đuối nếu ôm đồm; bù lại sao phát huy mặt tốt`,
        sao_khac_menh: `${HANH_VN[h]} khắc Bản Mệnh ${HANH_VN[menh]} → sao chế ngược Mệnh → cái tốt của sao bị giảm, dễ chịu áp lực từ chính tính chất sao`,
        menh_khac_sao: `Bản Mệnh ${HANH_VN[menh]} khắc ${HANH_VN[h]} → khắc xuất, chế ngự được sao → kiểm soát tốt tính chất của sao, nhưng mặt hưởng thụ bị kìm, hơi khắc khổ`,
      };
      ket.push({ nhan_dinh: `${s} (${HANH_VN[h]}): ${LUAN[kk]}.`, diem: bang[kk], ly_do: `Hành sao ${HANH_VN[h]}, Bản Mệnh ${HANH_VN[menh]}`, id: `NEN.sao_chu.${kk}` });
    }
    // Tuần/Triệt án Mệnh hoặc Thân: ưu tiên cao, luôn nêu ở phần nền
    const uuTien: string = this.tt.cfg.tuan_triet.mau.uu_tien;
    for (const [ten, chi] of [["Mệnh", this.ls.menh], ["Thân", this.ls.than]] as const) {
      const tt = (["Tuần", "Triệt"] as const).filter((m) => this.cung[chi].includes(m));
      if (tt.length && (ten === "Mệnh" || this.ls.than !== this.ls.menh)) {
        const tenCung = ten === "Mệnh" ? "Mệnh" : `cung Thân (${this.ls.cung_chuc[chi]})`;
        ket.push({ nhan_dinh: this.cauTuanTriet(tenCung, tt) + uuTien, diem: 0, ly_do: `${tt.join("/")} tại ${CHI[chi]}`, id: `NEN.tuan_triet.${ten}` });
      }
    }
    return ket;
  }

  /** Câu Tuần/Triệt gắn đúng cung bị án (Triệt cắt mạnh nửa đầu đời, Tuần cản chậm; cả hai thì nói cả hai). */
  private cauTuanTriet(tenCung: string, tuanTriet: readonly string[]): string {
    const m = this.tt.cfg.tuan_triet.mau;
    return (m[tuanTriet.length === 2 ? "ca_hai" : tuanTriet[0]] as string).replace("{cung}", tenCung);
  }

  /** Câu tổ hợp Tứ Hóa có nội dung theo lĩnh vực (tiền, tình cảm...) chỉ được nối vào cung thuộc lĩnh vực đó. */
  private mienChoPhep(khoa: string, tenCung: string): boolean {
    const cfg = this.tt.cfg;
    const mien: string[] | undefined = cfg.tu_hoa_mien[khoa];
    return !mien || !mien.length || mien.some((m) => (cfg.mien_cung[m] as string[]).includes(tenCung));
  }

  // ---------- quan hệ vị trí + metadata nguồn (mỗi nhận định phải truy được sao/cung nào sinh ra nó)
  /** Cung c so với cung chủ chiChu: ban_cung | xung | tam_hop | lien_quan (không thuộc tam phương tứ chính). */
  quanHe(chiChu: number, c: number): QuanHe {
    if (c === chiChu) return "ban_cung";
    if (c === mv(chiChu, 6)) return "xung";
    if (c === mv(chiChu, 4) || c === mv(chiChu, -4)) return "tam_hop";
    return "lien_quan";
  }

  private nguon(c: number, quanHe: QuanHe, nhan: string[]) {
    return { cung_nguon: this.ls.cung_chuc[c], chi_nguon: CHI[c], quan_he: quanHe, nhan };
  }

  /** Câu cảnh báo sát tinh sinh từ dữ liệu thật: tách sát ở bản cung và sát ở xung/hội chiếu (không có thì không sinh). */
  private cauSat(tenCung: string, satBan: [string, number][], satXh: [string, number, string][]): string {
    const uniq = (a: string[]) => [...new Set(a)];
    const ban = uniq(satBan.map((x) => x[0])).join(", ");
    const nhom = new Map<string, { c: number; o: string; ds: string[] }>();
    for (const [sao, c, o] of satXh) {
      const k = `${c}|${o}`;
      const g = nhom.get(k);
      if (g) g.ds.push(sao); else nhom.set(k, { c, o, ds: [sao] });
    }
    const xh = [...nhom.values()].map(({ c, o, ds }) => `${uniq(ds).join(", ")} ở ${this.ls.cung_chuc[c]} (${CHI[c]}), ${o === "xung" ? "xung" : "hội"} chiếu`).join("; ");
    if (satBan.length && satXh.length) return `Sát tinh ở cả bản cung (${ban}) và xung/hội chiếu (${xh}) → cung ${tenCung} bị cản.`;
    if (satBan.length) return `Bản cung có ${ban} → ảnh hưởng trực tiếp đến cung ${tenCung}.`;
    return `Bản cung ${tenCung} tương đối nhẹ sát; áp lực đến từ xung/hội chiếu (${xh}).`;
  }

  // ---------- Lớp 2-3: chấm 1 cung
  /** Chấm cung chức `tenCung` (mặc định tại vị trí trên lá số gốc; truyền `chiTruyen` để chấm cung đại hạn/lưu niên). */
  chamCung(tenCung: string, chiTruyen?: number): KetQuaCung {
    const chi = chiTruyen ?? this.chiCua.get(tenCung)!;
    const cfg = this.tt.cfg;
    const tsvt = cfg.trong_so_vi_tri;
    const w: Record<string, number> = { ...tsvt, xung: tsvt.xung_chieu };
    const hs = cfg.he_so_do_sang;
    const pt = cfg.phi_tuyen;
    const satSet = new Set<string>([...cfg.sat_tinh.sat, ...cfg.sat_tinh.ban_sat]);
    const vungPha = new Set(this.vung(chi, pt.vung));
    const nhanDinh: NhanDinh[] = [];
    const chiTiet: [string, string, string, number][] = [];
    const tong = { tot: 0.0, xau: 0.0, nang: 0.0 };
    const satBan: [string, number][] = [];
    const satXh: [string, number, string][] = []; // sát tinh thật sự gây hại (sát đắc địa đã lật dương không tính), tách theo vị trí

    const cong = (d: number, sao: string | null = null, c: number | null = null) => {
      if (d > 0) tong.tot += d; else tong.xau += d;
      const i = (sao ?? "").indexOf(" ");
      const tenGoc = sao !== null && (pt.sao_pha as string[]).includes(sao) ? sao : i < 0 ? "" : (sao as string).slice(i + 1); // 'Lưu Kình Dương' tính như Kình Dương
      // d của sao phá đã nhân trọng số vị trí riêng (bản cung > xung chiếu > tam hợp)
      if (d < 0 && (pt.sao_pha as string[]).includes(tenGoc) && c !== null && vungPha.has(c)) tong.nang += -d;
    };

    const chinh = this.chinhTinh(chi);
    let chu = chinh;
    let heSoVcd = 1.0;
    let chiChu = chi;
    let muon = false;
    if (chinh.length === 0) {
      chiChu = mv(chi, 6);
      chu = this.chinhTinh(chiChu);
      heSoVcd = cfg.vo_chinh_dieu.he_so;
      muon = true;
      nhanDinh.push({
        id: "VCD", diem: 0, luu_y: true, nhan_dinh: cfg.vcd_theo_cung[tenCung] || (tenCung === "Mệnh" ? this.tt.boSao.vo_chinh_dieu.chung : (cfg.vcd_mac_dinh as string).replace("{cung}", tenCung)),
        ly_do: `${tenCung} tại ${CHI[chi]} không có chính tinh; mượn ${chu.join(" + ")} tại ${CHI[chiChu]}`,
        ...this.nguon(chi, "ban_cung", ["vô chính diệu"]),
      });
    }

    const tuanTriet = (["Tuần", "Triệt"] as const).filter((m) => this.cung[chi].includes(m));
    const heSoTt: number = tuanTriet.length ? cfg.tuan_triet.he_so_sao_tot : 1.0;

    // chính tinh chủ
    for (const s of chu) {
      const muc = this.tt.sang(s, chiChu) ?? "khong_ro";
      const [hop, txtSang, txtHam] = this.tt.maTran[s][tenCung];
      // chính tinh hãm luôn trừ điểm (độ lớn tăng theo mức cung chức "gọi" sao ra): tránh âm × âm = dương làm câu hung bị xếp thành điểm sáng
      const d = (muc === "H" ? hs[muc] * (1 + Math.abs(hop)) : hs[muc] * (1 + hop)) * heSoVcd * heSoTt * cfg.he_so_chinh_tinh_chu;
      cong(d, s, chiChu);
      chiTiet.push([s, CHI[chiChu], muc, pyRound(d, 2)]);
      nhanDinh.push({
        id: `CT.${s}.${tenCung}`, diem: pyRound(d, 2), nhan_dinh: muc === "H" ? txtHam : txtSang,
        ly_do: `${s} (${muc}) tại ${CHI[chiChu]}, hợp cung ${dauSo(hop)}` + (tuanTriet.length ? `, gặp ${tuanTriet.join("/")}` : "")
          + (muon ? `; mượn từ cung ${this.ls.cung_chuc[chiChu]} xung chiếu` : ""),
        ...this.nguon(chiChu, muon ? "xung" : "ban_cung", [s]),
      });
    }

    // bộ sao tại chi (chỉ luận chi tiết cho Mệnh)
    if (tenCung === "Mệnh" && chu.length) {
      for (const bo of this.tt.boSao.bo_sao) {
        if (sapXep(bo.bo) === sapXep(chu) && (bo.chi as string[]).includes(CHI[chiChu])) {
          const dc: number = bo.dieu_chinh?.[CHI[chiChu]] ?? 0;
          cong(dc * heSoVcd);
          const txt = bo.chung + (CHI[chiChu] in bo.theo_chi ? ` ${bo.theo_chi[CHI[chiChu]]}` : "");
          nhanDinh.push({
            id: `BO.${(bo.bo as string[]).join("+")}.${CHI[chiChu]}`, diem: dc, nhan_dinh: txt, ly_do: `Bộ ${(bo.bo as string[]).join(" + ")} tại ${CHI[chiChu]}`,
            ...this.nguon(chiChu, muon ? "xung" : "ban_cung", [...bo.bo]),
          });
        }
      }
    }

    // chính tinh hội chiếu (tam hợp, xung) — ảnh hưởng nhẹ
    for (const o of ["tam_hop", "xung"]) {
      for (const c of this.vung(chi, o)) {
        if (c === chiChu) continue;
        for (const s of this.chinhTinh(c)) {
          const muc = this.tt.sang(s, c) ?? "khong_ro";
          const d = hs[muc] * w[o] * 0.5;
          cong(d, s, c);
          chiTiet.push([s, CHI[c], muc, pyRound(d, 2)]);
        }
      }
    }

    // phụ tinh trong tam phương (thứ tự duyệt giữ như Python: bản cung, tam hợp, tam hợp, xung)
    const vungTp: [number, QuanHe][] = this.vung(chi, "tam_phuong").map((c) => [c, c === chi ? "ban_cung" : c === mv(chi, 6) ? "xung" : "tam_hop"]);
    const coMat = this.saoTrong(chi, "tam_phuong");
    const doi = (cfg.doi_sao_cung_hoi.cap as string[][]).filter((p) => p.every((x) => coMat.includes(x)));
    for (const [c, o] of vungTp) {
      for (const s of this.cung[c]) {
        if (CHINH_TINH.includes(s)) continue;
        const { p, heSo: heSoLuu } = this.phu(s);
        if (!p) continue;
        let base = p.diem * heSoLuu;
        const dac = (p.dac_dia ?? []).includes(CHI[c]);
        const daoDau = base < 0 && dac; // sát tinh đắc địa: điểm lật dương nhưng câu luận vẫn mô tả mặt xấu
        const ham = base > 0 && this.tt.sang(p.ten, c) === "H";
        if (base < 0 && dac) base = base * -0.3; // sát tinh đắc địa: hết hại, thành lực
        else if (ham) base = base * 0.3; // cát tinh hãm địa (VD Xương Khúc): còn ít lực
        if (doi.some((d) => d.includes(s))) base *= cfg.doi_sao_cung_hoi.he_so_nhan;
        else if (Math.abs(p.diem) <= 1) base *= cfg.he_so_phu_tinh_nho;
        // sát tinh/Hóa Kỵ: trọng số vị trí riêng — sát ở xa trừ ít hơn sát ở bản cung
        const wo: number = base < 0 && (pt.sao_pha as string[]).includes(p.ten) ? pt.trong_so[o] : w[o];
        const d = base * wo * (c === chi ? heSoTt : 1.0);
        cong(d, s, c);
        if (satSet.has(p.ten) && p.diem < 0 && !daoDau) {
          if (o === "ban_cung") satBan.push([p.ten, c]); else satXh.push([p.ten, c, o]);
        }
        if (Math.abs(d) >= 0.5) chiTiet.push([s, CHI[c], dac ? "đắc" : "", pyRound(d, 2)]);
        if (c === chi && Math.abs(p.diem) >= 1) {
          const gocTen = p.ten;
          let txt: string | undefined = this.tt.phuCung[gocTen]?.[tenCung];
          if (txt === undefined) txt = cfg.mau_theo_nhom[gocTen]?.[cfg.nhom_cung[tenCung]]; // chưa có câu riêng theo cung → câu theo NHÓM cung, không dùng câu generic của cung khác
          if (gocTen.startsWith("Hóa") && s === gocTen) {
            const khoa = `${this.gocHoa[s]}|${s}`;
            const hop: string | undefined = this.mienChoPhep(khoa, tenCung) ? this.tt.tuHoa[khoa] : undefined;
            txt = (txt ? `${txt} ` : "") + (hop ?? (txt ? "" : p.y_nghia));
          }
          const nd = (txt || p.y_nghia).trim();
          if (Math.abs(p.diem) >= 2 || gocTen.startsWith("Hóa") || heSoLuu !== 1.0) {
            const nhan: NhanDinh = {
              id: `PT.${s}` + (gocTen in this.tt.phuCung ? `.${tenCung}` : ""), diem: pyRound(d, 2), nhan_dinh: nd,
              ly_do: `${s} thủ ${tenCung} tại ${CHI[c]}` + (daoDau ? " (đắc địa: bớt hại, có thể thành lực)" : dac ? " (đắc địa)" : ham ? " (hãm địa — lực yếu)" : ""),
              ...this.nguon(c, o, [s]),
            };
            if (daoDau) nhan.dao_dau = true;
            nhanDinh.push(nhan);
          }
        }
      }
    }

    // vòng Tràng Sinh tại bản cung
    for (const s of this.cung[chi]) cong(cfg.trang_sinh[s] ?? 0);

    // Tuần Triệt
    if (tuanTriet.length) {
      nhanDinh.push({
        id: "TT", diem: 0, luu_y: true, ly_do: `${tuanTriet.join("/")} tại ${CHI[chi]}`,
        nhan_dinh: this.cauTuanTriet(tenCung, tuanTriet),
        ...this.nguon(chi, "ban_cung", [...tuanTriet]),
      });
    }

    // Cách cục
    for (const cc of this.tt.cach) {
      if ((cc.pham_vi ?? "Mệnh") !== tenCung || !this.khop(cc.thanh, chi)) continue;
      const phaChung = this.tt.phaChung;
      let biPha: boolean;
      let d: number;
      if (cc.pha) {
        biPha = this.khop(cc.pha, chi);
        d = biPha ? (cc.diem_pha ?? cc.diem) : cc.diem;
      } else if (cc.loai === "cat" && this.khop(phaChung.dieu_kien, chi)) {
        biPha = true;
        d = pyRound(cc.diem * phaChung.he_so_diem, 2);
      } else {
        biPha = false;
        d = cc.diem;
      }
      cong(d);
      nhanDinh.push({
        id: cc.id, diem: d, linh_vuc: cc.linh_vuc ?? [],
        nhan_dinh: `[${cc.ten}${biPha ? " — PHÁ CÁCH" : ""}] ` + (biPha ? (cc.ket_luan_pha ?? `Gặp từ 2 sát tinh/Hóa Kỵ ở bản cung và xung chiếu: cách bị giảm nhiều. ${cc.ket_luan}`) : cc.ket_luan),
        ly_do: "Thỏa điều kiện cách cục" + (biPha ? " nhưng gặp điều kiện phá" : "") + (cc.xac_nhan_web ? "" : " (cách chưa xác nhận nguồn web)"),
        ...this.nguon(chi, "ban_cung", [`«${cc.ten}»`]),
      });
    }

    // Phi tuyến: sao phá nặng làm mất tác dụng phần tốt; câu cảnh báo chỉ sinh khi THẬT SỰ có sát tinh (bản cung và/hoặc xung/hội chiếu)
    const heSoPha = 1 / (1 + tong.nang / pt.K);
    const diem = tong.tot * heSoPha + tong.xau;
    if (satBan.length || satXh.length) {
      nhanDinh.push({
        id: "PHI_TUYEN", diem: pyRound(tong.tot * (heSoPha - 1), 2), nhan_dinh: this.cauSat(tenCung, satBan, satXh),
        ly_do: `Tổng lực sao phá ${toFixedPy(tong.nang, 1)}, hệ số ${toFixedPy(heSoPha, 2)}`,
        ...this.nguon(chi, "ban_cung", [...new Set([...satBan.map((x) => x[0]), ...satXh.map((x) => x[0])])]),
      });
    }

    const nguong = cfg.nguong_ket_luan.theo_cung?.[tenCung];
    const dn = cfg.diem_noi_tai;
    const sangChu = chu.map((s) => this.tt.sang(s, chiChu));
    // sàn: chính tinh miếu/vượng thì sát tinh chỉ đến từ xung/hội chiếu không được kéo cung xuống dưới 'trung bình'
    const san = sangChu.some((m) => m === "M" || m === "V") && satBan.length === 0;
    let dq = quyDoi(diem, nguong);
    if (san) dq = Math.max(dq, dn.san_chinh_tinh_sang);
    const d100 = diem100(dq);
    return {
      cung: tenCung, chi: CHI[chi], diem: pyRound(diem, 2), diem100: d100, xep_loai: bac(d100, dn),
      sat_xh: satXh.map(([sao, c, o]) => ({ sao, cung: this.ls.cung_chuc[c], chi: CHI[c], quan_he: o as QuanHe })),
      san_chinh_tinh: san, chinh_tinh_dac: sangChu.some((m) => m === "M" || m === "V" || m === "Đ"),
      chinh_tinh: chinh, tuan_triet: [...tuanTriet], nhan_dinh: nhanDinh, chi_tiet_diem: chiTiet,
    };
  }

  // ---------- Thân
  than(): KetQuaThan {
    const ten = this.ls.cung_chuc[this.ls.than];
    const k = this.chamCung(ten);
    const m = this.chamCung("Mệnh");
    const so = k.diem100 - m.diem100 >= 15 ? "Hậu vận (sau ~30 tuổi) khá hơn tiền vận." : m.diem100 - k.diem100 >= 15 ? "Hậu vận kém tiền vận, cần giữ những gì đã gây dựng." : "Tiền vận và hậu vận tương đương.";
    return {
      cu: ten, chi: CHI[this.ls.than], xep_loai: k.xep_loai, diem100: k.diem100,
      nhan_dinh: [
        { id: `THAN.${ten}`, diem: 0, nhan_dinh: this.tt.cfg.than_cu[ten], ly_do: `Thân cư ${ten} tại ${CHI[this.ls.than]}` },
        { id: "THAN.so_menh", diem: 0, nhan_dinh: so, ly_do: `Mệnh ~${m.diem100}/100, cung Thân cư (${ten}) ~${k.diem100}/100` },
      ],
    };
  }

  // ---------- Lớp 4: hạn
  /** Sao lưu niên theo can/chi năm xem → {tên 'Lưu X': chi}. */
  saoLuu(namXem: number): { luu: Record<string, number>; luuHoa: Record<string, string> } {
    const canX = (((namXem - 4) % 10) + 10) % 10 + 1;
    const chiX = (((namXem - 4) % 12) + 12) % 12 + 1;
    const luuLs = anLaSo(canX, chiX, 1, 1, 1, this.ls.input.gioi_tinh); // chỉ lấy sao theo can/chi năm
    const luu: Record<string, number> = {};
    for (const s of ["Thái Tuế", "Lộc Tồn", "Kình Dương", "Đà La", "Thiên Mã", "Tang Môn", "Bạch Hổ", "Thiên Khốc", "Thiên Hư"]) luu[`Lưu ${s}`] = luuLs.sao[s];
    // Lưu Tứ Hóa: tên sao được hóa theo can năm xem, nhưng VỊ TRÍ là vị trí sao đó trên lá số gốc
    for (const [hoa, goc] of Object.entries(luuLs.tu_hoa)) luu[`Lưu ${hoa}`] = this.ls.sao[goc];
    return { luu, luuHoa: luuLs.tu_hoa };
  }

  /** Tứ Hóa đại hạn: lấy can của cung đại hạn (ngũ hổ độn) → 4 sao hóa, vị trí trên lá số gốc. */
  tuHoaDaiHan(chiDh: number) {
    const canNam = CAN.indexOf(this.ls.input.can_nam);
    const canDh = canCung(canNam, chiDh);
    const bang = anLaSo(canDh, canDh % 2 ? 1 : 2, 1, 1, 1, "nam", this.ls.input.profile).tu_hoa;
    const vt: Record<string, number> = {};
    for (const [hoa, goc] of Object.entries(bang)) vt[`ĐH ${hoa}`] = this.ls.sao[goc];
    return { can: CAN[canDh], hoaDh: vt, bang };
  }

  /** Kết luận hành động của năm: trọng tâm rủi ro → nên/tránh theo cung bị lưu sát chiếu, và mặt thuận. Chỉ dùng sao thật của năm xem. */
  private ketLuanHan(namXem: number, luu: Record<string, number>, vungTt: Set<number>, dh: number | undefined, them: SaoThem): NhanDinh[] {
    const hc = this.tt.cfg.han;
    const kn: Record<string, { muc: string; nen: string; tranh: string }> = hc.khuyen_nghi;
    const cungGoc = this.ls.cung_chuc;
    const ket: NhanDinh[] = [];
    // (1) cung gốc bị lưu sát chiếu (tam phương cung Thái Tuế)
    const bi = new Map<string, [string, number, string][]>();
    for (const [k, nghia] of Object.entries<string>(hc.luu_sat)) {
      const c = cungGoc[luu[k]];
      const trongTam = vungTt.has(luu[k]);
      if (trongTam || (hc.trong_yeu as string[]).includes(c)) { // lớp 2: ngoài tam phương nhưng rơi vào cung trọng yếu
        const them_ = trongTam ? nghia : `${nghia}; ngoài tam phương lưu niên nhưng là cung trọng yếu`;
        const l = bi.get(c);
        if (l) l.push([k, luu[k], them_]); else bi.set(c, [[k, luu[k], them_]]);
      }
    }
    if (bi.size) {
      const ds = [...bi].map(([c, l]) => `${c} (${CHI[l[0][1]]}): ` + l.map(([k, , n]) => `${k} (${n})`).join(", ")).join("; ");
      const bo3 = ["Mệnh", "Tài Bạch", "Quan Lộc"].every((c) => bi.has(c));
      ket.push({ id: "HAN.rui_ro", diem: -1, ly_do: "Lưu sát tinh rơi vào tam phương cung Thái Tuế", nhan_dinh: `Trọng tâm rủi ro năm ${namXem}: ` + (bo3 ? "bộ Mệnh – Tài Bạch – Quan Lộc đồng thời bị lưu sát chiếu — " : "") + ds + "." });
      // (2) nên/tránh: cung bị nhiều lưu sát nhất trước, tối đa 4 câu
      const xep = [...bi].sort((a, b) => (b[1].length - a[1].length) || (THU_TU_CUNG.indexOf(a[0]) - THU_TU_CUNG.indexOf(b[0]))).slice(0, 4);
      for (const [c, l] of xep) {
        if (c in kn) ket.push({ id: `HAN.nen_tranh.${c}`, diem: 0, ly_do: `${l.map((x) => x[0]).join(", ")} vào ${c} gốc`, nhan_dinh: `Về ${kn[c].muc}: nên ${kn[c].nen}; tránh ${kn[c].tranh}.` });
      }
    }
    // (3) mặt thuận: Hóa Lộc/Quyền/Khoa đại hạn và lưu cát tinh của năm
    const thuan: [string, number][] = [];
    const themSapXep = [...them].sort((a, b) => a[0] - b[0]);
    if (dh !== undefined) {
      for (const t of ["ĐH Hóa Lộc", "ĐH Hóa Quyền", "ĐH Hóa Khoa"]) for (const [c, ds] of themSapXep) if (ds.includes(t)) thuan.push([t, c]);
      for (const t of ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa"]) if (this.cung[dh].includes(t)) thuan.push([`${t} gốc tại cung đại hạn`, dh]);
    }
    for (const k of hc.luu_cat as string[]) if (vungTt.has(luu[k])) thuan.push([k, luu[k]]);
    if (thuan.length) {
      const muc = [...new Set(thuan.filter(([, c]) => cungGoc[c] in kn).map(([, c]) => kn[cungGoc[c]].muc))].slice(0, 2);
      ket.push({
        id: "HAN.mat_thuan", diem: 1, ly_do: "Hóa Lộc/Quyền/Khoa đại hạn hoặc lưu cát tinh của năm",
        nhan_dinh: "Mặt thuận: " + thuan.map(([t, c]) => `${t} ở ${CHI[c]} (${cungGoc[c]} gốc)`).join("; ") + ` → tận dụng cho ${muc.join(", ")} theo hướng ${hc.tan_dung}.`,
      });
    }
    return ket;
  }

  han(namSinh: number, namXem: number, thangXem = true): Omit<KetQuaHan, "nam_xem"> {
    const tuoi = namXem - namSinh + 1;
    const cfg = this.tt.cfg;
    const ket: Omit<KetQuaHan, "nam_xem"> = { tuoi_am: tuoi, dai_han: null, tieu_han: null as never, luu_nien: null as never, luu_nguyet: [] };
    const dh = Object.entries(this.ls.dai_han).map(([c, t]) => [Number(c), t] as const).sort((a, b) => a[1] - b[1]).find(([, t]) => t <= tuoi && tuoi < t + 10)?.[0];
    const { luu, luuHoa } = this.saoLuu(namXem);
    const them: SaoThem = new Map();
    const them_ = (c: number, ten: string) => { const l = them.get(c); if (l) l.push(ten); else them.set(c, [ten]); };
    if (dh) {
      const { can, hoaDh, bang } = this.tuHoaDaiHan(dh);
      if (cfg.han.tu_hoa_dai_han) for (const [ten, c] of Object.entries(hoaDh)) them_(c, ten);
      const lgDh = new LuanGiai(this.ls, this.tt, new Map([...them].map(([c, l]) => [c, [...l]])));
      // 12 cung của đại hạn: cung đại hạn là Mệnh đại hạn, các cung khác xếp như lá số gốc
      const danhGia: Record<string, { chi: string; xep_loai: string; diem: number; noi_bat: NhanDinh[] }> = {};
      CUNG_CHUC.forEach((ten, i) => {
        if (!["Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê", "Tật Ách"].includes(ten)) return;
        const v = lgDh.chamCung(ten, mv(dh, i));
        const noiBat = [...v.nhan_dinh].sort((a, b) => -Math.abs(a.diem) - -Math.abs(b.diem)).slice(0, 3);
        danhGia[ten] = { chi: v.chi, xep_loai: v.xep_loai, diem: v.diem, noi_bat: noiBat };
      });
      const tuHoaTxt: Record<string, string> = {};
      for (const [k, v] of Object.entries(bang)) tuHoaTxt[k] = `${v} tại ${CHI[this.ls.sao[v]]} (${this.ls.cung_chuc[this.ls.sao[v]]} gốc)`;
      ket.dai_han = { chi: CHI[dh], cung_goc: this.ls.cung_chuc[dh], tu_tuoi: this.ls.dai_han[dh], can, tu_hoa: tuHoaTxt, danh_gia: danhGia };
    }
    // tiểu hạn: khởi theo tam hợp chi năm sinh, nam thuận nữ nghịch
    const chieu = this.ls.input.gioi_tinh === "nam" ? 1 : -1;
    const th = mv(this.ls.tieu_han_khoi, (tuoi - 1) * chieu);
    // lưu niên: chồng sao lưu + Tứ Hóa đại hạn lên lá số
    for (const [ten, c] of Object.entries(luu)) them_(c, ten);
    const lgLuu = new LuanGiai(this.ls, this.tt, them);
    const ttChi = luu["Lưu Thái Tuế"];
    const kTt = lgLuu.chamCung("Mệnh", ttChi);
    const kTh = lgLuu.chamCung("Mệnh", th);
    ket.tieu_han = { chi: CHI[th], cung_goc: this.ls.cung_chuc[th], xep_loai: kTh.xep_loai, diem: kTh.diem };
    const canhBao: NhanDinh[] = [];
    const vungTt = new Set(this.vung(ttChi, "tam_phuong"));
    for (const k of ["Lưu Kình Dương", "Lưu Đà La", "Lưu Hóa Kỵ", "Lưu Tang Môn", "Lưu Bạch Hổ"]) {
      if (vungTt.has(luu[k])) canhBao.push({ id: `LN.${k}`, nhan_dinh: `${k} vào tam phương cung lưu niên (${CHI[luu[k]]} – ${this.ls.cung_chuc[luu[k]]} gốc)`, diem: -1 });
    }
    for (const k of ["Lưu Hóa Lộc", "Lưu Lộc Tồn"]) {
      if (vungTt.has(luu[k])) canhBao.push({ id: `LN.${k}`, nhan_dinh: `${k} vào tam phương cung lưu niên → năm có cơ hội tài lộc`, diem: 1 });
    }
    // lớp 2: lưu sát tinh/Kỵ rơi NGOÀI tam phương lưu niên nhưng vào cung trọng yếu vẫn phải nêu
    for (const k of Object.keys(cfg.han.luu_sat)) {
      const c = this.ls.cung_chuc[luu[k]];
      if (!vungTt.has(luu[k]) && (cfg.han.trong_yeu as string[]).includes(c)) {
        canhBao.push({ id: `LN2.${k}`, nhan_dinh: `${k} rơi vào ${c} gốc (${CHI[luu[k]]}) — ngoài tam phương lưu niên nhưng là cung trọng yếu`, diem: -1 });
      }
    }
    const viTriKyDh = [...them].find(([, ds]) => ds.includes("ĐH Hóa Kỵ"))?.[0];
    if (dh && luu["Lưu Hóa Kỵ"] === viTriKyDh) {
      canhBao.push({ id: "LN.song_ky", nhan_dinh: `Lưu Hóa Kỵ trùng Hóa Kỵ đại hạn tại ${CHI[luu["Lưu Hóa Kỵ"]]} (${this.ls.cung_chuc[luu["Lưu Hóa Kỵ"]]}): năm cần thận trọng việc thuộc cung này`, diem: -2 });
    }
    const tuHoaNam: Record<string, string> = {};
    for (const [k, v] of Object.entries(luuHoa)) tuHoaNam[k] = `${v} tại ${CHI[this.ls.sao[v]]}`;
    const saoLuuTxt: Record<string, string> = {};
    for (const [k, v] of Object.entries(luu)) saoLuuTxt[k] = `${CHI[v]} (${this.ls.cung_chuc[v]})`;
    ket.luu_nien = { thai_tue_tai: `${CHI[ttChi]} (${this.ls.cung_chuc[ttChi]})`, xep_loai: kTt.xep_loai, diem: kTt.diem, tu_hoa: tuHoaNam, sao_luu: saoLuuTxt, ghi_chu: canhBao, ket_luan: this.ketLuanHan(namXem, luu, vungTt, dh, them) };
    // lưu nguyệt: Đẩu Quân năm xem = từ cung gốc (tiểu hạn hoặc Thái Tuế, theo profile) đếm nghịch tháng sinh, thuận giờ sinh; tháng Giêng tại đó
    if (thangXem) {
      const goc = (this.ls.input.profile.luu_nguyet ?? "tieu_han") === "tieu_han" ? th : ttChi;
      const dq = mv(goc, -(this.ls.input.thang - 1) + (CHI.indexOf(this.ls.input.gio) - 1));
      const diemT = Array.from({ length: 12 }, (_, i) => {
        const c = mv(dq, i);
        return { t: i + 1, c, d: lgLuu.chamCung("Mệnh", c).diem };
      });
      const xep = [...diemT].sort((a, b) => a.d - b.d);
      const hang = new Map(xep.map((x, i) => [x.t, i]));
      ket.luu_nguyet = diemT.map(({ t, c, d }) => ({
        thang: t, chi: CHI[c], cung_goc: this.ls.cung_chuc[c], diem: pyRound(d, 2),
        nhan_xet: hang.get(t)! >= 10 ? "tốt nhất năm" : hang.get(t)! <= 1 ? "cần thận trọng" : "",
      }));
    }
    return ket;
  }

  // ---------- tổng hợp theo chủ đề
  /** Sao mượn từ cung xung chiếu (cung vô chính diệu) phải ghi rõ nguồn: '<Sao> từ cung <Nguồn> (<chi>) xung chiếu <Cung> (<chi>) → ...'. */
  private ganNguon(n: NhanDinh, c: string): NhanDinh {
    if (n.quan_he === "ban_cung") return n;
    const sao = (n.nhan ?? []).join(" + ");
    return { ...n, nhan_dinh: `${sao} từ cung ${n.cung_nguon} (${n.chi_nguon}) xung chiếu ${c} (${CHI[this.chiCua.get(c)!]}) → ${n.nhan_dinh}` };
  }

  /** Sát tinh ở cung xung/hội chiếu cung chủ → nhận định gián tiếp, ghi rõ cung nguồn và quan hệ (không bao giờ nói như sao nằm tại cung chủ). */
  private gianTiep(cd: any, cungChu: string, k: KetQuaCung): NhanDinh[] {
    const nhom = new Map<string, { nguon: string; chiNguon: string; rel: QuanHe; saos: string[] }>();
    for (const x of k.sat_xh) {
      const key = `${x.cung}|${x.chi}|${x.quan_he}`;
      const g = nhom.get(key);
      if (g) g.saos.push(x.sao); else nhom.set(key, { nguon: x.cung, chiNguon: x.chi, rel: x.quan_he, saos: [x.sao] });
    }
    const ket: NhanDinh[] = [];
    for (const { nguon, chiNguon, rel, saos: s0 } of nhom.values()) {
      const ht: string | undefined = cd.gian_tiep?.[nguon];
      if (!ht) continue;
      const saos = [...new Set(s0)];
      ket.push({
        id: `XC.${nguon}`, diem: -1.0, cung: cungChu, nhan: saos, cung_nguon: nguon, chi_nguon: chiNguon, quan_he: rel,
        nhan_dinh: `${saos.join(" + ")} từ cung ${nguon} (${chiNguon}) ${rel === "xung" ? "xung" : "hội"} chiếu ${cungChu} (${k.chi}) → ${ht}.`,
        ly_do: `Sát tinh ở ${nguon} (${chiNguon}) nằm ở ${rel === "xung" ? "xung chiếu" : "tam hợp"} của ${cungChu}`,
      });
    }
    return ket;
  }

  chuDe(chamTruoc?: Record<string, KetQuaCung>): Record<string, KetQuaChuDe> {
    const cfg = this.tt.cfg.chu_de;
    const dn = this.tt.cfg.diem_noi_tai;
    const hg = dn.hoa_giai;
    const cham = chamTruoc ?? Object.fromEntries(CUNG_CHUC.map((c) => [c, this.chamCung(c)]));
    const ket: Record<string, KetQuaChuDe> = {};
    for (const [ten, cd] of Object.entries<any>(cfg)) {
      if (ten === "ghi_chu") continue;
      const cungW = Object.entries<number>(cd.cung);
      const tongW = cungW.reduce((a, [, w]) => a + w, 0);
      const chinhCung = Math.max(...cungW.map(([, w]) => w));
      const chuDs = cungW.filter(([, w]) => w === chinhCung).map(([c]) => c);
      let pv = cungW.reduce((a, [c, w]) => a + cham[c].diem100 * w, 0) / tongW;
      const linhVuc = new Set<string>(cd.linh_vuc);
      const giao = (tag: Set<string>) => [...tag].some((t) => linhVuc.has(t));
      const ungVien: NhanDinh[] = [];
      const luuY: NhanDinh[] = [];
      for (const [c, w] of cungW) {
        for (const n of cham[c].nhan_dinh) {
          if (n.luu_y) {
            if (w >= chinhCung) luuY.push({ ...n, cung: c });
            continue;
          }
          if (!n.diem || n.dao_dau) continue;
          let tag = new Set(n.linh_vuc ?? []);
          if (n.id.startsWith("PT.")) {
            const { p } = this.phu(n.id.split(".")[1]);
            tag = new Set(p ? p.tag : []);
          }
          // cung chính của chủ đề: lấy hết; cung phụ: chỉ lấy nhận định có lĩnh vực khớp chủ đề
          if (w < chinhCung && !giao(tag)) continue;
          if (n.id.startsWith("CC") && linhVuc.size && !giao(tag)) continue;
          ungVien.push(this.ganNguon({ ...n, cung: c }, c));
        }
      }
      const sang = ungVien.filter((n) => n.diem > 0);
      const hung = ungVien.filter((n) => n.diem < 0);
      const tot = [...sang].sort((a, b) => -a.diem - -b.diem).slice(0, 3);
      const xau = [...hung].sort((a, b) => a.diem - b.diem).slice(0, 3);
      const gt = chuDs.length === 1 ? chuDs.flatMap((c) => this.gianTiep(cd, c, cham[c])) : [];
      let totHien = tot;
      let xauHien = xau;
      if (cd.tieu_muc) { // chủ đề gộp nhiều cung: tách tiểu mục, mỗi câu mang nhãn cung nguồn
        totHien = [];
        xauHien = [];
        for (const c of chuDs) {
          const nhanTm: string = cd.tieu_muc[c];
          const cuaC = ungVien.filter((n) => n.cung === c);
          totHien.push(...cuaC.filter((n) => n.diem > 0).sort((a, b) => -a.diem - -b.diem).slice(0, 2).map((n) => ({ ...n, nhan_dinh: `${nhanTm}: ${n.nhan_dinh}` })));
          xauHien.push(...cuaC.filter((n) => n.diem < 0).sort((a, b) => a.diem - b.diem).slice(0, 2).map((n) => ({ ...n, nhan_dinh: `${nhanTm}: ${n.nhan_dinh}` })));
        }
      }
      // nhất quán điểm ↔ nội dung: nhiều điểm sáng hơn điểm hung + chính tinh đắc địa thì không được rơi xuống nhãn thấp
      if (sang.length > hung.length && chuDs.some((c) => cham[c].chinh_tinh_dac)) pv = Math.max(pv, dn.san_chu_de_dac);
      // vừa tốt vừa hung rõ: kéo nhãn về vùng giữa (không lấy cực trị) và chèn câu dẫn hòa giải
      let cauDan: string | null = null;
      if (tot.length && xau.length && tot[0].diem >= hg.nguong_diem_sang && xau[0].diem <= hg.nguong_diem_hung) {
        pv = Math.min(Math.max(pv, hg.san), hg.tran);
        const nhan = (n: NhanDinh) => (n.id === "PHI_TUYEN" ? `sát tinh ${(n.nhan ?? []).join(" + ")} quanh ${n.cung}` : `${(n.nhan?.length ? n.nhan : [n.id]).join(" + ")} tại ${n.cung}`);
        cauDan = `Nền tảng có điểm sáng (${nhan(tot[0])}) nhưng cũng có hạn chế (${nhan(xau[0])}); hai mặt cùng tồn tại nên nhãn tổng nằm ở vùng giữa.`;
      }
      const d100 = diem100(pv);
      ket[ten] = { diem100: d100, xep_loai: bac(d100, dn), diem_manh: totHien, diem_yeu: [...xauHien, ...gt], cau_dan: cauDan, luu_y: luuY, cung: Object.fromEntries(cungW.map(([c]) => [c, cham[c].xep_loai])) };
    }
    return ket;
  }
}

/** Điểm cung → thang 1–99 (nội suy từ 4 ngưỡng 10/30/70/90 hiệu chỉnh trên mẫu lá số ngẫu nhiên).
 *  Đây là thang NỘI TẠI để so các cung của cùng một lá số — KHÔNG phải percentile so với dân số lá số thật. */
export function quyDoi(diem: number, nguong: any): number {
  if (!nguong) return 50.0;
  const moc: [number, number][] = [[nguong.xau, 10], [nguong.trung_binh, 30], [nguong.tot, 70], [nguong.rat_tot, 90]];
  if (diem <= moc[0][0]) return Math.max(1.0, 10 * (1 - (moc[0][0] - diem) / Math.max(1e-9, moc[1][0] - moc[0][0])));
  if (diem >= moc[3][0]) return Math.min(99.0, 90 + 10 * (diem - moc[3][0]) / Math.max(1e-9, moc[3][0] - moc[2][0]));
  for (let i = 0; i < 3; i++) {
    const [x0, p0] = moc[i];
    const [x1, p1] = moc[i + 1];
    if (x0 <= diem && diem <= x1) return p0 + (p1 - p0) * (diem - x0) / Math.max(1e-9, x1 - x0);
  }
  return 50.0;
}

/** Làm tròn bội số 5 (tránh ảo giác chính xác của số lẻ), kẹp 5–95. */
export const diem100 = (x: number): number => Math.min(95, Math.max(5, Math.floor(x / 5 + 0.5) * 5));

/** 6 bậc: Rất thấp / Thấp / Trung bình / Khá / Tốt / Rất tốt (ngưỡng trong cau_hinh_luan_giai.json → diem_noi_tai.bac). */
export function bac(d100: number, dn: any): string {
  for (const [han, ten] of dn.bac as [number, string][]) if (d100 < han) return ten;
  return dn.bac[dn.bac.length - 1][1];
}

/** Toàn bộ kết quả luận dạng đối tượng (đầu vào cho phần viết văn và giao diện). */
export function baoCao(lg: LuanGiai, namSinh?: number, namXem?: number): BaoCao {
  const cham: Record<string, KetQuaCung> = Object.fromEntries(CUNG_CHUC.map((c) => [c, lg.chamCung(c)]));
  const kq: BaoCao = {
    la_so: { input: lg.ls.input, am_duong_nam_nu: lg.ls.am_duong_nam_nu, ban_menh: lg.ls.ban_menh, cuc: lg.ls.cuc },
    menh_tai: CHI[lg.ls.menh], nen: lg.nen(), than: lg.than(),
    cung: Object.fromEntries(THU_TU_CUNG.map((c) => [c, cham[c]])), chu_de: lg.chuDe(cham),
  };
  if (namSinh && namXem) kq.han = { ...lg.han(namSinh, namXem), nam_xem: namXem };
  return kq;
}
