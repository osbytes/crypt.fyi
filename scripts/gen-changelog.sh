#!/bin/bash

# Function to show usage
show_usage() {
    echo "Usage: $0 [commit-hash]"
    echo "If no commit-hash is provided, will try to find last release tag or fallback to 1 week ago"
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
    if [ $? -eq 0 ]; then
        echo "$latest_tag"
        return 0
    fi

    # Fallback to 1 week ago
    echo $(git rev-list -1 --before="1 week ago" HEAD)
}

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
target_commit=$(get_target_commit "$1")

echo "Target commit: $target_commit"

# Get the commit log between target and HEAD
commit_log=$(git log --pretty=format:"%h %s" "$target_commit..HEAD")

if [ -z "$commit_log" ]; then
    echo "No changes found between $target_commit and HEAD"
    exit 0
fi

# Generate the changelog using llm
echo "$commit_log" | llm -m gpt-4o "Transform these git commits into a structured changelog following these rules:

Output Format:
### Features
### Improvements
### Bug Fixes
### Security
### Breaking Changes
### Dependencies
### Documentation

Rules:
- Group changes into the above categories (omit empty categories)
- Format each entry as: '- {action} {description} [{commit-hash}]'
- Start each entry with a clear present-tense verb (add, update, fix, improve, etc.)
- Keep descriptions concise but informative (max 120 chars)
- Group related changes and combine their hashes: '[hash1, hash2]'
- Include breaking changes and deprecation notices prominently
- Highlight security-relevant changes
- Include only user-facing or significant internal changes

Exclude:
- Formatting changes, typo fixes
- Internal refactoring without functional impact
- Test-only changes
- Temporary commits
- Build/CI tweaks
- Minor dependency bumps

Example Output:
### Features
- Add dark mode support with system preference detection [abc123]
- Implement user authentication flow [def456, ghi789]

### Bug Fixes
- Fix memory leak in WebSocket connection [jkl012]

### Security
- Update password hashing algorithm to Argon2id [mno345]

Input commits:"
