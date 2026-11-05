// Ayarlar: hazır ayar, süreler, titreşim, ekran, otomatik başlatma. Her değişiklik hemen kaydedilir.
import router from '@system.router';
import engine from '../../common/engine.js';

function onOff(v) { return v ? 'Açık' : 'Kapalı'; }

export default {
  data: {
    preset: '',
    work: '',
    short: '',
    long: '',
    every: '',
    vibrate: '',
    keepOn: '',
    auto: ''
  },

  onInit: function () {
    var self = this;
    engine.load(function () { self.refresh(); });
  },

  refresh: function () {
    var s = engine.settings;
    this.preset = engine.presetName();
    this.work = '' + s.work;
    this.short = '' + s.short;
    this.long = '' + s.long;
    this.every = '' + s.every;
    this.vibrate = onOff(s.vibrate);
    this.keepOn = onOff(s.keepOn);
    this.auto = onOff(s.auto);
  },

  nextPreset: function () { engine.nextPreset(); this.refresh(); },

  workDown: function () { engine.adjust('work', -1); this.refresh(); },
  workUp: function () { engine.adjust('work', 1); this.refresh(); },
  shortDown: function () { engine.adjust('short', -1); this.refresh(); },
  shortUp: function () { engine.adjust('short', 1); this.refresh(); },
  longDown: function () { engine.adjust('long', -1); this.refresh(); },
  longUp: function () { engine.adjust('long', 1); this.refresh(); },
  everyDown: function () { engine.adjust('every', -1); this.refresh(); },
  everyUp: function () { engine.adjust('every', 1); this.refresh(); },

  flipVibrate: function () { engine.flip('vibrate'); this.refresh(); },
  flipKeepOn: function () { engine.flip('keepOn'); this.refresh(); },
  flipAuto: function () { engine.flip('auto'); this.refresh(); },

  back: function () { router.replace({ uri: 'pages/menu/index' }); },

  // soldan sağa kaydırınca geri
  onSwipe: function (e) {
    if (!e) return;
    if (e.direction === 'right') router.replace({ uri: 'pages/menu/index' });
  }
};
