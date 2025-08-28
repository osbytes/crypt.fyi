#!/bin/bash

# Configuration
LLM_MODEL=${LLM_MODEL:-"gpt-4o"}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [commit-hash]"
    echo ""
    echo "Options:"
    echo "  -m, --model MODEL     LLM model to use (default: $LLM_MODEL)"

    echo "  -h, --help            Show this help message"
    echo ""
    echo "If no commit-hash is provided, will try to find last release tag or fallback to 1 week ago"
    echo ""
    echo "Environment variables:"
    echo "  LLM_MODEL             Override default LLM model"
    exit 1
}

# Function to get the target commit
get_target_commit() {
    if [ ! -z "$1" ]; then
        # Verify if the provided hash exists
        if git rev-parse --quiet --verify "$1^{commit}" >/dev/null; then
            echo "$1"
            return 0
        else
            echo "Error: Invalid commit hash provided" >&2
            exit 1
        fi
    fi

    # Try to find the latest release tag
    latest_tag=$(git ls-remote --tags --sort="v:refname" | tail -n1 | awk -F" " '{ print $1 }' 2>/dev/null)
    if [ $? -eq 0 ] && [ ! -z "$latest_tag" ]; then
        echo "$latest_tag"
        return 0
    fi

    # Fallback to 1 week ago
    echo $(git rev-list -1 --before="1 week ago" HEAD)
}

# Function to validate changelog format
validate_changelog() {
    local changelog="$1"
    
    # Check if it contains expected sections
    if ! echo "$changelog" | grep -q "### "; then
        return 1
    fi
    
    # Check if it contains commit hashes
    if ! echo "$changelog" | grep -q "\[[a-f0-9]\{7,\}\]"; then
        return 1
    fi
    
    return 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--model)
            LLM_MODEL="$2"
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
            COMMIT_HASH="$1"
            shift
            ;;
    esac
done

# Check if git repository exists
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not a git repository" >&2
    exit 1
fi

# Check if llm is installed
if ! command -v llm &> /dev/null; then
    echo "Error: llm CLI tool is not installed. Please install it first." >&2
    exit 1
fi

# Get the target commit
target_commit=$(get_target_commit "$COMMIT_HASH")

if [ -z "$target_commit" ]; then
    echo "Error: Could not determine target commit" >&2
    exit 1
fi

echo "Target commit: $target_commit"
echo "Using LLM model: $LLM_MODEL"

# Get the commit log between target and HEAD with more context
commit_log=$(git log --pretty=format:"%h|%s|%an|%ad" --date=short "$target_commit..HEAD")

if [ -z "$commit_log" ]; then
    echo "No changes found between $target_commit and HEAD"
    exit 0
fi

echo "Found $(echo "$commit_log" | wc -l | tr -d ' ') commits to process..."

# Generate the changelog using llm
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

# Check if llm command succeeded
if [ $? -ne 0 ]; then
    echo "Error: Failed to generate changelog with llm" >&2
    exit 1
fi

# Validate the generated changelog
if ! validate_changelog "$changelog"; then
    echo "Warning: Generated changelog may not be properly formatted" >&2
    echo "Raw output:" >&2
    echo "$changelog" >&2
    exit 1
fi

# Output the changelog
echo ""
echo "Generated changelog:"
echo "=================="
echo "$changelog"
