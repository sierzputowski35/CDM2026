#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Crée une copie horodatée de index.html (et SECURITY.md s'il existe)
# dans le dossier ./backups/. À lancer avant tout bricolage risqué.
# Usage : ./scripts/backup.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p backups
TS="$(date +%Y%m%d-%H%M%S)"

for f in index.html SECURITY.md ARCHITECTURE.md; do
  if [ -f "$f" ]; then
    cp "$f" "backups/${f}.${TS}.bak"
    echo "  → backups/${f}.${TS}.bak"
  fi
done

echo "Backup terminé."
