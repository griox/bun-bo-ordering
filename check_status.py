import subprocess
import json
import time

def run_cmd(args):
    r = subprocess.run(args, capture_output=True, text=True)
    return r.stdout, r.stderr, r.returncode

print("Checking rollout status of deployments...")
deps = ["api-gateway", "cart-service", "catalog-service", "identity-service", "order-service", "payment-service"]
for d in deps:
    stdout, stderr, code = run_cmd(["kubectl", "rollout", "status", f"deployment/{d}", "--timeout=10s"])
    print(f"Deployment {d}: Code {code}")
    if stdout:
        print("STDOUT:", stdout.strip())
    if stderr:
        print("STDERR:", stderr.strip())

stdout, _, _ = run_cmd(["kubectl", "get", "pods"])
print("\nCurrent pods status:")
print(stdout)
