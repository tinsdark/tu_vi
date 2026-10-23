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
  server/         máy chủ nhỏ: /api/viet-van, /api/health, phục vụ dist/
  test/           parity.test.ts (TS = Python), server.test.ts, nhap.test.ts, hienthi.test.ts
data/knowledge/   tri thức JSON — dùng CHUNG với Python (import qua alias @kb)
```

## 2. Chạy

```bash
cd web && npm ci
npm run dev                    # giao diện, http://localhost:5173 (proxy /api → :8787)
npm run server                 # API + web tĩnh (sau npm run build), PORT mặc định 8787
ANTHROPIC_API_KEY=... npm run server   # bật AI viết văn
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

## 5. API viết văn (tùy chọn)

**Không cần API key để dùng web.** Không có key thì web tự ghép văn từ các nhận định (xem `docs/07`), nút “Viết lại bằng AI” tự ẩn, và chi phí bằng 0.

`POST /api/viet-van` — body là **dữ liệu sinh** (cùng hình dạng form), không phải báo cáo hay prompt:

```json
{"nam":1990,"thang":6,"ngay":8,"gio":8,"phut":30,"gioi_tinh":"nam","mien":"nam","nam_xem":2026,"quy_uoc":{},"profile":{}}
```
Trả `{van, che_do: "llm"|"mau", bo, ly_do?}`. Luôn trả 200 kèm văn mẫu khi AI không dùng được (kèm `ly_do`); 400 khi dữ liệu sai; 429 khi hết lượt.

Thiết kế an toàn:
- Server **tự lập lá số và luận** từ dữ liệu sinh đã kiểm tra → client không đưa được nội dung tùy ý vào prompt, nên không dùng được như proxy LLM miễn phí. Họ tên không bao giờ được gửi/ghi.
- Đầu ra LLM qua `hauKiem`: câu không có mã quy tắc hợp lệ bị bỏ. Văn rỗng sau hậu kiểm → rơi về văn mẫu.
- Giới hạn: body ≤ 8 KB, 20 lượt AI/IP/giờ (`TUVI_GIOI_HAN_MOI_GIO`), tối đa 4 lượt đồng thời; cache theo báo cáo (cùng dữ liệu sinh không gọi lại).
- Header an toàn (CSP, nosniff, no-referrer, X-Frame-Options); chặn path traversal khi phục vụ file.
- Model `claude-opus-5-5` (đổi bằng `TUVI_MODEL`), `effort: medium`, kèm `fallbacks: "default"` (server-side fallback khi classifier từ chối); `stop_reason: refusal` → văn mẫu.

Biến môi trường: `ANTHROPIC_API_KEY`, `PORT`, `TUVI_MODEL`, `TUVI_GIOI_HAN_MOI_GIO`, `TUVI_TIN_CAY_PROXY=1` (sau reverse proxy), `TUVI_CORS_ORIGIN` (khi web ở host khác), và phía build web `VITE_API_BASE` (địa chỉ API khi web và API khác origin).

**Hậu kiểm theo mục:** mỗi câu LLM viết phải có mã hợp lệ VÀ mã đó phải thuộc đúng mục đang viết (mục Tài chính chỉ được trích mã của Tài chính; Tổng quan: nền/Thân/xếp loại; Hạn năm: mã hạn). LLM kéo sao mục khác sang thì câu bị bỏ — chặn đúng lỗi gán sai cung. Payload gửi LLM đã rút gọn (`rutGonChoLlm`), prompt (`HUONG_DAN`) mô tả cấu trúc JSON và quy tắc theo mục. Parity Python = TS cho phần này nằm trong `parity.test.ts`.

**Kiểm bằng Claude thật:** `ANTHROPIC_API_KEY=... npm run kiem:llm [số lá số]` gọi Claude trên vài lá số mẫu, in tỉ lệ câu bị bỏ, mục thiếu, câu chứa lời cấm (percentile…), thoát mã 1 nếu vượt ngưỡng.

**Chưa kiểm:** nhánh gọi Claude thật (môi trường dev không có API key; chất lượng văn AI chưa được đánh giá). Đã kiểm chữ ký SDK bằng `tsc` và toàn bộ luồng quanh nó bằng LLM giả trong `test/server.test.ts`; chạy `npm run kiem:llm` khi có key.

## 6. Triển khai

| Cách | Làm gì | Ghi chú |
|---|---|---|
| **Một container** (đề xuất) | `docker build -f web/Dockerfile -t tu-vi .` rồi `docker run -p 8787:8787 -e ANTHROPIC_API_KEY=... tu-vi` | web + API cùng origin, có AI. Chưa chạy thử Docker trong môi trường dev |
| **GitHub Pages** | Bật Pages (Source: GitHub Actions), đặt biến repo `DEPLOY_PAGES=true` và `PAGES_BASE_PATH=/tu_vi/` | Chỉ web tĩnh, **không có AI** (nút tự ẩn). Có thể trỏ `VITE_API_BASE` tới container ở nơi khác + `TUVI_CORS_ORIGIN` |
| Node host bất kỳ | `npm ci && npm run build && npm run server` | |

CI (`.github/workflows/ci.yml`): test Python, kiểm dữ liệu sinh ra không lệch JSON, typecheck, test web, build; job Pages chỉ chạy khi bật như trên.

## 7. Quyền riêng tư và pháp lý

- Ngày giờ sinh chỉ rời trình duyệt khi người dùng chủ động bấm “Viết lại bằng AI” (server không ghi log dữ liệu, không lưu).
- Chưa có tài khoản, chưa lưu phía server → chưa chạm nghĩa vụ lưu trữ dữ liệu cá nhân (Nghị định 13/2023). Khi thêm tài khoản/lưu server phải làm chính sách dữ liệu và xin đồng ý.
- Câu miễn trừ đã có ở chân trang. Web công khai thu phí thì vẫn nên hỏi luật sư (docs/05 Q6).

## Đối chiếu với lá số mẫu tracuutuvi.com (2026-10-22)

So từng ô 12 cung với 1 PDF của tracuutuvi.com (Quý Mùi, 11/5/2003 14:45, nam, xem năm 2026):

- **Vị trí sao: khớp 100%** (chính tinh, phụ tinh, vòng sao, Tuần/Triệt, sao lưu niên).
- **Sai thật, đã sửa:** lưu nguyệt. Web mẫu khởi tháng Giêng từ **cung tiểu hạn**, engine cũ khởi từ cung Thái Tuế. Nay mặc định `profile.luu_nguyet = "tieu_han"`, dị bản `thai_tue`. Test `thongtin.test.ts` khớp 4 ô `Th.n` của PDF. Mới có 1 lá số đối chiếu.
- **Thiếu hiển thị, đã thêm** (không đổi luận giải): can chi từng cung, màu sao theo ngũ hành (có công tắc về xanh/đỏ), `(Đ)(H)…` cho mọi sao có độ sáng, sao lưu niên bật mặc định và có trong ảnh PNG/SVG, chi năm tiểu hạn + `Th.n` ở chân ô, ô giữa (nạp âm, quan hệ Cục–Mệnh, can chi tháng/ngày/giờ, chủ mệnh/chủ thân, lai nhân, thân cư).
- **Chưa chắc:** chủ mệnh (theo chi năm sinh, khớp 1 lá số; bảng truyền thống theo cung Mệnh sẽ cho kết quả khác), cách viết quan hệ Cục–Mệnh khi không phải "sinh".
- **Còn lệch:** Văn Xương tại Mão (web mẫu: Đắc, ta: Bình, chưa đủ 2 nguồn). **Chưa làm:** cân lượng (thiếu bảng tháng/ngày đã kiểm).

### Lá số mẫu thứ 2 (Quý Mùi, 28/3/2003 13:45, nam)

Vị trí sao khớp 100%; can chi cung, chi năm tiểu hạn, `Th.n` của cả 12 cung khớp; lai nhân (Điền Trạch) khớp. Hai chỗ sửa sau lần này: Văn Xương tại Mão đặt lại **Đắc** (lasotuvi và 2 lá số mẫu cùng ghi), quan hệ cùng hành viết "bình hòa". Còn lệch về độ sáng: web mẫu có thêm nhãn cho Tang Môn (Đ ở Dậu), Thiên Hình (Đ ở Tuất), Hóa Lộc/Quyền (Đ), Hóa Kỵ (H ở Dậu), và không ghi Thiên Hư ở Sửu (lasotuvi: Đắc). Mỗi ô mới có 1 điểm dữ liệu, chưa đủ dựng bảng. Cân lượng: 2 lá số mẫu (3 lượng 3 chỉ; 4 lượng 0 chỉ) cùng tuổi Quý Mùi giờ Mùi, khác tháng/ngày — chưa đủ để suy bảng.

### Lá số mẫu thứ 3 (nữ, Quý Mùi, 5/12/2003 2:30) và cân lượng

Vị trí sao, can chi cung, chi năm tiểu hạn (nữ nghịch), `Th.n`, lai nhân (Mệnh), quan hệ Cục–Mệnh: khớp hết. Đã thêm **cân lượng** (bảng tracuutuvi.com): khớp cả 3 lá số mẫu (3 lượng 3 chỉ, 4 lượng 0 chỉ, 3 lượng 9 chỉ). Văn Xương tại Dậu đặt lại Đắc theo web mẫu (1 nguồn). Nhãn độ sáng web mẫu có mà ta chưa có (Tang Môn, Thiên Hình, Hóa Lộc/Quyền/Kỵ, Thiên Riêu Hợi) được ghi lại ở `data/doi_chieu/tracuutuvi_do_sang_quan_sat.json`, chưa dùng chấm điểm.

### Lá số mẫu thứ 4 (dương nữ, Giáp Thân, 11/1/2005 6:30 = 2/12/2004 âm)

Khớp: vị trí sao, can chi cung, chi năm tiểu hạn, `Th.n`, lai nhân (Mệnh), chủ mệnh Liêm Trinh và chủ thân Thiên Lương (theo chi năm sinh Thân — xác nhận chủ mệnh theo chi năm, không theo cung Mệnh), "Mệnh Thủy khắc Cục Hỏa", cân lượng 3 lượng 0 chỉ (cân lượng nay khớp 4/4, có cả năm Giáp). Còn lệch chỉ ở nhãn độ sáng, đã ghi vào `data/doi_chieu/tracuutuvi_do_sang_quan_sat.json`: Thiên Hình web mẫu ghi Hãm ở Thân (lasotuvi: Đắc), Thiên Hư Dần Hãm, Hóa Kỵ luôn Hãm, Hóa Quyền Đắc ở Tuất nhưng Hãm ở Tý/Thân.
