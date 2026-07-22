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
    txt.textContent = 'Free demo, your Agent talks and speaks! 🎙️';
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

(function(){
  // Demo doctrine (2026-07-16): the SMS sequencing and stat count-up are CONTENT,
  // not decoration. They always play, for everyone. Only transforms/slides stay
  // gated behind prefers-reduced-motion, and that gating lives in styles.css.
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reducedMotion(){ return !!motionQuery.matches; }

  // =====================================================================
  // SMS THREAD: staged reveal + typing indicators
  // IntersectionObserver re-arms on every scroll re-entry (v2 spec).
  // Exits reset state. Replay button.
  // =====================================================================
  var thread = document.getElementById('thread');
  var b1 = document.getElementById('b1');
  var b2 = document.getElementById('b2');
  var b3 = document.getElementById('b3');
  var b4 = document.getElementById('b4');
  var b5 = document.getElementById('b5');
  var t1 = document.getElementById('typing1');
  var t2 = document.getElementById('typing2');
  var replayBtn = document.getElementById('replayBtn');
  var bubbles = [b1, b2, b3, b4, b5].filter(Boolean);
  var typers = [t1, t2];
  var timers = [];
  var playing = false;

  function clearTimers(){
    timers.forEach(function(id){ clearTimeout(id); });
    timers = [];
  }

  function resetThread(){
    bubbles.forEach(function(b){ b.classList.remove('show'); });
    typers.forEach(function(t){ t.classList.remove('show'); });
  }

  function showThreadFinal(){
    clearTimers();
    playing = false;
    bubbles.forEach(function(b){ b.classList.add('show'); });
    typers.forEach(function(t){ t.classList.remove('show'); });
  }

  function playThread(){
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
    // sequence: c1 -> typing1 -> ai1 -> c2 -> typing2 -> ai2
    var seq = [
      { t: 300,  fn: function(){ b1.classList.add('show'); } },
      { t: 1050, fn: function(){ t1.classList.add('show'); } },
      { t: 2100, fn: function(){ t1.classList.remove('show'); b2.classList.add('show'); } },
      { t: 3000, fn: function(){ b3.classList.add('show'); } },
      { t: 3700, fn: function(){ t2.classList.add('show'); } },
      { t: 4700, fn: function(){ t2.classList.remove('show'); b4.classList.add('show'); } },
      { t: 5600, fn: function(){ if (b5) b5.classList.add('show'); playing = false; } }
    ];
    seq.forEach(function(step){
      timers.push(setTimeout(step.fn, step.t));
    });
  }

  if (replayBtn){
    replayBtn.addEventListener('click', function(){
      replayBtn.classList.add('spin');
      setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
      // Replay always resets and replays, including mid-play.
      clearTimers();
      playing = false;
      playThread();
    });
  }

  // Addendum C sequencer contract (2026-07-16):
  // - autoplay fires ONCE when ~15% of the thread is visible, including already-visible at init
  // - no observer-driven restart while any part of the thread stays visible
  // - re-arm ONLY after the thread has fully left the viewport (isIntersecting false)
  // - the observer never resets mid-play; only the Replay button force-restarts
  if ('IntersectionObserver' in window && thread){
    var armed = true;
    var smsIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting){
          // fully out of the viewport: stop, reset, re-arm for the next entry
          clearTimers();
          playing = false;
          resetThread();
          armed = true;
        } else if (armed && e.intersectionRatio >= 0.15){
          armed = false;
          playThread();
        }
      });
    }, { threshold: [0, 0.15] });
    smsIO.observe(thread);

    // Already visible at script init? Play now; armed=false makes the
    // observer's initial entry for the same state a no-op.
    var initRect = thread.getBoundingClientRect();
    var initVh = window.innerHeight || document.documentElement.clientHeight;
    var initVisible = Math.min(initRect.bottom, initVh) - Math.max(initRect.top, 0);
    if (initRect.height > 0 && initVisible >= initRect.height * 0.15){
      armed = false;
      playThread();
    }
  } else {
    playThread();
  }

  // =====================================================================
  // SECTION REVEALS: .reveal class, once-only (per spec)
  // =====================================================================
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

  // =====================================================================
  // STAT COUNTER: count-up rAF, re-arms on every scroll re-entry.
  // STAT_TARGET = 17187 -- $17,187 avg settlement with PA (catastrophic claims).
  // Source: sill.com -- $17,187 with PA vs $2,029 unrepresented (747% difference).
  // Format: "$17,187" -- dollar sign + thousands + comma + three-digit remainder.
  // =====================================================================
  var STAT_TARGET = 17187;
  var statEl = document.getElementById('statNumber');
  var statReplayBtn = document.getElementById('statReplayBtn');
  var countRun = 0;
  var dollarNode, centsSpan;

  function formatVal(val){
    // Produces e.g. { main:"$17", frac:",187" } for 17187
    if (val < 1000){ return { main: '$' + val, frac: '' }; }
    var thousands = Math.floor(val / 1000);
    var remainder = String(val % 1000).padStart(3, '0');
    return { main: '$' + thousands, frac: ',' + remainder };
  }

  function showStatFinal(){
    if (!dollarNode) return;
    countRun++;
    var f = formatVal(STAT_TARGET);
    dollarNode.textContent = f.main;
    centsSpan.textContent = f.frac;
  }

  function runCount(){
    if (!dollarNode) return;
    var runId = ++countRun;
    var dur = 1500;
    var start = null;
    function step(ts){
      if (runId !== countRun) return; // superseded by newer run
      if (!start) start = ts;
      var progress = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var val = Math.round(eased * STAT_TARGET);
      var f = formatVal(val);
      dollarNode.textContent = f.main;
      centsSpan.textContent = f.frac;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (statEl){
    // Build DOM nodes (no innerHTML for the counter value)
    statEl.innerHTML = '';
    dollarNode = document.createTextNode('$0');
    centsSpan = document.createElement('span');
    centsSpan.className = 'cents';
    centsSpan.textContent = '';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    if ('IntersectionObserver' in window){
      var statIO = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if (e.isIntersecting){ runCount(); }
        });
      }, { threshold: 0.35 });
      statIO.observe(statEl);
    }

    if (statReplayBtn){
      statReplayBtn.addEventListener('click', function(){
        statReplayBtn.classList.add('spin');
        setTimeout(function(){ statReplayBtn.classList.remove('spin'); }, 520);
        runCount();
      });
    }
  }

})();