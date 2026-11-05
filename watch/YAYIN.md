# Pomodoro'yu AppGallery'de yayınlama

Bu rehber uygulamayı Huawei AppGallery'de herkese açık yayınlamak içindir. Debug kurulumundan (KURULUM.md) farkı şu: mağaza **release** imzası ister. İmzalı paket saate değil, AppGallery Connect'e yüklenir ve Huawei inceledikten sonra yayınlanır.

> ⚠️ Saat uygulamaları için Huawei'nin bazı kuralları (ekran görüntüsü boyutu, paket türü) kaynaklarda net değil. Aşağıda işaretli yerleri AppGallery Connect'te gördüğün ekrana göre kontrol et, farklıysa ekranın görüntüsünü at.

## 0. Ad konusunda bir uyarı

"Pomodoro Technique" ve "Pomodoro" adları Francesco Cirillo'nun tescilli markası. Mağazada birçok uygulama bu kelimeyi kullanıyor, ama sadece **"Pomodoro"** adı incelemede sorun çıkarabilir. Daha güvenli bir seçenek, kelimeyi açıklayıcı bir adla birlikte kullanmak: **"Pomodoro Odak"** ya da **"Odak: Pomodoro Zamanlayıcı"**. Karar senin. Uygulamadaki adı değiştirmek tek satırlık iş (`resources/base/element/string.json`).

## 1. Release sertifikası

1. AppGallery Connect → **Certificates, app IDs, and profiles** → **Certificates** → **New certificate**
2. **Type:** **Release**
3. **CSR:** Debug için kullandığın `C:\Users\ahmet\gt6-imza\bilekholo.csr` dosyası kullanılabilir. Ayrı bir anahtar istiyorsan DevEco'da yeni bir anahtar ve CSR oluştur.
4. `.cer` dosyasını `gt6-imza` klasörüne `pomodoro-release.cer` adıyla indir.

## 2. Release profili

1. **Profiles** → **Add**
2. **App:** Bilek Holo (`com.ahmet.bilekholo`). Paket adı değiştirilemez, sorun değil, kullanıcılar bunu görmez.
3. **Type:** **Release**. Release profilinde cihaz seçilmez.
4. **Certificate:** az önce oluşturduğun release sertifikası
5. `.p7b` dosyasını `gt6-imza` klasörüne `pomodoro-release.p7b` adıyla indir.

## 3. Release derlemesi

1. DevEco → **File > Project Structure > Signing Configs**. Debug ayarının yanına **release** adında ikinci bir imza ayarı ekle:
   - Store file: release anahtarın (`bilekholo.p12` ya da yenisi)
   - Profile file: `pomodoro-release.p7b`
   - Certificate file: `pomodoro-release.cer`
2. **Build > Build Hap(s)/APP(s) > Build APP(s)**. Mağazaya yüklenen dosya **`.app`** uzantılıdır, `build/outputs/default/` altında çıkar. *(Kontrol et: AppGallery Connect yükleme ekranı `.hap` istiyorsa onu yükle.)*
3. Release paketi saate DevEco Assistant ile **yüklenmez**. Saatte denemek için yine debug HAP'ı kullan.

Bu adımlarda istersen ben derlerim, imza ayarını eklediğini söylemen yeterli.

## 4. Uygulama bilgileri (My apps → Bilek Holo → App information)

| Alan | Öneri |
|---|---|
| **App name** | Pomodoro Odak (ya da seçtiğin ad). Türkçe ve İngilizce gir |
| **Category** | Tools → Productivity (Araçlar → Verimlilik) |
| **Kısa açıklama** | Bileğinde Pomodoro: odaklan, mola ver, ilerlemeni gör. |
| **Açıklama** | Aşağıdaki metni kullanabilirsin |
| **Icon** | 216×216 PNG. Ben üretirim (`tools/make-icons.py`) |
| **Screenshots** | Saat ekran görüntüleri, 3–5 adet. *Boyutu yükleme ekranında kontrol et*, kaynaklar 180×240 ile 840×840 arasında farklı söylüyor |
| **Privacy policy URL** | Zorunlu. Uygulama veri toplamadığı için kısa bir metin yeterli (aşağıda) |

**Açıklama taslağı (Türkçe):**

> Pomodoro Odak, çalışmayı 25 dakikalık odak turlarına ve kısa molalara böler. Hepsi bileğinde.
>
> • Renkli ilerleme halkası: odakta turuncu, molada yeşil, uzun molada mavi
> • Tur bitince titreşim, son dakikada kısa bir uyarı
> • Hazır ayarlar (25/5, 50/10, 15/3) ve kendi sürelerin
> • İstatistik: bugünkü turlar, dakikalar, seri ve son 7 gün
> • Mola köşesi: refleks oyunu ve dönen 3D hologramlar
> • Ekran kararsa da süre işlemeye devam eder
>
> İnternet bağlantısı gerektirmez, hiçbir veri toplamaz. Tüm kayıtlar sadece saatinde durur.

## 5. Gizlilik politikası

AppGallery herkese açık bir bağlantı ister. Uygulama hiçbir veri toplamıyor ve göndermiyor: ayarlar ve istatistikler sadece saatin hafızasında tutuluyor. Kısa bir sayfa yeterli. Şu yollardan biriyle yayınlanabilir:
- GitHub Pages (ücretsiz, GitHub hesabın varsa)
- Google Sites ya da benzeri ücretsiz bir sayfa

Metni ben yazarım. Nerede yayınlayacağına sen karar ver.

## 6. Yayın ayarları ve gönderme

1. **Version information → Draft**: `.app` paketini yükle.
2. **Countries/regions:** Türkiye (istersen tüm ülkeler)
3. **Price:** Free
4. **Content rating:** anketi doldur. Şiddet, veri toplama ya da satın alma yok, sonuç 3+ çıkmalı.
5. **Submit for review**. İnceleme birkaç günden birkaç haftaya kadar sürebilir. Sonuç e-postayla gelir.
6. Reddedilirse e-postadaki gerekçeyi bana yapıştır, birlikte düzeltiriz.

## Kaynaklar

- [AppGallery Connect iş akışı](https://developer.huawei.com/consumer/en/doc/app/agc-help-workflow-0000002235741064)
- [Görsel öğe kuralları](https://developer.huawei.com/consumer/en/doc/app/agc-help-app-material-requirement-0000001146534651)
- [Lite wearable projesini yayına hazırlama](https://medium.com/huawei-developers/harmony-os-prepare-your-lite-wearable-project-for-integration-b4daaa9df67e)
