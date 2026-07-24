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
    d.style.cssText = 'position:fixed;right:20px;bottom:98px;z-index:999998;max-width:250px;background:#141419;color:#F4F4F5;padding:13px 32px 13px 16px;border-radius:16px;border:1px solid rgba(74,144,217,.45);box-shadow:0 12px 28px rgba(0,0,0,.5);font:500 14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;cursor:pointer;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease;';
    var txt = document.createElement('p');
    txt.style.cssText = 'margin:0;';
    txt.textContent = "Give your customers AN OFFER they can't refuse! \uD83C\uDFA4";
    var x = document.createElement('button');
    x.type = 'button';
    x.setAttribute('aria-label', 'Dismiss');
    x.textContent = '\u00D7';
    x.style.cssText = 'position:absolute;top:2px;right:6px;background:transparent;border:none;color:rgba(244,244,245,.55);font-size:18px;line-height:1;cursor:pointer;padding:2px 4px;';
    x.addEventListener('click', function (e) { e.stopPropagation(); hideTeaser(); });
    var arrow = document.createElement('span');
    arrow.style.cssText = 'position:absolute;bottom:-7px;right:26px;width:12px;height:12px;background:#141419;border-right:1px solid rgba(74,144,217,.45);border-bottom:1px solid rgba(74,144,217,.45);transform:rotate(45deg);';
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
     SMS thread: staged reveal, typing indicators, replayable.
     Re-arms on every scroll re-entry (v2 spec animation standard).
     prefers-reduced-motion: renders final state immediately, no timers.
  ============================================================ */
  var thread = document.getElementById('thread');
  var bubbles = [
    document.getElementById('b0'),
    document.getElementById('b1'),
    document.getElementById('b2'),
    document.getElementById('b3')
  ];
  var typers = {
    1: document.getElementById('typing1'),
    2: document.getElementById('typing2')
  };
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reducedMotion(){ return !!motionQuery.matches; }

  function clearTimers(){ timers.forEach(function(t){ clearTimeout(t); }); timers = []; }

  function resetThread(){
    bubbles.forEach(function(b){ b.classList.remove('show'); });
    typers[1].classList.remove('show');
    typers[2].classList.remove('show');
  }

  function showThreadFinal(){
    clearTimers();
    playing = false;
    bubbles.forEach(function(b){ b.classList.add('show'); });
    typers[1].classList.remove('show');
    typers[2].classList.remove('show');
  }

  function playThread(){
    if (reducedMotion()){ showThreadFinal(); return; }
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
    var seq = [
      { t: 260,  fn: function(){ bubbles[0].classList.add('show'); } },
      { t: 980,  fn: function(){ typers[1].classList.add('show'); } },
      { t: 1980, fn: function(){ typers[1].classList.remove('show'); bubbles[1].classList.add('show'); } },
      { t: 2820, fn: function(){ bubbles[2].classList.add('show'); } },
      { t: 3440, fn: function(){ typers[2].classList.add('show'); } },
      { t: 4400, fn: function(){ typers[2].classList.remove('show'); bubbles[3].classList.add('show'); playing = false; } }
    ];
    seq.forEach(function(step){
      timers.push(setTimeout(step.fn, step.t));
    });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    playing = false;
    playThread();
  });

  /* Autoplay contract (v2, matches jg-tree-services/charlotte-pest): fires ONCE when the
     thread first becomes ~15-18% visible, including already-visible at script init. No
     restart while any part of the thread stays in view; re-arm ONLY after it has fully
     left the viewport, so scrolling away and back replays it once per re-entry. */
  var armed = true;

  function autoplayThread(){
    if (!armed) return;
    armed = false;
    playThread();
  }

  if ('IntersectionObserver' in window){
    var playIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting && e.intersectionRatio >= 0.15){ autoplayThread(); }
      });
    }, { threshold: 0.18 });
    playIO.observe(thread);

    var rearmIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting && !reducedMotion()){
          clearTimers();
          playing = false;
          resetThread();
          armed = true;
        }
      });
    }, { threshold: 0 });
    rearmIO.observe(thread);

    // Already visible at script init: play now instead of waiting on an entry.
    var initRect = thread.getBoundingClientRect();
    var initVh = window.innerHeight || document.documentElement.clientHeight;
    var initVisible = Math.min(initRect.bottom, initVh) - Math.max(initRect.top, 0);
    if (initRect.height > 0 && initVisible / initRect.height >= 0.15){ autoplayThread(); }
  } else {
    playThread();
  }

  /* ============================================================
     Section reveal-on-scroll
  ============================================================ */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    var revealIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ e.target.classList.add('visible'); revealIO.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function(el){ revealIO.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('visible'); });
  }

  /* ============================================================
     Animated stat counter: count-up to 1000, re-runs on scroll re-entry.
     Framing: one missed burst-pipe call -> $1,000-$8,000+ in water damage.
     Stat anchors to $1,000 (the low end of the sourced remediation range) so
     the claim is conservative and verifiable; the copy explains the full range.
  ============================================================ */
  var statEl = document.getElementById('statNumber');
  var statReplayBtn = document.getElementById('statReplayBtn');
  if (statEl){
    /* Build DOM nodes so innerHTML is never touched mid-animation */
    statEl.textContent = '';
    var dollarNode = document.createTextNode('$0');
    var centsSpan = document.createElement('span');
    centsSpan.className = 'cents';
    centsSpan.textContent = ',000';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    var STAT_TARGET = 1000; /* sourced low end: $1,000-$8,000+ water damage remediation */
    var countRun = 0;

    function showStatFinal(){
      countRun++;
      dollarNode.textContent = '$' + STAT_TARGET.toLocaleString().split(',')[0];
      centsSpan.textContent = ',' + String(STAT_TARGET % 1000).padStart(3, '0');
    }

    function runCount(){
      if (reducedMotion()){ showStatFinal(); return; }
      var runId = ++countRun;
      var dur = 1200;
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

    if ('IntersectionObserver' in window){
      var statIO = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if (e.isIntersecting){ runCount(); }
        });
      }, { threshold: 0.35 });
      statIO.observe(statEl);
    } else {
      showStatFinal();
    }

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
  }

  if (reducedMotion()){ showThreadFinal(); }

  /* ============================================================
     A1: sticky mobile CTA hides while real CTA panel is in view
  ============================================================ */
  var stickyCta = document.getElementById('stickyCta');
  var ctaSection = document.getElementById('ctaSection');
  if (stickyCta && ctaSection && 'IntersectionObserver' in window){
    var ctaIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          stickyCta.classList.add('hidden');
        } else {
          stickyCta.classList.remove('hidden');
        }
      });
    }, { threshold: 0.1 });
    ctaIO.observe(ctaSection);
  }

})();