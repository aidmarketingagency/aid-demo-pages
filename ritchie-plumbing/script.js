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
  // Reduced-motion detection
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reducedMotion(){ return !!motionQuery.matches; }

  // -- SMS thread staged reveal + typing indicators, replayable on each scroll entry --
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = { 1: document.getElementById('typing1'), 2: document.getElementById('typing2') };
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  function clearTimers(){ timers.forEach(function(t){ clearTimeout(t); }); timers = []; }

  function resetThread(){
    bubbles.forEach(function(b){ b.classList.remove('show'); });
    Object.keys(typers).forEach(function(k){ typers[k].classList.remove('show'); });
  }

  function showThreadFinal(){
    clearTimers(); playing = false;
    bubbles.forEach(function(b){ b.classList.add('show'); });
    Object.keys(typers).forEach(function(k){ typers[k].classList.remove('show'); });
  }

  function playThread(){
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
    var seq = [
      { t: 260,  action: function(){ bubbles[0].classList.add('show'); } },
      { t: 900,  action: function(){ bubbles[1].classList.add('show'); } },
      { t: 1500, action: function(){ typers[1].classList.add('show'); } },
      { t: 2400, action: function(){ typers[1].classList.remove('show'); bubbles[2].classList.add('show'); } },
      { t: 3200, action: function(){ bubbles[3].classList.add('show'); } },
      { t: 3800, action: function(){ bubbles[4].classList.add('show'); } },
      { t: 4300, action: function(){ typers[2].classList.add('show'); } },
      { t: 5200, action: function(){ typers[2].classList.remove('show'); bubbles[5].classList.add('show'); } },
      { t: 6000, action: function(){ bubbles[6].classList.add('show'); playing = false; } }
    ];
    seq.forEach(function(step){ timers.push(setTimeout(step.action, step.t)); });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    clearTimers();
    playing = false;
    playThread();
  });

  // Autoplay once when ~15% of the thread is visible (including already-visible
  // at script init). No observer-driven restart while any part stays visible.
  // Re-arm ONLY after the thread has fully left the viewport, so scrolling away
  // and back replays it once per re-entry.
  var PLAY_RATIO = 0.15;
  var armed = true;
  function autoplayThread(){
    if (!armed) return;
    armed = false;
    playThread();
  }
  if ('IntersectionObserver' in window){
    var demoIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting){
          // Fully out of the viewport: quiet reset, then re-arm one replay.
          clearTimers();
          playing = false;
          resetThread();
          armed = true;
        } else if (e.intersectionRatio >= PLAY_RATIO){
          autoplayThread();
        }
      });
    }, { threshold: [0, PLAY_RATIO] });
    demoIO.observe(thread);
    // Already in view at init: play now rather than waiting on observer timing.
    var initRect = thread.getBoundingClientRect();
    var initVh = window.innerHeight || document.documentElement.clientHeight;
    var initVisible = Math.min(initRect.bottom, initVh) - Math.max(initRect.top, 0);
    if (initRect.height > 0 && (initVisible / initRect.height) >= PLAY_RATIO){
      autoplayThread();
    }
  } else {
    playThread();
  }

  // -- Reveal on scroll (one-time, never un-reveals) --
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    var revealIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ e.target.classList.add('visible'); revealIO.unobserve(e.target); }
      });
    }, { threshold: 0.13 });
    reveals.forEach(function(el){ revealIO.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('visible'); });
  }

  // -- Animated stat counter, re-arms on every scroll entry --
  var statEl = document.getElementById('statNumber');
  var statReplayBtn = document.getElementById('statReplayBtn');
  var STAT_TARGET = 1300;

  if (statEl && 'IntersectionObserver' in window){
    // Build DOM nodes so innerHTML is not modified mid-animation
    statEl.textContent = '';
    var dollarNode = document.createTextNode('$0');
    var centsSpan = document.createElement('span');
    centsSpan.className = 'cents';
    centsSpan.textContent = ',000';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    var countRun = 0;

    function showStatFinal(){
      countRun++;
      dollarNode.textContent = '$' + Math.floor(STAT_TARGET / 1000);
      centsSpan.textContent = ',' + String(STAT_TARGET % 1000).padStart(3, '0');
    }

    function runCount(){
      var runId = ++countRun;
      var dur = 1380;
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


  // -- Mobile sticky bar: hide when real CTA is in viewport --
  var stickyBar = document.getElementById('stickyBar');
  var ctaSection = document.getElementById('ctaSection');
  if (stickyBar && ctaSection && 'IntersectionObserver' in window){
    var ctaIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          stickyBar.classList.add('hidden');
        } else {
          stickyBar.classList.remove('hidden');
        }
      });
    }, { threshold: 0.1 });
    ctaIO.observe(ctaSection);
  }

})();