
/* ======================================
   CONFIG — EDIT DI SINI AGAR NAMA SESUAI
   ====================================== */
const CONFIG = {
  nameDia   : "Sayang",                       // ← nama pacar
  nameAku   : "Kamu",                         // ← nama kamu
  anniversaryDate: new Date("2026-09-07T00:00:00"), // ← tanggal anniversary
  startDate      : new Date("2025-09-07T00:00:00"), // ← tanggal mulai pacaran
  pin       : "070925",                       // ← PIN akses (6 digit)
};

/* ===== 5 LAYER GATE ===== */
(function(){
  const PIN     = CONFIG.pin;
  const WORD    = 'AISRYNNN';           // ← kata rahasia layer 4
  const KEYEL   = document.getElementById('lock-error');
  const RIDEL   = document.getElementById('riddle-error');
  const WORDEL  = document.getElementById('word-error');
  let input = '';
  let current = 1;
  const dots  = ['d0','d1','d2','d3','d4','d5'];
  const TOTAL_LAYERS = 5;
  const layerIds = ['layer1','layer2','layer3','layer4','layer5'];

  /* --- Layer navigation helpers --- */
  function showLayer(n){
    current = n;
    layerIds.forEach((id,i)=>{
      document.getElementById(id).classList.toggle('hidden', (i+1)!==n);
    });
  }
  function advance(){
    if(current===TOTAL_LAYERS) unlock();
    else showLayer(current+1);
  }

  /* --- Layer 1: PIN --- */
  function render(){
    dots.forEach((id,i)=>{
      document.getElementById(id).classList.toggle('filled', i<input.length);
    });
  }
  function pinSuccess(){ showLayer(2); }
  function pinFail(){
    input=''; render();
    KEYEL.textContent = 'Kode salah, coba lagi ya';
    KEYEL.classList.remove('shake'); void KEYEL.offsetWidth; KEYEL.classList.add('shake');
    setTimeout(()=>{ KEYEL.textContent=''; }, 1800);
  }
  window.lkPress = k=>{
    if(current!==1) return;
    if(input.length>=6) return;
    input += k; render();
    if(input.length===6){ input===PIN ? setTimeout(pinSuccess, 200) : setTimeout(pinFail, 260); }
  };
  window.lkBack = ()=>{ if(current!==1) return; input = input.slice(0,-1); render(); };

  /* --- Layer 2: Riddle --- */
  window.riddleAnswer = (el, correct)=>{
    if(current!==2) return;
    if(correct){
      el.classList.add('correct');
      setTimeout(()=>showLayer(3), 650);
    } else {
      el.classList.add('wrong');
      RIDEL.textContent = 'Hmm... bukan itu. Pikir lagi 🥲';
      RIDEL.classList.remove('shake'); void RIDEL.offsetWidth; RIDEL.classList.add('shake');
      setTimeout(()=>{ el.classList.remove('wrong'); RIDEL.textContent=''; }, 1100);
    }
  };

  /* --- Layer 3: Drag & drop susun 4 potongan foto --- */
  const DD_N = 2;                  // 2x2 = 4 potong
  const DD_TOTAL = DD_N*DD_N;
  let ddImg = '';
  let ddState = [];                // slot → potongan id (0..3) atau -1 kosong
  let ddTrayIdx = [];              // daftar potongan yang masih di tray
  let ddSolved = false;

  function selectDdImage(){
    try{
      const slides = window.AIV_DATA && window.AIV_DATA.slides;
      // cari foto dari babak 2/3 (foto tengah) yang pasti ada
      const cand = [slides[1], slides[2]];
      for(const s of cand){
        if(s && s.photos && s.photos.length){
          const p = s.photos[Math.floor(s.photos.length/2)];
          if(p) return p.src;
        }
      }
    }catch(e){}
    return 'photos-aniv/web/IMG-20251115-WA0001.jpg';
  }
  function bgFor(pieceId){
    // potongan pieceId → posisi background di foto utuh
    const r = Math.floor(pieceId/DD_N), c = pieceId%DD_N;
    const posX = c*(100/(DD_N-1)), posY = r*(100/(DD_N-1));
    return `background-image:url('${ddImg}');background-size:${DD_N*100}% ${DD_N*100}%;background-position:${posX}% ${posY}%`;
  }
  function ddReset(){
    if(current!==3 && ddImg!=='' ) return;  // init (ddImg belum set) boleh jalan
    ddSolved = false;
    ddState = Array(DD_TOTAL).fill(-1);
    ddTrayIdx = [0,1,2,3];
    // acak urutan tray
    for(let i=ddTrayIdx.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [ddTrayIdx[i],ddTrayIdx[j]]=[ddTrayIdx[j],ddTrayIdx[i]];
    }
    renderDd();
  }
  function renderDd(){
    const drop = document.getElementById('ddDrop');
    const tray = document.getElementById('ddTray');
    if(!drop || !tray) return;
    if(!ddImg) ddImg = selectDdImage();
    // render slot
    drop.innerHTML='';
    ddState.forEach((pieceId, i)=>{
      const slot = document.createElement('div');
      slot.className = 'dd-slot' + (pieceId>-1 ? ' dd-filled':'');
      if(pieceId>-1) slot.setAttribute('style', bgFor(pieceId));
      slot.setAttribute('data-idx', i);
      slot.ondragover = e=>{ e.preventDefault(); };
      slot.ondrop = e=>{
        e.preventDefault();
        const pid = +(e.dataTransfer.getData('text/plain'));
        if(Number.isInteger(pid) && ddTrayIdx.includes(pid)) placePiece(pid, i);
      };
      slot.addEventListener('click', ()=>{ slotClick(i); });
      drop.appendChild(slot);
    });
    // render tray
    tray.innerHTML='';
    ddTrayIdx.forEach(pieceId=>{
      const p = document.createElement('div');
      p.className='dd-piece';
      p.setAttribute('style', bgFor(pieceId));
      p.draggable = true;
      p.addEventListener('dragstart', e=>{
        e.dataTransfer.setData('text/plain', String(pieceId));
        p.classList.add('dragging');
      });
      p.addEventListener('dragend', ()=>p.classList.remove('dragging'));
      p.addEventListener('click', ()=>{ trayClick(pieceId); });
      tray.appendChild(p);
    });
  }
  function placePiece(pieceId, slotIdx){
    // taruh potongan ke slot; kalau slot diisi, kembalikan ke tray
    const prev = ddState[slotIdx];
    ddState[slotIdx] = pieceId;
    ddTrayIdx = ddTrayIdx.filter(x=>x!==pieceId);
    if(prev>-1) ddTrayIdx.push(prev);
    renderDd();
    checkDdWin();
  }
  function slotClick(i){
    if(current!==3 || ddSolved) return;
    // kalau klik slot terisi, kembalikan ke tray
    if(ddState[i]>-1){
      ddTrayIdx.push(ddState[i]);
      ddState[i] = -1;
      renderDd();
      return;
    }
    // kalau kosong & ada potongan di tray → ambil pertama
    if(ddTrayIdx.length){
      const pid = ddTrayIdx[0];
      placePiece(pid, i);
    }
  }
  function trayClick(pieceId){
    if(current!==3 || ddSolved) return;
    // kalau ada slot kosong → taruh di slot kosong pertama
    const empty = ddState.indexOf(-1);
    if(empty>-1) placePiece(pieceId, empty);
  }
  function checkDdWin(){
    const won = ddState.every((v,i)=>v===i);
    if(won){
      ddSolved=true;
      document.getElementById('ddDrop').classList.add('dd-glow');
      setTimeout(()=>{ showLayer(4); }, 600);
    }
  }

  /* --- Layer 4: Ketik kata rahasia --- */
  function wordRender(){
    const slots = document.querySelectorAll('#word-slots .w-slot');
    slots.forEach((s,i)=>{
      s.textContent = i<input.length ? input[i] : '';
      s.classList.toggle('filled', i<input.length);
    });
  }
  function wordFail(){
    input=''; wordRender();
    WORDEL.textContent = 'Belum tepat... ingat kata rahasia kita 💭';
    WORDEL.classList.remove('shake'); void WORDEL.offsetWidth; WORDEL.classList.add('shake');
    setTimeout(()=>{ WORDEL.textContent=''; }, 1800);
  }
  window.wordPress = ch=>{
    if(current!==4) return;
    if(input.length>=WORD.length) return;
    input += ch; wordRender();
    if(input.length===WORD.length){
      input.toUpperCase()===WORD.toUpperCase() ? setTimeout(()=>showLayer(5), 200) : setTimeout(wordFail, 200);
    }
  };
  window.wordBack = ()=>{ if(current!==4) return; input = input.slice(0,-1); wordRender(); };

  /* --- Layer 5: Hold-to-reveal --- */
  const HOLD_MS = 3000;
  const CIRC   = 2*Math.PI*72;
  let holdTimer=null, holdStartT=0, isHolding=false;

  function setupHoldProgress(){
    const ring = document.getElementById('hold-prog');
    if(ring) ring.style.strokeDasharray = CIRC+'px';
  }
  function holdStart(ev){
    if(current!==5) return;
    if(ev && typeof ev.preventDefault==='function') ev.preventDefault();
    if(isHolding) return;
    isHolding = true;
    holdStartT = Date.now();
    document.getElementById('hold-btn').classList.add('charging');
    tick();
  }
  function tick(){
    if(!isHolding) return;
    const ring  = document.getElementById('hold-prog');
    const pct   = document.getElementById('hold-pct');
    const label = document.getElementById('hold-label');
    const btn   = document.getElementById('hold-btn');
    const prog  = Math.min(1,(Date.now()-holdStartT)/HOLD_MS);
    ring.style.strokeDashoffset = (CIRC*(1-prog))+'px';
    pct.textContent = Math.round(prog*100)+'%';
    if(prog>=1){
      isHolding=false;
      btn.classList.remove('charging'); btn.classList.add('done');
      label.textContent='Terbuka!';
      ring.style.strokeDashoffset='0';
      setTimeout(unlock, 400);
      return;
    }
    holdTimer = setTimeout(tick, 40);
  }
  function holdEnd(){
    if(document.getElementById('hold-btn').classList.contains('done')) return;
    isHolding = false;
    if(holdTimer){ clearTimeout(holdTimer); holdTimer=null; }
    const ring = document.getElementById('hold-prog');
    if(!ring) return;
    document.getElementById('hold-btn').classList.remove('charging');
    ring.style.strokeDashoffset = CIRC+'px';
    document.getElementById('hold-pct').textContent='0%';
  }

  /* --- Unlock --- */
  function unlock(){
    layerIds.forEach(id=>document.getElementById(id).classList.add('hidden'));
    document.body.style.overflow='';
  }

  /* --- Keyboard fisik --- */
  document.addEventListener('keydown', e=>{
    if(current===1){
      if(/^[0-9]$/.test(e.key)) window.lkPress(e.key);
      if(e.key==='Backspace') window.lkBack();
      if(e.key==='Enter' && input.length){ input===PIN ? pinSuccess() : pinFail(); }
    }
    if(current===4){
      if(/^[a-zA-Z]$/.test(e.key)) window.wordPress(e.key.toUpperCase());
      if(e.key==='Backspace') window.wordBack();
    }
  });

  /* Blokir menu konteks + attach hold events */
  const holdBtn = document.getElementById('hold-btn');
  if(holdBtn){
    holdBtn.addEventListener('contextmenu', e=>e.preventDefault());
    holdBtn.addEventListener('mousedown',   holdStart, { passive: false });
    holdBtn.addEventListener('mouseup',     holdEnd);
    holdBtn.addEventListener('mouseleave',  holdEnd);
    holdBtn.addEventListener('touchstart',  holdStart, { passive: false });
    holdBtn.addEventListener('touchend',    holdEnd,   { passive: false });
    holdBtn.addEventListener('touchcancel', holdEnd,   { passive: false });
  }

  /* --- Build keyboard huruf (layer 4) --- */
  (function(){
    const kb = document.getElementById('keyboard');
    if(!kb) return;
    const rows = ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
    rows.forEach(rowText=>{
      const row = document.createElement('div');
      row.className = 'kb-row';
      [...rowText].forEach(ch=>{
        const b = document.createElement('button');
        b.className = 'kb-key';
        b.textContent = ch;
        b.onclick = ()=>wordPress(ch);
        row.appendChild(b);
      });
      kb.appendChild(row);
    });
  })();

  /* --- Init drag & drop (layer 3) --- */
  ddImg = selectDdImage();
  ddReset();

  /* Lock scroll + init */
  document.body.style.overflow='hidden';
  render();
  setupHoldProgress();
  showLayer(1);
})();

const LETTER = `Untuk ${CONFIG.nameDia},

Kalau kamu lagi baca ini, berarti sudah setahun kita melewati hari-hari bersama. Satu tahun. 365 hari. Dan rasanya kayak mimpi yang nggak mau aku akhiri.

Aku masih ingat gimana pertama kita ketemu — deg-degan, canggung, tapi ada sesuatu yang beda. Dan sekarang, kamu sudah jadi orang paling aku sayangi.

Makasih sudah ada di hari-hari biasa maupun hari-hari sulit. Makasih sudah mau dengerin, mau nemenin, dan mau ngerti.

Foto-foto di bawah itu bukan sekadar gambar. Itu potongan-potongan kecil kebahagiaan yang sudah kita buat bareng. Dan aku harap kita bisa terus membuat lebih banyak lagi.

Happy Anniversary, ${CONFIG.nameDia}.
Semoga cinta ini tumbuh makin besar setiap harinya.

                    — ${CONFIG.nameAku}`;

/* ======================================
   FOTO — 72 foto, berurutan per bulan
   ====================================== */
const PHOTOS = [
  {src:"photos/2025-08-10-01.jpg", month:"Agustus 2025"},
  {src:"photos/2025-08-17-01.jpg", month:"Agustus 2025"},
  {src:"photos/2025-08-22-01.jpg", month:"Agustus 2025"},
  {src:"photos/2025-08-26-01.jpg", month:"Agustus 2025"},
  {src:"photos/2025-08-31-01.jpg", month:"Agustus 2025"},
  {src:"photos/2025-09-04-01.jpg", month:"September 2025"},
  {src:"photos/2025-09-07-01.jpg", month:"September 2025"},
  {src:"photos/2025-09-07-02.jpg", month:"September 2025"},
  {src:"photos/2025-09-07-03.jpg", month:"September 2025"},
  {src:"photos/2025-09-07-04.jpg", month:"September 2025"},
  {src:"photos/2025-09-07-05.jpg", month:"September 2025"},
  {src:"photos/2025-09-20-01.jpeg", month:"September 2025"},
  {src:"photos/2025-09-28-01.jpeg", month:"September 2025"},
  {src:"photos/2025-10-02-01.jpg", month:"Oktober 2025"},
  {src:"photos/2025-10-02-02.jpg", month:"Oktober 2025"},
  {src:"photos/2025-10-17-01.jpg", month:"Oktober 2025"},
  {src:"photos/2025-10-17-02.jpg", month:"Oktober 2025"},
  {src:"photos/2025-10-18-01.jpg", month:"Oktober 2025"},
  {src:"photos/2025-10-22-01.jpg", month:"Oktober 2025"},
  {src:"photos/2025-11-07-01.jpg", month:"November 2025"},
  {src:"photos/2025-11-07-02.jpg", month:"November 2025"},
  {src:"photos/2025-11-07-03.jpg", month:"November 2025"},
  {src:"photos/2025-11-18-01.png", month:"November 2025"},
  {src:"photos/2025-11-28-01.jpeg", month:"November 2025"},
  {src:"photos/2025-11-28-02.jpeg", month:"November 2025"},
  {src:"photos/2025-12-10-01.jpeg", month:"Desember 2025"},
  {src:"photos/2025-12-10-01.jpg", month:"Desember 2025"},
  {src:"photos/2025-12-10-02.jpg", month:"Desember 2025"},
  {src:"photos/2025-12-19-01.jpg", month:"Desember 2025"},
  {src:"photos/2025-12-19-02.jpg", month:"Desember 2025"},
  {src:"photos/2025-12-20-01.jpeg", month:"Desember 2025"},
  {src:"photos/2025-12-20-02.jpeg", month:"Desember 2025"},
  {src:"photos/2025-12-27-01.jpeg", month:"Desember 2025"},
  {src:"photos/2026-01-01-01.jpeg", month:"Januari 2026"},
  {src:"photos/2026-01-01-01.jpg", month:"Januari 2026"},
  {src:"photos/2026-01-01-02.jpeg", month:"Januari 2026"},
  {src:"photos/2026-01-01-02.jpg", month:"Januari 2026"},
  {src:"photos/2026-01-31-01.jpeg", month:"Januari 2026"},
  {src:"photos/2026-01-31-01.jpg", month:"Januari 2026"},
  {src:"photos/2026-01-31-02.jpeg", month:"Januari 2026"},
  {src:"photos/2026-01-31-02.jpg", month:"Januari 2026"},
  {src:"photos/2026-01-31-03.jpeg", month:"Januari 2026"},
  {src:"photos/2026-03-06-01.jpeg", month:"Maret 2026"},
  {src:"photos/2026-03-06-02.jpeg", month:"Maret 2026"},
  {src:"photos/2026-03-12-01.jpeg", month:"Maret 2026"},
  {src:"photos/2026-03-12-01.jpg", month:"Maret 2026"},
  {src:"photos/2026-03-22-01.jpg", month:"Maret 2026"},
  {src:"photos/2026-03-22-02.jpg", month:"Maret 2026"},
  {src:"photos/2026-03-27-01.jpg", month:"Maret 2026"},
  {src:"photos/2026-03-27-02.jpg", month:"Maret 2026"},
  {src:"photos/2026-03-27-03.jpg", month:"Maret 2026"},
  {src:"photos/2026-04-14-01.jpg", month:"April 2026"},
  {src:"photos/2026-04-14-02.jpg", month:"April 2026"},
  {src:"photos/2026-04-14-03.jpg", month:"April 2026"},
  {src:"photos/2026-04-14-04.jpg", month:"April 2026"},
  {src:"photos/2026-06-26-01.jpg", month:"Juni 2026"},
  {src:"photos/2026-06-26-02.jpg", month:"Juni 2026"},
  {src:"photos/2026-06-26-03.jpg", month:"Juni 2026"},
  {src:"photos/2026-06-26-04.jpg", month:"Juni 2026"},
  {src:"photos/2026-06-26-05.jpg", month:"Juni 2026"},
  {src:"photos/2026-06-26-06.jpg", month:"Juni 2026"},
  {src:"photos/2026-06-26-07.jpg", month:"Juni 2026"},
  {src:"photos/2026-06-26-08.jpg", month:"Juni 2026"},
  {src:"photos/2026-06-26-09.jpg", month:"Juni 2026"},
  {src:"photos/2026-06-26-10.jpg", month:"Juni 2026"},
  {src:"photos/2026-06-26-11.jpg", month:"Juni 2026"},
  {src:"photos/2026-06-26-12.jpg", month:"Juni 2026"},
  {src:"photos/2026-06-26-13.jpg", month:"Juni 2026"},
  {src:"photos/2026-06-26-14.jpg", month:"Juni 2026"},
  {src:"photos/2026-06-26-15.jpg", month:"Juni 2026"},
  {src:"photos/2026-07-03-01.jpg", month:"Juli 2026"},
  {src:"photos/2026-07-03-02.jpg", month:"Juli 2026"},
  {src:"photos/2026-07-03-03.jpg", month:"Juli 2026"},
  {src:"photos/2026-07-03-04.jpg", month:"Juli 2026"},
  {src:"photos/2026-07-03-05.jpg", month:"Juli 2026"},
  {src:"photos/2026-08-04-01.jpg", month:"Agustus 2026"},
  {src:"photos/2026-08-04-02.jpg", month:"Agustus 2026"},
];

/* ===== STARS ===== */
(function(){
  const canvas = document.getElementById('stars-canvas');
  const ctx = canvas.getContext('2d');
  let stars = [];
  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  function init(){
    resize();
    stars = Array.from({length:160}, ()=>{
      const jitter = Math.random()>.5;
      return {
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        r: Math.random()*1.6+.3,
        o: Math.random(),
        speed: Math.random()*.4+.1,
        dir: jitter?1:-1
      };
    });
  }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(const s of stars){
      s.o += s.speed * s.dir * .012;
      if(s.o>=1||s.o<=0) s.dir*=-1;
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      const col = Math.random()>.92 ? '20,184,166' : '236,72,153';
      ctx.fillStyle = `rgba(${col},${s.o})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', init);
  init(); draw();
})();

/* ===== FLOATING SHAPES (SVG, bukan emoji) ===== */
(function(){
  const container = document.getElementById('hearts-bg');
  const pool = ['icon-heart','icon-heart','icon-star','icon-sparkle','icon-gem','icon-cameo'];
  const colors = ['#f472b6','#a855f7','#fbbf24','#e879f9'];
  function spawn(){
    const el = document.createElement('span');
    el.className = 'heart-float';
    const pick = pool[Math.floor(Math.random()*pool.length)];
    const c = colors[Math.floor(Math.random()*colors.length)];
    el.innerHTML = `<svg viewBox="0 0 24 24"><use href="#${pick}"/></svg>`;
    el.style.left = Math.random()*100+'vw';
    const size = 18 + Math.random()*30;
    el.style.width = size+'px';
    el.style.height = size+'px';
    el.style.animationDuration = (9+Math.random()*14)+'s';
    el.style.animationDelay = (Math.random()*5)+'s';
    el.style.filter = `drop-shadow(0 0 8px ${c})`;
    container.appendChild(el);
    setTimeout(()=>el.remove(), 22000);
  }
  setInterval(spawn, 900);
  for(let i=0;i<7;i++) spawn();
})();

/* ===== COUNTDOWN ===== */
(function tick(){
  const now = new Date();
  const diff = CONFIG.anniversaryDate - now;
  if(diff > 0){
    const d = Math.floor(diff/864e5);
    const h = Math.floor((diff%864e5)/36e5);
    const m = Math.floor((diff%36e5)/6e4);
    const s = Math.floor((diff%6e4)/1e3);
    document.getElementById('cd-d').textContent = String(d).padStart(2,'0');
    document.getElementById('cd-h').textContent = String(h).padStart(2,'0');
    document.getElementById('cd-m').textContent = String(m).padStart(2,'0');
    document.getElementById('cd-s').textContent = String(s).padStart(2,'0');
  } else {
    document.querySelector('#countdown-section h2').textContent = 'Hari Ini Hari Kita';
    ['cd-d','cd-h','cd-m','cd-s'].forEach(id=>document.getElementById(id).textContent='00');
  }
  const daysTogether = Math.floor((now - CONFIG.startDate)/864e5);
  document.getElementById('days-together').textContent = daysTogether.toLocaleString('id-ID');
  setTimeout(tick, 1000);
})();

/* ===== TYPING LETTER ===== */
(function(){
  const el  = document.getElementById('typed-text');
  const cur = document.getElementById('cursor');
  let i = 0;
  let started = false;
  const io = new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting && !started){
      started = true; io.disconnect();
      function type(){
        if(i<LETTER.length){
          el.textContent += LETTER[i++];
          setTimeout(type, i<80?35:18);
        } else { cur.style.display='none'; }
      }
      type();
    }
  },{threshold:.3});
  io.observe(document.getElementById('letter-section'));
})();

/* ===== CAROUSEL 5 SLIDE (timeline) ===== */
(function(){
  const DATA = window.AIV_DATA;
  if(!DATA || !DATA.slides){
    const c = document.getElementById('timeline-container');
    if(c){ c.style.display=''; /* fallback statis kosong */ }
    return;
  }
  const track = document.getElementById('carouselTrack');
  const dotsC = document.getElementById('carouselDots');
  const hint  = document.getElementById('carouselHint');
  const slides = DATA.slides;

  // buat tiap slide
  slides.forEach((s, si)=>{
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.setAttribute('data-slide', si);
    const head = document.createElement('div');
    head.className = 'slide-head';
    head.innerHTML =
      `<div class="slide-num">Babak ${si+1} · ${s.count} momen</div>` +
      `<h3>${s.title}</h3><p>${s.sub}</p>`;
    const photos = document.createElement('div');
    photos.className = 'slide-photos';
    const all = slides.flatMap(x=>x.photos);
    // path bisa posix('\\') atau unix('/')
    const norm = u=>u.split('\\').join('/');
    const rel  = p=>'photos-aniv/'+p.split(/[\\/]/).pop();
    s.photos.forEach(p=>{
      const card = document.createElement('div'); card.className='polaroid';
      const src  = rel(p.src);
      const img = document.createElement('img');
      img.src = src;
      img.loading = 'lazy'; img.decoding = 'async';
      img.draggable = false;
      const fade = document.createElement('div'); fade.className='fade';
      card.appendChild(img); card.appendChild(fade);
      card.addEventListener('click', ()=>openLB(src, all.map(x=>rel(x.src))));
      photos.appendChild(card);
    });
    slide.appendChild(head); slide.appendChild(photos);
    track.appendChild(slide);
  });

  // dots
  slides.forEach((_, si)=>{
    const d = document.createElement('button');
    d.className = 'c-dot' + (si===0?' active':'');
    d.onclick = ()=>go(si);
    dotsC.appendChild(d);
  });

  // kontrol
  let cur = 0;
  function go(i){
    i = Math.max(0, Math.min(slides.length-1, i));
    cur = i;
    const w = track.querySelector('.slide');
    if(w) track.scrollTo({ left: w.offsetWidth * i, behavior:'smooth' });
    updateDots();
  }
  function updateDots(){
    [...dotsC.children].forEach((d,i)=>d.classList.toggle('active', i===cur));
  }
  function step(d){ go(cur + d, true); }

  document.getElementById('cPrev').onclick = ()=>step(-1);
  document.getElementById('cNext').onclick = ()=>step(1);

  // swipe sync dots
  track.addEventListener('scroll', ()=>{
    const w = track.querySelector('.slide');
    if(!w) return;
    const i = Math.round(track.scrollLeft / w.offsetWidth);
    if(i!==cur){ cur = i; updateDots(); }
  }, {passive:true});

  if(hint) hint.style.display = 'none'; // hint statis di HTML
})();

/* ===== LIGHTBOX ===== */
let lbSrcs=[], lbIdx=0;
function openLB(src, srcs){
  lbSrcs=srcs; lbIdx=Math.max(0,srcs.indexOf(src));
  document.getElementById('lb-img').src=src;
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow='hidden';
}
function closeLB(){
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow='';
}
function shiftLB(dir){
  lbIdx=(lbIdx+dir+lbSrcs.length)%lbSrcs.length;
  document.getElementById('lb-img').src=lbSrcs[lbIdx];
}
document.getElementById('lightbox').addEventListener('click',e=>{
  if(e.target.id==='lightbox') closeLB();
});
document.addEventListener('keydown',e=>{
  if(!document.getElementById('lightbox').classList.contains('active')) return;
  if(e.key==='Escape') closeLB();
  if(e.key==='ArrowRight') shiftLB(1);
  if(e.key==='ArrowLeft') shiftLB(-1);
});

/* ===== SCROLL REVEAL ===== */
const reveals = document.querySelectorAll('.reveal');
const revealIO = new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
},{threshold:.12});
reveals.forEach(r=>revealIO.observe(r));

/* ===== POLYFILL <use>: render icon SVG di semua browser (fix <use> sprite gagal di mobile) ===== */
(function(){
  function hydrate(){
    const sprite = document.getElementById('icon-sprite');
    if(!sprite) return;
    document.querySelectorAll('svg use').forEach(use=>{
      const href = use.getAttribute('href') || use.getAttribute('xlink:href');
      if(!href || !href.startsWith('#')) return;
      const sym = document.getElementById(href.slice(1));
      if(!sym || use.nextSibling) return;  /* sudah di-hydrate */
      const g = document.createElementNS('http://www.w3.org/2000/svg','g');
      g.innerHTML = sym.innerHTML;           /* clone konten symbol */
      g.setAttribute('fill','currentColor'); /* warna mengikuti el */
      use.insertAdjacentElement('afterend', g);
      use.remove();
    });
    document.querySelectorAll('.heart-float svg').forEach(s=>{
      s.style.display='block';
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', hydrate);
  else hydrate();
  /* jalankan lagi setelah kartu reason dibuat*/
  setTimeout(()=>{ hydrate(); hydrate(); }, 400);
  // re-run saat container icon dinamis drop-in
  new MutationObserver(()=>hydrate()).observe(document.body,{childList:true,subtree:true});
})();

/* ===== ANTI-BLOCK: blokir save/copy/context (drag DIJAGA agar puzzle jalan) ===== */
(function(){
  ['contextmenu','selectstart'].forEach(ev=>{
    document.addEventListener(ev, e=>e.preventDefault());  /* konteks menu/select */
  });
  ['copy','cut','paste'].forEach(ev=>{
    document.addEventListener(ev, e=>{ e.preventDefault(); });  /* disable copy */
  });
  /* blokir drag HANYA untuk img non-dropzone biar foto ga keseret (puzzle tetap bebas) */
  document.addEventListener('dragstart', e=>{
    const isDD = e.target.classList && e.target.classList.contains('dd-piece');
    if(!isDD) e.preventDefault();
  });
  document.addEventListener('keydown', e=>{
    const mod = e.ctrlKey || e.metaKey;
    if(mod && ['s','p','a','c','x','v','u'].includes(e.key.toLowerCase())) e.preventDefault();
  });
})();

/* ===== MUSIC LATAR (WebAudio, tanpa file) ===== */
(function(){
  let ctx=null, master=null, playing=false;
  const toggleBtn = document.getElementById('music-toggle');

  function buildSong(){
    /* Lagu sederhana nan lembut — nada-nada hangat */
    const ready = Date.now();
    const seq = [
      262,293,330,392, 330,293,262,220,
      262,293,330,392, 494,440,392,330
    ];
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.16;
    masterGain.connect(ctx.destination);

    const bass = ctx.createOscillator();
    bass.type='triangle';
    bass.frequency.value=65.4;
    const bassGain=ctx.createGain(); bassGain.gain.value=.05;
    bass.connect(bassGain); bassGain.connect(masterGain);
    bass.start(ready);

    function playNote(freq, t, dur){
      const o=ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value=freq;
      const g=ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.16, t+0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t+dur);
      o.connect(g); g.connect(masterGain);
      o.start(t); o.stop(t+dur+.1);
      return o;
    }
    seq.forEach((f,i)=>{
      const t = ready + i*0.32;
      playNote(f, t, 1.1);
      playNote(f*2, t, 0.7);
    });
    master = masterGain;
    setTimeout(()=>{ try{ masterGain.disconnect(); bass.stop(); }catch(e){} }, ready+seq.length*320);
  }

  window.toggleMusic = ()=>{
    if(!ctx){ ctx = new (window.AudioContext||window.webkitAudioContext)(); }
    if(playing){
      playing=false;
      master && master.gain.setValueAtTime(0, ctx.currentTime);
      toggleBtn.classList.add('muted');
      document.getElementById('music-icon').setAttribute('href','#icon-music');
    } else {
      if(ctx.state==='suspended') ctx.resume();
      playing=true;
      if(!master) buildSong();
      else master.gain.setValueAtTime(0.16, ctx.currentTime);
      toggleBtn.classList.remove('muted');
      document.getElementById('music-icon').setAttribute('href','#icon-pause');
    }
  };

  /* Show button after unlock */
  const gate = document.getElementById('layer1');
  new MutationObserver(()=>{
    if(gate.classList.contains('hidden')){
      toggleBtn.classList.add('show');
    }
  }).observe(gate,{attributes:true,attributeFilter:['class']});
})();

/* ===== STATS COUNTER (animated) ===== */
(function(){
  const sec = document.getElementById('stats-section');
  if(!sec) return;
  const D = CONFIG.startDate;
  const months = Math.round((new Date() - D)/ 1000 / 60/60/24/30.4);
  const days   = Math.floor((new Date() - D)/864e5);
  const targets = {
    days:    days,
    photos:  PHOTOS.length,
    months:  months
  };
  const io = new IntersectionObserver(entries=>{
    if(!entries[0].isIntersecting) return;
    io.disconnect();
    [['data-target-days',targets.days],['data-target-photos',targets.photos],['data-target-months',targets.months]]
    .forEach(([sel,val])=>{
      const el = document.querySelector(`[${sel}]`);
      const t0 = performance.now();
      const dur=1200;
      (function step(t){
        const p=Math.min(1,(t-t0)/dur);
        el.textContent = Math.round(val*(1-Math.pow(1-p,3))).toLocaleString('id-ID');
        if(p<1) requestAnimationFrame(step);
      })(t0);
    });
  },{threshold:.4});
  io.observe(sec);
})();

/* ===== ALASAN SAYANG (flip cards) ===== */
(function(){
  const grid = document.getElementById('reasons-grid');
  if(!grid) return;
  const icons = ['icon-heart-seal','icon-sparkle','icon-cameo','icon-gem','icon-star','icon-heart-seal'];
  const REASONS=[
    ["Senyummu","Menerangi hari yang paling gelap sekalipun."],
    ["Tawamu","Melodi favorit yang selalu bikin hari jadi lebih ringan."],
    ["Kebaikanmu","Kamu peduli hal-hal kecil yang orang lain anggap sepele."],
    ["Cara Kamu Dengar","Kamu benar-benar dengar, bukan sekadar mendengarkan."],
    ["Kehangatanmu","Dekat kamu serasa di rumah yang paling tenang."],
    ["Kamu yang Apa Adanya","Nggak perlu jadi siapa-siapa, cukup jadi kamu."]
  ];
  REASONS.forEach((r,i)=>{
    const card=document.createElement('div');
    card.className='reason-card';
    card.style.setProperty('--i', i);
    card.innerHTML = `
      <div class="face front">
        <span class="n">#${i+1}</span>
        <svg><use href="#${icons[i%icons.length]}"/></svg>
        <small>${r[0]}</small>
      </div>
      <div class="face back">${r[1]}</div>`;
    card.addEventListener('click',()=>card.classList.toggle('flipped'));
    grid.appendChild(card);
  });
})();

/* ===== CONFETTI SURPRISE ===== */
window.launchConfetti = function(){
  const wrap = document.getElementById('confetti-wrap');
  const colors=['#ec4899','#f472b6','#fda4af','#fce7f3','#fbcfe8','#f9a8d4','#ffffff'];
  const total = 140;
  for(let i=0;i<total;i++){
    const p=document.createElement('div');
    p.className = 'confetti-p';
    if(i%7===0) p.classList.add('confetti-heart');
    p.style.setProperty('--cc', colors[i%colors.length]);
    p.style.left = Math.random()*100+'vw';
    p.style.background = p.classList.contains('confetti-heart') ? 'transparent' : colors[i%colors.length];
    p.style.animationDuration = (2.4+Math.random()*2.6)+'s';
    p.style.animationDelay = (Math.random()*.8)+'s';
    p.style.setProperty('--tw', `translateX(${(Math.random()-.5)*260}px) rotate(${Math.random()*360}deg)`);
    wrap.appendChild(p);
    setTimeout(()=>p.remove(), 7000);
  }
  /* Bunyi "pop" halus via WebAudio */
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const t=ctx.currentTime;
    const o=ctx.createOscillator(); o.type='triangle'; o.frequency.setValueAtTime(660,t);
    o.frequency.exponentialRampToValueAtTime(990,t+.25);
    const g=ctx.createGain(); g.gain.setValueAtTime(.08,t); g.gain.exponentialRampToValueAtTime(.001,t+.5);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t+.6);
  }catch(e){}
};
