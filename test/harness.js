// Saat uygulamasının motorunu Node'da çalıştırır. Saatin parçaları (@system.storage,
// @system.vibrator, @system.brightness), saat ve zamanlayıcılar taklit edilir.
// Her watch() çağrısı yeni bir "uygulama açılışı"dır; aynı disk verilirse kayıt korunur.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const COMMON = path.join(__dirname, '..', 'watch', 'entry', 'src', 'main', 'js', 'MainAbility', 'common');

function moduleBody(file, name) {
  return fs.readFileSync(path.join(COMMON, file), 'utf8')
    .replace(/^import .*$/mg, '')
    .replace('export default', 'var ' + name + ' =');
}

const SOURCE = moduleBody('store.js', 'store') + '\n' + moduleBody('engine.js', 'engine') + '\nmodule.exports = engine;';

// clock: { now } paylaşılan sahte saat; disk: anahtar -> değer
function watch(clock, disk) {
  const timers = [];
  const log = { buzz: [], screen: [] };
  const RealDate = Date;
  function FakeDate(t) { return t === undefined ? new RealDate(clock.now) : new RealDate(t); }
  const ctx = {
    module: {},
    Math, Object, parseInt, parseFloat,
    Date: FakeDate,
    setInterval(fn, ms) { timers.push({ fn, ms, at: clock.now + ms, id: timers.length + 1 }); return timers.length; },
    clearInterval(id) { timers.forEach((t) => { if (t.id === id) t.dead = true; }); },
    storage: {
      get(o) { o.success(Object.prototype.hasOwnProperty.call(disk, o.key) ? disk[o.key] : o.default); },
      set(o) { disk[o.key] = o.value; if (o.success) o.success(); }
    },
    vibrator: { vibrate(o) { log.buzz.push(o.mode); } },
    brightness: { setKeepScreenOn(o) { log.screen.push(o.keepScreenOn); } }
  };
  vm.createContext(ctx);
  vm.runInContext(SOURCE, ctx, { filename: 'engine.js' });
  const engine = ctx.module.exports;

  // sahte saati ilerletir, vadesi gelen zamanlayıcıları sırayla çalıştırır
  function advance(ms) {
    const end = clock.now + ms;
    for (;;) {
      let next = null;
      for (const t of timers) if (!t.dead && t.at <= end && (!next || t.at < next.at)) next = t;
      if (!next) break;
      clock.now = next.at;
      next.at += next.ms;
      next.fn();
    }
    clock.now = end;
  }

  let ready = false;
  engine.load(() => { ready = true; });
  if (!ready) throw new Error('motor yüklenmedi');
  return { engine, advance, log, timers };
}

const MIN = 60000;

// 5 Kasım 2026, 09:00 yerel saat
function morning(day = 5) { return new Date(2026, 10, day, 9, 0, 0).getTime(); }

module.exports = { watch, MIN, morning };
