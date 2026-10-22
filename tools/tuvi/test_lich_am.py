"""Test module lịch âm bằng các mốc đã biết (lịch VN in sẵn, sự kiện lịch sử).

Chạy: python3 tools/tuvi/test_lich_am.py
So chéo toàn bộ 1900–2100 với 2 thư viện độc lập: tools/tuvi/so_cheo_lich.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.lich_am import (CAN, CHI, can_chi_ngay, chi_gio, duong_sang_am, sat_nua_dem,  # noqa: E402
                          tu_duong_lich)


def test_tet():
    # Mùng 1 Tết (dương lịch) theo lịch VN
    for d, m, y in [(31, 1, 1995), (5, 2, 2000), (24, 1, 2001), (22, 1, 2004), (17, 2, 2007), (26, 1, 2009),
                    (23, 1, 2012), (31, 1, 2014), (19, 2, 2015), (28, 1, 2017), (25, 1, 2020), (22, 1, 2023),
                    (10, 2, 2024), (29, 1, 2025), (17, 2, 2026), (6, 2, 2027)]:
        assert duong_sang_am(d, m, y) == (1, 1, y, False), (d, m, y, duong_sang_am(d, m, y))


def test_vn_khac_trung_quoc():
    # 1985: VN (UTC+7) ăn Tết 21/1, Trung Quốc (UTC+8) 20/2 — do tháng 11 âm lệch
    assert duong_sang_am(21, 1, 1985) == (1, 1, 1985, False)
    # 2007: VN Tết 17/2, Trung Quốc 18/2
    assert duong_sang_am(17, 2, 2007)[:2] == (1, 1)
    # Tết Mậu Thân 1968: miền Bắc (UTC+7) 29/1, miền Nam (UTC+8) 30/1
    assert duong_sang_am(29, 1, 1968, "bac")[:2] == (1, 1)
    assert duong_sang_am(30, 1, 1968, "nam")[:2] == (1, 1)


def test_thang_nhuan():
    # Tháng nhuận các năm gần đây theo lịch VN
    nhuan = {2001: 4, 2004: 2, 2006: 7, 2009: 5, 2012: 4, 2014: 9, 2017: 6, 2020: 4, 2023: 2, 2025: 6}
    for y in range(2000, 2027):
        thay = {duong_sang_am(d, m, y)[1] for m in range(1, 13) for d in (1, 15) if duong_sang_am(d, m, y)[3]
                and duong_sang_am(d, m, y)[2] == y}
        assert thay == ({nhuan[y]} if y in nhuan else set()), (y, thay)


def test_can_chi_ngay():
    # 1/1/2000 là ngày Mậu Ngọ; 22/10/2026 là Kỷ Tỵ
    c, ch = can_chi_ngay(1, 1, 2000)
    assert (CAN[c], CHI[ch]) == ("Mậu", "Ngọ")
    c, ch = can_chi_ngay(22, 10, 2026)
    assert (CAN[c], CHI[ch]) == ("Kỷ", "Tỵ")


def test_gio():
    assert [chi_gio(h) for h in (23, 0, 1, 2, 3, 11, 12, 21, 22)] == [1, 1, 2, 2, 3, 7, 7, 12, 12]


def test_quy_uoc():
    # Sinh 23:30 → mặc định tính ngày hôm sau, giờ Tý
    a = tu_duong_lich(2026, 10, 21, 23, 30, "nam")
    b = tu_duong_lich(2026, 10, 21, 23, 30, "nam", quy_uoc={"ty_muon": "ngay_do"})
    assert a["an_sao"]["ngay"] == b["an_sao"]["ngay"] + 1 and a["an_sao"]["gio"] == 1
    # Miền Nam 1970 dùng UTC+8: 08:30 đồng hồ = 07:30 giờ chuẩn → giờ Thìn (07–09)
    assert tu_duong_lich(1970, 5, 5, 8, 30, "nam")["gio_tinh"].endswith("07:30")
    assert tu_duong_lich(1970, 5, 5, 8, 30, "nam", mien="bac")["gio_tinh"].endswith("08:30")
    # Tháng nhuận: 1/4/2023 là 11/2 nhuận
    assert tu_duong_lich(2023, 4, 1, 10, 0, "nu")["an_sao"]["thang"] == 2
    assert tu_duong_lich(2023, 4, 1, 10, 0, "nu", quy_uoc={"thang_nhuan": "nhu_thang_sau"})["an_sao"]["thang"] == 3
    # Giờ mặt trời: Hà Nội 105.85°E ≈ UTC+7:03
    assert tu_duong_lich(2000, 1, 1, 12, 0, "nam", mien="bac", kinh_do=105.85,
                         quy_uoc={"gio_mat_troi": True})["gio_tinh"].endswith("12:03")


def test_canh_bao_sat_nua_dem():
    assert sat_nua_dem(8, 5, 2054)                 # sóc 00:00:22 giờ VN
    assert not sat_nua_dem(17, 2, 2026)


if __name__ == "__main__":
    for ten, f in list(globals().items()):
        if ten.startswith("test_"):
            f()
            print("OK", ten)
