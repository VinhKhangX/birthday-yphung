/* ================================================================
   HAPPY BIRTHDAY — script.js  (updated)
   ➜ ĐỔI MẬT KHẨU tại CONFIG.password
   ➜ ĐỔI ẢNH tại img/photo1.jpg (hoặc .png / .gif) ...
   ➜ Hỗ trợ đuôi: jpg, jpeg, png, gif, webp
   ➜ Nếu số ảnh thực tế < photoCount, sẽ random lặp lại để đủ
   ================================================================ */

const CONFIG = {
  password: "0207",
  wishName: "BeY Phụng",
  wishTitle: "Chúc Mừng Sinh Nhật",
  photoCount: 8,                     // số slot polaroid muốn hiển thị
  photoPath: "../img/photo",         // photo1.xxx ... photoN.xxx
  photoExts: ["jpg","jpeg","png","gif","webp"], // các đuôi hỗ trợ, ưu tiên theo thứ tự
  maxPhotoIndex: 12,                 // dò từ photo1 → photo12 (tăng nếu bạn có nhiều hơn)
  balloonColors: ["#ffb3cf","#ffd1a6","#c6e3ff","#d8c6ff","#ffe6a6","#ffc0dc","#b8e6d1"]
};

/* ============ UTIL ============ */
const $  = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>[...el.querySelectorAll(s)];
const rand = (a,b)=>Math.random()*(b-a)+a;
const randi = (a,b)=>Math.floor(rand(a,b+1));

/* ================================================================
   AVAILABLE PHOTOS (dò tự động các đuôi)
   ================================================================ */
// Danh sách URL ảnh thực sự tồn tại — được build ở resolvePhotos()
let PHOTO_URLS = [];
// Danh sách URL đã "đủ" photoCount (random lặp nếu thiếu)
let PHOTO_SLOTS = [];

function tryLoadImage(url){
  return new Promise(res=>{
    const img = new Image();
    img.onload = ()=>res(url);
    img.onerror = ()=>res(null);
    img.src = url;
  });
}
async function findPhotoAtIndex(i){
  for(const ext of CONFIG.photoExts){
    const url = `${CONFIG.photoPath}${i}.${ext}`;
    const ok = await tryLoadImage(url);
    if(ok) return ok;
  }
  return null;
}
async function resolvePhotos(){
  const found = [];
  const tasks = [];
  for(let i=1;i<=CONFIG.maxPhotoIndex;i++){
    tasks.push(findPhotoAtIndex(i).then(u=>{ if(u) found.push({i,u}); }));
  }
  await Promise.all(tasks);
  found.sort((a,b)=>a.i-b.i);
  PHOTO_URLS = found.map(f=>f.u);

  // Nếu không có ảnh nào, dùng placeholder gradient (data URL)
  if(PHOTO_URLS.length===0){
    PHOTO_URLS = [""]; // rỗng → hiển thị fallback trong CSS
  }

  // Fill đủ photoCount bằng cách random lặp lại
  PHOTO_SLOTS = [];
  for(let i=0;i<CONFIG.photoCount;i++){
    if(i < PHOTO_URLS.length){
      PHOTO_SLOTS.push(PHOTO_URLS[i]);
    } else {
      PHOTO_SLOTS.push(PHOTO_URLS[randi(0, PHOTO_URLS.length-1)]);
    }
  }
}
// Bắt đầu dò ngay khi tải trang
const photosReady = resolvePhotos();

/* ================================================================
   1. BACKGROUND PARTICLES
   ================================================================ */
(function initBgParticles(){
  const c = $("#bg-particles");
  const ctx = c.getContext("2d");
  let W,H,parts=[];
  const TYPES = ["heart","sparkle","petal","star"];

  function resize(){
    W = c.width  = window.innerWidth  * devicePixelRatio;
    H = c.height = window.innerHeight * devicePixelRatio;
    c.style.width = window.innerWidth+"px";
    c.style.height= window.innerHeight+"px";
  }
  resize();
  window.addEventListener("resize",resize);

  function spawn(){
    const type = TYPES[randi(0,TYPES.length-1)];
    return {
      type,
      x: rand(0,W),
      y: rand(H*.2, H+40),
      s: rand(6,18)*devicePixelRatio,
      vy:-rand(.15,.55)*devicePixelRatio,
      vx: rand(-.15,.15)*devicePixelRatio,
      a: rand(.25,.75),
      rot: rand(0,Math.PI*2),
      vr: rand(-.01,.01),
      hue: type==="petal" ? rand(340,360) : rand(320,355)
    };
  }
  for(let i=0;i<70;i++) parts.push(spawn());

  function drawHeart(x,y,s,rot,color){
    ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s/20,s/20);
    ctx.fillStyle = color;ctx.beginPath();
    ctx.moveTo(0,-6);
    ctx.bezierCurveTo(10,-16,20,-2,0,12);
    ctx.bezierCurveTo(-20,-2,-10,-16,0,-6);
    ctx.fill();ctx.restore();
  }
  function drawPetal(x,y,s,rot,color){
    ctx.save();ctx.translate(x,y);ctx.rotate(rot);
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.ellipse(0,0,s*.5,s,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  function drawSparkle(x,y,s,color){
    ctx.save();ctx.translate(x,y);
    const grd = ctx.createRadialGradient(0,0,0,0,0,s);
    grd.addColorStop(0,color);grd.addColorStop(1,"transparent");
    ctx.fillStyle=grd;ctx.beginPath();ctx.arc(0,0,s,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  function drawStar(x,y,s,rot,color){
    ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle=color;
    ctx.beginPath();
    for(let i=0;i<5;i++){
      ctx.lineTo(Math.cos((i*4*Math.PI)/5)*s, Math.sin((i*4*Math.PI)/5)*s);
    }
    ctx.closePath();ctx.fill();ctx.restore();
  }

  function tick(){
    ctx.clearRect(0,0,W,H);
    for(const p of parts){
      p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;
      if(p.y < -30) { Object.assign(p, spawn(), {y:H+20}); }
      const color = `hsla(${p.hue},80%,75%,${p.a})`;
      if(p.type==="heart")   drawHeart(p.x,p.y,p.s,p.rot,color);
      else if(p.type==="petal") drawPetal(p.x,p.y,p.s,p.rot,color);
      else if(p.type==="star")  drawStar(p.x,p.y,p.s*.5,p.rot,`hsla(45,90%,80%,${p.a})`);
      else drawSparkle(p.x,p.y,p.s,`hsla(0,0%,100%,${p.a*.8})`);
    }
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ================================================================
   2. LOCK SCREEN
   ================================================================ */
(function initLock(){
  const dots = $$("#dots .dot");
  const keys = $("#keys");
  const card = $(".lock-card");
  const errMsg = $("#err-msg");
  const heart  = $("#heart-top");
  const frame  = $(".photo-frame");
  let buf = "";

  function updateDots(){
    dots.forEach((d,i)=>d.classList.toggle("on", i<buf.length));
  }
  function shake(){
    card.classList.add("shake");
    errMsg.classList.add("show");
    heart.classList.add("beat");
    setTimeout(()=>{ card.classList.remove("shake"); heart.classList.remove("beat"); },600);
    setTimeout(()=>errMsg.classList.remove("show"),1800);
  }
  function success(){
    frame.classList.add("unlocked");
    heart.classList.add("beat");
    setTimeout(startTransition,700);
  }
  function press(k){
    if(k === "back"){ buf = buf.slice(0,-1); updateDots(); return; }
    if(buf.length>=4) return;
    buf += k; updateDots();
    if(buf.length===4){
      setTimeout(()=>{
        if(buf===CONFIG.password) success();
        else { shake(); buf=""; updateDots(); }
      },220);
    }
  }
  keys.addEventListener("click", e=>{
    const btn = e.target.closest(".key");
    if(!btn || btn.classList.contains("key-ghost")) return;
    const k = btn.dataset.k;
    const r = document.createElement("span");
    r.className="ripple";
    const rect = btn.getBoundingClientRect();
    r.style.left = (e.clientX-rect.left)+"px";
    r.style.top  = (e.clientY-rect.top)+"px";
    r.style.width = r.style.height = "20px";
    btn.appendChild(r);
    setTimeout(()=>r.remove(),600);
    btn.classList.remove("pressed");void btn.offsetWidth;btn.classList.add("pressed");
    press(k);
  });
  window.addEventListener("keydown", e=>{
    if($("#lock-screen").classList.contains("active")===false) return;
    if(/^[0-9]$/.test(e.key)) press(e.key);
    else if(e.key==="Backspace") press("back");
  });
})();

/* ================================================================
   3. TRANSITION → GIFT SCENE
   ================================================================ */
function startTransition(){
  const lock = $("#lock-screen");
  const gift = $("#gift-scene");
  const trans= $("#transition");
  spawnPetalBurst();
  lock.classList.add("leaving");
  trans.classList.add("on");
  setTimeout(()=>{
    lock.classList.remove("active","leaving");
    gift.classList.add("active","entering");
    initGiftScene();
    playMusic();
  },900);
  setTimeout(()=>{
    trans.classList.remove("on");
    gift.classList.remove("entering");
  },1900);
}

function spawnPetalBurst(){
  const layer = document.createElement("div");
  Object.assign(layer.style,{position:"fixed",inset:0,pointerEvents:"none",zIndex:60});
  document.body.appendChild(layer);
  for(let i=0;i<40;i++){
    const p = document.createElement("div");
    Object.assign(p.style,{
      position:"absolute",
      left: window.innerWidth/2+"px",
      top:  window.innerHeight/2+"px",
      width:"12px",height:"18px",borderRadius:"60% 40% 60% 40%",
      background:`hsl(${rand(330,355)},85%,80%)`,
      transform:`translate(-50%,-50%) rotate(${rand(0,360)}deg)`,
      opacity:1, transition:"transform 1.4s cubic-bezier(.22,.61,.36,1),opacity 1.4s"
    });
    layer.appendChild(p);
    requestAnimationFrame(()=>{
      const a = rand(0,Math.PI*2), d = rand(200,500);
      p.style.transform = `translate(${Math.cos(a)*d-6}px,${Math.sin(a)*d-9}px) rotate(${rand(180,720)}deg)`;
      p.style.opacity = 0;
    });
  }
  setTimeout(()=>layer.remove(),1800);
}

/* ================================================================
   4. MUSIC
   ================================================================ */
function playMusic(){
  const a = $("#bgm"); if(!a) return;
  a.volume = 0;
  a.play().then(()=>{
    let v=0;
    const t = setInterval(()=>{
      v = Math.min(1, v+.05);
      a.volume = v*.7;
      if(v>=1) clearInterval(t);
    },80);
  }).catch(()=>{});
}

/* ================================================================
   5. GIFT SCENE
   ================================================================ */
let giftOpened = false;
function initGiftScene(){
  const box = $("#gift-box");
  box.addEventListener("click", openGift, {once:true});
  initFireworks();
}
function openGift(){
  if(giftOpened) return; giftOpened = true;
  const box = $("#gift-box");
  const wrap = $("#gift-wrap");
  box.classList.add("press");
  setTimeout(()=>{
    box.classList.remove("press");
    box.classList.add("open");
    triggerFireworks();
    launchConfetti();
    setTimeout(()=>{
      wrap.classList.add("hide");
      revealCelebrate();
      launchBalloons();
    },900);
  },500);
}

/* ============ CELEBRATE ============ */
async function revealCelebrate(){
  const cel = $("#celebrate");
  cel.classList.add("show");
  // đợi resolve xong (thường đã xong từ lâu)
  await photosReady;
  spawnPolaroids();
  initWishToggle();
  initLightbox();
}
function typeWriter(el, text, speed){
  el.textContent = "";
  let i=0;
  const t = setInterval(()=>{
    el.textContent += text[i++]||"";
    if(i>=text.length) clearInterval(t);
  }, speed);
}

/* ============ WISH TOGGLE (nút mở lời chúc) ============ */
let wishTyped = false;
function initWishToggle(){
  const btn = $("#wish-toggle");
  const overlay = $("#wish-overlay");
  const closeBtn = $("#wish-close");

  function openWish(){
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden","false");
    btn.classList.add("hide");
    if(!wishTyped){
      wishTyped = true;
      typeWriter($("#wish-line-1"), CONFIG.wishTitle, 60);
      setTimeout(()=>typeWriter($("#wish-line-2"), CONFIG.wishName, 90), 1400);
    }
  }
  function closeWish(){
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden","true");
    btn.classList.remove("hide");
  }
  btn.addEventListener("click", openWish);
  closeBtn.addEventListener("click", closeWish);
  overlay.addEventListener("click", e=>{
    if(e.target===overlay) closeWish();
  });
  window.addEventListener("keydown", e=>{
    if(e.key==="Escape" && overlay.classList.contains("show")) closeWish();
  });
}

/* ============ POLAROIDS ============ */
function spawnPolaroids(){
  const box = $("#polaroids");
  box.innerHTML = "";
  const W = window.innerWidth, H = window.innerHeight;
  const positions = [
    {x:.06,y:.10,r:-8},{x:.80,y:.08,r:7},
    {x:.03,y:.55,r:9}, {x:.83,y:.58,r:-10},
    {x:.12,y:.80,r:-4},{x:.76,y:.83,r:6},
    {x:.02,y:.34,r:12},{x:.88,y:.35,r:-12}
  ];
  const caps = ["memory","smile","forever","us","sunshine","cutie","love","♡"];
  const count = Math.min(CONFIG.photoCount, PHOTO_SLOTS.length);
  for(let i=0;i<count;i++){
    const p = positions[i%positions.length];
    const el = document.createElement("div");
    el.className = "polaroid";
    el.style.setProperty("--r", p.r+"deg");
    el.style.left = (p.x*W)+"px";
    el.style.top  = (p.y*H)+"px";
    if(W<700){
      el.style.left = "";
      el.style.right = i%2 ? "auto" : "-16px";
      if(i%2) el.style.left = "-16px";
      el.style.top = (8 + (i*10))+"%";
      if(i>=4) el.style.top = (58 + ((i-4)*9))+"%";
    }
    const src = PHOTO_SLOTS[i] || "";
    el.dataset.idx = i;
    el.innerHTML = `
      <img src="${src}" alt="photo ${i+1}"
           onerror="this.style.background='linear-gradient(135deg,#ffd7e6,#ffe9d6)';this.removeAttribute('src');"/>
      <span class="cap">${caps[i%caps.length]}</span>
    `;
    el.style.animationDelay = (i*.15)+"s";
    el.addEventListener("click", ()=>openLightbox(i));
    box.appendChild(el);
    setTimeout(()=>el.classList.add("in"), 100 + i*150);
  }
}

/* ============ LIGHTBOX ============ */
let lbIndex = 0;
function initLightbox(){
  const lb    = $("#lightbox");
  const close = $("#lb-close");
  const prev  = $("#lb-prev");
  const next  = $("#lb-next");
  close.addEventListener("click", closeLightbox);
  prev.addEventListener("click", ()=>navLightbox(-1));
  next.addEventListener("click", ()=>navLightbox(1));
  lb.querySelectorAll("[data-lb-close]").forEach(el=>el.addEventListener("click", closeLightbox));
  window.addEventListener("keydown", e=>{
    if(!lb.classList.contains("show")) return;
    if(e.key==="Escape") closeLightbox();
    else if(e.key==="ArrowLeft") navLightbox(-1);
    else if(e.key==="ArrowRight") navLightbox(1);
  });
  // swipe on mobile
  let sx=0;
  lb.addEventListener("touchstart", e=>{ sx = e.touches[0].clientX; }, {passive:true});
  lb.addEventListener("touchend", e=>{
    const dx = (e.changedTouches[0].clientX - sx);
    if(Math.abs(dx)>50) navLightbox(dx<0 ? 1 : -1);
  });
}
function openLightbox(i){
  if(!PHOTO_SLOTS.length) return;
  lbIndex = i;
  renderLightbox();
  const lb = $("#lightbox");
  lb.classList.add("show");
  lb.setAttribute("aria-hidden","false");
}
function closeLightbox(){
  const lb = $("#lightbox");
  lb.classList.remove("show");
  lb.setAttribute("aria-hidden","true");
}
function navLightbox(dir){
  const n = PHOTO_SLOTS.length;
  lbIndex = (lbIndex + dir + n) % n;
  renderLightbox(true);
}
function renderLightbox(animate){
  const img = $("#lb-img");
  const counter = $("#lb-counter");
  const src = PHOTO_SLOTS[lbIndex] || "";
  if(animate){
    img.style.transition = "opacity .2s, transform .3s";
    img.style.opacity = "0";
    img.style.transform = "scale(.95)";
    setTimeout(()=>{
      img.src = src;
      img.style.opacity = "1";
      img.style.transform = "scale(1)";
    }, 180);
  } else {
    img.src = src;
    img.style.opacity = "1";
    img.style.transform = "scale(1)";
  }
  counter.textContent = `${lbIndex+1} / ${PHOTO_SLOTS.length}`;
}

/* ============ BALLOONS ============ */
function launchBalloons(){
  const layer = $("#balloons");
  const total = 24;
  for(let i=0;i<total;i++){
    setTimeout(()=>{
      const b = document.createElement("div");
      b.className = "balloon";
      const size = randi(38, 70);
      b.style.width = size+"px";
      b.style.height = (size*1.25)+"px";
      b.style.left = rand(0,100)+"%";
      b.style.animationDuration = rand(9,16)+"s";
      const withPhoto = PHOTO_SLOTS.length && Math.random() < .35;
      if(withPhoto){
        b.classList.add("photo");
        const src = PHOTO_SLOTS[randi(0, PHOTO_SLOTS.length-1)];
        b.innerHTML = `<img src="${src}"
          onerror="this.remove();this.parentNode.style.background='${CONFIG.balloonColors[randi(0,CONFIG.balloonColors.length-1)]}'"/>`;
      } else {
        b.style.background = `radial-gradient(circle at 30% 30%,#fff,${CONFIG.balloonColors[randi(0,CONFIG.balloonColors.length-1)]})`;
      }
      layer.appendChild(b);
      setTimeout(()=>b.remove(), 17000);
    }, i*400);
  }
  setTimeout(launchBalloons, total*400 + 3000);
}

/* ================================================================
   6. FIREWORKS
   ================================================================ */
let fwCtx, fwW, fwH, fwParts=[], fwActive=false;
function initFireworks(){
  const c = $("#fireworks");
  fwCtx = c.getContext("2d");
  function resize(){
    fwW = c.width  = window.innerWidth * devicePixelRatio;
    fwH = c.height = window.innerHeight * devicePixelRatio;
    c.style.width  = window.innerWidth+"px";
    c.style.height = window.innerHeight+"px";
  }
  resize();window.addEventListener("resize",resize);
  fwActive = true;
  loopFw();
}
const FW_COLORS = ["#ff5c8a","#ffffff","#ffd680","#ff90b3","#ffb56b","#ffe0ec"];
function burst(x,y){
  const n = randi(40,70);
  for(let i=0;i<n;i++){
    const a = (Math.PI*2)*(i/n);
    const sp = rand(2,6)*devicePixelRatio;
    fwParts.push({
      x,y,
      vx: Math.cos(a)*sp, vy: Math.sin(a)*sp,
      life: rand(50,90), age:0,
      color: FW_COLORS[randi(0,FW_COLORS.length-1)],
      size: rand(1.5,3)*devicePixelRatio
    });
  }
}
function triggerFireworks(){
  let count = 0;
  const iv = setInterval(()=>{
    burst(rand(fwW*.15,fwW*.85), rand(fwH*.15,fwH*.55));
    if(++count>10) clearInterval(iv);
  }, 450);
}
function loopFw(){
  if(!fwActive) return;
  fwCtx.fillStyle = "rgba(255,247,251,.15)";
  fwCtx.fillRect(0,0,fwW,fwH);
  for(let i=fwParts.length-1;i>=0;i--){
    const p = fwParts[i];
    p.age++;
    p.x += p.vx; p.y += p.vy;
    p.vy += .04*devicePixelRatio;
    p.vx *= .99; p.vy *= .99;
    const alpha = 1 - p.age/p.life;
    fwCtx.beginPath();
    fwCtx.fillStyle = p.color;
    fwCtx.globalAlpha = Math.max(0,alpha);
    fwCtx.arc(p.x,p.y,p.size,0,Math.PI*2);
    fwCtx.fill();
    fwCtx.globalAlpha = Math.max(0,alpha*.3);
    fwCtx.arc(p.x,p.y,p.size*3,0,Math.PI*2);
    fwCtx.fill();
    if(p.age>=p.life) fwParts.splice(i,1);
  }
  fwCtx.globalAlpha = 1;
  requestAnimationFrame(loopFw);
}

/* ================================================================
   7. CONFETTI
   ================================================================ */
function launchConfetti(){
  const layer = document.createElement("div");
  Object.assign(layer.style,{position:"fixed",inset:0,pointerEvents:"none",zIndex:40,overflow:"hidden"});
  document.body.appendChild(layer);
  const colors = ["#ff5c8a","#ffd680","#ffffff","#ffb56b","#ff90b3","#e63455"];
  for(let i=0;i<120;i++){
    const c = document.createElement("div");
    const size = randi(6,12);
    Object.assign(c.style,{
      position:"absolute",
      left: rand(0,100)+"%",
      top:"-20px",
      width:size+"px",height:(size*.5)+"px",
      background: colors[randi(0,colors.length-1)],
      transform:`rotate(${rand(0,360)}deg)`,
      opacity:.9,
      borderRadius:"2px",
      transition:`transform ${rand(3,6)}s linear, top ${rand(3,6)}s linear, opacity 1s`
    });
    layer.appendChild(c);
    requestAnimationFrame(()=>{
      c.style.top = (window.innerHeight+40)+"px";
      c.style.transform = `translateX(${rand(-120,120)}px) rotate(${rand(360,1440)}deg)`;
    });
    setTimeout(()=>c.style.opacity=0, 4500);
  }
  setTimeout(()=>layer.remove(), 7000);
}
