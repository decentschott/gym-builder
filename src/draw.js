// SVG court + diagram rendering, static and animated, in three looks: classic, whiteboard, neon.
var DRAW = (function(){
  var THEMES = {
    classic: { bg:"#f3e7d3", paint:"#ead7b8", line:"#9a7b55", lw:.25, rim:"#ea580c", board:"#1f2937",
      off:"#0f2a4a", offTxt:"#fff", offRing:"#fff", def:"#c62828", defFill:"#fff",
      moveOff:"#1f2937", moveDef:"#c62828", pass:"#1f2937", shot:"#ea580c", ball:"#f97316", ballLine:"#7c2d12",
      coach:"#fbbf24", coachTxt:"#1f2937", cone:"#f97316", qOff:"#b9c6d6", qDef:"#f1c4c4", stroke:.32, wobble:0, glow:false },
    whiteboard: { bg:"#fbfcfd", paint:"#eef2f8", line:"#9aa6b8", lw:.2, rim:"#5b6676", board:"#5b6676", frame:"#c9cfd8",
      off:"#1f4fd1", offTxt:"#fff", offRing:"#163a9c", def:"#d4252a", defFill:"#fff",
      moveOff:"#1d2633", moveDef:"#d4252a", pass:"#1d2633", shot:"#e07a1f", ball:"#f28c28", ballLine:"#9a4a0c",
      coach:"#1d2633", coachTxt:"#fff", cone:"#f28c28", qOff:"#b8c7ef", qDef:"#f3c1c2", stroke:.46, wobble:.22, glow:false, magnet:true },
    neon: { bg:"#05060f", paint:"rgba(255,61,240,.07)", line:"#37e6ff", lw:.2, rim:"#ff8a1f", board:"#37e6ff",
      off:"url(#holo)", offTxt:"#fff", offRing:"#e9fbff", def:"#ff3df0", defFill:"#12051a",
      moveOff:"#45f0ff", moveDef:"#ff3df0", pass:"#c8b6ff", shot:"#ffd23f", ball:"#ff8a1f", ballLine:"#ffd9b0",
      coach:"#ffd23f", coachTxt:"#05060f", cone:"#ff8a1f", qOff:"rgba(69,240,255,.35)", qDef:"rgba(255,61,240,.35)", stroke:.3, wobble:0, glow:true }
  };
  var T = THEMES.classic, THEME = "classic";
  // 3-point line styles (feet). r = arc radius from rim center; x = corner straight line distance from sideline.
  var LINES={ hs:{r:19.75,x:5.25}, college:{r:22.146,x:3.35}, nba:{r:23.75,x:3} }, LINE="hs";

  function f(n){ return Math.round(n*100)/100; }
  function threePt(){
    var L=LINES[LINE]||LINES.hs, cx=25, cy=5.25, x1=L.x, x2=50-L.x, dy=Math.sqrt(Math.max(0,L.r*L.r-(cx-x1)*(cx-x1))), yj=cy+dy;
    return 'M'+f(x1)+',0 L'+f(x1)+','+f(yj)+' A'+L.r+','+L.r+' 0 '+(yj<cy?1:0)+' 0 '+f(x2)+','+f(yj)+' L'+f(x2)+',0';
  }
  function ln(extra){ return ' fill="none" stroke="'+T.line+'" stroke-width="'+T.lw+'"'+(extra||'')+' stroke-linecap="round"'; }
  function half(){
    return '<rect x="19" y="0" width="12" height="19" fill="'+T.paint+'"'+ln().replace('fill="none" ','')+'/>'+
      '<path d="M19,19 A6,6 0 0 0 31,19"'+ln()+'/>'+
      '<path d="M19,19 A6,6 0 0 1 31,19"'+ln(' stroke-dasharray=".8 .8"')+'/>'+
      '<path d="'+threePt()+'"'+ln()+'/>'+
      '<path d="M21,5.25 A4,4 0 0 0 29,5.25"'+ln()+'/>'+
      '<line x1="22" y1="4" x2="28" y2="4" stroke="'+T.board+'" stroke-width=".4" stroke-linecap="round"/>'+
      '<circle cx="25" cy="5.25" r=".85" fill="none" stroke="'+T.rim+'" stroke-width=".3"/>';
  }
  function court(full, uid){
    var h = full ? 94 : 47, s = '';
    if(THEME==="neon"){
      s += '<rect x="-1.5" y="-1.5" width="53" height="'+(h+3)+'" fill="url(#nbg'+uid+')"/>';
      for(var gx=5; gx<50; gx+=5) s+='<line x1="'+gx+'" y1="0" x2="'+gx+'" y2="'+h+'" stroke="#37e6ff" stroke-opacity=".05" stroke-width=".08"/>';
      for(var gy=5; gy<h; gy+=5) s+='<line x1="0" y1="'+gy+'" x2="50" y2="'+gy+'" stroke="#37e6ff" stroke-opacity=".05" stroke-width=".08"/>';
    } else if(THEME==="whiteboard"){
      s += '<rect x="-1.5" y="-1.5" width="53" height="'+(h+3)+'" fill="'+T.frame+'"/><rect x="-1" y="-1" width="52" height="'+(h+2)+'" rx=".6" fill="'+T.bg+'"/>';
    } else s += '<rect x="-1.5" y="-1.5" width="53" height="'+(h+3)+'" fill="'+T.bg+'"/>';
    var lines = '<rect x="0" y="0" width="50" height="'+h+'"'+ln(' stroke-width="'+(T.lw*1.4)+'"')+'/>' + half();
    if(full) lines += '<g transform="translate(0,94) scale(1,-1)">'+half()+'</g><line x1="0" y1="47" x2="50" y2="47"'+ln()+'/><circle cx="25" cy="47" r="6"'+ln()+'/>';
    else lines += '<path d="M19,47 A6,6 0 0 1 31,47"'+ln()+'/>';
    return s + (T.glow ? '<g filter="url(#glow'+uid+')" opacity=".9">'+lines+'</g>' : lines);
  }
  function defs(uid){
    var d='<defs>';
    [["mo",T.moveOff],["md",T.moveDef],["mp",T.pass]].forEach(function(m){
      d+='<marker id="'+m[0]+uid+'" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="'+(T.magnet?4.2:5)+'" markerHeight="'+(T.magnet?4.2:5)+'" orient="auto-start-reverse">'+
        (T.magnet ? '<path d="M1,1.2 L8.6,5 L1,8.8" fill="none" stroke="'+m[1]+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="M0,0 L10,5 L0,10 z" fill="'+m[1]+'"/>')+'</marker>';
    });
    if(THEME==="neon"){
      d+='<filter id="glow'+uid+'" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".45" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
        '<radialGradient id="nbg'+uid+'" cx="50%" cy="15%" r="90%"><stop offset="0" stop-color="#151a4a"/><stop offset=".55" stop-color="#080a22"/><stop offset="1" stop-color="#03040b"/></radialGradient>';
    }
    if(T.magnet) d+='<radialGradient id="mag'+uid+'" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient>';
    return d+'</defs>';
  }
  // the holographic fill is shared (referenced by url(#holo)) — defined once per document
  function ensureHolo(){
    if(typeof document==="undefined" || document.getElementById("holo")) return;
    var s=document.createElementNS("http://www.w3.org/2000/svg","svg"); s.setAttribute("width","0"); s.setAttribute("height","0"); s.setAttribute("aria-hidden","true"); s.style.position="absolute";
    s.innerHTML='<defs><linearGradient id="holo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#45f0ff"/><stop offset=".5" stop-color="#8b5cff"/><stop offset="1" stop-color="#ff3df0"/></linearGradient></defs>';
    document.body.appendChild(s);
  }
  function plen(pts){ var L=0; for(var i=1;i<pts.length;i++) L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]); return L; }
  function along(pts,t){
    if(pts.length===1) return pts[0].slice();
    var L=plen(pts)*Math.max(0,Math.min(1,t));
    for(var i=1;i<pts.length;i++){ var a=pts[i-1],b=pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<=l||i===pts.length-1){ var r=l?Math.min(1,L/l):1; return [a[0]+(b[0]-a[0])*r, a[1]+(b[1]-a[1])*r]; } L-=l; }
    return pts[pts.length-1].slice();
  }
  function trim(pts,s,e){ pts=pts.map(function(p){return p.slice();}); var L=plen(pts); if(L<s+e+0.5) return pts;
    if(s){ pts[0]=along(pts, s/L); } if(e){ var q=along(pts,1-e/plen(pts)); pts[pts.length-1]=q; } return pts; }
  function poly(pts){ return pts.map(function(p){return f(p[0])+","+f(p[1]);}).join(" "); }
  // hand-drawn marker wobble (deterministic, so a drill always looks the same)
  function wobble(pts){
    if(!T.wobble) return pts; var L=plen(pts); if(L<2) return pts; var n=Math.max(2,Math.round(L/1.6)), out=[], seed=pts[0][0]*7.13+pts[0][1]*3.71;
    for(var i=0;i<=n;i++){ var t=i/n, p=along(pts,t), q=along(pts,Math.min(1,t+.01)), dx=q[0]-p[0], dy=q[1]-p[1], m=Math.hypot(dx,dy)||1;
      var w=(i===0||i===n)?0:Math.sin(seed+i*1.9)*T.wobble*Math.sin(Math.PI*t); out.push([p[0]-dy/m*w, p[1]+dx/m*w]); }
    return out;
  }
  function zig(pts){
    var L=plen(pts), out=[pts[0]], step=0.9, amp=T.magnet?0.6:0.7, n=Math.floor((L-1.8)/step);
    for(var i=1;i<=n;i++){ var t=i*step/L, p=along(pts,t), q=along(pts,Math.min(1,t+0.01)); var dx=q[0]-p[0], dy=q[1]-p[1], m=Math.hypot(dx,dy)||1; var s=(i%2?1:-1)*amp; out.push([p[0]-dy/m*s, p[1]+dx/m*s]); }
    out.push(pts[pts.length-1]); return out;
  }
  var CAP=' stroke-linecap="round" stroke-linejoin="round"';
  function action(a, st, uid, fade, anim){
    if(a.quiet) return '';
    var isDef = GB.kind(a.id)==="def", col = isDef ? T.moveDef : T.moveOff, mk = isDef ? "md" : "mo", sw=T.stroke;
    var op = fade ? ' opacity="'+fade+'"' : '', drw = anim ? ' pathLength="1" class="dr"' : '', mkA = function(m){ return anim ? ' data-mk="url(#'+m+uid+')"' : ' marker-end="url(#'+m+uid+')"'; };
    if(a.t==="c"){ var p=wobble(trim(a.pts,1.6,1.4)); return '<polyline points="'+poly(p)+'" fill="none" stroke="'+col+'" stroke-width="'+sw+'"'+CAP+mkA(mk)+drw+op+'/>'; }
    if(a.t==="sl"){ var ps=wobble(trim(a.pts,1.6,1.4)); return '<polyline points="'+poly(ps)+'" fill="none" stroke="'+col+'" stroke-width="'+sw+'" stroke-dasharray="1.4 .55"'+CAP+mkA(mk)+(anim?' class="fd"':'')+op+'/>'; }
    if(a.t==="d"){ var p2=trim(a.pts,1.6,1.4); return '<polyline points="'+poly(zig(p2))+'" fill="none" stroke="'+col+'" stroke-width="'+(sw*.92)+'"'+CAP+mkA(mk)+drw+op+'/>'; }
    if(a.t==="s"){ var p3=wobble(trim(a.pts,1.6,0)), e=p3[p3.length-1], b=p3[p3.length-2]||p3[0], dx=e[0]-b[0], dy=e[1]-b[1], m=Math.hypot(dx,dy)||1, nx=-dy/m*1.5, ny=dx/m*1.5;
      return '<g'+op+'><polyline points="'+poly(p3)+'" fill="none" stroke="'+col+'" stroke-width="'+sw+'"'+CAP+drw+'/><line x1="'+f(e[0]+nx)+'" y1="'+f(e[1]+ny)+'" x2="'+f(e[0]-nx)+'" y2="'+f(e[1]-ny)+'" stroke="'+col+'" stroke-width="'+(sw*1.7)+'" stroke-linecap="round"'+(anim?' class="fd"':'')+'/></g>'; }
    if(a.t==="p"||a.t==="h"){ var A=st.start[a.id], B=st.end[a.to], pp=trim([A,B],1.7,1.8);
      return '<polyline points="'+poly(pp)+'" fill="none" stroke="'+T.pass+'" stroke-width="'+(sw*.9)+'" stroke-dasharray="'+(T.magnet?'.2 .85':'.9 .6')+'"'+CAP+mkA("mp")+(anim?' class="fd"':'')+op+'/>'; }
    if(a.t==="sh"){ var S=st.end[a.id], R=a.rim, mx=(S[0]+R[0])/2+(S[1]-R[1])*0.15, my=(S[1]+R[1])/2-(S[0]-R[0])*0.15;
      return '<path d="M'+f(S[0])+','+f(S[1])+' Q'+f(mx)+','+f(my)+' '+f(R[0])+','+f(R[1])+'" fill="none" stroke="'+T.shot+'" stroke-width="'+(sw*.85)+'" stroke-dasharray=".3 .55"'+CAP+(anim?' class="fd"':'')+op+'/>'; }
    return '';
  }
  // where to put a step number: middle of the step's first real movement
  function stepMark(st){
    for(var j=0;j<st.acts.length;j++){ var a=st.acts[j];
      if(a.pts && !a.quiet && plen(a.pts)>4){ var p=along(a.pts,.5), q=along(a.pts,.52), dx=q[0]-p[0], dy=q[1]-p[1], m=Math.hypot(dx,dy)||1; return [p[0]-dy/m*1.9, p[1]+dx/m*1.9]; }
      if(a.t==="p"){ var A=st.start[a.id], B=st.end[a.to]; return [(A[0]+B[0])/2+1.4,(A[1]+B[1])/2]; } }
    return null;
  }
  function badge(x,y,n,full){ var r=full?1.25:.95; return '<g transform="translate('+f(x)+','+f(y)+')"><circle r="'+r+'" fill="'+T.pass+'" opacity=".9"/><text y="'+f(r*.42)+'" text-anchor="middle" font-size="'+f(r*1.25)+'" font-weight="800" fill="'+(THEME==="neon"?"#05060f":"#fff")+'" '+FONT+'>'+n+'</text></g>'; }
  function awayFromRim(x,y,full){ var ry = (!full||y<47)?5.25:88.75; var dx=x-25, dy=y-ry, m=Math.hypot(dx,dy)||1; return [dx/m, dy/m]; }
  var FONT='font-family="Barlow Condensed,system-ui,sans-serif"';
  function token(e, x, y, full, id, uid){
    var s='', d=awayFromRim(x,y,full), k=full?1.3:1;
    for(var i=e.q;i>=1;i--){ var qx=x+d[0]*2.4*i, qy=y+d[1]*2.4*i; s+='<circle cx="'+f(qx)+'" cy="'+f(qy)+'" r="'+f(1.05*k)+'" fill="'+(e.k==="def"?T.qDef:T.qOff)+'"'+(THEME==="neon"?'':' stroke="#fff" stroke-width=".15"')+'/>'; }
    var g='<g data-id="'+id+'" transform="translate('+f(x)+','+f(y)+')'+(full?' scale(1.3)':'')+'">';
    var shadow = T.magnet ? '<ellipse cx=".18" cy=".32" rx="1.55" ry="1.5" fill="#0b1220" opacity=".22"/>' : '';
    if(e.k==="off") g+=shadow+'<circle r="1.5" fill="'+T.off+'" stroke="'+T.offRing+'" stroke-width="'+(T.magnet?.18:.22)+'"/>'+(T.magnet?'<circle r="1.5" fill="url(#mag'+uid+')"/>':'')+'<text y=".68" text-anchor="middle" font-size="2.05" font-weight="800" fill="'+T.offTxt+'" '+FONT+'>'+id+'</text>';
    else if(e.k==="def") g+=shadow+'<circle r="1.5" fill="'+T.defFill+'" stroke="'+T.def+'" stroke-width=".28"/>'+(T.magnet?'<circle r="1.5" fill="url(#mag'+uid+')"/>':'')+'<text y=".66" text-anchor="middle" font-size="1.95" font-weight="800" fill="'+T.def+'" '+FONT+'>X<tspan font-size="1.15" dy=".22">'+id.slice(1)+'</tspan></text>';
    else if(e.k==="coach") g+=shadow+'<rect x="-1.5" y="-1.5" width="3" height="3" rx=".55" fill="'+T.coach+'"/><text y=".7" text-anchor="middle" font-size="2" font-weight="800" fill="'+T.coachTxt+'" '+FONT+'>C</text>';
    else g+='<path d="M0,-1.3 L1.2,1 L-1.2,1 z" fill="'+T.cone+'"/>';
    return s+g+'</g>';
  }
  function ballSvg(x,y,sc){ return '<circle cx="'+f(x)+'" cy="'+f(y)+'" r="'+f(.75*(sc||1))+'" fill="'+T.ball+'" stroke="'+T.ballLine+'" stroke-width=".18"/>'; }
  function holderOffset(){ return [1.1,1.0]; }
  var uidc=0;
  function viewH(P){
    if(P.full) return 94; if(P.vh) return P.vh; var m=0;
    P.states.forEach(function(st){ for(var k in st.pos){ var e=P.ents[k], y=st.pos[k][1]+(e&&e.q?e.q*2.4:0); if(y>m) m=y; } });
    P.steps.forEach(function(st){ st.acts.forEach(function(a){ (a.pts||[]).forEach(function(p){ if(p[1]>m) m=p[1]; }); }); });
    P.vh=Math.min(47, Math.max(28, Math.ceil(m+4))); return P.vh;
  }
  function svgOpen(P,cls){ var h=viewH(P), bot=h>=47?h+3:h+1.5; return '<svg class="'+(cls||"court")+' th-'+THEME+'" viewBox="-1.5 -1.5 53 '+bot+'" xmlns="http://www.w3.org/2000/svg" role="img">'; }
  function wrapFx(inner, uid){ return T.glow ? '<g filter="url(#glow'+uid+')">'+inner+'</g>' : inner; }
  // static: entities at the start of step i with the actions of step i (or all steps if i<0)
  function staticSvg(P, i, cls){
    ensureHolo();
    var uid=++uidc, s=svgOpen(P,cls)+defs(uid)+court(P.full,uid), acts='', ents='';
    var si = i<0?0:i, state=P.states[si];
    var stepsToDraw = i<0 ? P.steps : [P.steps[si]];
    stepsToDraw.forEach(function(st,k){ if(!st) return; st.acts.forEach(function(a){ acts+=action(a,st,uid, i<0 && k>0 ? 0.6 : 0); }); });
    if(i<0 && P.steps.length>1) P.steps.forEach(function(st,k){ var m=stepMark(st); if(m) acts+=badge(m[0],m[1],k+1,P.full); });
    P.order.forEach(function(id){ var p=state.pos[id]; ents+=token(P.ents[id],p[0],p[1],P.full,id,uid); });
    state.balls.forEach(function(b){ if(b.h){ var p=state.pos[b.h], o=holderOffset(); ents+=ballSvg(p[0]+o[0],p[1]+o[1]); } else ents+=ballSvg(b.x,b.y); });
    return s+wrapFx(acts,uid)+wrapFx(ents,uid)+'</svg>';
  }
  var reduced = typeof matchMedia!=="undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Animated player: each step draws its lines first, then the players move along them.
  function Player(el, P, onStep, opts){
    this.trailOn=!!(opts&&opts.trail);
    this.el=el; this.P=P; this.i=0; this.t=0; this.playing=false; this.speed=1; this.onStep=onStep; this.uid=++uidc; this.pre=0;
    ensureHolo(); this.render(false);
  }
  Player.prototype.render=function(animate){
    var P=this.P, st=P.steps[this.i], uid=this.uid, anim=animate && !reduced, acts='', past='';
    // keep earlier steps on screen faintly so the whole pattern (e.g. a full-court loop) builds up
    if(this.trailOn) for(var k=0;k<this.i;k++) (function(ps){ ps.acts.forEach(function(a){ if(a.t!=="sh") past+=action(a,ps,uid,0.3,false); }); })(P.steps[k]);
    if(st) st.acts.forEach(function(a){ acts+=action(a,st,uid,0.9,anim); });
    acts='<g class="past">'+past+'</g>'+acts;
    this.el.innerHTML=svgOpen(P)+defs(uid)+court(P.full,uid)+'<g class="trail">'+wrapFx(acts,uid)+'</g>'+(T.glow?'<g filter="url(#glow'+uid+')"><g class="ents"></g><g class="balls"></g></g>':'<g class="ents"></g><g class="balls"></g>')+'</svg>';
    this.ents=this.el.querySelector(".ents"); this.balls=this.el.querySelector(".balls");
    var svg=this.el.querySelector("svg");
    if(anim){ this.pre=520/this.speed; svg.classList.add("drawing"); var me=this, tok=(this.tok=(this.tok||0)+1);
      setTimeout(function(){ if(me.tok!==tok) return; svg.classList.remove("drawing"); [].forEach.call(svg.querySelectorAll("[data-mk]"),function(n){ n.setAttribute("marker-end",n.getAttribute("data-mk")); }); }, 480/this.speed);
    } else { this.pre=0; [].forEach.call(svg.querySelectorAll("[data-mk]"),function(n){ n.setAttribute("marker-end",n.getAttribute("data-mk")); }); }
    this.frame(this.t);
    if(this.onStep) this.onStep(this.i, this.t);
  };
  Player.prototype.posAt=function(id,t){
    var st=this.P.steps[this.i]; if(!st) return this.P.states[0].pos[id];
    var p=st.start[id];
    st.acts.forEach(function(a){ if(a.id===id && a.pts) p=along(a.pts,t); });
    return p;
  };
  Player.prototype.frame=function(t){
    var P=this.P, st=P.steps[this.i], self=this, h='', b='';
    P.order.forEach(function(id){ var p=self.posAt(id,t); h+=token(P.ents[id],p[0],p[1],P.full,id,self.uid); });
    var bs = st ? st.ballsStart : P.states[0].balls;
    bs.forEach(function(ball,bi){
      var act = st && st.acts.filter(function(a){return a.ball===bi;})[0], x,y,sc=1;
      function hp(id,tt){ var p=self.posAt(id,tt), o=holderOffset(); return [p[0]+o[0], p[1]+o[1]]; }
      if(act && (act.t==="p"||act.t==="h")){ if(t<.35){ var q=hp(act.id,t); x=q[0];y=q[1]; } else { var a0=hp(act.id,.35), a1=hp(act.to,t), e=(t-.35)/.65; x=a0[0]+(a1[0]-a0[0])*e; y=a0[1]+(a1[1]-a0[1])*e; } }
      else if(act && act.t==="sh"){ if(t<.4){ var q2=hp(act.id,t); x=q2[0];y=q2[1]; } else { var s0=hp(act.id,.4), e2=(t-.4)/.6; x=s0[0]+(act.rim[0]-s0[0])*e2; y=s0[1]+(act.rim[1]-s0[1])*e2; sc=1+Math.sin(e2*Math.PI)*0.6; } }
      else if(act && act.t==="rb"){ if(t<.3){ x=act.from[0]; y=act.from[1]; } else { var r1=hp(act.id,t), e3=(t-.3)/.7; x=act.from[0]+(r1[0]-act.from[0])*e3; y=act.from[1]+(r1[1]-act.from[1])*e3; } }
      else if(ball.h){ var q3=hp(ball.h,t); x=q3[0]; y=q3[1]; var drib=st && st.acts.some(function(a){return a.id===ball.h && a.t==="d";}); if(drib && self.playing && t>0) sc=0.85+Math.abs(Math.sin(t*28))*0.3; }
      else { x=ball.x; y=ball.y; }
      b+=ballSvg(x,y,sc);
    });
    this.ents.innerHTML=h; this.balls.innerHTML=b;
  };
  Player.prototype.go=function(i, animate){ this.i=Math.max(0,Math.min(this.P.steps.length-1,i)); this.t=0; this.render(animate!==false); };
  Player.prototype.play=function(){
    if(!this.P.steps.length) return; var self=this; this.playing=true; var last=null, hold=0;
    if(this.t>=1){ this.go(this.i>=this.P.steps.length-1?0:this.i+1); }
    else if(this.t===0 && !this.started){ this.started=true; this.render(true); }
    function tick(ts){
      if(!self.playing) return; if(last==null) last=ts; var dt=ts-last; last=ts;
      if(self.pre>0){ self.pre-=dt; }
      else if(hold>0){ hold-=dt; if(hold<=0){ self.go(self.i>=self.P.steps.length-1?0:self.i+1); } }
      else { self.t=Math.min(1, self.t + dt/(1700/self.speed)); self.frame(ease(self.t)); if(self.onStep) self.onStep(self.i,self.t); if(self.t>=1) hold=900/self.speed; }
      self.raf=requestAnimationFrame(tick);
    }
    this.raf=requestAnimationFrame(tick);
  };
  Player.prototype.pause=function(){ this.playing=false; cancelAnimationFrame(this.raf); this.frame(ease(this.t)); };
  Player.prototype.destroy=function(){ this.pause(); this.tok=-1; };
  function ease(t){ return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2; }
  return { staticSvg:staticSvg, Player:Player, lines:LINES, themes:THEMES,
    setLine:function(k){ if(LINES[k]) LINE=k; },
    setTheme:function(k){ if(THEMES[k]){ THEME=k; T=THEMES[k]; } },
    theme:function(){ return THEME; } };
})();
