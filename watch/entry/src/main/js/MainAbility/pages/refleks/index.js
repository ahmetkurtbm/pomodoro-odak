// Refleks: hedef rastgele bir anda ve yerde çıkar, olabildiğince hızlı dokunulur.
// 5 tur sonunda ortalama ve en iyi süre gösterilir. Erken dokunmak turu bozar.
import router from '@system.router';

var ROUNDS = 5;
var POSITIONS = 9;

// idle: başlamayı bekliyor, wait: hedef gelecek, go: hedef ekranda, done: sonuç
var state = 'idle', timer = null, shownAt = 0, times = [], best = 0, lastPos = -1;

function now() { return new Date().getTime(); }

export default {
  data: {
    msg: 'Refleks',
    detail: 'Başlamak için dokun',
    on0: false, on1: false, on2: false, on3: false, on4: false,
    on5: false, on6: false, on7: false, on8: false
  },

  onHide: function () { this.clear(); },
  onDestroy: function () { this.clear(); },

  // pos < 0: hepsini gizle
  showTarget: function (pos) {
    for (var i = 0; i < POSITIONS; i++) this['on' + i] = i === pos;
  },

  clear: function () {
    if (timer !== null) { clearTimeout(timer); timer = null; }
  },

  later: function (ms, fn) {
    this.clear();
    timer = setTimeout(function () { timer = null; fn(); }, ms);
  },

  startGame: function () {
    times = [];
    this.nextRound();
  },

  nextRound: function () {
    var self = this;
    state = 'wait';
    this.showTarget(-1);
    this.msg = 'Tur ' + (times.length + 1) + ' / ' + ROUNDS;
    this.detail = 'Bekle...';
    this.later(900 + Math.floor(Math.random() * 1800), function () {
      var pos;
      do { pos = Math.floor(Math.random() * POSITIONS); } while (pos === lastPos);
      lastPos = pos;
      self.detail = '';
      self.showTarget(pos);
      state = 'go';
      shownAt = now();
    });
  },

  tapTarget: function () {
    if (state !== 'go') return;
    var self = this, ms = now() - shownAt;
    times.push(ms);
    state = 'between';
    this.showTarget(-1);
    this.detail = ms + ' ms';
    if (times.length < ROUNDS) {
      this.later(800, function () { self.nextRound(); });
    } else {
      this.later(800, function () { self.finish(); });
    }
  },

  tapBg: function () {
    var self = this;
    if (state === 'idle' || state === 'done') {
      this.startGame();
    } else if (state === 'wait') {
      // hedef çıkmadan dokunuldu: tur yeniden
      state = 'between';
      this.detail = 'Erken! Tekrar';
      this.later(900, function () { self.nextRound(); });
    } else if (state === 'go') {
      this.detail = 'Hedefe dokun';
    }
  },

  finish: function () {
    var sum = 0, min = times[0], i;
    for (i = 0; i < times.length; i++) {
      sum += times[i];
      if (times[i] < min) min = times[i];
    }
    var avg = Math.round(sum / times.length);
    var record = best === 0 || avg < best;
    if (record) best = avg;
    state = 'done';
    this.msg = record ? 'Yeni rekor!' : 'Bitti';
    this.detail = 'Ortalama ' + avg + ' ms\nEn hızlı ' + min + ' ms · Rekor ' + best + ' ms';
  },

  back: function () {
    this.clear();
    router.replace({ uri: 'pages/mola/index' });
  },

  // soldan sağa kaydırınca geri
  onSwipe: function (e) {
    if (!e) return;
    if (e.direction === 'right') router.replace({ uri: 'pages/mola/index' });
  }
};
