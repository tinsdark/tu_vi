"""Báo cáo PHÂN BỐ điểm của công thức diem_v3 trên mẫu lá số ngẫu nhiên — để tune hằng số (spec v3: 'chạy trên ≥10 lá số rồi chỉnh').
Không còn ghi ngưỡng vào cấu hình: điểm là điểm tuyệt đối của công thức (START 50), nhãn tra từ bảng công khai (diem_noi_tai.bac).

Chạy: python3 tools/tuvi/hieu_chinh.py [số mẫu]
In: phân bố nhãn theo cung, trung vị/phân vị, tỉ lệ cung chạm sàn/kẹp, tỉ lệ vi phạm §4.8 trước khi ép.
"""
import collections
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import CUNG_CHUC, an_la_so  # noqa: E402
from tuvi.luan_giai import LuanGiai, TriThuc, bao_cao  # noqa: E402


def main(n):
    rnd, tt = random.Random(42), TriThuc()
    bac = [t for _, t in tt.cfg["diem_noi_tai"]["bac"]]
    theo_cung, nhan, san, kep, vp, tong_cd, chu_de = {c: [] for c in CUNG_CHUC}, collections.Counter(), 0, 0, 0, 0, collections.defaultdict(list)
    for _ in range(n):
        nam = rnd.randint(1900, 2100)
        ls = an_la_so((nam - 4) % 10 + 1, (nam - 4) % 12 + 1, rnd.randint(1, 12), rnd.randint(1, 30), rnd.randint(1, 12), rnd.choice(["nam", "nu"]))
        kq = bao_cao(LuanGiai(ls, tt))
        for c, k in kq["cung"].items():
            theo_cung[c].append(k["diem100"])
            nhan[k["xep_loai"]] += 1
            san += bool(k["phan_tich"]["san_ap_dung"] and k["phan_tich"]["raw_sau_triet"] < k["phan_tich"]["san_ap_dung"])
            kep += k["phan_tich"]["raw_truoc_triet"] <= 5 or k["phan_tich"]["raw_truoc_triet"] >= 95
        for t, cd in kq["chu_de"].items():
            tong_cd += 1
            vp += cd["kiem_khop"]["vi_pham_kha"] or cd["kiem_khop"]["vi_pham_tb"]
            chu_de[t].append(cd["diem100"])
    tong = sum(nhan.values())
    print(f"{n} lá số × 12 cung = {tong} cung\nBảng nhãn: {tt.cfg['diem_noi_tai']['bac_mota']}")
    print("Phân bố nhãn:", {t: f"{100 * nhan[t] / tong:.0f}%" for t in bac})
    print(f"Cung được sàn nâng: {100 * san / tong:.1f}% · chạm kẹp 5/95: {100 * kep / tong:.1f}% · chủ đề vi phạm §4.8 trước khi ép: {100 * vp / tong_cd:.1f}%")
    for c, ds in theo_cung.items():
        ds.sort()
        print(f"  {c:11} p10 {ds[len(ds) // 10]:>3} · p50 {ds[len(ds) // 2]:>3} · p90 {ds[9 * len(ds) // 10]:>3}")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 3000)
