"""In phân tích điểm của MỘT cung theo công thức v3 (spec §4.9): tập bản cung/xung/tam hợp, BASE chính tinh, CAT, SAT, cách cục, nén Tuần/Triệt, sàn, điểm cuối.
Chạy: python3 tools/tuvi/phan_tich_diem.py <năm> <tháng> <ngày> <giờ> <phút> <nam|nu> [cung ...]   (dương lịch, giờ đồng hồ)
Mặc định in 6 cung chủ đề. Thêm --khong-tuan-triet để xem điểm nếu không có Tuần/Triệt (so phần bị giảm)."""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import an_la_so  # noqa: E402
from tuvi.lich_am import tu_duong_lich  # noqa: E402
from tuvi.luan_giai import LuanGiai, TriThuc  # noqa: E402

def in_cung(lg, ten):
    k = lg.cham_cung(ten)
    p = k["phan_tich"]
    print(f"\n== {ten} ({k['chi']}) — {k['xep_loai']} {k['diem100']}/100   chính tinh: {', '.join(k['chinh_tinh']) or 'vô chính diệu'}   Tuần/Triệt: {'/'.join(k['tuan_triet']) or '-'}")
    print(f"   tập bản cung : {', '.join(p['tap_ban_cung'])}")
    print(f"   tập xung     : {', '.join(p['tap_xung']) or '-'}")
    print(f"   tập tam hợp  : {', '.join(p['tap_tam_hop']) or '-'}")
    print(f"   BASE chính tinh {p['tong_base']:+7.2f}   " + ("[vô chính diệu ×0.5] " if p["vo_chinh_dieu"] else "") + "; ".join(f"{b['sao']} {b['do_sang']} {b['diem']:+g}" + (" (hãm mang Hóa cát → 0)" if b["hoa_cuu"] else "") for b in p["base"]))
    print(f"   CAT             {p['tong_cat']:+7.2f}   " + "; ".join(f"{x['sao']}@{x['cung']}({x['vi_tri']}) {x['diem']:+g}" for x in p["cat"]))
    print(f"   SAT             {p['tong_sat']:+7.2f}   " + "; ".join(f"{x['sao']}@{x['cung']}({x['vi_tri']}) {x['diem']:+g}" for x in p["sat"]))
    print(f"   cách cục        {p['cach_cuc']:+7.2f}")
    print(f"   raw trước Triệt {p['raw_truoc_triet']:7.2f}   k_triet_tuan {p['k_triet_tuan']}  → raw sau {p['raw_sau_triet']:.2f}   sàn áp dụng {p['san_ap_dung'] or '-'}   → điểm cuối {p['score_cuoi']}")
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
