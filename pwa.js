/* iSpace PWA helper
   1) Install popup (Android | iPhone) with animated how-to steps
   2) Realistic "Installing..." animation (Android, tied to the real install event)
   3) Background keep-alive while files upload (wake lock + silent audio session)
   Never shown again once the app is installed / opened as an app. */
(function () {
  'use strict';
  var D = document, W = window, UA = navigator.userAgent || '';
  var IOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var ANDROID = /Android/i.test(UA);
  var IOS_SAFARI = IOS && /Safari/i.test(UA) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line\//i.test(UA);

  function ls(k, v) {
    try {
      if (v === undefined) return W.localStorage.getItem(k);
      if (v === null) W.localStorage.removeItem(k); else W.localStorage.setItem(k, String(v));
    } catch (e) {}
    return null;
  }
  function standalone() {
    try {
      return W.matchMedia('(display-mode: standalone)').matches || W.matchMedia('(display-mode: fullscreen)').matches ||
        W.matchMedia('(display-mode: minimal-ui)').matches || W.navigator.standalone === true;
    } catch (e) { return false; }
  }
  function isInstalled() { return standalone() || ls('ispace_installed') === '1'; }

  /* ---------- "do not nag" memory ---------- */
  function snoozed() { return Date.now() < (+ls('ispace_pwa_snooze') || 0); }
  function dismissNow() {
    var n = (+ls('ispace_pwa_n') || 0) + 1;
    ls('ispace_pwa_n', n);
    ls('ispace_pwa_snooze', Date.now() + (n <= 1 ? 2 : n === 2 ? 7 : 30) * 864e5);
  }
  function never() { ls('ispace_pwa_snooze', Date.now() + 365 * 864e5); }

  var deferred = null;
  function eligible() { return !isInstalled() && !snoozed() && (IOS || ANDROID || !!deferred); }

  if (standalone()) ls('ispace_installed', '1');

  W.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    ls('ispace_installed', null); /* Chrome only fires this when the app is NOT installed */
    refresh();
  });
  W.addEventListener('appinstalled', function () {
    ls('ispace_installed', '1');
    deferred = null;
    if (ins.on) finishInstall(); else closeSheet(true);
  });
  try {
    if (navigator.getInstalledRelatedApps) {
      navigator.getInstalledRelatedApps().then(function (a) { if (a && a.length) ls('ispace_installed', '1'); }).catch(function () {});
    }
  } catch (e) {}
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}

  /* ---------- icons (inline SVG, work offline) ---------- */
  var SV = {
    share: '<svg viewBox="0 0 24 24"><path d="M12 15V3M12 3 8 7M12 3l4 4"/><path d="M8 10H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/></svg>',
    dots: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/></svg>',
    vdots: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.7" fill="currentColor" stroke="none"/></svg>',
    install: '<svg viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M12 8v6M9 11.5l3 3 3-3"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };

  /* ---------- styles ---------- */
  var CSS = [
    '.pw-ov,.pw-in,.pw-tt{--e:cubic-bezier(.16,1,.3,1);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff;-webkit-tap-highlight-color:transparent}',
    '.pw-ov *,.pw-in *{box-sizing:border-box}',
    '.pw-ov{position:fixed;left:0;top:0;right:0;bottom:0;z-index:30;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .35s ease}',
    '.pw-ov.on{display:flex}.pw-ov.show{opacity:1}',
    '.pw-sh{position:relative;width:100%;max-width:520px;max-height:93vh;overflow-y:auto;overflow-x:hidden;background:linear-gradient(180deg,#27272b,#19191c);border-radius:28px 28px 0 0;padding:10px 18px calc(18px + env(safe-area-inset-bottom,0px));transform:translateY(100%);transition:transform .6s var(--e);box-shadow:0 -20px 60px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.08);border-bottom:0}',
    '.pw-ov.show .pw-sh{transform:none}',
    '.pw-grab{width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.25);margin:4px auto 14px}',
    '.pw-x{position:absolute;right:14px;top:16px;width:32px;height:32px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#fff;display:flex;align-items:center;justify-content:center;padding:0}',
    '.pw-x svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2.4;stroke-linecap:round}',
    '.pw-hd{display:flex;align-items:center;gap:14px;margin:0 36px 14px 0}',
    '.pw-ic{width:66px;height:66px;border-radius:16px;background:#fff;object-fit:cover;flex:none;box-shadow:0 10px 26px rgba(10,132,255,.35),0 0 0 1px rgba(255,255,255,.1);animation:pwFloat 3.2s ease-in-out infinite}',
    '@keyframes pwFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}',
    '.pw-hd h2{margin:0;font-size:22px;font-weight:700;letter-spacing:-.3px}',
    '.pw-hd p{margin:3px 0 0;font-size:13.5px;color:#9DA3B4;line-height:1.35}',
    '.pw-seg{position:relative;display:flex;background:rgba(120,120,128,.24);border-radius:14px;padding:3px;margin-bottom:14px}',
    '.pw-seg button{flex:1;position:relative;z-index:1;border:0;background:transparent;color:#c3c7d2;font-weight:600;font-size:15px;font-family:inherit;padding:11px 0;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:8px;transition:color .3s}',
    '.pw-seg button.on{color:#fff}.pw-seg button i{font-size:17px}',
    '.pw-seg .th{position:absolute;top:3px;bottom:3px;left:3px;width:calc(50% - 3px);background:#0A84FF;border-radius:11px;transition:transform .45s cubic-bezier(.34,1.4,.5,1);box-shadow:0 4px 14px rgba(10,132,255,.5)}',
    '.pw-seg.ios .th{transform:translateX(100%)}',
    '.pw-pn{display:none}.pw-pn.on{display:block;animation:pwIn .5s var(--e)}',
    '@keyframes pwIn{from{opacity:0;transform:translateY(14px)}}',
    '.pw-btn{width:100%;border:0;border-radius:16px;padding:16px;font-size:17px;font-weight:700;font-family:inherit;color:#fff;background:linear-gradient(120deg,#0A84FF,#8B5CF6);position:relative;overflow:hidden;box-shadow:0 12px 30px -8px rgba(10,132,255,.7),inset 0 1px 0 rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;gap:10px;transition:transform .2s}',
    '.pw-btn:active{transform:scale(.97)}.pw-btn svg{width:22px;height:22px;stroke:#fff;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}',
    '.pw-btn:after{content:"";position:absolute;top:0;left:-80%;width:50%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.4),transparent);transform:skewX(-20deg);animation:pwSweep 3.4s ease-in-out infinite}',
    '@keyframes pwSweep{0%,55%{left:-80%}100%{left:140%}}',
    '.pw-note{font-size:12.5px;color:#9DA3B4;text-align:center;margin:10px 4px 2px;line-height:1.4}',
    '.pw-link{display:block;width:100%;background:none;border:0;color:#7fb8ff;font-size:14px;font-weight:600;font-family:inherit;padding:11px 8px}',
    '.pw-link.dim{color:#8a8f9f;font-weight:500;font-size:13px}',
    '.pw-warn{display:flex;gap:10px;align-items:center;background:rgba(255,159,10,.14);border:1px solid rgba(255,159,10,.4);color:#ffd08a;border-radius:14px;padding:10px 12px;font-size:13px;line-height:1.35;margin-bottom:12px}',
    '.pw-warn button{flex:none;border:0;border-radius:10px;background:#ff9f0a;color:#000;font-weight:700;font-size:12.5px;padding:8px 10px;font-family:inherit}',
    '.pw-stage{position:relative;height:176px;border-radius:18px;overflow:hidden;margin:2px 0 12px;background:radial-gradient(120% 90% at 50% 0,#2b2d36,#0d0d10);border:1px solid rgba(255,255,255,.07)}',
    '.pw-stage:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(180deg,rgba(255,255,255,.05) 0 8px,transparent 8px 22px);opacity:.5;-webkit-mask-image:linear-gradient(#000,transparent 85%);mask-image:linear-gradient(#000,transparent 85%)}',
    '.il{position:absolute;left:0;top:0;right:0;bottom:0;display:flex;justify-content:center;opacity:0;transform:scale(.95);transition:opacity .5s,transform .5s;padding:12px;pointer-events:none}',
    '.il.on{opacity:1;transform:none}.il.bot{align-items:flex-end}.il.top{align-items:flex-start}.il.mid{align-items:center}',
    '.il-bar{width:100%;display:flex;align-items:center;gap:8px;background:#2c2c30;border-radius:24px;padding:7px 8px;position:relative;box-shadow:0 6px 20px rgba(0,0,0,.5)}',
    '.il-pill{flex:1;background:#3b3b40;border-radius:17px;padding:9px 12px;font-size:12px;color:#c7c7cc;text-align:center;white-space:nowrap;overflow:hidden}',
    '.il-btn{position:relative;width:36px;height:36px;border-radius:50%;background:#3b3b40;display:flex;align-items:center;justify-content:center;color:#fff;flex:none}',
    '.il-btn svg{width:19px;height:19px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.il .hl{background:#0A84FF!important;animation:pwPulse 1.4s ease-in-out infinite}',
    '.fing{position:absolute;font-size:24px;line-height:1;pointer-events:none;z-index:3}',
    '.fing.dn{left:50%;top:-34px;animation:pwTapD 1.1s ease-in-out infinite}.fing.up{left:50%;top:38px;animation:pwTapU 1.1s ease-in-out infinite}.fing.rt{left:-30px;top:50%;animation:pwTapR 1.1s ease-in-out infinite}',
    '@keyframes pwTapD{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,7px) scale(.92)}}',
    '@keyframes pwTapU{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-7px) scale(.92)}}',
    '@keyframes pwTapR{0%,100%{transform:translate(0,-50%)}50%{transform:translate(8px,-50%) scale(.92)}}',
    '.il-menu{position:relative;width:82%;background:#2c2c30;border-radius:16px;box-shadow:0 8px 26px rgba(0,0,0,.55);overflow:visible}',
    '.il-menu.right{margin-left:auto;width:68%}',
    '.il-row{position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 14px;font-size:13px;color:#a9abb4;border-bottom:1px solid rgba(255,255,255,.07)}',
    '.il-row:last-child{border-bottom:0}',
    '.il-row svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}',
    '.il-row.h2{background:rgba(10,132,255,.32);color:#fff;font-weight:700;animation:pwGlow 1.4s ease-in-out infinite}',
    '@keyframes pwGlow{0%,100%{background:rgba(10,132,255,.22)}50%{background:rgba(10,132,255,.5)}}',
    '.il-dlg{width:88%;background:#2c2c30;border-radius:18px;padding:12px 14px;box-shadow:0 8px 26px rgba(0,0,0,.55)}',
    '.il-dh{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;color:#a9abb4;margin-bottom:10px}',
    '.il-dh b{color:#fff;font-size:13px}.il-dh .go{position:relative;padding:5px 11px;border-radius:12px;color:#fff;font-weight:700}',
    '.il-app{display:flex;align-items:center;gap:10px;font-size:13px;margin-bottom:9px}.il-app img{width:38px;height:38px;border-radius:9px;background:#fff}',
    '.il-tg{display:flex;align-items:center;justify-content:space-between;font-size:13px;position:relative}',
    '.il-sw{width:42px;height:25px;border-radius:13px;background:#30D158;position:relative;flex:none}.il-sw:after{content:"";position:absolute;right:2px;top:2px;width:21px;height:21px;border-radius:50%;background:#fff}',
    '.il-bt{display:flex;gap:8px;margin-top:10px}.il-bt span{flex:1;text-align:center;padding:9px;border-radius:12px;background:#3b3b40;font-size:13px;font-weight:600;position:relative}',
    '.pw-steps{display:flex;flex-direction:column;gap:8px}',
    '.pw-st{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.07);transition:background .4s,border-color .4s,transform .4s}',
    '.pw-st.act{background:rgba(10,132,255,.16);border-color:rgba(10,132,255,.55);transform:scale(1.012)}',
    '.pw-n{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12.5px;flex:none;transition:background .3s}',
    '.pw-st.act .pw-n{background:#0A84FF}',
    '.pw-sic{width:44px;height:44px;border-radius:13px;background:#fff;display:flex;align-items:center;justify-content:center;flex:none;color:#0A84FF}',
    '.pw-sic svg{width:25px;height:25px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}',
    '.pw-st.act .pw-sic{animation:pwPulse 1.4s ease-in-out infinite}',
    '@keyframes pwPulse{0%,100%{box-shadow:0 0 0 0 rgba(10,132,255,.65)}50%{box-shadow:0 0 0 9px rgba(10,132,255,0)}}',
    '.pw-t b{display:block;font-size:14.5px;line-height:1.25}.pw-t span{font-size:12px;color:#9DA3B4;line-height:1.3}',
    /* installing overlay */
    '.pw-in{position:fixed;left:0;top:0;right:0;bottom:0;z-index:40;display:none;align-items:center;justify-content:center;opacity:0;transition:opacity .45s;overflow:hidden}',
    '.pw-in.on{display:flex}.pw-in.show{opacity:1}',
    '.pw-in-bg{position:absolute;left:0;top:0;right:0;bottom:0;background:radial-gradient(90% 60% at 50% 22%,rgba(10,132,255,.35),transparent 70%),radial-gradient(70% 50% at 80% 90%,rgba(139,92,246,.3),transparent 70%),#0b0b0d}',
    '.pw-in-c{position:relative;width:100%;max-width:420px;max-height:100%;overflow-y:auto;padding:28px 24px calc(28px + env(safe-area-inset-bottom,0px));text-align:center}',
    '.pw-rw{position:relative;width:150px;height:150px;margin:0 auto 18px}',
    '.pw-ring{position:absolute;left:0;top:0;width:150px;height:150px;transform:rotate(-90deg);overflow:visible}',
    '.pw-ring circle{fill:none;stroke-width:6;stroke-linecap:round}.pw-ring .r0{stroke:rgba(255,255,255,.12)}',
    '.pw-ring .r1{stroke:url(#pwG);stroke-dasharray:415;stroke-dashoffset:415;filter:drop-shadow(0 0 8px rgba(10,132,255,.8));transition:stroke .4s}',
    '.pw-in.done .pw-ring .r1{stroke:#30D158;filter:drop-shadow(0 0 10px rgba(48,209,88,.9))}',
    '.pw-ai{position:absolute;left:31px;top:31px;width:88px;height:88px;border-radius:22px;background:#fff;box-shadow:0 14px 40px rgba(0,0,0,.6);animation:pwBreath 2.2s ease-in-out infinite}',
    '@keyframes pwBreath{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}',
    '.pw-in.done .pw-ai{animation:pwPop .7s cubic-bezier(.34,1.56,.64,1)}',
    '@keyframes pwPop{0%{transform:scale(.8)}60%{transform:scale(1.14)}100%{transform:scale(1)}}',
    '.pw-ck{position:absolute;right:2px;bottom:2px;width:46px;height:46px;border-radius:50%;background:#30D158;border:3px solid #0b0b0d;display:flex;align-items:center;justify-content:center;transform:scale(0);transition:transform .55s cubic-bezier(.34,1.7,.64,1) .15s}',
    '.pw-ck svg{width:24px;height:24px;stroke:#fff;fill:none;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}',
    '.pw-in.done .pw-ck{transform:scale(1)}',
    '.pw-in h3{margin:0 0 6px;font-size:25px;font-weight:800;letter-spacing:-.4px}',
    '.pw-in p{margin:0;color:#aab0c0;font-size:14.5px;line-height:1.4}',
    '.pw-pct{margin:12px 0 12px;font-size:38px;line-height:1.25;padding:0 4px;font-weight:800;letter-spacing:-1px;font-variant-numeric:tabular-nums;background:linear-gradient(110deg,#fff,#9fd0ff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}',
    '.pw-in.done .pw-pct{display:none}',
    '.pw-ls{display:inline-flex;flex-direction:column;gap:9px;text-align:left;margin:0 auto 6px}',
    '.pw-ls div{display:flex;align-items:center;gap:10px;font-size:14px;color:#6f7686;transition:color .4s}',
    '.pw-ls i{width:20px;height:20px;border-radius:50%;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex:none;transition:all .4s}',
    '.pw-ls i svg{width:12px;height:12px;stroke:#fff;fill:none;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;opacity:0}',
    '.pw-ls .cur{color:#fff}.pw-ls .cur i{border-color:#0A84FF;border-top-color:transparent;animation:pwSpin .8s linear infinite}',
    '.pw-ls .ok{color:#d9ffe5}.pw-ls .ok i{background:#30D158;border-color:#30D158}.pw-ls .ok i svg{opacity:1}',
    '@keyframes pwSpin{to{transform:rotate(360deg)}}',
    '.pw-in.done .pw-ls{display:none}',
    '.pw-hm{display:none;margin:20px auto 20px;width:100%;max-width:290px;padding:16px 14px 12px;border-radius:26px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}',
    '.pw-in.done .pw-hm{display:block;animation:pwIn .6s var(--e)}',
    '.pw-hg{display:grid;grid-template-columns:repeat(4,1fr);gap:12px 10px}',
    '.gi{display:block;aspect-ratio:1;border-radius:14px;background:rgba(255,255,255,.14)}',
    '.gi.me{background:none;position:relative;display:flex;flex-direction:column;align-items:center;overflow:visible}',
    '.gi.me img{width:100%;aspect-ratio:1;border-radius:14px;background:#fff;box-shadow:0 0 0 2px rgba(48,209,88,.9),0 8px 22px rgba(10,132,255,.6);animation:pwDrop .9s cubic-bezier(.34,1.45,.64,1) .35s both}',
    '.gi.me em{font-style:normal;font-size:10.5px;margin-top:4px;color:#fff;font-weight:600;position:absolute;top:100%}',
    '@keyframes pwDrop{0%{transform:translateY(-190px) scale(2.6);opacity:0}55%{opacity:1}100%{transform:none;opacity:1}}',
    '.pw-hl{font-size:11.5px;color:#aab0c0;margin-top:30px}',
    '.pw-fin{display:none}.pw-in.done .pw-fin{display:block;animation:pwIn .6s var(--e) .5s both}',
    '.pw-cf{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;overflow:hidden}',
    '.pw-cf i{position:absolute;top:-14px;width:9px;height:14px;border-radius:2px;opacity:0;animation:pwFall 2.6s ease-in forwards}',
    '@keyframes pwFall{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(105vh) rotate(var(--r))}}',
    /* toast + bg sheet */
    '.pw-tt{position:fixed;left:50%;bottom:calc(30px + env(safe-area-inset-bottom,0px));transform:translate(-50%,30px);opacity:0;z-index:50;background:rgba(40,40,44,.96);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:12px 18px;font-size:14px;font-weight:600;box-shadow:0 12px 34px rgba(0,0,0,.6);transition:all .5s var(--e);max-width:88%;text-align:center;pointer-events:none}',
    '.pw-tt.show{opacity:1;transform:translate(-50%,0)}',
    '.pw-bg h2{margin:2px 0 6px;font-size:21px}.pw-bg>p{margin:0 0 14px;color:#9DA3B4;font-size:13.5px;line-height:1.4}',
    '.pw-row{display:flex;align-items:center;gap:14px;padding:13px 14px;border-radius:16px;background:rgba(255,255,255,.06);margin-bottom:9px}',
    '.pw-row div{flex:1}.pw-row b{display:block;font-size:15px}.pw-row span{display:block;font-size:12.5px;color:#9DA3B4;line-height:1.35;margin-top:2px}',
    '.pw-sw{width:52px;height:31px;border-radius:16px;background:rgba(120,120,128,.4);position:relative;flex:none;border:0;padding:0;transition:background .3s}',
    '.pw-sw:after{content:"";position:absolute;left:2px;top:2px;width:27px;height:27px;border-radius:50%;background:#fff;transition:transform .3s cubic-bezier(.34,1.4,.5,1);box-shadow:0 2px 6px rgba(0,0,0,.4)}',
    '.pw-sw.on{background:#30D158}.pw-sw.on:after{transform:translateX(21px)}'
  ].join('\n');

  /* ---------- steps data ---------- */
  var STEPS = {
    ios: [
      { ic: 'dots', t: 'Tap the \u22EF button', s: 'Bottom-right of Safari. (Older iPhone: tap Share directly)' },
      { ic: 'share', t: 'Tap Share', s: 'The square with an arrow pointing up' },
      { ic: 'plus', t: 'Tap \u201CAdd to Home Screen\u201D', s: 'Scroll down in the list if you cannot see it' },
      { ic: 'check', t: 'Keep \u201COpen as Web App\u201D ON, tap Add', s: 'iSpace appears on your Home screen' }
    ],
    android: [
      { ic: 'vdots', t: 'Tap \u22EE (3 dots)', s: 'Top-right corner of Chrome' },
      { ic: 'install', t: 'Tap \u201CInstall app\u201D', s: 'or \u201CAdd to Home screen\u201D' },
      { ic: 'down', t: 'Tap Install', s: 'iSpace goes to Home screen + App drawer' }
    ]
  };
  var IL = {
    ios: [
      '<div class="il bot"><div class="il-bar"><span class="il-btn">' + SV.back + '</span><span class="il-pill">\uD83D\uDD12 ispace</span><span class="il-btn hl">' + SV.dots + '<b class="fing dn">\uD83D\uDC47</b></span></div></div>',
      '<div class="il bot"><div class="il-menu right"><div class="il-row">Add Bookmark</div><div class="il-row">Find on Page</div><div class="il-row h2">Share ' + SV.share + '<b class="fing rt">\uD83D\uDC49</b></div><div class="il-row">Print</div></div></div>',
      '<div class="il bot"><div class="il-menu right"><div class="il-row">Add to Bookmarks ' + SV.plus + '</div><div class="il-row h2">Add to Home Screen ' + SV.plus + '<b class="fing rt">\uD83D\uDC49</b></div><div class="il-row">Find on Page</div></div></div>',
      '<div class="il mid"><div class="il-dlg"><div class="il-dh"><span>Cancel</span><b>Add to Home Screen</b><span class="go hl">Add<b class="fing up">\uD83D\uDC46</b></span></div><div class="il-app"><img src="icons/icon-192.png" alt=""><div><b>iSpace</b></div></div><div class="il-tg"><span>Open as Web App</span><span class="il-sw"></span></div></div></div>'
    ],
    android: [
      '<div class="il top"><div class="il-bar"><span class="il-btn">' + SV.back + '</span><span class="il-pill">\uD83D\uDD12 ispace</span><span class="il-btn hl">' + SV.vdots + '<b class="fing up">\uD83D\uDC46</b></span></div></div>',
      '<div class="il top"><div class="il-menu right"><div class="il-row">New tab</div><div class="il-row">Bookmarks</div><div class="il-row h2">Install app ' + SV.install + '<b class="fing rt">\uD83D\uDC49</b></div><div class="il-row">Share\u2026</div></div></div>',
      '<div class="il mid"><div class="il-dlg"><div class="il-app"><img src="icons/icon-192.png" alt=""><div><b>Install iSpace?</b></div></div><div class="il-bt"><span>Cancel</span><span class="hl">Install<b class="fing up">\uD83D\uDC46</b></span></div></div></div>'
    ]
  };

  /* ---------- DOM ---------- */
  var ov, tt, ins = { on: false, done: false, p: 0, raf: 0, last: 0, tmo: 0 };
  var ui = { tab: 'android', auto: false, step: { ios: 0, android: 0 }, timer: 0, built: false };

  function mk(html) { var d = D.createElement('div'); d.innerHTML = html; return d.firstElementChild; }

  function stepsHTML(kind) {
    return '<div class="pw-stage" data-k="' + kind + '">' + IL[kind].join('') + '</div><div class="pw-steps" data-k="' + kind + '">' +
      STEPS[kind].map(function (s, i) {
        return '<div class="pw-st" data-i="' + i + '"><span class="pw-n">' + (i + 1) + '</span><span class="pw-sic">' + SV[s.ic] + '</span><span class="pw-t"><b>' + s.t + '</b><span>' + s.s + '</span></span></div>';
      }).join('') + '</div>';
  }

  function build() {
    if (ui.built || !D.body) return;
    ui.built = true;
    var st = D.createElement('style'); st.id = 'pwCss'; st.textContent = CSS; D.head.appendChild(st);

    ov = mk('<div class="pw-ov" id="pwOv"><div class="pw-sh" role="dialog" aria-label="Install iSpace">' +
      '<div class="pw-grab"></div><button class="pw-x" id="pwX" aria-label="Close">' + SV.close + '</button>' +
      '<div class="pw-hd"><img class="pw-ic" src="icons/icon-192.png" alt=""><div><h2>Install iSpace</h2><p>Add it to your Home screen and App drawer. Opens full screen like a real app.</p></div></div>' +
      '<div class="pw-seg" id="pwSeg"><i class="th"></i><button data-t="android"><i class="fa-brands fa-android"></i>Android</button><button data-t="ios"><i class="fa-brands fa-apple"></i>iPhone</button></div>' +
      '<div class="pw-pn" id="pwPa">' +
        '<button class="pw-btn" id="pwGo">' + SV.down + 'Install iSpace</button>' +
        '<div class="pw-note" id="pwAn">One tap. Free. No Play Store needed.</div>' +
        '<button class="pw-link" id="pwMan">Show manual steps</button>' +
        '<div id="pwAm" style="display:none">' + stepsHTML('android') + '</div>' +
      '</div>' +
      '<div class="pw-pn" id="pwPi">' +
        '<div class="pw-warn" id="pwSaf" style="display:none"><span>Open this page in <b>Safari</b> to install.</span><button id="pwCp">Copy link</button></div>' +
        stepsHTML('ios') +
        '<div class="pw-note">Apple does not allow one-tap install. It takes just 4 quick taps.</div>' +
      '</div>' +
      '<button class="pw-link dim" id="pwNot">Not now</button>' +
      '<button class="pw-link dim" id="pwNev" style="margin-top:-6px">Already installed / Do not show again</button>' +
      '</div></div>');
    D.body.appendChild(ov);

    var inst = mk('<div class="pw-in" id="pwIn"><div class="pw-in-bg"></div><div class="pw-in-c">' +
      '<div class="pw-rw"><svg class="pw-ring" viewBox="0 0 150 150"><defs><linearGradient id="pwG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22D3EE"/><stop offset=".5" stop-color="#0A84FF"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>' +
      '<circle class="r0" cx="75" cy="75" r="66"/><circle class="r1" id="pwRing" cx="75" cy="75" r="66"/></svg>' +
      '<img class="pw-ai" src="icons/icon-192.png" alt=""><div class="pw-ck">' + SV.check + '</div></div>' +
      '<h3 id="pwInT">Installing iSpace\u2026</h3><p id="pwInS">Adding to your Home screen and App drawer</p>' +
      '<div class="pw-pct" id="pwPct">0%</div>' +
      '<div class="pw-ls" id="pwLs"><div><i>' + SV.check + '</i>Downloading app files</div><div><i>' + SV.check + '</i>Setting up offline mode</div><div><i>' + SV.check + '</i>Creating app icon</div><div><i>' + SV.check + '</i>Adding to Home screen &amp; App drawer</div></div>' +
      '<div class="pw-hm"><div class="pw-hg"><i class="gi"></i><i class="gi"></i><i class="gi"></i><i class="gi"></i><i class="gi"></i><span class="gi me"><img src="icons/icon-192.png" alt=""><em>iSpace</em></span><i class="gi"></i><i class="gi"></i></div><div class="pw-hl">Your Home screen</div></div>' +
      '<div class="pw-fin"><button class="pw-btn" id="pwOk">Done</button></div>' +
      '</div><div class="pw-cf" id="pwCf"></div></div>');
    D.body.appendChild(inst);
    tt = mk('<div class="pw-tt" id="pwTt"></div>'); D.body.appendChild(tt);

    ov.addEventListener('click', function (e) { if (e.target === ov) closeSheet(); });
    D.getElementById('pwX').onclick = function () { closeSheet(); };
    D.getElementById('pwNot').onclick = function () { closeSheet(); };
    D.getElementById('pwNev').onclick = function () { never(); closeSheet(true); };
    D.getElementById('pwGo').onclick = doInstall;
    D.getElementById('pwMan').onclick = function () { showManual(true); };
    D.getElementById('pwOk').onclick = function () { hideInstall(); };
    D.getElementById('pwCp').onclick = function () {
      var u = location.href.split('#')[0];
      try { navigator.clipboard.writeText(u).then(function () { toast('Link copied. Paste it in Safari.'); }, function () { toast(u); }); } catch (e) { toast(u); }
    };
    D.getElementById('pwSeg').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button[data-t]') : null; if (b) setTab(b.getAttribute('data-t'));
    });
    ov.querySelectorAll('.pw-steps').forEach(function (box) {
      box.addEventListener('click', function (e) {
        var s = e.target.closest ? e.target.closest('.pw-st') : null;
        if (s) { setStep(box.getAttribute('data-k'), +s.getAttribute('data-i')); startCycle(); }
      });
    });
    try {
      W.matchMedia('(display-mode: standalone)').addEventListener('change', function (e) { if (e.matches) { ls('ispace_installed', '1'); closeSheet(true); } });
    } catch (e) {}
  }

  function toast(msg, ms) {
    build(); var t = D.getElementById('pwTt'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, ms || 3200);
  }

  function setStep(kind, i) {
    ui.step[kind] = i;
    var box = ov.querySelector('.pw-stage[data-k="' + kind + '"]');
    if (box) Array.prototype.forEach.call(box.children, function (el, k) { el.classList.toggle('on', k === i); });
    var list = ov.querySelector('.pw-steps[data-k="' + kind + '"]');
    if (list) Array.prototype.forEach.call(list.children, function (el, k) { el.classList.toggle('act', k === i); });
  }
  function startCycle() {
    clearInterval(ui.timer);
    ui.timer = setInterval(function () {
      var kind = ui.tab, n = STEPS[kind].length;
      if (kind === 'android' && D.getElementById('pwAm').style.display === 'none') return;
      setStep(kind, (ui.step[kind] + 1) % n);
    }, 3000);
  }
  function setTab(t) {
    ui.tab = t;
    D.getElementById('pwSeg').classList.toggle('ios', t === 'ios');
    Array.prototype.forEach.call(D.querySelectorAll('#pwSeg button'), function (b) { b.classList.toggle('on', b.getAttribute('data-t') === t); });
    D.getElementById('pwPa').classList.toggle('on', t === 'android');
    D.getElementById('pwPi').classList.toggle('on', t === 'ios');
    D.getElementById('pwSaf').style.display = (IOS && !IOS_SAFARI) ? 'flex' : 'none';
    ui.step[t] = 0; setStep(t, 0); refresh();
    if (ov.classList.contains('on')) startCycle();
  }
  function showManual(on) {
    D.getElementById('pwAm').style.display = on ? 'block' : 'none';
    D.getElementById('pwMan').style.display = on ? 'none' : 'block';
    if (on) setStep('android', 0);
  }
  function refresh() {
    if (!ui.built) return;
    var has = !!deferred;
    D.getElementById('pwAn').textContent = has ? 'One tap. Free. No Play Store needed.' : 'Your browser will guide you. Follow the 3 simple steps below.';
    if (!has) showManual(true); else if (D.getElementById('pwAm').style.display === 'none') showManual(false);
  }

  function openSheet(tab, auto) {
    build();
    ui.auto = !!auto;
    setTab(tab || (IOS ? 'ios' : 'android'));
    if (!ov.classList.contains('on')) {
      ov.classList.add('on');
      W.requestAnimationFrame(function () { W.requestAnimationFrame(function () { ov.classList.add('show'); }); });
    }
    startCycle();
  }
  function closeSheet(silent) {
    if (!ui.built || !ov.classList.contains('show') && !ov.classList.contains('on')) return;
    var was = ov.classList.contains('show');
    ov.classList.remove('show');
    clearInterval(ui.timer);
    setTimeout(function () { if (!ov.classList.contains('show')) ov.classList.remove('on'); }, 450);
    if (was && ui.auto && silent !== true) dismissNow();
    ui.auto = false;
  }

  /* ---------- Android install + realistic installing animation ---------- */
  function doInstall() {
    if (!deferred) { showManual(true); toast('Follow the 3 steps below'); return; }
    var d = deferred; deferred = null;
    var r;
    try { d.prompt(); r = d.userChoice; } catch (e) { r = Promise.resolve({ outcome: 'dismissed' }); }
    Promise.resolve(r).then(function (c) {
      if (c && c.outcome === 'accepted') { ui.auto = false; closeSheet(true); startInstall(); }
      else { closeSheet(); }
    }, function () { closeSheet(); });
  }

  var CIRC = 415;
  function startInstall() {
    build();
    var el = D.getElementById('pwIn');
    ins.on = true; ins.done = false; ins.p = 0; ins.last = 0;
    el.classList.remove('done');
    D.getElementById('pwInT').textContent = 'Installing iSpace\u2026';
    D.getElementById('pwInS').textContent = 'Adding to your Home screen and App drawer';
    D.getElementById('pwCf').innerHTML = '';
    el.classList.add('on');
    W.requestAnimationFrame(function () { W.requestAnimationFrame(function () { el.classList.add('show'); }); });
    cancelAnimationFrame(ins.raf); ins.raf = W.requestAnimationFrame(tick);
    clearTimeout(ins.tmo);
    ins.tmo = setTimeout(function () { if (ins.on && !ins.done) finishInstall(true); }, 40000);
    var done = function () { if (ins.on && !ins.done) { try { navigator.getInstalledRelatedApps().then(function (a) { if (a && a.length) finishInstall(); }); } catch (e) {} } };
    D.addEventListener('visibilitychange', function f() { if (!ins.on) { D.removeEventListener('visibilitychange', f); return; } if (!D.hidden) done(); });
  }
  function paintInstall() {
    var p = Math.max(0, Math.min(100, ins.p));
    D.getElementById('pwRing').style.strokeDashoffset = String(CIRC * (1 - p / 100));
    D.getElementById('pwPct').textContent = Math.floor(p) + '%';
    var rows = D.getElementById('pwLs').children, th = [0, 30, 58, 82], k;
    for (k = 0; k < rows.length; k++) {
      var next = k + 1 < th.length ? th[k + 1] : 100;
      rows[k].className = p >= next ? 'ok' : (p >= th[k] ? 'cur' : '');
    }
  }
  function tick(now) {
    if (!ins.on) return;
    var dt = ins.last ? Math.min(64, now - ins.last) : 16; ins.last = now;
    if (ins.done) ins.p += (100 - ins.p) * (1 - Math.pow(0.88, dt / 16.7)) + 0.35;
    else ins.p = 92 - (92 - ins.p) * Math.pow(0.992, dt / 16.7);
    paintInstall();
    if (ins.done && ins.p >= 99.6) { ins.p = 100; paintInstall(); celebrate(); return; }
    ins.raf = W.requestAnimationFrame(tick);
  }
  function finishInstall(assumed) {
    if (!ins.on || ins.done) return;
    ins.done = true; ls('ispace_installed', '1');
    if (assumed) ins.assumed = true;
  }
  function celebrate() {
    var el = D.getElementById('pwIn');
    el.classList.add('done');
    D.getElementById('pwInT').textContent = 'iSpace installed!';
    D.getElementById('pwInS').textContent = ins.assumed ? 'Install requested. Check your Home screen or App drawer.' : 'Find it on your Home screen and in your App drawer.';
    var cf = D.getElementById('pwCf'), cols = ['#22D3EE', '#0A84FF', '#8B5CF6', '#30D158', '#FFD60A', '#FF453A'], i, h = '';
    for (i = 0; i < 34; i++) {
      h += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * .8).toFixed(2) + 's;animation-duration:' + (2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.floor(Math.random() * 720 - 360) + 'deg"></i>';
    }
    cf.innerHTML = h;
    try { if (navigator.vibrate) navigator.vibrate([30, 40, 30]); } catch (e) {}
  }
  function hideInstall() {
    var el = D.getElementById('pwIn'); ins.on = false; clearTimeout(ins.tmo); cancelAnimationFrame(ins.raf);
    el.classList.remove('show'); setTimeout(function () { el.classList.remove('on'); }, 480);
  }

  /* ---------- auto popup ---------- */
  var tries = 0;
  function auto() {
    if (!eligible()) return;
    if (D.hidden || (D.body && D.body.classList.contains('sheet-open')) || (ui.built && (ov.classList.contains('on') || D.getElementById('pwIn').classList.contains('on')))) {
      if (++tries < 12) setTimeout(auto, 4000);
      return;
    }
    openSheet(IOS ? 'ios' : 'android', true);
  }

  /* ---------- background keep-alive ---------- */
  var BG = { wl: null, au: null, url: '', playing: false, userPaused: false };
  function bgUp() { return ls('ispace_bg_up') !== '0'; }
  function bgAlways() { return ls('ispace_bg_always') === '1'; }
  function wavURL() {
    if (BG.url) return BG.url;
    var rate = 8000, n = rate, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf), i;
    function s(o, t) { for (var k = 0; k < t.length; k++) v.setUint8(o + k, t.charCodeAt(k)); }
    s(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); s(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); s(36, 'data'); v.setUint32(40, n * 2, true);
    for (i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round(3 * Math.sin(2 * Math.PI * 40 * i / rate)), true); /* inaudible, not digital silence */
    BG.url = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    return BG.url;
  }
  function lockScreen() {
    try {
      if (!('wakeLock' in navigator) || BG.wl || D.hidden) return;
      navigator.wakeLock.request('screen').then(function (l) { BG.wl = l; l.addEventListener('release', function () { BG.wl = null; }); }, function () {});
    } catch (e) {}
  }
  function unlockScreen() { try { if (BG.wl) { BG.wl.release(); BG.wl = null; } } catch (e) {} }
  function startAudio(label) {
    try {
      if (!BG.au) { BG.au = new Audio(wavURL()); BG.au.loop = true; BG.au.setAttribute('playsinline', ''); BG.au.preload = 'auto'; }
      if (navigator.mediaSession) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: label || 'iSpace is syncing', artist: 'Keeping your backup running', album: 'iSpace', artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
        navigator.mediaSession.playbackState = 'playing';
        navigator.mediaSession.setActionHandler('pause', function () { BG.userPaused = true; stopAudio(); });
        navigator.mediaSession.setActionHandler('play', function () { BG.userPaused = false; wanted(); });
      }
      var p = BG.au.play(); BG.playing = true;
      if (p && p.catch) p.catch(function () { BG.playing = false; /* needs a tap first: retried on next touch */ });
    } catch (e) {}
  }
  function stopAudio() {
    try { if (BG.au) BG.au.pause(); BG.playing = false; if (navigator.mediaSession) { navigator.mediaSession.playbackState = 'none'; navigator.mediaSession.metadata = null; } } catch (e) {}
  }
  function uploading() { var l = D.getElementById('live'); return !!l && l.style.display === 'block'; }
  function wanted() {
    var up = uploading() && bgUp(), always = bgAlways() && (standalone() || ANDROID);
    if (BG.userPaused && !up) BG.userPaused = false;
    if (up || always) {
      if (up) lockScreen();
      if (!BG.userPaused && (!BG.playing || (BG.au && BG.au.paused))) startAudio(up ? 'iSpace is uploading your files' : 'iSpace Auto-Sync is active');
    } else { unlockScreen(); if (BG.playing) stopAudio(); }
  }
  function initBg() {
    var live = D.getElementById('live');
    if (live && W.MutationObserver) new MutationObserver(wanted).observe(live, { attributes: true, attributeFilter: ['style'] });
    D.addEventListener('visibilitychange', function () { if (!D.hidden && uploading() && bgUp()) lockScreen(); wanted(); });
    ['touchend', 'click'].forEach(function (ev) { D.addEventListener(ev, function () { if ((uploading() && bgUp()) || bgAlways()) { if (!BG.playing || (BG.au && BG.au.paused)) wanted(); } }, { passive: true }); });
    setInterval(wanted, 8000);
    wanted();
  }

  function bgSheet() {
    build();
    var html = '<div class="pw-bg"><h2>Background Sync</h2><p>Phones often pause web apps when you leave them. These options help iSpace keep working.</p>' +
      '<div class="pw-row"><div><b>Keep uploading</b><span>Keeps your phone awake and iSpace running while files upload.</span></div><button class="pw-sw' + (bgUp() ? ' on' : '') + '" data-k="ispace_bg_up" aria-label="Keep uploading"></button></div>' +
      '<div class="pw-row"><div><b>Always-on Auto-Sync</b><span>Checks your Auto-Sync folders every 2 minutes even when iSpace is in the background. Uses more battery and may pause your music.</span></div><button class="pw-sw' + (bgAlways() ? ' on' : '') + '" data-k="ispace_bg_always" aria-label="Always-on Auto-Sync"></button></div>' +
      '<div class="pw-note" style="text-align:left">Tips: do not swipe iSpace away from recent apps, and set battery use to Unrestricted for it in Android settings. iPhone stops apps in the background, so keep iSpace open while uploading.</div>' +
      '<button class="pw-link" id="pwBgX">Close</button></div>';
    var box = mk('<div class="pw-ov on" id="pwBgOv"><div class="pw-sh">' + '<div class="pw-grab"></div>' + html + '</div></div>');
    D.body.appendChild(box);
    W.requestAnimationFrame(function () { W.requestAnimationFrame(function () { box.classList.add('show'); }); });
    function close() { box.classList.remove('show'); setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 450); }
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.id === 'pwBgX') return close();
      var b = e.target.closest ? e.target.closest('.pw-sw') : null;
      if (b) { var on = !b.classList.contains('on'); b.classList.toggle('on', on); ls(b.getAttribute('data-k'), on ? '1' : '0'); wanted(); if (on && b.getAttribute('data-k') === 'ispace_bg_always') toast('Tap anywhere once to start Auto-Sync keep-alive'); }
    });
  }

  /* ---------- profile menu entries (no app.js edit needed) ---------- */
  function hookProfile() {
    var sh = D.getElementById('sh'); if (!sh || !W.MutationObserver) return;
    new MutationObserver(function () {
      if (!sh.querySelector('.profile-hdr') || sh.querySelector('.pw-pbtn')) return;
      var card = sh.querySelector('.card'); if (!card) return;
      var first = card.firstChild;
      function btn(icon, label, fn) {
        var b = D.createElement('button'); b.className = 'action-btn pw-pbtn';
        b.innerHTML = '<i class="fa-solid ' + icon + '"></i> <span style="margin-left:12px">' + label + '</span>';
        b.onclick = fn; card.insertBefore(b, first);
      }
      btn('fa-bolt', 'Background Sync', bgSheet);
      if (!isInstalled()) btn('fa-download', 'Install iSpace App', function () { openSheet(IOS ? 'ios' : 'android', false); });
    }).observe(sh, { childList: true });
  }

  /* ---------- go ---------- */
  function init() {
    hookProfile(); initBg();
    if (standalone() && !ls('ispace_welcomed')) { ls('ispace_welcomed', '1'); setTimeout(function () { toast('iSpace is installed \u2713 Enjoy!', 3800); }, 1200); }
    setTimeout(auto, 3500);
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();

  W.iSpacePWA = { open: function (t) { openSheet(t, false); }, bg: bgSheet, installed: isInstalled };
})();
