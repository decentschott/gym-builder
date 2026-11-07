// Diagram engine: parses the drill DSL into a timeline of states + drawable actions.
var GB = (function(){
  var RIM_H = [25,5.25], RIM_F2 = [25,88.75];
  function num(a){ return a.split(",").map(Number); }
  function kind(id){ if(/^x/.test(id)) return "def"; if(/^C/.test(id)) return "coach"; if(/^k/.test(id)) return "cone"; return "off"; }

  function parse(d){
    var ents = {}, order = [], balls = [], warn = [];
    d.s.split(";").forEach(function(t){
      t = t.trim(); if(!t) return;
      if(t.indexOf("b:")===0){ t.slice(2).split(",").forEach(function(h){ balls.push({h:h.trim()}); }); return; }
      if(t.indexOf("b@")===0){ var p=num(t.slice(2)); balls.push({h:null,x:p[0],y:p[1]}); return; }
      var parts = t.split(/\s+/), id = parts[0], xy = num(parts[1]);
      var q = 0; if(parts[2] && parts[2][0]==="q") q = +parts[2].slice(1);
      ents[id] = {id:id, k:kind(id), x:xy[0], y:xy[1], q:q}; order.push(id);
    });
    balls.forEach(function(b){ if(b.h && !ents[b.h]) warn.push("ball holder "+b.h+" missing"); if(b.h){ b.x=ents[b.h]&&ents[b.h].x; b.y=ents[b.h]&&ents[b.h].y; } });
    var full = d.c === "f";
    function rimFor(p){ if(!full) return RIM_H; return Math.abs(p[1]-RIM_H[1]) < Math.abs(p[1]-RIM_F2[1]) ? RIM_H : RIM_F2; }

    var pos = {}; order.forEach(function(id){ pos[id] = [ents[id].x, ents[id].y]; });
    var states = [{pos: clone(pos), balls: balls.map(function(b){ return {h:b.h, x:b.x, y:b.y}; })}];
    var steps = [];
    (d.st||[]).forEach(function(stp, si){
      var ops = stp[0].split(";").map(function(s){ return s.trim(); }).filter(Boolean);
      var prev = states[states.length-1];
      var start = clone(prev.pos), end = clone(prev.pos);
      var bs = prev.balls.map(function(b){ return {h:b.h,x:b.x,y:b.y}; });
      var snap = bs.map(function(b){ return b.h; });
      var acts = [];
      ops.forEach(function(op){
        var a = op.split(/\s+/), id = a[0], t = a[1];
        if(!start[id]){ warn.push("step "+(si+1)+": unknown player "+id); return; }
        if(t==="c"||t==="d"||t==="sl"||t==="s"){
          var pts = [end[id].slice()];
          a.slice(2).forEach(function(xy){ pts.push(num(xy)); });
          if(pts.length<2){ warn.push("step "+(si+1)+": "+op+" has no points"); return; }
          pts.forEach(function(p){ if(isNaN(p[0])||isNaN(p[1])) warn.push("bad coord in "+op); });
          end[id] = pts[pts.length-1].slice();
          if(t==="d" && snap.indexOf(id)<0 && !bs.some(function(b){return b.h===id;})) warn.push("step "+(si+1)+": "+id+" dribbles without a ball");
          acts.push({t:t, id:id, pts:pts});
        } else if(t==="p"||t==="h"){
          var to = a[2]; if(!start[to]){ warn.push("step "+(si+1)+": pass to unknown "+to); return; }
          var bi = snap.indexOf(id); if(bi<0) bi = bs.findIndex(function(b){return b.h===id;});
          if(bi<0){ warn.push("step "+(si+1)+": "+id+" passes without a ball"); return; }
          snap[bi] = "_used"; bs[bi].h = to;
          acts.push({t:t, id:id, to:to, ball:bi});
        } else if(t==="sh"){
          var bi2 = snap.indexOf(id); if(bi2<0) bi2 = bs.findIndex(function(b){return b.h===id;});
          if(bi2<0){ warn.push("step "+(si+1)+": "+id+" shoots without a ball"); return; }
          snap[bi2] = "_used"; var r = rimFor(end[id]); bs[bi2].h = null; bs[bi2].x = r[0]; bs[bi2].y = r[1];
          acts.push({t:"sh", id:id, ball:bi2, rim:r});
        } else if(t==="rb"){
          if(a[2]){ var p2 = num(a[2]); acts.push({t:"c", id:id, pts:[end[id].slice(), p2], quiet:true}); end[id] = p2; }
          var bi3 = -1, best = 1e9;
          bs.forEach(function(b,i){ if(b.h===null){ var dd = Math.hypot(b.x-end[id][0], b.y-end[id][1]); if(dd<best){best=dd;bi3=i;} } });
          if(bi3<0){ warn.push("step "+(si+1)+": "+id+" rebounds but no loose ball"); return; }
          var from = [bs[bi3].x, bs[bi3].y]; bs[bi3].h = id;
          acts.push({t:"rb", id:id, ball:bi3, from:from});
        } else warn.push("step "+(si+1)+": unknown op "+op);
      });
      bs.forEach(function(b){ if(b.h && end[b.h]){ b.x=end[b.h][0]; b.y=end[b.h][1]; } });
      states.push({pos:end, balls:bs});
      steps.push({acts:acts, cap:stp[1]||"", start:start, end:end, ballsStart:prev.balls, ballsEnd:bs});
    });
    // bounds check
    var maxY = full ? 94 : 47;
    states.forEach(function(s){ for(var k in s.pos){ var p=s.pos[k]; if(p[0]<-1||p[0]>51||p[1]<-1||p[1]>maxY+1) warn.push("out of bounds "+k+" "+p); } });
    return {ents:ents, order:order, states:states, steps:steps, full:full, warn:warn, needHoop: /\b(sh|rb)\b/.test((d.st||[]).map(function(x){return x[0];}).join(";"))};
  }
  function clone(o){ var r={}; for(var k in o) r[k]=o[k].slice(); return r; }
  return {parse:parse, kind:kind};
})();
if(typeof module!=="undefined") module.exports = GB;
