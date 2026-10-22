import { useMemo } from "react";
import { CHI, CUNG_CHUC, dungOCung, HANH_VN, VI_TRI_LUOI, type KetQuaTinh, type OCung } from "../engine";
import { useNganKeo } from "./chung";

function Sao({ ten, muc, chi, lop }: { ten: string; muc?: string | null; chi: number; lop: string }) {
  const mo = useNganKeo();
  return (
    <button type="button" className={`sao ${lop}`} onClick={() => mo({ loai: "sao", ten, chi })} title={`${ten}${muc ? ` (${muc})` : ""} — bấm để xem ý nghĩa`}>
      {ten}{muc === "H" ? <i className="muc-h"> H</i> : null}
    </button>
  );
}

function Cung({ c, daiHan, thaiTue, luuSao }: { c: OCung; daiHan: boolean; thaiTue: boolean; luuSao: string[] }) {
  const mo = useNganKeo();
  const [r, col] = VI_TRI_LUOI[c.chi];
  return (
    <section
      className={`o-cung${c.ten === "Mệnh" ? " o-menh" : ""}${c.la_than ? " o-than" : ""}${daiHan ? " o-dai-han" : ""}`}
      style={{ "--r": r + 1, "--c": col + 1, "--o": (CUNG_CHUC as readonly string[]).indexOf(c.ten) } as React.CSSProperties}
      aria-label={`Cung ${c.ten} tại ${CHI[c.chi]}`}
    >
      <header>
        <span className="o-chi">{CHI[c.chi]}</span>
        <button type="button" className="o-ten" onClick={() => mo({ loai: "cung", ten: c.ten })} title="Xem luận cung này">{c.ten}{c.la_than ? " · Thân" : ""}</button>
        <span className="o-tuoi" title="Tuổi bắt đầu đại hạn">{c.dai_han}</span>
      </header>
      <div className="o-chinh">
        {c.chinh.map((s) => (
          <button type="button" key={s.ten} className={`chinh ${s.muc === "H" ? "chinh-ham" : "chinh-sang"}`} onClick={() => mo({ loai: "sao", ten: s.ten, chi: c.chi })} title={`${s.ten}${s.muc ? ` (${s.muc})` : ""}`}>
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
      {luuSao.length > 0 && <div className="o-luu">{luuSao.map((t) => <span key={t} className="luu">{t.replace("Lưu ", "L.")}</span>)}</div>}
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

export function BanCo({ kq, hienSaoLuu }: { kq: KetQuaTinh; hienSaoLuu: boolean }) {
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
  const i = ls.input;
  return (
    <div className="ban-co" role="group" aria-label="Lá số 12 cung">
      {Array.from({ length: 12 }, (_, k) => k + 1).map((chi) => (
        <Cung key={chi} c={o[chi]} daiHan={chi === chiDaiHan} thaiTue={chi === chiNam} luuSao={luu[chi] ?? []} />
      ))}
      <div className="o-giua">
        <h2>{kq.bao_cao.la_so.input.can_nam} {i.chi_nam}</h2>
        <p className="gua-lich">Âm lịch: ngày <b>{lich.am_lich.ngay}</b> tháng <b>{lich.am_lich.thang}{lich.am_lich.nhuan ? " nhuận" : ""}</b> năm <b>{lich.am_lich.nam}</b></p>
        <p>Giờ {i.gio} · {ls.am_duong_nam_nu}</p>
        <p>Bản Mệnh <b>{HANH_VN[ls.ban_menh]}</b> · Cục <b>{HANH_VN[ls.cuc.hanh]} {ls.cuc.so}</b></p>
        <p className="mo">Can chi: năm {lich.can_chi.nam}, tháng {lich.can_chi.thang}, ngày {lich.can_chi.ngay}, giờ {lich.can_chi.gio}</p>
        <p className="gua-hoa">{Object.entries(ls.tu_hoa).map(([h, s]) => <span key={h} className={h === "Hóa Kỵ" ? "tx-ky" : "tx-tot"}>{h.replace("Hóa ", "")}: {s}</span>)}</p>
      </div>
    </div>
  );
}
