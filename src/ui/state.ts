import type { TotpAccount } from "../core/totp";
import { loadAccounts } from "../storage/accountsStore";
import type { AppState } from "./types";

export function createAppState(): AppState {
  const accounts = loadAccounts();
  return {
    accounts,
    selectedId: accounts[0]?.id ?? null,
    input: {
      value: "",
      issuer: "",
      label: "",
      touched: false,
      previewAccount: null,
      status: null,
    },
    output: { qr: null },
    message: null,
    scannerOpen: false,
  };
}

export function activeAccount(state: AppState): TotpAccount | null {
  if (state.input.previewAccount) return state.input.previewAccount;
  if (state.input.touched && !state.input.value.trim()) return null;
  return selectedAccount(state);
}

export function selectedAccount(state: AppState): TotpAccount | null {
  return state.accounts.find((item) => item.id === state.selectedId) ?? state.accounts[0] ?? null;
}
