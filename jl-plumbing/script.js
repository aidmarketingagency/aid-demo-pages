(function(){
  // v2 spec: the reduced-motion fallback must cover JS-driven animation.
  // When reduce is set, every sequence renders its final state immediately: no timers,
  // no typing indicators, no count-up. The change listener handles mid-session toggles.
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reducedMotion(){ return !!motionQuery.matches; }

  // -- SMS thread staged reveal + typing indicators, replayable --
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
    var seq = [
      { t: 250,  action: function(){ bubbles[0].classList.add('show'); } },
      { t: 950,  action: function(){ typers[1].classList.add('show'); } },
      { t: 1900, action: function(){ typers[1].classList.remove('show'); bubbles[1].classList.add('show'); } },
      { t: 2700, action: function(){ bubbles[2].classList.add('show'); } },
      { t: 3300, action: function(){ typers[2].classList.add('show'); } },
      { t: 4200, action: function(){ typers[2].classList.remove('show'); bubbles[3].classList.add('show'); playing = false; } }
    ];
    seq.forEach(function(step){ timers.push(setTimeout(step.action, step.t)); });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    playing = false;
    playThread();
  });

  // Re-arm on scroll re-entry (v2 spec animation standard: nothing plays once and dies).
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

  // -- Animated counter for the stat number (re-arms on scroll re-entry, manual replay) --
  var statEl = document.querySelector('.stat-number');
  var statReplayBtn = document.getElementById('statReplayBtn');
  if (statEl){
    statEl.textContent = '';
    var dollarNode = document.createTextNode('$0');
    var centsSpan = document.createElement('span');
    centsSpan.className = 'cents';
    centsSpan.textContent = ',000';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    // $1,500: midpoint of the $500-$2,500 NC kitchen-sink emergency range (see THE MATH comment)
    var STAT_TARGET = 1500;
    var countRun = 0;

    function showStatFinal(){
      countRun++;
      dollarNode.textContent = '$1';
      centsSpan.textContent = ',500';
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
        var val = Math.round(eased * STAT_TARGET);
        var dollars = Math.floor(val / 1000);
        var hundreds = String(val % 1000).padStart(3, '0');
        dollarNode.textContent = '$' + dollars;
        centsSpan.textContent = ',' + hundreds;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (reducedMotion()){ showStatFinal(); }

    if ('IntersectionObserver' in window){
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

    if (motionQuery.addEventListener){
      motionQuery.addEventListener('change', function(){
        if (reducedMotion()){ showStatFinal(); showThreadFinal(); }
      });
    }
  }

  if (reducedMotion()){ showThreadFinal(); }

  // -- Sticky mobile CTA bar: hide while real CTA panel is visible (v2.1 A1) --
  var mobileCta = document.getElementById('mobileCta');
  var ctaSection = document.getElementById('ctaSection');
  if (mobileCta && ctaSection && 'IntersectionObserver' in window){
    var ctaIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          mobileCta.classList.add('is-hidden');
        } else {
          mobileCta.classList.remove('is-hidden');
        }
      });
    }, { threshold: 0.1 });
    ctaIO.observe(ctaSection);
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