// halloween = shibuya incident (oct 31). turns on by itself from oct 24 to nov 1
// add ?halloween to the link to see it any day
(function(){
  var d = new Date(), m = d.getMonth(), day = d.getDate();
  var on = (m === 9 && day >= 24) || (m === 10 && day <= 1) || /[?&]halloween\b/.test(location.search);
  if(!on) return;
  var root = document.documentElement;
  root.setAttribute('data-season', 'shibuya');

  var css = document.createElement('style');
  css.textContent = [
    ':root[data-season="shibuya"]{--bg:#07040c;--panel:#120a1c;--ink:#f3e9ff;--muted:#a993c4;--line:#2c1a44;--accent:#ff6a00;--accent-ink:#140600;--field:#0c0614}',
    ':root[data-season="shibuya"] body{background:radial-gradient(1200px 600px at 50% -10%,#3a0d4d 0%,transparent 60%),var(--bg)}',
    ':root[data-season="shibuya"] h1{color:#ff8a1f;text-shadow:0 0 18px #ff6a0066}',
    '.veil{position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse 140% 90% at 50% 0%,transparent 55%,#1a0024cc 100%)}',
    '.sb-banner{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:linear-gradient(90deg,#1b0a29,#2b0f12);border:1px solid #ff6a0055;border-radius:14px;padding:12px 16px;position:relative;overflow:hidden}',
    '.sb-banner b{font-size:clamp(18px,3vw,26px);letter-spacing:.06em;color:#ff8a1f}',
    '.sb-banner span{color:#cdb6ec;font-size:14px}',
    '.sb-banner .sb-x{background:none;border:0;color:#cdb6ec;font-size:20px;padding:4px 8px;cursor:pointer}',
    '.embers{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}',
    '.embers i{position:absolute;top:-10px;width:4px;height:4px;border-radius:50%;background:#ff7a1a;box-shadow:0 0 8px #ff6a00;opacity:.7;animation:fall linear infinite}',
    '@keyframes fall{to{transform:translate(var(--dx),110vh)}}',
    'main{position:relative;z-index:1}',
    '@media (prefers-reduced-motion:reduce){.embers{display:none}}'
  ].join('\n');
  document.head.appendChild(css);

  function start(){
    var veil = document.createElement('div'); veil.className = 'veil'; document.body.appendChild(veil);
    var em = document.createElement('div'); em.className = 'embers';
    for(var i = 0; i < 26; i++){
      var e = document.createElement('i');
      e.style.left = (Math.random()*100) + 'vw';
      e.style.animationDuration = (9 + Math.random()*12) + 's';
      e.style.animationDelay = (-Math.random()*20) + 's';
      e.style.setProperty('--dx', ((Math.random() - .5)*120) + 'px');
      var s = 2 + Math.random()*3; e.style.width = e.style.height = s + 'px';
      em.appendChild(e);
    }
    document.body.appendChild(em);

    var closed = false;
    try{ closed = sessionStorage.getItem('sbClosed') === '1'; }catch(e){}
    var main = document.querySelector('main');
    if(main && !closed){
      var b = document.createElement('div'); b.className = 'sb-banner';
      b.innerHTML = '<div><b>SHIBUYA INCIDENT</b><br><span>October 31. the veil is down. happy halloween 🎃</span></div><button class="sb-x" aria-label="Close">×</button>';
      b.querySelector('.sb-x').onclick = function(){ b.remove(); try{ sessionStorage.setItem('sbClosed','1'); }catch(e){} };
      main.insertBefore(b, main.firstChild);
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
