// ─── ONE MOTION POLICY: SMS thread plays on every load, all visitors ───────────
// prefers-reduced-motion kills spatial transforms (decoration) only.
// Sequence + opacity are the product demo — they play regardless.
const thread = document.getElementById('thread');
const bubbles = [
  {el:document.getElementById('b1'),typing:null,delay:0},
  {el:document.getElementById('b2'),typing:document.getElementById('typing1'),delay:1200},
  {el:document.getElementById('b3'),typing:null,delay:3400},
  {el:document.getElementById('b4'),typing:document.getElementById('typing2'),delay:5000},
];

let timers = [];
let played = false;

function clearTimers(){timers.forEach(t=>clearTimeout(t));timers=[];}

function resetThread(){
  clearTimers();
  bubbles.forEach(b=>{
    b.el.style.opacity='0';
    if(b.typing) b.typing.classList.remove('visible');
  });
  played = false;
}

function playThread(){
  if(played) return;
  played = true;
  bubbles.forEach((b,i)=>{
    if(b.typing){
      timers.push(setTimeout(()=>b.typing.classList.add('visible'), b.delay));
      timers.push(setTimeout(()=>{
        b.typing.classList.remove('visible');
        b.el.style.opacity='1';
      }, b.delay+900));
    } else {
      timers.push(setTimeout(()=>b.el.style.opacity='1', b.delay));
    }
  });
}

// getBoundingClientRect check: plays immediately if already in viewport on load
const playIO = new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting) playThread();});
},{threshold:0.2});

const rearmIO = new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(!e.isIntersecting) resetThread();});
},{threshold:0});

const rect = thread.getBoundingClientRect();
if(rect.top < window.innerHeight && rect.bottom > 0){
  playThread();
} else {
  playIO.observe(thread);
}
rearmIO.observe(thread);

document.getElementById('replay').addEventListener('click',()=>{resetThread();setTimeout(playThread,100);});

// ─── Counter ────────────────────────────────────────────────────────────────
const counter = document.getElementById('counter');
let counted = false;
const countIO = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting && !counted){
      counted=true;
      const target=8500,dur=1800,start=performance.now();
      function step(now){
        const p=Math.min((now-start)/dur,1);
        const val=Math.round(p*p*(3-2*p)*target);
        counter.textContent=val.toLocaleString();
        if(p<1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
  });
},{threshold:0.3});
countIO.observe(document.querySelector('.math'));

// ─── Scroll reveal ─────────────────────────────────────────────────────────
const revealIO = new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting) e.target.classList.add('visible');});
},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>revealIO.observe(el));