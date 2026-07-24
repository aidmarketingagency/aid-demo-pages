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
    d.style.cssText = 'position:fixed;right:20px;bottom:98px;z-index:999998;max-width:250px;background:#121A14;color:#F3F6F6;padding:13px 32px 13px 16px;border-radius:16px;border:1px solid rgba(71,168,54,.45);box-shadow:0 12px 28px rgba(0,0,0,.5);font:500 14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;cursor:pointer;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease;';
    var txt = document.createElement('p');
    txt.style.cssText = 'margin:0;';
    txt.textContent = "Give your customers AN OFFER they can't refuse! 🎙️";
    var x = document.createElement('button');
    x.type = 'button';
    x.setAttribute('aria-label', 'Dismiss');
    x.textContent = '×';
    x.style.cssText = 'position:absolute;top:2px;right:6px;background:transparent;border:none;color:rgba(243,246,246,.55);font-size:18px;line-height:1;cursor:pointer;padding:2px 4px;';
    x.addEventListener('click', function (e) { e.stopPropagation(); hideTeaser(); });
    var arrow = document.createElement('span');
    arrow.style.cssText = 'position:absolute;bottom:-7px;right:26px;width:12px;height:12px;background:#121A14;border-right:1px solid rgba(71,168,54,.45);border-bottom:1px solid rgba(71,168,54,.45);transform:rotate(45deg);';
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

(function() {
  /* prefers-reduced-motion check -- gates all JS-driven animation */
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- SMS Sequencer ---- */
  var bubbles  = document.querySelectorAll('#thread .bubble');
  var typings  = [document.getElementById('typing1'), document.getElementById('typing2')];
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var demoRun = 0;
  var playing = false;

  function clearAllTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function resetThread() {
    bubbles.forEach(function(b) { b.classList.remove('show'); });
    typings.forEach(function(t) { if(t) t.classList.remove('show'); });
    replayBtn.classList.remove('spin');
  }

  function showThreadFinal() {
    clearAllTimers();
    playing = false;
    bubbles.forEach(function(b) { b.classList.add('show'); });
    typings.forEach(function(t) { if(t) t.classList.remove('show'); });
  }

  function playThread() {
    /* Always restarts from the top: the Replay button must reset and replay even mid-play.
       Under reduce-motion we still stage the sequence -- the CSS kills spatial motion but
       keeps the opacity crossfade, so the demo plays via a clean sequential fade. */
    clearAllTimers();
    resetThread();
    playing = true;
    var run = ++demoRun;
    var seq = [
      [0,   function() { bubbles[0].classList.add('show'); }],
      [900, function() { if(typings[0]) typings[0].classList.add('show'); }],
      [2200,function() { if(typings[0]) typings[0].classList.remove('show'); bubbles[1].classList.add('show'); }],
      [3400,function() { bubbles[2].classList.add('show'); }],
      [4300,function() { if(typings[1]) typings[1].classList.add('show'); }],
      [5600,function() { if(typings[1]) typings[1].classList.remove('show'); bubbles[3].classList.add('show'); playing = false; }],
    ];
    seq.forEach(function(step) {
      var t = setTimeout(function() {
        if (demoRun !== run) return; /* superseded run -- bail */
        step[1]();
      }, step[0]);
      timers.push(t);
    });
  }

  /* Autoplay contract: fire ONCE when the demo panel first becomes visible, including
     when it is already visible at script init. While any part of the panel stays in
     view the observer never restarts it; re-arm ONLY after the panel has FULLY left
     the viewport, so scrolling away and back replays it once per re-entry. The Replay
     button is the only mid-view restart path. */
  var armed = true;

  function autoplayThread() {
    if (!armed) return;
    armed = false;
    playThread();
  }

  function elementVisibleNow(el) {
    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    if (visible <= 0 || rect.height <= 0) return false;
    return (visible / rect.height) >= 0.15 || visible >= vh * 0.15;
  }

  var demoPanel = document.querySelector('.demo-panel');
  if (demoPanel) {
    if ('IntersectionObserver' in window) {
      var demoIO = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) {
            /* Fully out of the viewport (threshold 0): stop, reset, re-arm. */
            clearAllTimers();
            playing = false;
            resetThread();
            armed = true;
          } else if (entry.intersectionRatio >= 0.15) {
            autoplayThread();
          }
        });
      }, {threshold: [0, 0.15, 0.2]});
      demoIO.observe(demoPanel);
      /* Already visible at script init: threshold crossings may never fire. */
      if (elementVisibleNow(demoPanel)) autoplayThread();
    } else {
      playThread();
    }
  }

  replayBtn.addEventListener('click', function() {
    replayBtn.classList.add('spin');
    setTimeout(function() { replayBtn.classList.remove('spin'); }, 600);
    playThread();
  });

  /* ---- Stat counter ---- */
  var statEl = document.querySelector('.stat-number');
  var statReplayBtn = document.getElementById('statReplayBtn');
  var countRun = 0;

  function runCount() {
    /* Count-up is a numeric tally, not a vestibular trigger -- run it under reduce-motion too. */
    var thisRun = ++countRun;
    var target = 7500;
    var duration = 1800;
    var start = null;
    function step(ts) {
      if (countRun !== thisRun) return;
      if (!start) start = ts;
      var prog = Math.min((ts - start) / duration, 1);
      var ease = 1 - Math.pow(1 - prog, 3);
      var val = Math.round(ease * target);
      var formatted = '$' + val.toLocaleString();
      /* split at $ sign for cents coloring */
      var parts = formatted.split(',');
      if (parts.length > 1) {
        statEl.innerHTML = parts[0] + '<span class="cents">,' + parts.slice(1).join(',') + '</span>';
      } else {
        statEl.textContent = formatted;
      }
      if (prog < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var mathSection = document.querySelector('.math');
  if (mathSection) {
    var statIO = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) runCount();
      });
    }, {threshold: 0.3});
    statIO.observe(mathSection);
  }

  if (statReplayBtn) {
    statReplayBtn.addEventListener('click', function() {
      statReplayBtn.classList.add('spin');
      setTimeout(function() { statReplayBtn.classList.remove('spin'); }, 600);
      runCount();
    });
  }

  /* ---- Section reveal (one-time entrance) ---- */
  var reveals = document.querySelectorAll('.reveal');
  if (!reducedMotion.matches) {
    var revealIO = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealIO.unobserve(entry.target);
        }
      });
    }, {threshold: 0.12});
    reveals.forEach(function(el) { revealIO.observe(el); });
  } else {
    reveals.forEach(function(el) { el.classList.add('visible'); });
  }

  /* ---- Mobile CTA bar: hide while real CTA panel is visible ---- */
  var mobileCta = document.getElementById('mobileCta');
  var ctaSection = document.getElementById('ctaSection');
  if (mobileCta && ctaSection) {
    var ctaIO = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          mobileCta.classList.add('hidden');
        } else {
          mobileCta.classList.remove('hidden');
        }
      });
    }, {threshold: 0.1});
    ctaIO.observe(ctaSection);
  }

  /* handle mid-session prefers-reduced-motion toggle */
  reducedMotion.addEventListener('change', function() {
    if (reducedMotion.matches) {
      clearAllTimers();
      bubbles.forEach(function(b) { b.classList.add('show'); });
      if (statEl) statEl.innerHTML = '$7<span class="cents">,500</span>';
      reveals.forEach(function(el) { el.classList.add('visible'); });
    }
  });
})();