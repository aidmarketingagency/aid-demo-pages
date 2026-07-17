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

(function(){
  // =====================================================================
  // Motion preference. 2026-07-16 doctrine: the SMS thread sequencing and
  // the stat count-up are CONTENT, not decoration. They always play on the
  // same timeline; reduced motion only strips transforms/transitions (CSS).
  // =====================================================================
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reducedMotion(){ return !!motionQuery.matches; }

  // =====================================================================
  // SMS THREAD: staged reveal + typing indicators, re-armed on scroll re-entry
  // (v2 spec animation standard: nothing plays once and dies)
  // =====================================================================
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = Array.prototype.slice.call(thread.querySelectorAll('.typing'));
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  function clearTimers(){ timers.forEach(function(t){ clearTimeout(t); }); timers = []; }

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
    // Generic sequencer: walks the thread's children in DOM order so the
    // conversation can be any length. Typing indicators flash briefly
    // before the AI bubble that follows them.
    var at = 300;
    Array.prototype.forEach.call(thread.children, function(el){
      if (el.classList.contains('typing')){
        (function(el, t){
          timers.push(setTimeout(function(){ el.classList.add('show'); }, t));
          timers.push(setTimeout(function(){ el.classList.remove('show'); }, t + 850));
        })(el, at);
        at += 850;
      } else if (el.classList.contains('bubble')){
        (function(el, t){
          timers.push(setTimeout(function(){ el.classList.add('show'); }, t));
        })(el, at);
        at += el.classList.contains('ai') ? 750 : 620;
      }
    });
    timers.push(setTimeout(function(){ playing = false; }, at));
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    playing = false;
    playThread();
  });

  // Autoplay contract (2026-07-16): fire ONCE when ~15% of the thread is visible
  // (including already-visible at script init), never observer-restart while any
  // part stays in view, re-arm ONLY after the thread has FULLY left the viewport.
  function threadVisibleFraction(){
    var r = thread.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    return r.height > 0 ? Math.max(0, visible) / r.height : 0;
  }

  if ('IntersectionObserver' in window){
    var armed = true;
    var demoIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting){
          // Fully out of the viewport: reset clean, re-arm for ONE replay on re-entry.
          armed = true;
          clearTimers();
          playing = false;
          resetThread();
        } else if (armed && e.intersectionRatio >= 0.15){
          armed = false;
          playThread();
        }
        // Partially visible while disarmed: do nothing. Mid-play scrolls and
        // bubble-driven layout shifts must never reset or restart the thread.
      });
    }, { threshold: [0, 0.15] });
    demoIO.observe(thread);
    // Already visible at script init (thread above the fold or page restored
    // mid-scroll): play now instead of waiting for a crossing that never comes.
    if (armed && threadVisibleFraction() >= 0.15){
      armed = false;
      playThread();
    }
  } else {
    playThread();
  }

  // =====================================================================
  // STAT COUNTER: count-up with rAF, runCount/countRun pattern,
  // re-arms on scroll re-entry (v2 spec), statReplayBtn
  // =====================================================================
  // STAT_TARGET = 550 (after-hours HVAC emergency ticket, summer weeknight)
  // Source: hvaccalculatorhub.com/blog/hvac-service-call-costs-2026 ($450-$600 avg)
  var STAT_TARGET = 550;
  var statEl = document.getElementById('statNumber');
  var statWhole = document.getElementById('statWhole');
  var statCents = document.getElementById('statCents');
  var statReplayBtn = document.getElementById('statReplayBtn');
  var countRun = 0;

  function showStatFinal(){
    countRun++;
    statWhole.textContent = STAT_TARGET.toString();
    if (statCents) statCents.textContent = '';
  }

  function runCount(){
    var runId = ++countRun;
    var dur = 1400;
    var start = null;
    function step(ts){
      if (runId !== countRun) return; // superseded
      if (!start) start = ts;
      var progress = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var val = Math.round(eased * STAT_TARGET);
      statWhole.textContent = val.toString();
      if (statCents) statCents.textContent = '';
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (statEl && 'IntersectionObserver' in window){
    var statIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ runCount(); }
      });
    }, { threshold: 0.4 });
    statIO.observe(statEl);
  }

  if (statReplayBtn){
    statReplayBtn.addEventListener('click', function(){
      statReplayBtn.classList.add('spin');
      setTimeout(function(){ statReplayBtn.classList.remove('spin'); }, 520);
      runCount();
    });
  }

  // =====================================================================
  // REVEAL ON SCROLL: one-time entrance reveals
  // (v2 spec: must never leave content hidden)
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
  // A1: Sticky mobile CTA -- hide when real CTA panel is in view
  // =====================================================================
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