(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // SMS thread staged reveal
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = {
    1: document.getElementById('typing1'),
    2: document.getElementById('typing2')
  };
  var replayBtn = document.getElementById('replayBtn');
  var smsTimers = [];
  var smsPlaying = false;

  function clearSmsTimers() {
    smsTimers.forEach(function (t) { clearTimeout(t); });
    smsTimers = [];
  }

  function resetThread() {
    bubbles.forEach(function (b) { b.classList.remove('show'); });
    Object.keys(typers).forEach(function (k) { typers[k].classList.remove('show'); });
  }

  function playThread() {
    if (smsPlaying) return;
    if (prefersReduced.matches) {
      bubbles.forEach(function (b) { b.classList.add('show'); });
      return;
    }
    smsPlaying = true;
    clearSmsTimers();
    resetThread();
    var seq = [
      { t: 240,  fn: function () { bubbles[0].classList.add('show'); } },
      { t: 900,  fn: function () { typers[1].classList.add('show'); } },
      { t: 1850, fn: function () { typers[1].classList.remove('show'); bubbles[1].classList.add('show'); } },
      { t: 2650, fn: function () { bubbles[2].classList.add('show'); } },
      { t: 3260, fn: function () { typers[2].classList.add('show'); } },
      { t: 4160, fn: function () { typers[2].classList.remove('show'); bubbles[3].classList.add('show'); smsPlaying = false; } }
    ];
    seq.forEach(function (step) {
      smsTimers.push(setTimeout(step.fn, step.t));
    });
  }

  replayBtn.addEventListener('click', function () {
    replayBtn.classList.add('spin');
    setTimeout(function () { replayBtn.classList.remove('spin'); }, 520);
    smsPlaying = false;
    playThread();
  });

  var _smsArmed = true;
  function _autoplaySms() {
    if (!_smsArmed) return;
    _smsArmed = false;
    smsPlaying = false;
    playThread();
  }

  if ('IntersectionObserver' in window) {
    var playIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio >= 0.15) { _autoplaySms(); }
      });
    }, { threshold: 0.18 });
    playIO.observe(thread);

    var rearmIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) {
          clearSmsTimers();
          resetThread();
          smsPlaying = false;
          _smsArmed = true;
        }
      });
    }, { threshold: 0 });
    rearmIO.observe(thread);

    var _r0 = thread.getBoundingClientRect();
    var _vh0 = window.innerHeight || document.documentElement.clientHeight;
    var _vis0 = Math.min(_r0.bottom, _vh0) - Math.max(_r0.top, 0);
    if (_r0.height > 0 && _vis0 / _r0.height >= 0.15) { _autoplaySms(); }
  } else {
    playThread();
  }

  // Animated count-up stat with generation token and re-arm
  var statDollars = document.getElementById('statDollars');
  var statCents = document.getElementById('statCents');
  var statReplayBtn = document.getElementById('statReplayBtn');
  var countRun = 0;

  function runCount() {
    if (prefersReduced.matches) {
      statDollars.textContent = '2';
      statCents.textContent = ',000';
      return;
    }
    var gen = ++countRun;
    var target = 2000;
    var dur = 1500;
    var start = null;
    function step(ts) {
      if (gen !== countRun) return;
      if (!start) start = ts;
      var progress = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var val = Math.round(eased * target);
      var dollars = Math.floor(val / 1000);
      var cents = String(val % 1000).padStart(3, '0');
      statDollars.textContent = dollars;
      statCents.textContent = ',' + cents;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (statReplayBtn) {
    statReplayBtn.addEventListener('click', function () {
      statReplayBtn.classList.add('spin');
      setTimeout(function () { statReplayBtn.classList.remove('spin'); }, 460);
      runCount();
    });
  }

  var countArmed = true;
  if ('IntersectionObserver' in window && document.getElementById('mathSection')) {
    var statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && countArmed) {
          countArmed = false;
          runCount();
        }
        if (!e.isIntersecting) {
          countArmed = true;
          statDollars.textContent = '0';
          statCents.textContent = ',000';
        }
      });
    }, { threshold: 0.3 });
    statIO.observe(document.getElementById('mathSection'));
  } else {
    runCount();
  }

  // prefers-reduced-motion mid-session toggle
  prefersReduced.addEventListener('change', function () {
    if (prefersReduced.matches) {
      clearSmsTimers();
      bubbles.forEach(function (b) { b.classList.add('show'); });
      statDollars.textContent = '2';
      statCents.textContent = ',000';
    }
  });

  // Reveal on scroll
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { revealIO.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }

  // Sticky mobile CTA bar: hide while cta-section is in view
  var stickyCta = document.getElementById('stickyCta');
  var ctaSection = document.getElementById('ctaSection');
  if (stickyCta && ctaSection && 'IntersectionObserver' in window) {
    var ctaIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          stickyCta.style.display = 'none';
          stickyCta.setAttribute('aria-hidden', 'true');
          stickyCta.querySelector('a').setAttribute('tabindex', '-1');
        } else {
          stickyCta.style.display = '';
          stickyCta.setAttribute('aria-hidden', 'false');
          stickyCta.querySelector('a').removeAttribute('tabindex');
        }
      });
    }, { threshold: 0.01 });
    ctaIO.observe(ctaSection);
  }

})();

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