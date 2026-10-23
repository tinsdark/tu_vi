import { useState } from "react";
import { chuanHoaNhap, LUA_CHON_PROFILE, PROFILE_MAC_DINH, QUY_UOC_MAC_DINH, type NhapLieu, type Profile } from "../engine";
import type { LaSoDaLuu } from "../lib/luuTru";
import { HIEN_NANG_CAO } from "../lib/tinhNang";

const homNay = new Date();
const dinhDangNgay = (n: NhapLieu) => `${n.nam}-${String(n.thang).padStart(2, "0")}-${String(n.ngay).padStart(2, "0")}`;
const dinhDangGio = (n: NhapLieu) => `${String(n.gio).padStart(2, "0")}:${String(n.phut).padStart(2, "0")}`;

interface Props {
  khoiTao: NhapLieu | null;
  daLuu: LaSoDaLuu[];
  onLap: (n: NhapLieu) => void;
  onMoLaSoLuu: (n: NhapLieu) => void;
  onXoaLuu: (id: string) => void;
}

export function FormNhap({ khoiTao, daLuu, onLap, onMoLaSoLuu, onXoaLuu }: Props) {
  const [hoTen, setHoTen] = useState(khoiTao?.ho_ten ?? "");
  const [ngay, setNgay] = useState(khoiTao ? dinhDangNgay(khoiTao) : "");
  const [gio, setGio] = useState(khoiTao ? dinhDangGio(khoiTao) : "");
  const [gt, setGt] = useState<string>(khoiTao?.gioi_tinh ?? "");
  const [mien, setMien] = useState<string>(khoiTao?.mien ?? "nam");
  const [namXem, setNamXem] = useState(String(khoiTao?.nam_xem ?? homNay.getFullYear()));
  const [quyUoc, setQuyUoc] = useState(khoiTao?.quy_uoc ?? QUY_UOC_MAC_DINH);
  const [kinhDo, setKinhDo] = useState(khoiTao?.kinh_do !== undefined ? String(khoiTao.kinh_do) : "");
  const [profile, setProfile] = useState<Profile>(khoiTao?.profile ?? PROFILE_MAC_DINH);
  const [loi, setLoi] = useState<string[]>([]);

  function gui(e: React.FormEvent) {
    e.preventDefault();
    const [nam, thang, ng] = ngay.split("-").map(Number);
    const [g, p] = gio.split(":").map(Number);
    const kt = chuanHoaNhap({
      nam, thang, ngay: ng, gio: g, phut: p, gioi_tinh: gt, mien, quy_uoc: quyUoc, profile, ho_ten: hoTen,
      kinh_do: kinhDo === "" ? undefined : Number(kinhDo), nam_xem: Number(namXem),
    });
    if (!ngay) return setLoi(["Hãy chọn ngày sinh dương lịch."]);
    if (!gio) return setLoi(["Hãy nhập giờ sinh (nếu không biết giờ, lá số sẽ không chính xác)."]);
    if (!kt.ok) return setLoi(kt.loi);
    setLoi([]);
    onLap(kt.nhap);
  }

  return (
    <form className="form-nhap" onSubmit={gui} noValidate>
      <div className="luoi-form">
        <label className="truong truong-rong">
          <span>Họ tên <em>(không bắt buộc, chỉ lưu trong máy bạn)</em></span>
          <input type="text" value={hoTen} maxLength={80} onChange={(e) => setHoTen(e.target.value)} autoComplete="off" />
        </label>
        <label className="truong">
          <span>Ngày sinh <em>(dương lịch)</em></span>
          <input type="date" value={ngay} min="1900-01-01" max="2100-12-31" onChange={(e) => setNgay(e.target.value)} required />
        </label>
        <label className="truong">
          <span>Giờ sinh <em>(giờ trên giấy khai sinh)</em></span>
          <input type="time" value={gio} onChange={(e) => setGio(e.target.value)} required />
        </label>
        <fieldset className="truong">
          <legend>Giới tính</legend>
          <div className="nhom-chon">
            <label className="chon"><input type="radio" name="gt" value="nam" checked={gt === "nam"} onChange={() => setGt("nam")} /> Nam</label>
            <label className="chon"><input type="radio" name="gt" value="nu" checked={gt === "nu"} onChange={() => setGt("nu")} /> Nữ</label>
          </div>
        </fieldset>
        <fieldset className="truong">
          <legend>Nơi sinh</legend>
          <div className="nhom-chon">
            <label className="chon"><input type="radio" name="mien" value="bac" checked={mien === "bac"} onChange={() => setMien("bac")} /> Miền Bắc</label>
            <label className="chon"><input type="radio" name="mien" value="nam" checked={mien === "nam"} onChange={() => setMien("nam")} /> Miền Nam</label>
          </div>
          <em className="goi-y">Chỉ ảnh hưởng người sinh trước 1976.</em>
        </fieldset>
        <label className="truong">
          <span>Năm xem hạn</span>
          <input type="number" inputMode="numeric" value={namXem} min={1900} max={2250} onChange={(e) => setNamXem(e.target.value)} />
        </label>
      </div>

      {HIEN_NANG_CAO && <details className="nang-cao">
        <summary>Tùy chọn nâng cao: quy ước giờ/lịch và phái</summary>
        <div className="nang-cao-noi-dung">
          <h4>Quy ước giờ và lịch</h4>
          <label className="truong">
            <span>Sinh 23:00–23:59 tính theo</span>
            <select value={quyUoc.ty_muon} onChange={(e) => setQuyUoc({ ...quyUoc, ty_muon: e.target.value as typeof quyUoc.ty_muon })}>
              <option value="ngay_sau">Ngày hôm sau (giờ Tý, phổ biến)</option>
              <option value="ngay_do">Ngày hôm đó</option>
            </select>
          </label>
          <label className="truong">
            <span>Sinh tháng nhuận an Mệnh/Thân như</span>
            <select value={quyUoc.thang_nhuan} onChange={(e) => setQuyUoc({ ...quyUoc, thang_nhuan: e.target.value as typeof quyUoc.thang_nhuan })}>
              <option value="nhu_thang_truoc">Tháng trước (phổ biến)</option>
              <option value="nhu_thang_sau">Tháng sau</option>
              <option value="chia_nua">Chia nửa: ngày 1–15 như tháng trước, từ 16 như tháng sau</option>
            </select>
          </label>
          <label className="chon chon-dong">
            <input type="checkbox" checked={quyUoc.mui_gio_lich_su} onChange={(e) => setQuyUoc({ ...quyUoc, mui_gio_lich_su: e.target.checked })} />
            Đổi giờ khai sinh theo múi giờ lịch sử (miền Nam dùng UTC+8 nhiều giai đoạn trước 1975)
          </label>
          <label className="chon chon-dong">
            <input type="checkbox" checked={quyUoc.gio_mat_troi} onChange={(e) => setQuyUoc({ ...quyUoc, gio_mat_troi: e.target.checked })} />
            Dùng giờ mặt trời thực theo kinh độ nơi sinh
          </label>
          {quyUoc.gio_mat_troi && (
            <label className="truong">
              <span>Kinh độ nơi sinh <em>(độ Đông, 100–110; Hà Nội ≈ 105.85, TP.HCM ≈ 106.7)</em></span>
              <input type="number" step="0.01" min={100} max={110} value={kinhDo} onChange={(e) => setKinhDo(e.target.value)} />
            </label>
          )}
          <h4>Chỗ các phái an sao khác nhau</h4>
          <p className="mo">Mặc định là cách phổ biến nhất. Đổi khi bạn muốn đối chiếu với lá số của thầy/phần mềm khác.</p>
          {(Object.keys(LUA_CHON_PROFILE) as (keyof Profile)[]).map((k) => (
            <label className="truong" key={k}>
              <span>{LUA_CHON_PROFILE[k].nhan} <em>{LUA_CHON_PROFILE[k].mo_ta}</em></span>
              <select value={profile[k]} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })}>
                {LUA_CHON_PROFILE[k].gia_tri.map((v) => <option key={v} value={v}>{v}{v === PROFILE_MAC_DINH[k] ? " (mặc định)" : ""}</option>)}
              </select>
            </label>
          ))}
        </div>
      </details>}

      {loi.length > 0 && (
        <ul className="loi" role="alert">{loi.map((l) => <li key={l}>{l}</li>)}</ul>
      )}
      <div className="hang-nut">
        <button type="submit" className="nut nut-chinh">Lập lá số</button>
      </div>

      {daLuu.length > 0 && (
        <div className="da-luu">
          <h4>Lá số đã lưu trong máy này</h4>
          <ul>
            {daLuu.map((x) => (
              <li key={x.id}>
                <button type="button" className="nut-chu" onClick={() => onMoLaSoLuu(x.nhap)}>
                  {x.nhap.ho_ten ?? "(không tên)"} — {String(x.nhap.ngay).padStart(2, "0")}/{String(x.nhap.thang).padStart(2, "0")}/{x.nhap.nam} {dinhDangGio(x.nhap)}
                </button>
                <button type="button" className="nut-chu nut-xoa" onClick={() => onXoaLuu(x.id)} aria-label="Xóa lá số đã lưu">Xóa</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
