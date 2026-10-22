"""Bộ luận giải prototype: lá số (từ an_sao.py) → điểm từng cung + các nhận định khớp, mỗi nhận định kèm lý do.

Quy trình theo docs/06-phuong-phap-luan-giai.md. Tham số trong data/knowledge/cau_hinh_luan_giai.json.
Chạy demo: python3 tools/tuvi/luan_giai.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import CHI, an_la_so, mv, theo_cung  # noqa: E402

KB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "knowledge")
CHINH_TINH = ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ",
              "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"]
SINH = {"Moc": "Hoa", "Hoa": "Tho", "Tho": "Kim", "Kim": "Thuy", "Thuy": "Moc"}
KHAC = {"Moc": "Tho", "Tho": "Thuy", "Thuy": "Hoa", "Hoa": "Kim", "Kim": "Moc"}


def nap(ten):
    with open(os.path.join(KB, ten), encoding="utf-8") as f:
        return json.load(f)


class TriThuc:
    def __init__(self):
        self.cfg = nap("cau_hinh_luan_giai.json")
        self.phu = {s["ten"]: s for s in nap("phu_tinh.json")["sao"]}
        self.nhom = nap("phu_tinh.json")["nhom"]
        self.chinh = {s["ten"]: s for s in nap("chinh_tinh.json")["sao"]}
        self.bo_sao = nap("chinh_tinh_tai_chi.json")
        self.ma_tran = nap("chinh_tinh_tai_cung_chuc.json")["ma_tran"]
        cc = nap("cach_cuc.json")
        self.cach, self.pha_chung = cc["cach"], cc["_meta"]["pha_chung"]
        self.tu_hoa = nap("tu_hoa_luan.json")["to_hop"]
        # Độ sáng: bảng đã chốt (do_sang_chot.json) ưu tiên, còn lại lấy lasotuvi
        self.do_sang = {s["ten"].lower(): s["theo_chi"] for s in nap("do_sang.json")["sao"]}
        for ten, s in nap("do_sang_chot.json")["sao"].items():
            self.do_sang[ten.lower()] = s["theo_chi"]

    def sang(self, sao, chi):
        return self.do_sang.get(sao.lower(), {}).get(CHI[chi])


class LuanGiai:
    def __init__(self, la_so, tt=None):
        self.ls, self.tt = la_so, tt or TriThuc()
        self.cung = theo_cung(la_so)
        self.chi_cua = {ten: chi for chi, ten in la_so["cung_chuc"].items()}
        for c in la_so["tuan"]:
            self.cung[c].append("Tuần")
        for c in la_so["triet"]:
            self.cung[c].append("Triệt")

    # ---------- vùng ảnh hưởng
    def vung(self, chi, o="ban_cung"):
        return {"ban_cung": [chi], "xung": [mv(chi, 6)], "tam_hop": [mv(chi, 4), mv(chi, -4)],
                "tam_hop_ca_ban": [chi, mv(chi, 4), mv(chi, -4)], "ban_xung": [chi, mv(chi, 6)],
                "tam_phuong": [chi, mv(chi, 4), mv(chi, -4), mv(chi, 6)], "giap": [mv(chi, -1), mv(chi, 1)],
                "than": [self.ls["than"]]}[o]

    def sao_trong(self, chi, o="ban_cung"):
        return [s for c in self.vung(chi, o) for s in self.cung[c]]

    def chinh_tinh(self, chi):
        return [s for s in self.cung[chi] if s in CHINH_TINH]

    # ---------- DSL điều kiện (cach_cuc.json → _meta.dsl)
    def ds(self, x):
        return self.tt.nhom[x] if isinstance(x, str) and x in self.tt.nhom else ([x] if isinstance(x, str) else x)

    def khop(self, dk, chi):
        if "all" in dk:
            return all(self.khop(d, chi) for d in dk["all"])
        if "any" in dk:
            return any(self.khop(d, chi) for d in dk["any"])
        if "not" in dk:
            return not self.khop(dk["not"], chi)
        co = self.sao_trong(chi, dk.get("o", "ban_cung"))
        if "co" in dk:
            return dk["co"] in co
        if "co_ca" in dk:
            return all(s in co for s in self.ds(dk["co_ca"]))
        if "co_mot" in dk:
            return any(s in co for s in self.ds(dk["co_mot"]))
        if "khong_co" in dk:
            return not any(s in co for s in self.ds(dk["khong_co"]))
        if "dem" in dk:
            d = dk["dem"]
            ds = self.ds(d.get("nhom") or d.get("dem"))
            vung = self.sao_trong(chi, d.get("o", "ban_cung"))
            return sum(1 for s in ds if s in vung) >= d["toi_thieu"]
        if "chi" in dk:
            return CHI[chi] in dk["chi"]
        if "vcd" in dk:
            return (not self.chinh_tinh(chi)) == dk["vcd"]
        if "sang" in dk:
            s = dk["sang"]["sao"]
            return s in self.ls["sao"] and self.tt.sang(s, self.ls["sao"][s]) in dk["sang"]["thuoc"]
        if "sao_tai_chi" in dk:
            return CHI[self.ls["sao"][dk["sao_tai_chi"]["sao"]]] in dk["sao_tai_chi"]["chi"]
        if "tuan_triet" in dk:
            return ("Tuần" in self.cung[chi] or "Triệt" in self.cung[chi]) == dk["tuan_triet"]
        if "can_nam" in dk:
            return self.ls["input"]["can_nam"] in dk["can_nam"]
        if "vung_trung" in dk:
            a, b = dk["vung_trung"]
            return set(self.vung(chi, a)) == set(self.vung(chi, b))
        raise ValueError(f"Điều kiện không hiểu: {dk}")

    # ---------- Lớp 1: nền
    def nen(self):
        cfg, menh, cuc = self.tt.cfg["menh_cuc"], self.ls["ban_menh"], self.ls["cuc"]["hanh"]
        if SINH[cuc] == menh:
            k = "cuc_sinh_menh"
        elif cuc == menh:
            k = "tuong_hoa"
        elif KHAC[menh] == cuc:
            k = "menh_khac_cuc"
        elif SINH[menh] == cuc:
            k = "menh_sinh_cuc"
        else:
            k = "cuc_khac_menh"
        ket = [{"nhan_dinh": cfg[k]["luan"], "diem": cfg[k]["diem"],
                "ly_do": f"Bản Mệnh {menh}, Cục {cuc} ({k})", "id": f"NEN.{k}"}]
        ly = self.ls["am_duong_nam_nu"]
        thuan = ly in ("Dương Nam", "Âm Nữ")
        ket.append({"nhan_dinh": "Âm dương thuận lý: đời ít trắc trở hơn." if thuan else "Âm dương nghịch lý: hay gặp việc trái ý, phải bền chí.",
                    "diem": 1 if thuan else -1, "ly_do": ly, "id": "NEN.am_duong"})
        # sao chủ Mệnh vs Bản Mệnh
        bang = self.tt.cfg["sao_chu_ban_menh"]
        for s in self.chinh_tinh(self.ls["menh"]):
            h = self.tt.chinh[s]["ngu_hanh"]
            k = ("dong_hanh" if h == menh else "sao_sinh_menh" if SINH[h] == menh else "menh_sinh_sao" if SINH[menh] == h
                 else "sao_khac_menh" if KHAC[h] == menh else "menh_khac_sao")
            luan = {"dong_hanh": "đồng hành với Bản Mệnh — phát huy tốt", "sao_sinh_menh": "sinh Bản Mệnh — được sao nâng đỡ",
                    "menh_sinh_sao": "được Bản Mệnh sinh — mình hao sức nuôi sao", "sao_khac_menh": "khắc Bản Mệnh — giảm cái tốt của sao",
                    "menh_khac_sao": "bị Bản Mệnh khắc — chế ngự được sao"}[k]
            ket.append({"nhan_dinh": f"{s} ({h}) {luan}.", "diem": bang[k], "ly_do": f"Hành sao {h}, Bản Mệnh {menh}", "id": f"NEN.sao_chu.{k}"})
        return ket

    # ---------- Lớp 2-3: chấm 1 cung
    def cham_cung(self, ten_cung):
        chi = self.chi_cua[ten_cung]
        cfg = self.tt.cfg
        w = dict(cfg["trong_so_vi_tri"], xung=cfg["trong_so_vi_tri"]["xung_chieu"])
        hs = cfg["he_so_do_sang"]
        nhan_dinh, chi_tiet, diem = [], [], 0.0

        chinh = self.chinh_tinh(chi)
        chu, he_so_vcd, chi_chu = chinh, 1.0, chi
        if not chinh:
            chu, he_so_vcd, chi_chu = self.chinh_tinh(mv(chi, 6)), cfg["vo_chinh_dieu"]["he_so"], mv(chi, 6)
            nhan_dinh.append({"id": "VCD", "diem": 0, "nhan_dinh": self.tt.bo_sao["vo_chinh_dieu"]["chung"],
                              "ly_do": f"{ten_cung} tại {CHI[chi]} không có chính tinh; mượn {' + '.join(chu)} tại {CHI[chi_chu]}"})

        tuan_triet = [m for m in ("Tuần", "Triệt") if m in self.cung[chi]]
        he_so_tt = cfg["tuan_triet"]["he_so_sao_tot"] if tuan_triet else 1.0

        # chính tinh chủ
        for s in chu:
            muc = self.tt.sang(s, chi_chu) or "khong_ro"
            hop, txt_sang, txt_ham = self.tt.ma_tran[s][ten_cung]
            d = hs[muc] * (1 + hop) * he_so_vcd * he_so_tt
            diem += d
            chi_tiet.append((s, CHI[chi_chu], muc, round(d, 2)))
            nhan_dinh.append({"id": f"CT.{s}.{ten_cung}", "diem": round(d, 2),
                              "nhan_dinh": txt_ham if muc in ("H",) else txt_sang,
                              "ly_do": f"{s} ({muc}) tại {CHI[chi_chu]}, hợp cung {hop:+d}" + (f", gặp {'/'.join(tuan_triet)}" if tuan_triet else "")})

        # bộ sao tại chi (chỉ luận chi tiết cho Mệnh)
        if ten_cung == "Mệnh" and chu:
            for bo in self.tt.bo_sao["bo_sao"]:
                if sorted(bo["bo"]) == sorted(chu) and CHI[chi_chu] in bo["chi"]:
                    dc = bo.get("dieu_chinh", {}).get(CHI[chi_chu], 0)
                    diem += dc * he_so_vcd
                    txt = bo["chung"] + (" " + bo["theo_chi"][CHI[chi_chu]] if CHI[chi_chu] in bo["theo_chi"] else "")
                    nhan_dinh.append({"id": f"BO.{'+'.join(bo['bo'])}.{CHI[chi_chu]}", "diem": dc, "nhan_dinh": txt,
                                      "ly_do": f"Bộ {' + '.join(bo['bo'])} tại {CHI[chi_chu]}"})

        # chính tinh hội chiếu (tam hợp, xung) — ảnh hưởng nhẹ
        for o in ("tam_hop", "xung"):
            for c in self.vung(chi, o):
                if c == chi_chu:
                    continue
                for s in self.chinh_tinh(c):
                    muc = self.tt.sang(s, c) or "khong_ro"
                    d = hs[muc] * w[o] * 0.5
                    diem += d
                    chi_tiet.append((s, CHI[c], muc, round(d, 2)))

        # phụ tinh trong tam phương
        vung_tp = {c: ("ban_cung" if c == chi else "xung" if c == mv(chi, 6) else "tam_hop") for c in self.vung(chi, "tam_phuong")}
        co_mat = self.sao_trong(chi, "tam_phuong")
        doi = [tuple(p) for p in cfg["doi_sao_cung_hoi"]["cap"] if all(x in co_mat for x in p)]
        for c, o in vung_tp.items():
            for s in self.cung[c]:
                if s in CHINH_TINH or s not in self.tt.phu:
                    continue
                p = self.tt.phu[s]
                base = p["diem"]
                dac = CHI[c] in p.get("dac_dia", [])
                if base < 0 and dac:
                    base = base * -0.3            # sát tinh đắc địa: hết hại, thành lực
                if any(s in d for d in doi):
                    base *= cfg["doi_sao_cung_hoi"]["he_so_nhan"]
                elif abs(p["diem"]) <= 1:
                    base *= cfg["he_so_phu_tinh_nho"]
                d = base * w[o] * (he_so_tt if c == chi else 1.0)
                diem += d
                if abs(d) >= 0.5:
                    chi_tiet.append((s, CHI[c], "đắc" if dac else "", round(d, 2)))
                if c == chi and abs(p["diem"]) >= 1:
                    if s.startswith("Hóa"):
                        goc = self.ls["tu_hoa"][s]
                        txt = self.tt.tu_hoa.get(f"{goc}|{s}", p["y_nghia"])
                    else:
                        txt = p["y_nghia"]
                    if abs(p["diem"]) >= 2 or s.startswith("Hóa"):
                        nhan_dinh.append({"id": f"PT.{s}", "diem": round(d, 2), "nhan_dinh": txt,
                                          "ly_do": f"{s} thủ {ten_cung} tại {CHI[c]}" + (" (đắc địa)" if dac else "")})

        # vòng Tràng Sinh tại bản cung
        for s in self.cung[chi]:
            diem += cfg["trang_sinh"].get(s, 0)

        # Tuần Triệt
        if tuan_triet:
            nhan_dinh.append({"id": "TT", "diem": 0, "ly_do": f"{'/'.join(tuan_triet)} tại {CHI[chi]}",
                              "nhan_dinh": "Tuần/Triệt làm giảm lực các sao trong cung (tốt giảm tốt, xấu giảm xấu)"
                                           + ("; Triệt ứng mạnh trước ~30 tuổi." if "Triệt" in tuan_triet else "; Tuần ứng mạnh sau ~30 tuổi.")})

        # Cách cục
        for cc in self.tt.cach:
            if cc.get("pham_vi", "Mệnh") != ten_cung or not self.khop(cc["thanh"], chi):
                continue
            pha_chung = self.tt.pha_chung
            if "pha" in cc:
                bi_pha = self.khop(cc["pha"], chi)
                d = cc.get("diem_pha", cc["diem"]) if bi_pha else cc["diem"]
            elif cc.get("loai") == "cat" and self.khop(pha_chung["dieu_kien"], chi):
                bi_pha, d = True, round(cc["diem"] * pha_chung["he_so_diem"], 2)
            else:
                bi_pha, d = False, cc["diem"]
            diem += d
            nhan_dinh.append({"id": cc["id"], "diem": d,
                              "nhan_dinh": f"[{cc['ten']}{' — PHÁ CÁCH' if bi_pha else ''}] "
                                           + (cc.get("ket_luan_pha", "Gặp từ 2 sát tinh/Hóa Kỵ trong tam phương: cách bị giảm nhiều. " + cc["ket_luan"])
                                              if bi_pha else cc["ket_luan"]),
                              "ly_do": "Thỏa điều kiện cách cục" + (" nhưng gặp điều kiện phá" if bi_pha else "")
                                       + ("" if cc.get("xac_nhan_web") else " (cách chưa xác nhận nguồn web)")})

        nguong = cfg["nguong_ket_luan"].get("theo_cung", {}).get(ten_cung)
        xep = "Chưa hiệu chỉnh" if not nguong else ("Rất tốt" if diem >= nguong["rat_tot"] else "Tốt" if diem >= nguong["tot"] else
               "Trung bình" if diem >= nguong["trung_binh"] else "Xấu" if diem >= nguong["xau"] else "Rất xấu")
        return {"cung": ten_cung, "chi": CHI[chi], "diem": round(diem, 2), "xep_loai": xep,
                "chinh_tinh": chinh, "tuan_triet": tuan_triet, "nhan_dinh": nhan_dinh, "chi_tiet_diem": chi_tiet}

    # ---------- Lớp 4: hạn
    def han(self, nam_sinh, nam_xem):
        tuoi = nam_xem - nam_sinh + 1
        dh = next((c for c, t in sorted(self.ls["dai_han"].items(), key=lambda kv: kv[1])
                   if t <= tuoi < t + 10), None)
        can_x, chi_x = (nam_xem - 4) % 10 + 1, (nam_xem - 4) % 12 + 1
        luu_ls = an_la_so(can_x, chi_x, 1, 1, 1, self.ls["input"]["gioi_tinh"])  # chỉ lấy sao theo can/chi năm
        luu_sao = {f"Lưu {s}": luu_ls["sao"][s] for s in ("Thái Tuế", "Lộc Tồn", "Kình Dương", "Đà La", "Thiên Mã")}
        # Lưu Tứ Hóa: tên sao được hóa theo can năm xem, nhưng VỊ TRÍ là vị trí sao đó trên lá số gốc
        luu_sao.update({f"Lưu {hoa}": self.ls["sao"][goc] for hoa, goc in luu_ls["tu_hoa"].items()})
        ket = {"tuoi_am": tuoi, "dai_han": None, "luu_nien": {}}
        if dh:
            ten = self.ls["cung_chuc"][dh]
            ket["dai_han"] = {"cung_goc": ten, "chi": CHI[dh], "tu_tuoi": self.ls["dai_han"][dh],
                              "danh_gia_cung_goc": self.cham_cung(ten)["xep_loai"]}
        menh_luu = luu_sao["Lưu Thái Tuế"]
        ket["luu_nien"] = {"thai_tue_tai": f"{CHI[menh_luu]} ({self.ls['cung_chuc'][menh_luu]})",
                           "sao_luu": {k: f"{CHI[v]} ({self.ls['cung_chuc'][v]})" for k, v in luu_sao.items()}}
        canh_bao = []
        for k in ("Lưu Kình Dương", "Lưu Đà La", "Lưu Hóa Kỵ"):
            if dh and luu_sao[k] in self.vung(dh, "tam_phuong"):
                canh_bao.append(f"{k} rơi vào tam phương cung đại hạn ({CHI[luu_sao[k]]})")
        for k in ("Lưu Hóa Lộc", "Lưu Lộc Tồn"):
            if dh and luu_sao[k] in self.vung(dh, "tam_phuong"):
                canh_bao.append(f"{k} vào tam phương đại hạn → năm có cơ hội tài lộc")
        ket["ghi_chu"] = canh_bao
        return ket


def in_bao_cao(lg, nam_sinh=None, nam_xem=None):
    ls = lg.ls
    out = [f"# Luận giải (prototype)\n",
           f"{ls['input']['can_nam']} {ls['input']['chi_nam']} · tháng {ls['input']['thang']} · ngày {ls['input']['ngay']} · giờ {ls['input']['gio']} · {ls['am_duong_nam_nu']}",
           f"Bản Mệnh: {ls['ban_menh']} · Cục: {ls['cuc']['hanh']} {ls['cuc']['so']} · Mệnh tại {CHI[ls['menh']]} · Thân tại {CHI[ls['than']]} ({ls['cung_chuc'][ls['than']]})\n",
           "## Nền"]
    for n in lg.nen():
        out.append(f"- {n['nhan_dinh']}  `[{n['id']}]` — _{n['ly_do']}_")
    for ten in ["Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê", "Thiên Di", "Tật Ách", "Phúc Đức",
                "Điền Trạch", "Phụ Mẫu", "Tử Tức", "Huynh Đệ", "Nô Bộc"]:
        k = lg.cham_cung(ten)
        out.append(f"\n## {ten} ({k['chi']}) — {k['xep_loai']} (điểm {k['diem']})")
        for n in k["nhan_dinh"]:
            out.append(f"- {n['nhan_dinh']}  `[{n['id']} {n['diem']:+}]` — _{n['ly_do']}_")
    if nam_sinh and nam_xem:
        h = lg.han(nam_sinh, nam_xem)
        out.append(f"\n## Hạn năm {nam_xem} (tuổi âm {h['tuoi_am']})")
        if h["dai_han"]:
            d = h["dai_han"]
            out.append(f"- Đại hạn tại {d['chi']} (cung {d['cung_goc']} gốc, từ {d['tu_tuoi']} tuổi) — cung gốc xếp loại {d['danh_gia_cung_goc']}")
        out.append(f"- Lưu Thái Tuế tại {h['luu_nien']['thai_tue_tai']}")
        for g in h["ghi_chu"]:
            out.append(f"- {g}")
    return "\n".join(out)


if __name__ == "__main__":
    # Demo: người sinh năm 1990 (Canh Ngọ), tháng 5 âm, ngày 15, giờ Thìn, nam — xem năm 2026
    ls = an_la_so(7, 7, 5, 15, 5, "nam")
    print(in_bao_cao(LuanGiai(ls), 1990, 2026))
