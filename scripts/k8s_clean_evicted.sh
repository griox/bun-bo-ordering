#!/bin/bash
# Description: Clean up Evicted or Failed pods in the Kubernetes cluster
# Usage: ./k8s_clean_evicted.sh [NAMESPACE]

NAMESPACE=${1:-"--all-namespaces"}

echo "🧹 Cleaning up Evicted pods..."

if [ "$NAMESPACE" == "--all-namespaces" ]; then
    kubectl get pods --all-namespaces | grep Evicted | awk '{print $2 " --namespace=" $1}' | xargs -n 2 -r kubectl delete pod
else
    kubectl get pods -n "$NAMESPACE" | grep Evicted | awk '{print $1}' | xargs -r kubectl delete pod -n "$NAMESPACE"
fi

echo "✅ Cleanup finished."
