#!/usr/bin/env python3
"""
Eski SAR ERP sisteminden verileri mevcut sisteme aktarır.
"""

import json
import sys
from pymongo import MongoClient
from datetime import datetime
import os

# MongoDB bağlantısı
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client['production_management']

def import_raw_materials():
    """Hammaddeleri import et"""
    print("\n=== HAMMADDELER İMPORT EDİLİYOR ===")
    
    with open('/tmp/old_raw_materials.json', 'r') as f:
        old_materials = json.load(f)
    
    # Mevcut hammaddeleri al
    existing_materials = list(db.raw_materials.find())
    existing_codes = {m['code'] for m in existing_materials}
    
    imported = 0
    skipped = 0
    
    for material in old_materials:
        # ID ve created_at alanlarını kaldır
        material.pop('id', None)
        material.pop('created_at', None)
        
        # Kod kontrolü - eğer varsa skip et
        if material['code'] in existing_codes:
            print(f"  ⊘ {material['name']} ({material['code']}) zaten mevcut - ATLANDI")
            skipped += 1
            continue
        
        # Yeni timestamp ekle
        material['created_at'] = datetime.utcnow()
        
        # MongoDB'ye ekle
        db.raw_materials.insert_one(material)
        print(f"  ✓ {material['name']} ({material['code']}) - Stok: {material['current_stock']} {material['unit']}")
        imported += 1
    
    print(f"\n✓ Toplam {imported} hammadde eklendi, {skipped} atlandi")
    return imported, skipped

def import_manufacturing():
    """Üretim kayıtlarını import et"""
    print("\n=== ÜRETİM KAYITLARI İMPORT EDİLİYOR ===")
    
    with open('/tmp/old_manufacturing.json', 'r') as f:
        old_records = json.load(f)
    
    imported = 0
    
    for record in old_records:
        # ID alanını kaldır
        record.pop('id', None)
        
        # Tarih formatını düzenle
        if 'production_date' in record and isinstance(record['production_date'], str):
            try:
                record['production_date'] = datetime.fromisoformat(record['production_date'].replace('Z', '+00:00'))
            except:
                record['production_date'] = datetime.utcnow()
        
        if 'created_at' in record and isinstance(record['created_at'], str):
            try:
                record['created_at'] = datetime.fromisoformat(record['created_at'].replace('Z', '+00:00'))
            except:
                record['created_at'] = datetime.utcnow()
        
        # MongoDB'ye ekle
        db.manufacturing_records.insert_one(record)
        print(f"  ✓ {record.get('model', 'N/A')} - {record['quantity']} adet - {record['square_meters']} m²")
        imported += 1
    
    print(f"\n✓ Toplam {imported} üretim kaydı eklendi")
    return imported

def import_consumptions():
    """Tüketim kayıtlarını import et"""
    print("\n=== TÜKETİM KAYITLARI İMPORT EDİLİYOR ===")
    
    with open('/tmp/old_consumptions.json', 'r') as f:
        old_records = json.load(f)
    
    imported = 0
    
    for record in old_records:
        # ID alanını kaldır
        record.pop('id', None)
        
        # Tarih formatını düzenle
        if 'consumption_date' in record and isinstance(record['consumption_date'], str):
            try:
                record['consumption_date'] = datetime.fromisoformat(record['consumption_date'].replace('Z', '+00:00'))
            except:
                record['consumption_date'] = datetime.utcnow()
        
        if 'created_at' in record and isinstance(record['created_at'], str):
            try:
                record['created_at'] = datetime.fromisoformat(record['created_at'].replace('Z', '+00:00'))
            except:
                record['created_at'] = datetime.utcnow()
        
        # MongoDB'ye ekle
        db.daily_consumptions.insert_one(record)
        print(f"  ✓ {record.get('machine', 'N/A')} - Petkim: {record.get('petkim_quantity', 0)} kg")
        imported += 1
    
    print(f"\n✓ Toplam {imported} tüketim kaydı eklendi")
    return imported

def import_shipments():
    """Sevkiyat kayıtlarını import et"""
    print("\n=== SEVKİYAT KAYITLARI İMPORT EDİLİYOR ===")
    
    with open('/tmp/old_shipments.json', 'r') as f:
        old_records = json.load(f)
    
    imported = 0
    
    for record in old_records:
        # ID alanını kaldır
        record.pop('id', None)
        
        # Tarih formatını düzenle
        if 'shipment_date' in record and isinstance(record['shipment_date'], str):
            try:
                record['shipment_date'] = datetime.fromisoformat(record['shipment_date'].replace('Z', '+00:00'))
            except:
                record['shipment_date'] = datetime.utcnow()
        
        if 'created_at' in record and isinstance(record['created_at'], str):
            try:
                record['created_at'] = datetime.fromisoformat(record['created_at'].replace('Z', '+00:00'))
            except:
                record['created_at'] = datetime.utcnow()
        
        # MongoDB'ye ekle
        db.shipments.insert_one(record)
        print(f"  ✓ {record.get('shipment_number', 'N/A')} - {record.get('customer_name', 'N/A')}")
        imported += 1
    
    print(f"\n✓ Toplam {imported} sevkiyat kaydı eklendi")
    return imported

def main():
    print("="*60)
    print("ESKİ SAR ERP SİSTEMİNDEN VERİ AKTARIMI")
    print("="*60)
    
    try:
        # Verileri import et
        mat_imported, mat_skipped = import_raw_materials()
        mfg_imported = import_manufacturing()
        cons_imported = import_consumptions()
        ship_imported = import_shipments()
        
        print("\n" + "="*60)
        print("ÖZET:")
        print("="*60)
        print(f"✓ {mat_imported} hammadde eklendi ({mat_skipped} atlandi)")
        print(f"✓ {mfg_imported} üretim kaydı eklendi")
        print(f"✓ {cons_imported} tüketim kaydı eklendi")
        print(f"✓ {ship_imported} sevkiyat kaydı eklendi")
        print("="*60)
        print("\n🎉 TÜM VERİLER BAŞARIYLA AKTARILDI!")
        
    except Exception as e:
        print(f"\n❌ HATA: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
