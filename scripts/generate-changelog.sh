#!/bin/bash

# Generate changelog using LLM or fallback to conventional format
# This script generates a changelog from git commits since the last tag

set -e

# Configuration
LLM_MODEL=${LLM_MODEL:-"gpt-4o"}
OUTPUT_FILE=${OUTPUT_FILE:-"CHANGELOG.md"}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -m, --model MODEL     LLM model to use (default: $LLM_MODEL)"
    echo "  -o, --output FILE     Output file (default: $OUTPUT_FILE)"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  LLM_MODEL             Override default LLM model"
    echo "  OUTPUT_FILE           Override output file"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--model)
            LLM_MODEL="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            ;;
        -*)
            echo "Error: Unknown option $1" >&2
            show_usage
            ;;
        *)
            shift
            ;;
    esac
done

# Check if git repository exists
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not a git repository" >&2
    exit 1
fi

# Get the latest tag
latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -z "$latest_tag" ]; then
    echo -e "${YELLOW}⚠ No previous tags found. Generating changelog from all commits...${NC}"
    target_commit=$(git rev-list --max-parents=0 HEAD)
else
    echo -e "${GREEN}📋 Generating changelog since tag: $latest_tag${NC}"
    target_commit=$latest_tag
fi

# Get the commit log
commit_log=$(git log --pretty=format:"%h|%s|%an|%ad" --date=short "$target_commit..HEAD")

if [ -z "$commit_log" ]; then
    echo "No changes found since $target_commit"
    exit 0
fi

echo "Found $(echo "$commit_log" | wc -l | tr -d ' ') commits to process..."

# Try to use LLM if available
if command -v llm &> /dev/null; then
    echo "Generating changelog with $LLM_MODEL..."

    changelog=$(echo "$commit_log" | llm -m "$LLM_MODEL" "Transform these git commits into a structured changelog following these rules:

COMMIT FORMAT: hash|subject|author|date

OUTPUT FORMAT (omit empty categories):
### Features
### Improvements
### Bug Fixes
### Security
### Breaking Changes
### Dependencies
### Documentation

RULES:
- Group changes into the above categories
- Format each entry as: '- {action} {description} [{commit-hash}]'
- Start each entry with a clear present-tense verb (add, update, fix, improve, remove, etc.)
- Keep descriptions concise but informative (max 100 chars)
- Group related changes and combine their hashes: '[hash1, hash2]'
- Include breaking changes and deprecation notices prominently
- Highlight security-relevant changes
- Include only user-facing or significant internal changes
- Use consistent terminology and formatting

EXCLUSION CRITERIA:
- Formatting changes, typo fixes, whitespace adjustments
- Internal refactoring without functional impact
- Test-only changes, test file updates
- Temporary commits, WIP commits
- Build/CI tweaks, workflow updates
- Minor dependency bumps (unless security-related)
- Merge commits, revert commits

CATEGORIZATION GUIDELINES:
- Features: New functionality, major enhancements
- Improvements: Performance, UX, accessibility improvements
- Bug Fixes: Bug resolutions, error handling
- Security: Security patches, vulnerability fixes
- Breaking Changes: API changes, incompatible updates
- Dependencies: Major dependency updates, security updates
- Documentation: User docs, API docs, README updates

EXAMPLE OUTPUT:
### Features
- Add dark mode support with system preference detection [abc1234]
- Implement user authentication flow with OAuth2 [def5678, ghi9012]

### Bug Fixes
- Fix memory leak in WebSocket connection handling [jkl3456]

### Security
- Update password hashing algorithm to Argon2id [mno7890]

Input commits:")

    if [ $? -eq 0 ] && [ ! -z "$changelog" ]; then
        echo "$changelog"
        exit 0
    else
        echo -e "${YELLOW}⚠ LLM generation failed, falling back to conventional format...${NC}"
    fi
fi

# Fallback: Generate conventional changelog
echo "Generating conventional changelog..."

echo "### Changes"
echo ""
while IFS='|' read -r hash subject author date; do
    echo "- $subject [$hash]"
done <<< "$commit_log"
