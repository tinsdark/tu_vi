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
from tuvi.luan_giai import LuanGiai, bao_cao  # noqa: E402

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


def cau(n, tien_to=""):
    """Một nhận định → một câu kết thúc bằng mã (dấu chấm giữa câu đổi thành chấm phẩy)."""
    txt = re.sub(r"\.\s+", "; ", n["nhan_dinh"].strip()).rstrip(".")
    txt = re.sub(r"\[([^\[\]]+)\]", r"«\1»", txt)       # ngoặc vuông chỉ dành cho mã
    return f"{tien_to}{txt} [{n['id']}]."


def viet_mau(kq):
    """Không dùng LLM: ghép câu từ nhận định nổi bật theo chủ đề."""
    out = ["# Tổng quan", f"Mệnh tại {kq['menh_tai']}, {kq['la_so']['am_duong_nam_nu']}, "
           f"Bản Mệnh {kq['la_so']['ban_menh']}, Cục {kq['la_so']['cuc']['hanh']} {kq['la_so']['cuc']['so']} [TQ]."]
    out += [cau(n) for n in kq["nen"] + kq["than"]["nhan_dinh"]]
    for ten, cd in kq["chu_de"].items():
        out.append(f"\n# {ten}")
        out.append(f"Nhìn chung {cd['xep_loai'].lower()} (khoảng top {100 - cd['phan_vi']}% nếu so với mọi lá số) [CD.{ten}].")
        out += [cau(n, "Điểm mạnh: ") for n in cd["diem_manh"]]
        out += [cau(n, "Cần lưu ý: ") for n in cd["diem_yeu"]]
    if "han" in kq and kq["han"]["dai_han"]:
        d = kq["han"]["dai_han"]
        out.append(f"\n# Hạn năm {kq['han']['nam_xem']}")
        out.append(f"Đang ở đại hạn {d['tu_tuoi']}–{d['tu_tuoi'] + 9} tuổi tại {d['chi']}; Mệnh đại hạn {d['danh_gia']['Mệnh']['xep_loai'].lower()} [DH].")
        out += [cau(n) for n in kq["han"]["luu_nien"]["ghi_chu"]]
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
