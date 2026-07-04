import { displayName, type TotpAccount } from "../../core/totp";
import { activeAccount } from "../state";
import { escapeAttr, escapeHtml } from "../format";
import type { AppState } from "../types";

export function accountsPanelHtml(state: AppState): string {
  return `
    <div class="panel accounts-panel">
      <div class="panel-heading compact">
        <div>
          <h2 class="panel-title">本地账号</h2>
          <p class="panel-note">${state.accounts.length ? `${state.accounts.length} 个账号保存在当前浏览器` : "暂无保存账号"}</p>
        </div>
        <button id="clearBtn" class="btn btn-sm btn-outline-danger" type="button" ${state.accounts.length ? "" : "disabled"}><i class="bi bi-trash3"></i> 清空</button>
      </div>
      <div class="account-list">
        ${state.accounts.length ? state.accounts.map((account) => accountItemHtml(state, account)).join("") : emptyAccountsHtml()}
      </div>
    </div>
  `;
}

function accountItemHtml(state: AppState, account: TotpAccount): string {
  const active = account.id === activeAccount(state)?.id ? " active" : "";
  return `
    <div class="account-item${active}">
      <button class="account-main select-account" type="button" data-id="${escapeAttr(account.id)}">
        <span class="account-name text-truncate">${escapeHtml(displayName(account))}</span>
        <span class="account-meta">${escapeHtml(account.algorithm)} · ${account.digits} 位 · ${account.period}s</span>
      </button>
      <div class="account-code mono" data-code-id="${escapeAttr(account.id)}">------</div>
      <div class="account-actions">
        <button class="icon-btn qr-account" type="button" data-id="${escapeAttr(account.id)}" title="生成二维码" aria-label="生成二维码"><i class="bi bi-qr-code"></i></button>
        <button class="icon-btn danger delete-account" type="button" data-id="${escapeAttr(account.id)}" title="删除" aria-label="删除"><i class="bi bi-x-lg"></i></button>
      </div>
    </div>
  `;
}

function emptyAccountsHtml(): string {
  return `
    <div class="empty-list">
      <i class="bi bi-database"></i>
      <span>粘贴有效 TOTP 后会自动保存到这里。</span>
    </div>
  `;
}
