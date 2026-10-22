import { useMemo } from "react";
import { CHI, CUNG_CHUC, dungOCung, duongSangAm, HANH_VN, VI_TRI_LUOI, canChiCung, chiNamTieuHan, chuMenh, chuThan, hanhSao, laiNhan, quanHeCucMenh, tenNapAm, CAN, type KetQuaTinh, type OCung } from "../engine";
import { useNganKeo } from "./chung";

function Sao({ ten, muc, chi, lop }: { ten: string; muc?: string | null; chi: number; lop: string }) {
  const mo = useNganKeo();
  const hien = muc && muc !== "B" ? muc : null;
  return (
    <button type="button" className={`sao ${lop}`} data-h={hanhSao(ten) ?? ""} onClick={() => mo({ loai: "sao", ten, chi })} title={`${ten}${muc ? ` (${muc})` : ""} — bấm để xem ý nghĩa`}>
      {ten}{hien ? <i className="muc"> ({hien})</i> : null}
    </button>
  );
}

function Cung({ c, daiHan, thaiTue, luuSao, canChi, tieuHan, thangLuu }: { c: OCung; daiHan: boolean; thaiTue: boolean; luuSao: string[]; canChi: string; tieuHan: string; thangLuu: number | null }) {
  const mo = useNganKeo();
  const [r, col] = VI_TRI_LUOI[c.chi];
  return (
    <section
      className={`o-cung${c.ten === "Mệnh" ? " o-menh" : ""}${c.la_than ? " o-than" : ""}${daiHan ? " o-dai-han" : ""}`}
      style={{ "--r": r + 1, "--c": col + 1, "--o": (CUNG_CHUC as readonly string[]).indexOf(c.ten) } as React.CSSProperties}
      aria-label={`Cung ${c.ten} tại ${CHI[c.chi]}`}
    >
      <header>
        <span className="o-chi" title="Can chi của cung">{canChi}</span>
        <button type="button" className="o-ten" onClick={() => mo({ loai: "cung", ten: c.ten })} title="Xem luận cung này">{c.ten}{c.la_than ? " · Thân" : ""}</button>
        <span className="o-tuoi" title="Tuổi bắt đầu đại hạn">{c.dai_han}</span>
      </header>
      <div className="o-chinh">
        {c.chinh.map((s) => (
          <button type="button" key={s.ten} data-h={hanhSao(s.ten) ?? ""} className={`chinh ${s.muc === "H" ? "chinh-ham" : "chinh-sang"}`} onClick={() => mo({ loai: "sao", ten: s.ten, chi: c.chi })} title={`${s.ten}${s.muc ? ` (${s.muc})` : ""}`}>
            {s.ten}{s.muc && <i className="muc">({s.muc})</i>}
            {s.hoa.map((h) => <b key={h} className={`hoa-chip ${h === "Kỵ" ? "hoa-chip-ky" : "hoa-chip-tot"}`}>{h}</b>)}
          </button>
        ))}
      </div>
      <div className="o-phu">
        <div className="o-cot o-tot">{c.tot.map((s) => <Sao key={s.ten} {...s} chi={c.chi} lop="sao-tot" />)}</div>
        <div className="o-cot o-xau">{c.xau.map((s) => <Sao key={s.ten} {...s} chi={c.chi} lop="sao-xau" />)}</div>
      </div>
      {c.trung.length > 0 && <div className="o-trung">{c.trung.map((s) => <Sao key={s.ten} {...s} chi={c.chi} lop="sao-trung" />)}</div>}
      {luuSao.length > 0 && <div className="o-luu">{luuSao.map((t) => <span key={t} className="luu" data-h={hanhSao(t) ?? ""}>{t.replace("Lưu ", "L.")}</span>)}</div>}
      <div className="o-chan2" title="Chi của năm có tiểu hạn rơi vào cung này · tháng lưu nguyệt của năm xem">
        <span>{tieuHan}</span><span>{thangLuu ? `Th.${thangLuu}` : ""}</span>
      </div>
      <footer>
        <button type="button" className="vong" onClick={() => c.bac_si && mo({ loai: "sao", ten: c.bac_si, chi: c.chi })}>{c.bac_si}</button>
        <button type="button" className="vong vong-giua" onClick={() => c.trang_sinh && mo({ loai: "sao", ten: c.trang_sinh, chi: c.chi })}>{c.trang_sinh}</button>
        <button type="button" className="vong" onClick={() => c.thai_tue && mo({ loai: "sao", ten: c.thai_tue, chi: c.chi })}>{c.thai_tue}</button>
        <span className="o-dau">
          {daiHan && <em className="nhan-o nhan-o-dh">Đại hạn</em>}
          {thaiTue && <em className="nhan-o nhan-o-nam">Năm xem</em>}
          {c.tuan && <em className="nhan-o nhan-o-tt">Tuần</em>}
          {c.triet && <em className="nhan-o nhan-o-tt">Triệt</em>}
        </span>
      </footer>
    </section>
  );
}

export function BanCo({ kq, hienSaoLuu, mauHanh }: { kq: KetQuaTinh; hienSaoLuu: boolean; mauHanh: boolean }) {
  const { la_so: ls, bao_cao: bc, lich } = kq;
  const o = useMemo(() => dungOCung(ls), [ls]);
  const han = bc.han;
  const chiDaiHan = han?.dai_han ? CHI.indexOf(han.dai_han.chi) : -1;
  const chiNam = han ? CHI.indexOf(han.luu_nien.thai_tue_tai.split(" ")[0]) : -1;
  const luu = useMemo(() => {
    const m: Record<number, string[]> = {};
    if (!hienSaoLuu || !han) return m;
    for (const [ten, vt] of Object.entries(han.luu_nien.sao_luu)) {
      if (ten === "Lưu Thái Tuế") continue;
      const chi = CHI.indexOf(vt.split(" ")[0]);
      (m[chi] ??= []).push(ten);
    }
    return m;
  }, [han, hienSaoLuu]);
  const thangCua = useMemo(() => {
    const m: Record<number, number> = {};
    for (const t of han?.luu_nguyet ?? []) m[CHI.indexOf(t.chi)] = t.thang;
    return m;
  }, [han]);
  const hn = useMemo(() => {
    const d = new Date();
    return duongSangAm(d.getDate(), d.getMonth() + 1, d.getFullYear(), "bac");
  }, []);
  const i = ls.input;
  const canNam = CAN.indexOf(i.can_nam);
  return (
    <div className="ban-co" data-mau={mauHanh ? "hanh" : "tot-xau"} role="group" aria-label="Lá số 12 cung">
      {Array.from({ length: 12 }, (_, k) => k + 1).map((chi) => (
        <Cung key={chi} c={o[chi]} daiHan={chi === chiDaiHan} thaiTue={chi === chiNam} luuSao={luu[chi] ?? []} canChi={canChiCung(ls, chi)} tieuHan={chiNamTieuHan(ls, chi)} thangLuu={thangCua[chi] ?? null} />
      ))}
      <div className="o-giua">
        <h2>{i.can_nam} {i.chi_nam}</h2>
        <p className="gua-lich">Âm lịch: ngày <b>{lich.am_lich.ngay}</b> tháng <b>{lich.am_lich.thang}{lich.am_lich.nhuan ? " nhuận" : ""}</b> năm <b>{lich.am_lich.nam}</b></p>
        <p>Năm <b>{lich.can_chi.nam}</b> · tháng <b>{lich.can_chi.thang}</b> · ngày <b>{lich.can_chi.ngay}</b> · giờ <b>{lich.can_chi.gio}</b></p>
        <p>Âm dương: <b>{ls.am_duong_nam_nu}</b></p>
        <p>Bản mệnh: <b>{tenNapAm(canNam, CHI.indexOf(i.chi_nam))}</b></p>
        <p>Cục mệnh: <b>{HANH_VN[ls.cuc.hanh]} {["", "", "nhị", "tam", "tứ", "ngũ", "lục"][ls.cuc.so]} cục</b> <span className="mo">({quanHeCucMenh(ls.cuc.hanh, ls.ban_menh)})</span></p>
        <p>Chủ mệnh: <b>{chuMenh(ls)}</b> · Chủ thân: <b>{chuThan(ls)}</b></p>
        <p>Lai nhân: cung <b>{laiNhan(ls)}</b> · Thân cư: <b>{ls.cung_chuc[ls.than]}</b></p>
        <p className="mo">Xem thêm: nguyệt vận tháng {hn.thang} · tiểu vận năm {han?.nam_xem ?? ""}</p>
        <p className="gua-hoa">{Object.entries(ls.tu_hoa).map(([h, s]) => <span key={h} className={h === "Hóa Kỵ" ? "tx-ky" : "tx-tot"}>{h.replace("Hóa ", "")}: {s}</span>)}</p>
      </div>
    </div>
  );
}
