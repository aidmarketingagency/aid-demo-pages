(function(){
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches:false };
  function reduced(){ return !!motionQuery.matches; }

  var thread = document.getElementById('thread');
  var bubbles = Array.prototype.slice.call(thread.querySelectorAll('.bubble'));
  var typers = Array.prototype.slice.call(thread.querySelectorAll('.typing'));
  var replayBtn = document.getElementById('replayBtn');
  var timers = [];
  var threadGen = 0;

  function clearTimers(){ timers.forEach(clearTimeout); timers = []; }
  function resetThread(){
    bubbles.forEach(function(b){ b.classList.remove('show'); });
    typers.forEach(function(t){ t.classList.remove('show'); });
  }
  function playThread(){
    var gen = ++threadGen;
    clearTimers(); resetThread();
    var children = Array.prototype.slice.call(thread.children);
    var at = 260;
    var seq = [];
    children.forEach(function(el){
      if (el.classList.contains('typing')){
        (function(node,t){ seq.push({ t:t, fn:function(){ node.classList.add('show'); } }); })(el,at);
        (function(node,t){ seq.push({ t:t, fn:function(){ node.classList.remove('show'); } }); })(el,at+950);
        at += 950;
      } else if (el.classList.contains('bubble')){
        (function(node,t){ seq.push({ t:t, fn:function(){ node.classList.add('show'); } }); })(el,at);
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
  var armed = true;
  function autoplayThread(){ if (!armed) return; armed = false; playThread(); }
  if ('IntersectionObserver' in window){
    var playIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting && e.intersectionRatio >= 0.15){ autoplayThread(); } });
    }, { threshold:.18 });
    playIO.observe(thread);
    var rearmIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (!e.isIntersecting){ threadGen++; clearTimers(); resetThread(); armed = true; } });
    }, { threshold:0 });
    rearmIO.observe(thread);
    var ir = thread.getBoundingClientRect();
    var ivh = window.innerHeight || document.documentElement.clientHeight;
    var iv = Math.min(ir.bottom,ivh) - Math.max(ir.top,0);
    if (ir.height > 0 && iv/ir.height >= 0.15){ autoplayThread(); }
  } else { playThread(); }

  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced()){
    var revealIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visible'); revealIO.unobserve(e.target); } });
    }, { threshold:.15 });
    reveals.forEach(function(el){ revealIO.observe(el); });
  } else { reveals.forEach(function(el){ el.classList.add('visible'); }); }

  var statEl = document.getElementById('statNumber');
  var statReplayBtn = document.getElementById('statReplayBtn');
  var STAT_TARGET = 2400;
  var countGen = 0;
  function fmt(v){ return '$' + v.toLocaleString('en-US'); }
  function showStatFinal(){ countGen++; statEl.textContent = fmt(STAT_TARGET); }
  function runCount(){
    var gen = ++countGen;
    var dur = 1400, start = null;
    function step(ts){
      if (gen !== countGen) return;
      if (!start) start = ts;
      var p = Math.min((ts-start)/dur,1);
      var eased = 1 - Math.pow(1-p,3);
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
