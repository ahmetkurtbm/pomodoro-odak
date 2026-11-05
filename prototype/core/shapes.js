var Holo = Holo || {};

// Profil × işlem = cisim. Her ikisi de formül satırları olarak tanımlı;
// birleşince Holo.Surface'in çalıştırdığı tek bir program oluşur.
Holo.Shapes = (function () {
  var PI = Math.PI;

  // Profil: u parametresine göre 2D eğri (px, py)
  var PROFILES = [
    { id: 'daire', name: 'Daire', closed: true, u: '0 .. 2*pi',
      lines: ['px = cos(u)', 'py = sin(u)'] },
    { id: 'kare', name: 'Kare', closed: true, u: '0 .. 2*pi',
      lines: ['px = spow(cos(u), 0.12)', 'py = spow(sin(u), 0.12)'] },
    { id: 'ucgen', name: 'Üçgen', closed: true, u: '0 .. 2*pi',
      lines: ['r = 0.5 / cos(u % (2*pi/3) - pi/3)', 'px = r*cos(u + pi/2)', 'py = r*sin(u + pi/2)'] },
    { id: 'yildiz', name: 'Yıldız', closed: true, u: '0 .. 2*pi',
      lines: ['r = 0.45 + 0.55*abs(2*((5*u/(2*pi)) % 1) - 1)', 'px = r*cos(u + pi/2)', 'py = r*sin(u + pi/2)'] },
    { id: 'kalp', name: 'Kalp', closed: true, u: '0 .. 2*pi',
      lines: ['px = sin(u)^3', 'py = (13*cos(u) - 5*cos(2*u) - 2*cos(3*u) - cos(4*u))/16'] },
    { id: 'yarimdaire', name: 'Yarım daire', closed: false, u: '-pi/2 .. pi/2',
      lines: ['px = cos(u)', 'py = sin(u)'] },
    { id: 'dalga', name: 'Dalgalı çizgi', closed: false, u: '-1 .. 1',
      lines: ['px = 0.55 + 0.22*sin(3*u + 0.6)', 'py = 1.4*u'] },
    { id: 'cizgi', name: 'Çizgi', closed: false, u: '-1 .. 1',
      lines: ['px = u', 'py = 0'] },
    { id: 'serbest', name: 'Serbest çizim', closed: true, u: '0 .. 1',
      lines: ['px = fx(u)', 'py = fy(u)'] }
  ];

  // İşlem türleri: v parametresiyle profili 3D'ye taşır
  var KINDS = {
    extrude: {
      help: 'a: yükseklik, b: üst ölçek, c: burgu',
      lines: [
        's = 1 + (b - 1)*v',
        't = c*v',
        'x = s*(px*cos(t) - py*sin(t))',
        'y = s*(px*sin(t) + py*cos(t))',
        'z = a*(v - 0.5)'
      ],
      labels: {
        a: { label: 'Yükseklik', min: 0.1, max: 5, step: 0.01 },
        b: { label: 'Üst ölçek (sivrilt)', min: 0, max: 2, step: 0.01 },
        c: { label: 'Burgu', min: -2 * PI, max: 2 * PI, step: 0.01, angle: true }
      }
    },
    revolve: {
      help: 'a: eksen uzaklığı, b: dönüş açısı',
      lines: [
        'r = a + px',
        'q = b*v',
        'x = r*cos(q)',
        'y = r*sin(q)',
        'z = py'
      ],
      labels: {
        a: { label: 'Eksen uzaklığı', min: 0, max: 3, step: 0.01 },
        b: { label: 'Dönüş açısı', min: 0, max: 2 * PI, step: 0.01, angle: true }
      }
    },
    sweep: {
      help: 'a: yol yarıçapı, b: tur, c: burgu, d: tur başına yükseklik, k: profil boyutu',
      lines: [
        'q = 2*pi*b*v',
        't = c*v',
        'qx = k*(px*cos(t) - py*sin(t))',
        'qy = k*(px*sin(t) + py*cos(t))',
        'x = (a + qx)*cos(q)',
        'y = (a + qx)*sin(q)',
        'z = d*b*(v - 0.5) + qy'
      ],
      labels: {
        a: { label: 'Yol yarıçapı', min: 0, max: 3, step: 0.01 },
        b: { label: 'Tur sayısı', min: 0.1, max: 6, step: 0.01 },
        c: { label: 'Burgu', min: -2 * PI, max: 2 * PI, step: 0.01, angle: true },
        d: { label: 'Tur başına yükseklik', min: 0, max: 2, step: 0.01 },
        k: { label: 'Profil boyutu', min: 0.05, max: 1.5, step: 0.01 }
      }
    }
  };

  var OPS = [
    { id: 'uzat', name: 'Uzat', kind: 'extrude', params: { a: 2, b: 1, c: 0 } },
    { id: 'sivrilt', name: 'Sivrilt', kind: 'extrude', params: { a: 2, b: 0, c: 0 } },
    { id: 'burgu', name: 'Burgu', kind: 'extrude', params: { a: 2.4, b: 1, c: PI } },
    // a boş: profil kapalıysa simit gibi eksenden uzak, açıksa eksende döner
    { id: 'dondur', name: 'Döndür', kind: 'revolve', params: { b: 2 * PI } },
    { id: 'supur', name: 'Süpür', kind: 'sweep', params: { a: 1.6, b: 1, c: 0, d: 0, k: 0.45 } }
  ];

  var FORMULAS = {
    klein: {
      name: 'Klein şişesi',
      text: [
        '# Klein şişesi (8 biçimli daldırma)',
        '# İçi ve dışı olmayan, kendi içinden geçen kapalı yüzey.',
        'u: 0 .. 2*pi',
        'v: 0 .. 2*pi',
        'w = cos(u/2)*sin(v) - sin(u/2)*sin(2*v)',
        'x = (a + w)*cos(u)',
        'y = (a + w)*sin(u)',
        'z = sin(u/2)*sin(v) + cos(u/2)*sin(2*v)'
      ],
      params: { a: 2.5 },
      labels: { a: { label: 'Halka yarıçapı', min: 1, max: 4, step: 0.01 } }
    },
    kabuk: {
      name: 'Deniz kabuğu',
      text: [
        '# Logaritmik spiral kabuk',
        'u: 0 .. a*pi',
        'v: 0 .. 2*pi',
        'g = exp(b*u/(a*pi))',
        'x = 2*(1 - g)*cos(u)*cos(v/2)^2',
        'y = 2*(g - 1)*sin(u)*cos(v/2)^2',
        'z = 1 - g^2 - sin(v) + g*sin(v)'
      ],
      params: { a: 6, b: 1 },
      labels: {
        a: { label: 'Sarım (yarım tur)', min: 2, max: 10, step: 0.01 },
        b: { label: 'Büyüme', min: 0.2, max: 1.6, step: 0.01 }
      }
    },
    superelipsoid: {
      name: 'Süper elipsoid',
      text: [
        '# Süper elipsoid: a ve b küçükse kutu, 1 ise küre, büyükse yıldız',
        'u: -pi/2 .. pi/2',
        'v: -pi .. pi',
        'x = spow(cos(u), a)*spow(cos(v), b)',
        'y = spow(cos(u), a)*spow(sin(v), b)',
        'z = spow(sin(u), a)'
      ],
      params: { a: 0.3, b: 0.3 },
      labels: {
        a: { label: 'Dikey keskinlik', min: 0.05, max: 4, step: 0.01 },
        b: { label: 'Yatay keskinlik', min: 0.05, max: 4, step: 0.01 }
      }
    },
    dini: {
      name: 'Dini yüzeyi',
      text: [
        '# Dini yüzeyi: burgulu psödoküre',
        'u: 0 .. 4*pi',
        'v: 0.1 .. 2',
        'x = a*cos(u)*sin(v)',
        'y = a*sin(u)*sin(v)',
        'z = a*(cos(v) + log(tan(v/2))) + b*u'
      ],
      params: { a: 1, b: 0.2 },
      labels: {
        a: { label: 'Ölçek', min: 0.3, max: 2, step: 0.01 },
        b: { label: 'Burgu adımı', min: 0, max: 0.6, step: 0.01 }
      }
    }
  };

  // Hazır cisimler galerisi: ya profil+işlem ya da doğrudan formül
  var GALLERY = [
    { name: 'Küp', profile: 'kare', op: 'uzat', params: { a: 2 } },
    { name: 'Koni', profile: 'daire', op: 'sivrilt' },
    { name: 'Piramit', profile: 'kare', op: 'sivrilt' },
    { name: 'Küre', profile: 'yarimdaire', op: 'dondur', params: { a: 0 } },
    { name: 'Simit', profile: 'daire', op: 'dondur', params: { a: 2 } },
    { name: 'Vazo', profile: 'dalga', op: 'dondur', params: { a: 0 } },
    { name: 'Burgulu kule', profile: 'kare', op: 'burgu', params: { a: 3, b: 0.6, c: PI / 2 } },
    { name: 'Matkap ucu', profile: 'yildiz', op: 'burgu', params: { a: 3.2, b: 0.15, c: 2 * PI } },
    { name: 'Kalp prizması', profile: 'kalp', op: 'uzat', params: { a: 0.8 } },
    { name: 'Yay', profile: 'daire', op: 'supur', params: { a: 1.4, b: 4, d: 0.8, k: 0.28 } },
    { name: 'Möbius şeridi', profile: 'cizgi', op: 'supur', params: { a: 1.6, b: 1, c: PI, d: 0, k: 0.6 } },
    { name: 'Klein şişesi', formula: 'klein' },
    { name: 'Deniz kabuğu', formula: 'kabuk' },
    { name: 'Süper elipsoid', formula: 'superelipsoid' },
    { name: 'Dini yüzeyi', formula: 'dini' }
  ];

  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function copy(o) {
    var r = {};
    for (var k in o) if (o.hasOwnProperty(k)) r[k] = o[k];
    return r;
  }

  // closedOverride: serbest çizimde profilin kapalı olup olmadığı çizime bağlı
  function build(profileId, opId, overrides, closedOverride) {
    var profile = find(PROFILES, profileId), op = find(OPS, opId), kind = KINDS[op.kind];
    var closed = closedOverride == null ? profile.closed : closedOverride;
    var params = copy(op.params), k;
    if (op.kind === 'revolve') params.a = closed ? 2 : 0;
    if (overrides) for (k in overrides) if (overrides.hasOwnProperty(k)) params[k] = overrides[k];

    var text = ['# Profil: ' + profile.name, 'u: ' + profile.u]
      .concat(profile.lines)
      .concat(['', '# İşlem: ' + op.name + '  (' + kind.help + ')', 'v: 0 .. 1'])
      .concat(kind.lines)
      .join('\n');

    return { text: text, params: params, labels: kind.labels, title: profile.name + ' · ' + op.name };
  }

  function buildFormula(id) {
    var f = FORMULAS[id];
    return { text: f.text.join('\n'), params: copy(f.params), labels: f.labels, title: f.name };
  }

  return {
    PROFILES: PROFILES, OPS: OPS, GALLERY: GALLERY,
    build: build, buildFormula: buildFormula
  };
})();
