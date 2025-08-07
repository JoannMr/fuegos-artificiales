// Fuegos artificiales mejorados con controles
const canvas = document.getElementById('canvasFuegos');
const ctx = canvas.getContext('2d');

// Ajuste a pantalla completa y DPR
function resizeCanvas(){
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Temas de color
const palettes = {
  dorado: ['#fff3b0','#ffd700','#ffdd66','#fff', '#ffefcc'],
  rosa: ['#ff6f91','#ee9ca7','#d16ba5','#ffdde1','#ffffff'],
  arcoiris: ['#ff595e','#ffca3a','#8ac926','#1982c4','#6a4c93', '#ffffff'],
  pastel: ['#ffd1dc','#ffe6a7','#bde0fe','#caffbf','#ffc6ff','#ffffff']
};

const ui = {
  tipo: document.getElementById('tipo'),
  intensidad: document.getElementById('intensidad'),
  tema: document.getElementById('tema'),
  auto: document.getElementById('auto'),
  launch: document.getElementById('launch')
};

function random(min,max){return Math.random()*(max-min)+min}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}

class Particle{
  constructor(x,y,color,shape='dot',angle=random(0,Math.PI*2),speed=random(1.8,4.5)){
    this.x=x; this.y=y; this.vx=Math.cos(angle)*speed; this.vy=Math.sin(angle)*speed;
    this.friction=0.996; this.gravity=0.014; this.alpha=1; this.decay=random(0.0025,0.007);
    this.color=color; this.size=random(1.6,3.2); this.shape=shape; this.blur=24;
  }
  update(){
    this.vx *= this.friction;
    this.vy = this.vy * this.friction + this.gravity;
    this.x += this.vx; this.y += this.vy;
    this.alpha -= this.decay;
  }
  draw(ctx){
    if(this.alpha<=0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0,this.alpha);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color; ctx.shadowBlur = this.blur;
    ctx.beginPath();
    if(this.shape==='heart'){
      const s=this.size*2; const x=this.x; const y=this.y;
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x - s, y - s, x - s, y + s*0.6, x, y + s);
      ctx.bezierCurveTo(x + s, y + s*0.6, x + s, y - s, x, y);
    }else if(this.shape==='star'){
      const spikes=5; const outer=this.size*2.2; const inner=this.size*0.9; let rot=Math.PI/2*3; let x=this.x; let y=this.y; let step=Math.PI/spikes;
      ctx.moveTo(x, y - outer);
      for(let i=0;i<spikes;i++){
        x = this.x + Math.cos(rot)*outer; y = this.y + Math.sin(rot)*outer; ctx.lineTo(x,y); rot+=step;
        x = this.x + Math.cos(rot)*inner; y = this.y + Math.sin(rot)*inner; ctx.lineTo(x,y); rot+=step;
      }
      ctx.lineTo(this.x, this.y - outer);
    }else{
      ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
}

class Firework{
  constructor({palette, type}){
    this.x = random(80, canvas.width/ (ctx.getTransform().a) - 80);
    this.y = canvas.height/ (ctx.getTransform().a);
    this.targetY = random(window.innerHeight*0.35, window.innerHeight*0.6);
    this.color = pick(palette);
    this.speed = random(3.0, 5.0);
    this.exploded = false;
    this.particles = [];
    this.trail = [];
    this.type = type;
  }
  update(){
    if(!this.exploded){
      // Trail
      this.trail.push({x:this.x, y:this.y, alpha:1});
      if(this.trail.length>10) this.trail.shift();
      this.y -= this.speed;
      // desaceleración más suave para que suba lento
      this.speed *= 0.996;
      if(this.speed < 1.0) this.speed = 1.0;
      // detona justo al cruzar el target
      if(this.y <= this.targetY){
        this.exploded = true;
        this.explode();
      }
    }else{
      this.particles.forEach(p=>p.update());
      this.particles = this.particles.filter(p=>p.alpha>0);
    }
  }
  explode(){
    const count = Math.floor(random(48, 92));
    const palette = palettes[ui.tema?.value || 'rosa'] || palettes.rosa;
    const type = this.type;
    for(let i=0;i<count;i++){
      const angle = (Math.PI*2) * (i/count) + random(-0.08, 0.08);
      let shape='dot';
      if(type==='corazones') shape='heart';
      if(type==='estrellas') shape='star';
      // otros tipos removidos
      const p=new Particle(this.x, this.y, pick(palette), shape, angle, random(0.9,2.2));
      this.particles.push(p);
    }
  }
  draw(ctx){
    if(!this.exploded){
      // rocket
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2.2, 0, Math.PI*2);
      ctx.fillStyle=this.color; ctx.shadowColor=this.color; ctx.shadowBlur=12; ctx.fill();
      // trail
      for(let i=0;i<this.trail.length;i++){
        const t=this.trail[i];
        ctx.globalAlpha = (i+1)/this.trail.length * 0.6;
        ctx.beginPath(); ctx.arc(t.x, t.y+6, 1.8, 0, Math.PI*2);
        ctx.fillStyle=this.color; ctx.shadowColor=this.color; ctx.shadowBlur=10; ctx.fill();
      }
      ctx.restore();
    }else{
      this.particles.forEach(p=>p.draw(ctx));
    }
  }
  done(){ return this.exploded && this.particles.length===0 }
}

let fireworks=[];

function spawnFirework(type){
  const palette = palettes[ui.tema?.value || 'rosa'] || palettes.rosa;
  fireworks.push(new Firework({palette, type: type || ui.tipo?.value || 'clasico'}));
}

// Auto lanzador controlado por intensidad
let autoTimer=null;
function restartAuto(){
  if(autoTimer){ clearInterval(autoTimer); autoTimer=null; }
  if(ui.auto && ui.auto.checked){
    const rate = 1600 - (parseInt(ui.intensidad?.value||'3',10)-1)*260; // 1..5
    autoTimer = setInterval(()=>spawnFirework(), Math.max(300, rate));
  }
}

// Animación principal con fundido nocturno
let lastTime=0;
function animate(ts){
  if(!lastTime) lastTime=ts; const dt=ts-lastTime; lastTime=ts;
  // Fading para persistencia ligera de brillo
  ctx.fillStyle='rgba(0,0,0,0.12)';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  fireworks.forEach(f=>{ f.update(); f.draw(ctx); });
  fireworks = fireworks.filter(f=>!f.done());
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Interacciones UI
canvas.addEventListener('click', ()=> spawnFirework());
canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); spawnFirework(); }, {passive:false});
if(ui.launch){ ui.launch.addEventListener('click', ()=> spawnFirework(ui.tipo?.value)); }
if(ui.intensidad){ ui.intensidad.addEventListener('input', restartAuto); }
if(ui.auto){ ui.auto.addEventListener('change', restartAuto); }
if(ui.tema){ ui.tema.addEventListener('change', ()=>{ /* solo afecta futuras explosiones */ }); }
if(ui.tipo){ ui.tipo.addEventListener('change', ()=>{}); }

restartAuto();
