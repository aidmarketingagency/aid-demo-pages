(function(){
  // -- SMS thread staged reveal + typing indicators, replayable --
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = { 1: document.getElementById('typing1'), 2: document.getElementById('typing2') };
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  // v2 spec: the reduced-motion fallback must cover JS-driven animation, not just CSS.
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reducedMotion(){ return !!motionQuery.matches; }

  function clearTimers(){ timers.forEach(function(t){ clearTimeout(t); }); timers = []; }

  function resetThread(){
    bubbles.forEach(function(b){ b.classList.remove('show'); });
    Object.keys(typers).forEach(function(k){ typers[k].classList.remove('show'); });
  }

  function showThreadFinal(){
    clearTimers();
    playing = false;
    bubbles.forEach(function(b){ b.classList.add('show'); });
    Object.keys(typers).forEach(function(k){ typers[k].classList.remove('show'); });
  }

  function playThread(){
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
    var seq = [
      { t: 250,  action: function(){ bubbles[0].classList.add('show'); } },
      { t: 900,  action: function(){ bubbles[1].classList.add('show'); } },
      { t: 1500, action: function(){ typers[1].classList.add('show'); } },
      { t: 2400, action: function(){ typers[1].classList.remove('show'); bubbles[2].classList.add('show'); } },
      { t: 3200, action: function(){ bubbles[3].classList.add('show'); } },
      { t: 3800, action: function(){ bubbles[4].classList.add('show'); } },
      { t: 4300, action: function(){ typers[2].classList.add('show'); } },
      { t: 5200, action: function(){ typers[2].classList.remove('show'); bubbles[5].classList.add('show'); } },
      { t: 6000, action: function(){ bubbles[6].classList.add('show'); playing = false; } }
    ];
    seq.forEach(function(step){ timers.push(setTimeout(step.action, step.t)); });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    clearTimers();
    playing = false;
    playThread();
  });

  // Autoplay once when ~15% of the thread is visible (including already-visible
  // at script init). No observer-driven restart while any part stays visible.
  // Re-arm ONLY after the thread has fully left the viewport, so scrolling away
  // and back replays it once per re-entry.
  var PLAY_RATIO = 0.15;
  var armed = true;
  function autoplayThread(){
    if (!armed) return;
    armed = false;
    playThread();
  }
  if ('IntersectionObserver' in window){
    var demoIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting){
          // Fully out of the viewport: quiet reset, then re-arm one replay.
          clearTimers();
          playing = false;
          resetThread();
          armed = true;
        } else if (e.intersectionRatio >= PLAY_RATIO){
          autoplayThread();
        }
      });
    }, { threshold: [0, PLAY_RATIO] });
    demoIO.observe(thread);
    // Already in view at init: play now rather than waiting on observer timing.
    var initRect = thread.getBoundingClientRect();
    var initVh = window.innerHeight || document.documentElement.clientHeight;
    var initVisible = Math.min(initRect.bottom, initVh) - Math.max(initRect.top, 0);
    if (initRect.height > 0 && (initVisible / initRect.height) >= PLAY_RATIO){
      autoplayThread();
    }
  } else {
    playThread();
  }

  // -- Reveal-on-scroll for sections (one-time entrance reveals, exempt per spec) --
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    var revealIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ e.target.classList.add('visible'); revealIO.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function(el){ revealIO.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('visible'); });
  }

  // -- Animated counter for the stat number (DOM nodes, no innerHTML) --
  var statEl = document.querySelector('.stat-number');
  var statReplayBtn = document.getElementById('statReplayBtn');
  if (statEl && 'IntersectionObserver' in window){
    statEl.textContent = '';
    var dollarNode = document.createTextNode('$0');
    var centsSpan = document.createElement('span');
    centsSpan.className = 'cents';
    centsSpan.textContent = ',000';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    // $12,163: top of the typical spend range for a full HVAC replacement in the
    // Charlotte metro (average $7,298, most homeowners spend $4,865 to $12,163).
    // Source: https://www.angi.com/articles/insider-s-price-guide-new-heating-and-cooling-system/nc/charlotte
    var STAT_TARGET = 12163;
    var countRun = 0;

    function showStatFinal(){
      countRun++;
      dollarNode.textContent = '$' + Math.floor(STAT_TARGET / 1000);
      centsSpan.textContent = ',' + String(STAT_TARGET % 1000).padStart(3, '0');
    }

    function runCount(){
      var runId = ++countRun;
      var dur = 1400;
      var start = null;
      function step(ts){
        if (runId !== countRun) return;
        if (!start) start = ts;
        var progress = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var val = Math.round(eased * STAT_TARGET);
        var dollars = Math.floor(val / 1000);
        var cents = String(val % 1000).padStart(3, '0');
        dollarNode.textContent = '$' + dollars;
        centsSpan.textContent = ',' + cents;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    var statIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ runCount(); }
      });
    }, { threshold: 0.4 });
    statIO.observe(statEl);

    if (statReplayBtn){
      statReplayBtn.addEventListener('click', function(){
        statReplayBtn.classList.add('spin');
        setTimeout(function(){ statReplayBtn.classList.remove('spin'); }, 520);
        runCount();
      });
    }

  } else if (statEl) {
    if (statReplayBtn) statReplayBtn.style.display = 'none';
  }


  // -- A1: sticky mobile CTA bar hides while the real CTA panel is in view,
  // so the page never shows two CTAs at once. --
  var stickyCta = document.getElementById('stickyCta');
  var ctaPanelEl = document.querySelector('.cta-panel');
  if (stickyCta && ctaPanelEl && 'IntersectionObserver' in window){
    var ctaVisIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        stickyCta.classList.toggle('hide', e.isIntersecting);
      });
    }, { threshold: 0.15 });
    ctaVisIO.observe(ctaPanelEl);
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
    d.style.cssText = 'position:fixed;right:20px;bottom:98px;z-index:999998;max-width:250px;background:#141419;color:#F4F4F5;padding:13px 32px 13px 16px;border-radius:16px;border:1px solid rgba(201,168,76,.45);box-shadow:0 12px 28px rgba(0,0,0,.5);font:500 14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;cursor:pointer;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease;';
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
    arrow.style.cssText = 'position:absolute;bottom:-7px;right:26px;width:12px;height:12px;background:#141419;border-right:1px solid rgba(201,168,76,.45);border-bottom:1px solid rgba(201,168,76,.45);transform:rotate(45deg);';
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