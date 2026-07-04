import { displayName, toOtpAuthUri, type TotpAccount } from "../core/totp";
import { escapeHtml } from "../ui/format";

interface OfflineAccount extends TotpAccount {
  name: string;
  uri: string;
}

export function offlinePageHtml(account: TotpAccount): string {
  const payload: OfflineAccount = {
    ...account,
    name: displayName(account),
    uri: toOtpAuthUri(account),
  };

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(payload.name)} - 2FA</title>
  <style>
${offlineCss()}
  </style>
</head>
<body>
  <main class="page">
    <section class="card" aria-label="2FA 验证码">
      <div class="kicker">2FA</div>
      <h1 id="accountName">${escapeHtml(payload.name)}</h1>
      <div class="codeRow">
        <div id="liveCode" class="code">------</div>
        <div id="timerRing" class="timer" style="--timer-progress:0%;--ring-color:#16815f">
          <div id="secondsLeft" class="timerCore">--</div>
        </div>
      </div>
      <button id="copyCodeBtn" class="primary" type="button">复制验证码</button>
      <div class="meta">
        <span id="algorithm">${escapeHtml(payload.algorithm)}</span>
        <span>${payload.digits} 位</span>
        <span>${payload.period}s 周期</span>
      </div>
      <label class="infoLabel" for="accountInfo">账号信息</label>
      <textarea id="accountInfo" readonly rows="5"></textarea>
      <button id="copyInfoBtn" class="secondary" type="button">复制账号信息</button>
    </section>
  </main>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <script id="accountData" type="application/json">${jsonForScript(payload)}</script>
  <script>
${offlineRuntime()}
  </script>
</body>
</html>
`;
}

function jsonForScript(value: OfflineAccount): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function offlineCss(): string {
  return `:root{--bg:#eef2f6;--surface:#fff;--ink:#141b2d;--muted:#657085;--line:#d7dde7;--soft:#f8fafc;--accent:#16815f;--danger:#d84a4a}
*{box-sizing:border-box;letter-spacing:0}
body{margin:0;min-height:100vh;background:var(--bg);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
button,textarea{font:inherit}
.page{min-height:100vh;display:grid;place-items:center;padding:24px}
.card{width:min(620px,100%);padding:28px;border:1px solid var(--line);border-radius:8px;background:var(--surface);box-shadow:0 18px 48px rgba(30,41,59,.1)}
.kicker{width:42px;height:42px;display:grid;place-items:center;border-radius:8px;background:var(--ink);color:#fff;font-weight:850}
h1{margin:18px 0 0;font-size:clamp(1.35rem,4.5vw,2rem);line-height:1.2;font-weight:780;overflow-wrap:anywhere}
.codeRow{display:grid;grid-template-columns:minmax(0,1fr)112px;gap:22px;align-items:center;margin:26px 0 20px}
.code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;font-size:clamp(3rem,12vw,5.2rem);line-height:.95;font-weight:850;color:#0f172a}
@property --timer-progress{syntax:"<percentage>";inherits:false;initial-value:0%}
@property --ring-color{syntax:"<color>";inherits:false;initial-value:#16815f}
.timer{--ring-track:#e6ebf1;width:112px;aspect-ratio:1;display:grid;place-items:center;border-radius:50%;background:conic-gradient(var(--ring-color) var(--timer-progress),var(--ring-track) 0),var(--ring-track);box-shadow:inset 0 0 0 1px rgba(20,27,45,.05),0 14px 28px rgba(15,23,42,.08);transition:--timer-progress 780ms cubic-bezier(.16,1,.3,1),--ring-color 780ms cubic-bezier(.16,1,.3,1)}
.timer:before{content:"";grid-area:1/1;width:74%;aspect-ratio:1;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 1px rgba(15,23,42,.04),0 8px 18px rgba(15,23,42,.08)}
.timerCore{grid-area:1/1;z-index:1;width:70%;aspect-ratio:1;display:grid;place-items:center;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;font-size:1.62rem;line-height:1;font-weight:850;text-align:center}
.primary,.secondary{width:100%;min-height:44px;border-radius:8px;border:1px solid transparent;font-weight:740;cursor:pointer}
.primary{background:var(--accent);color:#fff}
.primary:hover{background:#0f684d}
.secondary{margin-top:10px;background:#fff;border-color:var(--line);color:var(--ink)}
.secondary:hover{border-color:#b9c3d3;background:var(--soft)}
.meta{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 18px;color:var(--muted);font-size:.9rem}
.meta span{padding:5px 9px;border-radius:8px;background:var(--soft)}
.infoLabel{display:block;margin:0 0 8px;font-size:.88rem;font-weight:740;color:var(--muted)}
textarea{width:100%;resize:vertical;border:1px solid var(--line);border-radius:8px;background:#fbfcfe;color:var(--ink);padding:12px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;font-size:.86rem;line-height:1.45}
.toast{position:fixed;top:22px;right:22px;max-width:min(360px,calc(100vw - 32px));padding:12px 14px;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:8px;background:#fff;box-shadow:0 18px 42px rgba(15,23,42,.18);opacity:0;transform:translateY(-8px);transition:opacity .18s ease,transform .18s ease;pointer-events:none}
.toast.show{opacity:1;transform:translateY(0)}
@media (max-width:560px){.page{padding:14px}.card{padding:18px}.codeRow{grid-template-columns:1fr;justify-items:start}.timer{width:96px}.toast{top:auto;right:10px;bottom:12px}}`;
}

function offlineRuntime(): string {
  return `"use strict";
const account=JSON.parse(document.getElementById("accountData").textContent);
const codeEl=document.getElementById("liveCode");
const secondsEl=document.getElementById("secondsLeft");
const ringEl=document.getElementById("timerRing");
const infoEl=document.getElementById("accountInfo");
const toastEl=document.getElementById("toast");
let currentCode="";
let cryptoKey=null;
infoEl.value=["服务方: "+(account.issuer||"-"),"账号名: "+account.label,"算法: "+account.algorithm,"位数: "+account.digits,"周期: "+account.period+"s","",account.uri].join("\\n");
document.getElementById("copyCodeBtn").addEventListener("click",()=>copyText(currentCode,"验证码已复制"));
document.getElementById("copyInfoBtn").addEventListener("click",()=>copyText(infoEl.value,"账号信息已复制"));
setInterval(update,100);
update();
async function update(){
  const timing=timerTiming();
  secondsEl.textContent=String(timing.seconds);
  ringEl.style.setProperty("--timer-progress",timing.percent+"%");
  ringEl.style.setProperty("--ring-color",timerColor(timing.percent));
  try{
    const next=await generateCode();
    if(next!==currentCode){currentCode=next;codeEl.textContent=formatCode(next);}
  }catch(error){
    codeEl.textContent="不可用";
    showToast("当前浏览器无法在本地计算验证码");
  }
}
async function generateCode(){
  const key=await getKey();
  const counter=Math.floor(Date.now()/1000/account.period);
  const digest=new Uint8Array(await crypto.subtle.sign("HMAC",key,counterBytes(counter)));
  const offset=digest[digest.length-1]&15;
  const binary=((digest[offset]&127)<<24)|(digest[offset+1]<<16)|(digest[offset+2]<<8)|digest[offset+3];
  return String(binary%(10**account.digits)).padStart(account.digits,"0");
}
async function getKey(){
  if(cryptoKey)return cryptoKey;
  if(!globalThis.crypto?.subtle)throw new Error("crypto.subtle unavailable");
  cryptoKey=await crypto.subtle.importKey("raw",base32Bytes(account.secret),{name:"HMAC",hash:hashName(account.algorithm)},false,["sign"]);
  return cryptoKey;
}
function base32Bytes(secret){
  const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits=0,value=0,out=[];
  for(const char of secret.replace(/=+$/,"").toUpperCase()){
    const index=alphabet.indexOf(char);
    if(index<0)continue;
    value=(value<<5)|index;
    bits+=5;
    if(bits>=8){out.push((value>>>(bits-8))&255);bits-=8;}
  }
  return new Uint8Array(out);
}
function counterBytes(counter){
  const bytes=new Uint8Array(8);
  let value=BigInt(counter);
  for(let index=7;index>=0;index-=1){bytes[index]=Number(value&255n);value>>=8n;}
  return bytes;
}
function hashName(algorithm){
  if(algorithm==="SHA256")return "SHA-256";
  if(algorithm==="SHA512")return "SHA-512";
  return "SHA-1";
}
function timerTiming(){
  const periodMs=account.period*1000;
  const remainingMs=periodMs-(Date.now()%periodMs);
  const seconds=Math.max(0,Math.ceil(remainingMs/1000));
  return {seconds,percent:Math.max(0,Math.min(100,(seconds/account.period)*100))};
}
function timerColor(percent){
  const clamped=Math.max(0,Math.min(100,percent));
  if(clamped>55)return mix("#16815f","#1b8d67",(clamped-55)/45);
  if(clamped>25)return mix("#d99a20","#16815f",(clamped-25)/30);
  return mix("#d84a4a","#d99a20",clamped/25);
}
function mix(from,to,ratio){
  const a=hex(from),b=hex(to),r=Math.max(0,Math.min(1,ratio));
  return "rgb("+a.map((v,i)=>Math.round(v+(b[i]-v)*r)).join(" ")+")";
}
function hex(value){return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16));}
function formatCode(code){return code.length<=6?code.replace(/(\\d{3})(\\d+)/,"$1 $2"):code.replace(/(\\d{4})(\\d+)/,"$1 $2");}
async function copyText(text,message){
  try{await navigator.clipboard.writeText(text);showToast(message);}
  catch{showToast(legacyCopy(text)?message:"请手动复制");}
}
function legacyCopy(text){
  const input=document.createElement("textarea");
  input.value=text;
  input.setAttribute("readonly","");
  input.style.position="fixed";
  input.style.left="-9999px";
  document.body.appendChild(input);
  input.select();
  try{return document.execCommand("copy");}
  catch{return false;}
  finally{document.body.removeChild(input);}
}
function showToast(message){
  toastEl.textContent=message;
  toastEl.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>toastEl.classList.remove("show"),2400);
}`;
}
