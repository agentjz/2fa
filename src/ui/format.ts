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

export function timerColor(percent: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  if (clamped > 55) return interpolateColor("#16815f", "#1b8d67", (clamped - 55) / 45);
  if (clamped > 25) return interpolateColor("#d99a20", "#16815f", (clamped - 25) / 30);
  return interpolateColor("#d84a4a", "#d99a20", clamped / 25);
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

function interpolateColor(from: string, to: string, ratio: number): string {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const mix = Math.max(0, Math.min(1, ratio));
  const channels = start.map((value, index) => Math.round(value + (end[index] - value) * mix));
  return `rgb(${channels[0]} ${channels[1]} ${channels[2]})`;
}

function hexToRgb(value: string): [number, number, number] {
  return [1, 3, 5].map((index) => Number.parseInt(value.slice(index, index + 2), 16)) as [number, number, number];
}
