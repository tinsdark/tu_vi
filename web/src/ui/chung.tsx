import { createContext, useContext, type ReactNode } from "react";
import { NHAN_TIN_CAY, tinCay, type NhanDinh } from "../engine";

export type NoiDungNganKeo =
  | { loai: "quy_tac"; id: string }
  | { loai: "sao"; ten: string; chi?: number }
  | { loai: "cung"; ten: string }
  | { loai: "nen"; id: import("../engine").NenId };

export const NganKeoCtx = createContext<(n: NoiDungNganKeo) => void>(() => {});
export const useNganKeo = () => useContext(NganKeoCtx);

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

export function DanhSachNhanDinh({ ds: tatCa, rong }: { ds: NhanDinh[]; rong?: boolean }) {
  const hien = tatCa.filter((n) => !n.an); // câu đã gộp vào câu "trái chiều" (XD.*) không hiện lại
  if (!hien.length) return <p className="mo">Không có nhận định nào nổi bật.</p>;
  const chinh = hien.filter((n) => !n.nho);
  const phu = hien.filter((n) => n.nho); // phụ tinh ±1: không tính điểm, gập lại để không át nhận định chính
  const danh = (ds: NhanDinh[]) => (
    <ul className={`nhan-dinh${rong ? " nhan-dinh-rong" : ""}`}>
      {ds.map((n, i) => (
        <li key={`${n.id}-${i}`} className={n.dao_dau ? "nd-trung" : n.nho ? "nd-nho" : n.diem > 0 ? "nd-tot" : n.diem < 0 ? "nd-xau" : "nd-trung"}>
          <ChamTinCay id={n.id} />
          <span className="nd-van">{n.nhan_dinh}</span>
          {n.ly_do && <span className="nd-ly-do">{n.ly_do}</span>}
        </li>
      ))}
    </ul>
  );
  if (!chinh.length) return danh(phu);
  return (
    <>
      {danh(chinh)}
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
