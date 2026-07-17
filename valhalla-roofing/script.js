(function(){
  // -- SMS thread staged reveal + typing indicators, replayable, re-arms on re-entry --
  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = [document.getElementById('typing1'), document.getElementById('typing2')];
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;

  // Doctrine 2026-07-16: the SMS sequence and stat count-up are demo CONTENT and always
  // play, even under prefers-reduced-motion. Only transforms, slides, and transitions
  // stay gated behind reduced motion, and the CSS media block handles that.

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
    var seq = [
      { t: 300,  action: function(){ bubbles[0].classList.add('show'); } },
      { t: 950,  action: function(){ bubbles[1].classList.add('show'); } },
      { t: 1550, action: function(){ typers[0].classList.add('show'); } },
      { t: 2450, action: function(){ typers[0].classList.remove('show'); bubbles[2].classList.add('show'); } },
      { t: 3250, action: function(){ bubbles[3].classList.add('show'); } },
      { t: 3850, action: function(){ typers[1].classList.add('show'); } },
      { t: 4750, action: function(){ typers[1].classList.remove('show'); bubbles[4].classList.add('show'); } },
      { t: 5550, action: function(){ bubbles[5].classList.add('show'); playing = false; } }
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

  // Re-arm on scroll re-entry (v2 animation standard: nothing plays once and dies).
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

  // -- Animated counter for the stat number (DOM nodes, generation token, re-arms) --
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
    // Re-verified 2026-07-16; see THE MATH comment block for the source list.
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
        dollarNode.textContent = '$' + Math.floor(val / 1000);
        centsSpan.textContent = ',' + String(val % 1000).padStart(3, '0');
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

  // -- A1: tuck the sticky mobile bar while the real CTA panel (or footer) is on screen --
  var mobileCta = document.getElementById('mobileCta');
  var ctaPanel = document.getElementById('ctaPanel');
  var footerEl = document.querySelector('footer');
  if (mobileCta && 'IntersectionObserver' in window){
    var inView = { cta: false, foot: false };
    function updateBar(){
      if (inView.cta || inView.foot){ mobileCta.classList.add('tucked'); }
      else { mobileCta.classList.remove('tucked'); }
    }
    var barIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.target === ctaPanel) inView.cta = e.isIntersecting;
        if (e.target === footerEl) inView.foot = e.isIntersecting;
      });
      updateBar();
    }, { threshold: 0.12 });
    if (ctaPanel) barIO.observe(ctaPanel);
    if (footerEl) barIO.observe(footerEl);
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