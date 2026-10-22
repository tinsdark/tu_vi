// globalSetup: sinh dữ liệu chuẩn từ Python (tools/golden_dump.py) trước khi chạy test parity.
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export default function setup() {
  const ra = mkdtempSync(join(tmpdir(), "tuvi-golden-"));
  const goc = resolve(__dirname, "..", "..");
  execFileSync("python3", [join(goc, "tools", "golden_dump.py"), ra, process.env.GOLDEN_N ?? "300"], { stdio: "inherit" });
  process.env.TUVI_GOLDEN = ra;
}
