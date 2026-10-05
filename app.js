/* Megumi text generator - app.js
   (c) apollosense. All rights reserved. Do not copy or redistribute.
   Parts of this were written with AI help, see README.md. */
(function(){
  if(window.__blocked) return;

  // ---- template list ----------------------------------------------------
  // Each image lives in the "templ/" folder next to this file.
  // Add more entries here whenever you drop new images into templ/.
  // The FIRST entry is the default image loaded on page open.
  //
  // "text" is how the text starts out on that picture:
  //   mode  'glow' = the megumi neon text, 'plain' = flat text like a manga page
  //   x, y  where the text sits, 0..1 of the picture width / height
  //   size  slider value. in plain mode the capital letter height is size*0.72 % of the width
  //   grow  plain mode only. 'down' = y is the first line and more lines go under it,
  //         'middle' = the whole block is centered on y
  //   lead  plain mode only. line spacing, in capital letter heights
  var TEMPLATES = [
    { id:'megumi-text',   src:'templ/megumi-text.png',   label:'Megumi',
      text:{ mode:'glow', x:.045, y:.9, size:11, font:'"TikTok Sans"', c1:'#73B5FF', c2:'#0033FF',
             glow:100, small:true, upper:true, sample:'HELL YEAH' } },
    // bubble already says "COMING FROM A MONKEY WHO CAN'T", so the text carries on
    // right under that line. numbers measured from the picture: letters are 19px
    // tall, lines are 26.7px apart, bubble middle is at x=400 (picture is 553x780)
    { id:'geto-monkeys',  src:'templ/geto-monkeys.png',  label:'Geto',
      text:{ mode:'plain', grow:'down', x:.7233, y:.3394, size:4.8, lead:1.40, font:'manga',
             c1:'#000000', small:false, upper:true, sample:'READ' } },
    // caption goes in the white strip on top (0 to ~285px of 1696)
    { id:'yuji-uncanny',  src:'templ/yuji-uncanny.png',  label:'Yuji',
      text:{ mode:'plain', grow:'middle', x:.5, y:.082, size:5.2, lead:1.65, font:'Arial',
             c1:'#000000', small:false, upper:false, sample:'Type your text' } }
  ];
  var currentTemplate = TEMPLATES[0];
  // -----------------------------------------------------------------------

  var cv = document.getElementById('cv'), ctx = cv.getContext('2d');
  var $ = function(id){return document.getElementById(id)};
  var state = { x:.045, y:.9, bg:null };
  var customFamily = null;
  var status = $('status');
  function say(m){ status.textContent = m; }

  function loadImage(src){
    return new Promise(function(res,rej){
      var im = new Image(); im.onload=function(){res(im)}; im.onerror=rej; im.src=src;
    });
  }
  // the manga option is CC Wild Words when the browser has it, Comic Neue when it doesn't
  function hasManga(){
    try{ return !!document.fonts && document.fonts.check('400 20px "Manga Bubble"'); }catch(e){ return false; }
  }
  function fontWeight(){
    var v = $('font').value;
    if(v==='manga') return hasManga() ? '400' : '700';
    if(v==='Arial') return '400';
    return '900';
  }
  function fontStack(){
    var v = $('font').value;
    if(v==='manga') return (hasManga() ? '"Manga Bubble",' : '') + '"Comic Neue","Comic Sans MS","Chalkboard SE",cursive,sans-serif';
    if(v==='Arial') return 'Arial,Helvetica,"Liberation Sans",sans-serif';
    var first = v==='custom' && customFamily ? '"'+customFamily+'"' : (v==='custom' ? '"TikTok Sans"' : v);
    return first + ',"TikTok Sans","Helvetica Neue",Inter,Arial,sans-serif';
  }
  function ensureFont(){
    var v = $('font').value;
    if(v==='custom' || v==='Arial' || !document.fonts) return Promise.resolve();
    if(v==='manga'){
      return document.fonts.load('400 60px "Manga Bubble"').catch(function(){}).then(function(){
        if(!hasManga()) return document.fonts.load('700 60px "Comic Neue"').catch(function(){});
      });
    }
    return document.fonts.load('800 60px ' + v).catch(function(){});
  }

  function lines(){
    var t = $('txt').value.replace(/\r/g,'');
    if($('upper').checked) t = t.toUpperCase();
    var arr = t.split('\n');
    while(arr.length && arr[arr.length-1].trim()==='') arr.pop();
    return arr;
  }

  function draw(target, glowScale){
    var tc = target || cv, ctx = tc.getContext('2d');
    var W = tc.width, H = tc.height;
    ctx.clearRect(0,0,W,H);
    if(state.bg) ctx.drawImage(state.bg,0,0,W,H);
    var arr = lines(); if(!arr.length) return;
    var base = W * parseFloat($('size').value)/100;
    var glow = parseFloat($('glow').value)/100 * (glowScale==null ? 1 : glowScale);
    var c1 = $('c1').value, c2 = $('c2').value;
    var shrink = $('small').checked;
    var x = state.x*W, y = state.y*H;
    var fam = fontStack();
    ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.lineJoin='round';

    if($('mode').value==='plain'){ drawPlain(ctx, tc, arr, base, x, y, fam, c1); return; }

    var items = [], cursor = y;
    for(var i=arr.length-1;i>=0;i--){
      var isLast = i===arr.length-1;
      var sz = (shrink && !isLast) ? base*0.5 : base;
      items.unshift({t:arr[i], sz:sz, y:cursor});
      cursor -= sz*1.08;
    }

    items.forEach(function(it){
      ctx.font = '900 ' + it.sz + 'px ' + fam;
      var m = ctx.measureText(it.t);
      var top = it.y - it.sz*0.78;
      var g = ctx.createLinearGradient(0, top, 0, it.y);
      g.addColorStop(0, '#eaf4ff');
      g.addColorStop(.38, c1);
      g.addColorStop(1, c1);

      if(glow>0){
        [[1.0,0.9],[0.55,0.9],[0.25,1]].forEach(function(p){
          ctx.save();
          ctx.shadowColor = c2; ctx.shadowBlur = it.sz*p[0]*glow; ctx.globalAlpha = p[1];
          ctx.fillStyle = c2; ctx.fillText(it.t, x, it.y);
          ctx.restore();
        });
        ctx.save();
        ctx.strokeStyle = c2; ctx.lineWidth = it.sz*0.07; ctx.strokeText(it.t, x, it.y);
        ctx.restore();
      }
      ctx.save();
      ctx.shadowColor = c2; ctx.shadowBlur = it.sz*0.12*Math.max(glow,.2);
      ctx.fillStyle = g; ctx.fillText(it.t, x, it.y);
      ctx.restore();
      it.w = m.width;
    });
    if(tc===cv) state.box = { x:x, y:items[0].y - items[0].sz*0.9, w:Math.max.apply(null,items.map(function(i){return i.w})), h:y - (items[0].y - items[0].sz*0.9) + base*0.25 };
  }

  // flat text for the manga pages. the size is worked out from the height of a
  // capital letter, so it comes out the same size whichever font ends up loading
  function drawPlain(ctx, tc, arr, base, x, y, fam, color){
    var t = currentTemplate.text || {};
    var wt = fontWeight();
    ctx.font = wt + ' 100px ' + fam;
    var asc = ctx.measureText('H').actualBoundingBoxAscent;
    var capRatio = asc > 0 ? asc/100 : 0.72;
    var cap = base*0.72, px = cap/capRatio, pitch = cap*(t.lead || 1.6);
    var first = t.grow==='middle' ? y - (cap + (arr.length-1)*pitch)/2 + cap : y;
    ctx.font = wt + ' ' + px + 'px ' + fam;
    ctx.textAlign = 'center'; ctx.fillStyle = color;
    var maxW = 0;
    arr.forEach(function(s, i){
      ctx.fillText(s, x, first + i*pitch);
      maxW = Math.max(maxW, ctx.measureText(s).width);
    });
    if(tc===cv) state.box = { x:x - maxW/2, y:first - cap, w:maxW, h:cap + (arr.length-1)*pitch };
  }

  var raf=0;
  function schedule(){ cancelAnimationFrame(raf); raf=requestAnimationFrame(function(){ ensureFont().then(function(){ draw(); }); }); }

  function syncLabels(){
    $('sizeV').textContent = $('size').value + '%';
    $('glowV').textContent = $('glow').value + '%';
  }
  function syncMode(){
    $('txtHint').textContent = $('mode').value==='plain' ? 'One line per row.' : 'One line per row. The last line is the big one.';
  }
  $('mode').addEventListener('change', function(){ syncMode(); schedule(); });
  ['txt','size','glow','small','upper','c1','c2'].forEach(function(id){
    $(id).addEventListener('input', function(){ syncLabels(); schedule(); });
  });
  $('font').addEventListener('change', function(){
    $('fontFileWrap').hidden = $('font').value!=='custom';
    schedule();
  });
  $('chips').addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b) return;
    $('txt').value = b.getAttribute('data-t');
    schedule();
  });

  $('fontFile').addEventListener('change', function(){
    var f = this.files[0]; if(!f) return;
    var name = 'UserFont' + Date.now();
    f.arrayBuffer().then(function(buf){
      var ff = new FontFace(name, buf);
      return ff.load().then(function(){ document.fonts.add(ff); customFamily = name; say('Font loaded: ' + f.name); schedule(); });
    }).catch(function(){ say('That font file could not be read. Try a .ttf, .otf or .woff2 file.'); });
  });

  // ---- template + background handling -----------------------------------
  function setBg(im){
    state.bg = im;
    var maxW = 2048, s = Math.min(1, maxW/im.naturalWidth);
    cv.width = Math.round(im.naturalWidth*s); cv.height = Math.round(im.naturalHeight*s);
    schedule();
  }

  // put the controls back to how this template wants its text
  function applyTextDefaults(tpl, prev){
    var t = tpl.text; if(!t) return;
    state.x = t.x; state.y = t.y;
    $('mode').value = t.mode;
    $('size').value = t.size;
    $('font').value = t.font; $('fontFileWrap').hidden = true;
    $('c1').value = t.c1;
    if(t.c2) $('c2').value = t.c2;
    if(t.glow!=null) $('glow').value = t.glow;
    $('small').checked = !!t.small;
    $('upper').checked = !!t.upper;
    // only swap the text if its still the example text from the last template
    var old = prev && prev.text ? prev.text.sample : null;
    if(old && $('txt').value.trim().toUpperCase() === old.toUpperCase()) $('txt').value = t.sample;
    syncLabels(); syncMode();
  }

  function loadTemplate(tpl, keepText){
    if(!tpl) return;
    if(!keepText) applyTextDefaults(tpl, currentTemplate);
    currentTemplate = tpl;
    var grid = $('templGrid');
    if(grid){
      Array.prototype.forEach.call(grid.querySelectorAll('button'), function(b){
        b.classList.toggle('sel', b.getAttribute('data-id') === tpl.id);
      });
    }
    loadImage(tpl.src).then(function(im){
      setBg(im);
      say('');
    }).catch(function(){
      say('Could not load template "' + tpl.label + '" from ' + tpl.src + '. Make sure the file exists in the templ/ folder (names are case-sensitive on GitHub Pages).');
    });
  }

  function renderTemplateGrid(){
    var grid = $('templGrid'); if(!grid) return;
    grid.innerHTML = '';
    TEMPLATES.forEach(function(tpl){
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-id', tpl.id);
      b.title = tpl.label;
      b.innerHTML = '<img alt="' + tpl.label + '" src="' + tpl.src + '"><span>' + tpl.label + '</span>';
      b.addEventListener('click', function(){ loadTemplate(tpl); });
      grid.appendChild(b);
    });
  }

  $('bgFile').addEventListener('change', function(){
    var f = this.files[0]; if(!f) return;
    var url = URL.createObjectURL(f);
    loadImage(url).then(function(im){ setBg(im); say(''); }).catch(function(){ say('That image could not be opened.'); });
  });
  $('bgReset').addEventListener('click', function(){
    $('bgFile').value='';
    loadTemplate(currentTemplate, true);
  });
  $('btnReset').addEventListener('click', function(){
    var t = currentTemplate.text || {};
    state.x = t.x==null ? .045 : t.x; state.y = t.y==null ? .9 : t.y;
    schedule();
  });

  // drag the text around
  var dragging=false, off={x:0,y:0};
  function pos(e){
    var r = cv.getBoundingClientRect();
    return { x:(e.clientX-r.left)/r.width*cv.width, y:(e.clientY-r.top)/r.height*cv.height };
  }
  cv.addEventListener('pointerdown', function(e){
    var p = pos(e);
    dragging = true; cv.classList.add('drag'); cv.setPointerCapture(e.pointerId);
    off.x = p.x - state.x*cv.width; off.y = p.y - state.y*cv.height;
  });
  cv.addEventListener('pointermove', function(e){
    if(!dragging) return;
    var p = pos(e);
    state.x = Math.min(1.2,Math.max(-.2,(p.x-off.x)/cv.width));
    state.y = Math.min(1.2,Math.max(0,(p.y-off.y)/cv.height));
    schedule();
  });
  function end(){ dragging=false; cv.classList.remove('drag'); }
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

  // saving / copying
  function toBlob(){ return new Promise(function(res){ cv.toBlob(res,'image/png'); }); }
  $('btnSave').addEventListener('click', function(){
    draw();
    toBlob().then(function(blob){
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download='megumi-text.png';
      document.body.appendChild(a); a.click(); a.remove();
      say('If nothing downloaded, use Copy image or press and hold the picture.');
    });
  });
  $('btnCopy').addEventListener('click', function(){
    draw();
    toBlob().then(function(blob){
      if(navigator.clipboard && window.ClipboardItem){
        return navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(function(){ say('Copied to clipboard.'); });
      }
      throw new Error('no clipboard');
    }).catch(function(){ say('Copy is not available here. Right-click or press and hold the picture to save it.'); });
  });
    // GIF encoder. I didn't know how to do this part, so it was written with
  // help from AI (Claude). It builds one shared 256 colour palette, then
  // compresses each frame with LZW. No libraries needed.
  function gifPalette(frames, npx){
    var hist = new Uint32Array(32768), f, i, d, total = 0;
    for(f=0; f<frames.length; f++){
      d = frames[f];
      for(i=0; i<npx*4; i+=4) hist[((d[i]>>3)<<10)|((d[i+1]>>3)<<5)|(d[i+2]>>3)]++;
    }
    var keys = [];
    for(i=0; i<32768; i++) if(hist[i]){ keys.push(i); total += hist[i]; }
    function ch(k,c){ return c===0 ? k>>10 : (c===1 ? (k>>5)&31 : k&31); }
    function mk(k){
      var pop = 0, mn=[31,31,31], mx=[0,0,0], j, c, v;
      for(j=0; j<k.length; j++){
        pop += hist[k[j]];
        for(c=0; c<3; c++){ v = ch(k[j],c); if(v<mn[c]) mn[c]=v; if(v>mx[c]) mx[c]=v; }
      }
      var r = [mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2]];
      var axis = r[0]>=r[1] && r[0]>=r[2] ? 0 : (r[1]>=r[2] ? 1 : 2);
      return { k:k, pop:pop, axis:axis, score:(k.length>1 ? pop*(r[axis]+1) : -1) };
    }
    var boxes = [mk(keys)];
    while(boxes.length < 256){
      var bi = -1, bs = 0, j;
      for(j=0; j<boxes.length; j++) if(boxes[j].score > bs){ bs = boxes[j].score; bi = j; }
      if(bi < 0) break;
      var b = boxes[bi], ax = b.axis;
      b.k.sort(function(a,z){ return ch(a,ax)-ch(z,ax); });
      var half = b.pop/2, acc = 0, cut = 1;
      for(j=0; j<b.k.length-1; j++){ acc += hist[b.k[j]]; cut = j+1; if(acc >= half) break; }
      boxes.splice(bi, 1, mk(b.k.slice(0,cut)), mk(b.k.slice(cut)));
    }
    var pal = new Uint8Array(768), map = new Uint8Array(32768);
    boxes.forEach(function(bx, idx){
      var r=0, g=0, bl=0, n=0, j, p, k;
      for(j=0; j<bx.k.length; j++){
        k = bx.k[j]; p = hist[k]; n += p;
        r += (k>>10)*p; g += ((k>>5)&31)*p; bl += (k&31)*p;
        map[k] = idx;
      }
      pal[idx*3]   = Math.round(r/n*255/31);
      pal[idx*3+1] = Math.round(g/n*255/31);
      pal[idx*3+2] = Math.round(bl/n*255/31);
    });
    return { pal:pal, map:map };
  }

  function gifLZW(idx, out){
    var MIN = 8, CLEAR = 256, EOI = 257;
    var next = EOI+1, size = MIN+1, table = new Map();
    var cur = 0, shift = 0, bytes = [], i;
    function put(code){
      cur |= code << shift; shift += size;
      while(shift >= 8){ bytes.push(cur & 255); cur >>>= 8; shift -= 8; }
    }
    put(CLEAR);
    var prefix = idx[0];
    for(i=1; i<idx.length; i++){
      var k = idx[i], key = (prefix<<8)|k, code = table.get(key);
      if(code === undefined){
        put(prefix);
        if(next === 4096){
          put(CLEAR);
          next = EOI+1; size = MIN+1; table = new Map();
        } else {
          if(next >= (1<<size)) size++;
          table.set(key, next++);
        }
        prefix = k;
      } else prefix = code;
    }
    put(prefix);
    put(EOI);
    if(shift > 0) bytes.push(cur & 255);
    out.push(MIN);
    for(i=0; i<bytes.length; i+=255){
      var n = Math.min(255, bytes.length-i);
      out.push(n);
      for(var j=0; j<n; j++) out.push(bytes[i+j]);
    }
    out.push(0);
  }

  function encodeGif(frames, w, h, delay){
    var npx = w*h, q = gifPalette(frames, npx), out = [], f, i;
    function u16(v){ out.push(v & 255, (v>>8) & 255); }
    out.push(71,73,70,56,57,97);
    u16(w); u16(h); out.push(0xF7, 0, 0);
    for(i=0; i<768; i++) out.push(q.pal[i]);
    out.push(0x21,0xFF,0x0B);
    "NETSCAPE2.0".split('').forEach(function(c){ out.push(c.charCodeAt(0)); });
    out.push(3,1,0,0,0);
    for(f=0; f<frames.length; f++){
      var d = frames[f], idx = new Uint8Array(npx);
      for(i=0; i<npx; i++){
        var p = i*4;
        idx[i] = q.map[((d[p]>>3)<<10)|((d[p+1]>>3)<<5)|(d[p+2]>>3)];
      }
      out.push(0x21,0xF9,4,0x04); u16(delay); out.push(0,0);
      out.push(0x2C); u16(0); u16(0); u16(w); u16(h); out.push(0);
      gifLZW(idx, out);
    }
    out.push(0x3B);
    return new Uint8Array(out);
  }

  var GIF_FRAMES = 12, GIF_DELAY = 8, busy = false;
  function tick(){ return new Promise(function(r){ setTimeout(r,0); }); }
  function setBusy(b){ busy = b; ['btnGif','gUp'].forEach(function(id){ $(id).disabled = b; }); }

  async function makeGif(){
    await ensureFont();
    var tw = Math.min(parseInt($('gifW').value,10) || 480, cv.width);
    var th = Math.round(cv.height * tw / cv.width);
    var off = document.createElement('canvas'); off.width = tw; off.height = th;
    var octx = off.getContext('2d', {willReadFrequently:true});
    var pulse = $('pulse').checked && $('mode').value!=='plain', n = pulse ? GIF_FRAMES : 2, frames = [], i;
    for(i=0; i<n; i++){
      var gs = pulse ? 0.55 + 0.7*(0.5 - 0.5*Math.cos(2*Math.PI*i/n)) : 1;
      draw(off, gs);
      frames.push(octx.getImageData(0,0,tw,th).data);
      say('Rendering GIF… ' + (i+1) + '/' + n);
      await tick();
    }
    say('Encoding GIF…'); await tick();
    var bytes = encodeGif(frames, tw, th, pulse ? GIF_DELAY : 100);
    return new Blob([bytes], {type:'image/gif'});
  }

  function saveBlob(blob, name){
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    say('GIF ready (' + Math.round(blob.size/1024) + ' KB). If nothing downloaded, check your browser\u2019s download settings.');
    return Promise.resolve();
  }

  $('btnGif').addEventListener('click', async function(){
    if(busy) return;
    setBusy(true);
    try{ await saveBlob(await makeGif(), 'megumi-text.gif'); }
    catch(e){ say('The GIF could not be created. Try a smaller width.'); }
    setBusy(false);
  });

  $('btnGiphy').addEventListener('click', function(){
    var box = $('giphyBox'); box.hidden = !box.hidden;
    this.setAttribute('aria-expanded', String(!box.hidden));
    if(!box.hidden) $('gKey').focus();
  });
  $('gManual').addEventListener('click', function(){
    window.open('https://giphy.com/upload', '_blank', 'noopener,noreferrer');
    say('Download the GIF first, then drop it onto the GIPHY upload page.');
  });

  function gMsg(text, id){
    var r = $('gRes'); r.textContent = text || '';
    if(id){
      r.appendChild(document.createTextNode(' '));
      var a = document.createElement('a');
      a.href = 'https://giphy.com/gifs/' + encodeURIComponent(id);
      a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Open it on GIPHY';
      r.appendChild(a);
    }
  }

  $('gUp').addEventListener('click', async function(){
    if(busy) return;
    var key = $('gKey').value.trim();
    if(!key){ gMsg('Paste your GIPHY API key first.'); $('gKey').focus(); return; }
    if(!$('gOk').checked){ gMsg('Tick the box to confirm you want to upload.'); return; }
    setBusy(true); gMsg('');
    try{
      var blob = await makeGif();
      var fd = new FormData();
      fd.append('api_key', key);
      fd.append('file', blob, 'megumi-text.gif');
      var tags = $('gTags').value.trim(), user = $('gUser').value.trim();
      if(tags) fd.append('tags', tags);
      if(user) fd.append('username', user);
      say('Uploading to GIPHY…');
      var res = await fetch('https://upload.giphy.com/v1/gifs', { method:'POST', body:fd });
      var json = null;
      try{ json = await res.json(); }catch(e){}
      var id = json && json.data && json.data.id;
      if(res.ok && id){ say('Uploaded.'); gMsg('Uploaded to GIPHY.', id); }
      else{
        var why = json && json.meta && json.meta.msg ? json.meta.msg : ('HTTP ' + res.status);
        say(''); gMsg('GIPHY rejected the upload: ' + why + '. Check your API key, or download the GIF and use the GIPHY upload page.');
      }
    }catch(e){
      say('');
      gMsg('Could not reach GIPHY from this page (network or browser block). Download the GIF and upload it on giphy.com/upload instead.');
    }
    setBusy(false);
  });

  // boot
  syncLabels();
  renderTemplateGrid();
  loadTemplate(currentTemplate);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
})();