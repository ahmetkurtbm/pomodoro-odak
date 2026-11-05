// OTOMATİK ÜRETİLDİ — kaynak: prototype/core/gesture.js (node tools/sync-core.js)
import Holo from './holo.js';

// Çizimi işleme: eşit aralıklı yeniden örnekleme, daire/çizgi tanıma ve
// profil koordinatlarına normalleştirme. Şimdilik dokunmatik çizimle çalışır;
// sonraki aşamada aynı fonksiyonlar bilek sensöründen gelen izi işleyecek.
Holo.Gesture = (function () {
  var SAMPLES = 64;

  function dist(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function pathLength(pts) {
    var L = 0;
    for (var i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
    return L;
  }

  // Yolu n eşit uzunluklu parçaya böl
  function resample(pts, n) {
    var interval = pathLength(pts) / (n - 1), acc = 0;
    var src = pts.slice(), out = [src[0]], i, d, t, q;
    for (i = 1; i < src.length; i++) {
      d = dist(src[i - 1], src[i]);
      if (acc + d >= interval && d > 0) {
        t = (interval - acc) / d;
        q = { x: src[i - 1].x + t * (src[i].x - src[i - 1].x), y: src[i - 1].y + t * (src[i].y - src[i - 1].y) };
        out.push(q);
        src.splice(i, 0, q);
        acc = 0;
      } else {
        acc += d;
      }
    }
    while (out.length < n) out.push(src[src.length - 1]);
    return out.slice(0, n);
  }

  function analyze(raw) {
    if (raw.length < 6) return null;
    var L = pathLength(raw);
    if (L < 20) return null;
    var pts = resample(raw, SAMPLES), i;

    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (i = 0; i < pts.length; i++) {
      if (pts[i].x < minX) minX = pts[i].x; if (pts[i].x > maxX) maxX = pts[i].x;
      if (pts[i].y < minY) minY = pts[i].y; if (pts[i].y > maxY) maxY = pts[i].y;
    }
    var size = Math.max(maxX - minX, maxY - minY) || 1;
    var closed = dist(pts[0], pts[pts.length - 1]) < 0.25 * size;
    var kind = 'serbest';

    if (closed) {
      // yarıçap neredeyse sabitse daire
      var cx = 0, cy = 0, mean = 0, varr = 0, r;
      for (i = 0; i < pts.length; i++) { cx += pts[i].x; cy += pts[i].y; }
      cx /= pts.length; cy /= pts.length;
      var radii = [];
      for (i = 0; i < pts.length; i++) { r = dist(pts[i], { x: cx, y: cy }); radii.push(r); mean += r; }
      mean /= radii.length;
      for (i = 0; i < radii.length; i++) varr += (radii[i] - mean) * (radii[i] - mean);
      if (Math.sqrt(varr / radii.length) / mean < 0.12) kind = 'daire';
    } else {
      // uç noktaları birleştiren doğrudan en büyük sapma küçükse çizgi
      var a = pts[0], b = pts[pts.length - 1], len = dist(a, b) || 1, maxDev = 0, dev;
      for (i = 0; i < pts.length; i++) {
        dev = Math.abs((b.x - a.x) * (a.y - pts[i].y) - (a.x - pts[i].x) * (b.y - a.y)) / len;
        if (dev > maxDev) maxDev = dev;
      }
      if (maxDev / L < 0.06) kind = 'cizgi';
    }

    // profil koordinatları: y yukarı; açık profil eksenin sağında başlar (döndürme için)
    var s = 2 / size, midX = (minX + maxX) / 2, midY = (minY + maxY) / 2, out = [];
    for (i = 0; i < pts.length; i++) {
      out.push([closed ? (pts[i].x - midX) * s : (pts[i].x - minX) * s, -(pts[i].y - midY) * s]);
    }
    if (closed) out.push(out[0]);

    return { kind: kind, closed: closed, pts: out };
  }

  // u ∈ [0, 1] için doğrusal ara değer: formüldeki fx(u), fy(u)
  function lookup(pts) {
    var n = pts.length;
    function interp(u, axis) {
      if (!(u > 0)) return pts[0][axis];
      if (u >= 1) return pts[n - 1][axis];
      var f = u * (n - 1), i = Math.floor(f), t = f - i;
      return pts[i][axis] * (1 - t) + pts[i + 1][axis] * t;
    }
    return {
      fx: function (u) { return interp(u, 0); },
      fy: function (u) { return interp(u, 1); }
    };
  }

  // Henüz çizim yokken serbest profil daire gibi davranır
  function defaultLookup() {
    var pts = [];
    for (var i = 0; i <= SAMPLES; i++) {
      var t = 2 * Math.PI * i / SAMPLES;
      pts.push([Math.cos(t), Math.sin(t)]);
    }
    return lookup(pts);
  }

  return { analyze: analyze, lookup: lookup, defaultLookup: defaultLookup };
})();

export default Holo.Gesture;
