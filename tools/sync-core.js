// prototype/core/*.js dosyalarını saat projesine ES modülü olarak kopyalar.
// Tek kaynak prototype/core; saat tarafındaki common/holo dosyalarını elle düzenleme.
// Kullanım: node tools/sync-core.js

var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var src = path.join(root, 'prototype', 'core');
var dst = path.join(root, 'watch', 'entry', 'src', 'main', 'js', 'MainAbility', 'common', 'holo');

// dosya -> [Holo üzerindeki adı, bağımlılıkları]
var MODULES = {
  'expr.js': ['Expr', []],
  'surface.js': ['Surface', ['expr.js']],
  'shapes.js': ['Shapes', []],
  'render.js': ['Render', []],
  'gesture.js': ['Gesture', []]
};

var HEADER = 'var Holo = Holo || {};';

fs.mkdirSync(dst, { recursive: true });
fs.writeFileSync(path.join(dst, 'holo.js'),
  '// OTOMATİK ÜRETİLDİ (node tools/sync-core.js): modüllerin paylaştığı ad alanı\nexport default {};\n');

var index = ['// OTOMATİK ÜRETİLDİ (node tools/sync-core.js)', "import Holo from './holo.js';"];

Object.keys(MODULES).forEach(function (file) {
  var name = MODULES[file][0], deps = MODULES[file][1];
  var body = fs.readFileSync(path.join(src, file), 'utf8').replace(/\r\n/g, '\n');
  if (body.indexOf(HEADER) !== 0) throw new Error(file + ": '" + HEADER + "' ile başlamalı");
  body = body.slice(HEADER.length).replace(/^\n+/, '');

  var out = ['// OTOMATİK ÜRETİLDİ — kaynak: prototype/core/' + file + ' (node tools/sync-core.js)',
    "import Holo from './holo.js';"];
  deps.forEach(function (d) { out.push("import './" + d + "';"); });
  out.push('', body.replace(/\n+$/, ''), '', 'export default Holo.' + name + ';', '');
  fs.writeFileSync(path.join(dst, file), out.join('\n'));
  index.push("import './" + file + "';");
  console.log('✓ ' + file);
});

index.push('', 'export default Holo;', '');
fs.writeFileSync(path.join(dst, 'index.js'), index.join('\n'));
console.log('✓ index.js');
