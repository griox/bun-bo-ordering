import subprocess
import time
import os

print("Starting K6 150 VUs load test...")
# Run k6 in background
k6_process = subprocess.Popen(
    ["k6", "run", "tests/k6-test/quick-test.js"],
    stdout=open("k6_150vus_output.txt", "w"),
    stderr=subprocess.STDOUT
)

print("K6 started. Monitoring pod resource usage (every 5 seconds)...")
peak_file = open("peak_150vus.txt", "w")

# Wait a bit for k6 to start running stages
time.sleep(5)

# Monitor for 60 seconds (duration of test stages is ~55s)
for i in range(12):
    if k6_process.poll() is not None:
        print("K6 finished early.")
        break
    
    # Run kubectl top pods
    r = subprocess.run(["kubectl", "top", "pods"], capture_output=True, text=True)
    peak_file.write(f"--- Capture {i+1} ---\n")
    peak_file.write(r.stdout)
    peak_file.write("\n")
    print(f"Captured metrics iteration {i+1}/12")
    time.sleep(5)

print("Waiting for K6 load test to complete...")
k6_process.wait()
peak_file.close()

print("K6 load test completed. Exit code:", k6_process.returncode)

# Print summary of k6 results
if os.path.exists("k6_150vus_output.txt"):
    with open("k6_150vus_output.txt", "r") as f:
        lines = f.readlines()
        # Print last 50 lines which usually contain the summary
        print("\n=== K6 Load Test Summary ===")
        print("".join(lines[-50:]))
