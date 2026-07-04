import { isTotpAccount, mergeAccounts, type TotpAccount } from "../core/totp";

const STORAGE_KEY = "agentjz.2fa.accounts.v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadAccounts(storage: StorageLike = window.localStorage): TotpAccount[] {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTotpAccount);
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: TotpAccount[], storage: StorageLike = window.localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(accounts.filter(isTotpAccount)));
}

export function addAccounts(
  existing: TotpAccount[],
  incoming: TotpAccount[],
  storage: StorageLike = window.localStorage,
): TotpAccount[] {
  const merged = mergeAccounts(existing, incoming);
  saveAccounts(merged, storage);
  return merged;
}

export function removeAccount(existing: TotpAccount[], id: string, storage: StorageLike = window.localStorage): TotpAccount[] {
  const next = existing.filter((account) => account.id !== id);
  saveAccounts(next, storage);
  return next;
}

export function clearAccounts(storage: StorageLike = window.localStorage): void {
  storage.removeItem(STORAGE_KEY);
}
