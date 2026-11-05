// Hologram: cisimlerin dönüşü bilgisayarda kare kare çizilir (tools/render-frames.js
// + tools/frames-to-png.py), saat yalnızca resimleri sırayla gösterir.
// Her cisim kendi simetri aralığı kadar döndürülmüştür, kareler kesintisiz döngü yapar.
import router from '@system.router';

// frames: kare sayısı, ms: kareler arası süre (saniyede ~45 derece dönüş)
var SHAPES = [
  { id: 'kup', name: 'Küp', frames: 6, ms: 333 },
  { id: 'koni', name: 'Koni', frames: 3, ms: 222 },
  { id: 'piramit', name: 'Piramit', frames: 6, ms: 333 },
  { id: 'kure', name: 'Küre', frames: 3, ms: 222 },
  { id: 'simit', name: 'Simit', frames: 3, ms: 222 },
  { id: 'vazo', name: 'Vazo', frames: 3, ms: 222 },
  { id: 'kule', name: 'Burgulu kule', frames: 6, ms: 333 },
  { id: 'elipsoid', name: 'Süper elipsoid', frames: 6, ms: 333 },
  { id: 'mobius', name: 'Möbius şeridi', frames: 10, ms: 800 },
  { id: 'klein', name: 'Klein şişesi', frames: 10, ms: 800 }
];

var timer = null, shape = 0, frame = 0, paused = false;

function srcOf(s, f) {
  return '/common/frames/' + SHAPES[s].id + '/' + f + '.png';
}

export default {
  data: {
    name: '',
    info: '',
    src: ''
  },

  onInit: function () {
    this.show(0);
  },

  onShow: function () {
    this.start();
  },

  onHide: function () {
    this.stop();
  },

  onDestroy: function () {
    this.stop();
  },

  start: function () {
    var self = this;
    this.stop();
    if (paused) return;
    timer = setInterval(function () {
      frame = (frame + 1) % SHAPES[shape].frames;
      self.src = srcOf(shape, frame);
    }, SHAPES[shape].ms);
  },

  stop: function () {
    if (timer !== null) { clearInterval(timer); timer = null; }
  },

  show: function (s) {
    shape = (s + SHAPES.length) % SHAPES.length;
    frame = 0;
    this.name = SHAPES[shape].name;
    this.info = (shape + 1) + ' / ' + SHAPES.length + (paused ? '  · durdu' : '');
    this.src = srcOf(shape, 0);
  },

  next: function () {
    this.show(shape + 1);
    this.start();
  },

  prev: function () {
    this.show(shape - 1);
    this.start();
  },

  togglePause: function () {
    paused = !paused;
    this.info = (shape + 1) + ' / ' + SHAPES.length + (paused ? '  · durdu' : '');
    if (paused) this.stop(); else this.start();
  },

  back: function () {
    this.stop();
    router.replace({ uri: 'pages/mola/index' });
  },

  // soldan sağa kaydırınca geri (sağdan sola: sonraki cisim)
  onSwipe: function (e) {
    if (!e) return;
    if (e.direction === 'right') router.replace({ uri: 'pages/mola/index' });
    else if (e.direction === 'left') this.next();
  }
};
