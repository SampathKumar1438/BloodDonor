import requests
import json

def test_registration():
    base_url = "http://localhost:5001"
    
    print("Testing detailed registration with proper error handling...")
    
    # Test user data
    new_user = {
        "name": "Test User",
        "email": "test123@example.com",
        "phone": "555-TEST-123",
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
    except Exception as e:
        print(f"Exception during request: {str(e)}")

if __name__ == "__main__":
    test_registration()
