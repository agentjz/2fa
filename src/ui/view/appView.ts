import { activeAccount } from "../state";
import { escapeHtml } from "../format";
import type { AppState, Message } from "../types";
import { accountsPanelHtml } from "./accountsPanel";
import { inputPanelHtml } from "./inputPanel";
import { livePanelHtml } from "./livePanel";
import { outputPanelHtml, scannerModalHtml } from "./supportPanels";

export function appHtml(state: AppState): string {
  const active = activeAccount(state);
  return `
    <header class="topbar">
      <div class="app-shell d-flex align-items-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-3 text-truncate-min">
          <div class="brand-mark">2FA</div>
          <div class="text-truncate-min">
            <h1 class="app-title mb-0">2FA 动态验证器</h1>
          </div>
        </div>
      </div>
    </header>

    <main class="app-shell workspace">
      <div class="workspace-grid">
        <section class="panel tool-panel">
          ${inputPanelHtml(state)}
          ${outputPanelHtml(state)}
        </section>

        <section class="right-stack">
          ${livePanelHtml(state, active)}
          ${accountsPanelHtml(state)}
        </section>
      </div>
      ${scannerModalHtml(state)}
    </main>
    ${state.message ? toastHtml(state.message) : ""}
  `;
}

function toastHtml(message: Message): string {
  return `
    <div class="toast-layer" role="status" aria-live="polite">
      <div class="app-toast toast-${message.kind}">
        <span>${escapeHtml(message.text)}</span>
        <button id="dismissToastBtn" type="button" class="toast-close" aria-label="关闭"><i class="bi bi-x-lg"></i></button>
      </div>
    </div>
  `;
}
