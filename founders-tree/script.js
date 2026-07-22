/* AID teaser bubble + auto-open schedule (v3, 2026-07-22):
   teaser at 10s next to the closed launcher, auto-open never before 20s.
   Pages with the data-aid-widget-boost snippet keep that snippet's own 20s
   opener; this block only auto-opens on pages without it. Clicking the
   teaser or the launcher opens the chat immediately. */
(function () {
  var WID = '54722168';
  var BUBBLE_ID = 'ultra-fast-widget-bubble-' + WID;
  var OPEN_KEY = 'aidWidgetAutoOpened';
  var LEGACY_KEY = 'aidDemoWidgetAutoOpened';
  var TEASER_KEY = 'aidTeaserShown';
  var TEASER_AT = 10; /* seconds, the old auto-open moment */
  var OPEN_AT = 20;   /* seconds, minimum auto-open delay */
  var hasBoost = !!document.querySelector('script[data-aid-widget-boost]');
  function bubble() { return document.getElementById(BUBBLE_ID); }
  function isOpen() {
    var c = document.getElementById('ultra-fast-widget-container-' + WID);
    return !!(c && getComputedStyle(c).display !== 'none');
  }
  function alreadyOpened() {
    try { return !!(sessionStorage.getItem(OPEN_KEY) || sessionStorage.getItem(LEGACY_KEY)); } catch (e) { return false; }
  }
  var teaser = null;
  var userTouched = false;
  document.addEventListener('click', function (e) {
    if (e.isTrusted && e.target && e.target.closest && e.target.closest('#' + BUBBLE_ID)) {
      userTouched = true;
      hideTeaser();
    }
  }, true);
  function hideTeaser() {
    if (!teaser) return;
    var t = teaser;
    teaser = null;
    t.style.opacity = '0';
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 450);
  }
  function openChat() {
    hideTeaser();
    var b = bubble();
    if (b && !isOpen()) b.click();
  }
  function showTeaser() {
    if (teaser || userTouched || isOpen() || alreadyOpened()) return;
    try {
      if (sessionStorage.getItem(TEASER_KEY)) return;
      sessionStorage.setItem(TEASER_KEY, '1');
    } catch (e) {}
    var d = document.createElement('div');
    d.setAttribute('data-aid-teaser', '');
    d.setAttribute('role', 'button');
    d.setAttribute('tabindex', '0');
    d.style.cssText = 'position:fixed;right:20px;bottom:98px;z-index:999998;max-width:250px;background:#141419;color:#F4F4F5;padding:13px 32px 13px 16px;border-radius:16px;border:1px solid rgba(201,168,76,.45);box-shadow:0 12px 28px rgba(0,0,0,.5);font:500 14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;cursor:pointer;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease;';
    var txt = document.createElement('p');
    txt.style.cssText = 'margin:0;';
    txt.textContent = "Give your customers AN OFFER they can't refuse! 🎙️";
    var x = document.createElement('button');
    x.type = 'button';
    x.setAttribute('aria-label', 'Dismiss');
    x.textContent = '×';
    x.style.cssText = 'position:absolute;top:2px;right:6px;background:transparent;border:none;color:rgba(244,244,245,.55);font-size:18px;line-height:1;cursor:pointer;padding:2px 4px;';
    x.addEventListener('click', function (e) { e.stopPropagation(); hideTeaser(); });
    var arrow = document.createElement('span');
    arrow.style.cssText = 'position:absolute;bottom:-7px;right:26px;width:12px;height:12px;background:#141419;border-right:1px solid rgba(201,168,76,.45);border-bottom:1px solid rgba(201,168,76,.45);transform:rotate(45deg);';
    d.appendChild(txt);
    d.appendChild(x);
    d.appendChild(arrow);
    d.addEventListener('click', function (e) { if (e.target === x) return; e.stopPropagation(); openChat(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChat(); } });
    document.body.appendChild(d);
    teaser = d;
    requestAnimationFrame(function () { d.style.opacity = '1'; d.style.transform = 'translateY(0)'; });
  }
  var ticks = 0;
  var timer = setInterval(function () {
    ticks += 1;
    if (isOpen()) {
      hideTeaser();
      if (hasBoost || ticks >= OPEN_AT) clearInterval(timer);
      return;
    }
    var b = bubble();
    if (b && ticks >= TEASER_AT) showTeaser();
    if (!hasBoost && b && ticks >= OPEN_AT) {
      clearInterval(timer);
      hideTeaser();
      var guard = alreadyOpened();
      try { sessionStorage.setItem(LEGACY_KEY, '1'); } catch (e) {}
      if (!guard && !userTouched && !isOpen()) b.click();
    }
    if (ticks > 60) clearInterval(timer);
  }, 1000);
})();

(function(){
  // -- SMS thread staged reveal + typing indicators, replayable --
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
    clearTimers();
    playing = false;
    resetThread();
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

    // $1,500: representative midpoint storm-damage tree removal, Davidson / Cornelius / Huntersville.
    // Sources: angi.com/nc/charlotte tree removal range; stumpoff.com emergency premium 25-35%;
    // NC emergency range $400-$3,000+ per source block above the section.
    var STAT_TARGET = 1500;
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
    // No IntersectionObserver: leave the static markup untouched
    if (statReplayBtn) statReplayBtn.style.display = 'none';
  }
})();