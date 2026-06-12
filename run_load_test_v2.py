import subprocess
import time
import os
import sys

print("Running database and cache cleanup...")
subprocess.run(["bash", "tests/k6-test/k6-cleanup.sh", "--yes"])

print("Starting K6 150 VUs load test...")
# Start k6 and redirect stdout/stderr to file
k6_process = subprocess.Popen(
    ["k6", "run", "tests/k6-test/quick-test.js"],
    stdout=open("k6_150vus_output.txt", "w"),
    stderr=subprocess.STDOUT
)

print("K6 process started in background. Waiting for setup to complete...")

# Loop to wait for setup to finish
start_time = time.time()
setup_completed = False
while True:
    if k6_process.poll() is not None:
        print("K6 process exited early during setup!")
        sys.exit(1)
        
    if os.path.exists("k6_150vus_output.txt"):
        with open("k6_150vus_output.txt", "r") as f:
            content = f.read()
            if "running (" in content:
                print("Setup completed! K6 is now running scenarios under load.")
                setup_completed = True
                break
                
    # Print status message every 10 seconds
    time.sleep(5)
    elapsed = time.time() - start_time
    print(f"Still waiting for setup... ({int(elapsed)}s elapsed)")

if setup_completed:
    print("Waiting 10s for load to stabilize before capturing metrics...")
    time.sleep(10)
    
    print("Capturing Peak Metrics (every 5s for 60s)...")
    peak_file = open("peak_150vus.txt", "w")
    for i in range(12):
        if k6_process.poll() is not None:
            print("K6 finished early during load phase.")
            break
            
        r = subprocess.run(["kubectl", "top", "pods"], capture_output=True, text=True)
        peak_file.write(f"--- Capture {i+1} ---\n")
        peak_file.write(r.stdout)
        peak_file.write("\n")
        print(f"Captured metrics iteration {i+1}/12")
        time.sleep(5)
        
    peak_file.close()

print("Waiting for K6 process to finish reporting...")
k6_process.wait()

print("K6 load test completed. Exit code:", k6_process.returncode)

if os.path.exists("k6_150vus_output.txt"):
    with open("k6_150vus_output.txt", "r") as f:
        lines = f.readlines()
        print("\n=== K6 Load Test Summary ===")
        # Print the last 40 lines of the output
        print("".join(lines[-40:]))
