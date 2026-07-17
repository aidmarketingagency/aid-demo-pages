(function(){
  // -- SMS thread staged reveal + typing indicators, replayable, re-armed on scroll re-entry --
  var thread = document.getElementById('thread');
  // Revision 2026-07-16: sequencer walks the thread in DOM order so the bubble count
  // can change without touching this file again. Same re-arm + reduced-motion contract.
  var items = Array.prototype.slice.call(thread.children).filter(function(el){
    return el.classList.contains('bubble') || el.classList.contains('typing');
  });
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var playing = false;
  var armed = true; // Addendum C: autoplay fires once per full exit/re-entry cycle

  // Doctrine 2026-07-16: the SMS sequencing, typing beats, and stat count-up are CONTENT,
  // not decoration. They play for everyone on the same timeline. Reduced motion only
  // strips transforms, transitions, and dot pulses (handled in styles.css), never the sequence.

  function clearTimers(){ timers.forEach(function(t){ clearTimeout(t); }); timers = []; }

  function resetThread(){
    items.forEach(function(el){ el.classList.remove('show'); });
  }

  function playThread(){
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
    var t = 250;
    items.forEach(function(el, i){
      var isLast = (i === items.length - 1);
      if (el.classList.contains('typing')){
        timers.push(setTimeout(function(){ el.classList.add('show'); }, t));
        t += 850;
        timers.push(setTimeout(function(){ el.classList.remove('show'); }, t));
      } else {
        timers.push(setTimeout(function(){ el.classList.add('show'); if (isLast) playing = false; }, t));
        t += 650;
      }
    });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    armed = false;
    playing = false;
    clearTimers();
    playThread();
  });

  // Addendum C contract (2026-07-16): autoplay fires ONCE when the thread first
  // becomes ~15 percent visible, including when it is already visible at script
  // init (getBoundingClientRect check below). While any part of the thread stays
  // visible the observer never resets or replays it. It re-arms ONLY after the
  // thread has FULLY left the viewport (isIntersecting false at the 0 threshold),
  // so scrolling away and back replays once per re-entry. Replay button unchanged.
  var PLAY_RATIO = 0.15;

  function threadVisibleRatio(){
    var rect = thread.getBoundingClientRect();
    if (!rect.height) return 0;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    return visible > 0 ? visible / rect.height : 0;
  }

  if ('IntersectionObserver' in window){
    if (threadVisibleRatio() >= PLAY_RATIO){
      armed = false;
      playThread();
    }
    var demoIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting){
          // Fully out of the viewport: stop any in-flight sequence and re-arm.
          // This branch can never fire while any part of the thread is visible.
          clearTimers();
          playing = false;
          resetThread();
          armed = true;
        } else if (armed && e.intersectionRatio >= PLAY_RATIO - 0.001){
          armed = false;
          playThread();
        }
      });
    }, { threshold: [0, PLAY_RATIO] });
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

  function runCount(){
    if (!statVal) return;
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