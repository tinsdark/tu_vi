"""Vẽ lá số ra SVG (địa bàn 12 cung, ô giữa ghi thông tin). Thuần chuỗi, không thư viện ngoài.

Chạy: python3 tools/tuvi/ve_la_so.py > la_so.svg
"""
import html
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import CHI, TY, SUU, DAN, MAO, THIN, TI, NGO, MUI, THAN, DAU, TUAT, HOI, an_la_so, theo_cung  # noqa: E402
from tuvi.luan_giai import CHINH_TINH, TriThuc  # noqa: E402

# (hàng, cột) của từng địa chi trên lưới 4×4
O = {TI: (0, 0), NGO: (0, 1), MUI: (0, 2), THAN: (0, 3), THIN: (1, 0), DAU: (1, 3),
     MAO: (2, 0), TUAT: (2, 3), DAN: (3, 0), SUU: (3, 1), TY: (3, 2), HOI: (3, 3)}
W, H = 250, 260
HANH = {"Kim": "Kim", "Moc": "Mộc", "Thuy": "Thủy", "Hoa": "Hỏa", "Tho": "Thổ"}
VONG_PHU = {"Tràng Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"}


def ve(ls, tt=None, tieu_de="Lá số Tử Vi"):
    tt = tt or TriThuc()
    cung = theo_cung(ls)
    e = html.escape
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {4 * W} {4 * H}" font-family="Be Vietnam Pro, Arial, sans-serif">',
           "<style>.k{fill:#fff;stroke:#555}.t{font-size:13px}.ct{font-size:15px;font-weight:700}.tot{fill:#1a7f37}"
           ".xau{fill:#b42318}.trung{fill:#444}.nho{font-size:11px;fill:#666}.cc{font-size:14px;font-weight:700;fill:#1f3a8a}"
           ".tt{font-size:12px;font-weight:700;fill:#fff}</style>",
           f'<rect x="0" y="0" width="{4 * W}" height="{4 * H}" fill="#fafafa"/>']
    for chi, (r, c) in O.items():
        x, y = c * W, r * H
        out.append(f'<rect class="k" x="{x}" y="{y}" width="{W}" height="{H}"/>')
        ten = ls["cung_chuc"][chi] + (" · THÂN" if chi == ls["than"] else "")
        out.append(f'<text class="cc" x="{x + W / 2}" y="{y + 18}" text-anchor="middle">{e(ten.upper())}</text>')
        out.append(f'<text class="nho" x="{x + 6}" y="{y + 18}">{CHI[chi]}</text>')
        out.append(f'<text class="nho" x="{x + W - 6}" y="{y + 18}" text-anchor="end">{ls["dai_han"][chi]}</text>')
        dy = y + 40
        for s in [s for s in cung[chi] if s in CHINH_TINH]:
            muc = tt.sang(s, chi) or ""
            hoa = [h.split()[1] for h, goc in ls["tu_hoa"].items() if goc == s]
            lop = "xau" if muc == "H" else "tot"
            out.append(f'<text class="ct {lop}" x="{x + W / 2}" y="{dy}" text-anchor="middle">{e(s)} ({muc})'
                       + (f' · {e("/".join(hoa))}' if hoa else "") + "</text>")
            dy += 19
        phu = [s for s in cung[chi] if s not in CHINH_TINH and s not in VONG_PHU and not s.startswith("Hóa")]
        tot = [s for s in phu if tt.phu.get(s, {}).get("diem", 0) > 0]
        xau = [s for s in phu if tt.phu.get(s, {}).get("diem", 0) < 0]
        trung = [s for s in phu if s not in tot and s not in xau]
        cot_y = {0: dy + 4, 1: dy + 4}
        for i, (ds, lop) in enumerate([(tot, "tot"), (xau, "xau")]):
            for s in ds:
                ham = " (H)" if tt.sang(s, chi) == "H" else ""
                out.append(f'<text class="t {lop}" x="{x + 8 + i * W / 2}" y="{cot_y[i] + 12}">{e(s)}{ham}</text>')
                cot_y[i] += 15
        yy = max(cot_y.values()) + 12
        if trung and yy < y + H - 28:
            out.append(f'<text class="nho" x="{x + 8}" y="{yy}">{e(", ".join(trung))[:60]}</text>')
        ts = next((s for s in cung[chi] if s in VONG_PHU), "")
        out.append(f'<text class="nho" x="{x + W / 2}" y="{y + H - 8}" text-anchor="middle">{e(ts)}</text>')
        for i, m in enumerate([m for m, ds in (("Tuần", ls["tuan"]), ("Triệt", ls["triet"])) if chi in ds]):
            out.append(f'<rect x="{x + W - 52}" y="{y + H - 24 - i * 20}" width="46" height="17" rx="3" fill="#111"/>'
                       f'<text class="tt" x="{x + W - 29}" y="{y + H - 11 - i * 20}" text-anchor="middle">{m}</text>')
    i = ls["input"]
    dong = [tieu_de, f"Năm {i['can_nam']} {i['chi_nam']} · tháng {i['thang']} · ngày {i['ngay']} · giờ {i['gio']}",
            ls["am_duong_nam_nu"], f"Bản Mệnh: {HANH[ls['ban_menh']]} · Cục: {HANH[ls['cuc']['hanh']]} {ls['cuc']['so']}",
            f"Mệnh tại {CHI[ls['menh']]} · Thân tại {CHI[ls['than']]}",
            "Tứ Hóa: " + ", ".join(f"{goc} {h.split()[1]}" for h, goc in list(ls["tu_hoa"].items())[:2]),
            ", ".join(f"{goc} {h.split()[1]}" for h, goc in list(ls["tu_hoa"].items())[2:]),
            "Màu: xanh = sao tốt / sáng, đỏ = sao xấu / hãm", "Số góc phải mỗi ô: tuổi bắt đầu đại hạn"]
    for k, d in enumerate(dong):
        out.append(f'<text x="{2 * W}" y="{H + 60 + k * 30}" text-anchor="middle" font-size="{22 if k == 0 else 16}"'
                   f'{" font-weight=\"700\"" if k == 0 else ""}>{e(d)}</text>')
    out.append("</svg>")
    return "\n".join(out)


if __name__ == "__main__":
    print(ve(an_la_so(7, 7, 5, 15, 5, "nam")))
