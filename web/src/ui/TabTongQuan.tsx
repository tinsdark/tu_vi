import { useState } from "react";
import { tachMa, tapId, vietVanMau, quyTac, type BaoCao, type KetQuaNangCao } from "../engine";
import { ChuThichTinCay, DanhSachNhanDinh, Khoi, ThanhDiem, useNganKeo } from "./chung";
import { ChamTinCay } from "./chung";

function CauChu({ cau }: { cau: string }) {
  const mo = useNganKeo();
  const manh = tachMa(cau);
  return (
    <>
      {manh.map((m, i) => {
        if (!m.ma) {
          // dấu câu ngay sau chấm màu đã được gắn vào chấm (không cho rớt xuống dòng riêng)
          const sauCham = i > 0 && manh[i - 1].ma ? /^[.;,]/.exec(m.text)?.[0] ?? "" : "";
          return <span key={i}>{m.text.slice(sauCham.length)}</span>;
        }
        const dauCau = manh[i + 1] && !manh[i + 1].ma ? /^[.;,]/.exec(manh[i + 1].text)?.[0] ?? "" : "";
        return (
          <span key={i} className="khong-ngat">
            <ChamMa ma={m.ma} onMo={() => mo({ loai: "quy_tac", id: m.ma! })} />{dauCau}
          </span>
        );
      })}
    </>
  );
}

function ChamMa({ ma, onMo }: { ma: string; onMo: () => void }) {
  const t = quyTac(ma).tin_cay;
  return <button type="button" className={`cham cham-${t} cham-nho cham-trong-cau`} onClick={onMo} title={`Quy tắc ${ma}`} aria-label={`Xem quy tắc ${ma}`} />;
}

/** Mặc định đọc liền mạch (không chấm giữa câu); mỗi đoạn có một hàng "Cơ sở" gom các mã đã dùng. Bật "chấm theo từng câu" để thấy mã ngay sau câu. */
function HienVan({ van }: { van: string }) {
  const [theoCau, setTheoCau] = useState(false);
  const mo = useNganKeo();
  // tách theo dòng "# Tiêu đề": mỗi mục là một khối thu gọn; dòng đứng trước tiêu đề đầu tiên không thuộc mục nào
  const muc: { tieuDe: string | null; dong: string[] }[] = [];
  for (const d of van.split("\n")) {
    if (d.startsWith("# ")) muc.push({ tieuDe: d.slice(2), dong: [] });
    else if (d.trim()) { if (!muc.length) muc.push({ tieuDe: null, dong: [] }); muc[muc.length - 1].dong.push(d); }
  }
  const [dangMo, setDangMo] = useState<Set<string>>(() => new Set(muc[0]?.tieuDe ? [muc[0].tieuDe] : []));
  const dsTen = muc.flatMap((m) => (m.tieuDe ? [m.tieuDe] : []));
  const moTat = dsTen.length > 0 && dsTen.every((t) => dangMo.has(t));
  const doi = (t: string, m: boolean) => setDangMo((c) => { const n = new Set(c); if (m) n.add(t); else n.delete(t); return n; });

  const veDong = (d: string, i: number) => {
    if (theoCau) return <p key={i}><CauChu cau={d} /></p>;
    const ma = [...new Set(tachMa(d).flatMap((m) => (m.ma ? [m.ma] : [])))];
    const chu = tachMa(d).filter((m) => !m.ma).map((m) => m.text).join("").replace(/\s+([.;,])/g, "$1").replace(/\s{2,}/g, " ");
    return (
      <div key={i} className="doan-van">
        <p>{chu}</p>
        <details className="co-so mo">
          <summary>Căn cứ của đoạn này ({ma.length} quy tắc)</summary>
          <ul>{ma.map((m) => <li key={m}><ChamMa ma={m} onMo={() => mo({ loai: "quy_tac", id: m })} /> {quyTac(m).tieu_de}</li>)}</ul>
        </details>
      </div>
    );
  };

  return (
    <div className="van-xuoi">
      <div className="hang-nut hang-nut-trai">
        <button type="button" className="nut" onClick={() => setDangMo(moTat ? new Set() : new Set(dsTen))}>{moTat ? "Thu gọn tất cả" : "Mở tất cả"}</button>
        <label className="mo van-che-do">
          <input type="checkbox" checked={theoCau} onChange={(e) => setTheoCau(e.currentTarget.checked)} /> Hiện chấm căn cứ sau từng câu
        </label>
      </div>
      {muc.map((m, k) => m.tieuDe === null
        ? <div key={k}>{m.dong.map(veDong)}</div>
        : (
          <details key={k} className="muc-van" open={dangMo.has(m.tieuDe)} onToggle={(e) => doi(m.tieuDe!, e.currentTarget.open)}>
            <summary><h4>{m.tieuDe}</h4></summary>
            <div className="muc-van-than">{m.dong.map(veDong)}</div>
          </details>
        ))}
    </div>
  );
}

export function VanXuoi({ bc }: { bc: BaoCao }) {
  const mau = vietVanMau(bc);
  return (
    <Khoi tieuDe="Bản đọc thành văn" ghiChu="Mỗi đoạn có hàng “Cơ sở” gồm các chấm màu — bấm để xem quy tắc đứng sau và nguồn của nó. Câu nào không truy được về quy tắc đều bị loại.">
      <p className="mo">Văn do web tự ghép từ các nhận định ở trên, không dùng AI.</p>
      <HienVan van={mau.van} />
    </Khoi>
  );
}

export function TabTongQuan({ bc, nc }: { bc: BaoCao; nc: KetQuaNangCao }) {
  const ids = tapId(bc);
  const tenCd = Object.keys(bc.chu_de);
  const [mo, setMo] = useState<Set<string>>(() => new Set());
  const doi = (ten: string, m: boolean) => setMo((c) => { const n = new Set(c); if (m) n.add(ten); else n.delete(ten); return n; });
  const moTat = mo.size === tenCd.length;
  return (
    <div className="tab-noi-dung">
      <ChuThichTinCay />
      <p className="mo">Điểm /100 chỉ phản ánh tương quan nội tại giữa các cung của chính lá số này (bội số 5), không so với lá số khác. Bấm vào từng chủ đề để xem chi tiết.</p>
      <div className="hang-nut hang-nut-trai">
        <button type="button" className="nut" onClick={() => setMo(moTat ? new Set() : new Set(tenCd))}>{moTat ? "Thu gọn tất cả" : "Mở tất cả"}</button>
      </div>
      <div className="luoi-chu-de">
        {Object.entries(bc.chu_de).map(([ten, cd]) => (
          <details key={ten} className="the-chu-de" open={mo.has(ten)} onToggle={(e) => doi(ten, e.currentTarget.open)}>
            <summary>
              <h3>{ten}</h3>
              <ThanhDiem diem100={cd.diem100} xepLoai={cd.xep_loai} />
              <span className="tom-tat">
                {cd.diem_manh.length > 0 && <span className="tot">{cd.diem_manh.length} điểm mạnh</span>}
                {cd.diem_yeu.length > 0 && <span className="xau">{cd.diem_yeu.length} cần lưu ý</span>}
                {cd.diem_manh.length + cd.diem_yeu.length === 0 && <span>Không có điểm nổi bật</span>}
              </span>
            </summary>
            <div className="the-chu-de-than">
              <p className="mo">Dựa trên: {Object.entries(cd.cung).map(([c, x]) => `${c} (${x})`).join(" · ")}</p>
              <p className="mo">{cd.khung}</p>
              {cd.cau_dan && <p className="cau-dan">{cd.cau_dan}</p>}
              {cd.luu_y.length > 0 && (<><h4>Lưu ý cấu trúc</h4><DanhSachNhanDinh ds={cd.luu_y} /></>)}
              {cd.trung_tinh.length > 0 && (<><h4>Chính tinh và nhận định trung tính</h4><DanhSachNhanDinh ds={cd.trung_tinh} /></>)}
              {cd.diem_manh.length > 0 && (<><h4 className="tot">Điểm mạnh</h4><DanhSachNhanDinh ds={cd.diem_manh} /></>)}
              {cd.diem_yeu.length > 0 && (<><h4 className="xau">Cần lưu ý</h4><DanhSachNhanDinh ds={cd.diem_yeu} /></>)}
              {cd.sao_nho.length > 0 && (<><h4>Sao phụ đáng chú ý</h4><DanhSachNhanDinh ds={cd.sao_nho} /></>)}
            </div>
          </details>
        ))}
      </div>
      {nc.bo && (
        <Khoi tieuDe={`Bộ chính tinh của Mệnh: ${nc.bo.ten}`} ghiChu="Định hướng nghề và tính cách nền theo bộ sao (cách xếp bộ tùy phái, chỉ để tham khảo).">
          <p>Chính tinh {nc.bo.muon ? "mượn từ cung xung" : "tại Mệnh"}: <b>{nc.bo.sao_menh.join(", ") || "—"}</b></p>
          <p>Nghề phù hợp: {nc.bo.nghe}.</p>
          <p>{nc.bo.tinh_cach[0].toUpperCase() + nc.bo.tinh_cach.slice(1)}.</p>
          {nc.bo.ghi_chu && <p className="mo">{nc.bo.ghi_chu}</p>}
        </Khoi>
      )}
      <Khoi tieuDe="Điểm 12 cung" ghiChu="Điểm nội tại /100 của từng cung, xếp theo thứ tự cung trên lá số. Chỉ để so các cung của chính lá số này với nhau.">
        <ol className="bang-12-cung">
          {Object.entries(bc.cung).map(([ten, c]) => (
            <li key={ten}>
              <span className="b12-ten">{ten}</span>
              <span className="b12-thanh"><span style={{ width: `${c.diem100}%` }} /></span>
              <span className="b12-diem">{c.diem100} · {c.xep_loai}</span>
            </li>
          ))}
        </ol>
        {bc.so_cung.length > 0 && (<><h4>So cung với cung</h4><DanhSachNhanDinh ds={bc.so_cung} /></>)}
      </Khoi>
      <Khoi tieuDe="Nền của lá số" ghiChu="Mệnh – Cục, âm dương và chính tinh thủ Mệnh.">
        <DanhSachNhanDinh ds={bc.nen} />
      </Khoi>
      <Khoi tieuDe={`Cung Thân (cư ${bc.than.cu}, ${bc.than.chi})`}>
        <ThanhDiem diem100={bc.than.diem100} xepLoai={bc.than.xep_loai} />
        <DanhSachNhanDinh ds={bc.than.nhan_dinh} />
      </Khoi>
      <VanXuoi bc={bc} />
      <p className="mo ghi-chu-ids"><ChamTinCay id="TQ" nho /> {ids.size} mã quy tắc xuất hiện trong báo cáo này.</p>
    </div>
  );
}
