#!/bin/bash
# Auto-push Replit changes to GitHub
# Uses GITHUB_PAT secret for authentication

set -e

REPO="Devaraj789/Gemma-4"
BRANCH="main"

if [ -z "$GITHUB_PAT" ]; then
  echo "❌ GITHUB_PAT secret not set!"
  exit 1
fi

echo "📦 Staging all changes..."
git add -A

# Check if there's anything to commit
if git diff --cached --quiet; then
  echo "✅ Nothing new to push — already up to date with GitHub."
  exit 0
fi

echo "💾 Committing..."
git commit -m "${1:-"Sync Replit changes to GitHub"}"

echo "🚀 Pushing to GitHub → $REPO ($BRANCH)..."
git push "https://${GITHUB_PAT}@github.com/${REPO}.git" HEAD:${BRANCH}

echo ""
echo "✅ Pushed! GitHub Actions will auto-build the APK now."
echo "   → https://github.com/${REPO}/actions"
