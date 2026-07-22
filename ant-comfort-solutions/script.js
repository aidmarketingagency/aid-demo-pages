(function () {
  var BUBBLE_ID = 'ultra-fast-widget-bubble-54722168';
  var KEY = 'aidDemoWidgetAutoOpened';
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}
  var userTouched = false;
  document.addEventListener('click', function (e) {
    if (e.isTrusted && e.target && e.target.closest && e.target.closest('#' + BUBBLE_ID)) { userTouched = true; }
  }, true);
  var tries = 0;
  var t = setInterval(function () {
    tries += 1;
    var b = document.getElementById(BUBBLE_ID);
    if (b && tries >= 7) {
      clearInterval(t);
      if (!userTouched) { b.click(); }
      try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    }
    if (tries > 30) { clearInterval(t); }
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