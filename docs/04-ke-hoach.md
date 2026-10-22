# 04 — Kế hoạch làm việc

Nguyên tắc: **làm đúng phần tất định trước (lịch, an sao), rồi mới tới luận giải**. Luận hay trên một lá số an sai là vô nghĩa.

Thời gian ước lượng cho 1 dev (mày) + tao hỗ trợ, làm bán thời gian. Con số thô, không chắc.

> **Trạng thái 2026-10-22** — ✅ xong · 🟡 xong một phần · ⬜ chưa. Chi tiết: `docs/07`, `docs/08`, `docs/09`.
>
> | Phase | Trạng thái |
> |---|---|
> | 0 Chốt hướng | 🟡 Q1 (tổng hợp đa phái), Q4 (không sách), Q9 (mặc định đa số), Q11 (mở mạng) đã xong. **Thiếu bộ lá số người thật** và Q2, Q3, Q5–Q8, Q10, Q12, Q13 |
> | 1 Lịch âm | ✅ `lich_am.py`; khớp amlich 100% 1968–2053, giải thích hết chỗ lệch 1900–2100 |
> | 2 Engine | 🟡 ~110 sao, so chéo lasotuvi (518.400 lá) + iztro; mọi chỗ lệch có giải thích. Chưa có comment dẫn sách+trang (không có sách) |
> | 3 Hiển thị | ✅ Web (`web/`, `docs/10`): form, lá số 12 cung, 4 tab, bấm sao/cung/quy tắc, lưu trong máy, chia sẻ link, PNG/SVG/in, sáng/tối, điện thoại. Chưa có tài khoản/lưu phía server |
> | 4 Tri thức | 🟡 Độ sáng chốt theo web; 40/57 cách có nguồn; ~500 quy tắc (57 cách cục, 168 chính tinh × cung, 216 phụ tinh × cung, 40 Tứ Hóa…), phần lớn vẫn `draft_ai`. Chưa có công cụ admin duyệt |
> | 5 Luận giải | 🟡 Rule engine + phi tuyến + hạn đủ lớp + chủ đề + viết văn có hậu kiểm. **Chưa đánh giá trên lá số thật**; nhánh LLM chưa chạy thật |
> | 6 Đọc ảnh | ⬜ |
> | 7 Ra mắt | ⬜ |
>
> Việc tiếp theo hợp lý nhất: (1) mày gom lá số người thật (Q12) để kiểm luận; (2) chốt stack (Q5) để dựng web; (3) đối chiếu nốt 168 câu chính tinh × cung theo cách đã làm với phụ tinh.

## Phase 0 — Chốt hướng (1 tuần)
- [ ] Trả lời `docs/05-cau-hoi.md` (phái, mục đích, stack, nguồn sách).
- [ ] Gom sách gốc (bản scan/ảnh trang cần dùng).
- [ ] Gom 20–30 **lá số người thật đã biết đời** (người nhà, bạn bè, người nổi tiếng có giờ sinh tin cậy) làm bộ test luận giải.
- **Xong khi**: có profile phái mặc định + danh sách sách + bộ lá số mẫu.

## Phase 1 — Lịch âm & can chi (1–2 tuần)
- [x] Tự viết đổi Dương → Âm lịch theo thiên văn (sóc, trung khí), múi giờ VN, xử lý tháng nhuận. Không copy, dùng thuật toán thiên văn công khai (Meeus) làm gốc.
- [x] Can chi năm/tháng/ngày/giờ; giờ Tý muộn; (tùy chọn) giờ mặt trời thực theo kinh độ.
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
