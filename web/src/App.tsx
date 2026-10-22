import { useCallback, useEffect, useMemo, useState } from "react";
import { chuanHoaNhap, tinhLaSo, veLaSo, type KetQuaTinh, type NhapLieu } from "./engine";
import { docGiaoDien, docLuu, ghiGiaoDien, giaiMaNhap, luuLaSo, maHoaNhap, xoaLaSo, type GiaoDien, type LaSoDaLuu } from "./lib/luuTru";
import { taiPng, taiSvg } from "./lib/xuatAnh";
import { BanCo } from "./ui/BanCo";
import { NganKeoCtx, type NoiDungNganKeo } from "./ui/chung";
import { FormNhap } from "./ui/FormNhap";
import { NganKeo } from "./ui/NganKeo";
import { TabCung } from "./ui/TabCung";
import { TabHan } from "./ui/TabHan";
import { TabTongQuan } from "./ui/TabTongQuan";

type Tab = "la_so" | "tong_quan" | "cung" | "han";
const TABS: [Tab, string][] = [["la_so", "Lá số"], ["tong_quan", "Tổng quan"], ["cung", "12 cung"], ["han", "Hạn"]];
const NHAN_GIAO_DIEN: Record<GiaoDien, string> = { tu_dong: "Tự động", sang: "Sáng", toi: "Tối" };

function tinh(n: NhapLieu | null): { kq: KetQuaTinh | null; loi: string | null } {
  if (!n) return { kq: null, loi: null };
  try {
    return { kq: tinhLaSo(n), loi: null };
  } catch (e) {
    return { kq: null, loi: `Không lập được lá số: ${(e as Error).message}` };
  }
}

export function App() {
  const [nhap, setNhap] = useState<NhapLieu | null>(() => giaiMaNhap(location.hash));
  const [tab, setTab] = useState<Tab>("la_so");
  const [nganKeo, setNganKeo] = useState<NoiDungNganKeo | null>(null);
  const [daLuu, setDaLuu] = useState<LaSoDaLuu[]>(() => docLuu());
  const [giaoDien, setGiaoDien] = useState<GiaoDien>(() => docGiaoDien());
  const [hienSaoLuu, setHienSaoLuu] = useState(true);
  const [mauHanh, setMauHanh] = useState(true);
  const [thongBao, setThongBao] = useState("");
  const [moForm, setMoForm] = useState(false);

  const { kq, loi } = useMemo(() => tinh(nhap), [nhap]);

  useEffect(() => {
    document.documentElement.dataset.theme = giaoDien === "tu_dong" ? "" : giaoDien === "sang" ? "light" : "dark";
    ghiGiaoDien(giaoDien);
  }, [giaoDien]);

  useEffect(() => {
    const doiHash = () => setNhap(giaiMaNhap(location.hash));
    window.addEventListener("hashchange", doiHash);
    return () => window.removeEventListener("hashchange", doiHash);
  }, []);

  const lap = useCallback((n: NhapLieu) => {
    history.replaceState(null, "", `#c=${maHoaNhap(n)}`);
    setNhap(n);
    setTab("la_so");
    setMoForm(false);
    setNganKeo(null);
    window.scrollTo({ top: 0 });
  }, []);

  const doiNam = (nam: number) => {
    if (!nhap) return;
    const kt = chuanHoaNhap({ ...nhap, nam_xem: nam });
    if (kt.ok) { history.replaceState(null, "", `#c=${maHoaNhap(kt.nhap)}`); setNhap(kt.nhap); }
  };

  const baoTam = (s: string) => { setThongBao(s); setTimeout(() => setThongBao(""), 3500); };
  const tenFile = nhap ? `la-so-tu-vi-${nhap.nam}${String(nhap.thang).padStart(2, "0")}${String(nhap.ngay).padStart(2, "0")}` : "la-so";
  const dong = useCallback(() => setNganKeo(null), []);

  return (
    <NganKeoCtx.Provider value={setNganKeo}>
      <a className="bo-qua" href="#noi-dung">Bỏ qua tới nội dung</a>
      <header className="dau-trang">
        <div className="dau-trang-trong">
          <a className="thuong-hieu" href={location.pathname} onClick={(e) => { e.preventDefault(); history.replaceState(null, "", location.pathname); setNhap(null); }}>
            <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true"><rect width="64" height="64" rx="14" fill="currentColor" opacity=".12" /><g fill="none" stroke="currentColor" strokeWidth="3"><rect x="14" y="14" width="36" height="36" rx="3" /><path d="M14 26h36M14 38h36M26 14v36M38 14v36" strokeWidth="1.6" /></g><circle cx="32" cy="32" r="5" fill="currentColor" /></svg>
            <span>Tử Vi</span>
          </a>
          <label className="chon-giao-dien">
            <span className="chi-doc-man-hinh">Giao diện</span>
            <select value={giaoDien} onChange={(e) => setGiaoDien(e.target.value as GiaoDien)} aria-label="Giao diện sáng/tối">
              {(Object.keys(NHAN_GIAO_DIEN) as GiaoDien[]).map((g) => <option key={g} value={g}>{NHAN_GIAO_DIEN[g]}</option>)}
            </select>
          </label>
        </div>
      </header>

      <main id="noi-dung" className="trang">
        {!kq && (
          <section className="gioi-thieu">
            <h1>Lập lá số Tử Vi</h1>
            <p>Nhập ngày giờ sinh dương lịch; web tự đổi sang âm lịch, an sao và luận giải. Mỗi nhận định đều dẫn về quy tắc đứng sau nó, kèm nhãn độ tin cậy của dữ liệu.</p>
            <p className="mo">Mọi tính toán chạy ngay trên trình duyệt của bạn; ngày giờ sinh không rời khỏi máy trừ khi bạn bấm “Viết lại bằng AI” (khi đó chỉ gửi ngày giờ sinh, không gửi tên).</p>
          </section>
        )}

        {(!kq || moForm) && (
          <section className="the" aria-label="Nhập thông tin">
            <FormNhap
              key={nhap ? JSON.stringify(nhap) : "moi"}
              khoiTao={nhap}
              daLuu={daLuu}
              onLap={lap}
              onMoLaSoLuu={lap}
              onXoaLuu={(id) => setDaLuu(xoaLaSo(id))}
            />
          </section>
        )}

        {loi && <p className="loi" role="alert">{loi}</p>}

        {kq && nhap && (
          <>
            <section className="tieu-de-ket-qua">
              <div>
                <h1>{nhap.ho_ten ?? "Lá số Tử Vi"}</h1>
                <p className="mo">
                  Dương lịch {String(nhap.ngay).padStart(2, "0")}/{String(nhap.thang).padStart(2, "0")}/{nhap.nam}, {String(nhap.gio).padStart(2, "0")}:{String(nhap.phut).padStart(2, "0")} · {nhap.gioi_tinh === "nam" ? "Nam" : "Nữ"} · {kq.lich.can_chi.nam}
                </p>
              </div>
              <div className="hang-nut hang-nut-tren">
                <button type="button" className="nut" onClick={() => setMoForm((v) => !v)} aria-expanded={moForm}>{moForm ? "Ẩn form" : "Sửa thông tin"}</button>
                <button type="button" className="nut" onClick={() => { setDaLuu(luuLaSo(nhap)); baoTam("Đã lưu lá số trong trình duyệt này."); }}>Lưu</button>
                <button type="button" className="nut" onClick={async () => { try { await navigator.clipboard.writeText(location.href); baoTam("Đã chép liên kết (không chứa họ tên)."); } catch { baoTam("Hãy chép liên kết từ thanh địa chỉ."); } }}>Chép liên kết</button>
                <button type="button" className="nut" onClick={() => taiPng(veLaSo(kq.la_so, "Lá số Tử Vi", nhap.ho_ten, kq.bao_cao.han, mauHanh), tenFile).catch((e) => baoTam(String(e.message)))}>Tải ảnh PNG</button>
                <button type="button" className="nut" onClick={() => taiSvg(veLaSo(kq.la_so, "Lá số Tử Vi", nhap.ho_ten, kq.bao_cao.han, mauHanh), tenFile)}>Tải SVG</button>
                <button type="button" className="nut" onClick={() => window.print()}>In / PDF</button>
              </div>
            </section>
            {thongBao && <p className="thong-bao" role="status">{thongBao}</p>}

            {kq.lich.canh_bao.length > 0 && (
              <ul className="canh-bao-ds">{kq.lich.canh_bao.map((c) => <li key={c} className="canh-bao">⚠ {c}</li>)}</ul>
            )}

            <div className="tabs" role="tablist" aria-label="Phần xem">
              {TABS.map(([k, ten]) => (
                <button key={k} type="button" role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`bang-${k}`} className={`tab${tab === k ? " tab-chon" : ""}`} onClick={() => setTab(k)}>{ten}</button>
              ))}
            </div>

            <div role="tabpanel" id={`bang-${tab}`} aria-labelledby={`tab-${tab}`} className="bang-tab">
              {tab === "la_so" && (
                <>
                  <label className="chon chon-dong"><input type="checkbox" checked={hienSaoLuu} onChange={(e) => setHienSaoLuu(e.target.checked)} /> Hiện sao lưu niên của năm {nhap.nam_xem}</label>
                  <label className="chon chon-dong"><input type="checkbox" checked={mauHanh} onChange={(e) => setMauHanh(e.target.checked)} /> Tô màu sao theo ngũ hành (bỏ chọn: xanh = tốt, đỏ = xấu)</label>
                  <BanCo kq={kq} hienSaoLuu={hienSaoLuu} mauHanh={mauHanh} />
                  <p className="mo">Bấm vào tên cung để xem luận cung, bấm vào tên sao để xem ý nghĩa và độ sáng. Số ở góc phải mỗi ô là tuổi bắt đầu đại hạn. Chữ “H” cạnh sao là sao hãm.</p>
                </>
              )}
              {tab === "tong_quan" && <TabTongQuan bc={kq.bao_cao} nhap={nhap} />}
              {tab === "cung" && <TabCung bc={kq.bao_cao} />}
              {tab === "han" && <TabHan bc={kq.bao_cao} namXem={nhap.nam_xem} onDoiNam={doiNam} />}
            </div>
          </>
        )}
      </main>

      <footer className="chan-trang">
        <p><b>Lưu ý.</b> Tử vi là hệ thống luận đoán truyền thống, kết quả chỉ để tham khảo và giải trí, không thay cho tư vấn y tế, pháp lý, tài chính. Phần an sao đã đối chiếu với hai engine độc lập (lasotuvi, iztro); phần luận giải còn nhiều nội dung do AI tổng hợp chưa đối chiếu sách — xem chấm màu từng câu và <a href="https://github.com/tinsdark/tu_vi/blob/claude/tender-hawking-log6bb/docs/07-engine-va-luan-giai.md" target="_blank" rel="noreferrer noopener">mô tả hạn chế</a>.</p>
      </footer>

      <NganKeo noiDung={nganKeo} bc={kq?.bao_cao ?? null} dong={dong} />
    </NganKeoCtx.Provider>
  );
}
