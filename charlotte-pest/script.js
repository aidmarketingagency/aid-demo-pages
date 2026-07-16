document.documentElement.className += ' js';

(function(){
  // -- SMS thread staged reveal + typing indicators, replayable, re-arms on scroll re-entry --
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = { 1: document.getElementById('typing1'), 2: document.getElementById('typing2') };
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  // Reduced-motion gate covers JS-driven animation, not just CSS (v2 spec house rule).
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
      { t: 300,  action: function(){ bubbles[0].classList.add('show'); } },
      { t: 1050, action: function(){ typers[1].classList.add('show'); } },
      { t: 2150, action: function(){ typers[1].classList.remove('show'); bubbles[1].classList.add('show'); } },
      { t: 3100, action: function(){ bubbles[2].classList.add('show'); } },
      { t: 3750, action: function(){ typers[2].classList.add('show'); } },
      { t: 4750, action: function(){ typers[2].classList.remove('show'); bubbles[3].classList.add('show'); playing = false; } }
    ];
    seq.forEach(function(step){ timers.push(setTimeout(step.action, step.t)); });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    playing = false;
    playThread();
  });

  // Re-arm on scroll re-entry: nothing plays once and dies.
  if ('IntersectionObserver' in window){
    var demoIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          playThread();
        } else if (!reducedMotion()){
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

  // -- Reveal-on-scroll (one-time entrance, never leaves content hidden) --
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

  // -- Animated stat counter with generation token, re-arms on re-entry, manual replay --
  // $2,500: top of the published whole-home liquid barrier range.
  // Sources: https://homeguide.com/costs/termite-treatment-cost
  //          https://www.homeadvisor.com/cost/environmental-safety/hire-a-termite-control-service/
  var statEl = document.getElementById('statNumber');
  var statReplayBtn = document.getElementById('statReplayBtn');
  var STAT_TARGET = 2500;
  var countRun = 0;

  function fmt(val){ return '$' + val.toLocaleString('en-US'); }

  function showStatFinal(){
    countRun++;
    statEl.textContent = fmt(STAT_TARGET);
  }

  function runCount(){
    if (reducedMotion()){ showStatFinal(); return; }
    var runId = ++countRun;
    var dur = 1400;
    var start = null;
    function step(ts){
      if (runId !== countRun) return;
      if (!start) start = ts;
      var progress = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      statEl.textContent = fmt(Math.round(eased * STAT_TARGET));
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
  } else {
    showStatFinal();
    if (statReplayBtn) statReplayBtn.style.display = 'none';
  }

  if (statReplayBtn){
    statReplayBtn.addEventListener('click', function(){
      statReplayBtn.classList.add('spin');
      setTimeout(function(){ statReplayBtn.classList.remove('spin'); }, 520);
      runCount();
    });
  }

  if (motionQuery.addEventListener){
    motionQuery.addEventListener('change', function(){
      if (reducedMotion()){ showStatFinal(); showThreadFinal(); }
    });
  }
  if (reducedMotion()){ showStatFinal(); showThreadFinal(); }

  // -- Sticky mobile CTA bar (A1): hidden while the real CTA panel is in view, one ask only --
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