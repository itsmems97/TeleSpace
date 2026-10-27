(function(){
var $=function(s){return document.querySelector(s)};
var S={mode:'',tab:'home',q:'',f:'all',items:[],cfg:{token:'',chat:''},db:null,active:0,sheet:false};
var KINDS=[['image','Images','photo','photos'],['video','Videos','video','videos'],['app','Apps','app','apps'],['zip','Archives','file','files'],['audio','Audio','track','tracks'],['doc','Documents','file','files'],['other','Other','file','files']];
var ICON={image:'photos',video:'video',audio:'audio',doc:'doc',zip:'zip',app:'apk',other:'doc'};
try{var c=JSON.parse(localStorage.getItem('tgcfg')||'{}');S.cfg.token=c.token||'';S.cfg.chat=c.chat||''}catch(e){}
try{if(window.TGDriver&&localStorage.getItem('tgmode')=='acct')S.mode='acct'}catch(e){}
var GL=70;try{GL=+(localStorage.getItem('tggl')||70)}catch(e){}
function glass(v){GL=v;var r=document.documentElement.style;r.setProperty('--ga',(.4+v/100*.48).toFixed(2));r.setProperty('--gb',(14+v/100*24)+'px');try{localStorage.setItem('tggl',v)}catch(e){}}glass(GL);

function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ic(n,st){return '<svg class="i"'+(st?' style="'+st+'"':'')+'><use href="#'+n+'"/></svg>'}
function fmt(n){if(n<1024)return n+' B';var u=['KB','MB','GB','TB'],i=-1;do{n/=1024;i++}while(n>=1024&&i<3);return (n>=100||i==0?Math.round(n):n.toFixed(1))+' '+u[i]}
function dt(t,o){try{return new Date(t).toLocaleDateString(undefined,o||{month:'short',day:'numeric',year:'numeric'})}catch(e){return ''}}
function kind(it){var t=it.type||'',e=(it.name.split('.').pop()||'').toLowerCase();
 if(/^image/.test(t)||/^(jpe?g|png|gif|webp|heic|heif|bmp)$/.test(e))return 'image';
 if(/^video/.test(t)||/^(mp4|mov|m4v|mkv|webm|avi|3gp)$/.test(e))return 'video';
 if(/^audio/.test(t)||/^(mp3|m4a|aac|wav|ogg|flac|opus)$/.test(e))return 'audio';
 if(/^(pdf|docx?|xlsx?|pptx?|txt|csv|md|epub)$/.test(e))return 'doc';
 if(/^(zip|rar|7z|tar|gz)$/.test(e))return 'zip';
 if(/^(apk|ipa|xapk)$/.test(e))return 'app';return 'other'}
function toast(m){var t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(function(){t.style.display='none'},3600)}
function ready(){return S.mode=='acct'||!!(S.cfg.token&&S.cfg.chat)}

/* storage: IndexedDB keeps the list, the thumbnails and any files still waiting */
function openDb(cb){try{var r=indexedDB.open('telegrive-web',1);r.onupgradeneeded=function(){r.result.createObjectStore('f',{keyPath:'fp'})};r.onsuccess=function(){S.db=r.result;cb()};r.onerror=function(){cb()};r.onblocked=function(){cb()}}catch(e){cb()}}
function save(it){if(!S.db)return;try{S.db.transaction('f','readwrite').objectStore('f').put(it)}catch(e){}}
function loadAll(cb){if(!S.db)return cb();try{var q=S.db.transaction('f').objectStore('f').getAll?S.db.transaction('f').objectStore('f').getAll():null;
 if(!q){var a=[];S.db.transaction('f').objectStore('f').openCursor().onsuccess=function(e){var c=e.target.result;if(c){a.push(c.value);c.continue()}else{S.items=a;cb()}};return}
 q.onsuccess=function(){S.items=q.result||[];cb()};q.onerror=function(){cb()}}catch(e){cb()}}

/* upload: original quality, sent as a document so Telegram does not recompress it */
function send(it,done){if(S.mode=='acct'&&window.TGDriver){window.TGDriver.upload(it.blob,it.name,function(p){it.p=p;paint()}).then(function(id){it.state='done';it.msg=id;it.blob=null;it.p=1;it.err='';save(it);done()},function(e){fail(it,String((e&&e.message)||e||'Upload failed'),done)});return}
 var x=new XMLHttpRequest(),fd=new FormData();
 fd.append('chat_id',S.cfg.chat);fd.append('disable_notification','true');fd.append('caption',it.name);fd.append('document',it.blob,it.name);
 x.open('POST','https://api.telegram.org/bot'+S.cfg.token+'/sendDocument');
 x.upload.onprogress=function(e){if(e.lengthComputable){it.p=e.loaded/e.total;paint()}};
 x.onload=function(){var r={};try{r=JSON.parse(x.responseText)}catch(e){}
  if(r.ok){it.state='done';it.msg=r.result.message_id;it.blob=null;it.p=1;it.err='';save(it);done()}
  else if(r.error_code==429){setTimeout(function(){send(it,done)},((r.parameters&&r.parameters.retry_after)||5)*1000)}
  else fail(it,r.description||'Telegram did not accept this file.',done)};
 x.onerror=function(){fail(it,'No connection. It tries again next time you open Telegrive.',done)};
 x.send(fd)}
function fail(it,m,done){it.state='fail';it.err=m;save(it);done()}
function run(){if(!ready())return;
 while(S.active<2){var it=null,i;for(i=0;i<S.items.length;i++){if(S.items[i].state=='queued'){it=S.items[i];break}}
  if(!it)break;
  if(it.size>50*1024*1024){it.state='fail';it.big=true;it.err='Over 50 MB. Large files need the backend.';save(it);continue}
  it.state='up';it.p=0;S.active++;(function(it){send(it,function(){S.active--;run();paint()})})(it)}
 paint()}

/* adding files: anything already uploaded (same name, size, date) is skipped */
function add(files){var fresh=0,skipped=0,i,have={};
 for(i=0;i<S.items.length;i++)have[S.items[i].fp]=1;
 for(i=0;i<files.length;i++){var f=files[i],fp=f.name+'|'+f.size+'|'+f.lastModified;
  if(have[fp]){skipped++;continue}have[fp]=1;fresh++;
  var it={fp:fp,name:f.name,size:f.size,type:f.type,mtime:f.lastModified||Date.now(),state:'queued',p:0,blob:f};
  S.items.unshift(it);save(it);thumb(it)}
 toast(fresh?(fresh+' to back up'+(skipped?', '+skipped+' already backed up':'')):(skipped+' already backed up. Nothing new to send.'));
 if(!ready()&&fresh){openSettings();return}
 run();paint()}
function thumb(it){if(kind(it)!='image'||!window.URL)return;var im=new Image(),u=URL.createObjectURL(it.blob);
 im.onload=function(){try{var s=Math.min(1,200/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,im.width*s);c.height=Math.max(1,im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);it.thumb=c.toDataURL('image/jpeg',.7);save(it);paint()}catch(e){}URL.revokeObjectURL(u)};
 im.onerror=function(){URL.revokeObjectURL(u)};im.src=u}

/* views */
function slot(it){var k=kind(it);return '<div class="slot">'+(it.thumb?'<img alt="" src="'+it.thumb+'">':ic(ICON[k],'color:var(--k-'+k+')'))+'</div>'}
function stat(it){if(it.state=='done')return '<span class="ok">'+ic('cloud')+'</span>';if(it.state=='up')return '<span class="mt">'+Math.round((it.p||0)*100)+'%</span>';if(it.state=='fail')return '<span class="bd">'+ic('warn')+'</span>';return '<span class="mt">Waiting</span>'}
function row(it){return '<div class="r">'+slot(it)+'<div class="m"><div class="t">'+esc(it.name)+'</div><div class="mt">'+(it.state=='fail'?'<span class="bd">'+esc(it.err||'Failed')+'</span>':fmt(it.size)+' &middot; '+dt(it.mtime))+'</div></div>'+stat(it)+'</div>'}
function counts(){var c={up:0,q:0,f:0,d:0,p:0,n:0},i,it;for(i=0;i<S.items.length;i++){it=S.items[i];if(it.state=='up'){c.up++;c.p+=it.p||0}else if(it.state=='queued')c.q++;else if(it.state=='fail')c.f++;else c.d++}c.n=c.up+c.q;return c}
function head(t){return '<div class="top"><h1>'+t+'</h1><button class="ib" data-a="settings" aria-label="Settings">'+ic('cloud')+'</button></div>'}
function status(){var c=counts();
 if(!ready())return '<div class="card"><div class="r"><div class="m"><div class="t">Connect your Telegram channel</div><div class="s">Add a bot token and channel to start backing up.</div></div><button class="lnk" data-a="settings">Set up</button></div></div>';
 var h='';
 if(c.n){var tot=c.n+c.d,pct=Math.round(((c.p+c.d)/Math.max(1,c.n+c.d))*100);h+='<div class="r" data-a="transfers"><div class="m"><div class="t">'+c.n+' transfer'+(c.n>1?'s':'')+' in progress</div><div class="s">'+pct+'% done</div><div class="bar"><i style="width:'+pct+'%"></i></div></div></div>'}
 if(c.f){h+='<div class="r"><div class="m"><div class="t">'+c.f+' transfer'+(c.f>1?'s':'')+' failed</div><div class="s">Open Transfers to see why.</div></div><button class="lnk" data-a="retry">Retry</button></div>'}
 if(!h)h='<div class="r"><span class="ok" style="margin-right:12px">'+ic('cloud')+'</span><div class="m"><div class="t">Backup is up to date</div><div class="s">'+c.d+' item'+(c.d==1?'':'s')+' in your channel</div></div></div>';
 return '<div class="card">'+h+'</div>'}
function home(){var by={},tot=0,n=0,i,it,k;
 for(i=0;i<S.items.length;i++){it=S.items[i];if(it.state!='done')continue;k=kind(it);by[k]=by[k]||{n:0,b:0};by[k].n++;by[k].b+=it.size;tot+=it.size;n++}
 var seg='',rows='';
 KINDS.forEach(function(K){var b=by[K[0]];if(!b)return;seg+='<i style="width:'+(b.b/Math.max(1,tot)*100)+'%;background:var(--k-'+K[0]+')"></i>';
  rows+='<button class="r" data-a="kind" data-k="'+K[0]+'">'+ic(ICON[K[0]],'color:var(--k-'+K[0]+');margin-right:16px')+'<span class="m t">'+K[1]+'</span><span class="s">'+b.n+' '+(b.n==1?K[2]:K[3])+' &middot; '+fmt(b.b)+'</span>'+ic('chev','color:var(--tx3);margin-left:8px;width:20px')+'</button>'});
 return '<div class="top"><svg width="36" height="36" viewBox="0 0 36 36"><path d="M4 16L19 8l-4 13z" fill="#3085FE"/><path d="M20 6l12-3-6 13z" fill="#0EBC5F"/><path d="M17 23l9-5 4 12z" fill="#FDCD06"/></svg><b>Telegrive</b><button class="ib" data-a="transfers" aria-label="Transfers">'+ic('swap')+'</button><button class="av" data-a="settings">'+(ready()?'ME':'?')+'</button></div>'
 +'<div class="field" data-a="search">'+ic('search')+'<span style="margin-left:12px">Search files and folders</span></div>'+status()
 +(ready()?'<div class="card"><div class="r"><div class="m"><div class="t">Back up photos</div><div class="s">Choose photos and videos. New ones start uploading right away. Ones already in your channel are skipped.</div></div></div><div class="pad" style="padding-top:0"><button class="btn" data-a="pickM">Choose photos</button></div></div>':'')
 +'<div class="sec">Storage</div>'+(n?'<div class="card"><div class="pad"><b style="font-size:17px;font-weight:700">'+fmt(tot)+'</b> <span class="s">in '+n+' file'+(n==1?'':'s')+'</span><div class="bar" style="height:6px">'+seg+'</div></div>'+rows+'</div>':'<div class="empty">Nothing in your drive yet. Tap + to upload a file.</div>')}
function listHtml(){var q=S.q.toLowerCase(),L=S.items.filter(function(it){
  if(S.f=='tr')return it.state!='done';if(S.f!='all'&&kind(it)!=S.f)return false;return !q||it.name.toLowerCase().indexOf(q)>-1});
 return L.length?'<div class="card">'+L.map(row).join('')+'</div>':'<div class="empty">'+(S.f=='tr'?'No transfers running.':q?'No files match your search.':'No files here yet.')+'</div>'}
function files(){var F=[['all','All'],['image','Photos'],['video','Videos'],['doc','Documents'],['tr','Transfers']];
 return head('Files')+'<div class="field">'+ic('search')+'<input id="q" type="search" placeholder="Search files and folders" value="'+esc(S.q)+'"></div><div class="chips">'+F.map(function(f){return '<button class="chip'+(S.f==f[0]?' on':'')+'" data-a="f" data-k="'+f[0]+'">'+f[1]+'</button>'}).join('')+'</div><div id="list">'+listHtml()+'</div>'}
function photos(){var P=S.items.filter(function(it){var k=kind(it);return k=='image'||k=='video'}),g={},o=[],h='';
 P.sort(function(a,b){return b.mtime-a.mtime}).forEach(function(it){var m=dt(it.mtime,{month:'long',year:'numeric'});if(!g[m]){g[m]=[];o.push(m)}g[m].push(it)});
 o.forEach(function(m){h+='<div class="sec">'+m+'</div><div class="grid">'+g[m].map(function(it){return '<div class="cell">'+(it.thumb?'<img alt="" src="'+it.thumb+'">':'<div class="c" style="color:var(--k-'+kind(it)+')">'+ic(ICON[kind(it)])+'</div>')+'<em class="'+(it.state=='done'?'d':'')+'"></em></div>'}).join('')+'</div>'});
 return head('Photos')+status()+(h||'<div class="empty">No photos backed up yet. Tap Choose photos to start.</div>')+(ready()?'<div style="margin-top:16px"><button class="btn" data-a="pickM">Choose photos</button></div>':'')}
function render(){var v=S.tab=='home'?home():S.tab=='files'?files():photos();$('#app').innerHTML=v;if(S.anim){S.anim=0;var A=$('#app');A.classList.remove('in');void A.offsetWidth;A.classList.add('in')}
 $('#nav').innerHTML=[['home','Home','home'],['files','Files','folder'],['photos','Photos','photos']].map(function(t){return '<button data-a="tab" data-k="'+t[0]+'" class="'+(S.tab==t[0]?'on':'')+'"><span>'+ic(t[2])+'</span>'+t[1]+'</button>'}).join('');live()}
function live(){var c=counts(),b=$('#live');if(!c.n||!ready()){b.style.display='none';return}
 var pct=Math.round(((c.p+c.d)/Math.max(1,c.n+c.d))*100);b.style.display='block';$('#liveT').textContent='Uploading '+c.n+' item'+(c.n>1?'s':'')+' · '+pct+'%';$('#liveB').style.width=pct+'%'}
var pending=false;function paint(){if(pending)return;pending=true;(window.requestAnimationFrame||setTimeout)(function(){pending=false;
 if(S.sheet)return live();if(S.tab=='files'&&$('#list')){$('#list').innerHTML=listHtml();live()}else render()})}

/* settings sheet */
function openSettings(){S.sheet=true;$('#sh').innerHTML='<div class="grab"></div><h2>Telegram channel</h2><div class="s">Create a bot with @BotFather, add it to your private channel as an admin, then enter the details below. They stay on this device.</div><label>Bot token</label><input id="tk" type="password" autocomplete="off" placeholder="123456:ABC..." value="'+esc(S.cfg.token)+'"><label>Channel ID or @username</label><input id="ch" autocomplete="off" placeholder="-1001234567890" value="'+esc(S.cfg.chat)+'"><button class="btn o" data-a="auth" data-k="phone" style="width:100%;margin-top:16px">Sign in with phone number</button><label>Glass strength</label><input id="gl" type="range" min="0" max="100" value="'+GL+'"><div style="margin-top:16px;display:flex"><button class="btn" id="sv" style="flex:1;margin-right:8px">Save and test</button><button class="btn o" data-a="close">Close</button></div><div class="s" id="msg" style="margin-top:12px"></div>';$('#ov').style.display='flex'}
function closeSheet(){S.sheet=false;$('#ov').style.display='none';render()}
function saveCfg(){var t=$('#tk').value.replace(/\s/g,''),c=$('#ch').value.replace(/\s/g,''),m=$('#msg');
 if(!t||!c){m.textContent='Enter both the bot token and the channel.';return}
 m.textContent='Checking...';var x=new XMLHttpRequest();x.open('GET','https://api.telegram.org/bot'+encodeURIComponent(t)+'/getChat?chat_id='+encodeURIComponent(c));
 x.onload=function(){var r={};try{r=JSON.parse(x.responseText)}catch(e){}
  if(r.ok){S.cfg={token:t,chat:c};try{localStorage.setItem('tgcfg',JSON.stringify(S.cfg))}catch(e){}m.innerHTML='<span class="ok">Connected to '+esc(r.result.title||'your channel')+'.</span>';setTimeout(function(){closeSheet();run()},700)}
  else m.innerHTML='<span class="bd">'+esc(r.description||'Could not connect.')+' Check the token, and that the bot is an admin of the channel.</span>'};
 x.onerror=function(){m.innerHTML='<span class="bd">No connection to Telegram.</span>'};x.send()}

/* account sign-in: phone, code, password. The real work is done by window.TGDriver (see guide.md) */
var AU={phone:['Your phone number','Use the full number with country code, like +966.','tel','+966 5xx xxx xxx','Continue'],code:['Enter the code','Telegram sent it to your other device or by SMS.','tel','Code','Verify'],password:['Two-step password','Enter the cloud password of your account.','password','Password','Sign in']};
function openAuth(step,msg){S.sheet=true;var T=AU[step];
 $('#sh').innerHTML='<div class="grab"></div><h2>'+T[0]+'</h2><div class="s">'+T[1]+'</div><input id="au" style="margin-top:16px" type="'+T[2]+'" inputmode="'+(step=='password'?'text':'tel')+'" autocomplete="'+(step=='code'?'one-time-code':'off')+'" placeholder="'+T[3]+'"><div class="s" id="msg" style="margin-top:12px">'+(msg||'')+'</div><div style="margin-top:16px;display:flex"><button class="btn" data-a="go" data-k="'+step+'" style="flex:1;margin-right:8px">'+T[4]+'</button><button class="btn o" data-a="close">Close</button></div>';
 $('#ov').style.display='flex';setTimeout(function(){var i=$('#au');if(i)i.focus()},350)}
function authGo(step){var m=$('#msg'),v=$('#au').value.replace(/^\s+|\s+$/g,'');if(!v){m.textContent='Fill in this field first.';return}
 if(!window.TGDriver){m.innerHTML='<span class="bd">Phone sign-in needs the TDLib bridge. Read guide.md. Until then, use the bot token.</span>';return}
 m.textContent='Please wait...';
 window.TGDriver[step](v).then(function(r){var n=r&&r.next;if(n=='ready'){S.mode='acct';try{localStorage.setItem('tgmode','acct')}catch(e){}closeSheet();toast('Signed in.');hist();run()}else openAuth(n=='pass'?'password':'code')},function(e){m.innerHTML='<span class="bd">'+esc((e&&e.message)||e||'Something went wrong.')+'</span>'})}
function hist(){var D=window.TGDriver;if(!D||!D.history)return;D.history().then(function(a){var have={};S.items.forEach(function(i){have[i.fp]=1});(a||[]).forEach(function(x){if(have[x.fp])return;var it={fp:x.fp,name:x.name,size:x.size||0,mtime:x.mtime||Date.now(),state:'done',p:1};S.items.push(it);save(it)});paint()},function(){})}

/* events */
document.addEventListener('click',function(e){var el=e.target;while(el&&el!==document&&!(el.getAttribute&&(el.getAttribute('data-a')||el.id=='sv'||el.id=='fab')))el=el.parentNode;if(!el||el===document)return;
 if(el.id=='sv')return saveCfg();if(el.id=='fab')return $('#pickA').click();
 var a=el.getAttribute('data-a'),k=el.getAttribute('data-k');
 if(a=='tab'){S.tab=k;S.anim=1;if(k!='files'){S.q='';}render();window.scrollTo(0,0)}
 else if(a=='settings')openSettings();else if(a=='close')closeSheet();
 else if(a=='pickM')$('#pickM').click();
 else if(a=='search'){S.tab='files';S.f='all';render();var q=$('#q');if(q)q.focus()}
 else if(a=='kind'){S.tab='files';S.f=k;render()}
 else if(a=='transfers'){S.tab='files';S.f='tr';render()}
 else if(a=='f'){S.f=k;render()}
 else if(a=='auth')openAuth(k);else if(a=='go')authGo(k);
 else if(a=='retry'){S.items.forEach(function(it){if(it.state=='fail'&&!it.big){it.state='queued';save(it)}});run()}});
document.addEventListener('input',function(e){if(e.target.id=='q'){S.q=e.target.value;$('#list').innerHTML=listHtml()}else if(e.target.id=='gl')glass(+e.target.value)});
$('#ov').addEventListener('click',function(e){if(e.target===this)closeSheet()});
['pickM','pickA'].forEach(function(id){$('#'+id).addEventListener('change',function(){if(this.files&&this.files.length)add(Array.prototype.slice.call(this.files));this.value=''})});
document.addEventListener('visibilitychange',function(){if(!document.hidden)run()});
window.addEventListener('online',run);

/* start: load what is saved, show it, and resume anything that was waiting */
openDb(function(){loadAll(function(){S.items.forEach(function(it){if(it.state=='up'){it.state='queued'}if(it.state=='fail'&&!it.big&&it.blob)it.state='queued'});
 S.items.sort(function(a,b){return b.mtime-a.mtime});render();if(S.mode=='acct')hist();if(ready())run();else if(!S.items.length)setTimeout(openSettings,400)})});
})();
