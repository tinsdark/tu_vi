# 12 — Dự thảo: văn dễ đọc hơn, bớt thuật ngữ

Trạng thái: **dự thảo để chốt, chưa sửa code.** Căn cứ: phản hồi sau khi xem PR #17 trên điện thoại ("thu gọn khá ổn rồi, nhưng viết liền mạch hơn, bớt thuật ngữ vì người xem không biết sao này sao kia; vẫn phải có nhưng hạn chế").

Các đoạn "trước" dưới đây là văn thật engine đang sinh cho một lá số nữ (Mệnh Mão), đã bỏ mã `[...]` cho dễ đọc. Các đoạn "sau" là bản đề xuất viết tay trên **cùng dữ liệu** (không thêm ý, không đổi điểm).

---

## 1. Chẩn đoán: vì sao đọc còn khó

| Vấn đề | Ví dụ trong văn hiện tại |
|---|---|
| Tên sao, tên cách chen giữa câu | "theo cách «Tài Ấm giáp Ấn», Thiên Tướng (ấn) được Lộc (tài) và Thiên Lương (ấm) giáp" |
| Dấu vết kỹ thuật trong ngoặc | "(do Vũ Khúc ở cung Phu Thê chiếu sang)", "(Vũ Khúc miếu, Tham Lang miếu)" |
| Tên cung chức thay vì lĩnh vực | "cung Quan Lộc không có chính tinh, mượn Vũ Khúc và Tham Lang từ cung đối diện" |
| Mỗi câu một luật, nối bằng "Đồng thời,", "Song cũng cần để ý:", "Tuy nhiên, theo cách…" | đọc như danh sách chứ không phải một đoạn kể |
| Câu độn về kỹ thuật | "Đại hạn của bạn đi theo chiều nghịch; đây chỉ là đặc điểm kỹ thuật của lá số…" |
| Câu tự mâu thuẫn | "Sự nghiệp có **nền tốt** nhưng đường đi không bằng phẳng, ở mức **trung bình**… nền là cung không có chính tinh, mượn sao…" |

Nguyên nhân gần như nằm hết ở **lớp ghép câu** (`web/src/engine/vanNen.ts`: `menhDe`, `cauNen`, `cauLuuY`, mẫu "theo cách «…»", ngoặc "(do … chiếu sang)"). Các câu gốc trong dữ liệu tri thức phần lớn đã là lời thường.

---

## 2. Nguyên tắc đề xuất

1. **Mỗi đoạn kể một mạch ngắn:** (1) kết luận một câu, (2) vì sao, gộp 1–2 ý thuận thành một câu, (3) điều cần canh chừng, gộp ý khó thành một câu, (4) một lời khuyên. Một câu được phép mang nhiều mã `[...]` (hậu kiểm đã hỗ trợ).
2. **Ngân sách thuật ngữ:** tối đa **2 thuật ngữ mỗi đoạn** (Tổng quan tối đa 3). Mỗi thuật ngữ được giải thích ngay lần đầu, ví dụ "đại hạn (giai đoạn 10 năm)".
3. **Gọi tên cung bằng lĩnh vực:** Quan Lộc → "công việc", Tài Bạch → "tiền bạc", Phu Thê → "chuyện vợ chồng", Tật Ách → "sức khỏe", Tử Tức → "con cái", Phụ Mẫu → "cha mẹ", Huynh Đệ → "anh chị em", Nô Bộc → "bạn bè, cấp dưới", Thiên Di → "ra ngoài, xa nhà", Điền Trạch → "nhà đất", Phúc Đức → "phúc phần, tinh thần".
4. **Tên sao, tên cách chuyển xuống hàng "Cơ sở"** (đã có dưới mỗi đoạn). Đề xuất bổ sung hàng đó một dòng "Sao liên quan: Vũ Khúc, Tham Lang…" lấy tự động từ trường `nhan` của các nhận định, để người muốn tra vẫn tra được và hậu kiểm không đổi.
5. **Bỏ câu độn kỹ thuật** (chiều đại hạn, "đây chỉ là đặc điểm kỹ thuật", điểm /100 không so với người khác chuyển thành một dòng chú thích nhỏ ở đầu trang).
6. **Giữ tên riêng chỉ khi nó có ích cho người đọc:** Mệnh, Thân, đại hạn (giải thích một lần ở Tổng quan); tên chính tinh thủ Mệnh nêu **một lần** ở mục Tính cách.

---

## 3. Trước / sau trên lá số mẫu

### Sự nghiệp

**Trước**
> Sự nghiệp của bạn có nền tốt nhưng đường đi không bằng phẳng, ở mức trung bình (khoảng 55/100; nền là cung Quan Lộc không có chính tinh, mượn Vũ Khúc và Tham Lang từ cung đối diện). Bạn hợp tài chính, ngân hàng, kinh doanh và kỹ thuật (do Vũ Khúc ở cung Phu Thê chiếu sang). Đồng thời, theo cách «Tài Ấm giáp Ấn», Thiên Tướng (ấn) được Lộc (tài) và Thiên Lương (ấm) giáp, được che chở, có của. Song cũng cần để ý: chuyện tiền bạc/hao tán tác động gián tiếp tới công việc (do Hỏa Tinh ở cung Tài Bạch chiếu sang). Cung này có Triệt đi qua: điều tốt ở đây bị giảm lực, điều xấu cũng bớt hung; Triệt tác động mạnh ở nửa đầu đời. Việc nên làm: đặt mục tiêu ngắn hạn rõ ràng và rà lại tiến độ mỗi tháng.

**Sau (đề xuất)**
> Đường công việc của bạn ở mức trung bình (khoảng 55/100): có chỗ dựa nhưng không bằng phẳng, nhất là nửa đầu đời, khi việc đang thuận vẫn dễ bị đứt giữa chừng. Bạn hợp các nghề liên quan đến tiền bạc, kinh doanh và kỹ thuật, lại được che chở, có của nên ít khi thiếu chỗ dựa. Điều cần canh chừng là chuyện tiền bạc hao tán, vì nó dễ kéo theo ảnh hưởng đến công việc. Nên đặt mục tiêu ngắn hạn rõ ràng và rà lại tiến độ mỗi tháng.

Thuật ngữ còn lại: 0. Cơ sở (dưới đoạn): Vũ Khúc, Tham Lang, Hỏa Tinh; cách «Tài Ấm giáp Ấn»; Triệt.

### Tình cảm – hôn nhân

**Trước**
> Về tình cảm – hôn nhân, bạn ở mức khá (khoảng 70/100). Cung Phu Thê của bạn có chính tinh ở thế tốt (Vũ Khúc miếu, Tham Lang miếu). Người bạn đời giỏi giang nhưng khá cứng. Theo cách «Đào Hồng Hỷ hội Phu Thê», duyên đến sớm, dễ có người để ý; gặp sát tinh thì dễ đa tình, lận đận. Ngoài ra, theo cách «Lộc Quyền Khoa hội Phu Thê–Tử Tức», lộc/Quyền/Khoa nằm ở cả Phu Thê lẫn Tử Tức, hôn nhân êm ấm, vợ chồng và con cái cùng được lợi. Tuy nhiên, theo cách «Phu Thê có Sát Phá Tham», hôn nhân nhiều biến động; nên kết hôn muộn. Cả hai mặt đều có thật, và cách bạn ứng xử có thể làm mặt này hay mặt kia nổi lên.

**Sau (đề xuất)**
> Chuyện tình cảm, hôn nhân của bạn ở mức khá (khoảng 70/100), nền khá vững: người bạn đời giỏi giang nhưng hơi cứng. Duyên đến sớm và dễ có người để ý; khi gia đình êm ấm thì vợ chồng và con cái cùng được lợi. Mặt cần lưu ý là đường hôn nhân có nhiều biến động, nên kết hôn muộn một chút sẽ bền hơn, còn gặp thêm yếu tố xấu thì dễ đa tình, lận đận. Cả hai mặt đều có thật, nên cách bạn ứng xử mới quyết định mặt nào nổi lên.

Thuật ngữ còn lại: 0. Cơ sở: Vũ Khúc, Tham Lang; cách «Đào Hồng Hỷ hội Phu Thê», «Lộc Quyền Khoa hội Phu Thê–Tử Tức», «Phu Thê có Sát Phá Tham».

### Sức khỏe

**Trước**
> Về sức khỏe, bạn ở mức khá (khoảng 70/100). Cung Tật Ách của bạn không có chính tinh, nên khi luận phải mượn sao ở cung đối diện (Thiên Cơ và Thiên Lương) và độ mạnh được tính giảm đi; điều này không tự động là xấu. Thể trạng chung: các sao tác động lên cung này nói ngược nhau — khá, ít bệnh (Giải Thần) và bệnh dai dẳng, khó chữa (Địa Võng); nên không kết luận chắc về mục này. Nên để ý gan và thần kinh (do Thiên Cơ ở cung Phụ Mẫu chiếu sang). Gặp bệnh dễ có cách chữa và bạn có tuổi thọ (do Thiên Lương ở cung Phụ Mẫu chiếu sang). Bên cạnh đó, có thêm các sao hỗ trợ từ những cung khác chiếu về (Thiên Việt, Hóa Lộc, Hữu Bật và Thiên Khôi), giúp cung Tật Ách được nâng đỡ. Sao phụ Quả Tú cũng đáng để ý: bạn dễ buồn và lạnh lòng, ảnh hưởng tới sức khỏe tinh thần.

**Sau (đề xuất)**
> Sức khỏe của bạn ở mức khá (khoảng 70/100), nhưng độ vững kém hơn con số một chút vì phần này dựa nhiều vào ảnh hưởng từ bên cạnh. Thể trạng có tín hiệu trái chiều (vừa ít bệnh vừa dễ có bệnh dai dẳng) nên chưa thể nói chắc. Nên để ý gan và thần kinh, nhưng khi gặp bệnh thường có đường chữa và tuổi thọ tốt, lại được nhiều yếu tố hỗ trợ nâng đỡ. Bạn dễ buồn và lạnh lòng, nên chú ý đời sống tinh thần.

Thuật ngữ còn lại: 0. Cơ sở: Thiên Cơ, Thiên Lương, Giải Thần, Địa Võng, Quả Tú; cát tinh chiếu về.

### Tổng quan (đoạn đầu)

**Trước**
> Lá số của bạn có Mệnh tại cung Mão (Dương Nữ), bản mệnh Thổ, cục Thổ 5. Điểm /100 ở các mục dưới chỉ so các cung trong chính lá số của bạn với nhau, không so với người khác. Mệnh và Cục cùng hành, nghĩa là nền lá số thuận hòa và ổn định. Đại hạn của bạn đi theo chiều nghịch; đây chỉ là đặc điểm kỹ thuật của lá số, không quyết định cuộc đời thuận hay nghịch. Bản mệnh của bạn kiềm chế được chính tinh thủ Mệnh (Thiên Tướng), nên bạn kiểm soát tốt tính chất của sao nhưng phần hưởng thụ bị kìm, hơi khắc khổ. Cung Thân của bạn nằm ở cung Thiên Di: hay đi xa, thay đổi chỗ ở/việc làm; thành bại gắn với môi trường bên ngoài. Tiền vận và hậu vận tương đương.

**Sau (đề xuất)**
> Mệnh của bạn nằm ở cung Mão, bản mệnh Thổ, cục Thổ 5; hai thứ hợp nhau nên nền lá số thuận hòa, ổn định. Bạn kiểm soát tốt tính nết của chính mình nhưng hơi kìm chuyện hưởng thụ nên dễ sống khắc khổ. Cung Thân (nơi vận về sau gắn vào) rơi vào "ra ngoài, xa nhà": hay đi xa, đổi chỗ ở hoặc việc làm, thành bại gắn với môi trường bên ngoài; tiền vận và hậu vận tương đương.
>
> *Chú thích nhỏ ở đầu trang:* điểm /100 chỉ so các mảng trong chính lá số này với nhau.

Thuật ngữ còn lại: Mệnh, Thân (được giải thích tại chỗ). Câu về chiều đại hạn bỏ khỏi văn, chỉ còn ở tab Hạn.

---

## 4. Cách làm (ước lượng)

| Việc | Nơi sửa | Ghi chú |
|---|---|---|
| Bảng tên cung → lĩnh vực (lời thường) | `data/knowledge/van_phong.json` | dữ liệu, thêm một bảng |
| Bỏ ngoặc "(do … chiếu sang)", "theo cách «…»", tên sao trong ngoặc | `menhDe`, `cauNen`, `cauLuuY`, `nenChu` trong `vanNen.ts` | chỉ đổi cách diễn đạt; mã `[...]` giữ nguyên |
| Gộp 1–2 ý thuận thành một câu, 1–2 ý khó thành một câu | `doanChuDe`, `doanKeChuyen` | một câu mang nhiều mã; ngân sách 7 câu hiện có sẽ còn ~5 |
| Hàng "Sao liên quan" ở "Cơ sở" | `TabTongQuan.tsx` (`HienVan`) | lấy từ `nhan` của các mã trong đoạn |
| Giữ khung Tuần/Triệt, vô chính diệu, trái chiều bằng lời thường | `cauLuuY`, mẫu XD | dùng câu TT riêng từng cung đã có |
| Sửa lỗi "nền tốt" khi cung vô chính diệu | `hinhDang` | xem mục 5 |
| Test | `vietvan.test.ts` | thêm: không có tên sao ngoài danh sách cho phép trong đoạn chủ đề; mỗi đoạn tối đa 2 thuật ngữ |

Không đổi điểm, không đổi engine luận, không đổi parity TS/Python (văn xuôi TS vốn không parity với Python).

## 5. Lỗi phát hiện kèm theo

`hinhDang` coi "nền tốt" khi `chinh_tinh_dac` đúng, kể cả cung vô chính diệu mượn sao (Quan Lộc ở lá số mẫu), nên câu mở nói "có nền tốt nhưng… ở mức trung bình" mâu thuẫn. Đề xuất: cung vô chính diệu không bao giờ được xếp vào hình dạng "nền tốt".

## 6. Cần mày chốt

1. **Tên sao ở đâu?** Đề xuất: không nằm trong câu văn, chỉ ở hàng "Cơ sở". Hay còn muốn giữ một tên sao trong ngoặc ở câu mở mỗi đoạn?
2. **Gọi cung bằng lĩnh vực** ("công việc", "tiền bạc"…) thay cho "cung Quan Lộc", "cung Tài Bạch" — đồng ý không?
3. **Giữ lại:** Mệnh, Thân, đại hạn (giải thích một lần). Còn từ nào mày muốn giữ hoặc bỏ nữa (Tuần/Triệt, chính tinh, cách cục)?
4. **Lời khuyên cuối đoạn:** giữ một câu "Nên…" như trên, hay bỏ?
5. Có áp dụng luôn cho mục **Hỏi đáp** và **Tổng kết** (đang còn "mạnh nhờ Thất Sát, Thiên Việt") — đề xuất đổi sang lời thường, tên sao chỉ ở Cơ sở.
