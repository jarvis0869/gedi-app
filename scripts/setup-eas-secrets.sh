#!/usr/bin/env bash
# Pushes all key=value pairs from .env to EAS Environment Variables.
# EXPO_PUBLIC_* vars → --visibility plaintext  (required; these are bundled into the client)
# All other vars     → --visibility sensitive   (hidden in build logs)
#
# Usage:
#   chmod +x scripts/setup-eas-secrets.sh
#   ./scripts/setup-eas-secrets.sh
#
# Requires: eas-cli >= 10.x (npm i -g eas-cli) and eas login done.

set -euo pipefail

ENV_FILE=".env"
ENVIRONMENTS=("production" "preview" "development")

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Copy .env.example and fill in real values first."
  exit 1
fi

echo "Reading $ENV_FILE and pushing to EAS Environment Variables..."
echo "(Project: 30351279-d372-4f69-97f7-015d615fd35e)"
echo ""

while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue

  # Strip surrounding quotes from value
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  [[ -z "$value" ]] && continue

  # EXPO_PUBLIC_ vars must be plaintext — the bundler inlines them into client JS
  if [[ "$key" == EXPO_PUBLIC_* ]]; then
    visibility="plaintext"
  else
    visibility="sensitive"
  fi

  echo "  [$visibility] $key"

  for env in "${ENVIRONMENTS[@]}"; do
    eas env:create \
      --name "$key" \
      --value "$value" \
      --environment "$env" \
      --visibility "$visibility" \
      --force \
      --non-interactive 2>&1 | grep -v "^$" || true
  done

done < "$ENV_FILE"

echo ""
echo "Done. Verify with: eas env:list --environment production"
