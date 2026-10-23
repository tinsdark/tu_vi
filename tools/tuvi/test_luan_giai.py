"""Test bất biến của bộ luận giải trên lá số ngẫu nhiên (không kiểm 'luận đúng' — việc đó cần lá số người thật).

Chạy: python3 tools/tuvi/test_luan_giai.py
"""
import itertools
import json
import os
import random
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import CHI, CUNG_CHUC, an_la_so, mv  # noqa: E402
from tuvi.lich_am import tu_duong_lich  # noqa: E402
from tuvi.luan_giai import LuanGiai, TriThuc, bao_cao, chon_gioi  # noqa: E402
from tuvi.viet_van import hau_kiem_theo_muc, viet, viet_mau, ve  # noqa: E402

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
        van, bo = viet(kq)
        assert bo == 0 and van


def test_phi_tuyen_giam_phan_tot():
    # cùng lá số, thêm nhiều sát tinh vào bản cung Mệnh → điểm Mệnh giảm và có câu cảnh báo sát tinh bản cung
    ls = an_la_so(7, 7, 5, 15, 5, "nam")
    goc = LuanGiai(ls).cham_cung("Mệnh")
    them = LuanGiai(ls, sao_them={ls["menh"]: ["Lưu Kình Dương", "Lưu Đà La", "Lưu Hóa Kỵ", "Lưu Địa Không", "Lưu Địa Kiếp"]}).cham_cung("Mệnh")
    assert them["diem"] < goc["diem"]
    pt = [n for n in them["nhan_dinh"] if n["id"] == "PHI_TUYEN"]
    assert pt and ("Bản cung có" in pt[0]["nhan_dinh"] or "Sát tinh ở cả bản cung" in pt[0]["nhan_dinh"])


def test_sat_tinh_dac_dia_khong_la_diem_manh():
    # sát tinh đắc địa: giảm hại (điểm vẫn âm), câu luận nói cả hai mặt → gắn dao_dau; có thể nằm ở 'cần lưu ý', không bao giờ ở điểm sáng
    tt, rnd, thay = TriThuc(), random.Random(11), 0
    for _ in range(300):
        nam = rnd.randint(1930, 2020)
        ls = an_la_so((nam - 4) % 10 + 1, (nam - 4) % 12 + 1, rnd.randint(1, 12), rnd.randint(1, 30), rnd.randint(1, 12), rnd.choice(["nam", "nu"]))
        kq = bao_cao(LuanGiai(ls, tt))
        for k in kq["cung"].values():
            thay += sum(1 for n in k["nhan_dinh"] if n.get("dao_dau"))
            assert all(n["diem"] < 0 for n in k["nhan_dinh"] if n.get("dao_dau"))
        for cd in kq["chu_de"].values():
            assert not any(n.get("dao_dau") for n in cd["diem_manh"])        # sát đắc địa chỉ có thể là mặt cần lưu ý, không bao giờ là điểm sáng
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
        bo_nhan = lambda n: dict(n, nhan_dinh=n["nhan_dinh"].split(": ", 1)[1]) if n["nhan_dinh"].split(": ", 1)[0] in ("Cha mẹ", "Con cái", "Anh em") else n   # tiểu mục Gia đình: nhãn nằm ở đầu câu dẫn
        for n in {(n["id"], n["nhan_dinh"]): n for cd in kq["chu_de"].values() for n in cd["diem_manh"] + cd["diem_yeu"]}.values():
            assert van.count(ve(bo_nhan(n))) == 1, ve(n)


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
    # sàn chính tinh miếu/vượng (§4.5) và khớp điểm ↔ nội dung (§4.8): sau khi ép phải không còn vi phạm
    from tuvi.luan_giai import diem_100
    tt, rnd, san, ep = TriThuc(), random.Random(8), 0, 0
    kh = tt.cfg["diem_noi_tai"]["khop_noi_dung"]
    for _ in range(300):
        nam, ls = la_so_ngau_nhien(rnd)
        kq = bao_cao(LuanGiai(ls, tt))
        for k in kq["cung"].values():
            if k["phan_tich"]["san_ap_dung"]:
                san += 1
                assert k["diem100"] >= diem_100(k["phan_tich"]["san_ap_dung"]), k["cung"]
        for ten, cd in kq["chu_de"].items():
            assert cd["xep_loai"] in BAC
            m = cd["kiem_khop"]
            ep += m["vi_pham_kha"] or m["vi_pham_tb"]
            if m["hung"] >= 1 and m["hung"] >= 2 * m["sang"]:
                assert cd["diem100"] <= kh["tb_tran"], (ten, m)
    assert san > 20


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


def test_tuan_triet_duoc_nhac_dung_cung():
    # §10: cung chủ của chủ đề / Mệnh / Thân bị Tuần-Triệt thì BẮT BUỘC có câu, gắn đúng tên cung
    tt, rnd, thay = TriThuc(), random.Random(17), 0
    for _ in range(300):
        nam, ls = la_so_ngau_nhien(rnd)
        lg = LuanGiai(ls, tt)
        kq = bao_cao(lg)
        for ten, cd in tt.cfg["chu_de"].items():
            if ten == "ghi_chu":
                continue
            bi = [c for c in cd["cung"] if any(m in lg.cung[lg.chi_cua[c]] for m in ("Tuần", "Triệt"))]
            thay += len(bi)
            cau = [n["nhan_dinh"] for n in kq["chu_de"][ten]["luu_y"] if n["id"] == "TT"]
            assert len(cau) == len(bi), (ten, bi)
            assert all(any(f"án {c}" in x for x in cau) for c in bi)
        for ten, chi in (("Mệnh", ls["menh"]), ("Thân", ls["than"])):
            if any(m in lg.cung[chi] for m in ("Tuần", "Triệt")) and (ten == "Mệnh" or ls["than"] != ls["menh"]):
                assert any(n["id"] == f"NEN.tuan_triet.{ten}" for n in kq["nen"])
    assert thay > 50


def test_boi_canh_hoa_tang_mon_o_tai_la_hao_tai():
    tt, rnd, thay = TriThuc(), random.Random(19), 0
    for _ in range(500):
        nam, ls = la_so_ngau_nhien(rnd)
        for ten, k in bao_cao(LuanGiai(ls, tt))["cung"].items():
            for n in k["nhan_dinh"]:
                if n["id"].startswith("PT.Tang Môn") and ten == "Tài Bạch":
                    thay += 1
                    txt = n["nhan_dinh"].lower()           # Tang Môn ở Tài Bạch nói về hao tiền, không nói chuyện buồn chung chung
                    assert "hao" in txt and "tiền" in txt and "buồn" not in txt
                if n["id"] == "PT.Hóa Kỵ.Phụ Mẫu":
                    assert "tình cảm" not in n["nhan_dinh"].lower()
                if n["id"] == "PT.Hóa Lộc.Tử Tức":
                    assert "phá cũ ra tiền" not in n["nhan_dinh"]
    assert thay > 5


def test_gia_dinh_co_dinh_ba_tieu_muc():
    # §11: Gia đình luôn = Phụ Mẫu + Tử Tức + Huynh Đệ, mỗi câu mang nhãn tiểu mục
    tt, rnd = TriThuc(), random.Random(23)
    nhan = tuple(tt.cfg["chu_de"]["Gia đình"]["tieu_muc"].values())
    for _ in range(150):
        nam, ls = la_so_ngau_nhien(rnd)
        cd = bao_cao(LuanGiai(ls, tt))["chu_de"]["Gia đình"]
        assert set(cd["cung"]) == {"Phụ Mẫu", "Tử Tức", "Huynh Đệ"}
        assert all(n["nhan_dinh"].startswith(tuple(f"{x}: " for x in nhan)) for n in cd["diem_manh"] + cd["diem_yeu"])


def test_luu_sat_ngoai_tam_phuong_van_duoc_nhac():
    # §13: lưu sát tinh/Kỵ rơi vào cung trọng yếu dù ngoài tam phương lưu niên vẫn phải nêu (lớp 2) và vào kết luận
    tt, rnd, thay = TriThuc(), random.Random(29), 0
    hc = tt.cfg["han"]
    for _ in range(200):
        nam, ls = la_so_ngau_nhien(rnd)
        lg = LuanGiai(ls, tt)
        h = bao_cao(lg, nam, nam + rnd.randint(1, 80))["han"]
        ln = h["luu_nien"]
        ids = {n["id"] for n in ln["ghi_chu"]}
        for n in ln["ghi_chu"]:
            if n["id"].startswith("LN2."):
                thay += 1
                assert any(c in n["nhan_dinh"] for c in hc["trong_yeu"])
                assert any(n["id"].split(".", 1)[1] in x["nhan_dinh"] for x in ln["ket_luan"] if x["id"] == "HAN.rui_ro")
    assert thay > 20


def test_them_sat_tinh_khong_bao_gio_lam_tang_diem():
    # tính đơn điệu: thêm sát tinh vào một cung không được làm điểm cung tăng; thêm cát tinh không được làm giảm
    from tuvi.an_sao import CHI
    tt, rnd = TriThuc(), random.Random(7)
    sat = ["Lưu Kình Dương", "Lưu Đà La", "Lưu Hóa Kỵ", "Lưu Địa Không", "Lưu Địa Kiếp", "Lưu Hỏa Tinh", "Lưu Linh Tinh", "Kình Dương", "Địa Kiếp", "Thiên Hình"]
    cat = ["Tả Phù", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt", "Lộc Tồn", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa"]
    for _ in range(600):
        nam, ls = la_so_ngau_nhien(rnd)
        cung = rnd.choice(CUNG_CHUC)
        goc = LuanGiai(ls, tt)
        chi = goc.chi_cua[cung]
        d0 = goc.cham_cung(cung)["diem"]
        s_ = rnd.choice(sat)
        assert LuanGiai(ls, tt, {chi: [s_]}).cham_cung(cung)["diem"] <= d0 + 1e-9, (cung, s_)
        c_ = rnd.choice(cat)
        if c_ not in goc.cung[chi]:
            assert LuanGiai(ls, tt, {chi: [c_]}).cham_cung(cung)["diem"] >= d0 - 1e-9, (cung, c_)


def test_khong_ro_ri_noi_dung_sai_linh_vuc():
    # câu tổ hợp Tứ Hóa (generic theo sao) và fallback chung chỉ được nói về lĩnh vực thuộc cung đó.
    # (Câu riêng theo sao × cung được soạn cho đúng cung nên không kiểm ở đây: 'cha mẹ biết làm kinh tế' ở Phụ Mẫu là hợp lệ.)
    tt, rnd, kiem = TriThuc(), random.Random(2026), 0
    mien = {k: re.compile(p) for k, p in tt.cfg["mien_tu_khoa"].items() if not k.startswith("_")}
    generic = {m for v in tt.tu_hoa.values() for m in re.split(r"(?<=[.;])\s+", v)}
    for _ in range(800):
        nam, ls = la_so_ngau_nhien(rnd)
        for cung, k in bao_cao(LuanGiai(ls, tt))["cung"].items():
            for n in k["nhan_dinh"]:
                for m in re.split(r"(?<=[.;])\s+", n["nhan_dinh"]):
                    if m in generic:
                        kiem += 1
                        for dm, pat in mien.items():
                            assert not pat.search(m.lower()) or cung in tt.cfg["mien_cung"][dm], (cung, n["id"], m)
    assert kiem > 100


def test_diem_theo_cau_rieng_trung_tinh():
    # câu riêng trung tính/hỗn hợp (VD Lộc Tồn ở Huynh Đệ: 'anh em ít') không được tính là điểm sáng
    tt, rnd, thay = TriThuc(), random.Random(31), 0
    for _ in range(400):
        nam, ls = la_so_ngau_nhien(rnd)
        k = bao_cao(LuanGiai(ls, tt))["cung"]["Huynh Đệ"]
        for n in k["nhan_dinh"]:
            if n["id"] == "PT.Lộc Tồn.Huynh Đệ":
                thay += 1
                assert n["diem"] == 0
    assert thay > 5


def test_vo_chinh_dieu_base_nua_va_khong_san():
    # §4.1: vô chính diệu = base chính tinh mượn × 0.5, không có sàn (n_chinh_tinh_mv = 0), cờ vo_chinh_dieu bật
    tt, rnd, thay = TriThuc(), random.Random(37), 0
    he, cap = tt.cfg["vo_chinh_dieu"]["he_so"], tt.cfg["diem_v3"]["base_cap"]
    for _ in range(300):
        nam, ls = la_so_ngau_nhien(rnd)
        for k in bao_cao(LuanGiai(ls, tt))["cung"].values():
            p = k["phan_tich"]
            if not k["chinh_tinh"]:
                thay += 1
                assert p["vo_chinh_dieu"] and p["n_chinh_tinh_mv"] == 0 and p["san_ap_dung"] == 0
                assert abs(p["tong_base"] - min(max(sum(b["diem"] for b in p["base"]), cap[0]), cap[1]) * he) < 0.01
            else:
                assert not p["vo_chinh_dieu"]
    assert thay > 100


def test_hau_kiem_theo_muc():
    # văn mẫu không bao giờ bị bỏ câu; câu kéo sao mục khác sang mục này thì bị bỏ
    tt, rnd = TriThuc(), random.Random(41)
    for _ in range(80):
        nam, ls = la_so_ngau_nhien(rnd)
        kq = bao_cao(LuanGiai(ls, tt), nam, nam + rnd.randint(1, 60))
        van = viet_mau(kq)
        assert hau_kiem_theo_muc(van, kq) == (van, 0)
        ten = list(kq["chu_de"])
        ma = next((n["id"] for n in kq["chu_de"][ten[0]]["diem_manh"] + kq["chu_de"][ten[0]]["diem_yeu"]), None)
        if ma and not any(ma == n["id"] for cd in (kq["chu_de"][ten[2]],) for n in cd["diem_manh"] + cd["diem_yeu"] + cd["luu_y"] + cd["trung_tinh"]):
            fake = f"# {ten[2]}\nCâu lấn mục [{ma}]. Câu đúng [CD.{ten[2]}]."
            assert hau_kiem_theo_muc(fake, kq) == (f"# {ten[2]}\nCâu đúng [CD.{ten[2]}].", 1)


def test_bac_dung_nguong_va_la_so_trung_vi_la_trung_binh():
    # nhãn đúng bảng công khai spec v3 §4.7: ≤30 Rất thấp, 31–45 Thấp, 46–60 TB, 61–75 Khá, 76–90 Tốt, ≥91 Rất tốt; 35 KHÔNG được là 'Trung bình'
    from tuvi.luan_giai import bac
    tt = TriThuc()
    dn = tt.cfg["diem_noi_tai"]
    for d, nhan in ((5, "Rất thấp"), (30, "Rất thấp"), (35, "Thấp"), (45, "Thấp"), (50, "Trung bình"), (60, "Trung bình"),
                    (65, "Khá"), (75, "Khá"), (80, "Tốt"), (90, "Tốt"), (95, "Rất tốt")):
        assert bac(d, dn) == nhan, d
    # cung trung vị phải rơi vào 'Trung bình' (START = 50 là điểm trung tính)
    rnd, ds = random.Random(53), []
    for _ in range(150):
        nam, ls = la_so_ngau_nhien(rnd)
        ds += [k["diem100"] for k in bao_cao(LuanGiai(ls, tt))["cung"].values()]
    ds.sort()
    assert 50 <= ds[len(ds) // 2] <= 60, ds[len(ds) // 2]


def test_tuan_triet_nen_ve_giua():
    # §4.4: Tuần/Triệt NÉN độ lệch so với START về giữa (×0.6 Triệt, ×0.8 Tuần), không trừ thẳng: cung tốt hạ xuống, cung xấu nâng lên
    tt, rnd, thay = TriThuc(), random.Random(59), {"tot": 0, "xau": 0}
    v = tt.cfg["diem_v3"]
    for _ in range(300):
        nam, ls = la_so_ngau_nhien(rnd)
        for k in bao_cao(LuanGiai(ls, tt))["cung"].values():
            p = k["phan_tich"]
            ky_vong = (v["nen"]["Triệt"] if "Triệt" in k["tuan_triet"] else 1.0) * (v["nen"]["Tuần"] if "Tuần" in k["tuan_triet"] else 1.0)
            assert abs(p["k_triet_tuan"] - ky_vong) < 1e-3
            assert abs(p["raw_sau_triet"] - (v["start"] + (p["raw_truoc_triet"] - v["start"]) * ky_vong)) < 0.02
            assert abs(p["raw_sau_triet"] - v["start"]) <= abs(p["raw_truoc_triet"] - v["start"]) + 1e-9
            if k["tuan_triet"]:
                thay["tot" if p["raw_truoc_triet"] > v["start"] else "xau"] += 1
    assert thay["tot"] > 20 and thay["xau"] > 5


def test_nguon_sao_cho_base_va_hoa_cat_cuu_hai():
    # §15: base chỉ nhận chính tinh BẢN CUNG (hoặc sao mượn từ xung khi vô chính diệu); §15.3: chính tinh hãm đang mang Hóa Lộc/Quyền/Khoa không bị trừ, không xếp vào hạn chế
    tt, rnd, cuu = TriThuc(), random.Random(79), 0
    for _ in range(300):
        nam, ls = la_so_ngau_nhien(rnd)
        kq = bao_cao(LuanGiai(ls, tt))
        for ten, k in kq["cung"].items():
            p = k["phan_tich"]
            nguon = set(p["tap_xung"]) if p["vo_chinh_dieu"] else set(p["tap_ban_cung"])
            assert {b["sao"] for b in p["base"]} <= nguon, (ten, p["base"])
            for b in p["base"]:
                if b["hoa_cuu"]:
                    cuu += 1
                    assert b["diem"] == 0 and b["do_sang"] == "H"
                    assert next(n for n in k["nhan_dinh"] if n["id"] == f"CT.{b['sao']}.{ten}")["diem"] == 0
    assert cuu > 10


def test_tinh_cach_co_ca_hai_mat_khi_menh_co_sat_dac_dia():
    # lỗi cũ: sát tinh đắc địa (VD Kình Dương đắc đồng cung Mệnh) bị loại hẳn → Tính cách chỉ có điểm sáng
    tt, rnd, thay = TriThuc(), random.Random(61), 0
    for _ in range(600):
        nam, ls = la_so_ngau_nhien(rnd)
        kq = bao_cao(LuanGiai(ls, tt))
        dd = [n for n in kq["cung"]["Mệnh"]["nhan_dinh"] if n.get("dao_dau") and not n.get("nho") and not n.get("an")]
        if dd:
            thay += 1
            yeu = kq["chu_de"]["Tính cách"]["diem_yeu"]
            sao = dd[0]["id"].split(".")[1]
            # câu có thể đã được gộp vào câu 'trái chiều' (XD.*) của chính cung Mệnh — vẫn phải nhắc tên sao đó
            gop = [n for n in kq["chu_de"]["Tính cách"]["luu_y"] if n["id"].startswith("XD.Mệnh.") and sao in n["nhan"]]
            assert any(n["id"] == dd[0]["id"] for n in yeu) or gop or len([n for n in yeu if n["id"] not in ("XC.Thiên Di",)]) >= 3, dd[0]["id"]
    assert thay > 20


def test_cau_cung_cung_mot_cung_khong_noi_nguoc_nhau():
    # Mỗi sao sinh một câu riêng → cùng một cung có thể vừa "đông" vừa "ít", vừa "hòa thuận" vừa "bất hòa" (lỗi do người dùng phát hiện).
    # Bất biến: với mỗi trục (data/knowledge/truc_luan.json) KHÔNG còn câu hiện (không `an`) ở cả hai phía; nếu có cả hai phía thì có đúng
    # một câu XD.<cung>.<trục> thay thế, các câu gốc bị ẩn nhưng vẫn nằm trong danh sách (điểm không đổi).
    tt, rnd, gop = TriThuc(), random.Random(73), 0
    for _ in range(500):
        nam, ls = la_so_ngau_nhien(rnd)
        kq = bao_cao(LuanGiai(ls, tt))
        for ten, k in kq["cung"].items():
            hien = [n for n in k["nhan_dinh"] if not n.get("an") and n["id"].startswith(("CT.", "PT."))]
            for t in tt.truc.get(ten, []):
                co = lambda ds: [n for n in hien if any(n["nhan_dinh"].startswith(c) for c in ds)]
                assert not (co(t["duong"]["cau"]) and co(t["am"]["cau"])), (ten, t["id"], [n["nhan_dinh"] for n in hien])
                xd = [n for n in k["nhan_dinh"] if n["id"] == f"XD.{ten}.{t['id']}"]
                assert len(xd) <= 1
                if xd:
                    gop += 1
                    assert xd[0]["diem"] == 0 and xd[0]["luu_y"] and any(n.get("an") for n in k["nhan_dinh"])
    assert gop > 100


def test_la_so_review_quy_mui_nu():
    # Lá số do người review phân tích (Âm Nữ, Quý Mùi, dương 14/12/2003 22:00; Mệnh Sửu, Thân cư Phu Thê). Mỗi khẳng định dưới đây là một lỗi họ chỉ ra.
    tt = TriThuc()
    ls = an_la_so(**tu_duong_lich(2003, 12, 14, 22, 0, "nu", "bac")["an_sao"])
    kq = bao_cao(LuanGiai(ls, tt), 2003, 2026)
    hien = lambda c: [n for n in kq["cung"][c]["nhan_dinh"] if not n.get("an")]
    ids = lambda c: {n["id"] for n in hien(c)}
    # (1) Phu Thê / Thân cư: cụm Đà–Linh–Diêu–Khốc phải thành cảnh báo trắc trở, không còn "duyên sớm" hay "êm đềm" đứng như điểm mạnh
    assert {"CC58", "CC59"} <= ids("Phu Thê")
    # ... và phải HIỆN ở mục Tình cảm (trước đây cách cục bị câu từng sao đẩy khỏi top 3 nên kết luận chính biến mất)
    assert "CC58" in {n["id"] for n in kq["chu_de"]["Tình cảm – hôn nhân"]["diem_yeu"]}
    assert "CC63" in {n["id"] for n in kq["chu_de"]["Sự nghiệp"]["diem_yeu"]}
    assert "CC60" in {n["id"] for n in kq["chu_de"]["Gia đình"]["diem_yeu"]}
    txt = " ".join(n["nhan_dinh"] for n in hien("Phu Thê"))
    assert "duyên sớm" not in txt and "êm đềm" not in txt, txt
    # (2) Quan Lộc: Lương hãm + Mã → biến động; câu đơn lẻ "ổn định nhưng tiến chậm" không được đứng cạnh nó
    assert "CC63" in ids("Quan Lộc")
    assert not any("ổn định" in n["nhan_dinh"] for n in hien("Quan Lộc") if n["id"].startswith("CT."))
    # (3) Lộc Tồn ngộ Không–Triệt ở Huynh Đệ → kỵ hùn vốn; không còn câu "có duyên hùn vốn" ở Tử Tức
    assert "CC60" in ids("Huynh Đệ")
    assert not any("duyên hùn vốn" in n["nhan_dinh"] for c in kq["cung"] for n in kq["cung"][c]["nhan_dinh"])
    # (4) Tài Bạch vô chính diệu + Tuần: phải có lưu ý độ vững thấp hơn con số
    assert "VCD_TT" in ids("Tài Bạch")
    # (5) Mệnh Triệt: không được nói "tiền vận và hậu vận tương đương" trơn
    cau = kq["than"]["nhan_dinh"][1]["nhan_dinh"]
    assert "Triệt" in cau and "tương đương" not in cau, cau
    # (6) Phụ tinh ±1 phải được luận: Thiên Mã ở Quan Lộc, Thiên Khốc/Thiên Diêu ở Phu Thê (không tính điểm)
    nho = {n["id"] for cd in kq["chu_de"].values() for n in cd["sao_nho"]}
    assert "PT.Thiên Mã.Quan Lộc" in nho
    assert {"PT.Thiên Khốc.Phu Thê", "PT.Thiên Diêu.Phu Thê"} <= {n["id"] for n in kq["cung"]["Phu Thê"]["nhan_dinh"] if n.get("nho") or n.get("an")}
    # (7) câu dẫn nói rõ vị trí (tại / chiếu) và hướng nghiêng — không còn "quanh"
    cd = kq["chu_de"]["Tình cảm – hôn nhân"]["cau_dan"]
    assert "quanh" not in cd and "hạn chế nặng hơn" in cd, cd


def test_cach_cuc_thang_cau_don_le_va_khong_doi_diem():
    # cách cục đứng một phía → ẩn câu đơn lẻ phía kia (không tạo XD); sao nhỏ không bao giờ vào điểm mạnh/yếu hay phép đếm
    tt, rnd, thang, nho = TriThuc(), random.Random(81), 0, 0
    for _ in range(400):
        nam, ls = la_so_ngau_nhien(rnd)
        kq = bao_cao(LuanGiai(ls, tt))
        for ten, k in kq["cung"].items():
            for n in k["nhan_dinh"]:
                if n["id"].startswith("CC") and "thay cho câu đơn lẻ" in n["ly_do"]:
                    thang += 1
        for cd in kq["chu_de"].values():
            for n in cd["sao_nho"]:
                nho += 1
                assert n.get("nho") and not n.get("an"), n["id"]
            assert not any(n.get("nho") for n in cd["diem_manh"] + cd["diem_yeu"] + cd["trung_tinh"] + cd["luu_y"])
    assert thang > 5 and nho > 200, (thang, nho)


def test_khung_tuan_triet_khong_lap_nguyen_van():
    # câu đầy đủ nói một lần ở Nền; các mục chủ đề dùng bản ngắn
    tt, rnd, thay = TriThuc(), random.Random(67), 0
    for _ in range(200):
        nam, ls = la_so_ngau_nhien(rnd)
        kq = bao_cao(LuanGiai(ls, tt))
        van = viet_mau(kq)
        assert van.count("sao tốt giảm lực") <= 2          # tối đa Mệnh + Thân ở phần Nền
        for cd in kq["chu_de"].values():
            assert not any("sao tốt giảm lực" in n["nhan_dinh"] for n in cd["luu_y"])
            thay += len([n for n in cd["luu_y"] if n["id"] == "TT"])
    assert thay > 30


def test_mot_cach_viet_ten_thien_diem():
    tt, rnd = TriThuc(), random.Random(71)
    for _ in range(100):
        nam, ls = la_so_ngau_nhien(rnd)
        kq = bao_cao(LuanGiai(ls, tt), nam, nam + 20)
        assert "Riêu" not in json.dumps(kq, ensure_ascii=False) and "Riêu" not in viet_mau(kq)


def test_sat_xung_chi_tru_thang_khung_day_du_va_hai_mat():
    # (1) thêm sát vào cung XUNG làm điểm không tăng (tru thẳng theo trọng số xung −3, có cap tổng −30); (2) câu 'cung chủ' liệt kê MỌI chính tinh bản cung;
    # (3) §17: mục có cả sáng lẫn hung luôn có câu 'hai mặt cùng tồn tại'
    tt, rnd, thu, hai_mat = TriThuc(), random.Random(73), 0, 0
    for _ in range(300):
        nam, ls = la_so_ngau_nhien(rnd)
        lg = LuanGiai(ls, tt)
        ten = rnd.choice(CUNG_CHUC)
        chi = lg.chi_cua[ten]
        xung = mv(chi, 6)
        truoc = lg.cham_cung(ten)
        sau = LuanGiai(ls, tt, {xung: ["Lưu Hóa Kỵ"]}).cham_cung(ten)
        assert sau["diem"] <= truoc["diem"] + 1e-9
        thu += sau["diem"] < truoc["diem"]
        kq = bao_cao(lg)
        for tdn, cd in kq["chu_de"].items():
            for c in tt.cfg["chu_de"][tdn]["cung"]:
                assert all(sao in cd["khung"] for sao in kq["cung"][c]["chinh_tinh"]), (tdn, c)
            if cd["diem_manh"] and cd["diem_yeu"]:
                hai_mat += 1
                assert cd["cau_dan"] and "hai mặt cùng tồn tại" in cd["cau_dan"]
                assert "Nền tảng" not in cd["cau_dan"]            # §15.2: dòng 'Nền tảng' chỉ dành cho chính tinh bản cung (khung)
    assert thu > 100 and hai_mat > 200


def test_tu_duong_lich_toi_luan():
    a = tu_duong_lich(1990, 6, 8, 8, 30, "nam")["an_sao"]
    kq = bao_cao(LuanGiai(an_la_so(**a)), 1990, 2026)
    assert kq["la_so"]["input"]["can_nam"] == "Canh"


def test_phu_the_chon_nhanh_theo_gioi_tinh():
    """doc11 L1: câu Phu Thê không còn in cả hai nhánh 'Nếu bạn là nam/nữ'."""
    tt = TriThuc()
    for gt in ("nam", "nu"):
        for cn, cnam in itertools.product(range(1, 11), range(1, 13)):
            kq = LuanGiai(an_la_so(cn, cnam, 3, 10, 5, gt), tt).cham_cung("Phu Thê")
            assert not any("ếu bạn là" in n["nhan_dinh"] for n in kq["nhan_dinh"]), (gt, cn, cnam)
    assert chon_gioi("Nếu bạn là nữ, chồng tốt; nếu bạn là nam, vợ tốt.", "nam") == "Vợ tốt."
    assert chon_gioi("Nếu bạn là nữ, chồng tốt; nếu bạn là nam, vợ tốt.", "nu") == "Chồng tốt"


def test_cach_cuc_nhieu_cung():
    """doc11 L2: cách cục có pham_vi là danh sách; câu luận theo cung ưu tiên ket_luan_theo_cung."""
    lg = LuanGiai(an_la_so(1, 1, 1, 5, 4, "nam"), TriThuc())
    ids = lambda cung: {n["id"] for n in lg.cham_cung(cung)["nhan_dinh"]}
    assert "CC64" in ids("Huynh Đệ") and "CC64" in ids("Nô Bộc")
    assert "CC65" in ids("Điền Trạch") and "CC65" in ids("Tử Tức")
    # pham_vi "*": cách chạy ở mọi cung, câu điền đúng tên cung và cung xung
    nd = next(n for n in lg.cham_cung("Huynh Đệ")["nhan_dinh"] if n["id"] == "CC64")
    assert "{" not in nd["nhan_dinh"] and "CC64" == nd["id"]


def test_luan_lien_cung_chay_cho_moi_cung():
    """doc11 lô B: bảng Tuần/Triệt theo cung, sao → người, so cung chạy cho mọi cung/sao có trong bảng, không đổi điểm."""
    tt = TriThuc()
    lc = tt.lien_cung
    # (1) mọi cung có câu Tuần và Triệt riêng
    assert set(lc["tuan_triet_theo_cung"]) == set(CUNG_CHUC)
    assert all(set(v) == {"Tuần", "Triệt"} for v in lc["tuan_triet_theo_cung"].values())
    rnd = random.Random(5)
    thay = {"tt": set(), "vai": set(), "hoa": set(), "sc": set()}
    for _ in range(300):
        _, ls = la_so_ngau_nhien(rnd)
        lg = LuanGiai(ls, tt)
        kq = bao_cao(lg)
        for ten, k in kq["cung"].items():
            for n in k["nhan_dinh"]:
                if n["id"] == "TT" and len(k["tuan_triet"]) == 1:
                    assert n["nhan_dinh"] == lc["tuan_triet_theo_cung"][ten][k["tuan_triet"][0]]
                    thay["tt"].add(ten)
                if n["id"].startswith("LC.vai."):
                    assert n["diem"] == 0 and n["cung_nguon"] == ten and "{" not in n["nhan_dinh"]
                    thay["vai"].add(n["id"])
                if n["id"].startswith("LC.tt_hoa."):
                    assert "{" not in n["nhan_dinh"]
                    thay["hoa"].add(n["id"])
        for n in kq["so_cung"]:
            assert n["id"].startswith("SC.") and n["diem"] == 0 and "{" not in n["nhan_dinh"]
            thay["sc"].add(n["id"])
    assert len(thay["tt"]) >= 10 and len(thay["vai"]) >= 2 and len(thay["hoa"]) >= 2 and len(thay["sc"]) >= 4, thay


def test_dsl_xuyen_cung():
    tt = TriThuc()
    lg = LuanGiai(an_la_so(1, 1, 1, 5, 4, "nam"), tt)
    chi_ql = lg.chi_cua["Quan Lộc"]
    sao = next(s for s in lg.cung[chi_ql] if s in tt.phu)
    assert lg.khop({"cung_chuc": "Quan Lộc", "dk": {"co": sao}}, lg.chi_cua["Mệnh"])
    assert not lg.khop({"cung_chuc": "Quan Lộc", "dk": {"co": "không có sao này"}}, lg.chi_cua["Mệnh"])


def test_cach_cuc_xuyen_cung_deu_co_the_xay_ra():
    """doc11 lô B: mọi cách mới (CC64+) phải kích hoạt được trên lá số thật (trừ cách quá hiếm đã biết), mỗi cung đều có ít nhất một cách xuyên cung."""
    from tuvi.luan_giai import CHINH_TINH
    tt = TriThuc()
    moi = [c for c in tt.cach if int(c["id"][2:]) >= 64]
    assert {x for c in moi for x in ([c["pham_vi"]] if isinstance(c["pham_vi"], str) else c["pham_vi"])} >= set(CUNG_CHUC) | {"*"}
    rnd, thay, vai = random.Random(7), set(), set()
    for _ in range(600):
        _, ls = la_so_ngau_nhien(rnd)
        lg = LuanGiai(ls, tt)
        for c in moi:
            if c["id"] not in thay and any(lg.khop(c["thanh"], lg.chi_cua[cu]) for cu in (CUNG_CHUC if c["pham_vi"] == "*" else [c["pham_vi"]] if isinstance(c["pham_vi"], str) else c["pham_vi"])):
                thay.add(c["id"])
        for cu in CUNG_CHUC:
            vai |= {sao for n in lg.vai_nguoi(cu) for sao in n["nhan"]}
    hiem = {"CC70"}      # Thái Âm hãm ở Phu Thê + Đào Hoa ở Quan Lộc + Thiên Diêu ở Tài Bạch: có trong luật nhưng gần như không gặp
    assert {c["id"] for c in moi} - thay <= hiem, {c["id"] for c in moi} - thay
    # bảng sao → người phủ đủ 14 chính tinh
    assert set(tt.lien_cung["vai_nguoi"]["sao"]) >= set(CHINH_TINH)
    assert vai >= {"Tử Vi", "Thái Dương", "Thái Âm", "Tham Lang", "Thiên Phủ"}, vai
    # gộp: mỗi cung tối đa 2 câu sao → người
    rnd = random.Random(9)
    for _ in range(100):
        _, ls = la_so_ngau_nhien(rnd)
        lg = LuanGiai(ls, tt)
        for cu in CUNG_CHUC:
            ids = [n["id"] for n in lg.vai_nguoi(cu)]
            assert len(ids) == len(set(ids)) and len(ids) <= 2          # cô đọng: tối đa một câu mặt thuận và một câu mặt khó mỗi cung


if __name__ == "__main__":
    for ten, f in list(globals().items()):
        if ten.startswith("test_"):
            f()
            print("OK", ten)
