/* uygapul — public page */
(function(){
"use strict";

var T = {
  uz:{
    heroLabel:"Bugun eng koʻp beradi", all:"Barchasi", dest:"→ Toshkent",
    fresh:"Kurs yangilandi", stale:"Bozor kursi olinmadi — taxminiy",
    min:"daqiqa", hr:"soat", sum:"soʻm", arrives:"yetib boradi",
    shareH:"Rasm yasab, doʻstlaringizga yuboring",
    shareP:"Telegramga tayyor rasm — bir bosishda.",
    make:"Rasm yasash", save:"Rasmni saqlash ↓",
    methodH:"Bu qanday hisoblanadi",
    method:"<p>Bozor kursi har kuni avtomatik olinadi — xalqaro manbadan, agar u ishlamasa Oʻzbekiston Markaziy bankidan.</p>"+
            "<p>Xizmatlarning komissiyasi ularning eʼlon qilingan narxlari asosida hisoblanadi va oyda bir marta haqiqiy chek bilan tekshiriladi. <b>Bu jonli kotirovka emas.</b> Pul yuborishdan oldin ilovada aniq summani koʻring.</p>"+
            "<p>Havolalar sherikchilik havolalari boʻlishi mumkin. Bu tartibga taʼsir qilmaydi — roʻyxat faqat yetib boradigan summa boʻyicha tuziladi.</p>",
    card:"€%A → Toshkent"
  },
  ru:{
    heroLabel:"Сегодня больше всех", all:"Все сервисы", dest:"→ Ташкент",
    fresh:"Курс обновлён", stale:"Курс не получен — приблизительно",
    min:"мин", hr:"ч", sum:"сум", arrives:"дойдёт",
    shareH:"Сделайте картинку и отправьте друзьям",
    shareP:"Готовая картинка для Telegram — в одно нажатие.",
    make:"Сделать картинку", save:"Сохранить картинку ↓",
    methodH:"Как это считается",
    method:"<p>Рыночный курс берётся автоматически каждый день — из международного источника, а если он недоступен, из Центрального банка Узбекистана.</p>"+
            "<p>Комиссии сервисов рассчитаны по их официальным тарифам и раз в месяц сверяются с реальным чеком. <b>Это не живые котировки.</b> Перед отправкой проверьте точную сумму в приложении.</p>"+
            "<p>Ссылки могут быть партнёрскими. На порядок это не влияет — список строится только по сумме, которая дойдёт.</p>",
    card:"€%A → Ташкент"
  }
};

var lang = localStorage.getItem("uygapul.lang") || "uz";
var rate = null, fresh = false;
var D = window.UYGAPUL || { providers:[], fallbackRate:13600 };

function $(id){ return document.getElementById(id); }
function fmt(n){ return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g," "); }
function speed(m,t){ return m < 60 ? m+" "+t.min : Math.round(m/60)+" "+t.hr; }

/* ---------- rate: cache for the day, then try sources in order ---------- */
function today(){ return new Date().toISOString().slice(0,10); }

function loadRate(){
  try{
    var c = JSON.parse(localStorage.getItem("uygapul.rate")||"null");
    if(c && c.day === today() && c.v){ rate = c.v; fresh = true; return Promise.resolve(); }
  }catch(e){}

  return fetch("https://open.er-api.com/v6/latest/EUR")
    .then(function(r){ return r.json(); })
    .then(function(j){
      if(j && j.rates && j.rates.UZS) return j.rates.UZS;
      throw 0;
    })
    .catch(function(){
      return fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/EUR/")
        .then(function(r){ return r.json(); })
        .then(function(j){
          if(j && j[0] && j[0].Rate) return parseFloat(j[0].Rate);
          throw 0;
        });
    })
    .then(function(v){
      rate = v; fresh = true;
      try{ localStorage.setItem("uygapul.rate", JSON.stringify({day:today(), v:v})); }catch(e){}
    })
    .catch(function(){
      rate = D.fallbackRate; fresh = false;
    });
}

/* ---------- ranking ---------- */
function calc(){
  var amt = Math.max(1, parseFloat($("amt").value) || 0);
  return D.providers.map(function(p){
    return { p:p, out: Math.max(0,(amt - p.fee) * rate * (1 - p.fxMargin)) };
  }).sort(function(a,b){ return b.out - a.out; });
}

/* ---------- render ---------- */
function render(){
  var t = T[lang], res = calc();
  if(!res.length) return;
  var top = res[0].out, worst = res[res.length-1].out, span = Math.max(top - worst, 1);

  document.documentElement.lang = lang;
  $("heroLabel").textContent = t.heroLabel;
  $("allLabel").textContent  = t.all;
  $("dest").textContent      = t.dest;
  $("shareH").textContent    = t.shareH;
  $("shareP").textContent    = t.shareP;
  $("make").textContent      = t.make;
  $("save").textContent      = t.save;
  $("methodH").textContent   = t.methodH;
  $("methodBody").innerHTML  = t.method;

  $("kicker").className = "kicker" + (fresh ? "" : " is-stale");
  $("kickerTxt").textContent = (fresh ? t.fresh : t.stale) + " · 1 € = " + fmt(rate) + " " + t.sum;

  $("winnerName").textContent = res[0].p.name;
  $("winnerSum").textContent  = fmt(top) + " " + t.sum;
  $("winnerSub").textContent  = speed(res[0].p.mins, t) + " · " + t.arrives;

  $("rows").innerHTML = res.map(function(r,i){
    var loss = top - r.out;
    var pct  = 100 - Math.round((loss / span) * 92);
    return '<a class="row'+(i===0?" is-best":"")+'" href="'+(r.p.url||"#")+'" target="_blank" rel="nofollow sponsored noopener">'
      + '<div class="row-head"><span class="row-name">'+r.p.name+'</span>'
      + '<span class="row-sum">'+fmt(r.out)+'</span></div>'
      + '<div class="bar"><i style="width:'+pct+'%"></i></div>'
      + '<div class="row-meta"><span>'+speed(r.p.mins,t)+' · €'+r.p.fee.toFixed(2)+' + '+(r.p.fxMargin*100).toFixed(2)+'%</span>'
      + '<span class="loss">'+(i===0 ? "★" : "−"+fmt(loss)+" "+t.sum)+'</span></div></a>';
  }).join("");
}

/* ---------- shareable card ---------- */
function drawCard(){
  var t = T[lang], res = calc(), c = $("card"), x = c.getContext("2d");
  var amt = Math.max(1, parseFloat($("amt").value)||0), W = 820;
  c.height = 300 + res.length * 104;

  x.fillStyle = "#FBFAF7"; x.fillRect(0,0,W,c.height);
  x.fillStyle = "#2340C8"; x.fillRect(0,0,W*0.34,7);
  x.fillStyle = "#E9A02C"; x.fillRect(W*0.34,0,W*0.33,7);
  x.fillStyle = "#0D857C"; x.fillRect(W*0.67,0,W*0.33,7);

  var dstr = new Date().toLocaleDateString(lang==="uz"?"uz-UZ":"ru-RU",{day:"numeric",month:"long"});
  x.fillStyle="#5B6780"; x.font='700 21px "JetBrains Mono",monospace';
  x.fillText(dstr.toUpperCase(), 56, 86);

  x.fillStyle="#15213A"; x.font='800 52px Unbounded,sans-serif';
  x.fillText(t.card.replace("%A", amt), 56, 152);

  x.fillStyle="#5B6780"; x.font='400 20px "JetBrains Mono",monospace';
  x.fillText("1 € = "+fmt(rate)+" "+t.sum, 56, 194);

  res.forEach(function(r,i){
    var y = 250 + i*104, best = i===0;
    x.fillStyle = best ? "#FCF2DF" : "#FFFFFF";
    x.fillRect(40,y,W-80,88);
    x.strokeStyle = best ? "#E9A02C" : "#E2DFD6"; x.lineWidth = 2;
    x.strokeRect(41,y+1,W-82,86);

    x.fillStyle="#15213A"; x.font='600 28px Unbounded,sans-serif';
    x.fillText(r.p.name, 72, y+40);
    x.fillStyle="#5B6780"; x.font='400 17px "JetBrains Mono",monospace';
    x.fillText(speed(r.p.mins,t), 72, y+66);

    x.textAlign="right";
    x.fillStyle = best ? "#C2503A" : "#15213A";
    x.font='700 32px "JetBrains Mono",monospace';
    x.fillText(fmt(r.out), W-72, y+54);
    x.textAlign="left";
  });

  x.fillStyle="#2340C8"; x.font='800 22px Unbounded,sans-serif';
  x.fillText("uygapul.com", 56, c.height-34);

  c.classList.add("on");
  var a = $("save"); a.href = c.toDataURL("image/png"); a.classList.add("on");
}

/* ---------- wire up ---------- */
$("amt").addEventListener("input", render);
Array.prototype.forEach.call(document.querySelectorAll(".chips button"), function(b){
  b.onclick = function(){ $("amt").value = b.dataset.a; render(); };
});
Array.prototype.forEach.call(document.querySelectorAll(".langs button"), function(b){
  b.onclick = function(){
    lang = b.dataset.lang;
    try{ localStorage.setItem("uygapul.lang", lang); }catch(e){}
    Array.prototype.forEach.call(document.querySelectorAll(".langs button"), function(o){
      o.setAttribute("aria-pressed", String(o === b));
    });
    render();
  };
});
$("make").onclick = drawCard;

Array.prototype.forEach.call(document.querySelectorAll(".langs button"), function(o){
  o.setAttribute("aria-pressed", String(o.dataset.lang === lang));
});

loadRate().then(render);
})();
