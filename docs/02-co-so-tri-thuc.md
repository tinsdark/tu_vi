# 02 — Cơ sở tri thức (database luận giải)

## 0. Nói thẳng trước

- "Database hoàn chỉnh" **không làm xong trong 1 lượt** được, và **không nên để AI tự viết hết**. AI (kể cả tao) viết từ kiến thức phổ thông → nghe hợp lý nhưng có thể sai chi tiết, và không có nguồn. Thứ làm nên giá trị là: **mỗi quy tắc có nguồn sách + trang + phái + người review**.
- Cái đã làm ở lượt này: **thiết kế cấu trúc + dữ liệu nền đã kiểm được + mẫu quy tắc**. Toàn bộ nội dung luận do AI viết đều gắn `trang_thai: draft_ai`.
- Bản quyền: sách như *Tử Vi Đẩu Số Tân Biên* (Thái Thứ Lang), *Số Tử Vi Dưới Mắt Khoa Học* / *Tử Vi Nghiệm Lý* (Thiên Lương)… còn bản quyền hay không thì **không chắc** (tác giả mất đã lâu nhưng nhà xuất bản tái bản). Cách an toàn: **không copy nguyên văn vào DB/web**, chỉ trích **quy tắc** (điều kiện → kết luận) viết lại bằng lời mình + ghi nguồn. Quy tắc/kiến thức tự thân không có bản quyền, câu chữ thì có.

## 1. Ba tầng dữ liệu

| Tầng | Nội dung | Ví dụ file | Độ tin cậy |
|---|---|---|---|
| **T0 – Nền** | Can chi, ngũ hành, tam hợp, cục số | `can_chi.json`, `cung_chuc.json` | Cao, đã kiểm |
| **T1 – An sao** | Quy tắc an ~110 sao, bảng độ sáng, Tứ Hóa, biến thể phái | `chinh_tinh.json` (phần `an`), `do_sang.json`, `tu_hoa.json`, `bien_the.json` | Kiểm bằng test chéo engine |
| **T2 – Luận giải** | Sao tại cung, sao tại chi, cách cục, tổ hợp, hạn | `quy_tac_luan_giai.*.json` | Thấp → phải review từng quy tắc |

T0/T1 là **tất định** — đúng hoặc sai, test được. T2 là **diễn giải** — nhiều phái mâu thuẫn, nên DB phải chứa được mâu thuẫn (nhiều quy tắc cùng điều kiện, khác nguồn, khác trọng số).

## 2. Định dạng quy tắc (T2)

Xem `data/knowledge/quy_tac_luan_giai.mau.json`. Ý chính:

```
quy_tac = {
  id, ten,
  pham_vi:    menh | cung:<id> | tam_phuong:<id> | giap:<id> | dai_han | luu_nien,
  dieu_kien:  DSL máy kiểm được (sao, độ sáng, địa chi, Tuần/Triệt, đếm nhóm, all/any/none),
  ket_luan:   1–2 câu, lời mình,
  muc_do:     -3..+3,
  trong_so:   0..1,
  nguon:      [{sach, tac_gia, trang}],
  phai:       [thai_thu_lang | thien_luong | bac_phai | chung],
  trang_thai: draft_ai | da_gan_nguon | da_review | loai_bo
}
```

Tại sao không lưu dạng văn tự do ("Tử Vi tại Ngọ gặp Tả Hữu thì...")? Vì văn tự do thì máy không biết **khi nào** áp dụng → lại thành web dán đoạn văn. Điều kiện phải máy chạy được.

## 3. Danh mục nguồn cần số hóa (ưu tiên từ trên xuống)

| # | Sách | Tác giả | Dùng cho | Ghi chú |
|---|---|---|---|---|
| 1 | Tử Vi Đẩu Số Tân Biên | Vân Đằng Thái Thứ Lang | T1 + T2 (phú, cách cục, sao tại cung) | Chuẩn phổ biến nhất ở VN |
| 2 | Số Tử Vi Dưới Mắt Khoa Học / Tử Vi Nghiệm Lý | Thiên Lương | T1 + T2 | lasotuvi theo sách này |
| 3 | Tử Vi Đẩu Số Toàn Thư (bản dịch) | Hi Di Trần Đoàn (tương truyền) | T2 – phú gốc | Nguồn gốc các câu phú |
| 4 | Tử Vi Khảo Luận | Hoàng Thường | T2 | Có trong thư viện ĐH Hồng Đức |
| 5 | Tử Vi Đẩu Số Phú Giải | — | T2 – giải phú | Có trong thư viện ĐH Hải Phòng |
| 6 | Sách Tứ Hóa phi tinh (Bắc phái, bản dịch) | nhiều | T2 – nếu làm chế độ Bắc phái | Phase sau |

Tên sách tao chỉ xác minh được #1, #4, #5 qua tìm kiếm; #2, #3, #6 là theo hiểu biết chung, mày đối chiếu lại.

## 4. Quy trình số hóa một cuốn sách

1. **Nguồn vào**: PDF/ảnh scan mày có (tao không tự tải sách lậu).
2. **OCR** (tiếng Việt có dấu) → text theo chương, giữ số trang.
3. **Trích quy tắc bán tự động**: LLM đọc từng đoạn → đề xuất quy tắc theo DSL + trích dẫn trang. Đầu ra là *đề xuất*, `trang_thai: da_gan_nguon`.
4. **Review**: người hiểu tử vi duyệt (giao diện admin: đoạn gốc bên trái, quy tắc bên phải, nút duyệt/sửa/loại).
5. **Kiểm mâu thuẫn tự động**: cùng điều kiện mà `muc_do` trái dấu giữa 2 nguồn → đánh dấu để người quyết (giữ cả hai, ghi phái).
6. **Test hồi quy**: bộ lá số mẫu (người thật, đã biết đời) → chạy luận → so với nhận xét của chuyên gia.

Ước lượng khối lượng (thô, không chắc): 14 chính tinh × 12 chi ≈ 168 tổ hợp cơ bản + ~100 phụ tinh × 12 cung + vài trăm cách cục ⇒ cỡ **2.000–5.000 quy tắc** cho một phái. Một người review ~50–100 quy tắc/ngày ⇒ 1–3 tháng công review. Đây là phần tốn công nhất của cả dự án.

## 5. Schema DB

Xem `db/schema.sql`. JSON trong `data/knowledge/` là **nguồn gốc (source of truth) quản lý bằng git** — review qua diff/PR được. DB là bản nạp từ JSON để truy vấn nhanh và cho giao diện admin.
