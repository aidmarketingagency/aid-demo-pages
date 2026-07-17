document.documentElement.className += ' js';

(function(){
  // -- SMS thread staged reveal + typing indicators, replayable, re-arms on scroll re-entry --
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
    // Walk the thread children in DOM order: typing indicators show for ~950ms
    // before the bubble that follows them, bubbles land ~750ms apart.
    var children = Array.prototype.slice.call(thread.children);
    var t = 300;
    var seq = [];
    children.forEach(function(el){
      if (el.classList.contains('typing')){
        (function(node, at){ seq.push({ t: at, action: function(){ node.classList.add('show'); } }); })(el, t);
        (function(node, at){ seq.push({ t: at, action: function(){ node.classList.remove('show'); } }); })(el, t + 950);
        t += 950;
      } else if (el.classList.contains('bubble')){
        (function(node, at){ seq.push({ t: at, action: function(){ node.classList.add('show'); } }); })(el, t);
        t += 750;
      }
    });
    seq.push({ t: t, action: function(){ playing = false; } });
    seq.forEach(function(step){ timers.push(setTimeout(step.action, step.t)); });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    playing = false;
    playThread();
  });

  // Autoplay fires ONCE when the thread is ~15-20% visible (including already
  // visible at script init). No observer-driven restart while any part of the
  // thread stays in view; re-arm ONLY after it has fully left the viewport.
  var armed = true;

  function autoplayThread(){
    if (!armed) return;
    armed = false;
    playThread();
  }

  if ('IntersectionObserver' in window){
    var playIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting && e.intersectionRatio >= 0.15){ autoplayThread(); }
      });
    }, { threshold: 0.18 });
    playIO.observe(thread);

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

    // Already visible at script init: play now instead of waiting on an entry.
    var initRect = thread.getBoundingClientRect();
    var initVh = window.innerHeight || document.documentElement.clientHeight;
    var initVisible = Math.min(initRect.bottom, initVh) - Math.max(initRect.top, 0);
    if (initRect.height > 0 && initVisible / initRect.height >= 0.15){ autoplayThread(); }
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