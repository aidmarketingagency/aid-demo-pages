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
    d.style.cssText = 'position:fixed;right:20px;bottom:98px;z-index:999998;max-width:250px;background:#141419;color:#F4F4F5;padding:13px 32px 13px 16px;border-radius:16px;border:1px solid rgba(201,148,58,.45);box-shadow:0 12px 28px rgba(0,0,0,.5);font:500 14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;cursor:pointer;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease;';
    var txt = document.createElement('p');
    txt.style.cssText = 'margin:0;';
    txt.textContent = "Give your customers AN OFFER they can't refuse! 🎤";
    var x = document.createElement('button');
    x.type = 'button';
    x.setAttribute('aria-label', 'Dismiss');
    x.textContent = '×';
    x.style.cssText = 'position:absolute;top:2px;right:6px;background:transparent;border:none;color:rgba(244,244,245,.55);font-size:18px;line-height:1;cursor:pointer;padding:2px 4px;';
    x.addEventListener('click', function (e) { e.stopPropagation(); hideTeaser(); });
    var arrow = document.createElement('span');
    arrow.style.cssText = 'position:absolute;bottom:-7px;right:26px;width:12px;height:12px;background:#141419;border-right:1px solid rgba(201,148,58,.45);border-bottom:1px solid rgba(201,148,58,.45);transform:rotate(45deg);';
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
  /* ============================================================
     SMS THREAD staged reveal + typing indicators, replayable.
     Re-arms on scroll re-entry per animation standard (v2 spec:
     nothing plays once and dies). Uses a run-counter to kill
     stale in-flight sequences when the panel exits the viewport.
  ============================================================ */
  var thread = document.getElementById('thread');
  var bubbles = [
    document.getElementById('b0'),
    document.getElementById('b1'),
    document.getElementById('b2'),
    document.getElementById('b3')
  ];
  var t1 = document.getElementById('typing1');
  var t2 = document.getElementById('typing2');
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;
  var seqGen = 0; // generation counter — stale timeouts check this and bail

  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reducedMotion(){ return !!motionQuery.matches; }

  function clearTimers(){ timers.forEach(function(t){ clearTimeout(t); }); timers = []; }

  function resetThread(){
    bubbles.forEach(function(b){ b.classList.remove('show'); });
    t1.classList.remove('show');
    t2.classList.remove('show');
  }

  function showThreadFinal(){
    clearTimers(); seqGen++; playing = false;
    bubbles.forEach(function(b){ b.classList.add('show'); });
    t1.classList.remove('show');
    t2.classList.remove('show');
  }

  function playThread(){
    if (reducedMotion()){ showThreadFinal(); return; }
    if (playing) return;
    playing = true;
    var gen = ++seqGen;
    clearTimers();
    resetThread();

    function at(ms, fn){
      timers.push(setTimeout(function(){
        if (seqGen !== gen) return; // superseded
        fn();
      }, ms));
    }

    at(260,  function(){ bubbles[0].classList.add('show'); });
    at(1000, function(){ t1.classList.add('show'); });
    at(2000, function(){ t1.classList.remove('show'); bubbles[1].classList.add('show'); });
    at(2900, function(){ bubbles[2].classList.add('show'); });
    at(3550, function(){ t2.classList.add('show'); });
    at(4600, function(){ t2.classList.remove('show'); bubbles[3].classList.add('show'); playing = false; });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    playing = false;
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    playThread();
  });

  /* Re-arm on every scroll re-entry; reset and cancel in-flight on exit */
  if ('IntersectionObserver' in window){
    var demoIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          playThread();
        } else if (!reducedMotion()){
          clearTimers(); seqGen++; playing = false;
          resetThread();
        }
      });
    }, { threshold: 0.3 });
    demoIO.observe(thread);
  } else {
    playThread();
  }

  /* ============================================================
     REVEAL-ON-SCROLL for sections (plays once, never hides content)
  ============================================================ */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    var revealIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          e.target.classList.add('visible');
          revealIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function(el){ revealIO.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('visible'); });
  }

  /* ============================================================
     ANIMATED STAT COUNTER — re-arms on every scroll re-entry,
     manual replay button, prefers-reduced-motion fallback.
     Stat: $4,500 — conservative midpoint for a crane emergency
     removal in NC (source in HTML comment above THE MATH section).
  ============================================================ */
  var statEl = document.getElementById('statNum');
  var statReplayBtn = document.getElementById('statReplayBtn');

  if (statEl && 'IntersectionObserver' in window){
    // Build DOM nodes so we never clobber the cents span
    statEl.textContent = '';
    var dollarNode = document.createTextNode('$0');
    var centsSpan = document.createElement('span');
    centsSpan.className = 'cents';
    centsSpan.textContent = ',000';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    var STAT_TARGET = 4500;
    var countRun = 0;

    function showStatFinal(){
      countRun++;
      dollarNode.textContent = '$' + Math.floor(STAT_TARGET / 1000);
      centsSpan.textContent = ',' + String(STAT_TARGET % 1000).padStart(3, '0');
    }

    function runCount(){
      if (reducedMotion()){ showStatFinal(); return; }
      var runId = ++countRun;
      var dur = 1350;
      var start = null;
      function step(ts){
        if (runId !== countRun) return;
        if (!start) start = ts;
        var progress = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var val = Math.round(eased * STAT_TARGET);
        dollarNode.textContent = '$' + Math.floor(val / 1000);
        centsSpan.textContent = ',' + String(val % 1000).padStart(3, '0');
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (reducedMotion()){ showStatFinal(); }

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

    if (motionQuery.addEventListener){
      motionQuery.addEventListener('change', function(){
        if (reducedMotion()){ showStatFinal(); showThreadFinal(); }
      });
    }
  } else if (statEl){
    if (statReplayBtn) statReplayBtn.style.display = 'none';
  }

  if (reducedMotion()){ showThreadFinal(); }

  /* ============================================================
     STICKY MOBILE CTA BAR — hide while real CTA panel is in view
  ============================================================ */
  var mobileCta = document.getElementById('mobileCta');
  var ctaPanel = document.getElementById('ctaPanel');
  if (mobileCta && ctaPanel && 'IntersectionObserver' in window){
    var ctaIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        mobileCta.classList.toggle('hide', e.isIntersecting);
      });
    }, { threshold: 0.1 });
    ctaIO.observe(ctaPanel);
  }

})();