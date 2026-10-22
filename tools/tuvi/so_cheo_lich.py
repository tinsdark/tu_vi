"""So lich_am.py với amlich (thuật toán Hồ Ngọc Đức, UTC+7/+8) và lunar-javascript (lịch Trung Hoa, UTC+8).

Chạy: python3 tools/tuvi/so_cheo_lich.py ref.csv   (ref.csv tạo bằng so_cheo_lich.js)
Mỗi tháng lệch in kèm giờ sóc để xem lệch do sóc sát nửa đêm hay do lỗi.
"""
import collections
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi import lich_am as L  # noqa: E402


def am(d, m, y, tz):
    goc = L.mui_gio_lich
    L.mui_gio_lich = lambda *_: tz
    try:
        return L.duong_sang_am(d, m, y)
    finally:
        L.mui_gio_lich = goc


def main(ref):
    lech = collections.defaultdict(set)
    for dong in open(ref):
        y, m, d, *r = map(int, dong.split(","))
        a7, a8, cn = tuple(r[0:4]), tuple(r[4:8]), tuple(r[8:12])
        if y >= 1968 and am(d, m, y, 7) != a7[:3] + (bool(a7[3]),):
            lech["UTC+7 vs amlich"].add((y, m, d))
        t8 = am(d, m, y, 8)
        if t8 != a8[:3] + (bool(a8[3]),):
            lech["UTC+8 vs amlich"].add((y, m, d))
        if t8 != cn[:3] + (bool(cn[3]),):
            lech["UTC+8 vs lunar-javascript"].add((y, m, d))
    for ten, ngay in lech.items():
        print(f"\n{ten}: {len(ngay)} ngày lệch")
        ks = sorted({L.dau_thang_chua(L.jd_tu_ngay(d, m, y), 8)[0] + i for y, m, d in ngay for i in (0, 1)})
        for k in ks:
            u = L._ut(L.soc(k))
            t = datetime(2000, 1, 1, 12) + timedelta(days=u - 2451545.0)
            print(f"  sóc k={k}: {t:%Y-%m-%d %H:%M:%S} UTC  (+7 {t + timedelta(hours=7):%H:%M}, +8 {t + timedelta(hours=8):%H:%M})")


if __name__ == "__main__":
    main(sys.argv[1])
