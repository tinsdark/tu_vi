import { THU_TU_CUNG, type BaoCao } from "../engine";
import { DanhSachNhanDinh, MAU_XEP, ThanhDiem, useNganKeo } from "./chung";

export function TabCung({ bc }: { bc: BaoCao }) {
  const mo = useNganKeo();
  return (
    <div className="tab-noi-dung">
      <p className="mo">Điểm /100 phản ánh tương quan nội tại giữa các cung của chính lá số này (bội số 5, 6 bậc) — không so với lá số khác và không phải bằng chứng luận đúng. Sao ở cung xung/hội chiếu luôn được ghi rõ là “từ cung …”.</p>
      {THU_TU_CUNG.map((ten, i) => {
        const k = bc.cung[ten];
        return (
          <details key={ten} className="cung-chi-tiet" open={i === 0}>
            <summary>
              <span className="cung-ten">{ten}</span>
              <span className="cung-chi">{k.chi}</span>
              <span className="cung-sao">{k.chinh_tinh.length ? k.chinh_tinh.join(" · ") : "vô chính diệu"}</span>
              <span className={`pill pill-${MAU_XEP[k.xep_loai]}`}>{k.xep_loai}</span>
            </summary>
            <div className="cung-than-bai">
              <ThanhDiem diem100={k.diem100} xepLoai={k.xep_loai} />
              <p className="mo">Điểm cung {k.diem}{k.tuan_triet.length ? ` · ${k.tuan_triet.join("/")} đóng cung này` : ""}. <button type="button" className="nut-chu" onClick={() => mo({ loai: "cung", ten })}>Mở riêng</button></p>
              <DanhSachNhanDinh ds={k.nhan_dinh} />
            </div>
          </details>
        );
      })}
    </div>
  );
}
