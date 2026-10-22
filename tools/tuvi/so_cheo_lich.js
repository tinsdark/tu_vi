// Xuất lịch âm 1900-01-31 → 2100-12-31 từ 2 thư viện độc lập để so với lich_am.py.
// Cài: npm i amlich@0.0.2 lunar-javascript@1.7.7 (trong thư mục <npm_dir>)
// Chạy: node so_cheo_lich.js <npm_dir> > ref.csv
const dir = process.argv[2];
const amlich = require(dir + '/node_modules/amlich');
const { Solar } = require(dir + '/node_modules/lunar-javascript');
let t = Date.UTC(1900, 0, 31);
const out = [];
while (t <= Date.UTC(2100, 11, 31)) {
  const d = new Date(t), D = d.getUTCDate(), M = d.getUTCMonth() + 1, Y = d.getUTCFullYear();
  const l = Solar.fromYmd(Y, M, D).getLunar();
  out.push([Y, M, D, ...amlich.convertSolar2Lunar(D, M, Y, 7), ...amlich.convertSolar2Lunar(D, M, Y, 8),
    l.getDay(), Math.abs(l.getMonth()), l.getYear(), l.getMonth() < 0 ? 1 : 0].join(','));
  t += 86400000;
}
process.stdout.write(out.join('\n'));
