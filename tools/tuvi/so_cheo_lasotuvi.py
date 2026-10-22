"""So chéo engine của mình với lasotuvi (chỉ là 1 phiếu tham khảo).

Chạy: python3 tools/tuvi/so_cheo_lasotuvi.py <thư mục clone lasotuvi>
In ra: với mỗi sao, % trường hợp khớp trên toàn bộ tổ hợp input; sao lệch thì in ví dụ.
"""
import itertools
import os
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import an_la_so, CHI  # noqa: E402

# saoID trong lasotuvi/Sao.py -> tên trong engine của mình
MAP_ID = {
    1: "Tử Vi", 2: "Liêm Trinh", 3: "Thiên Đồng", 4: "Vũ Khúc", 5: "Thái Dương", 6: "Thiên Cơ",
    7: "Thiên Phủ", 8: "Thái Âm", 9: "Tham Lang", 10: "Cự Môn", 11: "Thiên Tướng", 12: "Thiên Lương",
    13: "Thất Sát", 14: "Phá Quân",
    15: "Thái Tuế", 16: "Thiếu Dương", 17: "Tang Môn", 18: "Thiếu Âm", 19: "Quan Phù", 20: "Tử Phù",
    21: "Tuế Phá", 22: "Long Đức", 23: "Bạch Hổ", 24: "Phúc Đức", 25: "Điếu Khách", 26: "Trực Phù",
    27: "Lộc Tồn", 109: "Bác Sĩ", 28: "Lực Sĩ", 29: "Thanh Long", 30: "Tiểu Hao", 31: "Tướng Quân",
    32: "Tấu Thư", 33: "Phi Liêm", 34: "Hỷ Thần", 35: "Bệnh Phù", 36: "Đại Hao", 37: "Phục Binh",
    38: "Quan Phủ",
    39: "Tràng Sinh", 40: "Mộc Dục", 41: "Quan Đới", 42: "Lâm Quan", 43: "Đế Vượng", 44: "Suy",
    45: "Bệnh", 46: "Tử", 47: "Mộ", 48: "Tuyệt", 49: "Thai", 50: "Dưỡng",
    51: "Đà La", 52: "Kình Dương", 53: "Địa Không", 54: "Địa Kiếp", 55: "Linh Tinh", 56: "Hỏa Tinh",
    57: "Văn Xương", 58: "Văn Khúc", 59: "Thiên Khôi", 60: "Thiên Việt", 61: "Tả Phù", 62: "Hữu Bật",
    63: "Long Trì", 64: "Phượng Các", 65: "Tam Thai", 66: "Bát Tọa", 67: "Ân Quang", 68: "Thiên Quý",
    69: "Thiên Khốc", 70: "Thiên Hư", 71: "Thiên Đức", 72: "Nguyệt Đức", 73: "Thiên Hình",
    74: "Thiên Riêu", 75: "Thiên Y", 76: "Quốc Ấn", 77: "Đường Phù", 78: "Đào Hoa", 79: "Hồng Loan",
    80: "Thiên Hỷ", 81: "Thiên Giải", 82: "Địa Giải", 83: "Giải Thần", 84: "Thai Phụ", 85: "Phong Cáo",
    86: "Thiên Tài", 87: "Thiên Thọ", 88: "Thiên Thương", 89: "Thiên Sứ", 90: "Thiên La", 91: "Địa Võng",
    92: "Hóa Khoa", 93: "Hóa Quyền", 94: "Hóa Lộc", 95: "Hóa Kỵ", 96: "Cô Thần", 97: "Quả Tú",
    98: "Thiên Mã", 99: "Phá Toái", 100: "Thiên Quan", 101: "Thiên Phúc", 104: "Kiếp Sát",
    105: "Hoa Cái", 106: "Văn Tinh", 107: "Đẩu Quân", 108: "Thiên Không",
}


def la_so_lasotuvi(App, DiaBan, nam, thang, ngay, gio, nam_nu):
    db = App.lapDiaBan(DiaBan.diaBan, ngay, thang, nam, gio, 1 if nam_nu == "nam" else -1, False, 7)
    vi_tri = {}
    for cung in db.thapNhiCung[1:]:
        for s in cung.cungSao:
            if s["saoID"] in MAP_ID:
                vi_tri[MAP_ID[s["saoID"]]] = cung.cungSo
    return vi_tri


def main(duong_dan):
    sys.path.insert(0, duong_dan)
    from lasotuvi import App, DiaBan

    khop, tong, vi_du = defaultdict(int), defaultdict(int), {}
    # 60 năm (đủ vòng can chi) x 12 tháng x 30 ngày x 12 giờ x 2 giới = 518.400 lá số
    for nam, thang, ngay, gio, gt in itertools.product(range(1984, 2044), range(1, 13), range(1, 31),
                                                       range(1, 13), ["nam", "nu"]):
        can, chi = (nam - 4) % 10 + 1, (nam - 4) % 12 + 1
        cua_minh = an_la_so(can, chi, thang, ngay, gio, gt)["sao"]
        cua_ho = la_so_lasotuvi(App, DiaBan, nam, thang, ngay, gio, gt)
        for ten, vt in cua_ho.items():
            tong[ten] += 1
            if cua_minh.get(ten) == vt:
                khop[ten] += 1
            elif ten not in vi_du:
                vi_du[ten] = (nam, thang, ngay, CHI[gio], gt, CHI[cua_minh.get(ten, 0)], CHI[vt])

    lech = sorted((ten for ten in tong if khop[ten] != tong[ten]), key=lambda t: khop[t] / tong[t])
    print(f"Tổng {len(tong)} sao so sánh; khớp 100%: {len(tong) - len(lech)}; lệch: {len(lech)}\n")
    for ten in lech:
        n, t, d, g, gt, a, b = vi_du[ten]
        print(f"- {ten}: khớp {100 * khop[ten] / tong[ten]:.1f}% | ví dụ năm {n} tháng {t} ngày {d} giờ {g} {gt}: "
              f"mình={a}, lasotuvi={b}")


if __name__ == "__main__":
    main(sys.argv[1])
