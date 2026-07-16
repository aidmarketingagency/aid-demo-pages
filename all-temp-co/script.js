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
  // Motion preference
  // =====================================================================
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reducedMotion(){ return !!motionQuery.matches; }

  // =====================================================================
  // SMS THREAD: staged reveal + typing indicators, re-armed on scroll re-entry
  // (v2 spec animation standard: nothing plays once and dies)
  // =====================================================================
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
    // 4-bubble sequence: caller, AI (with typing), caller, AI (with typing)
    var seq = [
      { t: 280,  action: function(){ bubbles[0].classList.add('show'); } },
      { t: 980,  action: function(){ typers[1].classList.add('show'); } },
      { t: 1980, action: function(){ typers[1].classList.remove('show'); bubbles[1].classList.add('show'); } },
      { t: 2800, action: function(){ bubbles[2].classList.add('show'); } },
      { t: 3400, action: function(){ typers[2].classList.add('show'); } },
      { t: 4400, action: function(){ typers[2].classList.remove('show'); bubbles[3].classList.add('show'); playing = false; } }
    ];
    seq.forEach(function(step){ timers.push(setTimeout(step.action, step.t)); });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    playing = false;
    playThread();
  });

  // Re-arm on scroll re-entry (v2 spec: demoIO stays attached for life of page)
  if ('IntersectionObserver' in window){
    var demoIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          playing = false;
          playThread();
        } else if (!reducedMotion()){
          // Left the viewport: cancel in-flight, reset so re-entry starts clean
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

  // Reduced motion at first paint: show thread fully
  if (reducedMotion()){ showThreadFinal(); }

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
    if (reducedMotion()){ showStatFinal(); return; }
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

  if (reducedMotion()){ showStatFinal(); }

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

  // =====================================================================
  // Mid-session prefers-reduced-motion toggle: snap everything to final state
  // =====================================================================
  if (motionQuery.addEventListener){
    motionQuery.addEventListener('change', function(){
      if (reducedMotion()){
        showStatFinal();
        showThreadFinal();
      }
    });
  }

})();