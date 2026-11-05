// Tarayıcı arayüzü: saat ekranını çizer, paneli core/ modüllerine bağlar.
// Saate taşınmayacak; saatte bunun yerini HML sayfası alacak.
(function () {
  var Shapes = Holo.Shapes, Surface = Holo.Surface, Render = Holo.Render, Gesture = Holo.Gesture;
  var NU = 72, NV = 72;
  var PARAM_KEYS = Surface.PARAMS;

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('screen'), ctx = canvas.getContext('2d');
  var codeEl = $('code'), statusEl = $('status'), slidersEl = $('sliders');

  var freeform = Gesture.defaultLookup();
  var extraFuncs = {
    fx: function (u) { return freeform.fx(u); },
    fy: function (u) { return freeform.fy(u); }
  };

  var state = {
    profileId: 'daire',
    opId: 'uzat',
    freeClosed: true,
    params: {},
    labels: {},
    title: '',
    prog: null,
    mesh: null,
    fit: null,
    targetFit: null,
    yaw: 0.6,
    pitch: 0.45,
    spin: true,
    drawMode: false,
    stroke: [],
    drag: null,
    tilt: null,
    toast: '',
    toastUntil: 0
  };

  // --- şekil seçimi ---------------------------------------------------------

  function selectShape(profileId, opId, overrides) {
    state.profileId = profileId;
    state.opId = opId;
    var closed = profileId === 'serbest' ? state.freeClosed : null;
    applyBuilt(Shapes.build(profileId, opId, overrides, closed));
  }

  function selectFormula(id) {
    state.profileId = null;
    state.opId = null;
    applyBuilt(Shapes.buildFormula(id));
  }

  function applyBuilt(built) {
    state.params = built.params;
    state.labels = built.labels;
    state.title = built.title;
    codeEl.value = built.text;
    compileCode();
    renderSliders();
    renderChips();
  }

  function compileCode() {
    try {
      state.prog = Surface.compile(codeEl.value, extraFuncs);
      setStatus('✓ Formül geçerli', 'ok');
      resample();
    } catch (e) {
      // hatalıyken son geçerli cisim ekranda kalır
      setStatus('✗ ' + e.message, 'err');
    }
  }

  function resample() {
    if (!state.prog) return;
    state.mesh = Surface.sample(state.prog, state.params, NU, NV);
    state.targetFit = Surface.bounds(state.mesh);
    if (!state.fit) state.fit = copyFit(state.targetFit);
  }

  function copyFit(f) { return { ox: f.ox, oy: f.oy, oz: f.oz, r: f.r }; }

  function setStatus(text, cls) {
    statusEl.textContent = text;
    statusEl.className = 'status ' + cls;
  }

  function toast(text) {
    state.toast = text;
    state.toastUntil = performance.now() + 2200;
  }

  // --- panel ----------------------------------------------------------------

  function chip(container, label, active, onClick) {
    var b = document.createElement('button');
    b.textContent = label;
    if (active) b.className = 'on';
    b.addEventListener('click', onClick);
    container.appendChild(b);
  }

  function renderChips() {
    var profiles = $('profiles'), ops = $('ops'), gallery = $('gallery');
    profiles.innerHTML = '';
    ops.innerHTML = '';
    gallery.innerHTML = '';

    Shapes.PROFILES.forEach(function (p) {
      chip(profiles, p.name, p.id === state.profileId, function () {
        if (p.id === 'serbest') { startDraw(); return; }
        selectShape(p.id, state.opId || 'uzat');
      });
    });
    Shapes.OPS.forEach(function (o) {
      chip(ops, o.name, o.id === state.opId, function () {
        selectShape(state.profileId || 'daire', o.id);
      });
    });
    Shapes.GALLERY.forEach(function (g) {
      chip(gallery, g.name, g.name === state.title, function () {
        if (g.formula) selectFormula(g.formula);
        else selectShape(g.profile, g.op, g.params);
        state.title = g.name;
        renderChips();
      });
    });
  }

  function formatValue(v, meta) {
    if (Math.abs(v) < 0.005) v = 0;
    var s = v.toFixed(2);
    if (meta.angle) s += ' (' + Math.round(v * 180 / Math.PI) + '°)';
    return s;
  }

  function renderSliders() {
    slidersEl.innerHTML = '';
    var any = false;
    PARAM_KEYS.forEach(function (key) {
      var meta = state.labels[key];
      if (!meta) return;
      any = true;
      var row = document.createElement('div');
      row.className = 'slider';
      var label = document.createElement('label');
      label.innerHTML = '<b>' + key + '</b>' + meta.label;
      var out = document.createElement('output');
      var input = document.createElement('input');
      input.type = 'range';
      input.min = meta.min;
      input.max = meta.max;
      input.step = meta.step;
      input.value = state.params[key] != null ? state.params[key] : meta.min;
      state.params[key] = parseFloat(input.value);
      out.textContent = formatValue(state.params[key], meta);
      input.addEventListener('input', function () {
        state.params[key] = parseFloat(input.value);
        out.textContent = formatValue(state.params[key], meta);
        resample();
      });
      row.appendChild(label);
      row.appendChild(out);
      row.appendChild(input);
      slidersEl.appendChild(row);
    });
    if (!any) slidersEl.innerHTML = '<p class="empty">Bu formülde parametre yok.</p>';
  }

  var codeTimer = null;
  codeEl.addEventListener('input', function () {
    clearTimeout(codeTimer);
    codeTimer = setTimeout(function () {
      state.title = 'Özel formül';
      compileCode();
    }, 250);
  });

  // --- çizim modu -----------------------------------------------------------

  function startDraw() {
    state.drawMode = true;
    state.stroke = [];
    $('watch').classList.add('drawing');
    $('btnDraw').classList.add('on');
  }

  function stopDraw() {
    state.drawMode = false;
    state.stroke = [];
    $('watch').classList.remove('drawing');
    $('btnDraw').classList.remove('on');
  }

  function finishStroke() {
    var res = Gesture.analyze(state.stroke);
    state.stroke = [];
    if (!res) { toast('Çok kısa, tekrar çiz'); return; }
    stopDraw();
    var op = state.opId || 'uzat';
    if (res.kind === 'daire') {
      toast('Daire algılandı');
      selectShape('daire', op);
    } else if (res.kind === 'cizgi') {
      toast('Çizgi algılandı');
      selectShape('cizgi', op);
    } else {
      freeform = Gesture.lookup(res.pts);
      state.freeClosed = res.closed;
      toast(res.closed ? 'Kapalı serbest profil' : 'Açık serbest profil');
      // açık bir çizgi en çok döndürünce anlam kazanır (vazo, şişe...)
      if (!res.closed && op === 'uzat') op = 'dondur';
      selectShape('serbest', op);
    }
  }

  $('btnDraw').addEventListener('click', function () {
    if (state.drawMode) stopDraw(); else startDraw();
  });

  $('btnSpin').addEventListener('click', function () {
    state.spin = !state.spin;
    this.classList.toggle('on', state.spin);
  });

  // --- işaretçi: sürükle-döndür ya da çiz -----------------------------------

  function canvasPos(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height };
  }

  canvas.addEventListener('pointerdown', function (e) {
    canvas.setPointerCapture(e.pointerId);
    if (state.drawMode) state.stroke = [canvasPos(e)];
    else state.drag = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('pointermove', function (e) {
    if (state.drawMode) {
      if (state.stroke.length) state.stroke.push(canvasPos(e));
    } else if (state.drag) {
      state.yaw += (e.clientX - state.drag.x) * 0.01;
      state.pitch = clamp(state.pitch + (e.clientY - state.drag.y) * 0.01, -1.4, 1.4);
      state.drag = { x: e.clientX, y: e.clientY };
    }
  });

  function pointerEnd() {
    if (state.drawMode && state.stroke.length) finishStroke();
    state.drag = null;
  }
  canvas.addEventListener('pointerup', pointerEnd);
  canvas.addEventListener('pointercancel', pointerEnd);

  // --- bilek modu: telefonun hareket sensörü --------------------------------

  function onOrientation(e) {
    if (e.gamma == null) return;
    state.tilt = {
      yaw: e.gamma * Math.PI / 180 * 1.6,
      pitch: clamp((e.beta - 35) * Math.PI / 180, -1.3, 1.3)
    };
  }

  $('btnTilt').addEventListener('click', function () {
    var btn = this;
    if (btn.classList.contains('on')) {
      window.removeEventListener('deviceorientation', onOrientation);
      state.tilt = null;
      btn.classList.remove('on');
      return;
    }
    function enable() {
      window.addEventListener('deviceorientation', onOrientation);
      btn.classList.add('on');
      setTimeout(function () {
        if (btn.classList.contains('on') && !state.tilt) toast('Hareket sensörü yok — telefonda dene');
      }, 1500);
    }
    var DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then(function (r) {
        if (r === 'granted') enable(); else toast('Sensör izni verilmedi');
      }).catch(function () { toast('Sensör izni alınamadı'); });
    } else {
      enable();
    }
  });

  // --- saat ekranı ----------------------------------------------------------

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var w = Math.round(canvas.clientWidth * dpr);
    if (canvas.width !== w) { canvas.width = w; canvas.height = w; }
  }

  var ALPHA = [1, 0.62, 0.36, 0.18];
  var STYLE = { colors: [], glowColors: [], rowStep: 4, colStep: 4 };

  function holoColor(a) { return 'rgba(90,240,255,' + a + ')'; }

  function drawScreen(now) {
    var S = canvas.width, dpr = S / 466, cx = S / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, S, S);

    // projektör ışığı
    var g = ctx.createRadialGradient(cx, S * 0.86, 0, cx, S * 0.86, S * 0.55);
    g.addColorStop(0, 'rgba(90,240,255,0.16)');
    g.addColorStop(1, 'rgba(90,240,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    var flicker = 0.85 + 0.15 * Math.sin(now * 0.011) * Math.sin(now * 0.0037);
    ctx.strokeStyle = 'rgba(90,240,255,' + (0.5 * flicker) + ')';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.ellipse(cx, S * 0.84, S * 0.2, S * 0.035, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (state.mesh && state.fit) {
      var yaw = state.yaw, pitch = state.pitch;
      if (state.tilt) { yaw += state.tilt.yaw; pitch = state.tilt.pitch; }
      STYLE.width = 1.2 * dpr;
      STYLE.glowWidth = 5 * dpr;
      for (var b = 0; b < ALPHA.length; b++) {
        var a = b === 0 ? flicker : ALPHA[b];
        STYLE.colors[b] = holoColor(a);
        STYLE.glowColors[b] = holoColor(a * 0.16);
      }
      Render.draw(ctx, state.mesh, {
        yaw: yaw, pitch: pitch,
        ox: state.fit.ox, oy: state.fit.oy, oz: state.fit.oz, radius: state.fit.r,
        dist: 3.2, cx: cx, cy: S * 0.47, scale: S * 0.3
      }, STYLE);
    }

    // üst bilgi
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(90,240,255,0.85)';
    ctx.font = (15 * dpr) + 'px system-ui, sans-serif';
    ctx.fillText(state.title, cx, S * 0.11);
    var d = new Date();
    ctx.fillStyle = 'rgba(215,227,238,0.55)';
    ctx.font = (13 * dpr) + 'px system-ui, sans-serif';
    ctx.fillText(pad(d.getHours()) + ':' + pad(d.getMinutes()), cx, S * 0.94);

    if (state.drawMode) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = (17 * dpr) + 'px system-ui, sans-serif';
      ctx.fillText('Bir profil çiz', cx, S * 0.2);
      ctx.fillStyle = 'rgba(215,227,238,0.55)';
      ctx.font = (13 * dpr) + 'px system-ui, sans-serif';
      ctx.fillText('daire · çizgi · serbest şekil', cx, S * 0.25);
      if (state.stroke.length > 1) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3 * dpr;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(state.stroke[0].x, state.stroke[0].y);
        for (var i = 1; i < state.stroke.length; i++) ctx.lineTo(state.stroke[i].x, state.stroke[i].y);
        ctx.stroke();
      }
    }

    if (now < state.toastUntil) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = (15 * dpr) + 'px system-ui, sans-serif';
      ctx.fillText(state.toast, cx, S * 0.79);
    }
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    resize();
    if (state.spin && !state.drag && !state.drawMode) state.yaw += dt * 0.6;
    // yeni cisme yumuşak geçiş
    if (state.fit && state.targetFit) {
      var k = 1 - Math.exp(-dt * 8), f = state.fit, t = state.targetFit;
      f.ox += (t.ox - f.ox) * k; f.oy += (t.oy - f.oy) * k;
      f.oz += (t.oz - f.oz) * k; f.r += (t.r - f.r) * k;
    }
    drawScreen(now);
    requestAnimationFrame(frame);
  }

  selectShape('daire', 'uzat');
  requestAnimationFrame(frame);
})();
