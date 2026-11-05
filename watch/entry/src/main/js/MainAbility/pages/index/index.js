// Pomodoro: zamanlayıcı ekranı. Süreyi motor (common/engine.js) tutar; sayfa yalnızca gösterir.
// Saatin canvas'ı tekrarlı çizimde bellek sızdırdığı için halka hazır progress bileşenidir.
// Sağdan sola kaydırınca menü açılır, soldan sağa kaydırınca uygulama kapanır.
// Süre kayıtlı olduğu için kapatınca kaybolmaz; yeniden açınca kaldığı yerden devam eder.
import router from '@system.router';
import app from '@system.app';
import engine from '../../common/engine.js';

export default {
  data: {
    preset: '',
    label: 'ODAK',
    time: '25:00',
    round: '',
    percent: 0,
    isWork: true,
    isShort: false,
    isLong: false,
    icon: '/common/icons/play.png'
  },

  onInit: function () {
    var self = this;
    engine.load(function () { self.refresh(); });
  },

  onShow: function () {
    var self = this;
    engine.setListener(function () { self.refresh(); });
    this.refresh();
  },

  onHide: function () {
    engine.setListener(null);
  },

  onDestroy: function () {
    engine.setListener(null);
  },

  refresh: function () {
    var v = engine.view();
    this.preset = engine.presetName();
    this.label = v.label;
    this.time = v.time;
    this.round = 'Tur ' + v.round + ' / ' + v.every;
    this.percent = v.percent;
    this.isWork = v.mode === 'work';
    this.isShort = v.mode === 'short';
    this.isLong = v.mode === 'long';
    this.icon = v.running ? '/common/icons/pause.png' : '/common/icons/play.png';
  },

  toggle: function () { engine.haptic(); engine.toggle(); this.refresh(); },
  reset: function () { engine.haptic(); engine.reset(); this.refresh(); },
  skip: function () { engine.haptic(); engine.skip(); this.refresh(); },

  onSwipe: function (e) {
    if (!e) return;
    if (e.direction === 'left') this.openMenu();
    else if (e.direction === 'right') app.terminate();
  },

  openMenu: function () {
    router.replace({ uri: 'pages/menu/index' });
  }
};
