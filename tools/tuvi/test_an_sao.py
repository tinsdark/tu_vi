"""Test tính chất của engine an sao — các ràng buộc phải đúng với MỌI lá số, không phụ thuộc phái.

Chạy: python3 tools/tuvi/test_an_sao.py
"""
import itertools
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import an_la_so, mv, nap_am, vi_tri_tu_vi  # noqa: E402


def test_nap_am_mau():
    # đối chiếu vài cặp nạp âm thuộc lòng: Giáp Tý Hải trung Kim, Bính Dần Lư trung Hỏa,
    # Mậu Thìn Đại lâm Mộc, Canh Ngọ Lộ bàng Thổ, Nhâm Thân Kiếm phong Kim, Bính Tý Giản hạ Thủy
    assert nap_am(1, 1) == "Kim" and nap_am(3, 3) == "Hoa" and nap_am(5, 5) == "Moc"
    assert nap_am(7, 7) == "Tho" and nap_am(9, 9) == "Kim" and nap_am(3, 1) == "Thuy"


def test_tu_vi_mau():
    # Thủy nhị cục: mùng 1 Tử Vi tại Sửu, mùng 2 tại Dần; Hỏa lục cục mùng 1 tại Dậu
    assert vi_tri_tu_vi(2, 1) == 2 and vi_tri_tu_vi(2, 2) == 3 and vi_tri_tu_vi(6, 1) == 10


def test_rang_buoc_moi_la_so():
    for can, chi, thang, ngay, gio, gt in itertools.product(range(1, 11), range(1, 13, 5), range(1, 13), range(1, 31, 3),
                                                            range(1, 13, 2), ["nam", "nu"]):
        if (can % 2) != (chi % 2):            # can chi phải cùng âm dương
            continue
        ls = an_la_so(can, chi, thang, ngay, gio, gt)
        s = ls["sao"]
        # R1: cấu hình chính tinh
        assert mv(s["Thiên Phủ"], 6) == s["Thất Sát"]
        assert mv(s["Thiên Tướng"], 6) == s["Phá Quân"]
        assert (s["Tử Vi"] + s["Thiên Phủ"]) % 12 == 6       # đối xứng qua trục Dần–Thân
        # Sát Phá Tham luôn tam hợp
        assert {mv(s["Thất Sát"], 4), mv(s["Thất Sát"], -4)} == {s["Phá Quân"], s["Tham Lang"]}
        # R3: Thái Tuế tại chi năm, Kình Đà kẹp Lộc Tồn
        assert s["Thái Tuế"] == chi
        assert mv(s["Lộc Tồn"], 1) == s["Kình Dương"] and mv(s["Lộc Tồn"], -1) == s["Đà La"]
        # Vòng Tràng Sinh khép kín: Dưỡng đứng ngay trước Tràng Sinh
        chieu = 1 if (can % 2 == 1) == (gt == "nam") else -1
        assert mv(s["Dưỡng"], chieu) == s["Tràng Sinh"] and mv(s["Thai"], chieu) == s["Dưỡng"]
        # Thân luôn cư Mệnh/Phúc/Quan/Di/Tài/Phu Thê
        assert ls["cung_chuc"][ls["than"]] in ("Mệnh", "Phúc Đức", "Quan Lộc", "Thiên Di", "Tài Bạch", "Phu Thê")
        # R5: đại hạn tăng đều 10
        assert sorted(ls["dai_han"].values()) == [ls["cuc"]["so"] + 10 * i for i in range(12)]
        # mỗi Hóa nằm đúng chỗ sao gốc
        for hoa, goc in ls["tu_hoa"].items():
            assert s[hoa] == s[goc]


if __name__ == "__main__":
    for ten, f in list(globals().items()):
        if ten.startswith("test_"):
            f()
            print("OK", ten)
