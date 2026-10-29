import { useState, type FormEvent } from "react";
import { DauHieu } from "./chung";
import { ghiMoKhoa, kiemTraMatKhau } from "../lib/khoa";

export function ManHinhKhoa({ onMo }: { onMo: () => void }) {
  const [mk, setMk] = useState("");
  const [loi, setLoi] = useState("");
  const [dang, setDang] = useState(false);

  const gui = async (e: FormEvent) => {
    e.preventDefault();
    setDang(true);
    setLoi("");
    try {
      if (await kiemTraMatKhau(mk)) { ghiMoKhoa(); onMo(); return; }
      setLoi("Sai mật khẩu.");
    } catch (err) {
      setLoi((err as Error).message);
    }
    setDang(false);
  };

  return (
    <main className="trang man-hinh-khoa">
      <form className="the" onSubmit={gui}>
        <DauHieu size={40} />
        <h1>Tử Vi</h1>
        <label className="truong">
          <span>Mật khẩu</span>
          <input type="password" value={mk} onChange={(e) => setMk(e.target.value)} autoComplete="current-password" autoFocus required />
        </label>
        {loi && <p className="loi" role="alert">{loi}</p>}
        <button type="submit" className="nut nut-chinh" disabled={dang}>{dang ? "Đang kiểm tra…" : "Mở"}</button>
      </form>
    </main>
  );
}
