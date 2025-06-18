import subprocess
import sys
import os
import time
import webbrowser

def start_backend():
    print("Starting backend server (app_fixed.py) on port 5001...")
    
    # Start in a new window so it stays open
    backend_process = subprocess.Popen(
        ["start", "cmd", "/k", "cd backend && python app_fixed.py"],
        shell=True
    )
    
    # Give it time to start
    time.sleep(3)
    
    # Check if it's running
    try:
        import requests
        response = requests.get("http://localhost:5001/api/health", timeout=2)
        if response.status_code == 200:
            print("✓ Backend started successfully")
        else:
            print(f"✗ Backend responded with status code {response.status_code}")
    except Exception as e:
        print(f"✗ Could not connect to backend: {str(e)}")

def start_frontend():
    print("\nStarting frontend on port 3000...")
    
    # Start in a new window so it stays open
    frontend_process = subprocess.Popen(
        ["start", "cmd", "/k", "cd frontend && npm start"],
        shell=True
    )
    
    # Give it time to start
    time.sleep(5)
    
    print("✓ Frontend starting... it may take a moment to compile")
    
    # After a delay, try to open the app in the browser
    time.sleep(10)
    webbrowser.open("http://localhost:3000")

def main():
    print("===== Starting Blood Donor App =====\n")
    
    # First check if there are any servers already running
    ports_to_check = [5000, 5001]
    conflict = False
    
    for port in ports_to_check:
        try:
            import requests
            requests.get(f"http://localhost:{port}", timeout=1)
            print(f"⚠ Warning: Server already running on port {port}")
            conflict = True
        except:
            pass
    
    if conflict:
        print("\nSome ports are already in use. Please run server_checker.py first to ensure no conflicting servers are running.")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            print("Exiting...")
            sys.exit(1)
    
    # Start the servers
    start_backend()
    start_frontend()
    
    print("\n===== App Started =====")
    print("Backend: http://localhost:5001")
    print("Frontend: http://localhost:3000")
    print("\nIf the app doesn't open automatically, please open your browser to http://localhost:3000")
    print("\nPress Ctrl+C to exit this script (the servers will continue running in their own windows)")

if __name__ == "__main__":
    main()
