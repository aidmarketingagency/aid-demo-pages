(function(){
  // -- SMS thread staged reveal + typing indicators, replayable --
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = Array.prototype.slice.call(thread.querySelectorAll('.typing'));
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  // Reduced motion: the SMS sequencing and stat count-up are demo CONTENT and always
  // play. CSS gates transforms/transitions under reduce so each step lands instantly.

  function clearTimers(){ timers.forEach(function(t){ clearTimeout(t); }); timers = []; }

  function resetThread(){
    bubbles.forEach(function(b){ b.classList.remove('show'); });
    typers.forEach(function(t){ t.classList.remove('show'); });
  }

  function playThread(){
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
    // Walk thread children in DOM order: typing dots run ~950ms before the
    // bubble that follows; bubbles land ~750ms apart.
    var children = Array.prototype.slice.call(thread.children);
    var at = 250;
    var seq = [];
    children.forEach(function(el){
      if (el.classList.contains('typing')){
        (function(node, t){ seq.push({ t: t, action: function(){ node.classList.add('show'); } }); })(el, at);
        (function(node, t){ seq.push({ t: t, action: function(){ node.classList.remove('show'); } }); })(el, at + 950);
        at += 950;
      } else if (el.classList.contains('bubble')){
        (function(node, t){ seq.push({ t: t, action: function(){ node.classList.add('show'); } }); })(el, at);
        at += 750;
      }
    });
    seq.push({ t: at, action: function(){ playing = false; } });
    seq.forEach(function(step){ timers.push(setTimeout(step.action, step.t)); });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    playing = false;
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
        } else {
          // left the viewport: stop any in-flight sequence so re-entry starts clean.
          clearTimers();
          playing = false;
          resetThread();
        }
      });
    }, { threshold: 0.35 });
    demoIO.observe(thread);
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
    centsSpan.textContent = ',000';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    // $12,000: national average insurance payout for a hail-damaged roof.
    // Source: https://skylightroofing.com/average-insurance-payout-hail/ (see THE MATH comment block)
    var STAT_TARGET = 12000;
    var countRun = 0; // increments per run; a stale rAF loop sees the mismatch and stops

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
    // No IntersectionObserver: leave the static $12,000 markup untouched
    if (statReplayBtn) statReplayBtn.style.display = 'none';
  }
})();