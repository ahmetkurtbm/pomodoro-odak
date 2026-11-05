// İstatistik: bugünün turları ve dakikaları, seri, son 7 günün çubukları.
import router from '@system.router';
import engine from '../../common/engine.js';

export default {
  data: {
    today: '0',
    minutes: '0',
    streak: '0',
    l0: '', p0: 0, c0: '',
    l1: '', p1: 0, c1: '',
    l2: '', p2: 0, c2: '',
    l3: '', p3: 0, c3: '',
    l4: '', p4: 0, c4: '',
    l5: '', p5: 0, c5: '',
    l6: '', p6: 0, c6: ''
  },

  onInit: function () {
    var self = this;
    engine.load(function () { self.refresh(); });
  },

  refresh: function () {
    var w = engine.week(), max = 1, i;
    for (i = 0; i < w.length; i++) if (w[i].count > max) max = w[i].count;
    for (i = 0; i < w.length; i++) {
      this['l' + i] = w[i].label;
      this['p' + i] = Math.round(w[i].count / max * 100);
      this['c' + i] = '' + w[i].count;
    }
    var t = w[w.length - 1];
    this.today = '' + t.count;
    this.minutes = '' + t.mins;
    this.streak = '' + engine.streak();
  },

  back: function () { router.replace({ uri: 'pages/menu/index' }); },

  // soldan sağa kaydırınca geri
  onSwipe: function (e) {
    if (!e) return;
    if (e.direction === 'right') router.replace({ uri: 'pages/menu/index' });
  }
};
