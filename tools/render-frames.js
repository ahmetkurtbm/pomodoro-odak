// Hazır cisimlerin dönüşünü kare kare çizgi listesine çevirir (JSON).
// Saatin canvas'ı tekrarlı çizimde bellek sızdırdığı için hologram saatte
// resim dizisi olarak gösterilir; çizgiler burada hesaplanır, PNG'yi
// tools/frames-to-png.py üretir.
// Kullanım: node tools/render-frames.js <çıktı.json>

var fs = require('fs');
var path = require('path');
var vm = require('vm');

// 37 nokta -> 10 derecelik aralık; her 3 çizgide bir -> 30 derecelik tel kafes
var NU = 37, NV = 37, STEP = 3;
var PITCH = 0.45, DIST = 3.2;
var PI = Math.PI;

// Saat her resmi ham bitmap'e çevirir (kare başına ~100 KB), bu yüzden kareler az olmalı.
// Dönüş simetrisi kullanılır: cisim "period" kadar dönünce kendisiyle aynı görünür,
// o aralığı çizmek kesintisiz bir döngü verir.
// gallery: Shapes.GALLERY'deki ad; slug saatte klasör adıdır (ASCII).
var PICK = [
  { gallery: 'Küp', slug: 'kup', period: PI / 2, frames: 6 },
  { gallery: 'Koni', slug: 'koni', period: PI / 6, frames: 3 },
  { gallery: 'Piramit', slug: 'piramit', period: PI / 2, frames: 6 },
  { gallery: 'Küre', slug: 'kure', period: PI / 6, frames: 3 },
  { gallery: 'Simit', slug: 'simit', period: PI / 6, frames: 3 },
  { gallery: 'Vazo', slug: 'vazo', period: PI / 6, frames: 3 },
  { gallery: 'Burgulu kule', slug: 'kule', period: PI / 2, frames: 6 },
  { gallery: 'Süper elipsoid', slug: 'elipsoid', period: PI / 2, frames: 6 },
  { gallery: 'Möbius şeridi', slug: 'mobius', period: 2 * PI, frames: 10 },
  { gallery: 'Klein şişesi', slug: 'klein', period: 2 * PI, frames: 10 }
];

var core = path.join(__dirname, '..', 'prototype', 'core');
var ctx = { Math: Math, isFinite: isFinite, Error: Error };
vm.createContext(ctx);
['expr', 'surface', 'shapes'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(core, f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
});
var Holo = ctx.Holo;

function lineIndices(n, step) {
  var out = [], i;
  for (i = 0; i < n; i += step) out.push(i);
  if (out[out.length - 1] !== n - 1) out.push(n - 1);
  return out;
}

// render.js ile aynı izdüşüm; ekran koordinatları -1..1, derinlik d (büyük = uzak)
function frame(mesh, fit, yaw) {
  var n = mesh.nu * mesh.nv, sx = [], sy = [], sd = [], i;
  var cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(PITCH), sp = Math.sin(PITCH);
  for (i = 0; i < n; i++) {
    var x = (mesh.pts[i * 3] - fit.ox) / fit.r;
    var y = (mesh.pts[i * 3 + 1] - fit.oy) / fit.r;
    var z = (mesh.pts[i * 3 + 2] - fit.oz) / fit.r;
    var x1 = x * cyw - y * syw, y1 = x * syw + y * cyw;
    var y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
    var f = DIST / (DIST + y2);
    sx[i] = x1 * f; sy[i] = -z2 * f; sd[i] = y2;
  }
  var segs = [];
  function seg(p, q) {
    if (sx[p] !== sx[p] || sx[q] !== sx[q]) return;
    segs.push([sx[p], sy[p], sx[q], sy[q], (sd[p] + sd[q]) / 2]);
  }
  var rows = lineIndices(mesh.nv, STEP), cols = lineIndices(mesh.nu, STEP), j, base;
  for (j = 0; j < rows.length; j++) {
    base = rows[j] * mesh.nu;
    for (i = 0; i < mesh.nu - 1; i++) seg(base + i, base + i + 1);
  }
  for (i = 0; i < cols.length; i++) {
    for (j = 0; j < mesh.nv - 1; j++) seg(j * mesh.nu + cols[i], (j + 1) * mesh.nu + cols[i]);
  }
  return segs;
}

var shapes = PICK.map(function (p) {
  var g = Holo.Shapes.GALLERY.filter(function (x) { return x.name === p.gallery; })[0];
  if (!g) throw new Error('galeride yok: ' + p.gallery);
  var built = g.formula ? Holo.Shapes.buildFormula(g.formula) : Holo.Shapes.build(g.profile, g.op, g.params);
  var prog = Holo.Surface.compile(built.text, {});
  var mesh = Holo.Surface.sample(prog, built.params, NU, NV);
  var fit = Holo.Surface.bounds(mesh);
  var frames = [], f;
  // son eleman (period kadar dönmüş hali) yalnızca döngü kontrolü içindir, saate gitmez
  for (f = 0; f <= p.frames; f++) frames.push(frame(mesh, fit, 0.6 + f * p.period / p.frames));
  return { id: p.slug, name: g.name, period: p.period, frames: frames };
});

var out = process.argv[2] || 'frames.json';
fs.writeFileSync(out, JSON.stringify({ shapes: shapes }));
var total = shapes.reduce(function (n, s) { return n + s.frames.length - 1; }, 0);
console.log(shapes.length + ' cisim, ' + total + ' kare -> ' + out);
