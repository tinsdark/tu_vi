import { useCallback, useEffect, useMemo, useState } from "react";
import { chuanHoaNhap, tinhLaSo, veLaSo, type KetQuaTinh, type NhapLieu } from "./engine";
import { docGiaoDien, docLuu, ghiGiaoDien, giaiMaNhap, luuLaSo, maHoaNhap, xoaLaSo, type GiaoDien, type LaSoDaLuu } from "./lib/luuTru";
import { taiPng, taiSvg } from "./lib/xuatAnh";
import { BanCo } from "./ui/BanCo";
import { ChuThichTinCay, DauHieu, Icon, NganKeoCtx, type NoiDungNganKeo, type TenIcon } from "./ui/chung";
import { FormNhap } from "./ui/FormNhap";
import { NganKeo } from "./ui/NganKeo";
import { TabCung } from "./ui/TabCung";
import { TabHan } from "./ui/TabHan";
import { TabTongQuan } from "./ui/TabTongQuan";

type Tab = "la_so" | "tong_quan" | "cung" | "han";
const TABS: [Tab, string][] = [["la_so", "Lá số"], ["tong_quan", "Tổng quan"], ["cung", "12 cung"], ["han", "Hạn"]];
const NHAN_GIAO_DIEN: Record<GiaoDien, string> = { tu_dong: "Theo thiết bị", sang: "Sáng", toi: "Tối" };
const ICON_GIAO_DIEN: Record<GiaoDien, TenIcon> = { tu_dong: "tu_dong", sang: "mat_troi", toi: "mat_trang" };
/** Chiều cao thanh đầu trang (px); khớp --cao-dau trong styles.css để cuộn tab không bị che. */
const CAO_DAU = 56;

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
  const [hienDuong, setHienDuong] = useState(true);
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

  const bangNhap = (
    <section className="the bang-nhap" aria-label="Nhập thông tin">
      <FormNhap
        key={nhap ? JSON.stringify(nhap) : "moi"}
        khoiTao={nhap}
        daLuu={daLuu}
        onLap={lap}
        onMoLaSoLuu={lap}
        onXoaLuu={(id) => setDaLuu(xoaLaSo(id))}
      />
    </section>
  );

  return (
    <NganKeoCtx.Provider value={setNganKeo}>
      <a className="bo-qua" href="#noi-dung">Bỏ qua tới nội dung</a>
      <header className="dau-trang">
        <div className="dau-trang-trong">
          <a className="thuong-hieu" href={location.pathname} onClick={(e) => { e.preventDefault(); history.replaceState(null, "", location.pathname); setNhap(null); }}>
            <DauHieu />
            <span>Tử Vi</span>
          </a>
          <div className="chon-giao-dien" role="group" aria-label="Giao diện sáng/tối">
            {(Object.keys(NHAN_GIAO_DIEN) as GiaoDien[]).map((g) => (
              <button key={g} type="button" className="gd-nut" aria-pressed={giaoDien === g} title={NHAN_GIAO_DIEN[g]} onClick={() => setGiaoDien(g)}>
                <Icon ten={ICON_GIAO_DIEN[g]} size={16} />
                <span className="chi-doc-man-hinh">{NHAN_GIAO_DIEN[g]}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main id="noi-dung" className="trang">
        {!kq && (
          <div className="mo-dau">
            <section className="gioi-thieu">
              <h1>Lập lá số <span>Tử Vi</span></h1>
              <p className="dan-nhap">Nhập ngày giờ sinh dương lịch; web tự đổi sang âm lịch, an sao và luận giải. Mỗi nhận định đều dẫn về quy tắc đứng sau nó.</p>
              <dl className="cam-ket">
                <div><dt>Ở lại trên máy bạn</dt><dd>Mọi tính toán chạy ngay trên trình duyệt; ngày giờ sinh không rời khỏi máy.</dd></div>
                <div><dt>Truy được về quy tắc</dt><dd>Bấm vào chấm màu cuối mỗi câu để xem quy tắc và nguồn của nó.</dd></div>
                <div><dt>Nói rõ chỗ chưa chắc</dt><dd>Mỗi quy tắc mang nhãn cho biết đã đối chiếu mấy nguồn:</dd></div>
              </dl>
              <ChuThichTinCay />
            </section>
            {bangNhap}
          </div>
        )}

        {kq && moForm && bangNhap}

        {loi && <p className="loi" role="alert">{loi}</p>}

        {kq && nhap && (
          <>
            <section className="tieu-de-ket-qua">
              <div className="tdkq-ten">
                <h1>{nhap.ho_ten ?? "Lá số Tử Vi"}</h1>
                <p className="meta-sinh">
                  <span>Dương lịch {String(nhap.ngay).padStart(2, "0")}/{String(nhap.thang).padStart(2, "0")}/{nhap.nam}, {String(nhap.gio).padStart(2, "0")}:{String(nhap.phut).padStart(2, "0")}</span>
                  <span>{nhap.gioi_tinh === "nam" ? "Nam" : "Nữ"}</span>
                  <span>{kq.lich.can_chi.nam}</span>
                </p>
              </div>
              <div className="hang-nut hang-nut-tren">
                <button type="button" className="nut" onClick={() => setMoForm((v) => !v)} aria-expanded={moForm}><Icon ten="sua" size={16} />{moForm ? "Ẩn form" : "Sửa thông tin"}</button>
                <button type="button" className="nut" onClick={() => { setDaLuu(luuLaSo(nhap)); baoTam("Đã lưu lá số trong trình duyệt này."); }}><Icon ten="luu" size={16} />Lưu</button>
                <button type="button" className="nut" onClick={async () => { try { await navigator.clipboard.writeText(location.href); baoTam("Đã chép liên kết (không chứa họ tên)."); } catch { baoTam("Hãy chép liên kết từ thanh địa chỉ."); } }}><Icon ten="lien_ket" size={16} />Chép liên kết</button>
                <details className="menu-xuat">
                  <summary className="nut"><Icon ten="tai" size={16} />Xuất</summary>
                  <div className="menu-xuat-ds">
                    <button type="button" onClick={() => taiPng(veLaSo(kq.la_so, "Lá số Tử Vi", nhap.ho_ten, kq.bao_cao.han, mauHanh), tenFile).catch((e) => baoTam(String(e.message)))}>Tải ảnh PNG</button>
                    <button type="button" onClick={() => taiSvg(veLaSo(kq.la_so, "Lá số Tử Vi", nhap.ho_ten, kq.bao_cao.han, mauHanh), tenFile)}>Tải SVG</button>
                    <button type="button" onClick={() => window.print()}><Icon ten="in" size={16} />In / PDF</button>
                  </div>
                </details>
              </div>
            </section>
            {thongBao && <p className="thong-bao" role="status">{thongBao}</p>}

            {kq.lich.canh_bao.length > 0 && (
              <ul className="canh-bao-ds">{kq.lich.canh_bao.map((c) => <li key={c} className="canh-bao"><Icon ten="canh_bao" size={16} /><span>{c}</span></li>)}</ul>
            )}

            <div className="tabs" role="tablist" aria-label="Phần xem">
              {TABS.map(([k, ten]) => (
                <button key={k} type="button" role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`bang-${k}`} className={`tab${tab === k ? " tab-chon" : ""}`} onClick={() => { setTab(k); const t = document.querySelector(".tabs"); if (t && t.getBoundingClientRect().top < 0) window.scrollTo({ top: window.scrollY + t.getBoundingClientRect().top - CAO_DAU }); }}>{ten}</button>
              ))}
            </div>

            <div role="tabpanel" id={`bang-${tab}`} aria-labelledby={`tab-${tab}`} className="bang-tab">
              {tab === "la_so" && (
                <>
                  <div className="tuy-chon">
                    <label className="chon"><input type="checkbox" role="switch" checked={hienSaoLuu} onChange={(e) => setHienSaoLuu(e.target.checked)} /> Sao lưu niên {nhap.nam_xem}</label>
                    <label className="chon" title="Bỏ chọn: sao tốt màu xanh, sao xấu màu đỏ"><input type="checkbox" role="switch" checked={mauHanh} onChange={(e) => setMauHanh(e.target.checked)} /> Màu sao theo ngũ hành</label>
                    <label className="chon" title="Vẽ đường nối các cung chiếu vào cung đang chọn và đánh dấu sao giúp / làm xấu"><input type="checkbox" role="switch" checked={hienDuong} onChange={(e) => setHienDuong(e.target.checked)} /> Đường đối chiếu cung</label>
                  </div>
                  <BanCo kq={kq} hienSaoLuu={hienSaoLuu} mauHanh={mauHanh} hienDuong={hienDuong} />
                  <p className="mo huong-dan-doc">Bấm tên cung để xem các cung chiếu vào nó (hoặc luận cung khi tắt đường đối chiếu), bấm tên sao để xem ý nghĩa và độ sáng. Số ở góc phải mỗi ô là tuổi bắt đầu đại hạn; (M) miếu, (V) vượng, (Đ) đắc, (B) bình, (H) hãm.</p>
                </>
              )}
              {tab === "tong_quan" && <TabTongQuan bc={kq.bao_cao} nc={kq.nang_cao} />}
              {tab === "cung" && <TabCung bc={kq.bao_cao} />}
              {tab === "han" && <TabHan bc={kq.bao_cao} nc={kq.nang_cao} namXem={nhap.nam_xem} onDoiNam={doiNam} />}
            </div>
          </>
        )}
      </main>

      <footer className="chan-trang">
        <p><b>Lưu ý.</b> Tử vi là hệ thống luận đoán truyền thống, kết quả chỉ để tham khảo và giải trí, không thay cho tư vấn y tế, pháp lý, tài chính. Phần an sao đã đối chiếu với hai engine độc lập (lasotuvi, iztro); phần luận giải còn nhiều nội dung do AI tổng hợp chưa đối chiếu sách — xem chấm màu từng câu và <a href="https://github.com/tinsdark/tu_vi/blob/claude/tender-hawking-log6bb/docs/07-engine-va-luan-giai.md" target="_blank" rel="noreferrer noopener">mô tả hạn chế</a>.</p>
      </footer>

      <NganKeo noiDung={nganKeo} bc={kq?.bao_cao ?? null} laSo={kq?.la_so ?? null} dong={dong} />
    </NganKeoCtx.Provider>
  );
}
