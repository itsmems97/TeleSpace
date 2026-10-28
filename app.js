if('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function(e) {
        if (e.data.type === 'FETCH_CHUNK') {
            var port = e.ports[0];
            window.TGDriver.getChunk(e.data.msgId, e.data.offset, e.data.limit).then(function(buf) {
                port.postMessage(buf);
            }).catch(function(err) { 
                console.error('Stream error:', err);
                port.postMessage(new ArrayBuffer(0)); 
            });
        }
    });
}
(function(){
var $=function(s){return document.querySelector(s)};
var MAXB=Math.floor(1.9*1073741824),BOTB=50*1024*1024; /* 1.9 GB per file (Telegram allows 4000 x 512 KB parts) */
var S={mode:'',tab:'home',q:'',f:'all',items:[],cfg:{token:'',chat:''},db:null,active:0,sheet:false,_sig:'',profilePic:'',profileName:'',selectMode:false,selected:new Set(),syncFolders:[],folders:[],tomb:new Set(),unlocked:new Set(),folderId:null,pickTarget:null,vault:null,nf:{type:'videos',lock:false}};
var RT={};function rt(fp){return RT[fp]||(RT[fp]={})}
var KINDS=[['image','Images','photo','photos'],['video','Videos','video','videos'],['app','Apps','app','apps'],['zip','Archives','file','files'],['audio','Audio','track','tracks'],['doc','Documents','file','files'],['other','Other','file','files']];
var ICON={image:'photos',video:'video',audio:'audio',doc:'doc',zip:'zip',app:'apk',other:'doc'};
/* Folder types: what each folder accepts */
var FT={photos:{l:'Photos',acc:'image/*',only:'photos',cls:'icon-photos',grid:1},videos:{l:'Videos',acc:'video/*',only:'videos',cls:'icon-kind-video',grid:1},audio:{l:'Audio',acc:'audio/*',only:'audio files',cls:'icon-kind-audio'},docs:{l:'Documents',acc:'',only:'documents (PDF, Office, text, archives, other files)',cls:'icon-kind-doc'},notes:{l:'Notes',acc:'',only:'text files',cls:'icon-kind-doc',grid:0}};
try{var c=JSON.parse(localStorage.getItem('tgcfg')||'{}');S.cfg.token=c.token||'';S.cfg.chat=c.chat||''}catch(e){}
try{if(window.TGDriver&&localStorage.getItem('tgmode')=='acct')S.mode='acct'}catch(e){}
var GL=70;try{GL=+(localStorage.getItem('tggl')||70)}catch(e){}
function glass(v){GL=v;var r=document.documentElement.style;r.setProperty('--ga',(.4+v/100*.48).toFixed(2));r.setProperty('--gb',(14+v/100*24)+'px');try{localStorage.setItem('tggl',v)}catch(e){}}glass(GL);

function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var FA={home:'house',folder:'folder',photos:'images',plus:'plus',swap:'right-left',search:'magnifying-glass',cloud:'cloud',video:'video',doc:'file-lines',audio:'music',zip:'file-zipper',app:'mobile-screen-button',apk:'mobile-screen-button',chev:'chevron-right',warn:'triangle-exclamation',sync:'rotate',trash:'trash-can',lock:'lock',pause:'pause',play:'play',x:'xmark',undo:'rotate-left',copy:'copy',fplus:'folder-plus',upload:'arrow-up-from-bracket',key:'key',gear:'gear'};
function ic(n,st){return '<i class="fa-solid fa-'+(FA[n]||'circle')+'"'+(st?' style="'+st+'"':'')+'></i>'}
var EYE='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
var EYEOFF='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

/* ---- Greeting: follows the device clock/time zone, refreshes while the app stays open ---- */
var GR={
 morning:{t:'Good morning',w:['Wishing you a bright and productive day.','Hope your day starts with something good.','May today bring you calm and progress.'],q:['Small steps every day add up to big results.','Start where you are, use what you have, do what you can.','A good morning begins with a grateful heart.']},
 afternoon:{t:'Good afternoon',w:['Hope your day is going well.','Keep going, you are doing great.','Take a moment to breathe and recharge.'],q:['Progress, not perfection.','Energy flows where focus goes.','The best time to keep going is right now.']},
 evening:{t:'Good evening',w:['Hope you had a wonderful day.','Time to slow down and unwind.','Wishing you a calm and peaceful evening.'],q:['Rest is part of the work.','Be proud of what you finished today.','Every sunset is an opportunity to reset.']},
 night:{t:'Good night',w:['Sleep well and recharge.','Wishing you a restful night.','Time to rest. Tomorrow is a fresh start.'],q:['Tomorrow is a new page.','Sleep is the best meditation.','Dream big, rest well.']}
};
function greetNow(){var d=new Date(),h=d.getHours(),P=['morning','afternoon','evening','night'],p=h>=5&&h<12?'morning':h>=12&&h<17?'afternoon':h>=17&&h<21?'evening':'night',g=GR[p],
 day=Math.floor((d.getTime()-d.getTimezoneOffset()*60000)/864e5),wd=d.getDay(),w=g.w[day%g.w.length];
 if(p!='night'){if(wd==5)w='Happy Friday! Enjoy the day ahead.';else if(wd==6||wd==0)w='Have a relaxing weekend.'}
 return{t:g.t,w:w,q:'\u201C'+g.q[(day+P.indexOf(p))%g.q.length]+'\u201D'}}
function tickGreet(){var g=greetNow(),a=$('#grT'),b=$('#grW'),c=$('#grQ');if(a)a.textContent=g.t;if(b)b.textContent=g.w;if(c)c.textContent=g.q}
setInterval(tickGreet,30000);

function fmt(n){if(isNaN(n)||n==null)return '0 B';if(n<1024)return n+' B';var u=['KB','MB','GB','TB'],i=-1;do{n/=1024;i++}while(n>=1024&&i<3);return (n>=100||i==0?Math.round(n):n.toFixed(1))+' '+u[i]}
function dt(t,o){try{return new Date(t).toLocaleDateString(undefined,o||{month:'short',day:'numeric',year:'numeric'})}catch(e){return ''}}
function kind(it){var t=it.type||'',e=(it.name.split('.').pop()||'').toLowerCase();
 if(/^image/.test(t)||/^(jpe?g|png|gif|webp|heic|heif|bmp)$/.test(e))return 'image';
 if(/^video/.test(t)||/^(mp4|mov|m4v|mkv|webm|avi|3gp)$/.test(e))return 'video';
 if(/^audio/.test(t)||/^(mp3|m4a|aac|wav|ogg|flac|opus)$/.test(e))return 'audio';
 if(/^(pdf|docx?|xlsx?|pptx?|txt|csv|md|epub)$/.test(e))return 'doc';
 if(/^(zip|rar|7z|tar|gz)$/.test(e))return 'zip';
 if(/^(apk|ipa|xapk)$/.test(e))return 'app';return 'other'}
function okType(t,it){var k=kind(it);return t=='photos'?k=='image':t=='videos'?k=='video':t=='audio'?k=='audio':t=='docs'?(k!='image'&&k!='video'&&k!='audio'):true}
function toast(m){var t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(function(){t.style.display='none'},3600)}
function ready(){return S.mode=='acct'}
function fid(it){return it.fp.replace(/[^a-zA-Z0-9]/g,'')}
function byFp(fp){return S.items.find(function(x){return x.fp==fp})}
function FLD(id){return S.folders.find(function(f){return f.id===id})}
function hid(it){var f=it.folder&&FLD(it.folder);return !!(f&&f.locked&&!S.unlocked.has(f.id))} /* items of locked folders stay hidden everywhere else */

/* ---- storage (IndexedDB v3) ---- */
function openDb(cb){try{var r=indexedDB.open('iSpace-web',3);r.onupgradeneeded=function(e){var db=e.target.result;
 if(!db.objectStoreNames.contains('f'))db.createObjectStore('f',{keyPath:'fp'});
 if(!db.objectStoreNames.contains('sync'))db.createObjectStore('sync',{keyPath:'name'});
 [['folders','id'],['tomb','fp'],['meta','k'],['vault','id'],['prog','fp']].forEach(function(s){if(!db.objectStoreNames.contains(s[0]))db.createObjectStore(s[0],{keyPath:s[1]})})};
 r.onsuccess=function(){S.db=r.result;cb()};r.onerror=function(){cb()};r.onblocked=function(){cb()}}catch(e){cb()}}
function tx(st,m){return S.db.transaction(st,m||'readonly').objectStore(st)}
function dbAll(st){return new Promise(function(res){if(!S.db)return res([]);try{var q=tx(st).getAll();q.onsuccess=function(){res(q.result||[])};q.onerror=function(){res([])}}catch(e){res([])}})}
function dbGet(st,k){return new Promise(function(res){if(!S.db)return res(null);try{var q=tx(st).get(k);q.onsuccess=function(){res(q.result||null)};q.onerror=function(){res(null)}}catch(e){res(null)}})}
function dbPut(st,v){return new Promise(function(res){if(!S.db)return res(false);try{var q=tx(st,'readwrite').put(v);q.onsuccess=function(){res(true)};q.onerror=function(){res(false)}}catch(e){res(false)}})}
function dbDel(st,k){return new Promise(function(res){if(!S.db)return res(false);try{var q=tx(st,'readwrite').delete(k);q.onsuccess=function(){res(true)};q.onerror=function(){res(false)}}catch(e){res(false)}})}
function save(it){if(!S.db)return;try{S.db.transaction('f','readwrite').objectStore('f').put(it)}catch(e){}}
function delDb(fp){if(!S.db)return;try{S.db.transaction('f','readwrite').objectStore('f').delete(fp)}catch(e){}}
function loadAll(cb){if(!S.db)return cb();try{var q=S.db.transaction('f').objectStore('f').getAll();q.onsuccess=function(){S.items=q.result||[];cb()};q.onerror=function(){cb()}}catch(e){cb()}}
function saveSyncFolder(f){dbPut('sync',f)}
function rmSyncFolder(name){dbDel('sync',name)}
/* Tombstones: files the user deleted/cancelled are remembered so Auto-Sync never re-uploads them */
function addTomb(fp){S.tomb.add(fp);dbPut('tomb',{fp:fp})}
function rmTomb(fp){S.tomb['delete'](fp);dbDel('tomb',fp)}
function saveProg(fp,st){dbPut('prog',{fp:fp,fileId:st.fileId,total:st.total,next:st.next})}
function delProg(fp){dbDel('prog',fp)}

/* ---- upload engine ---- */
function dropItem(it,tomb){S.items=S.items.filter(function(x){return x!==it});delDb(it.fp);delProg(it.fp);if(tomb)addTomb(it.fp);delete RT[it.fp]}
function stopped(it,done){var r=rt(it.fp),s=r.stop;r.stop=null;if(s=='cancel')dropItem(it,true);else{it.state='paused';save(it)}done()}
function send(it,done){
 var r=rt(it.fp);r.stop=null;
 if(S.mode=='acct'&&window.TGDriver){
  var o={fp:it.fp,folder:it.folder,mime:it.type,state:it.prog,thumb:it.thumb,stop:function(){return rt(it.fp).stop},checkpoint:function(st){it.prog=st;saveProg(it.fp,st)}};
  window.TGDriver.upload(it.blob,it.name,function(p){it.p=p;paint()},o).then(function(id){
   if(rt(it.fp).stop=='cancel'){window.TGDriver.deleteMessages([id]).catch(function(){});dropItem(it,true);return done()}
   it.state='done';it.doneAt=Date.now();it.msgId=id;it.blob=null;it.p=1;it.err='';it.prog=null;delProg(it.fp);save(it);done()
  },function(e){
   if(e&&e.stop)return stopped(it,done);
   fail(it,String((e&&(e.errorMessage||e.message))||e||'Upload failed'),done)});
  return;
 }
 var x=new XMLHttpRequest(),fd=new FormData();r.xhr=x;
 fd.append('chat_id',S.cfg.chat);fd.append('disable_notification','true');fd.append('caption',it.name);fd.append('document',it.blob,it.name);
 x.open('POST','https://api.telegram.org/bot'+S.cfg.token+'/sendDocument');
 x.upload.onprogress=function(e){if(e.lengthComputable){it.p=e.loaded/e.total;paint()}};
 x.onabort=function(){stopped(it,done)};
 x.onload=function(){var j={};try{j=JSON.parse(x.responseText)}catch(e){}
  if(j.ok){it.state='done';it.doneAt=Date.now();it.msgId=j.result.message_id;it.blob=null;it.p=1;it.err='';save(it);done()}
  else if(j.error_code==429){setTimeout(function(){send(it,done)},((j.parameters&&j.parameters.retry_after)||5)*1000)}
  else fail(it,j.description||'Telegram did not accept this file.',done)};
 x.onerror=function(){fail(it,'No connection.',done)};
 x.send(fd)
}
function fail(it,m,done){if(authErr(m))forceLogout();it.state='fail';it.err=m;it.net=/connection|network|timeout|disconnect|offline|ECONN|fetch|closed/i.test(m);save(it);done()}
function run(){if(!ready())return;
 while(S.active<2){var it=null,i;for(i=0;i<S.items.length;i++){if(S.items[i].state=='queued'){it=S.items[i];break}}
  if(!it)break;
  if(!it.blob){it.state='fail';it.err='Data missing, re-upload.';save(it);continue}
  var mx=S.mode=='acct'?MAXB:BOTB;
  if(it.size>mx){it.state='fail';it.big=true;it.err='Over '+(S.mode=='acct'?'1.9 GB':'50 MB')+'.';save(it);continue}
  it.state='up';it.p=(it.prog&&it.prog.total)?it.prog.next/it.prog.total:0;S.active++;(function(it){send(it,function(){S.active--;run();paint()})})(it)}
 paint()}

/* target = {id?, type?}: folder the files are going into (type restricts what is accepted) */
function add(files,target,auto){var fresh=0,skipped=0,big=0,wrong=0,trashed=0,i,mx=S.mode=='acct'?MAXB:BOTB,have={};
 S.items.forEach(function(x){have[x.fp]=x});
 for(i=0;i<files.length;i++){var f=files[i],fp=f.name+'|'+f.size+'|'+f.lastModified;
  if(target&&target.type&&!okType(target.type,f)){wrong++;continue}
  if(f.size>mx){big++;continue}
  if(have[fp]){if(have[fp].state=='trash'&&!auto)trashed++;skipped++;continue}
  if(S.tomb.has(fp)){if(auto){skipped++;continue}rmTomb(fp)} /* manual pick = user wants it back */
  var it={fp:fp,name:f.name,size:f.size,type:f.type,mtime:f.lastModified||Date.now(),state:'queued',p:0,blob:f};
  if(target&&target.id)it.folder=target.id;
  have[fp]=it;fresh++;S.items.unshift(it);save(it);thumb(it)}
 if(!auto){var m=[];
  if(fresh)m.push(fresh+' to back up');
  if(wrong)m.push(wrong+' skipped: this folder only accepts '+FT[target.type].only);
  if(big)m.push(big+' over '+(mx==MAXB?'1.9 GB':'50 MB')+' skipped');
  if(trashed)m.push(trashed+' already in Deleted (restore it there)');
  else if(skipped)m.push(skipped+' already backed up');
  if(m.length)toast(m.join(' · '))}
 if(!ready()&&fresh){openSettings();return}
 run();paint()}

/* Video & Image Thumbnail Generation */
function thumb(it, cb){
    if(!window.URL) return cb && cb();
    var k = kind(it);
    if(k !== 'image' && k !== 'video') return cb && cb();
    if(!it.blob) return cb && cb();
    var u = URL.createObjectURL(it.blob);
    if (k === 'image') {
        var im = new Image();
        im.onload = function() { makeThumb(im, it, u); cb && cb(); };
        im.onerror = function() { cb && cb(); };
        im.src = u;
    } else if (k === 'video') {
        var vid = document.createElement('video');
        vid.src = u; vid.muted = true; vid.playsInline = true; vid.preload = 'auto';
        vid.onloadeddata = function() { vid.currentTime = 1; };
        vid.onseeked = function() { makeThumb(vid, it, u); cb && cb(); };
        vid.onerror = function() { cb && cb(); };
        setTimeout(function() { cb && cb(); }, 5000); // 5s timeout fallback
    }
}
function makeThumb(el, it, u) {
    try {
        var w = el.width || el.videoWidth;
        var h = el.height || el.videoHeight;
        if (!w || !h) throw 'no dims';
        var s = Math.min(1, 200 / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.max(1, w * s); c.height = Math.max(1, h * s);
        c.getContext('2d').drawImage(el, 0, 0, c.width, c.height);
        it.thumb = c.toDataURL('image/jpeg', 0.7);
        save(it);
        paint();
    } catch (e) {}
    URL.revokeObjectURL(u);
}

/* views */
function row(it){
 var id=fid(it),k=kind(it),st='',fp=esc(it.fp),sel=S.selectMode;
 if(it.state=='done')st='<i class="fa-solid fa-circle-check ok"></i>';
 else if(it.state=='up')st='<span class="mt" id="pt_'+id+'">'+Math.round((it.p||0)*100)+'%</span>';
 else if(it.state=='fail')st='<i class="fa-solid fa-triangle-exclamation bd"></i>';
 else if(it.state=='paused')st='<span class="mt">Paused</span>';
 else if(it.state=='queued')st='<span class="mt">Waiting</span>';
 var bar=it.state=='up'?'<div class="bar" style="height:4px;margin-top:4px"><i id="pb_'+id+'" style="width:'+((it.p||0)*100)+'%"></i></div>':'';
 var meta=it.state=='fail'?'<span class="bd">'+esc(it.err||'Failed')+'</span>':it.state=='trash'?'Deleted '+dt(it.trashAt||it.mtime)+' &middot; '+fmt(it.size):fmt(it.size)+' &middot; '+dt(it.mtime);
 var isSel=S.selected.has(it.fp),chk=sel?'<div class="chk-icon">'+(isSel?'<i class="fa-solid fa-circle-check" style="color:var(--ac)"></i>':'<i class="fa-regular fa-circle" style="color:var(--tx3)"></i>')+'</div>':'';
 var btns='';
 if(!sel){
  if(it.state=='trash')btns='<button class="ib" data-a="restore" data-fp="'+fp+'" aria-label="Restore">'+ic('undo')+'</button><button class="ib" style="color:var(--bad)" data-a="purge" data-fp="'+fp+'" aria-label="Delete forever">'+ic('trash')+'</button>';
  else btns='<button class="ib" style="color:var(--bad)" data-a="del" data-fp="'+fp+'" aria-label="Delete">'+ic('trash')+'</button>';
 }
 if(it.state=='trash')st='';
 var icon=it.thumb?'<img alt="" src="'+it.thumb+'">':ic(ICON[k]);
 return '<div class="file-item '+(isSel?'selected-item':'')+'" data-a="'+(sel?'select_file':'view')+'" data-fp="'+fp+'">'+chk+'<div class="fi-icon icon-kind-'+k+'">'+icon+'</div><div class="file-details"><div class="file-name">'+esc(it.name)+'</div><div class="file-meta">'+meta+'</div>'+bar+'</div>'+st+btns+'</div>'
}
function counts(){var c={up:0,q:0,f:0,d:0,del:0,p:0,n:0,pz:0},i,it;for(i=0;i<S.items.length;i++){it=S.items[i];
 if(it.state=='up'){c.up++;c.p+=it.p||0}else if(it.state=='queued')c.q++;else if(it.state=='fail')c.f++;else if(it.state=='paused')c.pz++;
 else if(it.state=='trash'){if(!hid(it))c.del++}else c.d++}
 c.n=c.up+c.q;return c}
function selBar(){if(!S.selectMode||!S.selected.size)return '';var n=S.selected.size;
 return '<div id="sel-bar">'+(S.tab=='deleted'
  ?'<button class="btn" data-a="restore_selected" style="background:var(--ac)">Restore ('+n+')</button><button class="btn" data-a="purge_selected" style="background:var(--bad)">Delete forever ('+n+')</button>'
  :'<button class="btn" data-a="dl_selected" style="background:var(--ac)">Download ('+n+')</button><button class="btn" data-a="del_selected" style="background:var(--bad)">Delete ('+n+')</button>')+'</div>'}
function selBtn(){return S.selectMode?'<button class="lnk" data-a="select_all">All</button><button class="lnk" data-a="cancel_select">Cancel</button>':'<button class="lnk" data-a="select_mode">Select</button>'}
function navHdr(title,extra){return '<div class="nav-header"><button class="back-btn" data-a="tab" data-k="home"><i class="fa-solid fa-chevron-left"></i> iSpace</button><h2 style="margin-right:0">'+esc(title)+'</h2>'+(extra||'')+'</div>'}
function connectCard(){
 return '<div class="storage-card"><div class="storage-header"><div class="cloud-icon-small">'+ic('cloud')+'</div><div class="storage-text"><h2>Connect your Telegram</h2><p>Sign in to start backing up files.</p></div></div><button class="btn" data-a="settings" style="width:100%">Complete Login</button></div>';
}
function tile(a,k,cls,icon,name,sub){return '<div class="app-item" data-a="'+a+'" data-k="'+k+'"><div class="icon-wrapper '+cls+'">'+ic(icon)+'</div><h3>'+esc(name)+'</h3><p>'+sub+'</p></div>'}

function home(){
 if(!ready())return '<div class="header"><h1>iSpace</h1><div class="profile-pic" data-a="profile"><i class="fa-solid fa-user"></i></div></div>'+connectCard();
 var by={},tot=0,n=0,i,it,k,c=counts(),vis=S.items.filter(function(x){return x.state!='trash'&&!hid(x)});
 for(i=0;i<vis.length;i++){it=vis[i];if(it.state!='done')continue;k=kind(it);by[k]=by[k]||{n:0,b:0};by[k].n++;by[k].b+=it.size;tot+=it.size;n++}
 var seg='';KINDS.forEach(function(K){var b=by[K[0]];if(!b)return;seg+='<div class="progress-segment-'+K[0]+'" style="width:'+(b.b/Math.max(1,tot)*100)+'%"></div>'});
 var avHtml=S.profilePic?'<img src="'+S.profilePic+'" style="width:100%;height:100%;object-fit:cover">':'<i class="fa-solid fa-user"></i>';
 var extraRows='';
 if(c.n+c.pz){var pct=Math.round(((c.p+c.d)/Math.max(1,c.n+c.d))*100);
  extraRows+='<div class="list-row" data-a="tab" data-k="transfers"><div class="list-row-left"><div class="icon-wrapper icon-kind-other">'+ic('swap')+'</div><div class="list-row-text"><h3>'+(c.n+c.pz)+' transfer'+(c.n+c.pz>1?'s':'')+(c.n?' in progress':' paused')+'</h3><p>'+(c.n?pct+'% done':'Tap to resume')+'</p></div></div><i class="fa-solid fa-chevron-right chevron"></i></div>'}
 if(c.f){extraRows+='<div class="list-row" data-a="retry"><div class="list-row-left"><div class="icon-wrapper icon-kind-other" style="background:var(--bad)">'+ic('warn')+'</div><div class="list-row-text"><h3>'+c.f+' transfer'+(c.f>1?'s':'')+' failed</h3><p>Tap to retry</p></div></div><i class="fa-solid fa-chevron-right chevron"></i></div>'}
 var rows=''; var ALLOWED_ROWS = ['doc', 'zip', 'app', 'other'];
KINDS.forEach(function(K){if (ALLOWED_ROWS.indexOf(K[0]) === -1) return; var b=by[K[0]];if(!b)return;
 rows+='<div class="list-row" data-a="kind" data-k="'+K[0]+'"><div class="list-row-left"><div class="icon-wrapper icon-kind-'+K[0]+'">'+ic(ICON[K[0]])+'</div><div class="list-row-text"><h3>'+K[1]+'</h3><p>'+b.n+' '+(b.n==1?K[2]:K[3])+' &middot; '+fmt(b.b)+'</p></div></div><i class="fa-solid fa-chevron-right chevron"></i></div>'});
 var cnt=function(kk){return S.items.filter(function(x){return x.state=='done'&&!x.folder&&kind(x)==kk}).length};
var g=greetNow();
 var mine=S.folders.length?'<div class="sec">My folders</div><div class="app-grid">'+S.folders.map(function(f){var t=FT[f.type]||FT.docs,m=S.items.filter(function(x){return x.folder===f.id&&x.state=='done'}).length;
  return '<div class="app-item" data-a="open_folder" data-k="'+esc(f.id)+'"><div class="icon-wrapper '+t.cls+'">'+ic(f.locked?'lock':'folder')+'</div><h3>'+esc(f.name)+'</h3><p>'+(f.locked?'Protected':m+' items')+' &middot; '+t.l+'</p></div>'}).join('')+'</div>':'';
 return '<div class="header"><h1>iSpace</h1><div class="profile-pic" data-a="profile">'+avHtml+'</div></div>'
 +'<div class="storage-card"><div class="storage-header"><div class="cloud-icon-small">'+ic('cloud')+'</div><div class="storage-text"><h2><span id="grT">'+g.t+'</span>'+(S.profileName?',<br>'+esc(S.profileName):'')+'</h2><p id="grW">'+esc(g.w)+'</p></div></div>'
 +'<p class="quote" id="grQ">'+esc(g.q)+'</p>'
 +'<p style="font-weight:600;font-size:14px;margin-bottom:8px">Telegram Cloud</p>'
 +'<div class="storage-details"><span>'+fmt(tot)+' used across '+n+' item'+(n==1?'':'s')+'</span></div>'
 +'<div class="progress-bar-bg">'+seg+'</div>'
 +'<a href="#" class="manage-storage" data-a="tab" data-k="files">Manage Storage <i class="fa-solid fa-chevron-right"></i></a></div>'
 +extraRows
 +'<div class="app-grid">'
 +tile('tab','photos','icon-photos','photos','Photos',cnt('image')+' items')
 +tile('tab','videos','icon-kind-video','video','Videos',cnt('video')+' items')
 +tile('tab','audio','icon-kind-audio','audio','Audio',cnt('audio')+' items')
 +tile('open_util','filemanager','icon-kind-doc','folder','File Manager','Folders')
 +tile('tab','files','icon-drive','folder','Drive','Documents')
 +tile('open_util','notepad','icon-kind-doc','doc','Notepad','Notes')
 +tile('tab','transfers','icon-mail','swap','Transfers',(c.n+c.pz)+' active')
 +tile('autosync','','icon-findmy','sync','Auto-Sync',S.syncFolders.length+' folders')
 +tile('tab','deleted','icon-trash','trash','Deleted',c.del+' items')
+'</div>'+mine
 +(n?'<div class="sec">Storage</div>'+rows:'')
}

function listHtml(){
 var q=S.q.toLowerCase(),L=S.items.filter(function(it){
  if(it.state=='trash'||hid(it))return false;
  if(S.tab=='files'){
      var k = kind(it);
      if(k != 'doc' && k != 'zip' && k != 'app' && k != 'other') return false;
  }
  return !q||it.name.toLowerCase().indexOf(q)>-1});
 if(!L.length)return '<div class="empty">'+(q?'No files match search.':'No files here yet.')+'</div>';
 var g={},o=[];
 L.forEach(function(it){var m=dt(it.mtime,{month:'long',year:'numeric'});if(!g[m]){g[m]=[];o.push(m)}g[m].push(it)});
 var html='';
 o.forEach(function(m){
     html += '<div class="sec">'+m+'</div><div class="file-list">'+g[m].map(row).join('')+'</div>';
 });
 return html;
}

function files(){
 return navHdr('Drive',selBtn())+(!ready()?connectCard():'')
 +'<div class="field">'+ic('search')+'<input id="q" type="search" placeholder="Search documents" value="'+esc(S.q)+'"></div><div id="list">'+listHtml()+'</div>'+selBar();
}

/* generic folder-like view: built-in Photos/Videos/Audio and custom folders */
function browse(c){
 var L=S.items.filter(function(it){return it.state!='trash'&&!hid(it)&&c.test(it)}).sort(function(a,b){return b.mtime-a.mtime}),body='';
 if(!L.length)body='<div class="empty">'+c.empty+'</div>';
 else if(c.grid){var g={},o=[];
  L.forEach(function(it){var m=dt(it.mtime,{month:'long',year:'numeric'});if(!g[m]){g[m]=[];o.push(m)}g[m].push(it)});
  o.forEach(function(m){body+='<div class="sec">'+m+'</div><div class="grid">'+g[m].map(function(it){var isSel=S.selected.has(it.fp);
   return '<div class="cell '+(isSel?'selected-item':'')+'" data-a="'+(S.selectMode?'select_file':'view')+'" data-fp="'+esc(it.fp)+'">'+(it.thumb?'<img alt="" src="'+it.thumb+'">':'<div class="c" style="color:var(--k-'+kind(it)+')">'+ic(ICON[kind(it)])+'</div>')+'<em class="'+(it.state=='done'?'d':'')+'"></em>'+(it.state=='up'?'<div class="cpb"><i id="pb_'+fid(it)+'" style="width:'+Math.round((it.p||0)*100)+'%"></i></div>':it.state=='queued'?'<div class="cpb"><i style="width:3%"></i></div>':'')+'</div>'}).join('')+'</div>'})}
 else body='<div class="file-list">'+L.map(row).join('')+'</div>';
 return navHdr(c.title,selBtn()+(c.right||''))+(!ready()?connectCard():'')+(c.topHtml||'')+body
+(ready()?'<div style="margin-top:16px"><button class="btn" data-a="upload_here">'+ic('upload')+'<span style="margin-left:8px">'+c.upload+'</span></button></div>':'')+selBar()}

function curCtx(){var t=S.tab;
 if(t=='photos')return{type:'photos'};if(t=='videos')return{type:'videos'};if(t=='audio')return{type:'audio'};
 if(t=='folder'){
     if (S.folderId === 'filemanager') return {id: 'filemanager', type: 'generic'};
     var f=FLD(S.folderId);
     if(!f) return null;
     return {id:f.id,type:f.type};
 }
 return null}

function trRow(it){
 var id=fid(it),k=kind(it),fp=esc(it.fp),p=Math.round((it.p||0)*100),off=!navigator.onLine,s,act='';
 if(it.state=='up'){s=off?'<span class="bd">Waiting for internet &mdash; will resume from '+p+'%</span>':'Uploading &middot; <span id="pt_'+id+'">'+p+'%</span>'}
 else if(it.state=='queued')s='Waiting in queue';
 else if(it.state=='paused')s='Paused at '+p+'%';
 else s='<span class="bd">'+esc(it.err||'Failed')+'</span>';
 if(it.state=='up'||it.state=='queued')act+='<button class="ib" data-a="tr_pause" data-fp="'+fp+'" aria-label="Pause">'+ic('pause')+'</button>';
 if(it.state=='paused'||(it.state=='fail'&&!it.big))act+='<button class="ib" data-a="tr_resume" data-fp="'+fp+'" aria-label="'+(it.state=='fail'?'Retry':'Resume')+'">'+ic(it.state=='fail'?'undo':'play')+'</button>';
 act+='<button class="ib" style="color:var(--bad)" data-a="tr_cancel" data-fp="'+fp+'" aria-label="Cancel">'+ic('x')+'</button>';
 return '<div class="file-item"><div class="fi-icon icon-kind-'+k+'">'+(it.thumb?'<img alt="" src="'+it.thumb+'">':ic(ICON[k]))+'</div><div class="file-details"><div class="file-name">'+esc(it.name)+'</div><div class="file-meta">'+s+' &middot; '+fmt(it.size)+'</div><div class="bar" style="height:4px;margin-top:4px"><i id="pb_'+id+'" style="width:'+p+'%"></i></div></div>'+act+'</div>'}
function transfers(){
 var L=S.items.filter(function(it){return !hid(it)&&(it.state=='up'||it.state=='queued'||it.state=='paused'||it.state=='fail')});
 var anyRun=L.some(function(x){return x.state=='up'||x.state=='queued'}),anyPz=L.some(function(x){return x.state=='paused'});
 var all=anyRun?'<button class="lnk" data-a="tr_pause_all">Pause all</button>':anyPz?'<button class="lnk" data-a="tr_resume_all">Resume all</button>':'';
 return navHdr('Transfers',all)
 +(!navigator.onLine?'<div class="warnbar">No internet. Uploads pause and continue from where they stopped when you are back online.</div>':'')
 +'<div class="s" style="margin:0 4px 12px">Max 1.9 GB per file. Interrupted uploads resume automatically.</div>'
 +(L.length?'<div class="file-list">'+L.map(trRow).join('')+'</div>':'<div class="empty">No transfers running.</div>')}

function render(){
 if(!ready())S.tab='home';
 if(S.tab=='folder' && S.folderId!='filemanager' && S.folderId!='notepad'){var ff=FLD(S.folderId);if(!ff||(ff.locked&&!S.unlocked.has(ff.id)))S.tab='home'}
 var t=S.tab,v;
 if(t=='home')v=home();else if(t=='files')v=files();
 else if(t=='photos'){
  v=browse({title:'Photos',test:function(it){return kind(it)=='image'&&!it.folder},grid:1,empty:'No photos backed up yet.',upload:'Choose photos'});
}
else if(t=='all'){
  var chips = '<div class="chips" style="margin-top:10px">'+
    '<button class="chip'+(S.f=='all'?' on':'')+'" data-a="f" data-k="all">All</button>'+
    '<button class="chip'+(S.f=='image'?' on':'')+'" data-a="f" data-k="image">Photos</button>'+
    '<button class="chip'+(S.f=='video'?' on':'')+'" data-a="f" data-k="video">Videos</button>'+
    '<button class="chip'+(S.f=='audio'?' on':'')+'" data-a="f" data-k="audio">Audio</button>'+
    '<button class="chip'+(S.f=='doc'?' on':'')+'" data-a="f" data-k="doc">Docs</button></div>';
  v=browse({title:'All',test:function(it){return !it.folder && (S.f=='all'||kind(it)==S.f)},grid:(S.f=='all'||S.f=='image'||S.f=='video')?1:0,empty:'No files backed up yet.',upload:'Choose files',topHtml:chips});
}
 else if(t=='videos')v=browse({title:'Videos',test:function(it){return kind(it)=='video'&&!it.folder},grid:1,empty:'No videos backed up yet.',upload:'Choose videos'});
 else if(t=='audio')v=browse({title:'Audio',test:function(it){return kind(it)=='audio'&&!it.folder},empty:'No audio backed up yet.',upload:'Choose audio'});
 else if(t=='transfers')v=transfers();
 else if(t=='deleted')v=navHdr('Deleted',selBtn())+'<div class="s" style="margin:0 4px 12px">These files are still in your Telegram backup. Deleting here removes them from the channel permanently.</div>'
   +(function(){var L=S.items.filter(function(it){return it.state=='trash'&&!hid(it)}).sort(function(a,b){return (b.trashAt||0)-(a.trashAt||0)});return L.length?'<div class="file-list">'+L.map(row).join('')+'</div>':'<div class="empty">No items deleted.</div>'})()+selBar();
else if(t=='folder'){
 var isFM = S.folderId === 'filemanager' || (FLD(S.folderId) && FLD(S.folderId).parent);
 if (isFM) {
     var subF = S.folders.filter(function(sf){return sf.parent === S.folderId});
     var subFiles = S.items.filter(function(it){return it.folder === S.folderId && it.state!='trash'});
     var title = S.folderId === 'filemanager' ? 'File Manager' : FLD(S.folderId).name;
     
     var fHTML = subF.map(function(f){
         var m = S.items.filter(function(x){return x.folder===f.id&&x.state=='done'}).length;
         return '<div class="app-item" data-a="open_folder" data-k="'+esc(f.id)+'"><div class="icon-wrapper icon-kind-doc">'+ic(f.locked?'lock':'folder')+'</div><h3>'+esc(f.name)+'</h3><p>'+m+' items</p></div>';
     }).join('');
     var fiHTML = subFiles.map(row).join('');

     v = navHdr(title, selBtn()) + (!ready()?connectCard():'') +
         '<div class="sec">Folders</div><div class="app-grid">' + (fHTML || '<div class="s" style="padding:0 4px;">No folders.</div>') + '</div>' +
         '<div class="sec">Files</div><div class="file-list">' + (fiHTML || '<div class="s" style="padding:0 4px;">No files.</div>') + '</div>' + selBar();
 } else if(S.folderId=='notepad'){
     v=browse({title:'Notepad',test:function(it){return it.folder=='notepad'},grid:0,empty:'No notes yet. Use + to create a note.',upload:'Create note'});
 } else {
     var f=FLD(S.folderId),T=FT[f.type]||FT.docs;
     v=browse({title:f.name,test:function(it){return it.folder===f.id},grid:T.grid,empty:'Empty. Only '+T.only+' can be stored here.',upload:'Add '+T.l.toLowerCase(),right:'<button class="ib" style="color:var(--bad);width:32px" data-a="del_folder" aria-label="Delete folder">'+ic('trash')+'</button>'})
 }
}
 else v=home();
 if(S._v!==v){S._v=v;$('#app').innerHTML=v}if(S.anim){S.anim=0;var A=$('#app');A.classList.remove('in');void A.offsetWidth;A.classList.add('in')}
 $('#nav').innerHTML=[['home','Home','home'],['files','Drive','folder'],['all','All','images']].map(function(t){return '<div data-a="tab" data-k="'+t[0]+'" class="nav-item'+(S.tab==t[0]?' active':'')+'">'+ic(t[2])+'<span>'+t[1]+'</span></div>'}).join('')
 +'<div data-a="profile" class="nav-item"><i class="fa-solid fa-ellipsis"></i><span>More</span></div>';
var isProtectedFolder = S.tab == 'folder' && FLD(S.folderId) && FLD(S.folderId).locked;
document.body.classList.toggle('nonav', isProtectedFolder);
document.body.classList.toggle('select-mode', S.selectMode);
var fabEl = document.getElementById('fab');
if(fabEl) fabEl.style.display = (S.tab=='transfers'||S.tab=='deleted')?'none':'flex';
live()}
function live(){var c=counts(),b=$('#live');if(!c.n||!ready()){b.style.display='none';return}
 var pct=Math.round(((c.p+c.d)/Math.max(1,c.n+c.d))*100);b.style.display='block';$('#liveT').textContent='Uploading '+c.n+' item'+(c.n>1?'s':'')+' \u00B7 '+pct+'%';$('#liveB').style.width=pct+'%'}

var pending=false;
function paint(){
 if(pending)return;pending=true;
 (window.requestAnimationFrame||setTimeout)(function(){
  pending=false;
  S.items.forEach(function(it){if(it.state=='up'){var id=fid(it),bar=document.getElementById('pb_'+id),txt=document.getElementById('pt_'+id),p=Math.round((it.p||0)*100);
   if(bar)bar.style.width=p+'%';if(txt)txt.textContent=p+'%'}});
  if(S.sheet)return live();
  var c=counts(),sig=[c.n,c.d,c.f,c.pz,c.del,S.items.length].join();
  if(S._sig!==sig){S._sig=sig;if(S.tab=='files'&&$('#list'))$('#list').innerHTML=listHtml();else render()}
  else live()})}

/* Viewer */
function openViewer(it){
 if(it.folder === 'notepad') {
     return openNoteEditor(it); // Edit note logic
 }
 if(it.state!='done'&&it.state!='up'&&it.state!='trash')return toast('File not ready');
 $('#vContent').innerHTML='<div style="color:#fff">Loading...</div>';$('#ovV').style.display='flex';$('#vDownload').style.display='none';
 if(it.state=='up'&&it.blob){showMedia(it.blob,it.name,it.type)}
 else if((it.state=='done'||it.state=='trash')&&window.TGDriver){
 var k = kind(it);
 if(k == 'video'){
    var streamUrl = '/ispace-stream/' + it.msgId + '?mime=' + encodeURIComponent(it.type || 'video/mp4');
    $('#vContent').innerHTML = '<video src="'+streamUrl+'" controls autoplay playsinline id="vVideo"></video>';
    $('#vDownload').style.display = 'flex';
    $('#vDownload').href = streamUrl;
    $('#vDownload').download = it.name;
} else {
     window.TGDriver.getMedia(it.msgId).then(function(buf){
      var ext=it.name.split('.').pop().toLowerCase(),mime=it.type||'application/octet-stream';
      if(!mime||mime==='application/octet-stream'){
       if(['jpg','jpeg','png','gif','webp'].includes(ext))mime='image/'+(ext==='jpg'?'jpeg':ext)}
      showMedia(new Blob([buf],{type:mime}),it.name,mime)
     }).catch(function(){$('#vContent').innerHTML='<div style="color:#ff3b30">Error loading file. Try downloading.</div>'});
 }
}else $('#vContent').innerHTML='<div style="color:#fff">Preview needs phone sign-in.</div>'
}

function showMedia(blob, name, type){
  var url = URL.createObjectURL(blob);
  var ext = name.split('.').pop().toLowerCase();
  var isVid = /video/.test(type) || /^(mp4|mov|mkv|webm|avi|3gp)$/.test(ext);
  var isImg = /image/.test(type) || /^(jpe?g|png|gif|webp|heic|heif|bmp)$/.test(ext);
  var isAud = /audio/.test(type) || /^(mp3|m4a|aac|wav|ogg|flac|opus)$/.test(ext);
  var isPdf = ext === 'pdf';
  var isTxt = /text/.test(type) || /^(txt|csv|md|json|js|css)$/.test(ext);
var isHtml = ext === 'html';

  if(isImg){ $('#vContent').innerHTML = '<img src="'+url+'">'; }
  else if(isVid){ $('#vContent').innerHTML = '<video src="'+url+'" controls autoplay playsinline id="vVideo"></video>'; }
  else if(isAud){ $('#vContent').innerHTML = '<div style="color:#fff;text-align:center;width:100%;padding:20px;"><div style="font-size:60px;color:var(--ac);margin-bottom:20px;"><i class="fa-solid fa-music"></i></div><audio src="'+url+'" controls autoplay style="width:100%"></audio></div>'; }
  else if(isPdf){ $('#vContent').innerHTML = '<iframe src="'+url+'" style="width:100%;height:80vh;border:none;background:#fff;"></iframe>'; }
  else if(isTxt){ blob.text().then(function(txt){ $('#vContent').innerHTML = '<div style="color:#fff;background:rgba(255,255,255,0.1);padding:20px;border-radius:10px;max-height:80vh;overflow:auto;white-space:pre-wrap;font-family:monospace;text-align:left;width:100%;">'+esc(txt)+'</div>'; }); }
else if(isHtml){ $('#vContent').innerHTML = '<iframe src="'+url+'" style="width:100%;height:80vh;border:none;background:#fff;border-radius:10px;"></iframe>'; }
  else {
      var iconCls = 'fa-file';
      if(/^(zip|rar|7z|tar|gz)$/.test(ext)) iconCls = 'fa-file-zipper';
      else if(/^(docx?|xlsx?|pptx?)$/.test(ext)) iconCls = 'fa-file-word';
      else if(/^(apk|ipa|xapk)$/.test(ext)) iconCls = 'fa-mobile-screen-button';
      $('#vContent').innerHTML = '<div style="color:#fff;text-align:center;padding:20px;"><div style="font-size:80px;color:var(--tx3);margin-bottom:20px;"><i class="fa-solid '+iconCls+'"></i></div><p style="font-size:18px;font-weight:600;margin-bottom:10px;">Preview after download</p><p style="font-size:14px;opacity:0.7;">'+esc(name)+'</p></div>';
  }
  $('#vDownload').href = url;
  $('#vDownload').download = name;
  $('#vDownload').style.display = 'flex';
}

async function doDownloadSelected(){
    if(!S.selected.size) return;
    toast("Downloading " + S.selected.size + " files...");
    for(let it of S.items) {
        if(S.selected.has(it.fp)) {
            if(it.state == 'done' && window.TGDriver) {
                try {
                    let buf = await window.TGDriver.getMedia(it.msgId);
                    let url = URL.createObjectURL(new Blob([buf]));
                    let a = document.createElement('a');
                    a.href = url; a.download = it.name;
                    document.body.appendChild(a); a.click(); a.remove();
                    URL.revokeObjectURL(url);
                } catch(e) { console.log(e); }
            } else if(it.blob) {
                let url = URL.createObjectURL(it.blob);
                let a = document.createElement('a');
                a.href = url; a.download = it.name;
                document.body.appendChild(a); a.click(); a.remove();
                URL.revokeObjectURL(url);
            }
        }
    }
    S.selectMode=false; S.selected.clear(); render();
}

/* ---- Delete -> Deleted folder -> permanent delete (with confirmation) ---- */
function trashItems(list){var n=0;
 list.forEach(function(it){
  if(it.state=='done'&&it.msgId){it.state='trash';it.trashAt=Date.now();save(it);n++}
  else if(it.state=='up'){var r=rt(it.fp);r.stop='cancel';if(r.xhr)r.xhr.abort()}
  else if(it.state!='trash')dropItem(it,true)});
 S.selected.clear();S.selectMode=false;cloudSave();toast(n?n+' moved to Deleted. Still in Telegram until you delete it there.':'Transfer cancelled');render()}
function restoreItems(list){var n=0;
 list.forEach(function(it){if(it.state!='trash')return;it.state='done';delete it.trashAt;if(it.folder&&!FLD(it.folder))delete it.folder;save(it);n++});
 S.selected.clear();S.selectMode=false;cloudSave();toast(n+' restored');render()}
function remoteDelete(ids){
 if(!ids.length)return Promise.resolve();
 if(S.mode=='acct'&&window.TGDriver)return window.TGDriver.deleteMessages(ids);
 return Promise.all(ids.map(function(id){return fetch('https://api.telegram.org/bot'+S.cfg.token+'/deleteMessage?chat_id='+encodeURIComponent(S.cfg.chat)+'&message_id='+id).then(function(r){return r.json()}).then(function(j){if(!j.ok&&!/not found/i.test(j.description||''))throw new Error(j.description||'delete failed')})}))}
function purge(list){
 return remoteDelete(list.map(function(x){return x.msgId}).filter(Boolean)).then(function(){
  list.forEach(function(it){dropItem(it,true)});cloudSave();S.selected.clear();S.selectMode=false;toast(list.length+' deleted permanently')},
  function(e){toast('Could not delete from Telegram. Check your connection and try again.');throw e})}
function askPurge(list){
 if(!list.length)return;S.sheet=true;
 $('#sh').innerHTML='<div class="grab"></div><h2>Delete forever?</h2><div class="s"><b class="bd">Cannot recover.</b> '+(list.length==1?'This file':list.length+' files')+' will be permanently removed from your Telegram backup channel.</div>'
 +'<div style="margin-top:20px;display:flex"><button class="btn" id="pgBtn" style="flex:1;margin-right:8px;background:var(--bad)">Delete forever</button><button class="btn o" data-a="close">Cancel</button></div>';
 $('#ov').style.display='flex';document.body.classList.add('sheet-open');
$('#pgBtn').onclick=function(){var b=this;b.textContent='Deleting...';b.disabled=true;purge(list).then(closeSheet,function(){b.textContent='Delete forever';b.disabled=false})}}
function sel(){return S.items.filter(function(it){return S.selected.has(it.fp)})}

/* ---- passwords, hashing, encrypted vault, TOTP ---- */
function needCrypto(){if(window.crypto&&crypto.subtle)return true;toast('Password features need a secure (https) connection.');return false}
var enc8=function(s){return new TextEncoder().encode(s)};
async function pwHash(pw,salt){var k=await crypto.subtle.importKey('raw',enc8(pw),'PBKDF2',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:salt,iterations:150000,hash:'SHA-256'},k,256))}
function same(a,b){if(!a||!b||a.length!=b.length)return false;var d=0;for(var i=0;i<a.length;i++)d|=a[i]^b[i];return d===0}
var VK=null;async function vkey(){if(VK)return VK;var r=await dbGet('meta','vkraw'),raw;if(r&&r.b)raw=unb64(r.b);else{raw=crypto.getRandomValues(new Uint8Array(32));await dbPut('meta',{k:'vkraw',b:b64(raw)});cloudSave()}VK=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);return VK}
async function vaultPut(id,pw){var k=await vkey(),iv=crypto.getRandomValues(new Uint8Array(12)),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},k,enc8(pw));await dbPut('vault',{id:id,iv:iv,ct:new Uint8Array(ct)})}
async function vaultGet(id){var r=await dbGet('vault',id);if(!r)return null;try{return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:r.iv},await vkey(),r.ct))}catch(e){return null}}
var B32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32enc(u){var b='',o='',i;for(i=0;i<u.length;i++)b+=('0000000'+u[i].toString(2)).slice(-8);for(i=0;i<b.length;i+=5)o+=B32[parseInt((b.substr(i,5)+'0000').substr(0,5),2)];return o}
function b32dec(s){var b='',i,o=[];s=s.replace(/[\s=]/g,'').toUpperCase();for(i=0;i<s.length;i++)b+=('00000'+B32.indexOf(s[i]).toString(2)).slice(-5);for(i=0;i+8<=b.length;i+=8)o.push(parseInt(b.substr(i,8),2));return new Uint8Array(o)}
async function hotp(key,ctr,digits){var buf=new ArrayBuffer(8),dv=new DataView(buf);dv.setUint32(0,Math.floor(ctr/4294967296));dv.setUint32(4,ctr>>>0);
 var k=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash:'SHA-1'},false,['sign']),h=new Uint8Array(await crypto.subtle.sign('HMAC',k,buf)),o=h[19]&15,n=((h[o]&127)<<24|h[o+1]<<16|h[o+2]<<8|h[o+3])%Math.pow(10,digits||6);
 return ('00000000'+n).slice(-(digits||6))}
async function totpOk(secret,code){var key=b32dec(secret),c=Math.floor(Date.now()/30000);for(var d=-1;d<=1;d++){if(await hotp(key,c+d)===code)return true}return false}
window.__ispace={hotp:hotp,b32enc:b32enc,b32dec:b32dec,okType:okType,S:S,render:render,add:add,trashItems:trashItems,restoreItems:restoreItems,purge:purge};

function pwField(id,label,ph){return '<label>'+label+'</label><div class="pw"><input id="'+id+'" type="password" autocomplete="off" placeholder="'+ph+'"><button type="button" class="eye" data-a="eye" data-k="'+id+'" aria-label="Show or hide password">'+EYE+'</button></div>'}
function tooMany(o){var n=Date.now();if(o.until&&n<o.until){toast('Too many attempts. Try again in '+Math.ceil((o.until-n)/1000)+'s.');return true}return false}
function bump(o){o.n=(o.n||0)+1;if(o.n>=5){o.n=0;o.until=Date.now()+30000}}

/* ---- folders ---- */
function openPlus(){if(!ready())return openSettings();S.sheet=true;var ctx=curCtx(),up=ctx&&ctx.id?'Upload to this folder':ctx?'Upload '+FT[ctx.type].l.toLowerCase():'Upload files';
 $('#sh').innerHTML='<div class="grab"></div><h2>Add</h2><div class="card" style="margin-top:12px"><button class="action-btn" data-a="new_folder">'+ic('fplus')+'<span style="margin-left:12px">New folder</span></button><button class="action-btn" data-a="upload_here" style="border-bottom:0">'+ic('upload')+'<span style="margin-left:12px">'+up+'</span></button></div><button class="btn o" data-a="close" style="width:100%;margin-top:8px">Cancel</button>';
 $('#ov').style.display='flex';document.body.classList.add('sheet-open')}
function hint(){var h=$('#nfHint');if(h)h.textContent='Only '+FT[S.nf.type].only+' can be stored in this folder.'}
async function nfCreate(){var m=$('#msg'),name=$('#nfName').value.trim(),bad=function(t){m.innerHTML='<span class="bd">'+t+'</span>'};
 if(!name)return bad('Enter a folder name.');
 if(S.folders.some(function(f){return f.name.toLowerCase()==name.toLowerCase()}))return bad('A folder with this name already exists.');
 
 var parentId = null;
 if (S.tab === 'folder') {
     if (S.folderId === 'filemanager') parentId = 'filemanager';
     else {
         var currF = FLD(S.folderId);
         if (currF && currF.parent) parentId = currF.id;
     }
 }
 var type = parentId ? 'generic' : S.nf.type;
 var f={id:'fd'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:name,type:type,locked:false,created:Date.now(),u:Date.now(),parent:parentId};
 if(S.nf.lock){if(!needCrypto())return;var p1=$('#nfPw').value,p2=$('#nfPw2').value;
  if(p1.length<6)return bad('Password must be at least 6 characters.');
  if(p1!==p2)return bad('Passwords do not match.');
  f.salt=crypto.getRandomValues(new Uint8Array(16));f.hash=await pwHash(p1,f.salt);f.locked=true;await vaultPut(f.id,p1)}
 S.folders.push(f);await dbPut('folders',f);cloudSave();closeSheet();toast('Folder created')}
function openFolder(id){var f=FLD(id);if(!f)return;if(f.locked&&!S.unlocked.has(id))return openUnlock(f);
 S.tab='folder';S.folderId=id;S.selectMode=false;S.selected.clear();S.anim=1;render();window.scrollTo(0,0)}
var ATT={};
function openUnlock(f){S.sheet=true;
 $('#sh').innerHTML='<div class="grab"></div><h2>'+ic('lock','font-size:18px;margin-right:8px')+esc(f.name)+'</h2><div class="s">This folder is password protected.</div>'+pwField('ulPw','Password','Enter password')
 +'<div class="s" id="msg" style="margin-top:10px"></div><div style="margin-top:16px;display:flex"><button class="btn" id="ulGo" data-enter="1" style="flex:1;margin-right:8px">Unlock</button><button class="btn o" data-a="close">Cancel</button></div>';
 $('#ov').style.display='flex';document.body.classList.add('sheet-open');setTimeout(function(){var i=$('#ulPw');if(i)i.focus()},350);
 $('#ulGo').onclick=async function(){var o=ATT[f.id]||(ATT[f.id]={});if(tooMany(o)||!needCrypto())return;
  var h=await pwHash($('#ulPw').value,f.salt);
  if(same(h,f.hash)){o.n=0;S.unlocked.add(f.id);closeSheet();openFolder(f.id)}
  else{bump(o);$('#msg').innerHTML='<span class="bd">Wrong password.</span>'}}}
function askDelFolder(){var f=FLD(S.folderId);if(!f)return;S.sheet=true;var n=S.items.filter(function(x){return x.folder===f.id}).length;
 $('#sh').innerHTML='<div class="grab"></div><h2>Delete folder?</h2><div class="s">&ldquo;'+esc(f.name)+'&rdquo; will be removed. Its '+n+' file'+(n==1?'':'s')+' will move to Deleted.</div>'
 +'<div style="margin-top:20px;display:flex"><button class="btn" id="dfBtn" style="flex:1;margin-right:8px;background:var(--bad)">Delete folder</button><button class="btn o" data-a="close">Cancel</button></div>';
 $('#ov').style.display='flex';document.body.classList.add('sheet-open');
$('#dfBtn').onclick=function(){trashItems(S.items.filter(function(x){return x.folder===f.id}));
  S.folders=S.folders.filter(function(x){return x.id!==f.id});dbDel('folders',f.id);dbDel('vault',f.id);fdelAdd(f.id);cloudSave();S.unlocked['delete'](f.id);S.tab='home';closeSheet()}}

/* ---- Stored Folder Passwords (gated by Google Authenticator / any TOTP app) ---- */
var VA={};
function armVault(){clearTimeout(S.vt);S.vt=setTimeout(function(){if(S.vault){closeSheet();toast('Passwords locked again.')}},120000)}
async function openVault(){if(!needCrypto())return;S.sheet=true;$('#ov').style.display='flex';document.body.classList.add('sheet-open');var m=await dbGet('meta','totp');m?vaultAsk():vaultSetup()}
function vaultSetup(){S.pend=b32enc(crypto.getRandomValues(new Uint8Array(20)));
 var uri='otpauth://totp/iSpace:Folder%20Passwords?secret='+S.pend+'&issuer=iSpace&algorithm=SHA1&digits=6&period=30';
 $('#sh').innerHTML='<div class="grab"></div><h2>Set up Google Authenticator</h2><div class="s">Protects your stored folder passwords. In Google Authenticator tap <b>+</b> &rarr; <b>Enter a setup key</b>, name it iSpace, and enter this key (time based):</div>'
 +'<div class="keybox">'+S.pend.match(/.{1,4}/g).join(' ')+'</div>'
 +'<div style="display:flex;gap:8px"><button class="btn o" data-a="copy_secret" style="flex:1">'+ic('copy')+'<span style="margin-left:8px">Copy key</span></button><a class="btn o" href="'+uri+'" style="flex:1;text-decoration:none">Open app</a></div>'
 +'<label>Enter the 6-digit code to confirm</label><input id="vsCode" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="123456">'
 +'<div class="s" id="msg" style="margin-top:10px">Keep this key safe. You need your authenticator to view passwords.</div>'
 +'<div style="margin-top:16px;display:flex"><button class="btn" id="vsGo" data-enter="1" style="flex:1;margin-right:8px">Verify and enable</button><button class="btn o" data-a="close">Cancel</button></div>';
 $('#vsGo').onclick=async function(){if(tooMany(VA))return;var c=$('#vsCode').value.replace(/\D/g,'');
  if(await totpOk(S.pend,c)){await dbPut('meta',{k:'totp',secret:S.pend});cloudSave();S.pend=null;VA.n=0;vaultShow()}
  else{bump(VA);$('#msg').innerHTML='<span class="bd">Code is not correct. Check the key and your phone clock.</span>'}}}
function vaultAsk(){
 $('#sh').innerHTML='<div class="grab"></div><h2>'+ic('key','font-size:18px;margin-right:8px')+'Stored Folder Passwords</h2><div class="s">Enter the 6-digit code from Google Authenticator.</div>'
 +'<input id="vaCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="123456" style="margin-top:16px;letter-spacing:6px;text-align:center">'
 +'<div class="s" id="msg" style="margin-top:10px"></div><div style="margin-top:16px;display:flex"><button class="btn" id="vaGo" data-enter="1" style="flex:1;margin-right:8px">Unlock</button><button class="btn o" data-a="close">Cancel</button></div>';
 setTimeout(function(){var i=$('#vaCode');if(i)i.focus()},350);
 $('#vaGo').onclick=async function(){if(tooMany(VA))return;var m=await dbGet('meta','totp'),c=$('#vaCode').value.replace(/\D/g,'');
  if(m&&await totpOk(m.secret,c)){VA.n=0;vaultShow()}else{bump(VA);$('#msg').innerHTML='<span class="bd">Wrong or expired code.</span>'}}}
async function vaultShow(){S.vault={};var L=S.folders.filter(function(f){return f.locked}),i;
 for(i=0;i<L.length;i++)S.vault[L[i].id]=(await vaultGet(L[i].id))||'(not available)';
 $('#sh').innerHTML='<div class="grab"></div><h2>Stored Folder Passwords</h2><div class="s">Locks automatically after 2 minutes.</div><div class="card" style="margin-top:14px">'
 +(L.length?L.map(function(f){return '<div class="r"><div class="m"><div class="t">'+esc(f.name)+'</div><div class="vpw" id="vp_'+f.id+'">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</div></div><button class="ib" data-a="v_eye" data-k="'+f.id+'" aria-label="Show or hide">'+EYE+'</button><button class="ib" data-a="v_copy" data-k="'+f.id+'" aria-label="Copy">'+ic('copy')+'</button></div>'}).join(''):'<div class="empty">No protected folders yet.</div>')
 +'</div><button class="btn o" data-a="close" style="width:100%;margin-top:8px">Close</button>';armVault()}

/* ---- Auto Sync ---- */
async function openAutoSync(){S.sheet=true;renderAutoSyncUI()}
async function renderAutoSyncUI(){
 var list=S.syncFolders.length?S.syncFolders.map(function(f){return '<div class="r"><div class="m"><div class="t">'+esc(f.name)+'</div></div><button class="lnk bd" data-a="rm_sync" data-k="'+esc(f.name)+'">Remove</button></div>'}).join(''):'<div class="empty">No folders added.</div>';
 $('#sh').innerHTML='<div class="grab"></div><h2>Auto-Sync Folders</h2><div class="s">New files in these folders are backed up automatically. Files you delete here are never uploaded again.</div><div style="margin:16px 0"><button class="btn" id="addFolderBtn" style="width:100%">+ Add Folder</button></div><div class="card">'+list+'</div><button class="btn o" data-a="close" style="width:100%;margin-top:16px">Close</button>';
 $('#ov').style.display='flex';document.body.classList.add('sheet-open');
$('#addFolderBtn').onclick=async function(){
  try{if(!window.showDirectoryPicker)return toast('Your browser does not support this. Use + button instead.');
   var h=await window.showDirectoryPicker({mode:'read'});
   if(S.syncFolders.find(function(f){return f.name===h.name}))return toast('Folder already added');
   S.syncFolders.push({name:h.name,handle:h});saveSyncFolder({name:h.name,handle:h});renderAutoSyncUI();toast('Folder added!');scanFolders()
  }catch(e){if(e.name!=='AbortError')toast('Error accessing folder')}}}
var scanning=false;
async function scanFolders(){
 if(!S.syncFolders.length||!ready()||scanning)return;scanning=true;
 var known=new Set(S.items.map(function(x){return x.fp})),fresh=[];
 for(var f of S.syncFolders){
  try{if(await f.handle.queryPermission({mode:'read'})!=='granted'){try{await f.handle.requestPermission({mode:'read'})}catch(e){continue}}
   for await(var entry of f.handle.values()){if(entry.kind!=='file')continue;
    var file=await entry.getFile(),fp=file.name+'|'+file.size+'|'+file.lastModified;
    if(!known.has(fp)&&!S.tomb.has(fp)){known.add(fp);fresh.push(file)} /* skips anything deleted or already backed up */
   }}catch(e){console.log('Scan error',e)}}
 scanning=false;
 if(fresh.length){add(fresh,null,true);toast(fresh.length+' new file'+(fresh.length>1?'s':'')+' found in auto-sync folders')}
}

function openProfile(){
 if(!ready())return openLogin();
 S.sheet=true;
 $('#sh').innerHTML='<div class="grab"></div><div class="profile-hdr"><div class="av" id="pAv" style="width:80px;height:80px;font-size:30px;margin:0">ME</div><img id="pImg" style="display:none;width:80px;height:80px;border-radius:50%;object-fit:cover"><h3 id="pName">Loading...</h3><p id="pPhone"></p></div>'+
 '<div class="card" style="margin-top:20px">'+
  '<button class="action-btn" data-a="vault">'+ic('key')+' <span style="margin-left:12px">Stored Folder Passwords</span></button>'+
  '<button class="action-btn" data-a="telegram_channel">'+ic('cloud')+' <span style="margin-left:12px">TeleSpace Channel</span></button>'+
  '<button class="action-btn" data-a="autosync">'+ic('sync')+' <span style="margin-left:12px">Auto-Sync Folders</span></button>'+
  '<button class="action-btn" data-a="settings">'+ic('gear')+' <span style="margin-left:12px">Settings</span></button>'+
  '<a class="action-btn" href="privacy.html" target="_blank">'+ic('doc')+' <span style="margin-left:12px">Privacy & Policy</span></a>'+
  '<button class="action-btn" data-a="report">'+ic('warn')+' <span style="margin-left:12px">Report a problem</span></button>'+
 '</div>'+
 '<div class="card">'+
  '<button class="action-btn" data-a="safe_logout">'+ic('warn')+' <span style="margin-left:12px">Safe Logout</span></button>'+
  '<button class="action-btn danger" data-a="delete_account">'+ic('warn')+' <span style="margin-left:12px">Delete TeleSpace Account</span></button>'+
 '</div><button class="btn o" data-a="close" style="width:100%;margin-top:20px">Close</button>';
 $('#ov').style.display='flex';document.body.classList.add('sheet-open');
if(window.TGDriver&&window.TGDriver.getMe){
  window.TGDriver.getMe().then(function(u){
   if(!u)return;
   $('#pName').textContent=(u.firstName||'')+' '+(u.lastName||'');$('#pPhone').textContent=u.phone?'+'+u.phone:'';
   if(u.photo){window.TGDriver.getProfilePic(u.id,u.accessHash,u.photo).then(function(url){
     if(url){S.profilePic=url;$('#pImg').src=url;$('#pImg').style.display='block';$('#pAv').style.display='none';if(S.tab=='home')render()}}).catch(function(){})}
   else{$('#pAv').textContent=(u.firstName||'M').charAt(0).toUpperCase()}
  }).catch(function(){$('#pName').textContent='Not connected'})}
}
function closeSheet(){S.sheet=false;S.vault=null;S.pend=null;clearTimeout(S.vt);$('#ov').style.display='none';document.body.classList.remove('sheet-open');document.getElementById('sh').style.transform='';render()}

/* Modals */
function showConfirm(actionType, title, desc, expectedText, btnText, btnColor) {
  S.sheet = true;
  $('#sh').innerHTML = '<div class="grab"></div><h2>'+title+'</h2><div class="s">'+desc+'</div>'+
  '<div class="s" style="margin-top:15px;font-weight:bold">Type <span style="color:var(--ac);font-family:monospace">'+expectedText+'</span> to confirm:</div>'+
  '<input id="cfText" type="text" style="margin-top:10px" autocomplete="off">'+
  '<div style="margin-top:20px;display:flex">'+
    '<button class="btn" id="cfBtn" style="flex:1;margin-right:8px;background:'+btnColor+'">'+btnText+'</button>'+
    '<button class="btn o" data-a="close">Cancel</button>'+
  '</div>';
  $('#ov').style.display='flex';document.body.classList.add('sheet-open');

$('#cfBtn').onclick = function() {
    let v = $('#cfText').value.trim().toLowerCase();
    if(v === expectedText.toLowerCase()) {
       if(actionType === 'safe') logoutAction('safe');
       if(actionType === 'factory') logoutAction('delete');
    } else { toast('Incorrect text, try again.'); }
  };
}

function openProxy() {
  S.sheet = true;
  let p = {};
  try { p = JSON.parse(localStorage.getItem('tgproxy') || '{}'); } catch(e) {}
  $('#sh').innerHTML = '<div class="grab"></div><h2>Add Proxy</h2><div class="s">Enter your MTProto Proxy details.</div>'+
  '<label>Server</label><input id="px_ip" value="'+esc(p.ip||'')+'" placeholder="1.2.3.4">'+
  '<label>Port</label><input id="px_port" type="number" value="'+(p.port||'')+'" placeholder="443">'+
  '<label>Secret</label><input id="px_sec" value="'+esc(p.secret||'')+'" placeholder="ee...">'+
  '<div style="margin-top:20px;display:flex"><button class="btn" id="px_save" style="flex:1;margin-right:8px">Save</button><button class="btn o" data-a="close">Cancel</button></div>';
  $('#ov').style.display='flex';document.body.classList.add('sheet-open');

$('#px_save').onclick = function() {
    let ip = $('#px_ip').value.trim(), port = $('#px_port').value.trim(), sec = $('#px_sec').value.trim();
    if(ip && port && sec) {
      localStorage.setItem('tgproxy', JSON.stringify({ip, port, secret: sec}));
      toast('Proxy saved. Reloading...'); setTimeout(()=>location.reload(), 1000);
    } else { toast('Please fill all fields'); }
  };
}

function logoutAction(type){
 var D=window.TGDriver;
 if(type=='safe'){toast('Logging out...');flushMeta().catch(function(){}).then(function(){return D&&D.logout?D.logout():0}).catch(function(){}).then(function(){endSession();wipeLocal();closeSheet();toast('Logged out. Your data remains in Telegram.')})}
 else if(type=='delete'){toast('Deleting channel and data...');(D&&D.deleteChannel?D.deleteChannel():Promise.resolve(true)).then(function(ok){
  if(!ok){toast('Could not delete the channel. Check your connection and try again.');return}
  return (D.logout?D.logout():0).catch(function(){}).then(function(){endSession();wipeLocal();closeSheet();toast('Channel deleted.')})})}
}

function openSettings(){return openLogin()}
function openLogin(){if(ready()){S.sheet=true;$('#sh').innerHTML='<div class="grab"></div><h2>Settings</h2><label>Glass strength</label><input id="gl" type="range" min="0" max="100" value="'+GL+'"><button class="btn o" data-a="close" style="width:100%;margin-top:16px">Close</button>';$('#ov').style.display='flex';document.body.classList.add('sheet-open');return}openAuth('phone')}
function openSettingsOld(){
  S.sheet=true; var chVal = S.cfg.chat || '-100';
  $('#sh').innerHTML='<div class="grab"></div><h2>Login to TeleSpace</h2>'+
  '<div class="chips" style="margin-bottom: 20px;">'+
    '<button class="chip on" data-a="login_tab" data-k="bot">Bot Token</button>'+
    '<button class="chip" data-a="login_tab" data-k="phone">Phone Number</button>'+
  '</div>'+
  '<div id="loginFormBot">'+
    '<div class="s" style="margin-bottom:10px;">Create a bot with @BotFather, add it to your private channel as an admin, then enter the details.</div>'+
    '<label>Bot token</label><input id="tk" type="password" autocomplete="off" placeholder="123456:ABC..." value="'+esc(S.cfg.token)+'">'+
    '<label>Channel ID or @username</label><input id="ch" autocomplete="off" placeholder="-1001234567890" value="'+esc(chVal)+'">'+
    '<button class="btn" id="sv" style="width:100%; margin-top:16px">Save and test</button>'+
  '</div>'+
  '<div id="loginFormPhone" style="display:none;">'+
    '<div class="s" style="margin-bottom:15px;">Sign in securely using your phone number.</div>'+
    '<button class="btn" data-a="auth" data-k="phone" style="width:100%">Sign in with phone number</button>'+
  '</div>'+
  '<label>Glass strength</label><input id="gl" type="range" min="0" max="100" value="'+GL+'">'+
  '<button class="btn o" data-a="close" style="width:100%; margin-top:16px">Close</button><div class="s" id="msg" style="margin-top:12px"></div>';
  $('#ov').style.display='flex';document.body.classList.add('sheet-open');
}
function saveCfg(){var t=$('#tk').value.replace(/\s/g,''),c=$('#ch').value.replace(/\s/g,''),m=$('#msg');
 if(!t||!c){m.textContent='Enter both the bot token and the channel.';return}
 m.textContent='Checking...';var x=new XMLHttpRequest();x.open('GET','https://api.telegram.org/bot'+encodeURIComponent(t)+'/getChat?chat_id='+encodeURIComponent(c));
 x.onload=function(){var r={};try{r=JSON.parse(x.responseText)}catch(e){}
  if(r.ok){S.cfg={token:t,chat:c};try{localStorage.setItem('tgcfg',JSON.stringify(S.cfg))}catch(e){}m.innerHTML='<span class="ok">Connected to '+esc(r.result.title||'your channel')+'.</span>';setTimeout(function(){closeSheet();run()},700)}
  else m.innerHTML='<span class="bd">'+esc(r.description||'Could not connect.')+' Check the token, and that the bot is an admin.</span>'};
 x.onerror=function(){m.innerHTML='<span class="bd">No connection to Telegram.</span>'};x.send()}

var AU={phone:['Your phone number','Use the full number with country code, like +92.','tel','+92 3xx xxxxxxx','Continue'],code:['Enter the code','Telegram sent it to your other device or by SMS.','tel','Code','Verify'],password:['Two-step password','Enter the cloud password of your account.','password','Password','Sign in']};
function openAuth(step,msg){S.sheet=true;var T=AU[step];
 var isPw = step == 'password';
 var rName = 'auth_' + Math.random().toString(36).slice(2);
 $('#sh').innerHTML='<div class="grab"></div><h2>'+T[0]+'</h2><div class="s">'+T[1]+'</div><input id="au" style="margin-top:16px" type="'+(isPw?'text':'tel')+'" inputmode="'+(isPw?'text':'tel')+'" autocomplete="off" data-lpignore="true" data-1p-ignore="true" name="'+rName+'" '+(isPw?'class="pw-text"':'')+' placeholder="'+T[3]+'"><div class="s" id="msg" style="margin-top:12px">'+(msg||'')+'</div><div style="margin-top:16px;display:flex"><button class="btn" data-enter="1" data-a="go" data-k="'+step+'" style="flex:1;margin-right:8px">'+T[4]+'</button><button class="btn o" data-a="close">Close</button></div>';
 $('#ov').style.display='flex';document.body.classList.add('sheet-open');setTimeout(function(){var i=$('#au');if(i)i.focus()},350)}
function authGo(step){var m=$('#msg'),v=$('#au').value.replace(/^\s+|\s+$/g,'');if(!v){m.textContent='Fill in this field first.';return}
 if(!window.TGDriver){m.innerHTML='<span class="bd">Bridge not loaded.</span>';return}
 m.textContent='Please wait...';
 window.TGDriver[step](v).then(function(r){var n=r&&r.next;if(n=='ready'){var old='';try{old=localStorage.getItem('tguid')||''}catch(e){}if(r.uid&&old!==r.uid)wipeLocal();try{localStorage.setItem('tguid',r.uid||'')}catch(e){}S.mode='acct';try{localStorage.setItem('tgmode','acct')}catch(e){}S.out=0;closeSheet();toast('Signed in.');hist();fetchProfile();run();startWatch()}else openAuth(n=='pass'?'password':'code')},function(e){m.innerHTML='<span class="bd">'+esc((e&&e.message)||e||'Something went wrong.')+'</span>'})}

function fetchProfile(){
  if(!window.TGDriver||!window.TGDriver.getMe)return;
  window.TGDriver.getMe().then(function(u){
    if(!u)return;
    S.profileName=u.firstName||'';
    if(u.photo){
      window.TGDriver.getProfilePic(u.id,u.accessHash,u.photo).then(function(url){
        if(url){S.profilePic=url;if(S.tab=='home')render();}
      }).catch(function(){});
    }
    if(S.tab=='home')render();
  }).catch(function(){});
}
function hist(){
 var D=window.TGDriver;if(!D||!D.history)return;
 D.history().then(histMeta).then(function(a){
  if(!a)return;var changed=false,sf=new Set(a.map(function(x){return x.fp})),si=new Set(a.map(function(x){return x.msgId}));
  var gone=function(it){return !sf.has(it.fp)&&!si.has(it.msgId)};
  /* removed from the Telegram channel outside the app: forget it locally and never re-upload it */
  if(!a.truncated)S.items.slice().forEach(function(it){
   if(it.state=='done'&&it.msgId&&gone(it)&&Date.now()-(it.doneAt||0)>15000){dropItem(it,true);changed=true}
   else if(it.state=='trash'&&gone(it)){dropItem(it,true);changed=true}});
  var hf={},hi={};S.items.forEach(function(i){hf[i.fp]=1;if(i.msgId)hi[i.msgId]=1});
  a.forEach(function(x){
   if(hf[x.fp]){var it=byFp(x.fp);if(it&&!it.msgId){it.msgId=x.msgId;save(it)}if(it&&x.folder&&!it.folder&&FLD(x.folder)){it.folder=x.folder;save(it)}return}
   if(hi[x.msgId]||S.tomb.has(x.fp))return;
if (x.folder && (!FLD(x.folder) || (FLD(x.folder) && FLD(x.folder).locked && !S.unlocked.has(x.folder)))) return; // skip protected folder items
var n={fp:x.fp,name:x.name,size:x.size||0,mtime:x.mtime||Date.now(),state:'done',p:1,msgId:x.msgId};
   if(x.folder&&FLD(x.folder))n.folder=x.folder;
   S.items.push(n);save(n);changed=true});
  if(S.rtrash){S.items.forEach(function(it){if(it.state=='done'&&it.msgId&&S.rtrash[it.msgId]){it.state='trash';it.trashAt=S.rtrash[it.msgId];save(it)}})}loadThumbs();render()},function(){})
}


/* ---- session watch, logout, per-account wipe ---- */
function authErr(e){return /AUTH_KEY|SESSION_REVOKED|SESSION_EXPIRED|USER_DEACTIVATED/.test(String((e&&(e.errorMessage||e.message))||e||''))}
function chk(){var D=window.TGDriver;if(!D||!D.check||S.mode!='acct'||document.hidden||!navigator.onLine)return;D.check().catch(function(e){if(authErr(e))forceLogout()})}
function startWatch(){if(S.wt)return;S.wt=setInterval(chk,60000);chk()}
function endSession(){try{localStorage.removeItem('tgsess');localStorage.removeItem('tgmode')}catch(e){}S.mode='';S.active=0;S.metaReady=false;S.metaIds=[]}
function wipeLocal(){S.items=[];S.folders=[];S.tomb=new Set();S.unlocked=new Set();S.syncFolders=[];S.selected.clear();S.selectMode=false;S.profilePic='';S.profileName='';S.vault=null;S.fdel={};S.rtrash=null;S.metaReady=false;S.metaIds=[];VK=null;S._v='';
 ['f','sync','folders','tomb','meta','vault','prog'].forEach(function(n){try{if(S.db)S.db.transaction(n,'readwrite').objectStore(n).clear()}catch(e){}});try{localStorage.removeItem('tguid')}catch(e){}}
function forceLogout(why){if(S.out)return;S.out=1;S.items.forEach(function(it){if(it.state=='up')rt(it.fp).stop='pause'});
 var D=window.TGDriver;(D&&D.logout?D.logout():Promise.resolve()).catch(function(){}).then(function(){endSession();S.sheet=true;
  $('#sh').innerHTML='<div class="grab"></div><h2>Logged out</h2><div class="s">'+esc(why||'You have been logged out from Telegram (this device was terminated). Please login again.')+'</div><div style="margin-top:20px"><button class="btn" data-a="auth" data-k="phone" style="width:100%">Login again</button></div>';
  $('#ov').style.display='flex';document.body.classList.add('sheet-open');render()})}
/* ---- cloud copy of folders / passwords / authenticator key (JSON file in the user's own Telegram channel) ---- */
function b64(u){var s='';for(var i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);return btoa(s)}
function unb64(s){var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
function fdelAdd(id){S.fdel=S.fdel||{};S.fdel[id]=Date.now();dbPut('meta',{k:'fdel',d:S.fdel})}
async function buildMeta(){var fl=(await dbAll('folders')).map(function(f){return{id:f.id,name:f.name,type:f.type,locked:!!f.locked,created:f.created,u:f.u||f.created||0,salt:f.salt?b64(f.salt):'',hash:f.hash?b64(f.hash):''}});
 var vault={};(await dbAll('vault')).forEach(function(v){vault[v.id]={iv:b64(v.iv),ct:b64(v.ct)}});var tp=await dbGet('meta','totp'),vk=await dbGet('meta','vkraw'),trash={};
 S.items.forEach(function(it){if(it.state=='trash'&&it.msgId)trash[it.msgId]=it.trashAt||1});
 return{v:1,t:Date.now(),folders:fl,del:S.fdel||{},vault:vault,vk:vk?vk.b:'',totp:tp?tp.secret:'',trash:trash}}
function msig(m){return (m.folders||[]).map(function(f){return f.id+':'+f.u}).sort().join()+'|'+(m.totp||'')+'|'+(m.vk||'')+'|'+Object.keys(m.trash||{}).sort().join()+'|'+Object.keys(m.del||{}).sort().join()+'|'+Object.keys(m.vault||{}).sort().join()}
async function applyMeta(m){if(!m||m.v!==1)return;var byId={};(await dbAll('folders')).forEach(function(f){byId[f.id]=f});S.fdel=S.fdel||{};
 Object.keys(m.del||{}).forEach(function(id){if(!S.fdel[id]||S.fdel[id]<m.del[id])S.fdel[id]=m.del[id]});
 for(var r of (m.folders||[])){var l=byId[r.id];if(S.fdel[r.id]&&S.fdel[r.id]>=(r.u||0))continue;
  if(!l||(r.u||0)>(l.u||l.created||0)){var f={id:r.id,name:r.name,type:r.type,locked:!!r.locked,created:r.created,u:r.u||0};if(r.locked){f.salt=unb64(r.salt);f.hash=unb64(r.hash)}await dbPut('folders',f);byId[r.id]=f}}
 Object.keys(S.fdel).forEach(function(id){var l=byId[id];if(l&&S.fdel[id]>=(l.u||l.created||0)){delete byId[id];dbDel('folders',id);dbDel('vault',id)}});
 S.folders=Object.keys(byId).map(function(k){return byId[k]});await dbPut('meta',{k:'fdel',d:S.fdel});
 if(m.vk){var cur=await dbGet('meta','vkraw');if(!cur||cur.b!==m.vk){await dbPut('meta',{k:'vkraw',b:m.vk});VK=null}}
 for(var vid in (m.vault||{})){var v=m.vault[vid];await dbPut('vault',{id:vid,iv:unb64(v.iv),ct:unb64(v.ct)})}
 if(m.totp){var tp=await dbGet('meta','totp');if(!tp||tp.secret!==m.totp)await dbPut('meta',{k:'totp',secret:m.totp})}
 S.rtrash=m.trash||{}}
function histMeta(a){var D=window.TGDriver;if(!a)return null;
 var fin=function(m){return applyMeta(m).then(function(){S.metaReady=true;S.metaIds=a.metaIds||[];return buildMeta().then(function(lm){if(!m||msig(lm)!==msig(m))cloudSave()})}).then(function(){return a})};
 if(!a.metaId)return fin(null);
 return D.readMeta(a.metaId).then(fin,function(){setTimeout(hist,20000);return a})}
var cs=null,csBusy=false,csAgain=false;
function cloudSave(){if(S.mode!='acct'||!window.TGDriver||!window.TGDriver.writeMeta)return;clearTimeout(cs);cs=setTimeout(doCloud,1500)}
function doCloud(){if(!S.metaReady){setTimeout(cloudSave,5000);return Promise.resolve()}if(csBusy){csAgain=true;return Promise.resolve()}csBusy=true;
 return buildMeta().then(function(m){return window.TGDriver.writeMeta(m,S.metaIds||[])}).then(function(id){S.metaIds=[id]}).catch(function(e){console.log('meta save failed',e);setTimeout(cloudSave,15000)}).then(function(){csBusy=false;if(csAgain){csAgain=false;cloudSave()}})}
function flushMeta(){clearTimeout(cs);return doCloud()}
/* ---- thumbnails for files restored from Telegram ---- */
var thQ=[],thBusy=0,thTried={};
function loadThumbs(){S.items.forEach(function(it){if(it.state!='done'||it.thumb||thTried[it.fp]||!it.msgId)return;var k=kind(it);if(k!='image'&&k!='video')return;thTried[it.fp]=1;thQ.push(it)});thPump()}
function thPump(){var D=window.TGDriver;if(!D||!D.getThumb)return;while(thBusy<2&&thQ.length){(function(it){thBusy++;D.getThumb(it.msgId).then(function(u){if(u){it.thumb=u;save(it);clearTimeout(S.tr);S.tr=setTimeout(function(){if(!S.sheet)render()},500)}}).catch(function(){}).then(function(){thBusy--;thPump()})})(thQ.shift())}}
/* ---- iOS Swipe to Close (Sheet) ---- */
var shY = 0, shStart = 0, shDrag = false;
document.addEventListener('touchstart', function(e) {
    var grab = e.target.closest('.grab');
    if (!grab) return;
    grab.classList.add('active');
    shDrag = true;
    shStart = e.touches[0].clientY;
    var sh = document.getElementById('sh');
    sh.style.transition = 'none';
    try { navigator.vibrate(10); } catch(x){}
}, {passive: true});
document.addEventListener('touchmove', function(e) {
    if (!shDrag) return;
    var y = e.touches[0].clientY - shStart;
    if (y < 0) y = 0;
    var sh = document.getElementById('sh');
    sh.style.transform = 'translateY(' + y + 'px)';
    e.preventDefault();
}, {passive: false});
document.addEventListener('touchend', function(e) {
    var grab = document.querySelector('.grab.active');
    if (grab) grab.classList.remove('active');
    if (!shDrag) return;
    shDrag = false;
    var sh = document.getElementById('sh');
    sh.style.transition = 'transform 0.3s ease-out';
    var y = parseFloat(sh.style.transform.replace('translateY(', '').replace('px)', '')) || 0;
    if (y > 100) {
        sh.style.transform = 'translateY(100%)';
        setTimeout(closeSheet, 300);
    } else {
        sh.style.transform = 'translateY(0)';
    }
});

/* Add blur class when sheet opens */
var _origOpenSheet = window.openSheet;
document.addEventListener('click', function(e) {
    if (e.target.closest('[data-a="profile"]') || e.target.closest('[data-a="settings"]') || e.target.closest('[data-a="new_folder"]') || e.target.closest('[data-a="upload_here"]') || e.target.closest('[data-a="vault"]') || e.target.closest('[data-a="autosync"]')) {
        setTimeout(function(){ document.body.classList.add('sheet-open'); }, 10);
    }
});

/* ---- app feel: long-press select, no context menu / pinch zoom ---- */
(function(){var t=null,sx=0,sy=0;
 document.addEventListener('touchstart',function(e){var el=e.target.closest&&e.target.closest('[data-fp]');if(!el||e.touches.length>1)return;var at=el.getAttribute('data-a');if(at!='view'&&at!='select_file')return;var fp=el.getAttribute('data-fp');sx=e.touches[0].clientX;sy=e.touches[0].clientY;clearTimeout(t);
  t=setTimeout(function(){t=null;S.lp=Date.now();if(!S.selectMode){S.selectMode=true;S.selected.clear()}S.selected.add(fp);try{navigator.vibrate&&navigator.vibrate(15)}catch(x){}render()},450)},{passive:true});
 document.addEventListener('touchmove',function(e){if(e.touches.length>1){e.preventDefault();return}if(t&&(Math.abs(e.touches[0].clientX-sx)>10||Math.abs(e.touches[0].clientY-sy)>10)){clearTimeout(t);t=null}},{passive:false});
 ['touchend','touchcancel'].forEach(function(n){document.addEventListener(n,function(){clearTimeout(t);t=null},{passive:true})});
 document.addEventListener('click',function(e){if(S.lp&&Date.now()-S.lp<700){e.stopPropagation();e.preventDefault();S.lp=0}},true);
 document.addEventListener('contextmenu',function(e){if(!/^(INPUT|TEXTAREA)$/.test(e.target.tagName))e.preventDefault()});
 ['gesturestart','gesturechange','gestureend'].forEach(function(n){document.addEventListener(n,function(e){e.preventDefault()},{passive:false})});
})();

document.addEventListener('click',function(e){
 var el=e.target;while(el&&el!==document&&!(el.getAttribute&&(el.getAttribute('data-a')||el.id=='sv'||el.id=='fab'||el.id=='closeV')))el=el.parentNode;if(!el||el===document)return;
 if(el.id=='sv')return saveCfg();
if(el.id=='fab'){
  if(S.tab=='transfers'||S.tab=='deleted') return;
  var ctx = curCtx();
  if(S.tab=='photos'||S.tab=='videos'||S.tab=='audio'){
      S.pickTarget=ctx; $('#pickA').accept=FT[ctx.type]?FT[ctx.type].acc:''; $('#pickA').click(); return;
  }
  if(S.tab=='files'){ S.pickTarget={type:'docs'}; $('#pickA').accept=''; $('#pickA').click(); return; }
  if(S.tab=='folder'){
    var f = FLD(S.folderId);
    if(S.folderId=='filemanager' || (f && f.parent)) return openPlus(); // File manager me new folder ya upload dono ka option
    if(S.folderId=='notepad') return openNoteEditor();
    S.pickTarget=ctx; $('#pickA').accept=FT[f.type]?FT[f.type].acc:''; $('#pickA').click(); return;
}
  return openPlus();
}
if(el.id=='closeV'){
    $('#ovV').style.display='none';
    var v = document.getElementById('vVideo'); if(v) { v.pause(); v.src = ''; }
    var a = document.querySelector('#vContent audio'); if(a) { a.pause(); a.src = ''; }
    $('#vContent').innerHTML=''; return;
}
 var a=el.getAttribute('data-a'),k=el.getAttribute('data-k'),fp=el.getAttribute('data-fp'),it=fp?byFp(fp):null;
 if(S.vault)armVault();
 if(!ready()&&['auth','go','close','eye'].indexOf(a)<0)return openLogin();
 if(a=='tab'){if(S.tab=='folder'&&k!='folder')S.unlocked.clear();S.tab=k;S.anim=1;S.q='';S.selectMode=false;S.selected.clear();if(k=='files')S.f='all';render();window.scrollTo(0,0)}
 else if(a=='settings')openSettings();else if(a=='close')closeSheet();
 else if(a=='kind'){S.tab='files';S.f=k;render()}
 else if(a=='f'){S.f=k;render()}
 else if(a=='login_tab'){
  var isBot=(k=='bot');$('#loginFormBot').style.display=isBot?'block':'none';$('#loginFormPhone').style.display=isBot?'none':'block';
  var parent=el.parentNode;if(parent){Array.from(parent.children).forEach(function(c){c.classList.remove('on')});el.classList.add('on')}}
 else if(a=='auth')openAuth(k);else if(a=='go')authGo(k);
 else if(a=='view'){if(it)openViewer(it)}
 else if(a=='del'){if(it)trashItems([it])}
 else if(a=='restore'){if(it)restoreItems([it])}
 else if(a=='purge'){if(it)askPurge([it])}
 else if(a=='select_mode'){S.selectMode=true;S.selected.clear();render()}
 else if(a=='cancel_select'){S.selectMode=false;S.selected.clear();render()}
 else if(a=='select_file'){
  if(S.selected.has(fp)){S.selected['delete'](fp);el.classList.remove('selected-item');var ch=el.querySelector('.chk-icon');if(ch)ch.innerHTML='<i class="fa-regular fa-circle" style="color:var(--tx3)"></i>'}
  else{S.selected.add(fp);el.classList.add('selected-item');var ch2=el.querySelector('.chk-icon');if(ch2)ch2.innerHTML='<i class="fa-solid fa-circle-check" style="color:var(--ac)"></i>'}
  var bar=document.getElementById('sel-bar');if(bar)bar.remove();
  if(S.selected.size)$('#app').insertAdjacentHTML('beforeend',selBar())}
 else if(a=='select_all'){var vis=S.items.filter(function(x){if(hid(x))return false;if(S.tab=='deleted')return x.state=='trash';if(x.state=='trash')return false;
  if(S.tab=='photos')return kind(x)=='image'&&!x.folder;if(S.tab=='videos')return kind(x)=='video'&&!x.folder;if(S.tab=='audio')return kind(x)=='audio'&&!x.folder;
  if(S.tab=='folder')return x.folder===S.folderId;var q=S.q.toLowerCase();return S.tab=='files'&&(S.f=='all'||kind(x)==S.f)&&(!q||x.name.toLowerCase().indexOf(q)>-1)});
  var all=vis.length&&vis.every(function(x){return S.selected.has(x.fp)});vis.forEach(function(x){if(all)S.selected['delete'](x.fp);else S.selected.add(x.fp)});render()}
 else if(a=='del_selected')trashItems(sel());
 else if(a=='restore_selected')restoreItems(sel());
 else if(a=='purge_selected')askPurge(sel());
 else if(a=='dl_selected')doDownloadSelected();
 /* transfers */
 else if(a=='tr_pause'&&it){if(it.state=='queued'){it.state='paused';save(it);render()}else if(it.state=='up'){var r=rt(it.fp);r.stop='pause';if(r.xhr)r.xhr.abort();toast('Pausing...')}}
 else if(a=='tr_resume'&&it){it.state='queued';it.err='';save(it);run();render()}
 else if(a=='tr_cancel'&&it){if(it.state=='up'){var r2=rt(it.fp);r2.stop='cancel';if(r2.xhr)r2.xhr.abort();toast('Cancelling...')}else{dropItem(it,true);toast('Transfer cancelled');render()}}
 else if(a=='tr_pause_all'){S.items.forEach(function(x){if(x.state=='queued'){x.state='paused';save(x)}else if(x.state=='up'){var q=rt(x.fp);q.stop='pause';if(q.xhr)q.xhr.abort()}});render()}
 else if(a=='tr_resume_all'){S.items.forEach(function(x){if(x.state=='paused'){x.state='queued';save(x)}});run();render()}
 else if(a=='retry'){S.items.forEach(function(x){if(x.state=='fail'&&!x.big){x.state='queued';save(x)}});run()}
 /* folders & upload */
 else if(a=='new_folder')openNewFolder();
 else if(a=='ftype'){S.nf.type=k;Array.from(el.parentNode.children).forEach(function(c){c.classList.remove('on')});el.classList.add('on');hint()}
 else if(a=='tg_lock'){S.nf.lock=!S.nf.lock;$('#swk').classList.toggle('on',S.nf.lock);$('#pwBox').style.display=S.nf.lock?'block':'none';$('#swT').innerHTML='Optional &middot; '+(S.nf.lock?'Enabled':'Disabled')}
 else if(a=='eye'){var inp=document.getElementById(k);if(inp){var show=inp.type=='password';inp.type=show?'text':'password';el.innerHTML=show?EYEOFF:EYE}}
 else if(a=='open_folder')openFolder(k);
else if(a=='open_util') { S.tab='folder'; S.folderId=k; S.anim=1; render(); window.scrollTo(0,0); }
 else if(a=='del_folder')askDelFolder();
 else if(a=='upload_here'){
    if(S.sheet){S.sheet=false;$('#ov').style.display='none';document.body.classList.remove('sheet-open')}
    var ctx=curCtx();
    if(S.tab=='folder' && S.folderId=='notepad') return openNoteEditor();
    S.pickTarget=ctx;$('#pickA').accept=ctx&&FT[ctx.type]?FT[ctx.type].acc:'';$('#pickA').click()
}
 /* vault */
 else if(a=='vault'){openVault()}
 else if(a=='v_eye'){var t=document.getElementById('vp_'+k);if(t&&S.vault){var sh=t.getAttribute('data-s')=='1';t.setAttribute('data-s',sh?'0':'1');t.textContent=sh?'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022':S.vault[k];el.innerHTML=sh?EYE:EYEOFF}}
 else if(a=='v_copy'){if(S.vault&&S.vault[k]&&navigator.clipboard){var pw=S.vault[k];navigator.clipboard.writeText(pw).then(function(){toast('Copied. Clipboard clears in 30s.');setTimeout(function(){navigator.clipboard.writeText('').catch(function(){})},30000)},function(){toast('Copy not allowed here')})}}
 else if(a=='copy_secret'){if(S.pend&&navigator.clipboard)navigator.clipboard.writeText(S.pend).then(function(){toast('Key copied')},function(){toast('Copy not allowed here')})}
 else if(a=='profile')openProfile();
 else if(a=='proxy')openProxy();
 else if(a=='autosync')openAutoSync();
 else if(a=='rm_sync'){S.syncFolders=S.syncFolders.filter(function(f){return f.name!==k});rmSyncFolder(k);renderAutoSyncUI();toast('Folder removed')}
 else if(a=='safe_logout'){showConfirm('safe','Safe Logout','Your data will remain in Telegram.','Logout','Logout','var(--ac)')}
 else if(a=='delete_account'){
  $('#sh').innerHTML='<div class="grab"></div><h2>Delete TeleSpace Account</h2><div class="s">Choose an option:</div><div style="margin-top:20px;display:flex;flex-direction:column;gap:10px"><button class="btn" data-a="factory_delete" style="background:var(--bad)">Factory Delete Backup Data</button><button class="btn o" data-a="do_logout">Keep Safe Data</button><button class="btn o" data-a="close">Cancel</button></div>'}
 else if(a=='factory_delete')showConfirm('factory','Factory Delete','This will permanently delete your Telegram Channel and all local data.','delete','Delete Account','var(--bad)');
 else if(a=='do_logout')showConfirm('safe','Keep Safe Data','This will log you out but keep your data in Telegram.','logout','Logout','var(--ac)');
 else if(a=='report'){var lg=(window.__errs||[]).join('\n')||'No errors recorded';var txt = 'Hello iSpace Team!\n\n[ Write Problem ]\n\nError Log:\n'+lg;window.open('https://wa.me/923041891897?text='+encodeURIComponent(txt), '_blank')}
 else if(a=='telegram_channel'){
  if(!window.TGDriver||!window.TGDriver.getChannelLink)return toast('Not connected');
  toast('Opening channel...');
  window.TGDriver.getChannelLink().then(function(url){if(url)window.open(url,'_blank');else toast('Could not get link')}).catch(function(){toast('Error opening channel')})}
});

document.addEventListener('input',function(e){if(e.target.id=='q'){S.q=e.target.value;$('#list').innerHTML=listHtml()}else if(e.target.id=='gl')glass(+e.target.value)});
document.addEventListener('keydown',function(e){if(e.key=='Enter'&&e.target.tagName=='INPUT'){var b=document.querySelector('#sh [data-enter]');if(b&&S.sheet){e.preventDefault();b.click()}}});
$('#ov').addEventListener('click',function(e){if(e.target===this)closeSheet()});
['pickM','pickA','pickDir','pickDir2'].forEach(function(id){
 if($('#'+id))$('#'+id).addEventListener('change',function(){
  document.body.classList.remove('sheet-open'); // Blur hatane ke liye
  var t=S.pickTarget;S.pickTarget=null;
  if(this.files&&this.files.length)add(Array.prototype.slice.call(this.files),t);
  this.value='';this.accept=id=='pickA'?'':this.accept})});
document.addEventListener('visibilitychange',function(){
 if(document.hidden){S.unlocked.clear();S.vault=null;if(S.tab=='folder'){S.tab='home';if(!S.sheet)render()}if(S.sheet&&($('#ulPw')||$('#vaCode')||$('#sh .vpw')))closeSheet();return}
 run();scanFolders();tickGreet();chk()});
/* internet back: failed-by-network uploads restart, big uploads continue by themselves from the last saved part */
window.addEventListener('online',function(){S.items.forEach(function(it){if(it.state=='fail'&&it.net&&!it.big){it.state='queued';save(it)}});run();if(S.tab=='transfers')render()});
window.addEventListener('offline',function(){if(S.tab=='transfers')render()});

function openNoteEditor(existingItem) {
    var titleVal = existingItem ? existingItem.name : 'Title.html';
    var showEditor = function(title, content) {
        S.sheet = true;
        $('#sh').innerHTML = '<div class="grab"></div><h2>' + (existingItem ? 'Edit Note' : 'New Note') + '</h2>' +
            '<input id="noteTitle" placeholder="Title.html" value="'+esc(title)+'" style="margin-bottom:10px">' +
            '<div style="background:var(--sf2);border-radius:14px;padding:10px;margin-bottom:10px;display:flex;gap:10px;overflow-x:auto">' +
    '<button onmousedown="event.preventDefault()" class="btn o" style="padding:0 10px;height:32px;font-size:12px" onclick="document.execCommand(\'bold\', false, null)"><b>B</b></button>' +
    '<button onmousedown="event.preventDefault()" class="btn o" style="padding:0 10px;height:32px;font-size:12px" onclick="document.execCommand(\'italic\', false, null)"><i>I</i></button>' +
    '<button onmousedown="event.preventDefault()" class="btn o" style="padding:0 10px;height:32px;font-size:12px" onclick="document.execCommand(\'underline\', false, null)"><u>U</u></button>' +
    '<button onmousedown="event.preventDefault()" class="btn o" style="padding:0 10px;height:32px;font-size:12px" onclick="var url = prompt(\'Enter link:\'); if(url) document.execCommand(\'createLink\', false, url)">Link</button>' +
    '<button onmousedown="event.preventDefault()" class="btn o" style="padding:0 10px;height:32px;font-size:12px" onclick="document.execCommand(\'insertUnorderedList\', false, null)">List</button>' +
'</div>' +
            '<div id="noteContent" contenteditable="true" style="width:100%;height:200px;background:var(--sf2);border-radius:14px;padding:16px;color:#fff;outline:none;overflow:auto">'+content+'</div>' +
            '<div style="margin-top:16px;display:flex"><button class="btn" id="saveNote" style="flex:1;margin-right:8px">Save to Notepad</button><button class="btn o" data-a="close">Cancel</button></div>';
        $('#ov').style.display='flex'; document.body.classList.add('sheet-open');
        
        $('#saveNote').onclick = function() {
            var title = $('#noteTitle').value.trim() || 'Note_' + Date.now();
            if(!title.endsWith('.html') && !title.endsWith('.txt')) title += '.html';
            var html = $('#noteContent').innerHTML;
            if(!html || html === '<br>') return toast('Cannot save empty note.');
            var file = new File([html], title, {type: 'text/html'});
            S.pickTarget = {id: 'notepad', type: 'notes'};
            
            if (existingItem) {
                window.TGDriver.deleteMessages([existingItem.msgId]).catch(function(){});
                dropItem(existingItem, false);
            }
            
            add([file], S.pickTarget);
            closeSheet();
        };
    };

    if (existingItem && existingItem.msgId) {
        toast('Loading note...');
        window.TGDriver.getMedia(existingItem.msgId).then(function(buf) {
            var text = new TextDecoder().decode(buf);
            showEditor(titleVal, text);
        }).catch(function() { toast('Failed to load note.'); });
    } else {
        showEditor(titleVal, '');
    }
}

openDb(function(){
 Promise.all([dbAll('folders'),dbAll('tomb'),dbAll('prog'),dbAll('sync'),dbGet('meta','fdel')]).then(function(r){
  S.folders=r[0];S.fdel=(r[4]&&r[4].d)||{};r[1].forEach(function(t){S.tomb.add(t.fp)});S.syncFolders=r[3];
  var prog={};r[2].forEach(function(p){prog[p.fp]=p});
  loadAll(function(){
   S.items=S.items.filter(function(it){
    if(it.state=='deleted'){addTomb(it.fp);delDb(it.fp);return false} /* old records: "deleted from Telegram" */
    if(it.state=='up')it.state='queued';
    if((it.state=='queued'||it.state=='paused')&&!it.blob){delProg(it.fp);return false}
    if(it.state=='fail'&&!it.big&&it.blob)it.state='queued';
    if(prog[it.fp]&&it.state!='done'&&it.state!='trash')it.prog=prog[it.fp];
    return true});
   S.items.sort(function(a,b){return b.mtime-a.mtime});render();
   if(S.mode=='acct'){hist();fetchProfile();setTimeout(scanFolders,2000);startWatch()}
   if(ready())run()})})});
})();
