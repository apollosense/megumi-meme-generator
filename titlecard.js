// hand made letters in the style of the invincible title card.
// every letter is a few flat shapes on a 100 unit tall grid: tall and narrow,
// upright strokes get a spike to the left at the top and a foot to the right at
// the bottom, round letters get cut corners. then the whole block gets bent:
// flat top, bottom bows up in the middle, and it fans out towards the bottom
(function(){
  var S = 12, T = 11, F = 4, C = 8, GAP = 8;   // stroke, bar, spike, cut corner, letter gap

  function stem(x){ return [[x-F,0],[x+S,0],[x+S,86],[x+S+F,95],[x+S+F,100],[x,100],[x,13],[x-F,4]]; }
  function rect(x0,y0,x1,y1){ return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]]; }
  function oct(x0,y0,x1,y1,c){ return [[x0+c,y0],[x1-c,y0],[x1,y0+c],[x1,y1-c],[x1-c,y1],[x0+c,y1],[x0,y1-c],[x0,y0+c]]; }
  function topArm(x0,x1){ return [[x0,0],[x1,0],[x1-5,T],[x0,T]]; }
  function midArm(x0,x1){ return [[x0,43],[x1,43],[x1-5,57],[x0,57]]; }
  function botArm(x0,x1){ return [[x0,100-T],[x1-5,100-T],[x1+F,100],[x0,100]]; }
  // a shape is a list of outlines, filled even-odd so inner outlines become holes
  function sh(){ return Array.prototype.slice.call(arguments); }

  var G = {};
  function add(ch, w, shapes){ G[ch] = { w:w, s:shapes }; }
  var w = 34, h = w/2;

  add('A', 34, [sh([[17-S/2,0],[17+S/2,0],[S,100],[-F,100]]), sh([[17-S/2,0],[17+S/2,0],[34+F,100],[34-S,100]]), sh(rect(7,62,27,75))]);
  add('B', w, [sh(stem(0)), sh([[S-1,0],[w-C,0],[w,C],[w,44],[w-4,50],[w,56],[w,100-C],[w-C,100],[S-1,100],[S-1,100-T],[w-S,100-T],[w-S,57],[S-1,57],[S-1,43],[w-S,43],[w-S,T],[S-1,T]])]);
  add('C', w, [sh([[C,0],[w-C,0],[w,C],[w,34],[w-S,39],[w-S,T],[S,T],[S,100-T],[w-S,100-T],[w-S,61],[w,66],[w,100-C],[w-C,100],[C,100],[0,100-C],[0,C]])]);
  add('D', w, [sh(stem(0)), sh([[S-1,0],[w-C,0],[w,C],[w,100-C],[w-C,100],[S-1,100],[S-1,100-T],[w-S,100-T],[w-S,T],[S-1,T]])]);
  add('E', 33, [sh(stem(0)), sh(topArm(S-1,33)), sh(midArm(S-1,29)), sh(botArm(S-1,33))]);
  add('F', 30, [sh(stem(0)), sh(topArm(S-1,30)), sh(midArm(S-1,27))]);
  add('G', w, [sh([[C,0],[w-C,0],[w,C],[w,33],[w-S,38],[w-S,T],[S,T],[S,100-T],[w-S,100-T],[w-S,60],[w*.45,60],[w*.45,46],[w,46],[w,100-C],[w-C,100],[C,100],[0,100-C],[0,C]])]);
  add('H', 36, [sh(stem(0)), sh(stem(36-S)), sh(rect(S-1,43,36-S+1,57))]);
  add('I', S, [sh(stem(0))]);
  add('J', 30, [sh([[30-S-F,0],[30,0],[30,100-C],[30-C,100],[C,100],[0,100-C],[0,62],[S,62],[S,100-T],[30-S,100-T],[30-S,13],[30-S-F,4]])]);
  add('K', 33, [sh(stem(0)), sh([[S-1,40],[33-S,0],[33+F,0],[S-1,62]]), sh([[S+4,48],[33+F,95],[33+F,100],[33-S,100],[S-1,66]])]);
  add('L', 32, [sh(stem(0)), sh(botArm(S-1,32))]);
  add('M', 46, [sh(stem(0)), sh(stem(46-S)), sh([[0,0],[S,0],[23+S/3,70],[23-S/3,70]]), sh([[46-S,0],[46,0],[23+S/3,70],[23-S/3,70]])]);
  add('N', 36, [sh(stem(0)), sh(stem(36-S)), sh([[0,0],[S,0],[36,100],[36-S,100]])]);
  add('O', w, [sh(oct(0,0,w,100,C), rect(S,T,w-S,100-T))]);
  add('P', w, [sh(stem(0)), sh([[S-1,0],[w-C,0],[w,C],[w,52],[w-C,60],[S-1,60],[S-1,46],[w-S,46],[w-S,T],[S-1,T]])]);
  add('Q', w, [sh(oct(0,0,w,100,C), rect(S,T,w-S,100-T)), sh([[w-S-2,80],[w-5,74],[w+F+2,100],[w-S+2,100]])]);
  add('R', w, [sh(stem(0)), sh([[S-1,0],[w-C,0],[w,C],[w,50],[w-C,58],[S-1,58],[S-1,44],[w-S,44],[w-S,T],[S-1,T]]), sh([[w-S,56],[w,56],[w,86],[w+F,95],[w+F,100],[w-S,100]])]);
  add('S', w, [sh([[0,C],[C,0],[w,0],[w-4,T],[S,T],[S,42],[w-C,42],[w,42+C],[w,100-C],[w-C,100],[0,100],[4,100-T],[w-S,100-T],[w-S,58],[C,58],[0,58-C]])]);
  add('T', 34, [sh([[0,0],[34,0],[32,T],[2,T]]), sh(stem(17-S/2))]);
  add('U', w, [sh([[-F,0],[S,0],[S,100-T],[w-S,100-T],[w-S,0],[w,0],[w,100-C],[w-C,100],[C,100],[0,100-C],[0,13],[-F,4]])]);
  add('V', 34, [sh([[-F,0],[S,0],[17+S/2,100],[17-S/2,100]]), sh([[34-S,0],[34+F,0],[17+S/2,100],[17-S/2,100]])]);
  add('W', 46, [sh(stem(0)), sh(stem(46-S)), sh([[23-S/3,30],[23+S/3,30],[S,100],[0,100]]), sh([[23-S/3,30],[23+S/3,30],[46,100],[46-S,100]])]);
  add('X', 34, [sh([[-F,0],[S,0],[34+F,100],[34-S,100]]), sh([[34-S,0],[34+F,0],[S,100],[-F,100]])]);
  add('Y', 34, [sh([[-F,0],[S,0],[17+S/2,54],[17-S/2,54]]), sh([[34-S,0],[34+F,0],[17+S/2,54],[17-S/2,54]]), sh([[17-S/2,46],[17+S/2,46],[17+S/2,86],[17+S/2+F,95],[17+S/2+F,100],[17-S/2,100]])]);
  add('Z', w, [sh([[0,0],[w,0],[w,T+3],[S+3,100-T],[w+F,100-T],[w+F,100],[0,100],[0,100-T-3],[w-S-3,T],[0,T]])]);

  add('0', w, [sh(oct(0,0,w,100,C), rect(S,T,w-S,100-T))]);
  add('1', 26, [sh(stem(26-S)), sh([[26-S,0],[26-S,22],[0,32],[0,20]])]);
  add('2', w, [sh([[0,C],[C,0],[w-C,0],[w,C],[w,46],[S+3,100-T],[w,100-T],[w+F,100],[0,100],[0,88],[w-S,40],[w-S,T],[S,T],[S,26],[0,26]])]);
  add('3', w, [sh([[0,0],[w-C,0],[w,C],[w,100-C],[w-C,100],[0,100],[4,100-T],[w-S,100-T],[w-S,57],[9,57],[9,43],[w-S,43],[w-S,T],[0,T]])]);
  add('4', w, [sh([[-F,0],[S,0],[S,56],[w-S,56],[w-S,0],[w,0],[w,86],[w+F,95],[w+F,100],[w-S,100],[w-S,70],[0,70],[0,13],[-F,4]])]);
  add('5', w, [sh([[0,0],[w,0],[w-4,T],[S,T],[S,40],[w-C,40],[w,40+C],[w,100-C],[w-C,100],[0,100],[4,100-T],[w-S,100-T],[w-S,55],[0,55]])]);
  add('6', w, [sh([[C,0],[w,0],[w-4,T],[S,T],[S,40],[w-C,40],[w,40+C],[w,100-C],[w-C,100],[C,100],[0,100-C],[0,C]], rect(S,55,w-S,100-T))]);
  add('7', w, [sh([[0,0],[w,0],[w,T+6],[S+10,100],[6,100],[w-S-2,T],[0,T]])]);
  add('8', w, [sh(oct(0,0,w,100,C), rect(S,T,w-S,43), rect(S,57,w-S,100-T))]);
  add('9', w, [sh([[C,0],[w-C,0],[w,C],[w,100-C],[w-C,100],[0,100],[4,100-T],[w-S,100-T],[w-S,60],[C,60],[0,60-C],[0,C]], rect(S,T,w-S,45))]);

  add('!', S, [sh([[0,0],[S,0],[S-3,72],[3,72]]), sh(rect(1,83,S-1,100))]);
  add('?', w, [sh([[0,C],[C,0],[w-C,0],[w,C],[w,48],[h+S/2,58],[h+S/2,72],[h-S/2,72],[h-S/2,48],[w-S,40],[w-S,T],[S,T],[S,26],[0,26]]), sh(rect(h-S/2,83,h+S/2,100))]);
  add('.', S, [sh(rect(0,83,S,100))]);
  add(',', S, [sh([[0,83],[S,83],[S,98],[0,112]])]);
  add(':', S, [sh(rect(0,30,S,47)), sh(rect(0,83,S,100))]);
  add(';', S, [sh(rect(0,30,S,47)), sh([[0,83],[S,83],[S,98],[0,112]])]);
  add("'", 13, [sh([[0,0],[13,0],[13,18],[0,30]])]);
  add('"', 30, [sh([[0,0],[12,0],[12,18],[0,30]]), sh([[17,0],[29,0],[29,18],[17,30]])]);
  add('-', 24, [sh(rect(0,42,24,57))]);
  add('+', 30, [sh(rect(0,42,30,57)), sh(rect(15-7,28,15+7,71))]);
  add('/', 28, [sh([[28-S,0],[28,0],[S,100],[0,100]])]);
  add('&', 36, [sh([[C,0],[26-C,0],[26,C],[26,38],[18,48],[30,64],[30,42],[36,42],[36,100],[30,100],[30,90],[24,100],[C,100],[0,100-C],[0,58],[8,48],[0,38],[0,C]], rect(S-2,T,26-S+2,40), [[S-2,58],[S+5,58],[25,86],[25,100-T],[S-2,100-T]])]);
  add('#', 36, [sh(rect(6,25,30,38)), sh(rect(6,62,30,75)), sh(rect(9,6,19,94)), sh(rect(19,6,29,94))]);
  add('%', 40, [sh(oct(0,0,16,40,4), rect(5,7,11,33)), sh(oct(24,60,40,100,4), rect(29,67,35,93)), sh([[30,0],[40,0],[10,100],[0,100]])]);
  add('(', 18, [sh([[C,0],[18,0],[18,T],[S-2,T],[S-2,100-T],[18,100-T],[18,100],[C,100],[0,100-C],[0,C]])]);
  add(')', 18, [sh([[0,0],[18-C,0],[18,C],[18,100-C],[18-C,100],[0,100],[0,100-T],[18-S+2,100-T],[18-S+2,T],[0,T]])]);
  add('*', 26, [sh(rect(9,0,17,30)), sh([[0,6],[4,0],[26,22],[22,28]]), sh([[22,0],[26,6],[4,28],[0,22]])]);
  add('$', w, [sh([[0,C],[C,0],[w,0],[w-4,T],[S,T],[S,42],[w-C,42],[w,42+C],[w,100-C],[w-C,100],[0,100],[4,100-T],[w-S,100-T],[w-S,58],[C,58],[0,58-C]]), sh(rect(h-4,-10,h+4,110))]);
  add(' ', 14, []);

  // turkish and other accented capitals: the plain letter plus a small mark
  var MARKS = {
    'Ç':['C','cedilla'], 'Ş':['S','cedilla'], 'Ğ':['G','breve'], 'İ':['I','dot'], 'Ö':['O','dots'], 'Ü':['U','dots'],
    'Ä':['A','dots'], 'Ë':['E','dots'], 'Ï':['I','dots'], 'Á':['A','acute'], 'É':['E','acute'], 'Í':['I','acute'],
    'Ó':['O','acute'], 'Ú':['U','acute'], 'À':['A','grave'], 'È':['E','grave'], 'Ñ':['N','bar'], 'Â':['A','bar'], 'Î':['I','bar'], 'Û':['U','bar']
  };
  function mark(kind, wd){
    var m = wd/2;
    if(kind==='dot') return [sh(rect(m-6,-24,m+6,-9))];
    if(kind==='dots') return [sh(rect(m-14,-22,m-3,-9)), sh(rect(m+3,-22,m+14,-9))];
    if(kind==='acute') return [sh([[m-4,-9],[m+4,-28],[m+14,-28],[m+4,-9]])];
    if(kind==='grave') return [sh([[m-14,-28],[m-4,-28],[m+4,-9],[m-4,-9]])];
    if(kind==='breve' || kind==='bar') return [sh(rect(m-12,-20,m+12,-10))];
    if(kind==='cedilla') return [sh([[m-4,100],[m+5,100],[m+5,112],[m-6,118],[m-8,113],[m-3,110]])];
    return [];
  }
  function glyph(ch){
    if(G[ch]) return G[ch];
    var mk = MARKS[ch];
    if(mk && G[mk[0]]){ var b = G[mk[0]]; return { w:b.w, s:b.s.concat(mark(mk[1], b.w)) }; }
    return null;
  }
  function layout(text){
    var x = 0, items = [], prev = false;
    String(text).toUpperCase().split('').forEach(function(ch){
      var g = glyph(ch);
      if(!g) g = G['?'];
      if(prev) x += GAP;
      items.push({ g:g, x:x });
      x += g.w; prev = ch !== ' ';
      if(ch === ' '){ prev = false; }
    });
    return { items:items, w:x };
  }
  function supported(ch){ return !!glyph(String(ch).toUpperCase()) || /\s/.test(ch); }

  // o = { cx, top, cap, maxW, color, bend, fan, lineGap }
  // cap is the letter height in the middle; returns the box it covered
  function draw(ctx, lines, o){
    var bend = o.bend == null ? .10 : o.bend, fan = o.fan == null ? .065 : o.fan, lg = o.lineGap == null ? 16 : o.lineGap;
    var L = lines.map(layout), wt = Math.max.apply(null, L.map(function(l){ return l.w; }).concat([1]));
    var bh = L.length*100 + (L.length-1)*lg;
    var k = o.cap/100;
    if(o.maxW && wt*k*(1+fan) > o.maxW) k = o.maxW/(wt*(1+fan));
    function P(X, Y){
      var u = Math.max(-1, Math.min(1, (X - wt/2)/(wt/2))), v = Math.max(0, Y/bh);
      return [o.cx + (X - wt/2)*k*(1 + fan*v), o.top + Y*k*(1 + bend*u*u)];
    }
    ctx.fillStyle = o.color;
    L.forEach(function(l, li){
      var ox = (wt - l.w)/2, oy = li*(100 + lg);
      l.items.forEach(function(it){
        it.g.s.forEach(function(shape){
          ctx.beginPath();
          shape.forEach(function(poly){
            for(var i=0; i<poly.length; i++){
              var a = poly[i], b = poly[(i+1)%poly.length];
              var ax = ox + it.x + a[0], ay = oy + a[1], bx = ox + it.x + b[0], by = oy + b[1];
              var n = Math.max(1, Math.ceil(Math.max(Math.abs(bx-ax), Math.abs(by-ay))/3));
              for(var j=0; j<n; j++){
                var p = P(ax + (bx-ax)*j/n, ay + (by-ay)*j/n);
                if(i===0 && j===0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
              }
            }
            ctx.closePath();
          });
          ctx.fill('evenodd');
        });
      });
    });
    var half = wt/2*k*(1+fan);
    // bottom = where the middle of the last line ends (the curve's highest point)
    return { x:o.cx - half, y:o.top, w:half*2, h:bh*k*(1+bend), bottom:o.top + bh*k, k:k };
  }
  window.TitleCard = { draw:draw, layout:layout, supported:supported };
})();
