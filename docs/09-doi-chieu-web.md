# 09 — Đối chiếu tri thức với web (đọc toàn văn, 2026-10-22)

Môi trường đã mở mạng → đọc được nguyên trang, không còn phụ thuộc đoạn trích tìm kiếm. Quy tắc giữ nguyên như `docs/02b`: một ô chỉ "chốt" khi ≥ 2 nguồn **độc lập** khớp. Trang nào chép lại nguồn khác thì tính là 1 phiếu.

## 1. Độ sáng (`data/knowledge/do_sang_chot.json`)

| Sao | Trước | Sau | Căn cứ |
|---|---|---|---|
| **Thiên Phủ** | lasotuvi không có bảng | M: Tý Dần Ngọ Thân · V: Thìn Tuất · Đ: Tỵ Mùi Hợi · B: Sửu Mão Dậu | hocvienlyso + nhanso + tracuulasotuvi + lichngaytot khớp. hocvienlyso ghi "Đắc: Mùi **Tý** Hợi" — Tý đã ở mục Miếu Vượng nên đọc là Tỵ (lỗi gõ) |
| **Văn Xương** | bảng lasotuvi (nghi sai) | Đ: Thìn Tuất Sửu Mùi Tỵ Hợi · H: Dần Ngọ · B: Tý Mão Thân Dậu | Đắc 6 cung: Thái Thứ Lang (qua trannhatthanh), tuvi.cohoc, lyso. Hãm Dần Ngọ: Đại Toàn + ayen. **Tý Mão Thân Dậu: không 2 nguồn nào khớp → đặt Bình, ghi nghi vấn** |
| **Văn Khúc** | như trên | Đ: 6 cung trên · H: Tý Dần Ngọ Thân · B: Mão Dậu | Đắc: TTL + cohoc. Hãm: cohoc (+ Đại Toàn ở Dần Ngọ). Mão Dậu nghi vấn |
| **Tử Vi** Tý/Hợi | Bình (lasotuvi) vs Đắc (nguồn 2) | **Giữ Bình** | lasotuvi + thaiam + tracuulasotuvi + lyso: Bình; chỉ hocvienlyso ghi Đắc |
| 11 chính tinh khác | lasotuvi | giữ | hocvienlyso (bảng đủ 14 sao) **khớp lasotuvi 100%** ở mức Miếu/Vượng gộp – Đắc – Bình – Hãm. Còn đúng 1 ô lệch: Thiên Cơ tại Mùi (lasotuvi Đắc, HV Miếu/Vượng) |
| Sát tinh | lasotuvi | giữ | Khớp mô tả bằng lời của thaiam |

**Phát hiện:** bảng của thaiam.vn (sát tinh + Xương Khúc) **trùng 100% lasotuvi**, kể cả các ô nghi sai → thaiam chép từ phần mềm dùng lasotuvi, không phải nguồn độc lập.

**Phụ tinh "thiếu độ sáng" không phải lỗ hổng:** truyền thống VN chỉ chia đắc/hãm cho sát tinh và một số sao (Mã, Hình, Diêu, Khốc Hư, Hao, Kỵ). Cát tinh như Tả Hữu, Khôi Việt, Lộc Tồn, Tam Thai Bát Tọa không có thang miếu hãm.

Engine giờ dùng độ sáng cả cho cát tinh có bảng: Xương/Khúc hãm chỉ còn 30% lực.

## 2. Thiên Giải — chốt **không nhảy cung**

hocvienlyso (*Tự học tử vi bài 13*) và tuvi.cohoc (nid-7000) đều an "Thân là tháng Giêng, đếm thuận tới tháng sinh", không nhắc nhảy cung. Bản nhảy cung chỉ thấy trong lasotuvi (chính tác giả ghi không chắc). Giữ làm dị bản `profile.thien_giai = "nhay_cung"`.

## 3. Lưu Hà, Thiên Trù — đã an, có dị bản

| Can | Lưu Hà (TTL, mặc định) | Thiên Lương / Việt Viêm Tử | Trình Minh Đức (Ngũ Hành) |
|---|---|---|---|
| Đinh | Thìn | Thân | Thân |
| Canh | Thân | Thìn | Mão |
| Tân | Mão | Mão | Thìn |
| 7 can còn lại | Giáp Dậu, Ất Tuất, Bính Mùi, Mậu Tỵ, Kỷ Ngọ, Nhâm Hợi, Quý Dần — khớp mọi nguồn |||

Nguồn: [lyso.vn](https://lyso.vn/xem-tu-vi/lai-mot-van-de-tranh-cai-trong-tu-vi-lan-nay-la-cach-an-luu-ha-voi-tuoi-dinh-va-canh-t102897/), [tuvisonkhiem](https://tuvisonkhiem.vn/thu-vien/sao/luu-ha/), lasotuvi.
Thiên Trù: 9/10 can khớp lasotuvi và iztro; can Quý: lasotuvi Tuất (mặc định), iztro Hợi.

## 4. Cách cục (`cach_cuc.json`)

Đọc toàn văn sonchu.vn (bản dịch *Tử Vi Đẩu Số Cách Cục Luận*, 50 cách có điều kiện), tuvi.cohoc, lyso, tracuutuvi.

- Xác nhận tên/điều kiện: **5 → 40 / 57 cách** (`xac_nhan_web: true`, có link). 17 cách còn lại (phần lớn hung cách và các cách tự đặt cho cung ngoài Mệnh) chưa thấy trên web.
- **Sửa 8 cách sai điều kiện** (ghi trong trường `doi_chieu` từng cách):

| Cách | Sai ở đâu |
|---|---|
| Phủ Tướng triều viên | Bản cũ loại trường hợp Phủ/Tướng đóng ngay Mệnh |
| Cơ Nguyệt Đồng Lương | Phải đủ 4 sao ở Mệnh–Tài–Quan, không tính xung chiếu |
| Nhật Nguyệt tịnh minh | Chỉ có 2 cấu hình cụ thể; bản cũ là suy rộng |
| Tọa quý hướng quý | Khôi/Việt: một ở Mệnh, một ở Thân hoặc Thiên Di — không phải "cả hai trong tam phương" |
| Thạch trung ẩn ngọc | Chỉ tuổi Tân, Quý (Cự hóa Lộc/Quyền) |
| Anh tinh nhập miếu | Tuổi Bính, Mậu là phá cách |
| Hỏa Tham / Linh Tham | Hỏa/Linh ở tam phương cũng thành cách; bỏ điều kiện độ sáng tự đặt |
| Mã đầu đới kiếm → **đới tiễn** | Sai tên; cần Đồng Âm hoặc Tham Lang ở Ngọ cùng Kình |

- Thêm 10 cách: Nguyệt sinh thương hải (Điền Trạch), Nhật Nguyệt chiếu bích (Điền Trạch), Lộc hợp uyên ương, Cực hướng Ly minh, Văn Lương chấn kỷ, Cự Cơ đồng lâm (có nguồn); Lộc Mã ở Thiên Di, Đào Hồng Hỷ hội Phu Thê, Sát tinh hội Tật Ách, Phúc thọ ở Phúc Đức (chưa có nguồn).
- **Phá cách chung:** nguồn nói "cách tốt gặp tứ sát, Không Kiếp, Kỵ hội chiếu thường thành phá cách". Thử nghĩa đen (đếm tam phương) trên 3.000 lá số: 60–90% cách tốt bị phá, vì trung bình tam phương đã có khoảng 2,3 sao hung → vô nghĩa. Chọn nghĩa hẹp: ≥ 2 sao hung ở bản cung + xung chiếu. **Đây là lựa chọn mô hình.**

## 5. Phụ tinh theo cung chức (`phu_tinh_tai_cung_chuc.json`)

18 sao (lục cát, Lộc Tồn, Thiên Mã, Tứ Hóa, lục sát) × 12 cung = 216 câu, **viết lại bằng lời mình** sau khi đọc trang từng sao trên tracuulasotuvi.com (93 trang, tải về để đối chiếu, không chép vào repo). Nhãn `draft_ai_doi_chieu_1_nguon_web`: trang nguồn hay dẫn "Theo Tử Vi Đẩu Số Toàn Thư…" mà không ghi trang, không kiểm chứng được.

## 6. Việc web không giải quyết được

- Trọng số và cách cộng điểm: không sách/web nào cho con số. Vẫn chỉ có thể kiểm bằng lá số người thật.
- Nội dung `chinh_tinh_tai_chi.json`, `chinh_tinh_tai_cung_chuc.json`, `tu_hoa_luan.json`: chưa đối chiếu từng câu (chính tinh × 12 cung = 168 câu). Có thể làm tiếp theo cách mục 5.
- Thiên Quý (Văn Khúc đếm nghịch hay thuận), chiều an Hỏa/Linh: chỉ thấy khác biệt Việt–Trung qua iztro, chưa có trang VN ghi rõ.
