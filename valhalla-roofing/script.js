(function(){
  // -- SMS thread staged reveal + typing indicators, replayable, re-arms on re-entry --
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = [document.getElementById('typing1'), document.getElementById('typing2')];
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  // Doctrine 2026-07-16: the SMS sequence and stat count-up are demo CONTENT and always
  // play, even under prefers-reduced-motion. Only transforms, slides, and transitions
  // stay gated behind reduced motion, and the CSS media block handles that.

  function clearTimers(){ timers.forEach(function(t){ clearTimeout(t); }); timers = []; }

  function resetThread(){
    bubbles.forEach(function(b){ b.classList.remove('show'); });
    typers.forEach(function(t){ t.classList.remove('show'); });
  }

  function playThread(){
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
    var seq = [
      { t: 300,  action: function(){ bubbles[0].classList.add('show'); } },
      { t: 950,  action: function(){ bubbles[1].classList.add('show'); } },
      { t: 1550, action: function(){ typers[0].classList.add('show'); } },
      { t: 2450, action: function(){ typers[0].classList.remove('show'); bubbles[2].classList.add('show'); } },
      { t: 3250, action: function(){ bubbles[3].classList.add('show'); } },
      { t: 3850, action: function(){ typers[1].classList.add('show'); } },
      { t: 4750, action: function(){ typers[1].classList.remove('show'); bubbles[4].classList.add('show'); } },
      { t: 5550, action: function(){ bubbles[5].classList.add('show'); playing = false; } }
    ];
    seq.forEach(function(step){ timers.push(setTimeout(step.action, step.t)); });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    playing = false;
    clearTimers();
    playThread();
  });

  // Sequencer contract (Addendum C): autoplay ONCE when ~15% of the thread is visible,
  // including when it is already visible at script init. No observer-driven restart while
  // any part of the thread stays in view (bubble layout shifts must not churn a replay).
  // Re-arm ONLY after the thread has FULLY left the viewport (threshold-0 observer), so
  // scrolling away and back replays it once per re-entry. The observer never resets
  // mid-play; only the Replay button interrupts a run.
  if ('IntersectionObserver' in window){
    var armed = true;
    var tryAutoplay = function(){
      if (!armed) return;
      armed = false;
      playThread();
    };

    // Play trigger: fires when ~15% of the thread becomes visible. Consumes the armed state.
    var playIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting && e.intersectionRatio >= 0.15){ tryAutoplay(); }
      });
    }, { threshold: 0.15 });
    playIO.observe(thread);

    // Re-arm trigger: only when the thread has fully left the viewport (ratio 0).
    var rearmIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting){
          clearTimers();
          playing = false;
          resetThread();
          armed = true;
        }
      });
    }, { threshold: 0 });
    rearmIO.observe(thread);

    // Already visible at init: observer callbacks are async and may not report a crossing,
    // so check the rect directly and play if ~15% of the thread is on screen.
    var initRect = thread.getBoundingClientRect();
    var viewH = window.innerHeight || document.documentElement.clientHeight;
    var visiblePx = Math.min(initRect.bottom, viewH) - Math.max(initRect.top, 0);
    if (initRect.height > 0 && visiblePx > 0 && (visiblePx / initRect.height) >= 0.15){
      tryAutoplay();
    }
  } else {
    playThread();
  }

  // -- Reveal-on-scroll for sections (one-time entrance, never leaves content hidden) --
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

  // -- Animated counter for the stat number (DOM nodes, generation token, re-arms) --
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

    // $12,000: national average insurance payout for a hail-damaged roof.
    // Re-verified 2026-07-16; see THE MATH comment block for the source list.
    var STAT_TARGET = 12000;
    var countRun = 0;

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
        dollarNode.textContent = '$' + Math.floor(val / 1000);
        centsSpan.textContent = ',' + String(val % 1000).padStart(3, '0');
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

  // -- A1: tuck the sticky mobile bar while the real CTA panel (or footer) is on screen --
  var mobileCta = document.getElementById('mobileCta');
  var ctaPanel = document.getElementById('ctaPanel');
  var footerEl = document.querySelector('footer');
  if (mobileCta && 'IntersectionObserver' in window){
    var inView = { cta: false, foot: false };
    function updateBar(){
      if (inView.cta || inView.foot){ mobileCta.classList.add('tucked'); }
      else { mobileCta.classList.remove('tucked'); }
    }
    var barIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.target === ctaPanel) inView.cta = e.isIntersecting;
        if (e.target === footerEl) inView.foot = e.isIntersecting;
      });
      updateBar();
    }, { threshold: 0.12 });
    if (ctaPanel) barIO.observe(ctaPanel);
    if (footerEl) barIO.observe(footerEl);
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