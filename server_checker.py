import os
import signal
import subprocess
import sys
import time
import requests

def check_port(port):
    """Check if a port is in use by trying to connect to it"""
    try:
        response = requests.get(f"http://localhost:{port}/api/health", timeout=1)
        return True, response.status_code
    except requests.ConnectionError:
        return False, None
    except Exception as e:
        return False, str(e)

def find_processes_by_port(port):
    """Find processes using a specific port"""
    try:
        # Windows specific command
        netstat_output = subprocess.check_output(
            f"netstat -ano | findstr :{port}", shell=True
        ).decode("utf-8")
        
        print(f"Processes using port {port}:")
        print(netstat_output)
        
        # Extract PIDs
        pids = []
        for line in netstat_output.strip().split("\n"):
            if f":{port}" in line:
                parts = line.strip().split()
                if len(parts) > 4:  # Last column is PID
                    pids.append(parts[-1])
        
        # Get process details
        for pid in set(pids):
            try:
                process_info = subprocess.check_output(
                    f"tasklist /fi \"PID eq {pid}\"", shell=True
                ).decode("utf-8")
                print(f"Process with PID {pid}:")
                print(process_info)
            except:
                print(f"Could not get info for PID {pid}")
        
        return list(set(pids))
    except subprocess.CalledProcessError:
        print(f"No processes found using port {port}")
        return []

def main():
    print("===== Blood Donor App Server Checker =====")
    
    # Check common ports
    ports_to_check = [5000, 5001, 5002, 3000]
    
    print("\nChecking for running servers...")
    for port in ports_to_check:
        is_running, status = check_port(port)
        if is_running:
            print(f"✓ Server running on port {port}, status: {status}")
            find_processes_by_port(port)
        else:
            print(f"✗ No server detected on port {port}")
    
    # Ask if user wants to kill any processes
    print("\nDo you want to stop any servers? (y/n)")
    choice = input().lower()
    
    if choice == 'y':
        port = int(input("Enter the port to stop server on: "))
        pids = find_processes_by_port(port)
        
        if pids:
            for pid in pids:
                try:
                    print(f"Stopping process with PID {pid}...")
                    # Windows specific command
                    os.kill(int(pid), signal.SIGTERM)
                    print(f"Process {pid} stopped.")
                except Exception as e:
                    print(f"Error stopping process {pid}: {str(e)}")
        else:
            print(f"No processes found using port {port}")
    
    print("\n===== Server Check Complete =====")
    print("To run the backend correctly:")
    print("1. Ensure app_fixed.py is running on port 5001")
    print("2. Ensure the frontend is configured to proxy to port 5001")
    print("3. Make sure there are no other conflicting servers running")

if __name__ == "__main__":
    main()
