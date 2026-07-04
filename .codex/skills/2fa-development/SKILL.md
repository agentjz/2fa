---
name: 2fa-development
description: 维护 2FA 动态验证器时使用。适用于修改 TOTP 计算、otpauth 解析、二维码导入输出、浏览器本地存储、安全边界、测试、README、spec、AGENTS、skills、运行配置或部署流程；要求按当前产品事实完成生产级验证闭环。
---

# 2FA Development

先确认当前事实，再执行任务。事实来自 `spec.md`、`AGENTS.md`、`README.md`、`.codex/skills/`、测试、配置、git 状态、命令结果和 owner 明确输入。

## 产品主干

2FA 动态验证器是通用 RFC 6238 / TOTP 静态浏览器工具。

当前能力：

- `otpauth://totp/...` 链接导入。
- 裸 Base32 `secret` 导入。
- 一行一个 `otpauth://` 链接的迁移文本导入。
- 二维码图片导入。
- 摄像头弹窗扫码导入。
- localStorage 多账号保存。
- 当前验证码展示、复制和环形倒计时。
- 当前账号二维码生成、链接复制和图片下载。
- GitHub Pages 静态部署。

## 工程规则

- 使用 TypeScript、Vite、原生 DOM、Bootstrap、Bootstrap Icons、OTPAuth、QRCode、@zxing/browser 和 Vitest。
- 运行时代码通过 npm 依赖和构建产物固定。
- TOTP、otpauth 解析、序列化和存储规则放到可测试模块中。
- 页面负责交互编排和展示，复杂规则放到 `src/core/`、`src/storage/`、`src/qr/` 或 `src/ui/` 专门模块。
- 文件职责按变化原因划分。
- 超过 300 行必须触发职责审查。
- 新增抽象必须降低真实复杂度、隔离变化、提升测试性或匹配现有模块边界。
- 避免用 `any` 或无类型对象逃避设计。

## TOTP 规则

- 默认算法为 SHA-1。
- 默认位数为 6。
- 默认周期为 30 秒。
- 兼容 SHA-1、SHA-256、SHA-512。
- HOTP 明确拒绝。
- 无效 secret 明确失败。
- 设备时间影响验证码正确性；涉及时钟提示时按真实风险说明。

## 安全规则

- `secret`、`otpauth://` 链接、二维码图片和迁移文本都是敏感数据。
- 密钥只进入浏览器内存、localStorage 和用户主动复制或下载的本地输出。
- 密钥不得进入日志、测试快照、错误上报、统计、远程配置、URL query 或第三方网络请求。
- 扫码、上传二维码图片、粘贴文本、复制链接和下载二维码都保持本地处理边界。

## 模块边界

- `src/core/totp.ts`：TOTP 类型、解析、归一化、验证码生成和 URI 序列化。
- `src/storage/accountsStore.ts`：localStorage 读写、去重和恢复。
- `src/qr/qr.ts`：二维码图片解析、摄像头扫码接线和二维码生成。
- `src/ui/controller.ts`：DOM 事件、摄像头、复制、下载和删除等外部接线。
- `src/ui/autoImport.ts`：输入自动解析、自动保存和输入状态判断。
- `src/ui/state.ts`：应用状态创建和当前账号选择器。
- `src/ui/view/`：页面 HTML 模板。
- `src/styles/`：基础、布局、输入、验证码、账号、辅助面板和响应式样式。
- `tests/`：TOTP、解析、导入输出和存储边界测试。

## 验证

代码任务收尾前按项目脚本运行验证：

- `npm.cmd test`
- `npm.cmd run typecheck`
- `npm.cmd run build`

修改本地启动入口时运行：

- `python .\start.py --check`

生产级验收覆盖：

- RFC 6238 测试向量。
- Base32 解析。
- `otpauth://totp/...` 解析。
- HOTP 拒绝。
- 迁移文本导入。
- 当前账号二维码生成。
- 当前账号链接复制来源。
- 无效输入错误提示。
- 构建或静态部署检查。
- 密钥本地处理边界。

commit / push 只在 owner 明确要求时执行。
