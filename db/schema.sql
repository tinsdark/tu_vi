-- =============================================
-- Author:      DATNT
-- Description: Schema cơ sở tri thức tử vi (bản nháp, T-SQL)
--              Nguồn gốc dữ liệu là data/knowledge/*.json; bảng ở đây nạp từ JSON
--              bằng tools/sinh_sql.py → db/du_lieu.sql (sinh lại mỗi khi JSON đổi).
-- =============================================

---> Nguồn tài liệu (sách, web, người)
CREATE TABLE dbo.TV_Nguon (
	Ma_Nguon   NVARCHAR(50)  NOT NULL PRIMARY KEY,
	Ten        NVARCHAR(300) NOT NULL,
	Tac_Gia    NVARCHAR(200) NULL,
	Phai       NVARCHAR(50)  NULL,          -- thai_thu_lang | thien_luong | bac_phai | chung
	Ghi_Chu    NVARCHAR(1000) NULL
)

---> Sao
CREATE TABLE dbo.TV_Sao (
	Ma_Sao     NVARCHAR(50)  NOT NULL PRIMARY KEY,   -- tu_vi, liem_trinh...
	Ten        NVARCHAR(100) NOT NULL,
	Loai       NVARCHAR(30)  NOT NULL,               -- chinh_tinh | phu_tinh | sat_tinh | hoa | vong_trang_sinh...
	Ngu_Hanh   NVARCHAR(10)  NULL,
	Am_Duong   NVARCHAR(10)  NULL,
	Nhom       NVARCHAR(50)  NULL,
	Tinh_Chat  NVARCHAR(2000) NULL
)

---> Độ sáng theo địa chi, có thể nhiều bảng theo phái
CREATE TABLE dbo.TV_DoSang (
	Bang       NVARCHAR(50) NOT NULL,                -- lasotuvi | chot (do_sang_chot.json) | iztro_trung
	Ma_Sao     NVARCHAR(50) NOT NULL REFERENCES dbo.TV_Sao(Ma_Sao),
	Chi        TINYINT      NOT NULL CHECK (Chi BETWEEN 1 AND 12),
	Do_Sang    NCHAR(1)     NULL,                    -- M V Đ B H
	Do_Tin_Cay NVARCHAR(30) NULL,                    -- dong_thuan | mot_phan | nghi_van
	PRIMARY KEY (Bang, Ma_Sao, Chi)
)

---> Điểm các phái khác nhau (bien_the.json) — engine chọn phương án theo profile
CREATE TABLE dbo.TV_BienThe (
	Ma_BienThe NVARCHAR(50)  NOT NULL PRIMARY KEY,
	Mo_Ta      NVARCHAR(500) NOT NULL,
	Phuong_An  NVARCHAR(MAX) NOT NULL CHECK (ISJSON(Phuong_An) = 1),
	Chon       NVARCHAR(MAX) NULL,                   -- phương án mặc định (chuỗi hoặc JSON)
	Ghi_Chu    NVARCHAR(MAX) NULL
)

---> Tham số mô hình luận giải (cau_hinh_luan_giai.json), mỗi khóa cấp 1 một dòng
CREATE TABLE dbo.TV_CauHinh (
	Khoa       NVARCHAR(50)  NOT NULL PRIMARY KEY,   -- trong_so_vi_tri | he_so_do_sang | phi_tuyen | nguong_ket_luan ...
	Gia_Tri    NVARCHAR(MAX) NOT NULL CHECK (ISJSON(Gia_Tri) = 1)
)

---> Quy tắc luận giải
---> Loai: cach_cuc (cach_cuc.json) | chinh_tinh_cung (chinh_tinh_tai_cung_chuc.json)
--         | phu_tinh_cung (phu_tinh_tai_cung_chuc.json) | bo_sao (chinh_tinh_tai_chi.json) | tu_hoa (tu_hoa_luan.json)
CREATE TABLE dbo.TV_QuyTac (
	Ma_QuyTac  NVARCHAR(80)  NOT NULL PRIMARY KEY,   -- trùng ID engine in ra: CC21, CT.Tử Vi.Mệnh, PT.Hóa Kỵ.Tài Bạch...
	Loai       NVARCHAR(30)  NOT NULL,
	Ten        NVARCHAR(300) NOT NULL,
	Pham_Vi    NVARCHAR(50)  NOT NULL,               -- cung chức
	Dieu_Kien  NVARCHAR(MAX) NOT NULL CHECK (ISJSON(Dieu_Kien) = 1),   -- DSL, xem cach_cuc.json/_meta.dsl
	Dieu_Kien_Pha NVARCHAR(MAX) NULL CHECK (Dieu_Kien_Pha IS NULL OR ISJSON(Dieu_Kien_Pha) = 1),
	Ket_Luan   NVARCHAR(2000) NOT NULL,
	Ket_Luan_Pha NVARCHAR(2000) NULL,
	Diem       DECIMAL(4,2)  NOT NULL DEFAULT 0,
	Diem_Pha   DECIMAL(4,2)  NULL,
	Linh_Vuc   NVARCHAR(200) NULL,                   -- tai,su_nghiep,... (dùng cho tổng hợp chủ đề)
	Phai       NVARCHAR(200) NOT NULL DEFAULT N'chung',
	Trang_Thai NVARCHAR(40)  NOT NULL DEFAULT N'draft_ai',   -- draft_ai | draft_ai_doi_chieu_1_nguon_web | da_gan_nguon | da_review | loai_bo
	Nguoi_Review NVARCHAR(100) NULL,
	Ngay_Review  SMALLDATETIME NULL
)

---> Trích dẫn: 1 quy tắc nhiều nguồn
CREATE TABLE dbo.TV_QuyTac_Nguon (
	Ma_QuyTac  NVARCHAR(80) NOT NULL REFERENCES dbo.TV_QuyTac(Ma_QuyTac),
	Ma_Nguon   NVARCHAR(50) NOT NULL REFERENCES dbo.TV_Nguon(Ma_Nguon),
	Trang      NVARCHAR(30) NULL,
	PRIMARY KEY (Ma_QuyTac, Ma_Nguon)
)

---> Lá số đã lập (input + kết quả an sao dạng JSON để tái tạo)
CREATE TABLE dbo.TV_LaSo (
	Stt_Rec    UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
	User_Id    NVARCHAR(100) NULL,
	Ho_Ten     NVARCHAR(200) NULL,
	Ngay_Sinh_DL DATETIME    NOT NULL,             -- giờ đồng hồ người dùng nhập
	Noi_Sinh   NVARCHAR(200) NULL,
	Gioi_Tinh  NCHAR(1)      NOT NULL,             -- M | F
	Mien       NVARCHAR(10)  NOT NULL DEFAULT N'nam', -- bac | nam: chọn múi giờ lịch sử (lich_am.py)
	Kinh_Do    DECIMAL(6,3)  NULL,                    -- chỉ cần khi dùng giờ mặt trời
	Quy_Uoc    NVARCHAR(MAX) NULL CHECK (Quy_Uoc IS NULL OR ISJSON(Quy_Uoc) = 1),  -- ty_muon, thang_nhuan, mui_gio_lich_su, gio_mat_troi
	Am_Lich    NVARCHAR(30)  NULL,                    -- VD 16/5/1990 (nhuận) — để tra nhanh
	Profile    NVARCHAR(50)  NOT NULL,             -- bien_the.json/profile
	Engine_Ver NVARCHAR(20)  NOT NULL,
	Ket_Qua    NVARCHAR(MAX) NOT NULL CHECK (ISJSON(Ket_Qua) = 1),
	Nguon_Vao  NVARCHAR(20)  NOT NULL DEFAULT N'nhap_tay', -- nhap_tay | anh
	Ngay_Tao   DATETIME      NOT NULL DEFAULT GETDATE()
)
