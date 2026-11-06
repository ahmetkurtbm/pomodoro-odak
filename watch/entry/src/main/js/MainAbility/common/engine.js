// Pomodoro motoru. Sayfalardan bağımsız çalışır: menüde gezinirken de süre işler,
// tur bitince titrer. Süre duvar saatinden (bitiş anı) hesaplanır, durum kaydedilir;
// uygulama kapanıp açılsa da kaldığı yerden devam eder.
import vibrator from '@system.vibrator';
import brightness from '@system.brightness';
import store from './store.js';

var MODES = {
  work: { label: 'ODAK' },
  short: { label: 'MOLA' },
  long: { label: 'UZUN MOLA' }
};

// hazır ayarlar: [çalışma, kısa mola, uzun mola] dakika
var PRESETS = [
  { name: 'Klasik', mins: [25, 5, 15] },
  { name: 'Derin', mins: [50, 10, 20] },
  { name: 'Kısa', mins: [15, 3, 10] }
];

var settings = {
  preset: 0,        // PRESETS indeksi, -1 = özel
  work: 25, short: 5, long: 15,
  every: 4,         // kaç turda bir uzun mola
  vibrate: true,
  keepOn: false,    // çalışırken ekranı açık tut
  auto: false       // bitince sonraki aşamayı kendiliğinden başlat
};

var state = {
  mode: 'work',
  round: 1,         // 1..every
  running: false,
  endAt: 0,         // çalışırken bitiş anı (ms)
  left: 25 * 60000, // duraklatılmışken kalan süre (ms)
  warned: false     // son dakika uyarısı verildi mi
};

// gün -> [tur, dakika]; en fazla 14 gün tutulur
var stats = {};
var loaded = false, waiting = [], ticker = null, listener = null;

function now() { return new Date().getTime(); }

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function dayKey(t) {
  var d = new Date(t);
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function totalOf(mode) { return settings[mode] * 60000; }

function leftMs() {
  return state.running ? Math.max(0, state.endAt - now()) : state.left;
}

// --- kayıt ----------------------------------------------------------------

function saveSettings() {
  store.set('settings', [settings.preset, settings.work, settings.short, settings.long, settings.every,
    settings.vibrate ? 1 : 0, settings.keepOn ? 1 : 0, settings.auto ? 1 : 0].join(','));
}

function saveState() {
  store.set('state', [state.mode === 'work' ? 0 : state.mode === 'short' ? 1 : 2, state.round,
    state.running ? 1 : 0, state.endAt, state.left].join(','));
}

function saveStats() {
  var keys = Object.keys(stats).sort(), parts = [], i;
  while (keys.length > 14) delete stats[keys.shift()];
  for (i = 0; i < keys.length; i++) parts.push(keys[i] + ':' + stats[keys[i]][0] + ':' + stats[keys[i]][1]);
  store.set('stats', parts.join(';'));
}

function load(cb) {
  if (loaded) { cb(); return; }
  waiting.push(cb);
  if (waiting.length > 1) return;
  store.get('settings', '', function (s) {
    if (s) {
      var n = store.numbers(s);
      settings.preset = n[0]; settings.work = n[1] || 25; settings.short = n[2] || 5; settings.long = n[3] || 15;
      settings.every = n[4] || 4; settings.vibrate = n[5] === 1; settings.keepOn = n[6] === 1; settings.auto = n[7] === 1;
    }
    store.get('state', '', function (st) {
      if (st) {
        var m = store.numbers(st);
        state.mode = m[0] === 1 ? 'short' : m[0] === 2 ? 'long' : 'work';
        state.round = m[1] || 1; state.running = m[2] === 1; state.endAt = m[3]; state.left = m[4];
      } else {
        state.left = totalOf('work');
      }
      store.get('stats', '', function (txt) {
        var rows = txt ? txt.split(';') : [], i;
        for (i = 0; i < rows.length; i++) {
          var f = rows[i].split(':');
          if (f.length === 3) stats[f[0]] = [parseInt(f[1], 10) || 0, parseInt(f[2], 10) || 0];
        }
        loaded = true;
        if (state.running) startTicker();
        var list = waiting; waiting = [];
        for (i = 0; i < list.length; i++) list[i]();
      });
    });
  });
}

// --- donanım ----------------------------------------------------------------

function buzz(mode) {
  if (!settings.vibrate) return;
  try { vibrator.vibrate({ mode: mode }); } catch (e) { /* titreşim yoksa sessiz geç */ }
}

function screen(on) {
  try { brightness.setKeepScreenOn({ keepScreenOn: on }); } catch (e) { /* desteklenmiyorsa geç */ }
}

// --- akış -----------------------------------------------------------------

function notify() { if (listener) listener(); }

function startTicker() {
  if (ticker !== null) return;
  ticker = setInterval(tick, 1000);
}

function stopTicker() {
  if (ticker !== null) { clearInterval(ticker); ticker = null; }
}

function tick() {
  if (!state.running) { stopTicker(); return; }
  var left = leftMs();
  if (!state.warned && left <= 60000 && totalOf(state.mode) > 120000) {
    state.warned = true;
    buzz('short');
  }
  if (left <= 0) finish();
  notify();
}

// at: turun bittiği an. Uygulama kapalıyken biten tur, açıldığı güne değil bittiği güne yazılır.
function recordWork(at) {
  var k = '' + dayKey(at);
  if (!stats[k]) stats[k] = [0, 0];
  stats[k][0] += 1;
  stats[k][1] += settings.work;
  saveStats();
}

// aşama bitti: istatistik, titreşim, sonraki aşama
function finish() {
  var wasWork = state.mode === 'work';
  if (wasWork) recordWork(state.running ? state.endAt : now());
  buzz('long');
  if (wasWork) {
    state.mode = state.round >= settings.every ? 'long' : 'short';
  } else {
    if (state.mode === 'long') state.round = 1; else state.round += 1;
    state.mode = 'work';
  }
  state.left = totalOf(state.mode);
  state.warned = false;
  state.running = false;
  if (settings.auto) start(); else { stopTicker(); screen(false); saveState(); }
}

function start() {
  if (state.running) return;
  state.running = true;
  state.endAt = now() + state.left;
  if (settings.keepOn) screen(true);
  startTicker();
  saveState();
  notify();
}

function pause() {
  if (!state.running) return;
  state.left = leftMs();
  state.running = false;
  stopTicker();
  screen(false);
  saveState();
  notify();
}

function toggle() { if (state.running) pause(); else start(); }

// aşamayı baştan başlat (duraklatılmış)
function reset() {
  state.running = false;
  state.left = totalOf(state.mode);
  state.warned = false;
  stopTicker();
  screen(false);
  saveState();
  notify();
}

// aşamayı istatistiğe yazmadan atla
function skip() {
  var wasWork = state.mode === 'work';
  if (wasWork) {
    state.mode = state.round >= settings.every ? 'long' : 'short';
  } else {
    if (state.mode === 'long') state.round = 1; else state.round += 1;
    state.mode = 'work';
  }
  state.running = false;
  state.left = totalOf(state.mode);
  state.warned = false;
  stopTicker();
  screen(false);
  saveState();
  notify();
}

// --- ayarlar ----------------------------------------------------------------

function applyPreset(i) {
  settings.preset = i;
  if (i >= 0) {
    settings.work = PRESETS[i].mins[0];
    settings.short = PRESETS[i].mins[1];
    settings.long = PRESETS[i].mins[2];
  }
}

// before: değişiklikten önce o anki aşamanın süresi (ms). Duraklatılmış aşama yalnızca
// kendi süresi değiştiyse yeni süreyle baştan başlar; tur sayısı gibi başka bir ayar
// değişince kalan süre korunur.
function changed(before) {
  if (!state.running && totalOf(state.mode) !== before) state.left = totalOf(state.mode);
  saveSettings();
  saveState();
}

function nextPreset() {
  var before = totalOf(state.mode);
  applyPreset(settings.preset + 1 >= PRESETS.length ? 0 : settings.preset + 1);
  changed(before);
}

// field: 'work' | 'short' | 'long' | 'every'
function adjust(field, delta) {
  var limits = { work: [5, 90], short: [1, 30], long: [5, 45], every: [2, 8] };
  var step = field === 'every' ? 1 : (field === 'work' ? 5 : 1);
  var before = totalOf(state.mode);
  var v = settings[field] + delta * step;
  if (v < limits[field][0]) v = limits[field][0];
  if (v > limits[field][1]) v = limits[field][1];
  settings[field] = v;
  if (field !== 'every') settings.preset = -1;
  if (state.round > settings.every) state.round = settings.every;
  changed(before);
}

function flip(field) {
  settings[field] = !settings[field];
  if (field === 'keepOn') screen(settings.keepOn && state.running);
  saveSettings();
}

// --- görünüm için ---------------------------------------------------------

function view() {
  var left = leftMs(), total = totalOf(state.mode), secs = Math.ceil(left / 1000);
  return {
    mode: state.mode,
    label: MODES[state.mode].label,
    time: pad(Math.floor(secs / 60)) + ':' + pad(secs % 60),
    percent: Math.round((1 - left / total) * 100),
    running: state.running,
    round: state.round,
    every: settings.every
  };
}

function presetName() {
  return settings.preset >= 0 ? PRESETS[settings.preset].name : 'Özel';
}

// son 7 gün, bugün en sonda: [{ key, label, count, mins }]
var DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function week() {
  var out = [], t = now(), i;
  for (i = 6; i >= 0; i--) {
    var at = t - i * 86400000, k = '' + dayKey(at), s = stats[k] || [0, 0];
    out.push({ key: k, label: i === 0 ? 'Bugün' : DAYS[new Date(at).getDay()], count: s[0], mins: s[1] });
  }
  return out;
}

// bugünden geriye kesintisiz tur yapılan gün sayısı (bugün boşsa dünden başlar)
function streak() {
  var t = now(), n = 0, i = 0;
  if (!stats['' + dayKey(t)]) i = 1;
  for (; i < 30; i++) {
    var s = stats['' + dayKey(t - i * 86400000)];
    if (!s || !s[0]) break;
    n++;
  }
  return n;
}

function setListener(fn) { listener = fn; }

// düğmeye basınca kısa dokunma hissi
function haptic() { buzz('short'); }

export default {
  load: load, view: view, setListener: setListener, haptic: haptic,
  toggle: toggle, reset: reset, skip: skip,
  settings: settings, presetName: presetName, nextPreset: nextPreset, adjust: adjust, flip: flip,
  week: week, streak: streak
};
