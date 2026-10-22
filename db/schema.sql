-- =============================================
-- Author:      DATNT
-- Description: Schema cơ sở tri thức tử vi (bản nháp, T-SQL)
--              Nguồn gốc dữ liệu là data/knowledge/*.json; bảng ở đây nạp từ JSON.
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
	Bang       NVARCHAR(50) NOT NULL,                -- lasotuvi | thai_thu_lang | iztro_trung
	Ma_Sao     NVARCHAR(50) NOT NULL REFERENCES dbo.TV_Sao(Ma_Sao),
	Chi        TINYINT      NOT NULL CHECK (Chi BETWEEN 1 AND 12),
	Do_Sang    NCHAR(1)     NULL,                    -- M V Đ B H
	PRIMARY KEY (Bang, Ma_Sao, Chi)
)

---> Quy tắc luận giải
CREATE TABLE dbo.TV_QuyTac (
	Ma_QuyTac  NVARCHAR(80)  NOT NULL PRIMARY KEY,
	Ten        NVARCHAR(300) NOT NULL,
	Pham_Vi    NVARCHAR(50)  NOT NULL,
	Dieu_Kien  NVARCHAR(MAX) NOT NULL CHECK (ISJSON(Dieu_Kien) = 1),
	Ket_Luan   NVARCHAR(2000) NOT NULL,
	Muc_Do     SMALLINT      NOT NULL CHECK (Muc_Do BETWEEN -3 AND 3),
	Trong_So   DECIMAL(3,2)  NOT NULL DEFAULT 0.5,
	Phai       NVARCHAR(200) NOT NULL DEFAULT N'chung',
	Trang_Thai NVARCHAR(30)  NOT NULL DEFAULT N'draft_ai',   -- draft_ai | da_gan_nguon | da_review | loai_bo
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
	Profile    NVARCHAR(50)  NOT NULL,             -- bien_the.json/profile
	Engine_Ver NVARCHAR(20)  NOT NULL,
	Ket_Qua    NVARCHAR(MAX) NOT NULL CHECK (ISJSON(Ket_Qua) = 1),
	Nguon_Vao  NVARCHAR(20)  NOT NULL DEFAULT N'nhap_tay', -- nhap_tay | anh
	Ngay_Tao   DATETIME      NOT NULL DEFAULT GETDATE()
)
