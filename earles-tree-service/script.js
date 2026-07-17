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
    clearTimers();
    playing = false;
    resetThread();
    playThread();
  });

  // Re-arm on scroll re-entry (v2 spec animation standard: nothing plays once and dies).
  // The observer stays attached for the life of the page: every time the thread
  // scrolls back into view it resets and re-plays. Manual Replay button still works.
  if ('IntersectionObserver' in window){
    var demoIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          playThread();
        } else {
          // left the viewport: stop any in-flight sequence so re-entry starts clean.
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
    centsSpan.textContent = '';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    // $750: the typical low end of the emergency/storm tree-removal price point in the Carolinas.
    // Source: https://treeremovalcolumbia.net/emergency-tree-removal-cost-in-columbia-sc/
    var STAT_TARGET = 750;
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
        dollarNode.textContent = '$' + val;
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
    // No IntersectionObserver: leave the static $750 markup untouched
    if (statReplayBtn) statReplayBtn.style.display = 'none';
  }

  // -- A1: sticky mobile CTA bar, hidden while the real CTA panel is in view so the page
  // never shows two CTAs at once. Same booking URL as the page CTA. --
  var stickyCta = document.getElementById('stickyCta');
  var ctaPanelEl = document.querySelector('.cta-panel');
  if (stickyCta && ctaPanelEl && 'IntersectionObserver' in window){
    var stickyIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        stickyCta.classList.toggle('hide', e.isIntersecting);
      });
    }, { threshold: 0.15 });
    stickyIO.observe(ctaPanelEl);
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