import requests
import json
import os
import sys

def test_registration():
    base_url = "http://localhost:5001"
    
    print("Testing detailed registration with proper error handling...")
    
    # Test user data with unique email to avoid conflicts
    import random
    random_id = random.randint(1000, 9999)
    new_user = {
        "name": f"Test User {random_id}",
        "email": f"test{random_id}@example.com",
        "phone": f"555-TEST-{random_id}",
        "bloodGroup": "AB+",
        "city": "Test City",
        "latitude": 12.345,
        "longitude": 67.890
    }
    
    # Print request details
    print(f"Request URL: {base_url}/api/register")
    print(f"Request Headers: {{'Content-Type': 'application/json'}}")
    print(f"Request Body: {json.dumps(new_user, indent=2)}")
    
    try:
        response = requests.post(
            f"{base_url}/api/register",
            json=new_user,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Response Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        try:
            print(f"Response JSON: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response Text (not JSON): {response.text}")
        
        if response.status_code == 201:
            print("\nSuccess! User registered correctly.")
        else:
            print("\nError in registration!")
            
        # Check if the backend server is running
        try:
            health_response = requests.get(f"{base_url}/api/health")
            print(f"\nBackend health check: {health_response.status_code}")
            print(f"Backend health response: {health_response.json()}")
        except Exception as e:
            print(f"\nBackend health check failed: {str(e)}")
            
    except Exception as e:
        print(f"Exception during request: {str(e)}")
        print("\nChecking if server is running...")
        try:
            health_response = requests.get(f"{base_url}/api/health")
            print(f"Server is running, health endpoint response: {health_response.status_code}")
        except:
            print("Server does not appear to be running at", base_url)

if __name__ == "__main__":
    test_registration()
