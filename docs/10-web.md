# 10 — Web (`web/`)

Vite + React + TypeScript. **Toàn bộ tính toán chạy trên trình duyệt**: đổi lịch, an sao, luận giải, vẽ lá số. Chỉ nút “Viết lại bằng AI” cần máy chủ (để giữ API key).

## 1. Cấu trúc

```
web/
  src/engine/     engine TypeScript — port 1:1 từ tools/tuvi/*.py (Python là bản tham chiếu)
    lichAm.ts anSao.ts luanGiai.ts vietVan.ts   ← lịch, an sao, luận, văn mẫu + hậu kiểm
    kb.ts quyTac.ts boCuc.ts veLaSo.ts nhap.ts  ← tri thức, tra quy tắc/độ tin cậy, bố cục, SVG, kiểm tra input
    index.ts      tinhLaSo(nhap) → lịch + lá số + báo cáo
  src/ui/         React: FormNhap, BanCo (lưới 12 cung), TabTongQuan, TabCung, TabHan, NganKeo (chi tiết sao/cung/quy tắc)
  src/lib/        localStorage (lá số đã lưu), mã hóa URL, xuất PNG/SVG
  server/         máy chủ nhỏ: /api/health, phục vụ dist/ (không còn AI)
  test/           parity.test.ts (TS = Python), server.test.ts, nhap.test.ts, hienthi.test.ts
data/knowledge/   tri thức JSON — dùng CHUNG với Python (import qua alias @kb)
```

## 2. Chạy

```bash
cd web && npm ci
npm run dev                    # giao diện, http://localhost:5173 (proxy /api → :8787)
npm run server                 # web tĩnh (sau npm run build), PORT mặc định 8787
npm test                       # parity + server + giao diện (cần python3 trong PATH)
npm run build                  # dist/
```

## 3. Parity TS = Python

Hai bản engine được giữ khớp bằng test, không bằng niềm tin: `test/setup.ts` chạy `tools/golden_dump.py` (seed cố định) sinh dữ liệu chuẩn từ Python, `test/parity.test.ts` so với bản TS:

| Phần | Số ca (GOLDEN_N=300 mặc định; 2000 ở lần kiểm lớn) | Điều kiện đạt |
|---|---|---|
| `duongSangAm` | 900 ngày ngẫu nhiên + quét liên tục các tháng nhạy cảm (Tết 1968 Bắc/Nam, 2054, 1985, 2057, năm nhuận) | trùng 100% |
| `tuDuongLich` | 900 ca đủ quy ước, múi giờ lịch sử, giờ mặt trời, cảnh báo + ca quanh các mốc đổi giờ 1943–1975 | trùng toàn bộ kết quả |
| `anLaSo` | 1.200 lá số, 60% có profile phái ngẫu nhiên | trùng mọi sao, Tứ Hóa, Tuần/Triệt, đại hạn |
| `baoCao` | 75 lá số (có ca quá 120 tuổi, không đại hạn), mọi profile | trùng cả cây JSON (điểm nội tại, nhận định, hạn + kết luận nên/tránh, lưu nguyệt, chủ đề) |
| `vietMau`, `hauKiem`, `tapId` | như trên | trùng từng ký tự |

Lần chạy `GOLDEN_N=2000`: 6.000 ngày + 6.000 ca lịch đầy đủ + 8.000 lá số + 500 báo cáo, đều trùng. Kiểm bằng đột biến: sửa một hằng số bất kỳ trong TS thì test đỏ.

**Những bẫy khi port Python → JS** (đã xử lý, ghi lại để lần sau không dẫm lại):
- `%` và `//` với số âm: dùng `mod`, `floorDiv` (`py.ts`).
- `round()` của Python làm tròn half-to-even trên giá trị thập phân chính xác của double: `pyRound`, `toFixedPy`.
- Dict khóa số của Python giữ thứ tự chèn, object JS khóa số tự sắp tăng dần → thứ tự duyệt và thứ tự cộng số thực có thể đổi. Chỗ nào có thứ tự quan trọng dùng mảng/Map.
- `-0.0` (Python in `-0.0`, JS mất dấu khi serialize) → test chuẩn hóa trước khi so.
- Múi giờ: không dùng `Intl` của trình duyệt mà nhúng bảng mốc giờ pháp định (`src/data/mui_gio_vn.json`, sinh bằng `tools/sinh_mui_gio.py`) để kết quả giống nhau trên mọi máy.
- Khi port phát hiện một lỗi thật trong Python: điều kiện tính “sao phá” của sao lưu niên (`'Lưu Kình Dương'`) làm cộng nhầm lúc điểm dương; đã sửa ở Python rồi mới port.

## 4. Giao diện

- 4 tab: **Lá số** (lưới 12 cung theo địa bàn truyền thống; điện thoại chuyển 2 cột), **Tổng quan** (6 chủ đề + nền + Thân + văn xuôi), **12 cung**, **Hạn** (đại hạn, tiểu hạn, lưu niên, lưu nguyệt; đổi năm ngay).
- Bấm tên sao → ý nghĩa, độ sáng 12 cung, nghĩa theo từng cung. Bấm tên cung → luận cung. Bấm chấm màu cạnh câu luận → quy tắc, điều kiện, nguồn.
- **Chấm màu độ tin cậy** (Q13): xanh = ≥ 2 nguồn đối chiếu · vàng = 1 nguồn web · xám = AI tổng hợp / mô hình tự đặt. Là nhãn dữ liệu, không phải xác suất đúng.
- Form: ngày/giờ dương lịch, giới tính, nơi sinh (Bắc/Nam), năm xem; “Nâng cao”: các quy ước Q9 + 9 chỗ phái an sao khác nhau.
- Lưu lá số trong trình duyệt (localStorage); chép liên kết (`#c=…` mã hóa dữ liệu sinh, **không có họ tên**); tải PNG/SVG; in/PDF; sáng/tối.
- Truy cập được: nhãn cho mọi ô nhập, tab đúng vai trò ARIA, Esc đóng ngăn kéo, focus trả về chỗ cũ, tôn trọng `prefers-color-scheme`.

## 5. Văn xuôi (không dùng AI)

Từ doc11, **toàn bộ đường AI đã bỏ** (nút “Viết lại bằng AI”, “Dùng AI khác”, `POST /api/viet-van`, `server/llm.ts`, `kiem-llm.ts`, SDK Anthropic, cờ `HIEN_AI`). Văn xuôi do chính engine ghép từ các nhận định đã luận (`web/src/engine/vanNen.ts`, dữ liệu câu nối và mẫu ở `data/knowledge/van_phong.json`, danh sách câu hỏi ở `cau_hoi.json`).

- Mỗi câu kết thúc bằng mã quy tắc `[ID]`; `hauKiem` bỏ câu không có mã hợp lệ, `hauKiemTheoMuc` bỏ câu trích mã của mục khác. Văn của engine luôn qua hậu kiểm với 0 câu bị bỏ (có test).
- Các mục: Tổng quan, 6 chủ đề, Hạn năm, **Tổng kết** (mảng thuận nhất / cần chú tâm nhất / cung Thân), **Những câu hỏi thường gặp** (21 câu hỏi, chỉ hỏi khi engine có luật để trả lời).
- Server (`server/app.ts`) chỉ còn phục vụ web tĩnh và `/api/health`. Header an toàn (CSP, nosniff, no-referrer, X-Frame-Options), chặn path traversal.

## 6. Triển khai

| Cách | Làm gì | Ghi chú |
|---|---|---|
| **Một container** (đề xuất) | `docker build -f web/Dockerfile -t tu-vi .` rồi `docker run -p 8787:8787 tu-vi` | web tĩnh. Chưa chạy thử Docker trong môi trường dev |
| **GitHub Pages** | Bật Pages (Source: GitHub Actions), đặt biến repo `DEPLOY_PAGES=true` và `PAGES_BASE_PATH=/tu_vi/` | Chỉ web tĩnh, **không có AI** (nút tự ẩn). Có thể trỏ `VITE_API_BASE` tới container ở nơi khác + `TUVI_CORS_ORIGIN` |
| Node host bất kỳ | `npm ci && npm run build && npm run server` | |

CI (`.github/workflows/ci.yml`): test Python, kiểm dữ liệu sinh ra không lệch JSON, typecheck, test web, build; job Pages chỉ chạy khi bật như trên.

## 7. Quyền riêng tư và pháp lý

- Mọi tính toán chạy trong trình duyệt; ngày giờ sinh không rời máy người dùng (server chỉ phục vụ file tĩnh).
- Chưa có tài khoản, chưa lưu phía server → chưa chạm nghĩa vụ lưu trữ dữ liệu cá nhân (Nghị định 13/2023). Khi thêm tài khoản/lưu server phải làm chính sách dữ liệu và xin đồng ý.
- Câu miễn trừ đã có ở chân trang. Web công khai thu phí thì vẫn nên hỏi luật sư (docs/05 Q6).

## Đối chiếu với lá số mẫu tracuutuvi.com (2026-10-22)

So từng ô 12 cung với 1 PDF của tracuutuvi.com (Quý Mùi, 11/5/2003 14:45, nam, xem năm 2026):

- **Vị trí sao: khớp 100%** (chính tinh, phụ tinh, vòng sao, Tuần/Triệt, sao lưu niên).
- **Sai thật, đã sửa:** lưu nguyệt. Web mẫu khởi tháng Giêng từ **cung tiểu hạn**, engine cũ khởi từ cung Thái Tuế. Nay mặc định `profile.luu_nguyet = "tieu_han"`, dị bản `thai_tue`. Test `thongtin.test.ts` khớp 4 ô `Th.n` của PDF. Mới có 1 lá số đối chiếu.
- **Thiếu hiển thị, đã thêm** (không đổi luận giải): can chi từng cung, màu sao theo ngũ hành (có công tắc về xanh/đỏ), `(Đ)(H)…` cho mọi sao có độ sáng, sao lưu niên bật mặc định và có trong ảnh PNG/SVG, chi năm tiểu hạn + `Th.n` ở chân ô, ô giữa (nạp âm, quan hệ Cục–Mệnh, can chi tháng/ngày/giờ, chủ mệnh/chủ thân, lai nhân, thân cư).
- **Chủ mệnh — các nguồn bất đồng, đã đổi mặc định:** web tra Chủ mệnh theo **chi của cung Mệnh** (Mệnh Sửu → Cự Môn; cách của iztro và bảng truyền thống), Chủ thân theo chi năm sinh. tracuutuvi.com tra Chủ mệnh theo chi năm sinh (Mùi → Vũ Khúc; khớp 2 lá số mẫu) và lasotuvi tra theo biến `canNam` (có vẻ lỗi) nên các bên lệch nhau ở nhiều lá số. Đổi `CHU_MENH_THEO` trong `web/src/engine/thongTin.ts` để quay về cách tracuutuvi. "Chủ mệnh" khác với **chính tinh thủ Mệnh** (Thái Dương/Thái Âm ở lá số mẫu); giao diện không còn gọi chính tinh thủ Mệnh là "sao chủ Mệnh".
- **Chưa chắc:** cách viết quan hệ Cục–Mệnh khi không phải "sinh".
- **Còn lệch:** Văn Xương tại Mão (web mẫu: Đắc, ta: Bình, chưa đủ 2 nguồn). **Chưa làm:** cân lượng (thiếu bảng tháng/ngày đã kiểm).

### Lá số mẫu thứ 2 (Quý Mùi, 28/3/2003 13:45, nam)

Vị trí sao khớp 100%; can chi cung, chi năm tiểu hạn, `Th.n` của cả 12 cung khớp; lai nhân (Điền Trạch) khớp. Hai chỗ sửa sau lần này: Văn Xương tại Mão đặt lại **Đắc** (lasotuvi và 2 lá số mẫu cùng ghi), quan hệ cùng hành viết "bình hòa". Còn lệch về độ sáng: web mẫu có thêm nhãn cho Tang Môn (Đ ở Dậu), Thiên Hình (Đ ở Tuất), Hóa Lộc/Quyền (Đ), Hóa Kỵ (H ở Dậu), và không ghi Thiên Hư ở Sửu (lasotuvi: Đắc). Mỗi ô mới có 1 điểm dữ liệu, chưa đủ dựng bảng. Cân lượng: 2 lá số mẫu (3 lượng 3 chỉ; 4 lượng 0 chỉ) cùng tuổi Quý Mùi giờ Mùi, khác tháng/ngày — chưa đủ để suy bảng.

### Lá số mẫu thứ 3 (nữ, Quý Mùi, 5/12/2003 2:30) và cân lượng

Vị trí sao, can chi cung, chi năm tiểu hạn (nữ nghịch), `Th.n`, lai nhân (Mệnh), quan hệ Cục–Mệnh: khớp hết. Đã thêm **cân lượng** (bảng tracuutuvi.com): khớp cả 3 lá số mẫu (3 lượng 3 chỉ, 4 lượng 0 chỉ, 3 lượng 9 chỉ). Văn Xương tại Dậu đặt lại Đắc theo web mẫu (1 nguồn). Nhãn độ sáng web mẫu có mà ta chưa có (Tang Môn, Thiên Hình, Hóa Lộc/Quyền/Kỵ, Thiên Diêu Hợi) được ghi lại ở `data/doi_chieu/tracuutuvi_do_sang_quan_sat.json`, chưa dùng chấm điểm.

### Lá số mẫu thứ 4 (dương nữ, Giáp Thân, 11/1/2005 6:30 = 2/12/2004 âm)

Khớp: vị trí sao, can chi cung, chi năm tiểu hạn, `Th.n`, lai nhân (Mệnh), chủ mệnh Liêm Trinh theo chi năm Thân (cách tracuutuvi; nay web mặc định tra theo cung Mệnh nên cho Lộc Tồn, xem mục "Chủ mệnh" ở trên) và chủ thân Thiên Lương, "Mệnh Thủy khắc Cục Hỏa", cân lượng 3 lượng 0 chỉ (cân lượng nay khớp 4/4, có cả năm Giáp). Còn lệch chỉ ở nhãn độ sáng, đã ghi vào `data/doi_chieu/tracuutuvi_do_sang_quan_sat.json`: Thiên Hình web mẫu ghi Hãm ở Thân (lasotuvi: Đắc), Thiên Hư Dần Hãm, Hóa Kỵ luôn Hãm, Hóa Quyền Đắc ở Tuất nhưng Hãm ở Tý/Thân.
