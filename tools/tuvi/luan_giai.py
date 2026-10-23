"""Bộ luận giải prototype: lá số (từ an_sao.py) → điểm từng cung + các nhận định khớp, mỗi nhận định kèm lý do.

Quy trình theo docs/06-phuong-phap-luan-giai.md. Tham số trong data/knowledge/cau_hinh_luan_giai.json.
Chạy demo: python3 tools/tuvi/luan_giai.py
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import CAN, CHI, CUNG_CHUC, an_la_so, can_cung, mv, theo_cung  # noqa: E402

KB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "knowledge")
CHINH_TINH = ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ",
              "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"]
SINH = {"Moc": "Hoa", "Hoa": "Tho", "Tho": "Kim", "Kim": "Thuy", "Thuy": "Moc"}
KHAC = {"Moc": "Tho", "Tho": "Thuy", "Thuy": "Hoa", "Hoa": "Kim", "Kim": "Moc"}
HANH_VN = {"Kim": "Kim", "Moc": "Mộc", "Thuy": "Thủy", "Hoa": "Hỏa", "Tho": "Thổ"}   # tên hành để HIỂN THỊ (mã nội bộ không dấu)


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
        self.phu_cung = nap("phu_tinh_tai_cung_chuc.json")["sao"] if os.path.exists(os.path.join(KB, "phu_tinh_tai_cung_chuc.json")) else {}
        # Độ sáng: bảng đã chốt (do_sang_chot.json) ưu tiên, còn lại lấy lasotuvi
        self.do_sang = {s["ten"].lower(): s["theo_chi"] for s in nap("do_sang.json")["sao"]}
        for ten, s in nap("do_sang_chot.json")["sao"].items():
            self.do_sang[ten.lower()] = s["theo_chi"]

    def sang(self, sao, chi):
        return self.do_sang.get(sao.lower(), {}).get(CHI[chi])


class LuanGiai:
    def __init__(self, la_so, tt=None, sao_them=None):
        """sao_them: {chi: [tên sao]} chồng lên lá số gốc — sao lưu niên ('Lưu Kình Dương'), Tứ Hóa đại hạn ('ĐH Hóa Lộc')."""
        self.ls, self.tt = la_so, tt or TriThuc()
        self.cung = theo_cung(la_so)
        self.goc_hoa = dict(la_so["tu_hoa"])
        for c, ds in (sao_them or {}).items():
            self.cung[c].extend(ds)
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

    def phu(self, s):
        """(thông tin phụ tinh, hệ số) — sao lưu/đại hạn dùng thông tin sao gốc nhân hệ số."""
        if s in self.tt.phu:
            return self.tt.phu[s], 1.0
        tien_to, _, goc = s.partition(" ")
        if tien_to in self.tt.cfg["he_so_sao_luu"] and goc in self.tt.phu:
            return self.tt.phu[goc], self.tt.cfg["he_so_sao_luu"][tien_to]
        return None, 0

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
                "ly_do": f"Bản Mệnh {HANH_VN[menh]}, Cục {HANH_VN[cuc]} ({k})", "id": f"NEN.{k}"}]
        ly = self.ls["am_duong_nam_nu"]
        thuan = ly in ("Dương Nam", "Âm Nữ")
        ket.append({"nhan_dinh": ("Âm dương thuận lý: đại hạn an theo chiều thuận (đặc tính kỹ thuật của " + ly + "); một số trường phái cho là đời ít trắc trở hơn."
                                  if thuan else
                                  "Âm dương nghịch lý: chỉ nghĩa là đại hạn an theo chiều nghịch (đặc tính kỹ thuật của " + ly + "), không đồng nghĩa cuộc đời nghịch cảnh."),
                    "diem": 0, "ly_do": ly, "id": "NEN.am_duong"})
        # sao chủ Mệnh vs Bản Mệnh — mỗi câu có vế HỆ QUẢ cho đương số (docs: 'Mệnh X sinh/khắc Sao Y → mô tả → hệ quả')
        bang = self.tt.cfg["sao_chu_ban_menh"]
        for s in self.chinh_tinh(self.ls["menh"]):
            h = self.tt.chinh[s]["ngu_hanh"]
            k = ("dong_hanh" if h == menh else "sao_sinh_menh" if SINH[h] == menh else "menh_sinh_sao" if SINH[menh] == h
                 else "sao_khac_menh" if KHAC[h] == menh else "menh_khac_sao")
            luan = {"dong_hanh": f"cùng hành Bản Mệnh {HANH_VN[menh]} → đồng khí → sao phát huy trọn vẹn mặt tốt",
                    "sao_sinh_menh": f"{HANH_VN[h]} sinh Bản Mệnh {HANH_VN[menh]} → sao nuôi Mệnh → được nâng đỡ, dễ nhờ vào tính chất của sao",
                    "menh_sinh_sao": f"Bản Mệnh {HANH_VN[menh]} sinh {HANH_VN[h]} → sinh xuất, hao khí nuôi sao → tận lực, dễ đuối nếu ôm đồm; bù lại sao phát huy mặt tốt",
                    "sao_khac_menh": f"{HANH_VN[h]} khắc Bản Mệnh {HANH_VN[menh]} → sao chế ngược Mệnh → cái tốt của sao bị giảm, dễ chịu áp lực từ chính tính chất sao",
                    "menh_khac_sao": f"Bản Mệnh {HANH_VN[menh]} khắc {HANH_VN[h]} → khắc xuất, chế ngự được sao → kiểm soát tốt tính chất của sao, nhưng mặt hưởng thụ bị kìm, hơi khắc khổ"}[k]
            ket.append({"nhan_dinh": f"{s} ({HANH_VN[h]}): {luan}.", "diem": bang[k], "ly_do": f"Hành sao {HANH_VN[h]}, Bản Mệnh {HANH_VN[menh]}", "id": f"NEN.sao_chu.{k}"})
        # Tuần/Triệt án Mệnh hoặc Thân: ưu tiên cao, luôn nêu ở phần nền
        uu_tien = self.tt.cfg["tuan_triet"]["mau"]["uu_tien"]
        for ten, chi in (("Mệnh", self.ls["menh"]), ("Thân", self.ls["than"])):
            tt = [m for m in ("Tuần", "Triệt") if m in self.cung[chi]]
            if tt and (ten == "Mệnh" or self.ls["than"] != self.ls["menh"]):
                ten_cung = "Mệnh" if ten == "Mệnh" else f"cung Thân ({self.ls['cung_chuc'][chi]})"
                ket.append({"nhan_dinh": self.cau_tuan_triet(ten_cung, tt) + uu_tien, "diem": 0, "ly_do": f"{'/'.join(tt)} tại {CHI[chi]}", "id": f"NEN.tuan_triet.{ten}"})
        return ket

    def cau_tuan_triet(self, ten_cung, tuan_triet):
        """Câu Tuần/Triệt gắn đúng cung bị án (Triệt cắt mạnh nửa đầu đời, Tuần cản chậm; cả hai thì nói cả hai)."""
        m = self.tt.cfg["tuan_triet"]["mau"]
        return m["ca_hai" if len(tuan_triet) == 2 else tuan_triet[0]].format(cung=ten_cung)

    def mien_cho_phep(self, khoa, ten_cung):
        """Câu tổ hợp Tứ Hóa có nội dung theo lĩnh vực (tiền, tình cảm...) chỉ được nối vào cung thuộc lĩnh vực đó."""
        cfg = self.tt.cfg
        mien = cfg["tu_hoa_mien"].get(khoa)
        return not mien or any(ten_cung in cfg["mien_cung"][m] for m in mien)

    # ---------- quan hệ vị trí + metadata nguồn (mỗi nhận định phải truy được sao/cung nào sinh ra nó)
    def quan_he(self, chi_chu, c):
        """Cung c so với cung chủ chi_chu: ban_cung | xung | tam_hop | lien_quan (không thuộc tam phương tứ chính)."""
        if c == chi_chu:
            return "ban_cung"
        if c == mv(chi_chu, 6):
            return "xung"
        if c in (mv(chi_chu, 4), mv(chi_chu, -4)):
            return "tam_hop"
        return "lien_quan"

    def nguon(self, c, quan_he, nhan):
        return {"cung_nguon": self.ls["cung_chuc"][c], "chi_nguon": CHI[c], "quan_he": quan_he, "nhan": nhan}

    def cau_sat(self, ten_cung, sat_ban, sat_xh):
        """Câu cảnh báo sát tinh sinh từ dữ liệu thật: tách sát ở bản cung và sát ở xung/hội chiếu (không có thì không sinh)."""
        ban = ", ".join(dict.fromkeys(s for s, _ in sat_ban))
        nhom = {}
        for s, c, o in sat_xh:
            nhom.setdefault((c, o), []).append(s)
        xh = "; ".join(f"{', '.join(dict.fromkeys(ds))} ở {self.ls['cung_chuc'][c]} ({CHI[c]}), {'xung' if o == 'xung' else 'hội'} chiếu" for (c, o), ds in nhom.items())
        if sat_ban and sat_xh:
            return f"Sát tinh ở cả bản cung ({ban}) và xung/hội chiếu ({xh}) → cung {ten_cung} bị cản."
        if sat_ban:
            return f"Bản cung có {ban} → ảnh hưởng trực tiếp đến cung {ten_cung}."
        return f"Bản cung {ten_cung} tương đối nhẹ sát; áp lực đến từ xung/hội chiếu ({xh})."

    # ---------- Lớp 2-3: chấm 1 cung
    def cham_cung(self, ten_cung, chi=None):
        """Chấm cung chức `ten_cung` (mặc định tại vị trí của nó trên lá số gốc; truyền chi để chấm cung đại hạn/lưu niên)."""
        chi = chi or self.chi_cua[ten_cung]
        cfg = self.tt.cfg
        w = dict(cfg["trong_so_vi_tri"], xung=cfg["trong_so_vi_tri"]["xung_chieu"])
        hs = cfg["he_so_do_sang"]
        pt = cfg["phi_tuyen"]
        sat_set = set(cfg["sat_tinh"]["sat"]) | set(cfg["sat_tinh"]["ban_sat"])
        vung_pha = set(self.vung(chi, pt["vung"]))
        nhan_dinh, chi_tiet = [], []
        tong = {"tot": 0.0, "xau": 0.0, "nang": 0.0}
        sat_ban, sat_xh = [], []     # sát tinh thật sự gây hại (sát đắc địa đã lật dương không tính), tách theo vị trí

        def cong(d, sao=None, c=None):
            tong["tot" if d > 0 else "xau"] += d
            ten_goc = sao if sao in pt["sao_pha"] else (sao or "").partition(" ")[2]   # 'Lưu Kình Dương' tính như Kình Dương
            if d < 0 and ten_goc in pt["sao_pha"] and c in vung_pha:
                tong["nang"] += -d      # d của sao phá đã nhân trọng số vị trí riêng (bản cung > xung chiếu > tam hợp)

        chinh = self.chinh_tinh(chi)
        chu, he_so_vcd, chi_chu = chinh, 1.0, chi
        muon = False
        if not chinh:
            chu, he_so_vcd, chi_chu = self.chinh_tinh(mv(chi, 6)), cfg["vo_chinh_dieu"]["he_so"], mv(chi, 6)
            muon = True
            nhan_dinh.append({"id": "VCD", "diem": 0, "luu_y": True,
                              "nhan_dinh": cfg["vcd_theo_cung"].get(ten_cung) or (self.tt.bo_sao["vo_chinh_dieu"]["chung"] if ten_cung == "Mệnh" else cfg["vcd_mac_dinh"].format(cung=ten_cung)),
                              "ly_do": f"{ten_cung} tại {CHI[chi]} không có chính tinh; mượn {' + '.join(chu)} tại {CHI[chi_chu]}",
                              **self.nguon(chi, "ban_cung", ["vô chính diệu"])})

        tuan_triet = [m for m in ("Tuần", "Triệt") if m in self.cung[chi]]
        he_so_tt = cfg["tuan_triet"]["he_so_sao_tot"] if tuan_triet else 1.0

        # chính tinh chủ
        for s in chu:
            muc = self.tt.sang(s, chi_chu) or "khong_ro"
            hop, txt_sang, txt_ham = self.tt.ma_tran[s][ten_cung]
            # chính tinh hãm luôn trừ điểm (độ lớn tăng theo mức cung chức "gọi" sao ra): tránh âm × âm = dương làm câu hung bị xếp thành điểm sáng
            d = (hs[muc] * (1 + abs(hop)) if muc == "H" else hs[muc] * (1 + hop)) * he_so_vcd * he_so_tt * cfg["he_so_chinh_tinh_chu"]
            cong(d, s, chi_chu)
            chi_tiet.append((s, CHI[chi_chu], muc, round(d, 2)))
            nhan_dinh.append({"id": f"CT.{s}.{ten_cung}", "diem": round(d, 2),
                              "nhan_dinh": txt_ham if muc in ("H",) else txt_sang,
                              "ly_do": f"{s} ({muc}) tại {CHI[chi_chu]}, hợp cung {hop:+d}" + (f", gặp {'/'.join(tuan_triet)}" if tuan_triet else "")
                                       + (f"; mượn từ cung {self.ls['cung_chuc'][chi_chu]} xung chiếu" if muon else ""),
                              **self.nguon(chi_chu, "xung" if muon else "ban_cung", [s])})

        # bộ sao tại chi (chỉ luận chi tiết cho Mệnh)
        if ten_cung == "Mệnh" and chu:
            for bo in self.tt.bo_sao["bo_sao"]:
                if sorted(bo["bo"]) == sorted(chu) and CHI[chi_chu] in bo["chi"]:
                    dc = bo.get("dieu_chinh", {}).get(CHI[chi_chu], 0)
                    cong(dc * he_so_vcd)
                    txt = bo["chung"] + (" " + bo["theo_chi"][CHI[chi_chu]] if CHI[chi_chu] in bo["theo_chi"] else "")
                    nhan_dinh.append({"id": f"BO.{'+'.join(bo['bo'])}.{CHI[chi_chu]}", "diem": dc, "nhan_dinh": txt,
                                      "ly_do": f"Bộ {' + '.join(bo['bo'])} tại {CHI[chi_chu]}",
                                      **self.nguon(chi_chu, "xung" if muon else "ban_cung", list(bo["bo"]))})

        # chính tinh hội chiếu (tam hợp, xung) — ảnh hưởng nhẹ
        for o in ("tam_hop", "xung"):
            for c in self.vung(chi, o):
                if c == chi_chu:
                    continue
                for s in self.chinh_tinh(c):
                    muc = self.tt.sang(s, c) or "khong_ro"
                    d = hs[muc] * w[o] * 0.5
                    cong(d, s, c)
                    chi_tiet.append((s, CHI[c], muc, round(d, 2)))

        # phụ tinh trong tam phương
        vung_tp = {c: ("ban_cung" if c == chi else "xung" if c == mv(chi, 6) else "tam_hop") for c in self.vung(chi, "tam_phuong")}
        co_mat = self.sao_trong(chi, "tam_phuong")
        doi = [tuple(p) for p in cfg["doi_sao_cung_hoi"]["cap"] if all(x in co_mat for x in p)]
        for c, o in vung_tp.items():
            for s in self.cung[c]:
                if s in CHINH_TINH:
                    continue
                p, he_so_luu = self.phu(s)
                if not p:
                    continue
                base = p["diem"] * he_so_luu
                dac = CHI[c] in p.get("dac_dia", [])
                dao_dau = base < 0 and dac       # sát tinh đắc địa: điểm lật dương nhưng câu luận vẫn mô tả mặt xấu
                ham = base > 0 and self.tt.sang(p["ten"], c) == "H"
                if base < 0 and dac:
                    base = base * -0.3            # sát tinh đắc địa: hết hại, thành lực
                elif ham:
                    base = base * 0.3             # cát tinh hãm địa (VD Xương Khúc): còn ít lực
                if any(s in d for d in doi):
                    base *= cfg["doi_sao_cung_hoi"]["he_so_nhan"]
                elif abs(p["diem"]) <= 1:
                    base *= cfg["he_so_phu_tinh_nho"]
                # sát tinh/Hóa Kỵ: trọng số vị trí riêng — sát ở xa trừ ít hơn sát ở bản cung (docs/06 Lớp 3)
                wo = pt["trong_so"][o] if base < 0 and p["ten"] in pt["sao_pha"] else w[o]
                d = base * wo * (he_so_tt if c == chi else 1.0)
                cong(d, s, c)
                if p["ten"] in sat_set and p["diem"] < 0 and not dao_dau:
                    if o == "ban_cung":
                        sat_ban.append((p["ten"], c))
                    else:
                        sat_xh.append((p["ten"], c, o))
                if abs(d) >= 0.5:
                    chi_tiet.append((s, CHI[c], "đắc" if dac else "", round(d, 2)))
                if c == chi and abs(p["diem"]) >= 1:
                    goc_ten = p["ten"]
                    txt = self.tt.phu_cung.get(goc_ten, {}).get(ten_cung)
                    if txt is None:    # chưa có câu riêng theo cung → câu theo NHÓM cung (nếu có), không dùng câu generic của cung khác
                        txt = cfg["mau_theo_nhom"].get(goc_ten, {}).get(cfg["nhom_cung"][ten_cung])
                    if goc_ten.startswith("Hóa") and s == goc_ten:
                        khoa = f"{self.goc_hoa[s]}|{s}"
                        hop = self.tt.tu_hoa.get(khoa) if self.mien_cho_phep(khoa, ten_cung) else None
                        txt = (txt + " " if txt else "") + (hop if hop is not None else ("" if txt else p["y_nghia"]))
                    txt = (txt or p["y_nghia"]).strip()
                    if abs(p["diem"]) >= 2 or goc_ten.startswith("Hóa") or he_so_luu != 1.0:
                        nd = {"id": f"PT.{s}" + (f".{ten_cung}" if goc_ten in self.tt.phu_cung else ""), "diem": round(d, 2),
                              "nhan_dinh": txt, "ly_do": f"{s} thủ {ten_cung} tại {CHI[c]}" + (" (đắc địa: bớt hại, có thể thành lực)" if dao_dau else " (đắc địa)" if dac else " (hãm địa — lực yếu)" if ham else ""),
                              **self.nguon(c, o, [s])}
                        if dao_dau:
                            nd["dao_dau"] = True
                        nhan_dinh.append(nd)

        # vòng Tràng Sinh tại bản cung
        for s in self.cung[chi]:
            cong(cfg["trang_sinh"].get(s, 0))

        # Tuần Triệt
        if tuan_triet:
            nhan_dinh.append({"id": "TT", "diem": 0, "luu_y": True, "ly_do": f"{'/'.join(tuan_triet)} tại {CHI[chi]}",
                              "nhan_dinh": self.cau_tuan_triet(ten_cung, tuan_triet),
                              **self.nguon(chi, "ban_cung", list(tuan_triet))})

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
            cong(d)
            nhan_dinh.append({"id": cc["id"], "diem": d, "linh_vuc": cc.get("linh_vuc", []),
                              "nhan_dinh": f"[{cc['ten']}{' — PHÁ CÁCH' if bi_pha else ''}] "
                                           + (cc.get("ket_luan_pha", "Gặp từ 2 sát tinh/Hóa Kỵ ở bản cung và xung chiếu: cách bị giảm nhiều. " + cc["ket_luan"])
                                              if bi_pha else cc["ket_luan"]),
                              "ly_do": "Thỏa điều kiện cách cục" + (" nhưng gặp điều kiện phá" if bi_pha else "")
                                       + ("" if cc.get("xac_nhan_web") else " (cách chưa xác nhận nguồn web)"),
                              **self.nguon(chi, "ban_cung", [f"«{cc['ten']}»"])})

        # Phi tuyến: sao phá nặng làm mất tác dụng phần tốt; câu cảnh báo chỉ sinh khi THẬT SỰ có sát tinh (bản cung và/hoặc xung/hội chiếu)
        he_so_pha = 1 / (1 + tong["nang"] / pt["K"])
        diem = tong["tot"] * he_so_pha + tong["xau"]
        if sat_ban or sat_xh:
            nhan_dinh.append({"id": "PHI_TUYEN", "diem": round(tong["tot"] * (he_so_pha - 1), 2),
                              "nhan_dinh": self.cau_sat(ten_cung, sat_ban, sat_xh),
                              "ly_do": f"Tổng lực sao phá {tong['nang']:.1f}, hệ số {he_so_pha:.2f}",
                              **self.nguon(chi, "ban_cung", list(dict.fromkeys([s for s, _ in sat_ban] + [x[0] for x in sat_xh])))})

        nguong = cfg["nguong_ket_luan"].get("theo_cung", {}).get(ten_cung)
        dn = cfg["diem_noi_tai"]
        sang_chu = [self.tt.sang(s, chi_chu) for s in chu]
        # sàn: chính tinh miếu/vượng thì sát tinh chỉ đến từ xung/hội chiếu không được kéo cung xuống dưới 'trung bình'
        san = any(m in ("M", "V") for m in sang_chu) and not sat_ban
        dq = quy_doi(diem, nguong)
        if san:
            dq = max(dq, dn["san_chinh_tinh_sang"])
        d100 = diem_100(dq)
        return {"cung": ten_cung, "chi": CHI[chi], "diem": round(diem, 2), "diem100": d100, "xep_loai": bac(d100, dn),
                "sat_xh": [{"sao": x[0], "cung": self.ls["cung_chuc"][x[1]], "chi": CHI[x[1]], "quan_he": x[2]} for x in sat_xh],
                "san_chinh_tinh": san, "chinh_tinh_dac": any(m in ("M", "V", "Đ") for m in sang_chu),
                "chinh_tinh": chinh, "tuan_triet": tuan_triet, "nhan_dinh": nhan_dinh, "chi_tiet_diem": chi_tiet}

    # ---------- Thân
    def than(self):
        ten = self.ls["cung_chuc"][self.ls["than"]]
        k = self.cham_cung(ten)
        m = self.cham_cung("Mệnh")
        so = ("Hậu vận (sau ~30 tuổi) khá hơn tiền vận." if k["diem100"] - m["diem100"] >= 15 else
              "Hậu vận kém tiền vận, cần giữ những gì đã gây dựng." if m["diem100"] - k["diem100"] >= 15 else
              "Tiền vận và hậu vận tương đương.")
        return {"cu": ten, "chi": CHI[self.ls["than"]], "xep_loai": k["xep_loai"], "diem100": k["diem100"],
                "nhan_dinh": [{"id": f"THAN.{ten}", "diem": 0, "nhan_dinh": self.tt.cfg["than_cu"][ten], "ly_do": f"Thân cư {ten} tại {CHI[self.ls['than']]}"},
                              {"id": "THAN.so_menh", "diem": 0, "nhan_dinh": so,
                               "ly_do": f"Mệnh ~{m['diem100']}/100, cung Thân cư ({ten}) ~{k['diem100']}/100"}]}

    # ---------- Lớp 4: hạn
    def sao_luu(self, nam_xem):
        """Sao lưu niên theo can/chi năm xem → {tên 'Lưu X': chi}."""
        can_x, chi_x = (nam_xem - 4) % 10 + 1, (nam_xem - 4) % 12 + 1
        luu_ls = an_la_so(can_x, chi_x, 1, 1, 1, self.ls["input"]["gioi_tinh"])  # chỉ lấy sao theo can/chi năm
        luu = {f"Lưu {s}": luu_ls["sao"][s] for s in ("Thái Tuế", "Lộc Tồn", "Kình Dương", "Đà La", "Thiên Mã",
                                                        "Tang Môn", "Bạch Hổ", "Thiên Khốc", "Thiên Hư")}
        # Lưu Tứ Hóa: tên sao được hóa theo can năm xem, nhưng VỊ TRÍ là vị trí sao đó trên lá số gốc
        luu.update({f"Lưu {hoa}": self.ls["sao"][goc] for hoa, goc in luu_ls["tu_hoa"].items()})
        return luu, luu_ls["tu_hoa"]

    def tu_hoa_dai_han(self, chi_dh):
        """Tứ Hóa đại hạn: lấy can của cung đại hạn (ngũ hổ độn) → 4 sao hóa, vị trí trên lá số gốc."""
        can_nam = CAN.index(self.ls["input"]["can_nam"])
        can_dh = can_cung(can_nam, chi_dh)
        bang = an_la_so(can_dh, 1 if can_dh % 2 else 2, 1, 1, 1, "nam", self.ls["input"]["profile"])["tu_hoa"]
        return CAN[can_dh], {f"ĐH {hoa}": self.ls["sao"][goc] for hoa, goc in bang.items()}, bang

    def ket_luan_han(self, nam_xem, luu, vung_tt, dh, them):
        """Kết luận hành động của năm: trọng tâm rủi ro → nên/tránh theo cung bị lưu sát chiếu, và mặt thuận. Chỉ dùng sao thật của năm xem."""
        hc = self.tt.cfg["han"]
        kn, cung_goc = hc["khuyen_nghi"], self.ls["cung_chuc"]
        ket = []
        # (1) cung gốc bị lưu sát chiếu (tam phương cung Thái Tuế)
        bi = {}
        for k, nghia in hc["luu_sat"].items():
            if luu[k] in vung_tt:
                bi.setdefault(cung_goc[luu[k]], []).append((k, luu[k], nghia))
            elif cung_goc[luu[k]] in hc["trong_yeu"]:      # lớp 2: ngoài tam phương nhưng rơi vào cung trọng yếu
                bi.setdefault(cung_goc[luu[k]], []).append((k, luu[k], f"{nghia}; ngoài tam phương lưu niên nhưng là cung trọng yếu"))
        if bi:
            ds = "; ".join(f"{c} ({CHI[ds_[0][1]]}): " + ", ".join(f"{k} ({n})" for k, _, n in ds_) for c, ds_ in bi.items())
            bo_3 = {"Mệnh", "Tài Bạch", "Quan Lộc"} <= set(bi)
            ket.append({"id": "HAN.rui_ro", "diem": -1, "ly_do": "Lưu sát tinh rơi vào tam phương cung Thái Tuế",
                        "nhan_dinh": f"Trọng tâm rủi ro năm {nam_xem}: " + ("bộ Mệnh – Tài Bạch – Quan Lộc đồng thời bị lưu sát chiếu — " if bo_3 else "") + ds + "."})
            # (2) nên/tránh: cung bị nhiều lưu sát nhất trước, tối đa 4 câu
            for c, ds_ in sorted(bi.items(), key=lambda kv: (-len(kv[1]), THU_TU_CUNG.index(kv[0])))[:4]:
                if c in kn:
                    ket.append({"id": f"HAN.nen_tranh.{c}", "diem": 0, "ly_do": f"{', '.join(k for k, _, _ in ds_)} vào {c} gốc",
                                "nhan_dinh": f"Về {kn[c]['muc']}: nên {kn[c]['nen']}; tránh {kn[c]['tranh']}."})
        # (3) mặt thuận: Hóa Lộc/Quyền/Khoa đại hạn và lưu cát tinh của năm
        thuan = []
        if dh is not None:
            for t in ("ĐH Hóa Lộc", "ĐH Hóa Quyền", "ĐH Hóa Khoa"):
                thuan += [(t, c) for c, ds_ in sorted(them.items()) if t in ds_]
            for t in ("Hóa Lộc", "Hóa Quyền", "Hóa Khoa"):
                if t in self.cung[dh]:
                    thuan.append((f"{t} gốc tại cung đại hạn", dh))
        for k in hc["luu_cat"]:
            if luu[k] in vung_tt:
                thuan.append((k, luu[k]))
        if thuan:
            muc = list(dict.fromkeys(kn[cung_goc[c]]["muc"] for _, c in thuan if cung_goc[c] in kn))[:2]
            ket.append({"id": "HAN.mat_thuan", "diem": 1, "ly_do": "Hóa Lộc/Quyền/Khoa đại hạn hoặc lưu cát tinh của năm",
                        "nhan_dinh": "Mặt thuận: " + "; ".join(f"{t} ở {CHI[c]} ({cung_goc[c]} gốc)" for t, c in thuan)
                                     + f" → tận dụng cho {', '.join(muc)} theo hướng {hc['tan_dung']}."})
        return ket

    def han(self, nam_sinh, nam_xem, thang_xem=True):
        tuoi = nam_xem - nam_sinh + 1
        cfg = self.tt.cfg
        ket = {"tuoi_am": tuoi, "dai_han": None, "tieu_han": None, "luu_nien": None, "luu_nguyet": []}
        dh = next((c for c, t in sorted(self.ls["dai_han"].items(), key=lambda kv: kv[1]) if t <= tuoi < t + 10), None)
        luu, luu_hoa = self.sao_luu(nam_xem)
        them = {}
        if dh:
            can_dh, hoa_dh, bang_dh = self.tu_hoa_dai_han(dh)
            if cfg["han"]["tu_hoa_dai_han"]:
                for ten, c in hoa_dh.items():
                    them.setdefault(c, []).append(ten)
            lg_dh = LuanGiai(self.ls, self.tt, them)
            # 12 cung của đại hạn: cung đại hạn là Mệnh đại hạn, các cung khác xếp như lá số gốc
            cung_dh = {CUNG_CHUC[i]: mv(dh, i) for i in range(12)}
            danh_gia = {ten: lg_dh.cham_cung(ten, c) for ten, c in cung_dh.items() if ten in ("Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê", "Tật Ách")}
            ket["dai_han"] = {"chi": CHI[dh], "cung_goc": self.ls["cung_chuc"][dh], "tu_tuoi": self.ls["dai_han"][dh],
                              "can": can_dh, "tu_hoa": {k: f"{v} tại {CHI[self.ls['sao'][v]]} ({self.ls['cung_chuc'][self.ls['sao'][v]]} gốc)" for k, v in bang_dh.items()},
                              "danh_gia": {k: {"chi": v["chi"], "xep_loai": v["xep_loai"], "diem": v["diem"],
                                               "noi_bat": sorted(v["nhan_dinh"], key=lambda n: -abs(n["diem"]))[:3]} for k, v in danh_gia.items()}}
        # tiểu hạn: khởi theo tam hợp chi năm sinh, nam thuận nữ nghịch
        chieu = 1 if self.ls["input"]["gioi_tinh"] == "nam" else -1
        th = mv(self.ls["tieu_han_khoi"], (tuoi - 1) * chieu)
        # lưu niên: chồng sao lưu + Tứ Hóa đại hạn lên lá số
        for ten, c in luu.items():
            them.setdefault(c, []).append(ten)
        lg_luu = LuanGiai(self.ls, self.tt, them)
        tt_chi = luu["Lưu Thái Tuế"]
        k_tt = lg_luu.cham_cung("Mệnh", tt_chi)
        k_th = lg_luu.cham_cung("Mệnh", th)
        ket["tieu_han"] = {"chi": CHI[th], "cung_goc": self.ls["cung_chuc"][th], "xep_loai": k_th["xep_loai"], "diem": k_th["diem"]}
        canh_bao = []
        vung_tt = set(self.vung(tt_chi, "tam_phuong"))
        for k in ("Lưu Kình Dương", "Lưu Đà La", "Lưu Hóa Kỵ", "Lưu Tang Môn", "Lưu Bạch Hổ"):
            if luu[k] in vung_tt:
                canh_bao.append({"id": f"LN.{k}", "nhan_dinh": f"{k} vào tam phương cung lưu niên ({CHI[luu[k]]} – {self.ls['cung_chuc'][luu[k]]} gốc)", "diem": -1})
        for k in ("Lưu Hóa Lộc", "Lưu Lộc Tồn"):
            if luu[k] in vung_tt:
                canh_bao.append({"id": f"LN.{k}", "nhan_dinh": f"{k} vào tam phương cung lưu niên → năm có cơ hội tài lộc", "diem": 1})
        # lớp 2: lưu sát tinh/Kỵ rơi NGOÀI tam phương lưu niên nhưng vào cung trọng yếu vẫn phải nêu
        for k in cfg["han"]["luu_sat"]:
            c = self.ls["cung_chuc"][luu[k]]
            if luu[k] not in vung_tt and c in cfg["han"]["trong_yeu"]:
                canh_bao.append({"id": f"LN2.{k}", "nhan_dinh": f"{k} rơi vào {c} gốc ({CHI[luu[k]]}) — ngoài tam phương lưu niên nhưng là cung trọng yếu", "diem": -1})
        if dh and luu["Lưu Hóa Kỵ"] == them_vi_tri(them, "ĐH Hóa Kỵ"):
            canh_bao.append({"id": "LN.song_ky", "nhan_dinh": f"Lưu Hóa Kỵ trùng Hóa Kỵ đại hạn tại {CHI[luu['Lưu Hóa Kỵ']]} ({self.ls['cung_chuc'][luu['Lưu Hóa Kỵ']]}): năm cần thận trọng việc thuộc cung này", "diem": -2})
        ket["luu_nien"] = {"thai_tue_tai": f"{CHI[tt_chi]} ({self.ls['cung_chuc'][tt_chi]})", "xep_loai": k_tt["xep_loai"], "diem": k_tt["diem"],
                           "tu_hoa": {k: f"{v} tại {CHI[self.ls['sao'][v]]}" for k, v in luu_hoa.items()},
                           "sao_luu": {k: f"{CHI[v]} ({self.ls['cung_chuc'][v]})" for k, v in luu.items()}, "ghi_chu": canh_bao,
                           "ket_luan": self.ket_luan_han(nam_xem, luu, vung_tt, dh, them)}
        # lưu nguyệt: Đẩu Quân năm xem = từ cung gốc (tiểu hạn hoặc Thái Tuế, theo profile) đếm nghịch tháng sinh, thuận giờ sinh; tháng Giêng tại đó
        if thang_xem:
            goc = th if self.ls["input"]["profile"].get("luu_nguyet", "tieu_han") == "tieu_han" else tt_chi
            dq = mv(goc, -(self.ls["input"]["thang"] - 1) + (CHI.index(self.ls["input"]["gio"]) - 1))
            thang = [(t, mv(dq, t - 1)) for t in range(1, 13)]
            diem_t = [(t, c, lg_luu.cham_cung("Mệnh", c)["diem"]) for t, c in thang]
            xep = sorted(diem_t, key=lambda x: x[2])
            hang = {t: i for i, (t, _, _) in enumerate(xep)}
            ket["luu_nguyet"] = [{"thang": t, "chi": CHI[c], "cung_goc": self.ls["cung_chuc"][c], "diem": round(d, 2),
                                  "nhan_xet": "tốt nhất năm" if hang[t] >= 10 else "cần thận trọng" if hang[t] <= 1 else ""}
                                 for t, c, d in diem_t]
        return ket

    # ---------- tổng hợp theo chủ đề
    def gan_nguon(self, n, c):
        """Sao mượn từ cung xung chiếu (cung vô chính diệu) phải ghi rõ nguồn: '<Sao> từ cung <Nguồn> (<chi>) xung chiếu <Cung> (<chi>) → ...'."""
        if n["quan_he"] == "ban_cung":
            return n
        sao = " + ".join(n.get("nhan") or [])
        return dict(n, nhan_dinh=f"{sao} từ cung {n['cung_nguon']} ({n['chi_nguon']}) xung chiếu {c} ({CHI[self.chi_cua[c]]}) → {n['nhan_dinh']}")

    def gian_tiep(self, cd, cung_chu, k):
        """Sát tinh ở cung xung/hội chiếu cung chủ → nhận định gián tiếp, ghi rõ cung nguồn và quan hệ (không bao giờ nói như sao nằm tại cung chủ)."""
        nhom = {}
        for x in k["sat_xh"]:
            nhom.setdefault((x["cung"], x["chi"], x["quan_he"]), []).append(x["sao"])
        ket = []
        for (nguon, chi_nguon, rel), saos in nhom.items():
            ht = cd.get("gian_tiep", {}).get(nguon)
            if ht:
                saos = list(dict.fromkeys(saos))
                ket.append({"id": f"XC.{nguon}", "diem": -1.0, "cung": cung_chu, "nhan": saos, "cung_nguon": nguon, "chi_nguon": chi_nguon, "quan_he": rel,
                            "nhan_dinh": f"{' + '.join(saos)} từ cung {nguon} ({chi_nguon}) {'xung' if rel == 'xung' else 'hội'} chiếu {cung_chu} ({k['chi']}) → {ht}.",
                            "ly_do": f"Sát tinh ở {nguon} ({chi_nguon}) nằm ở {'xung chiếu' if rel == 'xung' else 'tam hợp'} của {cung_chu}"})
        return ket

    def chu_de(self, cham=None):
        cfg = self.tt.cfg["chu_de"]
        dn = self.tt.cfg["diem_noi_tai"]
        hg = dn["hoa_giai"]
        cham = cham or {c: self.cham_cung(c) for c in CUNG_CHUC}
        ket = {}
        for ten, cd in cfg.items():
            if ten == "ghi_chu":
                continue
            tong_w = sum(cd["cung"].values())
            chinh_cung = max(cd["cung"].values())
            chu_ds = [c for c, w in cd["cung"].items() if w == chinh_cung]
            pv = sum(cham[c]["diem100"] * w for c, w in cd["cung"].items()) / tong_w
            ung_vien, luu_y = [], []
            for c, w in cd["cung"].items():
                for n in cham[c]["nhan_dinh"]:
                    if n.get("luu_y"):
                        if w >= chinh_cung:
                            luu_y.append(dict(n, cung=c))
                        continue
                    if not n["diem"] or n.get("dao_dau"):
                        continue
                    tag = set(n.get("linh_vuc", []))
                    if n["id"].startswith("PT."):
                        p, _ = self.phu(n["id"].split(".")[1])
                        tag = set(p["tag"]) if p else set()
                    # cung chính của chủ đề: lấy hết; cung phụ: chỉ lấy nhận định có lĩnh vực khớp chủ đề
                    if w < chinh_cung and not tag & set(cd["linh_vuc"]):
                        continue
                    if n["id"].startswith("CC") and cd["linh_vuc"] and not tag & set(cd["linh_vuc"]):
                        continue
                    ung_vien.append(self.gan_nguon(dict(n, cung=c), c))
            sang = [n for n in ung_vien if n["diem"] > 0]
            hung = [n for n in ung_vien if n["diem"] < 0]
            tot = sorted(sang, key=lambda n: -n["diem"])[:3]
            xau = sorted(hung, key=lambda n: n["diem"])[:3]
            gt = [x for c in chu_ds for x in self.gian_tiep(cd, c, cham[c])] if len(chu_ds) == 1 else []
            tot_hien, xau_hien = tot, xau
            if cd.get("tieu_muc"):       # chủ đề gộp nhiều cung: tách tiểu mục, mỗi câu mang nhãn cung nguồn
                tot_hien, xau_hien = [], []
                for c in chu_ds:
                    nhan_tm = cd["tieu_muc"][c]
                    cua_c = [n for n in ung_vien if n["cung"] == c]
                    tot_hien += [dict(n, nhan_dinh=f"{nhan_tm}: {n['nhan_dinh']}") for n in sorted([n for n in cua_c if n["diem"] > 0], key=lambda n: -n["diem"])[:2]]
                    xau_hien += [dict(n, nhan_dinh=f"{nhan_tm}: {n['nhan_dinh']}") for n in sorted([n for n in cua_c if n["diem"] < 0], key=lambda n: n["diem"])[:2]]
            # nhất quán điểm ↔ nội dung: nhiều điểm sáng hơn điểm hung + chính tinh đắc địa thì không được rơi xuống nhãn thấp
            if len(sang) > len(hung) and any(cham[c]["chinh_tinh_dac"] for c in chu_ds):
                pv = max(pv, dn["san_chu_de_dac"])
            # vừa tốt vừa hung rõ: kéo nhãn về vùng giữa (không lấy cực trị) và chèn câu dẫn hòa giải
            cau_dan = None
            if tot and xau and tot[0]["diem"] >= hg["nguong_diem_sang"] and xau[0]["diem"] <= hg["nguong_diem_hung"]:
                pv = min(max(pv, hg["san"]), hg["tran"])
                nhan = lambda n: (f"sát tinh {' + '.join(n['nhan'])} quanh {n['cung']}" if n["id"] == "PHI_TUYEN"
                                  else f"{' + '.join(n.get('nhan') or [n['id']])} tại {n['cung']}")
                cau_dan = f"Nền tảng có điểm sáng ({nhan(tot[0])}) nhưng cũng có hạn chế ({nhan(xau[0])}); hai mặt cùng tồn tại nên nhãn tổng nằm ở vùng giữa."
            d100 = diem_100(pv)
            ket[ten] = {"diem100": d100, "xep_loai": bac(d100, dn), "diem_manh": tot_hien, "diem_yeu": xau_hien + gt, "cau_dan": cau_dan, "luu_y": luu_y,
                        "cung": {c: cham[c]["xep_loai"] for c in cd["cung"]}}
        return ket


def them_vi_tri(them, ten):
    return next((c for c, ds in them.items() if ten in ds), None)


def quy_doi(diem, nguong):
    """Điểm cung → thang 1–99 (nội suy từ 4 ngưỡng 10/30/70/90 hiệu chỉnh trên mẫu lá số ngẫu nhiên).
    Đây là thang NỘI TẠI để so các cung của cùng một lá số — KHÔNG phải percentile so với dân số lá số thật."""
    if not nguong:
        return 50.0
    diem_moc = [(nguong["xau"], 10), (nguong["trung_binh"], 30), (nguong["tot"], 70), (nguong["rat_tot"], 90)]
    if diem <= diem_moc[0][0]:
        return max(1.0, 10 * (1 - (diem_moc[0][0] - diem) / max(1e-9, diem_moc[1][0] - diem_moc[0][0])))
    if diem >= diem_moc[-1][0]:
        return min(99.0, 90 + 10 * (diem - diem_moc[-1][0]) / max(1e-9, diem_moc[-1][0] - diem_moc[-2][0]))
    for (x0, p0), (x1, p1) in zip(diem_moc, diem_moc[1:]):
        if x0 <= diem <= x1:
            return p0 + (p1 - p0) * (diem - x0) / max(1e-9, x1 - x0)
    return 50.0


def diem_100(x):
    """Làm tròn bội số 5 (tránh ảo giác chính xác của số lẻ), kẹp 5–95."""
    return int(min(95, max(5, math.floor(x / 5 + 0.5) * 5)))


def bac(d100, dn):
    """6 bậc: Rất thấp / Thấp / Trung bình / Khá / Tốt / Rất tốt (ngưỡng trong cau_hinh_luan_giai.json → diem_noi_tai.bac)."""
    for han, ten in dn["bac"]:
        if d100 < han:
            return ten
    return dn["bac"][-1][1]


THU_TU_CUNG = ["Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê", "Thiên Di", "Tật Ách", "Phúc Đức",
               "Điền Trạch", "Phụ Mẫu", "Tử Tức", "Huynh Đệ", "Nô Bộc"]


def bao_cao(lg, nam_sinh=None, nam_xem=None):
    """Toàn bộ kết quả luận dạng dict (đầu vào cho phần viết văn và web)."""
    cham = {c: lg.cham_cung(c) for c in CUNG_CHUC}
    kq = {"la_so": {k: lg.ls[k] for k in ("input", "am_duong_nam_nu", "ban_menh", "cuc")},
          "menh_tai": CHI[lg.ls["menh"]], "nen": lg.nen(), "than": lg.than(),
          "cung": {c: cham[c] for c in THU_TU_CUNG}, "chu_de": lg.chu_de(cham)}
    if nam_sinh and nam_xem:
        kq["han"] = dict(lg.han(nam_sinh, nam_xem), nam_xem=nam_xem)
    return kq


def in_bao_cao(lg, nam_sinh=None, nam_xem=None):
    kq = bao_cao(lg, nam_sinh, nam_xem)
    ls = lg.ls

    def dong(n):
        return f"- {n['nhan_dinh']}  `[{n['id']} {n['diem']:+}]` — _{n['ly_do']}_" if "ly_do" in n else f"- {n['nhan_dinh']}  `[{n['id']} {n['diem']:+}]`"

    out = ["# Luận giải (prototype)\n",
           f"{ls['input']['can_nam']} {ls['input']['chi_nam']} · tháng {ls['input']['thang']} · ngày {ls['input']['ngay']} · giờ {ls['input']['gio']} · {ls['am_duong_nam_nu']}",
           f"Bản Mệnh: {HANH_VN[ls['ban_menh']]} · Cục: {HANH_VN[ls['cuc']['hanh']]} {ls['cuc']['so']} · Mệnh tại {CHI[ls['menh']]} · Thân tại {CHI[ls['than']]} ({ls['cung_chuc'][ls['than']]})\n",
           "## Tổng hợp theo chủ đề", "", "| Chủ đề | Bậc | Điểm nội tại /100 | Cung xét |", "|---|---|---|---|"]
    for ten, cd in kq["chu_de"].items():
        out.append(f"| {ten} | {cd['xep_loai']} | {cd['diem100']} | {', '.join(f'{c}: {x}' for c, x in cd['cung'].items())} |")
    for ten, cd in kq["chu_de"].items():
        out.append(f"\n**{ten}**")
        out += [dong(n) for n in cd["diem_manh"] + cd["diem_yeu"]]
    out.append("\n## Nền")
    out += [dong(n) for n in kq["nen"]]
    t = kq["than"]
    out.append(f"\n## Thân cư {t['cu']} ({t['chi']}) — {t['xep_loai']}")
    out += [dong(n) for n in t["nhan_dinh"]]
    for ten, k in kq["cung"].items():
        out.append(f"\n## {ten} ({k['chi']}) — {k['xep_loai']} (điểm cung {k['diem']}, ~{k['diem100']}/100)")
        out += [dong(n) for n in k["nhan_dinh"]]
    if "han" in kq:
        h = kq["han"]
        out.append(f"\n## Hạn năm {h['nam_xem']} (tuổi âm {h['tuoi_am']})")
        if h["dai_han"]:
            d = h["dai_han"]
            out.append(f"\n### Đại hạn {d['tu_tuoi']}–{d['tu_tuoi'] + 9} tuổi tại {d['chi']} (cung {d['cung_goc']} gốc), can {d['can']}")
            out.append("Tứ Hóa đại hạn: " + "; ".join(f"{k} → {v}" for k, v in d["tu_hoa"].items()))
            for ten, v in d["danh_gia"].items():
                out.append(f"- **{ten} đại hạn** ({v['chi']}): {v['xep_loai']} (điểm {v['diem']})")
                out += ["  " + dong(n) for n in v["noi_bat"]]
        th, ln = h["tieu_han"], h["luu_nien"]
        out.append(f"\n### Tiểu hạn tại {th['chi']} ({th['cung_goc']} gốc) — {th['xep_loai']}")
        out.append(f"\n### Lưu niên: Thái Tuế tại {ln['thai_tue_tai']} — {ln['xep_loai']}")
        out.append("Tứ Hóa năm: " + "; ".join(f"{k} → {v}" for k, v in ln["tu_hoa"].items()))
        out += [dong(n) for n in ln["ghi_chu"]]
        if h["luu_nguyet"]:
            out += ["\n### Lưu nguyệt", "", "| Tháng âm | Cung | Điểm | |", "|---|---|---|---|"]
            out += [f"| {m['thang']} | {m['chi']} ({m['cung_goc']}) | {m['diem']} | {m['nhan_xet']} |" for m in h["luu_nguyet"]]
    return "\n".join(out)


if __name__ == "__main__":
    # Demo: người sinh năm 1990 (Canh Ngọ), tháng 5 âm, ngày 15, giờ Thìn, nam — xem năm 2026
    ls = an_la_so(7, 7, 5, 15, 5, "nam")
    print(in_bao_cao(LuanGiai(ls), 1990, 2026))
