# GT6 · Bilek Holo

Huawei Watch GT 6 için bilekle 3D modelleme projesi. Havada bir **profil** çizersin (daire, kare, serbest çizim...), sonra ona bir **işlem** uygularsın (uzat, sivrilt, burgu, döndür, süpür). Sonuçta çıkan cisim saatte hologram gibi dönen bir tel kafes olarak görünür. Her cisim aslında bir **parametrik formül** ve o formülü doğrudan düzenleyebilirsin.

## Şu anki durum: tarayıcı prototipi

`prototype/index.html` dosyasını tarayıcıda aç (çift tıklamak yeterli, sunucu gerekmiyor).

- **Saat ekranı:** 466×466, GT 6 46 mm ekranı boyutunda. Sürükleyerek cismi döndürürsün.
- **Çiz:** Saat ekranına bir şekil çizersin. Daire ya da düz çizgi çizdiysen kusursuz haline çevrilir, başka bir şekilse serbest profil olarak kullanılır.
- **Bilek modu:** Telefonda açarsan telefonu eğerek cismi döndürürsün (saatteki bilek hareketinin provası).
- **Formül:** Her cismin formülü panelde görünür. Değiştirdiğin anda cisim de değişir.

## Formül dili

```
# yorum
u: 0 .. 2*pi        # u aralığı (profil boyunca)
v: 0 .. 1           # v aralığı (işlem boyunca)
px = cos(u)         # ara değişkenler, yukarıdan aşağı hesaplanır
x = ...             # x, y, z zorunlu (z yukarı)
```

- Parametreler: `a b c d k`, panelde kaydırıcıyla değişir.
- Operatörler: `+ - * / % ^`, `2pi` gibi örtük çarpma da çalışır. `%` matematiksel mod işlemidir.
- Fonksiyonlar: `sin cos tan asin acos atan atan2 sinh cosh tanh sqrt abs exp log pow min max floor ceil round sign mod spow`
- `spow(x, p)`: işaretli üs. Süper elips/kare için kullanılır.
- `fx(u), fy(u)`: serbest çizimin koordinatları (u: 0..1).

## Klasör yapısı

```
prototype/
  index.html, style.css, app.js   tarayıcı arayüzü (yalnızca prototip)
  core/                           saate taşınacak çekirdek (DOM yok, ES5)
    expr.js      ifade ayrıştırıcı — eval / new Function kullanmaz
    surface.js   formül programı → nokta ızgarası
    shapes.js    profiller, işlemler, hazır cisimler
    render.js    tel kafes hologram çizici (yalnızca temel canvas 2D)
    gesture.js   çizim örnekleme + daire/çizgi tanıma
```

`core/` klasörü saatte de aynen çalışacak şekilde yazıldı: ES5, DOM yok. Saatin JavaScript motorunda (JerryScript) `eval` olmayabileceği için formüller kendi yazdığımız ayrıştırıcıyla çalışıyor.

```
watch/                            GT 6 DevEco Studio projesi
  entry/src/main/config.json      uygulama tanımı (liteWearable)
  entry/src/main/js/MainAbility/
    pages/index/                  saat ekranı (hml + css + js)
    common/holo/                  prototype/core'un otomatik kopyası
tools/sync-core.js                çekirdeği saate kopyalar
```

## Saat sürümü

`watch/` klasörü GT 6 için DevEco Studio projesi (lite wearable, HML + CSS + JS). Kurulum ve imzalama adımları: [watch/KURULUM.md](watch/KURULUM.md).

Çekirdek tek kaynaktan geliyor. `prototype/core/` altında bir değişiklik yaptıktan sonra `node tools/sync-core.js` komutunu çalıştır.

## Yol haritası

1. ✅ Tarayıcı prototipi: profil × işlem, formül editörü, hologram görünüm
2. ✅ Saat projesi: GT 6 = lite wearable (JS) doğrulandı, bilek eğimiyle döndürme, parmakla çizim, hazır cisimler
3. ⬜ Saatte ilk deneme: imzalama, yükleme, ivmeölçer izni ve performans kontrolü
4. ⬜ Havada hareket tanıma: ivmeölçer verisinden daire, çizgi gibi hareketleri tanıma (şablon eşleme / DTW)
5. ⬜ Birden çok cismi aynı sahnede birleştirme
