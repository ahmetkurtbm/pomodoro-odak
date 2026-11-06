const test = require('node:test');
const assert = require('node:assert/strict');
const { watch, MIN, morning } = require('./harness');

function fresh(day) {
  const clock = { now: morning(day) };
  const disk = {};
  return { clock, disk, ...watch(clock, disk) };
}

test('ilk açılış: klasik 25 dakikalık odak, tur 1/4', () => {
  const { engine } = fresh();
  const v = engine.view();
  assert.equal(v.mode, 'work');
  assert.equal(v.time, '25:00');
  assert.equal(v.round, 1);
  assert.equal(v.every, 4);
  assert.equal(v.running, false);
  assert.equal(engine.presetName(), 'Klasik');
});

test('geri sayım ve halka yüzdesi duvar saatinden hesaplanır', () => {
  const { engine, advance } = fresh();
  engine.toggle();
  advance(10 * MIN);
  const v = engine.view();
  assert.equal(v.time, '15:00');
  assert.equal(v.percent, 40);
  assert.equal(v.running, true);
});

test('son dakikada kısa, bitişte uzun titreşim; sonra mola başlar ve durur', () => {
  const { engine, advance, log } = fresh();
  engine.toggle();
  advance(24 * MIN + 1000);
  assert.deepEqual(log.buzz, ['short']);
  advance(MIN);
  assert.deepEqual(log.buzz, ['short', 'long']);
  const v = engine.view();
  assert.equal(v.mode, 'short');
  assert.equal(v.time, '05:00');
  assert.equal(v.running, false);
});

test('dört odak turundan sonra uzun mola, ardından tur 1', () => {
  const { engine } = fresh();
  const seen = [];
  for (let i = 0; i < 9; i++) {
    seen.push(engine.view().mode + engine.view().round);
    engine.skip();
  }
  assert.deepEqual(seen, ['work1', 'short1', 'work2', 'short2', 'work3', 'short3', 'work4', 'long4', 'work1']);
});

test('atlanan tur istatistiğe yazılmaz, biten tur yazılır', () => {
  const { engine, advance } = fresh();
  engine.skip();
  assert.equal(engine.week()[6].count, 0);
  engine.skip();
  engine.toggle();
  advance(25 * MIN + 1000);
  const today = engine.week()[6];
  assert.equal(today.label, 'Bugün');
  assert.equal(today.count, 1);
  assert.equal(today.mins, 25);
});

test('duraklatılmış tur kapatıp açınca kaldığı yerden sürer', () => {
  const { clock, disk, engine, advance } = fresh();
  engine.toggle();
  advance(7 * MIN);
  engine.toggle();
  const again = watch(clock, disk);
  assert.equal(again.engine.view().time, '18:00');
  assert.equal(again.engine.view().running, false);
});

test('çalışırken kapatıp açınca süre arada da işlemiş olur', () => {
  const { clock, disk, engine } = fresh();
  engine.toggle();
  clock.now += 3 * MIN;
  const again = watch(clock, disk);
  assert.equal(again.engine.view().time, '22:00');
  assert.equal(again.engine.view().running, true);
});

test('uygulama kapalıyken biten tur, açıldığı güne değil bittiği güne yazılır', () => {
  const clock = { now: new Date(2026, 10, 5, 22, 0, 0).getTime() };
  const disk = {};
  watch(clock, disk).engine.toggle();  // 22:00 -> 22:25'te biter
  clock.now = morning(6);
  const next = watch(clock, disk);
  next.advance(1000);
  const days = next.engine.week();
  assert.equal(days[5].count, 1, 'dün');
  assert.equal(days[6].count, 0, 'bugün');
  assert.equal(next.engine.view().mode, 'short');
});

test('tur sayısını değiştirmek duraklatılmış turun kalan süresini sıfırlamaz', () => {
  const { engine, advance } = fresh();
  engine.toggle();
  advance(15 * MIN);
  engine.toggle();                     // 10 dakika kaldı
  engine.adjust('every', 1);
  assert.equal(engine.settings.every, 5);
  assert.equal(engine.view().time, '10:00');
});

test('başka aşamanın süresini değiştirmek de kalan süreyi korur', () => {
  const { engine, advance } = fresh();
  engine.toggle();
  advance(15 * MIN);
  engine.toggle();
  engine.adjust('short', 1);           // odaktayız, mola süresi değişti
  assert.equal(engine.view().time, '10:00');
});

test('o anki aşamanın süresi değişince duraklatılmış tur yeni süreyle başlar', () => {
  const { engine, advance } = fresh();
  engine.toggle();
  advance(15 * MIN);
  engine.toggle();
  engine.adjust('work', 1);            // 25 -> 30
  assert.equal(engine.view().time, '30:00');
  assert.equal(engine.presetName(), 'Özel');
});

test('ayar sınırları ve hazır ayarlar', () => {
  const { engine } = fresh();
  for (let i = 0; i < 30; i++) engine.adjust('work', 1);
  assert.equal(engine.settings.work, 90);
  for (let i = 0; i < 30; i++) engine.adjust('short', -1);
  assert.equal(engine.settings.short, 1);
  engine.nextPreset();
  assert.equal(engine.presetName(), 'Klasik');
  engine.nextPreset();
  assert.equal(engine.presetName(), 'Derin');
  assert.equal(engine.settings.work, 50);
});

test('tur sayısı küçülünce mevcut tur sınıra çekilir', () => {
  const { engine } = fresh();
  for (let i = 0; i < 6; i++) engine.skip(); // tur 4'e gel
  assert.equal(engine.view().round, 4);
  engine.adjust('every', -1);
  engine.adjust('every', -1);
  assert.equal(engine.settings.every, 2);
  assert.equal(engine.view().round, 2);
});

test('otomatik başlatma açıkken mola kendiliğinden başlar', () => {
  const { engine, advance } = fresh();
  engine.flip('auto');
  engine.toggle();
  advance(25 * MIN + 1000);
  const v = engine.view();
  assert.equal(v.mode, 'short');
  assert.equal(v.running, true);
});

test('titreşim kapalıyken hiç titremez', () => {
  const { engine, advance, log } = fresh();
  engine.flip('vibrate');
  engine.haptic();
  engine.toggle();
  advance(26 * MIN);
  assert.deepEqual(log.buzz, []);
});

test('ekranı açık tut: çalışırken açılır, duraklayınca kapanır', () => {
  const { engine, log } = fresh();
  engine.flip('keepOn');
  engine.toggle();
  engine.toggle();
  assert.deepEqual(log.screen.slice(-2), [true, false]);
});

test('seri: bugün boşsa dünden geriye sayar, boşlukta kesilir', () => {
  const clock = { now: morning(10) };
  const disk = { stats: '20261109:2:50;20261108:1:25;20261106:3:75' };
  const { engine } = watch(clock, disk);
  assert.equal(engine.streak(), 2);
  const week = engine.week();
  assert.equal(week.length, 7);
  // dizi motorun sanal makinesinden geliyor; değerleri bu tarafa kopyala
  assert.deepEqual(Array.from(week, (d) => d.count), [0, 0, 3, 0, 1, 2, 0]);
});

test('istatistik en fazla 14 gün tutar', () => {
  const clock = { now: morning(1) };
  const disk = {};
  for (let d = 1; d <= 20; d++) {
    clock.now = new Date(2026, 9, d, 9, 0, 0).getTime();
    const w = watch(clock, disk);
    if (w.engine.view().mode !== 'work') w.engine.skip(); // dünden kalan molayı geç
    w.engine.toggle();
    w.advance(25 * MIN + 1000);
  }
  assert.equal(disk.stats.split(';').length, 14);
  assert.ok(disk.stats.startsWith('20261007:'), disk.stats);
});
