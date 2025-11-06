# 🏭 SAP01 ÜRETİM YÖNETİM SİSTEMİ - KAPSAMLI DOKÜMANTASYON

## 🌐 SİSTEM ERİŞİM BİLGİLERİ

### **Uygulama URL'si:**
```
https://manuf-control-1.preview.emergentagent.com
```

### **Giriş Bilgileri:**
- **Kullanıcı Adı:** `admin`
- **Şifre:** `admin123`
- **Rol:** Administrator (Tüm yetkilere sahip)

### **Backend API URL:**
```
https://manuf-control-1.preview.emergentagent.com/api
```

---

## 📊 SİSTEM MODÜLLERI (13 Sayfa)

### 1. 🔐 **GİRİŞ SAYFASI (Login Page)**
- JWT tabanlı kimlik doğrulama
- Kullanıcı adı ve şifre ile giriş
- Token yönetimi
- **Endpoint:** `POST /api/auth/login`

### 2. 📈 **DASHBOARD (Ana Sayfa)**
- Toplam hammadde sayısı
- Toplam ürün sayısı
- Aktif üretim sayısı
- Bekleyen sevkiyat sayısı
- Düşük stoklu malzemeler
- **Endpoint:** `GET /api/dashboard/stats`

### 3. 🧱 **HAMMADDELER (Raw Materials)**
- Hammadde tanımlama ve yönetimi
- Stok takibi
- Minimum stok seviyesi uyarıları
- Birim fiyat takibi
- **Mevcut Hammaddeler:**
  - Petkim (5000 kg)
  - Estol (1000 kg)
  - Talk (500 kg)
  - Gaz (2000 kg)
  - Masura 100, 120, 150, 200 (Çeşitli stoklar)
  - Kırmızı, Mavi, Yeşil Renk (Her biri 150 kg)
- **Endpoints:** 
  - `GET /api/raw-materials` - Tüm hammaddeleri listele
  - `POST /api/raw-materials` - Yeni hammadde ekle
  - `GET /api/raw-materials/{id}` - Hammadde detayı

### 4. 📥 **HAMMADDE GİRİŞLERİ (Material Entries)**
- Hammadde alım kayıtları
- Tedarikçi bilgileri
- Fatura numarası takibi
- Döviz cinsinden fiyatlandırma (TL, USD, EUR)
- Otomatik stok güncelleme
- **Endpoints:**
  - `GET /api/material-entries` - Giriş kayıtlarını listele
  - `POST /api/material-entries` - Yeni giriş kaydı
  - `PUT /api/material-entries/{id}` - Giriş kaydını güncelle
  - `DELETE /api/material-entries/{id}` - Giriş kaydını sil

### 5. 🏭 **ÜRETİM KAYITLARI (Manufacturing Records)**
- Üretim tarihine göre kayıt
- Makine seçimi (Makine 1, Makine 2)
- Kalınlık (mm), En (cm), Boy (metre)
- Adet bilgisi
- **Otomatik Hesaplamalar:**
  - Metrekare hesaplama
  - Model açıklaması oluşturma
- Masura tipi seçimi
- Masura adedi (otomatik, readonly)
- Renk seçimi (opsiyonel)
- Gaz payı (kg)
- **Mevcut:** 15 üretim kaydı
- **Endpoints:**
  - `GET /api/manufacturing` - Üretim kayıtlarını listele
  - `POST /api/manufacturing` - Yeni üretim kaydı
  - `PUT /api/manufacturing/{id}` - Kaydı güncelle
  - `DELETE /api/manufacturing/{id}` - Kaydı sil

### 6. ✂️ **KESİM ÜRETİMİ (Cut Production)**
- Ana malzemeden kesim yapma
- Kaynak üretim seçimi (dropdown'da 15 kayıt)
- Kesim boyutları (En: cm, Boy: cm)
- İstenilen adet
- **Otomatik Hesaplamalar:**
  - Kaynak başına çıkan adet
  - Gerekli kaynak adedi
  - Toplam kesilmiş adet
  - Kesilmiş ürün metrekaresi
- Renk bilgisi (opsiyonel)
- **Endpoints:**
  - `GET /api/cut-production` - Kesim kayıtlarını listele
  - `POST /api/cut-production` - Yeni kesim kaydı
  - `DELETE /api/cut-production/{id}` - Kesim kaydını sil

### 7. 📊 **GÜNLÜK TÜKETİM (Daily Consumption)**
- Tarih seçimi (date input, zaman YOK)
- Makine seçimi
- Petkim miktarı (kg)
- Fire miktarı (Sıcak Malzeme - içinde Petkim var)
- **Otomatik Hesaplamalar:**
  - Estol: (Petkim + Fire) × 0.03
  - Talk: (Petkim + Fire) × 0.015
  - Toplam Petkim: Petkim + Fire
- Otomatik stok düşürme (Petkim, Estol, Talk)
- **Mevcut:** 10 tüketim kaydı
- **Endpoints:**
  - `GET /api/daily-consumptions` - Tüketim kayıtlarını listele
  - `POST /api/daily-consumptions` - Yeni tüketim kaydı
  - `PUT /api/daily-consumptions/{id}` - Kaydı güncelle
  - `DELETE /api/daily-consumptions/{id}` - Kaydı sil

### 8. ⛽ **GAZ TÜKETİMİ (Gas Consumption)**
- Tarih bazlı gaz tüketimi takibi
- Toplam gaz miktarı (kg)
- Otomatik gaz stoğu düşürme
- **Endpoints:**
  - `GET /api/gas-consumption` - Gaz tüketimlerini listele
  - `POST /api/gas-consumption` - Yeni gaz tüketimi
  - `PUT /api/gas-consumption/{id}` - Kaydı güncelle
  - `DELETE /api/gas-consumption/{id}` - Kaydı sil

### 9. 📦 **ÜRETİM SİPARİŞLERİ (Production Orders)**
- Sipariş numarası (otomatik: PRD-00001)
- Ürün seçimi
- Miktar belirleme
- Planlanan tarih
- Durum takibi (Planlanan, Devam Eden, Tamamlanan, İptal)
- **Endpoints:**
  - `GET /api/production-orders` - Siparişleri listele
  - `POST /api/production-orders` - Yeni sipariş
  - `PATCH /api/production-orders/{id}/status` - Durum güncelle

### 10. 📦 **ÜRÜNLER (Products)**
- Ürün tanımlama
- Ürün kodu
- Birim bilgisi
- Stok takibi
- **Endpoints:**
  - `GET /api/products` - Ürünleri listele
  - `POST /api/products` - Yeni ürün ekle

### 11. 🚚 **SEVKİYATLAR (Shipments)**
- Sevkiyat numarası (otomatik: SEV-00001, SEV-00002, ...)
- Sevkiyat tarihi
- Alıcı firma
- Kalınlık, En, Boy, Adet
- Otomatik metrekare hesaplama
- Renk bilgisi (opsiyonel)
- İrsaliye numarası
- Araç plakası
- Şoför bilgisi
- **Mevcut:** 8 sevkiyat kaydı
- **Endpoints:**
  - `GET /api/shipments` - Sevkiyatları listele
  - `POST /api/shipments` - Yeni sevkiyat
  - `PUT /api/shipments/{id}` - Sevkiyat güncelle
  - `DELETE /api/shipments/{id}` - Sevkiyat sil

### 12. 📊 **STOK DURUMU (Stock)**
- Üretim kayıtlarına göre otomatik stok hesaplama
- Sevkiyatlar düşülerek net stok
- Model bazlı gruplama (Kalınlık × En × Boy)
- Renk ayrımı
- Toplam adet ve metrekare
- **Endpoint:** `GET /api/stock`

### 13. 💰 **MALİYET ANALİZİ (Cost Analysis)**
- Malzeme bazlı maliyet hesaplama
- Toplam tüketim miktarı
- Toplam maliyet
- Birim fiyat bazlı hesaplama
- **Endpoint:** `GET /api/costs/analysis`

### 14. 👥 **KULLANICI YÖNETİMİ (Users)**
- Kullanıcı listesi (sadece admin)
- Kullanıcı rolü yönetimi (admin, user, viewer)
- Kullanıcı silme
- **Endpoints:**
  - `GET /api/users` - Kullanıcıları listele (admin only)
  - `DELETE /api/users/{id}` - Kullanıcı sil (admin only)
  - `POST /api/auth/register` - Yeni kullanıcı kaydet

---

## 🔧 TEKNİK DETAYLAR

### **Backend Stack:**
- **Framework:** FastAPI (Python)
- **Veritabanı:** MongoDB
- **Kimlik Doğrulama:** JWT (JSON Web Tokens)
- **Şifreleme:** bcrypt
- **Port:** 8001 (internal)

### **Frontend Stack:**
- **Framework:** React.js
- **UI Kütüphanesi:** Tailwind CSS
- **HTTP Client:** Axios
- **Routing:** React Router
- **Port:** 3000 (internal)

### **Veritabanı Koleksiyonları:**
- `users` - Kullanıcılar
- `raw_materials` - Hammaddeler
- `material_entries` - Hammadde girişleri
- `manufacturing_records` - Üretim kayıtları
- `cut_production_records` - Kesim kayıtları
- `daily_consumptions` - Günlük tüketimler
- `daily_gas_consumption` - Gaz tüketimleri
- `production_orders` - Üretim siparişleri
- `products` - Ürünler
- `shipments` - Sevkiyatlar
- `stock` - Stok durumu
- `consumptions` - Tüketim kayıtları
- `stock_transactions` - Stok hareketleri

---

## 📝 ÖNEMLİ NOTLAR

### **Otomatik Hesaplamalar:**
1. **Üretim Kayıtları:**
   - Metrekare = (En/100) × Boy × Adet
   - Model = "Kalınlık mm × En cm × Boy m"

2. **Kesim Üretimi:**
   - Kaynak başına adet = (Ana En / Kesim En) × (Ana Boy × 100 / Kesim Boy)
   - Gerekli kaynak = İstenilen Adet / Kaynak başına adet (yukarı yuvarla)
   - Toplam adet = Kaynak başına adet × Gerekli kaynak

3. **Günlük Tüketim:**
   - Estol = (Petkim + Fire) × 0.03
   - Talk = (Petkim + Fire) × 0.015
   - Toplam Petkim = Petkim + Fire

4. **Sevkiyatlar:**
   - Metrekare = (En/100) × Boy × Adet
   - Sevkiyat No = "SEV-" + 5 haneli sayı

### **Stok Yönetimi:**
- Hammadde girişlerinde stok artar
- Üretim kayıtlarında masura ve gaz stoğu düşer
- Günlük tüketimde Petkim, Estol, Talk stoğu düşer
- Gaz tüketiminde gaz stoğu düşer

### **Yetki Seviyeleri:**
- **admin:** Tüm işlemler
- **user:** Görüntüleme ve ekleme
- **viewer:** Sadece görüntüleme

### **Tarih Alanları:**
- Tüm tarih alanları `type="date"` (ZAMAN YOK)
- Format: YYYY-MM-DD

---

## 🧪 TEST DURUMU

### **Backend (Tümü Test Edildi ✅)**
- ✅ Authentication System
- ✅ Raw Materials Management
- ✅ Material Entries System
- ✅ Manufacturing Records
- ✅ Daily Consumptions
- ✅ Gas Consumption
- ✅ Shipments Management
- ✅ Stock Status
- ✅ Cost Analysis
- ✅ User Management

### **Frontend (Kısmi Test Edildi)**
- ✅ Cut Production Page (Kapsamlı test)
- ✅ Manufacturing Records Page (Kapsamlı test)
- ✅ Consumption Page (Kapsamlı test)
- ⏳ Diğer sayfalar (Kullanıcı testi bekleniyor)

---

## 📊 MEVCUT VERİ DURUMU

### **Kullanıcılar:** 1
- admin (Administrator)

### **Hammaddeler:** 11
- Petkim, Estol, Talk, Gaz
- Masura 100, 120, 150, 200
- Kırmızı, Mavi, Yeşil Renk

### **Üretim Kayıtları:** 15
- Son 30 gün içinde çeşitli boyut ve miktarlarda

### **Günlük Tüketimler:** 10
- Son 20 gün içinde kayıtlar

### **Sevkiyatlar:** 8
- Son 15 gün içinde çeşitli firmalara

### **Stok Durumu:** Otomatik hesaplanıyor
- Üretim - Sevkiyat = Net Stok

---

## 🚀 SİSTEMİ KULLANMAYA BAŞLAMA

1. **Tarayıcınızda açın:** https://manuf-control-1.preview.emergentagent.com
2. **Giriş yapın:** admin / admin123
3. **Dashboard'u görüntüleyin** - Genel durum özeti
4. **Sol menüden sayfalar arasında geçiş yapın**
5. **Yeni kayıtlar ekleyin** - Her sayfada "Ekle" butonu
6. **Kayıtları düzenleyin** - Tablolarda düzenleme ikonları
7. **Kayıtları silin** - Tablolarda silme ikonları

---

## 🎯 ÖNEMLİ ÖZELLİKLER

### ✅ **Çalışan Özellikler:**
- JWT kimlik doğrulama
- Tüm CRUD operasyonları
- Otomatik hesaplamalar
- Stok takibi
- Tarih bazlı filtreleme
- Rol tabanlı yetkilendirme
- Responsive tasarım

### 🔄 **Otomatik İşlemler:**
- Metrekare hesaplamaları
- Stok güncellemeleri
- Sevkiyat numarası üretimi
- Model açıklaması oluşturma
- Tüketim hesaplamaları

---

## 📞 DESTEK

Herhangi bir sorun, hata veya özellik talebi için lütfen detaylı açıklama ile bildiriniz.

**Not:** Sistem şu anda tam çalışır durumda ve test için hazırdır!

---

**Son Güncelleme:** $(date)
**Versiyon:** 1.0
**Durum:** 🟢 Aktif ve Çalışıyor
