// Ana menü. Üstte çalışan zamanlayıcının durumu canlı görünür.
import router from '@system.router';
import engine from '../../common/engine.js';

export default {
  data: {
    status: ''
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

  onHide: function () { engine.setListener(null); },
  onDestroy: function () { engine.setListener(null); },

  refresh: function () {
    var v = engine.view();
    this.status = v.label + ' ' + v.time + (v.running ? '' : ' · durdu');
  },

  openTimer: function () { router.replace({ uri: 'pages/index/index' }); },
  openStats: function () { router.replace({ uri: 'pages/istatistik/index' }); },
  openSettings: function () { router.replace({ uri: 'pages/ayarlar/index' }); },
  openBreak: function () { router.replace({ uri: 'pages/mola/index' }); },

  // soldan sağa kaydırınca geri
  onSwipe: function (e) {
    if (!e) return;
    if (e.direction === 'right') router.replace({ uri: 'pages/index/index' });
  }
};
