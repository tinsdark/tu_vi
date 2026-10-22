"""Tự kiểm bảng độ sáng: logic nội tại + đối chiếu nguồn thứ 2. In báo cáo markdown."""
import json, sys

CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"]
DIEM = {"M": 2, "V": 2, "Đ": 1, "B": 0, "H": -1, None: None}  # gộp M/V vì nhiều sách lẫn 2 mức này

def nap(path):
    return json.load(open(path, encoding="utf-8"))

def bang_theo_ten(do_sang):
    return {s["ten"].lower(): s["theo_chi"] for s in do_sang["sao"]}

def kiem_xung(bang, ten):
    """Sao an theo cấu hình đối xứng thì cung xung chiếu thường cùng mức. Liệt kê cặp lệch."""
    t = bang[ten]
    return [(CHI[i], t[CHI[i]], CHI[i+6], t[CHI[i+6]]) for i in range(6)
            if DIEM[t[CHI[i]]] != DIEM[t[CHI[i+6]]]]

def kiem_nhat_nguyet(bang):
    """Thái Dương tại chi X phải tương ứng Thái Âm tại chi X+6 (ngày <-> đêm)."""
    d, a = bang["thái dương"], bang["thái âm"]
    return [(CHI[i], d[CHI[i]], CHI[(i+6)%12], a[CHI[(i+6)%12]]) for i in range(12)
            if DIEM[d[CHI[i]]] != DIEM[a[CHI[(i+6)%12]]]]

def doi_chieu(bang, nguon2):
    lech = []
    for ten, quy in nguon2["sao"].items():
        t = bang.get(ten.lower())
        for muc, ds_chi in quy.items():
            for c in ds_chi:
                goc = t.get(c) if t else None
                ok = goc is not None and (
                    (muc == "MV" and goc in "MV") or (muc == "H" and goc == "H")
                    or (muc == "Đ" and goc == "Đ") or (muc == "B" and goc == "B"))
                if not ok:
                    lech.append((ten, c, muc, goc))
    return lech

def main(do_sang_path, nguon2_path):
    bang = bang_theo_ten(nap(do_sang_path))
    nguon2 = nap(nguon2_path)
    print("## A. Đối xứng xung chiếu (cặp lệch)\n")
    chinh = ["tử vi","liêm trinh","thiên đồng","vũ khúc","thiên cơ","tham lang",
             "cự môn","thiên tướng","thiên lương","thất sát","phá quân",
             "văn xương","văn khúc","kình dương","đà la","hỏa tinh","linh tinh","địa không","địa kiếp"]
    for ten in chinh:
        l = kiem_xung(bang, ten)
        print(f"- **{ten}**: " + ("đối xứng" if not l else "; ".join(f"{a}={x} vs {b}={y}" for a,x,b,y in l)))
    print("\n## B. Nhật–Nguyệt ngày/đêm (Thái Dương@X vs Thái Âm@X+6)\n")
    l = kiem_nhat_nguyet(bang)
    print("- khớp hoàn toàn" if not l else "\n".join(f"- Dương@{a}={x} vs Âm@{b}={y}" for a,x,b,y in l))
    print(f"\n## C. Đối chiếu nguồn thứ 2 ({nguon2['_meta']['nguon']})\n")
    l = doi_chieu(bang, nguon2)
    print("- không lệch" if not l else "\n".join(
        f"- {t} @{c}: nguồn 2 = {m}, lasotuvi = {g}" for t,c,m,g in l))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
