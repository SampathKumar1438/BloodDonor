import os
import subprocess
import sys
import time
import signal

def find_frontend_process():
    try:
        # Find processes using port 3000
        netstat_output = subprocess.check_output(
            "netstat -ano | findstr :3000", shell=True
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
    print("===== Restarting Frontend Server =====\n")
    
    # Kill existing frontend server if running
    pid = find_frontend_process()
    if pid:
        print(f"Found frontend server process with PID {pid}")
        try:
            print(f"Stopping process {pid}...")
            os.kill(int(pid), signal.SIGTERM)
            time.sleep(2)  # Give it time to stop
            print(f"Process {pid} stopped")
        except Exception as e:
            print(f"Error stopping process: {str(e)}")
    else:
        print("No running frontend server found")
    
    # Start the frontend server
    print("\nStarting frontend server...")
    frontend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
    
    # Start in a new window
    subprocess.Popen(
        ["start", "cmd", "/k", "cd frontend && npm start"],
        shell=True
    )
    
    print("\nFrontend server is starting. Please wait a moment for it to compile and start.")
    print("Then try to access http://localhost:3000 in your browser.\n")

if __name__ == "__main__":
    main()
