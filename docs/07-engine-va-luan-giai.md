# 07 — Engine tự viết, so chéo, và bộ luận giải prototype

## 1. Engine an sao (`tools/tuvi/an_sao.py`)

Tự viết từ khẩu quyết an sao (không port code ai). Input là **âm lịch** (can chi năm, tháng, ngày, giờ, giới tính); từ ngày giờ dương lịch thì qua `lich_am.tu_duong_lich()` (xem `docs/08`).

Đủ: Mệnh, Thân, Cục (nạp âm + ngũ hổ độn), 14 chính tinh, vòng Lộc Tồn/Bác Sĩ, vòng Thái Tuế, vòng Tràng Sinh, Lục cát, Lục sát, Tứ Hóa, Tuần, Triệt và khoảng 60 phụ tinh khác (gồm Lưu Hà, Thiên Trù), đại hạn, tiểu hạn. Chỗ các phái khác nhau đọc từ `PROFILE` (khớp `data/knowledge/bien_the.json`).

Test tính chất (`tools/tuvi/test_an_sao.py`, chạy trên hàng chục nghìn tổ hợp): Thất Sát luôn xung Thiên Phủ, Phá Quân luôn xung Thiên Tướng, Tử Vi–Thiên Phủ đối xứng qua trục Dần–Thân, Sát Phá Tham luôn tam hợp, Thái Tuế ở chi năm, Kình Đà kẹp Lộc Tồn, vòng Tràng Sinh khép kín, Thân chỉ cư 6 cung, đại hạn tăng đều 10, mỗi Hóa nằm đúng chỗ sao gốc. **Pass hết.**

## 2. So chéo với lasotuvi (`tools/tuvi/so_cheo_lasotuvi.py`)

518.400 lá số (60 năm × 12 tháng × 30 ngày × 12 giờ × 2 giới), so vị trí từng sao.

| Kết quả | Số sao |
|---|---|
| Khớp 100% | 97 / 107 (sau khi bổ sung Thai Phụ, Phong Cáo) |
| Lệch — đã giải thích | 10 |

Hai engine viết độc lập mà khớp gần như toàn bộ phần lõi → phần lõi đáng tin. Chỗ lệch:

| Sao | Khớp | Nguyên nhân | Kết luận của tao |
|---|---|---|---|
| Thai, Dưỡng | 0% | lasotuvi đặt Thai ngay trước Tràng Sinh | **Lỗi của lasotuvi.** Vòng 12 giai đoạn là …Tuyệt → Thai → Dưỡng → Tràng Sinh (thụ thai → nuôi dưỡng → sinh ra) |
| Thiên Khôi, Thiên Việt | 60% | lasotuvi lệch ở can Đinh, Mậu, Canh, Nhâm | Theo khẩu quyết phổ biến "Giáp Mậu Ngưu Dương, Ất Kỷ Thử Hầu, Bính Đinh Trư Kê, Nhâm Quý Thỏ Xà, Canh Tân Mã Hổ" |
| Hỏa Tinh, Linh Tinh | 75% | tuổi Tỵ Dậu Sửu: lasotuvi đảo điểm khởi | Theo khẩu quyết: Hỏa khởi Mão, Linh khởi Tuất |
| Phá Toái | 33% | lasotuvi đổi Tỵ/Dậu | Theo khẩu quyết: Tý Ngọ Mão Dậu → Tỵ |
| Thiên Giải | 8% | có "nhảy cung" hay không | **Đã chốt không nhảy** (2 nguồn VN, xem `docs/09`); giữ dị bản |
| Hóa Khoa, Hóa Kỵ | 82–92% | Tứ Hóa can Canh, Nhâm | Khác phái, giữ cả hai (profile) |

## 2b. So chéo với iztro (`tools/tuvi/so_cheo_iztro.py`)

iztro (npm, engine Trung Hoa viết độc lập, phái Toàn Thư/Trung Châu) — nguồn so thứ hai sau lasotuvi. Mẫu ngẫu nhiên, năm âm 1924–2043, ngày 1–29.

5.000 lá số: **90 / 96 mục khớp 100%**: 14 chính tinh, Mệnh, Thân, Cục, đại hạn, Tuần, Triệt, vòng Bác Sĩ, vòng Tràng Sinh, vòng Thái Tuế (tên Trung Hoa, cùng thứ tự), lục cát (trừ Khôi Việt), Kình Đà, Không Kiếp, Lộc Mã, và các sao theo tháng, ngày, chi năm.

| Sao | Khớp | Nguyên nhân (đã kiểm bằng công thức trên 200/200 mẫu) | Xử lý |
|---|---|---|---|
| Thiên Quý | 17% | iztro: Văn Khúc + (ngày−2) **thuận**; ta (theo lasotuvi): nghịch | Dị bản `profile.thien_quy` |
| Hỏa Tinh, Linh Tinh | 58–59% | iztro: cả hai **luôn thuận** theo giờ; phái VN đổi chiều theo âm dương nam nữ | Ghi trong `bien_the.json` |
| Thiên Khôi, Việt | 90% | Can Canh: iztro Sửu/Mùi ("Giáp Mậu Canh Ngưu Dương"), ta Ngọ/Dần ("Canh Tân Mã Hổ") | Khác khẩu quyết |
| Thiên Trù | 90% | Can Quý: iztro Hợi, ta Tuất (lasotuvi) | Dị bản `profile.thien_tru_quy` |

→ Không có chỗ lệch nào là lỗi engine; tất cả là khác phái Việt–Trung. Lần chạy 30.000 lá số bị dừng vì vượt giới hạn thời gian (iztro mất khoảng 68 ms một lá).

## 3. Bộ luận giải (`tools/tuvi/luan_giai.py`)

Quy trình `docs/06`: nền → chủ tinh → độ sáng → tam phương tứ chính → phụ tinh → Tứ Hóa → Tuần/Triệt → cách cục → hạn. Mỗi câu luận có **ID quy tắc + điểm + lý do**. Ví dụ: `docs/vi-du-luan-giai.md` (dạng danh sách), `docs/vi-du-van-xuoi.md` (văn xuôi), `docs/vi-du-la-so.svg` (lá số).

| Phần | Cách làm |
|---|---|
| Chấm cung | Cộng điểm chính tinh × độ sáng × hợp cung, chính tinh hội chiếu, phụ tinh theo vị trí (bản/xung/tam hợp), Tràng Sinh, cách cục. Phụ tinh có bảng miếu hãm (Xương Khúc) mà hãm thì còn 30% lực |
| **Phi tuyến** | `điểm = tổng_tốt × 1/(1 + nặng/K) + tổng_xấu`, trong đó "nặng" là độ lớn điểm âm của sát tinh/Hóa Kỵ/Hình ở bản cung + xung chiếu. Nhiều sao phá thì phần tốt mất tác dụng — thay cho cộng tuyến tính. K = 4 (tham số mô hình) |
| Phụ tinh theo cung | 18 sao có câu riêng cho từng cung (`phu_tinh_tai_cung_chuc.json`); Tứ Hóa ghép thêm nghĩa theo sao được hóa |
| Cách cục | 57 cách, có cách cho Tài, Quan, Phu, Điền, Di, Tật, Phúc; phá cách riêng + phá cách chung (≥ 2 sao hung ở bản + xung) |
| **Thân** | Thân cư cung nào → câu nghĩa; so điểm nội tại Mệnh với cung Thân cư → tiền vận/hậu vận |
| **Đại hạn** | Chấm lại 5 cung của đại hạn (Mệnh, Quan, Tài, Phu, Tật đại hạn) theo tam phương **của cung đại hạn**, có chồng **Tứ Hóa đại hạn** (can cung đại hạn — kỹ thuật Bắc phái, tắt được trong `cau_hinh.han`) |
| Tiểu hạn | Khởi theo tam hợp chi năm sinh, nam thuận nữ nghịch |
| Lưu niên | Cung Lưu Thái Tuế, chồng sao lưu (Lộc Tồn, Kình, Đà, Mã, Tang Môn, Bạch Hổ, Khốc, Hư, Tứ Hóa năm); cảnh báo khi sao lưu xấu vào tam phương hoặc Lưu Kỵ trùng Kỵ đại hạn |
| Lưu nguyệt | Đẩu Quân năm xem → 12 cung tháng, chấm từng cung, đánh dấu 2 tháng tốt nhất / 2 tháng cần thận trọng (so trong năm) |
| **Chủ đề** | Tính cách, Sự nghiệp, Tài chính, Tình cảm, Sức khỏe, Gia đình: chấm ĐÚNG cung chủ (Gia đình = Phụ Mẫu + Tử Tức), lấy ≤ 3 điểm mạnh/yếu; sao ở xung/hội chiếu chỉ được nêu kèm cung nguồn (`XC.<cung>`: "<Sao> từ cung X xung chiếu Y → hệ quả gián tiếp"); chính tinh miếu/vượng có sàn "trung bình" khi sát tinh chỉ ở xung/hội; vừa tốt vừa hung rõ thì kéo về vùng giữa + câu dẫn hòa giải |
| Điểm nội tại | Thang /100 làm tròn bội 5, 6 bậc (Rất thấp/Thấp/Trung bình/Khá/Tốt/Rất tốt). Quy đổi từ điểm cung qua mốc 10/30/70/90 của mẫu ngẫu nhiên (`hieu_chinh.py`) chỉ như THANG đo nội bộ — KHÔNG phải percentile dân số nên cấm câu "cao/thấp hơn X% lá số khác" |
| Câu sát tinh | Sinh từ dữ liệu thật: sát ở bản cung / ở xung-hội chiếu (ghi cung nguồn) / cả hai; không có sát thì không sinh câu. Sát ở xa trừ ít hơn sát ở bản cung (trọng số bản cung 1.0 > xung 0.5 > tam hợp 0.25) |
| Vô chính diệu | Mượn sao cung xung chiếu (ghi rõ nguồn), kèm ghi chú theo cung (Tử Tức: con muộn/ít; Huynh Đệ: anh chị em ít gần gũi), không tự động xấu |
| Hạn năm | Kết luận hành động: trọng tâm rủi ro → nên/tránh theo cung gốc bị lưu sát chiếu → mặt thuận (Hóa Lộc/Quyền/Khoa đại hạn, lưu cát tinh) |
| **Văn mẫu** (`viet_van.py`, không cần AI) | Mỗi mục là MỘT đoạn: 'Nhìn chung <bậc> (khoảng N/100). [câu dẫn hòa giải]. Điểm sáng: A; B. Cần lưu ý: C.', mỗi ý kèm mã quy tắc; ý (mã + nội dung) đã nêu ở mục trước thì bỏ. Sát tinh đắc địa (điểm bị lật dương nhưng câu luận vẫn nói mặt xấu) gắn cờ `dao_dau` và không vào điểm mạnh/yếu của chủ đề |
| **Viết văn bằng AI** (`viet_van.py`, tùy chọn) | Gửi báo cáo JSON cho Claude (`claude-opus-5-5`), yêu cầu mỗi câu kết thúc bằng [ID]. Hậu kiểm: câu không có ID hợp lệ bị bỏ. Không có credential → chế độ mẫu (ghép câu, không gọi API) |

Test: `test_luan_giai.py` — 150 lá số ngẫu nhiên không lỗi, điểm nội tại bội 5 và 6 bậc, mọi nhận định có ID, văn mẫu qua hậu kiểm 0 câu bị bỏ, phi tuyến làm giảm điểm khi thêm sát tinh, sát tinh đắc địa không lọt vào điểm mạnh/yếu, văn mẫu không nói percentile và không lặp ý, mọi nhận định chủ đề truy được về cung chủ/xung/tam hợp và nêu "từ cung …" khi khác cung, câu sát tinh khớp vị trí thật, sàn chính tinh miếu/vượng, ngũ hành có hệ quả, nhánh vô chính diệu, hạn năm có nên/tránh.

## 4. Hạn chế — nói thẳng

1. **Chưa có gì chứng minh luận đúng.** Trọng số, K của phi tuyến, ngưỡng phá cách chung, trọng số chủ đề đều là mô hình của tao. Mốc hiệu chỉnh chỉ làm thang đo nội bộ. Cần lá số người thật đã biết đời.
2. Nội dung luận: cách cục 40/57 có nguồn web; phụ tinh theo cung đối chiếu 1 nguồn web; `chinh_tinh_tai_chi`, `chinh_tinh_tai_cung_chuc`, `tu_hoa_luan`, `y_nghia` phụ tinh vẫn là AI tổng hợp chưa đối chiếu từng câu.
3. Nhánh LLM của `viet_van.py` **chưa chạy thật** (môi trường không có API key); chữ ký SDK đã kiểm, nhánh mẫu chạy được.
4. Đại hạn dùng câu luận của cung chức (VD "Mệnh") cho cung đại hạn — nghĩa hơi lệch với vận 10 năm; lưu nguyệt chấm cả cung như Mệnh.
5. Chưa xét giờ sinh ngày/đêm cho các cách cần (Nguyệt lãng thiên môn, Nhật chiếu lôi môn).
6. Chưa có web; mới có SVG lá số + schema/INSERT SQL (`db/`), chưa chạy trên SQL Server.
