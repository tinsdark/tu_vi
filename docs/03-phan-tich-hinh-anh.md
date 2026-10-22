# 03 — Mô hình phân tích ảnh lá số

## 0. Quan điểm của tao

Ảnh lá số là **nguồn dữ kiện kém tin cậy nhất**: chụp mờ, mỗi web một layout, viết tắt khác nhau, và quan trọng nhất — **web tạo ra ảnh đó có thể an sai hoặc theo phái khác**. Đọc đúng 100% ảnh một lá số sai thì vẫn luận sai.

Vì vậy: **không luận trực tiếp từ ảnh**. Ảnh chỉ dùng để
1. lấy **thông tin sinh** (ngày giờ, giới tính) ở phần Thiên Bàn → **an lại bằng engine của mình**;
2. đọc **12 cung** để **đối chiếu**, phát hiện web gốc theo phái nào / an sai chỗ nào / OCR đọc nhầm chỗ nào.

Ảnh không có thông tin sinh (cắt mất Thiên Bàn, lá số viết tay của thầy) → mới phải dùng dữ kiện đọc từ ảnh, và phải báo người dùng mức tin cậy thấp hơn.

## 1. Pipeline

```
Ảnh
 │ 1. Tiền xử lý: xoay thẳng, cắt khung, tăng tương phản (OpenCV)
 │ 2. Nhận dạng layout: lưới 4×4 (12 cung viền + 4 ô giữa là Thiên Bàn)
 ▼
 ├─ 3a. Thiên Bàn → {họ tên, ngày giờ DL/ÂL, giới tính, năm xem, cục, mệnh}
 └─ 3b. 12 ô cung → mỗi ô {địa chi, tên cung, chính tinh(+độ sáng), phụ tinh, số đại hạn, Tuần/Triệt, Tràng Sinh}
 │ 4. Chuẩn hóa tên: so khớp mờ với từ điển ~110 sao + các cách viết tắt ("T.Vi", "Kình", "Đ.Kiếp"...)
 │ 5. KIỂM CHÉO (phần quan trọng nhất — xem mục 2)
 ▼
Kết quả: dữ kiện đã kiểm + danh sách sai lệch + độ tin cậy
```

Bước 3: dùng **mô hình ngôn ngữ thị giác (VLM, ví dụ Claude)** với đầu ra ép theo JSON schema là nhanh nhất để có bản chạy. Không train model riêng ở giai đoạn đầu — không có dữ liệu train và không cần. Phương án dự phòng/giảm chi phí: OpenCV tách ô + PaddleOCR/Tesseract tiếng Việt cho từng ô.

## 2. Kiểm chéo — chỗ tạo khác biệt so với "gửi ảnh cho ChatGPT"

Các ràng buộc **tất định** mà ảnh đọc được phải thỏa mãn (tự suy từ quy tắc an sao, không phụ thuộc web nào):

| # | Ràng buộc | Bắt được lỗi gì |
|---|---|---|
| R1 | 14 chính tinh chỉ có **12 cấu hình** hợp lệ (xác định hoàn toàn bởi vị trí Tử Vi). Thiên Phủ đối xứng Tử Vi qua trục Dần–Thân; Thất Sát luôn xung Thiên Phủ; Phá Quân luôn xung Thiên Tướng. | Đọc nhầm/sót chính tinh |
| R2 | Mỗi sao xuất hiện **đúng 1 lần** (trừ vòng Tràng Sinh / Lộc Tồn có tên trùng như "Quan Phù" thì đếm theo vòng) | Đọc trùng, sót |
| R3 | Thái Tuế ở chi năm sinh; Lộc Tồn ở vị trí theo can năm; Kình–Đà kẹp Lộc Tồn | Sai năm sinh đọc từ Thiên Bàn |
| R4 | 12 cung chức theo thứ tự cố định từ Mệnh | Đọc nhầm tên cung |
| R5 | Số đại hạn tăng đều 10, khởi = cục số, chiều theo âm dương nam nữ | Sai cục / giới tính |
| R6 | Lá số an lại từ thông tin sinh **khớp** lá số đọc từ ảnh | Web gốc khác phái hoặc an sai |

Khi R6 lệch: thử lần lượt các profile trong `bien_the.json`; profile nào khớp → biết web gốc theo phái nào. Không profile nào khớp → nhiều khả năng sai giờ sinh hoặc web gốc an sai → báo người dùng.

## 3. Đánh giá

- Bộ test: **≥ 200 ảnh** lá số thật từ ≥ 5 web phổ biến + ảnh chụp điện thoại + vài lá số viết tay. Tự sinh nhãn bằng cách lập lá số trên web đó từ thông tin sinh đã biết.
- Chỉ số: độ chính xác thông tin sinh (mục tiêu ~100% sau kiểm chéo), F1 theo từng sao-cung (mục tiêu ≥ 98% trước kiểm chéo cho ảnh chụp màn hình).
- Mọi ảnh người dùng gửi lên: **chỉ lưu khi có đồng ý** (là dữ liệu cá nhân: tên + ngày sinh).
