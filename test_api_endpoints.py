import requests
import json
import random

def test_api_endpoints():
    print("Testing API endpoints...")
    
    # Base URLs to test
    backend_url = "http://localhost:5001"
    frontend_url = "http://localhost:3000"
    
    # Test health endpoint directly
    print("\n1. Testing backend health endpoint directly:")
    try:
        response = requests.get(f"{backend_url}/api/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Test health endpoint through proxy
    print("\n2. Testing backend health endpoint through frontend proxy:")
    try:
        response = requests.get(f"{frontend_url}/api/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Test registration directly
    print("\n3. Testing registration endpoint directly:")
    random_id = random.randint(1000, 9999)
    user_data = {
        "name": f"Test User {random_id}",
        "email": f"test{random_id}@example.com",
        "phone": f"555-{random_id}",
        "bloodGroup": "A+",
        "city": "Test City",
        "latitude": 12.345,
        "longitude": 67.890
    }
    
    try:
        response = requests.post(
            f"{backend_url}/api/register", 
            json=user_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Test registration through proxy
    print("\n4. Testing registration endpoint through frontend proxy:")
    random_id = random.randint(1000, 9999)
    user_data = {
        "name": f"Test User {random_id}",
        "email": f"test{random_id}@example.com",
        "phone": f"555-{random_id}",
        "bloodGroup": "A+",
        "city": "Test City",
        "latitude": 12.345,
        "longitude": 67.890
    }
    
    try:
        response = requests.post(
            f"{frontend_url}/api/register", 
            json=user_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Test donors endpoint directly
    print("\n5. Testing donors endpoint directly:")
    try:
        response = requests.get(f"{backend_url}/api/donors")
        print(f"Status: {response.status_code}")
        print(f"Found {len(response.json())} donors")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Test donors endpoint through proxy
    print("\n6. Testing donors endpoint through frontend proxy:")
    try:
        response = requests.get(f"{frontend_url}/api/donors")
        print(f"Status: {response.status_code}")
        print(f"Found {len(response.json())} donors")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_api_endpoints()
