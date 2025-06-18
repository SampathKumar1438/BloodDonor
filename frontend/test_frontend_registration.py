import requests
import json
import random

# Generate random data to avoid duplicate email issues
random_id = random.randint(1000, 9999)
test_data = {
    "name": f"Test User {random_id}",
    "email": f"test{random_id}@example.com",
    "phone": f"555-TEST-{random_id}",
    "bloodGroup": "AB+",
    "city": "Test City",
    "latitude": 12.345,
    "longitude": 67.890
}

# Test both with direct URL and the proxy URL
urls = [
    "http://localhost:5001/api/register",  # Direct backend URL
    "http://localhost:3000/api/register"   # Frontend proxy URL (if React is running)
]

print("Testing registration endpoints...")

for url in urls:
    print(f"\nTrying registration with URL: {url}")
    try:
        response = requests.post(
            url,
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status code: {response.status_code}")
        
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Raw response: {response.text}")
    except Exception as e:
        print(f"Error: {str(e)}")
