# Tử Vi

Web lập & luận giải lá số Tử Vi Đẩu Số: an sao tất định, luận giải theo quy tắc có lý do, tổng hợp đa phái.

Trạng thái: **web chạy được** (`web/`, Vite + React + TypeScript, tính toán ngay trên trình duyệt) + engine tham chiếu Python (lịch âm, an sao, luận giải). Hai engine khớp nhau bằng test parity. Luận giải **chưa được kiểm trên lá số người thật**.

```bash
# Web
cd web && npm ci && npm run dev      # xem docs/10-web.md (test, server, triển khai)

# Engine Python
python3 tools/tuvi/test_lich_am.py         # test lịch âm (Tết, tháng nhuận, múi giờ lịch sử, quy ước giờ)
python3 tools/tuvi/test_an_sao.py          # test tính chất engine
python3 tools/tuvi/test_luan_giai.py       # test bất biến bộ luận
python3 tools/tuvi/test_fixture_la_so.py   # hồi quy lá số mẫu (spec scoring v3 §16)
python3 tools/tuvi/test_doi_chieu_thay.py  # đối chiếu 100 lá số với 'thầy độc lập' + nhãn điểm không mâu thuẫn nội dung
python3 tools/tuvi/ve_la_so.py > la_so.svg # vẽ lá số
python3 tools/tuvi/viet_van.py              # văn xuôi ghép mẫu (không dùng AI)
python3 tools/sinh_sql.py                  # sinh db/du_lieu.sql từ JSON
python3 tools/tuvi/luan_giai.py            # demo luận 1 lá số → markdown
python3 tools/tuvi/hieu_chinh.py 3000      # phân bố điểm v3 trên lá số ngẫu nhiên (để tune hằng số)
python3 tools/tuvi/phan_tich_diem.py 2003 5 11 14 45 nam   # in từng khoản điểm của các cung (cộng/trừ/Tuần-Triệt/phi tuyến/sàn)
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
| `docs/10-web.md` | Web: cấu trúc, parity TS = Python, API viết văn, triển khai, quyền riêng tư |
| `docs/11-hoc-tu-luan-giai-mau.md` | **Báo cáo học từ hai bản luận giải mẫu**: kết quả đo, 9 điều nên học, điều không học, kế hoạch theo lô, hướng dẫn cho phiên sau |
| `docs/vi-du-luan-giai.md`, `vi-du-van-xuoi.md`, `vi-du-la-so.svg` | Ví dụ đầu ra |
| `data/knowledge/` | Tri thức (JSON là nguồn gốc). Mỗi file có `_meta.trang_thai` |
| `tools/tuvi/` | `lich_am.py` lịch · `an_sao.py` engine · `luan_giai.py` bộ luận · `viet_van.py` văn xuôi · `ve_la_so.py` SVG · test, hiệu chỉnh, so chéo |
| `db/schema.sql`, `db/du_lieu.sql` | Schema T-SQL + INSERT sinh từ JSON (chưa chạy trên SQL Server) |

Mức tin cậy dữ liệu (`trang_thai`): `da_kiem_tra` > `da_review` > `da_gan_nguon` > `trich_nguon_chua_doi_chieu_sach` > `draft_ai_doi_chieu_1_nguon_web` > `draft_ai_tong_hop` / `draft_ai`.
