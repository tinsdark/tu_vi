// Đặt/đổi mật khẩu khóa web. Chỉ ghi băm PBKDF2 (không ghi mật khẩu) vào web/src/lib/khoa.json.
//   node tools/doi_mat_khau.mjs "mat khau moi"     hoặc:   echo "mat khau moi" | node tools/doi_mat_khau.mjs
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LAN = 600_000;
const mk = process.argv[2] ?? readFileSync(0, "utf8").replace(/\r?\n$/, "");
if (mk.length < 8) { console.error("Mật khẩu tối thiểu 8 ký tự."); process.exit(1); }

const salt = randomBytes(16);
const bam = pbkdf2Sync(mk.normalize("NFC"), salt, LAN, 32, "sha256");
const ra = join(dirname(fileURLToPath(import.meta.url)), "..", "web", "src", "lib", "khoa.json");
writeFileSync(ra, JSON.stringify({ salt: salt.toString("hex"), lan: LAN, bam: bam.toString("hex") }, null, 2) + "\n");
console.log("Đã ghi", ra);
