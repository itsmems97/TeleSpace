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
        connectionRetries:5, useWSS:true, deviceModel:"Telegrive Web", systemVersion:"Web", appVersion:"1.0", langCode:"en", systemLangCode:"en", proxy: proxyConfig
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

window.TGDriver={
    phone:function(n){ return boot().then(c=>c.sendCode({apiId:C.apiId,apiHash:C.apiHash},n)).then(r=>{ phone=n; hash=r.phoneCodeHash; return {next:"code"}; }); },
    code:function(v){ return client.invoke(new L.Api.auth.SignIn({phoneNumber:phone,phoneCodeHash:hash,phoneCode:String(v).replace(/\D/g,"")})).then(ready,function(e){ if(e&&e.errorMessage==="SESSION_PASSWORD_NEEDED")return {next:"pass"}; throw e; }); },
    password:function(v){ return client.signInWithPassword({apiId:C.apiId,apiHash:C.apiHash},{ password:()=>Promise.resolve(v), onError:e=>{throw e} }).then(ready); },
    
    upload:function(blob,name,cb){
        return findOrMake().then(()=>readBlob(blob)).then(function(buf){
            if (!buf || buf.length === 0) throw new Error("File buffer is empty");
            var fileInfo = {name: name, size: blob.size, lastModified: Date.now()};
            return client.sendFile(chat,{
                file:new L.CustomFile(name,blob.size,"",buf), forceDocument:true,
                caption:name+"\n#fp:"+fp(fileInfo), progressCallback:function(p){cb(p)}
            });
        }).then(m=>m.id);
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
            var out=[],i,t;
            for(i=0;i<ms.length;i++){
                t=(ms[i].message||"").split("#fp:");
                if(t.length>1){
                    out.push({
                        fp:t[1].replace(/\s+$/,""), name:ms[i].file&&ms[i].file.name||"file",
                        size:ms[i].file&&ms[i].file.size||0, mtime:(ms[i].date||0)*1000, msgId: ms[i].id
                    });
                }
            }
            return out;
        });
    }
};

if(ls("tgsess"))boot().catch(e=>console.log("Reconnect failed",e));
})();