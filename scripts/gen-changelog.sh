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
    latest_tag=$(git describe --tags --abbrev=0 2>/dev/null)
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

# Get the commit log between target and HEAD
commit_log=$(git log --pretty=format:"%h %s" "$target_commit..HEAD")

if [ -z "$commit_log" ]; then
    echo "No changes found between $target_commit and HEAD"
    exit 0
fi

# Generate the changelog using llm
echo "$commit_log" | llm "Transform these git commits into a structured changelog. Follow this exact format:

# Changelog

## 🚀 Features
- [hash] Description starting with verb in present tense

## 🐛 Bug Fixes  
- [hash] Description starting with verb in present tense

## 🔧 Other Changes
- [hash] Description starting with verb in present tense

Rules:
- Keep original commit hash in square brackets
- Start each entry with a present tense verb
- One line per change
- No additional commentary or sections
- Categorize based on commit message content
- If a section has no entries, omit it entirely

Input commits:"
