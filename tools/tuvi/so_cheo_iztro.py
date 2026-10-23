"""So vị trí sao của an_sao.py với iztro (engine Trung Hoa, viết độc lập).

Chạy:
  python3 tools/tuvi/so_cheo_iztro.py tao_input 30000 > input.csv
  node tools/tuvi/so_cheo_iztro.js <npm_dir> < input.csv > iztro.jsonl
  python3 tools/tuvi/so_cheo_iztro.py so input.csv iztro.jsonl
iztro theo phái Trung Châu/Toàn Thư, nhiều sao mang tên Trung Hoa → bảng TEN dưới đây quy về tên VN.
"""
import collections
import json
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import CHI, an_la_so, mv  # noqa: E402

# tên iztro (vi-VN) → tên trong engine
TEN = {"Thiên Diêu": "Thiên Diêu", "Đài Phụ": "Thai Phụ", "Phụng Các": "Phượng Các", "Niên Giải": "Giải Thần",
       "Hàm Trì": "Đào Hoa",
       "TS.Trường Sinh": "Tràng Sinh", "BS.Bác Sỹ": "Bác Sĩ", "BS.Lực Sỹ": "Lực Sĩ",
       # vòng Thái Tuế bản Trung Hoa: cùng thứ tự, khác tên
       "TT.Tuế Kiện": "Thái Tuế", "TT.Hối Khí": "Thiếu Dương", "TT.Tang Môn": "Tang Môn", "TT.Quán Tác": "Thiếu Âm",
       "TT.Quan Phù": "Quan Phù", "TT.Tiểu Hao": "Tử Phù", "TT.Đại Hao": "Tuế Phá", "TT.Long Đức": "Long Đức",
       "TT.Bạch Hổ": "Bạch Hổ", "TT.Thiên Đức": "Phúc Đức", "TT.Điếu Khách": "Điếu Khách", "TT.Bệnh Phù": "Trực Phù"}
# sao chỉ có bên iztro (Trung Hoa) hoặc khác định nghĩa → không so
BO_QUA = {"Phi Liêm",  # sao Phi Liêm (蜚廉, theo chi năm) của iztro khác Phi Liêm vòng Bác Sĩ (BS.Phi Liêm)
          "Thiên Vu", "Thiên Nguyệt", "Âm Sát", "Giải Thần", "Thiên Đức", "Nguyệt Đức", "Thiên Không",
          "Tuần Không", "Triệt Lộ", "Không Vong"}
CHI_IDX = {c: i for i, c in enumerate(CHI) if c}
CHI_IDX["Tị"] = CHI_IDX["Tỵ"]


def tao_input(n):
    rnd = random.Random(7)
    for _ in range(n):
        print(f"{rnd.randint(1924, 2043)},{rnd.randint(1, 12)},{rnd.randint(1, 29)},{rnd.randint(1, 12)},{rnd.choice(['nam', 'nu'])}")


def so(input_csv, iztro_jsonl):
    khop, tong, mau_lech = collections.Counter(), collections.Counter(), collections.defaultdict(list)
    for dong, js in zip(open(input_csv), open(iztro_jsonl)):
        y, m, d, g, gt = dong.strip().split(",")
        y, m, d, g = map(int, (y, m, d, g))
        iz = json.loads(js)
        if f"ngày {d} tháng {m} năm {y}" not in iz["@lunar"]:
            continue                       # iztro tự sửa ngày không tồn tại → bỏ
        can, chi = (y - 4) % 10 + 1, (y - 4) % 12 + 1
        ls = an_la_so(can, chi, m, d, g, gt)
        ta = dict(ls["sao"], **{"@Mệnh": ls["menh"], "@Thân": ls["than"]})
        for c in ls["tuan"]:
            ta.setdefault("@Tuần", set()).add(c)
        for c in ls["triet"]:
            ta.setdefault("@Triệt", set()).add(c)
        for ten_iz, chi_iz in iz.items():
            if ten_iz.startswith("@") and ten_iz not in ("@Mệnh", "@Thân") or ten_iz.startswith("DH."):
                continue
            ten = TEN.get(ten_iz, ten_iz.split(".", 1)[-1])
            if ten_iz in BO_QUA or ten not in ta:
                if ten_iz in ("Tuần Không",):
                    ten = "@Tuần"
                elif ten_iz in ("Triệt Lộ", "Không Vong"):
                    ten = "@Triệt"
                else:
                    tong["(chỉ iztro) " + ten_iz] += 1
                    continue
            vi_tri = CHI_IDX[chi_iz]
            ok = vi_tri in ta[ten] if isinstance(ta[ten], set) else vi_tri == ta[ten]
            tong[ten] += 1
            khop[ten] += ok
            if not ok and len(mau_lech[ten]) < 3:
                mau_lech[ten].append(f"{y}/{m}/{d} giờ {CHI[g]} {gt}: ta {CHI[ta[ten]] if isinstance(ta[ten], int) else ta[ten]}, iztro {chi_iz}")
        # đại hạn: tuổi bắt đầu tại từng cung
        for k, chi_iz in iz.items():
            if k.startswith("DH."):
                tong["@Đại hạn"] += 1
                khop["@Đại hạn"] += ls["dai_han"].get(CHI_IDX[chi_iz]) == int(k[3:])
    for ten in sorted(tong, key=lambda t: (khop[t] / tong[t], t)):
        if ten.startswith("(chỉ iztro)"):
            continue
        print(f"{ten:16s} {khop[ten] / tong[ten]:7.2%}  ({tong[ten]})  {' | '.join(mau_lech[ten])}")
    print("\nSao chỉ iztro có:", ", ".join(t[12:] for t in tong if t.startswith("(chỉ iztro)")))


if __name__ == "__main__":
    if sys.argv[1] == "tao_input":
        tao_input(int(sys.argv[2]))
    else:
        so(sys.argv[2], sys.argv[3])
