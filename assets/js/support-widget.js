/* js/support-widget.js — نافذة دعم للمستخدم: محادثة بالصور. مفيش زر عائم — بتتفتح بـ NasaqSupport.open() من صف «الدعم» في البروفايل. يعتمد على window.sb */
(function(){
  'use strict';
  const sb=window.sb; if(!sb) return;
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fmt=d=>new Date(d).toLocaleString('en-GB',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
  const ST={open:'مفتوحة',in_progress:'قيد المتابعة',resolved:'تم الحل',closed:'مقفولة'};
  const css=`.sw{--c-accent:#2563c9;--c-accent-soft:#eaf2fd;--c-bg:#fff;--c-ink:#10233f;--c-ink-3:#5c6e88;--c-line:#e1e9f4;--c-surface:#f3f7fc}
.sw{position:fixed;inset:0;z-index:950;background:rgba(16,35,63,.45);display:flex;align-items:flex-end;justify-content:center;font-family:inherit;font-variant-numeric:lining-nums}
.sw[hidden]{display:none}.sw__box{background:var(--c-bg,#fff);color:var(--c-ink,#12294a);width:min(560px,100%);height:min(86dvh,720px);border-radius:24px 24px 0 0;padding-bottom:env(safe-area-inset-bottom,0px);box-shadow:0 -12px 40px rgba(16,35,63,.22);display:flex;flex-direction:column;overflow:hidden}
.sw__hd{display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid var(--c-line,#e2e5ea)}.sw__hd h3{margin:0;font-size:17px;flex:1}
.sw button.b,.sw label.b{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--c-line,#e2e5ea);background:var(--c-bg,#fff);color:inherit;border-radius:10px;padding:7px 12px;cursor:pointer;font:inherit;font-weight:600}
.sw button.p{background:var(--c-accent,#2563c9);border-color:transparent;color:#fff}.sw button.b:hover,.sw label.b:hover{border-color:var(--c-accent,#2563c9)}.sw .ic{flex:none}.sw__body{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.sw__t{display:block;text-align:start;width:100%;padding:12px;border:1px solid var(--c-line,#e2e5ea);border-radius:14px;background:var(--c-bg,#fff);color:inherit;cursor:pointer;font:inherit}
.sw__t small{color:var(--c-ink-3,#656b78);display:block;margin-top:3px}.sw__m{max-width:82%;padding:9px 13px;border-radius:16px;background:var(--c-surface,#f4f5f7);align-self:flex-start;white-space:pre-wrap;word-break:break-word}
.sw__m.me{align-self:flex-end;background:var(--c-accent,#2563c9);color:#fff}.sw__m small{display:block;opacity:.7;font-size:11px;margin-top:4px}.sw__m img{max-width:100%;max-height:220px;border-radius:10px;display:block;margin-top:6px}
.sw__f{display:flex;gap:8px;padding:10px;border-top:1px solid var(--c-line,#e2e5ea);align-items:flex-end}.sw__f textarea,.sw input,.sw textarea.n{flex:1;border:1px solid var(--c-line,#e2e5ea);border-radius:12px;padding:9px 12px;font:inherit;background:var(--c-bg,#fff);color:inherit;resize:none}
.sw__f textarea{height:44px}.sw input,.sw textarea{font-size:16px}.sw input:focus,.sw textarea:focus{outline:0;border-color:var(--c-accent,#2563c9);box-shadow:0 0 0 3px var(--c-accent-soft,#eaf2fd)}.sw__pv{padding:0 12px 8px;font-size:12px;color:var(--c-ink-3,#656b78)}.sw__new{display:grid;gap:10px;padding:14px}`;
  document.head.insertAdjacentHTML('beforeend','<style>'+css+'</style>');
  const I=(n,z)=>window.NIcon?window.NIcon(n,{size:z||18}):'';
  const box=document.createElement('div');box.className='sw';box.hidden=true;box.innerHTML='<div class="sw__box"></div>';
  let tickets=[],cur=null,files=[],view='list',signed={},busy=false;
  const inner=box.firstElementChild;
  async function authed(){const {data}=await sb.auth.getSession();return !!data.session}
  async function load(){try{const {data,error}=await sb.rpc('support_my_tickets');if(error)throw error;tickets=data||[];
    const n=tickets.filter(t=>t.status!=='closed'&&(t.messages||[]).length&&t.messages[t.messages.length-1].from==='support').length;
    api.unread=n;document.dispatchEvent(new CustomEvent('nasaq-support-unread',{detail:n}));if(!box.hidden)draw()}catch(e){}}
  async function sign(paths){const need=paths.filter(p=>!signed[p]);if(!need.length)return;const {data}=await sb.storage.from('support-files').createSignedUrls(need,3600);(data||[]).forEach(x=>{if(x.path&&x.signedUrl)signed[x.path]=x.signedUrl})}
  async function draw(){
    if(view==='new'){inner.innerHTML=`<div class="sw__hd"><h3>محادثة جديدة</h3><button class="b" id="x">إلغاء</button></div><div class="sw__new"><input id="s" placeholder="عنوان المشكلة"><textarea class="n" id="m" rows="5" placeholder="اشرح مشكلتك..."></textarea><button class="b p" id="go">إرسال للدعم</button></div>`;
      inner.querySelector('#x').onclick=()=>{view='list';draw()};
      inner.querySelector('#go').onclick=async()=>{if(busy)return;const m=inner.querySelector('#m').value.trim();if(!m)return;busy=true;
        const {data,error}=await sb.rpc('support_create_ticket',{p_subject:inner.querySelector('#s').value.trim()||'استفسار',p_message:m});busy=false;
        if(error){alert(error.message);return}await load();cur=data.ticket_number;view='chat';draw()};return}
    if(view==='chat'){const t=tickets.find(x=>x.ticket_number===cur);if(!t){view='list';return draw()}
      const paths=[];(t.messages||[]).forEach(m=>(m.attachments||[]).forEach(p=>typeof p==='string'&&paths.push(p)));await sign(paths);
      const closed=t.status==='closed';
      inner.innerHTML=`<div class="sw__hd"><button class="b" id="bk" aria-label="رجوع">${I('chev-right')}</button><h3><span dir="ltr">${esc(t.ticket_number)}</span> · ${esc(t.subject)}</h3>${closed?'<button class="b" id="op">إعادة فتح</button>':'<button class="b" id="cl">إغلاق</button>'}</div>
      <div class="sw__body" id="bd">${(t.messages||[]).map(m=>`<div class="sw__m ${m.from==='support'?'':'me'}">${esc(m.text)}${(m.attachments||[]).map(p=>signed[p]?`<img src="${esc(signed[p])}" alt="">`:'').join('')}<small>${m.from==='support'?'الدعم':'أنت'} · ${fmt(m.date)}</small></div>`).join('')}${closed?'<p style="text-align:center;color:var(--c-ink-3)">المحادثة مقفولة</p>':''}</div>
      ${closed?'':'<div class="sw__pv" id="pv"></div><div class="sw__f"><label class="b" style="cursor:pointer" aria-label="إرفاق صورة">'+I('clip',20)+'<input type="file" id="fl" accept="image/*" multiple hidden></label><textarea id="tx" placeholder="اكتب رسالتك..."></textarea><button class="b p" id="sd">'+I('send',16)+'إرسال</button></div>'}`;
      const bd=inner.querySelector('#bd');bd.scrollTop=bd.scrollHeight;
      inner.querySelector('#bk').onclick=()=>{view='list';draw()};
      const st=async s=>{await sb.rpc('support_user_set_status',{p_ticket_number:cur,p_status:s});await load();draw()};
      inner.querySelector('#cl')&&(inner.querySelector('#cl').onclick=()=>confirm('إغلاق المحادثة؟')&&st('closed'));
      inner.querySelector('#op')&&(inner.querySelector('#op').onclick=()=>st('open'));
      if(inner.querySelector('#fl'))inner.querySelector('#fl').onchange=e=>{files=[...e.target.files].filter(f=>f.size<5*1024*1024).slice(0,4);inner.querySelector('#pv').textContent=files.map(f=>f.name).join('، ')};
      if(inner.querySelector('#sd'))inner.querySelector('#sd').onclick=async()=>{if(busy)return;const tx=inner.querySelector('#tx').value.trim();if(!tx&&!files.length)return;busy=true;
        try{const at=[];for(const f of files){const ext=(f.type.split('/')[1]||'jpg').replace('jpeg','jpg');const p=`${cur}/${crypto.randomUUID()}.${ext}`;const {error}=await sb.storage.from('support-files').upload(p,f,{contentType:f.type});if(error)throw error;at.push(p)}
          const {error}=await sb.rpc('support_user_reply',{p_ticket_number:cur,p_body:tx,p_attachments:at});if(error)throw error;files=[];await load();draw()}catch(e){alert(e.message)}busy=false};
      return}
    inner.innerHTML=`<div class="sw__hd"><h3>الدعم</h3><button class="b p" id="nw">${I('plus',16)}محادثة جديدة</button><button class="b" id="cx" aria-label="إغلاق">${I('x',16)}</button></div><div class="sw__body">${tickets.map(t=>`<button class="sw__t" data-t="${esc(t.ticket_number)}"><b dir="ltr">${esc(t.ticket_number)}</b> · ${ST[t.status]||t.status}<div>${esc(t.subject)}</div><small>${fmt(t.last_message_at||t.created_at)}</small></button>`).join('')||'<p style="text-align:center;color:var(--c-ink-3)">لا توجد محادثات. ابدأ محادثة جديدة مع الدعم.</p>'}</div>`;
    inner.querySelector('#nw').onclick=()=>{view='new';draw()};inner.querySelector('#cx').onclick=()=>{box.hidden=true};
    inner.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{cur=b.dataset.t;view='chat';draw()});
  }
  const openW=async()=>{if(!(await authed())){location.href='/auth';return}box.hidden=false;view=tickets.length?'list':'new';await load();draw()};
  const api={open:openW,unread:0};
  window.NasaqSupport=api;
  box.onclick=e=>{if(e.target===box)box.hidden=true};
  document.body.append(box);
  authed().then(ok=>{if(!ok)return;load();setInterval(()=>{if(!document.hidden)load()},15000)});
})();
