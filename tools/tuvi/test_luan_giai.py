"""Test bất biến của bộ luận giải trên lá số ngẫu nhiên (không kiểm 'luận đúng' — việc đó cần lá số người thật).

Chạy: python3 tools/tuvi/test_luan_giai.py
"""
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import an_la_so  # noqa: E402
from tuvi.lich_am import tu_duong_lich  # noqa: E402
from tuvi.luan_giai import LuanGiai, TriThuc, bao_cao  # noqa: E402
from tuvi.viet_van import viet  # noqa: E402


def test_bao_cao_bat_bien():
    tt, rnd = TriThuc(), random.Random(3)
    for _ in range(150):
        nam = rnd.randint(1930, 2020)
        ls = an_la_so((nam - 4) % 10 + 1, (nam - 4) % 12 + 1, rnd.randint(1, 12), rnd.randint(1, 30),
                      rnd.randint(1, 12), rnd.choice(["nam", "nu"]))
        kq = bao_cao(LuanGiai(ls, tt), nam, nam + rnd.randint(1, 80))
        assert len(kq["cung"]) == 12 and len(kq["chu_de"]) == 6
        for k in kq["cung"].values():
            assert 1 <= k["phan_vi"] <= 99
            assert all(n["id"] and n["nhan_dinh"] for n in k["nhan_dinh"])
        h = kq["han"]
        assert len(h["luu_nguyet"]) == 12 and h["tieu_han"] and h["luu_nien"]
        van, che_do, bo = viet(kq, dung_llm=False)
        assert che_do == "mau" and bo == 0 and van


def test_phi_tuyen_giam_phan_tot():
    # cùng lá số, thêm sát tinh vào bản cung Mệnh → điểm Mệnh phải giảm mạnh hơn tổng điểm âm cộng thêm
    ls = an_la_so(7, 7, 5, 15, 5, "nam")
    goc = LuanGiai(ls).cham_cung("Mệnh")
    them = LuanGiai(ls, sao_them={ls["menh"]: ["Lưu Kình Dương", "Lưu Đà La", "Lưu Hóa Kỵ"]}).cham_cung("Mệnh")
    assert them["diem"] < goc["diem"]
    assert any(n["id"] == "PHI_TUYEN" for n in them["nhan_dinh"])


def test_tu_duong_lich_toi_luan():
    a = tu_duong_lich(1990, 6, 8, 8, 30, "nam")["an_sao"]
    kq = bao_cao(LuanGiai(an_la_so(**a)), 1990, 2026)
    assert kq["la_so"]["input"]["can_nam"] == "Canh"


if __name__ == "__main__":
    for ten, f in list(globals().items()):
        if ten.startswith("test_"):
            f()
            print("OK", ten)
