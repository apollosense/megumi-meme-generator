/* Megumi text generator - app.js (v11.1)
   (c) apollosense. All rights reserved. Do not copy or redistribute.
   Parts of this were written with AI help, see README.md. */
(function(){
  if(window.__blocked) return;

  // ---- template list ----------------------------------------------------
  // Each image lives in the "templ/" folder next to this file.
  // Add more entries here whenever you drop new images into templ/.
  // The FIRST entry is the default image loaded on page open.
  // Put new ones at the BOTTOM of the list. The picker shows the first one
  // (megumi) first and then the rest newest to oldest, so the order here matters.
  // "tags" are extra words the search box looks at.
  //
  // "text" is how the text starts out on that picture:
  //   mode  'glow' = the megumi neon text, 'plain' = flat text like a manga page,
  //         'outline' = thick comic caption with a black outline, last word in the 2nd color
  //   x, y  where the text sits, 0..1 of the picture width / height
  //   size  slider value. in plain mode the capital letter height is size*0.72 % of the width
  //   grow  plain/outline only. 'up' = y is the last line and more lines stack above it,
  //         'down' = y is the first line and more lines go under it,
  //         'middle' = the whole block is centered on y
  //   lead  plain mode only. line spacing, in capital letter heights
  var TEMPLATES = [
    { id:'megumi-text',   src:'templ/megumi-text.png',   label:'Megumi', tags:'hell yeah glow shush original',
      text:{ mode:'glow', x:.045, y:.9, size:11, font:'Anton', c1:'#73B5FF', c2:'#0033FF',
             glow:100, small:true, upper:true, sample:'HELL YEAH' } },
    // bubble already says "COMING FROM A MONKEY WHO CAN'T", so the text carries on
    // right under that line. numbers measured from the picture: letters are 19px
    // tall, lines are 26.7px apart, bubble middle is at x=400 (picture is 553x780)
    { id:'geto-monkeys',  src:'templ/geto-monkeys.png',  label:'Geto', tags:'monkey bubble manga coming from',
      text:{ mode:'plain', grow:'down', x:.7233, y:.3394, size:4.8, lead:1.40, font:'manga',
             c1:'#000000', small:false, upper:true, sample:'READ' } },
    // two captions in the white strip on top (0 to 288px of 1696), one over each
    // picture. left picture is x 84-773, right one is x 773-1470 (image is 1548 wide).
    // "slots" = more than one text on the same template, each has its own x, y
    { id:'yuji-uncanny',  src:'templ/yuji-uncanny.png',  label:'Yuji', tags:'uncanny two panel before after manga',
      text:{ mode:'plain', grow:'middle', size:4.2, lead:1.65, font:'Arial',
             c1:'#000000', small:false, upper:false,
             slots:[ { x:.2767, y:.085, sample:'Left text' },
                     { x:.7245, y:.085, sample:'Right text' } ] } },
    // the "yeah." one. templ/yuji-yeah.jpg is the original with the text still on it,
    // the -empty one has it painted out. original text is white Times New Roman,
    // about 95px, middle of the word at x=258, sitting on y=443 (image is 1125x870)
    { id:'yuji-yeah',     src:'templ/yuji-yeah-empty.png', label:'Yeah', tags:'yuji black white serif',
      text:{ mode:'plain', grow:'middle', x:.2293, y:.4722, size:7.6, lead:1.74, font:'Times',
             c1:'#ffffff', small:false, upper:false, sample:'yeah.' } },
    // thumbnail style caption along the bottom. templ/todo-cry.png has the original
    // "TEARS OF JOY" painted out. the circle and the arrow are part of the picture.
    // original caption is Bangers at 136px, letters sit on y=635 (picture is 735x646)
    { id:'todo-cry',      src:'templ/todo-cry.png',      label:'Todo', tags:'tears of joy cry caption thumbnail arrow',
      text:{ mode:'outline', grow:'up', x:.5, y:.9837, size:19, lead:1.3, font:'Bangers',
             c1:'#dcdcdc', c2:'#e0b92e', small:false, upper:true, sample:'TEARS OF JOY' } },
    // same pose as the megumi one, so it gets the same glow text in the same corner
    { id:'gojo-shush',    src:'templ/gojo-shush.png',    label:'Gojo', tags:'shush hell yeah glow',
      text:{ mode:'glow', x:.045, y:.9, size:11, font:'Anton', c1:'#73B5FF', c2:'#0033FF',
             glow:100, small:true, upper:true, sample:'HELL YEAH' } },
    // the two bubbles in the panel stay as they are. your text goes in the empty
    // white box on top (it is 0 to 361px tall, picture is 1396x1127)
    { id:'losers-think',  src:'templ/losers-think.png',  label:'Losers', tags:'but thats how losers think manga grin smile',
      text:{ mode:'plain', grow:'middle', x:.5, y:.16, size:6.2, lead:1.45, font:'manga',
             c1:'#000000', small:false, upper:true, sample:'YOUR TEXT' } }
  ];
  function slotsOf(tpl){
    var t = (tpl && tpl.text) || {};
    return t.slots || [{ x:t.x==null ? .045 : t.x, y:t.y==null ? .9 : t.y, sample:t.sample }];
  }
  function copyPos(tpl){ return slotsOf(tpl).map(function(s){ return { x:s.x, y:s.y }; }); }
  var currentTemplate = TEMPLATES[0];
  // -----------------------------------------------------------------------

  var cv = document.getElementById('cv'), ctx = cv.getContext('2d');
  var $ = function(id){return document.getElementById(id)};
  var state = { pos:[{ x:.045, y:.9 }], boxes:[], bg:null };
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
    if(v==='Arial' || v==='Times' || v==='Bangers') return '400';
    if(v==='Anton') return '400';
    return '900';
  }
  function fontStack(){
    var v = $('font').value;
    if(v==='manga') return (hasManga() ? '"Manga Bubble",' : '') + '"Comic Neue","Comic Sans MS","Chalkboard SE",cursive,sans-serif';
    if(v==='Arial') return 'Arial,Helvetica,"Liberation Sans",sans-serif';
    if(v==='Times') return '"Times New Roman",Times,"Liberation Serif",serif';
    if(v==='Bangers') return 'Bangers,Impact,"Arial Black",sans-serif';
    var first = v==='custom' && customFamily ? '"'+customFamily+'"' : (v==='custom' ? '"TikTok Sans"' : v);
    return first + ',"TikTok Sans","Helvetica Neue",Inter,Arial,sans-serif';
  }
  function ensureFont(){
    var v = $('font').value;
    if(v==='custom' || v==='Arial' || v==='Times' || !document.fonts) return Promise.resolve();
    if(v==='manga'){
      return document.fonts.load('400 60px "Manga Bubble"').catch(function(){}).then(function(){
        if(!hasManga()) return document.fonts.load('700 60px "Comic Neue"').catch(function(){});
      });
    }
    return document.fonts.load(((v==='Bangers' || v==='Anton') ? '400' : '800') + ' 60px ' + v).catch(function(){});
  }

  function lines(slot){
    var t = $(slot ? 'txt2' : 'txt').value.replace(/\r/g,'');
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
    for(var s=0; s<state.pos.length; s++) drawSlot(ctx, tc, s, glowScale);
  }

  function drawSlot(ctx, tc, slot, glowScale){
    var W = tc.width, H = tc.height;
    if(tc===cv) state.boxes[slot] = null;
    var arr = lines(slot); if(!arr.length) return;
    var base = W * parseFloat($('size').value)/100;
    var glow = parseFloat($('glow').value)/100 * (glowScale==null ? 1 : glowScale);
    var c1 = $('c1').value, c2 = $('c2').value;
    var shrink = $('small').checked;
    var x = state.pos[slot].x*W, y = state.pos[slot].y*H;
    var fam = fontStack();
    ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.lineJoin='round';

    if($('mode').value!=='glow'){ drawPlain(ctx, tc, slot, arr, base, x, y, fam, c1, c2, $('mode').value==='outline'); return; }

    var items = [], cursor = y;
    for(var i=arr.length-1;i>=0;i--){
      var isLast = i===arr.length-1;
      var sz = (shrink && !isLast) ? base*0.5 : base;
      items.unshift({t:arr[i], sz:sz, y:cursor});
      cursor -= sz*1.08;
    }

    items.forEach(function(it){
      // anton and bangers only come in one weight. asking for 900 makes the browser fake a bolder one
      ctx.font = (($('font').value==='Anton' || $('font').value==='Bangers') ? '400 ' : '900 ') + it.sz + 'px ' + fam;
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
    if(tc===cv) state.boxes[slot] = { x:x, y:items[0].y - items[0].sz*0.9, w:Math.max.apply(null,items.map(function(i){return i.w})), h:y - (items[0].y - items[0].sz*0.9) + base*0.25 };
  }

  // flat text for the manga pages. the size is worked out from the height of a
  // capital letter, so it comes out the same size whichever font ends up loading
  function drawPlain(ctx, tc, slot, arr, base, x, y, fam, color, color2, outline){
    var t = currentTemplate.text || {};
    var wt = fontWeight();
    ctx.font = wt + ' 100px ' + fam;
    var asc = ctx.measureText('H').actualBoundingBoxAscent;
    var capRatio = asc > 0 ? asc/100 : 0.72;
    var cap = base*0.72, px = cap/capRatio, pitch = cap*(t.lead || 1.6);
    var first = t.grow==='middle' ? y - (cap + (arr.length-1)*pitch)/2 + cap
              : (t.grow==='up' ? y - (arr.length-1)*pitch : y);
    ctx.font = wt + ' ' + px + 'px ' + fam;
    if(outline){
      // captions shrink to fit, so a long line never runs off the picture
      var widest = Math.max.apply(null, arr.map(function(s){ return ctx.measureText(s).width; }));
      var room = tc.width*0.95 - cap*0.19;
      if(widest > room && widest > 0){
        var k = room/widest; px *= k; cap *= k; pitch *= k;
        if(t.grow==='up') first = y - (arr.length-1)*pitch;
        else if(t.grow==='middle') first = y - (cap + (arr.length-1)*pitch)/2 + cap;
        ctx.font = wt + ' ' + px + 'px ' + fam;
      }
    }
    ctx.textAlign = 'center'; ctx.fillStyle = color;
    var maxW = 0;
    if(outline){
      // comic caption: black outline first, then the letters on top. the last
      // word of the last line gets the second color (only if there is more than one word)
      var words = arr.join(' ').trim().split(/\s+/).length;
      ctx.textAlign = 'left'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
      ctx.strokeStyle = '#000000'; ctx.lineWidth = cap*0.19;
      arr.forEach(function(s, i){
        var w = ctx.measureText(s).width; maxW = Math.max(maxW, w);
        ctx.strokeText(s, x - w/2, first + i*pitch);
      });
      arr.forEach(function(s, i){
        var w = ctx.measureText(s).width, lx = x - w/2, by = first + i*pitch;
        var cut = (i===arr.length-1 && words>1) ? s.replace(/\s+$/,'').lastIndexOf(' ') + 1 : s.length;
        var head = s.slice(0, cut), tail = s.slice(cut);
        ctx.fillStyle = color; ctx.fillText(head, lx, by);
        if(tail){ ctx.fillStyle = color2; ctx.fillText(tail, lx + ctx.measureText(head).width, by); }
      });
    } else
    arr.forEach(function(s, i){
      ctx.fillText(s, x, first + i*pitch);
      maxW = Math.max(maxW, ctx.measureText(s).width);
    });
    if(tc===cv) state.boxes[slot] = { x:x - maxW/2, y:first - cap, w:maxW, h:cap + (arr.length-1)*pitch };
  }

  var raf=0;
  function schedule(){ cancelAnimationFrame(raf); raf=requestAnimationFrame(function(){ ensureFont().then(function(){ draw(); }); }); }

  function syncLabels(){
    $('sizeV').textContent = $('size').value + '%';
    $('glowV').textContent = $('glow').value + '%';
  }
  function syncMode(){
    var md = $('mode').value;
    $('txtHint').textContent = md==='plain' ? 'One line per row.' : (md==='outline' ? 'One line per row. The last word gets the highlight color.' : 'One line per row. The last line is the big one.');
    $('c2Label').textContent = md==='outline' ? 'Highlight color' : 'Glow color';
  }
  $('mode').addEventListener('change', function(){ syncMode(); schedule(); });
  ['txt','txt2','size','glow','small','upper','c1','c2'].forEach(function(id){
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
    var sl = slotsOf(tpl), old = slotsOf(prev);
    state.pos = copyPos(tpl); state.boxes = [];
    $('mode').value = t.mode;
    $('size').value = t.size;
    $('font').value = t.font; $('fontFileWrap').hidden = true;
    $('c1').value = t.c1;
    if(t.c2) $('c2').value = t.c2;
    if(t.glow!=null) $('glow').value = t.glow;
    $('small').checked = !!t.small;
    $('upper').checked = !!t.upper;
    // only swap the text if its still the example text from the last template
    function same(v, s){ return !!s && v.trim().toUpperCase() === s.toUpperCase(); }
    if(same($('txt').value, old[0].sample)) $('txt').value = sl[0].sample;
    var two = sl.length > 1;
    $('txt2Wrap').hidden = !two;
    if(two && ($('txt2').value.trim()==='' || (old[1] && same($('txt2').value, old[1].sample)))) $('txt2').value = sl[1].sample;
    $('dragHint').textContent = two ? 'Drag each text on the image to reposition it.' : 'Drag the text on the image to reposition it.';
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

  // megumi first, then newest to oldest
  function pickerOrder(){
    return [TEMPLATES[0]].concat(TEMPLATES.slice(1).reverse());
  }
  function matches(tpl, q){
    var hay = (tpl.label + ' ' + tpl.id + ' ' + (tpl.tags || '')).toLowerCase();
    return q.split(/\s+/).every(function(w){ return !w || hay.indexOf(w) > -1; });
  }
  function syncArrows(){
    var g = $('templGrid'); if(!g) return;
    var max = g.scrollWidth - g.clientWidth;
    $('templPrev').disabled = g.scrollLeft <= 6;
    $('templNext').disabled = g.scrollLeft >= max - 6;
  }
  function renderTemplateGrid(){
    var grid = $('templGrid'); if(!grid) return;
    var q = ($('templSearch').value || '').trim().toLowerCase();
    var list = pickerOrder().filter(function(t){ return matches(t, q); });
    grid.innerHTML = '';
    list.forEach(function(tpl){
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-id', tpl.id);
      b.title = tpl.label;
      if(currentTemplate && tpl.id === currentTemplate.id) b.classList.add('sel');
      var im = document.createElement('img'); im.alt = tpl.label; im.loading = 'lazy'; im.src = tpl.src;
      var sp = document.createElement('span'); sp.textContent = tpl.label;
      b.appendChild(im); b.appendChild(sp);
      b.addEventListener('click', function(){ loadTemplate(tpl); });
      grid.appendChild(b);
    });
    $('templEmpty').hidden = list.length > 0;
    $('templCount').textContent = q ? (list.length + ' of ' + TEMPLATES.length) : (TEMPLATES.length + ' templates, newest first');
    grid.scrollLeft = 0;
    syncArrows();
  }
  function nudge(dir){
    var g = $('templGrid');
    g.scrollBy({ left: dir * Math.max(120, g.clientWidth*0.8), behavior:'smooth' });
  }
  $('templSearch').addEventListener('input', renderTemplateGrid);
  $('templPrev').addEventListener('click', function(){ nudge(-1); });
  $('templNext').addEventListener('click', function(){ nudge(1); });
  $('templGrid').addEventListener('scroll', syncArrows);
  window.addEventListener('resize', syncArrows);

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
    state.pos = copyPos(currentTemplate);
    schedule();
  });

  // drag the text around
  var dragging=false, off={x:0,y:0}, active=0;
  // which text did they grab: the one under the pointer, or else the closest one
  function pickSlot(p){
    var best = 0, bd = Infinity;
    for(var i=0; i<state.pos.length; i++){
      var b = state.boxes[i]; if(!b) continue;
      var dx = Math.max(b.x - p.x, 0, p.x - (b.x + b.w)), dy = Math.max(b.y - p.y, 0, p.y - (b.y + b.h));
      var d = dx*dx + dy*dy;
      if(d < bd){ bd = d; best = i; }
    }
    return best;
  }
  function pos(e){
    var r = cv.getBoundingClientRect();
    return { x:(e.clientX-r.left)/r.width*cv.width, y:(e.clientY-r.top)/r.height*cv.height };
  }
  cv.addEventListener('pointerdown', function(e){
    var p = pos(e);
    dragging = true; cv.classList.add('drag'); cv.setPointerCapture(e.pointerId);
    active = pickSlot(p);
    off.x = p.x - state.pos[active].x*cv.width; off.y = p.y - state.pos[active].y*cv.height;
  });
  cv.addEventListener('pointermove', function(e){
    if(!dragging) return;
    var p = pos(e);
    var s = state.pos[active]; if(!s) return;
    s.x = Math.min(1.2,Math.max(-.2,(p.x-off.x)/cv.width));
    s.y = Math.min(1.2,Math.max(0,(p.y-off.y)/cv.height));
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
    var pulse = $('pulse').checked && $('mode').value==='glow', n = pulse ? GIF_FRAMES : 2, frames = [], i;
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