#!/usr/bin/env python3
"""
Comprehensive Backend Test - Test additional endpoints and edge cases
"""

import requests
import json
from datetime import datetime, timezone

BACKEND_URL = "https://alldata-service.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def comprehensive_test():
    session = requests.Session()
    
    # Login
    login_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    
    response = session.post(f"{BACKEND_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        data = response.json()
        token = data["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        print("✅ Authentication successful")
    else:
        print("❌ Authentication failed")
        return
    
    print("\n=== Testing Additional Endpoints ===")
    
    # Test gas consumption creation
    print("\n--- Testing Gas Consumption Creation ---")
    gas_data = {
        "date": datetime.now(timezone.utc).isoformat(),
        "total_gas_kg": 50.5
    }
    
    try:
        response = session.post(f"{BACKEND_URL}/gas-consumption", json=gas_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Gas consumption created: {data['total_gas_kg']} kg")
        else:
            print(f"❌ Failed to create gas consumption: {response.status_code}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
    
    # Test products endpoint
    print("\n--- Testing Products Endpoint ---")
    try:
        response = session.get(f"{BACKEND_URL}/products")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Products retrieved: {len(data)} products")
        else:
            print(f"❌ Failed to get products: {response.status_code}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
    
    # Test production orders endpoint
    print("\n--- Testing Production Orders Endpoint ---")
    try:
        response = session.get(f"{BACKEND_URL}/production-orders")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Production orders retrieved: {len(data)} orders")
        else:
            print(f"❌ Failed to get production orders: {response.status_code}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
    
    # Test consumptions endpoint
    print("\n--- Testing Consumptions Endpoint ---")
    try:
        response = session.get(f"{BACKEND_URL}/consumptions")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Consumptions retrieved: {len(data)} consumption records")
        else:
            print(f"❌ Failed to get consumptions: {response.status_code}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
    
    # Test stock transactions endpoint
    print("\n--- Testing Stock Transactions Endpoint ---")
    try:
        response = session.get(f"{BACKEND_URL}/stock-transactions")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Stock transactions retrieved: {len(data)} transactions")
        else:
            print(f"❌ Failed to get stock transactions: {response.status_code}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
    
    # Test authentication with wrong credentials
    print("\n--- Testing Authentication with Wrong Credentials ---")
    wrong_session = requests.Session()
    wrong_login = {
        "username": "wrong_user",
        "password": "wrong_password"
    }
    
    try:
        response = wrong_session.post(f"{BACKEND_URL}/auth/login", json=wrong_login)
        if response.status_code == 401:
            print("✅ Correctly rejected wrong credentials")
        else:
            print(f"❌ Unexpected response for wrong credentials: {response.status_code}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
    
    # Test unauthorized access
    print("\n--- Testing Unauthorized Access ---")
    unauth_session = requests.Session()
    try:
        response = unauth_session.get(f"{BACKEND_URL}/raw-materials")
        if response.status_code == 401 or response.status_code == 403:
            print("✅ Correctly rejected unauthorized access")
        else:
            print(f"❌ Unexpected response for unauthorized access: {response.status_code}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
    
    print("\n=== Comprehensive Test Completed ===")

if __name__ == "__main__":
    comprehensive_test()