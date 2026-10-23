// Điểm vào của engine: từ dữ liệu nhập (dương lịch, giờ đồng hồ) → lịch âm → lá số → báo cáo luận giải.
import { anLaSo, type LaSo } from "./anSao";
import { tuDuongLich, type KetQuaLich } from "./lichAm";
import { baoCao, LuanGiai } from "./luanGiai";
import { nangCao, type KetQuaNangCao } from "./nangCao";
import type { NhapLieu } from "./nhap";
import type { BaoCao } from "./types";

export * from "./anSao";
export * from "./kb";
export * from "./lichAm";
export * from "./luanGiai";
export * from "./nangCao";
export * from "./nhap";
export * from "./types";
export * from "./vietVan";
export * from "./boCuc";
export * from "./quyTac";
export * from "./thongTin";
export { veLaSo } from "./veLaSo";

export interface KetQuaTinh { lich: KetQuaLich; la_so: LaSo; luan: LuanGiai; bao_cao: BaoCao; nang_cao: KetQuaNangCao }

export function tinhLaSo(n: NhapLieu): KetQuaTinh {
  const lich = tuDuongLich(n.nam, n.thang, n.ngay, n.gio, n.phut, n.gioi_tinh, n.mien, n.quy_uoc, n.kinh_do);
  const a = lich.an_sao;
  const laSo = anLaSo(a.can_nam, a.chi_nam, a.thang, a.ngay, a.gio, a.gioi_tinh, n.profile);
  const luan = new LuanGiai(laSo);
  return { lich, la_so: laSo, luan, bao_cao: baoCao(luan, lich.am_lich.nam, n.nam_xem), nang_cao: nangCao(luan, lich.am_lich.nam, n.nam_xem) };
}
