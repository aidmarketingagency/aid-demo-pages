/* ============================================================
   SMS THREAD SEQUENCER
   Mandatory IntersectionObserver pattern (two separate observers)
   per contractor-demo-v2 spec, commit 6428128 rootcause fix.
   ============================================================ */
(function(){
  var thread = document.getElementById('smsThread');
  var b1 = document.getElementById('b1');
  var t1 = document.getElementById('t1');
  var b2 = document.getElementById('b2');
  var b3 = document.getElementById('b3');
  var t2 = document.getElementById('t2');
  var b4 = document.getElementById('b4');
  var replayBtn = document.getElementById('replayBtn');

  var timers = [];
  var playing = false;

  function clearTimers(){
    timers.forEach(function(id){clearTimeout(id);});
    timers = [];
  }

  function resetThread(){
    clearTimers();
    playing = false;
    [b1,t1,b2,b3,t2,b4].forEach(function(el){
      el.classList.remove('show');
    });
  }

  function after(ms, fn){
    var id = setTimeout(fn, ms);
    timers.push(id);
  }

  function playThread(){
    if(playing) return;
    playing = true;
    resetThread();
    playing = true;

    after(400, function(){ b1.classList.add('show'); });
    after(1000, function(){ t1.classList.add('show'); });
    after(2400, function(){ t1.classList.remove('show'); b2.classList.add('show'); });
    after(3600, function(){ b3.classList.add('show'); });
    after(4400, function(){ t2.classList.add('show'); });
    after(5800, function(){ t2.classList.remove('show'); b4.classList.add('show'); playing = false; });
  }

  /* Replay button */
  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 600);
    resetThread();
    setTimeout(playThread, 200);
  });

  /* --- MANDATORY TWO-OBSERVER PATTERN (spec rootcause fix) --- */

  /* playIO: fires once when thread enters view */
  var playIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        playThread();
      }
    });
  }, { threshold: 0.2 });

  /* rearmIO: resets ONLY on full exit (never on same callback as play) */
  var rearmIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting){
        resetThread();
      }
    });
  }, { threshold: 0 });

  playIO.observe(thread);
  rearmIO.observe(thread);

  /* "Already visible on load" check using getBoundingClientRect */
  var rect = thread.getBoundingClientRect();
  if(rect.top < window.innerHeight && rect.bottom > 0){
    playThread();
  }
})();

/* ============================================================
   STAT COUNTER
   ============================================================ */
(function(){
  var statEl = document.getElementById('statCount');
  var statSection = document.getElementById('statSection');
  var statReplay = document.getElementById('statReplay');
  var target = 6000;
  var duration = 1800;
  var rafId = null;
  var countRun = 0;

  function runCount(){
    if(rafId){ cancelAnimationFrame(rafId); }
    var run = ++countRun;
    var start = null;
    statEl.textContent = '0';

    function step(ts){
      if(run !== countRun) return;
      if(!start) start = ts;
      var elapsed = ts - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var val = Math.round(eased * target);
      statEl.textContent = val.toLocaleString();
      if(progress < 1){
        rafId = requestAnimationFrame(step);
      } else {
        statEl.textContent = target.toLocaleString();
      }
    }
    rafId = requestAnimationFrame(step);
  }

  statReplay.addEventListener('click', runCount);

  /* playIO for stat */
  var statPlayIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ runCount(); }
    });
  }, { threshold: 0.3 });

  /* rearmIO for stat */
  var statRearmIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting){
        if(rafId){ cancelAnimationFrame(rafId); }
        statEl.textContent = '0';
        countRun++;
      }
    });
  }, { threshold: 0 });

  statPlayIO.observe(statSection);
  statRearmIO.observe(statSection);

  /* getBoundingClientRect initial-visibility check */
  var rect = statSection.getBoundingClientRect();
  if(rect.top < window.innerHeight && rect.bottom > 0){
    runCount();
  }
})();

/* ============================================================
   SCROLL REVEAL (section fade-ups)
   ============================================================ */
(function(){
  var reveals = document.querySelectorAll('.reveal');
  if(!reveals.length) return;
  var revealIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        e.target.classList.add('in-view');
        revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  reveals.forEach(function(el){
    /* getBoundingClientRect check for already-visible elements */
    var rect = el.getBoundingClientRect();
    if(rect.top < window.innerHeight && rect.bottom > 0){
      el.classList.add('in-view');
    } else {
      revealIO.observe(el);
    }
  });
})();

/* ============================================================
   STICKY MOBILE CTA: hide while real CTA section is in view
   ============================================================ */
(function(){
  var bar = document.getElementById('mobileCta');
  var ctaSection = document.getElementById('ctaSection');
  if(!bar || !ctaSection) return;
  var ctaIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        bar.classList.add('hidden');
      } else {
        bar.classList.remove('hidden');
      }
    });
  }, { threshold: 0.1 });
  ctaIO.observe(ctaSection);
})();

/* AID teaser bubble + auto-open schedule (v3, 2026-07-22):
   teaser at 10s next to the closed launcher, auto-open never before 20s.
   Pages with the data-aid-widget-boost snippet keep that snippet's own 20s
   opener; this block only auto-opens on pages without it. Clicking the
   teaser or the launcher opens the chat immediately. */
(function () {
  var WID = '54722168';
  var BUBBLE_ID = 'ultra-fast-widget-bubble-' + WID;
  var OPEN_KEY = 'aidWidgetAutoOpened';
  var LEGACY_KEY = 'aidDemoWidgetAutoOpened';
  var TEASER_KEY = 'aidTeaserShown';
  var TEASER_AT = 10; /* seconds, the old auto-open moment */
  var OPEN_AT = 20;   /* seconds, minimum auto-open delay */
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
      userTouched = true;
      hideTeaser();
    }
  }, true);
  function hideTeaser() {
    if (!teaser) return;
    var t = teaser;
    teaser = null;
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
    try {
      if (sessionStorage.getItem(TEASER_KEY)) return;
      sessionStorage.setItem(TEASER_KEY, '1');
    } catch (e) {}
    var d = document.createElement('div');
    d.setAttribute('data-aid-teaser', '');
    d.setAttribute('role', 'button');
    d.setAttribute('tabindex', '0');
    d.style.cssText = 'position:fixed;right:20px;bottom:98px;z-index:999998;max-width:250px;background:#141419;color:#F4F4F5;padding:13px 32px 13px 16px;border-radius:16px;border:1px solid color-mix(in srgb, var(--accent) 45%, transparent);box-shadow:0 12px 28px rgba(0,0,0,.5);font:500 14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;cursor:pointer;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease;';
    var txt = document.createElement('p');
    txt.style.cssText = 'margin:0;';
    txt.textContent = "Give your customers AN OFFER they can't refuse! 🎙️";
    var x = document.createElement('button');
    x.type = 'button';
    x.setAttribute('aria-label', 'Dismiss');
    x.textContent = '×';
    x.style.cssText = 'position:absolute;top:2px;right:6px;background:transparent;border:none;color:rgba(244,244,245,.55);font-size:18px;line-height:1;cursor:pointer;padding:2px 4px;';
    x.addEventListener('click', function (e) { e.stopPropagation(); hideTeaser(); });
    var arrow = document.createElement('span');
    arrow.style.cssText = 'position:absolute;bottom:-7px;right:26px;width:12px;height:12px;background:#141419;border-right:1px solid color-mix(in srgb, var(--accent) 45%, transparent);border-bottom:1px solid color-mix(in srgb, var(--accent) 45%, transparent);transform:rotate(45deg);';
    d.appendChild(txt);
    d.appendChild(x);
    d.appendChild(arrow);
    d.addEventListener('click', function (e) { if (e.target === x) return; e.stopPropagation(); openChat(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChat(); } });
    document.body.appendChild(d);
    teaser = d;
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