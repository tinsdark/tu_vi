import { createContext, useContext, type ReactNode } from "react";
import { NHAN_TIN_CAY, tinCay, type NhanDinh } from "../engine";

export type NoiDungNganKeo =
  | { loai: "quy_tac"; id: string }
  | { loai: "sao"; ten: string; chi?: number }
  | { loai: "cung"; ten: string };

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

export function DanhSachNhanDinh({ ds, rong }: { ds: NhanDinh[]; rong?: boolean }) {
  if (!ds.length) return <p className="mo">Không có nhận định nào nổi bật.</p>;
  return (
    <ul className={`nhan-dinh${rong ? " nhan-dinh-rong" : ""}`}>
      {ds.map((n, i) => (
        <li key={`${n.id}-${i}`} className={n.dao_dau ? "nd-trung" : n.diem > 0 ? "nd-tot" : n.diem < 0 ? "nd-xau" : "nd-trung"}>
          <ChamTinCay id={n.id} />
          <span className="nd-van">{n.nhan_dinh}</span>
          {n.ly_do && <span className="nd-ly-do">{n.ly_do}</span>}
        </li>
      ))}
    </ul>
  );
}

const MAU_XEP: Record<string, string> = { "Rất tốt": "rt", Tốt: "t", "Trung bình": "tb", Xấu: "x", "Rất xấu": "rx", "Chưa hiệu chỉnh": "tb" };

export function ThanhPhanVi({ phanVi, xepLoai }: { phanVi: number; xepLoai: string }) {
  return (
    <div className={`phan-vi phan-vi-${MAU_XEP[xepLoai] ?? "tb"}`} role="img" aria-label={`${xepLoai}, cao hơn khoảng ${phanVi}% lá số khác`}>
      <div className="phan-vi-thanh"><div style={{ width: `${phanVi}%` }} /></div>
      <span className="phan-vi-chu"><b>{xepLoai}</b> · hơn ~{phanVi}% lá số</span>
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
