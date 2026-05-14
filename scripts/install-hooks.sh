#!/usr/bin/env bash
# Active les hooks Git versionnés (.githooks/).
# À lancer une fois par clone du repo.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

git config core.hooksPath .githooks
chmod +x .githooks/* 2>/dev/null || true
chmod +x scripts/*.sh 2>/dev/null || true

echo "Hooks installés (core.hooksPath = .githooks)."
echo "Le pre-commit bloquera désormais les fuites de SUPABASE_SERVICE_KEY / ADMIN_PASSWORD en clair."
