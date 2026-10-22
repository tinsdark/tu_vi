# 02b — Tự kiểm bảng độ sáng (không tin nguồn nào mặc nhiên)

Chạy lại: `python3 -I tools/kiem_do_sang.py data/knowledge/do_sang.json data/knowledge/do_sang_nguon2.json`

**Tư thế:** `lasotuvi` chỉ là **phiếu số 1**. Một ô độ sáng chỉ được coi là "chốt" khi ≥ 2 nguồn độc lập khớp **hoặc** 1 sách gốc + lý giải được bằng logic. Còn lại là `nghi_van`.

## 1. Ba phép kiểm tao tự đặt ra

| Phép kiểm | Lý do | Kết quả |
|---|---|---|
| **Nhật–Nguyệt ngày/đêm**: Thái Dương tại X phải tương ứng Thái Âm tại X+6 | Thái Dương mạnh lúc ngày lên (Dần→Ngọ), Thái Âm mạnh lúc đêm (Thân→Tý) — hai bảng phải là ảnh gương | ✅ Khớp hoàn toàn 12/12 |
| **Đối xứng xung chiếu**: chi X và X+6 cùng mức | Không phải luật cứng, chỉ là cờ báo: chỗ lệch phải giải thích được (thường bằng ngũ hành) | Lệch ở 8 sao, xem dưới |
| **Đối chiếu nguồn 2** (hocvienlyso, thaiam — chỉ có trích đoạn) | Nguồn độc lập với lasotuvi | Lệch 2 ô: Tử Vi tại Tý, Hợi |

## 2. Nhận định từng chỗ lệch

| Sao | Chỗ lệch | Nhận định của tao | Mức nghi |
|---|---|---|---|
| Hỏa Tinh, Linh Tinh | Sáng ở Dần Mão Thìn Tỵ Ngọ, tối ở phía đối diện | **Hợp lý**: sao hành Hỏa, mạnh ở vùng Mộc (sinh Hỏa) và Hỏa. Lệch xung chiếu là đương nhiên. | Thấp |
| Thiên Đồng | Tý=V, Ngọ=H; Mão=Đ, Dậu=H | **Hợp lý một phần**: Đồng hành Thủy → vượng ở Tý (Thủy), hãm ở Ngọ (Hỏa). Mão/Dậu thì ngũ hành không giải thích được. | Trung bình |
| Cự Môn | Dần=V vs Thân=Đ; Tỵ=H vs Hợi=Đ | Tỵ (Hỏa) hãm, Hợi (Thủy) đắc → khớp hành Thủy của Cự Môn. Dần/Thân chỉ lệch 1 bậc. | Thấp |
| Thiên Cơ | Dần=H, Thân=V | **Ngược ngũ hành** (Cơ hành Mộc, Dần là Mộc lại hãm; Thân Kim khắc Mộc lại vượng). Nhưng tao nhớ sách cũng ghi Cơ hãm Dần — tức độ sáng **không thuần ngũ hành**, có yếu tố cấu hình đồng cung (Cơ ở Dần/Thân luôn đi với Thái Âm). Không kết luận được khi chưa có sách. | Trung bình |
| Thiên Lương | Mão=V, Dậu=H | Lương hành Mộc: Mão Mộc vượng, Dậu Kim khắc → hãm. **Hợp lý.** | Thấp |
| **Văn Xương, Văn Khúc** | Thìn=H vs Tuất=Đ; Mão=Đ vs Dậu=H; **2 sao bảng giống hệt nhau** | **Đáng ngờ nhất.** (1) Xương hành Kim lại hãm ở Dậu (Kim) — ngược. (2) Thìn/Tuất cùng là Thổ mộ khố mà một hãm một đắc — không thấy lý do. (3) Xương (Kim) và Khúc (Thủy) khác hành mà bảng trùng 100% → nghi tác giả dùng chung một bảng cho tiện. | **Cao** |
| Tử Vi | Tý, Hợi: lasotuvi = Bình, nguồn 2 = Đắc | Tử Vi hành Thổ, Tý/Hợi hành Thủy: Thổ khắc Thủy (mình đi khắc → hao lực) → nghiêng về **Bình**. Nhưng nguồn 2 ghi Đắc. Có thể là khác phái. | Trung bình |
| **Thiên Phủ** | **lasotuvi không có bảng** | Thiếu hẳn 1 chính tinh — engine nào dùng nguyên lasotuvi sẽ hiển thị Thiên Phủ không có độ sáng. Nguồn 2: Miếu/Vượng ở Dần Thân Tý Ngọ Thìn Tuất. Phải bổ sung từ sách. | **Cao** |
| Thái Âm | Theo Vương Đình Chi: M/V tại Dậu Tuất Hợi Tý Sửu; lasotuvi: Thân=V, Sửu=Đ | Khác phái (Vương Đình Chi là phái Trung Châu). Ghi vào `bien_the.json`, không phải lỗi. | Thấp |

## 3. Điều rút ra

1. lasotuvi **có lỗi thiếu dữ liệu thật** (Thiên Phủ) và **có chỗ đáng ngờ** (Xương Khúc). Bê nguyên là sai.
2. Độ sáng **không suy được thuần từ ngũ hành** (ca Thiên Cơ) → không thể tự "tính" bảng, bắt buộc phải có sách gốc. Logic chỉ dùng để **bắt lỗi**, không dùng để **điền**.
3. Việc cần mày: có bản *Tử Vi Đẩu Số Tân Biên* (Thái Thứ Lang) không? Chỉ cần chụp trang bảng miếu hãm là tao chốt được ~30 ô đang nghi.
