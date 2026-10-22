"""Sinh dữ liệu chuẩn (golden) từ engine Python cho test parity của web/ (TypeScript).

Chạy: python3 tools/golden_dump.py <thư mục ra> [so_mau]
Ghi: lich.json, an_sao.json, luan.json — web/test/parity.test.ts nạp và so khớp với bản TS.
Mọi tham số sinh bằng random.Random(seed cố định) nên lần nào cũng như nhau.
"""
import json
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import PROFILE_MAC_DINH, an_la_so  # noqa: E402
from tuvi.lich_am import duong_sang_am, tu_duong_lich  # noqa: E402

PROFILE_BIEN = {k: v for k, v in {
    "tu_hoa_canh": ["am_dong", "dong_am"], "tu_hoa_nham": ["ta_phu", "thien_phu"], "khoi_viet": ["khau_quyet", "lasotuvi"],
    "hoa_linh_ty_dau_suu": ["hoa_mao_linh_tuat", "hoa_tuat_linh_mao"], "pha_toai": ["khau_quyet", "lasotuvi"],
    "thien_giai": ["khong_nhay", "nhay_cung"], "luu_ha": ["thai_thu_lang", "thien_luong", "ngu_hanh"],
    "thien_tru_quy": ["tuat", "hoi"], "thien_quy": ["nghich", "thuan"], "luu_nguyet": ["tieu_han", "thai_tue"]}.items()}


def profile_ngau_nhien(rnd):
    return {k: rnd.choice(v) for k, v in PROFILE_BIEN.items()}


def input_la_so(rnd):
    nam = rnd.randint(1900, 2100)
    return {"can_nam": (nam - 4) % 10 + 1, "chi_nam": (nam - 4) % 12 + 1, "thang": rnd.randint(1, 12), "ngay": rnd.randint(1, 30),
            "gio": rnd.randint(1, 12), "gioi_tinh": rnd.choice(["nam", "nu"]), "nam_sinh": nam}


def lich(n, rnd):
    ngay = []
    for _ in range(n):
        d, m, y, mien = rnd.randint(1, 28), rnd.randint(1, 12), rnd.randint(1900, 2100), rnd.choice(["bac", "nam"])
        ngay.append({"vao": [d, m, y, mien], "ra": list(duong_sang_am(d, m, y, mien))})
    full = []
    for _ in range(n):
        y = rnd.randint(1920, 2060)
        vao = {"nam": y, "thang": rnd.randint(1, 12), "ngay": rnd.randint(1, 28), "gio": rnd.randint(0, 23), "phut": rnd.choice([0, 15, 30, 45, 59]),
               "gioi_tinh": rnd.choice(["nam", "nu"]), "mien": rnd.choice(["bac", "nam"]),
               "quy_uoc": {"ty_muon": rnd.choice(["ngay_sau", "ngay_do"]), "thang_nhuan": rnd.choice(["nhu_thang_truoc", "nhu_thang_sau", "chia_nua"]),
                           "mui_gio_lich_su": rnd.choice([True, False]), "gio_mat_troi": rnd.random() < 0.2}}
        kd = round(rnd.uniform(102, 109.5), 3)
        if vao["quy_uoc"]["gio_mat_troi"]:
            vao["kinh_do"] = kd
        ra = tu_duong_lich(vao["nam"], vao["thang"], vao["ngay"], vao["gio"], vao["phut"], vao["gioi_tinh"], vao["mien"], vao["quy_uoc"], vao.get("kinh_do"))
        full.append({"vao": vao, "ra": ra})
    # các ca khó: quanh các mốc đổi giờ lịch sử và giờ Tý muộn
    kho = []
    for (y, m, d) in [(1943, 6, 1), (1945, 3, 11), (1945, 9, 1), (1947, 4, 1), (1955, 6, 30), (1959, 12, 31), (1975, 6, 12), (1975, 6, 13), (1968, 1, 30)]:
        for gio in (0, 1, 7, 22, 23):
            for mien in ("bac", "nam"):
                vao = {"nam": y, "thang": m, "ngay": d, "gio": gio, "phut": 30, "gioi_tinh": "nam", "mien": mien, "quy_uoc": {}}
                kho.append({"vao": vao, "ra": tu_duong_lich(y, m, d, gio, 30, "nam", mien, {})})
    # quét liên tục: Tết Mậu Thân 1968 (Bắc/Nam lệch), năm 2054 (sóc sát nửa đêm), 1985, 2057, một năm nhuận
    for y, m0, m1 in [(1967, 12, 12), (1968, 1, 3), (2054, 1, 12), (1985, 1, 3), (2057, 9, 11), (2023, 1, 12), (2025, 1, 12)]:
        for m in range(m0, m1 + 1):
            for d in range(1, 29):
                for mien in ("bac", "nam"):
                    ngay.append({"vao": [d, m, y, mien], "ra": list(duong_sang_am(d, m, y, mien))})
    return {"ngay": ngay, "day_du": full, "kho": kho}


def an_sao(n, rnd):
    out = []
    for _ in range(n):
        v = input_la_so(rnd)
        prof = profile_ngau_nhien(rnd) if rnd.random() < 0.6 else None
        ra = an_la_so(v["can_nam"], v["chi_nam"], v["thang"], v["ngay"], v["gio"], v["gioi_tinh"], prof)
        out.append({"vao": dict(v, profile=prof), "ra": ra})
    return out


def main():
    ra = sys.argv[1]
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 600
    os.makedirs(ra, exist_ok=True)
    json.dump(lich(n * 3, random.Random(101)), open(os.path.join(ra, "lich.json"), "w"), ensure_ascii=False)
    json.dump(an_sao(n * 4, random.Random(202)), open(os.path.join(ra, "an_sao.json"), "w"), ensure_ascii=False)
    try:
        from golden_luan import luan  # noqa: E402  (bổ sung ở bước sau)
        json.dump(luan(max(n // 4, 40), random.Random(303)), open(os.path.join(ra, "luan.json"), "w"), ensure_ascii=False)
    except ImportError:
        pass


if __name__ == "__main__":
    main()
