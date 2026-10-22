// Xuất vị trí sao từ iztro (npm i iztro@2.6.3) cho từng dòng input "nam_am,thang,ngay,gio(1..12),nam|nu" ở stdin.
// Chạy: node so_cheo_iztro.js <npm_dir> < input.csv > iztro.jsonl
const { astro } = require(process.argv[2] + '/node_modules/iztro');
const lines = require('fs').readFileSync(0, 'utf8').trim().split('\n');
const out = [];
for (const l of lines) {
  const [y, m, d, g, gt] = l.split(',');
  const a = astro.byLunar(`${y}-${m}-${d}`, +g - 1, gt === 'nam' ? '男' : '女', false, true, 'vi-VN');
  const sao = {};
  for (const p of a.palaces) {
    for (const s of [...p.majorStars, ...p.minorStars, ...p.adjectiveStars]) sao[s.name] = p.earthlyBranch;
    sao['TS.' + p.changsheng12] = p.earthlyBranch;
    sao['BS.' + p.boshi12] = p.earthlyBranch;
    sao['TT.' + p.suiqian12] = p.earthlyBranch;
    sao['DH.' + p.decadal.range[0]] = p.earthlyBranch;
    if (p.name === 'Mệnh') sao['@Mệnh'] = p.earthlyBranch;
    if (p.isBodyPalace) sao['@Thân'] = p.earthlyBranch;
  }
  sao['@Cục'] = a.fiveElementsClass;
  sao['@lunar'] = a.lunarDate;
  out.push(JSON.stringify(sao));
}
process.stdout.write(out.join('\n'));
