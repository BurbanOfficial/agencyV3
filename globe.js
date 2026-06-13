(function () {
  var canvas  = document.getElementById('globeCanvas');
  var tooltip = document.getElementById('globeTooltip');
  if (!canvas) return;

  var CITIES = [
    { lat: 48.853, lng:   2.348, name: 'Paris' },
    { lat: 51.507, lng:  -0.127, name: 'Londres' },
    { lat: 52.520, lng:  13.405, name: 'Berlin' },
    { lat: 41.900, lng:  12.483, name: 'Rome' },
    { lat: 40.416, lng:  -3.703, name: 'Madrid' },
    { lat: 48.208, lng:  16.373, name: 'Vienne' },
    { lat: 50.846, lng:   4.352, name: 'Bruxelles' },
    { lat: 52.373, lng:   4.892, name: 'Amsterdam' },
    { lat: 59.913, lng:  10.752, name: 'Oslo' },
    { lat: 59.325, lng:  18.071, name: 'Stockholm' },
    { lat: 55.687, lng:  12.570, name: 'Copenhague' },
    { lat: 60.169, lng:  24.938, name: 'Helsinki' },
    { lat: 53.349, lng:  -6.260, name: 'Dublin' },
    { lat: 38.707, lng:  -9.136, name: 'Lisbonne' },
    { lat: 52.231, lng:  21.006, name: 'Varsovie' },
    { lat: 50.075, lng:  14.437, name: 'Prague' },
    { lat: 47.497, lng:  19.040, name: 'Budapest' },
    { lat: 37.979, lng:  23.727, name: 'Athenes' },
    { lat: 41.015, lng:  28.979, name: 'Istanbul' },
    { lat: 55.752, lng:  37.616, name: 'Moscou' },
    { lat: 50.450, lng:  30.523, name: 'Kiev' },
    { lat: 44.804, lng:  20.465, name: 'Belgrade' },
    { lat: 42.697, lng:  23.322, name: 'Sofia' },
    { lat: 44.432, lng:  26.104, name: 'Bucarest' },
    { lat: 46.948, lng:   7.448, name: 'Berne' },
    { lat: 40.712, lng: -74.006, name: 'New York' },
    { lat: 34.053, lng:-118.243, name: 'Los Angeles' },
    { lat: 41.881, lng: -87.623, name: 'Chicago' },
    { lat: 29.760, lng: -95.369, name: 'Houston' },
    { lat: 47.606, lng:-122.332, name: 'Seattle' },
    { lat: 37.774, lng:-122.419, name: 'San Francisco' },
    { lat: 25.774, lng: -80.194, name: 'Miami' },
    { lat: 45.503, lng: -73.569, name: 'Montreal' },
    { lat: 43.651, lng: -79.347, name: 'Toronto' },
    { lat: 49.282, lng:-123.120, name: 'Vancouver' },
    { lat: 19.433, lng: -99.133, name: 'Mexico City' },
    { lat: -23.55, lng: -46.633, name: 'Sao Paulo' },
    { lat: -22.90, lng: -43.172, name: 'Rio de Janeiro' },
    { lat:  4.653, lng: -74.083, name: 'Bogota' },
    { lat: -12.04, lng: -77.028, name: 'Lima' },
    { lat: -34.61, lng: -58.376, name: 'Buenos Aires' },
    { lat: -33.46, lng: -70.648, name: 'Santiago' },
    { lat: 35.676, lng: 139.763, name: 'Tokyo' },
    { lat: 37.566, lng: 126.978, name: 'Seoul' },
    { lat: 31.231, lng: 121.470, name: 'Shanghai' },
    { lat: 39.929, lng: 116.388, name: 'Pekin' },
    { lat: 22.279, lng: 114.162, name: 'Hong Kong' },
    { lat:  1.290, lng: 103.851, name: 'Singapour' },
    { lat: 10.775, lng: 106.702, name: 'Ho Chi Minh' },
    { lat: 13.752, lng: 100.493, name: 'Bangkok' },
    { lat: 14.688, lng: 121.000, name: 'Manille' },
    { lat: -6.175, lng: 106.827, name: 'Jakarta' },
    { lat: 28.613, lng:  77.209, name: 'New Delhi' },
    { lat: 19.076, lng:  72.877, name: 'Mumbai' },
    { lat: 23.726, lng:  90.396, name: 'Dhaka' },
    { lat: 33.341, lng:  44.401, name: 'Bagdad' },
    { lat: 35.689, lng:  51.389, name: 'Teheran' },
    { lat: 25.229, lng:  55.289, name: 'Dubai' },
    { lat: 24.638, lng:  46.716, name: 'Riyad' },
    { lat: 31.768, lng:  35.214, name: 'Jerusalem' },
    { lat: 30.061, lng:  31.249, name: 'Le Caire' },
    { lat:  9.022, lng:   7.491, name: 'Abuja' },
    { lat:  6.524, lng:   3.379, name: 'Lagos' },
    { lat: -1.286, lng:  36.817, name: 'Nairobi' },
    { lat:-25.746, lng:  28.188, name: 'Pretoria' },
    { lat: 14.693, lng: -17.447, name: 'Dakar' },
    { lat: 33.594, lng:  -7.620, name: 'Casablanca' },
    { lat: 36.737, lng:   3.086, name: 'Alger' },
    { lat:-33.869, lng: 151.208, name: 'Sydney' },
    { lat:-37.813, lng: 144.963, name: 'Melbourne' }
  ];

  var ctx = canvas.getContext('2d');
  var DPR = window.devicePixelRatio || 1;
  var SIZE, R, cx, cy;

  function resize() {
    SIZE = canvas.parentElement.offsetWidth || 500;
    canvas.width  = SIZE * DPR;
    canvas.height = SIZE * DPR;
    canvas.style.width  = SIZE + 'px';
    canvas.style.height = SIZE + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    R  = SIZE * 0.43;
    cx = SIZE / 2;
    cy = SIZE / 2;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---- Land mask ---- */
  var MASK_W = 360, MASK_H = 180;
  var landPixels = null;
  var dots = [];

  function ll2xyz(lat, lng) {
    var phi   = (90 - lat) * Math.PI / 180;
    var theta = (lng + 180) * Math.PI / 180;
    return {
      x: -Math.sin(phi) * Math.cos(theta),
      y:  Math.cos(phi),
      z:  Math.sin(phi) * Math.sin(theta)
    };
  }

  function buildDots() {
    dots = [];
    for (var row = 0; row < 90; row++) {
      for (var col = 0; col < 180; col++) {
        var lat = 90  - (row + 0.5) * 2;
        var lng = -180 + (col + 0.5) * 2;
        var px  = Math.min(MASK_W-1, Math.max(0, Math.floor(((lng+180)/360)*MASK_W)));
        var py  = Math.min(MASK_H-1, Math.max(0, Math.floor(((90-lat)/180)*MASK_H)));
        if (landPixels[py * MASK_W + px] === 1) dots.push(ll2xyz(lat, lng));
      }
    }
  }

  fetch('assets/world.geojson')
    .then(function(r) { return r.json(); })
    .then(function(gj) {
      var mc = document.createElement('canvas');
      mc.width = MASK_W; mc.height = MASK_H;
      var mc2 = mc.getContext('2d');
      mc2.fillStyle = '#000'; mc2.fillRect(0,0,MASK_W,MASK_H);
      mc2.fillStyle = '#fff';
      gj.features.forEach(function(f) {
        var g = f.geometry;
        var polys = g.type==='Polygon' ? [g.coordinates] : g.type==='MultiPolygon' ? g.coordinates : [];
        polys.forEach(function(poly) {
          poly.forEach(function(ring) {
            mc2.beginPath();
            ring.forEach(function(pt, i) {
              var px = ((pt[0]+180)/360)*MASK_W, py = ((90-pt[1])/180)*MASK_H;
              i===0 ? mc2.moveTo(px,py) : mc2.lineTo(px,py);
            });
            mc2.closePath(); mc2.fill();
          });
        });
      });
      var d = mc2.getImageData(0,0,MASK_W,MASK_H).data;
      landPixels = new Uint8Array(MASK_W*MASK_H);
      for (var i=0; i<MASK_W*MASK_H; i++) landPixels[i] = d[i*4]>128 ? 1 : 0;
      buildDots();
    });

  /* ---- Build arcs: pre-compute 3D points along great-circle ---- */
  var COLORS = ['#0894FF','#C959DD','#FF2E54','#FF9004'];
  var STEPS  = 120;

  function angularDist(a, b) {
    var ax = ll2xyz(a.lat, a.lng), bx = ll2xyz(b.lat, b.lng);
    var dot = ax.x*bx.x + ax.y*bx.y + ax.z*bx.z;
    return Math.acos(Math.max(-1, Math.min(1, dot)));
  }

  function arcPoints(ca, cb) {
    var a = ll2xyz(ca.lat, ca.lng), b = ll2xyz(cb.lat, cb.lng);
    var pts = new Array(STEPS + 1);
    for (var s = 0; s <= STEPS; s++) {
      var t    = s / STEPS;
      var lift = 1 + 0.20 * Math.sin(Math.PI * t);
      var ix = a.x*(1-t) + b.x*t;
      var iy = a.y*(1-t) + b.y*t;
      var iz = a.z*(1-t) + b.z*t;
      var len = Math.sqrt(ix*ix + iy*iy + iz*iz) || 1;
      pts[s] = { x: ix/len*lift, y: iy/len*lift, z: iz/len*lift };
    }
    return pts;
  }

  var arcs = [];
  var used = {};
  for (var ci = 0; ci < CITIES.length; ci++) {
    var dists = [];
    for (var cj = 0; cj < CITIES.length; cj++) {
      if (ci === cj) continue;
      dists.push({ idx: cj, d: angularDist(CITIES[ci], CITIES[cj]) });
    }
    dists.sort(function(a,b) { return a.d - b.d; });
    var cnt = 0;
    for (var ck = 0; ck < dists.length && cnt < 3; ck++) {
      var key = Math.min(ci, dists[ck].idx) + '_' + Math.max(ci, dists[ck].idx);
      if (!used[key]) {
        used[key] = true;
        /* phase: 0=draw 1=hold 2=retract — stagger with random delay */
        var drawDur   = 1800 + Math.random() * 1400;
        var holdDur   = 600  + Math.random() * 800;
        var retractDur= 1400 + Math.random() * 1200;
        var totalDur  = drawDur + holdDur + retractDur;
        arcs.push({
          pts3d:      arcPoints(CITIES[ci], CITIES[dists[ck].idx]),
          head:       0,
          tail:       0,
          phase:      'draw',
          phaseT:     0,
          delay:      Math.random() * totalDur,
          drawDur:    drawDur,
          holdDur:    holdDur,
          retractDur: retractDur,
          started:    false,
          color:      COLORS[(ci * 3 + ck) % 4]
        });
        cnt++;
      }
    }
  }

  /* ---- Rotation ---- */
  var rotY = 0.3, rotX = -0.1, velY = 0.012, velX = 0;
  var isOver = false, lastMouse = {x:0,y:0};
  var mousePos = {x:-9999,y:-9999}, hoveredIdx = -1;

  canvas.style.cursor = 'none';

  canvas.addEventListener('mouseenter', function(e) {
    isOver = true;
    lastMouse = {x:e.clientX, y:e.clientY};
  });
  canvas.addEventListener('mouseleave', function() {
    isOver = false;
    mousePos = {x:-9999,y:-9999};
    tooltip.classList.remove('visible');
  });
  window.addEventListener('mousemove', function(e) {
    var rect = canvas.getBoundingClientRect();
    mousePos = {x: e.clientX-rect.left, y: e.clientY-rect.top};
    tooltip.style.left = (mousePos.x+14)+'px';
    tooltip.style.top  = (mousePos.y-10)+'px';
    if (isOver) {
      var dx = e.clientX - lastMouse.x;
      var dy = e.clientY - lastMouse.y;
      velY += dx * 0.0015;
      velX += dy * 0.0015;
      var MAX_VEL = 0.018;
      if (velY >  MAX_VEL) velY =  MAX_VEL;
      if (velY < -MAX_VEL) velY = -MAX_VEL;
      if (velX >  MAX_VEL) velX =  MAX_VEL;
      if (velX < -MAX_VEL) velX = -MAX_VEL;
    }
    lastMouse = {x:e.clientX, y:e.clientY};
  });

  function rot(p) {
    var x=p.x, y=p.y, z=p.z;
    var cy_=Math.cos(rotY), sy_=Math.sin(rotY);
    var x1= x*cy_+z*sy_, z1=-x*sy_+z*cy_;
    x=x1; z=z1;
    var cx_=Math.cos(rotX), sx_=Math.sin(rotX);
    return {x:x, y:y*cx_-z*sx_, z:y*sx_+z*cx_};
  }

  function proj(p) {
    return {sx: cx+p.x*R, sy: cy-p.y*R, z: p.z};
  }

  var lastTs = 0;

  function draw(ts) {
    requestAnimationFrame(draw);
    var dt = Math.min(ts - lastTs, 50);
    lastTs = ts;

    if (!isOver) {
      velY += (0.012 - velY) * 0.03;
      velX += (0 - velX) * 0.05;
    }
    velY *= 0.93; velX *= 0.93;
    rotY += velY;
    rotX = Math.max(-0.5, Math.min(0.5, rotX + velX));

    ctx.clearRect(0, 0, SIZE, SIZE);

    /* Sphere background */
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI*2);
    ctx.fillStyle = '#0A0A12';
    ctx.fill();

    /* Land dots — clip only for dots so they don't bleed outside sphere */
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI*2);
    ctx.clip();
    var DR = Math.max(1.8, R/55);
    for (var i=0; i<dots.length; i++) {
      var rp = rot(dots[i]);
      if (rp.z < 0) continue;
      var p2 = proj(rp);
      ctx.beginPath();
      ctx.arc(p2.sx, p2.sy, DR, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(190,190,190,'+(0.20+rp.z*0.48).toFixed(2)+')';
      ctx.fill();
    }
    ctx.restore();
    /* Arcs are drawn WITHOUT clip — they can extend beyond sphere edge */

    /* Arcs */
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    function easeInOut(t) {
      return t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    }

    for (var a=0; a<arcs.length; a++) {
      var arc = arcs[a];

      /* Staggered start */
      if (!arc.started) {
        arc.delay -= dt;
        if (arc.delay > 0) continue;
        arc.started = true;
      }

      /* Advance phase timer */
      arc.phaseT += dt;

      if (arc.phase === 'draw') {
        arc.head = easeInOut(Math.min(1, arc.phaseT / arc.drawDur));
        arc.tail = 0;
        if (arc.phaseT >= arc.drawDur) {
          arc.head = 1; arc.tail = 0;
          arc.phase = 'hold'; arc.phaseT = 0;
        }
      } else if (arc.phase === 'hold') {
        arc.head = 1; arc.tail = 0;
        if (arc.phaseT >= arc.holdDur) {
          arc.phase = 'retract'; arc.phaseT = 0;
        }
      } else if (arc.phase === 'retract') {
        arc.head = 1;
        arc.tail = easeInOut(Math.min(1, arc.phaseT / arc.retractDur));
        if (arc.phaseT >= arc.retractDur) {
          arc.head = 0; arc.tail = 0;
          arc.phase = 'draw'; arc.phaseT = 0;
        }
      }

      /* Skip if nothing to draw */
      if (arc.head <= arc.tail) continue;

      /* Project 3D points */
      var rp2d = new Array(STEPS+1);
      for (var s=0; s<=STEPS; s++) {
        var r2 = rot(arc.pts3d[s]);
        var pr = proj(r2);
        rp2d[s] = {sx:pr.sx, sy:pr.sy, z:r2.z};
      }

      var iHead = Math.round(arc.head * STEPS);
      var iTail = Math.round(arc.tail * STEPS);

      /* Draw visible segment tail→head piece by piece with brightness gradient */
      for (var sp=iTail; sp<iHead; sp++) {
        var i0 = sp, i1 = sp + 1;
        if (i1 > STEPS) break;
        if (rp2d[i0].z < -0.15 || rp2d[i1].z < -0.15) continue;
        /* frac: 0 at tail, 1 at head */
        var frac = (sp - iTail) / Math.max(1, iHead - iTail);
        ctx.globalAlpha = 0.18 + frac * 0.78;
        ctx.strokeStyle = arc.color;
        ctx.lineWidth   = 1.2 + frac * 2.0;
        ctx.beginPath();
        ctx.moveTo(rp2d[i0].sx, rp2d[i0].sy);
        ctx.lineTo(rp2d[i1].sx, rp2d[i1].sy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      /* Bright dot at head */
      if (iHead <= STEPS && rp2d[iHead].z > -0.15) {
        ctx.beginPath();
        ctx.arc(rp2d[iHead].sx, rp2d[iHead].sy, 2.8, 0, Math.PI*2);
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    /* City squares */
    hoveredIdx = -1;
    var SQ = Math.max(5.5, R/32);
    var mProj = [];
    for (var j=0; j<CITIES.length; j++) {
      var rp3 = rot(ll2xyz(CITIES[j].lat, CITIES[j].lng));
      var pr3 = proj(rp3);
      mProj.push({sx:pr3.sx, sy:pr3.sy, z:rp3.z, idx:j});
    }
    mProj.sort(function(a,b){return b.z-a.z;});

    for (var m=0; m<mProj.length; m++) {
      var it = mProj[m];
      if (it.z < 0) continue;
      var al = (0.4 + it.z*0.6).toFixed(2);
      var isH = Math.abs(mousePos.x-it.sx)<SQ && Math.abs(mousePos.y-it.sy)<SQ;
      if (isH) hoveredIdx = it.idx;
      ctx.globalAlpha = parseFloat(al);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = isH ? 1.5 : 0.8;
      ctx.strokeRect(it.sx-SQ/2, it.sy-SQ/2, SQ, SQ);
      ctx.globalAlpha = 1;
    }

    if (hoveredIdx >= 0) {
      tooltip.textContent = CITIES[hoveredIdx].name;
      tooltip.classList.add('visible');
    } else {
      tooltip.classList.remove('visible');
    }
  }

  requestAnimationFrame(draw);
})();
