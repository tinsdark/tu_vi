# 07 — Engine tự viết, so chéo, và bộ luận giải prototype

## 1. Engine an sao (`tools/tuvi/an_sao.py`)

Tự viết từ khẩu quyết an sao (không port code ai). Input là **âm lịch** (can chi năm, tháng, ngày, giờ, giới tính) — module đổi dương → âm lịch chưa làm.

Đủ: Mệnh, Thân, Cục (nạp âm + ngũ hổ độn), 14 chính tinh, vòng Lộc Tồn/Bác Sĩ, vòng Thái Tuế, vòng Tràng Sinh, Lục cát, Lục sát, Tứ Hóa, Tuần, Triệt và khoảng 60 phụ tinh khác, đại hạn, tiểu hạn. Chỗ các phái khác nhau đọc từ `PROFILE` (khớp `data/knowledge/bien_the.json`).

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
| Thiên Giải | 8% | có "nhảy cung" hay không | **Chưa quyết được** — chính lasotuvi ghi là không chắc; giữ 2 phương án |
| Hóa Khoa, Hóa Kỵ | 82–92% | Tứ Hóa can Canh, Nhâm | Khác phái, giữ cả hai (profile) |

## 3. Bộ luận giải prototype (`tools/tuvi/luan_giai.py`)

Làm đúng quy trình trong `docs/06`: nền → chủ tinh → độ sáng → tam phương tứ chính → phụ tinh → Tứ Hóa → Tuần/Triệt → cách cục → hạn. Mỗi câu luận có **ID quy tắc + điểm + lý do** — truy được ngược về dữ liệu. Ví dụ đầy đủ: `docs/vi-du-luan-giai.md`.

Mẫu một dòng đầu ra:
```
- [Lộc Mã giao trì] Tiền đến nhờ di chuyển, buôn bán, làm xa.  [CC21 +2] — Thỏa điều kiện cách cục
- Thất Sát hợp quân đội, kinh doanh mạo hiểm, kỹ thuật.  [CT.Thất Sát.Quan Lộc +1.0] — Thất Sát (M) tại Ngọ, hợp cung +1, gặp Triệt
```

**Xếp loại cung không đặt ngưỡng bằng tay**: `tools/tuvi/hieu_chinh.py` chấm 3.000 lá số ngẫu nhiên, lấy phân vị 10/30/70/90 **riêng cho từng cung chức** → "Rất tốt" nghĩa là thuộc top 10% dân số về cung đó.

## 4. Hạn chế — nói thẳng

1. **Trọng số là mô hình của tao**, không sách nào ghi con số. Hiệu chỉnh phân vị chỉ làm thang đo hợp lý, **không chứng minh luận đúng**. Muốn biết đúng phải có lá số người thật đã biết đời để đối chiếu.
2. Nội dung luận (`draft_ai_tong_hop`) là tao tổng hợp từ kiến thức đã học; web chỉ xác nhận được tên/điều kiện một phần cách cục (môi trường chặn truy cập trực tiếp các site tử vi, chỉ có kết quả tìm kiếm).
3. Chưa có: đổi lịch dương → âm, lưu Tứ Hóa theo đại hạn (Bắc phái), lưu nguyệt, phần viết thành văn mượt bằng LLM.
4. Cộng điểm tuyến tính nên chưa thể hiện được "một sao xấu phá cả cung" — các quy tắc phá cách đang làm việc này thủ công.
