/* uygapul — admin. Nothing here leaves the browser except the Publish call to GitHub. */
(function(){
"use strict";

var PATH = "data/providers.js";
var data = JSON.parse(JSON.stringify(window.UYGAPUL || {updated:"", fallbackRate:13600, providers:[]}));
var rate = data.fallbackRate;

function $(id){ return document.getElementById(id); }
function fmt(n){ return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g," "); }
function today(){ return new Date().toISOString().slice(0,10); }

function cfg(){
  try{ return JSON.parse(localStorage.getItem("uygapul.gh")||"{}"); }catch(e){ return {}; }
}
function say(el, msg, ok){
  var s = $(el); s.className = "status on " + (ok ? "ok" : "err"); s.textContent = msg;
}

/* ---------- tabs ---------- */
Array.prototype.forEach.call(document.querySelectorAll(".tabs button"), function(b){
  b.onclick = function(){
    Array.prototype.forEach.call(document.querySelectorAll(".tabs button"), function(o){
      o.setAttribute("aria-pressed", String(o === b));
    });
    Array.prototype.forEach.call(document.querySelectorAll(".pane"), function(p){
      p.classList.toggle("on", p.id === "pane-" + b.dataset.pane);
    });
  };
});

/* ---------- live market rate, so the preview is real ---------- */
fetch("https://open.er-api.com/v6/latest/EUR")
  .then(function(r){ return r.json(); })
  .then(function(j){ if(j && j.rates && j.rates.UZS){ rate = j.rates.UZS; draw(); } })
  .catch(function(){});

/* ---------- provider editor ---------- */
function draw(){
  var amt = Math.max(1, parseFloat($("preview").value) || 200);
  $("list").innerHTML = data.providers.map(function(p,i){
    var out = Math.max(0,(amt - p.fee) * rate * (1 - p.fxMargin));
    return '<div class="pcard">'
      + '<div class="pcard-top"><span class="pcard-out">'+fmt(out)+' soʻm</span>'
      + '<button class="del" data-i="'+i+'">remove</button></div>'
      + '<div class="field"><label>Name</label><input data-i="'+i+'" data-k="name" value="'+(p.name||"")+'"></div>'
      + '<div class="grid-3">'
      +   '<div class="field"><label>FX margin %</label><input data-i="'+i+'" data-k="fxMargin" type="number" step="0.01" value="'+(p.fxMargin*100).toFixed(2)+'"></div>'
      +   '<div class="field"><label>Fee €</label><input data-i="'+i+'" data-k="fee" type="number" step="0.01" value="'+p.fee+'"></div>'
      +   '<div class="field"><label>Minutes</label><input data-i="'+i+'" data-k="mins" type="number" value="'+p.mins+'"></div>'
      + '</div>'
      + '<div class="grid">'
      +   '<div class="field"><label>Referral link</label><input data-i="'+i+'" data-k="url" value="'+(p.url||"")+'"></div>'
      +   '<div class="field"><label>Checked on</label><input data-i="'+i+'" data-k="checked" type="date" value="'+(p.checked||today())+'"></div>'
      + '</div></div>';
  }).join("");

  Array.prototype.forEach.call($("list").querySelectorAll("input"), function(inp){
    inp.oninput = function(){
      var p = data.providers[+inp.dataset.i], k = inp.dataset.k;
      if(k === "fxMargin")   p[k] = (parseFloat(inp.value)||0) / 100;
      else if(k === "fee")   p[k] = parseFloat(inp.value) || 0;
      else if(k === "mins")  p[k] = parseInt(inp.value,10) || 0;
      else                   p[k] = inp.value;
      if(k !== "name" && k !== "url" && k !== "checked") draw();
    };
  });
  Array.prototype.forEach.call($("list").querySelectorAll(".del"), function(b){
    b.onclick = function(){ data.providers.splice(+b.dataset.i,1); draw(); };
  });
}

$("preview").oninput = draw;
$("add").onclick = function(){
  data.providers.push({name:"New service", fxMargin:0.01, fee:1.00, mins:60, url:"", checked:today(), note:""});
  draw();
};

/* ---------- serialise ---------- */
function fileText(){
  data.updated = today();
  data.fallbackRate = Math.round(rate);
  var lines = data.providers.map(function(p){
    return '    { name: '+JSON.stringify(p.name)
      + ', fxMargin: '+p.fxMargin.toFixed(4)
      + ', fee: '+Number(p.fee).toFixed(2)
      + ', mins: '+p.mins
      + ', url: '+JSON.stringify(p.url||"")
      + ', checked: '+JSON.stringify(p.checked||today())
      + ', note: '+JSON.stringify(p.note||"")+' }';
  }).join(",\n");
  return '/* uygapul.com — provider data. Written by admin.html on '+today()+'. */\n'
    + 'window.UYGAPUL = {\n'
    + '  updated: "'+data.updated+'",\n'
    + '  fallbackRate: '+data.fallbackRate+',\n'
    + '  providers: [\n' + lines + '\n  ]\n};\n';
}

$("download").onclick = function(){
  var b = new Blob([fileText()], {type:"text/javascript"});
  var a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = "providers.js"; a.click();
  say("status","Downloaded. Put it in data/ in your repo and commit.", true);
};

/* ---------- GitHub connection ---------- */
(function fill(){
  var c = cfg();
  if(c.owner)  $("owner").value  = c.owner;
  if(c.repo)   $("repo").value   = c.repo;
  if(c.branch) $("branch").value = c.branch;
  if(c.token)  $("token").value  = c.token;
})();

$("savecfg").onclick = function(){
  localStorage.setItem("uygapul.gh", JSON.stringify({
    owner:$("owner").value.trim(), repo:$("repo").value.trim(),
    branch:($("branch").value.trim()||"main"), token:$("token").value.trim()
  }));
  say("status2","Saved in this browser.", true);
};

function api(c, extra){
  return "https://api.github.com/repos/"+c.owner+"/"+c.repo+"/contents/"+PATH+(extra||"");
}
function headers(c){
  return { "Authorization":"Bearer "+c.token, "Accept":"application/vnd.github+json" };
}

$("test").onclick = function(){
  var c = cfg();
  if(!c.owner || !c.repo || !c.token){ say("status2","Fill in all four fields first.", false); return; }
  fetch(api(c,"?ref="+c.branch), {headers:headers(c)})
    .then(function(r){
      if(r.status === 200) say("status2","Connected. Found "+PATH+" on "+c.branch+".", true);
      else if(r.status === 404) say("status2","Repo reached but "+PATH+" not found on branch "+c.branch+".", false);
      else if(r.status === 401) say("status2","Token rejected. Check it hasn't expired.", false);
      else say("status2","GitHub returned "+r.status+".", false);
    })
    .catch(function(){ say("status2","No connection to GitHub.", false); });
};

/* UTF-8 safe base64 — provider names may contain oʻ, gʻ, Cyrillic */
function b64(str){
  var bytes = new TextEncoder().encode(str), bin = "";
  for(var i=0;i<bytes.length;i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

$("publish").onclick = function(){
  var c = cfg();
  if(!c.owner || !c.repo || !c.token){
    say("status","No GitHub connection yet — open the Connection tab, or use Download instead.", false);
    return;
  }
  var btn = $("publish"); btn.disabled = true; btn.textContent = "Publishing…";
  var body = fileText();

  fetch(api(c,"?ref="+c.branch), {headers:headers(c)})
    .then(function(r){ return r.status === 200 ? r.json() : null; })
    .then(function(existing){
      var payload = {
        message:"rates: "+today(),
        content:b64(body),
        branch:c.branch
      };
      if(existing && existing.sha) payload.sha = existing.sha;
      return fetch(api(c), {
        method:"PUT",
        headers:Object.assign({"Content-Type":"application/json"}, headers(c)),
        body:JSON.stringify(payload)
      });
    })
    .then(function(r){
      if(r.ok) say("status","Published. The live site updates in about 30 seconds.", true);
      else if(r.status === 401) say("status","Token rejected — check it hasn't expired.", false);
      else if(r.status === 403) say("status","Token lacks Contents: write on this repo.", false);
      else if(r.status === 409) say("status","Conflict — reload the page and try again.", false);
      else say("status","GitHub returned "+r.status+".", false);
    })
    .catch(function(){ say("status","No connection to GitHub. Use Download instead.", false); })
    .finally(function(){ btn.disabled = false; btn.textContent = "Publish to live site"; });
};

draw();
})();
