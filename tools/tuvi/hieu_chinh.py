"""Hiệu chỉnh ngưỡng xếp loại: chấm mọi cung trên mẫu lá số ngẫu nhiên, lấy phân vị 10/30/70/90 RIÊNG cho từng cung chức, ghi vào cau_hinh_luan_giai.json.

Ý nghĩa: 'Rất tốt' = cung thuộc top 10% trong toàn bộ dân số lá số; không phải con số đặt tay.
Chạy: python3 tools/tuvi/hieu_chinh.py [số mẫu]
"""
import json
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import CUNG_CHUC, an_la_so  # noqa: E402
from tuvi.luan_giai import KB, LuanGiai, TriThuc  # noqa: E402


def main(n):
    rnd, tt, diem = random.Random(42), TriThuc(), {c: [] for c in CUNG_CHUC}
    for _ in range(n):
        nam = rnd.randint(1900, 2100)
        ls = an_la_so((nam - 4) % 10 + 1, (nam - 4) % 12 + 1, rnd.randint(1, 12), rnd.randint(1, 30), rnd.randint(1, 12), rnd.choice(["nam", "nu"]))
        lg = LuanGiai(ls, tt)
        for c in CUNG_CHUC:
            diem[c].append(lg.cham_cung(c)["diem"])
    p = os.path.join(KB, "cau_hinh_luan_giai.json")
    cfg = json.load(open(p, encoding="utf-8"))
    nguong = {"_ghi_chu": cfg["nguong_ket_luan"]["_ghi_chu"], "so_mau": n, "theo_cung": {}}
    for c, ds in diem.items():
        ds.sort()
        pv = lambda q: round(ds[int(q * (len(ds) - 1))], 2)
        nguong["theo_cung"][c] = {"rat_tot": pv(0.9), "tot": pv(0.7), "trung_binh": pv(0.3), "xau": pv(0.1)}
        print(c, nguong["theo_cung"][c])
    cfg["nguong_ket_luan"] = nguong
    json.dump(cfg, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 3000)
