import os
import subprocess
import sys
import time
import signal

def find_backend_process():
    try:
        # Find processes using port 5001
        netstat_output = subprocess.check_output(
            "netstat -ano | findstr :5001", shell=True
        ).decode("utf-8")
        
        # Extract PID
        for line in netstat_output.strip().split("\n"):
            if "LISTENING" in line:
                parts = line.strip().split()
                if len(parts) > 4:
                    return parts[-1]
                
        return None
    except:
        return None

def main():
    print("===== Restarting Backend Server =====\n")
    
    # Kill existing backend server if running
    pid = find_backend_process()
    if pid:
        print(f"Found backend server process with PID {pid}")
        try:
            print(f"Stopping process {pid}...")
            os.kill(int(pid), signal.SIGTERM)
            time.sleep(2)  # Give it time to stop
            print(f"Process {pid} stopped")
        except Exception as e:
            print(f"Error stopping process: {str(e)}")
    else:
        print("No running backend server found")
    
    # Start the backend server
    print("\nStarting backend server...")
    subprocess.Popen(
        ["start", "cmd", "/k", "cd backend && python app_fixed.py"],
        shell=True
    )
    
    print("\nBackend server is starting. Please wait a moment.")
    
    # Wait for the backend to be ready
    attempts = 0
    while attempts < 10:
        try:
            import requests
            response = requests.get("http://localhost:5001/api/health")
            if response.status_code == 200:
                print("\nBackend server is running!")
                break
        except:
            pass
        
        attempts += 1
        time.sleep(1)
        print(".", end="", flush=True)
    
    if attempts >= 10:
        print("\nBackend server might not be ready yet. Please check the server window.")
    
    print("\nYou can now try using the application at http://localhost:3000")

if __name__ == "__main__":
    main()
