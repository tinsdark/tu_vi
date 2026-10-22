import { useEffect, useState } from "react";
import { tachMa, tapId, vietVanMau, quyTac, type BaoCao, type CheDoVan, type NhapLieu } from "../engine";
import { API_BASE } from "../lib/api";
import { ChuThichTinCay, DanhSachNhanDinh, Khoi, ThanhPhanVi, useNganKeo } from "./chung";
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

function HienVan({ van }: { van: string }) {
  const dong = van.split("\n");
  return (
    <div className="van-xuoi">
      {dong.map((d, i) => {
        if (d.startsWith("# ")) return <h4 key={i}>{d.slice(2)}</h4>;
        if (!d.trim()) return null;
        return <p key={i}><CauChu cau={d} /></p>;
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
    <Khoi tieuDe="Bản đọc thành văn" ghiChu="Mỗi câu kết thúc bằng một chấm màu — bấm để xem quy tắc đứng sau và nguồn của nó. Câu nào không truy được về quy tắc đều bị loại.">
      <div className="hang-nut hang-nut-trai">
        {coAi !== false && (
          <button type="button" className="nut" onClick={viet} disabled={ai.ky === "dang_tai"}>
            {ai.ky === "dang_tai" ? "Đang viết…" : ai.ky === "xong" && ai.che_do === "llm" ? "Viết lại bằng AI" : "Viết lại bằng AI cho mượt"}
          </button>
        )}
        <span className="mo">{hien.che_do === "llm" ? `Do AI viết lại, đã hậu kiểm${hien.bo ? ` (bỏ ${hien.bo} câu không có căn cứ)` : ""}.` : "Văn do web tự ghép từ các nhận định ở trên, không dùng AI."}</span>
      </div>
      {hien.ly_do && <p className="canh-bao" role="status">{hien.ly_do}</p>}
      <HienVan van={hien.van} />
    </Khoi>
  );
}

export function TabTongQuan({ bc, nhap }: { bc: BaoCao; nhap: NhapLieu }) {
  const ids = tapId(bc);
  return (
    <div className="tab-noi-dung">
      <ChuThichTinCay />
      <div className="luoi-chu-de">
        {Object.entries(bc.chu_de).map(([ten, cd]) => (
          <article key={ten} className="the-chu-de">
            <h3>{ten}</h3>
            <ThanhPhanVi phanVi={cd.phan_vi} xepLoai={cd.xep_loai} />
            <p className="mo">Dựa trên: {Object.entries(cd.cung).map(([c, x]) => `${c} (${x})`).join(" · ")}</p>
            {cd.diem_manh.length > 0 && (<><h4 className="tot">Điểm mạnh</h4><DanhSachNhanDinh ds={cd.diem_manh} /></>)}
            {cd.diem_yeu.length > 0 && (<><h4 className="xau">Cần lưu ý</h4><DanhSachNhanDinh ds={cd.diem_yeu} /></>)}
          </article>
        ))}
      </div>
      <Khoi tieuDe="Nền của lá số" ghiChu="Mệnh – Cục, âm dương và sao chủ Mệnh.">
        <DanhSachNhanDinh ds={bc.nen} />
      </Khoi>
      <Khoi tieuDe={`Cung Thân (cư ${bc.than.cu}, ${bc.than.chi})`}>
        <ThanhPhanVi phanVi={bc.than.phan_vi} xepLoai={bc.than.xep_loai} />
        <DanhSachNhanDinh ds={bc.than.nhan_dinh} />
      </Khoi>
      <VanXuoi bc={bc} nhap={nhap} />
      <p className="mo ghi-chu-ids"><ChamTinCay id="TQ" nho /> {ids.size} mã quy tắc xuất hiện trong báo cáo này.</p>
    </div>
  );
}
