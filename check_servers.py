import requests
import subprocess
import os
import time
import sys

def check_port(port):
    """Check if a port is in use by trying to connect to it"""
    try:
        response = requests.get(f"http://localhost:{port}", timeout=2)
        return True, response.status_code, response.text[:200]  # Return first 200 chars of content
    except requests.ConnectionError:
        return False, None, None
    except Exception as e:
        return False, None, str(e)

def netstat_check(port):
    """Check if port is in use using netstat"""
    try:
        netstat_output = subprocess.check_output(
            f"netstat -ano | findstr :{port}", shell=True
        ).decode("utf-8")
        
        return netstat_output.strip() if netstat_output.strip() else "No process found on this port"
    except subprocess.CalledProcessError:
        return "No process found on this port"

def main():
    print("===== Checking frontend and backend servers =====")
    
    # Check frontend port 3000
    print("\nChecking frontend on port 3000...")
    is_running, status, content = check_port(3000)
    if is_running:
        print(f"✓ Frontend is running on port 3000 (Status code: {status})")
        print(f"Content preview: {content}")
    else:
        print("✗ Frontend is NOT running on port 3000")
        print(f"  Response: {content}")
        print("\nNetstat result for port 3000:")
        print(netstat_check(3000))
    
    # Check backend port 5001
    print("\nChecking backend on port 5001...")
    is_running, status, content = check_port(5001)
    if is_running:
        print(f"✓ Backend is running on port 5001 (Status code: {status})")
        print(f"Content preview: {content}")
    else:
        print("✗ Backend is NOT running on port 5001")
        print(f"  Response: {content}")
        print("\nNetstat result for port 5001:")
        print(netstat_check(5001))
    
    # Check backend health endpoint
    print("\nChecking backend health endpoint...")
    try:
        response = requests.get("http://localhost:5001/api/health", timeout=2)
        print(f"✓ Backend health endpoint returned status {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"✗ Could not connect to backend health endpoint: {str(e)}")
    
    print("\n===== Check Complete =====")
    print("Next steps:")
    print("1. If frontend is not running, start it with: cd frontend && npm start")
    print("2. If backend is not running, start it with: cd backend && python app_fixed.py")
    print("3. Clear your browser cache and try again")

if __name__ == "__main__":
    main()
