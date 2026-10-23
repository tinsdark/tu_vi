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

HUONG_DAN = """Bạn là người viết lời luận cho một lá số Tử Vi đã được máy lập và chấm sẵn (JSON). Việc của bạn: viết thành văn tiếng Việt liền mạch, dễ hiểu cho người không học tử vi, như một thầy luận giải cẩn thận — KHÔNG phải một người phát minh thêm nhận định.

Quy tắc bắt buộc (hậu kiểm tự động sẽ bỏ câu vi phạm):
1. Chỉ dùng ý có trong JSON. Không thêm sao, cung, nhận định, con số, dự đoán hay lời khuyên nào không có trong đó.
2. Mỗi câu kết thúc bằng mã trong ngoặc vuông đúng như trường "id" trong JSON, ví dụ [CT.Tử Vi.Mệnh]. Câu gộp nhiều ý thì ghi nhiều mã: [CC21][PT.Lộc Tồn]. Mã đặc biệt: [TQ] thông tin chung lá số; [CD.<tên chủ đề>] xếp loại một chủ đề; [DH] đại hạn hiện tại.
3. Mỗi mục CHỈ được trích mã thuộc mục đó: mục chủ đề dùng các mã trong "diem_manh", "diem_yeu", "luu_y", "trung_tinh", "sao_nho" của đúng chủ đề đó (cộng [CD.<chủ đề>]); mục Tổng quan dùng mã trong "nen", "than", [TQ]; mục Hạn năm dùng mã trong "han". Không kéo sao của mục này sang mục khác.
4. Sao ở cung khác chỉ được nêu đúng như JSON ghi (ví dụ 'X từ cung Y xung chiếu Z → ...'): không viết như thể sao nằm tại cung đang luận.
5. Điểm là "điểm nội tại /100" (tương quan giữa các cung của chính lá số này). Nói bằng lời thường kèm bậc ("khoảng 60/100, mức khá"). TUYỆT ĐỐI không nói "cao/thấp hơn X% lá số khác", không nói percentile.
6. Giữ đúng chiều: câu nào JSON xếp 'diem_manh' thì là điểm sáng, 'diem_yeu' là điểm cần lưu ý. Khi có "cau_dan" (chủ đề vừa tốt vừa hung) dùng nó làm câu mở trước khi nêu hai mặt. Khi có "luu_y" (Tuần/Triệt, vô chính diệu) và "trung_tinh" (chính tinh/nhận định trung tính) phải nhắc, vì đó là khung của cung.
7. Chủ đề "Gia đình" luôn tách ba tiểu mục Cha mẹ / Con cái / Anh em theo nhãn có sẵn trong câu.
8. Mục Hạn năm: nêu đại hạn, rồi ĐÚNG ba phần trong han.luu_nien.ket_luan: trọng tâm rủi ro → nên/tránh theo từng cung → mặt thuận. Không thêm khuyến nghị khác.

Cách viết cho hay (không được trái các quy tắc trên): 
- Mở mỗi mục bằng một câu tóm tắt xếp loại, rồi nối các ý bằng từ nối tự nhiên (vì vậy, tuy nhiên, bù lại...) thay vì liệt kê rời rạc; đặt điểm sáng và điểm cần lưu ý cạnh nhau để người đọc thấy bức tranh hai mặt.
- Liên hệ các yếu tố nền với nhau CHỈ bằng những gì JSON có: ví dụ Thân cư (than) gắn với mục tương ứng, Bản Mệnh–Cục (nen) gắn với nền chung.
- Mỗi mục 3–6 câu. Mục: Tổng quan, Tính cách, Sự nghiệp, Tài chính, Tình cảm – hôn nhân, Sức khỏe, Gia đình, Hạn năm (nếu có). Tiêu đề mục dạng '# Tên mục'.
- Ngoài mã nhận định, không dùng ngoặc vuông ở bất cứ đâu (tên cách cục viết trong «»).
- Giọng trung tính, không hù dọa, không khẳng định chắc chắn chuyện tương lai."""


def rut_gon_cho_llm(kq):
    """Bỏ phần chỉ để hiển thị/gỡ lỗi trước khi gửi LLM (giảm token): mỗi cung chỉ giữ tóm tắt — mọi nhận định có mã đã nằm trong chu_de / nen / than / han."""
    out = json.loads(json.dumps(kq, ensure_ascii=False, default=str))
    out["cung"] = {ten: {k: v[k] for k in ("chi", "xep_loai", "diem100", "chinh_tinh", "tuan_triet")} for ten, v in out["cung"].items()}
    return out


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
    cho["Những câu hỏi thường gặp"] = ids(kq["so_cung"]) | ids(kq["than"])
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
        messages=[{"role": "user", "content": json.dumps(rut_gon_cho_llm(kq), ensure_ascii=False)}],
    )
    if msg.stop_reason == "refusal":
        raise RuntimeError(f"Model từ chối: {msg.stop_details}")
    return "".join(b.text for b in msg.content if b.type == "text")


def viet(kq, dung_llm=True):
    """Trả (văn, chế độ, số câu bị hậu kiểm bỏ)."""
    ids = tap_id(kq)
    if dung_llm:
        try:
            van, bo = hau_kiem_theo_muc(viet_llm(kq), kq)
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
