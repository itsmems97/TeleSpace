/* Offline shell. Change V each time you update files so phones fetch the new ones. */
var V="ispace-v21",SHELL=["./","index.html","styles.css","app.js","config.js","tg-bridge.js","dist/tg-lib.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png"];
self.addEventListener("install",function(e){e.waitUntil(caches.open(V).then(function(c){return Promise.all(SHELL.map(function(u){return c.add(u).catch(function(){})}))}).then(function(){return self.skipWaiting()}))});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(n){return n!==V}).map(function(n){return caches.delete(n)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener("fetch",function(e){
 var r=e.request,u=new URL(r.url);
 if(u.pathname.indexOf('/ispace-stream/')===0){
  var msgId=u.pathname.split('/').pop();
  e.respondWith(handleStream(r,msgId));
  return;
 }
 if(r.method!=="GET"||u.origin!==location.origin)return;
 e.respondWith(fetch(r).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp)})}return res}).catch(function(){return caches.match(r)}))
});

async function handleStream(request,msgId){
 var u = new URL(request.url);
 var mime = u.searchParams.get('mime') || 'video/mp4';
 var rangeHeader=request.headers.get('range');
 var match=/bytes=(\d+)-(\d*)/.exec(rangeHeader||'');
 var start=match?parseInt(match[1]):0;
 var end=(match&&match[2])?parseInt(match[2]):start+512*1024-1;
 var limit=end-start+1;
 var channel=new MessageChannel();
 var buf=await new Promise(function(resolve){
  channel.port1.onmessage=function(e){resolve(e.data)};
  self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(clients){
   if(clients.length===0)return resolve(new ArrayBuffer(0));
   clients[0].postMessage({type:'FETCH_CHUNK',msgId:msgId,offset:start,limit:limit},[channel.port2]);
  });
 });
 var headers=new Headers();
 headers.set('Content-Type', mime);
 headers.set('Content-Range','bytes '+start+'-'+(start+buf.byteLength-1)+'/*');
 headers.set('Accept-Ranges','bytes');
 headers.set('Content-Length',buf.byteLength);
 return new Response(buf,{status:206,headers:headers});
}
