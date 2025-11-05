#!/usr/bin/env python3
"""
SAP01 Üretim Yönetim Sistemi Backend Test Suite
Tests all backend API endpoints for the production management system
"""

import requests
import json
from datetime import datetime, timezone
import sys
import os

# Get backend URL from frontend .env file
BACKEND_URL = "https://alldata-service.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.token = None
        self.session = requests.Session()
        self.test_results = []
        
    def log_result(self, test_name, success, message="", response_data=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "response_data": response_data
        }
        self.test_results.append(result)
        print(f"{status}: {test_name}")
        if message:
            print(f"   Message: {message}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_authentication(self):
        """Test authentication endpoints"""
        print("=== Testing Authentication ===")
        
        # Test login with admin credentials
        try:
            login_data = {
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data:
                    self.token = data["token"]
                    self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                    self.log_result("Admin Login", True, f"Token received, user: {data.get('user', {}).get('username')}")
                else:
                    self.log_result("Admin Login", False, "No token in response", data)
            else:
                self.log_result("Admin Login", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Admin Login", False, f"Exception: {str(e)}")
            
        # Test token validation with /auth/me
        if self.token:
            try:
                response = self.session.get(f"{self.base_url}/auth/me")
                if response.status_code == 200:
                    data = response.json()
                    self.log_result("Token Validation", True, f"User info retrieved: {data.get('username')}")
                else:
                    self.log_result("Token Validation", False, f"Status: {response.status_code}", response.text)
            except Exception as e:
                self.log_result("Token Validation", False, f"Exception: {str(e)}")

    def test_raw_materials(self):
        """Test raw materials endpoints"""
        print("=== Testing Raw Materials ===")
        
        if not self.token:
            self.log_result("Raw Materials Test", False, "No authentication token available")
            return
            
        # Test GET /api/raw-materials
        try:
            response = self.session.get(f"{self.base_url}/raw-materials")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Raw Materials", True, f"Retrieved {len(data)} materials")
            else:
                self.log_result("Get Raw Materials", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Raw Materials", False, f"Exception: {str(e)}")
            
        # Test POST /api/raw-materials (create new material)
        try:
            new_material = {
                "name": "Test Hammadde",
                "code": f"TEST{datetime.now().strftime('%H%M%S')}",
                "unit": "kg",
                "unit_price": 15.50,
                "min_stock_level": 100
            }
            
            response = self.session.post(f"{self.base_url}/raw-materials", json=new_material)
            if response.status_code == 200:
                data = response.json()
                self.log_result("Create Raw Material", True, f"Created material: {data.get('name')}")
            else:
                self.log_result("Create Raw Material", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Create Raw Material", False, f"Exception: {str(e)}")

    def test_material_entries(self):
        """Test material entries endpoints"""
        print("=== Testing Material Entries ===")
        
        if not self.token:
            self.log_result("Material Entries Test", False, "No authentication token available")
            return
            
        # Test GET /api/material-entries
        try:
            response = self.session.get(f"{self.base_url}/material-entries")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Material Entries", True, f"Retrieved {len(data)} entries")
            else:
                self.log_result("Get Material Entries", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Material Entries", False, f"Exception: {str(e)}")

    def test_manufacturing(self):
        """Test manufacturing endpoints"""
        print("=== Testing Manufacturing Records ===")
        
        if not self.token:
            self.log_result("Manufacturing Test", False, "No authentication token available")
            return
            
        # Test GET /api/manufacturing
        try:
            response = self.session.get(f"{self.base_url}/manufacturing")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Manufacturing Records", True, f"Retrieved {len(data)} records")
                
                # Check if square meter calculation is working
                if data:
                    sample_record = data[0]
                    if "square_meters" in sample_record:
                        self.log_result("Square Meter Calculation", True, f"Sample record has {sample_record['square_meters']} m²")
                    else:
                        self.log_result("Square Meter Calculation", False, "No square_meters field found")
            else:
                self.log_result("Get Manufacturing Records", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Manufacturing Records", False, f"Exception: {str(e)}")

    def test_daily_consumptions(self):
        """Test daily consumption endpoints"""
        print("=== Testing Daily Consumptions ===")
        
        if not self.token:
            self.log_result("Daily Consumptions Test", False, "No authentication token available")
            return
            
        # Test GET /api/daily-consumptions
        try:
            response = self.session.get(f"{self.base_url}/daily-consumptions")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Daily Consumptions", True, f"Retrieved {len(data)} consumption records")
                
                # Check automatic calculation (Estol, Talk)
                if data:
                    sample = data[0]
                    if "estol_quantity" in sample and "talk_quantity" in sample:
                        self.log_result("Automatic Calculation Check", True, f"Estol: {sample['estol_quantity']}, Talk: {sample['talk_quantity']}")
                    else:
                        self.log_result("Automatic Calculation Check", False, "Missing estol_quantity or talk_quantity")
            else:
                self.log_result("Get Daily Consumptions", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Daily Consumptions", False, f"Exception: {str(e)}")

    def test_gas_consumption(self):
        """Test gas consumption endpoints"""
        print("=== Testing Gas Consumption ===")
        
        if not self.token:
            self.log_result("Gas Consumption Test", False, "No authentication token available")
            return
            
        # Test GET /api/gas-consumption
        try:
            response = self.session.get(f"{self.base_url}/gas-consumption")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Gas Consumption", True, f"Retrieved {len(data)} gas consumption records")
            else:
                self.log_result("Get Gas Consumption", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Gas Consumption", False, f"Exception: {str(e)}")

    def test_shipments(self):
        """Test shipments endpoints"""
        print("=== Testing Shipments ===")
        
        if not self.token:
            self.log_result("Shipments Test", False, "No authentication token available")
            return
            
        # Test GET /api/shipments
        try:
            response = self.session.get(f"{self.base_url}/shipments")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Shipments", True, f"Retrieved {len(data)} shipment records")
                
                # Check automatic shipment number generation
                if data:
                    sample = data[0]
                    if "shipment_number" in sample and sample["shipment_number"].startswith("SEV-"):
                        self.log_result("Automatic Shipment Number", True, f"Sample number: {sample['shipment_number']}")
                    else:
                        self.log_result("Automatic Shipment Number", False, "Invalid or missing shipment number format")
            else:
                self.log_result("Get Shipments", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Shipments", False, f"Exception: {str(e)}")

    def test_stock_status(self):
        """Test stock status endpoints"""
        print("=== Testing Stock Status ===")
        
        if not self.token:
            self.log_result("Stock Status Test", False, "No authentication token available")
            return
            
        # Test GET /api/stock
        try:
            response = self.session.get(f"{self.base_url}/stock")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Stock Status", True, f"Retrieved {len(data)} stock items")
            else:
                self.log_result("Get Stock Status", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Stock Status", False, f"Exception: {str(e)}")

    def test_cost_analysis(self):
        """Test cost analysis endpoints"""
        print("=== Testing Cost Analysis ===")
        
        if not self.token:
            self.log_result("Cost Analysis Test", False, "No authentication token available")
            return
            
        # Test GET /api/costs/analysis
        try:
            response = self.session.get(f"{self.base_url}/costs/analysis")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Cost Analysis", True, f"Retrieved cost analysis for {len(data)} materials")
            else:
                self.log_result("Get Cost Analysis", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Cost Analysis", False, f"Exception: {str(e)}")

    def test_users(self):
        """Test users endpoints"""
        print("=== Testing Users ===")
        
        if not self.token:
            self.log_result("Users Test", False, "No authentication token available")
            return
            
        # Test GET /api/users (admin access required)
        try:
            response = self.session.get(f"{self.base_url}/users")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Users (Admin Access)", True, f"Retrieved {len(data)} users")
            elif response.status_code == 403:
                self.log_result("Get Users (Admin Access)", False, "Access denied - check admin permissions")
            else:
                self.log_result("Get Users (Admin Access)", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Users (Admin Access)", False, f"Exception: {str(e)}")

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("=== Testing Dashboard Stats ===")
        
        if not self.token:
            self.log_result("Dashboard Stats Test", False, "No authentication token available")
            return
            
        # Test GET /api/dashboard/stats
        try:
            response = self.session.get(f"{self.base_url}/dashboard/stats")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Get Dashboard Stats", True, f"Stats: {data}")
            else:
                self.log_result("Get Dashboard Stats", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Dashboard Stats", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print(f"Starting SAP01 Backend Tests")
        print(f"Backend URL: {self.base_url}")
        print(f"Admin Credentials: {ADMIN_USERNAME} / {ADMIN_PASSWORD}")
        print("=" * 60)
        
        # Run all test modules
        self.test_authentication()
        self.test_raw_materials()
        self.test_material_entries()
        self.test_manufacturing()
        self.test_daily_consumptions()
        self.test_gas_consumption()
        self.test_shipments()
        self.test_stock_status()
        self.test_cost_analysis()
        self.test_users()
        self.test_dashboard_stats()
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result["status"])
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result["status"])
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        
        if failed > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result["status"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)