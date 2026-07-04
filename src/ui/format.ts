import type { TotpAccount } from "../core/totp";

export function formatCode(code: string): string {
  if (code.length <= 6) return code.replace(/(\d{3})(\d+)/, "$1 $2");
  return code.replace(/(\d{4})(\d+)/, "$1 $2");
}

export function timerTiming(account: Pick<TotpAccount, "period">): { seconds: number; percent: number } {
  const periodMs = account.period * 1000;
  const elapsed = Date.now() % periodMs;
  const remainingMs = periodMs - elapsed;
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return {
    seconds,
    percent: Math.max(0, Math.min(100, (seconds / account.period) * 100)),
  };
}

export function safeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").replace(/\s+/g, " ").trim().slice(0, 80) || "2fa-qr";
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char] ?? char;
  });
}

export function escapeAttr(value: string): string {
  return escapeHtml(value);
}

export function cssEscape(value: string): string {
  const css = globalThis.CSS as { escape?: (input: string) => string } | undefined;
  return typeof css?.escape === "function" ? css.escape(value) : value.replace(/["\\]/g, "\\$&");
}
