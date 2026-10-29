import { useEffect, useRef } from "react";
import { CHI, canChiCung, chiNamTieuHan, dungOCung, luanNen, moTaDieuKien, NHAN_TIN_CAY, quyTac, thongTinSao, triThuc, HANH_VN, type BaoCao, type LaSo, type NenId } from "../engine";
import { DanhSachNhanDinh, Icon, ThanhDiem, type NoiDungNganKeo } from "./chung";

const MUC: Record<string, string> = { M: "Miếu", V: "Vượng", "Đ": "Đắc", B: "Bình", H: "Hãm" };

function DieuKien({ dk }: { dk: Record<string, unknown> }) {
  return (
    <>
      <ul className="dieu-kien">{moTaDieuKien(dk).map((d, i) => <li key={i} style={{ marginLeft: `${d.cap * 1.1}rem` }}>{d.text}</li>)}</ul>
      <details className="phu-luc"><summary>Dạng kỹ thuật (JSON)</summary><pre className="dk">{JSON.stringify(dk, null, 1)}</pre></details>
    </>
  );
}

function NoiDungQuyTac({ id }: { id: string }) {
  const q = quyTac(id);
  return (
    <>
      <h2>{q.tieu_de}</h2>
      <p className="ma-quy-tac"><code>{q.id}</code></p>
      <p><span className={`cham cham-${q.tin_cay} cham-tinh`} aria-hidden="true" /> <b>{NHAN_TIN_CAY[q.tin_cay]}</b></p>
      <p className="mo">{q.ly_do_tin_cay}</p>
      <h4>Nội dung</h4>
      <p>{q.mo_ta}</p>
      {q.cach && (
        <>
          <h4>Điều kiện thành cách</h4>
          <DieuKien dk={q.cach.thanh} />
          {q.cach.pha ? (<><h4>Điều kiện phá cách</h4><DieuKien dk={q.cach.pha} /></>) : <p className="mo">Không có điều kiện phá riêng: nếu có từ 2 sát tinh/Hóa Kỵ ở cung đó hoặc cung xung chiếu thì cách bị giảm (luật phá cách chung).</p>}
          <p className="mo">Điểm: {q.cach.diem}{q.cach.diem_pha !== undefined ? ` (bị phá: ${q.cach.diem_pha})` : ""}</p>
        </>
      )}
      {q.ghi_chu && (<><h4>Ghi chú đối chiếu</h4><p>{q.ghi_chu}</p></>)}
      {q.nguon.length > 0 && (
        <>
          <h4>Nguồn</h4>
          <ul>{q.nguon.map((u) => <li key={u}><a href={u} target="_blank" rel="noreferrer noopener">{u.replace(/^https?:\/\//, "")}</a></li>)}</ul>
        </>
      )}
      {q.trang_thai && <p className="mo">Trạng thái dữ liệu: <code>{q.trang_thai}</code></p>}
    </>
  );
}

function NoiDungSao({ ten, chi, bc }: { ten: string; chi?: number; bc: BaoCao | null }) {
  const tt = triThuc();
  const s = thongTinSao(ten, tt);
  const cungHienTai = chi ? bc && Object.values(bc.cung).find((c) => c.chi === CHI[chi])?.cung : undefined;
  const hienTai = chi ? s.do_sang.find((d) => d.chi === CHI[chi]) : undefined;
  return (
    <>
      <h2>{ten}</h2>
      <p className="mo">
        {s.loai === "chinh_tinh" ? "Chính tinh" : s.loai === "phu_tinh" ? "Phụ tinh" : "Sao vòng"}
        {s.hanh ? ` · hành ${HANH_VN[s.hanh] ?? s.hanh}` : ""}
        {chi ? ` · đang ở ${CHI[chi]}${cungHienTai ? ` (${cungHienTai})` : ""}` : ""}
        {hienTai ? ` · ${MUC[hienTai.muc] ?? hienTai.muc}` : ""}
      </p>
      <p>{s.mo_ta}</p>
      {s.tot_khi && <p><b>Tốt khi:</b> {s.tot_khi}</p>}
      {s.xau_khi && <p><b>Xấu khi:</b> {s.xau_khi}</p>}
      {s.do_sang.length > 0 && (
        <>
          <h4>Độ sáng theo cung</h4>
          <div className="do-sang">
            {s.do_sang.map((d) => <span key={d.chi} className={`ds ds-${d.muc}${d.chi === (chi ? CHI[chi] : "") ? " ds-hien-tai" : ""}`}><i>{d.chi}</i>{d.muc}</span>)}
          </div>
          <p className="mo">M = Miếu, V = Vượng, Đ = Đắc, B = Bình, H = Hãm. Bảng đã đối chiếu web (docs/09).</p>
        </>
      )}
      {s.dac_dia && s.dac_dia.length > 0 && <p className="mo">Đắc địa ở: {s.dac_dia.join(", ")}</p>}
      {Object.keys(s.theo_cung).length > 0 && (
        <>
          <h4>Ý nghĩa theo từng cung</h4>
          <dl className="theo-cung">
            {Object.entries(s.theo_cung).map(([c, t]) => (<div key={c} className={c === cungHienTai ? "dang-o" : undefined}><dt>{c}</dt><dd>{t}</dd></div>))}
          </dl>
        </>
      )}
    </>
  );
}

function NoiDungNen({ id, ls, bc }: { id: NenId; ls: LaSo; bc: BaoCao | null }) {
  const l = luanNen(id, ls, bc);
  return (
    <>
      <h2>{l.tieu_de}</h2>
      <p className="mo">Lá số của bạn: <b>{l.du_kien}</b></p>
      {l.doan.map((d, i) => <p key={i}>{d}</p>)}
      {l.ghi_chu && <p className="mo">{l.ghi_chu}</p>}
      <p className="mo"><span className="cham cham-xam cham-tinh" aria-hidden="true" /> <b>Chưa đối chiếu</b>: lời luận do AI tổng hợp từ kiến thức phổ thông, chưa đối chiếu sách.</p>
    </>
  );
}

function NoiDungCung({ ten, bc, ls }: { ten: string; bc: BaoCao; ls: LaSo | null }) {
  const k = bc.cung[ten];
  const chi = CHI.indexOf(k.chi);
  const oc = ls && chi > 0 ? dungOCung(ls)[chi] : null;
  return (
    <>
      <h2>{ten} <small>({k.chi})</small></h2>
      <ThanhDiem diem100={k.diem100} xepLoai={k.xep_loai} />
      <p className="mo">Điểm cung {k.diem}. Chính tinh: {k.chinh_tinh.length ? k.chinh_tinh.join(", ") : "vô chính diệu"}{k.tuan_triet.length ? ` · ${k.tuan_triet.join("/")}` : ""}</p>
      {oc && ls && (
        <>
          <h4>Vòng sao và hạn tại cung này</h4>
          <dl className="theo-cung">
            <div><dt>Can chi</dt><dd>{canChiCung(ls, chi)}</dd></div>
            <div><dt>Bác Sĩ</dt><dd>{oc.bac_si}</dd></div>
            <div><dt>Tràng Sinh</dt><dd>{oc.trang_sinh}</dd></div>
            <div><dt>Thái Tuế</dt><dd>{oc.thai_tue}</dd></div>
            <div><dt>Đại hạn</dt><dd>từ {oc.dai_han} tuổi</dd></div>
            <div><dt>Tiểu hạn</dt><dd>{chiNamTieuHan(ls, chi) || "—"}</dd></div>
          </dl>
        </>
      )}
      <DanhSachNhanDinh ds={k.nhan_dinh} rong />
    </>
  );
}

export function NganKeo({ noiDung, bc, laSo, dong }: { noiDung: NoiDungNganKeo | null; bc: BaoCao | null; laSo: LaSo | null; dong: () => void }) {
  const nutDong = useRef<HTMLButtonElement>(null);
  const truoc = useRef<Element | null>(null);
  useEffect(() => {
    if (!noiDung) return;
    truoc.current = document.activeElement;
    nutDong.current?.focus();
    const cu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const phim = (e: KeyboardEvent) => { if (e.key === "Escape") dong(); };
    window.addEventListener("keydown", phim);
    return () => {
      window.removeEventListener("keydown", phim);
      document.body.style.overflow = cu;
      (truoc.current as HTMLElement | null)?.focus?.();
    };
  }, [noiDung, dong]);
  if (!noiDung) return null;
  return (
    <>
      <div className="phu-nen" onClick={dong} />
      <aside className="ngan-keo" role="dialog" aria-modal="true" aria-label="Chi tiết">
        <button ref={nutDong} type="button" className="nut-dong" onClick={dong} aria-label="Đóng"><Icon ten="dong" size={18} /></button>
        {noiDung.loai === "quy_tac" && <NoiDungQuyTac id={noiDung.id} />}
        {noiDung.loai === "sao" && <NoiDungSao ten={noiDung.ten} chi={noiDung.chi} bc={bc} />}
        {noiDung.loai === "cung" && bc && <NoiDungCung ten={noiDung.ten} bc={bc} ls={laSo} />}
        {noiDung.loai === "nen" && laSo && <NoiDungNen id={noiDung.id} ls={laSo} bc={bc} />}
        {noiDung.loai === "quy_tac" && <p className="mo">Độ tin cậy là nhãn của dữ liệu (đã đối chiếu mấy nguồn), không phải xác suất đúng.</p>}
      </aside>
    </>
  );
}
