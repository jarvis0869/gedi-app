#!/usr/bin/env bash
# Pushes all EXPO_PUBLIC_* values from .env to EAS Secrets so they are
# available during cloud builds without being committed to the repo.
#
# Usage:
#   chmod +x scripts/setup-eas-secrets.sh
#   ./scripts/setup-eas-secrets.sh
#
# Requires: eas-cli installed globally (npm i -g eas-cli) and eas login done.

set -euo pipefail

ENV_FILE=".env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Copy .env.example and fill in real values first."
  exit 1
fi

echo "Reading $ENV_FILE and pushing secrets to EAS..."
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
    eas secret:create --scope project --name "$key" --value "$value" --force 2>/dev/null \
      || echo "    (already exists — skipped, use --force to overwrite)"
  fi
done < "$ENV_FILE"

echo ""
echo "Done. Verify with: eas secret:list"
echo ""
echo "Remember to also set EAS_PROJECT_ID in app.config.js after running: eas project:init"
