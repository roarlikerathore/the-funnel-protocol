#!/usr/bin/env bash
# Fails if anything private to the original funnel survived into the kit.
#
# The kit is derived from a live, private project, so "we stripped it" is not a
# thing to take on trust. Run before publishing, and in CI on every push.
#
#   ./scripts/scan-for-leaks.sh
set -uo pipefail
cd "$(dirname "$0")/../.."

# Identifiers from the source funnel. Nothing here may appear in a public kit.
PATTERNS=(
  "xsorglkimdvgrrjtghpx"            # Supabase project ref
  "moneyheistprotocol"
  "bullish\.army"
  "thebullisharmy"
  "niche-page-studio"
  "Money Heist"
  "Raathore"
  "1345134404446803"                # Meta Pixel
  "93329177649"                     # Zoom webinar
  "26f8673c-676b-4325-81f8"         # Bolna agent
  "roar\.thebullisharmy\.com"       # payment links
  "control-room-1997"
  "eyJhbGciOiJIUzI1NiIs"            # any JWT
  "re_[A-Za-z0-9]\{20,\}"           # Resend key
  "sk-[A-Za-z0-9]\{20,\}"           # generic secret key
)

# This file and the repo model legitimately name what must be stripped.
EXCLUDE_FILES="scan-for-leaks.sh|REPO-MODEL.md|STATUS.md|RUN-THIS.md"

fail=0
echo "Scanning for private identifiers…"
echo

for pat in "${PATTERNS[@]}"; do
  hits=$(grep -rIn --exclude-dir=.git --exclude-dir=node_modules "$pat" . 2>/dev/null \
         | grep -Ev "$EXCLUDE_FILES" || true)
  if [ -n "$hits" ]; then
    echo "  ✗ LEAK  $pat"
    echo "$hits" | sed 's/^/          /' | head -5
    fail=1
  fi
done

# .env of any kind should never be committed
envs=$(find . -name ".env*" -not -path "./.git/*" -not -name ".env.example" 2>/dev/null || true)
if [ -n "$envs" ]; then
  echo "  ✗ LEAK  environment file committed"
  echo "$envs" | sed 's/^/          /'
  fail=1
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "✅ Clean. Nothing private in the kit."
else
  echo "❌ Do NOT publish. Replace each hit with a config field, then run again."
fi
exit "$fail"
