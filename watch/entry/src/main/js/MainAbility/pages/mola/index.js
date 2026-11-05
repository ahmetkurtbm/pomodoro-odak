// Mola köşesi: molada küçük bir oyun ya da hologram. Zamanlayıcı arkada çalışmaya devam eder.
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

  openRefleks: function () { router.replace({ uri: 'pages/refleks/index' }); },
  openHolo: function () { router.replace({ uri: 'pages/holo/index' }); },
  back: function () { router.replace({ uri: 'pages/menu/index' }); },

  // soldan sağa kaydırınca geri
  onSwipe: function (e) {
    if (!e) return;
    if (e.direction === 'right') router.replace({ uri: 'pages/menu/index' });
  }
};
