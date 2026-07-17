(function(){
  // -- SMS thread staged reveal + typing indicators, replayable --
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = { 1: document.getElementById('typing1'), 2: document.getElementById('typing2') };
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  // Doctrine 2026-07-16: the SMS sequence and stat count-up are demo CONTENT and always
  // play, even under prefers-reduced-motion. Only transforms, slides, and transitions
  // stay gated behind reduced motion, and the CSS media block handles that.

  function clearTimers(){ timers.forEach(function(t){ clearTimeout(t); }); timers = []; }

  function resetThread(){
    bubbles.forEach(function(b){ b.classList.remove('show'); });
    Object.keys(typers).forEach(function(k){ typers[k].classList.remove('show'); });
  }

  function playThread(){
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
    var seq = [
      { t: 250,  action: function(){ bubbles[0].classList.add('show'); } },
      { t: 900,  action: function(){ bubbles[1].classList.add('show'); } },
      { t: 1500, action: function(){ typers[1].classList.add('show'); } },
      { t: 2400, action: function(){ typers[1].classList.remove('show'); bubbles[2].classList.add('show'); } },
      { t: 3200, action: function(){ bubbles[3].classList.add('show'); } },
      { t: 3800, action: function(){ typers[2].classList.add('show'); } },
      { t: 4700, action: function(){ typers[2].classList.remove('show'); bubbles[4].classList.add('show'); } },
      { t: 5500, action: function(){ bubbles[5].classList.add('show'); playing = false; } }
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
    centsSpan.textContent = ',000';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    // $12,000: national average insurance payout for a hail-damaged roof.
    // Source: https://skylightroofing.com/average-insurance-payout-hail/ (see THE MATH comment block)
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
})();