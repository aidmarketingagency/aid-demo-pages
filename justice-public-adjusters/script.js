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
  // prefers-reduced-motion query -- used throughout for both CSS-driven and JS-driven animation
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reducedMotion(){ return !!motionQuery.matches; }

  // =====================================================================
  // SMS THREAD: staged reveal + typing indicators
  // IntersectionObserver re-arms on every scroll re-entry (v2 spec).
  // Exits reset state. Replay button. prefers-reduced-motion shows final state.
  // =====================================================================
  var thread = document.getElementById('thread');
  var b1 = document.getElementById('b1');
  var b2 = document.getElementById('b2');
  var b3 = document.getElementById('b3');
  var b4 = document.getElementById('b4');
  var t1 = document.getElementById('typing1');
  var t2 = document.getElementById('typing2');
  var replayBtn = document.getElementById('replayBtn');
  var bubbles = [b1, b2, b3, b4];
  var typers = [t1, t2];
  var timers = [];
  var playing = false;

  function clearTimers(){
    timers.forEach(function(id){ clearTimeout(id); });
    timers = [];
  }

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
    if (reducedMotion()){ showThreadFinal(); return; }
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
    // sequence: c1 -> typing1 -> ai1 -> c2 -> typing2 -> ai2
    var seq = [
      { t: 300,  fn: function(){ b1.classList.add('show'); } },
      { t: 1050, fn: function(){ t1.classList.add('show'); } },
      { t: 2100, fn: function(){ t1.classList.remove('show'); b2.classList.add('show'); } },
      { t: 3000, fn: function(){ b3.classList.add('show'); } },
      { t: 3700, fn: function(){ t2.classList.add('show'); } },
      { t: 4700, fn: function(){ t2.classList.remove('show'); b4.classList.add('show'); playing = false; } }
    ];
    seq.forEach(function(step){
      timers.push(setTimeout(step.fn, step.t));
    });
  }

  if (replayBtn){
    replayBtn.addEventListener('click', function(){
      replayBtn.classList.add('spin');
      setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
      playThread();
    });
  }

  // Re-arm on every scroll re-entry; exit resets state
  if ('IntersectionObserver' in window && thread){
    var smsIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          playThread();
        } else if (!reducedMotion()){
          clearTimers();
          playing = false;
          resetThread();
        }
      });
    }, { threshold: 0.3 });
    smsIO.observe(thread);
  } else {
    playThread();
  }

  // =====================================================================
  // SECTION REVEALS: .reveal class, once-only (per spec)
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
  // STAT COUNTER: count-up rAF, re-arms on every scroll re-entry.
  // STAT_TARGET = 17187 -- $17,187 avg settlement with PA (catastrophic claims).
  // Source: sill.com -- $17,187 with PA vs $2,029 unrepresented (747% difference).
  // Format: "$17,187" -- dollar sign + thousands + comma + three-digit remainder.
  // =====================================================================
  var STAT_TARGET = 17187;
  var statEl = document.getElementById('statNumber');
  var statReplayBtn = document.getElementById('statReplayBtn');
  var countRun = 0;
  var dollarNode, centsSpan;

  function formatVal(val){
    // Produces e.g. { main:"$17", frac:",187" } for 17187
    if (val < 1000){ return { main: '$' + val, frac: '' }; }
    var thousands = Math.floor(val / 1000);
    var remainder = String(val % 1000).padStart(3, '0');
    return { main: '$' + thousands, frac: ',' + remainder };
  }

  function showStatFinal(){
    if (!dollarNode) return;
    countRun++;
    var f = formatVal(STAT_TARGET);
    dollarNode.textContent = f.main;
    centsSpan.textContent = f.frac;
  }

  function runCount(){
    if (!dollarNode) return;
    if (reducedMotion()){ showStatFinal(); return; }
    var runId = ++countRun;
    var dur = 1500;
    var start = null;
    function step(ts){
      if (runId !== countRun) return; // superseded by newer run
      if (!start) start = ts;
      var progress = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var val = Math.round(eased * STAT_TARGET);
      var f = formatVal(val);
      dollarNode.textContent = f.main;
      centsSpan.textContent = f.frac;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (statEl){
    // Build DOM nodes (no innerHTML for the counter value)
    statEl.innerHTML = '';
    dollarNode = document.createTextNode('$0');
    centsSpan = document.createElement('span');
    centsSpan.className = 'cents';
    centsSpan.textContent = '';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    // Reduced motion from first paint: show final immediately
    if (reducedMotion()){ showStatFinal(); }

    if ('IntersectionObserver' in window){
      var statIO = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if (e.isIntersecting){ runCount(); }
        });
      }, { threshold: 0.35 });
      statIO.observe(statEl);
    }

    if (statReplayBtn){
      statReplayBtn.addEventListener('click', function(){
        statReplayBtn.classList.add('spin');
        setTimeout(function(){ statReplayBtn.classList.remove('spin'); }, 520);
        runCount();
      });
    }
  }

  // =====================================================================
  // MID-SESSION MOTION CHANGE: snap to final state when reduce turns on
  // =====================================================================
  if (motionQuery.addEventListener){
    motionQuery.addEventListener('change', function(){
      if (reducedMotion()){ showThreadFinal(); showStatFinal(); }
    });
  } else if (motionQuery.addListener){
    // legacy Safari
    motionQuery.addListener(function(){
      if (reducedMotion()){ showThreadFinal(); showStatFinal(); }
    });
  }

  // If reduced motion was set from first paint, show SMS thread final immediately
  if (reducedMotion()){ showThreadFinal(); }

})();