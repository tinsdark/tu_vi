"""Đối chiếu bộ luận với một 'thầy độc lập' trên 100 lá số dựng sẵn (seed cố định).

'Thầy' là phép chấm tối giản viết riêng, KHÔNG dùng logic của engine (không ma trận chính tinh × cung, không cách cục, không phi tuyến):
chính tinh sáng/hãm, cát tinh và sát tinh theo vị trí (bản cung > xung > tam hợp), Tuần/Triệt giảm lực. Hai cách chấm độc lập phải đồng xu hướng;
chỗ lệch lớn là chỗ phải đọc lại bằng mắt (xem docs/07). Thêm kiểm: nhãn điểm không được mâu thuẫn với nội dung mà người đọc thấy.

Chạy: python3 tools/tuvi/test_doi_chieu_thay.py
"""
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import CHI, CUNG_CHUC, an_la_so, mv  # noqa: E402
from tuvi.luan_giai import LuanGiai, TriThuc, bao_cao  # noqa: E402

CT = ("Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân")
SANG = {"M": 3, "V": 2.5, "Đ": 2, "B": 1, "H": -1.5}
CAT = ("Tả Phù", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt", "Lộc Tồn", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa")
SAT = ("Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp", "Hóa Kỵ")


def cac_la_so(n=100, seed=100):
    rnd, out = random.Random(seed), []
    for i in range(n):
        nam = rnd.randint(1950, 2010)
        out.append((nam, an_la_so((nam - 4) % 10 + 1, (nam - 4) % 12 + 1, rnd.randint(1, 12), rnd.randint(1, 30), rnd.randint(1, 12), "nam" if i % 2 else "nu")))
    return out


def thay_cham(lg, tt, chi):
    cg, sc = lg.cung, 0.0
    own = [s for s in cg[chi] if s in CT]
    nguon, k = (chi, 1.0) if own else (mv(chi, 6), 0.6)          # vô chính diệu: mượn xung chiếu, giảm lực
    for s in (own or [s for s in cg[nguon] if s in CT]):
        sc += 1.5 * k * SANG.get(tt.sang(s, nguon) or "B", 1)
    for c, w in ((chi, 1.0), (mv(chi, 6), 0.6), (mv(chi, 4), 0.5), (mv(chi, -4), 0.5)):
        for s in cg[c]:
            if s in CAT:
                sc += w * (0.3 if s in ("Văn Xương", "Văn Khúc") and tt.sang(s, c) == "H" else 1.0)
            if s in SAT:
                sc -= 1.6 * w * (0.35 if CHI[c] in tt.phu[s].get("dac_dia", []) else 1.0)
    return sc * 0.6 if any(m in cg[chi] for m in ("Tuần", "Triệt")) else sc


def hang(xs):
    o = sorted(range(len(xs)), key=lambda i: xs[i])
    r = [0] * len(xs)
    for i, j in enumerate(o):
        r[j] = i
    return r


def test_dong_xu_huong_voi_thay_doc_lap():
    tt, a, b = TriThuc(), [], []
    for _, ls in cac_la_so():
        lg = LuanGiai(ls, tt)
        for ten in CUNG_CHUC:
            a.append(thay_cham(lg, tt, lg.chi_cua[ten]))
            b.append(lg.cham_cung(ten)["diem"])
    ra, rb, n = hang(a), hang(b), len(a)
    rho = 1 - 6 * sum((x - y) ** 2 for x, y in zip(ra, rb)) / (n * (n * n - 1))
    assert rho >= 0.6, f"Spearman(thầy, engine) = {rho:.3f}"


def test_nhan_diem_khong_mau_thuan_noi_dung():
    tt, cao_nhung_hung, thap_nhung_sang, tong = TriThuc(), [], [], 0
    for nam, ls in cac_la_so():
        for ten, cd in bao_cao(LuanGiai(ls, tt))["chu_de"].items():
            tong += 1
            sang, hung = sum(n["diem"] for n in cd["diem_manh"]), sum(n["diem"] for n in cd["diem_yeu"])
            if cd["diem100"] >= 85 and hung < -sang:
                cao_nhung_hung.append((nam, ten))
            if cd["diem100"] <= 30 and sang > -hung:
                thap_nhung_sang.append((nam, ten))
            assert cd["diem_manh"] or cd["diem_yeu"] or cd["trung_tinh"], (nam, ten)      # chủ đề không được trống
    assert not cao_nhung_hung, cao_nhung_hung
    assert len(thap_nhung_sang) <= 0.02 * tong, thap_nhung_sang


def test_cach_cuc_khong_chong_diem_tuyen_tinh():
    # nhiều cách cục cùng dấu trên một cung: tổng điểm cách cục không vượt cách mạnh nhất × Σ hệ số giảm dần (cộng sai số làm tròn)
    tt = TriThuc()
    gd = tt.cfg["cach_cuc_giam_dan"]["he_so"]
    for _, ls in cac_la_so():
        for k in bao_cao(LuanGiai(ls, tt))["cung"].values():
            cc = [n["diem"] for n in k["nhan_dinh"] if n["id"].startswith("CC") and n["diem"] > 0]
            if cc:
                assert sum(cc) <= max(cc) * sum(gd[min(i, len(gd) - 1)] for i in range(len(cc))) + 0.05 * len(cc)


def test_tieu_tinh_di_doi_khong_nang_hon_tieu_tinh_le():
    # lỗi cũ: tiểu tinh đi đôi (Tam Thai–Bát Tọa…) nhân 1.5, tiểu tinh lẻ nhân 0.4 → đi đôi nặng gấp ~4 lần
    tt = TriThuc()
    cfg = tt.cfg
    for cap in cfg["doi_sao_cung_hoi"]["cap"]:
        for ten in cap:
            if abs(tt.phu[ten]["diem"]) <= 1:
                assert cfg["he_so_phu_tinh_nho"] * cfg["doi_sao_cung_hoi"]["he_so_nhan"] < 1.0


if __name__ == "__main__":
    for ten, f in list(globals().items()):
        if ten.startswith("test_"):
            f()
            print("OK", ten)
