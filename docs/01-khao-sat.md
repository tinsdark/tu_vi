# 01 — Khảo sát thị trường & nguồn mở

> Ngày khảo sát: 2026-10-22. Phần nào chưa kiểm chứng được thì ghi rõ "chưa xác minh".

## 1. Các web/app xem tử vi tiếng Việt

| Nhóm | Ví dụ | Mô hình | Hạn chế thường gặp |
|---|---|---|---|
| Web nội dung + công cụ lá số | lichngaytot.net, tuvi.vn, xemtuvi.\*, lasotuvi.\* | Lá số miễn phí, sống bằng quảng cáo/SEO | Luận giải là **đoạn văn mẫu dán theo "sao X ở cung Y"**, không xét tổ hợp; quảng cáo dày; không lưu, không so sánh lá số |
| Diễn đàn chuyên môn | tuvi.cohoc.net (Tử Vi Cổ Học) | Lá số + cộng đồng luận | Chất lượng cao nhưng phải đăng bài chờ người luận; không tự động |
| App "AI tử vi" | AI Tử Vi – Vận Hạn (App Store), aituvi | Gói trả phí, LLM viết luận giải | LLM tự bịa khi không có dữ kiện chuẩn; không dẫn nguồn; không rõ phái |
| Dùng ChatGPT trực tiếp | Các bài hướng dẫn prompt (fptshop, viettablet) | User gửi ảnh lá số cho ChatGPT | LLM **đọc ảnh sai sao, sai cung** và không có cơ chế tự kiểm → luận sai mà vẫn tự tin |

Kết luận khoảng trống (đây là chỗ mình đánh):
1. **Luận giải theo tổ hợp** (tam phương tứ chính, cách cục, Tuần/Triệt, Tứ Hóa) thay vì dán đoạn văn từng sao.
2. **Minh bạch**: mỗi câu luận có ID quy tắc + nguồn sách + phái. Người dùng thấy "vì sao" ra câu đó.
3. **Chọn phái** (Thái Thứ Lang / Thiên Lương / Bắc phái Tứ Hóa) thay vì một cách an duy nhất.
4. **Đọc ảnh có kiểm chứng**: ảnh → dữ kiện → an lại lá số → đối chiếu, không tin mù ảnh.

## 2. Engine an sao mã nguồn mở (đã đọc code)

| Dự án | Ngôn ngữ | License | Phái | Ghi chú |
|---|---|---|---|---|
| [doanguyen/lasotuvi](https://github.com/doanguyen/lasotuvi) | Python | MIT | **Việt** (chủ yếu theo cụ Thiên Lương "Số tử vi dưới mắt khoa học") | ~109 sao, đủ vòng Thái Tuế/Lộc Tồn/Tràng Sinh, Tuần/Triệt, có bảng miếu-hãm. Lịch âm theo thuật toán Hồ Ngọc Đức. **Bỏ qua tháng nhuận** khi an (dùng thẳng số tháng). Code ít test, dừng phát triển. |
| [SylarLong/iztro](https://github.com/SylarLong/iztro) | TypeScript | MIT | **Trung Quốc** (có cấu hình phái, plugin đổi bảng Tứ Hóa/độ sáng) | ~4k sao GitHub, có output tiếng Việt, đủ đại hạn/tiểu hạn/lưu niên/lưu nguyệt, API truy vấn tam phương tứ chính. Tên sao/thuật ngữ dịch theo kiểu Trung, thiếu một số sao phái Việt dùng. |
| iztro-py | Python | — | port của iztro | chưa xác minh chất lượng |
| tuvi-mcp-server (PyPI) | Python | MIT | "đồng thuận phổ biến", tự ghi chưa hỗ trợ đổi phái | chưa đọc code |
| Renhuai123/ziwei-doushu | TypeScript | MIT | Nghê Hải Hạ (Thiên Kỷ) | phái Trung, ít liên quan |

Bằng chứng cụ thể rằng "phái" ảnh hưởng kết quả (đọc từ code `lasotuvi/App.py`):
- Tứ Hóa can **Canh**: lasotuvi (theo Thiên Lương) = Nhật–Vũ–**Đồng**–**Âm** (Hóa Khoa Thiên Đồng, Hóa Kỵ Thái Âm). iztro mặc định = Nhật–Vũ–**Âm**–**Đồng** (Thái Thứ Lang theo phương án nào: **chưa xác minh**, cần sách). → Người tuổi Canh sẽ có Hóa Kỵ ở cung khác nhau tùy web.
- Tứ Hóa can **Nhâm**: lasotuvi Khoa = **Thiên Phủ**; iztro mặc định Khoa = **Tả Phù**.
- Lưu Hà, Thiên Trù: tác giả lasotuvi ghi "sách cụ Thiên Lương không đề cập, mong mọi người kiểm chứng".
- Chiều vòng Tràng Sinh: comment trong code ghi đã từng sửa (Nam thuận/Nữ nghịch → Dương Nam Âm Nữ thuận).

⇒ Đây là lý do các web cho ra lá số **lệch nhau** và là lý do mình phải có tầng "cấu hình phái".

## 3. Quyết định đề xuất

- **Không dùng nguyên một engine nào, và không coi engine nào là đáp án.** Tự viết engine từ quy tắc an sao trong sách. lasotuvi + iztro chỉ là **2 phiếu tham khảo** để test chéo: cùng input, so từng sao từng cung. Chỗ lệch thì **không** sửa engine cho khớp, mà phải truy về sách + lý giải, rồi ghi vào `data/knowledge/bien_the.json`.
- Đã thấy lasotuvi có lỗi thật (thiếu bảng độ sáng Thiên Phủ) và chỗ đáng ngờ (Văn Xương/Khúc) — xem `docs/02b-tu-kiem-do-sang.md`.
- Có dùng code/bảng từ 2 repo trên thì giữ nguyên notice MIT (đã làm cho bảng miếu-hãm, xem `data/knowledge/do_sang.json`).

## Nguồn
- https://github.com/doanguyen/lasotuvi
- https://github.com/SylarLong/iztro — docs: https://docs.iztro.com
- https://pypistats.org/packages/iztro-py
- https://pypi.org/project/tuvi-mcp-server/0.2.0/
- https://deepwiki.com/Renhuai123/ziwei-doushu
- https://fptshop.com.vn/tin-tuc/for-gamers/cau-lenh-chat-gpt-xem-tu-vi-201368
- https://apps.apple.com/us/app/id6449532445
- https://www.goodreads.com/author/show/8107620.V_n_ng_Th_i_Th_Lang
