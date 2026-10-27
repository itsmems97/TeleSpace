(function(){
var $=function(s){return document.querySelector(s)};
var S={mode:'',tab:'home',q:'',f:'all',items:[],cfg:{token:'',chat:''},db:null,active:0,sheet:false,_lastCount:-1,_lastState:-1,profilePic:'',selectMode:false,selected:new Set()};
var KINDS=[['image','Images','photo','photos'],['video','Videos','video','videos'],['app','Apps','app','apps'],['zip','Archives','file','files'],['audio','Audio','track','tracks'],['doc','Documents','file','files'],['other','Other','file','files']];
var ICON={image:'photos',video:'video',audio:'audio',doc:'doc',zip:'zip',app:'apk',other:'doc'};
try{var c=JSON.parse(localStorage.getItem('tgcfg')||'{}');S.cfg.token=c.token||'';S.cfg.chat=c.chat||''}catch(e){}
try{if(window.TGDriver&&localStorage.getItem('tgmode')=='acct')S.mode='acct'}catch(e){}
var GL=70;try{GL=+(localStorage.getItem('tggl')||70)}catch(e){}
function glass(v){GL=v;var r=document.documentElement.style;r.setProperty('--ga',(.4+v/100*.48).toFixed(2));r.setProperty('--gb',(14+v/100*24)+'px');try{localStorage.setItem('tggl',v)}catch(e){}}glass(GL);

function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ic(n,st){return '<svg class="i"'+(st?' style="'+st+'"':'')+'><use href="#'+n+'"/></svg>'}
function fmt(n){if(isNaN(n)||n==null)return '0 B';if(n<1024)return n+' B';var u=['KB','MB','GB','TB'],i=-1;do{n/=1024;i++}while(n>=1024&&i<3);return (n>=100||i==0?Math.round(n):n.toFixed(1))+' '+u[i]}
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

/* storage */
function openDb(cb){try{var r=indexedDB.open('telegrive-web',1);r.onupgradeneeded=function(){r.result.createObjectStore('f',{keyPath:'fp'})};r.onsuccess=function(){S.db=r.result;cb()};r.onerror=function(){cb()};r.onblocked=function(){cb()}}catch(e){cb()}}
function save(it){if(!S.db)return;try{S.db.transaction('f','readwrite').objectStore('f').put(it)}catch(e){}}
function delDb(fp){if(!S.db)return;try{S.db.transaction('f','readwrite').objectStore('f').delete(fp)}catch(e){}}
function loadAll(cb){if(!S.db)return cb();try{var q=S.db.transaction('f').objectStore('f').getAll?S.db.transaction('f').objectStore('f').getAll():null;
 if(!q){var a=[];S.db.transaction('f').objectStore('f').openCursor().onsuccess=function(e){var c=e.target.result;if(c){a.push(c.value);c.continue()}else{S.items=a;cb()}};return}
 q.onsuccess=function(){S.items=q.result||[];cb()};q.onerror=function(){cb()}}catch(e){cb()}}

/* upload */
function send(it,done){
  if(S.mode=='acct'&&window.TGDriver){
    window.TGDriver.upload(it.blob,it.name,function(p){it.p=p;paint()}).then(function(id){it.state='done';it.msgId=id;it.blob=null;it.p=1;it.err='';save(it);done()},function(e){fail(it,String((e&&e.message)||e||'Upload failed'),done)});
    return;
  }
 var x=new XMLHttpRequest(),fd=new FormData();
 fd.append('chat_id',S.cfg.chat);fd.append('disable_notification','true');fd.append('caption',it.name);fd.append('document',it.blob,it.name);
 x.open('POST','https://api.telegram.org/bot'+S.cfg.token+'/sendDocument');
 x.upload.onprogress=function(e){if(e.lengthComputable){it.p=e.loaded/e.total;paint()}};
 x.onload=function(){var r={};try{r=JSON.parse(x.responseText)}catch(e){}
  if(r.ok){it.state='done';it.msgId=r.result.message_id;it.blob=null;it.p=1;it.err='';save(it);done()}
  else if(r.error_code==429){setTimeout(function(){send(it,done)},((r.parameters&&r.parameters.retry_after)||5)*1000)}
  else fail(it,r.description||'Telegram did not accept this file.',done)};
 x.onerror=function(){fail(it,'No connection. It tries again next time you open Telegrive.',done)};
 x.send(fd)
}
function fail(it,m,done){it.state='fail';it.err=m;save(it);done()}
function run(){if(!ready())return;
 while(S.active<2){var it=null,i;for(i=0;i<S.items.length;i++){if(S.items[i].state=='queued'){it=S.items[i];break}}
  if(!it)break;
  if(!it.blob){ it.state='fail'; it.err='Data missing, re-upload.'; save(it); continue; }
  if(it.size>50*1024*1024){it.state='fail';it.big=true;it.err='Over 50 MB.';save(it);continue}
  it.state='up';it.p=0;S.active++;(function(it){send(it,function(){S.active--;run();paint()})})(it)}
 paint()}

function add(files){var fresh=0,skipped=0,i,have={};
 for(i=0;i<S.items.length;i++)have[S.items[i].fp]=1;
 for(i=0;i<files.length;i++){var f=files[i],fp=f.name+'|'+f.size+'|'+f.lastModified;
  if(have[fp]){skipped++;continue}have[fp]=1;fresh++;
  var it={fp:fp,name:f.name,size:f.size,type:f.type,mtime:f.lastModified||Date.now(),state:'queued',p:0,blob:f};
  S.items.unshift(it);save(it);thumb(it)}
 toast(fresh?(fresh+' to back up'+(skipped?', '+skipped+' skipped':'')):(skipped+' already backed up.'));
 if(!ready()&&fresh){openSettings();return}
 run();paint()}
function thumb(it){if(kind(it)!='image'||!window.URL)return;var im=new Image(),u=URL.createObjectURL(it.blob);
 im.onload=function(){try{var s=Math.min(1,200/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,im.width*s);c.height=Math.max(1,im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);it.thumb=c.toDataURL('image/jpeg',.7);save(it);paint()}catch(e){}URL.revokeObjectURL(u)};
 im.onerror=function(){URL.revokeObjectURL(u)};im.src=u}

/* views */
function slot(it){var k=kind(it);return '<div class="slot">'+(it.thumb?'<img alt="" src="'+it.thumb+'">':ic(ICON[k],'color:var(--k-'+k+')'))+'</div>'}
function row(it){
 let id = it.fp.replace(/[^a-zA-Z0-9]/g,'');
 let st = '';
 if(it.state=='done') st = '<span class="ok">'+ic('cloud')+'</span>';
 else if(it.state=='up') st = '<span class="mt" id="pt_'+id+'">'+Math.round((it.p||0)*100)+'%</span>';
 else if(it.state=='fail') st = '<span class="bd">'+ic('warn')+'</span>';
 else if(it.state=='deleted') st = '<span class="bd" style="font-size:12px">Deleted</span>';
 else st = '<span class="mt">Waiting</span>';

 let bar = it.state=='up' ? '<div class="bar" style="height:4px;margin-top:4px"><i id="pb_'+id+'" style="width:'+(it.p*100)+'%"></i></div>' : '';
 let err = it.state=='fail' ? '<span class="bd">'+esc(it.err||'Failed')+'</span>' : (it.state=='deleted' ? '<span class="bd">Deleted from Telegram</span>' : fmt(it.size)+' &middot; '+dt(it.mtime));

 let action = S.selectMode ? 'select_file' : 'view';
 let chk = S.selectMode ? '<div style="margin-right:12px;color:var(--ac);font-size:22px">'+(S.selected.has(it.fp)?'☑':'☐')+'</div>' : '';
 let del = (!S.selectMode && it.state!='deleted') ? '<button class="ib" style="color:var(--bad);margin-left:8px" data-a="del" data-fp="'+it.fp+'"><svg class="i" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' : '';

 return '<div class="r" data-a="'+action+'" data-fp="'+it.fp+'">'+chk+slot(it)+'<div class="m"><div class="t">'+esc(it.name)+'</div><div class="mt">'+err+'</div>'+bar+'</div>'+st+del+'</div>'
}
function counts(){var c={up:0,q:0,f:0,d:0,del:0,p:0,n:0},i,it;for(i=0;i<S.items.length;i++){it=S.items[i];if(it.state=='up'){c.up++;c.p+=it.p||0}else if(it.state=='queued')c.q++;else if(it.state=='fail')c.f++;else if(it.state=='deleted')c.del++;else c.d++;}c.n=c.up+c.q;return c}

function head(t, extra){
  return '<div class="top"><h1>'+t+'</h1>'+ (extra||'') +'<button class="ib" data-a="settings">'+ic('cloud')+'</button></div>';
}

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
 
 let avHtml = S.profilePic ? '<img src="'+S.profilePic+'" style="width:100%;height:100%;border-radius:22px;object-fit:cover">' : (ready()?'ME':'?');

 return '<div class="top"><svg width="36" height="36" viewBox="0 0 36 36"><path d="M4 16L19 8l-4 13z" fill="#3085FE"/><path d="M20 6l12-3-6 13z" fill="#0EBC5F"/><path d="M17 23l9-5 4 12z" fill="#FDCD06"/></svg><b>Telegrive</b><button class="ib" data-a="transfers">'+ic('swap')+'</button><button class="av" data-a="profile" style="padding:0;overflow:hidden">'+avHtml+'</button></div>'
 +'<div class="field" data-a="search">'+ic('search')+'<span style="margin-left:12px">Search files and folders</span></div>'+status()
 +(ready()?'<div class="card"><div class="r"><div class="m"><div class="t">Back up photos</div><div class="s">Choose photos and videos.</div></div></div><div class="pad" style="padding-top:0"><button class="btn" data-a="pickM">Choose photos</button></div></div>':'')
 +'<div class="sec">Storage</div>'+(n?'<div class="card"><div class="pad"><b style="font-size:17px;font-weight:700">'+fmt(tot)+'</b> <span class="s">in '+n+' file'+(n==1?'':'s')+'</span><div class="bar" style="height:6px">'+seg+'</div></div>'+rows+'</div>':'<div class="empty">Nothing in your drive yet.</div>')}

function listHtml(){var q=S.q.toLowerCase(),L=S.items.filter(function(it){
  if(S.f=='tr')return it.state!='done' && it.state!='deleted';
  if(S.f=='deleted')return it.state=='deleted';
  if(S.f!='all'&&kind(it)!=S.f)return false;return !q||it.name.toLowerCase().indexOf(q)>-1});
 return L.length?'<div class="card">'+L.map(row).join('')+'</div>':'<div class="empty">'+(S.f=='tr'?'No transfers running.':S.f=='deleted'?'No items deleted.':q?'No files match search.':'No files here yet.')+'</div>'}

function files(){
  var F=[['all','All'],['image','Photos'],['video','Videos'],['doc','Documents'],['tr','Transfers'],['deleted','Deleted']];
  let extra = S.selectMode ? '<button class="lnk" style="margin-right:12px" data-a="cancel_select">Cancel</button>' : '<button class="lnk" style="margin-right:12px" data-a="select_mode">Select</button>';
  
  // Yahan Cloud Icon hata diya gaya hai (head function use nahi kiya)
  return '<div class="top"><h1>Files</h1>'+extra+'</div>'
  +'<div class="field">'+ic('search')+'<input id="q" type="search" placeholder="Search files" value="'+esc(S.q)+'"></div><div class="chips">'+F.map(function(f){return '<button class="chip'+(S.f==f[0]?' on':'')+'" data-a="f" data-k="'+f[0]+'">'+f[1]+'</button>'}).join('')+'</div><div id="list">'+listHtml()+'</div>'
  + (S.selectMode ? '<div style="position:fixed;bottom:100px;left:0;right:0;display:flex;justify-content:center;z-index:10"><button class="btn" data-a="del_selected" style="background:var(--bad);box-shadow:0 4px 12px rgba(255,59,48,0.4)">Delete Selected ('+S.selected.size+')</button></div>' : '')
}

function photos(){var P=S.items.filter(function(it){var k=kind(it);return (k=='image'||k=='video') && it.state!='deleted'}),g={},o=[],h='';
 P.sort(function(a,b){return b.mtime-a.mtime}).forEach(function(it){var m=dt(it.mtime,{month:'long',year:'numeric'});if(!g[m]){g[m]=[];o.push(m)}g[m].push(it)});
 o.forEach(function(m){h+='<div class="sec">'+m+'</div><div class="grid">'+g[m].map(function(it){return '<div class="cell" data-a="view" data-fp="'+it.fp+'">'+(it.thumb?'<img alt="" src="'+it.thumb+'">':'<div class="c" style="color:var(--k-'+kind(it)+')">'+ic(ICON[kind(it)])+'</div>')+'<em class="'+(it.state=='done'?'d':'')+'"></em></div>'}).join('')+'</div>'});
 return head('Photos')+status()+(h||'<div class="empty">No photos backed up yet.</div>')+(ready()?'<div style="margin-top:16px"><button class="btn" data-a="pickM">Choose photos</button></div>':'')}

function render(){var v=S.tab=='home'?home():S.tab=='files'?files():photos();$('#app').innerHTML=v;if(S.anim){S.anim=0;var A=$('#app');A.classList.remove('in');void A.offsetWidth;A.classList.add('in')}
 $('#nav').innerHTML=[['home','Home','home'],['files','Files','folder'],['photos','Photos','photos']].map(function(t){return '<button data-a="tab" data-k="'+t[0]+'" class="'+(S.tab==t[0]?'on':'')+'"><span>'+ic(t[2])+'</span>'+t[1]+'</button>'}).join('');live()}
function live(){var c=counts(),b=$('#live');if(!c.n||!ready()){b.style.display='none';return}
 var pct=Math.round(((c.p+c.d)/Math.max(1,c.n+c.d))*100);b.style.display='block';$('#liveT').textContent='Uploading '+c.n+' item'+(c.n>1?'s':'')+' · '+pct+'%';$('#liveB').style.width=pct+'%'}

var pending=false;
function paint(){
 if(pending)return;
 pending=true;
 (window.requestAnimationFrame||setTimeout)(function(){
   pending=false;
   if(S.sheet)return live();
   let c = counts();
   if(S.tab=='files' && $('#list')){
      S.items.forEach(function(it){
         if(it.state=='up'){
            let id = it.fp.replace(/[^a-zA-Z0-9]/g,'');
            let bar = document.getElementById('pb_'+id);
            let txt = document.getElementById('pt_'+id);
            if(bar) bar.style.width = Math.round((it.p||0)*100)+'%';
            if(txt) txt.textContent = Math.round((it.p||0)*100)+'%';
         }
      });
      if(S._lastCount !== c.n || S._lastState !== c.d) {
         $('#list').innerHTML = listHtml(); 
         S._lastCount = c.n; S._lastState = c.d;
      }
      live();
   } else {
      if(S._lastCount !== c.n || S._lastState !== c.d) {
         render(); S._lastCount = c.n; S._lastState = c.d;
      } else { live(); }
   }
 })
}

/* Viewer */
function openViewer(it){
  if(it.state=='deleted') return toast("File deleted from Telegram");
  if(it.state!='done' && it.state!='up') return toast("File not ready");

  $('#vContent').innerHTML = '<div style="color:#fff">Loading...</div>';
  $('#ovV').style.display = 'flex';
  $('#vDownload').style.display = 'none';

  if(it.state=='up' && it.blob){
      showMedia(it.blob, it.name, it.type);
  } else if(it.state=='done' && window.TGDriver) {
      window.TGDriver.getMedia(it.msgId).then(function(buf){
          let ext = it.name.split('.').pop().toLowerCase();
          let mime = it.type || 'application/octet-stream';
          if(!mime || mime==='application/octet-stream') {
             if(['mp4','webm','mov','mkv'].includes(ext)) mime = 'video/'+ext;
             else if(['jpg','jpeg','png','gif','webp'].includes(ext)) mime = 'image/'+(ext==='jpg'?'jpeg':ext);
          }
          let blob = new Blob([buf], {type: mime});
          showMedia(blob, it.name, mime);
      }).catch(function(e){
          $('#vContent').innerHTML = '<div style="color:#ff3b30">Error loading file. Try downloading.</div>';
      });
  }
}

function showMedia(blob, name, type){
  let url = URL.createObjectURL(blob);
  let ext = name.split('.').pop().toLowerCase();
  let isVid = /video/.test(type) || /^(mp4|mov|mkv|webm|avi|3gp)$/.test(ext);
  let isImg = /image/.test(type) || /^(jpe?g|png|gif|webp|heic|heif|bmp)$/.test(ext);

  if(isImg){
      $('#vContent').innerHTML = '<img src="'+url+'">';
  } else if(isVid){
      $('#vContent').innerHTML = '<video src="'+url+'" controls autoplay playsinline></video>';
  } else {
      $('#vContent').innerHTML = '<div style="color:#fff;text-align:center;padding:20px;"><p>Preview not available</p><p style="font-size:12px;opacity:0.7">'+esc(name)+'</p></div>';
  }
  $('#vDownload').href = url;
  $('#vDownload').download = name;
  $('#vDownload').style.display = 'inline-block';
}

/* Delete */
function doDelete(fp){
  let it = S.items.find(x=>x.fp==fp);
  if(!it) return;
  if(confirm("Delete this file from Telegram and TeleSpace?")) {
     if(it.msgId && window.TGDriver) {
         window.TGDriver.deleteMessages([it.msgId]).catch(e=>console.log("Telegram delete err:", e));
     }
     S.items = S.items.filter(x=>x.fp!==fp);
     delDb(fp);
     paint();
  }
}

function doDeleteSelected(){
  if(!S.selected.size) return;
  if(confirm("Delete "+S.selected.size+" selected files?")){
     let ids = [];
     S.items.forEach(it=>{
        if(S.selected.has(it.fp)) {
           if(it.msgId) ids.push(it.msgId);
           delDb(it.fp);
        }
     });
     if(ids.length && window.TGDriver) window.TGDriver.deleteMessages(ids).catch(e=>console.log(e));
     S.items = S.items.filter(it=>!S.selected.has(it.fp));
     S.selected.clear();
     S.selectMode=false;
     paint();
  }
}

/* Text Confirmation Modals */
function showConfirm(actionType, title, desc, expectedText, btnText, btnColor) {
  S.sheet = true;
  $('#sh').innerHTML = '<div class="grab"></div><h2>'+title+'</h2><div class="s">'+desc+'</div>'+
  '<div class="s" style="margin-top:15px;font-weight:bold">Type <span style="color:var(--ac);font-family:monospace">'+expectedText+'</span> to confirm:</div>'+
  '<input id="cfText" type="text" style="margin-top:10px" autocomplete="off">'+
  '<div style="margin-top:20px;display:flex">'+
    '<button class="btn" id="cfBtn" style="flex:1;margin-right:8px;background:'+btnColor+'">'+btnText+'</button>'+
    '<button class="btn o" data-a="close">Cancel</button>'+
  '</div>';
  $('#ov').style.display='flex';
  
  $('#cfBtn').onclick = function() {
    let v = $('#cfText').value.trim().toLowerCase();
    if(v === expectedText.toLowerCase()) {
       if(actionType === 'safe') logoutAction('safe');
       if(actionType === 'factory') logoutAction('delete');
    } else {
       toast('Incorrect text, try again.');
    }
  };
}

/* Proxy */
function openProxy() {
  S.sheet = true;
  let p = {};
  try { p = JSON.parse(localStorage.getItem('tgproxy') || '{}'); } catch(e) {}
  $('#sh').innerHTML = '<div class="grab"></div><h2>Add Proxy</h2><div class="s">Enter your MTProto Proxy details.</div>'+
  '<label>Server</label><input id="px_ip" value="'+esc(p.ip||'')+'" placeholder="1.2.3.4">'+
  '<label>Port</label><input id="px_port" type="number" value="'+(p.port||'')+'" placeholder="443">'+
  '<label>Secret</label><input id="px_sec" value="'+esc(p.secret||'')+'" placeholder="ee...">'+
  '<div style="margin-top:20px;display:flex">'+
  '<button class="btn" id="px_save" style="flex:1;margin-right:8px">Save</button>'+
  '<button class="btn o" data-a="close">Cancel</button></div>';
  $('#ov').style.display='flex';
  
  $('#px_save').onclick = function() {
    let ip = $('#px_ip').value.trim();
    let port = $('#px_port').value.trim();
    let sec = $('#px_sec').value.trim();
    if(ip && port && sec) {
      localStorage.setItem('tgproxy', JSON.stringify({ip, port, secret: sec}));
      toast('Proxy saved. Reloading...');
      setTimeout(()=>location.reload(), 1000);
    } else { toast('Please fill all fields'); }
  };
}

/* Profile */
function openProfile(){
  S.sheet=true;
  $('#sh').innerHTML='<div class="grab"></div><div class="profile-hdr"><div class="av" id="pAv" style="width:80px;height:80px;font-size:30px;margin:0">ME</div><img id="pImg" style="display:none;width:80px;height:80px;border-radius:50%;object-fit:cover"><h3 id="pName">Loading...</h3><p id="pPhone"></p></div>'+
  '<div class="card" style="margin-top:20px">'+
    '<button class="action-btn" data-a="telegram_channel">'+ic('cloud')+' <span style="margin-left:12px">TeleSpace Channel</span></button>'+
    '<button class="action-btn" data-a="proxy">'+ic('search')+' <span style="margin-left:12px">Add Proxy</span></button>'+
    '<a class="action-btn" href="privacy.html" target="_blank">'+ic('doc')+' <span style="margin-left:12px">Privacy & Policy</span></a>'+
    '<button class="action-btn" data-a="report">'+ic('warn')+' <span style="margin-left:12px">Report a problem</span></button>'+
    '<button class="action-btn" data-a="autosync">'+ic('folder')+' <span style="margin-left:12px">Auto-Sync Folder</span></button>'+
  '</div>'+
  '<div class="card">'+
    '<button class="action-btn" data-a="safe_logout">'+ic('warn')+' <span style="margin-left:12px">Safe Logout</span></button>'+
    '<button class="action-btn danger" data-a="delete_account">'+ic('warn')+' <span style="margin-left:12px">Delete TeleSpace Account</span></button>'+
  '</div>'+
  '<button class="btn o" data-a="close" style="width:100%;margin-top:20px">Close</button>';
  $('#ov').style.display='flex';

  if(window.TGDriver && window.TGDriver.getMe){
     window.TGDriver.getMe().then(function(u){
        if(!u) return;
        $('#pName').textContent = (u.firstName || '') + ' ' + (u.lastName || '');
        $('#pPhone').textContent = u.phone ? '+' + u.phone : '';
        if(u.photo){
           window.TGDriver.getProfilePic(u.id, u.accessHash, u.photo).then(function(url){
               if(url){
                   S.profilePic = url; 
                   $('#pImg').src = url;
                   $('#pImg').style.display = 'block';
                   $('#pAv').style.display = 'none';
                   if(S.tab=='home') render(); 
               }
           }).catch(function(){});
        } else {
           $('#pAv').textContent = (u.firstName || 'M').charAt(0).toUpperCase();
        }
     }).catch(function(e){ $('#pName').textContent = 'Not connected'; });
  }
}

function logoutAction(type){
   if(type=='safe'){
      localStorage.removeItem('tgsess'); localStorage.removeItem('tgmode');
      S.mode=''; S.items=[]; S.profilePic='';
      toast('Logged out safely. Data remains in Telegram.');
      closeSheet(); render();
   } else if(type=='delete'){
      localStorage.clear(); indexedDB.deleteDatabase('telegrive-web'); location.reload();
   }
}

function openSettings(){
  S.sheet=true;
  var chVal = S.cfg.chat || '-100';
  $('#sh').innerHTML='<div class="grab"></div><h2>Login to TeleSpace</h2>'+
  '<div class="chips" style="margin-bottom: 20px;">'+
    '<button class="chip on" data-a="login_tab" data-k="bot">Bot Token</button>'+
    '<button class="chip" data-a="login_tab" data-k="phone">Phone Number</button>'+
  '</div>'+
  '<div id="loginFormBot">'+
    '<div class="s" style="margin-bottom:10px;">Create a bot with @BotFather, add it to your private channel as an admin, then enter the details.</div>'+
    '<label>Bot token</label>'+
    '<input id="tk" type="password" autocomplete="off" placeholder="123456:ABC..." value="'+esc(S.cfg.token)+'">'+
    '<label>Channel ID or @username</label>'+
    '<input id="ch" autocomplete="off" placeholder="-1001234567890" value="'+esc(chVal)+'">'+
    '<button class="btn" id="sv" style="width:100%; margin-top:16px">Save and test</button>'+
  '</div>'+
  '<div id="loginFormPhone" style="display:none;">'+
    '<div class="s" style="margin-bottom:15px;">Sign in securely using your phone number.</div>'+
    '<button class="btn" data-a="auth" data-k="phone" style="width:100%">Sign in with phone number</button>'+
  '</div>'+
  '<label>Glass strength</label>'+
  '<input id="gl" type="range" min="0" max="100" value="'+GL+'">'+
  '<button class="btn o" data-a="close" style="width:100%; margin-top:16px">Close</button>'+
  '<div class="s" id="msg" style="margin-top:12px"></div>';
  $('#ov').style.display='flex';
}
function closeSheet(){S.sheet=false;$('#ov').style.display='none';render()}
function saveCfg(){var t=$('#tk').value.replace(/\s/g,''),c=$('#ch').value.replace(/\s/g,''),m=$('#msg');
 if(!t||!c){m.textContent='Enter both the bot token and the channel.';return}
 m.textContent='Checking...';var x=new XMLHttpRequest();x.open('GET','https://api.telegram.org/bot'+encodeURIComponent(t)+'/getChat?chat_id='+encodeURIComponent(c));
 x.onload=function(){var r={};try{r=JSON.parse(x.responseText)}catch(e){}
  if(r.ok){S.cfg={token:t,chat:c};try{localStorage.setItem('tgcfg',JSON.stringify(S.cfg))}catch(e){}m.innerHTML='<span class="ok">Connected to '+esc(r.result.title||'your channel')+'.</span>';setTimeout(function(){closeSheet();run()},700)}
  else m.innerHTML='<span class="bd">'+esc(r.description||'Could not connect.')+' Check the token, and that the bot is an admin.</span>'};
 x.onerror=function(){m.innerHTML='<span class="bd">No connection to Telegram.</span>'};x.send()}

var AU={phone:['Your phone number','Use the full number with country code, like +966.','tel','+966 5xx xxx xxx','Continue'],code:['Enter the code','Telegram sent it to your other device or by SMS.','tel','Code','Verify'],password:['Two-step password','Enter the cloud password of your account.','password','Password','Sign in']};
function openAuth(step,msg){S.sheet=true;var T=AU[step];
 $('#sh').innerHTML='<div class="grab"></div><h2>'+T[0]+'</h2><div class="s">'+T[1]+'</div><input id="au" style="margin-top:16px" type="'+T[2]+'" inputmode="'+(step=='password'?'text':'tel')+'" autocomplete="'+(step=='code'?'one-time-code':'off')+'" placeholder="'+T[3]+'"><div class="s" id="msg" style="margin-top:12px">'+(msg||'')+'</div><div style="margin-top:16px;display:flex"><button class="btn" data-a="go" data-k="'+step+'" style="flex:1;margin-right:8px">'+T[4]+'</button><button class="btn o" data-a="close">Close</button></div>';
 $('#ov').style.display='flex';setTimeout(function(){var i=$('#au');if(i)i.focus()},350)}
function authGo(step){var m=$('#msg'),v=$('#au').value.replace(/^\s+|\s+$/g,'');if(!v){m.textContent='Fill in this field first.';return}
 if(!window.TGDriver){m.innerHTML='<span class="bd">Bridge not loaded.</span>';return}
 m.textContent='Please wait...';
 window.TGDriver[step](v).then(function(r){var n=r&&r.next;if(n=='ready'){S.mode='acct';try{localStorage.setItem('tgmode','acct')}catch(e){}closeSheet();toast('Signed in.');hist();run()}else openAuth(n=='pass'?'password':'code')},function(e){m.innerHTML='<span class="bd">'+esc((e&&e.message)||e||'Something went wrong.')+'</span>'})}

function hist(){
  var D=window.TGDriver;
  if(!D||!D.history)return;
  D.history().then(function(a){
    if(!a || !a.length) return; 
    var serverFps = new Set(a.map(function(x){return x.fp}));
    var changed=false;
    
    S.items.forEach(function(it){
       if(it.state=='done' && !serverFps.has(it.fp) && (Date.now() - it.mtime > 5000)){
           it.state='deleted';
           save(it);
           changed=true;
       }
    });

    var have={};
    S.items.forEach(function(i){have[i.fp]=1});
    a.forEach(function(x){
       if(have[x.fp]) {
           let it = S.items.find(i=>i.fp===x.fp);
           if(it && it.state=='deleted'){ it.state='done'; it.msgId = x.msgId; save(it); changed=true; }
           return;
       }
       var it={fp:x.fp,name:x.name,size:x.size||0,mtime:x.mtime||Date.now(),state:'done',p:1,msgId:x.msgId};
       S.items.push(it);save(it); changed=true;
    });
    
    if(changed) paint();
  },function(){})
}

document.addEventListener('click',function(e){
 var el=e.target; while(el&&el!==document&&!(el.getAttribute&&(el.getAttribute('data-a')||el.id=='sv'||el.id=='fab'||el.id=='closeV')))el=el.parentNode;if(!el||el===document)return;
 if(el.id=='sv')return saveCfg();if(el.id=='fab')return $('#pickA').click();if(el.id=='closeV'){$('#ovV').style.display='none';$('#vContent').innerHTML='';return}
 
 var a=el.getAttribute('data-a'),k=el.getAttribute('data-k');
 if(a=='tab'){S.tab=k;S.anim=1;if(k!='files'){S.q='';S.selectMode=false;S.selected.clear();}render();window.scrollTo(0,0)}
 else if(a=='settings')openSettings();else if(a=='close')closeSheet();
 else if(a=='pickM')$('#pickM').click();
 else if(a=='search'){S.tab='files';S.f='all';render();var q=$('#q');if(q)q.focus()}
 else if(a=='kind'){S.tab='files';S.f=k;render()}
 else if(a=='transfers'){S.tab='files';S.f='tr';render()}
 else if(a=='f'){S.f=k;render()}
 else if(a=='login_tab'){
    let isBot = (k=='bot');
    $('#loginFormBot').style.display = isBot ? 'block' : 'none';
    $('#loginFormPhone').style.display = isBot ? 'none' : 'block';
    let parent = el.parentNode;
    if(parent) { Array.from(parent.children).forEach(function(c){ c.classList.remove('on'); }); el.classList.add('on'); }
 }
 else if(a=='auth')openAuth(k);else if(a=='go')authGo(k);
 else if(a=='view'){ let fp = el.getAttribute('data-fp'); let it = S.items.find(x=>x.fp==fp); if(it) openViewer(it); }
 else if(a=='del'){ let fp = el.getAttribute('data-fp'); doDelete(fp); }
 else if(a=='select_mode'){ S.selectMode=true; S.selected.clear(); render(); }
 else if(a=='cancel_select'){ S.selectMode=false; S.selected.clear(); render(); }
 else if(a=='select_file'){
    let fp = el.getAttribute('data-fp');
    if(S.selected.has(fp)) S.selected.delete(fp);
    else S.selected.add(fp);
    render();
 }
 else if(a=='del_selected'){ doDeleteSelected(); }
 else if(a=='profile') openProfile();
 else if(a=='proxy') openProxy();
 else if(a=='safe_logout') { showConfirm('safe', 'Safe Logout', 'Your data will remain in Telegram.', 'Logout', 'Logout', 'var(--ac)'); }
 else if(a=='delete_account') {
    $('#sh').innerHTML = '<div class="grab"></div><h2>Delete TeleSpace Account</h2><div class="s">Choose an option:</div><div style="margin-top:20px;display:flex;flex-direction:column;gap:10px"><button class="btn" data-a="factory_delete" style="background:var(--bad)">Factory Delete Backup Data</button><button class="btn o" data-a="do_logout">Keep Safe Data</button><button class="btn o" data-a="close">Cancel</button></div>';
 }
 else if(a=='factory_delete') showConfirm('factory', 'Factory Delete', 'This will delete local cache permanently.', 'delete', 'Delete', 'var(--bad)');
 else if(a=='do_logout') showConfirm('safe', 'Keep Safe Data', 'This will log you out but keep your data in Telegram.', 'delete', 'Logout', 'var(--ac)');
 else if(a=='telegram_channel') { 
    if(!window.TGDriver || !window.TGDriver.getChannelLink) return toast('Not connected');
    toast('Opening channel...');
    window.TGDriver.getChannelLink().then(function(url){
        if(url) window.open(url, '_blank');
        else toast('Could not get link');
    }).catch(function(e){ toast('Error opening channel'); });
 }
 else if(a=='autosync') { $('#pickDir').click(); }
 else if(a=='retry'){S.items.forEach(function(it){if(it.state=='fail'&&!it.big){it.state='queued';save(it)}});run()}
});

document.addEventListener('input',function(e){if(e.target.id=='q'){S.q=e.target.value;$('#list').innerHTML=listHtml()}else if(e.target.id=='gl')glass(+e.target.value)});
$('#ov').addEventListener('click',function(e){if(e.target===this)closeSheet()});
['pickM','pickA','pickDir'].forEach(function(id){$('#'+id).addEventListener('change',function(){if(this.files&&this.files.length)add(Array.prototype.slice.call(this.files));this.value=''})});
document.addEventListener('visibilitychange',function(){if(!document.hidden)run()});
window.addEventListener('online',run);

openDb(function(){loadAll(function(){
 S.items = S.items.filter(function(it){
    if(it.state=='up'){it.state='queued'}
    if(it.state=='queued' && !it.blob) return false; 
    if(it.state=='fail' && !it.big && it.blob) it.state='queued';
    return true;
 });
 S.items.sort(function(a,b){return b.mtime-a.mtime});render();if(S.mode=='acct')hist();if(ready())run();else if(!S.items.length)setTimeout(openSettings,400)})});
})();