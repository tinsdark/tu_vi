"""Test bất biến của bộ luận giải trên lá số ngẫu nhiên (không kiểm 'luận đúng' — việc đó cần lá số người thật).

Chạy: python3 tools/tuvi/test_luan_giai.py
"""
import os
import random
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import CUNG_CHUC, an_la_so, mv  # noqa: E402
from tuvi.lich_am import tu_duong_lich  # noqa: E402
from tuvi.luan_giai import LuanGiai, TriThuc, bao_cao  # noqa: E402
from tuvi.viet_van import viet, viet_mau, ve  # noqa: E402

BAC = {"Rất thấp", "Thấp", "Trung bình", "Khá", "Tốt", "Rất tốt"}


def la_so_ngau_nhien(rnd):
    nam = rnd.randint(1930, 2020)
    return nam, an_la_so((nam - 4) % 10 + 1, (nam - 4) % 12 + 1, rnd.randint(1, 12), rnd.randint(1, 30), rnd.randint(1, 12), rnd.choice(["nam", "nu"]))


def test_bao_cao_bat_bien():
    tt, rnd = TriThuc(), random.Random(3)
    for _ in range(150):
        nam = rnd.randint(1930, 2020)
        ls = an_la_so((nam - 4) % 10 + 1, (nam - 4) % 12 + 1, rnd.randint(1, 12), rnd.randint(1, 30),
                      rnd.randint(1, 12), rnd.choice(["nam", "nu"]))
        kq = bao_cao(LuanGiai(ls, tt), nam, nam + rnd.randint(1, 80))
        assert len(kq["cung"]) == 12 and len(kq["chu_de"]) == 6
        for k in kq["cung"].values():
            assert k["diem100"] % 5 == 0 and 5 <= k["diem100"] <= 95 and k["xep_loai"] in BAC
            assert all(n["id"] and n["nhan_dinh"] for n in k["nhan_dinh"])
        h = kq["han"]
        assert len(h["luu_nguyet"]) == 12 and h["tieu_han"] and h["luu_nien"]
        van, che_do, bo = viet(kq, dung_llm=False)
        assert che_do == "mau" and bo == 0 and van


def test_phi_tuyen_giam_phan_tot():
    # cùng lá số, thêm nhiều sát tinh vào bản cung Mệnh → điểm Mệnh giảm và có câu cảnh báo sát tinh bản cung
    ls = an_la_so(7, 7, 5, 15, 5, "nam")
    goc = LuanGiai(ls).cham_cung("Mệnh")
    them = LuanGiai(ls, sao_them={ls["menh"]: ["Lưu Kình Dương", "Lưu Đà La", "Lưu Hóa Kỵ", "Lưu Địa Không", "Lưu Địa Kiếp"]}).cham_cung("Mệnh")
    assert them["diem"] < goc["diem"]
    pt = [n for n in them["nhan_dinh"] if n["id"] == "PHI_TUYEN"]
    assert pt and ("Bản cung có" in pt[0]["nhan_dinh"] or "Sát tinh ở cả bản cung" in pt[0]["nhan_dinh"])


def test_sat_tinh_dac_dia_khong_la_diem_manh():
    # sát tinh đắc địa được lật điểm dương nhưng câu luận vẫn nói mặt xấu → phải gắn dao_dau và không vào điểm mạnh/yếu của chủ đề
    tt, rnd, thay = TriThuc(), random.Random(11), 0
    for _ in range(300):
        nam = rnd.randint(1930, 2020)
        ls = an_la_so((nam - 4) % 10 + 1, (nam - 4) % 12 + 1, rnd.randint(1, 12), rnd.randint(1, 30), rnd.randint(1, 12), rnd.choice(["nam", "nu"]))
        kq = bao_cao(LuanGiai(ls, tt))
        for k in kq["cung"].values():
            thay += sum(1 for n in k["nhan_dinh"] if n.get("dao_dau"))
            assert all(n["diem"] > 0 for n in k["nhan_dinh"] if n.get("dao_dau"))
        for cd in kq["chu_de"].values():
            assert not any(n.get("dao_dau") for n in cd["diem_manh"] + cd["diem_yeu"])
    assert thay > 20


def test_van_mau_khong_lap_y_va_khong_noi_phan_tram_dan_so():
    tt, rnd = TriThuc(), random.Random(5)
    for _ in range(100):
        nam, ls = la_so_ngau_nhien(rnd)
        kq = bao_cao(LuanGiai(ls, tt), nam, nam + 30)
        van = viet_mau(kq)
        assert not re.search(r"(cao|thấp) hơn khoảng|% lá số|top \d|phân vị", van)       # §4.1: không có dân số thật thì không nói percentile
        for ten, cd in kq["chu_de"].items():
            dong = next(d for d in van.splitlines() if f"[CD.{ten}]" in d)
            assert f"khoảng {cd['diem100']}/100" in dong
        # mỗi ý (mã + nội dung) của các chủ đề chỉ xuất hiện đúng một lần trong văn
        for n in {(n["id"], n["nhan_dinh"]): n for cd in kq["chu_de"].values() for n in cd["diem_manh"] + cd["diem_yeu"]}.values():
            assert van.count(ve(n)) == 1, ve(n)


def test_gan_dung_cung_nguon():
    # §2: mọi nhận định trong chủ đề đến từ cung chủ hoặc xung/tam hợp của nó, và nếu khác cung chứa nó thì câu phải nêu rõ "từ cung ..."
    tt, rnd = TriThuc(), random.Random(21)
    for _ in range(120):
        nam, ls = la_so_ngau_nhien(rnd)
        lg = LuanGiai(ls, tt)
        kq = bao_cao(lg)
        for ten, cd in kq["chu_de"].items():
            for n in cd["diem_manh"] + cd["diem_yeu"] + cd["luu_y"]:
                chi_chu = lg.chi_cua[n["cung"]]
                nguon = next(c for c, t in ls["cung_chuc"].items() if t == n["cung_nguon"])
                assert nguon in {chi_chu, mv(chi_chu, 6), mv(chi_chu, 4), mv(chi_chu, -4)}, (ten, n["id"])
                if n["cung_nguon"] != n["cung"]:
                    assert f"từ cung {n['cung_nguon']}" in n["nhan_dinh"], (ten, n["id"], n["nhan_dinh"])
        for k in kq["cung"].values():
            assert all(n["cung_nguon"] and n["quan_he"] in ("ban_cung", "xung", "tam_hop") for n in k["nhan_dinh"] if "quan_he" in n)


def test_cau_sat_tinh_sinh_tu_du_lieu_that():
    # §3: không còn chuỗi cứng "nặng ở bản cung và xung chiếu"; câu cảnh báo chỉ có khi thật sự có sát tinh và đúng với vị trí của chúng
    tt, rnd, dem = TriThuc(), random.Random(33), {"ca_hai": 0, "ban": 0, "xung": 0}
    for _ in range(300):
        nam, ls = la_so_ngau_nhien(rnd)
        for k in bao_cao(LuanGiai(ls, tt))["cung"].values():
            pt = [n for n in k["nhan_dinh"] if n["id"] == "PHI_TUYEN"]
            assert not any("nặng ở bản cung và xung chiếu" in n["nhan_dinh"] for n in k["nhan_dinh"])
            for n in pt:
                t = n["nhan_dinh"]
                dem["ca_hai" if t.startswith("Sát tinh ở cả") else "ban" if t.startswith("Bản cung có") else "xung"] += 1
                assert n["nhan"], n
            assert len(pt) <= 1
    assert all(v > 5 for v in dem.values()), dem


def test_diem_noi_tai_nhat_quan():
    # §4.3: chính tinh miếu/vượng + sát chỉ ở xung/hội → không dưới 'trung bình'; vừa tốt vừa hung rõ → nhãn về vùng giữa kèm câu dẫn
    tt, rnd, san, hoa_giai = TriThuc(), random.Random(8), 0, 0
    for _ in range(300):
        nam, ls = la_so_ngau_nhien(rnd)
        kq = bao_cao(LuanGiai(ls, tt))
        for k in kq["cung"].values():
            if k["san_chinh_tinh"]:
                san += 1
                assert k["diem100"] >= 45, k["cung"]
        for ten, cd in kq["chu_de"].items():
            if cd["cau_dan"]:
                hoa_giai += 1
                assert 35 <= cd["diem100"] <= 70, ten
            assert cd["xep_loai"] in BAC
    assert san > 20 and hoa_giai > 20


def test_ngu_hanh_co_he_qua_va_am_duong_ky_thuat():
    tt, rnd = TriThuc(), random.Random(4)
    for _ in range(100):
        nam, ls = la_so_ngau_nhien(rnd)
        for n in LuanGiai(ls, tt).nen():
            if n["id"].startswith("NEN.sao_chu"):
                assert n["nhan_dinh"].count("→") >= 2, n          # mô tả → hệ quả
            if n["id"] == "NEN.am_duong" and "nghịch lý" in n["nhan_dinh"]:
                assert "chiều nghịch" in n["nhan_dinh"] and "không đồng nghĩa" in n["nhan_dinh"]
            if n["id"] == "NEN.am_duong":
                assert n["diem"] == 0


def test_cung_vo_chinh_dieu_co_nhanh_rieng():
    tt, rnd, thay = TriThuc(), random.Random(9), {"Tử Tức": 0, "Huynh Đệ": 0}
    for _ in range(400):
        nam, ls = la_so_ngau_nhien(rnd)
        for ten, k in bao_cao(LuanGiai(ls, tt))["cung"].items():
            vcd = [n for n in k["nhan_dinh"] if n["id"] == "VCD"]
            if ten in thay and not k["chinh_tinh"]:
                thay[ten] += 1
                assert vcd and ("con muộn hoặc ít" if ten == "Tử Tức" else "anh chị em") in vcd[0]["nhan_dinh"]
                assert all(n["quan_he"] == "xung" for n in k["nhan_dinh"] if n["id"].startswith("CT."))     # sao mượn ghi rõ là từ xung chiếu
    assert all(v > 5 for v in thay.values()), thay


def test_han_co_ket_luan_hanh_dong():
    tt, rnd, co = TriThuc(), random.Random(13), 0
    for _ in range(150):
        nam, ls = la_so_ngau_nhien(rnd)
        h = bao_cao(LuanGiai(ls, tt), nam, nam + rnd.randint(1, 80))["han"]
        kl = h["luu_nien"]["ket_luan"]
        sat = [n for n in h["luu_nien"]["ghi_chu"] if n["diem"] < 0 and n["id"] != "LN.song_ky"]
        if sat:
            co += 1
            assert any(n["id"] == "HAN.rui_ro" for n in kl)
            nt = [n for n in kl if n["id"].startswith("HAN.nen_tranh.")]
            assert 1 <= len(nt) <= 4 and all("nên" in n["nhan_dinh"] and "tránh" in n["nhan_dinh"] for n in nt)
        else:
            assert not any(n["id"] == "HAN.rui_ro" for n in kl)
    assert co > 30


def test_tu_duong_lich_toi_luan():
    a = tu_duong_lich(1990, 6, 8, 8, 30, "nam")["an_sao"]
    kq = bao_cao(LuanGiai(an_la_so(**a)), 1990, 2026)
    assert kq["la_so"]["input"]["can_nam"] == "Canh"


if __name__ == "__main__":
    for ten, f in list(globals().items()):
        if ten.startswith("test_"):
            f()
            print("OK", ten)
