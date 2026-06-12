#!/bin/bash
echo "Capturing Idle Baseline..."
kubectl top pods -n default > baseline.txt

echo "Starting K6 Test (48 VUs)..."
k6 run tests/k6-test/quick-test.js > k6_output.txt &
K6_PID=$!

echo "Waiting for setup to complete and test to enter running state..."
while true; do
    if ! kill -0 $K6_PID 2>/dev/null; then
        echo "K6 finished early."
        exit 1
    fi
    if grep -q "running (" k6_output.txt; then
        echo "Test is now running under load. Waiting 10s for load to stabilize..."
        sleep 10
        break
    fi
    sleep 5
done

echo "Capturing Peak Metrics (every 5s for 60s)..."
rm -f peak.txt
for i in {1..12}; do
    if ! kill -0 $K6_PID 2>/dev/null; then
        echo "K6 finished early."
        break
    fi
    kubectl top pods -n default >> peak.txt
    echo "---" >> peak.txt
    sleep 5
done

echo "Waiting for K6 to finish..."
wait $K6_PID

echo "Done."
