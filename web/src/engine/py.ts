// Phép toán kiểu Python (vì engine port 1:1 từ Python, kết quả phải trùng từng bit khi có thể).

/** a // b với số nguyên hoặc số thực (làm tròn về −∞). */
export const floorDiv = (a: number, b: number): number => Math.floor(a / b);

/** a % b theo Python: dấu theo b. */
export const mod = (a: number, b: number): number => ((a % b) + b) % b;

/** round(x) của Python (làm tròn half-to-even). */
export function pyRoundInt(x: number): number {
  const f = Math.floor(x);
  const d = x - f;
  if (d < 0.5) return f;
  if (d > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}

/** round(x, n) của Python: làm tròn đúng theo giá trị thập phân CHÍNH XÁC của số thực, hòa thì về số chẵn. */
export function pyRound(x: number, n: number): number {
  if (!Number.isFinite(x)) return x;
  const exact = Math.abs(x).toFixed(Math.min(100, n + 60)); // toFixed của JS in đúng giá trị thập phân của double
  const dot = exact.indexOf(".");
  const keep = exact.slice(0, dot + 1 + n);
  const rest = exact.slice(dot + 1 + n);
  let up = false;
  if (rest[0] > "5") up = true;
  else if (rest[0] === "5") {
    if (/[1-9]/.test(rest.slice(1))) up = true;
    else up = Number(keep[keep.length - 1] === "." ? keep[keep.length - 2] : keep[keep.length - 1]) % 2 === 1;
  }
  let v = Number(keep);
  if (up) v += 10 ** -n;
  v = Number(v.toFixed(n));
  return x < 0 ? -v : v;
}

/** Số nguyên có dấu cộng như f"{x:+}" của Python cho số nguyên hoặc số thực. */
export function dau(x: number): string {
  return x >= 0 ? `+${x}` : `${x}`;
}

/** f"{x:.{n}f}" của Python (hòa về số chẵn trên giá trị thập phân chính xác). */
export function toFixedPy(x: number, n: number): string {
  return pyRound(x, n).toFixed(n);
}

/** f"{x:.0%}" của Python. */
export function phanTramPy(x: number): string {
  return `${toFixedPy(x * 100, 0)}%`;
}
