(function(){
  'use strict';

  /* ======================================================
     SMS THREAD SEQUENCER
     Two-observer pattern per spec (playIO + rearmIO) +
     getBoundingClientRect initial-visibility check.
     prefers-reduced-motion: kill spatial transforms only,
     keep sequential opacity crossfade.
  ====================================================== */

  var BUBBLES = [
    {
      side:'caller',
      text:'A big oak fell in my backyard last night and it's on the fence. I need it removed today if possible.'
    },
    {
      side:'ai',
      badge:'AI replied in 21 seconds',
      text:'Hi, I'm County Tree Service's answering line. We handle storm removals in Gastonia and the Gaston County area. Can I get your address and a quick description of the situation?'
    },
    {
      side:'caller',
      text:'It's in Gastonia, near Lowell Road. The oak is about 60 feet long on the ground. Half is on the fence.'
    },
    {
      side:'ai',
      text:'Understood, that sounds like a same-day removal job. I have a 2 PM slot and I am sending you a confirmation text now.'
    }
  ];

  var phoneBody = document.getElementById('phone-body');
  var replayBtn = document.getElementById('replay-btn');
  var thread    = document.getElementById('sms-thread');
  var timers    = [];
  var playing   = false;
  var armed     = false;

  function clearTimers(){
    timers.forEach(function(t){clearTimeout(t);});
    timers = [];
  }

  function buildBubbles(){
    phoneBody.innerHTML = '';
    BUBBLES.forEach(function(b, i){
      if(b.side === 'ai'){
        // typing indicator first
        var typing = document.createElement('div');
        typing.className = 'typing';
        typing.id = 'typing-' + i;
        typing.setAttribute('aria-hidden','true');
        typing.innerHTML = '<span></span><span></span><span></span>';
        phoneBody.appendChild(typing);
      }
      var div = document.createElement('div');
      div.className = 'bubble ' + b.side;
      div.id = 'bubble-' + i;
      if(b.side === 'ai'){
        var inner = '';
        if(b.badge){
          inner += '<span class="ai-badge" aria-label="' + b.badge + '">' + b.badge + '</span><br>';
        }
        inner += b.text;
        div.innerHTML = inner;
      } else {
        div.textContent = b.text;
      }
      phoneBody.appendChild(div);
    });
  }

  function resetThread(){
    clearTimers();
    playing = false;
    armed   = false;
    buildBubbles();
  }

  function playThread(){
    if(playing) return;
    playing = true;
    armed   = true;
    replayBtn.classList.remove('spin');

    // delays: caller 600ms, ai: typing 900ms, bubble 1400ms
    var schedule = [
      {id:'bubble-0', delay:600},
      {id:'typing-1', delay:1400},
      {id:'bubble-1', show:'typing-1', delay:2500},
      {id:'bubble-2', delay:4000},
      {id:'typing-3', delay:4900},
      {id:'bubble-3', show:'typing-3', delay:6200}
    ];

    schedule.forEach(function(step){
      var t = setTimeout(function(){
        var el = document.getElementById(step.id);
        if(el) el.classList.add('show');
        if(step.show){
          var hide = document.getElementById(step.show);
          if(hide) hide.classList.remove('show');
        }
      }, step.delay);
      timers.push(t);
    });

    // completion
    var done = setTimeout(function(){playing = false;}, 7000);
    timers.push(done);
  }

  /* initial build */
  buildBubbles();

  /* replay button */
  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    resetThread();
    var t = setTimeout(function(){
      replayBtn.classList.remove('spin');
      playThread();
    }, 400);
    timers.push(t);
  });

  /* -- INTERSECTIONOBSERVER: playIO (plays on entry) -- */
  var playIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting && !armed){
        playThread();
      }
    });
  }, {threshold: 0.2});

  /* -- INTERSECTIONOBSERVER: rearmIO (resets on full exit) -- */
  var rearmIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting){
        resetThread();
      }
    });
  }, {threshold: 0});

  playIO.observe(thread);
  rearmIO.observe(thread);

  /* -- getBoundingClientRect: initial visibility check -- */
  (function checkInitialVisibility(){
    var rect = thread.getBoundingClientRect();
    if(rect.top < window.innerHeight && rect.bottom > 0){
      playThread();
    }
  })();


  /* ======================================================
     STAT COUNTER
  ====================================================== */
  var statVal      = document.getElementById('stat-val');
  var statReplayBtn = document.getElementById('stat-replay-btn');
  var statSection  = document.querySelector('.proof');
  var TARGET       = 2500;
  var countRun     = 0;
  var statArmed    = false;

  function runCount(gen){
    var start = performance.now();
    var duration = 1600;
    function frame(now){
      if(gen !== countRun) return;
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var val = Math.round(eased * TARGET);
      statVal.textContent = '$' + val.toLocaleString();
      if(progress < 1){
        requestAnimationFrame(frame);
      }
    }
    requestAnimationFrame(frame);
  }

  function startCount(){
    countRun++;
    statArmed = true;
    statVal.textContent = '$0';
    runCount(countRun);
  }

  function resetCount(){
    countRun++;
    statArmed = false;
    statVal.textContent = '$0';
  }

  statReplayBtn.addEventListener('click', function(){
    resetCount();
    setTimeout(startCount, 100);
  });

  var statPlayIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting && !statArmed){
        startCount();
      }
    });
  }, {threshold: 0.3});

  var statRearmIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting){
        resetCount();
      }
    });
  }, {threshold: 0});

  statPlayIO.observe(statSection);
  statRearmIO.observe(statSection);

  /* getBoundingClientRect check for stat */
  (function checkStatVisibility(){
    var rect = statSection.getBoundingClientRect();
    if(rect.top < window.innerHeight && rect.bottom > 0){
      startCount();
    }
  })();


  /* ======================================================
     SCROLL REVEAL (section fade-ups)
  ====================================================== */
  var revealEls = document.querySelectorAll('.reveal');
  var revealIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        e.target.classList.add('visible');
        revealIO.unobserve(e.target);
      }
    });
  }, {threshold: 0.08});

  revealEls.forEach(function(el){
    var rect = el.getBoundingClientRect();
    if(rect.top < window.innerHeight){
      el.classList.add('visible');
    } else {
      revealIO.observe(el);
    }
  });


  /* ======================================================
     STICKY MOBILE CTA: hide while CTA panel is visible
  ====================================================== */
  var stickyCta = document.getElementById('sticky-cta');
  var ctaPanel  = document.getElementById('cta-panel');

  if(stickyCta && ctaPanel){
    var ctaIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          stickyCta.classList.add('hidden');
        } else {
          stickyCta.classList.remove('hidden');
        }
      });
    }, {threshold: 0.1});
    ctaIO.observe(ctaPanel);
  }

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