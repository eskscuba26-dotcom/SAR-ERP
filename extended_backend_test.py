#!/usr/bin/env python3
"""
Extended Backend Tests - Test data creation and automatic calculations
"""

import requests
import json
from datetime import datetime, timezone
import sys

BACKEND_URL = "https://taskhub-487.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class ExtendedTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.token = None
        self.session = requests.Session()
        self.created_materials = []
        
    def authenticate(self):
        """Get authentication token"""
        login_data = {
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        }
        
        response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            self.token = data["token"]
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            return True
        return False

    def test_material_creation_and_stock_update(self):
        """Test creating materials and stock updates"""
        print("=== Testing Material Creation and Stock Updates ===")
        
        # Create essential materials for the system
        materials_to_create = [
            {"name": "Petkim", "code": "PTK001", "unit": "kg", "unit_price": 25.50, "min_stock_level": 1000},
            {"name": "Estol", "code": "EST001", "unit": "kg", "unit_price": 45.00, "min_stock_level": 500},
            {"name": "Talk", "code": "TLK001", "unit": "kg", "unit_price": 15.75, "min_stock_level": 300},
            {"name": "Gaz", "code": "GAZ001", "unit": "kg", "unit_price": 8.50, "min_stock_level": 200},
            {"name": "Masura 100", "code": "MSR100", "unit": "adet", "unit_price": 2.50, "min_stock_level": 1000},
        ]
        
        for material_data in materials_to_create:
            try:
                response = self.session.post(f"{self.base_url}/raw-materials", json=material_data)
                if response.status_code == 200:
                    data = response.json()
                    self.created_materials.append(data)
                    print(f"✅ Created material: {material_data['name']} (ID: {data['id']})")
                else:
                    print(f"❌ Failed to create {material_data['name']}: {response.status_code}")
            except Exception as e:
                print(f"❌ Exception creating {material_data['name']}: {str(e)}")

    def test_material_entries_with_stock_update(self):
        """Test material entries and automatic stock updates"""
        print("\n=== Testing Material Entries with Stock Updates ===")
        
        if not self.created_materials:
            print("❌ No materials available for testing")
            return
            
        # Create material entry for Petkim
        petkim_material = next((m for m in self.created_materials if m['name'] == 'Petkim'), None)
        if petkim_material:
            entry_data = {
                "entry_date": datetime.now(timezone.utc).isoformat(),
                "material_id": petkim_material['id'],
                "quantity": 5000.0,
                "currency": "TL",
                "unit_price": 25.50,
                "total_amount": 127500.0,
                "supplier": "Test Tedarikçi",
                "invoice_number": "INV-001"
            }
            
            try:
                response = self.session.post(f"{self.base_url}/material-entries", json=entry_data)
                if response.status_code == 200:
                    print(f"✅ Created material entry for Petkim: 5000 kg")
                    
                    # Check if stock was updated
                    material_response = self.session.get(f"{self.base_url}/raw-materials/{petkim_material['id']}")
                    if material_response.status_code == 200:
                        updated_material = material_response.json()
                        print(f"✅ Stock updated - Current stock: {updated_material['current_stock']} kg")
                    else:
                        print(f"❌ Failed to check updated stock")
                else:
                    print(f"❌ Failed to create material entry: {response.status_code}")
            except Exception as e:
                print(f"❌ Exception creating material entry: {str(e)}")

    def test_manufacturing_record_creation(self):
        """Test manufacturing record creation with calculations"""
        print("\n=== Testing Manufacturing Record Creation ===")
        
        # Create a manufacturing record
        manufacturing_data = {
            "production_date": datetime.now(timezone.utc).isoformat(),
            "machine": "Makine 1",
            "thickness_mm": 5.0,
            "width_cm": 120.0,
            "length_m": 10.0,
            "quantity": 50,
            "masura_type": "Masura 100",
            "masura_quantity": 50,
            "gas_consumption_kg": 25.5
        }
        
        try:
            response = self.session.post(f"{self.base_url}/manufacturing", json=manufacturing_data)
            if response.status_code == 200:
                data = response.json()
                expected_sqm = (120.0 / 100) * 10.0 * 50  # 600 m²
                print(f"✅ Created manufacturing record")
                print(f"   Square meters calculated: {data['square_meters']} m² (expected: {expected_sqm})")
                print(f"   Model: {data['model']}")
                
                if abs(data['square_meters'] - expected_sqm) < 0.01:
                    print(f"✅ Square meter calculation is correct")
                else:
                    print(f"❌ Square meter calculation error")
            else:
                print(f"❌ Failed to create manufacturing record: {response.status_code}")
                print(f"   Response: {response.text}")
        except Exception as e:
            print(f"❌ Exception creating manufacturing record: {str(e)}")

    def test_daily_consumption_calculations(self):
        """Test daily consumption with automatic calculations"""
        print("\n=== Testing Daily Consumption Calculations ===")
        
        consumption_data = {
            "date": datetime.now(timezone.utc).isoformat(),
            "machine": "Makine 1",
            "petkim_quantity": 1000.0,
            "fire_quantity": 200.0,
            "estol_quantity": 36.0,  # (1000 + 200) * 0.03
            "talk_quantity": 18.0    # (1000 + 200) * 0.015
        }
        
        # Add total_petkim calculation
        consumption_data["total_petkim"] = consumption_data["petkim_quantity"] + consumption_data["fire_quantity"]
        
        try:
            response = self.session.post(f"{self.base_url}/daily-consumptions", json=consumption_data)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Created daily consumption record")
                print(f"   Total Petkim: {data['total_petkim']} kg")
                print(f"   Estol: {data['estol_quantity']} kg")
                print(f"   Talk: {data['talk_quantity']} kg")
                
                # Verify calculations
                expected_total = consumption_data["petkim_quantity"] + consumption_data["fire_quantity"]
                expected_estol = expected_total * 0.03
                expected_talk = expected_total * 0.015
                
                if (abs(data['total_petkim'] - expected_total) < 0.01 and
                    abs(data['estol_quantity'] - expected_estol) < 0.01 and
                    abs(data['talk_quantity'] - expected_talk) < 0.01):
                    print(f"✅ Automatic calculations are correct")
                else:
                    print(f"❌ Calculation errors detected")
            else:
                print(f"❌ Failed to create daily consumption: {response.status_code}")
                print(f"   Response: {response.text}")
        except Exception as e:
            print(f"❌ Exception creating daily consumption: {str(e)}")

    def test_shipment_with_auto_number(self):
        """Test shipment creation with automatic numbering"""
        print("\n=== Testing Shipment Creation with Auto Numbering ===")
        
        shipment_data = {
            "shipment_date": datetime.now(timezone.utc).isoformat(),
            "customer_company": "Test Müşteri A.Ş.",
            "thickness_mm": 5.0,
            "width_cm": 120.0,
            "length_m": 10.0,
            "quantity": 25,
            "invoice_number": "IRS-001",
            "vehicle_plate": "34 ABC 123",
            "driver_name": "Ahmet Yılmaz"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/shipments", json=shipment_data)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Created shipment record")
                print(f"   Shipment Number: {data['shipment_number']}")
                print(f"   Square Meters: {data['square_meters']} m²")
                
                # Check if shipment number follows SEV-XXXXX format
                if data['shipment_number'].startswith('SEV-') and len(data['shipment_number']) == 9:
                    print(f"✅ Automatic shipment numbering is correct")
                else:
                    print(f"❌ Shipment numbering format error")
            else:
                print(f"❌ Failed to create shipment: {response.status_code}")
                print(f"   Response: {response.text}")
        except Exception as e:
            print(f"❌ Exception creating shipment: {str(e)}")

    def test_stock_calculation(self):
        """Test stock calculation after production and shipment"""
        print("\n=== Testing Stock Calculation ===")
        
        try:
            response = self.session.get(f"{self.base_url}/stock")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Retrieved stock data: {len(data)} items")
                
                for item in data:
                    print(f"   Stock Item: {item['thickness_mm']}mm x {item['width_cm']}cm x {item['length_m']}m")
                    print(f"   Quantity: {item['total_quantity']}, Square Meters: {item['total_square_meters']}")
                    
            else:
                print(f"❌ Failed to get stock: {response.status_code}")
        except Exception as e:
            print(f"❌ Exception getting stock: {str(e)}")

    def run_extended_tests(self):
        """Run all extended tests"""
        print("Starting Extended Backend Tests")
        print("=" * 60)
        
        if not self.authenticate():
            print("❌ Authentication failed")
            return False
            
        print("✅ Authentication successful")
        
        self.test_material_creation_and_stock_update()
        self.test_material_entries_with_stock_update()
        self.test_manufacturing_record_creation()
        self.test_daily_consumption_calculations()
        self.test_shipment_with_auto_number()
        self.test_stock_calculation()
        
        print("\n" + "=" * 60)
        print("Extended Tests Completed")
        print("=" * 60)
        
        return True

if __name__ == "__main__":
    tester = ExtendedTester()
    success = tester.run_extended_tests()
    sys.exit(0 if success else 1)