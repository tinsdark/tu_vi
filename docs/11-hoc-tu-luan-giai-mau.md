# 11 — Học từ hai bản luận giải mẫu: báo cáo phân tích và kế hoạch làm

Mục đích: ghi lại **đã học được gì, nên làm gì, không nên làm gì** từ hai bản luận giải mẫu do người dùng đưa, để phiên làm việc sau bắt tay vào việc mà không phải đọc lại từ đầu. **Chưa có dòng code nào được sửa theo báo cáo này.**

Trạng thái: bản phân tích (23/10/2026). Mọi con số dưới đây do máy đo, trừ chỗ ghi "ý kiến".

---

## 0. Hai bản mẫu và cách dùng

| | Bản A | Bản B |
|---|---|---|
| Dạng | `.docx`, ~2.500 từ | `.pdf` 33 trang, ~10.000 từ, giọng "lão phu" |
| Lá số | Âm Nữ, Quý Mùi, Mệnh Sửu (Nhật–Nguyệt), Thân cư Phu Thê | Dương Nam, Giáp Thân, Mệnh Tỵ (Cự Môn hãm), Thân cư Thiên Di |
| Đã dùng làm | lá số hồi quy trong `test_la_so_review_quy_mui_nu` | chưa có test |

- Hai bản **không phải đáp án chuẩn**. Chúng chỉ cho biết một người viết giỏi (hoặc một AI) sẽ đọc lá số thế nào. Độ khớp của app với chúng là **đồng thuận, không phải độ đúng**. Chỉ người sinh ra lá số mới kiểm được luận có đúng đời thật không.
- Không commit họ tên, ngày giờ sinh của người trong bản B vào repo. Muốn làm hồi quy trên bản B thì xin lại PDF.
- Chuyển PDF → markdown: `pdftotext in.pdf out.txt` đủ dùng (bảng bị tách dòng nhưng đọc được).

---

## 1. Kết quả kiểm khách quan (máy đo)

Nhập lá số bản B vào engine (lưu ý: PDF ghi "24/1/2004 (âm lịch)" nhưng thực ra là **dương lịch**, vì can chi ngày Nhâm Dần chỉ khớp ngày dương đó):

| Hạng mục | Kết quả |
|---|---|
| Chính tinh: cung + độ sáng | **12/12** khớp |
| Vị trí 79 phụ tinh PDF nêu | **77/79** khớp |
| Cục, Mệnh/Thân, Tuần, Triệt, Tứ Hóa, cân lượng, đại hạn, vòng Tràng Sinh | khớp hết |
| Điểm 12 cung của app so với bảng điểm của PDF (Spearman) | **0.79** |
| Cung lệch điểm nhiều nhất | Mệnh (app 35 / PDF 5.5), Tật Ách (75 / 5.5), Phúc Đức (55 / 7), Điền Trạch (60 / 5) |

Kết luận: **phần an sao của engine không có vấn đề; khoảng cách nằm hoàn toàn ở phần luận.**

Lỗi **của bản B** (để không lặp lại khi học theo):
- Hai sao ghi ở hai cung: Thiên Đức (Mệnh và Phu Thê), Quan Phù (Tật Ách và Tài Bạch). Engine đặt Thiên Đức ở Mệnh, Quan Phù ở Tật Ách. Bản B dùng "Thiên Đức ở Phu Thê" làm điểm cứu duy nhất cho hôn nhân: kết luận đó đứng trên một sao không nằm ở cung ấy.
- Nhãn ngày sinh nhầm âm/dương.
- Nhiều khẳng định quá chắc hoặc không kiểm chứng được (mục 3).

---

## 2. Những điều nên học

Mỗi mục: **mẫu làm gì → app thiếu gì (đã kiểm) → cách làm đề xuất → rủi ro**. Độ ưu tiên: A (làm ngay, rủi ro thấp), B (cần soạn luật, có review), C (lớp trình bày/AI).

### L1 — Chọn nhánh giới tính trong câu luận [A]
- Mẫu: luận theo giới ("Thái Âm hãm ở Phu Thê với nam mệnh: vợ…").
- App: Phu Thê in cả hai nhánh "Nếu bạn là nam…; nếu bạn là nữ…" dù engine biết giới tính (`gioi_tinh`). Dữ liệu: 2 câu trong `chinh_tinh_tai_cung_chuc.json`.
- Làm: tách câu theo giới trong dữ liệu hoặc resolve trong engine (cả TS và Python). Test: không còn "Nếu bạn là" trong báo cáo.
- Rủi ro: thấp.

### L2 — Cách cục ở mọi cung, không chỉ Mệnh [A/B]
- Mẫu: "Lộc Mã giao trì" ở Tử Tức; Tả–Hữu đối xung trên trục Huynh Đệ–Nô Bộc; trục Không–Kiếp xung nhau ở Điền Trạch–Tử Tức.
- App: 48/63 cách có `pham_vi` = Mệnh; CC21 "Lộc Mã giao trì" chỉ nhận ở Mệnh nên cung Tử Tức đẹp nhất của bản B không được nhận ra. Còn ~30 cách của Mệnh gắn nhãn nghề/tài chỉ hiện ở tab 12 cung, không vào mục Sự nghiệp/Tài chính (xem `docs/07` §3c "còn mở").
- Làm: cho phép cách có nhiều `pham_vi` kèm câu luận riêng theo cung; quyết định cách của Mệnh có vào chủ đề nghề/tài hay không (cần người chọn).
- Rủi ro: **đổi điểm** (cách cục cộng vào điểm cung). Phải đo ảnh hưởng (mục 6).

### L3 — Luận xuyên cung: "sao → người" [B]
- Mẫu: Thái Dương hãm Hóa Kỵ ở Thân → quan hệ với **cha**, với **sếp nam**, với **con trai**. Thái Âm → mẹ, vợ. Một sao được đọc ở mọi cung nơi nó liên quan.
- App: chỉ in câu ở đúng cung chứa sao.
- Làm: bảng "sao → vai người" (dữ liệu, có nhãn xám) + luật: nếu sao đó mang Hóa Kỵ/hãm → câu ở cung vai người tương ứng (Phụ Mẫu, Tử Tức, Nô Bộc). Mỗi câu truy được về mã quy tắc.
- Rủi ro: dễ suy diễn quá tay; chỉ làm với bảng nhỏ đã review.

### L4 — So cung với cung [B]
- Mẫu: "Nô Bộc mạnh hơn hẳn Quan Lộc → nên hợp tác (tá lực nhi thành)"; "Nô Bộc mạnh hơn Huynh Đệ → hợp tác với bạn bè hơn anh em ruột".
- App: chấm từng cung riêng, không so.
- Làm: luật dựa **điểm sẵn có**: nếu điểm cung A − cung B ≥ ngưỡng (đề xuất khởi điểm 25) → câu theo cặp (Nô Bộc–Quan Lộc → hợp tác; Quan Lộc–Nô Bộc → tự đi). Ngưỡng là hằng số khởi điểm, cần tune như `hieu_chinh.py`.
- Rủi ro: thấp về điểm (không đổi điểm), vừa về nội dung.

### L5 — Tuần/Triệt tác động theo từng cung [B]
- Mẫu: Tuần ở Phụ Mẫu → xa cha mẹ sớm; Hóa Lộc bị Tuần → thừa kế đến chậm; Triệt ở Quan Lộc → việc đang thuận bị đứt; Tuần ở Phúc Đức → thờ tự gián đoạn.
- App: một câu Tuần/Triệt chung cho mọi cung (`cauTuanTriet`).
- Làm: bảng câu theo (cung × Tuần/Triệt) + tương tác với Hóa Lộc/Quyền/Khoa nằm cùng cung.
- Rủi ro: vừa; nội dung nhiều, cần nhãn xám.

### L6 — Cụm sao ở nhiều cung thành công thức [B]
- Mẫu: Thái Âm hãm ở Phu Thê + Đào Hoa ở Quan Lộc + Thiên Diêu ở Tài Bạch = "trong nhà lạnh, ngoài đường ấm" → cảnh báo người thứ ba.
- Làm: cách cục đa cung (điều kiện nhiều cung cùng lúc); DSL hiện tại chỉ điều kiện trên một cung và các vùng xung quanh nó. Cần mở rộng DSL (ví dụ `{"cung": "Quan Lộc", "co": "Đào Hoa"}`).
- Rủi ro: vừa; đổi DSL ở cả TS và Python, giữ parity.

### L7 — Dòng thời gian đại hạn có hành động [A/B]
- Mẫu: bảng từng đại hạn 10 năm kèm nên/tránh, chốt "đại hạn đẹp nhất", "bước ngoặt", "hạn nguy hiểm nhất".
- App: tab Hạn chấm lại 5 cung của đại hạn hiện tại, **không** có dòng thời gian cả đời. "Tiền vận và hậu vận" chỉ so Mệnh với cung Thân.
- Làm: chấm điểm cho cả 12 đại hạn (hàm đã có, chỉ gọi cho từng đại hạn), sinh bảng "tuổi → cung → xếp loại → một câu" + gắn nhãn đại hạn mạnh nhất/yếu nhất. Câu "nên/tránh" lấy từ `han.khuyen_nghi` đã có trong cấu hình.
- Rủi ro: thấp về điểm; cần chọn cách ghi để không phình giao diện.

### L8 — Lớp trình bày theo câu hỏi người xem [C]
- Mẫu: mỗi cung trả lời câu hỏi cụ thể (vợ thế nào, nên hùn vốn không, làm chủ hay làm thuê, mua nhà hay lướt sóng); cuối có **bảng điểm 12 cung một dòng**, **3 câu tổng kết**, **10 điều tâm niệm** (lời khuyên có tuổi và con số).
- App: có `ke_chuyen.json` (hình dạng chủ đề + việc nên làm) nhưng chưa theo câu hỏi, chưa có tổng kết toàn cục.
- Làm: (a) bảng điểm 12 cung một dòng (dữ liệu có sẵn, dễ nhất), (b) tổng kết 3 câu sinh từ luật (cung mạnh nhất, cung yếu nhất, cung Thân), (c) khối "câu hỏi thường gặp" mỗi câu chỉ trả lời khi có luật; **mỗi lời khuyên giữ mã quy tắc + nhãn độ tin cậy**.
- Rủi ro: vừa; dễ phình văn bản (R7: đoạn ≤ 12 câu trong `vietvan.test.ts`).

### L9 — Đường AI có hậu kiểm cho văn trôi chảy [C]
- Mẫu có độ trôi chảy mà luật không đạt được.
- App: đã có đường AI viết lại + hậu kiểm (loại câu không truy được về quy tắc), nhưng cờ `HIEN_AI = false` (`web/src/lib/tinhNang.ts`) và **chưa chạy thật** (môi trường không có API key).
- Làm: sau L1–L8, đưa báo cáo giàu hơn (cách cục xuyên cung, sao phụ, so cung) vào AI; mở rộng hậu kiểm để chấp nhận mã mới và **từ chối con số bịa** (IQ, số con, xác suất).
- Rủi ro: cần API key, chi phí, cần thử thật; không làm trước khi L1–L8 xong.

---

## 3. Những điều KHÔNG học (và lý do)

| Bản mẫu làm | Vì sao không |
|---|---|
| IQ 120–130, "thích nghi 8/10", "đào hoa 6.5/10" | Con số bịa, không kiểm chứng được, không có luật đứng sau |
| "2 con, thiên về con trai", "có bà cô tổ trong họ" | Dự đoán cụ thể không kiểm chứng được, dễ gây hoang mang |
| "Tuyệt đối không cưới trước 28, xác suất trắc trở rất cao" | Không có cơ sở định lượng; ngoại lệ: tuổi cưới khuyến nghị có thể có **nếu** gắn nhãn xám và nói "tham khảo" |
| "Lộc Mã giao trì — quý hiển bậc nhất" | Quá lời; nên nêu cách và nghĩa, không xếp hạng tuyệt đối |
| Giọng "lão phu" | Không hợp web nhiều người dùng; giữ giọng "bạn" (quyết định của người dùng, xem mục 4) |

Nguyên tắc giữ nguyên: **câu nào không truy được về một quy tắc thì không được hiện; câu từ AI tổng hợp mang nhãn xám**.

---

## 4. Quyết định cần người dùng chốt trước khi làm

1. **Chủ mệnh theo cung Mệnh hay theo chi năm sinh.** Cả hai bản mẫu và tracuutuvi dùng chi năm (Mùi → Vũ Khúc; Thân → Liêm Trinh), trong khi iztro và bản review dùng cung Mệnh. Hiện web mặc định **cung Mệnh** (PR 15). Đổi bằng `CHU_MENH_THEO` trong `web/src/engine/thongTin.ts`.
2. Cách của cung Mệnh gắn nhãn nghề/tài có vào Sự nghiệp/Tài chính không (L2).
3. Ngưỡng so cung (L4): giữ 25 hay chỉnh.
4. Có bật AI viết văn không, và dùng nhà cung cấp nào (L9).
5. Giọng văn: "bạn" (hiện tại) hay giọng người xem số.

---

## 5. Kế hoạch theo lô

| Lô | Gồm | Đổi điểm? | Xong khi |
|---|---|---|---|
| **A** | L1, phần "đơn giản" của L2 (cho phép nhiều `pham_vi`, thêm Lộc Mã giao trì ở Tử Tức, Tả–Hữu đối xung, trục Không–Kiếp), L7 (dòng thời gian đại hạn), bảng điểm 12 cung một dòng (phần L8a) | L2 có (đo) | test mới xanh, parity xanh, đo điểm 400 lá số báo cáo |
| **B** | L3, L4, L5, L6 | L6 có thể | mỗi luật có mã, nhãn xám, test trên lá số bản A |
| **C** | L8b/c, L9 | không | văn mẫu qua hậu kiểm, AI chạy thử thật |

Mỗi lô: **không gộp chung với sửa giao diện**; mở PR riêng; chạy đủ bước CI trên máy trước khi đẩy (mục 6).

---

## 6. Hướng dẫn kỹ thuật cho phiên sau

**Chạy đủ CI trên máy trước khi đẩy** (bài học: lần trước CI đỏ vì quên sinh lại `db/du_lieu.sql` sau khi sửa dữ liệu tri thức):

```bash
for t in test_lich_am test_an_sao test_luan_giai test_doi_chieu_thay test_fixture_la_so; do python3 tools/tuvi/$t.py; done
python3 tools/sinh_sql.py; python3 tools/sinh_mui_gio.py; python3 tools/sinh_truc_luan.py
git diff --exit-code -- db/du_lieu.sql web/src/data/mui_gio_vn.json data/knowledge/truc_luan.json
cd web && npm run typecheck && npx vitest run && npm run build
```

**Đo ảnh hưởng điểm** khi sửa luật có thể đổi điểm: dump `diem` và `diem100` của 12 cung + các chủ đề + điểm Thân cho ~400 lá số ngẫu nhiên (seed cố định, như `hieu_chinh.py`), chạy trước và sau, báo số lá số đổi và mức đổi. Cam kết cũ: phụ tinh ±1, chọn top, câu dẫn không đổi điểm.

**Giữ parity TS = Python**: mọi thay đổi ở `chamCung`, `chuDe`, `than`, DSL phải sửa **cả** `web/src/engine/luanGiai.ts` và `tools/tuvi/luan_giai.py`; `parity.test.ts` so báo cáo đầy đủ. Văn xuôi ghép mẫu TS (`vanNen.ts`) và Python (`viet_van.py`) **không** parity; `vietvan.test.ts` có ràng buộc cấu trúc (đoạn ≤ 12 câu, câu hòa giải cuối đoạn).

**Đối chiếu nguồn độc lập**: `iztro` (npm) cho an sao và Chủ mệnh/Thân; `lasotuvi` (pip) có lỗi tra Chủ mệnh theo `canNam`, không tin tuyệt đối.

**Cơ chế đã có để dùng lại**: trục luận và cách cục thắng câu đơn lẻ (`docs/07` §3b), sao phụ ±1 `nho` (§3c), cờ tính năng `web/src/lib/tinhNang.ts`.

---

## 7. Rủi ro tổng

- Nội dung luật mới do AI soạn, chưa review: luôn nhãn xám; ghi rõ trong PR những gì cần người review.
- Đổi điểm: luôn đo và báo; không đổi hằng số công thức nếu không có căn cứ (ví dụ Tài Bạch vô chính diệu + Tuần vẫn 70/100, đã thêm cảnh báo thay vì đổi điểm).
- Văn bản phình: mỗi câu mới phải đủ giá trị; có giới hạn câu mỗi đoạn.
- Lệ thuộc bản mẫu: hai bản mẫu cũng có thể sai; đừng tune cho khớp chúng.
