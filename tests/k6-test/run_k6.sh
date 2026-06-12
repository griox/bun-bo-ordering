#!/bin/bash
k6 run tests/k6-test/quick-test.js > k6_output.txt 2>&1
echo "K6 load test completed. Exit code: $?"
