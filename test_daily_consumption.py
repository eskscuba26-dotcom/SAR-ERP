#!/usr/bin/env python3
"""
Test daily consumption endpoint after fix
"""

import requests
import json
from datetime import datetime, timezone

BACKEND_URL = "https://alldata-service.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def test_daily_consumption():
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
    
    # Test daily consumption creation
    consumption_data = {
        "date": datetime.now(timezone.utc).isoformat(),
        "machine": "Makine 1",
        "petkim_quantity": 1000.0,
        "fire_quantity": 200.0,
        "estol_quantity": 36.0,  # (1000 + 200) * 0.03
        "talk_quantity": 18.0    # (1000 + 200) * 0.015
    }
    
    try:
        response = session.post(f"{BACKEND_URL}/daily-consumptions", json=consumption_data)
        if response.status_code == 200:
            data = response.json()
            print("✅ Daily consumption created successfully")
            print(f"   Total Petkim: {data['total_petkim']} kg")
            print(f"   Estol: {data['estol_quantity']} kg")
            print(f"   Talk: {data['talk_quantity']} kg")
            
            # Verify calculations
            expected_total = consumption_data["petkim_quantity"] + consumption_data["fire_quantity"]
            if abs(data['total_petkim'] - expected_total) < 0.01:
                print("✅ Total Petkim calculation is correct")
            else:
                print("❌ Total Petkim calculation error")
        else:
            print(f"❌ Failed to create daily consumption: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

if __name__ == "__main__":
    test_daily_consumption()