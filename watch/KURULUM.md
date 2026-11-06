# Pomodoro Odak'ı GT 6'ya yükleme (debug)

GT 6, üçüncü parti uygulamalar için **lite wearable** platformunda çalışır: HML + CSS + JavaScript (ES5.1), JerryScript motoru, yaklaşık 1 MB bellek. ArkTS (Stage) uygulamaları GT 6'ya yüklenmez, bu proje bu yüzden lite JS ile yazıldı.

Bu adımlar Huawei Watch GT 6 ve Samsung Galaxy S20 FE ile denendi. Menü adları DevEco Studio ve AppGallery Connect sürümüne göre biraz farklı olabilir.

## 1. Gerekenler

| Ne | Nereden |
|---|---|
| **DevEco Studio** 5.1 veya üstü (6.1 ile denendi) | developer.huawei.com → DevEco Studio. `winget`'teki paket eski (3.1), kullanma |
| **Huawei Developer hesabı** | developer.huawei.com. Sertifika ve profil için bireysel kimlik doğrulaması gerekir: kimlik ve adın ile IBAN'ın yazdığı bir banka belgesi |
| Telefonda **Huawei Health** | Saat bu uygulamayla eşleşmiş olmalı |
| Telefonda **HUAWEI DevEco Assistant** | AppGallery'de çıkmazsa [bu depodaki](https://github.com/megaacheyounes/deveco-studio-assistant) APK'lar kullanılabilir (resmi kaynak değil, içine Huawei ID girilmemeli). Samsung telefonda v1.2.1.900 saate bağlandı, v1.1.3 bağlanmadı |

## 2. Projeyi aç

1. DevEco Studio → **File > Open** → `watch` klasörü (`entry` değil, bir üstü).
2. `build-profile.example.json5` dosyasını `build-profile.json5` olarak kopyala. Gerçek dosya imza şifrelerini içerdiği için depoda yok.
3. İlk açılışta SDK ve hvigor bağımlılıkları iner, **Sync** bitene kadar bekle. Proje `compatibleSdkVersion 5.1.0(18)` ve `targetSdkVersion 6.0.1(21)` kullanıyor.

## 3. Saatin UDID'si

İmza profili yalnızca kayıtlı saatlerde çalışır. DevEco Assistant'ta **Lite Wearable** sekmesi açıkken saat modeli ve UDID görünür, **Copy** ile kopyalanır.

## 4. Debug imzası

1. **Anahtar ve CSR:** DevEco Studio → **Build > Generate Key and CSR**. `.p12` anahtar deposu, şifre ve takma ad (alias) belirle; sonunda bir `.csr` çıkar. Dosyaları proje klasörünün dışında tut, şifreyi bir yere not et. Şifre unutulursa anahtar, sertifika ve profil yeniden oluşturulmalı.
2. **AppGallery Connect → Certificates, app IDs, and profiles:**
   - **Certificates:** **Debug** sertifikası oluştur, `.csr` dosyasını yükle, `.cer` dosyasını indir.
   - **Devices:** saati ekle (tür: Smart watch, UDID'yi yapıştır, 64 karakter).
   - **App IDs:** HarmonyOS app, paket adı `com.ahmet.bilekholo` (bkz. `entry/src/main/config.json`). Açık yetenek (Push, Map vb.) gerekmez.
   - **Profiles:** **Debug** profili; uygulama, sertifika ve saat seçilir. "Restricted ACL permissions" boş kalır. `.p7b` dosyasını indir.
3. DevEco Studio → **File > Project Structure > Project > Signing Configs**: "Automatically generate signature" kapalı; `.p12`, şifreler, alias, `.p7b` ve `.cer` girilir. Şifre yanlışsa hata ancak derlemede çıkar: `11014003 Init keystore failed / keystore password was incorrect`.

## 5. Derle ve yükle

GT'de Wi-Fi ya da kabloyla doğrudan yükleme (hdc) yok, yükleme telefon üzerinden yapılır.

1. DevEco Studio → **Build > Build Hap(s)/APP(s) > Build Hap(s)**. İmzalı dosya: `entry/build/default/outputs/default/entry-default-signed.hap`.
2. Dosyayı telefonda **Dahili depolama/haps** klasörüne koy (klasör yoksa oluştur; telefon USB ile "Dosya aktarımı" modunda bilgisayara bağlanıp oradan kopyalanabilir). DevEco Assistant'ın **Apps** ekranı dosyaları bu klasörden okur.
3. Saat Health'e bağlıyken DevEco Assistant → **Apps → Install**. Paket adı aynı olduğu için son yüklenen sürüm öncekinin yerini alır.
4. Saatte uygulama listesinde **Pomodoro Odak** görünür.

Ekran görüntüsü: saatteki iki tuşa aynı anda bas. Görüntü telefonun galerisine kaydedilir.

## 6. Kullanım

| Hareket | Ne yapar |
|---|---|
| Ortadaki büyük düğme | Başlat / duraklat |
| Soldaki düğme | Aşamayı baştan başlat |
| Sağdaki düğme | Sonraki aşamaya atla (istatistiğe yazılmaz) |
| **MENÜ** ya da sağdan sola kaydırma | Menü: zamanlayıcı, istatistik, ayarlar, mola köşesi |
| Soldan sağa kaydırma | Bir önceki sayfa; zamanlayıcıda uygulamadan çıkış |

## GT 6'nın kısıtları ve kurulum hataları

### "Installation failed: 40. Invalid configuration file format"

Hata `config.json` ile değil, **simgeyle** ilgili. GT 6, `resources/base/media` içinde iki simge ister: `icon.png` 104×104 ve `icon_small.png` 92×92. Tek simge varsa ya da boyut farklıysa yükleme reddedilir. Derlemedeki `can not sign bin with codesign` uyarısı zararsızdır.

### "Installation failed: 34. Internal error"

JavaScript motoru regex desteklemez. Saate giden kodda `/.../` ya da `RegExp` varsa kurulum bu hatayla düşer. `npm test` saate giden kodu bunun için tarar.

### Canvas animasyonu saati çökertiyor

Canvas her çizim komutunu (çizgi ya da `fillRect`) bellekte tutar ve bırakmaz. Tek bir çizim sorunsuzdur, ama birkaç bin komuttan sonra saat çöküp yeniden başlar. Tam sayı koordinat, ayrı yollar ya da stili bir kez atamak işe yaramaz; `clearRect` saatte yok. Bu yüzden:

- Zamanlayıcı halkası hazır `progress` (`type="arc"`) bileşenidir.
- Hologram bir **resim dizisidir**: kareler bilgisayarda çizilir, saat sırayla gösterir.

```bash
node tools/render-frames.js frames.json
python tools/frames-to-png.py frames.json watch/entry/src/main/js/MainAbility/common/frames
```

DevEco her resmi ham bitmap'e çevirir (160×160 kare yaklaşık 100 KB). Kare sayısı düşük tutulur: her cisim yalnızca dönüş simetrisi kadar çizilir (simit 30°, küp 90°).

### Diğerleri

- `class="{{...}}"` biçiminde sınıfı veriye bağlamak derlemede hata verir. Sabit sınıflı öğeler ve `show="{{...}}"` kullanılır.
- `:active` basılı stili derlenir ama saatte görünmez. Basınca tepki kısa bir titreşimle verilir.
- İvmeölçer üçüncü parti uygulamaya `0 0 0` verir. Titreşim (`@system.vibrator`), kayıt (`@system.storage`) ve ekranı açık tutma (`@system.brightness`) çalışır; ekran kararınca zamanlayıcı ve titreşim devam eder.

## Kodu güncellemek

Hologram çekirdeği (formül motoru, şekiller) tek kaynaktan gelir: `prototype/core/`. Değişiklikten sonra saat tarafına kopyalamak için `node tools/sync-core.js`; `common/holo/` altındaki dosyalar elle düzenlenmez.

Testler: `npm test` (Node 20+). Pomodoro motoru saatin parçaları taklit edilerek çalıştırılır; tur geçişleri, uzun mola sırası, kayıt, istatistik ve seri test edilir.
