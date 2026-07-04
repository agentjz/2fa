import type { TotpAccount } from "../core/totp";

export type Message = { kind: "success" | "warning" | "danger" | "info"; text: string };

export interface InputState {
  value: string;
  issuer: string;
  label: string;
  touched: boolean;
  previewAccount: TotpAccount | null;
  status: Message | null;
}

export interface AppState {
  accounts: TotpAccount[];
  selectedId: string | null;
  input: InputState;
  output: { qr: { accountId: string; title: string; dataUrl: string; uri: string } | null };
  message: Message | null;
  scannerOpen: boolean;
}
