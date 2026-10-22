# Tử Vi

Web lập & luận giải lá số Tử Vi Đẩu Số: an sao tất định, luận giải theo quy tắc có lý do, tổng hợp đa phái.

Trạng thái: **engine an sao + bộ luận giải prototype (Python) chạy được**; chưa có web, chưa có đổi lịch dương → âm.

```bash
python3 tools/tuvi/test_an_sao.py          # test tính chất engine
python3 tools/tuvi/luan_giai.py            # demo luận 1 lá số → markdown
python3 tools/tuvi/hieu_chinh.py 3000      # hiệu chỉnh ngưỡng xếp loại
python3 tools/tuvi/so_cheo_lasotuvi.py <clone lasotuvi>   # so chéo với lasotuvi
python3 tools/kiem_do_sang.py data/knowledge/do_sang.json data/knowledge/do_sang_nguon2.json
```

| File | Nội dung |
|---|---|
| `docs/01-khao-sat.md` | Khảo sát web/app, engine mã nguồn mở |
| `docs/02-co-so-tri-thuc.md`, `02b-…` | Thiết kế DB tri thức; tự kiểm bảng độ sáng |
| `docs/03-phan-tich-hinh-anh.md` | Pipeline đọc ảnh lá số + kiểm chéo |
| `docs/04-ke-hoach.md` | Kế hoạch theo phase |
| `docs/05-cau-hoi.md` | Câu hỏi cần chốt |
| `docs/06-phuong-phap-luan-giai.md` | **Cách đọc lá số** (4 lớp) — máy làm lại theo |
| `docs/07-engine-va-luan-giai.md` | Engine, kết quả so chéo, prototype, hạn chế |
| `docs/vi-du-luan-giai.md` | Ví dụ đầu ra luận giải |
| `data/knowledge/` | Tri thức (JSON là nguồn gốc). Mỗi file có `_meta.trang_thai` |
| `tools/tuvi/` | `an_sao.py` engine · `luan_giai.py` bộ luận · test, hiệu chỉnh, so chéo |
| `db/schema.sql` | Schema DB (T-SQL, bản nháp) |

Mức tin cậy dữ liệu (`trang_thai`): `da_kiem_tra` > `da_review` > `da_gan_nguon` > `trich_nguon_chua_doi_chieu_sach` > `draft_ai_tong_hop` / `draft_ai`.
