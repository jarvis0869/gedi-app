#!/usr/bin/env bash
# Pushes all key=value pairs from .env to EAS Environment Variables so they
# are available during cloud builds without being committed to the repo.
#
# Usage:
#   chmod +x scripts/setup-eas-secrets.sh
#   ./scripts/setup-eas-secrets.sh
#
# Requires: eas-cli >= 10.x installed globally (npm i -g eas-cli) and eas login done.

set -euo pipefail

ENV_FILE=".env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Copy .env.example and fill in real values first."
  exit 1
fi

echo "Reading $ENV_FILE and pushing to EAS Environment Variables..."
echo ""

while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
  # Strip surrounding quotes from value if present
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  if [[ -n "$value" ]]; then
    echo "  Setting: $key"
    # eas env:create sets a variable for all environments (production/preview/development)
    eas env:create \
      --name "$key" \
      --value "$value" \
      --environment production \
      --visibility secret \
      --force \
      --non-interactive 2>&1 | grep -v "^$" || true

    eas env:create \
      --name "$key" \
      --value "$value" \
      --environment preview \
      --visibility secret \
      --force \
      --non-interactive 2>&1 | grep -v "^$" || true

    eas env:create \
      --name "$key" \
      --value "$value" \
      --environment development \
      --visibility secret \
      --force \
      --non-interactive 2>&1 | grep -v "^$" || true
  fi
done < "$ENV_FILE"

echo ""
echo "Done. Verify with: eas env:list --environment production"
