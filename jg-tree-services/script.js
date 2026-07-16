(function(){
  // -- SMS thread staged reveal + typing indicators, replayable --
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = { 1: document.getElementById('typing1'), 2: document.getElementById('typing2') };
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  // v2 spec: the reduced-motion fallback must cover JS-driven animation, not just CSS.
  // When reduce is set, every sequence renders its FINAL state immediately: no timers,
  // no typing indicators, no count-up. The change listener handles mid-session toggles.
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
    if (reducedMotion()){ showThreadFinal(); return; }
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
    var seq = [
      { t: 250,  action: function(){ bubbles[0].classList.add('show'); } },
      { t: 850,  action: function(){ bubbles[1].classList.add('show'); } },
      { t: 1500, action: function(){ typers[1].classList.add('show'); } },
      { t: 2400, action: function(){ typers[1].classList.remove('show'); bubbles[2].classList.add('show'); } },
      { t: 3250, action: function(){ bubbles[3].classList.add('show'); } },
      { t: 3850, action: function(){ typers[2].classList.add('show'); } },
      { t: 4750, action: function(){ typers[2].classList.remove('show'); bubbles[4].classList.add('show'); } },
      { t: 5450, action: function(){ bubbles[5].classList.add('show'); playing = false; } }
    ];
    seq.forEach(function(step){ timers.push(setTimeout(step.action, step.t)); });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    playThread();
  });

  // Re-arm on scroll re-entry (v2 spec animation standard: nothing plays once and dies).
  // The observer stays attached for the life of the page: every time the thread
  // scrolls back into view it resets and re-plays. Manual Replay button still works.
  if ('IntersectionObserver' in window){
    var demoIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          playThread();
        } else if (!reducedMotion()){
          // left the viewport: stop any in-flight sequence so re-entry starts clean.
          // Under reduced motion the thread stays fully shown; never re-hide it.
          clearTimers();
          playing = false;
          resetThread();
        }
      });
    }, { threshold: 0.2 }); // 0.2 not 0.35: this build's thread runs taller at 375px,
                            // and the sequence must fire in the first mobile viewport
    demoIO.observe(thread);
  } else {
    playThread();
  }

  // -- Reveal-on-scroll for sections (one-time entrance, allowed by the exemption;
  // never leaves content hidden, honors reduced motion via CSS) --
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
    centsSpan.textContent = ',500';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    // $2,500: the top of the posted band for emergency removal of one large (60 to 80 ft)
    // tree in North Carolina. Source:
    // https://tree-removal-cost-guide.com/emergency-tree-removal-cost/north-carolina
    var STAT_TARGET = 2500;
    var countRun = 0; // increments per run; a stale rAF loop sees the mismatch and stops

    function showStatFinal(){
      countRun++; // kill any in-flight rAF loop
      dollarNode.textContent = '$' + Math.floor(STAT_TARGET / 1000);
      centsSpan.textContent = ',' + String(STAT_TARGET % 1000).padStart(3, '0');
    }

    function runCount(){
      if (reducedMotion()){ showStatFinal(); return; }
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

    // Reduced motion from first paint: show the final figure immediately rather
    // than leaving a partial figure on screen until the section scrolls into view.
    if (reducedMotion()){ showStatFinal(); }

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

    // Mid-session preference toggles: snap everything to final state when
    // reduce turns on; nothing to do when it turns off (next entry re-animates).
    if (motionQuery.addEventListener){
      motionQuery.addEventListener('change', function(){
        if (reducedMotion()){ showStatFinal(); showThreadFinal(); }
      });
    }
  } else if (statEl) {
    // No IntersectionObserver: leave the static $2,500 markup untouched
    if (statReplayBtn) statReplayBtn.style.display = 'none';
  }

  // Reduced motion from first paint: the SMS thread renders fully shown, no sequence.
  if (reducedMotion()){ showThreadFinal(); }

  // -- A1 (v2.1 amendment): sticky mobile CTA bar, hidden while the real CTA panel is
  // in view so the page never shows two CTAs at once. Same booking URL as the page CTA. --
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