# 04 — Kế hoạch làm việc

Nguyên tắc: **làm đúng phần tất định trước (lịch, an sao), rồi mới tới luận giải**. Luận hay trên một lá số an sai là vô nghĩa.

Thời gian ước lượng cho 1 dev (mày) + tao hỗ trợ, làm bán thời gian. Con số thô, không chắc.

## Phase 0 — Chốt hướng (1 tuần)
- [ ] Trả lời `docs/05-cau-hoi.md` (phái, mục đích, stack, nguồn sách).
- [ ] Gom sách gốc (bản scan/ảnh trang cần dùng).
- [ ] Gom 20–30 **lá số người thật đã biết đời** (người nhà, bạn bè, người nổi tiếng có giờ sinh tin cậy) làm bộ test luận giải.
- **Xong khi**: có profile phái mặc định + danh sách sách + bộ lá số mẫu.

## Phase 1 — Lịch âm & can chi (1–2 tuần)
- [ ] Tự viết đổi Dương → Âm lịch theo thiên văn (sóc, trung khí), múi giờ VN, xử lý tháng nhuận. Không copy, dùng thuật toán thiên văn công khai (Meeus) làm gốc.
- [ ] Can chi năm/tháng/ngày/giờ; giờ Tý muộn; (tùy chọn) giờ mặt trời thực theo kinh độ.
- **Xong khi**: so khớp lịch vạn niên chính thức VN cho 1900–2100 (từng ngày Tết + mọi tháng nhuận), 0 lệch.

## Phase 2 — Engine an sao (3–4 tuần)
- [ ] An Mệnh/Thân, 12 cung, cục, 14 chính tinh, ~100 phụ tinh, vòng Thái Tuế / Lộc Tồn / Tràng Sinh, Tuần/Triệt, Tứ Hóa, đại hạn, tiểu hạn, lưu niên.
- [ ] Mỗi quy tắc an trong code có comment dẫn **sách + trang**; điểm khác phái đọc từ `bien_the.json`.
- [ ] Test: (a) unit test từng sao theo bảng tra trong sách; (b) property test các ràng buộc R1–R5 (docs/03); (c) so chéo hàng nghìn ngày sinh ngẫu nhiên với lasotuvi và iztro → mỗi chỗ lệch phải có giải thích.
- **Xong khi**: 0 lệch không giải thích được.

## Phase 3 — Hiển thị lá số (2 tuần)
- [ ] Web: form nhập, vẽ lá số 12 cung (SVG, đẹp trên điện thoại), xuất ảnh/PDF, lưu lá số, chọn phái.
- [ ] Bấm vào sao/cung → xem quy tắc liên quan.

## Phase 4 — Cơ sở tri thức (song song từ Phase 1, kéo dài 2–3 tháng)
- [ ] Hoàn thiện T1 (độ sáng, Tứ Hóa) từ sách — giải quyết hết ô `nghi_van` trong `docs/02b`.
- [ ] Công cụ admin: OCR sách → LLM đề xuất quy tắc → người duyệt.
- [ ] Ưu tiên quy tắc: Mệnh/Thân → Quan Lộc/Tài Bạch/Phu Thê → cách cục lớn → các cung còn lại → hạn.
- **Xong khi** (v1): ≥ 1.500 quy tắc `da_review` cho 1 phái.

## Phase 5 — Bộ luận giải (3 tuần)
- [ ] Rule engine chạy DSL trên lá số → danh sách quy tắc khớp (có ID, nguồn, trọng số).
- [ ] Xử lý mâu thuẫn: Tuần/Triệt giảm lực, độ sáng nhân hệ số, quy tắc trái dấu cân theo trọng số.
- [ ] LLM chỉ **viết lại thành văn** từ danh sách khớp; kiểm hậu kỳ: mọi câu phải trỏ về ≥ 1 ID quy tắc, câu không trỏ được → bỏ.
- [ ] Đánh giá trên bộ lá số người thật (Phase 0): chuyên gia/người trong cuộc chấm điểm.

## Phase 6 — Đọc ảnh (2–3 tuần)
- [ ] Pipeline docs/03; bộ 200 ảnh test; kiểm chéo R1–R6.

## Phase 7 — Ra mắt
- [ ] Tài khoản, lưu lá số, chính sách dữ liệu cá nhân (Nghị định 13/2023 về bảo vệ dữ liệu cá nhân), câu miễn trừ trách nhiệm, (nếu thu phí) cổng thanh toán.

## Kiến trúc đề xuất (chờ mày chốt ở câu hỏi Q5)

```
[Web client]  ──►  [API]  ──►  Engine an sao (thuần hàm, không I/O, test 100%)
                     │    ──►  Rule engine  ──►  DB tri thức (nạp từ data/knowledge/*.json)
                     │    ──►  LLM (chỉ viết văn + đọc ảnh)
                     └──►  DB người dùng / lá số
```
Engine & rule engine là **thuần logic, không phụ thuộc LLM** → chạy được offline, test được, không tốn tiền mỗi lần lập lá số.
