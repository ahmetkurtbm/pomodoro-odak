// Kalıcı kayıt (@system.storage). Değerler düz metin tutulur; JSON yerine
// virgüllü listeler kullanılır, saatin JavaScript motoru küçük tutulmuştur.
import storage from '@system.storage';

function get(key, def, cb) {
  try {
    storage.get({
      key: key,
      default: def,
      success: function (v) { cb(v === undefined || v === null || v === '' ? def : '' + v); },
      fail: function () { cb(def); }
    });
  } catch (e) {
    cb(def);
  }
}

function set(key, value) {
  try {
    storage.set({ key: key, value: '' + value });
  } catch (e) { /* kayıt olmazsa uygulama yine çalışır */ }
}

// "25,5,15" -> [25, 5, 15]
function numbers(text) {
  var parts = ('' + text).split(','), out = [], i;
  for (i = 0; i < parts.length; i++) out.push(parseFloat(parts[i]) || 0);
  return out;
}

export default { get: get, set: set, numbers: numbers };
