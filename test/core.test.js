// Hologram çekirdeği (prototype/core) ve saate giden kodun saatin kısıtlarına uyması.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const CORE = path.join(ROOT, 'prototype', 'core');
const WATCH_JS = path.join(ROOT, 'watch', 'entry', 'src', 'main', 'js', 'MainAbility');

function loadCore() {
  const ctx = { Math, isFinite, Error };
  vm.createContext(ctx);
  for (const f of ['expr', 'surface', 'shapes', 'render', 'gesture']) {
    vm.runInContext(fs.readFileSync(path.join(CORE, f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
  }
  return ctx.Holo;
}

function walk(dir, ext, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

test('15 hazır cismin hepsi derlenir ve sonlu noktalar üretir', () => {
  const Holo = loadCore();
  assert.equal(Holo.Shapes.GALLERY.length, 15);
  for (const g of Holo.Shapes.GALLERY) {
    const b = g.formula ? Holo.Shapes.buildFormula(g.formula) : Holo.Shapes.build(g.profile, g.op, g.params);
    const prog = Holo.Surface.compile(b.text, { fx: () => 0, fy: () => 0 });
    const mesh = Holo.Surface.sample(prog, b.params, 12, 12);
    const finite = mesh.pts.filter((x) => x === x).length;
    assert.equal(finite, mesh.pts.length, g.name);
  }
});

test('formül dili: yorum, boşluk ve hatalar', () => {
  const { Surface } = loadCore();
  assert.doesNotThrow(() => Surface.compile('u: 0 .. 2*pi\n  x = cos(u)   # yorum\ny=sin(u)\nz = 0.5u'));
  assert.doesNotThrow(() => Surface.compile('u:0..1\nx=u\ny=u\nz=u'));
  assert.throws(() => Surface.compile('u: 0 .. 1\nx u\ny=1\nz=1'), /2\. satır/);
  assert.throws(() => Surface.compile('u: 0 .. 1\na = 2\nx=1\ny=1\nz=1'), /değiştirilemez/);
  assert.throws(() => Surface.compile('x=1\ny=1\nz=1'), /u aralığı eksik/);
  assert.throws(() => Surface.compile('u: 0 .. 1\nx=1\ny=1'), /x, y ve z/);
});

test('ifade ayrıştırıcı: öncelik, örtük çarpma, mod', () => {
  const { Expr } = loadCore();
  const slots = { u: 0 };
  const f = (src) => Expr.compile(src, (n) => (n in slots ? slots[n] : -1))([3]);
  assert.equal(f('1 + 2 * 3'), 7);
  assert.equal(f('2^3^2'), 512);
  assert.equal(f('2u'), 6);
  assert.equal(f('-7 % 3'), 2);
  assert.ok(Math.abs(f('sin(pi/2)') - 1) < 1e-12);
});

// GT 6'nın JavaScript motoru regex desteklemiyor: kurulum "34. Internal error" ile düşer.
test('saate giden JavaScript regex içermez', () => {
  const files = walk(WATCH_JS, '.js');
  assert.ok(files.length > 5);
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8').replace(/\/\/.*$/mg, '').replace(/'(?:\\.|[^'\\])*'/g, "''");
    assert.ok(!/RegExp|\.(match|test|search)\(\/|\.replace\(\s*\/|[=(,:]\s*\/[^/*\s][^/]*\/[gimsuy]*[.,;)\s]/.test(src), path.relative(ROOT, f));
  }
});

// Canvas tekrarlı çizimde bellek sızdırıp saati çökertiyor; sayfalar canvas kullanmaz.
test('saat sayfaları canvas kullanmaz', () => {
  for (const f of walk(path.join(WATCH_JS, 'pages'), '.hml').concat(walk(path.join(WATCH_JS, 'pages'), '.js'))) {
    const src = fs.readFileSync(f, 'utf8');
    assert.ok(!/<canvas|getContext\(/.test(src), path.relative(ROOT, f));
  }
});

// Derleyici class="{{...}}" bağlamayı reddediyor.
test('hml dosyalarında sınıf veriye bağlanmaz', () => {
  for (const f of walk(path.join(WATCH_JS, 'pages'), '.hml')) {
    assert.ok(!/class="[^"]*\{\{/.test(fs.readFileSync(f, 'utf8')), path.relative(ROOT, f));
  }
});

function pngSize(file) {
  const b = fs.readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

// Simgeler eksik ya da yanlış boyuttaysa kurulum "40. Invalid configuration file format" verir.
test('uygulama simgeleri 104 ve 92 piksel', () => {
  const media = path.join(ROOT, 'watch', 'entry', 'src', 'main', 'resources', 'base', 'media');
  assert.deepEqual(pngSize(path.join(media, 'icon.png')), [104, 104]);
  assert.deepEqual(pngSize(path.join(media, 'icon_small.png')), [92, 92]);
});

test('config.json sayfaları gerçekten var', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'watch', 'entry', 'src', 'main', 'config.json'), 'utf8'));
  for (const p of cfg.module.js[0].pages) {
    for (const ext of ['.hml', '.css', '.js']) {
      assert.ok(fs.existsSync(path.join(WATCH_JS, p + ext)), p + ext);
    }
  }
});

test('hologram sayfasının istediği her kare dosyası var', () => {
  const src = fs.readFileSync(path.join(WATCH_JS, 'pages', 'holo', 'index.js'), 'utf8');
  const shapes = [...src.matchAll(/id: '([a-z]+)', name: '[^']+', frames: (\d+)/g)];
  assert.equal(shapes.length, 10);
  for (const [, id, n] of shapes) {
    for (let i = 0; i < Number(n); i++) {
      assert.ok(fs.existsSync(path.join(WATCH_JS, 'common', 'frames', id, i + '.png')), id + '/' + i);
    }
  }
});
