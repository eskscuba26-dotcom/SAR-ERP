#!/usr/bin/env python3
"""
URGENT TEST: Manufacturing record not showing up issue
Testing if POST creates records and GET returns them
"""

import requests
import json
from datetime import datetime, timezone

BASE_URL = "https://taskhub-487.preview.emergentagent.com/api"
USERNAME = "mehmet"
PASSWORD = "141413DOa."

def print_result(test_name, success, message):
    """Print test result in clear format"""
    status = "✅ ÇALIŞIYOR" if success else "❌ ÇALIŞMIYOR"
    print(f"\n{'='*60}")
    print(f"{test_name}: {status}")
    print(f"Detay: {message}")
    print(f"{'='*60}")

def login():
    """Login and get token"""
    print("\n🔐 Giriş yapılıyor...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"username": USERNAME, "password": PASSWORD}
    )
    
    if response.status_code == 200:
        token = response.json()["token"]
        print(f"✅ Giriş başarılı! Token alındı.")
        return token
    else:
        print(f"❌ Giriş başarısız! Status: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def test_manufacturing(token):
    """Test Manufacturing POST and GET endpoints"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n\n📊 MANUFACTURING ENDPOINT TESTİ")
    print("="*60)
    
    # Step 1: Get initial count
    print("\n1️⃣ Mevcut kayıt sayısı alınıyor...")
    response = requests.get(f"{BASE_URL}/manufacturing", headers=headers)
    
    if response.status_code != 200:
        print_result("Manufacturing GET", False, f"GET isteği başarısız: {response.status_code}")
        return False
    
    initial_records = response.json()
    initial_count = len(initial_records)
    print(f"   Mevcut kayıt sayısı: {initial_count}")
    
    # Step 2: POST new record
    print("\n2️⃣ Yeni kayıt ekleniyor...")
    today = datetime.now(timezone.utc).isoformat()
    
    new_record = {
        "production_date": today,
        "machine": "Makine 1",
        "thickness_mm": 2.0,
        "width_cm": 100,
        "length_m": 200,
        "quantity": 5,
        "masura_type": "Masura 100",
        "masura_quantity": 5,
        "gas_consumption_kg": 2.5
    }
    
    print(f"   Gönderilen veri: {json.dumps(new_record, indent=2)}")
    
    response = requests.post(
        f"{BASE_URL}/manufacturing",
        headers=headers,
        json=new_record
    )
    
    if response.status_code not in [200, 201]:
        print_result("Manufacturing POST", False, f"POST isteği başarısız: {response.status_code} - {response.text}")
        return False
    
    created_record = response.json()
    print(f"   ✅ Kayıt oluşturuldu! ID: {created_record.get('id', 'N/A')}")
    
    # Step 3: GET updated count
    print("\n3️⃣ Güncel kayıt sayısı kontrol ediliyor...")
    response = requests.get(f"{BASE_URL}/manufacturing", headers=headers)
    
    if response.status_code != 200:
        print_result("Manufacturing GET (after POST)", False, f"GET isteği başarısız: {response.status_code}")
        return False
    
    updated_records = response.json()
    updated_count = len(updated_records)
    print(f"   Güncel kayıt sayısı: {updated_count}")
    
    # Step 4: Compare
    print("\n4️⃣ Karşılaştırma yapılıyor...")
    print(f"   Önceki: {initial_count}")
    print(f"   Sonraki: {updated_count}")
    print(f"   Fark: {updated_count - initial_count}")
    
    if updated_count > initial_count:
        # Check if the new record is in the list
        new_record_found = any(r.get('id') == created_record.get('id') for r in updated_records)
        if new_record_found:
            print_result(
                "Manufacturing Endpoint",
                True,
                f"Kayıt başarıyla eklendi ve listede görünüyor! ({initial_count} → {updated_count})"
            )
            return True
        else:
            print_result(
                "Manufacturing Endpoint",
                False,
                f"Kayıt sayısı arttı ama yeni kayıt listede bulunamadı!"
            )
            return False
    else:
        print_result(
            "Manufacturing Endpoint",
            False,
            f"Kayıt eklenmedi! Sayı değişmedi: {initial_count} = {updated_count}"
        )
        return False

def test_material_entries(token):
    """Test Material Entries POST and GET endpoints"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n\n📦 MATERIAL ENTRIES ENDPOINT TESTİ")
    print("="*60)
    
    # First, get a material ID
    print("\n0️⃣ Hammadde listesi alınıyor...")
    response = requests.get(f"{BASE_URL}/raw-materials", headers=headers)
    if response.status_code != 200 or not response.json():
        print_result("Material Entries", False, "Hammadde bulunamadı, test yapılamıyor")
        return False
    
    material_id = response.json()[0]['id']
    print(f"   Test için kullanılacak hammadde ID: {material_id}")
    
    # Step 1: Get initial count
    print("\n1️⃣ Mevcut kayıt sayısı alınıyor...")
    response = requests.get(f"{BASE_URL}/material-entries", headers=headers)
    
    if response.status_code != 200:
        print_result("Material Entries GET", False, f"GET isteği başarısız: {response.status_code}")
        return False
    
    initial_records = response.json()
    initial_count = len(initial_records)
    print(f"   Mevcut kayıt sayısı: {initial_count}")
    
    # Step 2: POST new record
    print("\n2️⃣ Yeni kayıt ekleniyor...")
    today = datetime.now(timezone.utc).isoformat()
    
    new_entry = {
        "entry_date": today,
        "material_id": material_id,
        "quantity": 100,
        "currency": "TRY",
        "unit_price": 50.0,
        "total_amount": 5000.0,
        "supplier": "Test Tedarikçi",
        "invoice_number": "TEST-001"
    }
    
    print(f"   Gönderilen veri: {json.dumps(new_entry, indent=2)}")
    
    response = requests.post(
        f"{BASE_URL}/material-entries",
        headers=headers,
        json=new_entry
    )
    
    if response.status_code not in [200, 201]:
        print_result("Material Entries POST", False, f"POST isteği başarısız: {response.status_code} - {response.text}")
        return False
    
    created_entry = response.json()
    print(f"   ✅ Kayıt oluşturuldu! ID: {created_entry.get('id', 'N/A')}")
    
    # Step 3: GET updated count
    print("\n3️⃣ Güncel kayıt sayısı kontrol ediliyor...")
    response = requests.get(f"{BASE_URL}/material-entries", headers=headers)
    
    if response.status_code != 200:
        print_result("Material Entries GET (after POST)", False, f"GET isteği başarısız: {response.status_code}")
        return False
    
    updated_records = response.json()
    updated_count = len(updated_records)
    print(f"   Güncel kayıt sayısı: {updated_count}")
    
    # Step 4: Compare
    print("\n4️⃣ Karşılaştırma yapılıyor...")
    print(f"   Önceki: {initial_count}")
    print(f"   Sonraki: {updated_count}")
    print(f"   Fark: {updated_count - initial_count}")
    
    if updated_count > initial_count:
        new_entry_found = any(r.get('id') == created_entry.get('id') for r in updated_records)
        if new_entry_found:
            print_result(
                "Material Entries Endpoint",
                True,
                f"Kayıt başarıyla eklendi ve listede görünüyor! ({initial_count} → {updated_count})"
            )
            return True
        else:
            print_result(
                "Material Entries Endpoint",
                False,
                f"Kayıt sayısı arttı ama yeni kayıt listede bulunamadı!"
            )
            return False
    else:
        print_result(
            "Material Entries Endpoint",
            False,
            f"Kayıt eklenmedi! Sayı değişmedi: {initial_count} = {updated_count}"
        )
        return False

def test_raw_materials(token):
    """Test Raw Materials POST and GET endpoints"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n\n🏭 RAW MATERIALS ENDPOINT TESTİ")
    print("="*60)
    
    # Step 1: Get initial count
    print("\n1️⃣ Mevcut kayıt sayısı alınıyor...")
    response = requests.get(f"{BASE_URL}/raw-materials", headers=headers)
    
    if response.status_code != 200:
        print_result("Raw Materials GET", False, f"GET isteği başarısız: {response.status_code}")
        return False
    
    initial_records = response.json()
    initial_count = len(initial_records)
    print(f"   Mevcut kayıt sayısı: {initial_count}")
    
    # Step 2: POST new record
    print("\n2️⃣ Yeni kayıt ekleniyor...")
    
    # Generate unique code
    import random
    unique_code = f"TEST-{random.randint(1000, 9999)}"
    
    new_material = {
        "name": f"Test Hammadde {unique_code}",
        "code": unique_code,
        "unit": "kg",
        "unit_price": 25.0,
        "min_stock_level": 100
    }
    
    print(f"   Gönderilen veri: {json.dumps(new_material, indent=2)}")
    
    response = requests.post(
        f"{BASE_URL}/raw-materials",
        headers=headers,
        json=new_material
    )
    
    if response.status_code not in [200, 201]:
        print_result("Raw Materials POST", False, f"POST isteği başarısız: {response.status_code} - {response.text}")
        return False
    
    created_material = response.json()
    print(f"   ✅ Kayıt oluşturuldu! ID: {created_material.get('id', 'N/A')}")
    
    # Step 3: GET updated count
    print("\n3️⃣ Güncel kayıt sayısı kontrol ediliyor...")
    response = requests.get(f"{BASE_URL}/raw-materials", headers=headers)
    
    if response.status_code != 200:
        print_result("Raw Materials GET (after POST)", False, f"GET isteği başarısız: {response.status_code}")
        return False
    
    updated_records = response.json()
    updated_count = len(updated_records)
    print(f"   Güncel kayıt sayısı: {updated_count}")
    
    # Step 4: Compare
    print("\n4️⃣ Karşılaştırma yapılıyor...")
    print(f"   Önceki: {initial_count}")
    print(f"   Sonraki: {updated_count}")
    print(f"   Fark: {updated_count - initial_count}")
    
    if updated_count > initial_count:
        new_material_found = any(r.get('id') == created_material.get('id') for r in updated_records)
        if new_material_found:
            print_result(
                "Raw Materials Endpoint",
                True,
                f"Kayıt başarıyla eklendi ve listede görünüyor! ({initial_count} → {updated_count})"
            )
            return True
        else:
            print_result(
                "Raw Materials Endpoint",
                False,
                f"Kayıt sayısı arttı ama yeni kayıt listede bulunamadı!"
            )
            return False
    else:
        print_result(
            "Raw Materials Endpoint",
            False,
            f"Kayıt eklenmedi! Sayı değişmedi: {initial_count} = {updated_count}"
        )
        return False

def main():
    print("\n" + "="*60)
    print("🚨 ACİL TEST: ÜRETİM KAYDI GÖRÜNMÜYOR SORUNU")
    print("="*60)
    
    # Login
    token = login()
    if not token:
        print("\n❌ Giriş yapılamadı, testler durduruluyor!")
        return
    
    # Run tests
    results = {}
    results['manufacturing'] = test_manufacturing(token)
    results['material_entries'] = test_material_entries(token)
    results['raw_materials'] = test_raw_materials(token)
    
    # Final summary
    print("\n\n" + "="*60)
    print("📋 SONUÇ ÖZETİ")
    print("="*60)
    
    for endpoint, success in results.items():
        status = "✅ ÇALIŞIYOR" if success else "❌ ÇALIŞMIYOR"
        print(f"{endpoint.upper()}: {status}")
    
    print("="*60)
    
    # Overall result
    all_working = all(results.values())
    if all_working:
        print("\n✅ TÜM ENDPOINT'LER ÇALIŞIYOR!")
    else:
        print("\n❌ BAZI ENDPOINT'LER ÇALIŞMIYOR!")
        print("\nSorun olan endpoint'ler:")
        for endpoint, success in results.items():
            if not success:
                print(f"  - {endpoint.upper()}")

if __name__ == "__main__":
    main()
