(function(){
  // -- SMS thread staged reveal + typing indicators, replayable --
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = Array.prototype.slice.call(thread.querySelectorAll('.typing'));
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  // 2026-07-16 doctrine: the SMS thread sequencing and the stat count-up are CONTENT,
  // not decoration. They always play on the same timeline; reduced motion only strips
  // transforms/transitions/pulses (handled in CSS).
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reducedMotion(){ return !!motionQuery.matches; }

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
  var statEl = document.querySelector('.stat-number');
  var statReplayBtn = document.getElementById('statReplayBtn');
  if (statEl && 'IntersectionObserver' in window){
    statEl.textContent = '';
    var dollarNode = document.createTextNode('$0');
    var centsSpan = document.createElement('span');
    centsSpan.className = 'cents';
    centsSpan.textContent = ',200';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    // $1,200: top of the published $600-$1,200/year quarterly residential account range.
    // Source: https://www.voicecharm.ai/blog/pest-control-missed-calls (see THE MATH comment block)
    var STAT_TARGET = 1200;
    var countRun = 0;

    function showStatFinal(){
      countRun++;
      dollarNode.textContent = '$' + Math.floor(STAT_TARGET / 1000);
      centsSpan.textContent = ',' + String(STAT_TARGET % 1000).padStart(3, '0');
    }

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
        var dollars = Math.floor(val / 1000);
        var cents = String(val % 1000).padStart(3, '0');
        dollarNode.textContent = '$' + dollars;
        centsSpan.textContent = ',' + cents;
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

  // -- Sticky mobile CTA bar (A1): hide it while the real CTA panel is in view so the
  // page never shows two CTAs at once. Same URL, one ask, mobile affordance.
  var mobileCtaBar = document.getElementById('mobileCtaBar');
  var ctaPanel = document.querySelector('.cta-panel');
  if (mobileCtaBar && ctaPanel && 'IntersectionObserver' in window){
    var ctaBarIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ mobileCtaBar.classList.add('is-hidden'); }
        else { mobileCtaBar.classList.remove('is-hidden'); }
      });
    }, { threshold: 0.1 });
    ctaBarIO.observe(ctaPanel);
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