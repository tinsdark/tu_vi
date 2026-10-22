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
| `baoCao` | 75 lá số (có ca quá 120 tuổi, không đại hạn), mọi profile | trùng cả cây JSON (điểm, phân vị, nhận định, hạn, lưu nguyệt, chủ đề) |
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

**Chưa kiểm:** nhánh gọi Claude thật (môi trường dev không có API key). Đã kiểm chữ ký SDK bằng `tsc` và toàn bộ luồng quanh nó bằng LLM giả trong `test/server.test.ts`.

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
