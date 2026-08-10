  /* MOTION POLICY (Ryan ruling 2026-07-29): the staged SMS thread is the PRODUCT
     DEMO, not decoration, so it plays for everyone -- including visitors with
     prefers-reduced-motion set. Same contract as a video that plays when you press
     play. This DOES override a stated accessibility preference for this one element;
     the justification is that suppressing the thread does not calm the page down, it
     deletes the only thing the page has to show. The override is kept narrow: spatial
     transforms still die under reduce (styles.css), the typing-dot bounce still dies,
     every other animation on the page still honors the setting, and the Replay control
     stays so the viewer always has agency.
     Enforced by execution/demo_motion_policy.py. Do not add a reduced-motion gate to
     the thread. */
(function () {
  var thread = document.getElementById('thread');
  if (!thread) return;
  var steps = [
    { el: 'b1', typing: null,      at: 600 },
    { el: 'b2', typing: 'typing1', at: 1500, hold: 1100 },
    { el: 'b3', typing: null,      at: 4200 },
    { el: 'b4', typing: 'typing2', at: 5100, hold: 1000 },
    { el: 'b5', typing: null,      at: 7600 },
    { el: 'b6', typing: 'typing3', at: 8500, hold: 1100 },
    { el: 'b7', typing: null,      at: 11200 },
    { el: 'b8', typing: 'typing4', at: 12000, hold: 900 }
  ];
  var timers = [];
  var playing = false;
  function byId(id) { return document.getElementById(id); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function resetThread() {
    clearTimers();
    playing = false;
    steps.forEach(function (s) {
      var el = byId(s.el);
      if (el) el.style.opacity = '0';
      if (s.typing) { var t = byId(s.typing); if (t) t.classList.remove('visible'); }
    });
  }
  function playThread() {
    if (playing) return;
    playing = true;
    steps.forEach(function (s) {
      var el = byId(s.el);
      if (!el) return;
      if (s.typing) {
        var t = byId(s.typing);
        timers.push(setTimeout(function () { if (t) t.classList.add('visible'); }, s.at));
        timers.push(setTimeout(function () {
          if (t) t.classList.remove('visible');
          el.style.opacity = '1';
        }, s.at + (s.hold || 900)));
      } else {
        timers.push(setTimeout(function () { el.style.opacity = '1'; }, s.at));
      }
    });
  }
  // Fixed sequencer contract (commit 6428128 lineage): a play observer, a
  // SEPARATE re-arm observer that resets only on full exit, and an
  // already-visible-on-load check via getBoundingClientRect.
  var playIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) playThread(); });
  }, { threshold: 0.25 });
  var rearmIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (!e.isIntersecting) resetThread(); });
  }, { threshold: 0 });
  var rect = thread.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) { playThread(); }
  playIO.observe(thread);
  rearmIO.observe(thread);
  var replay = document.getElementById('replay');
  if (replay) replay.addEventListener('click', function () {
    resetThread();
    setTimeout(playThread, 80);
  });

  // Stat counter: re-arms on exit, manual replay control, generation token so a
  // superseded run kills itself.
  var counter = document.getElementById('counter');
  var statSection = document.querySelector('.stat-section');
  var gen = 0;
  function runCount() {
    if (!counter) return;
    var myGen = ++gen;
    var target = 10750, dur = 1600, start = performance.now();
    function step(now) {
      if (myGen !== gen) return;
      var pr = Math.min((now - start) / dur, 1);
      var eased = pr * pr * (3 - 2 * pr);
      counter.textContent = '$' + Math.round(eased * target).toLocaleString('en-US');
      if (pr < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counter && statSection) {
    var counted = false;
    var statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !counted) { counted = true; runCount(); }
        if (!e.isIntersecting) { counted = false; gen++; counter.textContent = '$0'; }
      });
    }, { threshold: 0.3 });
    statIO.observe(statSection);
    var statReplay = document.getElementById('statReplay');
    if (statReplay) statReplay.addEventListener('click', runCount);
  }

  // Section reveals: play once, never leave content hidden.
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('on'); revealIO.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { revealIO.observe(el); });

  // Sticky mobile CTA: hidden while the real CTA panel is in view (one CTA at a time).
  var sticky = document.getElementById('stickyCta');
  var ctaPanel = document.getElementById('ctaPanel');
  if (sticky && ctaPanel) {
    var ctaIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        sticky.classList.toggle('hidden', e.isIntersecting);
      });
    }, { threshold: 0.1 });
    ctaIO.observe(ctaPanel);
  }
})();
