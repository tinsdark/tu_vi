import { type BaoCao, type KetQuaNangCao } from "../engine";
import { ChuThichTinCay, DanhSachNhanDinh, Khoi, MAU_XEP as MAU } from "./chung";

export function TabHan({ bc, nc, namXem, onDoiNam }: { bc: BaoCao; nc: KetQuaNangCao; namXem: number; onDoiNam: (n: number) => void }) {
  const h = bc.han;
  if (!h) return <p className="mo">Chưa có dữ liệu hạn.</p>;
  const d = h.dai_han;
  const diemMax = Math.max(...h.luu_nguyet.map((m) => Math.abs(m.diem)), 1);
  return (
    <div className="tab-noi-dung">
      <div className="chon-nam" role="group" aria-label="Năm xem hạn">
        <button type="button" className="nut" onClick={() => onDoiNam(namXem - 1)} aria-label="Năm trước">‹</button>
        <label>Năm <input type="number" value={namXem} onChange={(e) => Number.isFinite(e.currentTarget.valueAsNumber) && onDoiNam(e.currentTarget.valueAsNumber)} /></label>
        <button type="button" className="nut" onClick={() => onDoiNam(namXem + 1)} aria-label="Năm sau">›</button>
        <span className="mo">Tuổi âm {h.tuoi_am}</span>
      </div>
      <ChuThichTinCay />

      <Khoi tieuDe="Đại hạn 10 năm" ghiChu="Chấm lại 5 cung theo tam phương của cung đại hạn, có chồng Tứ Hóa đại hạn (kỹ thuật Bắc phái — mặc định bật).">
        {d ? (
          <>
            <p><b>Tuổi {d.tu_tuoi}–{d.tu_tuoi + 9}</b> · đại hạn tại <b>{d.chi}</b> (cung {d.cung_goc} trên lá số gốc) · can {d.can}</p>
            <p className="mo">Tứ Hóa đại hạn: {Object.entries(d.tu_hoa).map(([k, v]) => `${k} → ${v}`).join("; ")}</p>
            <div className="luoi-dai-han">
              {Object.entries(d.danh_gia).map(([ten, v]) => (
                <details key={ten} className={`the-dh the-dh-${MAU[v.xep_loai]}`}>
                  <summary>
                    <span className="dh-ten">{ten} đại hạn <small>({v.chi})</small></span>
                    <span className="dh-xep">{v.xep_loai} <small>({v.diem})</small></span>
                  </summary>
                  <DanhSachNhanDinh ds={v.noi_bat} />
                </details>
              ))}
            </div>
          </>
        ) : <p className="mo">Tuổi này nằm ngoài các đại hạn đã tính (trên 120 tuổi).</p>}
      </Khoi>

      <Khoi tieuDe={`Năm ${namXem}`}>
        <p>Tiểu hạn tại <b>{h.tieu_han.chi}</b> (cung {h.tieu_han.cung_goc} gốc): <b>{h.tieu_han.xep_loai}</b></p>
        <p>Lưu Thái Tuế tại <b>{h.luu_nien.thai_tue_tai}</b>: <b>{h.luu_nien.xep_loai}</b></p>
        <p className="mo">Tứ Hóa năm: {Object.entries(h.luu_nien.tu_hoa).map(([k, v]) => `${k} → ${v}`).join("; ")}</p>
        {h.luu_nien.ghi_chu.length > 0 ? <DanhSachNhanDinh ds={h.luu_nien.ghi_chu} /> : <p className="mo">Không có sao lưu nổi bật rơi vào tam phương cung Thái Tuế.</p>}
        {h.luu_nien.ket_luan.length > 0 && (
          <>
            <h4>Kết luận và khuyến nghị</h4>
            <DanhSachNhanDinh ds={h.luu_nien.ket_luan} rong />
          </>
        )}
        {nc.tuoi && nc.tuoi.loai !== "khong" && <p className={nc.tuoi.loai === "tam_hop" ? "tot" : "xau"}>{nc.tuoi.nhan_dinh}</p>}
        {nc.trung_phung && (nc.trung_phung.canh_bao.length > 0 || nc.trung_phung.thuan.length > 0) && (
          <>
            <h4>Trùng phùng đại hạn × lưu niên</h4>
            <ul>
              {nc.trung_phung.canh_bao.map((c) => <li key={c} className="xau">{c}</li>)}
              {nc.trung_phung.thuan.map((c) => <li key={c} className="tot">{c}</li>)}
            </ul>
          </>
        )}
        <details className="phu-luc">
          <summary>Vị trí các sao lưu niên</summary>
          <ul className="sao-luu">{Object.entries(h.luu_nien.sao_luu).map(([k, v]) => <li key={k}><b>{k}</b> {v}</li>)}</ul>
        </details>
      </Khoi>

      <Khoi tieuDe="Lưu nguyệt (12 tháng âm)" ghiChu="Chấm cung tháng như một cung Mệnh nhỏ. Chỉ so các tháng trong cùng năm với nhau: 2 tháng cao nhất và 2 tháng thấp nhất được đánh dấu.">
        <ol className="luu-nguyet">
          {h.luu_nguyet.map((m) => (
            <li key={m.thang} className={m.nhan_xet === "tốt nhất năm" ? "ln-tot" : m.nhan_xet ? "ln-xau" : ""}>
              <span className="ln-thang">Tháng {m.thang}</span>
              <span className="ln-thanh"><span style={{ width: `${Math.max(4, ((m.diem + diemMax) / (2 * diemMax)) * 100)}%` }} /></span>
              <span className="ln-cung">{m.chi} · {m.cung_goc}</span>
              <span className="ln-nhan">{m.nhan_xet}</span>
            </li>
          ))}
        </ol>
      </Khoi>
    </div>
  );
}
