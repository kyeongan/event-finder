#!/bin/bash

# Branch Protection Status Checker
# This script checks if branch protection is enabled for the main branch

set -e

REPO_OWNER="${1:-kyeongan}"
REPO_NAME="${2:-event-finder}"
BRANCH="${3:-main}"

echo "🔍 Checking branch protection for ${REPO_OWNER}/${REPO_NAME}:${BRANCH}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub"
    echo "Please run: gh auth login"
    exit 1
fi

# Get branch protection status
echo "📋 Fetching branch protection rules..."
echo ""

if ! gh api "repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}/protection" 2>/dev/null; then
    echo ""
    echo "❌ Branch protection is NOT enabled for ${BRANCH} branch"
    echo ""
    echo "📝 To enable branch protection:"
    echo "1. Go to: https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/branches"
    echo "2. Add rule for '${BRANCH}' branch"
    echo "3. Enable:"
    echo "   ☑ Require a pull request before merging"
    echo "   ☑ Require approvals (at least 1)"
    echo "   ☑ Require status checks to pass before merging"
    echo "   ☑ Require branches to be up to date before merging"
    echo ""
    exit 1
fi

echo ""
echo "✅ Branch protection is enabled!"
echo ""
echo "💡 For detailed status, run:"
echo "   gh api repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}/protection | jq"
