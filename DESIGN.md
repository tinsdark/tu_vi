# Design: Đêm thiên văn

Ghi lại từ giao diện đã dựng (`web/src/styles.css`, `web/src/ui/*`). Token nằm ở `:root` của `styles.css`; một bộ token cho cả tối (mặc định) và sáng nhờ `light-dark()`.

## Thế giới

Tấm bản đồ sao: nền chàm đậm, nét kẻ mảnh 1px, một màu vàng đồng làm điểm nhấn duy nhất. Sao nền chỉ hiện ở chế độ tối (mẫu tự vẽ `assets/sao-nen.svg`, dùng làm mặt nạ, độ mờ 50%). Chế độ sáng là giấy xanh nhạt, không có sao.

Màu chỉ mang nghĩa: ngũ hành (màu sao), tốt/xấu (xanh/đỏ), độ tin cậy (xanh/vàng/xám), vàng đồng cho điểm nhấn và hành động chính. Không có màu trang trí.

## Màu

| Token | Tối | Sáng | Dùng cho |
|---|---|---|---|
| `--nen` | #0b1020 | #eef1f9 | nền trang |
| `--mat` / `--mat-2` | #121a38 / #19224a | #fff / #f4f6fc | bảng, ô nổi |
| `--vien` / `--vien-manh` | #263059 / #3a4678 | #d9deee / #bcc4de | nét kẻ mảnh / viền ô |
| `--muc` / `--mo` | #e8ebf7 / #a5adcf | #10163a / #4f5878 | chữ / chữ phụ |
| `--dong` | #e3bb6c | #7a5510 | chữ, nét nhấn (vàng đồng) |
| `--dong-nen` | #e3bb6c | #d7a640 | mảng tô (nút chính, công tắc bật) |
| `--tot` / `--xau` / `--canh` / `--thong` | #6fd6a1 / #ff9087 / #f4b860 / #93b4ff | #17703d / #b3261e / #8a5300 / #2150b8 | tốt / xấu / cảnh báo / liên kết |
| `--h-kim … --h-tho` | xám lam, lục, lam, đỏ cam, vàng | đậm hơn cùng hue | màu sao theo ngũ hành |

Tương phản chữ ≥ 4.5:1 ở cả hai chế độ (đã tính tay cho `--mo` và `--dong`; chưa chạy công cụ đo tự động trên trang đã render).

## Chữ

- Giao diện: **Be Vietnam Pro** 400/500/600/700, tự host (`@fontsource`).
- Tiêu đề, tên cung, chính tinh: **Bricolage Grotesque** (biến thiên), tự host.
- Cả hai có subset tiếng Việt. Số dùng `tabular-nums` toàn trang.
- Thang: h1 `clamp(1.75rem…2.6rem)` (màn hình đầu: tới 4.4rem), h2 1.375rem, h3 1.15rem, thân 16px/1.6, chữ phụ .9rem. Trong bàn cờ: chính tinh 15.5px, phụ tinh 12.5px, nhãn 10–11px.

## Hình và bố cục

- Đường kẻ 1px thay cho thẻ. Khối nội dung (`.khoi`) chỉ có một đường kẻ trên; danh sách chủ đề và 12 cung là một khung liền với các hàng ngăn bằng đường kẻ, không phải lưới thẻ.
- Bán kính: 14px khung lớn (12px mobile), 9–10px nút và ô nhập, 3px nhãn nhỏ.
- Bàn cờ lá số: lưới 4×4 với `gap: 1px` trên nền `--vien-manh` để có đường kẻ sắc nét. Mệnh = hình thoi đặc, Thân = hình thoi rỗng ở đầu tên cung. Ô đại hạn có viền trong 1.5px `--thong`.
- Nhận định tốt/xấu mang dấu `+`/`−` (kèm chữ cho trình đọc màn hình), màu không là kênh duy nhất.
- Chấm độ tin cậy: 12px, vùng bấm mở rộng 14px mỗi phía bằng `::before`.

## Chuyển động

Một khoảnh khắc: lá số hiện từng ô theo thứ tự cung (28ms mỗi ô, tổng khoảng 0.5s, ease-out mũ). Ngăn kéo trượt vào, thành bảng dưới trên điện thoại. Mọi chuyển động nằm trong `prefers-reduced-motion: no-preference`.

## Thành phần

- Nút: `.nut` (phụ), `.nut-chinh` (vàng đồng đặc, một nút mỗi màn hình), `.nut-chu` (liên kết).
- Công tắc `input[role="switch"]`, nhóm chọn dạng phân đoạn (radio thật, ẩn dấu tròn).
- Icon: bộ một nét 24px nét 1.6 trong `ui/chung.tsx` (`Icon`), logo `DauHieu`.
- Giao diện sáng/tối/theo thiết bị: nhóm ba nút icon ở đầu trang, mặc định tối.

## Không làm

Không kicker phía trên tiêu đề, không viền màu một bên, không chữ gradient, không glass, không thẻ icon + tiêu đề + chữ đồng cỡ, không emoji thay icon.
