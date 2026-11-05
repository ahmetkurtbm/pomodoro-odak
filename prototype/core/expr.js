var Holo = Holo || {};

// Küçük matematik ifade ayrıştırıcısı. eval / new Function kullanmaz;
// ifadeyi bir kez kapanış (closure) ağacına derler, sonra hızlıca çalıştırır.
// Saate taşınabilmesi için ES5 ile yazıldı.
Holo.Expr = (function () {
  function mod(a, b) { return a - b * Math.floor(a / b); }

  var FUNCS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
    sinh: function (x) { return (Math.exp(x) - Math.exp(-x)) / 2; },
    cosh: function (x) { return (Math.exp(x) + Math.exp(-x)) / 2; },
    tanh: function (x) { var a = Math.exp(2 * x); return (a - 1) / (a + 1); },
    sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp, log: Math.log, pow: Math.pow,
    min: Math.min, max: Math.max, floor: Math.floor, ceil: Math.ceil, round: Math.round,
    sign: function (x) { return x > 0 ? 1 : x < 0 ? -1 : 0; },
    mod: mod,
    // işaretli üs: süper elips ve süper elipsoid için
    spow: function (x, p) { return (x < 0 ? -1 : 1) * Math.pow(Math.abs(x), p); }
  };

  var CONSTS = { pi: Math.PI, PI: Math.PI, tau: 2 * Math.PI };

  function isDigit(c) { return c >= '0' && c <= '9'; }
  function isIdStart(c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'; }

  function tokenize(src) {
    var toks = [], i = 0, c, j;
    while (i < src.length) {
      c = src.charAt(i);
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (isDigit(c) || (c === '.' && isDigit(src.charAt(i + 1)))) {
        j = i;
        while (j < src.length && (isDigit(src.charAt(j)) || src.charAt(j) === '.')) j++;
        toks.push({ t: 'num', v: parseFloat(src.slice(i, j)) });
        i = j;
        continue;
      }
      if (isIdStart(c)) {
        j = i;
        while (j < src.length && (isIdStart(src.charAt(j)) || isDigit(src.charAt(j)))) j++;
        toks.push({ t: 'id', v: src.slice(i, j) });
        i = j;
        continue;
      }
      if (c === '*' && src.charAt(i + 1) === '*') { toks.push({ t: 'op', v: '^' }); i += 2; continue; }
      if ('+-*/%^(),'.indexOf(c) >= 0) { toks.push({ t: 'op', v: c }); i++; continue; }
      throw new Error("beklenmeyen karakter '" + c + "'");
    }
    return toks;
  }

  // resolve(ad) -> env içindeki yuva numarası, yoksa -1
  // extraFuncs: { ad: fonksiyon } ek fonksiyonlar (ör. serbest çizim fx/fy)
  function compile(src, resolve, extraFuncs) {
    var toks = tokenize(src), pos = 0;

    function peek() { return toks[pos]; }
    function isOp(tok, v) { return tok && tok.t === 'op' && tok.v === v; }
    function expect(v) {
      if (!isOp(peek(), v)) throw new Error("'" + v + "' bekleniyordu");
      pos++;
    }
    function startsPrimary(tok) {
      return tok && (tok.t === 'num' || tok.t === 'id' || isOp(tok, '('));
    }

    function parseAdd() {
      var left = parseMul(), op, right;
      while (isOp(peek(), '+') || isOp(peek(), '-')) {
        op = toks[pos++].v;
        right = parseMul();
        left = op === '+' ? add(left, right) : sub(left, right);
      }
      return left;
    }

    function parseMul() {
      var left = parseUnary(), op, right;
      for (;;) {
        if (isOp(peek(), '*') || isOp(peek(), '/') || isOp(peek(), '%')) {
          op = toks[pos++].v;
          right = parseUnary();
          left = op === '*' ? mul(left, right) : op === '/' ? div(left, right) : modOp(left, right);
        } else if (startsPrimary(peek())) {
          // örtük çarpma: 2pi, 3cos(u), (a+1)(b+1)
          left = mul(left, parsePow());
        } else {
          return left;
        }
      }
    }

    function parseUnary() {
      if (isOp(peek(), '-')) { pos++; return neg(parseUnary()); }
      if (isOp(peek(), '+')) { pos++; return parseUnary(); }
      return parsePow();
    }

    function parsePow() {
      var base = parsePrimary();
      if (isOp(peek(), '^')) { pos++; return pow(base, parseUnary()); }
      return base;
    }

    function parsePrimary() {
      var tok = peek();
      if (!tok) throw new Error('ifade eksik');
      if (tok.t === 'num') { pos++; return constant(tok.v); }
      if (isOp(tok, '(')) {
        pos++;
        var inner = parseAdd();
        expect(')');
        return inner;
      }
      if (tok.t === 'id') {
        pos++;
        if (isOp(peek(), '(')) return parseCall(tok.v);
        if (CONSTS.hasOwnProperty(tok.v)) return constant(CONSTS[tok.v]);
        var slot = resolve(tok.v);
        if (slot < 0) throw new Error("bilinmeyen değişken '" + tok.v + "'");
        return variable(slot);
      }
      throw new Error("beklenmeyen '" + tok.v + "'");
    }

    function parseCall(name) {
      var f = (extraFuncs && extraFuncs.hasOwnProperty(name)) ? extraFuncs[name]
        : FUNCS.hasOwnProperty(name) ? FUNCS[name] : null;
      if (!f) throw new Error("bilinmeyen fonksiyon '" + name + "'");
      expect('(');
      var args = [];
      if (!isOp(peek(), ')')) {
        args.push(parseAdd());
        while (isOp(peek(), ',')) { pos++; args.push(parseAdd()); }
      }
      expect(')');
      return call(f, args);
    }

    var root = parseAdd();
    if (pos < toks.length) throw new Error("fazladan '" + toks[pos].v + "'");
    return root;
  }

  function constant(c) { return function () { return c; }; }
  function variable(i) { return function (env) { return env[i]; }; }
  function add(a, b) { return function (env) { return a(env) + b(env); }; }
  function sub(a, b) { return function (env) { return a(env) - b(env); }; }
  function mul(a, b) { return function (env) { return a(env) * b(env); }; }
  function div(a, b) { return function (env) { return a(env) / b(env); }; }
  function modOp(a, b) { return function (env) { return mod(a(env), b(env)); }; }
  function neg(a) { return function (env) { return -a(env); }; }
  function pow(a, b) { return function (env) { return Math.pow(a(env), b(env)); }; }
  function call(f, args) {
    var a0 = args[0], a1 = args[1];
    if (args.length === 0) return function () { return f(); };
    if (args.length === 1) return function (env) { return f(a0(env)); };
    if (args.length === 2) return function (env) { return f(a0(env), a1(env)); };
    return function (env) {
      var vals = [];
      for (var i = 0; i < args.length; i++) vals.push(args[i](env));
      return f.apply(null, vals);
    };
  }

  return { compile: compile, FUNCS: FUNCS, CONSTS: CONSTS };
})();
