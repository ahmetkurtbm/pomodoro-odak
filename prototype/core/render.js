var Holo = Holo || {};

// Tel kafes hologram çizici. Yalnızca temel canvas 2D çağrılarını kullanır
// (beginPath, moveTo, lineTo, stroke) ki saatin canvas'ına taşınabilsin.
// Derinlik hissi: çizgiler uzaklığa göre BUCKETS gruba ayrılır, uzaktakiler sönük çizilir.
// style: { colors[BUCKETS], glowColors?[BUCKETS], width, glowWidth, rowStep, colStep } — 0 = en yakın
Holo.Render = (function () {
  var BUCKETS = 4;
  var sx = [], sy = [], sd = [];

  function project(mesh, view) {
    var pts = mesh.pts, n = mesh.nu * mesh.nv;
    var cyw = Math.cos(view.yaw), syw = Math.sin(view.yaw);
    var cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
    var inv = 1 / view.radius, D = view.dist, i, x, y, z, x1, y1, y2, z2, f;
    for (i = 0; i < n; i++) {
      x = (pts[i * 3] - view.ox) * inv;
      y = (pts[i * 3 + 1] - view.oy) * inv;
      z = (pts[i * 3 + 2] - view.oz) * inv;
      x1 = x * cyw - y * syw;
      y1 = x * syw + y * cyw;
      y2 = y1 * cp - z * sp;   // derinlik (büyük = uzak)
      z2 = y1 * sp + z * cp;   // ekranda yukarı
      f = D / (D + y2);
      sx[i] = view.cx + x1 * f * view.scale;
      sy[i] = view.cy - z2 * f * view.scale;
      sd[i] = y2;
    }
  }

  // 0, step, 2*step ... ve her zaman son indeks
  function lineIndices(n, step) {
    var out = [], i;
    for (i = 0; i < n; i += step) out.push(i);
    if (out[out.length - 1] !== n - 1) out.push(n - 1);
    return out;
  }

  function draw(ctx, mesh, view, style) {
    project(mesh, view);
    var nu = mesh.nu, nv = mesh.nv, buckets = [], b, i, j, k;
    for (b = 0; b < BUCKETS; b++) buckets.push([]);

    function seg(p, q) {
      if (sx[p] !== sx[p] || sx[q] !== sx[q]) return; // NaN
      k = Math.floor(((sd[p] + sd[q]) * 0.5 + 1) * 0.5 * BUCKETS);
      if (k < 0) k = 0; else if (k >= BUCKETS) k = BUCKETS - 1;
      buckets[k].push(p, q);
    }

    var rows = lineIndices(nv, style.rowStep), cols = lineIndices(nu, style.colStep);
    for (j = 0; j < rows.length; j++) {
      var base = rows[j] * nu;
      for (i = 0; i < nu - 1; i++) seg(base + i, base + i + 1);
    }
    for (i = 0; i < cols.length; i++) {
      for (j = 0; j < nv - 1; j++) seg(j * nu + cols[i], (j + 1) * nu + cols[i]);
    }

    // uzaktan yakına doğru çiz, yakındakiler üstte kalsın
    for (b = BUCKETS - 1; b >= 0; b--) {
      var list = buckets[b];
      if (!list.length) continue;
      ctx.beginPath();
      for (k = 0; k < list.length; k += 2) {
        ctx.moveTo(sx[list[k]], sy[list[k]]);
        ctx.lineTo(sx[list[k + 1]], sy[list[k + 1]]);
      }
      // renkler dışarıdan gelir: saatin canvas'ı yarı saydamlığı desteklemeyebilir
      if (style.glowColors) {
        ctx.lineWidth = style.glowWidth;
        ctx.strokeStyle = style.glowColors[b];
        ctx.stroke();
      }
      ctx.lineWidth = style.width;
      ctx.strokeStyle = style.colors[b];
      ctx.stroke();
    }
  }

  return { draw: draw };
})();
