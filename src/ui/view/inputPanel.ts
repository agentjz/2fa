import { escapeAttr, escapeHtml } from "../format";
import type { AppState } from "../types";

export function inputPanelHtml(state: AppState): string {
  const hasInput = state.input.value.trim().length > 0;
  return `
    <div class="tool-section input-section">
      <div class="panel-heading">
        <div>
          <h2 class="panel-title">输入</h2>
        </div>
      </div>

      <div class="input-wrap">
        <textarea
          id="importInput"
          class="form-control secret-input mono"
          rows="8"
          spellcheck="false"
          autocomplete="off"
          placeholder="otpauth://totp/...&#10;Base32 secret"
        >${escapeHtml(state.input.value)}</textarea>
      </div>

      ${inputStatusHtml(state)}

      <div class="metadata-grid">
        <label class="field-block">
          <span>服务方</span>
          <input id="issuerInput" class="form-control" autocomplete="off" value="${escapeAttr(state.input.issuer)}" placeholder="裸 secret 可选" />
        </label>
        <label class="field-block">
          <span>账号名</span>
          <input id="labelInput" class="form-control" autocomplete="off" value="${escapeAttr(state.input.label)}" placeholder="裸 secret 可选" />
        </label>
      </div>

      <div class="utility-row">
        <label class="btn btn-outline-secondary mb-0" for="qrFileInput"><i class="bi bi-image"></i> 图片</label>
        <input id="qrFileInput" class="d-none" type="file" accept="image/*" />
        <button id="scanBtn" class="btn btn-outline-secondary" type="button"><i class="bi bi-camera"></i> 摄像头</button>
        <button id="clearInputBtn" class="btn btn-outline-secondary ms-auto" type="button" ${hasInput ? "" : "disabled"}><i class="bi bi-eraser"></i> 清空输入</button>
      </div>
    </div>
  `;
}

function inputStatusHtml(state: AppState): string {
  if (!state.input.status) return `<div class="input-status"></div>`;
  return `<div class="input-status text-${state.input.status.kind}">${escapeHtml(state.input.status.text)}</div>`;
}
