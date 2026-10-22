import { THU_TU_CUNG, type BaoCao } from "../engine";
import { DanhSachNhanDinh, ThanhPhanVi, useNganKeo } from "./chung";

export function TabCung({ bc }: { bc: BaoCao }) {
  const mo = useNganKeo();
  return (
    <div className="tab-noi-dung">
      <p className="mo">Xếp loại so với 3.000 lá số ngẫu nhiên, riêng từng cung. “Rất tốt” nghĩa là thuộc nhóm cao nhất ~10% về cung đó — đây là thang đo, không phải bằng chứng luận đúng.</p>
      {THU_TU_CUNG.map((ten, i) => {
        const k = bc.cung[ten];
        return (
          <details key={ten} className="cung-chi-tiet" open={i === 0}>
            <summary>
              <span className="cung-ten">{ten}</span>
              <span className="cung-chi">{k.chi}</span>
              <span className="cung-sao">{k.chinh_tinh.length ? k.chinh_tinh.join(" · ") : "vô chính diệu"}</span>
              <span className={`pill pill-${k.xep_loai.replace(/ /g, "-").toLowerCase()}`}>{k.xep_loai}</span>
            </summary>
            <div className="cung-than-bai">
              <ThanhPhanVi phanVi={k.phan_vi} xepLoai={k.xep_loai} />
              <p className="mo">Điểm {k.diem}{k.tuan_triet.length ? ` · ${k.tuan_triet.join("/")} đóng cung này` : ""}. <button type="button" className="nut-chu" onClick={() => mo({ loai: "cung", ten })}>Mở riêng</button></p>
              <DanhSachNhanDinh ds={k.nhan_dinh} />
            </div>
          </details>
        );
      })}
    </div>
  );
}
