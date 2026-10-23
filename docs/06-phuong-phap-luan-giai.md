# 06 — Phương pháp luận giải: lá số được "đọc" như thế nào

> Trả lời câu "mày đọc lá số từ đâu?". Khi tao (hoặc một thầy) đọc lá số, không phải tra từng sao rồi ghép văn. Đó là **một quy trình có thứ tự**, mỗi bước **điều chỉnh** kết luận của bước trước. File này mô tả quy trình đó để máy làm lại được; tham số nằm trong `data/knowledge/cau_hinh_luan_giai.json` để chỉnh, không chôn trong code.

## Tổng quan: 4 lớp

```
Lớp 1  NỀN        → âm dương, Mệnh–Cục, sao chủ hợp/khắc bản mệnh       (cả đời, "chất liệu")
Lớp 2  CẤU TRÚC   → chính tinh + độ sáng + tam phương tứ chính + cách cục  (12 cung, "bản thiết kế")
Lớp 3  ĐIỀU CHỈNH → phụ tinh cát/sát, Tứ Hóa, Tuần/Triệt, Tràng Sinh     ("tăng/giảm/đổi chiều")
Lớp 4  THỜI GIAN  → đại hạn 10 năm, tiểu hạn, lưu niên                  ("khi nào ứng")
```

Nguyên tắc xuyên suốt (rút từ cách các thầy đọc, các nguồn đều thống nhất):
1. **Không xem một cung đơn lẻ** — luôn gộp tam phương tứ chính (bản cung + 2 cung tam hợp + cung xung chiếu).
2. **Chính tinh là chủ, phụ tinh là khách** — phụ tinh chỉ tăng/giảm/đổi màu, không lật được bản chất chính tinh (trừ các cách cục đặc biệt).
3. **Độ sáng quyết định chiều** — cùng một sao, Miếu và Hãm cho kết luận trái ngược.
4. **Cách cục đè lên luận từng sao** — khi đủ điều kiện một cách cục, kết luận của cách cục ưu tiên hơn.
5. **Hạn chỉ kích hoạt cái gốc đã có** — lá số gốc xấu về tài thì đại hạn tốt cũng chỉ "đỡ hơn", không thành đại phú.

---

## Lớp 1 — Nền

| Yếu tố | Cách xét | Ý nghĩa | Dữ liệu |
|---|---|---|---|
| Âm dương thuận/nghịch lý | Dương Nam/Âm Nữ = thuận lý; Âm Nam/Dương Nữ = nghịch lý. Thêm: Mệnh đóng cung dương (Tý Dần Thìn…) với người dương là "âm dương thuận" | Thuận thì đời ít trắc trở hơn | `an_sao.py` → `am_duong_nam_nu` |
| Mệnh – Cục | So hành Bản Mệnh (nạp âm năm sinh) với hành Cục | Cục sinh Mệnh: tốt nhất (được nâng đỡ); tương hòa: tốt; Mệnh khắc Cục: vất vả nhưng làm chủ; Mệnh sinh Cục: hao sức; Cục khắc Mệnh: xấu nhất | `cau_hinh_luan_giai.json → menh_cuc` |
| Sao chủ Mệnh – Bản Mệnh | Hành chính tinh thủ Mệnh vs hành Bản Mệnh | Sao sinh Mệnh / đồng hành: phát huy tốt; sao khắc Mệnh: giảm lực tốt của sao | idem |
| Cung Thân | Thân cư cung nào (Mệnh / Phúc / Quan / Di / Tài / Phu Thê) | Hậu vận (khoảng sau 30) thiên về lĩnh vực đó | `cung_chuc.json` |

## Lớp 2 — Cấu trúc

**B2.1 Chủ tinh.** Lấy chính tinh tại cung. Nếu **Vô Chính Diệu** (không chính tinh): mượn chính tinh cung xung chiếu, **giảm hệ số** (mặc định 0.7), và xét thêm Tuần/Triệt, Nhị/Tam/Tứ Không (VCD gặp Không lại là tốt — "VCD đắc tam không phú quý khả kỳ").

**B2.2 Bộ sao.** Xác định bộ chính tinh thuộc nhóm nào: Tử Phủ Vũ Tướng (ổn định, quản lý), Sát Phá Tham (biến động, mạo hiểm), Cơ Nguyệt Đồng Lương (hành chính, chuyên môn), Cự Nhật (ngôn luận). Dữ liệu: `chinh_tinh_tai_chi.json` — 38 bộ sao × vị trí địa chi = toàn bộ 120 trường hợp có thể xảy ra + Vô Chính Diệu.

**B2.3 Độ sáng.** Hệ số theo M/V/Đ/B/H (mặc định 1.0 / 0.9 / 0.7 / 0.4 / −0.5). Hãm âm = sao **đổi chiều**: tính tốt của sao thành mặt trái.

**B2.4 Tam phương tứ chính.** Trọng số ảnh hưởng (mặc định, **là lựa chọn mô hình của mình, cần hiệu chỉnh** bằng lá số thật):
- bản cung 1.0 · xung chiếu 0.8 · mỗi cung tam hợp 0.6 · mỗi cung giáp 0.3 (chỉ dùng cho các cách "giáp").

**B2.5 Cách cục.** Chạy toàn bộ `cach_cuc.json`. Mỗi cách có điều kiện **thành cách** và điều kiện **phá cách** (VD: Quân Thần Khánh Hội thành khi Tử Vi + Tả Hữu; phá khi gặp Tứ Sát / Không Kiếp). Phá cách → kết luận đảo hoặc giảm mạnh.

## Lớp 3 — Điều chỉnh

| Yếu tố | Tác động mặc định |
|---|---|
| Lục cát (Tả Hữu, Xương Khúc, Khôi Việt) | Cộng điểm; **đi đôi** mạnh gấp rưỡi (Tả+Hữu, Xương+Khúc, Khôi+Việt cùng hội) |
| Lộc Tồn, Hóa Lộc, Thiên Mã | Tài lộc; Lộc + Mã = Lộc Mã giao trì |
| Lục sát (Kình Đà, Hỏa Linh, Không Kiếp) | Trừ điểm; đắc địa thì giảm hại và có thể thành cách (VD: Không Kiếp đắc địa Dần Thân Tỵ Hợi) |
| Hóa Kỵ | Trừ ở cung nó đóng; **gặp sao hãm càng nặng**; một số vị trí Kỵ đắc (Sửu Mùi Thìn Tuất…) giảm hại |
| Tuần / Triệt | Giảm lực sao trong cung (mặc định ×0.5). Sao hãm / sát tinh gặp Tuần Triệt → giảm hại (thành tốt tương đối). Triệt nặng ở tiền vận (<30), Tuần nặng hậu vận |
| Vòng Tràng Sinh | Tràng Sinh, Lâm Quan, Đế Vượng: tăng nhẹ; Bệnh, Tử, Mộ, Tuyệt: giảm nhẹ (hệ số nhỏ 0.1) |
| Đào Hoa, Hồng Loan, Thiên Diêu | Tình cảm, giao tế; đi với Tham Lang / Liêm Trinh hãm → sa đà |

## Lớp 4 — Thời gian

1. **Đại hạn** (10 năm): cung đại hạn coi như "Mệnh tạm" — làm lại Lớp 2–3 cho cung đó và tam phương của nó, **nhân với nền của lá số gốc** (gốc tốt + hạn tốt = phát; gốc xấu + hạn tốt = đỡ; gốc tốt + hạn xấu = trầy trật nhưng không đổ).
2. **Lưu niên**: Lưu Thái Tuế (chi năm xem), lưu Tứ Hóa theo can năm xem, lưu Lộc Tồn / Kình / Đà / Thiên Mã. Năm nào lưu sát tinh trùng với sát tinh gốc ở Mệnh/hạn → năm xấu.
3. **Tiểu hạn**: bổ sung cho lưu niên.
4. (Tuỳ chọn, Bắc phái) Tứ Hóa của can cung đại hạn, Tứ Hóa phi tinh.

## Gom kết luận

Mỗi lĩnh vực (tính cách, sự nghiệp, tài, hôn nhân, sức khỏe, …) = cung chức tương ứng (`cung_chuc.json → linh_vuc`). Bộ luận:
1. Tính **điểm** = Σ (điểm sao × độ sáng × trọng số vị trí × hệ số Tuần/Triệt).
2. Gom **các quy tắc khớp** (cách cục, sao tại cung, tổ hợp) → mỗi quy tắc cho một **nhận định** + **lý do**.
3. Mâu thuẫn (một quy tắc nói tốt, một nói xấu): **giữ cả hai** và trình bày dạng "mặt mạnh / mặt trái", ưu tiên quy tắc có trọng số cao và có nhiều nguồn đồng thuận hơn.
4. Đầu ra mỗi câu luận đều mang `[ID quy tắc]` → người dùng bấm vào thấy vì sao.

## Tổng hợp đa phái (vì chưa chọn phái)

- Mỗi quy tắc gắn `phai` + danh sách `nguon`. Quy tắc có **≥ 2 nguồn độc lập đồng thuận** → `do_tin_cay` cao.
- Chỗ an sao khác nhau giữa các phái (`bien_the.json`) → engine **an theo phương án đa số**, đồng thời tính phương án thiểu số; nếu phương án thiểu số làm **đổi kết luận** của một cung quan trọng thì báo "theo phái X thì …".
- Đây là cách "tổng hợp nhất có thể" mà vẫn trung thực: không giả vờ có một đáp án duy nhất khi các nguồn thực sự bất đồng.
