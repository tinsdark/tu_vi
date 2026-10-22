# Tử Vi

Web lập & luận giải lá số Tử Vi Đẩu Số: an sao tất định, luận giải theo quy tắc có nguồn, đọc ảnh lá số có kiểm chéo.

Trạng thái: **giai đoạn thiết kế** — chưa có code chạy.

| File | Nội dung |
|---|---|
| `docs/01-khao-sat.md` | Khảo sát web/app hiện có, engine mã nguồn mở, khoảng trống thị trường |
| `docs/02-co-so-tri-thuc.md` | Thiết kế database tri thức, danh mục sách, quy trình số hóa |
| `docs/02b-tu-kiem-do-sang.md` | Tự kiểm bảng độ sáng của nguồn tham khảo, các chỗ nghi vấn |
| `docs/03-phan-tich-hinh-anh.md` | Pipeline đọc ảnh lá số + ràng buộc kiểm chéo |
| `docs/04-ke-hoach.md` | Kế hoạch theo phase |
| `docs/05-cau-hoi.md` | Câu hỏi cần chốt |
| `data/knowledge/` | Dữ liệu tri thức (JSON là nguồn gốc). Mỗi file có `_meta.trang_thai` |
| `db/schema.sql` | Schema DB (T-SQL, bản nháp) |
| `tools/kiem_do_sang.py` | Script kiểm logic bảng độ sáng |

Mức tin cậy dữ liệu (`trang_thai`): `da_kiem_tra` > `da_review` > `da_gan_nguon` > `trich_nguon_chua_doi_chieu_sach` > `draft_ai`.
