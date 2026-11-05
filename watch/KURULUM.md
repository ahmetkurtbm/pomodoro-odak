# Pomodoro Odak'ı GT 6'ya yükleme (debug)

GT 6, üçüncü parti uygulamalar için **lite wearable** platformunda çalışır: HML + CSS + JavaScript (ES5.1), JerryScript motoru, yaklaşık 1 MB bellek. ArkTS uygulamaları GT 6'ya **yüklenmez**. Bu proje bu yüzden lite JS ile yazıldı.

> ⚠️ Bu adımlar gerçek bir GT 6 üzerinde çalışan açık kaynak bir projeden ve Huawei belgelerinden derlendi. Ama bu proje henüz kendi saatinde denenmedi. Menü adları DevEco sürümüne göre biraz farklı olabilir. Takıldığın yerde ekranın görüntüsünü at, birlikte çözeriz.

## 1. Gerekenler

| Ne | Nereden |
|---|---|
| **DevEco Studio** (5.1 veya üstü) | developer.huawei.com → DevEco Studio indir |
| **Huawei Developer hesabı** (ücretsiz) | developer.huawei.com → kayıt ol, kimlik doğrulamasını tamamla |
| Telefonda **Huawei Health** | Saat bu uygulamayla eşleşmiş olmalı |
| Telefonda **HUAWEI DevEco Assistant** | AppGallery'den. Mağazada çıkmazsa [bu depodaki](https://github.com/megaacheyounes/deveco-studio-assistant) APK'lar var (resmi kaynak değil, Huawei ID girme). Samsung S20 FE + GT 6 ile bağlandığı görüldü |

## 2. Projeyi aç

1. DevEco Studio → **File > Open** → `gt6/watch` klasörünü seç (`entry` klasörünü değil, bir üstünü).
2. İlk açılışta SDK ve hvigor bağımlılıkları iner. "Sync" bitene kadar bekle.
3. Hata çıkarsa: **File > Project Structure > Project** altında SDK'nın yüklü olduğunu kontrol et. Proje `compatibleSdkVersion 5.1.0(18)` ve `targetSdkVersion 6.0.1(21)` kullanıyor. Bu ayarlar GT 6'da çalıştığı doğrulanmış bir projeden alındı.

## 3. Saatin kimliğini (UDID) öğren

İmza dosyası sadece belirli saatlerde çalışır, o yüzden saatinin UDID'si gerekiyor.

- Telefonda **DevEco Assistant**'ı aç. Saat eşleşmişken saat bilgilerinde UDID görünmeli.
- Görünmüyorsa: saatte **Ayarlar > Hakkında**'da yazılım sürümüne art arda dokunarak geliştirici modunu aç, sonra tekrar bak.

## 4. Hata ayıklama imzası oluştur

GT için otomatik imza çalışmayabilir, elle yapmak daha garanti:

1. **Anahtar ve CSR:** DevEco Studio → **Build > Generate Key and CSR**
   - Yeni bir `.p12` anahtar deposu oluştur (şifreyi not al), takma ad (alias) gir.
   - Sonunda bir `.csr` dosyası çıkar.
2. **AppGallery Connect** (developer.huawei.com → AppGallery Connect):
   - **Users and permissions > Certificate management**: yeni bir **Debug** sertifikası oluştur, `.csr` dosyasını yükle, `.cer` dosyasını indir.
   - **Device management**: saati ekle (tür: wearable / watch, UDID'yi yapıştır).
   - **My projects** altında bir proje ve uygulama oluştur. Paket adı: `com.ahmet.bilekholo` (bkz. `entry/src/main/config.json`; değiştirirsen iki yerde de değiştir).
   - **HAP Provision Profile**: **Debug** türünde profil oluştur, sertifikayı ve saati seç, `.p7b` dosyasını indir.
3. DevEco Studio → **File > Project Structure > Signing Configs**:
   - "Automatically generate signature" işaretini kaldır.
   - **Store file** (`.p12`), şifreler, **Key alias**, **Profile file** (`.p7b`) ve **Certificate file** (`.cer`) alanlarını doldur.
   - Bu ayar `build-profile.json5` dosyasına yazılır. Dosyada şifren olacağı için başkasıyla paylaşma. `.p12`, `.cer` ve `.p7b` dosyaları `.gitignore`'da.

## 5. Derle ve yükle

GT'de Wi-Fi veya kabloyla doğrudan yükleme (hdc) **yok**. Yükleme telefon üzerinden yapılıyor:

1. DevEco Studio → **Build > Build Hap(s)/APP(s) > Build Hap(s)**
2. İmzalı dosya: `entry/build/default/outputs/default/entry-default-signed.hap`
3. Bu dosyayı telefona at (USB, bulut ya da e-posta).
4. Telefonda **DevEco Assistant** → saat bağlıyken HAP dosyasını seçip yükle.
5. Saatte uygulama listesinde **Pomodoro Odak** çıkmalı.
6. Hata ayıklama kayıtları için DevEco Assistant'ta **View Logs** (查看日志) bölümünü kullanabilirsin.

## 6. Uygulamayı kullanma

| Hareket | Ne yapar |
|---|---|
| **Bileği eğ** | Hologram eğime göre döner (ivmeölçer) |
| Üstteki **Bilek: açık** yazısına dokun | Bilek modunu kapatır, cisim kendi kendine döner |
| **Profil** | Sıradaki profil (daire, kare, üçgen…) |
| **İşlem** | Sıradaki işlem (uzat, sivrilt, burgu, döndür, süpür) |
| **Çiz** | Ekrana parmakla profil çiz. Daire ve çizgi tanınır, başka şekiller serbest profil olur |
| **Sola / sağa kaydır** | Hazır cisimler (küp, simit, Möbius, Klein şişesi…) |

## "Installation failed: 40. Invalid configuration file format"

Bu hata `config.json` ile ilgili değil, **simgeyle** ilgili. GT 6, `resources/base/media` klasöründe iki simge istiyor: `icon.png` (104×104) ve `icon_small.png` (92×92). Tek simge varsa ya da boyutu farklıysa yükleme bu hatayla reddediliyor (2026-11-05'te denendi). Derlemedeki `can not sign bin with codesign` uyarısı zararsız, çalışan projelerde de çıkıyor.

## "Installation failed: 34. Internal error"

Saatin JavaScript motoru regex (düzenli ifade) desteklemiyor. Kodda `/.../` ya da `RegExp` varsa kurulum bu hatayla düşüyor. `prototype/core` altında regex kullanma (2026-11-05'te denendi).

HAP dosyasını telefonda **Dahili depolama/haps** klasörüne koy. DevEco Assistant'ın **Apps** ekranı dosyaları buradan okuyor.

## Canvas animasyonu saati çökertiyor

GT 6'nın canvas'ı her çizim komutunu (çizgi de olsa `fillRect` noktası da olsa) bellekte tutuyor ve bırakmıyor. Tek bir çizim sorunsuz, ama birkaç bin komuttan sonra saat çöküp yeniden başlıyor. Tam sayı koordinat, ayrı yollar ya da stili bir kez atamak işe yaramıyor, `clearRect` ise saatte hiç yok (2026-11-05'te teşhis uygulamalarıyla denendi). Ayrıca ivmeölçer üçüncü parti uygulamaya `0 0 0` veriyor.

Bu yüzden hologram artık **resim dizisi**: kareler bilgisayarda çiziliyor, saat sırayla gösteriyor.

```bash
node tools/render-frames.js frames.json
python tools/frames-to-png.py frames.json watch/entry/src/main/js/MainAbility/common/frames
```

DevEco her resmi ham bitmap'e çevirir (160×160 kare ≈ 100 KB). Kare sayısını düşük tut: her cisim yalnızca dönüş simetrisi kadar çiziliyor (simit 30°, küp 90°).

Saatin derleyicisi `class="{{...}}"` biçiminde sınıfı veriye bağlamayı kabul etmiyor. Bunun yerine sabit sınıflı öğeler ve `show="{{...}}"` kullan.

## Bilinen riskler

- **İvmeölçer izni:** Belgelerde `ohos.permission.ACCELEROMETER` "sistem izni" olarak geçiyor. Saat bu izni üçüncü parti uygulamaya vermezse üstte "Sensör yok (kod)" yazar. O zaman hologram yine kendi kendine döner. Hata kodunu bana yazarsan alternatif bir yol ararız.
- **Hız:** Her karede yaklaşık 540 çizgi çiziliyor, hedef saniyede 10 kare. Yavaş kalırsa `pages/index/index.js` içindeki `NU`, `NV` (ızgara) ve `FRAME_MS` değerlerini düşürürüz.
- **Canvas:** Lite canvas'ın desteklediği çizim komutları sınırlı. Kodda sadece `fillRect`, `beginPath`, `moveTo`, `lineTo` ve `stroke` kullanıldı. Ekran boş kalırsa ilk bakılacak yer burası.

## Kodu güncellemek

Çekirdek (formül motoru, şekiller, çizici, çizim tanıma) **tek kaynaktan** geliyor: `prototype/core/`. Orayı değiştirdikten sonra saate kopyalamak için:

```bash
node tools/sync-core.js
```

`watch/.../common/holo/` altındaki dosyaları elle düzenleme, bu komut her seferinde onları yeniden yazar.
