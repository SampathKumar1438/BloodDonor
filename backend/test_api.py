import requests
import json

def test_api():
    base_url = "http://localhost:5000"
    
    # Test the /api/donors endpoint
    print("Testing /api/donors endpoint...")
    response = requests.get(f"{base_url}/api/donors")
    if response.status_code == 200:
        donors = response.json()
        print(f"Success! Found {len(donors)} donors")
        if donors:
            print("First donor:", json.dumps(donors[0], indent=2))
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
    
    # Test filtering by blood group
    print("\nTesting filtering by blood group (A+)...")
    response = requests.get(f"{base_url}/api/donors", params={"bloodGroup": "A+"})
    if response.status_code == 200:
        donors = response.json()
        print(f"Success! Found {len(donors)} donors with blood group A+")
        if donors:
            print("Blood groups found:", [d["blood_group"] for d in donors])
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
    
    # Test filtering by city
    print("\nTesting filtering by city (New York)...")
    response = requests.get(f"{base_url}/api/donors", params={"city": "New York"})
    if response.status_code == 200:
        donors = response.json()
        print(f"Success! Found {len(donors)} donors in New York")
        if donors:
            print("Cities found:", [d["city"] for d in donors])
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
    
    # Test the registration endpoint
    print("\nTesting /api/register endpoint...")
    new_user = {
        "name": "Test User",
        "email": "test@example.com",
        "phone": "555-TEST-123",
        "bloodGroup": "AB+",
        "city": "Test City",
        "latitude": 12.345,
        "longitude": 67.890
    }
    
    response = requests.post(f"{base_url}/api/register", json=new_user)
    if response.status_code == 201:
        result = response.json()
        print("Success! User registered:")
        print(json.dumps(result, indent=2))
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_api()
