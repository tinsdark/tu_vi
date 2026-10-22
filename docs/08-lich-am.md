# 08 — Đổi lịch dương → âm (`tools/tuvi/lich_am.py`)

## 1. Thuật toán

Tự viết từ công thức thiên văn trong Meeus, *Astronomical Algorithms* (2nd ed.):
- ch. 7: ngày Julius ↔ dương lịch (Gregory từ 15/10/1582).
- ch. 49: thời điểm sóc (trăng non), đủ các số hạng hiệu chỉnh chính + 14 số hạng hành tinh.
- ch. 25: kinh độ biểu kiến Mặt Trời (~0,01°) để xác định trung khí.
- ΔT (TT − UT): đa thức Espenak–Meeus theo giai đoạn.

Quy tắc lịch: mùng 1 = ngày chứa điểm sóc theo **múi giờ lịch**; tháng chứa Đông chí là tháng 11; năm có 13 tháng thì tháng đầu tiên sau tháng 11 không chứa trung khí là tháng nhuận.

## 2. Múi giờ dùng để TÍNH LỊCH (khác giờ đồng hồ)

| Giai đoạn | Miền Bắc | Miền Nam |
|---|---|---|
| trước 1968 | UTC+8 | UTC+8 |
| 1968 – 1975 | UTC+7 | UTC+8 |
| từ 1976 | UTC+7 | UTC+7 |

Nguồn: [Wikipedia – Time in Vietnam](https://en.wikipedia.org/wiki/Time_in_Vietnam), [tz mailing list 2011](https://mm.icann.org/pipermail/tz/2011-May/008539.html). Các nguồn lệch nhau vài tháng ở mốc đổi (Bắc: 8/8/1967 hay 1/1/1968) → **không chắc**, nhưng chỉ ảnh hưởng các tháng có sóc sát nửa đêm.

Trước 1945 chưa rõ lịch VN (Hiệp Kỷ lịch triều Nguyễn) tính theo múi nào → engine gắn cảnh báo cho năm < 1945.

## 3. Quy ước giờ/lịch (Q9) — mặc định theo đa số, đổi được

| Khóa `quy_uoc` | Mặc định | Dị bản |
|---|---|---|
| `ty_muon` | `ngay_sau` (23:00–23:59 tính ngày hôm sau) | `ngay_do` |
| `thang_nhuan` | `nhu_thang_truoc` | `nhu_thang_sau`, `chia_nua` (≤ 15 như tháng trước, > 15 như tháng sau) |
| `mui_gio_lich_su` | `True`: đổi giờ khai sinh theo giờ pháp định lúc đó (tzdata `Asia/Ho_Chi_Minh`) về UTC+7 | `False`: coi mọi giờ là UTC+7 |
| `gio_mat_troi` | `False` | `True` + `kinh_do`: dùng giờ mặt trời trung bình địa phương |

Miền Nam dùng UTC+8 (giờ đồng hồ) 1943–45, 1947–55, 1960–75 → người sinh miền Nam giai đoạn đó, nếu không đổi, sẽ **lệch 1 giờ = có thể lệch 1 canh giờ**. Miền Bắc: tzdata không tách riêng; engine coi UTC+7 từ 1955 (không chắc giai đoạn 1955–1967).

Can chi tháng dùng tháng âm (Giêng = Dần) — khác lịch Trung Hoa hiện đại dùng tiết khí (VD 30/1/1968: ta Giáp Dần, lunar-javascript Quý Sửu). Tử vi an theo tháng âm nên đây là đúng ý.

## 4. Kiểm tra

**Test mốc đã biết** (`test_lich_am.py`, pass hết): Tết 16 năm 1995–2027; tháng nhuận 2000–2026 (10 năm nhuận, đúng tháng); 1985 VN ăn Tết 21/1 (Trung Quốc 20/2); 2007 VN Tết 17/2 (TQ 18/2); Tết Mậu Thân 1968 Bắc 29/1, Nam 30/1; can chi ngày 1/1/2000 = Mậu Ngọ; giờ Tý muộn; giờ miền Nam 1970; giờ mặt trời Hà Nội.

**So chéo từng ngày 31/1/1900 → 31/12/2100** (73.383 ngày, `so_cheo_lich.py`) với 2 thư viện độc lập:

| So với | Lệch | Giải thích |
|---|---|---|
| amlich (thuật toán Hồ Ngọc Đức), UTC+7, 1968–2100 | **0 ngày 1968–2053**; 62 ngày ở 5 tháng 2054–2077 | Mọi chỗ lệch: sóc cách nửa đêm 0,4–16 phút. amlich bỏ bớt số hạng hiệu chỉnh nên sai vài phút; lunar-javascript (độ chính xác cao) đồng ý với ta ở các ca UTC+8 tương ứng |
| lunar-javascript (lịch Trung Hoa), UTC+8 | 120 ngày ở 4 tháng | 1914, 1916, 1920: sóc 00:01–00:05 giờ UTC+8 — Trung Quốc trước 1929 tính lịch theo giờ địa phương Bắc Kinh (UTC+7:46), không phải +8. 2057: sóc 23:59:57 (+8), cách nửa đêm 3 giây — không phân xử được |

**Ngày nhạy cảm:** khi sóc cách nửa đêm < 10 phút, `tu_duong_lich()` trả `canh_bao` (VD sóc 8/5/2054 lúc 00:00:22 giờ VN). Lịch in chính thức là căn cứ cuối cùng cho những ngày này.

## 5. Dùng

```python
from tuvi.lich_am import tu_duong_lich
from tuvi.an_sao import an_la_so
r = tu_duong_lich(1990, 6, 8, 8, 30, "nam", mien="nam")   # giờ đồng hồ trên giấy khai sinh
ls = an_la_so(**r["an_sao"])
r["am_lich"], r["can_chi"], r["canh_bao"]
```
