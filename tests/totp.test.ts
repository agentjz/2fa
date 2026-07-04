import { describe, expect, it } from "vitest";
import { Secret } from "otpauth";
import {
  exportBackupText,
  generateCode,
  normalizeAlgorithm,
  normalizeSecret,
  parseBackupText,
  parseInput,
  secondsRemaining,
  toOtpAuthUri,
  type TotpAccount,
} from "../src/core/totp";

function account(secret: string, algorithm = "SHA1", digits = 6, period = 30): TotpAccount {
  const parsed = parseInput(`otpauth://totp/Example:alice?secret=${secret}&issuer=Example&algorithm=${algorithm}&digits=${digits}&period=${period}`);
  if (!parsed.ok) throw new Error(parsed.message);
  return parsed.account;
}

describe("TOTP core", () => {
  it("passes RFC 6238 Appendix B vectors", () => {
    const sha1 = Secret.fromUTF8("12345678901234567890").base32;
    const sha256 = Secret.fromUTF8("12345678901234567890123456789012").base32;
    const sha512 = Secret.fromUTF8("1234567890123456789012345678901234567890123456789012345678901234").base32;

    const vectors = [
      [59, "94287082", "46119246", "90693936"],
      [1111111109, "07081804", "68084774", "25091201"],
      [1111111111, "14050471", "67062674", "99943326"],
      [1234567890, "89005924", "91819424", "93441116"],
      [2000000000, "69279037", "90698825", "38618901"],
      [20000000000, "65353130", "77737706", "47863826"],
    ] as const;

    for (const [time, s1, s256, s512] of vectors) {
      expect(generateCode(account(sha1, "SHA1", 8), time * 1000)).toBe(s1);
      expect(generateCode(account(sha256, "SHA256", 8), time * 1000)).toBe(s256);
      expect(generateCode(account(sha512, "SHA512", 8), time * 1000)).toBe(s512);
    }
  });

  it("normalizes algorithms and secrets", () => {
    expect(normalizeAlgorithm("sha-256")).toBe("SHA256");
    expect(normalizeAlgorithm("SHA512")).toBe("SHA512");
    expect(normalizeAlgorithm("md5")).toBe("SHA1");
    expect(normalizeSecret("jbsw y3dp-ehpk3pxp")).toBe("JBSWY3DPEHPK3PXP");
    expect(normalizeSecret("0189")).toBeNull();
  });

  it("parses standard otpauth TOTP links", () => {
    const result = parseInput("otpauth://totp/Acme:bob?secret=JBSWY3DPEHPK3PXP&issuer=Acme&digits=8&period=60&algorithm=SHA256");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.account.issuer).toBe("Acme");
    expect(result.account.label).toBe("bob");
    expect(result.account.digits).toBe(8);
    expect(result.account.period).toBe(60);
    expect(result.account.algorithm).toBe("SHA256");
  });

  it("rejects HOTP links instead of computing a wrong time code", () => {
    const result = parseInput("otpauth://hotp/Acme:bob?secret=JBSWY3DPEHPK3PXP&issuer=Acme&counter=1");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("hotp");
  });

  it("parses bare secrets with fallback labels", () => {
    const result = parseInput("JBSWY3DPEHPK3PXP", { issuer: "Manual", label: "alice" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.account.issuer).toBe("Manual");
    expect(result.account.label).toBe("alice");
  });

  it("round trips backup text", () => {
    const first = parseInput("otpauth://totp/Acme:bob?secret=JBSWY3DPEHPK3PXP&issuer=Acme");
    const second = parseInput("otpauth://totp/Stripe:robot?secret=GEZDGNBVGY3TQOJQ&issuer=Stripe&digits=8");
    if (!first.ok || !second.ok) throw new Error("fixtures failed");

    const exported = exportBackupText([first.account, second.account]);
    const imported = parseBackupText(exported);

    expect(imported.skipped).toHaveLength(0);
    expect(imported.accounts.map((item) => item.id)).toEqual([first.account.id, second.account.id]);
    expect(exported).toContain("otpauth://totp/");
  });

  it("serializes a standard otpauth uri", () => {
    const parsed = parseInput("JBSWY3DPEHPK3PXP", { issuer: "GitLab", label: "dev" });
    if (!parsed.ok) throw new Error(parsed.message);
    expect(toOtpAuthUri(parsed.account)).toContain("otpauth://totp/");
    expect(toOtpAuthUri(parsed.account)).toContain("secret=JBSWY3DPEHPK3PXP");
  });

  it("calculates remaining seconds in the current period", () => {
    const parsed = parseInput("JBSWY3DPEHPK3PXP");
    if (!parsed.ok) throw new Error(parsed.message);
    expect(secondsRemaining(parsed.account, 0)).toBe(30);
    expect(secondsRemaining(parsed.account, 29_100)).toBe(1);
  });
});
