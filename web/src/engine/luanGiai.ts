// Bộ luận giải — port 1:1 từ tools/tuvi/luan_giai.py (xem docs/06, docs/07). test/parity.test.ts so khớp báo cáo với Python.
import { anLaSo, CAN, canCung, CHI, CUNG_CHUC, mv, theoCung, type LaSo } from "./anSao";
import { triThuc, type CachCuc, type Dk, type TriThuc } from "./kb";
import { pyRound, toFixedPy } from "./py";
import type { BaoCao, MocDaiHan, KetQuaChuDe, KetQuaCung, KetQuaHan, KetQuaThan, NhanDinh, PhanTichDiem, QuanHe } from "./types";

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
    // điều kiện xuyên cung: đánh giá dk.dk tại cung chức khác (theo tên) của chính lá số này
    if ("cung_chuc" in dk) return this.khop(dk.dk, this.chiCua.get(dk.cung_chuc)!);
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
    if ("than_cu" in dk) return (this.ls.than === chi) === dk.than_cu;
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
    // chính tinh thủ Mệnh vs Bản Mệnh — mỗi câu có vế HỆ QUẢ cho đương số ('Mệnh X sinh/khắc Sao Y → mô tả → hệ quả')
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

  private cauTuanTrietCung(tenCung: string, tuanTriet: readonly string[]): string {
    const rieng: string | undefined = tuanTriet.length === 1 ? this.tt.lienCung.tuan_triet_theo_cung[tenCung]?.[tuanTriet[0]] : undefined;
    return rieng ?? this.cauTuanTriet(tenCung, tuanTriet, true);
  }

  /** Bảng vai_nguoi (luan_lien_cung.json): mỗi sao × vai người × tình trạng (Hóa Kỵ/Lộc/Quyền/Khoa, hãm, miếu/vượng) → câu ở cung của vai, nếu cung đó khác cung chứa sao. */
  private vaiNguoi(tenCung: string): NhanDinh[] {
    const bang = this.tt.lienCung.vai_nguoi;
    const ket: NhanDinh[] = [];
    for (const [sao, vais] of Object.entries<[string, string][]>(bang.sao)) {
      const chiSao = this.ls.sao[sao];
      if (chiSao === undefined || this.ls.cung_chuc[chiSao] === tenCung) continue;
      const muc = this.tt.sang(sao, chiSao);
      for (const [tt, dk] of Object.entries<any>(bang.tinh_trang)) {
        const dung = dk.hoa ? this.gocHoa[dk.hoa] === sao : muc !== null && (dk.sang as string[]).includes(muc);
        if (!dung) continue;
        for (const [vai, cung] of vais) {
          if (cung !== tenCung) continue;
          ket.push({
            id: `LC.vai.${sao}.${tt}`, diem: 0, luu_y: true, ly_do: `${sao} ${dk.nhan} ở ${this.ls.cung_chuc[chiSao]} (${CHI[chiSao]}); ${sao} ứng với ${vai}`,
            nhan_dinh: (dk.cau as string).replace("{sao}", sao).replace("{cung_sao}", this.ls.cung_chuc[chiSao]).replace("{chi}", CHI[chiSao]).replace("{vai}", vai),
            ...this.nguon(this.chiCua.get(tenCung)!, "ban_cung", []), // sao nằm ở cung khác: nguồn ghi ở chính cung vai, câu tự nêu rõ sao và cung của nó
          });
        }
      }
    }
    return ket;
  }

  /** pham_vi của cách: tên cung, danh sách tên cung, hoặc "*" (mọi cung). Mặc định Mệnh. */
  private trongPhamVi(pv: string | string[] | undefined, tenCung: string): boolean {
    return [pv ?? "Mệnh"].flat().some((x) => x === "*" || x === tenCung);
  }

  /** Câu Tuần/Triệt gắn đúng cung bị án (Triệt cắt mạnh nửa đầu đời, Tuần cản chậm; cả hai thì nói cả hai). */
  private cauTuanTriet(tenCung: string, tuanTriet: readonly string[], ngan = false): string {
    const m = this.tt.cfg.tuan_triet[ngan ? "mau_ngan" : "mau"];
    return (m[tuanTriet.length === 2 ? "ca_hai" : tuanTriet[0]] as string).replace("{cung}", tenCung);
  }

  /** Bỏ mệnh đề nói về lĩnh vực không thuộc cung (VD 'tình cảm rắc rối' ở Phụ Mẫu). Áp cho câu tổ hợp Tứ Hóa / fallback chung, không áp cho câu riêng (sao × cung). */
  private locMien(txt: string | undefined, tenCung: string): string {
    const cfg = this.tt.cfg;
    const giu = (txt ?? "").split(/(?<=[.;])\s+/).filter((m) =>
      Object.entries<string>(cfg.mien_tu_khoa).every(([k, pat]) => k.startsWith("_") || !new RegExp(pat).test(m.toLowerCase()) || (cfg.mien_cung[k] as string[]).includes(tenCung)));
    const out = giu.join(" ").replace(/;+$/, "").trimEnd();
    return !out || ".!?".includes(out[out.length - 1]) ? out : `${out}.`;
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

  /** Các câu của MỘT cung nói ngược nhau về cùng một trục (VD số lượng anh chị em: Thiên Phủ báo đông, Vũ Khúc báo ít) không được
   *  để cạnh nhau như hai khẳng định riêng. Với mỗi trục có cả phía dương lẫn phía âm:
   *   · đúng MỘT phía có cách cục (đọc theo cụm sao) → cách cục thắng: ẩn các câu đơn lẻ của phía ngược lại, ghi vào ly_do của cách;
   *   · còn lại → ẩn các câu gốc và thêm MỘT câu "trái chiều" (id XD.<cung>.<trục>, không tính điểm mạnh/yếu, xếp vào "lưu ý").
   *  Câu bị ẩn (`an`) vẫn nằm trong danh sách để điểm và phép đếm §4.8 không đổi. Bản sao của hoa_giai_truc (Python). */
  private hoaGiaiTruc(tenCung: string, chi: number, nhanDinh: NhanDinh[]): void {
    const laCach = (n: NhanDinh) => /^CC\d+$/.test(n.id);
    const tenNguon = (n: NhanDinh) => {
      if (laCach(n)) { const m = /^\[(.+?)(?: — PHÁ CÁCH)?\]/.exec(n.nhan_dinh); return m ? `«${m[1]}»` : n.id; } // «tên cách cục»
      return n.id.split(".")[1];
    };
    const trich = (n: NhanDinh) => `${tenNguon(n)}: «${n.nhan_dinh.split(". ")[0].replace(/\.+$/, "")}»`;
    for (const t of this.tt.truc[tenCung] ?? []) {
      const dp: NhanDinh[] = [];
      const am: NhanDinh[] = [];
      for (const n of nhanDinh) {
        if (!/^(CT|PT)\./.test(n.id) && !laCach(n)) continue;
        if (t.duong.cau.some((c) => n.nhan_dinh.startsWith(c))) dp.push(n);
        else if (t.am.cau.some((c) => n.nhan_dinh.startsWith(c))) am.push(n);
      }
      if (!dp.length || !am.length) continue;
      const cachDp = dp.filter(laCach);
      const cachAm = am.filter(laCach);
      if (!!cachDp.length !== !!cachAm.length) {
        const thang = cachDp.length ? cachDp : cachAm;
        const thua = (cachDp.length ? am : dp).filter((n) => !laCach(n));
        for (const n of thua) n.an = true;
        for (const n of thang) n.ly_do += `; thay cho câu đơn lẻ nói ngược về «${t.ten}»: ` + thua.map(trich).join("; ");
        continue;
      }
      const sao = (ds: NhanDinh[]) => [...new Set(ds.map(tenNguon))].join(", ");
      for (const n of [...dp, ...am]) n.an = true;
      nhanDinh.push({
        id: `XD.${tenCung}.${t.id}`, diem: 0.0, luu_y: true,
        nhan_dinh: t.xd
          ? t.xd.replace("{duong}", t.duong.nhan).replace("{sao_duong}", sao(dp)).replace("{am}", t.am.nhan).replace("{sao_am}", sao(am))
          : `${t.ten}: các sao tác động lên cung này nói ngược nhau — ${t.duong.nhan} (${sao(dp)}) và ${t.am.nhan} (${sao(am)}); nên không kết luận chắc về mục này.`,
        ly_do: "Câu gốc được gộp: " + [...dp, ...am].map(trich).join("; "),
        ...this.nguon(chi, "ban_cung", [...new Set([...dp, ...am].map(tenNguon))]),
      });
    }
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

  // ---------- Công thức điểm một cung (spec scoring v3 §4)
  /** score = START + BASE_CHINH_TINH(chỉ bản cung) + CAT − SAT (+ điều chỉnh cách cục) → NÉN Tuần/Triệt về START → sàn chính tinh miếu/vượng → kẹp + làm tròn. Trả về toàn bộ khoản (§4.9). */
  private diemV3(chi: number, chu: string[], chiChu: number, muon: boolean, tuanTriet: readonly string[], cachAdj0: number) {
    const cfg = this.tt.cfg;
    const v = cfg.diem_v3;
    const sat7 = new Set<string>(cfg.sat_tinh.sat);
    const banSat = new Set<string>(cfg.sat_tinh.ban_sat);
    const catSet = new Set<string>(this.tt.nhom.cat_tinh);
    const hoaCat = ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa"];
    const mangHoaCat = new Set<string | undefined>(hoaCat.map((h) => this.gocHoa[h]));
    const vung: [number, QuanHe][] = this.vung(chi, "tam_phuong").map((c) => [c, c === chi ? "ban_cung" : c === mv(chi, 6) ? "xung" : "tam_hop"]);

    const base = chu.map((s) => {
      const m = this.tt.sang(s, chiChu) ?? "khong_ro";
      const cuu = m === "H" && mangHoaCat.has(s); // hãm nhưng đang mang Hóa cát: không bị trừ (§15.3)
      return { sao: s, do_sang: m, diem: cuu ? 0 : (v.base[m] as number), hoa_cuu: cuu };
    });
    const sumBase = base.reduce((a, b) => a + b.diem, 0);
    const tongBase = Math.min(Math.max(sumBase, v.base_cap[0]), v.base_cap[1]) * (muon ? cfg.vo_chinh_dieu.he_so : 1.0);

    const cat: { sao: string; cung: string; vi_tri: string; diem: number }[] = [];
    const sat: { sao: string; cung: string; vi_tri: string; diem: number }[] = [];
    const catXhGoc: [string, number, QuanHe, number][] = [];
    for (const [c, o] of vung) {
      for (const s of this.cung[c]) {
        if (CHINH_TINH.includes(s)) continue;
        const { p, heSo: hl } = this.phu(s);
        if (!p) continue;
        if (catSet.has(p.ten)) {
          const x = v.cat[o] * (hoaCat.includes(p.ten) ? v.cat_hoa_nhan : 1.0) * (this.tt.sang(p.ten, c) === "H" ? v.cat_ham_he_so : 1.0) * hl;
          cat.push({ sao: s, cung: CHI[c], vi_tri: o, diem: pyRound(x, 2) });
          if (o !== "ban_cung") catXhGoc.push([p.ten, c, o, x]);
        } else if (sat7.has(p.ten) || banSat.has(p.ten)) {
          let x = v.sat[o] * (banSat.has(p.ten) ? v.sat_ban_sat_he_so : 1.0);
          x *= (p.dac_dia ?? []).includes(CHI[c]) ? v.sat_dac : this.tt.sang(p.ten, c) === "H" ? v.sat_ham : 1.0;
          sat.push({ sao: s, cung: CHI[c], vi_tri: o, diem: pyRound(x * hl, 2) });
        }
      }
    }
    const tongCat = Math.min(cat.reduce((a, x) => a + x.diem, 0), v.cat_cap);
    const tongSat = Math.max(sat.reduce((a, x) => a + x.diem, 0), v.sat_cap);
    const cachAdj = Math.max(-v.cach_cuc.cap, Math.min(v.cach_cuc.cap, cachAdj0 * v.cach_cuc.he_so));

    const raw = v.start + tongBase + tongCat + tongSat + cachAdj;
    let k = 1.0;
    if (tuanTriet.includes("Triệt")) k *= v.nen["Triệt"];
    if (tuanTriet.includes("Tuần")) k *= v.nen["Tuần"];
    const raw2 = v.start + (raw - v.start) * k; // NÉN về giữa: cung tốt bị Triệt hạ xuống, cung xấu bị Triệt nâng lên
    const nMv = muon ? 0 : base.filter((b) => b.do_sang === "M" || b.do_sang === "V").length;
    let san: number = nMv >= 2 ? v.san.n2 : nMv === 1 ? v.san.n1 : 0;
    if (san) san -= (tuanTriet.includes("Triệt") ? v.san.tru_triet : 0) + (tuanTriet.includes("Tuần") ? v.san.tru_tuan : 0);
    const score = san ? Math.max(raw2, san) : raw2;
    const d100 = diem100(score, v.kep);
    const phanTich: PhanTichDiem = {
      cung_chu: CHI[chi], tap_ban_cung: [...this.cung[chi]], tap_xung: [...this.cung[mv(chi, 6)]],
      tap_tam_hop: [mv(chi, 4), mv(chi, -4)].flatMap((c) => this.cung[c]),
      base, tong_base: pyRound(tongBase, 2), vo_chinh_dieu: muon, cat, tong_cat: pyRound(tongCat, 2), sat, tong_sat: pyRound(tongSat, 2),
      cach_cuc: pyRound(cachAdj, 2), raw_truoc_triet: pyRound(raw, 2), k_triet_tuan: pyRound(k, 3), raw_sau_triet: pyRound(raw2, 2),
      n_chinh_tinh_mv: nMv, san_ap_dung: san, score_cuoi: d100,
    };
    return { d100, raw2, phanTich, catXh: catXhGoc };
  }

  // ---------- Lớp 2-3: chấm 1 cung
  /** Chấm cung chức `tenCung` (mặc định tại vị trí trên lá số gốc; truyền `chiTruyen` để chấm cung đại hạn/lưu niên).
   *  Điểm do diemV3 quyết định; phần dưới tạo CÂU luận (mỗi câu mang `diem` để xếp điểm sáng/hạn chế, không cộng thành điểm cung). */
  chamCung(tenCung: string, chiTruyen?: number): KetQuaCung {
    const chi = chiTruyen ?? this.chiCua.get(tenCung)!;
    const cfg = this.tt.cfg;
    const boQuaNho = new Set<string>(cfg.sao_nho.bo_qua);
    const tsvt = cfg.trong_so_vi_tri;
    const w: Record<string, number> = { ...tsvt, xung: tsvt.xung_chieu };
    const hs = cfg.he_so_do_sang;
    const pt = cfg.phi_tuyen;
    const satSet = new Set<string>([...cfg.sat_tinh.sat, ...cfg.sat_tinh.ban_sat]);
    const nhanDinh: NhanDinh[] = [];
    const chiTiet: [string, string, string, number][] = [];
    const satBan: [string, number][] = [];
    const satXh: [string, number, string][] = []; // sát tinh thật sự gây hại (sát đắc địa không tính), tách theo vị trí — nguồn của câu cảnh báo

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
    const mangHoaCat = new Set<string | undefined>(["Hóa Lộc", "Hóa Quyền", "Hóa Khoa"].map((h) => this.gocHoa[h]));

    // chính tinh chủ
    for (const s of chu) {
      const muc = this.tt.sang(s, chiChu) ?? "khong_ro";
      const [hop, txtSang, txtHam] = this.tt.maTran[s][tenCung];
      const cuu = muc === "H" && mangHoaCat.has(s); // hãm nhưng đang mang Hóa cát: không xếp vào hạn chế (§15.3)
      // điểm CÂU: hãm luôn âm (độ lớn tăng theo mức cung chức 'gọi' sao ra); hãm mang Hóa cát = trung tính
      const d = cuu ? 0.0 : (muc === "H" ? hs[muc] * (1 + Math.abs(hop)) : hs[muc] * (1 + hop)) * heSoVcd * cfg.he_so_chinh_tinh_chu;
      chiTiet.push([s, CHI[chiChu], muc, pyRound(d, 2)]);
      nhanDinh.push({
        id: `CT.${s}.${tenCung}`, diem: pyRound(d, 2), nhan_dinh: muc === "H" ? txtHam : txtSang,
        ly_do: `${s} (${muc}) tại ${CHI[chiChu]}, hợp cung ${dauSo(hop)}` + (tuanTriet.length ? `, gặp ${tuanTriet.join("/")}` : "")
          + (cuu ? "; hãm nhưng đang mang Hóa cát nên không tính là hạn chế" : "")
          + (muon ? `; mượn từ cung ${this.ls.cung_chuc[chiChu]} xung chiếu` : ""),
        ...this.nguon(chiChu, muon ? "xung" : "ban_cung", [s]),
      });
    }

    // bộ sao tại chi (chỉ luận chi tiết cho Mệnh)
    if (tenCung === "Mệnh" && chu.length) {
      for (const bo of this.tt.boSao.bo_sao) {
        if (sapXep(bo.bo) === sapXep(chu) && (bo.chi as string[]).includes(CHI[chiChu])) {
          const dc: number = bo.dieu_chinh?.[CHI[chiChu]] ?? 0;
          const txt = bo.chung + (CHI[chiChu] in bo.theo_chi ? ` ${bo.theo_chi[CHI[chiChu]]}` : "");
          nhanDinh.push({
            id: `BO.${(bo.bo as string[]).join("+")}.${CHI[chiChu]}`, diem: dc, nhan_dinh: txt, ly_do: `Bộ ${(bo.bo as string[]).join(" + ")} tại ${CHI[chiChu]}`,
            ...this.nguon(chiChu, muon ? "xung" : "ban_cung", [...bo.bo]),
          });
        }
      }
    }

    // phụ tinh trong tam phương (điểm CÂU; thứ tự duyệt giữ như Python: bản cung, tam hợp, tam hợp, xung)
    const vungTp: [number, QuanHe][] = this.vung(chi, "tam_phuong").map((c) => [c, c === chi ? "ban_cung" : c === mv(chi, 6) ? "xung" : "tam_hop"]);
    for (const [c, o] of vungTp) {
      for (const s of this.cung[c]) {
        if (CHINH_TINH.includes(s)) continue;
        const { p, heSo: heSoLuu } = this.phu(s);
        if (!p) continue;
        let base = (cfg.diem_cham_rieng[p.ten] ?? p.diem) * heSoLuu;
        if (c === chi) base *= cfg.phan_cuc_rieng[`${p.ten}|${tenCung}`] ?? 1; // câu riêng trung tính/hỗn hợp/ngược dấu thì điểm theo câu
        const dac = (p.dac_dia ?? []).includes(CHI[c]);
        const daoDau = base < 0 && dac; // sát tinh đắc địa: giảm hại nhưng câu luận vẫn mô tả cả hai mặt
        const ham = base > 0 && this.tt.sang(p.ten, c) === "H";
        if (base < 0 && dac) base = base * 0.3;
        else if (ham) base = base * 0.3; // cát tinh hãm địa (VD Xương Khúc): còn ít lực
        if (Math.abs(p.diem) <= 1) base *= cfg.he_so_phu_tinh_nho;
        const wo: number = base < 0 && (pt.sao_pha as string[]).includes(p.ten) ? pt.trong_so[o] : w[o];
        const d = base * wo;
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
            const hop = this.locMien(this.tt.tuHoa[khoa], tenCung);
            txt = (txt ? `${txt} ` : "") + (hop || (txt ? "" : this.locMien(p.y_nghia, tenCung)));
          }
          const nd = (txt || this.locMien(p.y_nghia, tenCung) || `${gocTen} tại ${tenCung}: chưa có luận riêng cho cung này.`).trim();
          const lon = Math.abs(p.diem) >= 2 || gocTen.startsWith("Hóa") || heSoLuu !== 1.0;
          if (lon || !boQuaNho.has(gocTen)) { // phụ tinh ±1 cũng phải được luận (Thiên Mã, Thiên Khốc…): đánh dấu nho, không tính điểm mạnh/yếu
            const nhan: NhanDinh = {
              id: `PT.${s}` + (gocTen in this.tt.phuCung ? `.${tenCung}` : ""), diem: pyRound(d, 2), nhan_dinh: nd,
              ly_do: `${s} thủ ${tenCung} tại ${CHI[c]}` + (daoDau ? " (đắc địa: giảm hại)" : dac ? " (đắc địa)" : ham ? " (hãm địa — lực yếu)" : ""),
              ...this.nguon(c, o, [s]),
            };
            if (!lon) nhan.nho = true;
            if (daoDau) nhan.dao_dau = true;
            nhanDinh.push(nhan);
          }
        }
      }
    }

    // Tuần Triệt
    if (tuanTriet.length) {
      nhanDinh.push({
        id: "TT", diem: 0, luu_y: true, ly_do: `${tuanTriet.join("/")} tại ${CHI[chi]}`,
        nhan_dinh: this.cauTuanTrietCung(tenCung, tuanTriet),
        ...this.nguon(chi, "ban_cung", [...tuanTriet]),
      });
      // Hóa Lộc/Quyền/Khoa/Kỵ nằm cùng cung bị Tuần/Triệt: mỗi Hóa một câu (bảng tuan_triet_hoa, chạy cho mọi cung)
      for (const [hoa, mau] of Object.entries<string>(this.tt.lienCung.tuan_triet_hoa)) {
        if (this.cung[chi].includes(hoa)) {
          nhanDinh.push({
            id: `LC.tt_hoa.${hoa}`, diem: 0, luu_y: true, ly_do: `${hoa} và ${tuanTriet.join("/")} cùng ở ${tenCung} (${CHI[chi]})`,
            nhan_dinh: mau.replace("{tt}", tuanTriet.join("/")).replace("{cung}", tenCung),
            ...this.nguon(chi, "ban_cung", [hoa, ...tuanTriet]),
          });
        }
      }
    }
    // Sao → người: sao hãm hoặc mang Hóa Kỵ nói thêm ở cung của vai người đó (không áp cho cung đại hạn/lưu niên)
    if (chiTruyen === undefined) nhanDinh.push(...this.vaiNguoi(tenCung));

    // Cung vô chính diệu (trừ Mệnh) mà còn bị Tuần/Triệt: điểm gần như chỉ dựa vào cát tinh chiếu từ cung khác → nói rõ độ vững thấp hơn con số
    if (muon && tuanTriet.length && tenCung !== "Mệnh") {
      nhanDinh.push({
        id: "VCD_TT", diem: 0, luu_y: true,
        nhan_dinh: `${tenCung} vừa vô chính diệu vừa bị ${tuanTriet.join("/")}: điểm số dựa chủ yếu vào sao chiếu từ cung khác nên độ vững thấp hơn con số; đừng đọc điểm này như một nền vững.`,
        ly_do: `${tenCung} tại ${CHI[chi]} không có chính tinh và có ${tuanTriet.join("/")}`,
        ...this.nguon(chi, "ban_cung", ["vô chính diệu", ...tuanTriet]),
      });
    }

    // Cách cục — tính hết rồi giảm dần: cách mạnh nhất tính đủ, các cách cùng dấu sau đó nhân hệ số giảm (tránh đếm đôi cùng một sao)
    const cach: { cc: CachCuc; biPha: boolean; d: number }[] = [];
    for (const cc of this.tt.cach) {
      if (!this.trongPhamVi(cc.pham_vi, tenCung) || !this.khop(cc.thanh, chi)) continue;
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
      cach.push({ cc, biPha, d });
    }
    const gd: number[] = cfg.cach_cuc_giam_dan.he_so;
    const he = new Map<number, number>();
    for (const ds of [cach.map((_, i) => i).filter((i) => cach[i].d > 0), cach.map((_, i) => i).filter((i) => cach[i].d < 0)]) {
      [...ds].sort((a, b) => Math.abs(cach[b].d) - Math.abs(cach[a].d)).forEach((i, r) => he.set(i, gd[Math.min(r, gd.length - 1)]));
    }
    let cachAdj = 0.0;
    cach.forEach(({ cc, biPha, d: d0 }, i) => {
      const hs1 = he.get(i) ?? 1.0;
      const d = pyRound(d0 * hs1, 2);
      const dienCung = (t: string) => t.replace("{cung_xung}", this.ls.cung_chuc[mv(chi, 6)]).replace("{cung}", tenCung);
      const ketLuan = dienCung(cc.ket_luan_theo_cung?.[tenCung] ?? cc.ket_luan);
      cachAdj += d;
      nhanDinh.push({
        id: cc.id, diem: d, linh_vuc: cc.linh_vuc ?? [],
        nhan_dinh: `[${cc.ten}${biPha ? " — PHÁ CÁCH" : ""}] ` + (biPha ? (dienCung(cc.ket_luan_pha ?? "") || `Gặp từ 2 sát tinh/Hóa Kỵ ở bản cung và xung chiếu: cách bị giảm nhiều. ${ketLuan}`) : ketLuan),
        ly_do: "Thỏa điều kiện cách cục" + (biPha ? " nhưng gặp điều kiện phá" : "") + (cc.xac_nhan_web ? "" : " (cách chưa xác nhận nguồn web)")
          + (hs1 < 1.0 ? `; nhiều cách cùng dấu nên tính ${toFixedPy(hs1 * 100, 0)}%` : ""),
        ...this.nguon(chi, "ban_cung", [`«${cc.ten}»`]),
      });
    });

    // ĐIỂM (spec v3)
    const { d100, raw2, phanTich, catXh } = this.diemV3(chi, chu, chiChu, muon, tuanTriet, cachAdj);

    // câu sát tinh quanh cung: chỉ khi THẬT SỰ có sát tinh; điểm câu = điểm sát v3 / 2.5 cho cùng thang với các câu khác
    const thucSat = new Set<string>(cfg.sat_tinh.sat);
    const tatCa = [...satBan.map((x) => x[0]), ...satXh.map((x) => x[0])];
    const dungSat = tatCa.some((x) => thucSat.has(x)) || new Set(tatCa).size >= 2; // một bán-sát lẻ (Thiên Hình/Thiên Diêu) không đủ để cảnh báo
    if (dungSat) {
      nhanDinh.push({
        id: "PHI_TUYEN", diem: pyRound(phanTich.tong_sat / 2.5, 2), nhan_dinh: this.cauSat(tenCung, satBan, satXh),
        ly_do: `Tổng điểm sát tinh ${toFixedPy(phanTich.tong_sat, 1)} (bản cung −5 · xung −3 · tam hợp −2, nhân trạng thái)`,
        ...this.nguon(chi, "ban_cung", [...new Set([...satBan.map((x) => x[0]), ...satXh.map((x) => x[0])])]),
      });
    }

    const tongCatXh = catXh.reduce((a, x) => a + x[3], 0);
    if (catXh.length >= 1 && tongCatXh >= cfg.diem_noi_tai.nguong_cat_xung_hoi) {
      const nhomC = new Map<string, { c: number; o: string; ds: string[] }>();
      for (const [sao, c, o] of catXh) {
        const k = `${c}|${o}`;
        const g = nhomC.get(k);
        if (g) g.ds.push(sao); else nhomC.set(k, { c, o, ds: [sao] });
      }
      const dsC = [...nhomC.values()].map(({ c, o, ds }) => `${[...new Set(ds)].join(", ")} ở ${this.ls.cung_chuc[c]} (${CHI[c]}), ${o === "xung" ? "xung" : "hội"} chiếu`).join("; ");
      nhanDinh.push({
        id: "CAT_XH", diem: pyRound(tongCatXh / 2.5, 2), nhan_dinh: `Cát tinh từ xung/hội chiếu (${dsC}) → cung ${tenCung} được nâng đỡ.`,
        ly_do: `Tổng điểm cát tinh xung/hội chiếu ${toFixedPy(tongCatXh, 1)}`,
        ...this.nguon(chi, "ban_cung", [...new Set(catXh.map((x) => x[0]))]),
      });
    }

    this.hoaGiaiTruc(tenCung, chi, nhanDinh);
    // mọi câu (bất kể nguồn: chính tinh, phụ tinh, bộ sao, cách cục) chỉ giữ nhánh đúng giới tính
    for (const n of nhanDinh) n.nhan_dinh = chonGioi(n.nhan_dinh, this.ls.input.gioi_tinh);
    const sangChu = chu.map((s) => this.tt.sang(s, chiChu));
    return {
      cung: tenCung, chi: CHI[chi], diem: pyRound(raw2, 2), diem100: d100, xep_loai: bac(d100, cfg.diem_noi_tai),
      sat_xh: !dungSat ? [] : satXh.map(([sao, c, o]) => ({ sao, cung: this.ls.cung_chuc[c], chi: CHI[c], quan_he: o as QuanHe })),
      phan_tich: phanTich, chinh_tinh_sang: chu.map((s, i) => [s, sangChu[i]] as [string, string | null]),
      muon_tu: muon ? [this.ls.cung_chuc[chiChu], CHI[chiChu]] as [string, string] : null, chinh_tinh_dac: sangChu.some((m) => m === "M" || m === "V" || m === "Đ"),
      chinh_tinh: chinh, tuan_triet: [...tuanTriet], nhan_dinh: nhanDinh, chi_tiet_diem: chiTiet,
    };
  }

  // ---------- Thân
  than(): KetQuaThan {
    const ten = this.ls.cung_chuc[this.ls.than];
    const k = this.chamCung(ten);
    const m = this.chamCung("Mệnh");
    // Triệt mạnh nửa đầu đời, Tuần mạnh sau ~30 tuổi (cấu hình tuan_triet): điểm số hai cung không thấy được điều này nên phải nói thêm,
    // nếu không "tương đương" sẽ đá với câu "Triệt án Mệnh" ở mục Nền.
    const tienKem = m.tuan_triet.includes("Triệt");
    const hauKem = m.tuan_triet.includes("Tuần") || k.tuan_triet.includes("Tuần");
    const them = tienKem && hauKem ? " Tuy vậy Mệnh bị Triệt án nên tiền vận (trước ~30 tuổi) nhiều cản trở, còn Tuần cũng cản hậu vận; cả hai giai đoạn đều cần kiên trì."
      : tienKem ? " Mệnh bị Triệt án nên tiền vận (trước ~30 tuổi) nhiều cản trở hơn; Triệt nhạt dần sau khoảng 30 tuổi."
      : hauKem ? " Tuần án (Mệnh/Thân) nên từ khoảng 30 tuổi trở đi có nhiều cản trở hơn tiền vận." : "";
    const so = (k.diem100 - m.diem100 >= 15 ? "Hậu vận (sau ~30 tuổi) khá hơn tiền vận." : m.diem100 - k.diem100 >= 15 ? "Hậu vận kém tiền vận, cần giữ những gì đã gây dựng." : them ? "Điểm số hai giai đoạn gần nhau." : "Tiền vận và hậu vận tương đương.") + them;
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
        const noiBat = v.nhan_dinh.filter((n) => !n.an && !n.nho).sort((a, b) => -Math.abs(a.diem) - -Math.abs(b.diem)).slice(0, 3);
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

  /** Câu 'cung chủ': mọi chính tinh của cung chủ kèm độ sáng (hoặc vô chính diệu + sao mượn). Luôn có, để người đọc thấy khung của cung kể cả khi chính tinh điểm 0. */
  private khungChuDe(cd: any, chuDs: string[], cham: Record<string, KetQuaCung>): string {
    const tenSang: Record<string, string> = { M: "miếu", V: "vượng", Đ: "đắc", B: "bình", H: "hãm" };
    const out = chuDs.map((c) => {
      const k = cham[c];
      const sao = k.chinh_tinh_sang.map(([s, m]) => `${s} (${m ? tenSang[m] ?? m : "chưa rõ độ sáng"})`).join(" + ") || "không có chính tinh";
      const nhanTm: string | undefined = cd.tieu_muc?.[c];
      const dau = nhanTm ? `${nhanTm} — cung ${c} (${k.chi})` : `Cung chủ ${c} (${k.chi})`;
      const thanCu = this.ls.cung_chuc[this.ls.than] === c ? " — cũng là cung Thân cư, hậu vận gắn chặt với mục này" : "";
      return `${dau}: ` + (k.muon_tu ? `vô chính diệu, mượn ${sao} từ cung ${k.muon_tu[0]} (${k.muon_tu[1]}) xung chiếu` : sao) + thanCu;
    });
    return `${out.join("; ")}.`;
  }

  chuDe(chamTruoc?: Record<string, KetQuaCung>): Record<string, KetQuaChuDe> {
    const cfg = this.tt.cfg.chu_de;
    const dn = this.tt.cfg.diem_noi_tai;
    const cfgNho = this.tt.cfg.sao_nho;
    const uuTien = new Map<string, number>(cfgNho.uu_tien.map((t: string, i: number) => [t, i]));
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
      const trungTinh: NhanDinh[] = [];
      const saoNho: NhanDinh[] = [];
      for (const [c, w] of cungW) {
        const nhoC: NhanDinh[] = [];
        for (const n of cham[c].nhan_dinh) {
          if (n.nho) { // phụ tinh ±1: chỉ cung chủ, không vào điểm/đếm; xếp theo ưu tiên rồi cắt
            if (w >= chinhCung && !n.an) nhoC.push({ ...n, cung: c });
            continue;
          }
          if (n.luu_y) {
            if (w >= chinhCung) luuY.push({ ...n, cung: c });
            continue;
          }
          if (!n.diem && /^(CT|PT)\./.test(n.id) && w >= chinhCung) { // chính tinh/phụ tinh cung chủ có điểm đúng 0 vẫn phải được luận
            if (!n.an) trungTinh.push(this.ganNguon({ ...n, cung: c }, c)); // câu đã gộp vào câu "trái chiều" (XD.*) thì không nhắc lại
            continue;
          }
          if (!n.diem) continue;
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
        nhoC.sort((a, b) => (uuTien.get(a.id.split(".")[1]) ?? uuTien.size) - (uuTien.get(b.id.split(".")[1]) ?? uuTien.size)); // sort ổn định: cùng ưu tiên giữ thứ tự gốc
        saoNho.push(...nhoC.slice(0, cfgNho.toi_da_moi_cung));
      }
      // cách cục của cung Mệnh vào mọi chủ đề có lĩnh vực trùng nhãn của cách (nghề/tài/danh/quyền…); chỉ thêm câu, điểm chủ đề vẫn theo trọng số cung
      if (!(("Mệnh") in cd.cung) && linhVuc.size) {
        for (const n of cham["Mệnh"].nhan_dinh) {
          if (n.id.startsWith("CC") && n.diem && !n.an && giao(new Set(n.linh_vuc ?? []))) ungVien.push({ ...n, cung: "Mệnh" });
        }
      }
      const sang = ungVien.filter((n) => n.diem > 0);
      const hung = ungVien.filter((n) => n.diem < 0);
      // ĐẾM (điểm, §4.8) dùng cả câu đã bị gộp; HIỂN THỊ chỉ dùng câu còn hiện (câu "trái chiều" XD.* đã thay chỗ chúng)
      const hien = ungVien.filter((n) => !n.an);
      const tot = chonTop(sang.filter((n) => !n.an), 3, 1);
      const xau = chonTop(hung.filter((n) => !n.an), 3, -1);
      const gt = chuDs.length === 1 ? chuDs.flatMap((c) => this.gianTiep(cd, c, cham[c])) : [];
      let totHien = tot;
      let xauHien = xau;
      if (cd.tieu_muc) { // chủ đề gộp nhiều cung: tách tiểu mục, mỗi câu mang nhãn cung nguồn
        totHien = [];
        xauHien = [];
        for (const c of chuDs) {
          const nhanTm: string = cd.tieu_muc[c];
          const cuaC = hien.filter((n) => n.cung === c);
          totHien.push(...chonTop(cuaC.filter((n) => n.diem > 0), 2, 1).map((n) => ({ ...n, nhan_dinh: `${nhanTm}: ${n.nhan_dinh}` })));
          xauHien.push(...chonTop(cuaC.filter((n) => n.diem < 0), 2, -1).map((n) => ({ ...n, nhan_dinh: `${nhanTm}: ${n.nhan_dinh}` })));
        }
      }
      // §4.8 khớp điểm ↔ nội dung: sáng ≥ 2×hung và có chính tinh miếu/vượng (hoặc không có hung mà có chính tinh đắc) → nhãn ≥ khá; hung ≥ 2×sáng → nhãn ≤ trung bình
      const kh = dn.khop_noi_dung;
      const sN = sang.length;
      const hN = hung.length;
      const coMv = chuDs.some((c) => cham[c].phan_tich.n_chinh_tinh_mv >= 1);
      const canKha = sN >= 1 && sN >= 2 * hN && (coMv || (hN === 0 && chuDs.some((c) => cham[c].chinh_tinh_dac)));
      const canTb = hN >= 1 && hN >= 2 * sN;
      const kiemKhop = { sang: sN, hung: hN, vi_pham_kha: canKha && diem100(pv) < kh["khá_tran"], vi_pham_tb: canTb && diem100(pv) > kh.tb_tran };
      if (canKha) pv = Math.max(pv, kh["khá_tran"]);
      if (canTb) pv = Math.min(pv, kh.tb_tran);
      // nội dung người đọc thấy (điểm mạnh và điểm yếu hiển thị) nghiêng về hạn chế thì nhãn không vượt 80
      if ([...xauHien, ...gt].reduce((a, n) => a - n.diem, 0) > totHien.reduce((a, n) => a + n.diem, 0)) pv = Math.min(pv, kh.net_hung_tran);
      let cauDan: string | null = null;
      if (tot.length && xau.length) { // §17: câu 'hai mặt cùng tồn tại' áp cho MỌI mục có cả sáng lẫn hung (không kẹp điểm: điểm do công thức v3 quyết định)
        const nhan = (n: NhanDinh) => {
          if (n.id === "PHI_TUYEN") { // tách sát tinh NẰM TẠI cung và sát tinh CHIẾU từ cung khác — không gộp thành "quanh" (dễ tưởng sao ở cung khác nằm tại cung này)
            const xh = cham[n.cung!]?.sat_xh ?? [];
            const ngoai = new Set(xh.map((x) => x.sao));
            const ban = (n.nhan ?? []).filter((x) => !ngoai.has(x));
            const chieu = [...new Map(xh.map((x) => [x.sao, x])).values()].map((x) => `${x.sao} (ở ${x.cung}, ${x.quan_he === "xung" ? "xung" : "hội"} chiếu)`);
            return [ban.length ? `sát tinh ${ban.join(" + ")} tại ${n.cung}` : "", chieu.length ? `sát tinh ${chieu.join(" + ")} chiếu ${n.cung}` : ""].filter(Boolean).join("; ");
          }
          if (n.id === "CAT_XH") return `cát tinh ${(n.nhan ?? []).join(" + ")} chiếu ${n.cung}`;
          if (n.quan_he && n.quan_he !== "ban_cung") return `${(n.nhan?.length ? n.nhan : [n.id]).join(" + ")} (ở ${n.cung_nguon}, ${n.quan_he === "xung" ? "xung" : "hội"} chiếu)`; // sao mượn/ở cung khác: luôn ghi vị trí thật (§15.1)
          return `${(n.nhan?.length ? n.nhan : [n.id]).join(" + ")} tại ${n.cung}`;
        };
        const a_ = [...new Set(tot.slice(0, 2).map(nhan))].join("; ");
        const b_ = [...new Set(xau.slice(0, 2).map(nhan))].join("; ");
        // hướng nghiêng: so tổng điểm câu sáng với tổng điểm câu hung (cùng thang), để "hai mặt" không nuốt mất cảnh báo khi hạn chế nặng hơn hẳn
        const tongSang = sang.reduce((a, n) => a + n.diem, 0);
        const tongHung = -hung.reduce((a, n) => a + n.diem, 0);
        const huong = tongHung >= 1.5 * tongSang ? "trong đó hạn chế nặng hơn điểm sáng" : tongSang >= 1.5 * tongHung ? "trong đó điểm sáng nặng hơn hạn chế" : "hai bên xấp xỉ ngang nhau";
        cauDan = `Cung có cả điểm sáng (${a_}) lẫn hạn chế (${b_}); hai mặt cùng tồn tại, ${huong}.`;
      }
      const d100 = diem100(pv);
      ket[ten] = { diem100: d100, xep_loai: bac(d100, dn), diem_manh: totHien, diem_yeu: [...xauHien, ...gt], khung: this.khungChuDe(cd, chuDs, cham), cau_dan: cauDan, kiem_khop: kiemKhop, luu_y: luuY, trung_tinh: trungTinh, sao_nho: saoNho, cung: Object.fromEntries(cungW.map(([c]) => [c, cham[c].xep_loai])) };
    }
    return ket;
  }
}

/** Chọn k câu hiển thị của một mục: cách cục (kết luận đọc theo cụm sao) đứng trước câu từng sao, rồi theo độ lớn điểm (dau = +1 sáng, −1 hung).
 *  Nếu chỉ xếp theo điểm thì cách cục (điểm nhỏ) luôn bị câu từng sao đẩy ra khỏi top 3 và kết luận quan trọng nhất biến mất khỏi mục. */
/** Câu có nhánh "Nếu bạn là nam/nữ, ..." (ngăn bằng "; ") → chỉ giữ nhánh đúng giới tính. */
export function chonGioi(txt: string, gioi: string): string {
  if (!/nếu bạn là (nam|nữ),/i.test(txt)) return txt;
  const kq: string[] = [];
  for (const mau of txt.split("; ")) {
    const m = /^nếu bạn là (nam|nữ), (.*)$/i.exec(mau);
    if (m === null) kq.push(mau);
    else if ((m[1].toLowerCase() === "nam") === (gioi === "nam")) kq.push(m[2]);
  }
  const ket = kq.join("; ");
  return ket.slice(0, 1).toUpperCase() + ket.slice(1);
}

export function chonTop(ds: NhanDinh[], k: number, dau: 1 | -1): NhanDinh[] {
  const laCach = (n: NhanDinh) => (/^CC\d+$/.test(n.id) ? 0 : 1);
  return [...ds].sort((a, b) => laCach(a) - laCach(b) || -dau * (a.diem - b.diem)).slice(0, k);
}

/** Làm tròn bội số 5 (tránh ảo giác chính xác của số lẻ), kẹp theo `kep`. */
export const diem100 = (x: number, kep: number[] = [5, 95]): number => Math.min(kep[1], Math.max(kep[0], Math.floor(x / 5 + 0.5) * 5));

/** 6 bậc theo bảng CÔNG KHAI (cau_hinh_luan_giai.json → diem_noi_tai.bac): ≤30 Rất thấp · ≤45 Thấp · ≤60 Trung bình · ≤75 Khá · ≤90 Tốt · còn lại Rất tốt. */
export function bac(d100: number, dn: any): string {
  for (const [han, ten] of dn.bac as [number, string][]) if (d100 <= han) return ten;
  return dn.bac[dn.bac.length - 1][1];
}

/** Dòng thời gian đại hạn cả đời: điểm = tổng điểm Mệnh + Quan Lộc + Tài Bạch của đại hạn (chỉ so các đại hạn của cùng lá số). Không đổi điểm cung nào. */
export function dongThoiGianDaiHan(lg: LuanGiai, namSinh: number): MocDaiHan[] {
  const kn: Record<string, { muc: string; nen: string; tranh: string }> = lg.tt.cfg.han.khuyen_nghi;
  const moc: MocDaiHan[] = [];
  for (const [c, tuTuoi] of Object.entries(lg.ls.dai_han).sort((a, b) => a[1] - b[1])) {
    const dh = lg.han(namSinh, namSinh + tuTuoi - 1, false).dai_han;
    if (!dh) continue;
    const dg = dh.danh_gia;
    const diem = pyRound(["Mệnh", "Quan Lộc", "Tài Bạch"].reduce((t, k) => t + dg[k].diem, 0), 2);
    const k = kn[lg.ls.cung_chuc[Number(c)]];
    moc.push({ id: `DH.${tuTuoi}`, nhan_dinh: "", tu_tuoi: tuTuoi, den_tuoi: tuTuoi + 9, chi: dh.chi, cung_goc: dh.cung_goc, xep_loai: dg["Mệnh"].xep_loai, diem, nhan: "", goi_y: k ? `Nên ${k.nen}; tránh ${k.tranh}.` : "" });
  }
  if (moc.length > 1) {
    const dd = moc.map((m) => m.diem);
    moc[dd.indexOf(Math.max(...dd))].nhan = "đẹp nhất";
    moc[dd.indexOf(Math.min(...dd))].nhan = "khó nhất";
  }
  for (const m of moc) m.nhan_dinh = `Đại hạn ${m.tu_tuoi}–${m.den_tuoi} tuổi tại ${m.chi} (cung ${m.cung_goc} gốc), xếp loại ${m.xep_loai.toLowerCase()}${m.nhan ? `; đây là đại hạn ${m.nhan} trong cả đời của bạn` : ""}.`;
  return moc;
}

/** So cung với cung (bảng so_cung): chỉ là đánh giá khách quan từ điểm đã tính, không kèm lời khuyên. Cặp được nêu khi điểm /100 chênh từ ngưỡng, không thành phần nào nghiêng về cung yếu,
 *  đủ thành phần nghiêng về cung trội, cả hai cung đều có chính tinh bản cung và không bị Tuần/Triệt nén (nếu không thì điểm không còn so công bằng). Không đổi điểm. */
export function soCung(lg: LuanGiai, cham: Record<string, KetQuaCung>): NhanDinh[] {
  const sc = lg.tt.lienCung.so_cung;
  const ly = sc.luu_y;
  const ket: NhanDinh[] = [];
  for (const { a, b } of sc.cap as { a: string; b: string }[]) {
    const hieu = cham[a].diem100 - cham[b].diem100;
    if (Math.abs(hieu) < sc.nguong) continue;
    const [troi, yeu] = hieu > 0 ? [a, b] : [b, a];
    const pt = { troi: cham[troi].phan_tich, yeu: cham[yeu].phan_tich };
    if (pt.troi.vo_chinh_dieu || pt.yeu.vo_chinh_dieu || pt.troi.k_triet_tuan < 1 || pt.yeu.k_triet_tuan < 1) continue;
    const tp: [string, number, number][] = [
      ["chinh_tinh", pt.troi.tong_base, pt.yeu.tong_base],
      ["phu_tinh", pt.troi.tong_cat + pt.troi.tong_sat, pt.yeu.tong_cat + pt.yeu.tong_sat],
      ["cach_cuc", pt.troi.cach_cuc, pt.yeu.cach_cuc],
    ];
    if (tp.some(([, t, y]) => y - t >= sc.lech_nho)) continue;
    const thuan = tp.filter(([, t, y]) => t - y >= sc.lech_nho);
    if (thuan.length < sc.can_dong_thuan) continue;
    const nhan = (n: string) => ly.thanh_phan[n] as string;
    const cau: string[] = [(sc.mau as string).replace("{troi}", troi).replace("{dt}", String(cham[troi].diem100)).replace("{yeu}", yeu).replace("{dy}", String(cham[yeu].diem100))
      .replace("{thanh_phan}", thuan.map(([n]) => nhan(n)).join(" và "))];
    if (pt.troi.tong_sat <= sc.sat_dang_ke) cau.push((ly.sat as string).replace("{troi}", troi));
    ket.push({
      id: `SC.${a}.${b}`, diem: 0, nhan_dinh: cau.join(" "),
      ly_do: `${troi} ~${cham[troi].diem100}/100, ${yeu} ~${cham[yeu].diem100}/100 (chênh từ ${sc.nguong}); ${thuan.length}/3 thành phần nghiêng về ${troi}, không thành phần nào ngược: `
        + tp.map(([n, t, y]) => `${nhan(n)} ${toFixedPy(t, 1)} so với ${toFixedPy(y, 1)}`).join(", "),
    });
  }
  return ket;
}

/** Toàn bộ kết quả luận dạng đối tượng (đầu vào cho phần viết văn và giao diện). */
export function baoCao(lg: LuanGiai, namSinh?: number, namXem?: number): BaoCao {
  const cham: Record<string, KetQuaCung> = Object.fromEntries(CUNG_CHUC.map((c) => [c, lg.chamCung(c)]));
  const kq: BaoCao = {
    la_so: { input: lg.ls.input, am_duong_nam_nu: lg.ls.am_duong_nam_nu, ban_menh: lg.ls.ban_menh, cuc: lg.ls.cuc },
    menh_tai: CHI[lg.ls.menh], nen: lg.nen(), than: lg.than(),
    cung: Object.fromEntries(THU_TU_CUNG.map((c) => [c, cham[c]])), chu_de: lg.chuDe(cham), so_cung: soCung(lg, cham),
  };
  if (namSinh && namXem) {
    kq.han = { ...lg.han(namSinh, namXem), nam_xem: namXem };
    kq.dai_han_ca_doi = dongThoiGianDaiHan(lg, namSinh);
  }
  return kq;
}
