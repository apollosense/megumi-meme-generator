/* Megumi text generator - shatter.js
   If someone tries to post something explicit on the community wall, or to
   save/copy/upload a meme with explicit text, it does NOT happen. Instead the
   whole screen cracks from the button and breaks apart. Afterwards there is a
   button to reload the page. */
(function(){
  if(window.__blocked) return;

  // ---- word check -----------------------------------------------------------
  // whole words that are blocked
  // "fuck" and "shit" (and their spellings) are allowed on purpose, everything else here breaks the screen
  var WORDS = ('bitch bitches cunt dick dickhead cock cocks ' +
    'pussy pussies asshole assholes arsehole whore slut sluts porn porno pornhub xxx sex sexy nude nudes naked boobs boob tits titties ' +
    'penis vagina cum cumming jizz blowjob handjob dildo horny rape rapist nigga nigger niggas faggot fag fags retard ' +
    'amk aq orospu siktir sik sikik sikiş yarrak yarak göt götveren piç amcık oç ananı ' +
    'сука суки бля блять блядь хуй хуйня пизда пиздец нахуй ебать ебал ебаный шлюха').split(/\s+/);
  // anything that starts with these is blocked too (fuckface, pornhub, ...)
  var STEMS = ['cunt','bitch','porn','nigg','fagg','whor','slut','dildo','blowj','handj','pussy','orospu','siktir','siker','sikey','sikim','yarra','amcı','amına','amina','хуй','пизд','ебан','ебат','бля'];

  function squash(s){ return s.replace(/(.)\1+/g, '$1'); }          // fuuuuck -> fuck
  function leet(s){ return s.replace(/[0@4$5!1|3€7]/g, function(c){ return {'0':'o','@':'a','4':'a','$':'s','5':'s','!':'i','1':'i','|':'i','3':'e','€':'e','7':'t'}[c]; }); }
  var WORDSET = {}; WORDS.forEach(function(w){ if(w){ WORDSET[w] = 1; WORDSET[squash(w)] = 1; } });
  var STEMSQ = STEMS.map(squash);

  function tokens(text){
    var t = leet(String(text).toLowerCase());
    var raw = t.split(/[^a-zа-яёçğıöşü]+/i).filter(Boolean);
    // glue spaced-out letters back together: "f u c k" -> "fuck"
    var out = [], run = '';
    raw.forEach(function(w){ if(w.length === 1){ run += w; } else { if(run){ out.push(run); run=''; } out.push(w); } });
    if(run) out.push(run);
    return out;
  }
  // these are also the start of normal words (dickens, cumulative, sextant,
  // cockpit, aqua, sikke...), so while you're still typing them they don't count yet
  var RISKY = { dick:1, cock:1, cocks:1, cum:1, sex:1, fag:1, tits:1, boob:1, nude:1, naked:1, sik:1, aq:1, göt:1, piç:1, oç:1, rape:1 };
  function bad(w, typing){
    var s = squash(w);
    for(var i=0;i<STEMS.length;i++){ if(w.indexOf(STEMS[i]) === 0 || s.indexOf(STEMSQ[i]) === 0) return true; }
    if(WORDSET[w] || WORDSET[s]) return !(typing && (RISKY[w] || RISKY[s]));
    return false;
  }
  // live = the person is still typing, so the last word may not be finished yet
  window.megumiIsExplicit = function(text, live){
    var tk = tokens(text), last = tk.length - 1;
    var stillTyping = live && /[a-zа-яёçğıöşü0-9@$|!€]$/i.test(String(text));
    return tk.some(function(w, i){ return bad(w, stillTyping && i === last); });
  };

  // ---- the shatter ----------------------------------------------------------
  var H2C = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  var busy = false;

  function loadH2C(){
    if(window.html2canvas) return Promise.resolve(window.html2canvas);
    return new Promise(function(res, rej){
      var s = document.createElement('script'); s.src = H2C; s.async = true;
      s.onload = function(){ window.html2canvas ? res(window.html2canvas) : rej(); };
      s.onerror = rej; document.head.appendChild(s);
    });
  }
  function snapshot(){
    // picture of exactly what is on screen right now. if that fails we
    // shatter a dark screen instead, it still looks fine
    return loadH2C().then(function(h2c){
      return Promise.race([
        h2c(document.body, { x: scrollX, y: scrollY, width: innerWidth, height: innerHeight,
          windowWidth: document.documentElement.clientWidth, windowHeight: innerHeight,
          scale: Math.min(2, devicePixelRatio || 1), logging: false, useCORS: true,
          backgroundColor: getComputedStyle(document.body).backgroundColor }),
        new Promise(function(_, rej){ setTimeout(rej, 2500); })
      ]);
    }).catch(function(){ return null; });
  }

  // backup sound if the mp3 can't play
  function crackSound(){
    try{
      var A = window.AudioContext || window.webkitAudioContext; if(!A) return;
      var ac = new A(), len = Math.floor(ac.sampleRate*0.45), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for(var i=0;i<len;i++){ var t=i/len; d[i] = (Math.random()*2-1) * Math.pow(1-t, 3) * (Math.random() < .02 ? 1 : .5); }
      var src = ac.createBufferSource(); src.buffer = buf;
      var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
      var g = ac.createGain(); g.gain.value = .35;
      src.connect(hp); hp.connect(g); g.connect(ac.destination); src.start();
    }catch(e){}
  }

  // glass pieces: rings around the impact point, cut into wedges, with a bit of randomness
  function makePieces(cx, cy, W, H){
    var R = Math.hypot(Math.max(cx, W-cx), Math.max(cy, H-cy)) * 1.15;
    var rings = [0, 40, 110, 230, 420, R], spokes = 14, ang = [], i, j;
    for(i=0;i<spokes;i++) ang.push((i + (Math.random()-.5)*.6) / spokes * Math.PI*2);
    var pts = rings.map(function(r, ri){
      return ang.map(function(a){
        var rr = ri === 0 ? 0 : (ri === rings.length-1 ? r : r * (0.8 + Math.random()*.4));
        var aa = a + (ri ? (Math.random()-.5)*.18 : 0);
        return [cx + Math.cos(aa)*rr, cy + Math.sin(aa)*rr];
      });
    });
    var pieces = [];
    for(i=0;i<rings.length-1;i++){
      for(j=0;j<spokes;j++){
        var k = (j+1) % spokes;
        var poly = i === 0 ? [pts[0][0], pts[1][j], pts[1][k]] : [pts[i][j], pts[i+1][j], pts[i+1][k], pts[i][k]];
        // some outer pieces get split in two so it looks less regular
        if(poly.length === 4 && Math.random() < .5){
          pieces.push([poly[0], poly[1], poly[2]]); pieces.push([poly[0], poly[2], poly[3]]);
        } else pieces.push(poly);
      }
    }
    return pieces.map(function(p){
      var mx=0,my=0; p.forEach(function(q){ mx+=q[0]; my+=q[1]; }); mx/=p.length; my/=p.length;
      var dx = mx-cx, dy = my-cy, dist = Math.hypot(dx,dy) || 1;
      return { pts:p, cx:mx, cy:my, x:0, y:0, r:0,
        vx: dx/dist * (1.5 + Math.random()*3), vy: dy/dist * (1.5 + Math.random()*2) - Math.random()*4,
        vr: (Math.random()-.5) * .12, delay: Math.min(dist/ (R) * 380, 380) + Math.random()*120 };
    });
  }

  function trace(ctx, p){ ctx.beginPath(); p.forEach(function(q, i){ i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); }

  var sfx = null;
  function getSfx(){
    if(sfx === null){
      try{ sfx = new Audio('sfx/shatter.mp3'); sfx.preload = 'auto'; sfx.volume = .8; }catch(e){ sfx = false; }
    }
    return sfx || null;
  }
  window.megumiPreloadShatter = function(){ loadH2C().catch(function(){}); getSfx(); };

  window.megumiShatter = function(fromEl, what){
    if(busy) return; busy = true;
    var W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
    var r = fromEl && fromEl.getBoundingClientRect ? fromEl.getBoundingClientRect() : null;
    var cx = r ? r.left + r.width/2 : W/2, cy = r ? r.top + r.height/2 : H/2;
    if(fromEl && typeof fromEl.x === 'number' && !r){ cx = fromEl.x; cy = fromEl.y; }
    if(cx < 0 || cx > W || cy < 0 || cy > H){ cx = W/2; cy = H/2; }
    // people with "reduce motion" on still get the break (it's the whole point),
    // just without the screen shake and with softer flashes
    var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    var cv = document.createElement('canvas');
    cv.width = W*dpr; cv.height = H*dpr;
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:9999;pointer-events:auto;cursor:default';
    cv.setAttribute('aria-hidden','true');
    var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    document.body.appendChild(cv);
    document.documentElement.style.overflow = 'hidden';

    var pieces = makePieces(cx, cy, W, H);

    // the timeline follows sfx/shatter.mp3: a crack at 0.17s, the big break at 1.47s
    var CRACK_AT = 170, CRACK_LEN = 110, BREAK_AT = 1470, GIVE_UP = 3400;
    var reach = Math.hypot(W, H) * 1.1;

    // returns the sound if it is actually playing, so the picture can follow it exactly
    var live = null;
    function playSound(){
      var a = getSfx();
      if(!a){ setTimeout(crackSound, CRACK_AT); return; }
      try{ a.currentTime = 0; }catch(e){}
      a.addEventListener('playing', function(){ live = a; }, { once:true });
      var p = a.play();
      if(p && p.catch) p.catch(function(){ live = null; setTimeout(crackSound, CRACK_AT); });
    }

    snapshot().then(function(img){
      var t0 = performance.now(), broken = false;
      playSound();

      function background(){ if(img) ctx.drawImage(img, 0, 0, W, H); }
      function cracks(k){
        ctx.save();
        ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.shadowColor = 'rgba(160,200,255,.9)'; ctx.shadowBlur = 6;
        pieces.forEach(function(p){
          var d = Math.hypot(p.cx-cx, p.cy-cy);
          var show = Math.max(0, Math.min(1, (k*reach - d) / 120));
          if(show <= 0) return;
          ctx.globalAlpha = show; ctx.lineWidth = 1.2 + 1.6*(1 - Math.min(1, d/500));
          trace(ctx, p.pts); ctx.stroke();
        });
        ctx.restore();
      }
      // clock: the sound's own position while it plays (stays in sync even if it
      // starts late), otherwise plain time since the break started
      // the sound gets up to 0.4s to start; if it never does, the clock takes over
      var lastT = 0, WAIT = getSfx() ? 400 : 0, fellBack = false;
      function frame(now){
        var t;
        if(live && !live.paused && !live.ended && live.currentTime > 0 && !fellBack) t = live.currentTime * 1000;
        else if(now - t0 < WAIT && !live) t = 0;
        else { if(!live) fellBack = true; t = now - t0 - (fellBack ? WAIT : 0); }
        if(t < lastT) t = lastT; lastT = t;
        if(t < CRACK_AT){                       // frozen screen, waiting for the crack
          ctx.clearRect(0,0,W,H); background();
        } else if(t < BREAK_AT){                // crack hits, then it just hangs there
          var k = Math.min(1, (t - CRACK_AT) / CRACK_LEN);
          var shake = !calm && t < CRACK_AT + 160 ? (1 - (t-CRACK_AT)/160) * 7 : 0;
          ctx.clearRect(0,0,W,H);
          ctx.save(); ctx.translate((Math.random()-.5)*shake, (Math.random()-.5)*shake);
          background(); cracks(k); ctx.restore();
          var f = Math.max(0, 1 - (t - CRACK_AT)/180); if(f > 0){ ctx.fillStyle = 'rgba(255,255,255,' + (f*(calm ? .2 : .5)) + ')'; ctx.fillRect(0,0,W,H); }
        } else {                                // the big break: everything flies apart
          if(!broken){
            broken = true;
            pieces.forEach(function(p){ p.vx *= 1.6; p.vy = p.vy*1.4 - 2; p.delay = Math.random()*90; });
          }
          var el = t - BREAK_AT, alive = 0;
          ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
          pieces.forEach(function(p){
            if(el > p.delay){ p.vy += .6; p.x += p.vx; p.y += p.vy; p.r += p.vr; }
            if(p.cy + p.y - 60 > H) return;
            alive++;
            ctx.save();
            ctx.translate(p.cx + p.x, p.cy + p.y); ctx.rotate(p.r); ctx.translate(-p.cx, -p.cy);
            trace(ctx, p.pts); ctx.clip();
            if(img) ctx.drawImage(img, 0, 0, W, H); else { ctx.fillStyle = '#0a1226'; ctx.fillRect(0,0,W,H); }
            ctx.restore();
            ctx.save();
            ctx.translate(p.cx + p.x, p.cy + p.y); ctx.rotate(p.r); ctx.translate(-p.cx, -p.cy);
            ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.2; trace(ctx, p.pts); ctx.stroke();
            ctx.restore();
          });
          // white flash on the break
          var f2 = Math.max(0, 1 - el/140); if(f2 > 0){ ctx.fillStyle = 'rgba(255,255,255,' + (f2*(calm ? .2 : .6)) + ')'; ctx.fillRect(0,0,W,H); }
          if(!alive || t > GIVE_UP){ end(); return; }
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });

    // phase 3: black screen with a short message
    function end(){
      ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
      var box = document.createElement('div');
      box.setAttribute('role','alertdialog'); box.setAttribute('aria-live','assertive');
      box.style.cssText = 'position:fixed;inset:0;z-index:10000;display:grid;place-items:center;text-align:center;padding:24px;' +
        'color:#fff;font-family:"TikTok Sans","Helvetica Neue",Inter,system-ui,sans-serif;opacity:0;transition:opacity .6s';
      box.innerHTML = '<div><div style="font-size:clamp(28px,7vw,52px);font-weight:900;letter-spacing:.02em">nope.</div>' +
        '<p style="margin:10px 0 22px;color:#9fb3d9;font-size:17px">' + (what === 'meme' ? 'That meme wasn’t made. Keep it clean.' : 'That message wasn’t posted. Keep the wall clean.') + '</p>' +
        '<button type="button" style="font:inherit;font-weight:800;font-size:16px;padding:12px 22px;border-radius:12px;border:1px solid #fff;background:#fff;color:#000;cursor:pointer">Okay, I’ll be nice</button></div>';
      document.body.appendChild(box);
      requestAnimationFrame(function(){ box.style.opacity = '1'; });
      var b = box.querySelector('button'); b.focus();
      b.addEventListener('click', function(){ location.reload(); });
    }
  };

  // ---- meme generator: same thing when saving, copying or uploading --------
  // runs before the normal button code (capture phase), so nothing gets made
  var EXPORT_BUTTONS = { btnSave:1, btnCopy:1, btnGif:1, gUp:1 };
  document.addEventListener('click', function(e){
    var b = e.target && e.target.closest ? e.target.closest('button') : null;
    if(!b || !EXPORT_BUTTONS[b.id]) return;
    var t1 = document.getElementById('txt'), t2 = document.getElementById('txt2'), w2 = document.getElementById('txt2Wrap');
    var text = (t1 ? t1.value : '') + ' ' + (t2 && w2 && !w2.hidden ? t2.value : '');
    if(!window.megumiIsExplicit(text)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    window.megumiShatter(b, 'meme');
  }, true);
  // ---- break the moment the word is finished, right where it was typed -----
  // where the text cursor is on screen, by copying the box's text into an
  // invisible twin and measuring it
  function caretPoint(el){
    var r = el.getBoundingClientRect();
    try{
      var pos = el.selectionEnd == null ? el.value.length : el.selectionEnd;
      var cs = getComputedStyle(el), div = document.createElement('div'), span = document.createElement('span');
      ['boxSizing','width','height','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','paddingTop','paddingRight','paddingBottom','paddingLeft',
       'fontStyle','fontVariant','fontWeight','fontStretch','fontSize','lineHeight','fontFamily','textAlign','textTransform','textIndent','letterSpacing','wordSpacing','tabSize']
        .forEach(function(p){ div.style[p] = cs[p]; });
      var area = el.tagName === 'TEXTAREA';
      div.style.position = 'fixed'; div.style.visibility = 'hidden'; div.style.left = '-9999px'; div.style.top = '0';
      div.style.whiteSpace = area ? 'pre-wrap' : 'pre'; div.style.overflowWrap = area ? 'break-word' : 'normal'; div.style.overflow = 'hidden';
      div.textContent = el.value.slice(0, pos);
      span.textContent = el.value.slice(pos) || '.';
      div.appendChild(span); document.body.appendChild(div);
      var x = r.left + span.offsetLeft + parseFloat(cs.borderLeftWidth) - el.scrollLeft;
      var y = r.top + span.offsetTop + parseFloat(cs.borderTopWidth) - el.scrollTop + (parseFloat(cs.lineHeight) || parseFloat(cs.fontSize)*1.2)/2;
      document.body.removeChild(div);
      return { x: Math.max(r.left, Math.min(r.right, x)), y: Math.max(r.top, Math.min(r.bottom, y)) };
    }catch(e){ return { x: r.left + r.width/2, y: r.top + r.height/2 }; }
  }
  function watch(id, what){
    var el = document.getElementById(id); if(!el) return;
    el.addEventListener('focus', function(){ window.megumiPreloadShatter(); }, { once:true });
    el.addEventListener('input', function(){
      if(busy || !window.megumiIsExplicit(el.value, true)) return;
      var p = caretPoint(el);
      el.blur();
      window.megumiShatter(p, what);
    });
    // a word only counts as finished when you leave the box, so check then too
    el.addEventListener('change', function(){
      if(busy || !window.megumiIsExplicit(el.value)) return;
      window.megumiShatter(caretPoint(el), what);
    });
  }
  watch('txt', 'meme'); watch('txt2', 'meme'); watch('wallBody', 'wall'); watch('wallName', 'wall');

  // get the screenshot helper ready once someone starts typing meme text
  ['txt','txt2'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('focus', function(){ window.megumiPreloadShatter(); }, { once:true });
  });
})();
