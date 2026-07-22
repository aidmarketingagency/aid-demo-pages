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

(function () {
  'use strict';

  /* prefers-reduced-motion gate */
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── SMS SEQUENCER ───────────────────────────────── */
  var bubbleIds = ['b1', 'b2', 'b3', 'b4'];
  var schedule = [
    { typing: null,       delay: 300  },
    { typing: 'typing1',  typingDur: 1400, delay: 1800 },
    { typing: null,       delay: 3200 },
    { typing: 'typing2',  typingDur: 1500, delay: 5000 },
  ];
  var smsTimers = [];
  var smsRunning = false;

  function resetSMS() {
    smsTimers.forEach(clearTimeout);
    smsTimers = [];
    smsRunning = false;
    bubbleIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.classList.remove('visible', 'static-show'); }
    });
    ['typing1','typing2'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.classList.remove('active'); }
    });
  }

  function showBubbleImmediate() {
    bubbleIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.classList.add('static-show'); }
    });
  }

  function playSMS() {
    if (prefersReduced.matches) { showBubbleImmediate(); return; }
    if (smsRunning) return;
    smsRunning = true;

    schedule.forEach(function (step, i) {
      var bubble = document.getElementById(bubbleIds[i]);

      if (step.typing) {
        var typingEl = document.getElementById(step.typing);
        var tStart = setTimeout(function () {
          if (!smsRunning) return;
          if (typingEl) typingEl.classList.add('active');
        }, step.delay - (step.typingDur || 0));
        smsTimers.push(tStart);
      }

      var tBubble = setTimeout(function () {
        if (!smsRunning) return;
        if (step.typing) {
          var typingEl = document.getElementById(step.typing);
          if (typingEl) typingEl.classList.remove('active');
        }
        if (bubble) bubble.classList.add('visible');
      }, step.delay);
      smsTimers.push(tBubble);
    });
  }

  if ('IntersectionObserver' in window) {
    var demoIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (!prefersReduced.matches) { resetSMS(); playSMS(); }
          else { showBubbleImmediate(); }
        } else {
          if (!prefersReduced.matches) { resetSMS(); }
        }
      });
    }, { threshold: 0.25 });
    var demoPanel = document.getElementById('demo-panel');
    if (demoPanel) demoIO.observe(demoPanel);
  } else {
    showBubbleImmediate();
  }

  var replayBtn = document.getElementById('replay-btn');
  if (replayBtn) {
    replayBtn.addEventListener('click', function () {
      resetSMS();
      setTimeout(playSMS, 80);
    });
  }

  prefersReduced.addEventListener('change', function () {
    if (prefersReduced.matches) { resetSMS(); showBubbleImmediate(); }
  });

  /* ── STAT COUNTER ────────────────────────────────── */
  var statEl = document.getElementById('stat-number');
  var statTarget = 4000;
  var countRun = 0;
  var countRAF = null;

  function runCount() {
    var gen = ++countRun;
    if (countRAF) cancelAnimationFrame(countRAF);
    var start = null;
    var duration = 1800;
    function step(ts) {
      if (gen !== countRun) return;
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      var val = Math.round(ease * statTarget);
      if (statEl) statEl.textContent = val.toLocaleString();
      if (progress < 1) { countRAF = requestAnimationFrame(step); }
      else { if (statEl) statEl.textContent = statTarget.toLocaleString(); }
    }
    countRAF = requestAnimationFrame(step);
  }

  function showStatFinal() {
    if (statEl) statEl.textContent = statTarget.toLocaleString();
  }

  if ('IntersectionObserver' in window) {
    var statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (prefersReduced.matches) { showStatFinal(); } else { runCount(); }
        }
      });
    }, { threshold: 0.4 });
    var statBlock = document.getElementById('stat-block');
    if (statBlock) statIO.observe(statBlock);
  } else {
    showStatFinal();
  }

  var statReplayBtn = document.getElementById('stat-replay-btn');
  if (statReplayBtn) {
    statReplayBtn.addEventListener('click', function () {
      if (prefersReduced.matches) { showStatFinal(); return; }
      if (statEl) statEl.textContent = '0';
      setTimeout(runCount, 80);
    });
  }

  prefersReduced.addEventListener('change', function () {
    if (prefersReduced.matches) { showStatFinal(); }
  });

  /* ── SCROLL REVEAL ───────────────────────────────── */
  if ('IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) {
      if (prefersReduced.matches) { el.classList.add('revealed'); }
      else { revealIO.observe(el); }
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ── STICKY MOBILE CTA ───────────────────────────── */
  var mobileCTA = document.getElementById('mobile-cta-bar');
  var ctaMain = document.getElementById('cta-main');
  if (mobileCTA && ctaMain && 'IntersectionObserver' in window) {
    var ctaIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { mobileCTA.classList.add('hidden'); }
        else { mobileCTA.classList.remove('hidden'); }
      });
    }, { threshold: 0.1 });
    ctaIO.observe(ctaMain);
  }

})();