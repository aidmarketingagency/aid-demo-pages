(function(){
  // -- SMS thread staged reveal + typing indicators, replayable, re-armed on scroll re-entry --
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = { 1: document.getElementById('typing1'), 2: document.getElementById('typing2') };
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  // v2 spec: reduced-motion fallback must cover JS-driven animation, not just CSS.
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
      { t: 1000, action: function(){ typers[1].classList.add('show'); } },
      { t: 2000, action: function(){ typers[1].classList.remove('show'); bubbles[1].classList.add('show'); } },
      { t: 2900, action: function(){ bubbles[2].classList.add('show'); } },
      { t: 3500, action: function(){ typers[2].classList.add('show'); } },
      { t: 4450, action: function(){ typers[2].classList.remove('show'); bubbles[3].classList.add('show'); playing = false; } }
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

  // Re-arm on scroll re-entry (animation reset standard: nothing plays once and dies).
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

  // -- Reveal-on-scroll for sections (one-time entrance, never leaves content hidden) --
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

  // -- Animated counter: $13,954, average paid claim for water damage and freezing.
  // Source: https://www.consumeraffairs.com/homeowners/water-damage-insurance-claims-statistics.html
  var statVal = document.getElementById('statVal');
  var statReplayBtn = document.getElementById('statReplayBtn');
  var STAT_TARGET = 13954;
  var countRun = 0;

  function fmt(n){ return n.toLocaleString('en-US'); }

  function showStatFinal(){
    countRun++;
    if (statVal) statVal.textContent = fmt(STAT_TARGET);
  }

  function runCount(){
    if (!statVal) return;
    if (reducedMotion()){ showStatFinal(); return; }
    var runId = ++countRun;
    var dur = 1400;
    var start = null;
    function step(ts){
      if (runId !== countRun) return;
      if (!start) start = ts;
      var progress = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      statVal.textContent = fmt(Math.round(eased * STAT_TARGET));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (statVal && 'IntersectionObserver' in window){
    if (reducedMotion()){ showStatFinal(); }
    var statIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ runCount(); }
      });
    }, { threshold: 0.4 });
    statIO.observe(statVal);

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

  if (motionQuery.addEventListener){
    motionQuery.addEventListener('change', function(){
      if (reducedMotion()){ showStatFinal(); showThreadFinal(); }
    });
  }
  if (reducedMotion()){ showThreadFinal(); }

  // -- A1 sticky mobile CTA: visible after the hero, hidden while the real CTA panel
  //    (or footer, which repeats the link) is on screen, so one CTA shows at a time --
  var bar = document.getElementById('stickyCta');
  var ctaPanel = document.querySelector('.cta-panel');
  var footerEl = document.querySelector('footer');
  var heroLead = document.querySelector('.hero-lead');
  if (bar && 'IntersectionObserver' in window){
    var ctaVisible = 0;
    var pastHero = false;
    function syncBar(){
      if (pastHero && ctaVisible === 0){ bar.classList.remove('is-hidden'); }
      else { bar.classList.add('is-hidden'); }
    }
    var ctaIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        ctaVisible += e.isIntersecting ? 1 : -1;
        if (ctaVisible < 0) ctaVisible = 0;
      });
      syncBar();
    }, { threshold: 0.05 });
    if (ctaPanel) ctaIO.observe(ctaPanel);
    if (footerEl) ctaIO.observe(footerEl);
    var heroIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ pastHero = !e.isIntersecting; });
      syncBar();
    }, { threshold: 0 });
    if (heroLead) heroIO.observe(heroLead);
  } else if (bar){
    bar.classList.remove('is-hidden');
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