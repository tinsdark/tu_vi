"""Engine an sao Tử Vi — tự viết từ khẩu quyết an sao, không port từ engine khác.

Input là dữ kiện ÂM LỊCH (năm can chi, tháng, ngày, giờ). Từ dương lịch: dùng lich_am.tu_duong_lich().
Quy ước: địa chi 1..12 = Tý..Hợi, thiên can 1..10 = Giáp..Quý, giờ 1..12 = Tý..Hợi.
Chỗ các phái khác nhau đọc từ PROFILE (khớp data/knowledge/bien_the.json).
"""

CAN = ["", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]
CHI = ["", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
TY, SUU, DAN, MAO, THIN, TI, NGO, MUI, THAN, DAU, TUAT, HOI = range(1, 13)

CUNG_CHUC = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc",
             "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"]

PROFILE_MAC_DINH = {
    "tu_hoa_canh": "am_dong",       # Canh: Nhật Vũ Âm Đồng (khẩu quyết phổ biến); dị bản: dong_am
    "tu_hoa_nham": "ta_phu",        # Nhâm: Lương Tử Tả Vũ; dị bản: thien_phu
    "khoi_viet": "khau_quyet",      # Giáp Mậu Ngưu Dương...; dị bản: lasotuvi
    "hoa_linh_ty_dau_suu": "hoa_mao_linh_tuat",  # dị bản: hoa_tuat_linh_mao (lasotuvi)
    "pha_toai": "khau_quyet",       # Tý Ngọ Mão Dậu → Tỵ; dị bản: lasotuvi (đổi Tỵ/Dậu)
    "thien_giai": "khong_nhay",     # Thân thuận theo tháng; dị bản: nhay_cung (lasotuvi theo Thiên Lương)
    "luu_ha": "thai_thu_lang",      # Đinh Thìn, Canh Thân, Tân Mão; dị bản: thien_luong (Đinh Thân, Canh Thìn), ngu_hanh (Đinh Thân, Canh Mão, Tân Thìn)
    "thien_tru_quy": "tuat",        # Quý → Tuất (lasotuvi); dị bản: hoi (iztro, khẩu quyết Trung Hoa)
    "thien_quy": "nghich",          # từ Văn Khúc đếm nghịch (lasotuvi); dị bản: thuan (iztro, phái Trung Hoa)
}


def mv(vi_tri, buoc):
    """Dịch cung trên địa bàn; buoc dương = thuận, âm = nghịch."""
    return (vi_tri - 1 + buoc) % 12 + 1


def nap_am(can, chi):
    """Ngũ hành nạp âm của 1 cặp can chi (công thức số can + số chi)."""
    so_can = (can + 1) // 2                      # Giáp Ất=1 ... Nhâm Quý=5
    so_chi = {TY: 0, SUU: 0, NGO: 0, MUI: 0, DAN: 1, MAO: 1, THAN: 1, DAU: 1}.get(chi, 2)
    tong = so_can + so_chi
    tong = tong - 5 if tong > 5 else tong
    return {1: "Kim", 2: "Thuy", 3: "Hoa", 4: "Tho", 5: "Moc"}[tong]


CUC_SO = {"Thuy": 2, "Moc": 3, "Kim": 4, "Tho": 5, "Hoa": 6}


def can_cung(can_nam, chi_cung):
    """Ngũ hổ độn: can của cung Dần theo can năm, rồi đếm thuận."""
    can_dan = {1: 3, 6: 3, 2: 5, 7: 5, 3: 7, 8: 7, 4: 9, 9: 9, 5: 1, 10: 1}[can_nam]
    return (can_dan - 1 + (chi_cung - DAN) % 12) % 10 + 1


def vi_tri_tu_vi(cuc, ngay):
    """Tìm số bù x nhỏ nhất để (ngày + x) chia hết cho cục; thương q đếm từ Dần; x lẻ lùi, x chẵn tiến."""
    x = (-ngay) % cuc
    q = (ngay + x) // cuc
    goc = mv(DAN, q - 1)
    return mv(goc, -x if x % 2 else x)


def an_la_so(can_nam, chi_nam, thang, ngay, gio, gioi_tinh, profile=None):
    """gioi_tinh: 'nam' | 'nu'. Trả về dict lá số."""
    p = dict(PROFILE_MAC_DINH, **(profile or {}))
    duong_nam_am_nu = (can_nam % 2 == 1) == (gioi_tinh == "nam")
    chieu = 1 if duong_nam_am_nu else -1

    menh = mv(DAN, (thang - 1) - (gio - 1))
    than = mv(DAN, (thang - 1) + (gio - 1))
    hanh_cuc = nap_am(can_cung(can_nam, menh), menh)
    cuc = CUC_SO[hanh_cuc]

    sao = {}

    def dat(ten, vi_tri):
        sao[ten] = vi_tri

    # --- 14 chính tinh
    tv = vi_tri_tu_vi(cuc, ngay)
    for ten, buoc in [("Tử Vi", 0), ("Thiên Cơ", -1), ("Thái Dương", -3), ("Vũ Khúc", -4),
                      ("Thiên Đồng", -5), ("Liêm Trinh", -8)]:
        dat(ten, mv(tv, buoc))
    tp = (6 - tv - 1) % 12 + 1                   # đối xứng Tử Vi qua trục Dần–Thân
    for ten, buoc in [("Thiên Phủ", 0), ("Thái Âm", 1), ("Tham Lang", 2), ("Cự Môn", 3),
                      ("Thiên Tướng", 4), ("Thiên Lương", 5), ("Thất Sát", 6), ("Phá Quân", 10)]:
        dat(ten, mv(tp, buoc))

    # --- Vòng Lộc Tồn (Bác Sĩ)
    loc = {1: DAN, 2: MAO, 3: TI, 4: NGO, 5: TI, 6: NGO, 7: THAN, 8: DAU, 9: HOI, 10: TY}[can_nam]
    dat("Lộc Tồn", loc)
    dat("Kình Dương", mv(loc, 1))
    dat("Đà La", mv(loc, -1))
    for i, ten in enumerate(["Bác Sĩ", "Lực Sĩ", "Thanh Long", "Tiểu Hao", "Tướng Quân", "Tấu Thư",
                             "Phi Liêm", "Hỷ Thần", "Bệnh Phù", "Đại Hao", "Phục Binh", "Quan Phủ"]):
        dat(ten, mv(loc, i * chieu))

    # --- Vòng Thái Tuế
    for i, ten in enumerate(["Thái Tuế", "Thiếu Dương", "Tang Môn", "Thiếu Âm", "Quan Phù", "Tử Phù",
                             "Tuế Phá", "Long Đức", "Bạch Hổ", "Phúc Đức", "Điếu Khách", "Trực Phù"]):
        dat(ten, mv(chi_nam, i))
    dat("Thiên Không", mv(chi_nam, 1))
    dat("Nguyệt Đức", mv(chi_nam, 5))
    dat("Thiên Đức", mv(chi_nam, 9))

    # --- Vòng Tràng Sinh theo cục
    ts = {2: THAN, 5: THAN, 3: HOI, 4: TI, 6: DAN}[cuc]
    for i, ten in enumerate(["Tràng Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy",
                             "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"]):
        dat(ten, mv(ts, i * chieu))

    # --- Theo giờ
    dat("Văn Xương", mv(TUAT, -(gio - 1)))
    dat("Văn Khúc", mv(THIN, gio - 1))
    dat("Thai Phụ", mv(sao["Văn Khúc"], 2))
    dat("Phong Cáo", mv(sao["Văn Khúc"], -2))
    dat("Địa Kiếp", mv(HOI, gio - 1))
    dat("Địa Không", mv(HOI, -(gio - 1)))
    nhom_nam = {THAN: 0, TY: 0, THIN: 0, DAN: 1, NGO: 1, TUAT: 1, TI: 2, DAU: 2, SUU: 2}.get(chi_nam, 3)
    khoi_hoa, khoi_linh = [(DAN, TUAT), (SUU, MAO), (MAO, TUAT), (DAU, TUAT)][nhom_nam]
    if nhom_nam == 2 and p["hoa_linh_ty_dau_suu"] == "hoa_tuat_linh_mao":
        khoi_hoa, khoi_linh = TUAT, MAO
    dat("Hỏa Tinh", mv(khoi_hoa, (gio - 1) * chieu))
    dat("Linh Tinh", mv(khoi_linh, -(gio - 1) * chieu))

    # --- Theo tháng
    dat("Tả Phù", mv(THIN, thang - 1))
    dat("Hữu Bật", mv(TUAT, -(thang - 1)))
    dat("Thiên Hình", mv(DAU, thang - 1))
    dat("Thiên Riêu", mv(SUU, thang - 1))
    dat("Thiên Y", mv(SUU, thang - 1))
    dat("Địa Giải", mv(MUI, thang - 1))
    dat("Thiên Giải", mv(THAN, (thang - 1) * (2 if p["thien_giai"] == "nhay_cung" else 1)))

    # --- Theo ngày
    dat("Tam Thai", mv(sao["Tả Phù"], ngay - 1))
    dat("Bát Tọa", mv(sao["Hữu Bật"], -(ngay - 1)))
    dat("Ân Quang", mv(sao["Văn Xương"], ngay - 2))
    dat("Thiên Quý", mv(sao["Văn Khúc"], (ngay - 2) * (1 if p["thien_quy"] == "thuan" else -1)))

    # --- Theo can năm
    if p["khoi_viet"] == "khau_quyet":
        khoi, viet = {1: (SUU, MUI), 5: (SUU, MUI), 2: (TY, THAN), 6: (TY, THAN), 3: (HOI, DAU), 4: (HOI, DAU),
                      7: (NGO, DAN), 8: (NGO, DAN), 9: (MAO, TI), 10: (MAO, TI)}[can_nam]
    else:  # bảng trong lasotuvi
        khoi = [0, SUU, TY, HOI, DAU, MUI, TY, MUI, NGO, TI, MAO][can_nam]
        viet = mv(THIN, THIN - khoi)
    dat("Thiên Khôi", khoi)
    dat("Thiên Việt", viet)
    dat("Thiên Quan", [0, MUI, THIN, TI, DAN, MAO, DAU, HOI, DAU, TUAT, NGO][can_nam])
    dat("Thiên Phúc", [0, DAU, THAN, TY, HOI, MAO, DAN, NGO, TI, NGO, TI][can_nam])
    dat("Văn Tinh", mv(loc, 3))
    dat("Đường Phù", mv(loc, 5))
    dat("Quốc Ấn", mv(loc, 8))
    luu_ha = [0, DAU, TUAT, MUI, THIN, TI, NGO, THAN, MAO, HOI, DAN]
    if p["luu_ha"] == "thien_luong":
        luu_ha[4], luu_ha[7] = THAN, THIN
    elif p["luu_ha"] == "ngu_hanh":
        luu_ha[4], luu_ha[7], luu_ha[8] = THAN, MAO, THIN
    dat("Lưu Hà", luu_ha[can_nam])
    dat("Thiên Trù", [0, TI, NGO, TY, TI, NGO, THAN, DAN, NGO, DAU, TUAT if p["thien_tru_quy"] == "tuat" else HOI][can_nam])

    # --- Theo chi năm
    dat("Long Trì", mv(THIN, chi_nam - 1))
    dat("Phượng Các", mv(TUAT, -(chi_nam - 1)))
    dat("Giải Thần", sao["Phượng Các"])
    dat("Thiên Khốc", mv(NGO, -(chi_nam - 1)))
    dat("Thiên Hư", mv(NGO, chi_nam - 1))
    dat("Hồng Loan", mv(MAO, -(chi_nam - 1)))
    dat("Thiên Hỷ", mv(sao["Hồng Loan"], 6))
    ma = {0: DAN, 1: THAN, 2: HOI, 3: TI}[nhom_nam]
    dat("Thiên Mã", ma)
    dat("Hoa Cái", mv(ma, 2))
    dat("Kiếp Sát", mv(ma, 3))
    dat("Đào Hoa", mv(ma, 7))
    co = {HOI: DAN, TY: DAN, SUU: DAN, DAN: TI, MAO: TI, THIN: TI, TI: THAN, NGO: THAN, MUI: THAN}.get(chi_nam, HOI)
    dat("Cô Thần", co)
    dat("Quả Tú", mv(co, -4))
    # chi_nam % 3: 1 = Tý Ngọ Mão Dậu, 0 = Dần Thân Tỵ Hợi, 2 = Thìn Tuất Sửu Mùi
    pha_toai = {1: TI, 0: DAU, 2: SUU} if p["pha_toai"] == "khau_quyet" else {0: TI, 1: DAU, 2: SUU}
    dat("Phá Toái", pha_toai[chi_nam % 3])
    dat("Thiên Tài", mv(menh, chi_nam - 1))
    dat("Thiên Thọ", mv(than, chi_nam - 1))
    dat("Đẩu Quân", mv(chi_nam, -(thang - 1) + (gio - 1)))

    # --- Cố định / theo cung
    dat("Thiên La", THIN)
    dat("Địa Võng", TUAT)
    dat("Thiên Thương", mv(menh, 5))
    dat("Thiên Sứ", mv(menh, 7))

    # --- Tứ Hóa
    bang = {1: ["Liêm Trinh", "Phá Quân", "Vũ Khúc", "Thái Dương"],
            2: ["Thiên Cơ", "Thiên Lương", "Tử Vi", "Thái Âm"],
            3: ["Thiên Đồng", "Thiên Cơ", "Văn Xương", "Liêm Trinh"],
            4: ["Thái Âm", "Thiên Đồng", "Thiên Cơ", "Cự Môn"],
            5: ["Tham Lang", "Thái Âm", "Hữu Bật", "Thiên Cơ"],
            6: ["Vũ Khúc", "Tham Lang", "Thiên Lương", "Văn Khúc"],
            7: ["Thái Dương", "Vũ Khúc", "Thái Âm", "Thiên Đồng"],
            8: ["Cự Môn", "Thái Dương", "Văn Khúc", "Văn Xương"],
            9: ["Thiên Lương", "Tử Vi", "Tả Phù", "Vũ Khúc"],
            10: ["Phá Quân", "Cự Môn", "Thái Âm", "Tham Lang"]}[can_nam][:]
    if can_nam == 7 and p["tu_hoa_canh"] == "dong_am":
        bang[2], bang[3] = "Thiên Đồng", "Thái Âm"
    if can_nam == 9 and p["tu_hoa_nham"] == "thien_phu":
        bang[2] = "Thiên Phủ"
    tu_hoa = dict(zip(["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"], bang))
    for hoa, goc in tu_hoa.items():
        dat(hoa, sao[goc])

    # --- Tuần, Triệt
    het_tuan = mv(chi_nam, 10 - can_nam)
    tuan = [mv(het_tuan, 1), mv(het_tuan, 2)]
    triet = {1: [THAN, DAU], 6: [THAN, DAU], 2: [NGO, MUI], 7: [NGO, MUI], 3: [THIN, TI], 8: [THIN, TI],
             4: [DAN, MAO], 9: [DAN, MAO], 5: [TY, SUU], 10: [TY, SUU]}[can_nam]

    # --- Cung chức, đại hạn, tiểu hạn
    cung_chuc = {mv(menh, i): ten for i, ten in enumerate(CUNG_CHUC)}
    dai_han = {mv(menh, i * chieu): cuc + 10 * i for i in range(12)}
    khoi_tieu_han = {0: TUAT, 1: THIN, 2: MUI, 3: SUU}[nhom_nam]

    return {
        "input": {"can_nam": CAN[can_nam], "chi_nam": CHI[chi_nam], "thang": thang, "ngay": ngay,
                  "gio": CHI[gio], "gioi_tinh": gioi_tinh, "profile": p},
        "am_duong_nam_nu": ("Dương" if can_nam % 2 else "Âm") + (" Nam" if gioi_tinh == "nam" else " Nữ"),
        "ban_menh": nap_am(can_nam, chi_nam),
        "cuc": {"hanh": hanh_cuc, "so": cuc},
        "menh": menh, "than": than,
        "sao": sao, "tu_hoa": tu_hoa, "tuan": tuan, "triet": triet,
        "cung_chuc": cung_chuc, "dai_han": dai_han, "tieu_han_khoi": khoi_tieu_han,
    }


def theo_cung(la_so):
    """Gom sao theo địa chi để in/ luận."""
    ds = {c: [] for c in range(1, 13)}
    for ten, vt in la_so["sao"].items():
        ds[vt].append(ten)
    return ds
