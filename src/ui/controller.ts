import type { IScannerControls } from "@zxing/browser";
import { displayName, generateCode, toOtpAuthUri } from "../core/totp";
import { saveOfflinePage } from "../export/downloadOfflinePage";
import { decodeQrImage, qrDataUrl, startQrScanner } from "../qr/qr";
import { removeAccount, saveAccounts } from "../storage/accountsStore";
import { clearInputState, syncInputAccount } from "./autoImport";
import { cssEscape, formatCode, safeFileName, timerColor, timerTiming } from "./format";
import { activeAccount, createAppState } from "./state";
import type { AppState, Message } from "./types";
import { appHtml } from "./view/appView";

export function createController(root: HTMLElement): { state: AppState; render: () => void } {
  const state = createAppState();
  let scannerControls: IScannerControls | null = null;
  let messageTimer: number | undefined;

  function render(): void {
    root.innerHTML = appHtml(state);
    bindEvents();
    updateLiveCodes();
  }

  function bindEvents(): void {
    input("importInput")?.addEventListener("input", handleSecretInput);
    input("issuerInput")?.addEventListener("input", handleMetaInput);
    input("labelInput")?.addEventListener("input", handleMetaInput);
    byId("clearInputBtn")?.addEventListener("click", clearCurrentInput);
    byId("qrFileInput")?.addEventListener("change", handleQrFile);
    byId("scanBtn")?.addEventListener("click", handleStartScanner);
    byId("stopScanBtn")?.addEventListener("click", () => stopScanner());
    byId("copyOutputUriBtn")?.addEventListener("click", copyOutputUri);
    byId("downloadQrBtn")?.addEventListener("click", downloadOutputQr);
    byId("exportOfflinePageBtn")?.addEventListener("click", downloadOfflinePage);
    byId("copyCodeBtn")?.addEventListener("click", copyActiveCode);
    byId("clearBtn")?.addEventListener("click", clearAllAccounts);
    byId("dismissToastBtn")?.addEventListener("click", () => {
      state.message = null;
      render();
    });

    document.querySelectorAll<HTMLButtonElement>(".select-account").forEach((button) => {
      button.addEventListener("click", () => selectSavedAccount(button.dataset.id ?? ""));
    });
    document.querySelectorAll<HTMLButtonElement>(".delete-account").forEach((button) => {
      button.addEventListener("click", () => deleteAccount(button.dataset.id ?? ""));
    });
    document.querySelectorAll<HTMLButtonElement>(".qr-account").forEach((button) => {
      button.addEventListener("click", () => showQr(button.dataset.id ?? ""));
    });
  }

  function handleSecretInput(event: Event): void {
    const target = event.currentTarget as HTMLTextAreaElement;
    state.input.value = target.value;
    state.input.touched = true;
    syncInputAccount(state);
    scheduleOutputQrRefresh(target);
    renderPreservingInput(target);
  }

  function handleMetaInput(event: Event): void {
    const target = event.currentTarget as HTMLInputElement;
    if (target.id === "issuerInput") state.input.issuer = target.value;
    if (target.id === "labelInput") state.input.label = target.value;
    syncInputAccount(state);
    scheduleOutputQrRefresh(target);
    renderPreservingInput(target);
  }

  function clearCurrentInput(): void {
    clearInputState(state);
    render();
  }

  async function handleQrFile(event: Event): Promise<void> {
    const target = event.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    target.value = "";
    if (!file) return;

    try {
      const text = await decodeQrImage(file);
      setInputFromExternalText(text, "已从二维码图片自动保存。");
    } catch {
      showMessage("danger", "二维码图片无法识别。");
      render();
    }
  }

  async function handleStartScanner(): Promise<void> {
    state.scannerOpen = true;
    render();
    const video = document.querySelector<HTMLVideoElement>("#scannerVideo");
    if (!video) return;
    try {
      scannerControls = await startQrScanner(video, (text) => setInputFromExternalText(text, "已从摄像头扫码自动保存。"), (message) =>
        showMessage("warning", message),
      );
    } catch {
      showMessage("danger", "无法启动摄像头扫码，请检查权限或改用二维码图片导入。");
      state.scannerOpen = false;
      render();
    }
  }

  function setInputFromExternalText(text: string, success: string): void {
    stopScanner(false);
    state.input.value = text;
    state.input.touched = true;
    syncInputAccount(state);
    if (state.input.previewAccount) {
      state.input.status = { kind: "success", text: success };
    }
    scheduleOutputQrRefresh();
    render();
  }

  function stopScanner(shouldRender = true): void {
    scannerControls?.stop();
    scannerControls = null;
    state.scannerOpen = false;
    if (shouldRender) render();
  }

  function selectSavedAccount(id: string): void {
    if (!state.accounts.some((account) => account.id === id)) return;
    state.selectedId = id;
    state.input.value = "";
    state.input.touched = false;
    state.input.previewAccount = null;
    state.input.status = null;
    scheduleOutputQrRefresh();
    render();
  }

  async function copyActiveCode(): Promise<void> {
    const account = activeAccount(state);
    if (!account) return;
    await copyText(generateCode(account), "验证码已复制。");
  }

  async function showQr(id: string): Promise<void> {
    const account = state.accounts.find((item) => item.id === id);
    if (!account) return;
    state.selectedId = id;
    state.input.value = "";
    state.input.touched = false;
    state.input.previewAccount = null;
    state.input.status = null;
    await refreshOutputQr();
    render();
  }

  function deleteAccount(id: string): void {
    const account = state.accounts.find((item) => item.id === id);
    if (!account) return;
    if (!window.confirm(`删除 ${displayName(account)}？请确认你已经有备份。`)) return;
    state.accounts = removeAccount(state.accounts, id);
    if (state.selectedId === id) state.selectedId = null;
    if (state.input.previewAccount?.id === id) clearInputState(state);
    if (state.output.qr?.accountId === id) state.output.qr = null;
    showMessage("info", "账号已删除。");
    render();
  }

  function clearAllAccounts(): void {
    if (!state.accounts.length) return;
    if (!window.confirm("清空当前浏览器保存的所有账号？请确认你已经导出备份。")) return;
    state.accounts = [];
    state.selectedId = null;
    state.input.previewAccount = null;
    state.input.status = null;
    state.output.qr = null;
    saveAccounts([]);
    showMessage("info", "已清空本地账号。");
    render();
  }

  async function refreshOutputQr(): Promise<void> {
    const account = activeAccount(state);
    if (!account) {
      state.output.qr = null;
      return;
    }
    if (state.output.qr?.accountId === account.id) return;
    const uri = toOtpAuthUri(account);
    state.output.qr = {
      accountId: account.id,
      title: displayName(account),
      uri,
      dataUrl: await qrDataUrl(uri),
    };
  }

  function scheduleOutputQrRefresh(preserve?: HTMLInputElement | HTMLTextAreaElement): void {
    const account = activeAccount(state);
    if (!account) return;
    if (state.output.qr?.accountId === account.id) return;
    const selection =
      preserve && preserve.selectionStart !== null && preserve.selectionEnd !== null
        ? { id: preserve.id, start: preserve.selectionStart, end: preserve.selectionEnd }
        : null;
    state.output.qr = null;
    void refreshOutputQr().then(() => {
      render();
      if (!selection) return;
      const next = input(selection.id);
      next?.focus();
      next?.setSelectionRange(selection.start, selection.end);
    });
  }

  async function copyOutputUri(): Promise<void> {
    const account = activeAccount(state);
    if (!account) return;
    await copyText(toOtpAuthUri(account), "链接已复制。");
  }

  function downloadOutputQr(): void {
    const qr = state.output.qr;
    if (!qr) return;
    const link = document.createElement("a");
    link.href = qr.dataUrl;
    link.download = `${safeFileName(qr.title)}.png`;
    link.click();
  }

  function downloadOfflinePage(): void {
    const account = activeAccount(state);
    if (!account) return;
    saveOfflinePage(account);
    showMessage("success", "离线页面已导出。");
    render();
  }

  function updateLiveCodes(): void {
    for (const account of state.accounts) {
      const codeEl = document.querySelector<HTMLElement>(`[data-code-id="${cssEscape(account.id)}"]`);
      if (codeEl) codeEl.textContent = formatCode(generateCode(account));
    }

    const account = activeAccount(state);
    if (!account) return;
    const timing = timerTiming(account);
    setText("liveCode", formatCode(generateCode(account)));
    setText("secondsLeft", String(timing.seconds));
    const ring = document.querySelector<HTMLElement>("#timerRing");
    if (ring) {
      ring.style.setProperty("--timer-progress", `${timing.percent}%`);
      ring.style.setProperty("--ring-color", timerColor(timing.percent));
    }
  }

  async function copyText(text: string, success: string): Promise<void> {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showMessage("success", success);
    } catch {
      showMessage("warning", "浏览器不允许直接复制，请手动选择文本复制。");
    }
    render();
  }

  function showMessage(kind: Message["kind"], text: string): void {
    state.message = { kind, text };
    window.clearTimeout(messageTimer);
    messageTimer = window.setTimeout(() => {
      state.message = null;
      render();
    }, 3600);
  }

  function renderPreservingInput(target: HTMLInputElement | HTMLTextAreaElement): void {
    const { id, selectionStart, selectionEnd } = target;
    render();
    const next = input(id);
    next?.focus();
    if (selectionStart !== null && selectionEnd !== null) {
      next?.setSelectionRange(selectionStart, selectionEnd);
    }
  }

  function byId(id: string): HTMLElement | null {
    return document.getElementById(id);
  }

  function input(id: string): HTMLInputElement | HTMLTextAreaElement | null {
    return document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  }

  function setText(id: string, value: string): void {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  window.setInterval(updateLiveCodes, 80);
  void refreshOutputQr().then(render);
  return { state, render };
}
