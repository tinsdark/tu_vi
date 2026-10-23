"""Viết kết quả luận (luan_giai.bao_cao) thành văn xuôi bằng mẫu, KHÔNG dùng AI.

Mỗi câu phải kết thúc bằng [ID] trỏ về một nhận định trong báo cáo; hậu kiểm bỏ mọi câu không có ID hợp lệ hoặc nằm sai mục.
Bản ghép đầy đủ, giàu văn phong nằm ở web/src/engine/vanNen.ts; file này giữ bản ghép gọn để kiểm hậu kiểm và chạy dòng lệnh.

Chạy: python3 tools/tuvi/viet_van.py
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import an_la_so  # noqa: E402
from tuvi.luan_giai import HANH_VN, LuanGiai, bao_cao, nap  # noqa: E402

def tap_id(kq):
    """Mọi ID hợp lệ trong báo cáo."""
    ids = set()

    def duyet(x):
        if isinstance(x, dict):
            if "id" in x and "nhan_dinh" in x:
                ids.add(x["id"])
            for v in x.values():
                duyet(v)
        elif isinstance(x, list):
            for v in x:
                duyet(v)
    duyet(kq)
    # câu tổng quan lấy thẳng từ trường số liệu của báo cáo
    ids |= {"TQ"} | {f"CD.{ten}" for ten in kq["chu_de"]} | ({"DH"} if kq.get("han", {}).get("dai_han") else set())
    return ids


def hau_kiem(van, ids):
    """Giữ câu có ít nhất 1 ID hợp lệ; trả (văn đã lọc, số câu bị bỏ)."""
    giu, bo = [], 0
    for dong in van.splitlines():
        if not dong.strip() or dong.lstrip().startswith("#"):
            giu.append(dong)
            continue
        cau_giu = []
        for c in re.split(r"(?<=[\].!?])\s+", dong.strip()):
            ma = re.findall(r"\[([^\[\]]+)\]", c)
            if ma and all(m in ids for m in ma):
                cau_giu.append(c)
            else:
                bo += 1
        if cau_giu:
            giu.append(" ".join(cau_giu))
    return "\n".join(giu), bo


def muc_cho_phep(kq):
    """Mục nào được trích những mã nào (§2: không kéo sao của mục này sang mục khác). Khóa = tên mục (đầu tiêu đề)."""
    def ids(x):
        r = set()
        def duyet(v):
            if isinstance(v, dict):
                if "id" in v and "nhan_dinh" in v:
                    r.add(v["id"])
                for w in v.values():
                    duyet(w)
            elif isinstance(v, list):
                for w in v:
                    duyet(w)
        duyet(x)
        return r
    cho = {"Tổng quan": {"TQ", "DH"} | {f"CD.{t}" for t in kq["chu_de"]} | ids(kq["nen"]) | ids(kq["than"])}
    for t, cd in kq["chu_de"].items():
        cho[t] = {f"CD.{t}"} | ids({k: cd[k] for k in ("diem_manh", "diem_yeu", "luu_y", "trung_tinh", "sao_nho")})
        if TOPIC_THAN.get(kq["than"]["cu"]) == t:
            cho[t].add(f"THAN.{kq['than']['cu']}")        # câu 'cung này cũng là cung Thân cư'

    if "han" in kq:
        cho["Hạn năm"] = {"DH", "TQ"} | ids(kq["han"])
    # mục tổng hợp cuối bài: chỉ trích mã chủ đề, Thân và so cung (không có sao riêng lẻ)
    cho["Tổng kết"] = {"TQ"} | {f"CD.{t}" for t in kq["chu_de"]} | ids(kq["than"])
    cho["Những câu hỏi thường gặp"] = ({"DH"} | {f"CD.{t}" for t in kq["chu_de"]} | ids(kq["so_cung"]) | ids(kq["than"]) | ids(kq.get("dai_han_ca_doi", []))
                                       | ids([[cd["diem_manh"], cd["diem_yeu"]] for cd in kq["chu_de"].values()]) | ids(kq["han"]["luu_nien"]["ket_luan"] if "han" in kq else [])
                                       | {i for i in tap_id(kq) if re.fullmatch(r"CC\d+", i)})   # cách quý nhân: mã cách ở bất kỳ cung nào
    return cho


def hau_kiem_theo_muc(van, kq):
    """Như hau_kiem nhưng câu trong mục nào chỉ được trích mã thuộc mục đó; trả (văn đã lọc, số câu bị bỏ)."""
    cho, hien, giu, bo = muc_cho_phep(kq), None, [], 0
    tat_ca = tap_id(kq)
    for dong in van.splitlines():
        if not dong.strip():
            giu.append(dong)
            continue
        if dong.lstrip().startswith("#"):
            ten = dong.lstrip("# ").strip()
            hien = next((k for k in cho if ten.startswith(k)), None)
            giu.append(dong)
            continue
        ok = cho[hien] if hien else tat_ca
        cau_giu = []
        for c in re.split(r"(?<=[\].!?])\s+", dong.strip()):
            ma = re.findall(r"\[([^\[\]]+)\]", c)
            if ma and all(m in ok for m in ma):
                cau_giu.append(c)
            else:
                bo += 1
        if cau_giu:
            giu.append(" ".join(cau_giu))
    return "\n".join(giu), bo


def ve(n):
    """Một nhận định → 'nội dung [mã]' (dấu chấm giữa câu đổi thành chấm phẩy; ngoặc vuông chỉ dành cho mã)."""
    txt = re.sub(r"\.\s+", "; ", n["nhan_dinh"].strip()).rstrip(".")
    txt = re.sub(r"\[([^\[\]]+)\]", r"«\1»", txt)
    return f"{txt} [{n['id']}]"


def cau(n, tien_to=""):
    """Một nhận định → một câu kết thúc bằng mã."""
    return f"{tien_to}{ve(n)}."


def gop(ds, tien_to, da_dung=None):
    """Nhiều nhận định → MỘT câu 'Tiền tố: A [mã]; B [mã].'. `da_dung` (tập khóa) để bỏ nhận định đã nêu ở mục trước."""
    muc = []
    for n in ds:
        if da_dung is not None:
            khoa = (n["id"], n["nhan_dinh"])      # cùng mã nhưng khác nội dung (VD PHI_TUYEN của cung khác nhau) vẫn là ý khác nhau
            if khoa in da_dung:
                continue
            da_dung.add(khoa)
        muc.append(ve(n))
    return f"{tien_to}{'; '.join(muc)}." if muc else ""


TIEU_MUC = ("Cha mẹ", "Con cái", "Anh em")           # nhãn tiểu mục của chủ đề Gia đình (khớp chu_de.Gia đình.tieu_muc trong cấu hình)
TOPIC_THAN = {"Mệnh": "Tính cách", "Phúc Đức": "Tính cách", "Quan Lộc": "Sự nghiệp", "Thiên Di": "Sự nghiệp", "Tài Bạch": "Tài chính", "Phu Thê": "Tình cảm – hôn nhân"}


def doan_chu_de(ten, cd, kq, da_dung):
    """Một chủ đề → một đoạn: xếp loại → câu dẫn hòa giải → Thân cư (nếu đúng mục) → khung cung → chính tinh/trung tính → điểm sáng → 'Tuy nhiên' điểm cần lưu ý."""
    dong = [f"Về {ten.lower()}, lá số ở mức {cd['xep_loai'].lower()} (khoảng {cd['diem100']}/100) [CD.{ten}]."]
    dong.append(f"{cd['khung'].rstrip('.')} [CD.{ten}].")
    if cd["cau_dan"]:
        dong.append(f"{cd['cau_dan'].rstrip('.')} [CD.{ten}].")
    if TOPIC_THAN.get(kq["than"]["cu"]) == ten:
        dong.append(cau(kq["than"]["nhan_dinh"][0], "Cung này cũng là cung Thân cư: "))
    dong += [c for c in (gop(cd["luu_y"], "Khung của cung: ", da_dung), gop(cd["trung_tinh"], "Chính tinh và nhận định trung tính: ", da_dung)) if c]
    if ten == "Gia đình":
        for m in TIEU_MUC:
            bo = lambda ds: [dict(n, nhan_dinh=n["nhan_dinh"][len(m) + 2:]) for n in ds if n["nhan_dinh"].startswith(m + ": ")]
            dong += [c for c in (gop(bo(cd["diem_manh"]), f"{m} — điểm sáng: ", da_dung), gop(bo(cd["diem_yeu"]), f"{m} — hạn chế: ", da_dung)) if c]
    else:
        manh = gop(cd["diem_manh"], "Điểm sáng: ", da_dung)
        yeu = gop(cd["diem_yeu"], "Tuy nhiên, cần lưu ý: " if manh else "Cần lưu ý: ", da_dung)
        dong += [c for c in (manh, yeu) if c]
    nho = gop(cd["sao_nho"][:2], "Sao phụ khác đáng chú ý: ", da_dung)
    if nho:
        dong.append(nho)
    return " ".join(dong)


VAN_PHONG = nap("van_phong.json")
CAU_HOI = nap("cau_hoi.json")["cau_hoi"]


def _bo(t):
    return t.strip().rstrip(".")


def _cau(t, *ma):
    return f"{_bo(t)} {''.join(f'[{m}]' for m in ma)}."


def _sach(t):
    """Bỏ mũi tên, dấu chấm giữa câu, ngoặc vuông (chỉ dành cho mã)."""
    t = re.sub(r"\[([^\[\]]+)\]", r"«\1»", _bo(t))
    return re.sub(r"\.\s+", "; ", re.sub(r"\s*→\s*", ", ", t))


def _thuong(t):
    return t if not t or re.match(r"\w[^\W\d_]*\s[A-ZĐ]", t) and t[0].isupper() and len(t.split()) > 1 and t.split()[1][:1].isupper() else t[:1].lower() + t[1:]


def _dien(mau, **kw):
    for k, v in kw.items():
        mau = mau.replace("{" + k + "}", str(v))
    return mau


def doan_tong_ket(kq):
    """Tổng kết 2–3 câu sinh từ luật: mảng thuận nhất, mảng cần chú tâm nhất (chênh từ ngưỡng mới gọi tên, nếu không nói là đồng đều), rồi cung Thân."""
    tk = VAN_PHONG["tong_ket"]
    kc = nap("ke_chuyen.json")["chu_de"]
    xep = sorted(kq["chu_de"].items(), key=lambda kv: -kv[1]["diem100"])     # sort ổn định như TS
    if len(xep) < 2:
        return None
    (ten_cao, cao), (ten_thap, thap) = xep[0], xep[-1]
    s = []
    if cao["diem100"] - thap["diem100"] >= tk["chenh_toi_thieu"]:
        tan_dung = kc.get(ten_cao, {}).get("tan_dung")
        viec = kc.get(ten_thap, {}).get("viec_nen_lam", {}).get("chung")
        s.append(_cau(_dien(tk["manh"] if tan_dung else tk["manh_khong_viec"], ten=ten_cao.lower(), d=cao["diem100"], viec=tan_dung or ""), f"CD.{ten_cao}"))
        s.append(_cau(_dien(tk["yeu"] if viec else tk["yeu_khong_viec"], ten=ten_thap.lower(), d=thap["diem100"], viec=viec or ""), f"CD.{ten_thap}"))
    else:
        s.append(_cau(_dien(tk["dong_deu"], cao=ten_cao.lower(), dc=cao["diem100"], thap=ten_thap.lower(), dt=thap["diem100"]), f"CD.{ten_cao}", f"CD.{ten_thap}"))
    if len(kq["than"]["nhan_dinh"]) > 1:
        b = kq["than"]["nhan_dinh"][1]
        s.append(_cau(_dien(tk["than"], noi_dung=_thuong(_sach(b["nhan_dinh"]))), b["id"]))
    return " ".join(s)


def dong_hoi_dap(kq):
    """Hỏi–đáp (cau_hoi.json): mỗi câu hỏi chỉ được trả lời bằng đúng kết quả engine đã tính; không đủ luật thì không hỏi."""
    vp = VAN_PHONG["hoi_dap"]
    hoi_sc = {f"SC.{c['a']}.{c['b']}": c["hoi"] for c in nap("luan_lien_cung.json")["so_cung"]["cap"]}
    out = []
    for q in CAU_HOI:
        dong = []
        if q["loai"] == "chu_de":
            cd = kq["chu_de"].get(q["ten"])
            if not cd:
                continue
            dong = [_cau(_dien(vp["chu_de"], hoi=q["hoi"], nhan=cd["xep_loai"].lower(), d=cd["diem100"], ten=q["ten"]), f"CD.{q['ten']}")]     # chỉ trỏ về mục chi tiết, không nhắc lại câu đã có
        elif q["loai"] == "so_cung":
            n = next((x for x in kq["so_cung"] if x["id"] == f"SC.{q['a']}.{q['b']}"), None)
            if not n:
                continue
            chinh, *luu_y = re.split(r"(?<=\.)\s+", n["nhan_dinh"])
            dong = [_cau(_dien(vp["so_cung"], hoi=hoi_sc[n["id"]], tra_loi=_thuong(_sach(chinh))), n["id"]), *[_cau(_sach(c), n["id"]) for c in luu_y]]
        elif q["loai"] == "than":
            if len(kq["than"]["nhan_dinh"]) > 1:
                b = kq["than"]["nhan_dinh"][1]
                dong = [_cau(_dien(vp["mo"], hoi=q["hoi"], tra_loi=_thuong(_sach(b["nhan_dinh"]))), b["id"])]
        elif q["loai"] == "dai_han":
            ds = kq.get("dai_han_ca_doi", [])
            m = next((x for x in ds if x["nhan"] == q["nhan"]), None) if len(ds) > 1 else None
            if m:
                dong = [_cau(_dien(vp["mo"], hoi=q["hoi"], tra_loi=_thuong(_sach(m["nhan_dinh"]))), m["id"])]
        elif q["loai"] == "dai_han_nay":
            d = kq.get("han", {}).get("dai_han")
            if d:
                dong = [_cau(_dien(vp["dai_han_nay"], hoi=q["hoi"], tu=d["tu_tuoi"], den=d["tu_tuoi"] + 9, chi=d["chi"], cung_goc=d["cung_goc"], nhan=d["danh_gia"]["Mệnh"]["xep_loai"].lower()), "DH")]
        elif q["loai"] == "han":
            n = next((x for x in kq.get("han", {}).get("luu_nien", {}).get("ket_luan", []) if x["id"] == q["id"]), None)
            if n:
                dong = [f"Về {q['hoi']}: {_cau(_sach(n['nhan_dinh']), n['id'])}"]
        elif q["loai"] == "quy_nhan":
            cach = []
            for cung, k in kq["cung"].items():
                for n in k["nhan_dinh"]:
                    m = re.match(r"\[(.+?)\]", n["nhan_dinh"])      # bỏ cách bị phá ("— PHÁ CÁCH")
                    if n["id"].startswith("CC") and n["diem"] > 0 and not n.get("an") and q["linh_vuc"] in n.get("linh_vuc", []) and m and "PHÁ CÁCH" not in m.group(1):
                        cach.append((m.group(1), cung, n["id"]))
            if cach:
                ds = cach[:2]
                dong = [_cau(_dien(vp["quy_nhan"], hoi=q["hoi"], cach=" và ".join(f"cách «{t}» ở cung {c}" for t, c, _ in ds)), *[i for _, _, i in ds])]
        if dong:
            out.append(" ".join(dong))
    return out


def viet_mau(kq):
    """Không dùng LLM: ghép nhận định thành đoạn văn theo chủ đề (mỗi mục một đoạn, không lặp ý giữa các mục)."""
    la = kq["la_so"]
    tong = [f"Mệnh tại {kq['menh_tai']}, {la['am_duong_nam_nu']}, Bản Mệnh {HANH_VN[la['ban_menh']]}, Cục {HANH_VN[la['cuc']['hanh']]} {la['cuc']['so']} [TQ].",
            "Điểm /100 ở các mục dưới chỉ phản ánh tương quan nội tại giữa các cung của chính lá số này, không so với lá số khác [TQ]."]
    tong += [c for c in (gop(kq["nen"], "Nền lá số: "), gop(kq["than"]["nhan_dinh"], "Cung Thân: ")) if c]
    out = ["# Tổng quan", " ".join(tong)]
    da_dung = set()
    for ten, cd in kq["chu_de"].items():
        out.append(f"\n# {ten}")
        out.append(doan_chu_de(ten, cd, kq, da_dung))
    if "han" in kq and kq["han"]["dai_han"]:
        d = kq["han"]["dai_han"]
        out.append(f"\n# Hạn năm {kq['han']['nam_xem']}")
        dong = [f"Đang ở đại hạn {d['tu_tuoi']}–{d['tu_tuoi'] + 9} tuổi tại {d['chi']}; Mệnh đại hạn {d['danh_gia']['Mệnh']['xep_loai'].lower()} [DH]."]
        luu = gop(kq["han"]["luu_nien"]["ghi_chu"], f"Trong năm {kq['han']['nam_xem']}: ")
        out.append(" ".join(dong + ([luu] if luu else []) + [cau(n) for n in kq["han"]["luu_nien"]["ket_luan"]]))
    tk = doan_tong_ket(kq)
    if tk:
        out += ["\n# Tổng kết", tk]
    hd = dong_hoi_dap(kq)
    if hd:
        out += [f"\n# {VAN_PHONG['hoi_dap']['tieu_de']}", *hd]
    return "\n".join(out)


def viet(kq):
    """Trả (văn, số câu bị hậu kiểm bỏ)."""
    return hau_kiem(viet_mau(kq), tap_id(kq))


if __name__ == "__main__":
    lg = LuanGiai(an_la_so(7, 7, 5, 15, 5, "nam"))
    van, bo = viet(bao_cao(lg, 1990, 2026))
    print(van)
    print(f"\n<!-- hậu kiểm bỏ {bo} câu -->")
