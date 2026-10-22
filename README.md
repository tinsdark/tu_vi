# Tử Vi

Web lập & luận giải lá số Tử Vi Đẩu Số: an sao tất định, luận giải theo quy tắc có lý do, tổng hợp đa phái.

Trạng thái: **lịch âm + engine an sao + bộ luận giải (Python) chạy được**, có vẽ lá số SVG và viết văn; chưa có web. Luận giải **chưa được kiểm trên lá số người thật**.

```bash
python3 tools/tuvi/test_lich_am.py         # test lịch âm (Tết, tháng nhuận, múi giờ lịch sử, quy ước giờ)
python3 tools/tuvi/test_an_sao.py          # test tính chất engine
python3 tools/tuvi/test_luan_giai.py       # test bất biến bộ luận
python3 tools/tuvi/ve_la_so.py > la_so.svg # vẽ lá số
python3 tools/tuvi/viet_van.py [--mau]     # văn xuôi (Claude nếu có ANTHROPIC_API_KEY, không thì ghép mẫu)
python3 tools/sinh_sql.py                  # sinh db/du_lieu.sql từ JSON
python3 tools/tuvi/luan_giai.py            # demo luận 1 lá số → markdown
python3 tools/tuvi/hieu_chinh.py 3000      # hiệu chỉnh ngưỡng xếp loại
python3 tools/tuvi/so_cheo_lasotuvi.py <clone lasotuvi>   # so chéo với lasotuvi
python3 tools/tuvi/so_cheo_lich.py ref.csv                 # so lịch với amlich + lunar-javascript (xem đầu file)
python3 tools/tuvi/so_cheo_iztro.py ...                    # so an sao với iztro (xem đầu file)
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
| `docs/07-engine-va-luan-giai.md` | Engine, kết quả so chéo, bộ luận, hạn chế |
| `docs/08-lich-am.md` | Đổi dương → âm lịch, múi giờ lịch sử, quy ước giờ, kết quả so chéo |
| `docs/09-doi-chieu-web.md` | Đối chiếu độ sáng, Thiên Giải, Lưu Hà, cách cục với web (toàn văn) |
| `docs/vi-du-luan-giai.md`, `vi-du-van-xuoi.md`, `vi-du-la-so.svg` | Ví dụ đầu ra |
| `data/knowledge/` | Tri thức (JSON là nguồn gốc). Mỗi file có `_meta.trang_thai` |
| `tools/tuvi/` | `lich_am.py` lịch · `an_sao.py` engine · `luan_giai.py` bộ luận · `viet_van.py` văn xuôi · `ve_la_so.py` SVG · test, hiệu chỉnh, so chéo |
| `db/schema.sql`, `db/du_lieu.sql` | Schema T-SQL + INSERT sinh từ JSON (chưa chạy trên SQL Server) |

Mức tin cậy dữ liệu (`trang_thai`): `da_kiem_tra` > `da_review` > `da_gan_nguon` > `trich_nguon_chua_doi_chieu_sach` > `draft_ai_doi_chieu_1_nguon_web` > `draft_ai_tong_hop` / `draft_ai`.
