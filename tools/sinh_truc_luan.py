"""Sinh data/knowledge/truc_luan.json — các "trục" mà câu luận của MỘT cung có thể nói ngược nhau.

Vì sao cần: mỗi sao trong cung sinh ra một câu riêng ("Thiên Phủ: anh chị em đông và giúp đỡ nhau", "Địa Không: anh chị em
ít nhờ cậy được"), không bước nào đối chiếu các câu với nhau → cùng một cung vừa khen vừa chê một mặt. Engine dùng file này
để phát hiện khi MỘT trục có cả câu dương lẫn câu âm, rồi gộp thành một câu "trái chiều" (xem LuanGiai.hoa_giai_truc).

Cách soạn: dưới đây mỗi cung có vài trục, mỗi trục có 2 regex (dương, âm) soi vào CÂU ĐẦU của từng câu luận. Công cụ gom mọi
câu luận có thể xuất hiện ở cung đó (bảng chính tinh × cung, phụ tinh × cung, mẫu theo nhóm cung), cho vào trục nào khớp,
và BÁO LỖI nếu một câu khớp cả hai phía của cùng một trục (regex mơ hồ). Engine khớp theo `startswith` trên câu gốc nên
không phụ thuộc regex lúc chạy.

Chạy: python3 tools/sinh_truc_luan.py          (ghi file)
      python3 tools/sinh_truc_luan.py --xem    (in từng trục để rà bằng mắt, không ghi)
CI chạy lại và `git diff --exit-code` để file sinh ra không lệch với dữ liệu luận.
"""
import json
import os
import re
import sys

GOC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB = os.path.join(GOC, "data", "knowledge")
RA = os.path.join(KB, "truc_luan.json")

# (id trục, tên hiển thị, nhãn phía dương, nhãn phía âm, regex dương, regex âm)
# Chỉ đưa vào trục những cặp THẬT SỰ loại trừ nhau (đông ↔ ít, hòa thuận ↔ bất hòa); hai nét tính cách có thể cùng tồn tại
# (hiếu thảo + ham chơi) thì KHÔNG tạo trục, tránh báo "trái chiều" oan.
TRUC = {
    "Huynh Đệ": [
        ("so_luong", "Số lượng anh chị em", "đông", "ít", r"\bđông\b", r"(?:em|bạn) (?:khá )?ít(?:\s+hoặc|,|\.|$)"),
        ("hoa_khi", "Hòa khí giữa anh chị em", "hòa thuận, gắn bó", "bất hòa, xa cách",
         r"(?<!khó )hòa thuận|(?<!ít )gắn bó|hòa đồng",
         r"khó hòa thuận|ít gắn bó|(?<!lúc )(?<!có )(?<!ngầm )bất hòa|bất đồng|khắc khẩu|xung đột|va chạm|(?<!lúc )xa cách"),
        ("giup_do", "Anh chị em giúp đỡ nhau", "giúp đỡ được", "ít giúp được",
         r"(?<!ít )giúp đỡ nhau|hay giúp nhau|hỗ trợ nhau|cộng sự", r"ít giúp|ít nhờ cậy|phải gánh vác"),
    ],
    "Phụ Mẫu": [
        ("hoa_khi", "Quan hệ với cha mẹ và người trên", "êm đẹp, hòa thuận", "bất hòa, xa cách",
         r"êm đẹp|quan hệ với người trên tốt", r"bất hòa|bất đồng|xung khắc|va chạm|(?<!lúc )xa cách|trắc trở"),
        ("hoan_canh", "Hoàn cảnh cha mẹ", "khá giả, có của", "vất vả, hao tốn",
         r"khá giả|có của cải|làm kinh tế|có vị thế", r"(?<!lúc )vất vả|hao tốn|gặp trở ngại"),
        ("nho_cay", "Cha mẹ nâng đỡ", "che chở, nâng đỡ", "ít nhờ cậy được",
         r"che chở|chỉ bảo, nâng đỡ|dìu dắt|lo cho con", r"ít nhờ cậy"),
    ],
    "Tử Tức": [
        ("so_luong", "Số lượng con", "đông", "ít", r"\bđông\b", r"(?:bạn|cái|con) (?:khá )?ít(?:\s+hoặc|,|\.|$)|không nhiều"),
        ("de_day", "Con dễ dạy hay khó dạy", "hiếu thảo, ngoan, dễ dạy", "cứng đầu, khó dạy",
         r"hiếu thảo|hiếu thuận|hiền lành|ngoan|của bạn tốt", r"khó dạy|cứng đầu|cứng cỏi|ngang bướng"),
    ],
    "Phu Thê": [
        ("hoa_hop", "Hòa hợp vợ chồng", "êm đềm, hòa hợp", "sóng gió, xung đột",
         r"êm đềm|êm ấm|hỗ trợ bạn một cách thầm lặng|giúp đỡ đắc lực|hôn nhân của bạn có duyên", r"sóng gió|xung đột|to tiếng|lạnh nhạt|(?<!tránh )hiểu lầm|va chạm|chia ly|xa cách|hụt hẫng"),
        ("thoi_diem", "Thời điểm kết hôn", "duyên sớm", "đến muộn, chậm",
         r"duyên sớm", r"đến muộn|muộn thì mới bền|cưới hỏi thường chậm"),
        ("tuoi_doi", "Tuổi của bạn đời", "hơn tuổi bạn", "trẻ hơn bạn", r"hơn tuổi", r"trẻ hơn"),
    ],
    "Tật Ách": [
        ("the_trang", "Thể trạng chung", "khá, ít bệnh", "bệnh dai dẳng, khó chữa",
         r"sức khỏe (nhìn chung )?khá|sức khỏe của bạn ổn|ít bệnh(?!;)|không đến nỗi nặng|hồi phục tốt", r"dai dẳng|ngấm ngầm|bệnh[^.;,]*kéo dài|âm ỉ"),
        ("chua_tri", "Khả năng chữa bệnh", "gặp thầy giỏi, dễ chữa", "khó chữa, khó chẩn đoán",
         r"thầy giỏi|dễ có cách chữa|có người cứu|thầy gặp thuốc|giảm nhẹ", r"khó chữa|khó chẩn đoán"),
    ],
    "Điền Trạch": [
        ("so_huu", "Nhà đất nhiều hay ít", "nhiều nhà đất", "ít nhà đất", r"nhiều nhà đất|nhà đất của bạn nhiều", r"nhà cửa của bạn ít"),
        ("giu_cua", "Giữ được tài sản", "giữ được, tích lũy", "hao hụt, mất mát",
         r"giữ được tài sản|tích lũy", r"hao hụt|hao tán|mất mát|khó giữ|giữ của khó"),
        ("on_dinh", "Nhà cửa ổn định", "ổn định", "hay thay đổi, bất ổn",
         r"(?<!chưa )(?<!ít )ổn định", r"chưa ổn định|ít ổn định|hay thay đổi|bất ổn|biến động|làm lại nhiều lần"),
    ],
    "Tài Bạch": [
        ("giu_tien", "Giữ tiền hay hao tán", "biết giữ, tích lũy", "dễ hao tán",
         r"biết giữ|tích lũy|nền tảng giàu", r"hao tán|tiền đi nhanh|khó giữ|dễ tan|tan nhanh"),
        ("dong_tien", "Dòng tiền", "đều đặn, ổn", "thất thường, khó khăn",
         r"đều đặn|tiền bạc của bạn ổn|kiếm tiền thuận lợi", r"thất thường|vào ra khó khăn|thiếu hụt"),
    ],
    "Nô Bộc": [
        ("tin_cay", "Bạn bè và cấp dưới đáng tin", "tốt, đáng tin, hay giúp", "phản bội, lợi dụng, khó tin",
         r"của bạn tốt|hòa thuận|tận tâm|giữ chữ tín|hợp ý|hay giúp bạn|quan hệ xã hội của bạn tốt|sẵn lòng giúp",
         r"phản bội|lợi dụng|liên lụy|cướp công|kéo chân|khó tin cậy|ít giúp được|bị hại"),
        ("so_luong", "Số lượng bạn bè", "nhiều", "ít", r"có nhiều bạn bè", r"\bít mà chắc"),
    ],
    "Quan Lộc": [
        ("on_dinh", "Công việc ổn định hay thăng trầm", "ổn định", "thất thường, thăng trầm",
         r"(?<!chưa )ổn định", r"thất thường|thay đổi công việc liên tục|thăng trầm|lên xuống|nhanh lên nhanh xuống"),
    ],
    "Thiên Di": [
        ("thuan_loi", "Ra ngoài thuận lợi hay hao tổn", "có lợi, thuận lợi", "hao tán, mất mát, không thuận",
         r"có lợi|kiếm tiền thuận lợi|bạn có lộc|nhiều cơ hội|thích nghi tốt|cơ hội nhờ", r"hao tán|mất mát|không thuận|hao sức, hao tiền|chậm trễ"),
    ],
    "Phúc Đức": [
        ("phuc", "Phúc đức dày hay mỏng", "phúc dày", "phúc mỏng, hao",
         r"phúc của bạn (dày|khá)|phúc thọ|ấm phúc|phúc lộc của bạn ổn định|hưởng phúc", r"phúc của bạn (không nhiều|mỏng|dễ bị hao|bị trì kéo)|phúc đức của bạn có phần hao|phúc có phần hao"),
        ("tinh_than", "Đời sống tinh thần", "thanh thản, thoải mái", "căng thẳng, bất an",
         r"thanh thản|thoải mái|thanh nhã", r"căng thẳng|bất an|lo âu|khó yên|hay lo"),
        ("ho_hang", "Họ hàng", "thành đạt, đùm bọc", "ly tán, sa sút",
         r"thành đạt|đùm bọc|có tiếng|có thế lực|hiếu học|đỗ đạt|khá lên", r"ly tán|sa sút|rắc rối|ít giúp đỡ|phiêu bạt"),
    ],
    "Mệnh": [
        ("tinh_nong", "Tính nóng hay hiền hòa", "hiền hòa, điềm đạm", "nóng nảy, cương cường",
         r"hiền hòa|dịu dàng|điềm đạm", r"nóng nảy|cương cường|quyết liệt|nóng;"),
        ("doi_moi", "Đổi mới hay cứng nhắc", "tiên phong, dám đổi mới", "cứng nhắc, bảo thủ",
         r"tiên phong|dám đổi mới", r"cứng nhắc|bảo thủ"),
        ("giu_cua", "Giữ của hay hao tán", "biết giữ của, tài lộc bền", "dễ hao tán",
         r"biết giữ của|tài lộc bền", r"hao tán|tiêu xài vượt"),
    ],
}


# Câu phía ÂM đã được nhẹ nhàng hóa ("có lúc", "có phần"...) không đủ nặng để mâu thuẫn với câu dương.
NHE = re.compile(r"có lúc|đôi khi|có phần|thỉnh thoảng|vặt")


def cau_dau(t):
    """Câu đầu của một câu luận (phần sau là lời giải Hóa/ghi chú, không dùng để phân trục)."""
    return re.split(r"(?<=\.)\s+(?=[A-ZĐÂÊÔƠƯ])", t.strip(), maxsplit=1)[0]


def ve_dau(t):
    """Vế khẳng định chính: trước dấu ';' (sau ';' thường là điều kiện "nếu gặp sát tinh thì…", không phải khẳng định)."""
    return cau_dau(t).split(";")[0].lower()


def nap(ten):
    with open(os.path.join(KB, ten), encoding="utf-8") as f:
        return json.load(f)


def cau_cua_cung(cung, ma_tran, phu_cung, cfg):
    """Mọi câu luận có thể xuất hiện ở `cung` (cùng nguồn với LuanGiai.cham_cung)."""
    out = set()
    for sao, theo in ma_tran.items():
        if cung in theo:
            out.update(x for x in theo[cung][1:] if x)
    nhom = cfg["nhom_cung"].get(cung)
    for sao, theo in phu_cung.items():
        if not sao.startswith("_") and cung in theo:
            out.add(theo[cung])
    for sao, theo in cfg["mau_theo_nhom"].items():
        if sao.startswith("_"):
            continue
        if sao not in phu_cung or cung not in phu_cung[sao]:
            if nhom in theo:
                out.add(theo[nhom])
    return sorted(out)


def sinh():
    ma_tran = nap("chinh_tinh_tai_cung_chuc.json")["ma_tran"]
    phu_cung = nap("phu_tinh_tai_cung_chuc.json")["sao"]
    cfg = nap("cau_hinh_luan_giai.json")
    ket, loi = {}, []
    for cung, ds in TRUC.items():
        cau = cau_cua_cung(cung, ma_tran, phu_cung, cfg)
        ket[cung] = []
        for tid, ten, nd, na, rd, ra in ds:
            d, a = [], []
            for c in cau:
                v = ve_dau(c)
                p, n = bool(re.search(rd, v)), bool(re.search(ra, v)) and not NHE.search(v)
                if p and n:
                    loi.append(f"{cung}/{tid}: câu khớp cả hai phía: {c}")
                elif p:
                    d.append(c)
                elif n:
                    a.append(c)
            ket[cung].append({"id": tid, "ten": ten, "duong": {"nhan": nd, "cau": d}, "am": {"nhan": na, "cau": a}})
    return ket, loi


def main():
    ket, loi = sinh()
    if "--xem" in sys.argv:
        for cung, ds in ket.items():
            print("=====", cung)
            for t in ds:
                print(f"  [{t['id']}] {t['ten']}")
                print(f"     + {t['duong']['nhan']}:")
                for c in t["duong"]["cau"]:
                    print("         ", cau_dau(c))
                print(f"     − {t['am']['nhan']}:")
                for c in t["am"]["cau"]:
                    print("         ", cau_dau(c))
    if loi:
        print("\n".join(loi), file=sys.stderr)
        sys.exit(1)
    if "--xem" in sys.argv:
        return
    doc = {
        "_meta": {
            "mo_ta": "Trục luận cho từng cung: các câu cùng một trục mà ngược chiều nhau sẽ được gộp thành một câu 'trái chiều'. Sinh bởi tools/sinh_truc_luan.py — không sửa tay.",
            "trang_thai": "draft_ai_tong_hop",
        },
        "truc": ket,
    }
    with open(RA, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"Đã ghi {os.path.relpath(RA, GOC)}: " + ", ".join(f"{c} {len(d)} trục" for c, d in ket.items()))


if __name__ == "__main__":
    main()
