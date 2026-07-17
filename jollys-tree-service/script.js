(function(){
  // -- SMS thread staged reveal + typing indicators, replayable --
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = { 1: document.getElementById('typing1'), 2: document.getElementById('typing2') };
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  // Demo doctrine (2026-07-16): the SMS sequencing and stat count-up are CONTENT,
  // not decoration. They always play, for everyone. Only transforms/slides stay
  // gated behind prefers-reduced-motion, and that gating lives in styles.css.
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reducedMotion(){ return !!motionQuery.matches; }

  function clearTimers(){ timers.forEach(function(t){ clearTimeout(t); }); timers = []; }

  function resetThread(){
    bubbles.forEach(function(b){ b.classList.remove('show'); });
    Object.keys(typers).forEach(function(k){ typers[k].classList.remove('show'); });
  }

  function showThreadFinal(){
    clearTimers();
    playing = false;
    bubbles.forEach(function(b){ b.classList.add('show'); });
    Object.keys(typers).forEach(function(k){ typers[k].classList.remove('show'); });
  }

  function playThread(){
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
    var seq = [
      { t: 250,  action: function(){ bubbles[0].classList.add('show'); } },
      { t: 950,  action: function(){ typers[1].classList.add('show'); } },
      { t: 1900, action: function(){ typers[1].classList.remove('show'); bubbles[1].classList.add('show'); } },
      { t: 2700, action: function(){ bubbles[2].classList.add('show'); } },
      { t: 3300, action: function(){ typers[2].classList.add('show'); } },
      { t: 4200, action: function(){ typers[2].classList.remove('show'); bubbles[3].classList.add('show'); } },
      { t: 5100, action: function(){ if (bubbles[4]) bubbles[4].classList.add('show'); playing = false; } }
    ];
    seq.forEach(function(step){ timers.push(setTimeout(step.action, step.t)); });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    // Replay always resets and replays, including mid-play.
    clearTimers();
    playing = false;
    playThread();
  });

  // Addendum C sequencer contract (2026-07-16):
  // - autoplay fires ONCE when ~15% of the thread is visible, including already-visible at init
  // - no observer-driven restart while any part of the thread stays visible
  // - re-arm ONLY after the thread has fully left the viewport (isIntersecting false)
  // - the observer never resets mid-play; only the Replay button force-restarts
  if ('IntersectionObserver' in window){
    var armed = true;
    var demoIO = new IntersectionObserver(function(entries){
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
    demoIO.observe(thread);

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
  // Re-runs on every scroll re-entry (v2 spec animation standard) and has its own
  // small replay button next to the stat label.
  var statEl = document.querySelector('.stat-number');
  var statReplayBtn = document.getElementById('statReplayBtn');
  if (statEl && 'IntersectionObserver' in window){
    statEl.textContent = '';
    var dollarNode = document.createTextNode('$0');
    var centsSpan = document.createElement('span');
    centsSpan.className = 'cents';
    centsSpan.textContent = ',850';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    // $3,850: the low end of the storm-response tree-removal cost band in North Carolina.
    // Source: https://tree-removal-cost-guide.com/emergency-tree-removal-cost/north-carolina
    var STAT_TARGET = 3850;
    var countRun = 0; // increments per run; a stale rAF loop sees the mismatch and stops

    function showStatFinal(){
      countRun++; // kill any in-flight rAF loop
      dollarNode.textContent = '$' + Math.floor(STAT_TARGET / 1000);
      centsSpan.textContent = ',' + String(STAT_TARGET % 1000).padStart(3, '0');
    }

    function runCount(){
      var runId = ++countRun;
      var dur = 1400;
      var start = null;
      function step(ts){
        if (runId !== countRun) return; // superseded by a newer run
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
    // No IntersectionObserver: leave the static $3,850 markup untouched
    if (statReplayBtn) statReplayBtn.style.display = 'none';
  }

  // -- A1: sticky mobile CTA bar, hidden while the real CTA panel is in view so the page
  // never shows two CTAs at once. Same booking URL as the page CTA. --
  var stickyCta = document.getElementById('stickyCta');
  var ctaPanelEl = document.querySelector('.cta-panel');
  if (stickyCta && ctaPanelEl && 'IntersectionObserver' in window){
    var stickyIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        stickyCta.classList.toggle('hide', e.isIntersecting);
      });
    }, { threshold: 0.15 });
    stickyIO.observe(ctaPanelEl);
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