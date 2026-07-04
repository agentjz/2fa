# 2FA

<p align="center">
  <strong>通用 RFC 6238 / TOTP 动态验证器</strong>
</p>

<p align="center">
  <a href="https://github.com/agentjz/2fa"><img alt="GitHub Repo" src="https://img.shields.io/badge/GitHub-agentjz%2F2fa-181717?logo=github"></a>
  <a href="https://agentjz.github.io/2fa/"><img alt="GitHub Pages" src="https://img.shields.io/badge/Pages-直接使用-2F6FED?logo=githubpages&logoColor=white"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white">
  <img alt="Bootstrap" src="https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white">
  <img alt="License MIT" src="https://img.shields.io/badge/License-MIT-blue">
</p>

<p align="center">
  <a href="https://agentjz.github.io/2fa/"><strong>打开 2FA 动态验证器</strong></a>
</p>

2FA 是一个纯静态浏览器 TOTP 工具，用于导入自己持有的 `otpauth://`、Base32 `secret`、二维码或迁移文本，并在本地生成当前验证码。

## 能做什么

- 粘贴即解析，自动保存到当前浏览器。
- 显示当前验证码和环形倒计时。
- 支持二维码图片导入和摄像头扫码。
- 支持本地多账号选择、删除和清空。
- 支持复制当前账号 `otpauth://` 链接。
- 支持下载当前账号二维码图片。

## 本地运行

```powershell
npm.cmd install
npm.cmd start
```

## 验证

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

## License

MIT License
