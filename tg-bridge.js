/* Phone login and uploads through GramJS. */
(function(){
var L=window.TGLib,C=window.TG_CONFIG||{};

if(!L||!C.apiId||!C.apiHash){
    console.error("TGLib or API Config missing");
    return;
}

var client=null,phone="",hash="",chat=null,CH="Telegrive Backup",TAG="telegrive-storage";

function ls(k,v){try{if(v===undefined)return localStorage.getItem(k)||"";localStorage.setItem(k,v)}catch(e){return ""}}

function boot(){
    if(client)return Promise.resolve(client);
    client=new L.TelegramClient(new L.StringSession(ls("tgsess")),C.apiId,C.apiHash,{connectionRetries:5,useWSS:true,deviceModel:"Telegrive Web",systemVersion:"Web",appVersion:"1.0",langCode:"en",systemLangCode:"en"});
    return client.connect().then(function(){return client})
}

function findOrMake(){
    if(chat)return Promise.resolve(chat);
    return client.getDialogs({limit:300}).then(function(ds){
        var i;
        for(i=0;i<ds.length;i++){
            if(ds[i].isChannel && ds[i].title===CH && ds[i].entity && ds[i].entity.creator){
                chat=ds[i].entity;
                return chat;
            }
        }
        return client.invoke(new L.Api.channels.CreateChannel({broadcast:true,title:CH,about:TAG})).then(function(r){
            chat=r.chats[0];
            return chat;
        });
    });
}

function ready(){
    ls("tgsess",client.session.save());
    return findOrMake().then(function(){
        return {next:"ready"};
    });
}

function fp(f){
    return f.name+"|"+f.size+"|"+f.lastModified;
}

// Helper to convert Blob to Buffer safely without failing
function readBlob(blob) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() { resolve(L.Buffer.from(reader.result)); };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}

window.TGDriver={
    phone:function(n){
        return boot().then(function(c){
            return c.sendCode({apiId:C.apiId,apiHash:C.apiHash},n);
        }).then(function(r){
            phone=n;
            hash=r.phoneCodeHash;
            return {next:"code"};
        });
    },
    code:function(v){
        return client.invoke(new L.Api.auth.SignIn({phoneNumber:phone,phoneCodeHash:hash,phoneCode:String(v).replace(/\D/g,"")})).then(ready,function(e){
            if(e&&e.errorMessage==="SESSION_PASSWORD_NEEDED")return {next:"pass"};
            throw e;
        });
    },
    password:function(v){
        return client.signInWithPassword({apiId:C.apiId,apiHash:C.apiHash},{
            password:function(){return Promise.resolve(v)},
            onError:function(e){throw e}
        }).then(ready);
    },
    upload:function(blob,name,cb){
        return findOrMake().then(function(){ return readBlob(blob); }).then(function(buf){
            if (!buf || buf.length === 0) throw new Error("File buffer is empty");
            var fileInfo = {name: name, size: blob.size, lastModified: Date.now()};
            return client.sendFile(chat,{
                file:new L.CustomFile(name,blob.size,"",buf),
                forceDocument:true,
                caption:name+"\n#fp:"+fp(fileInfo),
                progressCallback:function(p){cb(p)}
            });
        }).then(function(m){return m.id});
    },
    deleteMessages:function(ids){
        return boot().then(findOrMake).then(function(){
            return client.deleteMessages(chat, ids, {revoke: true});
        });
    },
    getMedia:function(msgId){
        return boot().then(findOrMake).then(function(){
            return client.getMessages(chat, {ids: [msgId]});
        }).then(function(ms){
            if(!ms || !ms.length || !ms[0].media) throw new Error("No media found");
            return client.downloadMedia(ms[0].media, {});
        });
    },
    getMe:function(){
        return boot().then(function(){
            return client.getMe();
        });
    },
    getProfilePic:function(userId, accessHash, photo){
        if(!photo) return Promise.resolve(null);
        return boot().then(function(){
            return client.downloadProfilePhoto(new L.Api.InputPeerUser({userId: userId, accessHash: accessHash}), {isBig: false});
        }).then(function(buf){
            if(!buf || !buf.length) return null;
            return URL.createObjectURL(new Blob([buf]));
        });
    },
    history:function(){
        return boot().then(findOrMake).then(function(){
            return client.getMessages(chat,{limit:3000});
        }).then(function(ms){
            var out=[],i,t;
            for(i=0;i<ms.length;i++){
                t=(ms[i].message||"").split("#fp:");
                if(t.length>1){
                    out.push({
                        fp:t[1].replace(/\s+$/,""),
                        name:ms[i].file&&ms[i].file.name||"file",
                        size:ms[i].file&&ms[i].file.size||0,
                        mtime:(ms[i].date||0)*1000,
                        msgId: ms[i].id
                    });
                }
            }
            return out;
        });
    }
};

if(ls("tgsess"))boot().catch(function(e){console.log("Reconnect failed",e)});

})();