// OTOMATİK ÜRETİLDİ — kaynak: prototype/core/surface.js (node tools/sync-core.js)
import Holo from './holo.js';
import './expr.js';

// Formül programı: her satır "ad = ifade" ya da "u: başla .. bitir".
// Program (u, v) çiftini (x, y, z) noktasına çevirir; ızgara halinde örneklenir.
Holo.Surface = (function () {
  var Expr = Holo.Expr;
  var PARAMS = ['a', 'b', 'c', 'd', 'k'];

  // Saatin JavaScript motoru (JerryScript) regex desteği olmadan gelebilir:
  // satırlar elle ayrıştırılır.
  function isSpace(ch) { return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n'; }

  function trim(s) {
    var a = 0, b = s.length;
    while (a < b && isSpace(s.charAt(a))) a++;
    while (b > a && isSpace(s.charAt(b - 1))) b--;
    return s.slice(a, b);
  }

  function isIdentChar(ch, first) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' ||
      (!first && ch >= '0' && ch <= '9');
  }

  // "u: başla .. bitir" -> [ad, başla, bitir] ya da null
  function parseRange(line) {
    var ch = line.charAt(0);
    if (ch !== 'u' && ch !== 'v') return null;
    var rest = trim(line.slice(1));
    if (rest.charAt(0) !== ':') return null;
    rest = rest.slice(1);
    var dots = rest.indexOf('..');
    if (dots < 0) return null;
    var from = trim(rest.slice(0, dots)), to = trim(rest.slice(dots + 2));
    if (!from || !to) return null;
    return [ch, from, to];
  }

  // "ad = ifade" -> [ad, ifade] ya da null
  function parseAssign(line) {
    var i = 0;
    if (!isIdentChar(line.charAt(0), true)) return null;
    while (i < line.length && isIdentChar(line.charAt(i), i === 0)) i++;
    var name = line.slice(0, i), rest = trim(line.slice(i));
    if (rest.charAt(0) !== '=') return null;
    var expr = trim(rest.slice(1));
    return expr ? [name, expr] : null;
  }

  function compile(text, extraFuncs) {
    // env yuvaları: 0 = u, 1 = v, 2.. = parametreler, sonra kullanıcı değişkenleri
    var slots = { u: 0, v: 1 }, next = 2, i;
    for (i = 0; i < PARAMS.length; i++) slots[PARAMS[i]] = next++;
    var paramCount = next;

    function resolveAll(n) { return slots.hasOwnProperty(n) ? slots[n] : -1; }
    function resolveParams(n) { var s = resolveAll(n); return s >= 2 && s < paramCount ? s : -1; }

    var steps = [], ranges = {}, lines = text.split('\n');
    for (i = 0; i < lines.length; i++) {
      var raw = lines[i], hash = raw.indexOf('#');
      if (hash >= 0) raw = raw.slice(0, hash);
      raw = trim(raw);
      if (!raw) continue;
      try {
        var m = parseRange(raw);
        if (m) {
          ranges[m[0]] = [Expr.compile(m[1], resolveParams, extraFuncs), Expr.compile(m[2], resolveParams, extraFuncs)];
          continue;
        }
        m = parseAssign(raw);
        if (!m) throw new Error("'ad = ifade' ya da 'u: 0 .. 1' biçiminde olmalı");
        var name = m[0];
        if (slots.hasOwnProperty(name) && slots[name] < paramCount) throw new Error("'" + name + "' değiştirilemez");
        if (Expr.CONSTS.hasOwnProperty(name)) throw new Error("'" + name + "' sabit, değişken adı olamaz");
        var fn = Expr.compile(m[1], resolveAll, extraFuncs);
        if (!slots.hasOwnProperty(name)) slots[name] = next++;
        steps.push({ slot: slots[name], fn: fn });
      } catch (e) {
        throw new Error((i + 1) + '. satır: ' + e.message);
      }
    }

    if (!slots.hasOwnProperty('x') || !slots.hasOwnProperty('y') || !slots.hasOwnProperty('z')) {
      throw new Error('x, y ve z tanımlanmalı');
    }
    if (!ranges.u) throw new Error("u aralığı eksik (ör. 'u: 0 .. 2*pi')");
    if (!ranges.v) ranges.v = [Expr.compile('0', resolveParams), Expr.compile('1', resolveParams)];

    return { steps: steps, size: next, xs: slots.x, ys: slots.y, zs: slots.z, ranges: ranges };
  }

  // nu × nv ızgara; nokta (i, j) -> pts[(j * nu + i) * 3 ...]
  function sample(prog, params, nu, nv) {
    var env = [], i, j, s;
    for (i = 0; i < prog.size; i++) env.push(0);
    for (i = 0; i < PARAMS.length; i++) env[2 + i] = params[PARAMS[i]] || 0;

    var u0 = prog.ranges.u[0](env), u1 = prog.ranges.u[1](env);
    var v0 = prog.ranges.v[0](env), v1 = prog.ranges.v[1](env);
    var steps = prog.steps, n = steps.length;
    var pts = new Array(nu * nv * 3), p = 0, x, y, z;

    for (j = 0; j < nv; j++) {
      env[1] = v0 + (v1 - v0) * j / (nv - 1);
      for (i = 0; i < nu; i++) {
        env[0] = u0 + (u1 - u0) * i / (nu - 1);
        for (s = 0; s < n; s++) env[steps[s].slot] = steps[s].fn(env);
        x = env[prog.xs]; y = env[prog.ys]; z = env[prog.zs];
        // sonsuz/tanımsız noktalar NaN olarak işaretlenir, çizici atlar
        if (!isFinite(x) || !isFinite(y) || !isFinite(z)) { x = y = z = NaN; }
        pts[p++] = x; pts[p++] = y; pts[p++] = z;
      }
    }
    return { pts: pts, nu: nu, nv: nv };
  }

  // Cismi ekrana sığdırmak için merkez ve yarıçap
  function bounds(mesh) {
    var pts = mesh.pts, i, minX = Infinity, minY = Infinity, minZ = Infinity;
    var maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (i = 0; i < pts.length; i += 3) {
      if (pts[i] !== pts[i]) continue;
      if (pts[i] < minX) minX = pts[i]; if (pts[i] > maxX) maxX = pts[i];
      if (pts[i + 1] < minY) minY = pts[i + 1]; if (pts[i + 1] > maxY) maxY = pts[i + 1];
      if (pts[i + 2] < minZ) minZ = pts[i + 2]; if (pts[i + 2] > maxZ) maxZ = pts[i + 2];
    }
    if (minX === Infinity) return { ox: 0, oy: 0, oz: 0, r: 1 };
    var ox = (minX + maxX) / 2, oy = (minY + maxY) / 2, oz = (minZ + maxZ) / 2, r = 0;
    for (i = 0; i < pts.length; i += 3) {
      if (pts[i] !== pts[i]) continue;
      var dx = pts[i] - ox, dy = pts[i + 1] - oy, dz = pts[i + 2] - oz;
      var d = dx * dx + dy * dy + dz * dz;
      if (d > r) r = d;
    }
    return { ox: ox, oy: oy, oz: oz, r: Math.sqrt(r) || 1 };
  }

  return { compile: compile, sample: sample, bounds: bounds, PARAMS: PARAMS };
})();

export default Holo.Surface;
