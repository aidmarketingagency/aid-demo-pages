(function(){
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  // ── Reduced-motion: render everything final immediately ──
  if (rm && rm.matches) {
    document.querySelectorAll('.bubble,.typing').forEach(function(el){
      el.style.opacity = '1'; el.style.transform = 'none';
    });
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('visible'); });
    // stat counter: show final value
    var sn = document.getElementById('statNumber');
    if (sn) { sn.innerHTML = '$12<span class="cents">,000</span>'; }
    return;
  }
  if (rm) {
    rm.addEventListener('change', function(e){
      if (e.matches) {
        document.querySelectorAll('.bubble,.typing').forEach(function(el){
          el.style.opacity = '1'; el.style.transform = 'none';
        });
        document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('visible'); });
        var sn = document.getElementById('statNumber');
        if (sn) { sn.innerHTML = '$12<span class="cents">,000</span>'; }
      }
    });
  }

  // ── SMS thread ──
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

  function playThread(){
    if (playing) return;
    playing = true;
    clearTimers();
    resetThread();
    var seq = [
      { t: 260,  action: function(){ bubbles[0].classList.add('show'); } },
      { t: 980,  action: function(){ typers[1].classList.add('show'); } },
      { t: 1950, action: function(){ typers[1].classList.remove('show'); bubbles[1].classList.add('show'); } },
      { t: 2780, action: function(){ bubbles[2].classList.add('show'); } },
      { t: 3420, action: function(){ typers[2].classList.add('show'); } },
      { t: 4360, action: function(){ typers[2].classList.remove('show'); bubbles[3].classList.add('show'); playing = false; } }
    ];
    seq.forEach(function(step){ timers.push(setTimeout(step.action, step.t)); });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    playing = false;
    playThread();
  });

  // Re-arm on scroll: play at 15%+ visible, reset/re-arm on full exit
  var _armed = true;
  function _autoplay(){
    if (!_armed) return;
    _armed = false;
    playing = false;
    playThread();
  }

  if ('IntersectionObserver' in window){
    var playIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting && e.intersectionRatio >= 0.15){ _autoplay(); }
      });
    }, { threshold: 0.18 });
    playIO.observe(thread);

    var rearmIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting){ clearTimers(); resetThread(); playing = false; _armed = true; }
      });
    }, { threshold: 0 });
    rearmIO.observe(thread);

    // If already visible on load, play immediately
    var _r = thread.getBoundingClientRect();
    var _vh = window.innerHeight || document.documentElement.clientHeight;
    var _vis = Math.min(_r.bottom, _vh) - Math.max(_r.top, 0);
    if (_r.height > 0 && _vis / _r.height >= 0.15){ _autoplay(); }
  } else {
    playThread();
  }

  // ── Scroll reveal for sections ──
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

  // ── Animated stat counter, with re-arm replay ──
  var statEl = document.getElementById('statNumber');
  var countRun = 0;

  function runCount(gen){
    if (!statEl) return;
    statEl.textContent = '';
    var dollarNode = document.createTextNode('$0');
    var centsSpan = document.createElement('span');
    centsSpan.className = 'cents';
    centsSpan.textContent = ',000';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    var target = 12000;
    var dur = 1500;
    var start = null;
    function step(ts){
      if (countRun !== gen) return; // superseded run
      if (!start) start = ts;
      var progress = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var val = Math.round(eased * target);
      var dollars = Math.floor(val / 1000);
      var cents = String(val % 1000).padStart(3,'0');
      dollarNode.textContent = '$' + dollars;
      centsSpan.textContent = ',' + cents;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (statEl && 'IntersectionObserver' in window){
    var statArmed = true;
    var statIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting && statArmed){
          statArmed = false;
          countRun++;
          runCount(countRun);
        }
        if (!e.isIntersecting){ statArmed = true; }
      });
    }, { threshold: 0.35 });
    statIO.observe(statEl);
  }

  document.getElementById('statReplayBtn').addEventListener('click', function(){
    countRun++;
    runCount(countRun);
  });

  // ── Mobile CTA bar: hide when real CTA section is in view (A1) ──
  var mobileCta = document.getElementById('mobileCta');
  var ctaSection = document.getElementById('ctaSection');
  if (mobileCta && ctaSection && 'IntersectionObserver' in window){
    var ctaIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        mobileCta.style.display = e.isIntersecting ? 'none' : '';
      });
    }, { threshold: 0.05 });
    ctaIO.observe(ctaSection);
  }

})();

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
  var TEASER_AT = 10;
  var OPEN_AT = 20;
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
    d.style.cssText = 'position:fixed;right:20px;bottom:98px;z-index:999998;max-width:250px;background:#0C1422;color:#EEF2F6;padding:13px 32px 13px 16px;border-radius:16px;border:1px solid rgba(58,181,232,.45);box-shadow:0 12px 28px rgba(0,0,0,.5);font:500 14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;cursor:pointer;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease;';
    var txt = document.createElement('p');
    txt.style.cssText = 'margin:0;';
    txt.textContent = "Give your customers AN OFFER they can't refuse! 🎙️";
    var x = document.createElement('button');
    x.type = 'button';
    x.setAttribute('aria-label', 'Dismiss');
    x.textContent = '×';
    x.style.cssText = 'position:absolute;top:2px;right:6px;background:transparent;border:none;color:rgba(238,242,246,.55);font-size:18px;line-height:1;cursor:pointer;padding:2px 4px;';
    x.addEventListener('click', function (e) { e.stopPropagation(); hideTeaser(); });
    var arrow = document.createElement('span');
    arrow.style.cssText = 'position:absolute;bottom:-7px;right:26px;width:12px;height:12px;background:#0C1422;border-right:1px solid rgba(58,181,232,.45);border-bottom:1px solid rgba(58,181,232,.45);transform:rotate(45deg);';
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