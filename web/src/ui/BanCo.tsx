import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { CHI, CUNG_CHUC, dungOCung, duongSangAm, HANH_VN, VI_TRI_LUOI, canChiCung, canLuong, chiNamTieuHan, chuMenh, chuThan, hanhSao, laiNhan, quanHeCucMenh, tenNapAm, CAN, type KetQuaTinh, type LaSo, type NenId, type OCung } from "../engine";
import { quanHeCuaCung, TEN_QUAN_HE, type LoaiQuanHe, type QuanHeCung, type QuanHeCuaCung } from "../lib/quanHe";
import { useNganKeo } from "./chung";

const dau = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${String(Math.abs(x)).replace(".", ",")}`;
const huong = (q: QuanHeCung) => (q.tong > 0 ? "tot" : q.tong < 0 ? "xau" : "trung");

function Sao({ ten, muc, chi, lop, qh }: { ten: string; muc?: string | null; chi: number; lop: string; qh?: "tot" | "xau" }) {
  const mo = useNganKeo();
  const hien = muc && muc !== "B" ? muc : null;
  return (
    <button type="button" className={`sao ${lop}${qh ? ` sao-qh sao-qh-${qh}` : ""}`} data-h={hanhSao(ten) ?? ""} onClick={() => mo({ loai: "sao", ten, chi })} title={`${ten}${muc ? ` (${muc})` : ""} — bấm để xem ý nghĩa`}>
      {ten}{hien ? <i className="muc"> ({hien})</i> : null}
    </button>
  );
}

interface CungProps {
  c: OCung; daiHan: boolean; thaiTue: boolean; luuSao: string[]; canChi: string; tieuHan: string; thangLuu: number | null;
  /** Quan hệ của cung này với cung đang chọn (khi bật đường đối chiếu). */
  qh?: QuanHeCung; chon: boolean; hienDuong: boolean; onChon: () => void;
}

function Cung({ c, daiHan, thaiTue, luuSao, canChi, tieuHan, thangLuu, qh, chon, hienDuong, onChon }: CungProps) {
  const mo = useNganKeo();
  const [r, col] = VI_TRI_LUOI[c.chi];
  // sao ở cung này đang giúp / làm xấu cung được chọn
  const nhanSao = useMemo(() => {
    const m = new Map<string, "tot" | "xau">();
    if (qh?.tinhDiem) { qh.cat.forEach((s) => m.set(s.sao, "tot")); qh.sat.forEach((s) => m.set(s.sao, "xau")); }
    return m;
  }, [qh]);
  const sao = (s: { ten: string; muc: string | null }, lop: string) => <Sao key={s.ten} {...s} chi={c.chi} lop={lop} qh={hienDuong ? nhanSao.get(s.ten) : undefined} />;
  const nhanQh = qh && qh.loai !== "ban" ? qh : null;
  return (
    <section
      className={`o-cung${c.ten === "Mệnh" ? " o-menh" : ""}${c.la_than ? " o-than" : ""}${daiHan ? " o-dai-han" : ""}${hienDuong && chon ? " o-chon" : ""}${hienDuong && nhanQh ? ` o-qh o-qh-${nhanQh.loai}` : ""}`}
      style={{ "--r": r + 1, "--c": col + 1, "--o": (CUNG_CHUC as readonly string[]).indexOf(c.ten) } as CSSProperties}
      aria-label={`Cung ${c.ten} tại ${CHI[c.chi]}`}
    >
      <header>
        <span className="o-chi" title="Can chi của cung">{canChi}</span>
        <button type="button" className="o-ten" aria-pressed={hienDuong ? chon : undefined} onClick={hienDuong ? onChon : () => mo({ loai: "cung", ten: c.ten })} title={hienDuong ? "Xem các cung chiếu vào cung này" : "Xem luận cung này"}>{c.ten}{c.la_than ? " · Thân" : ""}</button>
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
        <div className="o-cot o-tot">{c.tot.map((s) => sao(s, "sao-tot"))}</div>
        <div className="o-cot o-xau">{c.xau.map((s) => sao(s, "sao-xau"))}</div>
      </div>
      {c.trung.length > 0 && <div className="o-trung">{c.trung.map((s) => sao(s, "sao-trung"))}</div>}
      {luuSao.length > 0 && <div className="o-luu">{luuSao.map((t) => <span key={t} className="luu" data-h={hanhSao(t) ?? ""}>{t.replace("Lưu ", "L.")}</span>)}</div>}
      <div className="o-chan2" title="Chi của năm có tiểu hạn rơi vào cung này · tháng lưu nguyệt của năm xem">
        <span>{tieuHan}</span><span>{thangLuu ? `Th.${thangLuu}` : ""}</span>
      </div>
      <footer>
        <button type="button" className="vong" onClick={() => c.bac_si && mo({ loai: "sao", ten: c.bac_si, chi: c.chi })}>{c.bac_si}</button>
        <button type="button" className="vong vong-giua" onClick={() => c.trang_sinh && mo({ loai: "sao", ten: c.trang_sinh, chi: c.chi })}>{c.trang_sinh}</button>
        <button type="button" className="vong" onClick={() => c.thai_tue && mo({ loai: "sao", ten: c.thai_tue, chi: c.chi })}>{c.thai_tue}</button>
        <span className="o-dau">
          {hienDuong && chon && <em className="nhan-o nhan-o-chon">Đang xem</em>}
          {hienDuong && nhanQh && (
            <em className={`nhan-o nhan-qh nhan-qh-${huong(nhanQh)}`}>{TEN_QUAN_HE[nhanQh.loai]}{nhanQh.tinhDiem && nhanQh.tong !== 0 ? ` ${dau(nhanQh.tong)}` : ""}</em>
          )}
          {daiHan && <em className="nhan-o nhan-o-dh">Đại hạn</em>}
          {thaiTue && <em className="nhan-o nhan-o-nam">Năm xem</em>}
          {c.tuan && <em className="nhan-o nhan-o-tt">Tuần</em>}
          {c.triet && <em className="nhan-o nhan-o-tt">Triệt</em>}
        </span>
      </footer>
    </section>
  );
}

/** Một mục ở ô giữa: bấm để xem lời luận trong ngăn kéo. */
function Nen({ id, children, className }: { id: NenId; children: ReactNode; className?: string }) {
  const mo = useNganKeo();
  return <button type="button" className={`gua-nut${className ? ` ${className}` : ""}`} onClick={() => mo({ loai: "nen", id })} title="Bấm để xem luận">{children}</button>;
}

/** Bảng nhãn–giá trị của lá số: nằm ở ô giữa trên máy tính, và dưới bàn cờ trên điện thoại (ô giữa ở đó quá nhỏ). */
function ThongTinLaSo({ kq, lop }: { kq: KetQuaTinh; lop: string }) {
  const { la_so: ls, lich } = kq;
  const i = ls.input;
  const canNam = CAN.indexOf(i.can_nam);
  return (
    <div className={lop}>
      <dl className="gua-ds">
        <div><dt>Năm</dt><dd>{lich.can_chi.nam}</dd></div>
        <div><dt>Tháng</dt><dd>{lich.can_chi.thang}</dd></div>
        <div><dt>Ngày</dt><dd>{lich.can_chi.ngay}</dd></div>
        <div><dt>Giờ</dt><dd>{lich.can_chi.gio}</dd></div>
        <div><dt>Âm dương</dt><dd><Nen id="am_duong">{ls.am_duong_nam_nu}</Nen></dd></div>
        <div><dt>Bản mệnh</dt><dd><Nen id="ban_menh">{tenNapAm(canNam, CHI.indexOf(i.chi_nam))}</Nen></dd></div>
        <div><dt>Cục mệnh</dt><dd><Nen id="cuc">{HANH_VN[ls.cuc.hanh]} {["", "", "nhị", "tam", "tứ", "ngũ", "lục"][ls.cuc.so]} cục</Nen> <span className="mo">({quanHeCucMenh(ls.cuc.hanh, ls.ban_menh)})</span></dd></div>
        <div><dt>Chủ mệnh</dt><dd><Nen id="chu_menh">{chuMenh(ls)}</Nen></dd></div>
        <div><dt>Chủ thân</dt><dd><Nen id="chu_than">{chuThan(ls)}</Nen></dd></div>
        <div><dt>Cân lượng</dt><dd><Nen id="can_luong">{canLuong(ls)}</Nen></dd></div>
        <div><dt>Lai nhân</dt><dd>cung <Nen id="lai_nhan">{laiNhan(ls)}</Nen></dd></div>
        <div><dt>Thân cư</dt><dd><Nen id="than_cu">{ls.cung_chuc[ls.than]}</Nen></dd></div>
      </dl>
      <p className="gua-hoa" aria-label="Tứ Hóa">{Object.entries(ls.tu_hoa).map(([h, s]) => <Nen key={h} id="tu_hoa" className={h === "Hóa Kỵ" ? "tx-ky" : "tx-tot"}>{h.replace("Hóa ", "")}: {s}</Nen>)}</p>
    </div>
  );
}

/** Tâm một ô trên lưới 4×4, theo % của bàn cờ. */
const tamO = (chi: number): [number, number] => { const [r, c] = VI_TRI_LUOI[chi]; return [(c + 0.5) * 25, (r + 0.5) * 25]; };
const NOI = (a: number, b: number, t: number) => a + (b - a) * t;

/** Đường nối từ mỗi cung chiếu tới cung đang xem. Màu theo tác động (xanh giúp, đỏ hại, xám khác), nét theo loại quan hệ. */
function DuongDoiChieu({ r }: { r: QuanHeCuaCung }) {
  const [dx, dy] = tamO(r.chi);
  const thuTu: LoaiQuanHe[] = ["giap", "tam_hop", "xung"];
  const ds = r.quanHe.filter((q) => q.loai !== "ban").sort((a, b) => thuTu.indexOf(a.loai) - thuTu.indexOf(b.loai));
  return (
    <svg className="duong-doi-chieu" aria-hidden="true" focusable="false">
      <defs>
        {(["tot", "xau", "trung"] as const).map((h) => (
          <marker key={h} id={`mui-ten-${h}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M1 1.2L9 5 1 8.8z" className={`mui-ten mui-ten-${h}`} />
          </marker>
        ))}
      </defs>
      {ds.map((q) => {
        const [sx, sy] = tamO(q.chi);
        const h = q.tinhDiem ? huong(q) : "trung";
        // lùi hai đầu vào trong để không đè lên tên cung và đầu mũi tên không chui vào chữ
        const [x1, y1, x2, y2] = [NOI(sx, dx, 0.14), NOI(sy, dy, 0.14), NOI(dx, sx, 0.2), NOI(dy, sy, 0.2)];
        return <line key={q.chi} className={`duong duong-${q.loai} duong-${h}`} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} markerEnd={`url(#mui-ten-${h})`} />;
      })}
    </svg>
  );
}

function DongSao({ ds, lop, nhan }: { ds: { sao: string; diem: number }[]; lop: string; nhan: string }) {
  if (!ds.length) return null;
  return <p className={`qh-sao ${lop}`}><b>{nhan}:</b> {ds.map((s) => (s.diem ? `${s.sao} ${dau(s.diem)}` : s.sao)).join(", ")}</p>;
}

function BangQuanHe({ r, ls, moCung }: { r: QuanHeCuaCung; ls: LaSo; moCung: () => void }) {
  return (
    <section className="quan-he" aria-label={`Các cung chiếu vào cung ${r.ten}`}>
      <div className="qh-dau">
        <h3>Cung {r.ten} <small>({CHI[r.chi]}) · {canChiCung(ls, r.chi)}</small></h3>
        <button type="button" className="nut-chu" onClick={moCung}>Xem luận cung</button>
      </div>
      <p className="mo qh-tom-tat">
        Điểm nội tại <b>{r.xepLoai}</b> (~{r.diem100}/100). Sao cát từ các cung chiếu vào cộng <b className={r.tongCat ? "tot" : undefined}>{dau(r.tongCat) || "0"}</b>, sát tinh <b className={r.tongSat ? "xau" : undefined}>{dau(r.tongSat) || "0"}</b>
        {r.tuanTriet.length > 0 && <>; cung có {r.tuanTriet.join("/")} nên điểm bị nén về giữa</>}
        {r.voChinhDieu && <>; vô chính diệu nên mượn chính tinh cung xung</>}.
      </p>
      <ul className="qh-ds">
        {r.quanHe.map((q) => (
          <li key={`${q.loai}-${q.chi}`} className={`qh-dong qh-dong-${q.loai}`}>
            <span className={`qh-mau duong duong-${q.loai} duong-${q.tinhDiem ? huong(q) : "trung"}`} aria-hidden="true" />
            <div>
              <p className="qh-ten"><b>{TEN_QUAN_HE[q.loai]}</b> · {CHI[q.chi]} ({q.ten}){q.tinhDiem && q.tong !== 0 && <span className={`qh-net ${q.tong > 0 ? "tot" : "xau"}`}>{dau(q.tong)}</span>}</p>
              {q.cat.length + q.sat.length === 0 ? <p className="mo qh-sao">Không có sao cát/sát đáng kể.</p> : (
                <>
                  <DongSao ds={q.cat} lop="tot" nhan={q.tinhDiem ? "Giúp" : "Sao tốt"} />
                  <DongSao ds={q.sat} lop="xau" nhan={q.tinhDiem ? "Hại" : "Sao xấu"} />
                </>
              )}
              {!q.tinhDiem && <p className="mo qh-sao">Giáp cung chỉ dùng để xét các cách “giáp”, không tính vào điểm.</p>}
            </div>
          </li>
        ))}
      </ul>
      <p className="mo qh-chu-thich">Đường kẻ chạy từ cung chiếu vào cung đang xem. Nét liền: xung chiếu. Nét đứt: tam hợp. Nét chấm: giáp. Xanh: sao cát lấn át. Đỏ: sát tinh lấn át. Xám: không có tác động đáng kể hoặc chỉ để tham khảo. Con số là điểm engine cộng cho cung đang xem, chưa qua Tuần/Triệt và các trần.</p>
    </section>
  );
}

export function BanCo({ kq, hienSaoLuu, mauHanh, hienDuong }: { kq: KetQuaTinh; hienSaoLuu: boolean; mauHanh: boolean; hienDuong: boolean }) {
  const { la_so: ls, bao_cao: bc, lich } = kq;
  const mo = useNganKeo();
  const o = useMemo(() => dungOCung(ls), [ls]);
  const chiMenh = useMemo(() => Number(Object.keys(o).find((k) => o[Number(k)].ten === "Mệnh")), [o]);
  const [chon, setChon] = useState(chiMenh);
  useEffect(() => setChon(chiMenh), [chiMenh, ls]);
  const rq = useMemo(() => quanHeCuaCung(kq, chon), [kq, chon]);
  const qhTheoChi = useMemo(() => Object.fromEntries(rq.quanHe.map((q) => [q.chi, q])), [rq]);

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
  return (
    <>
      <div className="ban-co" data-mau={mauHanh ? "hanh" : "tot-xau"} role="group" aria-label="Lá số 12 cung">
        {hienDuong && <DuongDoiChieu r={rq} />}
        {Array.from({ length: 12 }, (_, k) => k + 1).map((chi) => (
          <Cung key={chi} c={o[chi]} daiHan={chi === chiDaiHan} thaiTue={chi === chiNam} luuSao={luu[chi] ?? []} canChi={canChiCung(ls, chi)} tieuHan={chiNamTieuHan(ls, chi)} thangLuu={thangCua[chi] ?? null}
            qh={qhTheoChi[chi]} chon={chi === chon} hienDuong={hienDuong} onChon={() => setChon(chi)} />
        ))}
        <div className="o-giua">
          <p className="gua-nhan">Lá số</p>
          <h2>{i.can_nam} {i.chi_nam}</h2>
          <p className="gua-lich">Âm lịch: ngày <b>{lich.am_lich.ngay}</b> tháng <b>{lich.am_lich.thang}{lich.am_lich.nhuan ? " nhuận" : ""}</b> năm <b>{lich.am_lich.nam}</b></p>
          <ThongTinLaSo kq={kq} lop="gua-trong" />
          <p className="mo gua-them">Xem thêm: nguyệt vận tháng {hn.thang} · tiểu vận năm {han?.nam_xem ?? ""}</p>
          {hienDuong && (
            <div className="gua-qh-nho" aria-hidden="true">
              <p className="gua-nhan">Đang xem cung</p>
              <p className="gua-qh-ten">{rq.ten} <small>({CHI[rq.chi]})</small></p>
              <ul>
                {rq.quanHe.filter((q) => q.loai !== "ban").map((q) => (
                  <li key={q.chi}><span className={`qh-mau duong duong-${q.loai} duong-${q.tinhDiem ? huong(q) : "trung"}`} />{TEN_QUAN_HE[q.loai]} {CHI[q.chi]}{q.tinhDiem && q.tong !== 0 && <b className={q.tong > 0 ? "tot" : "xau"}> {dau(q.tong)}</b>}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <ThongTinLaSo kq={kq} lop="gua-ngoai" />
      {hienDuong && <BangQuanHe r={rq} ls={ls} moCung={() => mo({ loai: "cung", ten: rq.ten })} />}
    </>
  );
}
