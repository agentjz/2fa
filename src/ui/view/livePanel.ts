import { displayName, type TotpAccount } from "../../core/totp";
import { escapeHtml } from "../format";
import type { AppState } from "../types";

export function livePanelHtml(state: AppState, account: TotpAccount | null): string {
  if (!account) {
    return `
      <div class="panel live-panel empty-live">
        <div class="empty-icon"><i class="bi bi-key"></i></div>
        <h2 class="panel-title">等待粘贴</h2>
        <p class="panel-note mb-0">把平台给你的二维码内容、otpauth 链接或 setup key 粘进左侧，验证码会自动显示在这里。</p>
      </div>
    `;
  }

  const sourceLabel = state.input.previewAccount?.id === account.id ? "当前输入" : "已保存账号";
  return `
    <div class="panel live-panel">
      <div class="live-top">
        <div class="text-truncate-min">
          <div class="section-kicker">${sourceLabel}</div>
          <h2 class="live-name text-truncate">${escapeHtml(displayName(account))}</h2>
        </div>
        <button id="copyCodeBtn" class="btn btn-success copy-code-btn" type="button"><i class="bi bi-clipboard-check"></i> 复制</button>
      </div>

      <div class="code-row">
        <div id="liveCode" class="code-display mono">------</div>
        <div id="timerRing" class="timer-ring" style="--timer-progress: 0%">
          <div id="secondsLeft" class="timer-ring-core mono">--</div>
        </div>
      </div>

      <div class="live-meta">
        <span>${escapeHtml(account.algorithm)}</span>
        <span>${account.digits} 位</span>
        <span>${account.period}s 周期</span>
      </div>
    </div>
  `;
}
