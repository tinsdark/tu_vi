# 11 — Học từ hai bản luận giải mẫu: báo cáo phân tích và kế hoạch làm

Mục đích: ghi lại **đã học được gì, nên làm gì, không nên làm gì** từ hai bản luận giải mẫu do người dùng đưa, để phiên làm việc sau bắt tay vào việc mà không phải đọc lại từ đầu. Phần §0–§7 là bản phân tích gốc, giữ nguyên để đối chiếu.

Trạng thái: bản phân tích (23/10/2026), **đã triển khai Lô A, B, C** (xem §8). Mọi con số ở §0–§7 do máy đo lúc phân tích, trừ chỗ ghi "ý kiến".

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

---

## 8. Đã triển khai (Lô A + B + C) và 5 quyết định đã chốt

Quyết định của người dùng: (1) giữ chủ mệnh theo cung Mệnh; (2) cho cách cục của Mệnh vào Sự nghiệp/Tài chính (làm tổng quát: mọi chủ đề có lĩnh vực trùng); (3) so cung phải xét thêm các sao khác, không chỉ chênh điểm; (4) **bỏ AI hoàn toàn** — thay vào đó làm giàu văn phong của chính engine; (5) giữ giọng "bạn".

Nguyên tắc triển khai: **mỗi thứ là một cơ chế đọc từ dữ liệu, chạy cho mọi cung/sao**, không viết riêng cho một vài ca. Thêm dòng vào bảng là engine tự áp dụng.

| Mục | Cơ chế | Dữ liệu |
|---|---|---|
| L1 | `chonGioi`/`chon_gioi` lọc nhánh "Nếu bạn là nam/nữ" cho **mọi** câu của mọi cung | `chinh_tinh_tai_cung_chuc.json` (bổ sung nhánh còn thiếu) |
| L2 | `pham_vi` nhận tên cung / danh sách / `"*"`; `ket_luan_theo_cung`; câu điền `{cung}`, `{cung_xung}`; cặp sao đôi đối xung ở mọi trục (CC64–CC69); điều kiện xuyên cung `{"cung_chuc": ..., "dk": ...}` (CC70) | `cach_cuc.json` |
| L3 | bảng sao → vai người: sao hãm / mang Hóa Kỵ nói thêm ở cung của vai (mã `LC.vai.*`) | `luan_lien_cung.json` → `vai_nguoi` |
| L4 | so cung: chênh từ ngưỡng **và** ≥ 2/3 thành phần (chính tinh, phụ tinh ròng, cách cục) cùng nghiêng; thành phần ngược lại, vô chính diệu, Tuần/Triệt, sát tinh đáng kể thành lưu ý (mã `SC.*`) | `luan_lien_cung.json` → `so_cung` |
| L5 | câu Tuần/Triệt riêng cho 12 cung + câu cho từng Hóa cùng cung (`LC.tt_hoa.*`) | `luan_lien_cung.json` |
| L7 | `dongThoiGianDaiHan`: bảng 12 đại hạn, đẹp nhất / khó nhất, gợi ý nên/tránh (chỉ web, không đổi điểm) | `cau_hinh_luan_giai.json` → `han.khuyen_nghi` |
| L8a | bảng điểm 12 cung một dòng (tab Tổng quan) | — |
| L8b | mục "Tổng kết" 2–3 câu: mảng thuận nhất / cần chú tâm nhất (chênh ≥ 10 mới gọi tên, ngược lại nói đồng đều) + cung Thân | `van_phong.json` |
| L8c | mục "Những câu hỏi thường gặp": mỗi cặp `so_cung` có `hoi`; chỉ trả lời khi có luật; thêm câu tiền vận/hậu vận | `luan_lien_cung.json`, `van_phong.json` |
| L9 → thay | làm giàu văn phong engine: câu nối xoay vòng theo vị trí chủ đề (không lặp nguyên văn), nhiều biến thể mở đầu/điểm tựa/cần để ý | `van_phong.json` |
| quyết định 2 | cách cục của Mệnh vào mọi chủ đề có `linh_vuc` trùng (chỉ thêm câu; điểm chủ đề vẫn theo trọng số cung, trừ ràng buộc khớp điểm–nội dung §4.8) | `luanGiai.ts` / `luan_giai.py` → `chuDe` |

**Đo ảnh hưởng điểm** (400 lá số seed cố định, `do.py` cùng cách đo `hieu_chinh.py`):
- Lô A+B: cát tinh đối xung (Tả–Hữu, Xương–Khúc, Khôi–Việt) cộng +1 ở mọi cung → 72/400 lá số đổi, lệch tối đa 5 điểm /100. Các cách hung đối xung và CC70 đặt **điểm 0** (sát tinh đã bị trừ trong công thức v3, cộng thêm là tính đôi; thử −1 thì fixture "Lá 4" Sức khỏe tụt từ Trung bình xuống Thấp).
- Quyết định 2: điểm 12 cung không đổi; điểm chủ đề đổi ở 23/2400 mục (Sức khỏe 13, Sự nghiệp 5, Tài chính 5), tối đa 20 điểm — do ràng buộc khớp điểm–nội dung (§4.8) khi có thêm câu sáng/hung. Cần người nhìn lại nếu thấy lệch lớn.
- So cung: trong 400 lá số, 371 cặp chênh từ ngưỡng 25, cổng đồng thuận chặn 22 (6%), 349 câu được nói ra, 204 lưu ý kèm theo.

**Còn mở**
- Mọi câu trong `luan_lien_cung.json`, `van_phong.json` và 7 cách CC64–CC70 do AI soạn, hiện nhãn xám, cần người review; CC64–CC70 chưa có nguồn web.
- Bảng sao → người mới có Thái Dương và Thái Âm.
- Ngưỡng so cung (25) và các hằng số `so_cung.*` là giá trị khởi điểm.
- Python (`viet_van.py`) chưa có bản ghép văn mới (Tổng kết, hỏi đáp, biến thể câu nối); chỉ `muc_cho_phep` được giữ parity. Văn xuôi TS và Python vốn không parity.
- Đường AI (`HIEN_AI = false`) giữ nguyên, tắt.

### 8b. Vòng hai (sau khi chốt 5 quyết định và yêu cầu làm đủ, không dừng ở ví dụ)

| Việc | Đã làm |
|---|---|
| Sao → người cho **mọi** chính tinh | Bảng 14 chính tinh + Tả/Hữu/Khôi/Việt, 6 tình trạng (Hóa Kỵ, hãm, Hóa Lộc/Quyền/Khoa, miếu/vượng) trong `luan_lien_cung.json` → `vai_nguoi` (nội dung do AI tổng hợp, nhãn xám) |
| Cách đa cung **đủ cho 12 cung** | CC71–CC106: mỗi cung 3 cách xuyên cung (Hóa cát hội, quý nhân văn tinh hội, sát Kỵ hội) với cung đối ứng nằm ngoài tam phương nên không tính đôi; cộng CC64–CC67, CC69 (cặp sao đôi đối xung ở mọi trục) và CC70. CC68 (Kình–Đà đối xung) bỏ vì engine an sao luôn đặt Kình–Đà cạnh nhau, không bao giờ đối xung. CC70 giữ nhưng hiếm gần như không gặp |
| So cung **chỉ là đánh giá khách quan** | Bỏ mọi lời khuyên trong câu so cung. Chỉ nêu khi: chênh ≥ 25 điểm; không thành phần nào nghiêng về cung yếu; ≥ 2/3 thành phần nghiêng về cung trội; cả hai cung có chính tinh bản cung; cả hai không bị Tuần/Triệt nén. Câu là số liệu: "A (khoảng x/100) mạnh hơn B (khoảng y/100); chênh lệch đến từ chính tinh và phụ tinh" |
| Dòng thời gian đại hạn vào báo cáo | `dai_han_ca_doi` (có mã `DH.<tuổi>`), dùng được trong văn xuôi và hỏi đáp; Python có bản tương đương, parity khớp |
| 21 câu hỏi thường gặp | `cau_hoi.json`. Chỉ trả lời bằng kết quả engine đã tính; không có câu hỏi về thời điểm, số con, xác suất, IQ |
| Python | `viet_van.py` có Tổng kết và hỏi đáp; `muc_cho_phep` khớp TS |
| Bỏ AI | Xóa UI AI, `POST /api/viet-van`, `llm.ts`, `kiem-llm.ts`, SDK Anthropic, cờ `HIEN_AI`, `HUONG_DAN`, `lenhChoAi`, `hauKiemNoiDung`, `hauKiemDayDu`, `rut_gon_cho_llm`, `viet_llm` |
| Ràng buộc khớp điểm–nội dung | Thêm: nội dung hiển thị nghiêng về hạn chế (tổng điểm câu hung > tổng điểm câu sáng) thì nhãn chủ đề không vượt 80 (`khop_noi_dung.net_hung_tran`). Phát hiện nhờ test `test_nhan_diem_khong_mau_thuan_noi_dung` khi thêm cách mới |

**Nguồn cho danh sách câu hỏi.** Tìm web chỉ xác nhận được ba chủ đề được nhắc nhiều nhất trong các bài hướng dẫn xem lá số (công danh/sự nghiệp, tài lộc, tình duyên/hôn nhân) và nhu cầu hỏi về vận hạn năm ([CafeF](https://cafef.vn/xem-tu-vi.html), [FPT Shop](https://fptshop.com.vn/tin-tuc/for-gamers/cau-lenh-chatgpt-xem-la-so-tu-vi-201972), [Phong Vũ](https://phongvu.vn/cong-nghe/xem-tu-vi-bang-chatgpt/)). Không có số liệu thống kê nào về tần suất câu hỏi; các câu còn lại (sức khỏe, gia đạo, tiền vận/hậu vận, giai đoạn thuận/khó, quý nhân, các cặp so cung) lấy từ các mục kinh điển của lá số và từ những gì engine tính được. Danh sách này là phán đoán, không phải kết quả khảo sát.

### 8c. Cô đọng (phản hồi sau khi xem giao diện thật)

Người dùng xem bản chạy thật và thấy lặp, lan man: mỗi sao một dòng, một cung ra hơn 10 dòng "người bạn đời … có thế vững", câu hỏi đáp lặp lại đoạn đã có. Nguyên tắc rút ra, áp cho **toàn bộ** chứ không riêng chỗ đó:

1. **Kết luận gần tương đương trong cùng một cung thì gộp thành một.**
   - Cùng trục, cùng phía (trục luận `truc_luan.json`): giữ câu có |điểm| lớn nhất, các câu còn lại ẩn (`an`) và ghi vào `ly_do` của câu giữ lại. Trước đây chỉ gộp khi hai phía nói ngược nhau (`XD.*`).
   - Lưới an toàn: câu cùng chiều, trùng từ ≥ 3/4 (gồm cả câu giống hệt từ hai sao khác nhau) thì gộp như trên. Trên 60 lá số ngẫu nhiên khoảng 10% nhận định được ẩn.
   - Điểm không đổi: câu bị ẩn vẫn được đếm như `XD.*` để ràng buộc §4.8 không dịch chuyển.
2. **Sao → người:** tối đa 2 câu mỗi cung (một câu mặt thuận, một câu mặt khó), mỗi câu gộp mọi sao ứng với người của cung đó, nêu tối đa 3 sao. Trước đây mỗi sao × mỗi tình trạng một câu (trung bình khoảng 10 dòng ở cung Phu Thê).
3. **Cách xuyên cung:** siết điều kiện (Hóa cát hội chỉ tính Hóa Lộc/Quyền/Khoa; quý nhân và sát Kỵ cần ≥ 2 sao ở cung chính và ≥ 1 ở cung đối ứng; cặp sao đôi đối xung chỉ nêu một lần cho mỗi trục). Số cách mới kích hoạt mỗi lá số giảm từ ~4–5 xuống ~2.
4. **Hỏi đáp và tổng kết:** mỗi câu trả lời là một dòng ngắn, không lặp đoạn đã có. Bỏ hai câu hạn năm (đã có mục Hạn năm), thay bằng "đại hạn kế tiếp so với hiện tại" (so sánh số liệu); Tổng kết không nhắc lại cung Thân (đã ở Tổng quan). Vẫn đủ 20 câu hỏi.
5. **Giao diện:** danh sách nhận định hiện tối đa 6 câu mạnh nhất, phần còn lại gập vào "Xem thêm (n)".
