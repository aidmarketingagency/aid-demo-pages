(function(){
  // ---- Motion preference. 2026-07-16 doctrine: the SMS thread sequencing and the
  // stat count-up are CONTENT, not decoration. They always play on the same timeline;
  // reduced motion only strips transforms/transitions/pulses (handled in CSS). ----
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches:false };
  function reducedMotion(){ return !!motionQuery.matches; }

  // ---- SMS phone sequencer: staged reveal, typing indicators, replayable ----
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

  // Generic sequencer: walks the thread's children in DOM order, so the
  // conversation can be any length. Typing indicators show briefly before
  // the AI bubble that follows them.
  function playThread(){
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
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

  // Animation reset standard: re-arm on scroll re-entry, reset clean on exit.
  if ('IntersectionObserver' in window){
    var demoIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          playThread();
        } else {
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

  // ---- One-time entrance reveals (exemption class: never leave content hidden) ----
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    var revealIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ e.target.classList.add('visible'); revealIO.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function(el){ revealIO.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('visible'); });
  }

  // ---- Stat counter: count-up, re-armed on re-entry, manual replay, generation token ----
  var statEl = document.getElementById('statNumber');
  var statReplayBtn = document.getElementById('statReplayBtn');
  var snapStatFinal = function(){}; // reassigned below when the counter is wired up
  if (statEl && 'IntersectionObserver' in window){
    statEl.textContent = '';
    var dollarNode = document.createTextNode('$0');
    var centsSpan = document.createElement('span');
    centsSpan.className = 'cents';
    centsSpan.textContent = ',000';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    // $2,500: average professional bed bug treatment, live-search sourced 2026-07-16.
    // Sources: https://homeguide.com/costs/bed-bug-exterminator-cost
    //          https://www.thisoldhouse.com/pest-control/bed-bug-exterminator-cost
    //          (full source block in THE MATH comment above)
    var STAT_TARGET = 2500;
    var countRun = 0;

    function renderStat(val){
      var dollars = Math.floor(val / 1000);
      var cents = String(val % 1000).padStart(3, '0');
      dollarNode.textContent = '$' + dollars;
      centsSpan.textContent = ',' + cents;
    }

    function showStatFinal(){
      countRun++;
      renderStat(STAT_TARGET);
    }
    snapStatFinal = showStatFinal;

    function runCount(){
      var runId = ++countRun;
      var dur = 1400;
      var start = null;
      function step(ts){
        if (runId !== countRun) return;
        if (!start) start = ts;
        var progress = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        renderStat(Math.round(eased * STAT_TARGET));
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
  } else if (statReplayBtn){
    statReplayBtn.style.display = 'none';
  }

  // ---- Sticky mobile CTA bar (A1): hidden while the real CTA panel is in view ----
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