"""Bộ luận giải prototype: lá số (từ an_sao.py) → điểm từng cung + các nhận định khớp, mỗi nhận định kèm lý do.

Quy trình theo docs/06-phuong-phap-luan-giai.md. Tham số trong data/knowledge/cau_hinh_luan_giai.json.
Chạy demo: python3 tools/tuvi/luan_giai.py
"""
import json
import math
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tuvi.an_sao import CAN, CHI, CUNG_CHUC, an_la_so, can_cung, mv, theo_cung  # noqa: E402

KB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "knowledge")
CHINH_TINH = ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ",
              "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"]
SINH = {"Moc": "Hoa", "Hoa": "Tho", "Tho": "Kim", "Kim": "Thuy", "Thuy": "Moc"}
KHAC = {"Moc": "Tho", "Tho": "Thuy", "Thuy": "Hoa", "Hoa": "Kim", "Kim": "Moc"}
HANH_VN = {"Kim": "Kim", "Moc": "Mộc", "Thuy": "Thủy", "Hoa": "Hỏa", "Tho": "Thổ"}   # tên hành để HIỂN THỊ (mã nội bộ không dấu)


def chon_gioi(txt, gioi):
    """Câu có nhánh "Nếu bạn là nam/nữ, ..." (ngăn bằng "; ") → chỉ giữ nhánh đúng giới tính."""
    if not re.search(r"(?i)nếu bạn là (nam|nữ),", txt):
        return txt
    kq = []
    for mau in txt.split("; "):
        m = re.match(r"(?i)nếu bạn là (nam|nữ), (.*)$", mau)
        if m is None:
            kq.append(mau)
        elif (m.group(1).lower() == "nam") == (gioi == "nam"):
            kq.append(m.group(2))
    ket = "; ".join(kq)
    return (ket[:1].upper() + ket[1:]) if ket else ket


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
        self.lien_cung = nap("luan_lien_cung.json")    # doc11 lô B: Tuần/Triệt theo cung, sao → người, so cung với cung
        self.truc = nap("truc_luan.json")["truc"]    # trục luận từng cung (tools/sinh_truc_luan.py): phát hiện câu nói ngược nhau
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
        # điều kiện xuyên cung: đánh giá dk["dk"] tại cung chức khác (theo tên) của chính lá số này
        if "cung_chuc" in dk:
            return self.khop(dk["dk"], self.chi_cua[dk["cung_chuc"]])
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
        if "than_cu" in dk:
            return (self.ls["than"] == chi) == dk["than_cu"]
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

    def cau_tuan_triet(self, ten_cung, tuan_triet, ngan=False):
        """Câu Tuần/Triệt gắn đúng cung bị án (Triệt cắt mạnh nửa đầu đời, Tuần cản chậm; cả hai thì nói cả hai). Bản đầy đủ nói một lần ở phần Nền; các mục khác dùng bản ngắn."""
        m = self.tt.cfg["tuan_triet"]["mau_ngan" if ngan else "mau"]
        return m["ca_hai" if len(tuan_triet) == 2 else tuan_triet[0]].format(cung=ten_cung)

    def cau_tuan_triet_cung(self, ten_cung, tuan_triet):
        rieng = self.tt.lien_cung["tuan_triet_theo_cung"].get(ten_cung, {}).get(tuan_triet[0]) if len(tuan_triet) == 1 else None
        return rieng or self.cau_tuan_triet(ten_cung, tuan_triet, ngan=True)

    def vai_nguoi(self, ten_cung):
        """Bảng vai_nguoi (luan_lien_cung.json): tối đa 2 câu mỗi cung (mặt thuận, mặt khó), mỗi câu gộp mọi sao ứng với người của cung này; chỉ khi cung của sao khác cung này."""
        bang = self.tt.lien_cung["vai_nguoi"]
        ket = []
        for nhom_ten, nhom in bang["nhom"].items():
            theo_sao = {}
            for sao, vais in bang["sao"].items():
                chi_sao = self.ls["sao"].get(sao)
                if chi_sao is None or self.ls["cung_chuc"][chi_sao] == ten_cung:
                    continue
                vai_cung = [vai for vai, cung in vais if cung == ten_cung]
                if not vai_cung:
                    continue
                muc = self.tt.sang(sao, chi_sao)
                tt = [bang["tinh_trang"][k]["ngan"] for k in nhom["gom"]
                      if (self.goc_hoa.get(bang["tinh_trang"][k]["hoa"]) == sao if "hoa" in bang["tinh_trang"][k] else muc is not None and muc in bang["tinh_trang"][k]["sang"])]
                if tt:
                    theo_sao[sao] = (self.ls["cung_chuc"][chi_sao], tt, vai_cung)
            if not theo_sao:
                continue
            ds = list(theo_sao.items())
            toi_da = bang["toi_da_sao"]
            ds_sao = ", ".join(f"{sao} ({', '.join(x[1])}, ở {x[0]})" for sao, x in ds[:toi_da]) + (f" và {len(ds) - toi_da} sao khác" if len(ds) > toi_da else "")
            ds_vai = ", ".join(dict.fromkeys(v for _, x in ds for v in x[2]))
            ket.append({"id": f"LC.vai.{nhom_ten}", "diem": 0, "luu_y": True, "ly_do": f"{', '.join(sao for sao, _ in ds)} ứng với {ds_vai}",
                        "nhan_dinh": bang["mau_nhom"].replace("{ds_sao}", ds_sao).replace("{ds_vai}", ds_vai).replace("{ket}", nhom["ket"]),
                        **self.nguon(self.chi_cua[ten_cung], "ban_cung", [sao for sao, _ in ds])})   # sao nằm ở cung khác: nguồn ghi ở chính cung vai, câu tự nêu rõ sao và cung của nó
        return ket

    @staticmethod
    def trong_pham_vi(pv, ten_cung):
        """pham_vi của cách: tên cung, danh sách tên cung, hoặc "*" (mọi cung). Mặc định Mệnh."""
        return any(x in ("*", ten_cung) for x in (pv if isinstance(pv, list) else [pv or "Mệnh"]))

    def loc_mien(self, txt, ten_cung):
        """Bỏ mệnh đề nói về lĩnh vực không thuộc cung (VD 'tình cảm rắc rối' ở Phụ Mẫu). Áp cho câu tổ hợp Tứ Hóa / fallback chung, không áp cho câu riêng (sao × cung)."""
        cfg = self.tt.cfg
        giu = [m for m in re.split(r"(?<=[.;])\s+", txt or "")
               if all(ten_cung in cfg["mien_cung"][k] for k, pat in cfg["mien_tu_khoa"].items() if not k.startswith("_") and re.search(pat, m.lower()))]
        out = " ".join(giu).rstrip(";").rstrip()
        return out if not out or out[-1] in ".!?" else out + "."

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

    @staticmethod
    def _la_cach(n):
        return re.fullmatch(r"CC\d+", n["id"]) is not None

    @staticmethod
    def _ten_nguon(n):
        """Tên hiển thị của nguồn câu: sao (PT.Hóa Lộc.Cung → Hóa Lộc) hoặc «tên cách cục»."""
        if re.fullmatch(r"CC\d+", n["id"]):
            m = re.match(r"\[(.+?)(?: — PHÁ CÁCH)?\]", n["nhan_dinh"])
            return f"«{m.group(1)}»" if m else n["id"]
        return n["id"].split(".")[1]

    @staticmethod
    def _gop_cung_y(ds, nhan, trich):
        """Gộp các câu cùng một kết luận: giữ câu có |điểm| lớn nhất (hòa thì câu đứng trước), các câu còn lại đánh dấu `an` và ghi vào ly_do của câu giữ lại. Điểm không đổi (câu `an` vẫn được đếm như XD.*)."""
        con = [n for n in ds if not n.get("an")]
        if len(con) < 2:
            return
        giu = con[0]
        for n in con[1:]:
            if abs(n["diem"]) > abs(giu["diem"]):
                giu = n
        bo = [n for n in con if n is not giu]
        for n in bo:
            n["an"] = True
        giu["ly_do"] = f"{giu.get('ly_do', '')}; gộp {len(bo)} câu cùng ý {nhan}: " + "; ".join(trich(n) for n in bo)

    @staticmethod
    def _rut_gon_gan_giong(nhan_dinh):
        """Lưới an toàn sau cùng: các câu có điểm, cùng chiều, nội dung gần như giống hệt (trùng từ ≥ 3/4) thì gộp như trên, kể cả khi không thuộc trục nào."""
        def tu(t):
            return set(re.findall(r"[^\W_]+", re.sub(r"\([^)]*\)", " ", re.sub(r"\[[^\]]*\]", " ", t)).lower()))
        ds = [n for n in nhan_dinh if not n.get("an") and n["diem"] != 0 and re.match(r"(CT|PT|CC|BO)", n["id"])]
        dau = {id(n): tu(n["nhan_dinh"]) for n in ds}
        xep = sorted(ds, key=lambda n: -abs(n["diem"]))          # sort ổn định: hòa giữ thứ tự gốc
        for giu in xep:
            if giu.get("an"):
                continue
            a = dau[id(giu)]
            bo = []
            for n in xep:
                if n is giu or n.get("an") or (n["diem"] > 0) != (giu["diem"] > 0):
                    continue
                b = dau[id(n)]
                chung = len(a & b)
                hop = len(a) + len(b) - chung
                if hop > 0 and chung * 4 >= hop * 3:
                    bo.append(n)
            if not bo:
                continue
            for n in bo:
                n["an"] = True
            giu["ly_do"] = f"{giu.get('ly_do', '')}; gộp {len(bo)} câu gần như giống hệt: " + ", ".join(n["id"] for n in bo)

    def hoa_giai_truc(self, ten_cung, chi, nhan_dinh):
        """Các câu của MỘT cung nói ngược nhau về cùng một trục (VD số lượng anh chị em: Thiên Phủ báo đông, Vũ Khúc báo ít) không được
        để cạnh nhau như hai khẳng định riêng. Với mỗi trục có cả phía dương lẫn phía âm:
          · đúng MỘT phía có cách cục (đọc theo cụm sao) → cách cục thắng: ẩn các câu đơn lẻ của phía ngược lại, ghi vào ly_do của cách;
          · còn lại → ẩn các câu gốc và thêm MỘT câu 'trái chiều' (id XD.<cung>.<trục>, không tính điểm mạnh/yếu, xếp vào "lưu ý").
        Câu bị ẩn (`an`: True) vẫn nằm trong danh sách để điểm và phép đếm §4.8 không đổi."""
        for t in self.tt.truc.get(ten_cung, []):
            dp, am = [], []
            for n in nhan_dinh:
                if not (n["id"].startswith(("CT.", "PT.")) or self._la_cach(n)):
                    continue
                if any(n["nhan_dinh"].startswith(c) for c in t["duong"]["cau"]):
                    dp.append(n)
                elif any(n["nhan_dinh"].startswith(c) for c in t["am"]["cau"]):
                    am.append(n)
            if not dp or not am:        # chỉ một phía: các câu CÙNG trục CÙNG phía là cùng một kết luận → giữ câu mạnh nhất, gộp phần còn lại
                phia = dp or am
                if len(phia) > 1:
                    self._gop_cung_y(phia, f"«{t['ten']}» ({t['duong']['nhan'] if dp else t['am']['nhan']})",
                                     lambda n: f"{self._ten_nguon(n)}: «{n['nhan_dinh'].split('. ')[0].rstrip('.')}»")
                continue
            cach_dp, cach_am = [n for n in dp if self._la_cach(n)], [n for n in am if self._la_cach(n)]
            if bool(cach_dp) != bool(cach_am):
                thang, thua = (cach_dp, am) if cach_dp else (cach_am, dp)
                thua = [n for n in thua if not self._la_cach(n)]
                for n in thua:
                    n["an"] = True
                for n in thang:
                    n["ly_do"] += f"; thay cho câu đơn lẻ nói ngược về «{t['ten']}»: " + "; ".join(f"{self._ten_nguon(x)}: «{x['nhan_dinh'].split('. ')[0].rstrip('.')}»" for x in thua)
                continue
            sao = lambda ds: ", ".join(dict.fromkeys(self._ten_nguon(n) for n in ds))
            for n in dp + am:
                n["an"] = True
            nhan_dinh.append({
                "id": f"XD.{ten_cung}.{t['id']}", "diem": 0.0, "luu_y": True,
                "nhan_dinh": (t["xd"].replace("{duong}", t["duong"]["nhan"]).replace("{sao_duong}", sao(dp)).replace("{am}", t["am"]["nhan"]).replace("{sao_am}", sao(am)) if t.get("xd")
                              else f"{t['ten']}: các sao tác động lên cung này nói ngược nhau — {t['duong']['nhan']} ({sao(dp)}) và {t['am']['nhan']} ({sao(am)}); nên không kết luận chắc về mục này."),
                "ly_do": "Câu gốc được gộp: " + "; ".join(f"{self._ten_nguon(n)}: «{n['nhan_dinh'].split('. ')[0].rstrip('.')}»" for n in dp + am),
                **self.nguon(chi, "ban_cung", list(dict.fromkeys(self._ten_nguon(n) for n in dp + am)))})

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

    # ---------- Công thức điểm một cung (spec scoring v3 §4)
    def diem_v3(self, chi, chu, chi_chu, muon, tuan_triet, cach_adj):
        """score = START + BASE_CHINH_TINH(chỉ bản cung) + CAT − SAT (+ điều chỉnh cách cục) → NÉN Tuần/Triệt về START → sàn chính tinh miếu/vượng → kẹp + làm tròn.
        Trả về toàn bộ khoản (§4.9) để truy ngược điểm."""
        cfg = self.tt.cfg
        v = cfg["diem_v3"]
        sat7, ban_sat = set(cfg["sat_tinh"]["sat"]), set(cfg["sat_tinh"]["ban_sat"])
        cat_set, hoa_cat = set(self.tt.nhom["cat_tinh"]), ("Hóa Lộc", "Hóa Quyền", "Hóa Khoa")
        # chính tinh đang mang Hóa Lộc/Quyền/Khoa: hãm cũng không bị trừ (§15.3)
        mang_hoa_cat = {self.goc_hoa.get(h) for h in hoa_cat}
        vung = [(c, "ban_cung" if c == chi else "xung" if c == mv(chi, 6) else "tam_hop") for c in self.vung(chi, "tam_phuong")]

        base = []
        for s in chu:
            m = self.tt.sang(s, chi_chu) or "khong_ro"
            cuu = m == "H" and s in mang_hoa_cat
            base.append({"sao": s, "do_sang": m, "diem": 0 if cuu else v["base"][m], "hoa_cuu": cuu})
        tong_base = min(max(sum(b["diem"] for b in base), v["base_cap"][0]), v["base_cap"][1]) * (cfg["vo_chinh_dieu"]["he_so"] if muon else 1.0)

        cat, sat, cat_xh_goc = [], [], []
        for c, o in vung:
            for s in self.cung[c]:
                if s in CHINH_TINH:
                    continue
                p, hl = self.phu(s)
                if not p:
                    continue
                if p["ten"] in cat_set:
                    x = v["cat"][o] * (v["cat_hoa_nhan"] if p["ten"] in hoa_cat else 1.0) * (v["cat_ham_he_so"] if self.tt.sang(p["ten"], c) == "H" else 1.0) * hl
                    cat.append({"sao": s, "cung": CHI[c], "vi_tri": o, "diem": round(x, 2)})
                    if o != "ban_cung":
                        cat_xh_goc.append((p["ten"], c, o, x))
                elif p["ten"] in sat7 or p["ten"] in ban_sat:
                    x = v["sat"][o] * (v["sat_ban_sat_he_so"] if p["ten"] in ban_sat else 1.0)
                    x *= v["sat_dac"] if CHI[c] in p.get("dac_dia", []) else v["sat_ham"] if self.tt.sang(p["ten"], c) == "H" else 1.0
                    sat.append({"sao": s, "cung": CHI[c], "vi_tri": o, "diem": round(x * hl, 2)})
        tong_cat = min(sum(x["diem"] for x in cat), v["cat_cap"])
        tong_sat = max(sum(x["diem"] for x in sat), v["sat_cap"])
        cach_adj = max(-v["cach_cuc"]["cap"], min(v["cach_cuc"]["cap"], cach_adj * v["cach_cuc"]["he_so"]))

        raw = v["start"] + tong_base + tong_cat + tong_sat + cach_adj
        k = 1.0
        if "Triệt" in tuan_triet:
            k *= v["nen"]["Triệt"]
        if "Tuần" in tuan_triet:
            k *= v["nen"]["Tuần"]
        raw2 = v["start"] + (raw - v["start"]) * k          # NÉN về giữa: cung tốt bị Triệt hạ xuống, cung xấu bị Triệt nâng lên
        n_mv = 0 if muon else sum(1 for b in base if b["do_sang"] in ("M", "V"))
        san = v["san"]["n2"] if n_mv >= 2 else v["san"]["n1"] if n_mv == 1 else 0
        if san:
            san -= (v["san"]["tru_triet"] if "Triệt" in tuan_triet else 0) + (v["san"]["tru_tuan"] if "Tuần" in tuan_triet else 0)
        score = max(raw2, san) if san else raw2
        d100 = diem_100(score, v["kep"])
        pt = {"cung_chu": CHI[chi], "tap_ban_cung": list(self.cung[chi]), "tap_xung": list(self.cung[mv(chi, 6)]),
              "tap_tam_hop": [s for c in (mv(chi, 4), mv(chi, -4)) for s in self.cung[c]],
              "base": base, "tong_base": round(tong_base, 2), "vo_chinh_dieu": muon, "cat": cat, "tong_cat": round(tong_cat, 2), "sat": sat, "tong_sat": round(tong_sat, 2),
              "cach_cuc": round(cach_adj, 2), "raw_truoc_triet": round(raw, 2), "k_triet_tuan": round(k, 3), "raw_sau_triet": round(raw2, 2),
              "n_chinh_tinh_mv": n_mv, "san_ap_dung": san, "score_cuoi": d100}
        return d100, raw2, pt, cat_xh_goc, sat

    # ---------- Lớp 2-3: chấm 1 cung
    def cham_cung(self, ten_cung, chi=None):
        """Chấm cung chức `ten_cung` (mặc định tại vị trí của nó trên lá số gốc; truyền chi để chấm cung đại hạn/lưu niên).
        Điểm do diem_v3 quyết định; phần dưới tạo CÂU luận (mỗi câu mang 'diem' để xếp điểm sáng/hạn chế, không cộng thành điểm cung)."""
        chi_truyen = chi
        chi = chi or self.chi_cua[ten_cung]
        cfg = self.tt.cfg
        bo_qua_nho = set(cfg["sao_nho"]["bo_qua"])
        w = dict(cfg["trong_so_vi_tri"], xung=cfg["trong_so_vi_tri"]["xung_chieu"])
        hs = cfg["he_so_do_sang"]
        pt = cfg["phi_tuyen"]
        sat_set = set(cfg["sat_tinh"]["sat"]) | set(cfg["sat_tinh"]["ban_sat"])
        nhan_dinh, chi_tiet = [], []
        sat_ban, sat_xh = [], []     # sát tinh thật sự gây hại (sát đắc địa không tính), tách theo vị trí — nguồn của câu cảnh báo

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
        mang_hoa_cat = {self.goc_hoa.get(h) for h in ("Hóa Lộc", "Hóa Quyền", "Hóa Khoa")}

        # chính tinh chủ
        for s in chu:
            muc = self.tt.sang(s, chi_chu) or "khong_ro"
            hop, txt_sang, txt_ham = self.tt.ma_tran[s][ten_cung]
            cuu = muc == "H" and s in mang_hoa_cat       # hãm nhưng đang mang Hóa cát: không xếp vào hạn chế (§15.3)
            # điểm CÂU: hãm luôn âm (độ lớn tăng theo mức cung chức 'gọi' sao ra); hãm mang Hóa cát = trung tính
            d = 0.0 if cuu else (hs[muc] * (1 + abs(hop)) if muc == "H" else hs[muc] * (1 + hop)) * he_so_vcd * cfg["he_so_chinh_tinh_chu"]
            chi_tiet.append((s, CHI[chi_chu], muc, round(d, 2)))
            nhan_dinh.append({"id": f"CT.{s}.{ten_cung}", "diem": round(d, 2),
                              "nhan_dinh": txt_ham if muc in ("H",) else txt_sang,
                              "ly_do": f"{s} ({muc}) tại {CHI[chi_chu]}, hợp cung {hop:+d}" + (f", gặp {'/'.join(tuan_triet)}" if tuan_triet else "")
                                       + ("; hãm nhưng đang mang Hóa cát nên không tính là hạn chế" if cuu else "")
                                       + (f"; mượn từ cung {self.ls['cung_chuc'][chi_chu]} xung chiếu" if muon else ""),
                              **self.nguon(chi_chu, "xung" if muon else "ban_cung", [s])})

        # bộ sao tại chi (chỉ luận chi tiết cho Mệnh)
        if ten_cung == "Mệnh" and chu:
            for bo in self.tt.bo_sao["bo_sao"]:
                if sorted(bo["bo"]) == sorted(chu) and CHI[chi_chu] in bo["chi"]:
                    dc = bo.get("dieu_chinh", {}).get(CHI[chi_chu], 0)
                    txt = bo["chung"] + (" " + bo["theo_chi"][CHI[chi_chu]] if CHI[chi_chu] in bo["theo_chi"] else "")
                    nhan_dinh.append({"id": f"BO.{'+'.join(bo['bo'])}.{CHI[chi_chu]}", "diem": dc, "nhan_dinh": txt,
                                      "ly_do": f"Bộ {' + '.join(bo['bo'])} tại {CHI[chi_chu]}",
                                      **self.nguon(chi_chu, "xung" if muon else "ban_cung", list(bo["bo"]))})

        # phụ tinh trong tam phương (điểm CÂU)
        vung_tp = {c: ("ban_cung" if c == chi else "xung" if c == mv(chi, 6) else "tam_hop") for c in self.vung(chi, "tam_phuong")}
        for c, o in vung_tp.items():
            for s in self.cung[c]:
                if s in CHINH_TINH:
                    continue
                p, he_so_luu = self.phu(s)
                if not p:
                    continue
                base = cfg["diem_cham_rieng"].get(p["ten"], p["diem"]) * he_so_luu
                if c == chi:
                    base *= cfg["phan_cuc_rieng"].get(f"{p['ten']}|{ten_cung}", 1)     # câu riêng trung tính/hỗn hợp/ngược dấu thì điểm theo câu
                dac = CHI[c] in p.get("dac_dia", [])
                dao_dau = base < 0 and dac       # sát tinh đắc địa: giảm hại nhưng câu luận vẫn mô tả cả hai mặt
                ham = base > 0 and self.tt.sang(p["ten"], c) == "H"
                if base < 0 and dac:
                    base = base * 0.3
                elif ham:
                    base = base * 0.3             # cát tinh hãm địa (VD Xương Khúc): còn ít lực
                if abs(p["diem"]) <= 1:
                    base *= cfg["he_so_phu_tinh_nho"]
                wo = pt["trong_so"][o] if base < 0 and p["ten"] in pt["sao_pha"] else w[o]
                d = base * wo
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
                        hop = self.loc_mien(self.tt.tu_hoa.get(khoa), ten_cung)
                        txt = (txt + " " if txt else "") + (hop if hop else ("" if txt else self.loc_mien(p["y_nghia"], ten_cung)))
                    txt = (txt or self.loc_mien(p["y_nghia"], ten_cung) or f"{goc_ten} tại {ten_cung}: chưa có luận riêng cho cung này.").strip()
                    lon = abs(p["diem"]) >= 2 or goc_ten.startswith("Hóa") or he_so_luu != 1.0
                    if lon or goc_ten not in bo_qua_nho:    # phụ tinh ±1 cũng phải được luận (Thiên Mã, Thiên Khốc…): đánh dấu nho, không tính điểm mạnh/yếu
                        nd = {"id": f"PT.{s}" + (f".{ten_cung}" if goc_ten in self.tt.phu_cung else ""), "diem": round(d, 2),
                              "nhan_dinh": txt, "ly_do": f"{s} thủ {ten_cung} tại {CHI[c]}" + (" (đắc địa: giảm hại)" if dao_dau else " (đắc địa)" if dac else " (hãm địa — lực yếu)" if ham else ""),
                              **self.nguon(c, o, [s])}
                        if not lon:
                            nd["nho"] = True
                        if dao_dau:
                            nd["dao_dau"] = True
                        nhan_dinh.append(nd)

        # Tuần Triệt
        if tuan_triet:
            nhan_dinh.append({"id": "TT", "diem": 0, "luu_y": True, "ly_do": f"{'/'.join(tuan_triet)} tại {CHI[chi]}",
                              "nhan_dinh": self.cau_tuan_triet_cung(ten_cung, tuan_triet),
                              **self.nguon(chi, "ban_cung", list(tuan_triet))})
            # Hóa Lộc/Quyền/Khoa/Kỵ nằm cùng cung bị Tuần/Triệt: mỗi Hóa một câu (bảng tuan_triet_hoa, chạy cho mọi cung)
            for hoa, mau in self.tt.lien_cung["tuan_triet_hoa"].items():
                if hoa in self.cung[chi]:
                    nhan_dinh.append({"id": f"LC.tt_hoa.{hoa}", "diem": 0, "luu_y": True,
                                      "ly_do": f"{hoa} và {'/'.join(tuan_triet)} cùng ở {ten_cung} ({CHI[chi]})",
                                      "nhan_dinh": mau.replace("{tt}", "/".join(tuan_triet)).replace("{cung}", ten_cung),
                                      **self.nguon(chi, "ban_cung", [hoa, *tuan_triet])})
        # Sao → người: sao hãm hoặc mang Hóa Kỵ nói thêm ở cung của vai người đó (không áp cho cung đại hạn/lưu niên)
        if chi_truyen is None:
            nhan_dinh.extend(self.vai_nguoi(ten_cung))

        # Cung vô chính diệu (trừ Mệnh) mà còn bị Tuần/Triệt: điểm gần như chỉ dựa vào cát tinh chiếu từ cung khác → nói rõ độ vững thấp hơn con số
        if muon and tuan_triet and ten_cung != "Mệnh":
            nhan_dinh.append({"id": "VCD_TT", "diem": 0, "luu_y": True,
                              "nhan_dinh": f"{ten_cung} vừa vô chính diệu vừa bị {'/'.join(tuan_triet)}: điểm số dựa chủ yếu vào sao chiếu từ cung khác nên độ vững thấp hơn con số; đừng đọc điểm này như một nền vững.",
                              "ly_do": f"{ten_cung} tại {CHI[chi]} không có chính tinh và có {'/'.join(tuan_triet)}",
                              **self.nguon(chi, "ban_cung", ["vô chính diệu", *tuan_triet])})

        # Cách cục — tính hết rồi giảm dần: cách mạnh nhất tính đủ, các cách cùng dấu sau đó nhân hệ số giảm (tránh đếm đôi cùng một sao)
        cach = []
        for cc in self.tt.cach:
            if not self.trong_pham_vi(cc.get("pham_vi"), ten_cung) or not self.khop(cc["thanh"], chi):
                continue
            pha_chung = self.tt.pha_chung
            if "pha" in cc:
                bi_pha = self.khop(cc["pha"], chi)
                d = cc.get("diem_pha", cc["diem"]) if bi_pha else cc["diem"]
            elif cc.get("loai") == "cat" and self.khop(pha_chung["dieu_kien"], chi):
                bi_pha, d = True, round(cc["diem"] * pha_chung["he_so_diem"], 2)
            else:
                bi_pha, d = False, cc["diem"]
            cach.append((cc, bi_pha, d))
        gd = cfg["cach_cuc_giam_dan"]["he_so"]
        he = {}
        for ds in ([i for i, x in enumerate(cach) if x[2] > 0], [i for i, x in enumerate(cach) if x[2] < 0]):
            for r, i in enumerate(sorted(ds, key=lambda i: -abs(cach[i][2]))):
                he[i] = gd[min(r, len(gd) - 1)]
        cach_adj = 0.0
        for i, (cc, bi_pha, d) in enumerate(cach):
            d = round(d * he.get(i, 1.0), 2)
            def dien_cung(t):
                return t.replace("{cung_xung}", self.ls["cung_chuc"][mv(chi, 6)]).replace("{cung}", ten_cung)
            ket_luan = dien_cung(cc.get("ket_luan_theo_cung", {}).get(ten_cung, cc["ket_luan"]))
            cach_adj += d
            nhan_dinh.append({"id": cc["id"], "diem": d, "linh_vuc": cc.get("linh_vuc", []),
                              "nhan_dinh": f"[{cc['ten']}{' — PHÁ CÁCH' if bi_pha else ''}] "
                                           + ((dien_cung(cc["ket_luan_pha"]) if "ket_luan_pha" in cc
                                                  else "Gặp từ 2 sát tinh/Hóa Kỵ ở bản cung và xung chiếu: cách bị giảm nhiều. " + ket_luan)
                                                 if bi_pha else ket_luan),
                              "ly_do": "Thỏa điều kiện cách cục" + (" nhưng gặp điều kiện phá" if bi_pha else "")
                                       + ("" if cc.get("xac_nhan_web") else " (cách chưa xác nhận nguồn web)")
                                       + (f"; nhiều cách cùng dấu nên tính {he[i]:.0%}" if he.get(i, 1.0) < 1.0 else ""),
                              **self.nguon(chi, "ban_cung", [f"«{cc['ten']}»"])})

        # ĐIỂM (spec v3)
        d100, raw2, phan_tich, cat_xh, sat_v3 = self.diem_v3(chi, chu, chi_chu, muon, tuan_triet, cach_adj)

        # câu sát tinh quanh cung: chỉ khi THẬT SỰ có sát tinh (bản cung và/hoặc xung/hội chiếu); điểm câu = điểm sát v3 / 2.5 cho cùng thang với các câu khác
        thuc_sat = set(cfg["sat_tinh"]["sat"])
        tat_ca = [x[0] for x in sat_ban] + [x[0] for x in sat_xh]
        dung_sat = any(x in thuc_sat for x in tat_ca) or len(set(tat_ca)) >= 2     # một bán-sát lẻ (Thiên Hình/Thiên Diêu) không đủ để cảnh báo
        if dung_sat:
            nhan_dinh.append({"id": "PHI_TUYEN", "diem": round(phan_tich["tong_sat"] / 2.5, 2),
                              "nhan_dinh": self.cau_sat(ten_cung, sat_ban, sat_xh),
                              "ly_do": f"Tổng điểm sát tinh {phan_tich['tong_sat']:.1f} (bản cung −5 · xung −3 · tam hợp −2, nhân trạng thái)",
                              **self.nguon(chi, "ban_cung", list(dict.fromkeys([s for s, _ in sat_ban] + [x[0] for x in sat_xh])))})

        tong_cat_xh = sum(x[3] for x in cat_xh)
        if cat_xh and tong_cat_xh >= cfg["diem_noi_tai"]["nguong_cat_xung_hoi"]:
            nhom_c = {}
            for sao, c, o, _ in cat_xh:
                nhom_c.setdefault((c, o), []).append(sao)
            ds_c = "; ".join(f"{', '.join(dict.fromkeys(x))} ở {self.ls['cung_chuc'][c]} ({CHI[c]}), {'xung' if o == 'xung' else 'hội'} chiếu" for (c, o), x in nhom_c.items())
            nhan_dinh.append({"id": "CAT_XH", "diem": round(tong_cat_xh / 2.5, 2),
                              "nhan_dinh": f"Cát tinh từ xung/hội chiếu ({ds_c}) → cung {ten_cung} được nâng đỡ.",
                              "ly_do": f"Tổng điểm cát tinh xung/hội chiếu {tong_cat_xh:.1f}",
                              **self.nguon(chi, "ban_cung", list(dict.fromkeys(x[0] for x in cat_xh)))})

        self.hoa_giai_truc(ten_cung, chi, nhan_dinh)
        # mọi câu (bất kể nguồn: chính tinh, phụ tinh, bộ sao, cách cục) chỉ giữ nhánh đúng giới tính
        for n in nhan_dinh:
            n["nhan_dinh"] = chon_gioi(n["nhan_dinh"], self.ls["input"]["gioi_tinh"])
        self._rut_gon_gan_giong(nhan_dinh)          # kết luận gần tương đương trong cùng một cung thì rút gọn thành một
        sang_chu = [self.tt.sang(s, chi_chu) for s in chu]
        return {"cung": ten_cung, "chi": CHI[chi], "diem": round(raw2, 2), "diem100": d100, "xep_loai": bac(d100, cfg["diem_noi_tai"]),
                "sat_xh": [{"sao": x[0], "cung": self.ls["cung_chuc"][x[1]], "chi": CHI[x[1]], "quan_he": x[2]} for x in sat_xh] if dung_sat else [],
                "phan_tich": phan_tich, "chinh_tinh_sang": [[s, m] for s, m in zip(chu, sang_chu)],
                "muon_tu": [self.ls["cung_chuc"][chi_chu], CHI[chi_chu]] if muon else None, "chinh_tinh_dac": any(m in ("M", "V", "Đ") for m in sang_chu),
                "chinh_tinh": chinh, "tuan_triet": tuan_triet, "nhan_dinh": nhan_dinh, "chi_tiet_diem": chi_tiet}

    # ---------- Thân
    def than(self):
        ten = self.ls["cung_chuc"][self.ls["than"]]
        k = self.cham_cung(ten)
        m = self.cham_cung("Mệnh")
        gan = abs(k["diem100"] - m["diem100"]) < 15
        # Triệt mạnh nửa đầu đời, Tuần mạnh sau ~30 tuổi (cấu hình tuan_triet): điểm số hai cung không thấy được điều này nên phải nói thêm,
        # nếu không "tương đương" sẽ đá với câu "Triệt án Mệnh" ở mục Nền.
        tien_kem = "Triệt" in m["tuan_triet"]
        hau_kem = "Tuần" in m["tuan_triet"] or "Tuần" in k["tuan_triet"]
        them = (" Tuy vậy Mệnh bị Triệt án nên tiền vận (trước ~30 tuổi) nhiều cản trở, còn Tuần cũng cản hậu vận; cả hai giai đoạn đều cần kiên trì." if tien_kem and hau_kem else
                " Mệnh bị Triệt án nên tiền vận (trước ~30 tuổi) nhiều cản trở hơn; Triệt nhạt dần sau khoảng 30 tuổi." if tien_kem else
                " Tuần án (Mệnh/Thân) nên từ khoảng 30 tuổi trở đi có nhiều cản trở hơn tiền vận." if hau_kem else "")
        so = ("Hậu vận (sau ~30 tuổi) khá hơn tiền vận." if k["diem100"] - m["diem100"] >= 15 else
              "Hậu vận kém tiền vận, cần giữ những gì đã gây dựng." if m["diem100"] - k["diem100"] >= 15 else
              ("Điểm số hai giai đoạn gần nhau." if them else "Tiền vận và hậu vận tương đương.")) + them
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
                                               "noi_bat": sorted([n for n in v["nhan_dinh"] if not n.get("an") and not n.get("nho")], key=lambda n: -abs(n["diem"]))[:3]} for k, v in danh_gia.items()}}
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

    def khung_chu_de(self, cd, chu_ds, cham):
        """Câu 'cung chủ': mọi chính tinh của cung chủ kèm độ sáng (hoặc vô chính diệu + sao mượn). Luôn có, để người đọc thấy khung của cung kể cả khi chính tinh điểm 0."""
        ten_sang = {"M": "miếu", "V": "vượng", "Đ": "đắc", "B": "bình", "H": "hãm", None: "chưa rõ độ sáng"}
        out = []
        for c in chu_ds:
            k = cham[c]
            sao = " + ".join(f"{s} ({ten_sang.get(m, m)})" for s, m in k["chinh_tinh_sang"]) or "không có chính tinh"
            nhan_tm = cd.get("tieu_muc", {}).get(c)
            dau = f"{nhan_tm} — cung {c} ({k['chi']})" if nhan_tm else f"Cung chủ {c} ({k['chi']})"
            than_cu = " — cũng là cung Thân cư, hậu vận gắn chặt với mục này" if self.ls["cung_chuc"][self.ls["than"]] == c else ""
            out.append(f"{dau}: " + (f"vô chính diệu, mượn {sao} từ cung {k['muon_tu'][0]} ({k['muon_tu'][1]}) xung chiếu" if k["muon_tu"] else sao) + than_cu)
        return "; ".join(out) + "."

    def chu_de(self, cham=None):
        cfg = self.tt.cfg["chu_de"]
        dn = self.tt.cfg["diem_noi_tai"]
        cfg_nho = self.tt.cfg["sao_nho"]
        cham = cham or {c: self.cham_cung(c) for c in CUNG_CHUC}
        ket = {}
        for ten, cd in cfg.items():
            if ten == "ghi_chu":
                continue
            tong_w = sum(cd["cung"].values())
            chinh_cung = max(cd["cung"].values())
            chu_ds = [c for c, w in cd["cung"].items() if w == chinh_cung]
            pv = sum(cham[c]["diem100"] * w for c, w in cd["cung"].items()) / tong_w
            ung_vien, luu_y, trung_tinh, sao_nho = [], [], [], []
            for c, w in cd["cung"].items():
                nho_c = []
                for n in cham[c]["nhan_dinh"]:
                    if n.get("nho"):          # phụ tinh ±1: chỉ cung chủ, không vào điểm/đếm; xếp theo ưu tiên rồi cắt
                        if w >= chinh_cung and not n.get("an"):
                            nho_c.append(dict(n, cung=c))
                        continue
                    if n.get("luu_y"):
                        if w >= chinh_cung:
                            luu_y.append(dict(n, cung=c))
                        continue
                    if not n["diem"] and n["id"].startswith(("CT.", "PT.")) and w >= chinh_cung:
                        if not n.get("an"):          # câu đã gộp vào câu 'trái chiều' (XD.*) thì không nhắc lại
                            trung_tinh.append(self.gan_nguon(dict(n, cung=c), c))        # chính tinh/phụ tinh cung chủ có điểm đúng 0 vẫn phải được luận
                        continue
                    if not n["diem"]:
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
                uu = {t: i for i, t in enumerate(cfg_nho["uu_tien"])}
                nho_c.sort(key=lambda n: uu.get(n["id"].split(".")[1], len(uu)))       # sort ổn định: cùng ưu tiên giữ thứ tự gốc
                sao_nho += nho_c[:cfg_nho["toi_da_moi_cung"]]
            # cách cục của cung Mệnh vào mọi chủ đề có lĩnh vực trùng nhãn của cách (nghề/tài/danh/quyền…); chỉ thêm câu, điểm chủ đề vẫn theo trọng số cung
            if "Mệnh" not in cd["cung"] and cd["linh_vuc"]:
                for n in cham["Mệnh"]["nhan_dinh"]:
                    if n["id"].startswith("CC") and n["diem"] and not n.get("an") and set(n.get("linh_vuc", [])) & set(cd["linh_vuc"]):
                        ung_vien.append(dict(n, cung="Mệnh"))
            sang = [n for n in ung_vien if n["diem"] > 0]
            hung = [n for n in ung_vien if n["diem"] < 0]
            # ĐẾM (điểm, §4.8) dùng cả câu đã bị gộp; HIỂN THỊ chỉ dùng câu còn hiện (câu 'trái chiều' XD.* đã thay chỗ chúng)
            ung_vien = [n for n in ung_vien if not n.get("an")]
            tot = chon_top([n for n in sang if not n.get("an")], 3, 1)
            xau = chon_top([n for n in hung if not n.get("an")], 3, -1)
            gt = [x for c in chu_ds for x in self.gian_tiep(cd, c, cham[c])] if len(chu_ds) == 1 else []
            tot_hien, xau_hien = tot, xau
            if cd.get("tieu_muc"):       # chủ đề gộp nhiều cung: tách tiểu mục, mỗi câu mang nhãn cung nguồn
                tot_hien, xau_hien = [], []
                for c in chu_ds:
                    nhan_tm = cd["tieu_muc"][c]
                    cua_c = [n for n in ung_vien if n["cung"] == c]
                    tot_hien += [dict(n, nhan_dinh=f"{nhan_tm}: {n['nhan_dinh']}") for n in chon_top([n for n in cua_c if n["diem"] > 0], 2, 1)]
                    xau_hien += [dict(n, nhan_dinh=f"{nhan_tm}: {n['nhan_dinh']}") for n in chon_top([n for n in cua_c if n["diem"] < 0], 2, -1)]
            # §4.8 khớp điểm ↔ nội dung: sáng ≥ 2×hung và có chính tinh miếu/vượng (hoặc không có hung mà có chính tinh đắc) → nhãn ≥ khá; hung ≥ 2×sáng → nhãn ≤ trung bình
            kh = dn["khop_noi_dung"]
            s_, h_ = len(sang), len(hung)
            co_mv = any(cham[c]["phan_tich"]["n_chinh_tinh_mv"] >= 1 for c in chu_ds)
            can_kha = s_ >= 1 and s_ >= 2 * h_ and (co_mv or (h_ == 0 and any(cham[c]["chinh_tinh_dac"] for c in chu_ds)))
            can_tb = h_ >= 1 and h_ >= 2 * s_
            kiem_khop = {"sang": s_, "hung": h_, "vi_pham_kha": bool(can_kha and diem_100(pv) < kh["khá_tran"]), "vi_pham_tb": bool(can_tb and diem_100(pv) > kh["tb_tran"])}
            if can_kha:
                pv = max(pv, kh["khá_tran"])
            if can_tb:
                pv = min(pv, kh["tb_tran"])
            if -sum(n["diem"] for n in xau_hien + gt) > sum(n["diem"] for n in tot_hien):          # nội dung người đọc thấy nghiêng về hạn chế thì nhãn không vượt 80
                pv = min(pv, kh["net_hung_tran"])
            # vừa tốt vừa hung rõ: kéo nhãn về vùng giữa (không lấy cực trị) và chèn câu dẫn hòa giải
            cau_dan = None
            if tot and xau:         # §17: câu 'hai mặt cùng tồn tại' áp cho MỌI mục có cả sáng lẫn hung (không kẹp điểm: điểm do công thức v3 quyết định)

                def nhan(n):
                    if n["id"] == "PHI_TUYEN":          # tách sát tinh NẰM TẠI cung và sát tinh CHIẾU từ cung khác — không gộp thành "quanh"
                        xh = cham[n["cung"]]["sat_xh"] if n["cung"] in cham else []
                        ngoai = {x["sao"] for x in xh}
                        ban = [x for x in n["nhan"] if x not in ngoai]
                        chieu = [f"{x['sao']} (ở {x['cung']}, {'xung' if x['quan_he'] == 'xung' else 'hội'} chiếu)" for x in {x["sao"]: x for x in xh}.values()]
                        return "; ".join(p for p in (f"sát tinh {' + '.join(ban)} tại {n['cung']}" if ban else "", f"sát tinh {' + '.join(chieu)} chiếu {n['cung']}" if chieu else "") if p)
                    if n["id"] == "CAT_XH":
                        return f"cát tinh {' + '.join(n['nhan'])} chiếu {n['cung']}"
                    if n.get("quan_he") not in (None, "ban_cung"):          # sao mượn/ở cung khác: luôn ghi vị trí thật, không ghi 'tại cung chủ' (§15.1)
                        return f"{' + '.join(n.get('nhan') or [n['id']])} (ở {n['cung_nguon']}, {'xung' if n['quan_he'] == 'xung' else 'hội'} chiếu)"
                    return f"{' + '.join(n.get('nhan') or [n['id']])} tại {n['cung']}"
                a_, b_ = "; ".join(dict.fromkeys(nhan(n) for n in tot[:2])), "; ".join(dict.fromkeys(nhan(n) for n in xau[:2]))
                # hướng nghiêng: so tổng điểm câu sáng với tổng điểm câu hung (cùng thang), để "hai mặt" không nuốt mất cảnh báo khi hạn chế nặng hơn hẳn
                tong_sang, tong_hung = sum(n["diem"] for n in sang), -sum(n["diem"] for n in hung)
                huong = "trong đó hạn chế nặng hơn điểm sáng" if tong_hung >= 1.5 * tong_sang else "trong đó điểm sáng nặng hơn hạn chế" if tong_sang >= 1.5 * tong_hung else "hai bên xấp xỉ ngang nhau"
                cau_dan = f"Cung có cả điểm sáng ({a_}) lẫn hạn chế ({b_}); hai mặt cùng tồn tại, {huong}."
            d100 = diem_100(pv)
            ket[ten] = {"diem100": d100, "xep_loai": bac(d100, dn), "diem_manh": tot_hien, "diem_yeu": xau_hien + gt, "khung": self.khung_chu_de(cd, chu_ds, cham), "cau_dan": cau_dan, "kiem_khop": kiem_khop, "luu_y": luu_y, "trung_tinh": trung_tinh, "sao_nho": sao_nho,
                        "cung": {c: cham[c]["xep_loai"] for c in cd["cung"]}}
        return ket


def them_vi_tri(them, ten):
    return next((c for c, ds in them.items() if ten in ds), None)


def chon_top(ds, k, dau):
    """Chọn k câu hiển thị của một mục: cách cục (kết luận đọc theo cụm sao) đứng trước câu từng sao, rồi theo độ lớn điểm (dau = +1 sáng, −1 hung).
    Nếu chỉ xếp theo điểm thì cách cục (điểm nhỏ) luôn bị câu từng sao đẩy ra khỏi top 3 và kết luận quan trọng nhất biến mất khỏi mục."""
    return sorted(ds, key=lambda n: (re.fullmatch(r"CC\d+", n["id"]) is None, -dau * n["diem"]))[:k]


def diem_100(x, kep=(5, 95)):
    """Làm tròn bội số 5 (tránh ảo giác chính xác của số lẻ), kẹp theo `kep`."""
    return int(min(kep[1], max(kep[0], math.floor(x / 5 + 0.5) * 5)))


def bac(d100, dn):
    """6 bậc theo bảng CÔNG KHAI (cau_hinh_luan_giai.json → diem_noi_tai.bac): ≤30 Rất thấp · ≤45 Thấp · ≤60 Trung bình · ≤75 Khá · ≤90 Tốt · còn lại Rất tốt."""
    for han, ten in dn["bac"]:
        if d100 <= han:
            return ten
    return dn["bac"][-1][1]


THU_TU_CUNG = ["Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê", "Thiên Di", "Tật Ách", "Phúc Đức",
               "Điền Trạch", "Phụ Mẫu", "Tử Tức", "Huynh Đệ", "Nô Bộc"]


def dong_thoi_gian_dai_han(lg, nam_sinh):
    """Dòng thời gian đại hạn cả đời: điểm = tổng điểm Mệnh + Quan Lộc + Tài Bạch của đại hạn (chỉ so các đại hạn của cùng lá số). Không đổi điểm cung nào."""
    kn = lg.tt.cfg["han"]["khuyen_nghi"]
    moc = []
    for c, tu_tuoi in sorted(lg.ls["dai_han"].items(), key=lambda kv: kv[1]):
        dh = lg.han(nam_sinh, nam_sinh + tu_tuoi - 1, False)["dai_han"]
        if not dh:
            continue
        dg = dh["danh_gia"]
        diem = round(sum(dg[k]["diem"] for k in ("Mệnh", "Quan Lộc", "Tài Bạch")), 2)
        k = kn.get(lg.ls["cung_chuc"][c])
        moc.append({"id": f"DH.{tu_tuoi}", "nhan_dinh": "", "tu_tuoi": tu_tuoi, "den_tuoi": tu_tuoi + 9, "chi": dh["chi"], "cung_goc": dh["cung_goc"], "xep_loai": dg["Mệnh"]["xep_loai"],
                    "diem": diem, "nhan": "", "goi_y": f"Nên {k['nen']}; tránh {k['tranh']}." if k else ""})
    if len(moc) > 1:
        dd = [m["diem"] for m in moc]
        moc[dd.index(max(dd))]["nhan"] = "đẹp nhất"
        moc[dd.index(min(dd))]["nhan"] = "khó nhất"
    for m in moc:
        m["nhan_dinh"] = (f"Đại hạn {m['tu_tuoi']}–{m['den_tuoi']} tuổi tại {m['chi']} (cung {m['cung_goc']} gốc), xếp loại {m['xep_loai'].lower()}"
                          + (f"; đây là đại hạn {m['nhan']} trong cả đời của bạn" if m["nhan"] else "") + ".")
    return moc


def so_cung(lg, cham):
    """So cung với cung (bảng so_cung): chỉ là đánh giá khách quan từ điểm đã tính, không kèm lời khuyên. Cặp được nêu khi điểm /100 chênh từ ngưỡng, không thành phần nào nghiêng về cung yếu,
    đủ thành phần nghiêng về cung trội, cả hai cung đều có chính tinh bản cung và không bị Tuần/Triệt nén (nếu không thì điểm không còn so công bằng). Không đổi điểm."""
    sc = lg.tt.lien_cung["so_cung"]
    ly = sc["luu_y"]
    ket = []
    for c in sc["cap"]:
        a, b = c["a"], c["b"]
        hieu = cham[a]["diem100"] - cham[b]["diem100"]
        if abs(hieu) < sc["nguong"]:
            continue
        troi, yeu = (a, b) if hieu > 0 else (b, a)
        pt, py = cham[troi]["phan_tich"], cham[yeu]["phan_tich"]
        if pt["vo_chinh_dieu"] or py["vo_chinh_dieu"] or pt["k_triet_tuan"] < 1 or py["k_triet_tuan"] < 1:
            continue
        tp = [("chinh_tinh", pt["tong_base"], py["tong_base"]),
              ("phu_tinh", pt["tong_cat"] + pt["tong_sat"], py["tong_cat"] + py["tong_sat"]),
              ("cach_cuc", pt["cach_cuc"], py["cach_cuc"])]
        if any(y - t >= sc["lech_nho"] for _, t, y in tp):
            continue
        thuan = [x for x in tp if x[1] - x[2] >= sc["lech_nho"]]
        if len(thuan) < sc["can_dong_thuan"]:
            continue
        nhan = lambda n: ly["thanh_phan"][n]
        cau = [sc["mau"].replace("{troi}", troi).replace("{dt}", str(cham[troi]["diem100"])).replace("{yeu}", yeu).replace("{dy}", str(cham[yeu]["diem100"]))
               .replace("{thanh_phan}", " và ".join(nhan(n) for n, _, _ in thuan))]
        if pt["tong_sat"] <= sc["sat_dang_ke"]:
            cau.append(ly["sat"].replace("{troi}", troi))
        ket.append({"id": f"SC.{a}.{b}", "diem": 0, "nhan_dinh": " ".join(cau),
                    "ly_do": f"{troi} ~{cham[troi]['diem100']}/100, {yeu} ~{cham[yeu]['diem100']}/100 (chênh từ {sc['nguong']}); {len(thuan)}/3 thành phần nghiêng về {troi}, không thành phần nào ngược: "
                             + ", ".join(f"{nhan(n)} {t:.1f} so với {y:.1f}" for n, t, y in tp)})
    return ket


def bao_cao(lg, nam_sinh=None, nam_xem=None):
    """Toàn bộ kết quả luận dạng dict (đầu vào cho phần viết văn và web)."""
    cham = {c: lg.cham_cung(c) for c in CUNG_CHUC}
    kq = {"la_so": {k: lg.ls[k] for k in ("input", "am_duong_nam_nu", "ban_menh", "cuc")},
          "menh_tai": CHI[lg.ls["menh"]], "nen": lg.nen(), "than": lg.than(),
          "cung": {c: cham[c] for c in THU_TU_CUNG}, "chu_de": lg.chu_de(cham), "so_cung": so_cung(lg, cham)}
    if nam_sinh and nam_xem:
        kq["han"] = dict(lg.han(nam_sinh, nam_xem), nam_xem=nam_xem)
        kq["dai_han_ca_doi"] = dong_thoi_gian_dai_han(lg, nam_sinh)
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
