import { displayName, type TotpAccount } from "../core/totp";
import { safeFileName } from "../ui/format";
import { offlinePageHtml } from "./offlinePage";

export function saveOfflinePage(account: TotpAccount): void {
  const html = offlinePageHtml(account);
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(displayName(account))}-2fa.html`;
  link.click();
  URL.revokeObjectURL(url);
}
