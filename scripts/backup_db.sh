#!/bin/bash
# Description: Script to backup PostgreSQL running inside a Kubernetes cluster
# Usage: ./backup_db.sh [NAMESPACE] [DB_USER] [DB_NAME]

NAMESPACE=${1:-default}
DB_USER=${2:-postgres}
DB_NAME=${3:-bunbo}
BACKUP_DIR="./backups"

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "🔍 Finding PostgreSQL pod in namespace: $NAMESPACE..."
# We look for a pod containing 'postgres' in its name, or explicitly labeled 'app=postgres'
POD_NAME=$(kubectl get pods -n "$NAMESPACE" -l app=postgres -o jsonpath="{.items[0].metadata.name}" 2>/dev/null)

if [ -z "$POD_NAME" ]; then
    # Fallback to grepping pod name if label is different
    POD_NAME=$(kubectl get pods -n "$NAMESPACE" | grep postgres | awk '{print $1}' | head -n 1)
fi

if [ -z "$POD_NAME" ]; then
    echo "❌ Error: Could not find any pod matching 'postgres' in namespace '$NAMESPACE'."
    echo "💡 Tip: Pass the correct namespace as the first argument, e.g., ./backup_db.sh bunbo-ns"
    exit 1
fi

echo "📦 Found pod: $POD_NAME"
echo "⏳ Starting backup of database '$DB_NAME'..."

# Execute pg_dump inside the pod and pipe to gzip locally
kubectl exec "$POD_NAME" -n "$NAMESPACE" -- pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully: $BACKUP_FILE"
    echo "📊 Size: $(du -sh $BACKUP_FILE | cut -f1)"
else
    echo "❌ Backup failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi
