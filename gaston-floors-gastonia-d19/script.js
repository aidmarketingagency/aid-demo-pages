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
const cntIO=new IntersectionObserver(e=>{e.forEach(en=>{if(en.isIntersecting&&!counted){counted=true;const target=12000,dur=1600,start=performance.now();function step(now){const pr=Math.min((now-start)/dur,1);const val=Math.round(pr*pr*(3-2*pr)*target);counter.textContent='$'+val.toLocaleString();if(pr<1)requestAnimationFrame(step);}requestAnimationFrame(step);}}); },{threshold:0.3});
if(counter)cntIO.observe(document.querySelector('.stat-section'));
