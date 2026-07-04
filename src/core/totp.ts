import { HOTP, Secret, TOTP, URI } from "otpauth";

export type TotpAlgorithm = "SHA1" | "SHA256" | "SHA512";

export interface TotpAccount {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  algorithm: TotpAlgorithm;
  digits: number;
  period: number;
  createdAt: number;
  updatedAt: number;
}

export type ParseFailureReason =
  | "empty"
  | "hotp"
  | "invalid-uri"
  | "invalid-secret"
  | "unsupported";

export type ParseResult =
  | { ok: true; account: TotpAccount }
  | { ok: false; reason: ParseFailureReason; message: string };

export interface ImportReport {
  accounts: TotpAccount[];
  skipped: Array<{ input: string; reason: ParseFailureReason; message: string }>;
}

const DEFAULT_DIGITS = 6;
const DEFAULT_PERIOD = 30;
const DEFAULT_ALGORITHM: TotpAlgorithm = "SHA1";
const SECRET_RE = /^[A-Z2-7]+=*$/;

export function normalizeAlgorithm(value: unknown): TotpAlgorithm {
  const raw = String(value ?? "").trim().toUpperCase().replace(/[-_\s]/g, "");
  if (raw === "SHA256") return "SHA256";
  if (raw === "SHA512") return "SHA512";
  return DEFAULT_ALGORITHM;
}

export function clampDigits(value: unknown): number {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 6 && parsed <= 8) return parsed;
  return DEFAULT_DIGITS;
}

export function clampPeriod(value: unknown): number {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 10 && parsed <= 300) return parsed;
  return DEFAULT_PERIOD;
}

export function normalizeSecret(value: string): string | null {
  const normalized = value.replace(/[\s-]/g, "").toUpperCase();
  if (!normalized || !SECRET_RE.test(normalized)) return null;
  try {
    const secret = Secret.fromBase32(normalized);
    return secret.bytes.length > 0 ? secret.base32 : null;
  } catch {
    return null;
  }
}

export function isTotpAccount(value: unknown): value is TotpAccount {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<TotpAccount>;
  return (
    typeof item.id === "string" &&
    typeof item.issuer === "string" &&
    typeof item.label === "string" &&
    typeof item.secret === "string" &&
    normalizeSecret(item.secret) !== null &&
    ["SHA1", "SHA256", "SHA512"].includes(String(item.algorithm)) &&
    Number.isInteger(item.digits) &&
    Number.isInteger(item.period)
  );
}

export function createAccount(input: {
  issuer?: string;
  label?: string;
  secret: string;
  algorithm?: unknown;
  digits?: unknown;
  period?: unknown;
  createdAt?: number;
  updatedAt?: number;
}): TotpAccount | null {
  const secret = normalizeSecret(input.secret);
  if (!secret) return null;

  const now = Date.now();
  const issuer = cleanName(input.issuer);
  const label = cleanName(input.label) || "未命名账号";
  const account: Omit<TotpAccount, "id"> = {
    issuer,
    label,
    secret,
    algorithm: normalizeAlgorithm(input.algorithm),
    digits: clampDigits(input.digits),
    period: clampPeriod(input.period),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };

  return { ...account, id: accountId(account) };
}

export function parseInput(rawInput: string, fallback?: { issuer?: string; label?: string }): ParseResult {
  const input = rawInput.trim();
  if (!input) return failure("empty", "请输入 otpauth 链接或 Base32 secret。");

  const uri = extractOtpAuthUri(input);
  if (uri) return parseOtpAuthUri(uri);

  const secret = normalizeSecret(input);
  if (!secret) return failure("invalid-secret", "secret 只能包含 Base32 字符 A-Z 和 2-7。");

  const account = createAccount({
    secret,
    issuer: fallback?.issuer,
    label: fallback?.label || "手动导入",
  });
  return account ? { ok: true, account } : failure("invalid-secret", "secret 无法解析。");
}

export function parseOtpAuthUri(uri: string): ParseResult {
  try {
    const parsed = URI.parse(uri);
    if (parsed instanceof HOTP) {
      return failure("hotp", "HOTP 是计数器验证码，本工具只支持基于时间的 TOTP。");
    }
    if (!(parsed instanceof TOTP)) return failure("unsupported", "只支持 TOTP 链接。");

    const account = createAccount({
      issuer: parsed.issuer,
      label: parsed.label,
      secret: parsed.secret.base32,
      algorithm: parsed.algorithm,
      digits: parsed.digits,
      period: parsed.period,
    });
    return account ? { ok: true, account } : failure("invalid-secret", "otpauth 链接中的 secret 无效。");
  } catch (error) {
    const reason = String(error instanceof Error ? error.message : error).toLowerCase().includes("hotp")
      ? "hotp"
      : "invalid-uri";
    return failure(reason, reason === "hotp" ? "HOTP 是计数器验证码，本工具只支持 TOTP。" : "otpauth 链接无法解析。");
  }
}

export function extractOtpAuthUri(text: string): string | null {
  const match = text.match(/otpauth:\/\/[^\s"'<>]+/i);
  return match ? match[0] : null;
}

export function parseBackupText(text: string): ImportReport {
  const accounts: TotpAccount[] = [];
  const skipped: ImportReport["skipped"] = [];
  const seen = new Set<string>();
  const candidates = collectCandidates(text);

  for (const candidate of candidates) {
    const result = parseInput(candidate);
    if (result.ok) {
      if (!seen.has(result.account.id)) {
        seen.add(result.account.id);
        accounts.push(result.account);
      }
    } else {
      skipped.push({ input: candidate, reason: result.reason, message: result.message });
    }
  }

  return { accounts, skipped };
}

export function exportBackupText(accounts: TotpAccount[]): string {
  const lines = [
    "# 2FA 动态验证器 TOTP 迁移备份",
    "# 每行一个 otpauth 链接，请导入到新的验证器后再删除本备份。",
    "",
    ...accounts.map((account) => toOtpAuthUri(account)),
  ];
  return `${lines.join("\n")}\n`;
}

export function toOtpAuthUri(account: TotpAccount): string {
  const totp = new TOTP({
    issuer: account.issuer,
    label: account.label,
    secret: Secret.fromBase32(account.secret),
    algorithm: account.algorithm,
    digits: account.digits,
    period: account.period,
  });
  return totp.toString();
}

export function generateCode(account: TotpAccount, timestamp = Date.now()): string {
  return TOTP.generate({
    secret: Secret.fromBase32(account.secret),
    algorithm: account.algorithm,
    digits: account.digits,
    period: account.period,
    timestamp,
  });
}

export function secondsRemaining(account: Pick<TotpAccount, "period">, timestamp = Date.now()): number {
  const remainingMs = TOTP.remaining({ period: account.period, timestamp });
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function mergeAccounts(existing: TotpAccount[], incoming: TotpAccount[]): TotpAccount[] {
  const byId = new Map(existing.map((account) => [account.id, account]));
  for (const account of incoming) {
    byId.set(account.id, {
      ...byId.get(account.id),
      ...account,
      updatedAt: Date.now(),
    });
  }
  return [...byId.values()].sort((a, b) => sortKey(a).localeCompare(sortKey(b), "zh-Hans-CN"));
}

export function displayName(account: Pick<TotpAccount, "issuer" | "label">): string {
  return account.issuer ? `${account.issuer} / ${account.label}` : account.label;
}

function collectCandidates(text: string): string[] {
  const uris = text.match(/otpauth:\/\/[^\s"'<>]+/gi) ?? [];
  if (uris.length > 0) return uris;
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function accountId(account: Omit<TotpAccount, "id">): string {
  return fnv1a([account.issuer, account.label, account.secret, account.algorithm, account.digits, account.period].join("\0"));
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `acct_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function cleanName(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
}

function sortKey(account: TotpAccount): string {
  return `${account.issuer}\0${account.label}\0${account.id}`;
}

function failure(reason: ParseFailureReason, message: string): ParseResult {
  return { ok: false, reason, message };
}
