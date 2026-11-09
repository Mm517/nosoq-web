/* Nosoq shared: supabase client + styles + helpers + support desk (used by /support) — عربي فقط */
(function(){
const sb=window.sb||supabase.createClient(window.NASAQ_SUPABASE_URL,window.NASAQ_SUPABASE_ANON_KEY);
const N=n=>Number(n||0).toLocaleString('en-US');
const D=d=>d?new Date(d).toLocaleString('en-GB',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* أيقونات: بنستخدم مكتبة المشروع، وللناقص منها أيقونات محلية */
const LOCAL={
  phone:'<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.12.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0122 16.92z"/>',
  img:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  down:'<path d="M6 9l6 6 6-6"/>',
  up:'<path d="M18 15l-6-6-6 6"/>',
  vol:'<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14"/>',
  mute:'<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M23 9l-6 6M17 9l6 6"/>',
  wa:'<path d="M21 11.5a8.5 8.5 0 01-12.6 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1121 11.5z"/><path d="M9 8.5c0 3 3 6 6 6l1.2-1.4-2-1-.8.7a4 4 0 01-2.1-2.1l.7-.8-1-2z"/>',
  close:'<path d="M18 6L6 18M6 6l12 12"/>'
};
const I=(n,s)=>{s=s||18;if(LOCAL[n])return `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LOCAL[n]}</svg>`;return window.NIcon?window.NIcon(n,{size:s}):''};
/* الكود = نوع صاحب المحادثة. كل موظف دعم يشوف الأنواع المحددة له بس (الفلترة على السيرفر كمان). */
const ORG={SL:['البائعين','#2563c9','seller','بائع'],RD:['السائقين','#0f8f83','rider','سائق'],US:['المستخدمين','#7c3aed','customer','مستخدم'],GS:['الزوّار','#64748b','guest','زائر']};
const pfx=t=>(t||'').slice(0,2).toUpperCase();
const ST={open:'مفتوحة',in_progress:'جارية',resolved:'تم الحل',closed:'مغلقة'};
const PST={approved:'مقبول',active:'نشط',pending:'قيد المراجعة',rejected:'مرفوض',suspended:'موقوف',disabled:'موقوف'};
const isOpen=t=>t.status==='open'||t.status==='in_progress';
const clock=d=>d?new Date(d).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false}):'';
const fdate=d=>d?new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'}):'';
function ago(d){if(!d)return'';const s=(Date.now()-new Date(d))/1000;if(s<60)return'الآن';if(s<3600)return Math.floor(s/60)+' د';if(s<86400)return Math.floor(s/3600)+' س';if(s<172800)return'أمس';return new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit'})}
function dayLabel(d){const a=new Date(d),n=new Date(),k=x=>x.toDateString();if(k(a)===k(n))return'اليوم';if(k(a)===k(new Date(n-864e5)))return'أمس';return fdate(d)}
const waNum=p=>{let d=String(p||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);else if(d.startsWith('0'))d='20'+d.slice(1);return d};
const safeUrl=u=>/^(https?:\/\/|data:image\/)/i.test(String(u||''))?String(u):'';
const store={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}}};

const css=`
:root{--bg:#f3f7fc;--card:#fff;--tx:#10233f;--mu:#5c6e88;--bd:#e1e9f4;--ac:#2563c9;--ac-d:#1c4fa8;--ok:#16a34a;--wr:#d9931a;--er:#d92d20;--soft:#eaf2fd;--side:#12294a;--sh:0 1px 2px rgba(16,35,63,.04),0 12px 32px rgba(22,63,138,.08)}
@media(prefers-color-scheme:dark){:root{--bg:#0a1424;--card:#12203a;--tx:#eaf1fb;--mu:#93a6c4;--bd:#243657;--soft:#1a2f57;--sh:0 1px 2px rgba(0,0,0,.3),0 12px 32px rgba(0,0,0,.25)}}
*{box-sizing:border-box}html,body{margin:0;min-height:100%}body{font-family:Cairo,system-ui,sans-serif;background:var(--bg);color:var(--tx);direction:rtl;font-variant-numeric:lining-nums tabular-nums;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent}
body.sx-lock{overflow:hidden}
button,input,textarea,select{font:inherit;color:inherit}[hidden]{display:none!important}
.ic{flex:none}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid transparent;border-radius:12px;padding:0 16px;min-height:42px;background:var(--ac);color:#fff;cursor:pointer;font-weight:700;font-size:14px;transition:background .15s,border-color .15s,color .15s;text-decoration:none;white-space:nowrap}
.btn:hover{background:var(--ac-d)}.btn:disabled{opacity:.55;cursor:not-allowed}
.btn.g{background:var(--card);color:var(--tx);border-color:var(--bd)}.btn.g:hover{background:var(--soft);border-color:var(--ac);color:var(--ac)}
.btn.g.on{background:var(--soft);border-color:var(--ac);color:var(--ac)}
.btn.r{background:var(--card);color:var(--er);border-color:rgba(217,45,32,.35)}.btn.r:hover{background:var(--er);color:#fff;border-color:var(--er)}
.btn.w{background:#fff6e9;color:#8f5b00;border-color:#f0cf95}.btn.w:hover{background:#ffedcf}
.btn.ok{background:#e4f6ea;color:#11803a;border-color:#b7e3c6}.btn.ok:hover{background:#d3f0de}
.btn.s{min-height:36px;padding:0 12px;font-size:13px;border-radius:10px}
.btn.ico{width:42px;padding:0}.btn.s.ico{width:36px}
input,textarea,select{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:10px 14px;width:100%;font-size:16px}
input:focus,textarea:focus,select:focus{outline:0;border-color:var(--ac);box-shadow:0 0 0 3px var(--soft)}
.card{background:var(--card);border:1px solid var(--bd);border-radius:20px;padding:18px;box-shadow:var(--sh)}
.pill{display:inline-flex;align-items:center;gap:5px;padding:3px 11px;border-radius:99px;font-size:12px;font-weight:700;background:var(--soft);color:var(--ac);white-space:nowrap}
.pill.open{background:#fff4d9;color:#b45309}.pill.in_progress{background:var(--soft);color:var(--ac)}.pill.resolved{background:#e4f6ea;color:#11803a}.pill.closed{background:#e6eef9;color:#3f5372}
.scope{display:flex;flex-wrap:wrap;gap:8px;align-items:center;color:var(--mu);font-size:13px;font-weight:600}
.scope b{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:99px;color:#fff;font-size:12px}
.toast{position:fixed;top:calc(16px + env(safe-area-inset-top,0px));inset-inline:16px;margin-inline:auto;width:fit-content;max-width:min(380px,calc(100% - 32px));background:var(--side);color:#fff;padding:12px 18px;border-radius:14px;z-index:200;box-shadow:0 14px 34px rgba(16,35,63,.3);display:flex;gap:10px;align-items:center;font-weight:600;font-size:14px;animation:sxin .25s ease}
@keyframes sxin{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
.login{max-width:400px;margin:12vh auto 0;display:grid;gap:14px;padding:30px}
.login h2{margin:0;font-size:22px}.login .lg{width:48px;height:48px;border-radius:14px;background:var(--soft);color:var(--ac);display:grid;place-items:center}
.login .er{color:var(--er);min-height:20px;font-size:14px}

/* ===== مكتب الدعم ===== */
.sx-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:12px}
.sx-bar__r{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.sx-grid{display:grid;grid-template-columns:390px minmax(0,1fr);gap:16px;height:calc(100dvh - 196px);min-height:540px}
.sx-list{display:flex;flex-direction:column;padding:0!important;overflow:hidden;min-height:0}
.sx-tools{padding:12px;border-bottom:1px solid var(--bd);display:grid;gap:10px}
.chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.chips::-webkit-scrollbar{display:none}
@media(min-width:861px){.chips{flex-wrap:wrap;overflow:visible}}
.chips button{flex:none;border:1px solid var(--bd);background:var(--card);padding:6px 13px;border-radius:99px;cursor:pointer;color:var(--mu);font-weight:700;font-size:12.5px;display:inline-flex;gap:6px;align-items:center;transition:all .15s;min-height:34px}
.chips button b{background:var(--bg);color:var(--tx);border-radius:99px;padding:0 7px;font-size:11px;min-width:20px;text-align:center}
.chips button:hover{border-color:var(--ac);color:var(--ac)}
.chips .on{background:var(--ac);border-color:var(--ac);color:#fff}.chips .on b{background:#fff;color:var(--ac)}
.chips .help.on{background:var(--wr);border-color:var(--wr)}.chips .help.on b{color:var(--wr)}
.tks{overflow:auto;flex:1;min-height:0;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.tk{display:flex;gap:12px;align-items:flex-start;padding:13px 14px;border-bottom:1px solid var(--bd);cursor:pointer;transition:background .12s;text-decoration:none;color:inherit;position:relative}
.tk:hover,.tk.on{background:var(--soft)}
.tk.un::before{content:"";position:absolute;inset-inline-start:0;top:10px;bottom:10px;width:4px;border-radius:0 4px 4px 0;background:var(--ac)}
.tk-b{flex:1;min-width:0;display:grid;gap:3px}
.tk-r1,.tk-r2,.tk-r3{display:flex;align-items:center;gap:8px;min-width:0}
.tk-r1{justify-content:space-between}
.tk-nm{font-size:14.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-flex;align-items:center;gap:6px}
.tk.un .tk-nm{font-weight:800}
.tk-tm{font-size:11.5px;color:var(--mu);flex:none}
.tk.un .tk-tm{color:var(--ac);font-weight:700}
.tk-ty{font-size:11px;font-weight:800;padding:1px 8px;border-radius:99px;color:#fff;flex:none}
.tk-cd{font-size:11.5px;color:var(--mu);font-weight:700;direction:ltr}
.tk-ph{font-size:11.5px;color:var(--mu);direction:ltr;white-space:nowrap}
.tk-pv{flex:1;min-width:0;color:var(--mu);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tk.un .tk-pv{color:var(--tx);font-weight:600}
.dot{background:var(--ac);color:#fff;border-radius:99px;min-width:20px;height:20px;display:grid;place-items:center;font-size:11px;font-weight:800;padding:0 7px;flex:none}
.flag{color:var(--wr);display:inline-flex}
.empty{padding:40px 16px;text-align:center;color:var(--mu);font-weight:600}
.sx-av{--s:46px;width:var(--s);height:var(--s);border-radius:50%;background:var(--c,#64748b);color:#fff;display:grid;place-items:center;font-weight:800;font-size:calc(var(--s)*.38);position:relative;overflow:hidden;flex:none}
.sx-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:var(--card)}
.sx-av.lg{--s:56px}.sx-av.sm{--s:38px}

.sx-chat{display:flex;flex-direction:column;padding:0!important;overflow:hidden;min-height:0;background:var(--card)}
.sx-ph{margin:auto;color:var(--mu);display:grid;justify-items:center;gap:10px;text-align:center;padding:20px}.sx-ph svg{width:56px;height:56px;color:#b4c7e4}
.sx-hd{display:flex;align-items:center;gap:10px;padding:10px 14px;padding-top:calc(10px + env(safe-area-inset-top,0px));border-bottom:1px solid var(--bd);background:var(--card)}
.sx-back{display:none}
.sx-who{display:flex;align-items:center;gap:11px;flex:1;min-width:0;background:none;border:0;padding:4px;cursor:pointer;text-align:start;border-radius:12px}
.sx-who:hover{background:var(--soft)}
.sx-who div{min-width:0}
.sx-who h3{margin:0;font-size:15.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:6px}
.sx-who small{display:flex;gap:8px;align-items:center;color:var(--mu);font-size:12px;margin-top:2px;white-space:nowrap;overflow:hidden}
.sx-who small .ph{direction:ltr;font-weight:700}
.sx-who .ty{font-size:11px;font-weight:800;padding:1px 8px;border-radius:99px;color:#fff}
.sx-hd .chev{color:var(--mu);transition:transform .2s;flex:none}.sx-hd .chev.on{transform:rotate(180deg)}
#chh{flex:none}
.sx-info{padding:12px 16px;border-bottom:1px solid var(--bd);background:var(--bg);max-height:min(42dvh,380px);overflow:auto}
.sx-kvs{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px 18px}
.sx-kv{display:grid;gap:1px;padding:6px 0;border-bottom:1px dashed var(--bd);min-width:0}
.sx-kv span{font-size:11.5px;color:var(--mu);font-weight:700}
.sx-kv b{font-size:14px;font-weight:700;word-break:break-word}
.sx-ml{display:inline-flex;align-items:center;gap:4px;margin-inline-start:8px;padding:2px 10px;border-radius:99px;background:var(--soft);color:var(--ac);font-size:12px;font-weight:800;text-decoration:none}
.sx-sub{display:flex;gap:8px;align-items:center;padding:9px 14px;border-bottom:1px solid var(--bd);overflow-x:auto;scrollbar-width:none}.sx-sub::-webkit-scrollbar{display:none}
.sx-sub .sj{flex:1;min-width:90px;font-size:13px;color:var(--mu);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sx-sub .btn{flex:none}
.sx-note{display:flex;gap:8px;align-items:flex-start;padding:9px 16px;background:#fff6e9;color:#7a4e06;font-size:13px;font-weight:600;border-bottom:1px solid #f3dfb6}
.sx-note svg{margin-top:3px}
@media(prefers-color-scheme:dark){.sx-note{background:#3a2a0c;color:#f3d79a;border-color:#5a4216}.btn.w{background:#3a2a0c;color:#f3d79a;border-color:#5a4216}.btn.ok{background:#12351f;color:#7bd69b;border-color:#1e5a34}}
.msgs{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:6px;background:var(--bg);min-height:0;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.sx-day{align-self:center;font-size:11.5px;color:var(--mu);background:var(--card);border:1px solid var(--bd);padding:2px 12px;border-radius:99px;margin:8px 0;font-weight:700}
.m{max-width:min(80%,540px);padding:9px 13px 7px;border-radius:16px 16px 16px 4px;background:var(--card);border:1px solid var(--bd);align-self:flex-start;white-space:pre-wrap;word-break:break-word;line-height:1.75;font-size:14.5px}
.m.st{align-self:flex-end;background:var(--ac);border-color:transparent;color:#fff;border-radius:16px 16px 4px 16px}
.m.ad{align-self:flex-end;background:var(--side);border-color:transparent;color:#fff;border-radius:16px 16px 4px 16px}
.m .who{display:block;font-size:11.5px;font-weight:800;opacity:.8;margin-bottom:2px}
.m .tm{display:block;opacity:.7;font-size:11px;margin-top:3px;text-align:end}
.m .pics{display:grid;gap:6px;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));margin-top:6px;max-width:300px}
.m .pics img{width:100%;max-height:220px;object-fit:cover;border-radius:10px;display:block;cursor:zoom-in;background:rgba(0,0,0,.06)}
.m .pics.one{grid-template-columns:1fr}.m .pics.one img{max-height:280px;object-fit:contain}
.sx-closed{display:flex;gap:10px;align-items:center;justify-content:center;padding:14px;border-top:1px solid var(--bd);color:var(--mu);font-weight:700;background:var(--card);padding-bottom:calc(14px + env(safe-area-inset-bottom,0px))}
.cmp{padding:10px 12px;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--bd);background:var(--card)}
.cmp.drag{outline:2px dashed var(--ac);outline-offset:-6px}
.cmp-row{display:flex;gap:8px;align-items:flex-end}
.cmp textarea{resize:none;height:46px;max-height:140px;border-radius:14px;line-height:1.5;padding:10px 14px}
.cmp .att{width:46px;height:46px;flex:none;padding:0;cursor:pointer}
.cmp .go{min-height:46px;flex:none}
.pvs{display:flex;gap:8px;overflow-x:auto;padding:0 2px 10px}
.pv{position:relative;width:64px;height:64px;flex:none;border-radius:12px;overflow:hidden;border:1px solid var(--bd)}
.pv img{width:100%;height:100%;object-fit:cover;display:block}
.pv button{position:absolute;top:3px;inset-inline-end:3px;width:22px;height:22px;border-radius:50%;border:0;background:rgba(16,35,63,.8);color:#fff;display:grid;place-items:center;cursor:pointer;padding:0}
.hint{font-size:11.5px;color:var(--mu);padding:4px 4px 0}
.sx-lb{position:fixed;inset:0;z-index:300;background:rgba(6,14,28,.92);display:grid;place-items:center;padding:16px}
.sx-lb img{max-width:100%;max-height:100%;border-radius:10px}
.sx-lb button{position:absolute;top:calc(14px + env(safe-area-inset-top,0px));inset-inline-end:14px;width:42px;height:42px;border-radius:50%;border:0;background:rgba(255,255,255,.16);color:#fff;display:grid;place-items:center;cursor:pointer}
.sx-md{position:fixed;inset:0;z-index:250;background:rgba(16,35,63,.5);display:flex;align-items:flex-end;justify-content:center;padding:0}
.sx-md>div{background:var(--card);width:min(480px,100%);border-radius:22px 22px 0 0;padding:20px;padding-bottom:calc(20px + env(safe-area-inset-bottom,0px));display:grid;gap:12px}
.sx-md h3{margin:0;font-size:17px}.sx-md p{margin:0;color:var(--mu);font-size:13.5px}
.sx-md textarea{height:90px;resize:none}
.sx-md .row{display:flex;gap:8px}.sx-md .row .btn{flex:1}
@media(min-width:700px){.sx-md{align-items:center;padding:20px}.sx-md>div{border-radius:22px}}
.sx-staff{margin-top:16px}
.sx-staff h3{margin:0 0 12px}
.sx-sf{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.sx-sf input{max-width:280px}
.sx-sr{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 0;border-top:1px solid var(--bd)}
.sx-sr .nm{flex:1;min-width:180px;font-weight:700}.sx-sr .nm small{display:block;color:var(--mu);direction:ltr;text-align:end;font-weight:400}
.sx-sr label{display:inline-flex;gap:6px;align-items:center;white-space:nowrap;font-size:13.5px}.sx-sr input[type=checkbox]{width:auto}

@media(max-width:860px){
  .sx-grid{display:block;height:auto;min-height:0}
  .sx-list{height:calc(100dvh - 232px);min-height:420px;border-radius:18px}
  .sx-chat{display:none}
  .sx--chat .sx-chat{display:flex;position:fixed;inset:0;z-index:120;border:0;border-radius:0;height:100dvh;box-shadow:none}
  .sx-back{display:grid}
  .m{max-width:88%}
  .hint{display:none}
  .sx-info{max-height:min(40dvh,320px)}
  .sx-kvs{grid-template-columns:1fr 1fr}
  .sx-who h3{font-size:15px}
  .card{padding:14px;border-radius:18px}
  .sx-bar .btn .tx{display:none}
  .sx-bar .btn{padding:0;width:42px}
}
@media(max-width:380px){.sx-kvs{grid-template-columns:1fr}}
`;
document.head.insertAdjacentHTML('beforeend','<style>'+css+'</style>');
document.head.insertAdjacentHTML('beforeend','<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">');
function toast(t,icon){const e=document.createElement('div');e.className='toast';e.innerHTML=(icon?I(icon,18):'')+'<span>'+esc(t)+'</span>';document.body.appendChild(e);setTimeout(()=>e.remove(),4500)}
async function rpc(fn,a){const {data,error}=await sb.rpc(fn,a||{});if(error)throw error;return data}
function login(root,need,ok){
  root.innerHTML=`<div class="card login"><span class="lg">${I('lock',24)}</span><h2>تسجيل الدخول</h2><input id="e" type="email" placeholder="البريد" dir="ltr" autocomplete="username"><input id="p" type="password" placeholder="كلمة المرور" dir="ltr" autocomplete="current-password"><button class="btn" id="go">دخول</button><div class="er" id="er" role="alert"></div></div>`;
  const submit=async()=>{const er=root.querySelector('#er');er.textContent='';
    const {error}=await sb.auth.signInWithPassword({email:root.querySelector('#e').value.trim(),password:root.querySelector('#p').value});
    if(error){er.textContent='بيانات غير صحيحة';return}check()};
  root.querySelector('#go').onclick=submit;
  root.querySelector('#p').onkeydown=e=>{if(e.key==='Enter')submit()};
  async function check(){const w=await rpc('support_whoami').catch(()=>({role:'none'}));
    if(need(w.role)){ok(w.role,w)}else{await sb.auth.signOut();const er=root.querySelector('#er');if(er)er.textContent='ليس لديك صلاحية لهذه الصفحة'}}
  sb.auth.getSession().then(({data})=>data.session&&check());
}
/* ---------- صور: ضغط قبل الرفع (أسرع على الموبايل) ---------- */
async function squash(file){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size<350*1024)return file;
  try{
    const bmp=await createImageBitmap(file);const max=1600,k=Math.min(1,max/Math.max(bmp.width,bmp.height));
    const c=document.createElement('canvas');c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);
    c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
    const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.85));
    return blob&&blob.size<file.size?blob:file;
  }catch(_){return file}
}
let actx=null;
function beep(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.connect(g);g.connect(actx.destination);o.type='sine';
  const t=actx.currentTime;o.frequency.setValueAtTime(880,t);o.frequency.setValueAtTime(1175,t+.12);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.25,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.34);o.start(t);o.stop(t+.36)}catch(_){}}

/* ---------- مكتب الدعم ---------- */
function mountSupport(el,role,who){
  const isAdmin=role==='admin';
  const hs=(who&&who.handles)||[];
  const allowed=isAdmin?Object.keys(ORG):Object.keys(ORG).filter(k=>hs.includes(ORG[k][2]));
  let list=[],cur=null,data=null,org=allowed.length===1?allowed[0]:'ALL',stf='active',q='',busy=false,files=[],infoOpen=false;
  let sound=store.get('sx_snd')!=='0',seen=new Map(),escSeen=new Set(),first=true,signed={};
  const TITLE='لوحة الدعم — نَسَق';
  const scope=isAdmin?`<div class="scope">${I('headset',16)} أنت مدير — بتشوف كل المحادثات</div>`:`<div class="scope">تتعامل مع: ${allowed.map(k=>`<b style="background:${ORG[k][1]}">${ORG[k][0]}</b>`).join('')||'<span>لا يوجد نوع محدد لك — اطلب من الإدارة تحديد نطاقك.</span>'}</div>`;
  el.innerHTML=`<div class="sx" id="sx">
    <div class="sx-bar">${scope}<div class="sx-bar__r"><button class="btn g s" id="nt" hidden></button><button class="btn g s" id="sn"></button></div></div>
    <div class="sx-grid">
      <aside class="card sx-list"><div class="sx-tools"><div class="chips" id="ot"></div><input id="q" type="search" placeholder="ابحث بالاسم أو الرقم أو الكود" autocomplete="off"><div class="chips" id="st"></div></div><div class="tks" id="ls"></div></aside>
      <section class="card sx-chat" id="ch"><div class="sx-ph">${I('chat',56)}<span>اختار تذكرة من القائمة عشان تبدأ الرد</span></div></section>
    </div>
    ${isAdmin?'<div class="card sx-staff" id="stf"></div>':''}
  </div>`;
  const $=s=>el.querySelector(s),root=$('#sx');
  const mobile=()=>window.matchMedia('(max-width:860px)').matches;

  /* ===== أدوات العرض ===== */
  const pname=t=>(t.party&&t.party.name)||t.name||'زائر';
  const pphone=t=>(t.party&&t.party.phone)||'';
  function avatar(t,cls){
    const p=pfx(t.ticket_number),o=ORG[p]||ORG.GS,nm=pname(t),pic=safeUrl(t.party&&t.party.avatar);
    return `<span class="sx-av ${cls||''}" style="--c:${o[1]}">${esc((nm.trim()[0]||o[3][0]))}${pic?`<img src="${esc(pic)}" alt="" loading="lazy" onerror="this.remove()">`:''}</span>`;
  }
  function tabsAndFilters(){
    const inOrg=k=>list.filter(t=>k==='ALL'||pfx(t.ticket_number)===k);
    const tabs=(allowed.length>1?[['ALL','الكل']]:[]).concat(allowed.map(k=>[k,ORG[k][0]]));
    $('#ot').innerHTML=tabs.length>1?tabs.map(([k,l])=>{const u=inOrg(k).filter(t=>t.admin_unread&&isOpen(t)).length;return `<button data-k="${k}" class="${org===k?'on':''}">${l}${u?`<b>${N(u)}</b>`:''}</button>`}).join(''):'';
    $('#ot').hidden=tabs.length<2;
    const base=list.filter(t=>org==='ALL'||pfx(t.ticket_number)===org);
    const help=base.filter(t=>t.escalated&&isOpen(t)).length;
    const cnt={active:base.filter(isOpen).length};
    const sts=[['active','المفتوحة',cnt.active],['help','طلب مساعدة',help,'help'],['all','الكل'],['resolved','تم الحل'],['closed','المغلقة']].filter(s=>s[0]!=='help'||help||stf==='help');
    $('#st').innerHTML=sts.map(([s,l,n,c])=>`<button data-s="${s}" class="${c||''} ${stf===s?'on':''}">${l}${n?`<b>${N(n)}</b>`:''}</button>`).join('');
    $('#ot').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{org=b.dataset.k;draw()});
    $('#st').querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{stf=b.dataset.s;draw()});
  }
  function draw(){
    tabsAndFilters();
    const rows=list.filter(t=>(org==='ALL'||pfx(t.ticket_number)===org)
      &&(stf==='all'||(stf==='active'?isOpen(t):stf==='help'?(t.escalated&&isOpen(t)):t.status===stf))
      &&(!q||[t.ticket_number,pname(t),pphone(t),t.subject,t.email].join(' ').toLowerCase().includes(q)));
    $('#ls').innerHTML=rows.map(t=>{
      const p=pfx(t.ticket_number),o=ORG[p]||ORG.GS,unread=t.admin_unread&&isOpen(t);
      const mine=t.last_role==='support'||t.last_role==='admin';
      const pv=(mine?'<span style="color:var(--ac);font-weight:700">أنت: </span>':'')+esc(t.last_body||t.subject||t.message||'');
      return `<a class="tk ${unread?'un':''} ${cur===t.ticket_number?'on':''}" data-t="${esc(t.ticket_number)}">${avatar(t)}
        <div class="tk-b">
          <div class="tk-r1"><span class="tk-nm">${t.escalated&&isOpen(t)?`<span class="flag" title="طُلبت مساعدة الإدارة">${I('lifebuoy',15)}</span>`:''}${esc(pname(t))}</span><span class="tk-tm">${ago(t.last_message_at||t.created_at)}</span></div>
          <div class="tk-r2"><span class="tk-ty" style="background:${o[1]}">${o[3]}</span><span class="tk-cd">${esc(t.ticket_number)}</span>${pphone(t)?`<span class="tk-ph">${esc(pphone(t))}</span>`:''}</div>
          <div class="tk-r3"><span class="tk-pv">${pv}</span>${unread?'<i class="dot">جديد</i>':`<span class="pill ${t.status}">${ST[t.status]||t.status}</span>`}</div>
        </div></a>`}).join('')||'<p class="empty">لا توجد محادثات هنا</p>';
    $('#ls').querySelectorAll('.tk').forEach(a=>a.onclick=()=>openTicket(a.dataset.t));
    const u=list.filter(t=>t.admin_unread&&isOpen(t)).length;
    document.title=(u?`(${u}) `:'')+TITLE;
  }
  $('#q').oninput=e=>{q=e.target.value.trim().toLowerCase();draw()};

  /* ===== تنبيهات ===== */
  function bellUI(){
    const b=$('#nt'),s=$('#sn');
    s.innerHTML=I(sound?'vol':'mute',16)+`<span class="tx">${sound?'الصوت شغّال':'الصوت مكتوم'}</span>`;s.classList.toggle('on',sound);
    if(!('Notification' in window)){b.hidden=true;return}
    b.hidden=false;const p=Notification.permission;
    b.innerHTML=I(p==='granted'?'bell':'bell-off',16)+`<span class="tx">${p==='granted'?'التنبيهات شغّالة':p==='denied'?'التنبيهات محظورة من المتصفح':'فعّل تنبيهات المتصفح'}</span>`;
    b.classList.toggle('on',p==='granted');b.disabled=p==='denied';
  }
  $('#sn').onclick=()=>{sound=!sound;store.set('sx_snd',sound?'1':'0');if(sound)beep();bellUI()};
  $('#nt').onclick=()=>{try{Notification.requestPermission().then(bellUI)}catch(_){}};
  function alertUser(title,body,tn){
    toast(title+(body?' — '+body:''),'mail');
    if(sound)beep();
    try{if('Notification' in window&&Notification.permission==='granted'&&document.hidden){const n=new Notification(title,{body,tag:tn,icon:'/assets/img/favicon.svg'});n.onclick=()=>{window.focus();if(tn)openTicket(tn);n.close()}}}catch(_){}
  }
  function detect(){
    list.forEach(t=>{
      const sig=t.last_message_at+'|'+t.messages_count,prev=seen.get(t.ticket_number);
      if(!first&&prev!==sig){
        const here=cur===t.ticket_number&&!document.hidden;
        if(!here){
          if((t.last_role==='user'||t.last_role===undefined)&&t.admin_unread)alertUser('رسالة جديدة من '+pname(t),t.last_body||'',t.ticket_number);
          else if(!isAdmin&&t.escalated&&t.last_role==='admin')alertUser('ردّت الإدارة على '+t.ticket_number,t.last_body||'',t.ticket_number);
        }
      }
      if(isAdmin&&t.escalated&&isOpen(t)&&!escSeen.has(t.ticket_number)){
        if(!first)alertUser('طلب مساعدة على '+t.ticket_number,t.escalation_note||pname(t),t.ticket_number);
        escSeen.add(t.ticket_number);
      }
      seen.set(t.ticket_number,sig);
    });
    first=false;
  }

  /* ===== تحميل القائمة ===== */
  async function load(){try{list=await rpc('admin_support_list');detect();draw()}catch(e){toast(e.message,'alert')}}

  /* ===== المحادثة ===== */
  async function sign(paths){const need=paths.filter(p=>p&&!signed[p]);if(!need.length)return;
    const {data:r}=await sb.storage.from('support-files').createSignedUrls(need,3600);(r||[]).forEach(x=>{if(x.path&&x.signedUrl)signed[x.path]=x.signedUrl})}
  const attPaths=ms=>ms.flatMap(m=>(m.attachments||[]).map(a=>typeof a==='string'?a:a&&a.path)).filter(Boolean);

  function infoHTML(t,pt){
    const p=pfx(t.ticket_number),o=ORG[p]||ORG.GS,rows=[];
    const add=(k,v,raw)=>{if(v===undefined||v===null||v==='')return;rows.push(`<div class="sx-kv"><span>${k}</span><b>${raw?v:esc(v)}</b></div>`)};
    add('الاسم',pt.name||t.name||'زائر');
    if(pt.phone)add('رقم الموبايل',`<span dir="ltr">${esc(pt.phone)}</span><a class="sx-ml" href="tel:${esc(pt.phone)}">${I('phone',13)}اتصال</a><a class="sx-ml" target="_blank" rel="noopener" href="https://wa.me/${waNum(pt.phone)}">${I('wa',13)}واتساب</a>`,true);
    if(pt.email||t.email)add('البريد',`<span dir="ltr">${esc(pt.email||t.email)}</span>`,true);
    add('النوع',o[3]);
    add('كود المحادثة',`<span dir="ltr">${esc(t.ticket_number)}</span>`,true);
    if(pt.joined)add('تاريخ التسجيل',fdate(pt.joined));
    add('العنوان',pt.address);
    if(pt.orders_count>0||p==='US')add('الطلبات',`${N(pt.orders_count)} طلب${pt.total_spent>0?' · '+N(pt.total_spent)+' ج.م':''}`);
    if(pt.blocked)add('حالة الحساب','موقوف');
    if(pt.store){add('المتجر',pt.store.name);add('نشاط المتجر',pt.store.category);add('حالة المتجر',PST[pt.store.status]||pt.store.status);add('عنوان المتجر',pt.store.address)}
    if(pt.rider){add('المركبة',pt.rider.vehicle);add('منطقة العمل',[pt.rider.city,pt.rider.area].filter(Boolean).join(' · '));add('حالة السائق',PST[pt.rider.status]||pt.rider.status)}
    add('التصنيف',t.category);
    add('آخر رد من',t.handled_by);
    return `<div class="sx-kvs">${rows.join('')}</div>`;
  }
  function paintHead(){
    const t=data.ticket,pt=data.party||{},p=pfx(t.ticket_number),o=ORG[p]||ORG.GS,closed=t.status==='closed';
    const tt={...t,party:pt};
    $('#chh').innerHTML=`<div class="sx-hd">
        <button class="btn g ico s sx-back" id="bk" aria-label="رجوع">${I('arrow-right',18)}</button>
        <button class="sx-who" id="wh" aria-expanded="${infoOpen}">${avatar(tt,'lg')}<div><h3>${esc(pname(tt))}</h3><small><span class="ty" style="background:${o[1]}">${o[3]}</span>${pt.phone?`<span class="ph">${esc(pt.phone)}</span>`:`<span dir="ltr">${esc(t.ticket_number)}</span>`}</small></div><span class="chev ${infoOpen?'on':''}">${I('down',18)}</span></button>
        ${pt.phone?`<a class="btn ok s ico" href="tel:${esc(pt.phone)}" aria-label="اتصال" title="اتصال">${I('phone',17)}</a>`:''}
      </div>
      <div class="sx-info" id="inf" ${infoOpen?'':'hidden'}>${infoHTML(t,pt)}</div>
      <div class="sx-sub"><span class="pill ${t.status}" style="flex:none">${ST[t.status]||t.status}</span><span class="sj" title="${esc(t.subject||'')}">${esc(t.subject||'بدون عنوان')}</span>
        ${!isAdmin&&!t.escalated&&!closed?`<button class="btn w s" id="esc">${I('lifebuoy',16)}طلب مساعدة الإدارة</button>`:''}
        ${isAdmin&&t.escalated?`<button class="btn ok s" id="rsv">${I('check',16)}تم — شيل العلامة</button>`:''}
        ${t.status!=='resolved'&&!closed?`<button class="btn g s" id="rs">${I('check',16)}تم الحل</button>`:''}
        ${closed?'<button class="btn g s" id="op">إعادة فتح</button>':'<button class="btn r s" id="cl">إغلاق</button>'}
      </div>
      ${t.escalated?`<div class="sx-note">${I('lifebuoy',16)}<span>${isAdmin?'موظف الدعم طلب مساعدتك':'تم طلب مساعدة الإدارة'}${t.escalation_note?' — '+esc(t.escalation_note):''}</span></div>`:''}`;
    $('#wh').onclick=()=>{infoOpen=!infoOpen;$('#inf').hidden=!infoOpen;$('#wh .chev').classList.toggle('on',infoOpen);$('#wh').setAttribute('aria-expanded',infoOpen)};
    $('#bk').onclick=()=>{if(history.state&&history.state.sx)history.back();else closeChat()};
    const st=async(s,msg)=>{try{await rpc('staff_support_set_status',{p_ticket_number:t.ticket_number,p_status:s});if(msg)toast(msg,'check');await load();await refresh(true)}catch(e){toast(e.message,'alert')}};
    $('#cl')&&($('#cl').onclick=()=>{if(confirm('إغلاق المحادثة دي؟ تقدر تعيد فتحها بعدين.'))st('closed','اتقفلت المحادثة')});
    $('#op')&&($('#op').onclick=()=>st('open','اتفتحت المحادثة'));
    $('#rs')&&($('#rs').onclick=()=>st('resolved','اتعلّمت إنها اتحلّت'));
    $('#esc')&&($('#esc').onclick=()=>askEscalate(t.ticket_number));
    $('#rsv')&&($('#rsv').onclick=async()=>{try{await rpc('support_resolve_escalation',{p_ticket_number:t.ticket_number});toast('اتشالت علامة المساعدة','check');await load();await refresh(true)}catch(e){toast(e.message,'alert')}});
  }
  function msgHTML(m,t,pt){
    const staff=m.role==='admin'||m.role==='support';
    const nm=!staff?(pt.name||t.name||'العميل'):m.role==='admin'?'الإدارة'+(m.author_name?' · '+m.author_name:''):(m.author_name||'الدعم');
    const ps=(m.attachments||[]).map(a=>typeof a==='string'?a:a&&a.path).filter(Boolean).map(p=>signed[p]?`<img src="${esc(signed[p])}" alt="مرفق" data-lb="${esc(signed[p])}" loading="lazy">`:'').join('');
    const n=(m.attachments||[]).length;
    return `<div class="m ${m.role==='admin'?'ad':m.role==='support'?'st':''}"><span class="who">${esc(nm)}</span>${m.body?esc(m.body):''}${ps?`<div class="pics ${n===1?'one':''}">${ps}</div>`:''}<span class="tm">${clock(m.created_at)}</span></div>`;
  }
  function paintMsgs(stick){
    const t=data.ticket,pt=data.party||{},box=$('#ms');
    const msgs=data.messages&&data.messages.length?data.messages:[{role:'user',body:t.message,created_at:t.created_at,attachments:[]}];
    const near=box.scrollHeight-box.scrollTop-box.clientHeight<120;
    let last='',html='';
    msgs.forEach(m=>{const d=dayLabel(m.created_at);if(d!==last){html+=`<span class="sx-day">${d}</span>`;last=d}html+=msgHTML(m,t,pt)});
    box.innerHTML=html;
    box.querySelectorAll('[data-lb]').forEach(i=>i.onclick=()=>lightbox(i.dataset.lb));
    if(stick||near)box.scrollTop=box.scrollHeight;
  }
  function paintComposer(){
    const t=data.ticket,closed=t.status==='closed',w=$('#cmpw');
    if(closed){w.innerHTML='<div class="sx-closed">المحادثة مقفولة</div>';return}
    if(w.querySelector('#tx'))return;
    w.innerHTML=`<div class="cmp" id="cmp"><div class="pvs" id="pvs" hidden></div>
      <div class="cmp-row"><label class="btn g att" title="إرفاق صورة" aria-label="إرفاق صورة">${I('img',21)}<input type="file" id="fl" accept="image/*" multiple hidden></label>
      <textarea id="tx" rows="1" maxlength="2000" placeholder="اكتب ردك..."></textarea>
      <button class="btn go" id="sd">${I('send',17)}<span>إرسال</span></button></div>
      <div class="hint" id="hn">تقدر ترفق لحد 4 صور (تتضغط تلقائياً قبل الرفع) · Enter للإرسال، Shift+Enter لسطر جديد</div></div>`;
    const tx=$('#tx');
    tx.oninput=()=>{tx.style.height='46px';tx.style.height=Math.min(tx.scrollHeight,140)+'px'};
    tx.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!mobile()){e.preventDefault();send()}};
    tx.onpaste=e=>{const im=[...(e.clipboardData?.files||[])].filter(f=>f.type.startsWith('image/'));if(im.length){e.preventDefault();addFiles(im)}};
    $('#fl').onchange=e=>{addFiles([...e.target.files]);e.target.value=''};
    $('#sd').onclick=send;
    const c=$('#cmp');['dragover','dragenter'].forEach(ev=>$('#ch').addEventListener(ev,e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){e.preventDefault();c.classList.add('drag')}}));
    ['dragleave','drop'].forEach(ev=>$('#ch').addEventListener(ev,()=>c.classList.remove('drag')));
    $('#ch').addEventListener('drop',e=>{const im=[...(e.dataTransfer?.files||[])].filter(f=>f.type.startsWith('image/'));if(im.length){e.preventDefault();addFiles(im)}});
  }
  function addFiles(fs){
    for(const f of fs){
      if(files.length>=4){toast('أقصى عدد 4 صور في الرسالة','alert');break}
      if(!/^image\/(jpeg|png|webp|gif)$/.test(f.type)){toast('الصور فقط (JPG / PNG / WebP / GIF)','alert');continue}
      if(f.size>10*1024*1024){toast('الصورة أكبر من 10 ميجابايت','alert');continue}
      files.push({f,u:URL.createObjectURL(f)});
    }
    paintPreviews();
  }
  function paintPreviews(){
    const b=$('#pvs');if(!b)return;b.hidden=!files.length;
    b.innerHTML=files.map((x,i)=>`<div class="pv"><img src="${x.u}" alt=""><button type="button" data-rm="${i}" aria-label="حذف الصورة">${I('close',13)}</button></div>`).join('');
    b.querySelectorAll('[data-rm]').forEach(x=>x.onclick=()=>{URL.revokeObjectURL(files[x.dataset.rm].u);files.splice(x.dataset.rm,1);paintPreviews()});
  }
  async function send(){
    if(busy||!data)return;const tx=$('#tx');if(!tx)return;const body=tx.value.trim();if(!body&&!files.length)return;
    const tn=data.ticket.ticket_number,btn=$('#sd');busy=true;btn.disabled=true;btn.innerHTML=I('refresh',17)+'<span>جاري الإرسال</span>';
    try{
      const at=[];
      for(const x of files){const b=await squash(x.f);const ext=b.type==='image/png'?'png':b.type==='image/webp'?'webp':b.type==='image/gif'?'gif':'jpg';
        const p=`${tn}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
        const {error}=await sb.storage.from('support-files').upload(p,b,{contentType:b.type||'image/jpeg'});if(error)throw error;at.push(p)}
      await rpc('admin_support_reply',{p_ticket_number:tn,p_body:body,p_status:'in_progress',p_attachments:at});
      files.forEach(x=>URL.revokeObjectURL(x.u));files=[];tx.value='';tx.style.height='46px';paintPreviews();
      await load();await refresh(true);
    }catch(e){toast(e.message||'تعذّر الإرسال','alert')}
    busy=false;const b2=$('#sd');if(b2){b2.disabled=false;b2.innerHTML=I('send',17)+'<span>إرسال</span>'}
  }
  async function refresh(force){
    if(!cur)return;
    try{
      const r=await rpc('admin_support_thread',{p_ticket_number:cur});if(!cur||r.ticket.ticket_number!==cur)return;
      const changed=force||!data||data.messages.length!==r.messages.length||data.ticket.status!==r.ticket.status||data.ticket.escalated!==r.ticket.escalated;
      if(!changed)return;
      await sign(attPaths(r.messages));const fresh=!data||data.ticket.ticket_number!==cur;data=r;
      paintHead();paintMsgs(force||fresh);paintComposer();
    }catch(e){if(force)toast(e.message,'alert')}
  }
  async function openTicket(tn){
    cur=tn;files=[];data=null;infoOpen=false;draw();
    $('#ch').innerHTML=`<div id="chh"></div><div class="msgs" id="ms"><span class="sx-day">جاري التحميل…</span></div><div id="cmpw"></div>`;
    root.classList.add('sx--chat');if(mobile()){document.body.classList.add('sx-lock');if(!(history.state&&history.state.sx))history.pushState({sx:1},'')}
    await refresh(true);
    if(!data){closeChat(true);return}
    const t=list.find(x=>x.ticket_number===tn);if(t)t.admin_unread=false;draw();
    if(!mobile()&&$('#tx'))$('#tx').focus();
  }
  function closeChat(){
    cur=null;data=null;files=[];root.classList.remove('sx--chat');document.body.classList.remove('sx-lock');
    $('#ch').innerHTML=`<div class="sx-ph">${I('chat',56)}<span>اختار تذكرة من القائمة عشان تبدأ الرد</span></div>`;draw();
  }
  window.addEventListener('popstate',()=>{if(cur)closeChat()});

  /* ===== نوافذ صغيرة ===== */
  function lightbox(u){const d=document.createElement('div');d.className='sx-lb';d.innerHTML=`<img src="${esc(u)}" alt=""><button aria-label="إغلاق">${I('close',20)}</button>`;
    const x=()=>{d.remove();document.removeEventListener('keydown',k)},k=e=>{if(e.key==='Escape')x()};d.onclick=x;document.addEventListener('keydown',k);document.body.appendChild(d)}
  function askEscalate(tn){
    const d=document.createElement('div');d.className='sx-md';
    d.innerHTML=`<div role="dialog" aria-modal="true"><h3>طلب مساعدة الإدارة</h3><p>الإدارة هتتبلّغ فوراً وتقدر تشوف المحادثة وتردّ عليك أو على العميل.</p><textarea id="en" placeholder="ملاحظة للإدارة (اختياري) — اشرح المشكلة باختصار"></textarea><div class="row"><button class="btn g" id="x">إلغاء</button><button class="btn w" id="y">${I('lifebuoy',16)}إرسال الطلب</button></div></div>`;
    document.body.appendChild(d);const close=()=>d.remove();d.onclick=e=>{if(e.target===d)close()};d.querySelector('#x').onclick=close;
    d.querySelector('#y').onclick=async()=>{const b=d.querySelector('#y');b.disabled=true;try{await rpc('support_escalate',{p_ticket_number:tn,p_note:d.querySelector('#en').value.trim()||null});close();toast('اتبعت طلب المساعدة للإدارة','check');await load();await refresh(true)}catch(e){b.disabled=false;toast(e.message,'alert')}};
    setTimeout(()=>d.querySelector('#en').focus(),50);
  }

  /* ===== فريق الدعم (للأدمن) ===== */
  async function staff(){if(!isAdmin)return;const {data:rows}=await sb.from('support_staff').select('*').order('created_at');
    $('#stf').innerHTML=`<h3>فريق الدعم (${N(rows?.length)})</h3><div class="sx-sf"><input id="se" placeholder="بريد موظف الدعم (لازم يكون له حساب)" dir="ltr"><input id="sn2" placeholder="الاسم" style="max-width:180px"><button class="btn" id="sa">إضافة</button></div>
    ${(rows||[]).map(s=>`<div class="sx-sr"><div class="nm">${esc(s.name||'—')}<small>${esc(s.email||'')}</small></div><div>${Object.entries(ORG).map(([k,v])=>`<label style="margin-inline-end:12px"><input type="checkbox" data-u="${s.user_id}" data-k="${v[2]}" ${(s.handles||[]).includes(v[2])?'checked':''}> ${v[0]}</label>`).join('')}</div><button class="btn r s" data-rm="${s.user_id}">${I('trash',15)}حذف</button></div>`).join('')}`;
    $('#sa').onclick=async()=>{try{await rpc('admin_support_staff_add',{p_email:$('#se').value.trim(),p_name:$('#sn2').value.trim()||null});staff()}catch(e){toast(e.message,'alert')}};
    $('#stf').querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{if(confirm('حذف موظف الدعم؟')){await rpc('admin_support_staff_remove',{p_user_id:b.dataset.rm});staff()}});
    $('#stf').querySelectorAll('[data-u]').forEach(c=>c.onchange=async()=>{const h=[...$('#stf').querySelectorAll(`[data-u="${c.dataset.u}"]:checked`)].map(x=>x.dataset.k);if(!h.length){c.checked=true;toast('لازم نوع واحد على الأقل','alert');return}try{await rpc('admin_support_staff_set_scope',{p_user_id:c.dataset.u,p_handles:h});toast('تم الحفظ','check')}catch(e){toast(e.message,'alert')}})}

  bellUI();
  load().then(()=>{const h=decodeURIComponent((location.hash||'').slice(1));if(h&&list.some(t=>t.ticket_number===h))openTicket(h)});
  staff();
  setInterval(()=>{if(!document.hidden)load()},8000);
  setInterval(()=>{if(!document.hidden&&cur&&!busy)refresh(false)},5000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){load();refresh(false)}});
}
window.Nosoq={sb,N,D,esc,rpc,toast,login,mountSupport};
})();
