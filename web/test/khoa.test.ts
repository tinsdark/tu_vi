import { pbkdf2Sync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { kiemTraMatKhau } from "../src/lib/khoa";

const salt = Buffer.from("00112233445566778899aabbccddeeff", "hex");
const ma = { salt: salt.toString("hex"), lan: 1000, bam: pbkdf2Sync("Mật khẩu 123", salt, 1000, 32, "sha256").toString("hex") };

describe("khóa mật khẩu", () => {
  it("đúng mật khẩu (kể cả dấu tiếng Việt) thì mở", async () => {
    expect(await kiemTraMatKhau("Mật khẩu 123", ma)).toBe(true);
  });
  it.each(["", "mật khẩu 123", "Mật khẩu 1234"])("sai %j thì không mở", async (mk) => {
    expect(await kiemTraMatKhau(mk, ma)).toBe(false);
  });
});
