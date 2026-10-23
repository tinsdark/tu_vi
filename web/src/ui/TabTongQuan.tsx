import { useEffect, useState } from "react";
import { hauKiemDayDu, lenhChoAi, tachMa, tapId, vietVanMau, quyTac, type BaoCao, type CheDoVan, type KetQuaNangCao, type NhapLieu } from "../engine";
import { API_BASE } from "../lib/api";
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
  const dong = van.split("\n");
  const [theoCau, setTheoCau] = useState(false);
  const mo = useNganKeo();
  return (
    <div className="van-xuoi">
      <label className="mo van-che-do">
        <input type="checkbox" checked={theoCau} onChange={(e) => setTheoCau(e.currentTarget.checked)} /> Hiện chấm căn cứ sau từng câu
      </label>
      {dong.map((d, i) => {
        if (d.startsWith("# ")) return <h4 key={i}>{d.slice(2)}</h4>;
        if (!d.trim()) return null;
        if (theoCau) return <p key={i}><CauChu cau={d} /></p>;
        const ma = [...new Set(tachMa(d).flatMap((m) => (m.ma ? [m.ma] : [])))];
        const chu = tachMa(d).filter((m) => !m.ma).map((m) => m.text).join("").replace(/\s+([.;,])/g, "$1").replace(/\s{2,}/g, " ");
        return (
          <div key={i} className="doan-van">
            <p>{chu}</p>
            <p className="co-so mo"><span>Cơ sở:</span>{ma.map((m) => <ChamMa key={m} ma={m} onMo={() => mo({ loai: "quy_tac", id: m })} />)}</p>
          </div>
        );
      })}
    </div>
  );
}

type TrangThaiAi = { ky: "chua_hoi" } | { ky: "dang_tai" } | { ky: "xong"; che_do: CheDoVan; van: string; bo: number; ly_do?: string };

export function VanXuoi({ bc, nhap }: { bc: BaoCao; nhap: NhapLieu }) {
  const mau = vietVanMau(bc);
  const [ai, setAi] = useState<TrangThaiAi>({ ky: "chua_hoi" });
  const [coAi, setCoAi] = useState<boolean | null>(null);
  useEffect(() => { setAi({ ky: "chua_hoi" }); }, [nhap]);
  useEffect(() => {
    fetch(`${API_BASE}/api/health`).then((r) => r.json()).then((j) => setCoAi(Boolean(j.llm)), () => setCoAi(null));
  }, []);

  const [vanDan, setVanDan] = useState("");
  const [daSao, setDaSao] = useState(false);
  const [loiDan, setLoiDan] = useState("");

  async function sao() {
    const lenh = lenhChoAi(bc);
    try {
      await navigator.clipboard.writeText(lenh);
    } catch {
      const o = document.createElement("textarea"); // trình duyệt chặn clipboard API → chọn rồi sao chép thủ công
      o.value = lenh; document.body.appendChild(o); o.select(); document.execCommand("copy"); o.remove();
    }
    setDaSao(true);
    setTimeout(() => setDaSao(false), 2500);
  }

  function kiemTra() {
    const [van, bo] = hauKiemDayDu(vanDan, bc);
    if (!van.replace(/^#.*$/gm, "").trim()) {
      setLoiDan("Không câu nào hợp lệ: mỗi câu phải kết thúc bằng mã như [CD.Sự nghiệp] và nằm đúng mục. Hãy nhờ chatbot viết lại theo lời nhắc.");
      return;
    }
    setLoiDan("");
    setAi({ ky: "xong", che_do: "llm", van, bo, ly_do: bo ? `Đã bỏ ${bo} câu không truy được về quy tắc hoặc lấn sang mục khác.` : undefined });
  }

  async function viet() {
    setAi({ ky: "dang_tai" });
    try {
      const { ho_ten: _bo, ...khongTen } = nhap;
      const r = await fetch(`${API_BASE}/api/viet-van`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(khongTen) });
      const j = await r.json();
      if (!j.van) throw new Error((j.loi ?? ["Máy chủ không trả văn."]).join(" "));
      setAi({ ky: "xong", che_do: j.che_do, van: j.van, bo: j.bo ?? 0, ly_do: j.ly_do });
    } catch (e) {
      setAi({ ky: "xong", che_do: "mau", van: mau.van, bo: 0, ly_do: `Không gọi được máy chủ AI (${(e as Error).message}). Hiển thị bản ghép theo mẫu.` });
    }
  }

  const hien = ai.ky === "xong" ? ai : { che_do: "mau" as CheDoVan, van: mau.van, bo: 0, ly_do: undefined };
  return (
    <Khoi tieuDe="Bản đọc thành văn" ghiChu="Mỗi đoạn có hàng “Cơ sở” gồm các chấm màu — bấm để xem quy tắc đứng sau và nguồn của nó. Câu nào không truy được về quy tắc đều bị loại.">
      <div className="hang-nut hang-nut-trai">
        {coAi !== false && (
          <button type="button" className="nut" onClick={viet} disabled={ai.ky === "dang_tai"}>
            {ai.ky === "dang_tai" ? "Đang viết…" : ai.ky === "xong" && ai.che_do === "llm" ? "Viết lại bằng AI" : "Viết lại bằng AI cho mượt"}
          </button>
        )}
        <span className="mo">{hien.che_do === "llm" ? `Do AI viết, đã hậu kiểm${hien.bo ? ` (bỏ ${hien.bo} câu không có căn cứ)` : ""}.` : "Văn do web tự ghép từ các nhận định ở trên, không dùng AI."}</span>
      </div>
      <details className="phu-luc dan-tay">
        <summary>Dùng AI khác (ChatGPT, Gemini, Claude… — không cần API)</summary>
        <ol className="mo">
          <li>Bấm “Sao chép lời nhắc”, dán vào chatbot bạn đang dùng. Lời nhắc chứa quy tắc và dữ liệu lá số, <b>không có tên bạn</b>.</li>
          <li>Dán văn chatbot trả lời vào ô bên dưới rồi bấm “Kiểm tra và hiển thị”. Web bỏ mọi câu không truy được về quy tắc hoặc lấn sang mục khác.</li>
        </ol>
        <div className="hang-nut hang-nut-trai">
          <button type="button" className="nut" onClick={sao}>{daSao ? "Đã sao chép ✓" : "Sao chép lời nhắc"}</button>
        </div>
        <textarea className="o-dan" rows={6} value={vanDan} onChange={(e) => setVanDan(e.currentTarget.value)} placeholder="Dán văn do chatbot viết (có các mã như [CD.Sự nghiệp]) vào đây…" aria-label="Văn do AI khác viết" />
        <div className="hang-nut hang-nut-trai">
          <button type="button" className="nut" disabled={!vanDan.trim()} onClick={kiemTra}>Kiểm tra và hiển thị</button>
          {loiDan && <span className="canh-bao" role="status">{loiDan}</span>}
        </div>
      </details>
      {hien.ly_do && <p className="canh-bao" role="status">{hien.ly_do}</p>}
      <HienVan van={hien.van} />
    </Khoi>
  );
}

export function TabTongQuan({ bc, nhap, nc }: { bc: BaoCao; nhap: NhapLieu; nc: KetQuaNangCao }) {
  const ids = tapId(bc);
  return (
    <div className="tab-noi-dung">
      <ChuThichTinCay />
      <p className="mo">Điểm /100 chỉ phản ánh tương quan nội tại giữa các cung của chính lá số này (bội số 5), không so với lá số khác.</p>
      <div className="luoi-chu-de">
        {Object.entries(bc.chu_de).map(([ten, cd]) => (
          <article key={ten} className="the-chu-de">
            <h3>{ten}</h3>
            <ThanhDiem diem100={cd.diem100} xepLoai={cd.xep_loai} />
            <p className="mo">Dựa trên: {Object.entries(cd.cung).map(([c, x]) => `${c} (${x})`).join(" · ")}</p>
            <p className="mo">{cd.khung}</p>
            {cd.cau_dan && <p className="cau-dan">{cd.cau_dan}</p>}
            {cd.luu_y.length > 0 && (<><h4>Lưu ý cấu trúc</h4><DanhSachNhanDinh ds={cd.luu_y} /></>)}
            {cd.trung_tinh.length > 0 && (<><h4>Chính tinh và nhận định trung tính</h4><DanhSachNhanDinh ds={cd.trung_tinh} /></>)}
            {cd.diem_manh.length > 0 && (<><h4 className="tot">Điểm mạnh</h4><DanhSachNhanDinh ds={cd.diem_manh} /></>)}
            {cd.diem_yeu.length > 0 && (<><h4 className="xau">Cần lưu ý</h4><DanhSachNhanDinh ds={cd.diem_yeu} /></>)}
          </article>
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
      <Khoi tieuDe="Nền của lá số" ghiChu="Mệnh – Cục, âm dương và sao chủ Mệnh.">
        <DanhSachNhanDinh ds={bc.nen} />
      </Khoi>
      <Khoi tieuDe={`Cung Thân (cư ${bc.than.cu}, ${bc.than.chi})`}>
        <ThanhDiem diem100={bc.than.diem100} xepLoai={bc.than.xep_loai} />
        <DanhSachNhanDinh ds={bc.than.nhan_dinh} />
      </Khoi>
      <VanXuoi bc={bc} nhap={nhap} />
      <p className="mo ghi-chu-ids"><ChamTinCay id="TQ" nho /> {ids.size} mã quy tắc xuất hiện trong báo cáo này.</p>
    </div>
  );
}
