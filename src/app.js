// Baseline — Basketball Practice Planner
(function(){
var CATS={}; Object.keys(GB_CATS).forEach(function(k){ CATS[k]=[GB_CATS[k].name, GB_CATS[k].color]; });
var LV={1:"Beginner",2:"Intermediate",3:"Advanced"};
var SPACE={full:"Full court",half:"Half court",short:"Short court"};
var $=function(s,r){return (r||document).querySelector(s);}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function load(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}

// ---------- icons (one consistent 24px line set) ----------
var ICONS={
  court:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/><circle cx="12" cy="12" r="3"/>',
  clip:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3.5h6v3H9z"/><path d="M8.5 11h7M8.5 15h4.5"/>',
  bookmark:'<path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z"/>',
  hoop:'<rect x="4.5" y="3" width="15" height="9" rx="1.5"/><rect x="9.5" y="6.5" width="5" height="3" rx=".5"/><path d="M8.2 12l1.4 8.5M15.8 12l-1.4 8.5M8.8 15.5h6.4M9.3 18.5h5.4"/>',
  swatch:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
  whistle:'<path d="M14.5 9.5H21v3.2l-6 1.2"/><circle cx="9" cy="13.5" r="5.5"/><circle cx="9" cy="13.5" r="1.6"/><path d="M12 8.6V5.5"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  people:'<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.5-3.2 2.7-5 5.5-5s5 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.8 14.2c2.4.1 4.1 1.7 4.6 4.3"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  swap:'<path d="M4.5 10a7.5 7.5 0 0 1 13.2-3.6L19.5 8.5M19.5 14a7.5 7.5 0 0 1-13.2 3.6L4.5 15.5"/><path d="M19.5 4v4.5H15M4.5 20v-4.5H9"/>',
  x:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  grip:'<g fill="currentColor" stroke="none"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></g>',
  play:'<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
  pause:'<g fill="currentColor" stroke="none"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></g>',
  prev:'<path d="M15 5l-7 7 7 7"/>', next:'<path d="M9 5l7 7-7 7"/>',
  star:'<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" fill="currentColor" stroke="none"/>',
  drop:'<path d="M12 3.5c3.5 4.3 5.5 7.4 5.5 10a5.5 5.5 0 0 1-11 0c0-2.6 2-5.7 5.5-10z"/>',
  print:'<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v6H7z"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>'
};
function ic(n){ return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[n]||"")+'</svg>'; }

function inCat(d,k){ return d.cat===k || (d.also||[]).indexOf(k)>=0; }
var BY={}; DR.forEach(function(d){ BY[d.id]=d; d.P=GB.parse(d.d); if(d.hoop) d.P.needHoop=true; });
var G=load("gb_gym",{space:"full",hoops:2,players:10,level:2});
// ---------- look: team colors + diagram style ----------
var TEAMS={ gb:{name:"Baseline",c1:"#14213d",c2:"#f26b1d"}, stluke:{name:"St. Luke",c1:"#1d3fa6",c2:"#f5c400"} };
var DIAGRAMS=[["classic","Classic"],["whiteboard","Whiteboard"],["neon","Neon"]];
var LOOK=load("gb_look",{diagram:"classic",team:"gb",c1:"#14213d",c2:"#f26b1d",line:G.line||"hs"});
function inkOn(hex){ var c=hex.replace("#",""); if(c.length===3) c=c.replace(/./g,"$&$&"); var n=parseInt(c,16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  var L=function(v){ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); }; return (.2126*L(r)+.7152*L(g)+.0722*L(b))>.42 ? "#0f1730" : "#ffffff"; }
function teamColors(){ var t=TEAMS[LOOK.team]; return t?[t.c1,t.c2]:[LOOK.c1,LOOK.c2]; }
function applyLook(){
  var c=teamColors(), s=document.documentElement.style;
  s.setProperty("--team",c[0]); s.setProperty("--team-ink",inkOn(c[0])); s.setProperty("--accent",c[1]); s.setProperty("--accent-ink",inkOn(c[1]));
  var m=document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute("content",c[0]);
  DRAW.setTheme(LOOK.diagram); DRAW.setLine(LOOK.line);
}
applyLook();
var UI={tab:"drills",cat:"all",q:"",fit:true,minutes:60,focus:[]};
var PLAN=load("gb_cur",null);

// ---------- gym fit ----------
function fit(d,g){
  g=g||G; var P=d.P, r={ok:true,why:"",note:"",tags:[]};
  if(P.full){ r.tags.push("Full court"); if(g.space==="half"){ r.ok=false; r.why="Needs a full court"; } }
  if(!P.needHoop) r.tags.push("No hoop needed");
  if(g.players<d.p[0]){ r.ok=false; r.why=r.why||("Needs "+d.p[0]+"+ players"); }
  var stations = P.needHoop ? (P.full ? Math.max(1,Math.floor(g.hoops/2)) : g.hoops) : 99;
  var ideal = Math.min(d.p[1], Math.max(d.p[0], P.needHoop?4:d.p[1]));
  var groups = Math.max(1, Math.ceil(g.players/ideal)); groups=Math.min(groups,stations);
  if(d.one) groups=1;
  var per = Math.ceil(g.players/groups);
  r.groups=groups; r.per=per;
  if(groups>1) r.note = groups+" groups of ~"+per+(P.needHoop?" · one per hoop":"");
  else r.note = d.one ? (g.players>d.p[1] ? "Whole team — rotate subs in" : "Whole team") : (g.players<=d.p[1] ? "Whole group together" : "One group — run in waves");
  if(per>d.p[1]+2){ r.note += " · lines will be long"; r.long=true; }
  if(P.full && g.space==="short") r.note += " · short court: shrink distances";
  return r;
}
function levelOk(d){ return d.lv.indexOf(String(G.level))>=0; }
function usable(d){ return fit(d).ok && levelOk(d); }

// ---------- gym bar ----------
function gymSummary(){ return SPACE[G.space]+" · "+G.hoops+" hoop"+(G.hoops>1?"s":"")+" · "+G.players+" players · "+LV[G.level]; }
function renderGymBar(){ $("#gymSum").innerHTML='<b>'+G.hoops+'</b><span class="gs-l"> hoop'+(G.hoops>1?"s":"")+'</span>'+ic("people")+'<b>'+G.players+'</b><span class="gs-l"> players</span>'; $("#gymBtn").title=gymSummary(); }
function seg(name, opts, val){ return '<div class="seg" data-k="'+name+'">'+opts.map(function(o){return '<button class="'+(String(o[0])===String(val)?"on":"")+'" data-v="'+o[0]+'">'+o[1]+'</button>';}).join("")+'</div>'; }
function openGym(){
  sheet('<h2>My gym</h2>'+
    '<label class="lbl">Court space</label>'+seg("space",[["full","Full court"],["half","Half court"],["short","Short court"]],G.space)+
    '<label class="lbl">Hoops available</label>'+seg("hoops",[[1,"1"],[2,"2"],[3,"3"],[4,"4"],[5,"5"],[6,"6"]],G.hoops)+
    '<label class="lbl">Players at practice</label><div class="stepper"><button data-d="-1">−</button><input id="gpl" type="number" min="1" max="40" value="'+G.players+'"><button data-d="1">+</button></div>'+
    '<label class="lbl">Skill level</label>'+seg("level",[[1,"Beginner"],[2,"Intermediate"],[3,"Advanced"]],G.level)+
    '<p class="hint">Short court = smaller gym (elementary/middle school). Full-court drills stay in, with shorter distances.</p>'+
    '<button class="btn team wide" id="gdone">Done</button>', function(root){
      $$(".seg",root).forEach(function(sg){ sg.addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b) return; $$("button",sg).forEach(function(x){x.classList.remove("on");}); b.classList.add("on"); var k=sg.dataset.k; G[k]= k==="space"?b.dataset.v:+b.dataset.v; }); });
      $$(".stepper button",root).forEach(function(b){ b.onclick=function(){ var i=$("#gpl",root); i.value=Math.max(1,Math.min(40,(+i.value||1)+(+b.dataset.d))); }; });
      $("#gdone",root).onclick=function(){ G.players=Math.max(1,Math.min(40,+$("#gpl",root).value||10)); save("gb_gym",G); closeSheet(); renderGymBar(); render(); };
  });
}

function openLook(){
  var sample=BY.m4||DR[0], cur=LOOK.diagram;
  var tiles=DIAGRAMS.map(function(t){ DRAW.setTheme(t[0]); var svg=DRAW.staticSvg(sample.P,1,"court"); return '<button class="thm'+(LOOK.diagram===t[0]?" on":"")+'" data-th="'+t[0]+'">'+svg+t[1]+'</button>'; }).join("");
  DRAW.setTheme(cur);
  var sw=Object.keys(TEAMS).map(function(k){ var t=TEAMS[k]; return '<button class="sw'+(LOOK.team===k?" on":"")+'" data-team="'+k+'"><i style="background:'+t.c1+';--c2:'+t.c2+'"></i>'+esc(t.name)+'</button>'; }).join("")+
    '<button class="sw'+(LOOK.team==="custom"?" on":"")+'" data-team="custom"><i style="background:'+LOOK.c1+';--c2:'+LOOK.c2+'"></i>Custom</button>';
  sheet('<h2>Look</h2>'+
    '<label class="lbl">Diagram style</label><div class="themes">'+tiles+'</div>'+
    '<label class="lbl">Team colors</label><div class="swatches">'+sw+'</div>'+
    '<div class="customc"><label>Main <input type="color" id="lc1" value="'+LOOK.c1+'"></label><label>Accent <input type="color" id="lc2" value="'+LOOK.c2+'"></label></div>'+
    '<label class="lbl">3-point line on diagrams</label>'+seg("line",[["hs","High school"],["college","College"],["nba","NBA"]],LOOK.line)+
    '<button class="btn team wide" id="ldone">Done</button>', function(root){
      function live(){ applyLook(); save("gb_look",LOOK); }
      $$(".thm",root).forEach(function(b){ b.onclick=function(){ LOOK.diagram=b.dataset.th; $$(".thm",root).forEach(function(x){x.classList.toggle("on",x===b);}); live(); }; });
      $$(".sw",root).forEach(function(b){ b.onclick=function(){ LOOK.team=b.dataset.team; $$(".sw",root).forEach(function(x){x.classList.toggle("on",x===b);}); live(); }; });
      ["lc1","lc2"].forEach(function(idn,k){ $("#"+idn,root).oninput=function(e){ LOOK[k?"c2":"c1"]=e.target.value; LOOK.team="custom"; $$(".sw",root).forEach(function(x){x.classList.toggle("on",x.dataset.team==="custom");}); var i=$('.sw[data-team="custom"] i',root); i.style.background=LOOK.c1; i.style.setProperty("--c2",LOOK.c2); live(); }; });
      $('.seg[data-k="line"]',root).addEventListener("click",function(e){ var b=e.target.closest("button"); if(!b) return; $$('.seg[data-k="line"] button',root).forEach(function(x){x.classList.toggle("on",x===b);}); LOOK.line=b.dataset.v; live(); });
      $("#ldone",root).onclick=function(){ live(); closeSheet(); render(); };
  });
}

// ---------- drills tab ----------
function levelDots(d){ var names=d.lv.split("").map(function(n){return LV[n];}).join(", "); return '<span class="lv" title="'+names+'" aria-label="Levels: '+names+'">'+[1,2,3].map(function(n){return '<i class="'+(d.lv.indexOf(String(n))>=0?"on":"")+'"></i>';}).join("")+'</span>'; }
function players(d){ return d.p[0]+(d.p[1]>=30?"+":"–"+d.p[1]); }
function metaRow(d){ return '<span>'+ic("clock")+d.t+' min</span><span>'+ic("people")+players(d)+'</span>'+levelDots(d); }
function card(d, showCat){
  var f=fit(d), c=CATS[d.cat];
  return '<div class="card'+(usable(d)?"":" dim")+'" data-id="'+d.id+'">'+
    '<div class="thumb">'+DRAW.staticSvg(d.P,d.thumb==="all"?-1:0,"court thumbsvg")+'</div>'+
    '<div class="cbody">'+(showCat?'<div class="ccat"><i style="background:'+c[1]+'"></i>'+c[0]+'</div>':'')+'<div class="cname">'+esc(d.n)+'</div>'+
    '<div class="cwhy">'+esc(d.why)+'</div>'+
    '<div class="cmeta">'+metaRow(d)+'</div>'+
    '<div class="tags">'+(d.src?'<span class="tag pb">'+ic("star")+esc(d.src)+'</span>':'')+f.tags.map(function(t){return '<span class="tag">'+t+'</span>';}).join("")+(f.ok?"":'<span class="tag warn">'+f.why+'</span>')+(levelOk(d)?"":'<span class="tag warn">Not for '+LV[G.level]+'</span>')+'</div></div>'+
    '<button class="addbtn" data-add="'+d.id+'" aria-label="Add '+esc(d.n)+' to plan">'+ic("plus")+'</button></div>';
}
function renderDrills(){
  var q=UI.q.toLowerCase().trim();
  // A search always looks through every drill — the category chips only filter when the search box is empty.
  function matchQ(d){ return (d.n+" "+d.why+" "+d.say+" "+CATS[d.cat][0]+" "+(d.src||"")).toLowerCase().indexOf(q)>=0; }
  var list=DR.filter(function(d){
    if(q){ if(!matchQ(d)) return false; }
    else if(UI.cat==="pb"){ if(!d.src) return false; } else if(UI.cat!=="all" && !inCat(d,UI.cat)) return false;
    if(UI.fit && !usable(d)) return false;
    return true; });
  var hidden = (q && UI.fit) ? DR.filter(function(d){ return matchQ(d) && !usable(d); }).length : 0;
  var npb=DR.filter(function(d){return d.src&&(!UI.fit||usable(d));}).length;
  var chips='<button class="chip '+(UI.cat==="all"?"on":"")+'" data-cat="all">All</button><button class="chip '+(UI.cat==="pb"?"on":"")+'" data-cat="pb">'+ic("star")+'My playbook <b>'+npb+'</b></button>'+Object.keys(CATS).map(function(k){ var n=DR.filter(function(d){return inCat(d,k) && (!UI.fit||usable(d));}).length; return '<button class="chip '+(UI.cat===k?"on":"")+'" data-cat="'+k+'"><i style="background:'+CATS[k][1]+'"></i>'+CATS[k][0]+' <b>'+n+'</b></button>';}).join("");
  var body;
  var more = hidden ? '<p class="hint" style="margin:10px 2px 0">'+hidden+' more match'+(hidden>1?'':'es')+' but '+(hidden>1?"don't":"doesn't")+' fit your gym or level. <button class="link" id="showall">Show '+(hidden>1?'them':'it')+'</button></p>' : '';
  if(!list.length) body=(q?'<div class="empty">No drills match “'+esc(UI.q)+'”.'+(hidden?'':' Try a different word.')+'</div>':'<div class="empty">No drills here fit your gym. Turn off <b>Fits my gym</b> to see everything.</div>')+more;
  else if(UI.cat==="all" && !q) body=Object.keys(CATS).map(function(k){ var l=list.filter(function(d){return d.cat===k;}); if(!l.length) return ""; return '<section class="sect"><h3><i style="background:'+CATS[k][1]+'"></i>'+CATS[k][0]+'<small>'+l.length+'</small></h3><div class="rows">'+l.map(function(d){return card(d,false);}).join("")+'</div></section>'; }).join("");
  else { var title=q?'Results for “'+esc(UI.q)+'”':UI.cat==="pb"?"My playbook":CATS[UI.cat][0]; body=more+'<section class="sect"><h3>'+title+'<small>'+list.length+'</small></h3><div class="rows">'+list.map(function(d){return card(d,UI.cat==="pb"||!!q||UI.cat==="mot");}).join("")+'</div></section>'; }
  $("#main").innerHTML=
    '<h1 class="ptitle">Drills</h1><p class="psub">'+list.length+' of '+DR.length+(UI.fit?' fit your gym and level':' drills')+'</p>'+
    '<div class="tools"><div class="search">'+ic("search")+'<input id="q" type="search" placeholder="Search drills" aria-label="Search drills" value="'+esc(UI.q)+'"></div>'+
    '<label class="switch"><input type="checkbox" id="fit" '+(UI.fit?"checked":"")+'><span></span>Fits my gym</label></div>'+
    '<div class="chips'+(q?' searching':'')+'">'+chips+'</div>'+body;
  // keep the selected chip visible so a hidden filter never surprises anyone
  var on=$(".chips .chip.on"), row=$(".chips"); if(on && row) row.scrollLeft=Math.max(0,on.offsetLeft-row.clientWidth/2+on.offsetWidth/2);
  if($("#showall")) $("#showall").onclick=function(){ UI.fit=false; renderDrills(); };
  var qi=$("#q"); qi.oninput=function(){ UI.q=qi.value; var pos=qi.selectionStart; renderDrills(); var n=$("#q"); n.focus(); n.setSelectionRange(pos,pos); };
  $("#fit").onchange=function(e){ UI.fit=e.target.checked; renderDrills(); };
  $$(".chip[data-cat]").forEach(function(b){ b.onclick=function(){ UI.cat=b.dataset.cat; if(UI.q){ UI.q=""; } renderDrills(); }; });
  $$(".card").forEach(function(c){ c.onclick=function(e){ if(e.target.closest("[data-add]")) return; openDrill(c.dataset.id, false, $(".thumbsvg",c)); }; });
  $$("[data-add]").forEach(function(b){ b.onclick=function(){ addToPlan(b.dataset.add); }; });
}

// ---------- drill detail ----------
var player=null;
function openDrill(id, fromPlan, fromThumb){
  var d=BY[id], f=fit(d), c=CATS[d.cat];
  var html='<div class="dhead"><div class="ccat"><i style="background:'+c[1]+'"></i>'+c[0]+'</div><h2>'+esc(d.n)+'</h2>'+
    (d.src?'<div class="tags" style="margin:0 0 6px"><span class="tag pb">'+ic("star")+esc(d.src)+'</span></div>':'')+'<div class="dmeta">'+metaRow(d)+'<span>'+d.lv.split("").map(function(n){return LV[n];}).join(", ")+'</span></div></div>'+
    '<div class="stage th-'+DRAW.theme()+'" id="stage"></div>'+
    '<div class="pctl"><button id="pprev" aria-label="Previous step">'+ic("prev")+'</button><button id="pplay" class="play" aria-label="Play">'+ic("play")+'</button><button id="pnext" aria-label="Next step">'+ic("next")+'</button><button id="pspd" class="spd" aria-label="Speed">1×</button></div>'+
    '<div class="dots" id="pdots"></div><div class="cap" id="pcap"></div>'+
    '<div class="say"><b>Tell your players</b>'+esc(d.say)+'</div>'+
    '<div class="facts"><div><b>Equipment</b>'+esc(d.eq)+'</div><div><b>Your gym</b>'+(f.ok?esc(f.note):'<span class="warntxt">'+f.why+'</span>')+'</div></div>'+
    '<h3>How it works</h3><ol class="how">'+d.how.map(function(s){return '<li>'+esc(s)+'</li>';}).join("")+'</ol>'+
    '<h3>Coaching cues</h3><div class="cues">'+d.cue.map(function(s){return '<span>'+esc(s)+'</span>';}).join("")+'</div>'+
    '<div class="vary"><div><b>Make it easier</b>'+esc(d.e)+'</div><div><b>Make it harder</b>'+esc(d.h)+'</div></div>'+
    (d.ref&&/^https?:\/\//.test(d.ref)?'<p class="hint">Adapted from <a href="'+esc(d.ref)+'" target="_blank" rel="noopener">'+esc(d.ref.replace(/^https?:\/\/(www\.)?/,"").split("/")[0])+'</a></p>':'')+
    '<div class="legend">'+legend()+'</div>'+
    '<div class="row gap wrap"><button class="btn primary" id="dadd">'+(fromPlan?ic("check")+"In your plan":ic("plus")+"Add to plan")+'</button><button class="btn" id="dprint">'+ic("print")+'Print drill card</button></div>';
  function init(root){
    var dots=$("#pdots",root), cap=$("#pcap",root), n=d.P.steps.length;
    dots.innerHTML=d.P.steps.map(function(_,i){return '<button data-i="'+i+'">'+(i+1)+'</button>';}).join("");
    player=new DRAW.Player($("#stage",root), d.P, function(i){ $$("button",dots).forEach(function(b,k){b.classList.toggle("on",k===i);}); cap.innerHTML='<b>Step '+(i+1)+' of '+n+'</b> '+esc(d.P.steps[i]?d.P.steps[i].cap:""); }, {trail: d.P.full || !!d.trail});
    var pb=$("#pplay",root);
    function setPlay(on){ pb.innerHTML=ic(on?"pause":"play"); pb.setAttribute("aria-label",on?"Pause":"Play"); }
    pb.onclick=function(){ if(player.playing){player.pause();setPlay(false);} else {player.play();setPlay(true);} };
    $("#pprev",root).onclick=function(){ player.pause(); setPlay(false); player.go(player.i-1); };
    $("#pnext",root).onclick=function(){ player.pause(); setPlay(false); player.go(player.i+1); player.t=1; player.frame(1); };
    $("#pspd",root).onclick=function(e){ var s={1:2,2:0.5,0.5:1}[player.speed]; player.speed=s; e.target.textContent=(s===0.5?"½":s)+"×"; };
    $$("button",dots).forEach(function(b){ b.onclick=function(){ player.pause(); setPlay(false); player.go(+b.dataset.i); }; });
    $("#dadd",root).onclick=function(){ if(!fromPlan) addToPlan(id); };
    $("#dprint",root).onclick=function(){ printDrills([id], d.n); };
    var mine=player; setTimeout(function(){ if(player===mine && !player.playing){ player.play(); setPlay(true); } }, 380);
  }
  // Thumbnail grows into the full diagram where the browser supports view transitions.
  if(fromThumb && document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches){
    fromThumb.style.viewTransitionName="court-hero";
    var vt=document.startViewTransition(function(){ fromThumb.style.viewTransitionName=""; sheet(html, function(root){ init(root); var s=$("#stage svg",root); if(s) s.style.viewTransitionName="court-hero"; }, true); });
    vt.finished.then(function(){ var s=$("#stage svg"); if(s) s.style.viewTransitionName=""; }).catch(function(){});
  } else sheet(html, init);
}
function legend(){
  return '<span><svg viewBox="0 0 24 8"><line x1="1" y1="4" x2="21" y2="4" stroke="#1f2937" stroke-width="1.4"/><path d="M19,1 L23,4 L19,7z" fill="#1f2937"/></svg>Cut</span>'+
  '<span><svg viewBox="0 0 24 8"><polyline points="1,4 4,1.5 7,6.5 10,1.5 13,6.5 16,1.5 19,4 21,4" fill="none" stroke="#1f2937" stroke-width="1.2"/><path d="M19,1 L23,4 L19,7z" fill="#1f2937"/></svg>Dribble</span>'+
  '<span><svg viewBox="0 0 24 8"><line x1="1" y1="4" x2="21" y2="4" stroke="#1f2937" stroke-width="1.2" stroke-dasharray="3 2"/><path d="M19,1 L23,4 L19,7z" fill="#1f2937"/></svg>Pass</span>'+
  '<span><svg viewBox="0 0 24 8"><line x1="1" y1="4" x2="20" y2="4" stroke="#1f2937" stroke-width="1.4"/><line x1="20" y1="0" x2="20" y2="8" stroke="#1f2937" stroke-width="2.2"/></svg>Screen</span>'+
  '<span><svg viewBox="0 0 24 8"><line x1="1" y1="4" x2="21" y2="4" stroke="#c62828" stroke-width="1.3" stroke-dasharray="5 2"/><path d="M19,1 L23,4 L19,7z" fill="#c62828"/></svg>Slide</span>'+
  '<span><svg viewBox="0 0 24 8"><path d="M1,7 Q12,-2 22,4" fill="none" stroke="#ea580c" stroke-width="1.2" stroke-dasharray="1 2"/></svg>Shot</span>';
}

// ---------- sheet ----------
function sheet(html, init, instant){
  closeSheet(true);
  var w=document.createElement("div"); w.className="overlay"; w.innerHTML='<div class="sheet" role="dialog" aria-modal="true"><div class="handle" aria-hidden="true"><span></span></div><button class="close" aria-label="Close">'+ic("x")+'</button>'+html+'</div>';
  document.body.appendChild(w); document.body.classList.add("noscroll");
  w.onclick=function(e){ if(e.target===w) closeSheet(); }; $(".close",w).onclick=function(){closeSheet();};
  if(instant) w.classList.add("in"); else requestAnimationFrame(function(){ w.classList.add("in"); });
  // drag the handle down to dismiss
  var sh=$(".sheet",w), hd=$(".handle",w);
  hd.onpointerdown=function(e){ var y0=e.clientY, dy=0; sh.classList.add("dragging"); try{hd.setPointerCapture(e.pointerId);}catch(_){}
    hd.onpointermove=function(ev){ dy=Math.max(0,ev.clientY-y0); sh.style.transform="translateY("+dy+"px)"; w.style.opacity=String(Math.max(.35,1-dy/500)); };
    hd.onpointerup=hd.onpointercancel=function(){ hd.onpointermove=hd.onpointerup=hd.onpointercancel=null; sh.classList.remove("dragging"); if(dy>110) closeSheet(); else { sh.style.transform=""; w.style.opacity=""; } };
  };
  if(init) init(w);
}
function closeSheet(instant){ if(player){player.destroy();player=null;} var w=$(".overlay"); if(!w) return; document.body.classList.remove("noscroll"); w.remove(); }
function toast(msg){ if(navigator.vibrate) try{ navigator.vibrate(8); }catch(e){} var t=$("#toast"); t.textContent=msg; t.classList.add("in"); clearTimeout(toast.h); toast.h=setTimeout(function(){t.classList.remove("in");},1800); }

// ---------- plan generator ----------
var SEGS=[
  {k:"Warm-up",pool:["warm"],f:.10},
  {k:"Ball handling & footwork",pool:["bh","foot"],f:.13},
  {k:"Skill focus",pool:["sh","fin","pass"],f:.17,focus:true},
  {k:"Shooting & finishing",pool:["sh","fin"],f:.15},
  {k:"Defense & rebounding",pool:["def","reb"],f:.15},
  {k:"Team play",pool:["off","mot","tr","pass"],f:.15},
  {k:"Compete",pool:["game"],f:.15}
];
function candidates(pool, used, relax){
  return DR.filter(function(d){ return pool.some(function(k){return inCat(d,k);}) && used.indexOf(d.id)<0 && fit(d).ok && (relax||levelOk(d)); });
}
function pick(pool, minutes, used, focus){
  var c=candidates(pool,used,false); if(!c.length) c=candidates(pool,used,true); if(!c.length) return null;
  c=c.map(function(d){ var s=Math.random()*2 - Math.abs(d.t-minutes)*0.12 + (focus.some(function(k){return inCat(d,k);})?2.5:0) - (fit(d).long?1:0); return {d:d,s:s}; }).sort(function(a,b){return b.s-a.s;});
  return c[0].d;
}
function buildPlan(total, focus){
  var waters = total>=75?2:(total>=45?1:0), eff=total-2*waters, used=[], blocks=[];
  var sum=SEGS.reduce(function(a,s){return a+s.f;},0);
  var mins=SEGS.map(function(s){ return Math.max(3, Math.round(s.f/sum*eff)); });
  var diff=eff-mins.reduce(function(a,b){return a+b;},0); mins[mins.length-1]=Math.max(3,mins[mins.length-1]+diff);
  SEGS.forEach(function(s,i){
    var pool = s.focus && focus.length ? focus : s.pool, m=mins[i];
    var first=pick(pool,m,used,focus); if(!first) return; used.push(first.id);
    if(m>=10 && m>=first.t*1.6){ var second=pick(pool,m-first.t,used,focus); if(second){ used.push(second.id); var m1=Math.round(m*first.t/(first.t+second.t)); blocks.push({did:first.id,min:m1,seg:s.k,pool:pool}); blocks.push({did:second.id,min:m-m1,seg:s.k,pool:pool}); } else blocks.push({did:first.id,min:m,seg:s.k,pool:pool}); }
    else blocks.push({did:first.id,min:m,seg:s.k,pool:pool});
    if((waters>=1 && i===2) || (waters>=2 && i===4)) blocks.push({water:true,min:2,seg:"Water"});
  });
  return {name:"Practice — "+new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}), total:total, focus:focus, gym:JSON.parse(JSON.stringify(G)), blocks:blocks};
}
function addToPlan(id){
  if(!PLAN) PLAN={name:"Practice — "+new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}),total:60,focus:[],gym:JSON.parse(JSON.stringify(G)),blocks:[]};
  var d=BY[id]; PLAN.blocks.push({did:id,min:d.t,seg:CATS[d.cat][0],pool:[d.cat]}); save("gb_cur",PLAN); toast("Added “"+d.n+"” to your plan");
}
function fmt(m){ var h=Math.floor(m/60), mm=m%60; return h+":"+(mm<10?"0":"")+mm; }
// Block times: real clock times when the plan has a start time ("15:30"), otherwise elapsed time (0:00, 0:10…).
function startMin(){ var s=PLAN&&PLAN.start; if(!s||!/^\d{1,2}:\d{2}$/.test(s)) return null; var p=s.split(":"); return (+p[0])*60+(+p[1]); }
function clock(m, ampm){ var s=startMin(); if(s==null) return fmt(m); var t=(s+m)%1440, h=Math.floor(t/60), mm=t%60, h12=h%12||12; return h12+":"+(mm<10?"0":"")+mm+(ampm?(h<12?" AM":" PM"):""); }
function rangeTxt(a,b){ return clock(a)+"–"+clock(b); }
function spanTxt(){ var tot=planTotal(); return startMin()==null ? "ends at "+fmt(tot) : clock(0,true)+" – "+clock(tot,true); }
function planTotal(){ return PLAN?PLAN.blocks.reduce(function(a,b){return a+b.min;},0):0; }

function renderPlan(){
  var lens=[30,45,60,75,90,120];
  var focusChips=Object.keys(CATS).filter(function(k){return k!=="warm"&&k!=="cond";}).map(function(k){ return '<button class="chip '+(UI.focus.indexOf(k)>=0?"on":"")+'" data-focus="'+k+'"><i style="background:'+CATS[k][1]+'"></i>'+CATS[k][0]+'</button>'; }).join("");
  var h='<h1 class="ptitle">Practice</h1><p class="psub">Build a plan for your gym, or start from a template.</p><div class="panel"><h2>Build a practice</h2>'+
    '<label class="lbl">Length</label><div class="seg" id="len">'+lens.map(function(l){return '<button class="'+(UI.minutes===l?"on":"")+'" data-v="'+l+'">'+l+'</button>';}).join("")+'</div>'+
    '<label class="lbl">Focus <span class="muted">(optional, up to 3)</span></label><div class="chips wrap">'+focusChips+'</div>'+
    '<div class="gymline">For: <b>'+gymSummary()+'</b> <button class="link" id="editgym">Change</button></div>'+
    '<button class="btn primary wide" id="gen">'+(PLAN&&PLAN.blocks.length?"Build a new plan":"Build my practice")+'</button>'+
    '<label class="lbl">Or start from a template</label><div class="tpls">'+TEMPLATES.map(function(t,i){return '<button class="tpl" data-tpl="'+i+'">'+ic("star")+esc(t.name)+'<span>'+t.total+' min</span></button>';}).join("")+'</div></div>';
  if(PLAN && PLAN.blocks.length){
    var t=0, tot=planTotal();
    h+='<div class="panel plan"><textarea class="pname" id="pname" rows="1" aria-label="Plan name">'+esc(PLAN.name)+'</textarea>'+
      '<div class="psum"><b>'+tot+' min</b> · '+spanTxt()+(PLAN.total&&tot!==PLAN.total?' <span class="'+(tot>PLAN.total?"over":"under")+'">('+(tot>PLAN.total?"+":"")+(tot-PLAN.total)+' min vs '+PLAN.total+' planned)</span>':"")+'<br>'+gymSummary()+'</div>'+
      '<label class="pstartl">Practice starts at <input type="time" id="pstart" value="'+esc(PLAN.start||"")+'"> <span class="muted">'+(startMin()==null?"(optional — shows real clock times)":'<button class="link" id="pclear">clear</button>')+'</span></label>'+
      '<div class="dhint">Drag the handle on the left to reorder blocks.</div>';
    h+='<div class="blocks">'+PLAN.blocks.map(function(b,i){
      var a0=t; t+=b.min;
      var grip='<div class="grip" data-drag="'+i+'" tabindex="0" role="button" aria-label="Drag to reorder (or use arrow keys)">'+ic("grip")+'</div>';
      var tm='<div class="bt">'+clock(a0)+'<small>–'+clock(t)+'</small></div>';
      if(b.water) return '<div class="block water" data-i="'+i+'">'+grip+tm+'<div class="bb"><div class="bname">'+ic("drop")+'Water break</div></div><div class="bm">'+mins(i,b)+'</div><div class="bact"><button data-rm="'+i+'" aria-label="Remove">'+ic("x")+'</button></div></div>';
      var d=BY[b.did], f=fit(d), c=CATS[d.cat];
      return '<div class="block" data-i="'+i+'" style="--c:'+c[1]+'">'+grip+tm+'<div class="bb" data-open="'+d.id+'"><div class="bseg">'+esc(b.seg)+'</div><div class="bname">'+esc(d.n)+'</div><div class="bnote">'+esc(f.ok?f.note:f.why)+'</div></div>'+
        '<div class="bm">'+mins(i,b)+'</div><div class="bact"><button data-sw="'+i+'" title="Swap for another drill" aria-label="Swap drill">'+ic("swap")+'</button><button data-rm="'+i+'" aria-label="Remove">'+ic("x")+'</button></div></div>';
    }).join("")+'<div class="bend">'+ic("whistle")+'Done <b>'+clock(t,true)+'</b><span>'+t+' min total</span></div></div>'+
    '<div class="row gap wrap"><button class="btn" id="addd">'+ic("plus")+'Add drill</button><button class="btn" id="addw">'+ic("drop")+'Add water</button><button class="btn" id="psave">'+ic("bookmark")+'Save</button><button class="btn" id="pcopy">'+ic("copy")+'Copy as text</button><button class="btn primary" id="pprint">'+ic("print")+'Print view</button></div></div>';
  } else h+='<div class="empty">Pick a length and tap <b>Build my practice</b>, or add drills from the catalog with their <b>+</b> button.</div>';
  $("#main").innerHTML=h;
  $$("#len button").forEach(function(b){ b.onclick=function(){ UI.minutes=+b.dataset.v; renderPlan(); }; });
  $$("[data-focus]").forEach(function(b){ b.onclick=function(){ var k=b.dataset.focus, i=UI.focus.indexOf(k); if(i>=0) UI.focus.splice(i,1); else { if(UI.focus.length>=3) UI.focus.shift(); UI.focus.push(k);} renderPlan(); }; });
  $("#editgym").onclick=openGym;
  $("#gen").onclick=function(){ PLAN=buildPlan(UI.minutes, UI.focus.slice()); save("gb_cur",PLAN); renderPlan(); toast("Practice built — tap any drill to see it move"); };
  $$("[data-tpl]").forEach(function(b){ b.onclick=function(){ var t=TEMPLATES[+b.dataset.tpl]; PLAN={name:t.name,total:t.total,start:t.start||"",focus:[],gym:JSON.parse(JSON.stringify(G)),blocks:t.blocks.map(function(x){return {did:x.did,min:x.min,seg:x.seg,pool:[BY[x.did].cat]};})}; save("gb_cur",PLAN); renderPlan(); toast("Loaded template — edit anything"); }; });
  if(!PLAN||!PLAN.blocks.length) return;
  var pn=$("#pname"), fitName=function(){ pn.style.height="auto"; pn.style.height=pn.scrollHeight+"px"; }; fitName();
  pn.oninput=fitName; pn.onkeydown=function(e){ if(e.key==="Enter"){ e.preventDefault(); pn.blur(); } };
  pn.onchange=function(e){ PLAN.name=e.target.value.replace(/\s+/g," ").trim()||"Practice"; save("gb_cur",PLAN); };
  $$("[data-open]").forEach(function(el){ el.onclick=function(){ openDrill(el.dataset.open,true); }; });
  $$("[data-rm]").forEach(function(b){ b.onclick=function(){ PLAN.blocks.splice(+b.dataset.rm,1); save("gb_cur",PLAN); renderPlan(); }; });
  $("#pstart").onchange=function(e){ PLAN.start=e.target.value||""; save("gb_cur",PLAN); renderPlan(); };
  if($("#pclear")) $("#pclear").onclick=function(e){ e.preventDefault(); PLAN.start=""; save("gb_cur",PLAN); renderPlan(); };
  initDrag();
  $$("[data-sw]").forEach(function(b){ b.onclick=function(){ var i=+b.dataset.sw, bl=PLAN.blocks[i], used=PLAN.blocks.map(function(x){return x.did;}).filter(Boolean); var c=candidates(bl.pool||[BY[bl.did].cat],used,false); if(!c.length) c=candidates(bl.pool||[BY[bl.did].cat],used,true); if(!c.length){toast("No other drills fit this slot");return;} var n=c[Math.floor(Math.random()*c.length)]; bl.did=n.id; save("gb_cur",PLAN); renderPlan(); toast("Swapped in “"+n.n+"”"); }; });
  $$("[data-mm]").forEach(function(b){ b.onclick=function(){ var i=+b.dataset.mm, bl=PLAN.blocks[i]; bl.min=Math.max(1,bl.min+(+b.dataset.d)); save("gb_cur",PLAN); renderPlan(); }; });
  $("#addd").onclick=function(){ setTab("drills"); toast("Tap + on any drill to add it"); };
  $("#addw").onclick=function(){ PLAN.blocks.push({water:true,min:2,seg:"Water"}); save("gb_cur",PLAN); renderPlan(); };
  $("#psave").onclick=function(){ var all=load("gb_plans",[]); PLAN.saved=Date.now(); all=all.filter(function(p){return p.name!==PLAN.name;}); all.unshift(JSON.parse(JSON.stringify(PLAN))); save("gb_plans",all); toast("Saved “"+PLAN.name+"”"); };
  $("#pcopy").onclick=function(){ copyText(planText()); };
  $("#pprint").onclick=printPlan;
}
function mins(i,b){ return '<button data-mm="'+i+'" data-d="-1" aria-label="Less time">−</button><span>'+b.min+'<small>min</small></span><button data-mm="'+i+'" data-d="1" aria-label="More time">+</button>'; }
// ---------- drag to reorder (pointer events: works with mouse and touch) ----------
function moveBlock(from,to){ if(from===to) return; var x=PLAN.blocks.splice(from,1)[0]; PLAN.blocks.splice(to,0,x); save("gb_cur",PLAN); renderPlan(); }
function initDrag(){
  $$(".grip").forEach(function(g){
    g.onkeydown=function(e){ var i=+g.dataset.drag, to=e.key==="ArrowUp"?i-1:e.key==="ArrowDown"?i+1:-1; if(to<0||to>=PLAN.blocks.length) return; e.preventDefault(); moveBlock(i,to); var n=$('.grip[data-drag="'+to+'"]'); if(n) n.focus(); };
    g.onpointerdown=function(e){
      if(e.button>0) return; e.preventDefault();
      var from=+g.dataset.drag, els=$$(".blocks .block"), el=els[from], startY=e.pageY, to=from;
      var mids=els.map(function(b){ var r=b.getBoundingClientRect(); return r.top+window.scrollY+r.height/2; });
      var h=el.getBoundingClientRect().height+8, lastY=e.clientY, timer=null;
      el.classList.add("dragging"); document.body.classList.add("dragmode");
      try{ g.setPointerCapture(e.pointerId); }catch(_){}
      function update(pageY){
        var dy=pageY-startY; el.style.transform="translateY("+dy+"px)";
        var center=mids[from]+dy; to=from;
        mids.forEach(function(m,k){ if(k<from && center<m) to=Math.min(to,k); if(k>from && center>m) to=Math.max(to,k); });
        els.forEach(function(b,k){ if(k===from) return; var s=0; if(from<to && k>from && k<=to) s=-h; if(from>to && k<from && k>=to) s=h; b.style.transform=s?"translateY("+s+"px)":""; });
      }
      function edge(){ var v=lastY<70?-12:lastY>window.innerHeight-90?12:0; if(v){ window.scrollBy(0,v); update(lastY+window.scrollY); } timer=requestAnimationFrame(edge); }
      timer=requestAnimationFrame(edge);
      g.onpointermove=function(ev){ lastY=ev.clientY; update(ev.pageY); };
      g.onpointerup=g.onpointercancel=function(){ cancelAnimationFrame(timer); g.onpointermove=g.onpointerup=g.onpointercancel=null; document.body.classList.remove("dragmode"); els.forEach(function(b){b.style.transform="";}); el.classList.remove("dragging"); if(to!==from){ moveBlock(from,to); toast("Moved “"+(PLAN.blocks[to].water?"Water break":BY[PLAN.blocks[to].did].n)+"”"); } };
    };
  });
}
function planText(){
  var t=0, s=PLAN.name+"\n"+planTotal()+" min · "+spanTxt()+" · "+gymSummary()+"\n\n";
  PLAN.blocks.forEach(function(b){ var st=rangeTxt(t,t+b.min); t+=b.min; if(b.water){ s+=st+"  Water ("+b.min+" min)\n"; return; } var d=BY[b.did]; s+=st+"  "+d.n+" ("+b.min+" min) — "+d.say+"\n"; });
  return s;
}
function copyText(s){
  function fb(){ var ta=document.createElement("textarea"); ta.value=s; document.body.appendChild(ta); ta.select(); try{document.execCommand("copy"); toast("Copied — paste it in a text or email");}catch(e){toast("Couldn't copy");} ta.remove(); }
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(function(){toast("Copied — paste it in a text or email");},fb); else fb();
}

// ---------- saved ----------
function renderSaved(){
  var all=load("gb_plans",[]);
  $("#main").innerHTML='<h1 class="ptitle">Saved</h1><p class="psub">Practices you saved on this device.</p><div class="panel">'+(all.length?all.map(function(p,i){ var tot=p.blocks.reduce(function(a,b){return a+b.min;},0); return '<div class="saved"><div><b>'+esc(p.name)+'</b><div class="muted">'+tot+' min · '+p.blocks.filter(function(b){return !b.water;}).length+' drills</div></div><div class="row gap"><button class="btn" data-load="'+i+'">Open</button><button class="btn ghost" data-del="'+i+'" aria-label="Delete">'+ic("x")+'</button></div></div>';}).join(""):'<p class="muted">Nothing saved yet. Build a plan and tap Save.</p>')+'</div>';
  $$("[data-load]").forEach(function(b){ b.onclick=function(){ PLAN=JSON.parse(JSON.stringify(all[+b.dataset.load])); save("gb_cur",PLAN); setTab("plan"); }; });
  $$("[data-del]").forEach(function(b){ b.onclick=function(){ all.splice(+b.dataset.del,1); save("gb_plans",all); renderSaved(); }; });
}

// ---------- print ----------
function drillPrint(d, minutes, start){
  var P=d.P, panels=P.steps.slice(0,4).map(function(st,i){ return '<figure>'+DRAW.staticSvg(P,i,"court pcourt")+'<figcaption><b>'+(i+1)+'.</b> '+esc(st.cap)+'</figcaption></figure>'; }).join("");
  return '<section class="pdrill"><div class="phead">'+(start!=null?'<span class="ptime">'+start+'</span>':"")+'<span class="pname">'+esc(d.n)+'</span><span class="pmeta">'+CATS[d.cat][0]+' · '+(minutes||d.t)+' min · '+esc(d.eq)+'</span></div>'+
    '<div class="pgrid"><div class="ptext"><p class="psay">“'+esc(d.say)+'”</p><ol>'+d.how.map(function(s){return '<li>'+esc(s)+'</li>';}).join("")+'</ol><p><b>Cues:</b> '+d.cue.map(esc).join(" · ")+'</p><p class="pvary"><b>Easier:</b> '+esc(d.e)+'<br><b>Harder:</b> '+esc(d.h)+'</p><p class="pfit">'+esc(fit(d).note)+'</p></div><div class="ppanels n'+Math.min(4,P.steps.length)+'">'+panels+'</div></div></section>';
}
function showPrint(html){
  closeSheet(); window.scrollTo(0,0);
  $("#print").innerHTML='<div class="pbar"><button class="btn primary" id="pgo">Print</button><button class="btn" id="pclose">← Back to app</button><p class="hint">If the Print button does nothing, printing is blocked in this viewer — open the app in its own browser tab and print from there (or use your browser’s Share → Print).</p></div>'+html;
  document.body.classList.add("printing");
  $("#pgo").onclick=function(){ try{ window.print(); }catch(e){ toast("Printing is blocked here — open in a browser tab"); } };
  $("#pclose").onclick=function(){ document.body.classList.remove("printing"); $("#print").innerHTML=""; };
}
function inkFriendly(fn){ var prev=DRAW.theme(); DRAW.setTheme("whiteboard"); try{ return fn(); } finally { DRAW.setTheme(prev); } }
function printDrills(ids, title){
  showPrint('<h1>'+esc(title)+'</h1><div class="plegend">'+legend()+'</div>'+inkFriendly(function(){ return ids.map(function(id){return drillPrint(BY[id]);}).join(""); }));
}
function printPlan(){
  var t=0, rows=inkFriendly(function(){ return PLAN.blocks.map(function(b){ var st=rangeTxt(t,t+b.min); t+=b.min; if(b.water) return '<div class="pwater">'+st+' · Water break ('+b.min+' min)</div>'; return drillPrint(BY[b.did],b.min,st); }).join(""); });
  showPrint('<h1>'+esc(PLAN.name)+'</h1><div class="psub">'+planTotal()+' min · '+spanTxt()+' · '+gymSummary()+'</div><div class="plegend">'+legend()+'</div>'+rows);
}

// ---------- tabs ----------
function setTab(t){ UI.tab=t; $$("nav button").forEach(function(b){b.classList.toggle("on",b.dataset.tab===t);}); window.scrollTo(0,0); render(); }
function render(){ renderGymBar(); if(UI.tab==="drills") renderDrills(); else if(UI.tab==="plan") renderPlan(); else renderSaved(); }
$$("nav button").forEach(function(b){ b.onclick=function(){ setTab(b.dataset.tab); }; });
$("#gymBtn").onclick=openGym; $("#lookBtn").onclick=openLook;
document.addEventListener("keydown",function(e){ if(e.key==="Escape") closeSheet(); });
render();
// Offline support when hosted (GitHub Pages etc.)
try{ if("serviceWorker" in navigator && /^https?:/.test(location.protocol) && window.top===window.self) navigator.serviceWorker.register("sw.js").catch(function(){}); }catch(e){}
})();
