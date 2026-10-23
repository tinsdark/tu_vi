"""Viết kết quả luận (luan_giai.bao_cao) thành văn xuôi.

Nguyên tắc (docs/04 Phase 5): LLM CHỈ viết lại, không thêm ý. Mỗi câu phải kết thúc bằng [ID] trỏ về một nhận định
trong báo cáo; hậu kiểm bỏ mọi câu không có ID hợp lệ.
Không có credential Anthropic (ANTHROPIC_API_KEY / `ant auth login`) → chế độ 'mau': ghép câu theo mẫu, không gọi API.

Chạy: python3 tools/tuvi/viet_van.py [--mau]
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import an_la_so  # noqa: E402
from tuvi.luan_giai import HANH_VN, LuanGiai, bao_cao  # noqa: E402

MODEL = "claude-opus-5-5"

HUONG_DAN = """Bạn viết lại kết quả luận lá số Tử Vi (JSON) thành văn tiếng Việt dễ đọc cho người không học tử vi.
Quy tắc bắt buộc:
- Chỉ dùng ý có trong JSON. Không thêm nhận định, dự đoán, con số hay lời khuyên nào không có trong đó.
- Mỗi câu kết thúc bằng mã nhận định trong ngoặc vuông, đúng như trường "id" trong JSON, ví dụ: ... [CT.Tử Vi.Mệnh]. Câu gộp nhiều ý thì ghi nhiều mã: [CC21][PT.Lộc Tồn].
- Viết theo mục: Tổng quan, Tính cách, Sự nghiệp, Tài chính, Tình cảm – hôn nhân, Sức khỏe, Gia đình, Hạn năm (nếu có). Mỗi mục 3–6 câu.
- Ngoài mã nhận định, không dùng ngoặc vuông ở bất cứ đâu (tên cách cục viết trong «»).
- Câu nêu xếp loại một chủ đề dùng mã [CD.<tên chủ đề>]; câu nêu thông tin chung của lá số dùng [TQ]; câu nêu đại hạn hiện tại dùng [DH].
- Nói rõ mức độ (xếp loại, phân vị) bằng lời thường; khi nhận định tốt và xấu cùng có, nêu cả hai.
- Giọng trung tính, không hù dọa, không khẳng định chắc chắn chuyện tương lai."""


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


def viet_mau(kq):
    """Không dùng LLM: ghép nhận định nổi bật thành đoạn văn theo chủ đề (mỗi mục một đoạn, không lặp ý giữa các mục)."""
    la = kq["la_so"]
    tong = [f"Mệnh tại {kq['menh_tai']}, {la['am_duong_nam_nu']}, Bản Mệnh {HANH_VN[la['ban_menh']]}, Cục {HANH_VN[la['cuc']['hanh']]} {la['cuc']['so']} [TQ].",
            "Điểm /100 ở các mục dưới chỉ phản ánh tương quan nội tại giữa các cung của chính lá số này, không so với lá số khác [TQ]."]
    tong += [c for c in (gop(kq["nen"], "Nền lá số: "), gop(kq["than"]["nhan_dinh"], "Cung Thân: ")) if c]
    out = ["# Tổng quan", " ".join(tong)]
    da_dung = set()
    for ten, cd in kq["chu_de"].items():
        out.append(f"\n# {ten}")
        dong = [f"Nhìn chung {cd['xep_loai'].lower()} (khoảng {cd['diem100']}/100) [CD.{ten}]."]
        if cd["cau_dan"]:
            dong.append(f"{cd['cau_dan'].rstrip('.')} [CD.{ten}].")
        dong += [c for c in (gop(cd["luu_y"], "Lưu ý cấu trúc: ", da_dung), gop(cd["diem_manh"], "Điểm sáng: ", da_dung), gop(cd["diem_yeu"], "Cần lưu ý: ", da_dung)) if c]
        out.append(" ".join(dong))
    if "han" in kq and kq["han"]["dai_han"]:
        d = kq["han"]["dai_han"]
        out.append(f"\n# Hạn năm {kq['han']['nam_xem']}")
        dong = [f"Đang ở đại hạn {d['tu_tuoi']}–{d['tu_tuoi'] + 9} tuổi tại {d['chi']}; Mệnh đại hạn {d['danh_gia']['Mệnh']['xep_loai'].lower()} [DH]."]
        luu = gop(kq["han"]["luu_nien"]["ghi_chu"], f"Trong năm {kq['han']['nam_xem']}: ")
        out.append(" ".join(dong + ([luu] if luu else []) + [cau(n) for n in kq["han"]["luu_nien"]["ket_luan"]]))
    return "\n".join(out)


def viet_llm(kq):
    import anthropic

    client = anthropic.Anthropic()
    msg = client.beta.messages.create(
        model=MODEL,
        max_tokens=16000,
        output_config={"effort": "medium"},
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        system=HUONG_DAN,
        messages=[{"role": "user", "content": json.dumps(kq, ensure_ascii=False, default=str)}],
    )
    if msg.stop_reason == "refusal":
        raise RuntimeError(f"Model từ chối: {msg.stop_details}")
    return "".join(b.text for b in msg.content if b.type == "text")


def viet(kq, dung_llm=True):
    """Trả (văn, chế độ, số câu bị hậu kiểm bỏ)."""
    ids = tap_id(kq)
    if dung_llm:
        try:
            van, bo = hau_kiem(viet_llm(kq), ids)
            return van, "llm", bo
        except Exception as e:  # thiếu SDK/credential/mạng → rơi về mẫu, báo rõ lý do
            print(f"[viet_van] không gọi được LLM ({type(e).__name__}: {e}) → dùng mẫu", file=sys.stderr)
    van, bo = hau_kiem(viet_mau(kq), ids)
    return van, "mau", bo


if __name__ == "__main__":
    lg = LuanGiai(an_la_so(7, 7, 5, 15, 5, "nam"))
    van, che_do, bo = viet(bao_cao(lg, 1990, 2026), dung_llm="--mau" not in sys.argv)
    print(van)
    print(f"\n<!-- chế độ: {che_do}; hậu kiểm bỏ {bo} câu -->")
