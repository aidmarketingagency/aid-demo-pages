(function(){
  // Reduced motion: the SMS sequencing and stat count-up are demo CONTENT and always
  // play. CSS gates transforms/transitions under reduce so each step lands instantly.
  // The query below only gates the decorative section reveals.
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches:false };
  function reduced(){ return !!motionQuery.matches; }

  /* -- SMS thread: staged reveal, typing indicators, replayable, re-armed on scroll re-entry -- */
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = Array.prototype.slice.call(thread.querySelectorAll('.typing'));
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var threadGen = 0; // generation token: a superseded run kills itself

  function clearTimers(){ timers.forEach(clearTimeout); timers = []; }
  function resetThread(){
    bubbles.forEach(function(b){ b.classList.remove('show'); });
    typers.forEach(function(t){ t.classList.remove('show'); });
  }
  function playThread(){
    var gen = ++threadGen;
    clearTimers(); resetThread();
    // Walk thread children in DOM order: typing dots run ~950ms before the
    // bubble that follows; bubbles land ~750ms apart.
    var children = Array.prototype.slice.call(thread.children);
    var at = 260;
    var seq = [];
    children.forEach(function(el){
      if (el.classList.contains('typing')){
        (function(node, t){ seq.push({ t: t, fn: function(){ node.classList.add('show'); } }); })(el, at);
        (function(node, t){ seq.push({ t: t, fn: function(){ node.classList.remove('show'); } }); })(el, at + 950);
        at += 950;
      } else if (el.classList.contains('bubble')){
        (function(node, t){ seq.push({ t: t, fn: function(){ node.classList.add('show'); } }); })(el, at);
        at += 750;
      }
    });
    seq.forEach(function(s){
      timers.push(setTimeout(function(){ if (gen === threadGen) s.fn(); }, s.t));
    });
  }
  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    playThread();
  });
  if ('IntersectionObserver' in window){
    var demoIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ playThread(); }
        else { threadGen++; clearTimers(); resetThread(); }
      });
    }, { threshold:.35 });
    demoIO.observe(thread);
  } else { playThread(); }

  /* -- section reveals (one-time entrance, never leaves content hidden) -- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced()){
    var revealIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ e.target.classList.add('visible'); revealIO.unobserve(e.target); }
      });
    }, { threshold:.15 });
    reveals.forEach(function(el){ revealIO.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('visible'); });
  }

  /* -- stat counter: $1,800, one NC termite job (sources in the HTML comment above THE MATH) -- */
  var statEl = document.getElementById('statNumber');
  var statReplayBtn = document.getElementById('statReplayBtn');
  var STAT_TARGET = 1800;
  var countGen = 0;
  function fmt(v){ return '$' + v.toLocaleString('en-US'); }
  function showStatFinal(){ countGen++; statEl.textContent = fmt(STAT_TARGET); }
  function runCount(){
    var gen = ++countGen;
    var dur = 1400, start = null;
    function step(ts){
      if (gen !== countGen) return;
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      statEl.textContent = fmt(Math.round(eased * STAT_TARGET));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window){
    var statIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting){ runCount(); } });
    }, { threshold:.4 });
    statIO.observe(statEl);
  } else { showStatFinal(); }
  if (statReplayBtn){
    statReplayBtn.addEventListener('click', function(){
      statReplayBtn.classList.add('spin');
      setTimeout(function(){ statReplayBtn.classList.remove('spin'); }, 520);
      runCount();
    });
  }

  /* -- sticky mobile CTA bar: hidden while the real CTA panel is in view (one ask at a time) -- */
  var bar = document.getElementById('mobileCtaBar');
  var ctaPanel = document.getElementById('ctaPanel');
  if (bar && ctaPanel && 'IntersectionObserver' in window){
    var barIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ bar.classList.add('is-hidden'); }
        else { bar.classList.remove('is-hidden'); }
      });
    }, { threshold:.1 });
    barIO.observe(ctaPanel);
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