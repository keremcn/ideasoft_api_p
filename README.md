# Ideasoft Ürün Aktarıcı

Excel dosyalarından ürünleri Ideasoft mağazanıza otomatik olarak aktaran modern web uygulaması.

## 🚀 Özellikler

- 📊 Excel dosyası yükleme ve okuma (.xlsx, .xls)
- 🔍 Eksik bilgileri Google'dan otomatik arama ve doldurma
- 🛍️ Ideasoft API entegrasyonu ile ürün aktarımı
- ✏️ Ürün bilgilerini düzenleme ve önizleme
- 📈 Gerçek zamanlı ilerleme takibi
- 🎨 Modern ve kullanıcı dostu arayüz
- ✅ Ürünler pasif durumda eklenir (aktifleştirmek için manuel kontrol)

## 📦 Kurulum

```bash
npm install
```

## 🛠️ Geliştirme

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## 🏗️ Build

```bash
npm run build
```

Build dosyaları `dist` klasörüne oluşturulur.

## 📖 Kullanım

1. **Excel Dosyası Yükleme**: Ana sayfada Excel dosyanızı seçin (.xlsx veya .xls formatında)
2. **Ürünleri İnceleme**: Yüklenen ürünleri tabloda görüntüleyin ve düzenleyin
3. **Eksik Bilgileri Doldurma**: "Eksik Bilgileri Google'dan Ara" butonuna tıklayarak otomatik doldurma yapın
4. **Ideasoft Ayarları**: API bilgilerinizi girin (Access Token ve Shop ID)
5. **Ürünleri Aktarma**: "Ürünleri Aktar" butonuna tıklayarak işlemi başlatın

## 🔑 Ideasoft API Bilgileri

### Access Token Alma

1. Ideasoft yönetim panelinize giriş yapın
2. **Entegrasyonlar > API** bölümüne gidin
3. "API Ekle" butonuna tıklayın
4. Uygulama adı ve yönlendirme adresini girin
5. **Client ID** ve **Client Secret** bilgilerinizi alın
6. OAuth2 token endpoint'ini kullanarak Access Token alın:
   ```
   POST https://api.ideasoft.com.tr/oauth/token
   Body: {
     "grant_type": "client_credentials",
     "client_id": "YOUR_CLIENT_ID",
     "client_secret": "YOUR_CLIENT_SECRET"
   }
   ```

### Shop ID Bulma

Shop ID'nizi Ideasoft panelinizden veya API dokümantasyonundan öğrenebilirsiniz.

## 🌐 Vercel Deployment

### Adımlar

1. Projeyi GitHub'a yükleyin
2. [Vercel](https://vercel.com) hesabınıza giriş yapın
3. "New Project" butonuna tıklayın
4. GitHub repository'nizi seçin
5. Build ayarları otomatik algılanacaktır
6. Deploy butonuna tıklayın

### Environment Variables (Opsiyonel)

Vercel'de Environment Variables ekleyebilirsiniz:

**Frontend (Vite):**
- `VITE_GOOGLE_API_KEY`: Google Custom Search API key (eksik bilgileri doldurmak için)
- `VITE_GOOGLE_SEARCH_ENGINE_ID`: Google Custom Search Engine ID

**Backend (Serverless Functions):**
- `GOOGLE_API_KEY`: Google Custom Search API key (scraping için URL bulma)
- `GOOGLE_SEARCH_ENGINE_ID`: Google Custom Search Engine ID

**Not:** Backend environment variables Vercel dashboard'dan eklenmelidir (Settings > Environment Variables)

## 📋 Excel Dosya Formatı

Excel dosyanızda aşağıdaki sütunlar otomatik olarak algılanır:

- **Ürün Adı**: "Ürün Adı", "Name", "Title" gibi sütunlar
- **SKU**: "Kod", "SKU", "Barkod" gibi sütunlar
- **Fiyat**: "Fiyat", "Price" gibi sütunlar
- **Stok**: "Stok", "Stock", "Quantity" gibi sütunlar
- **Açıklama**: "Açıklama", "Description", "Desc" gibi sütunlar
- **Kategori**: "Kategori", "Category" gibi sütunlar
- **Resim**: "Resim", "Image", "Foto" gibi sütunlar
- **Marka**: "Marka", "Brand" gibi sütunlar

## ⚠️ Notlar

- Ürünler **pasif** durumda eklenir (aktifleştirmek için Ideasoft panelinden kontrol edin)
- API rate limiting için istekler arasında 500ms bekleme süresi vardır
- **Web Scraping**: ASUS ve diğer üretici sitelerinden ürün bilgileri otomatik olarak çekilir
- **Google Custom Search API**: Ürün URL'lerini bulmak için kullanılır (opsiyonel, environment variable olarak eklenebilir)
- Eğer Google API key yoksa, Unsplash üzerinden resimler alınır
- **Development**: Web scraping API route'u sadece Vercel'de çalışır. Local test için `vercel dev` kullanın veya production'da test edin
- Tüm veriler sadece tarayıcınızda işlenir, scraping işlemleri Vercel Serverless Function'da yapılır

## 🔗 Faydalı Linkler

- [Ideasoft API Dokümantasyonu](https://www.ideasoft.com.tr/yardim/api-kullanimi/)
- [Google Custom Search API](https://developers.google.com/custom-search/v1/overview)
- [Vercel Dokümantasyonu](https://vercel.com/docs)

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

