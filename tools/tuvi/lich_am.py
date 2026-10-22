"""Đổi Dương lịch → Âm lịch Việt Nam + can chi, theo thiên văn (Meeus, *Astronomical Algorithms*, 2nd ed.).

Tự viết từ công thức trong sách (ch. 7 ngày Julius, ch. 25 kinh độ Mặt Trời, ch. 49 sóc). Không port code ai.

Quy tắc lịch âm (giống lịch Trung Hoa, khác ở múi giờ):
  - Ngày đầu tháng = ngày chứa điểm Sóc (trăng non) theo giờ múi lịch.
  - Tháng chứa Đông chí là tháng 11.
  - Năm nào giữa 2 tháng 11 có 13 tháng → tháng đầu tiên không chứa Trung khí là tháng nhuận.
Múi giờ LỊCH (không phải giờ đồng hồ): UTC+8 trước 1968; từ 1968 miền Bắc UTC+7; miền Nam giữ UTC+8 tới hết 1975.
Nguồn mốc: Wikipedia "Time in Vietnam", tz mailing list 2011 — các nguồn lệch nhau vài tháng, xem docs/08.
"""
import math
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from tuvi.an_sao import CAN, CHI

RAD = math.pi / 180


# ---------------------------------------------------------------- ngày Julius
def jd_tu_ngay(d, m, y):
    """Số ngày Julius (JDN, nguyên) của 1 ngày dương lịch (Gregory từ 15/10/1582, Julius trước đó)."""
    a = (14 - m) // 12
    yy, mm = y + 4800 - a, m + 12 * a - 3
    jd = d + (153 * mm + 2) // 5 + 365 * yy + yy // 4 - 32083
    if jd >= 2299161:
        jd = d + (153 * mm + 2) // 5 + 365 * yy + yy // 4 - yy // 100 + yy // 400 - 32045
    return jd


def ngay_tu_jd(jd):
    if jd > 2299160:
        a = jd + 32044
        b = (4 * a + 3) // 146097
        c = a - b * 146097 // 4
    else:
        b, c = 0, jd + 32082
    d = (4 * c + 3) // 1461
    e = c - 1461 * d // 4
    m = (5 * e + 2) // 153
    return date(b * 100 + d - 4800 + m // 10, m + 3 - 12 * (m // 10), e - (153 * m + 2) // 5 + 1)


def delta_t(nam):
    """ΔT = TT − UT (ngày). Đa thức Espenak–Meeus rút gọn; sai số vài giây với 1900–2100, đủ cho lịch."""
    t = nam - 2000
    if 2005 <= nam < 2050:
        s = 62.92 + 0.32217 * t + 0.005589 * t * t
    elif 1986 <= nam < 2005:
        s = 63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5
    elif 1961 <= nam < 1986:
        t = nam - 1975
        s = 45.45 + 1.067 * t - t * t / 260 - t ** 3 / 718
    elif 1941 <= nam < 1961:
        t = nam - 1950
        s = 29.07 + 0.407 * t - t * t / 233 + t ** 3 / 2547
    elif 1920 <= nam < 1941:
        t = nam - 1920
        s = 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t ** 3
    elif 1900 <= nam < 1920:
        t = nam - 1900
        s = -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t ** 3 - 0.000197 * t ** 4
    elif 2050 <= nam < 2150:
        s = -20 + 32 * ((nam - 1820) / 100) ** 2 - 0.5628 * (2150 - nam)
    else:
        u = (nam - 1820) / 100
        s = -20 + 32 * u * u
    return s / 86400


# ---------------------------------------------------------------- sóc (Meeus ch. 49)
def soc(k):
    """Thời điểm trăng non thứ k (k=0 ~ 6/1/2000), trả JDE (giờ TT). Đủ các số hạng hiệu chỉnh chính."""
    t = k / 1236.85
    jde = (2451550.09766 + 29.530588861 * k + 0.00015437 * t ** 2 - 0.000000150 * t ** 3 + 0.00000000073 * t ** 4)
    e = 1 - 0.002516 * t - 0.0000074 * t * t
    m = (2.5534 + 29.10535670 * k - 0.0000014 * t * t - 0.00000011 * t ** 3) * RAD
    mp = (201.5643 + 385.81693528 * k + 0.0107582 * t * t + 0.00001238 * t ** 3 - 0.000000058 * t ** 4) * RAD
    f = (160.7108 + 390.67050284 * k - 0.0016118 * t * t - 0.00000227 * t ** 3 + 0.000000011 * t ** 4) * RAD
    om = (124.7746 - 1.56375588 * k + 0.0020672 * t * t + 0.00000215 * t ** 3) * RAD
    s = math.sin
    jde += (-0.40720 * s(mp) + 0.17241 * e * s(m) + 0.01608 * s(2 * mp) + 0.01039 * s(2 * f)
            + 0.00739 * e * s(mp - m) - 0.00514 * e * s(mp + m) + 0.00208 * e * e * s(2 * m)
            - 0.00111 * s(mp - 2 * f) - 0.00057 * s(mp + 2 * f) + 0.00056 * e * s(2 * mp + m)
            - 0.00042 * s(3 * mp) + 0.00042 * e * s(m + 2 * f) + 0.00038 * e * s(m - 2 * f)
            - 0.00024 * e * s(2 * mp - m) - 0.00017 * s(om) - 0.00007 * s(mp + 2 * m)
            + 0.00004 * s(2 * mp - 2 * f) + 0.00004 * s(3 * m) + 0.00003 * s(mp + m - 2 * f)
            + 0.00003 * s(2 * mp + 2 * f) - 0.00003 * s(mp + m + 2 * f) + 0.00003 * s(mp - m + 2 * f)
            - 0.00002 * s(mp - m - 2 * f) - 0.00002 * s(3 * mp + m) + 0.00002 * s(4 * mp))
    # số hạng hành tinh
    a = [299.77 + 0.107408 * k - 0.009173 * t * t, 251.88 + 0.016321 * k, 251.83 + 26.651886 * k,
         349.42 + 36.412478 * k, 84.66 + 18.206239 * k, 141.74 + 53.303771 * k, 207.14 + 2.453732 * k,
         154.84 + 7.306860 * k, 34.52 + 27.261239 * k, 207.19 + 0.121824 * k, 291.34 + 1.844379 * k,
         161.72 + 24.198154 * k, 239.56 + 25.513099 * k, 331.55 + 3.592518 * k]
    he = [325, 165, 164, 126, 110, 62, 60, 56, 47, 42, 40, 37, 35, 23]
    jde += sum(h * 1e-6 * s(x * RAD) for h, x in zip(he, a))
    return jde


def kinh_do_mat_troi(jde):
    """Kinh độ biểu kiến Mặt Trời (độ, 0..360) tại JDE — Meeus ch. 25, độ chính xác ~0.01°."""
    t = (jde - 2451545.0) / 36525
    l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t
    m = (357.52911 + 35999.05029 * t - 0.0001537 * t * t) * RAD
    c = ((1.914602 - 0.004817 * t - 0.000014 * t * t) * math.sin(m) + (0.019993 - 0.000101 * t) * math.sin(2 * m)
         + 0.000289 * math.sin(3 * m))
    om = (125.04 - 1934.136 * t) * RAD
    return (l0 + c - 0.00569 - 0.00478 * math.sin(om)) % 360


def _ut(jde):
    nam = 2000 + (jde - 2451545.0) / 365.25
    return jde - delta_t(nam)


# ---------------------------------------------------------------- múi giờ lịch
def mui_gio_lich(nam_duong, mien="bac"):
    """Giờ lệch so với UTC dùng để TÍNH lịch âm (không phải giờ đồng hồ)."""
    if nam_duong < 1968:
        return 8
    if mien == "nam" and nam_duong < 1976:
        return 8
    return 7


def ngay_soc(k, tz):
    """JDN của ngày chứa điểm sóc thứ k theo múi tz."""
    return int(math.floor(_ut(soc(k)) + 0.5 + tz / 24))


def cung_trung_khi(jdn, tz):
    """Chỉ số 0..11 của 30° Mặt Trời đã đi lúc 0h ngày jdn (giờ địa phương tz). 9 = sau Đông chí (270°)."""
    jd_ut = jdn - 0.5 - tz / 24
    nam = 2000 + (jd_ut - 2451545.0) / 365.25
    return int(kinh_do_mat_troi(jd_ut + delta_t(nam)) // 30)


def _k(jdn):
    """Chỉ số k của tuần trăng gần ngày jdn (k=0 ~ sóc 6/1/2000)."""
    return round((jdn - 2451550.1) / 29.530588853)


def dau_thang_chua(jdn, tz):
    """(k, JDN ngày mùng 1) của tháng âm chứa ngày jdn."""
    k = _k(jdn) + 1
    while ngay_soc(k, tz) > jdn:
        k -= 1
    return k, ngay_soc(k, tz)


def thang_11(nam, tz):
    """(k, JDN mùng 1) của tháng 11 âm — tháng chứa Đông chí (≈ 22/12) của năm dương `nam`."""
    k, nm = dau_thang_chua(jd_tu_ngay(31, 12, nam), tz)
    if cung_trung_khi(nm, tz) >= 9:      # đầu tháng Mặt Trời đã qua 270° → Đông chí ở tháng trước
        k -= 1
    return k, ngay_soc(k, tz)


def thang_nhuan_sau_11(k11, tz):
    """Số thứ tự (1..) sau tháng 11 của tháng KHÔNG chứa trung khí đầu tiên = tháng nhuận."""
    truoc = cung_trung_khi(ngay_soc(k11 + 1, tz), tz)
    for i in range(2, 15):
        sau = cung_trung_khi(ngay_soc(k11 + i, tz), tz)
        if sau == truoc:
            return i - 1
        truoc = sau
    return None


def duong_sang_am(d, m, y, mien="bac"):
    """Trả (ngày, tháng, năm âm, nhuận). Năm âm = năm dương lịch chứa tháng Giêng của năm đó."""
    tz = mui_gio_lich(y, mien)
    jdn = jd_tu_ngay(d, m, y)
    k, dau = dau_thang_chua(jdn, tz)
    k11, a11 = thang_11(y - 1, tz)
    k11b, b11 = thang_11(y, tz)
    if b11 <= dau:                     # đã sang tháng 11/12 âm của năm nay
        k11, a11 = k11b, b11
        k11b, b11 = thang_11(y + 1, tz)
    so_thang = k11b - k11              # 12 hoặc 13
    i = k - k11                        # 0 = tháng 11, 1 = tháng 12, 2 = Giêng...
    nhuan = False
    if so_thang == 13:
        vt = thang_nhuan_sau_11(k11, tz)
        if i >= vt:
            nhuan = i == vt
            i -= 1
    thang = (10 + i) % 12 + 1
    nam_am = ngay_tu_jd(a11).year + (1 if i >= 2 else 0)
    return jdn - dau + 1, thang, nam_am, nhuan


def sat_nua_dem(d, m, y, mien="bac", phut=10):
    """Cảnh báo khi sóc của tháng chứa ngày này (hoặc tháng kế) rơi trong ±`phut` phút quanh nửa đêm.

    Khi đó ngày mùng 1 phụ thuộc vào sai số thiên văn (ΔT tương lai, số hạng bỏ qua) → kết quả có thể lệch 1 ngày
    so với lịch in. Ví dụ: sóc 7/5/2054 lúc 00:00:22 giờ VN.
    """
    tz = mui_gio_lich(y, mien)
    k, _ = dau_thang_chua(jd_tu_ngay(d, m, y), tz)
    ket = []
    for kk in (k, k + 1):
        phut_tu_nua_dem = ((_ut(soc(kk)) + 0.5 + tz / 24) % 1) * 1440
        lech = min(phut_tu_nua_dem, 1440 - phut_tu_nua_dem)
        if lech < phut:
            ket.append(f"Sóc mùng 1 {'tháng này' if kk == k else 'tháng sau'} cách nửa đêm {lech:.1f} phút — ngày âm có thể lệch 1")
    return ket


# ---------------------------------------------------------------- can chi
def can_chi_nam(nam_am):
    return (nam_am - 4) % 10 + 1, (nam_am - 4) % 12 + 1


def can_chi_ngay(d, m, y):
    jdn = jd_tu_ngay(d, m, y)
    return (jdn + 9) % 10 + 1, (jdn + 1) % 12 + 1


def can_chi_thang(thang_am, nam_am):
    """Tháng Giêng là Dần; can theo Ngũ hổ độn của can năm."""
    can_nam = can_chi_nam(nam_am)[0]
    can_gieng = {1: 3, 6: 3, 2: 5, 7: 5, 3: 7, 8: 7, 4: 9, 9: 9, 5: 1, 10: 1}[can_nam]
    return (can_gieng - 1 + thang_am - 1) % 10 + 1, (thang_am + 1) % 12 + 1


def chi_gio(gio, phut=0):
    """23:00–00:59 = Tý (1), 01:00–02:59 = Sửu ... 21:00–22:59 = Hợi."""
    return ((gio * 60 + phut + 60) // 120) % 12 + 1


# ---------------------------------------------------------------- giờ sinh
QUY_UOC_MAC_DINH = {
    "ty_muon": "ngay_sau",          # sinh 23:00–23:59 tính ngày hôm sau (đa số); dị bản: "ngay_do"
    "thang_nhuan": "nhu_thang_truoc",  # an như tháng trước; dị bản: "nhu_thang_sau", "chia_nua" (≤15 trước, >15 sau)
    "mui_gio_lich_su": True,        # đổi giờ đồng hồ khai sinh theo giờ pháp định lúc đó (tzdata) về UTC+7
    "gio_mat_troi": False,          # hiệu chỉnh giờ mặt trời trung bình theo kinh độ nơi sinh
}


def gio_dong_ho_sang_gio_tinh(dt, mien="nam", quy_uoc=None, kinh_do=None):
    """Đổi giờ ĐỒNG HỒ trên giấy khai sinh → giờ dùng để an (naive datetime).

    - mui_gio_lich_su: miền Nam dùng tzdata Asia/Ho_Chi_Minh (UTC+8 1943–45, 1947–55, 1960–75, UTC+9 1945...).
      Miền Bắc: tzdata không tách riêng; coi như Asia/Ho_Chi_Minh trước 1955, UTC+7 từ 1955 (không chắc 1955–1967).
    - gio_mat_troi: đổi sang giờ mặt trời trung bình địa phương = UTC + kinh_do/15 giờ.
    Mặc định trả về giờ chuẩn UTC+7.
    """
    q = dict(QUY_UOC_MAC_DINH, **(quy_uoc or {}))
    if q["mui_gio_lich_su"]:
        if mien == "bac" and dt.year >= 1955:
            utc = dt - timedelta(hours=7)
        else:
            utc = dt.replace(tzinfo=ZoneInfo("Asia/Ho_Chi_Minh")).astimezone(timezone.utc).replace(tzinfo=None)
    else:
        utc = dt - timedelta(hours=7)
    if q["gio_mat_troi"]:
        if kinh_do is None:
            raise ValueError("gio_mat_troi cần kinh_do nơi sinh")
        return utc + timedelta(hours=kinh_do / 15)
    return utc + timedelta(hours=7)


def tu_duong_lich(nam, thang, ngay, gio, phut, gioi_tinh, mien="nam", quy_uoc=None, kinh_do=None):
    """Từ ngày giờ DƯƠNG LỊCH (giờ đồng hồ) → bộ tham số cho an_sao.an_la_so + thông tin lịch."""
    q = dict(QUY_UOC_MAC_DINH, **(quy_uoc or {}))
    dt = gio_dong_ho_sang_gio_tinh(datetime(nam, thang, ngay, gio, phut), mien, q, kinh_do)
    ngay_lich = dt.date()
    if q["ty_muon"] == "ngay_sau" and dt.hour == 23:
        ngay_lich += timedelta(days=1)
    d, m, y, nhuan = duong_sang_am(ngay_lich.day, ngay_lich.month, ngay_lich.year, mien)
    thang_an = m
    if nhuan and (q["thang_nhuan"] == "nhu_thang_sau" or (q["thang_nhuan"] == "chia_nua" and d > 15)):
        thang_an = m % 12 + 1
    can_nam, chi_nam = can_chi_nam(y)
    cg = chi_gio(dt.hour, dt.minute)
    cn = can_chi_ngay(ngay_lich.day, ngay_lich.month, ngay_lich.year)
    ct = can_chi_thang(m, y)
    return {
        "an_sao": {"can_nam": can_nam, "chi_nam": chi_nam, "thang": thang_an, "ngay": d, "gio": cg,
                   "gioi_tinh": gioi_tinh},
        "am_lich": {"ngay": d, "thang": m, "nam": y, "nhuan": nhuan},
        "can_chi": {"nam": f"{CAN[can_nam]} {CHI[chi_nam]}", "thang": f"{CAN[ct[0]]} {CHI[ct[1]]}",
                    "ngay": f"{CAN[cn[0]]} {CHI[cn[1]]}", "gio": CHI[cg]},
        "gio_tinh": dt.isoformat(timespec="minutes"), "quy_uoc": q,
        "canh_bao": sat_nua_dem(ngay_lich.day, ngay_lich.month, ngay_lich.year, mien)
                    + ([f"Sinh tháng {m} nhuận — an theo tháng {thang_an} (quy ước {q['thang_nhuan']})"] if nhuan else [])
                    + (["Năm trước 1945: chưa rõ lịch VN thời đó dùng múi giờ nào (Hiệp Kỷ lịch), ngày âm có thể lệch"]
                       if y < 1945 else []),
    }
