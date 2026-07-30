(function(){
  'use strict';

  // ── SMS sequencer (D4, mandatory per contractor-demo-v2 spec) ──────────────
  // Separate playIO (plays once on entry) and rearmIO (rearms on full exit)
  // plus getBoundingClientRect() check for "already visible on load".
  // Reference: contractor-demo-v2.html; fixed pattern per 2026-07-24 rootcause doc.

  var thread = document.getElementById('thread');
  var bubbles = thread.querySelectorAll('.bubble');
  var typings = thread.querySelectorAll('.typing');
  var replayBtn = document.querySelector('.replay-btn');
  var timings = [400, 1200, 2700, 1800]; // ms: [b0_delay, typing1_delay, b1_delay, b2_delay]
  var timers = [];
  var playing = false;
  var generation = 0;

  function resetThread(){
    timers.forEach(clearTimeout);
    timers = [];
    playing = false;
    bubbles.forEach(function(b){ b.classList.remove('show'); });
    typings.forEach(function(t){ t.classList.remove('show'); });
    if(replayBtn){ replayBtn.classList.remove('spin'); }
  }

  function playThread(){
    if(playing) return;
    playing = true;
    var gen = ++generation;
    function check(){ return gen === generation; }

    // b0 (caller 1) — immediate
    timers.push(setTimeout(function(){
      if(!check()) return;
      bubbles[0] && bubbles[0].classList.add('show');
    }, timings[0]));

    // typing indicator 1 — after b0
    timers.push(setTimeout(function(){
      if(!check()) return;
      typings[0] && typings[0].classList.add('show');
    }, timings[0] + timings[1]));

    // b1 (AI 1) + hide typing 1 — after b0 + typing1
    timers.push(setTimeout(function(){
      if(!check()) return;
      typings[0] && typings[0].classList.remove('show');
      bubbles[1] && bubbles[1].classList.add('show');
    }, timings[0] + timings[1] + timings[2]));

    // b2 (caller 2) — after b1
    timers.push(setTimeout(function(){
      if(!check()) return;
      bubbles[2] && bubbles[2].classList.add('show');
    }, timings[0] + timings[1] + timings[2] + 900));

    // typing indicator 2
    timers.push(setTimeout(function(){
      if(!check()) return;
      typings[1] && typings[1].classList.add('show');
    }, timings[0] + timings[1] + timings[2] + 900 + 800));

    // b3 (AI 2) + hide typing 2
    timers.push(setTimeout(function(){
      if(!check()) return;
      typings[1] && typings[1].classList.remove('show');
      bubbles[3] && bubbles[3].classList.add('show');
      playing = false;
    }, timings[0] + timings[1] + timings[2] + 900 + 800 + timings[3]));
  }

  // playIO: plays once on entry
  var playIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        playThread();
        playIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });

  // rearmIO: resets on full exit (SEPARATE observer per spec)
  var rearmIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting){
        resetThread();
        playIO.observe(thread); // re-arm for next entry
      }
    });
  }, { threshold: 0 });

  // "already visible on load" check (mandatory per spec)
  var rect = thread.getBoundingClientRect();
  if(rect.top < window.innerHeight && rect.bottom > 0){
    playThread();
  } else {
    playIO.observe(thread);
  }
  rearmIO.observe(thread);

  if(replayBtn){
    replayBtn.addEventListener('click', function(){
      replayBtn.classList.add('spin');
      setTimeout(function(){ replayBtn.classList.remove('spin'); }, 550);
      resetThread();
      setTimeout(playThread, 200);
    });
  }

  // ── Animated stat counter ────────────────────────────────────────────────
  var dollarEl = document.getElementById('stat-dollars');
  var centsEl = document.getElementById('stat-cents');
  var statReplay = document.getElementById('stat-replay-btn');
  var statCounted = false;
  var countRun = 0;

  function runCount(){
    var run = ++countRun;
    var target = 7298;
    var dur = 1600;
    var start = null;
    function step(ts){
      if(run !== countRun) return;
      if(!start) start = ts;
      var progress = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var val = Math.round(eased * target);
      var dollars = Math.floor(val / 1000);
      var cents = String(val % 1000).padStart(3, '0');
      if(dollarEl) dollarEl.textContent = '$' + dollars;
      if(centsEl) centsEl.textContent = ',' + cents;
      if(progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var demoIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting && !statCounted){
        statCounted = true;
        runCount();
        demoIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });

  var statEl = document.querySelector('.stat-number');
  if(statEl) demoIO.observe(statEl);

  if(statReplay){
    statReplay.addEventListener('click', function(){
      statCounted = false;
      runCount();
      statCounted = true;
    });
  }

  // ── Scroll reveals ───────────────────────────────────────────────────────
  var reveals = document.querySelectorAll('.reveal');
  var revealIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        e.target.classList.add('visible');
        revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(function(r){ revealIO.observe(r); });

  // ── Mobile trust row (A1: show below demo panel on mobile) ────────────────
  var mtr = document.querySelector('.mobile-trust-row');
  if(mtr && window.innerWidth <= 820){ mtr.style.display = 'block'; }

  // ── Mobile sticky CTA hide when real CTA in view (A1) ────────────────────
  var ctaBar = document.getElementById('mobile-cta-bar');
  var ctaPanel = document.getElementById('cta-panel');
  if(ctaBar && ctaPanel){
    document.body.classList.add('mobile-cta-active');
    var ctaIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        ctaBar.style.display = e.isIntersecting ? 'none' : 'block';
      });
    }, { threshold: 0.1 });
    ctaIO.observe(ctaPanel);
  }

})();

/* AID teaser bubble + auto-open schedule (v3, 2026-07-22) */
(function () {
  var WID = '54722168';
  var BUBBLE_ID = 'ultra-fast-widget-bubble-' + WID;
  var OPEN_KEY = 'aidWidgetAutoOpened';
  var LEGACY_KEY = 'aidDemoWidgetAutoOpened';
  var TEASER_KEY = 'aidTeaserShown';
  var TEASER_AT = 10;
  var OPEN_AT = 20;
  var hasBoost = !!document.querySelector('script[data-aid-widget-boost]');
  function bubble() { return document.getElementById(BUBBLE_ID); }
  function isOpen() {
    var c = document.getElementById('ultra-fast-widget-container-' + WID);
    return !!(c && getComputedStyle(c).display !== 'none');
  }
  function alreadyOpened() {
    try { return !!(sessionStorage.getItem(OPEN_KEY) || sessionStorage.getItem(LEGACY_KEY)); } catch (e) { return false; }
  }
  var teaser = null;
  var userTouched = false;
  document.addEventListener('click', function (e) {
    if (e.isTrusted && e.target && e.target.closest && e.target.closest('#' + BUBBLE_ID)) {
      userTouched = true; hideTeaser();
    }
  }, true);
  function hideTeaser() {
    if (!teaser) return;
    var t = teaser; teaser = null;
    t.style.opacity = '0';
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 450);
  }
  function openChat() {
    hideTeaser();
    var b = bubble();
    if (b && !isOpen()) b.click();
  }
  function showTeaser() {
    if (teaser || userTouched || isOpen() || alreadyOpened()) return;
    try { if (sessionStorage.getItem(TEASER_KEY)) return; sessionStorage.setItem(TEASER_KEY, '1'); } catch (e) {}
    var d = document.createElement('div');
    d.setAttribute('data-aid-teaser', '');
    d.setAttribute('role', 'button');
    d.setAttribute('tabindex', '0');
    d.style.cssText = 'position:fixed;right:20px;bottom:98px;z-index:999998;max-width:250px;background:#141419;color:#F4F4F5;padding:13px 32px 13px 16px;border-radius:16px;border:1px solid color-mix(in srgb, var(--accent) 45%, transparent);box-shadow:0 12px 28px rgba(0,0,0,.5);font:500 14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;cursor:pointer;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease;';
    var txt = document.createElement('p');
    txt.style.cssText = 'margin:0;';
    txt.textContent = "Give your customers AN OFFER they can't refuse! 🎙️";
    var x = document.createElement('button');
    x.type = 'button'; x.setAttribute('aria-label', 'Dismiss'); x.textContent = '×';
    x.style.cssText = 'position:absolute;top:2px;right:6px;background:transparent;border:none;color:rgba(244,244,245,.55);font-size:18px;line-height:1;cursor:pointer;padding:2px 4px;';
    x.addEventListener('click', function (e) { e.stopPropagation(); hideTeaser(); });
    var arrow = document.createElement('span');
    arrow.style.cssText = 'position:absolute;bottom:-7px;right:26px;width:12px;height:12px;background:#141419;border-right:1px solid color-mix(in srgb, var(--accent) 45%, transparent);border-bottom:1px solid color-mix(in srgb, var(--accent) 45%, transparent);transform:rotate(45deg);';
    d.appendChild(txt); d.appendChild(x); d.appendChild(arrow);
    d.addEventListener('click', function (e) { if (e.target === x) return; e.stopPropagation(); openChat(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChat(); } });
    document.body.appendChild(d); teaser = d;
    requestAnimationFrame(function () { d.style.opacity = '1'; d.style.transform = 'translateY(0)'; });
  }
  var ticks = 0;
  var timer = setInterval(function () {
    ticks += 1;
    if (isOpen()) {
      hideTeaser();
      if (hasBoost || ticks >= OPEN_AT) clearInterval(timer);
      return;
    }
    var b = bubble();
    if (b && ticks >= TEASER_AT) showTeaser();
    if (!hasBoost && b && ticks >= OPEN_AT) {
      clearInterval(timer);
      hideTeaser();
      var guard = alreadyOpened();
      try { sessionStorage.setItem(LEGACY_KEY, '1'); } catch (e) {}
      if (!guard && !userTouched && !isOpen()) b.click();
    }
    if (ticks > 60) clearInterval(timer);
  }, 1000);
})();

(function(){
  var WID='54722168';
  var IMG='https://paymegpt.com/api/files/avatar/widget_avatar_mcp_widget_54722168_1784002747499.png';
  function mobile(){return window.innerWidth<769;}
  var full=false, fsBtn=null;
  function container(){return document.getElementById('ultra-fast-widget-container-'+WID);}
  function bubble(){return document.getElementById('ultra-fast-widget-bubble-'+WID);}
  function isOpen(){var c=container();return !!(c&&getComputedStyle(c).display!=='none');}
  function sheet(c){
    if(!mobile()||full){unsheet(c);return;}
    var s=c.style;
    s.setProperty('top','auto','important');s.setProperty('bottom','10px','important');
    s.setProperty('left','8px','important');s.setProperty('right','8px','important');
    s.setProperty('width','auto','important');s.setProperty('height','72vh','important');
    s.setProperty('max-height','72vh','important');s.setProperty('border-radius','16px','important');
    sheeted=true;
  }
  var sheeted=false;
  function unsheet(c){
    if(!sheeted)return;
    ['top','bottom','left','right','width','height','max-height','border-radius'].forEach(function(p){c.style.removeProperty(p);});
    sheeted=false;
  }
  function ensureFsBtn(c){
    if(!mobile()){if(fsBtn&&fsBtn.parentNode){fsBtn.parentNode.removeChild(fsBtn);fsBtn=null;}return;}
    if(fsBtn&&c.contains(fsBtn))return;
    fsBtn=document.createElement('button');
    fsBtn.type='button';fsBtn.setAttribute('aria-label','Toggle full screen');
    fsBtn.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 3H3v5"/><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M16 21h5v-5"/></svg>';
    fsBtn.style.cssText='position:absolute;top:9px;left:10px;z-index:2147483647;width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:9px;cursor:pointer;';
    fsBtn.addEventListener('click',function(e){
      e.stopPropagation();full=!full;var c2=container();
      if(c2){if(full){unsheet(c2);}else{sheet(c2);}}
    });
    c.appendChild(fsBtn);
  }
  function sync(){
    var b=bubble();
    if(!b)return;
    var open=isOpen();
    if(open){try{sessionStorage.setItem('aidWidgetAutoOpened','1');}catch(e){}}
    var img=b.querySelector('img[data-aid-icon]');
    if(open){if(img){img.remove();b.style.background='';}}
    else if(!img){
      img=document.createElement('img');
      img.src=IMG;img.alt='';img.setAttribute('data-aid-icon','');
      img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%;position:absolute;top:0;left:0;pointer-events:none;';
      b.style.background='#0D0D0F';
      b.appendChild(img);
    }
    var c=container();
    if(c){
      if(open){ensureFsBtn(c);sheet(c);}
      else{full=false;unsheet(c);}
    }
  }
  var armed=false;
  function autoOpen(){
    if(armed)return;
    var b=bubble();
    if(!b)return;
    armed=true;
    try{if(sessionStorage.getItem('aidWidgetAutoOpened'))return;}catch(e){}
    setTimeout(function(){
      try{if(sessionStorage.getItem('aidWidgetAutoOpened'))return;}catch(e){}
      try{sessionStorage.setItem('aidWidgetAutoOpened','1');}catch(e){}
      if(!isOpen())b.click();
    },20000);
  }
  setInterval(function(){sync();autoOpen();},400);
})();