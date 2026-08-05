const thread = document.getElementById('thread');
const bubbles = [
  {el:document.getElementById('b1'),typing:null,delay:0},
  {el:document.getElementById('b2'),typing:document.getElementById('typing1'),delay:1000},
  {el:document.getElementById('b3'),typing:null,delay:3200},
  {el:document.getElementById('b4'),typing:document.getElementById('typing2'),delay:4800},
];
let timers=[];let played=false;
function clearTimers(){timers.forEach(t=>clearTimeout(t));timers=[];}
function resetThread(){clearTimers();bubbles.forEach(b=>{b.el.style.opacity='0';if(b.typing)b.typing.classList.remove('visible');});played=false;}
function playThread(){if(played)return;played=true;bubbles.forEach((b)=>{if(b.typing){timers.push(setTimeout(()=>b.typing.classList.add('visible'),b.delay));timers.push(setTimeout(()=>{b.typing.classList.remove('visible');b.el.style.opacity='1';},b.delay+950));}else{timers.push(setTimeout(()=>b.el.style.opacity='1',b.delay));}});}
const playIO=new IntersectionObserver(e=>{e.forEach(en=>{if(en.isIntersecting)playThread();});},{threshold:0.2});
const rearmIO=new IntersectionObserver(e=>{e.forEach(en=>{if(!en.isIntersecting)resetThread();});},{threshold:0});
const rect=thread.getBoundingClientRect();
if(rect.top<window.innerHeight&&rect.bottom>0){playThread();}else{playIO.observe(thread);}
rearmIO.observe(thread);
document.getElementById('replay').addEventListener('click',()=>{resetThread();setTimeout(playThread,100);});
const counter=document.getElementById('counter');let counted=false;
const cntIO=new IntersectionObserver(e=>{e.forEach(en=>{if(en.isIntersecting&&!counted){counted=true;const target=500,dur=2000,start=performance.now();function step(now){const p=Math.min((now-start)/dur,1);const val=Math.round(p*p*(3-2*p)*target);counter.textContent=val.toLocaleString();if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}});},{threshold:0.3});
cntIO.observe(document.querySelector('.math'));
const revIO=new IntersectionObserver(e=>{e.forEach(en=>{if(en.isIntersecting)en.target.classList.add('visible');});},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>revIO.observe(el));