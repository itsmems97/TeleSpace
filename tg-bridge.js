/* Phone login and uploads through GramJS. */
(function(){
var L=window.TGLib,C=window.TG_CONFIG||{};

if(!L||!C.apiId||!C.apiHash){
    console.error("TGLib or API Config missing");
    return;
}

var client=null,phone="",hash="",chat=null;

var CH = "TeleSpace";
var TAG = "✅ If We Talk About Privacy And Security,\n" +
          "✅ I Can Only Say That Your Own Data,\n" +
          "⤷ Which Is In Your Left Hand,\n" +
          "⤷ You Have Put It In Your Right Hand.\n" +
          "⤷ That's The Level Of Privacy 😎.\n" +
          "🔐 If You Need Proof About Privacy\n" +
          "⤷ View Sources Code\n" +
          "⤷ @Owner_Pikazoo";
var CH_PIC_URL = "https://raw.githubusercontent.com/itsmems97/TeleSpace/refs/heads/main/icons/Ch-icon-512.png";

function ls(k,v){try{if(v===undefined)return localStorage.getItem(k)||"";localStorage.setItem(k,v)}catch(e){return ""}}

function boot(){
    if(client)return Promise.resolve(client);
    var proxyConfig = undefined;
    try {
        var p = JSON.parse(localStorage.getItem('tgproxy') || '{}');
        if (p.ip && p.port && p.secret) {
            proxyConfig = { ip: p.ip, port: parseInt(p.port), MTProxy: true, secret: p.secret };
        }
    } catch(e) {}

    client=new L.TelegramClient(new L.StringSession(ls("tgsess")),C.apiId,C.apiHash,{
        connectionRetries:5, useWSS:true, deviceModel:"iSpace Web", systemVersion:"Web", appVersion:"1.0", langCode:"en", systemLangCode:"en", proxy: proxyConfig
    });
    return client.connect().then(function(){return client})
}

function setChannelPhoto(ch) {
    return fetch(CH_PIC_URL).then(r=>r.arrayBuffer()).then(buf=>{
        var file = new L.CustomFile("Ch-icon.png", buf.byteLength, "", L.Buffer.from(buf));
        return client.uploadFile({ file: file, workers: 1 });
    }).then(inputFile=>{
        return client.invoke(new L.Api.channels.EditPhoto({
            channel: ch, photo: new L.Api.InputChatUploadedPhoto({ file: inputFile })
        }));
    }).catch(e=>console.log("Photo set skipped:", e));
}

function findOrMake(){
    if(chat)return Promise.resolve(chat);
    // Increased limit to 1000 to ensure we find the channel even if user has many chats
    return client.getDialogs({limit:1000}).then(function(ds){
        var i;
        for(i=0;i<ds.length;i++){
            if(ds[i].isChannel && ds[i].title===CH && ds[i].entity && ds[i].entity.creator){
                chat=ds[i].entity;
                if (!chat.photo || !chat.photo.photoId) return setChannelPhoto(chat).then(function(){ return chat; });
                return chat;
            }
        }
        return client.invoke(new L.Api.channels.CreateChannel({broadcast:true,title:CH,about:TAG})).then(function(r){
            chat=r.chats[0];
            return setChannelPhoto(chat).then(function(){ return chat; });
        });
    });
}

function ready(){
    ls("tgsess",client.session.save());
    return findOrMake().then(function(){ return {next:"ready"}; });
}

function fp(f){ return f.name+"|"+f.size+"|"+f.lastModified; }

function readBlob(blob) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() { resolve(L.Buffer.from(reader.result)); };
        reader.onerror = reject; reader.readAsArrayBuffer(blob);
    });
}

var BIGLIMIT=10*1024*1024, PART=512*1024, BATCH=4;

function big(n){
    if(L.bigInt)return L.bigInt(String(n));
    var id=chat.id;
    if(typeof id==="bigint")return BigInt(n);
    return id.minus(id).plus(Number(n)); /* uses the channel id object to build a 64-bit integer */
}
function waitOnline(o){
    return new Promise(function(res,rej){
        (function chk(){
            var s=o.stop&&o.stop(); if(s)return rej({stop:s});
            if(navigator.onLine)return res();
            setTimeout(chk,700);
        })();
    });
}
function reconnect(){
    var up=true; try{up=client._sender.isConnected()}catch(e){}
    return up?Promise.resolve():client.connect().catch(function(){});
}
function errMsg(e){return String((e&&(e.errorMessage||e.message))||e||"")}
function msgIdFrom(r){
    var ups=(r&&r.updates)||[r],i,u,fb=null;
    for(i=0;i<ups.length;i++){
        u=ups[i]; if(!u)continue;
        if(u.message&&u.message.id)return u.message.id;
        if(u.className==="UpdateShortSentMessage"&&u.id)return u.id;
        if(u.className==="UpdateMessageID")fb=u.id;
    }
    if(fb)return fb;
    throw new Error("Upload finished but message id was not returned");
}

function bigUpload(blob,name,caption,cb,o){
    var total=Math.ceil(blob.size/PART), st=o.state;
    if(!st||!st.fileId||st.total!==total||st.next==null||st.next>total)st={fileId:String(Math.floor(Math.random()*9e15)+1),total:total,next:0};
    var id=big(st.fileId), rnd=String(Math.floor(Math.random()*9e15)+1), fails=0, A=L.Api;

    function recover(e){
        if(e&&e.stop)return Promise.reject(e);
        var m=errMsg(e);
        if(/AUTH_KEY|SESSION_REVOKED|USER_DEACTIVATED|FILE_PART_\d*_?MISSING|FILE_PARTS_INVALID|FILE_ID_INVALID/.test(m))return Promise.reject(e);
        if(e&&e.seconds&&e.seconds<120){return new Promise(function(r){setTimeout(r,e.seconds*1000+500)});}
        if(navigator.onLine&&++fails>6)return Promise.reject(e);
        return waitOnline(o).then(function(){return new Promise(function(r){setTimeout(r,navigator.onLine&&fails?1500*fails:800)})}).then(reconnect);
    }
    function sendPart(i){
        return blob.slice(i*PART,Math.min(blob.size,(i+1)*PART)).arrayBuffer().then(function(ab){
            return client.invoke(new A.upload.SaveBigFilePart({fileId:id,filePart:i,fileTotalParts:total,bytes:L.Buffer.from(ab)}));
        }).then(function(ok){if(!ok)throw new Error("Part rejected")});
    }
    function step(){
        var s=o.stop&&o.stop(); if(s)return Promise.reject({stop:s});
        if(st.next>=total)return Promise.resolve();
        var from=st.next,to=Math.min(total,from+BATCH),ps=[],i;
        for(i=from;i<to;i++)ps.push(sendPart(i));
        return Promise.all(ps).then(function(){
            fails=0; st.next=to; cb(to/total); if(o.checkpoint)o.checkpoint(st);
            return step();
        },function(e){return recover(e).then(step)});
    }
    function finish(){
        var s=o.stop&&o.stop(); if(s)return Promise.reject({stop:s});
        return client.invoke(new A.messages.SendMedia({
            peer:chat, message:caption, silent:true, randomId:big(rnd),
            media:new A.InputMediaUploadedDocument({
                file:new A.InputFileBig({id:id,parts:total,name:name}),
                mimeType:o.mime||"application/octet-stream",
                attributes:[new A.DocumentAttributeFilename({fileName:name})], forceFile:true})
        })).then(msgIdFrom,function(e){return recover(e).then(finish)});
    }
    return step().then(finish).catch(function(e){
        /* Telegram dropped the saved parts (they expire): start this file again from part 0 once */
        if(!o.retried&&/FILE_PART_\d*_?MISSING|FILE_PARTS_INVALID|FILE_ID_INVALID/.test(errMsg(e))){
            o.retried=true; o.state=null; if(o.checkpoint)o.checkpoint({fileId:"",total:total,next:0});
            return bigUpload(blob,name,caption,cb,o);
        }
        throw e;
    });
}

window.TGDriver={
    phone:function(n){ return boot().then(c=>c.sendCode({apiId:C.apiId,apiHash:C.apiHash},n)).then(r=>{ phone=n; hash=r.phoneCodeHash; return {next:"code"}; }); },
    code:function(v){ return client.invoke(new L.Api.auth.SignIn({phoneNumber:phone,phoneCodeHash:hash,phoneCode:String(v).replace(/\D/g,"")})).then(ready,function(e){ if(e&&e.errorMessage==="SESSION_PASSWORD_NEEDED")return {next:"pass"}; throw e; }); },
    password:function(v){ return client.signInWithPassword({apiId:C.apiId,apiHash:C.apiHash},{ password:()=>Promise.resolve(v), onError:e=>{throw e} }).then(ready); },
    
    /* Files up to 10 MB: normal upload. Bigger files (up to 1.9 GB): sent in 512 KB parts, so an
       interrupted upload continues from the last saved part instead of starting over.
       o = {fp, folder, mime, state:{fileId,total,next}, stop():'pause'|'cancel'|null, checkpoint(state)} */
    upload:function(blob,name,cb,o){
        o=o||{};
        var caption=name+"\n#fp:"+(o.fp||"")+(o.folder?"\n#fd:"+o.folder:"");
        return boot().then(findOrMake).then(function(){
            if(blob.size<=BIGLIMIT){
                return readBlob(blob).then(function(buf){
                    if(!buf||buf.length===0)throw new Error("File buffer is empty");
                    return client.sendFile(chat,{file:new L.CustomFile(name,blob.size,"",buf),forceDocument:true,caption:caption,progressCallback:function(p){cb(p)}});
                }).then(function(m){return m.id});
            }
            return bigUpload(blob,name,caption,cb,o);
        });
    },

    deleteMessages:function(ids){
        return boot().then(findOrMake).then(()=>client.deleteMessages(chat, ids, {revoke: true}));
    },
    
    deleteChannel: function() {
        return boot().then(findOrMake).then(function() {
            if (chat) return client.invoke(new L.Api.channels.DeleteChannel({channel: chat}));
        }).catch(e => console.log("Channel deletion failed", e));
    },

    getMedia:function(msgId){
        return boot().then(findOrMake).then(()=>client.getMessages(chat, {ids: [msgId]})).then(ms=>{
            if(!ms || !ms.length || !ms[0].media) throw new Error("No media found");
            return client.downloadMedia(ms[0].media, {});
        });
    },
    getMe:function(){ return boot().then(()=>client.getMe()); },
    getProfilePic:function(userId, accessHash, photo){
        if(!photo) return Promise.resolve(null);
        return boot().then(()=>client.downloadProfilePhoto(new L.Api.InputPeerUser({userId: userId, accessHash: accessHash}), {isBig: false}))
        .then(buf=>{ if(!buf || !buf.length) return null; return URL.createObjectURL(new Blob([buf])); });
    },
    getChannelLink:function(){
        return boot().then(findOrMake).then(function(){
            return client.invoke(new L.Api.messages.ExportChatInvite({peer: chat})).then(res=>res.link).catch(e=>{
                if(chat.username) return "https://t.me/" + chat.username;
                if(chat.id) return "https://t.me/c/" + chat.id.toString().replace('-100', '');
                throw new Error("Could not get link");
            });
        });
    },
    history:function(){
        return boot().then(findOrMake).then(()=>client.getMessages(chat,{limit:3000})).then(function(ms){
            var out=[],i,t,raw,p;
            for(i=0;i<ms.length;i++){
                t=(ms[i].message||"").split("#fp:");
                if(t.length>1){
                    raw=t[1].split("\n#fd:");
                    out.push({
                        fp:raw[0].replace(/\s+$/,""), folder:raw[1]?raw[1].replace(/\s+$/,""):"", name:ms[i].file&&ms[i].file.name||"file",
                        size:ms[i].file&&ms[i].file.size||0, mtime:(ms[i].date||0)*1000, msgId: ms[i].id
                    });
                }
            }
            out.truncated=ms.length>=3000; /* if true, older messages were not read */
            return out;
        });
    }
};

if(ls("tgsess"))boot().catch(e=>console.log("Reconnect failed",e));
})();