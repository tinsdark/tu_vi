import { createContext, useContext, type ReactNode } from "react";
import { NHAN_TIN_CAY, tinCay, type NhanDinh } from "../engine";

export type NoiDungNganKeo =
  | { loai: "quy_tac"; id: string }
  | { loai: "sao"; ten: string; chi?: number }
  | { loai: "cung"; ten: string }
  | { loai: "nen"; id: import("../engine").NenId };

export const NganKeoCtx = createContext<(n: NoiDungNganKeo) => void>(() => {});
export const useNganKeo = () => useContext(NganKeoCtx);

/** Bộ icon một nét (24px, nét 1.6, đầu tròn) dùng chung toàn giao diện. */
const DUONG_ICON = {
  sua: <path d="M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4" />,
  luu: <path d="M7 4h10v16l-5-3.5L7 20z" />,
  lien_ket: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  tai: <path d="M12 4v11 M7.5 10.5L12 15l4.5-4.5 M5 19h14" />,
  in: <path d="M7 9V4h10v5 M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2 M7 14h10v6H7z" />,
  canh_bao: <path d="M12 4l9 16H3z M12 10v4.5 M12 17.5v.01" />,
  dong: <path d="M6 6l12 12M18 6L6 18" />,
  trai: <path d="M14 6l-6 6 6 6" />,
  phai: <path d="M10 6l6 6-6 6" />,
  mat_troi: <><circle cx="12" cy="12" r="3.8" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" /></>,
  mat_trang: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  tu_dong: <><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" /></>,
  tinh_tu: <path d="M12 3.5l2.2 6.3 6.3 2.2-6.3 2.2L12 20.5l-2.2-6.3L3.5 12l6.3-2.2z" />,
} as const;
export type TenIcon = keyof typeof DUONG_ICON;

export function Icon({ ten, size = 18 }: { ten: TenIcon; size?: number }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {DUONG_ICON[ten]}
    </svg>
  );
}

/** Logo: khung lá số 4×4 có ô giữa rỗng, một ngôi sao ở giữa. */
export function DauHieu({ size = 28 }: { size?: number }) {
  return (
    <svg className="dau-hieu" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeLinejoin="round">
        <rect x="11" y="11" width="42" height="42" rx="2" strokeWidth="2.4" />
        <rect x="23" y="23" width="18" height="18" strokeWidth="1.6" />
        <path d="M11 23h12M41 23h12M11 41h12M41 41h12M23 11v12M41 11v12M23 41v12M41 41v12" strokeWidth="1.6" />
      </g>
      <path className="dau-hieu-sao" d="M32 26.5l1.9 3.6 3.6 1.9-3.6 1.9-1.9 3.6-1.9-3.6-3.6-1.9 3.6-1.9z" fill="currentColor" />
    </svg>
  );
}

export function ChamTinCay({ id, nho }: { id: string; nho?: boolean }) {
  const t = tinCay(id);
  const mo = useNganKeo();
  return (
    <button type="button" className={`cham cham-${t}${nho ? " cham-nho" : ""}`} title={`${NHAN_TIN_CAY[t]} — bấm để xem quy tắc ${id}`} aria-label={`Xem quy tắc ${id}: ${NHAN_TIN_CAY[t]}`} onClick={() => mo({ loai: "quy_tac", id })} />
  );
}

export function ChuThichTinCay() {
  return (
    <p className="chu-thich" aria-label="Chú thích độ tin cậy">
      {(["xanh", "vang", "xam"] as const).map((t) => (
        <span key={t} className="chu-thich-muc"><span className={`cham cham-${t} cham-tinh`} aria-hidden="true" /> {NHAN_TIN_CAY[t]}</span>
      ))}
    </p>
  );
}

/** Số nhận định chính hiện ngay; phần còn lại gập vào "Xem thêm" để người đọc không phải lướt qua danh sách dài. */
const TOI_DA_HIEN = 6;

export function DanhSachNhanDinh({ ds: tatCa, rong, toiDa = TOI_DA_HIEN }: { ds: NhanDinh[]; rong?: boolean; toiDa?: number }) {
  const hien = tatCa.filter((n) => !n.an); // câu đã gộp vào câu "trái chiều" (XD.*) không hiện lại
  if (!hien.length) return <p className="mo">Không có nhận định nào nổi bật.</p>;
  const chinh = hien.filter((n) => !n.nho);
  const phu = hien.filter((n) => n.nho); // phụ tinh ±1: không tính điểm, gập lại để không át nhận định chính
  const danh = (ds: NhanDinh[]) => (
    <ul className={`nhan-dinh${rong ? " nhan-dinh-rong" : ""}`}>
      {ds.map((n, i) => (
        <li key={`${n.id}-${i}`} className={n.dao_dau ? "nd-trung" : n.nho ? "nd-nho" : n.diem > 0 ? "nd-tot" : n.diem < 0 ? "nd-xau" : "nd-trung"}>
          <ChamTinCay id={n.id} />
          <span className="nd-van">
            {!n.dao_dau && !n.nho && n.diem !== 0 && (
              <>
                <b className="nd-dau" aria-hidden="true">{n.diem > 0 ? "+" : "−"}</b>
                <span className="chi-doc-man-hinh">{n.diem > 0 ? "Thuận: " : "Bất lợi: "}</span>
              </>
            )}
            {n.nhan_dinh}
          </span>
          {n.ly_do && <span className="nd-ly-do">{n.ly_do}</span>}
        </li>
      ))}
    </ul>
  );
  if (!chinh.length) return danh(phu);
  // nhiều hơn mức hiện: giữ các câu có điểm lớn nhất (câu lưu ý cấu trúc điểm 0 xếp sau), phần còn lại gập lại
  const xep = chinh.length > toiDa ? [...chinh].sort((a, b) => Math.abs(b.diem) - Math.abs(a.diem)) : chinh;
  const hienNgay = xep.slice(0, toiDa);
  const them = xep.slice(toiDa);
  return (
    <>
      {danh(hienNgay)}
      {them.length > 0 && (
        <details className="sao-phu">
          <summary>Xem thêm ({them.length})</summary>
          {danh(them)}
        </details>
      )}
      {phu.length > 0 && (
        <details className="sao-phu">
          <summary>Sao phụ khác ({phu.length})</summary>
          {danh(phu)}
        </details>
      )}
    </>
  );
}

/** 6 bậc điểm nội tại → lớp màu: rt/t/k = tốt/khá, tb = trung bình, th/rth = thấp. */
export const MAU_XEP: Record<string, string> = { "Rất tốt": "rt", Tốt: "t", Khá: "k", "Trung bình": "tb", Thấp: "th", "Rất thấp": "rth" };

/** Thanh điểm nội tại /100 — tương quan giữa các cung của chính lá số này, KHÔNG phải so với lá số khác. */
export function ThanhDiem({ diem100, xepLoai }: { diem100: number; xepLoai: string }) {
  return (
    <div className={`phan-vi phan-vi-${MAU_XEP[xepLoai] ?? "tb"}`} role="img" aria-label={`${xepLoai}, khoảng ${diem100} trên 100 (điểm nội tại của lá số này)`}>
      <div className="phan-vi-thanh"><div style={{ width: `${diem100}%` }} /></div>
      <span className="phan-vi-chu"><b>{xepLoai}</b> · ~{diem100}/100</span>
    </div>
  );
}

export function Khoi({ tieuDe, children, ghiChu }: { tieuDe: string; children: ReactNode; ghiChu?: string }) {
  return (
    <section className="khoi">
      <h3>{tieuDe}</h3>
      {ghiChu && <p className="mo">{ghiChu}</p>}
      {children}
    </section>
  );
}
