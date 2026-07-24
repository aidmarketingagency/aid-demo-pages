(function(){
  // -- SMS thread staged reveal + typing indicators, replayable --
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = Array.prototype.slice.call(thread.querySelectorAll('.typing'));
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  // v2 spec: the reduced-motion fallback must cover JS-driven animation, not just CSS.
  // When reduce is set, every sequence renders its FINAL state immediately: no timers,
  // no typing indicators, no count-up. The change listener handles mid-session toggles.
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reducedMotion(){ return !!motionQuery.matches; }

  function clearTimers(){ timers.forEach(function(t){ clearTimeout(t); }); timers = []; }

  function resetThread(){
    bubbles.forEach(function(b){ b.classList.remove('show'); });
    typers.forEach(function(el){ el.classList.remove('show'); });
  }

  function showThreadFinal(){
    clearTimers();
    playing = false;
    bubbles.forEach(function(b){ b.classList.add('show'); });
    typers.forEach(function(el){ el.classList.remove('show'); });
  }

  function playThread(){
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
    // Generic timeline: walks the thread's children in order, so the bubble
    // count can vary per page without touching this file again.
    var seq = [];
    var t = 250;
    Array.prototype.slice.call(thread.children).forEach(function(node){
      if (node.classList.contains('typing')){
        (function(el){
          seq.push({ t: t, action: function(){ el.classList.add('show'); } });
          t += 900;
          seq.push({ t: t, action: function(){ el.classList.remove('show'); } });
        })(node);
      } else if (node.classList.contains('bubble')){
        (function(el){
          seq.push({ t: t, action: function(){ el.classList.add('show'); } });
        })(node);
        t += 750;
      }
    });
    seq.push({ t: t + 100, action: function(){ playing = false; } });
    seq.forEach(function(step){ timers.push(setTimeout(step.action, step.t)); });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    // Always resets and replays, including mid-play.
    clearTimers();
    playing = false;
    playThread();
  });

  // Autoplay contract (Addendum C):
  // - plays ONCE when the thread is ~15% visible, including already-visible at init
  // - no observer-driven restart while any part of the thread stays visible
  // - re-arms ONLY after the thread has FULLY left the viewport (threshold-0 observer)
  var autoplayArmed = true;

  function autoplayThread(){
    if (!autoplayArmed) return;
    autoplayArmed = false;
    playThread();
  }

  function threadVisibleFraction(){
    var r = thread.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!r.height || !vh) return 0;
    var visiblePx = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    if (visiblePx <= 0) return 0;
    // Measure against the smaller of thread height and viewport height so a
    // thread taller than the viewport can still reach the 15% mark.
    return visiblePx / Math.min(r.height, vh);
  }

  if ('IntersectionObserver' in window){
    var playIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ autoplayThread(); }
      });
    }, { threshold: 0.15 });
    playIO.observe(thread);

    var rearmIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        // Fires only when the thread has fully left the viewport: stop any
        // in-flight sequence, reset, and re-arm so the next entry replays once.
        if (!e.isIntersecting && e.intersectionRatio <= 0){
          clearTimers();
          playing = false;
          resetThread();
          autoplayArmed = true;
        }
      });
    }, { threshold: 0 });
    rearmIO.observe(thread);

    // Already visible at script init: play now (an in-view thread may never
    // produce a crossing event, especially on phone-sized viewports).
    if (threadVisibleFraction() >= 0.15){ autoplayThread(); }
  } else {
    playThread();
  }

  // -- Reveal-on-scroll for sections --
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
  // Re-runs on every scroll re-entry (v2 spec animation standard) and has its own
  // small replay button next to the stat label.
  var statEl = document.querySelector('.stat-number');
  var statReplayBtn = document.getElementById('statReplayBtn');
  if (statEl && 'IntersectionObserver' in window){
    statEl.textContent = '';
    var dollarNode = document.createTextNode('$0');
    var centsSpan = document.createElement('span');
    centsSpan.className = 'cents';
    centsSpan.textContent = ',850';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    // $3,850: the low end of the emergency/storm tree-removal cost band in Central NC.
    // Source: https://lubbersandsons.com/how-much-does-tree-care-cost-in-central-north-carolina/
    var STAT_TARGET = 3850;
    var countRun = 0; // increments per run; a stale rAF loop sees the mismatch and stops

    function showStatFinal(){
      countRun++; // kill any in-flight rAF loop
      dollarNode.textContent = '$' + Math.floor(STAT_TARGET / 1000);
      centsSpan.textContent = ',' + String(STAT_TARGET % 1000).padStart(3, '0');
    }

    function runCount(){
      var runId = ++countRun;
      var dur = 1400;
      var start = null;
      function step(ts){
        if (runId !== countRun) return; // superseded by a newer run
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

    // Reduced motion from first paint: show the final figure immediately rather
    // than leaving $0,850 on screen until the section scrolls into view.

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

    // Mid-session preference toggles: snap everything to final state when
    // reduce turns on; nothing to do when it turns off (next entry re-animates).
  } else if (statEl) {
    // No IntersectionObserver: leave the static $3,850 markup untouched
    if (statReplayBtn) statReplayBtn.style.display = 'none';
  }

  // Reduced motion from first paint: the SMS thread renders fully shown, no sequence.

  // -- A1 (v2.1 amendment): sticky mobile CTA bar, hidden while the real CTA panel is
  // in view so the page never shows two CTAs at once. Same booking URL as the page CTA. --
  var stickyCta = document.getElementById('stickyCta');
  var ctaPanelEl = document.querySelector('.cta-panel');
  if (stickyCta && ctaPanelEl && 'IntersectionObserver' in window){
    var stickyIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        stickyCta.classList.toggle('hide', e.isIntersecting);
      });
    }, { threshold: 0.15 });
    stickyIO.observe(ctaPanelEl);
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
    d.style.cssText = 'position:fixed;right:20px;bottom:98px;z-index:999998;max-width:250px;background:#151a12;color:#f2f4ed;padding:13px 32px 13px 16px;border-radius:16px;border:1px solid rgba(63,156,45,.45);box-shadow:0 12px 28px rgba(0,0,0,.5);font:500 14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;cursor:pointer;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease;';
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
    arrow.style.cssText = 'position:absolute;bottom:-7px;right:26px;width:12px;height:12px;background:#151a12;border-right:1px solid rgba(63,156,45,.45);border-bottom:1px solid rgba(63,156,45,.45);transform:rotate(45deg);';
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