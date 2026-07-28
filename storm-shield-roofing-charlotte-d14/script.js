(function(){
  // SMS thread staged reveal + typing indicators, replayable
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
      { t: 250,  action: function(){ bubbles[0].classList.add('show'); } },
      { t: 1000, action: function(){ typers[1].classList.add('show'); } },
      { t: 2000, action: function(){ typers[1].classList.remove('show'); bubbles[1].classList.add('show'); } },
      { t: 2900, action: function(){ bubbles[2].classList.add('show'); } },
      { t: 3500, action: function(){ typers[2].classList.add('show'); } },
      { t: 4500, action: function(){ typers[2].classList.remove('show'); bubbles[3].classList.add('show'); playing = false; } }
    ];
    seq.forEach(function(step){ timers.push(setTimeout(step.action, step.t)); });
  }

  replayBtn.addEventListener('click', function(){
    replayBtn.classList.add('spin');
    setTimeout(function(){ replayBtn.classList.remove('spin'); }, 520);
    playing = false;
    playThread();
  });

  // playIO + rearmIO: SEPARATE observers per v2 spec (mandatory pattern)
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

    // Already visible on load: play immediately using getBoundingClientRect
    var _r = thread.getBoundingClientRect();
    var _vh = window.innerHeight || document.documentElement.clientHeight;
    var _vis = Math.min(_r.bottom, _vh) - Math.max(_r.top, 0);
    if (_r.height > 0 && _vis / _r.height >= 0.15){ _autoplay(); }
  } else {
    playThread();
  }

  // Reveal-on-scroll for sections
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

  // Animated counter for the stat (DOM nodes, re-armable)
  var statEl = document.querySelector('.stat-number');
  var statReplayBtn = document.getElementById('statReplayBtn');
  var countRun = 0;

  function runCount(){
    var run = ++countRun;
    statEl.textContent = '';
    var dollarNode = document.createTextNode('$0');
    var centsSpan = document.createElement('span');
    centsSpan.className = 'cents';
    centsSpan.textContent = ',000';
    statEl.appendChild(dollarNode);
    statEl.appendChild(centsSpan);

    var target = 12000;
    var dur = 1600;
    var start = null;
    function step(ts){
      if (run !== countRun) return;
      if (!start) start = ts;
      var progress = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var val = Math.round(eased * target);
      var thousands = Math.floor(val / 1000);
      var remainder = String(val % 1000).padStart(3, '0');
      dollarNode.textContent = '$' + thousands;
      centsSpan.textContent = ',' + remainder;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (statEl && 'IntersectionObserver' in window){
    var statIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ runCount(); statIO.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    statIO.observe(statEl);
  }

  if (statReplayBtn){
    statReplayBtn.addEventListener('click', function(){ runCount(); });
  }

  // Sticky CTA: hide while real CTA panel is in view
  var stickyCta = document.getElementById('stickyCta');
  var ctaPanel = document.querySelector('.cta-section');
  if (stickyCta && ctaPanel && 'IntersectionObserver' in window){
    var ctaIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ stickyCta.classList.add('hidden'); }
        else { stickyCta.classList.remove('hidden'); }
      });
    }, { threshold: 0.1 });
    ctaIO.observe(ctaPanel);
  }
})();
