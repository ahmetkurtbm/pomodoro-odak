# Pomodoro Odak'ı AppGallery'de yayınlama

Mağaza **release** imzası ister. Release paketi saate değil AppGallery Connect'e yüklenir ve Huawei incelemesinden sonra yayınlanır. Saatte denemek için debug paketi kullanılır (bkz. [KURULUM.md](KURULUM.md)).

## Ad

"Pomodoro Technique" ve "Pomodoro" Francesco Cirillo'nun tescilli markasıdır. Tek başına "Pomodoro" adı incelemede sorun çıkarabileceği için uygulama **Pomodoro Odak** adını kullanır. Ad `entry/src/main/resources/base/element/string.json` içindedir ve mağazadaki adla aynı olmalıdır.

## 1. Release sertifikası ve profili

AppGallery Connect → **Certificates, app IDs, and profiles**:

1. **Certificates → New certificate**, tür **Release**. Debug için oluşturulan `.csr` tekrar kullanılabilir; o zaman anahtar ve şifre de aynı kalır.
2. **Profiles → Add**: uygulama `com.ahmet.bilekholo`, tür **Release**, sertifika olarak release sertifikası. Release profilinde cihaz seçilmez, "Restricted ACL permissions" boş kalır. Profilin dağıtım türü `app_gallery` olur.

Paket adı `com.ahmet.bilekholo` projenin ilk adından kalmıştır. App ID oluşturulduktan sonra değiştirilemez; kullanıcılar görmez.

## 2. Release derlemesi

`build-profile.json5` içinde iki imza ayarı ve iki ürün vardır (bkz. `build-profile.example.json5`):

- `default`: debug imzası, saate yükleme için
- `release`: release sertifikası ve profili, mağaza için

```bash
hvigorw assembleApp -p product=release -p buildMode=release
```

DevEco Studio'da ürün `release` seçilip **Build > Build Hap(s)/APP(s) > Build APP(s)** ile de derlenir. Mağazaya yüklenen dosya `build/outputs/release/watch-release-signed.app`.

## 3. AppGallery Connect

1. **Apps and atomic services → Release**: paket adı, uygulama adı (Pomodoro Odak), cihaz **Smart watch**, varsayılan dil Türkçe.
2. **Package management → Upload**: `.app` dosyası, kullanım senaryosu "Testing and official release", Çin anakarası "No".
3. **App information**:
   - Cihazlar: yalnızca **Smart watch**. Paket tek cihaz türü destekler; Sports watch da seçilirse paket sürüm ekranında "Unavailable" görünür ve seçilemez ("The device types supported by the package are fewer than those specified").
   - Simge: `magaza/simge-216-saydam.png` (paketteki simgeyle aynı, saydam zemin; 1024 px sürümü de var)
   - Kategori: Apps / Productivity; etiketler: Focus (ana), Time management, Alarms, Study
   - Ad, kısa ve uzun açıklama (TR ve EN): [magaza/metinler.md](../magaza/metinler.md)
4. **Version information → Draft**:
   - Gizlilik politikası: https://ahmetkurtbm.github.io/pomodoro-odak/magaza/gizlilik.html
   - Ekran görüntüleri: `magaza/ekran/` (470 ve 840 px; yükleme ekranının istediği boyut seçilir)
   - Yaş derecelendirmesi anketi: şiddet, satın alma, veri toplama yok → 3+
5. **Prices & Sales**: ücretsiz, Türkiye.
6. **Submit for review**. Sonuç e-postayla gelir.

## Bilinen sorunlar

- **Chrome'da App information sayfası boş kalıyor:** Sayfanın bir JavaScript parçası (`/agc/amp/static/js/chunk-….js`) 404 dönüyor. Microsoft Edge'de açılıyor.
- **Version information → Draft "Page not found":** 2026-11-05 itibarıyla hem Chrome'da hem Edge'de, App information sayfasındaki **Next** ile de açılmıyor. Huawei desteğine bildirilmesi gerekiyor (sağ üstteki **?** → destek talebi).

## Kaynaklar

- [AppGallery Connect iş akışı](https://developer.huawei.com/consumer/en/doc/app/agc-help-workflow-0000002235741064)
- [Görsel öğe kuralları](https://developer.huawei.com/consumer/en/doc/app/agc-help-app-material-requirement-0000001146534651)
