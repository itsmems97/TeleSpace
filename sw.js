/* Offline shell. Change V each time you update files so phones fetch the new ones. */
var V="ispace-v30",SHELL=["./","index.html","land.html","styles.css","app.js","config.js","tg-bridge.js","pwa.js","dist/tg-lib.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-192.png","icons/icon-maskable-512.png"];
self.addEventListener("install",function(e){e.waitUntil(caches.open(V).then(function(c){return Promise.all(SHELL.map(function(u){return c.add(u).catch(function(){})}))}).then(function(){return self.skipWaiting()}))});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(n){return n!==V}).map(function(n){return caches.delete(n)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener("fetch",function(e){
 var r=e.request,u=new URL(r.url);
 if(u.pathname.indexOf('/ispace-stream/')>-1){
  var msgId=u.pathname.split('/').pop();
  e.respondWith(handleStream(r,msgId,e.clientId));
  return;
 }
 if(r.method!=="GET"||u.origin!==location.origin)return;
 e.respondWith(fetch(r).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp)})}return res}).catch(function(){return caches.match(r)}))
});

var CH=524288,CACHE=[];
function getChunkFromPage(clientId,msgId,offset){
 return new Promise(function(resolve){
  var done=false,fin=function(v){if(!done){done=true;resolve(v)}};
  setTimeout(function(){fin(null)},45000);
  var pick=clientId?self.clients.get(clientId):Promise.resolve(null);
  pick.then(function(c){
   if(c)return c;
   return self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(l){
    for(var i=0;i<l.length;i++){if(l[i].visibilityState==='visible')return l[i]}return l[0]||null})
  }).then(function(c){
   if(!c)return fin(null);
   var ch=new MessageChannel();
   ch.port1.onmessage=function(ev){fin(ev.data)};
   c.postMessage({type:'FETCH_CHUNK',msgId:msgId,offset:offset,limit:CH},[ch.port2]);
  }).catch(function(){fin(null)});
 });
}
async function handleStream(request,msgId,clientId){
 var u=new URL(request.url);
 var mime=u.searchParams.get('mime')||'video/mp4';
 var size=parseInt(u.searchParams.get('size')||'0',10)||0;
 var rh=request.headers.get('range');
 var m=/bytes=(\d*)-(\d*)/.exec(rh||'');
 var start=m&&m[1]!==''?parseInt(m[1],10):0;
 if(size&&start>=size)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
 var aligned=Math.floor(start/CH)*CH,key=msgId+':'+aligned,buf=null,i;
 for(i=0;i<CACHE.length;i++){if(CACHE[i].k===key){buf=CACHE[i].b;break}}
 if(!buf){
  buf=await getChunkFromPage(clientId,msgId,aligned);
  if(!buf||!buf.byteLength)return new Response('Stream unavailable',{status:503});
  CACHE.push({k:key,b:buf});if(CACHE.length>6)CACHE.shift();
 }
 var from=start-aligned;
 if(from>=buf.byteLength)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+(size||'*')}});
 var part=buf.slice(from);
 var endReq=m&&m[2]!==''?parseInt(m[2],10):null;
 if(endReq!==null&&endReq-start+1<part.byteLength)part=part.slice(0,endReq-start+1);
 var last=start+part.byteLength-1;
 var h=new Headers();
 h.set('Content-Type',mime);
 h.set('Accept-Ranges','bytes');
 h.set('Content-Range','bytes '+start+'-'+last+'/'+(size||'*'));
 h.set('Content-Length',String(part.byteLength));
 h.set('Cache-Control','no-store');
 return new Response(part,{status:206,headers:h});
}
