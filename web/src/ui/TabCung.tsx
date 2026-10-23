import { THU_TU_CUNG, type BaoCao, type KhoanSao, type PhanTichDiem } from "../engine";
import { DanhSachNhanDinh, MAU_XEP, ThanhDiem, useNganKeo } from "./chung";

const VI_TRI: Record<string, string> = { ban_cung: "bản cung", xung: "xung chiếu", tam_hop: "tam hợp" };
const dau = (x: number) => `${x > 0 ? "+" : ""}${x}`;

/** Cho người đọc (và người review) thấy con số /100 đến từ đâu: nền + cát − sát + cách cục, nén Tuần/Triệt, sàn. Không đổi điểm. */
function CachTinhDiem({ p }: { p: PhanTichDiem }) {
  const sao = (ds: KhoanSao[]) => ds.map((x) => `${x.sao} (${VI_TRI[x.vi_tri] ?? x.vi_tri}, ${dau(x.diem)})`).join(", ") || "không có";
  return (
    <details className="cach-tinh">
      <summary>Vì sao ra con số này?</summary>
      <dl>
        <dt>Điểm khởi đầu</dt><dd>50</dd>
        <dt>Chính tinh {p.vo_chinh_dieu ? "(cung vô chính diệu: mượn từ cung xung, đã giảm lực)" : "bản cung"}</dt>
        <dd>{dau(p.tong_base)} <span className="mo">{p.base.map((b) => `${b.sao} ${b.do_sang}`).join(", ") || "không có"}</span></dd>
        <dt>Cát tinh (bản cung, xung, tam hợp)</dt><dd>{dau(p.tong_cat)} <span className="mo">{sao(p.cat)}</span></dd>
        <dt>Sát tinh</dt><dd>{dau(p.tong_sat)} <span className="mo">{sao(p.sat)}</span></dd>
        <dt>Cách cục</dt><dd>{dau(p.cach_cuc)}</dd>
        <dt>Cộng lại</dt><dd>{p.raw_truoc_triet}</dd>
        {p.k_triet_tuan !== 1 && (<><dt>Nén về giữa vì Tuần/Triệt</dt><dd>× {p.k_triet_tuan} → {p.raw_sau_triet}</dd></>)}
        {p.san_ap_dung > 0 && (<><dt>Sàn (có chính tinh miếu/vượng)</dt><dd>không thấp hơn {p.san_ap_dung}</dd></>)}
        <dt>Điểm nội tại</dt><dd><b>~{p.score_cuoi}/100</b> <span className="mo">(làm tròn bội 5)</span></dd>
      </dl>
      <p className="mo">Hằng số của công thức là giá trị khởi điểm của người soạn, chưa được hiệu chỉnh trên dữ liệu thật; chỉ dùng để so các cung của cùng một lá số.</p>
    </details>
  );
}

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
              <CachTinhDiem p={k.phan_tich} />
              <p className="mo">Điểm cung {k.diem}{k.tuan_triet.length ? ` · ${k.tuan_triet.join("/")} đóng cung này` : ""}. <button type="button" className="nut-chu" onClick={() => mo({ loai: "cung", ten })}>Mở riêng</button></p>
              <DanhSachNhanDinh ds={k.nhan_dinh} toiDa={4} />
            </div>
          </details>
        );
      })}
    </div>
  );
}
