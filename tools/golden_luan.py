"""Dữ liệu chuẩn cho bộ luận (bổ sung cho golden_dump.py): báo cáo đầy đủ, văn mẫu, hậu kiểm."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from golden_dump import input_la_so, profile_ngau_nhien  # noqa: E402
from tuvi.an_sao import an_la_so  # noqa: E402
from tuvi.luan_giai import LuanGiai, TriThuc, bao_cao  # noqa: E402
from tuvi.viet_van import hau_kiem, hau_kiem_theo_muc, muc_cho_phep, tap_id, viet, viet_mau  # noqa: E402

CAU_LLM_MAU = """# Tổng quan
Câu hợp lệ một mã [TQ]. Câu không có mã nào.
Câu mã bịa [KHONG.TON.TAI]. Câu hai mã [TQ][CD.Sự nghiệp].

# Tài chính
Câu cuối [CD.Tài chính]."""


def CAU_MUC(kq):
    """Văn giả có câu đúng mục, câu mượn mã của mục khác, câu mã bịa — để kiểm hậu kiểm theo mục khớp giữa Python và TS."""
    ten = list(kq["chu_de"])
    a, b = kq["chu_de"][ten[0]], kq["chu_de"][ten[2]]
    ma = lambda cd: next((n["id"] for n in cd["diem_manh"] + cd["diem_yeu"]), None)
    ma_a, ma_b = ma(a), ma(b)
    out = ["# Tổng quan", f"Câu chung [TQ]. Câu xếp loại [CD.{ten[0]}].", f"# {ten[2]}"]
    out.append(f"Câu đúng mục [CD.{ten[2]}]." + (f" Câu đúng mục [{ma_b}]." if ma_b else "") + (f" Câu lấn mục [{ma_a}]." if ma_a and ma_a != ma_b else "") + " Câu mã bịa [KHONG.CO].")
    out += [f"# {ten[0]}", f"Câu đúng mục [CD.{ten[0]}]."]
    return "\n".join(out)


def luan(n, rnd):
    tt = TriThuc()
    ca = []
    for i in range(n):
        v = input_la_so(rnd)
        prof = profile_ngau_nhien(rnd) if rnd.random() < 0.5 else None
        ls = an_la_so(v["can_nam"], v["chi_nam"], v["thang"], v["ngay"], v["gio"], v["gioi_tinh"], prof)
        nam_xem = v["nam_sinh"] + (rnd.randint(1, 130) if i % 10 == 0 else rnd.randint(1, 90))   # có ca tuổi quá 120 → không có đại hạn
        kq = bao_cao(LuanGiai(ls, tt), v["nam_sinh"], nam_xem)
        van, che_do, bo = viet(kq, dung_llm=False)
        ids = sorted(tap_id(kq))
        ca.append({"vao": dict(v, profile=prof, nam_xem=nam_xem), "bao_cao": kq, "van": van, "bo": bo, "ids": ids,
                   "muc": {k: sorted(v) for k, v in muc_cho_phep(kq).items()}, "hau_kiem_muc": list(hau_kiem_theo_muc(CAU_MUC(kq), kq)), "cau_muc": CAU_MUC(kq),
                   "hau_kiem": list(hau_kiem(CAU_LLM_MAU, set(ids))), "viet_mau": viet_mau(kq)})
    # báo cáo không có hạn
    v = input_la_so(rnd)
    ls = an_la_so(v["can_nam"], v["chi_nam"], v["thang"], v["ngay"], v["gio"], v["gioi_tinh"])
    ca.append({"vao": dict(v, profile=None, nam_xem=None), "bao_cao": bao_cao(LuanGiai(ls, tt)), "van": None, "bo": 0, "ids": [], "hau_kiem": [], "viet_mau": None})
    return ca
