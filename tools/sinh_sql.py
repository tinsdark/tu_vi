"""Sinh db/du_lieu.sql (INSERT T-SQL) từ data/knowledge/*.json để nạp vào schema db/schema.sql.

Chạy: python3 tools/sinh_sql.py
"""
import json
import os

GOC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
KB = os.path.join(GOC, "data", "knowledge")
CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]


def nap(ten):
    return json.load(open(os.path.join(KB, ten), encoding="utf-8"))


def q(x):
    if x is None:
        return "NULL"
    if isinstance(x, (int, float)):
        return str(x)
    if not isinstance(x, str):
        x = json.dumps(x, ensure_ascii=False)
    return "N'" + x.replace("'", "''") + "'"


def ma(ten):
    return ten.lower()


def main():
    out = ["-- Sinh tự động bởi tools/sinh_sql.py — KHÔNG sửa tay, sửa JSON rồi sinh lại.", "SET NOCOUNT ON;"]
    sao = {}
    for s in nap("chinh_tinh.json")["sao"]:
        sao[ma(s["ten"])] = (s["ten"], "chinh_tinh", s["ngu_hanh"], s.get("am_duong"), s.get("nhom"), s.get("tinh_chat"))
    for s in nap("phu_tinh.json")["sao"]:
        sao.setdefault(ma(s["ten"]), (s["ten"], "phu_tinh", s.get("hanh"), None, None, s.get("y_nghia")))
    bang = [("lasotuvi", {ma(s["ten"]): (s["theo_chi"], None) for s in nap("do_sang.json")["sao"]}),
            ("chot", {ma(t): (v["theo_chi"], v.get("do_tin_cay")) for t, v in nap("do_sang_chot.json")["sao"].items()})]
    for _, b in bang:
        for m in b:
            sao.setdefault(m, (m.title(), "phu_tinh", None, None, None, None))
    for m, (ten, loai, hanh, ad, nhom, tc) in sorted(sao.items()):
        out.append(f"INSERT dbo.TV_Sao VALUES ({q(m)},{q(ten)},{q(loai)},{q(hanh)},{q(ad)},{q(nhom)},{q(tc)});")
    for ten_bang, b in bang:
        for m, (theo_chi, tin) in b.items():
            for i, c in enumerate(CHI, 1):
                if theo_chi.get(c):
                    out.append(f"INSERT dbo.TV_DoSang VALUES ({q(ten_bang)},{q(m)},{i},{q(theo_chi[c])},{q(tin)});")
    for x in nap("bien_the.json")["diem_khac_biet"]:
        out.append(f"INSERT dbo.TV_BienThe VALUES ({q(x['id'])},{q(x['mo_ta'])},{q(x['phuong_an'])},"
                   f"{q(x.get('chon'))},{q(x.get('ghi_chu'))});")
    for k, v in nap("cau_hinh_luan_giai.json").items():
        if not k.startswith("_"):
            out.append(f"INSERT dbo.TV_CauHinh VALUES ({q(k)},{q(json.dumps(v, ensure_ascii=False))});")
    cc = nap("cach_cuc.json")
    for c in cc["cach"]:
        tt = "da_gan_nguon" if c.get("xac_nhan_web") else cc["_meta"]["trang_thai"]
        out.append(f"INSERT dbo.TV_QuyTac (Ma_QuyTac,Loai,Ten,Pham_Vi,Dieu_Kien,Dieu_Kien_Pha,Ket_Luan,Ket_Luan_Pha,Diem,Diem_Pha,Linh_Vuc,Trang_Thai) VALUES "
                   f"({q(c['id'])},N'cach_cuc',{q(c['ten'])},{q(c.get('pham_vi', 'Mệnh'))},{q(c['thanh'])},{q(c.get('pha'))},"
                   f"{q(c['ket_luan'])},{q(c.get('ket_luan_pha'))},{c['diem']},{q(c.get('diem_pha'))},{q(','.join(c.get('linh_vuc', [])))},{q(tt)});")
    mt = nap("chinh_tinh_tai_cung_chuc.json")
    for s, cung in mt["ma_tran"].items():
        for ten_cung, (hop, sang, ham) in cung.items():
            out.append(f"INSERT dbo.TV_QuyTac (Ma_QuyTac,Loai,Ten,Pham_Vi,Dieu_Kien,Ket_Luan,Ket_Luan_Pha,Diem,Trang_Thai) VALUES "
                       f"({q(f'CT.{s}.{ten_cung}')},N'chinh_tinh_cung',{q(f'{s} tại {ten_cung}')},{q(ten_cung)},{q({'co': s})},"
                       f"{q(sang)},{q(ham)},{hop},{q(mt['_meta']['trang_thai'])});")
    pc = nap("phu_tinh_tai_cung_chuc.json")
    for s, cung in pc["sao"].items():
        for ten_cung, txt in cung.items():
            if ten_cung.startswith("_"):
                continue
            out.append(f"INSERT dbo.TV_QuyTac (Ma_QuyTac,Loai,Ten,Pham_Vi,Dieu_Kien,Ket_Luan,Trang_Thai) VALUES "
                       f"({q(f'PT.{s}.{ten_cung}')},N'phu_tinh_cung',{q(f'{s} tại {ten_cung}')},{q(ten_cung)},{q({'co': s})},"
                       f"{q(txt)},{q(pc['_meta']['trang_thai'])});")
    open(os.path.join(GOC, "db", "du_lieu.sql"), "w", encoding="utf-8").write("\n".join(out) + "\n")
    print(len(out) - 2, "câu INSERT")


if __name__ == "__main__":
    main()
