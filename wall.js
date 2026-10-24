/* Megumi text generator - wall.js
   Community wall: everyone can read, each browser can post once, only apollo
   replies (from the Supabase dashboard). Data lives in Supabase, see
   supabase-setup.sql. The key below is the PUBLIC "anon" key, it is meant to
   be in the page. The database rules are what stop people editing things. */
(function(){
  if(window.__blocked) return;

  // ---- fill these in from Supabase: Project Settings > API ----------------
  var SUPABASE_URL = 'https://nryegbqqcjukozqkfdxi.supabase.co';        // like https://abcdefgh.supabase.co
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yeWVnYnFxY2p1a296cWtmZHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MzM3MzIsImV4cCI6MjEwODQwOTczMn0.KbCTI8fDhHoy-EABOqxU-APGPf-Huon-NLKHvcgwb24';        // the "anon public" key
  // -------------------------------------------------------------------------

  var $ = function(id){ return document.getElementById(id); };
  var form = $('wallForm'), list = $('wallList'), status = $('wallStatus');
  if(!form) return;
  var POSTED = 'megumiWallPosted';

  function api(path, opts){
    opts = opts || {};
    var h = { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY };
    if(opts.body){ h['Content-Type'] = 'application/json'; h.Prefer = 'return=minimal'; }
    return fetch(SUPABASE_URL.replace(/\/$/,'') + '/rest/v1/' + path, { method: opts.method || 'GET', headers: h, body: opts.body });
  }
  function posted(){ try{ return localStorage.getItem(POSTED) === '1'; }catch(e){ return false; } }
  function markPosted(){ try{ localStorage.setItem(POSTED, '1'); }catch(e){} }
  function when(iso){
    var d = new Date(iso); if(isNaN(d)) return '';
    return d.toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' });
  }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function showDone(){ form.hidden = true; $('wallDone').hidden = false; }

  function render(rows){
    list.innerHTML = '';
    if(!rows.length){ list.appendChild(el('li', 'wall-empty', 'No messages yet. Be the first!')); return; }
    rows.forEach(function(r){
      var li = el('li');
      var meta = el('div', 'wall-meta'); meta.appendChild(el('b', null, r.name && r.name.trim() ? r.name.trim() : 'Anonymous'));
      meta.appendChild(document.createTextNode(' · ' + when(r.created_at)));
      li.appendChild(meta);
      li.appendChild(el('p', 'wall-body', r.body));
      if(r.reply && r.reply.trim()){
        var rep = el('div', 'wall-reply');
        var rm = el('div', 'wall-meta'); rm.appendChild(el('b', null, 'apollo replied'));
        if(r.replied_at) rm.appendChild(document.createTextNode(' · ' + when(r.replied_at)));
        rep.appendChild(rm); rep.appendChild(el('p', 'wall-body', r.reply));
        li.appendChild(rep);
      }
      list.appendChild(li);
    });
  }

  function load(){
    return api('messages?select=id,created_at,name,body,reply,replied_at&order=created_at.desc&limit=200')
      .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(render)
      .catch(function(){ list.innerHTML = ''; list.appendChild(el('li', 'wall-empty', 'The wall could not be loaded right now. Try again later.')); });
  }

  $('wallBody').addEventListener('input', function(){ $('wallCount').textContent = this.value.length + ' / 300'; });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if(posted()){ showDone(); return; }
    var name = $('wallName').value.trim().slice(0, 30), body = $('wallBody').value.trim().slice(0, 300);
    if(!body){ status.textContent = 'Write a message first.'; $('wallBody').focus(); return; }
    $('wallSend').disabled = true; status.textContent = 'Posting…';
    api('messages', { method:'POST', body: JSON.stringify({ name: name || null, body: body }) })
      .then(function(r){
        if(r.ok){ markPosted(); status.textContent = ''; showDone(); return load(); }
        return r.json().catch(function(){ return {}; }).then(function(j){
          var msg = j && j.message && /too many/i.test(j.message) ? 'Too many messages right now, try again in a minute.' : 'Your message could not be posted. Try again later.';
          throw new Error(msg);
        });
      })
      .catch(function(err){ status.textContent = err && err.message && err.message.indexOf(' ') > 0 ? err.message : 'Your message could not be posted. Try again later.'; $('wallSend').disabled = false; });
  });

  if(!SUPABASE_URL || !SUPABASE_KEY){
    form.hidden = true;
    list.innerHTML = ''; list.appendChild(el('li', 'wall-empty', 'The community wall is coming soon.'));
    return;
  }
  if(posted()) showDone();
  load();
})();
