
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let keys = {};
document.addEventListener('keydown', e=> keys[e.code]=true);
document.addEventListener('keyup', e=> keys[e.code]=false);

const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 700;

// assets
const BG = new Image(); BG.src = '../images/background.png';
const CLOUD1 = new Image(); CLOUD1.src = '../images/cloud1.png';
const CLOUD2 = new Image(); CLOUD2.src = '../images/cloud2.png';
const PLAYER = new Image(); PLAYER.src = 'sprites/player.png';
const ENEMY = new Image(); ENEMY.src = 'sprites/enemy.png';
const BULLET = new Image(); BULLET.src = 'sprites/bullet.png';
const EX1 = new Image(); EX1.src = 'sprites/expl1.png';

// audio via WebAudio for low latency
let audioCtx = null;
let shootBuffer = null;
let musicBuffer = null;
let musicSource = null;
let musicPlaying = false;

async function initAudio(){
  try{
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const s = await fetch('sounds/shot.wav'); const sArr = await s.arrayBuffer();
    shootBuffer = await audioCtx.decodeAudioData(sArr);
    try{ const m = await fetch('sounds/music2.mp3'); const mArr = await m.arrayBuffer(); musicBuffer = await audioCtx.decodeAudioData(mArr); }catch(e){ musicBuffer=null; }
  }catch(e){ audioCtx=null; }
}
initAudio();

function playShot(){ if(audioCtx && shootBuffer){ const src = audioCtx.createBufferSource(); src.buffer = shootBuffer; src.connect(audioCtx.destination); src.start(0);} else { try{ new Audio('sounds/shot.wav').play(); }catch(e){} } }
function startMusicOnce(){ if(musicPlaying) return; musicPlaying=true; if(audioCtx && musicBuffer){ musicSource = audioCtx.createBufferSource(); musicSource.buffer = musicBuffer; musicSource.loop=true; musicSource.connect(audioCtx.destination); musicSource.start(0);} else { try{ const a=new Audio('../music2.mp3'); a.loop=true; a.play(); }catch(e){} } }

function resumeAudioAndPlay(){ try{ if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); startMusicOnce(); }catch(e){ startMusicOnce(); } }

// UI: toast, pause, mobile controls
let toastEl = null;
let pauseBtn = null;
let controlsDiv = null;
function createUI(){
  // toast (green glow)
  toastEl = document.getElementById('toast');
  // pause button top-right
  pauseBtn = document.createElement('div');
  pauseBtn.style.position='fixed'; pauseBtn.style.top='18px'; pauseBtn.style.right='12px';
  pauseBtn.style.zIndex='10002'; pauseBtn.style.width='46px'; pauseBtn.style.height='46px'; pauseBtn.style.borderRadius='10px';
  pauseBtn.style.display='flex'; pauseBtn.style.alignItems='center'; pauseBtn.style.justifyContent='center'; pauseBtn.style.cursor='pointer';
  pauseBtn.style.background='rgba(0,0,0,0.35)'; pauseBtn.style.color='white'; pauseBtn.style.fontSize='18px'; pauseBtn.innerText='⏸️';
  document.body.appendChild(pauseBtn);
  pauseBtn.addEventListener('click', ()=>{ paused = !paused; if(paused){ pauseBtn.innerText='▶️'; if(audioCtx) audioCtx.suspend(); } else { pauseBtn.innerText='⏸️'; if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); } });

  // mobile controls
  if(isMobile){
    controlsDiv = document.createElement('div');
    controlsDiv.style.position='fixed'; controlsDiv.style.left='0'; controlsDiv.style.right='0'; controlsDiv.style.bottom='12px';
    controlsDiv.style.display='flex'; controlsDiv.style.justifyContent='center'; controlsDiv.style.gap='18px'; controlsDiv.style.zIndex='10001';
    document.body.appendChild(controlsDiv);
    const styleBase = 'width:120px;height:64px;border-radius:12px;background:rgba(0,255,127,0.06);display:flex;align-items:center;justify-content:center;font-weight:800;color:#00ff7f;border:2px solid rgba(0,255,127,0.18);box-shadow:0 8px 24px rgba(0,255,127,0.06);font-size:18px;';
    const left = document.createElement('div'); left.innerText='◀'; left.style.cssText = styleBase;
    left.addEventListener('touchstart', e=>{ e.preventDefault(); keys['ArrowLeft']=true; resumeAudioAndPlay(); });
    left.addEventListener('touchend', e=>{ e.preventDefault(); keys['ArrowLeft']=false; });
    controlsDiv.appendChild(left);
    const shoot = document.createElement('div'); shoot.innerText='TAP TO SHOOT'; shoot.style.cssText = styleBase.replace('120px','260px'); shoot.style.fontSize='16px';
    shoot.addEventListener('touchstart', e=>{ e.preventDefault(); keys['Space']=true; playShot(); resumeAudioAndPlay(); });
    shoot.addEventListener('touchend', e=>{ e.preventDefault(); keys['Space']=false; });
    controlsDiv.appendChild(shoot);
    const right = document.createElement('div'); right.innerText='▶'; right.style.cssText = styleBase;
    right.addEventListener('touchstart', e=>{ e.preventDefault(); keys['ArrowRight']=true; resumeAudioAndPlay(); });
    right.addEventListener('touchend', e=>{ e.preventDefault(); keys['ArrowRight']=false; });
    controlsDiv.appendChild(right);
  }
}

// Game variables
let clouds = [{x:50,y:70,spd:0.2,img:CLOUD1},{x:250,y:40,spd:0.15,img:CLOUD2},{x:420,y:90,spd:0.18,img:CLOUD1},{x:600,y:60,spd:0.12,img:CLOUD2}];
let player = {x:368,y:520,w:64,h:64,speed:5,vx:0};
let bullets = []; let enemies = []; let score = 0; let gameOver = false; let lastShot = 0; let paused=false;

// spawn enemies
let spawnInterval = setInterval(()=>{ if(!paused && !gameOver) enemies.push({x: Math.random()*(canvas.width-48), y:-60, w:48, h:48, speed:1+Math.random()*2}); }, 900);

// update/draw, with score drawn center-top
function update(){
  if(paused || gameOver) return;
  clouds.forEach(c=>{ c.x -= c.spd; if(c.x < -220) c.x = canvas.width + 50; });
  if(keys['ArrowLeft']||keys['KeyA']) { player.x -= player.speed; player.vx=-1; }
  else if(keys['ArrowRight']||keys['KeyD']) { player.x += player.speed; player.vx=1; }
  else { player.vx=0; }
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  if(keys['Space']){
    const now = Date.now();
    if(now - lastShot > 160){ bullets.push({x: player.x + player.w/2 - 4, y: player.y, w:8, h:20, speed:9}); lastShot = now; playShot(); }
  }
  for(let i=bullets.length-1;i>=0;i--){ bullets[i].y -= bullets[i].speed; if(bullets[i].y + bullets[i].h < 0) bullets.splice(i,1); }
  for(let i=enemies.length-1;i>=0;i--){
    let en = enemies[i]; en.y += en.speed;
    let hit=false;
    for(let j=bullets.length-1;j>=0;j--){
      let b = bullets[j];
      if(b.x < en.x + en.w && b.x + b.w > en.x && b.y < en.y + en.h && b.y + b.h > en.y){
        bullets.splice(j,1); hit=true; score += 10; break;
      }
    }
    if(hit){ en.dead=true; setTimeout(()=>{ let idx=enemies.indexOf(en); if(idx!==-1) enemies.splice(idx,1); },300); continue; }
    if(player.x < en.x + en.w && player.x + player.w > en.x && player.y < en.y + en.h && player.y + player.h > en.y){ gameOver=true; showRestart(); }
    if(en.y > canvas.height + 50) enemies.splice(i,1);
  }
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(BG,0,0,canvas.width,canvas.height);
  clouds.forEach(c=> ctx.drawImage(c.img, c.x, c.y));
  bullets.forEach(b=> ctx.drawImage(BULLET, b.x, b.y, b.w, b.h));
  enemies.forEach(en=>{ if(en.dead){ ctx.drawImage(EX1, en.x-8, en.y-8, 64,64); } else { ctx.drawImage(ENEMY, en.x, en.y, en.w, en.h); } });
  ctx.drawImage(PLAYER, player.x + (player.vx*4), player.y, player.w, player.h);
  // draw centered score near top (safe on mobile)
  ctx.fillStyle='white'; ctx.font='22px monospace'; ctx.textAlign='center';
  ctx.fillText('Score: '+score, canvas.width/2, 40);
  // small hint right
  ctx.textAlign='left'; ctx.fillStyle='white'; ctx.font='14px monospace'; ctx.fillText('Pause ⏸️', 12, canvas.height-12);
  if(gameOver){
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='red'; ctx.font='56px monospace'; ctx.textAlign='center'; ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
  }
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();

// restart UI
let restartBtn = null;
function showRestart(){
  if(restartBtn) return;
  restartBtn = document.createElement('div'); restartBtn.style.position='fixed'; restartBtn.style.left='50%'; restartBtn.style.top='60%'; restartBtn.style.transform='translate(-50%,-50%)';
  restartBtn.style.padding='14px 28px'; restartBtn.style.borderRadius='10px'; restartBtn.style.background='rgba(255,43,43,0.95)'; restartBtn.style.color='white'; restartBtn.style.fontWeight='800'; restartBtn.style.zIndex='10003'; restartBtn.style.cursor='pointer'; restartBtn.style.fontSize='18px';
  restartBtn.innerText='Restart 🔁'; document.body.appendChild(restartBtn);
  restartBtn.addEventListener('click', ()=>{ resetGame(); restartBtn.remove(); restartBtn=null; });
}

function resetGame(){ bullets=[]; enemies=[]; score=0; gameOver=false; paused=false; player.x=368; try{ if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); }catch(e){} }

// on first load, if start page set gesture flag, resume audio and request fullscreen + show toast
window.addEventListener('load', ()=>{
  createUI();
  try{
    if(localStorage.getItem('mario_gesture')){
      // request fullscreen on mobile if allowed
      if(isMobile && document.documentElement.requestFullscreen){
        try{ document.documentElement.requestFullscreen(); }catch(e){}
      }
      resumeAudioAndPlay();
      // show toast green glow for 3s
      if(toastEl){ toastEl.style.display='block'; setTimeout(()=>{ toastEl.style.transition='opacity 0.6s'; toastEl.style.opacity='0'; setTimeout(()=>{ toastEl.style.display='none'; toastEl.style.opacity='1'; },600); }, 3000); }
    }
  }catch(e){}
});
