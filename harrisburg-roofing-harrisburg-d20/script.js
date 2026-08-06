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
const thread=document.getElementById('thread');
const bubbles=[
  {el:document.getElementById('b1'),typing:null,delay:600},
  {el:document.getElementById('b2'),typing:document.getElementById('typing1'),delay:1400},
  {el:document.getElementById('b3'),typing:null,delay:3800},
  {el:document.getElementById('b4'),typing:document.getElementById('typing2'),delay:4600},
];
let timers=[];let played=false;
function clearTimers(){timers.forEach(t=>clearTimeout(t));timers=[];}
function resetThread(){clearTimers();bubbles.forEach(b=>{b.el.style.opacity='0';if(b.typing)b.typing.classList.remove('visible');});played=false;}
function playThread(){if(played)return;played=true;bubbles.forEach(b=>{if(b.typing){timers.push(setTimeout(()=>b.typing.classList.add('visible'),b.delay));timers.push(setTimeout(()=>{b.typing.classList.remove('visible');b.el.style.opacity='1';},b.delay+900));}else{timers.push(setTimeout(()=>b.el.style.opacity='1',b.delay));}}); }
const playIO=new IntersectionObserver(e=>{e.forEach(en=>{if(en.isIntersecting)playThread();});},{threshold:0.2});
const rearmIO=new IntersectionObserver(e=>{e.forEach(en=>{if(!en.isIntersecting)resetThread();});},{threshold:0});
const rect=thread.getBoundingClientRect();
if(rect.top<window.innerHeight&&rect.bottom>0){playThread();}else{playIO.observe(thread);}
rearmIO.observe(thread);
document.getElementById('replay').addEventListener('click',()=>{resetThread();setTimeout(playThread,80);});

const counter=document.getElementById('counter');let counted=false;
const cntIO=new IntersectionObserver(e=>{e.forEach(en=>{if(en.isIntersecting&&!counted){counted=true;const target=14500,dur=1600,start=performance.now();function step(now){const pr=Math.min((now-start)/dur,1);const val=Math.round(pr*pr*(3-2*pr)*target);counter.textContent='$'+val.toLocaleString();if(pr<1)requestAnimationFrame(step);}requestAnimationFrame(step);}});},{threshold:0.3});
if(counter)cntIO.observe(document.querySelector('.stat-section'));

// Visit beacon
(function(){var s={slug:'harrisburg-roofing-harrisburg-d20',page_url:location.href,referrer:document.referrer,ua:navigator.userAgent.slice(0,120)};fetch('https://aid-interactive-db.netlify.app/.netlify/functions/demo-beacon',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(s),mode:'cors',keepalive:true}).catch(function(){});})();
