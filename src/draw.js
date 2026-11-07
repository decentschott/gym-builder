// SVG court + diagram rendering, static and animated.
var DRAW = (function(){
  var INK="#1f2937", DEF="#c62828", OFF="#0f2a4a", WOOD="#f3e7d3", PAINT="#ead7b8", LINE="#9a7b55";
  function f(n){ return Math.round(n*100)/100; }
  function half(){
    return '<rect x="19" y="0" width="12" height="19" fill="'+PAINT+'" stroke="'+LINE+'" stroke-width=".25"/>'+
      '<path d="M19,19 A6,6 0 0 0 31,19" fill="none" stroke="'+LINE+'" stroke-width=".25"/>'+
      '<path d="M19,19 A6,6 0 0 1 31,19" fill="none" stroke="'+LINE+'" stroke-width=".25" stroke-dasharray=".8 .8"/>'+
      '<path d="M5.96,0 A19.75,19.75 0 1 0 44.04,0" fill="none" stroke="'+LINE+'" stroke-width=".25"/>'+
      '<path d="M21,5.25 A4,4 0 0 0 29,5.25" fill="none" stroke="'+LINE+'" stroke-width=".2"/>'+
      '<line x1="22" y1="4" x2="28" y2="4" stroke="'+INK+'" stroke-width=".4"/>'+
      '<circle cx="25" cy="5.25" r=".85" fill="none" stroke="#ea580c" stroke-width=".3"/>';
  }
  function court(full){
    var h = full ? 94 : 47;
    var s = '<rect x="0" y="0" width="50" height="'+h+'" fill="'+WOOD+'" stroke="'+LINE+'" stroke-width=".35"/>' + half();
    if(full) s += '<g transform="translate(0,94) scale(1,-1)">'+half()+'</g><line x1="0" y1="47" x2="50" y2="47" stroke="'+LINE+'" stroke-width=".25"/><circle cx="25" cy="47" r="6" fill="none" stroke="'+LINE+'" stroke-width=".25"/>';
    else s += '<line x1="0" y1="47" x2="50" y2="47" stroke="'+LINE+'" stroke-width=".35"/><path d="M19,47 A6,6 0 0 1 31,47" fill="none" stroke="'+LINE+'" stroke-width=".25"/>';
    return s;
  }
  function defs(uid){
    return '<defs>'+
      '<marker id="ai'+uid+'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="'+INK+'"/></marker>'+
      '<marker id="ad'+uid+'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="'+DEF+'"/></marker>'+
      '</defs>';
  }
  function plen(pts){ var L=0; for(var i=1;i<pts.length;i++) L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]); return L; }
  function along(pts,t){
    if(pts.length===1) return pts[0].slice();
    var L=plen(pts)*Math.max(0,Math.min(1,t));
    for(var i=1;i<pts.length;i++){ var a=pts[i-1],b=pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<=l||i===pts.length-1){ var r=l?Math.min(1,L/l):1; return [a[0]+(b[0]-a[0])*r, a[1]+(b[1]-a[1])*r]; } L-=l; }
    return pts[pts.length-1].slice();
  }
  // shorten a path so arrows stop at the edge of a player token
  function trim(pts,s,e){ pts=pts.map(function(p){return p.slice();}); var L=plen(pts); if(L<s+e+0.5) return pts;
    if(s){ pts[0]=along(pts, s/L); } if(e){ var q=along(pts,1-e/plen(pts)); pts[pts.length-1]=q; } return pts; }
  function poly(pts){ return pts.map(function(p){return f(p[0])+","+f(p[1]);}).join(" "); }
  function zig(pts){
    var L=plen(pts), out=[pts[0]], step=0.9, amp=0.7, n=Math.floor((L-1.8)/step);
    for(var i=1;i<=n;i++){ var t=i*step/L, p=along(pts,t), q=along(pts,Math.min(1,t+0.01)); var dx=q[0]-p[0], dy=q[1]-p[1], m=Math.hypot(dx,dy)||1; var s=(i%2?1:-1)*amp; out.push([p[0]-dy/m*s, p[1]+dx/m*s]); }
    out.push(pts[pts.length-1]); return out;
  }
  function action(a, st, uid, fade){
    var op = fade ? ' opacity="'+fade+'"' : '';
    var col = GB.kind(a.id)==="def" ? DEF : INK, mk = GB.kind(a.id)==="def" ? "ad" : "ai";
    if(a.quiet) return '';
    if(a.t==="c"||a.t==="sl"){ var p=trim(a.pts,1.6,1.4);
      return '<polyline points="'+poly(p)+'" fill="none" stroke="'+col+'" stroke-width=".32" '+(a.t==="sl"?'stroke-dasharray="1.4 .5" ':'')+'stroke-linejoin="round" marker-end="url(#'+mk+uid+')"'+op+'/>'; }
    if(a.t==="d"){ var p2=trim(a.pts,1.6,1.4); return '<polyline points="'+poly(zig(p2))+'" fill="none" stroke="'+col+'" stroke-width=".3" stroke-linejoin="round" marker-end="url(#'+mk+uid+')"'+op+'/>'; }
    if(a.t==="s"){ var p3=trim(a.pts,1.6,0), e=p3[p3.length-1], b=p3[p3.length-2]||p3[0], dx=e[0]-b[0], dy=e[1]-b[1], m=Math.hypot(dx,dy)||1, nx=-dy/m*1.5, ny=dx/m*1.5;
      return '<g'+op+'><polyline points="'+poly(p3)+'" fill="none" stroke="'+col+'" stroke-width=".32"/><line x1="'+f(e[0]+nx)+'" y1="'+f(e[1]+ny)+'" x2="'+f(e[0]-nx)+'" y2="'+f(e[1]-ny)+'" stroke="'+col+'" stroke-width=".55"/></g>'; }
    if(a.t==="p"||a.t==="h"){ var A=st.start[a.id], B=st.end[a.to], pp=trim([A,B],1.7,1.8);
      return '<polyline points="'+poly(pp)+'" fill="none" stroke="'+INK+'" stroke-width=".3" stroke-dasharray=".9 .6" marker-end="url(#ai'+uid+')"'+op+'/>'; }
    if(a.t==="sh"){ var S=st.end[a.id], R=a.rim, mx=(S[0]+R[0])/2+(S[1]-R[1])*0.15, my=(S[1]+R[1])/2-(S[0]-R[0])*0.15;
      return '<path d="M'+f(S[0])+','+f(S[1])+' Q'+f(mx)+','+f(my)+' '+f(R[0])+','+f(R[1])+'" fill="none" stroke="#ea580c" stroke-width=".28" stroke-dasharray=".3 .5"'+op+'/>'; }
    return '';
  }
  function awayFromRim(x,y,full){ var ry = (!full||y<47)?5.25:88.75; var dx=x-25, dy=y-ry, m=Math.hypot(dx,dy)||1; return [dx/m, dy/m]; }
  function token(e, x, y, full, id){
    var s='', d=awayFromRim(x,y,full);
    for(var i=e.q;i>=1;i--){ var qx=x+d[0]*2.4*i, qy=y+d[1]*2.4*i; s+='<circle cx="'+f(qx)+'" cy="'+f(qy)+'" r="'+(full?1.35:1.05)+'" fill="'+(e.k==="def"?"#f1c4c4":"#b9c6d6")+'" stroke="#fff" stroke-width=".15"/>'; }
    var g='<g data-id="'+id+'" transform="translate('+f(x)+','+f(y)+')'+(full?' scale(1.3)':'')+'">';
    if(e.k==="off") g+='<circle r="1.5" fill="'+OFF+'" stroke="#fff" stroke-width=".22"/><text y=".62" text-anchor="middle" font-size="1.8" font-weight="700" fill="#fff" font-family="system-ui,sans-serif">'+id+'</text>';
    else if(e.k==="def") g+='<circle r="1.5" fill="#fff" stroke="'+DEF+'" stroke-width=".25"/><text y=".62" text-anchor="middle" font-size="1.75" font-weight="800" fill="'+DEF+'" font-family="system-ui,sans-serif">X'+'<tspan font-size="1.05" dy=".25">'+id.slice(1)+'</tspan></text>';
    else if(e.k==="coach") g+='<rect x="-1.5" y="-1.5" width="3" height="3" rx=".5" fill="#fbbf24" stroke="'+INK+'" stroke-width=".2"/><text y=".62" text-anchor="middle" font-size="1.8" font-weight="800" fill="'+INK+'" font-family="system-ui,sans-serif">C</text>';
    else g+='<path d="M0,-1.3 L1.2,1 L-1.2,1 z" fill="#f97316" stroke="#9a3412" stroke-width=".15"/>';
    return s+g+'</g>';
  }
  function ballSvg(x,y,cls,sc){ return '<circle class="'+(cls||"")+'" cx="'+f(x)+'" cy="'+f(y)+'" r="'+f(.75*(sc||1))+'" fill="#f97316" stroke="#7c2d12" stroke-width=".18"/>'; }
  function holderOffset(){ return [1.1,1.0]; }
  var uidc=0;
  function viewH(P){
    if(P.full) return 94; if(P.vh) return P.vh; var m=0;
    P.states.forEach(function(st){ for(var k in st.pos){ var e=P.ents[k], y=st.pos[k][1]+(e&&e.q?e.q*2.4:0); if(y>m) m=y; } });
    P.steps.forEach(function(st){ st.acts.forEach(function(a){ (a.pts||[]).forEach(function(p){ if(p[1]>m) m=p[1]; }); }); });
    P.vh=Math.min(47, Math.max(28, Math.ceil(m+4))); return P.vh;
  }
  function svgOpen(P,cls){ var h=viewH(P), bot=h>=47?h+3:h+1.5; return '<svg class="'+(cls||"court")+'" viewBox="-1.5 -1.5 53 '+bot+'" xmlns="http://www.w3.org/2000/svg" role="img">'; }
  // static: show entities at start of step i, with actions of step i (or all steps if i<0)
  function staticSvg(P, i, cls){
    var uid=++uidc, s=svgOpen(P,cls)+defs(uid)+court(P.full);
    var si = i<0?0:i, state=P.states[si];
    var stepsToDraw = i<0 ? P.steps : [P.steps[si]];
    stepsToDraw.forEach(function(st,k){ if(!st) return; st.acts.forEach(function(a){ s+=action(a,st,uid, i<0 && k>0 ? 0.55 : 0); }); });
    P.order.forEach(function(id){ var p=state.pos[id]; s+=token(P.ents[id],p[0],p[1],P.full,id); });
    state.balls.forEach(function(b){ if(b.h){ var p=state.pos[b.h], o=holderOffset(); s+=ballSvg(p[0]+o[0],p[1]+o[1]); } else s+=ballSvg(b.x,b.y); });
    return s+'</svg>';
  }
  // Animated player
  function Player(el, P, onStep){
    this.el=el; this.P=P; this.i=0; this.t=0; this.playing=false; this.speed=1; this.onStep=onStep; this.uid=++uidc;
    this.render();
  }
  Player.prototype.render=function(){
    var P=this.P, st=P.steps[this.i], uid=this.uid;
    var s=svgOpen(P)+defs(uid)+court(P.full)+'<g class="trail">';
    if(st) st.acts.forEach(function(a){ s+=action(a,st,uid,0.85); });
    s+='</g><g class="ents"></g><g class="balls"></g></svg>';
    this.el.innerHTML=s; this.ents=this.el.querySelector(".ents"); this.balls=this.el.querySelector(".balls");
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
    P.order.forEach(function(id){ var p=self.posAt(id,t); h+=token(P.ents[id],p[0],p[1],P.full,id); });
    var bs = st ? st.ballsStart : P.states[0].balls;
    bs.forEach(function(ball,bi){
      var act = st && st.acts.filter(function(a){return a.ball===bi;})[0], x,y,sc=1;
      function hp(id,tt){ var p=self.posAt(id,tt), o=holderOffset(); return [p[0]+o[0], p[1]+o[1]]; }
      if(act && (act.t==="p"||act.t==="h")){ if(t<.35){ var q=hp(act.id,t); x=q[0];y=q[1]; } else { var a0=hp(act.id,.35), a1=hp(act.to,t), e=(t-.35)/.65; x=a0[0]+(a1[0]-a0[0])*e; y=a0[1]+(a1[1]-a0[1])*e; } }
      else if(act && act.t==="sh"){ if(t<.4){ var q2=hp(act.id,t); x=q2[0];y=q2[1]; } else { var s0=hp(act.id,.4), e2=(t-.4)/.6; x=s0[0]+(act.rim[0]-s0[0])*e2; y=s0[1]+(act.rim[1]-s0[1])*e2; sc=1+Math.sin(e2*Math.PI)*0.6; } }
      else if(act && act.t==="rb"){ if(t<.3){ x=act.from[0]; y=act.from[1]; } else { var r1=hp(act.id,t), e3=(t-.3)/.7; x=act.from[0]+(r1[0]-act.from[0])*e3; y=act.from[1]+(r1[1]-act.from[1])*e3; } }
      else if(ball.h){ var q3=hp(ball.h,t); x=q3[0]; y=q3[1]; var drib=st && st.acts.some(function(a){return a.id===ball.h && a.t==="d";}); if(drib && self.playing) sc=0.85+Math.abs(Math.sin(t*28))*0.3; }
      else { x=ball.x; y=ball.y; }
      b+=ballSvg(x,y,"",sc);
    });
    this.ents.innerHTML=h; this.balls.innerHTML=b;
  };
  Player.prototype.go=function(i){ this.i=Math.max(0,Math.min(this.P.steps.length-1,i)); this.t=0; this.render(); };
  Player.prototype.play=function(){
    if(!this.P.steps.length) return; var self=this; this.playing=true; var last=null, hold=0;
    if(this.t>=1){ if(this.i>=this.P.steps.length-1) this.go(0); else this.go(this.i+1); this.playing=true; }
    function tick(ts){
      if(!self.playing) return; if(last==null) last=ts; var dt=ts-last; last=ts;
      if(hold>0){ hold-=dt; if(hold<=0){ if(self.i>=self.P.steps.length-1){ self.go(0); } else self.go(self.i+1); self.playing=true; } }
      else { self.t=Math.min(1, self.t + dt/(1700/self.speed)); self.frame(ease(self.t)); if(self.onStep) self.onStep(self.i,self.t); if(self.t>=1) hold=900/self.speed; }
      self.raf=requestAnimationFrame(tick);
    }
    this.raf=requestAnimationFrame(tick);
  };
  Player.prototype.pause=function(){ this.playing=false; cancelAnimationFrame(this.raf); this.frame(ease(this.t)); };
  Player.prototype.destroy=function(){ this.pause(); };
  function ease(t){ return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2; }
  return {staticSvg:staticSvg, Player:Player};
})();
