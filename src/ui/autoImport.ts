import { displayName, parseBackupText, parseInput } from "../core/totp";
import { addAccounts } from "../storage/accountsStore";
import type { AppState } from "./types";

export function syncInputAccount(state: AppState): void {
  const raw = state.input.value.trim();
  if (!raw) {
    state.input.previewAccount = null;
    state.input.status = null;
    if (state.input.touched) state.selectedId = null;
    return;
  }

  if (looksLikeBackup(raw)) {
    syncBackupText(state, raw);
    return;
  }

  if (looksIncompleteSecret(raw)) {
    state.input.previewAccount = null;
    state.selectedId = null;
    state.input.status = null;
    return;
  }

  const parsed = parseInput(raw, { issuer: state.input.issuer, label: state.input.label });
  if (!parsed.ok) {
    state.input.previewAccount = null;
    state.selectedId = null;
    state.input.status = { kind: parsed.reason === "empty" ? "info" : "warning", text: parsed.message };
    return;
  }

  state.accounts = addAccounts(state.accounts, [parsed.account]);
  state.input.previewAccount = parsed.account;
  state.selectedId = parsed.account.id;
  state.input.status = { kind: "success", text: `已保存：${displayName(parsed.account)}` };
}

export function clearInputState(state: AppState): void {
  state.input.value = "";
  state.input.touched = true;
  state.input.previewAccount = null;
  state.input.status = null;
  state.selectedId = null;
  state.output.qr = null;
}

function syncBackupText(state: AppState, raw: string): void {
  const report = parseBackupText(raw);
  if (report.accounts.length) {
    state.accounts = addAccounts(state.accounts, report.accounts);
    state.input.previewAccount = report.accounts[0] ?? null;
    state.selectedId = state.input.previewAccount?.id ?? state.selectedId;
    state.input.status = {
      kind: "success",
      text: `已保存 ${report.accounts.length} 个账号${report.skipped.length ? `，跳过 ${report.skipped.length} 行` : ""}`,
    };
    return;
  }

  state.input.previewAccount = null;
  state.selectedId = null;
  state.input.status = { kind: "warning", text: report.skipped[0]?.message ?? "没有识别到可导入账号。" };
}

function looksLikeBackup(raw: string): boolean {
  return (raw.match(/otpauth:\/\//gi)?.length ?? 0) > 1 || raw.split(/\r?\n/).some((line) => line.trim().startsWith("#"));
}

function looksIncompleteSecret(raw: string): boolean {
  const hasOtpAuth = /otpauth:\/\//i.test(raw);
  const normalizedSecret = raw.replace(/[\s-]/g, "");
  return !hasOtpAuth && normalizedSecret.length < 16;
}
