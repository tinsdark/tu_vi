# 05 — Câu hỏi cần mày trả lời

> **Cập nhật 2026-10-22**: Q1 đã chốt = **tổng hợp đa phái** (engine dùng profile `tong_hop_v1`, chỗ bất đồng giữ cả hai phương án). Q4 đã chốt = **không có sách**, tri thức lấy từ web + kiến thức AI, gắn nhãn độ tin cậy. Câu hỏi mới ở cuối file.

Xếp theo mức ảnh hưởng. Mỗi câu có đề xuất của tao.

### Q1. Lấy phái nào làm chuẩn mặc định?
Thái Thứ Lang (phổ biến nhất VN) / Thiên Lương / Bắc phái Tứ Hóa phi tinh / tự tổng hợp?
**Đề xuất**: mặc định Thái Thứ Lang, có nút đổi profile. Không "tự tổng hợp" ở v1 vì khi lệch không biết bám vào đâu.

### Q2. "Hạn chế người dùng" của các web hiện tại mà mày muốn khắc phục cụ thể là gì?
Quảng cáo? Thu phí? Luận chung chung? Không cho lưu/so sánh? Không giải thích? Mỗi cái dẫn tới tính năng khác nhau — cần biết để chọn trọng tâm v1.

### Q3. Tính năng đọc ảnh để phục vụ ai?
Nếu người dùng biết ngày giờ sinh thì nhập tay + an lại luôn chính xác hơn đọc ảnh. Ảnh chỉ thật sự cần khi: (a) có lá số cũ thầy viết tay, (b) muốn kiểm web khác an đúng không. Đúng ý mày không, hay có ca khác?
**Đề xuất**: ảnh là Phase 6, không chặn v1.

### Q4. Nguồn sách: mày có bản nào trong tay?
Cần tối thiểu *Tử Vi Đẩu Số Tân Biên*. Tao sẽ không tải sách lậu. Mày có bản giấy/PDF hợp pháp thì chụp trang → tao số hóa thành quy tắc (viết lại bằng lời, ghi nguồn, không copy nguyên văn lên web).

### Q5. Stack?
Mày mạnh C#/SQL Server. Lựa chọn:
- **(A) ASP.NET Core + SQL Server + React** — mày tự đọc/sửa được backend và engine. **Đề xuất cái này.**
- (B) Full TypeScript (Next.js + Postgres) — engine chạy được cả trên trình duyệt, nhưng mày ít quen.

### Q6. Dùng cá nhân, nội bộ hay public/thu phí?
Ảnh hưởng: bản quyền nội dung sách, dữ liệu cá nhân, hạ tầng, và rủi ro pháp lý. Nghị định 144/2021 có xử phạt "hoạt động mê tín dị đoan" — web tử vi có bị coi là vậy không thì **tao không chắc**, nếu public thu tiền nên hỏi luật sư.

### Q7. Ai là người review luận giải?
Rule do AI trích từ sách vẫn phải có người hiểu tử vi duyệt. Mày tự duyệt, hay có quen thầy/người nghiên cứu? Đây là nút cổ chai lớn nhất (docs/02 §4: cỡ 1–3 tháng công).

### Q8. Ngân sách LLM?
Dùng API trả phí (Claude) cho: trích quy tắc từ sách (1 lần, vài chục USD), viết văn luận giải (mỗi lá số vài cent), đọc ảnh. Chấp nhận không? Hay muốn v1 chạy không cần LLM (luận giải ghép từ quy tắc, văn kém mượt hơn)?

### Q9. Quy ước giờ/lịch (cần mày chốt hoặc cho người dùng chọn)
- Sinh 23:00–23:59: tính ngày hôm sau (phổ biến) hay hôm đó?
- Sinh tháng nhuận: an như tháng trước, tháng sau, hay chia nửa tháng?
- Người sinh ở miền Nam trước 1975 (dùng UTC+8 nhiều giai đoạn): có hiệu chỉnh múi giờ lịch sử không? Ảnh hưởng tới cả giờ sinh lẫn ngày âm lịch một số năm.
- Có hiệu chỉnh giờ mặt trời thực theo nơi sinh không?
**Đề xuất**: mặc định theo đa số (hôm sau / như tháng trước / có hiệu chỉnh múi giờ lịch sử / không hiệu chỉnh giờ mặt trời), cho người dùng đổi trong "nâng cao".

### Q10. Phạm vi luận giải v1?
**Đề xuất**: Mệnh, Thân, 12 cung, cách cục chính, đại hạn 10 năm, lưu niên năm hiện tại. Để sau: lưu nguyệt, lưu nhật, xem hợp tuổi, chọn ngày.

---

## Câu hỏi mới (sau vòng 2)

### Q11. Mở mạng cho môi trường để tao đọc được các web tử vi?
Hiện proxy của môi trường chặn hết các site tử vi (tuvi.cohoc.net, hoc.kabala.vn, hocvienlyso.org, thaiam.vn…) — tao chỉ đọc được phần trích trong kết quả tìm kiếm. Nếu mày thêm các domain đó vào **Allowed domains** của environment (Network access), tao đọc được toàn văn bài để đối chiếu từng quy tắc, chất lượng dữ liệu tăng rõ.

### Q12. Bộ lá số người thật để kiểm luận giải
Đây là thứ duy nhất chứng minh luận đúng hay sai. Mày gom được bao nhiêu lá số (người nhà, bạn bè) kèm vài sự kiện đời đã biết (nghề, hôn nhân, năm biến cố lớn)? Chỉ cần ngày giờ sinh âm lịch + giới tính + 3–5 sự kiện. Mục tiêu 30 người.

### Q13. Mức "chắc chắn" muốn hiển thị cho người dùng?
Đề xuất: mỗi câu luận hiện một chấm màu theo độ tin cậy (xanh = nhiều nguồn đồng thuận, vàng = 1 nguồn, xám = AI tổng hợp). Mày thấy được không, hay muốn giấu đi cho gọn?
