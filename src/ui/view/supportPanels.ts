import { displayName, toOtpAuthUri } from "../../core/totp";
import { activeAccount } from "../state";
import { escapeAttr, escapeHtml } from "../format";
import type { AppState } from "../types";

export function scannerModalHtml(state: AppState): string {
  if (!state.scannerOpen) return "";
  return `
    <div class="scanner-backdrop" role="dialog" aria-modal="true" aria-label="摄像头扫码">
      <div class="scanner-modal">
        <div class="modal-head">
          <h2 class="panel-title">摄像头</h2>
          <button id="stopScanBtn" class="modal-close" type="button" aria-label="关闭"><i class="bi bi-x-lg"></i></button>
        </div>
        <video id="scannerVideo" class="scanner-video" muted playsinline></video>
      </div>
    </div>
  `;
}

export function outputPanelHtml(state: AppState): string {
  return `
    <div class="tool-section output-section">
      <div class="panel-heading compact">
        <h2 class="panel-title">输出</h2>
      </div>
      ${outputQrHtml(state)}
    </div>
  `;
}

function outputQrHtml(state: AppState): string {
  const account = activeAccount(state);
  if (!account) return `<div class="output-empty">暂无账号</div>`;

  const cached = state.output.qr?.accountId === account.id ? state.output.qr : null;
  const uri = cached?.uri ?? toOtpAuthUri(account);
  return `
    <div class="output-qr">
      <div class="output-qr-box">
        ${
          cached
            ? `<img id="outputQrImage" class="qr-preview" src="${escapeAttr(cached.dataUrl)}" alt="otpauth QR" />`
            : `<div class="qr-loading"><i class="bi bi-qr-code"></i></div>`
        }
      </div>
      <div class="output-qr-meta">
        <div class="fw-semibold text-truncate">${escapeHtml(displayName(account))}</div>
        <div class="output-actions">
          <button id="copyOutputUriBtn" class="btn btn-outline-secondary" type="button"><i class="bi bi-clipboard"></i> 复制链接</button>
          <button id="downloadQrBtn" class="btn btn-outline-secondary" type="button" ${cached ? "" : "disabled"}><i class="bi bi-download"></i> 下载图片</button>
        </div>
        <textarea class="form-control mono qr-uri" rows="3" readonly>${escapeHtml(uri)}</textarea>
      </div>
    </div>
  `;
}
