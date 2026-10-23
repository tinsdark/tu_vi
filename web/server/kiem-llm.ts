// Kiểm đường gọi Claude THẬT trên vài lá số mẫu. Cần ANTHROPIC_API_KEY.  Chạy: ANTHROPIC_API_KEY=... npm run kiem:llm [số lá số]
// In: tỉ lệ câu bị hậu kiểm bỏ, mục thiếu, câu chứa lời cấm (percentile...), và một đoạn văn mẫu để đọc bằng mắt. Thoát mã 1 nếu vượt ngưỡng.
import { anLaSo, baoCao, hauKiemTheoMuc, LuanGiai, tapId } from "../src/engine";
import { coKhoa, taoVietLlm } from "./llm";

const MUC = ["Tổng quan", "Tính cách", "Sự nghiệp", "Tài chính", "Tình cảm – hôn nhân", "Sức khỏe", "Gia đình", "Hạn năm"];
const CAM = /(cao|thấp) hơn khoảng|% lá số|percentile|phân vị/i;

async function main() {
  if (!coKhoa()) {
    console.error("Thiếu ANTHROPIC_API_KEY — không gọi được Claude thật nên không có gì để kiểm.");
    process.exit(2);
  }
  const n = Number(process.argv[2] ?? 3);
  const viet = taoVietLlm()!;
  let loi = 0;
  for (let i = 0; i < n; i++) {
    const nam = 1985 + i * 7;
    const ls = anLaSo(((nam - 4) % 10) + 1, ((nam - 4) % 12) + 1, (i % 12) + 1, 10 + i, (i % 12) + 1, i % 2 ? "nam" : "nu");
    const bc = baoCao(new LuanGiai(ls), nam, 2026);
    const tho = await viet(bc);
    const [van, bo] = hauKiemTheoMuc(tho, bc);
    const tongCau = (tho.match(/\]/g) ?? []).length || 1;
    const thieu = MUC.filter((m) => !van.split("\n").some((d) => d.startsWith("#") && d.includes(m)) && !(m === "Hạn năm" && !bc.han?.dai_han));
    const cam = van.split(/(?<=[.!?\]])\s+/).filter((c) => CAM.test(c));
    const tyLeBo = bo / (bo + tongCau);
    console.log(`\n=== Lá số ${nam}: bỏ ${bo} câu (${(tyLeBo * 100).toFixed(0)}%), mã hợp lệ ${tapId(bc).size}, mục thiếu: ${thieu.join(", ") || "không"}, câu có lời cấm: ${cam.length}`);
    console.log(van.split("\n").slice(0, 8).join("\n"));
    if (tyLeBo > 0.25 || thieu.length || cam.length) loi++;
  }
  console.log(loi ? `\nKHÔNG ĐẠT: ${loi}/${n} lá số vượt ngưỡng (bỏ >25% câu, thiếu mục hoặc có lời cấm).` : `\nĐẠT: ${n}/${n} lá số.`);
  process.exit(loi ? 1 : 0);
}
main();
