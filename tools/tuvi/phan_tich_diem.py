"""In phân tích điểm của MỘT cung: base chính tinh + cát − sát − phạt Tuần/Triệt − phi tuyến → điểm cung → thang /100 → sàn/trần → nhãn.
Chạy: python3 tools/tuvi/phan_tich_diem.py <năm> <tháng> <ngày> <giờ> <phút> <nam|nu> [cung ...]   (dương lịch, giờ đồng hồ)
Mặc định in 6 cung chủ đề. Thêm --khong-tuan-triet để xem điểm nếu không có Tuần/Triệt (so phần bị giảm)."""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import an_la_so  # noqa: E402
from tuvi.lich_am import tu_duong_lich  # noqa: E402
from tuvi.luan_giai import LuanGiai, TriThuc  # noqa: E402

TEN = {"chinh_tinh_chu": "chính tinh chủ", "chinh_tinh_hoi_chieu": "chính tinh hội chiếu", "bo_sao": "bộ sao", "phu_tinh_cat": "phụ tinh cát",
       "phu_tinh_sat": "phụ tinh sát/hung", "cach_cuc": "cách cục", "trang_sinh": "Tràng Sinh", "khac": "khác"}


def in_cung(lg, ten):
    k = lg.cham_cung(ten)
    p = k["phan_tich"]
    print(f"\n== {ten} ({k['chi']}) — {k['xep_loai']} ~{k['diem100']}/100   chính tinh: {', '.join(k['chinh_tinh']) or 'vô chính diệu'}   Tuần/Triệt: {'/'.join(k['tuan_triet']) or '-'}")
    for loai, v in p["theo_loai"].items():
        print(f"   {TEN.get(loai, loai):24}{v:+8.2f}")
    print(f"   {'tổng tốt / tổng xấu':24}{p['tong_tot']:+8.2f} / {p['tong_xau']:+.2f}")
    print(f"   {'Tuần/Triệt đã giảm':24}tốt {p['tuan_triet_giam']['tot']:+.2f} (giảm lực) · xấu {p['tuan_triet_giam']['xau']:+.2f} (bớt hung)")
    print(f"   {'phi tuyến (hệ số %.3f)' % p['he_so_pha']:24}{p['tru_phi_tuyen']:+8.2f}")
    print(f"   {'= điểm cung':24}{p['diem_cung']:+8.2f}  → quy đổi {p['quy_doi']}  → sau sàn/trần {p['sau_san_tran']} (sàn {'có' if p['san'] else 'không'}, trần {'có' if p['tran'] else 'không'})")
    return k


def main(a):
    kh = "--khong-tuan-triet" in a
    a = [x for x in a if not x.startswith("--")]
    nam, thang, ngay, gio, phut, gt = int(a[0]), int(a[1]), int(a[2]), int(a[3]), int(a[4]), a[5]
    r = tu_duong_lich(nam, thang, ngay, gio, phut, gt)
    ls = an_la_so(**r["an_sao"])
    if kh:
        ls = copy.deepcopy(ls)
        ls["tuan"], ls["triet"] = [], []
    lg = LuanGiai(ls, TriThuc())
    for ten in (a[6:] or ["Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê", "Tật Ách", "Phụ Mẫu", "Tử Tức", "Huynh Đệ"]):
        in_cung(lg, ten)


if __name__ == "__main__":
    main(sys.argv[1:])
