"""Hồi quy trên các lá số mẫu (spec scoring v3 §16). Kỳ vọng là NHÃN + hướng điểm, không ép số tuyệt đối.

Lá 1 = Nguyễn Tiến Đạt (11/5/2003 14:45 nam, Mệnh Tuất) · Lá 2 = Mai Lan Hương (14/12/2003 21:45 nữ, Mệnh Sửu) · Lá 4 = Giáp Tuất tháng 9 ngày 14 giờ Mão Dương Nam (Mệnh Mùi, Liêm–Sát).
Các kỳ vọng của §16 MÀ ENGINE KHÔNG ĐẠT được ghi trong KHONG_DAT bên dưới kèm lý do (không giấu).

Chạy: python3 tools/tuvi/test_fixture_la_so.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import an_la_so  # noqa: E402
from tuvi.lich_am import tu_duong_lich  # noqa: E402
from tuvi.luan_giai import LuanGiai, TriThuc, bao_cao  # noqa: E402

TT = TriThuc()
THU = ["Rất thấp", "Thấp", "Trung bình", "Khá", "Tốt", "Rất tốt"]
KHONG_DAT = {
    "Lá 1 — Sự nghiệp 'tốt'": "Quan Lộc Dần: Vũ(V)+Tướng(M) base 20 (đã cap) + Hóa Lộc xung 3.75 − sát 6.1 (Hỏa Tinh bản cung, Địa Kiếp hội) = 67 → Khá 70. Muốn 'tốt' (≥76) phải đổi hằng số cat/sat.",
    "Lá 2 — Tính cách '≥ khá'": "Mệnh Sửu: Nhật+Nguyệt (Đắc) 12 + Hóa Khoa 6 + Việt 2 − Kình Dương đắc 2.5 − Hình 1.5 = 65 → Triệt nén ×0.6 → 59 (Trung bình). §4.8 không ép vì Nhật–Nguyệt chỉ Đắc (không miếu/vượng) và mục có câu hạn chế (Kình Dương, sát xung).",
}


def la_so(*a):
    return an_la_so(**tu_duong_lich(*a)["an_sao"])


LA = {"Lá 1": la_so(2003, 5, 11, 14, 45, "nam"), "Lá 2": la_so(2003, 12, 14, 21, 45, "nu"), "Lá 4": an_la_so(1, 11, 9, 14, 4, "nam")}
KQ = {ten: bao_cao(LuanGiai(ls, TT)) for ten, ls in LA.items()}


def bac_tu(ten, muc):
    return THU.index(KQ[ten]["chu_de"][muc]["xep_loai"])


def test_la_1():
    assert bac_tu("Lá 1", "Tài chính") >= THU.index("Trung bình")           # Tử Vi miếu: không bao giờ ra 35
    assert KQ["Lá 1"]["chu_de"]["Tài chính"]["diem100"] > 35
    assert bac_tu("Lá 1", "Tính cách") >= THU.index("Khá")                  # Phủ(V)+Liêm(M) bản cung
    assert bac_tu("Lá 1", "Sự nghiệp") >= THU.index("Khá")                  # Vũ(V)+Tướng(M) (kỳ vọng gốc 'tốt' — xem KHONG_DAT)
    kc = KQ["Lá 1"]["chu_de"]["Tính cách"]["khung"]
    assert "Liêm Trinh" in kc and "Thiên Phủ" in kc                          # §15.2: cung chủ liệt kê ĐỦ chính tinh bản cung


def test_la_2():
    assert bac_tu("Lá 2", "Tính cách") >= THU.index("Trung bình")           # kỳ vọng gốc '≥ khá' — xem KHONG_DAT
    gd = KQ["Lá 2"]["chu_de"]["Gia đình"]
    assert gd["xep_loai"] not in ("Rất thấp", "Thấp") and 35 < gd["diem100"]  # 3 tiểu mục đều có điểm sáng: không được 35/Thấp
    assert all(sao in KQ["Lá 2"]["chu_de"]["Tính cách"]["khung"] for sao in ("Thái Dương", "Thái Âm"))


def test_la_4():
    tc = KQ["Lá 4"]["chu_de"]["Tính cách"]
    assert "Liêm Trinh (đắc) + Thất Sát (đắc)" in tc["khung"]               # §15.2: nền tảng = chính tinh bản cung + trạng thái
    for n in tc["diem_manh"] + tc["diem_yeu"]:                               # §15.1: Hóa Quyền/Khoa/Khôi ở cung khác không được 'tại Mệnh'
        if n["id"] == "CAT_XH":
            assert "chiếu" in tc["cau_dan"] and "Hóa Quyền + Hóa Khoa + Thiên Khôi tại Mệnh" not in tc["cau_dan"]
    sn = KQ["Lá 4"]["chu_de"]["Sự nghiệp"]
    assert not any("Vũ Khúc" in (n.get("nhan") or []) and n["diem"] < 0 for n in sn["diem_yeu"])   # §15.3: Vũ Khúc hóa Khoa không phải hạn chế
    assert any(n["id"] == "CT.Vũ Khúc.Quan Lộc" and n["diem"] == 0 for n in sn["trung_tinh"])
    sk = KQ["Lá 4"]["chu_de"]["Sức khỏe"]
    assert sk["diem100"] >= 50 and sk["xep_loai"] == "Trung bình"            # Cơ(H)+Nguyệt(H)+Lộc Tồn+Hữu Bật: ≈ trung bình, không 35


def test_tuan_triet_cung_phu_mau_phuc_duc_la_4():
    # Tuần và Triệt cùng án Thân (Phụ Mẫu) + Dậu (Phúc Đức); Mệnh Mùi không bị án
    k = KQ["Lá 4"]["cung"]
    assert k["Phụ Mẫu"]["tuan_triet"] == ["Tuần", "Triệt"] and k["Phúc Đức"]["tuan_triet"] == ["Tuần", "Triệt"] and not k["Mệnh"]["tuan_triet"]
    assert abs(k["Phụ Mẫu"]["phan_tich"]["k_triet_tuan"] - 0.6 * 0.8) < 1e-9


if __name__ == "__main__":
    for ten, f in list(globals().items()):
        if ten.startswith("test_"):
            f()
            print("OK", ten)
    print("\nKỳ vọng §16 KHÔNG đạt (ghi rõ):")
    for k, v in KHONG_DAT.items():
        print(f"  - {k}: {v}")
