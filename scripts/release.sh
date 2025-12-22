#!/bin/bash

# Comprehensive release script for crypt.fyi monorepo
# This script handles version bumping, validation, changelog, git tagging, and GitHub release

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DRY_RUN=false
SKIP_VALIDATION=false
SKIP_GIT_CHECK=false

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [VERSION_TYPE]"
    echo ""
    echo "VERSION_TYPE: major, minor, patch (optional - will prompt if not provided)"
    echo ""
    echo "Options:"
    echo "  --dry-run             Show what would be done without making changes"
    echo "  --skip-validation     Skip pre-release validation checks"
    echo "  --skip-git-check      Skip git working directory check"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "This script will:"
    echo "  1. Check git working directory is clean"
    echo "  2. Run pre-release validation (format, typecheck, lint, build, test)"
    echo "  3. Generate changelog from commits since last tag"
    echo "  4. Prompt for version bump type (major/minor/patch)"
    echo "  5. Update all package.json versions"
    echo "  6. Commit the version changes"
    echo "  7. Create and push a git tag"
    echo "  8. Create a draft GitHub release with the changelog"
    echo ""
    echo "Note: Publishing to npm and Chrome Web Store is handled by GitHub Actions"
    exit 1
}

# Parse command line arguments
VERSION_TYPE=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        --skip-git-check)
            SKIP_GIT_CHECK=true
            shift
            ;;
        -h|--help)
            show_usage
            ;;
        major|minor|patch)
            VERSION_TYPE=$1
            shift
            ;;
        *)
            echo -e "${RED}Error: Unknown argument $1${NC}" >&2
            show_usage
            ;;
    esac
done

cd "$REPO_ROOT"

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        crypt.fyi Release Script           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check git working directory
if [ "$SKIP_GIT_CHECK" = false ]; then
    echo -e "${YELLOW}📋 Step 1: Checking git working directory...${NC}"
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${RED}✗ Git working directory is not clean${NC}"
        echo "Please commit or stash your changes before releasing."
        git status --short
        exit 1
    fi
    echo -e "${GREEN}✓ Git working directory is clean${NC}"
    echo ""
fi

# Step 2: Run validation
if [ "$SKIP_VALIDATION" = false ]; then
    echo -e "${YELLOW}🔍 Step 2: Running pre-release validation...${NC}"
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] Would run: $SCRIPT_DIR/validate-release.sh"
    else
        "$SCRIPT_DIR/validate-release.sh"
    fi
    echo ""
fi

# Step 3: Generate changelog
echo -e "${YELLOW}📝 Step 3: Generating changelog...${NC}"
if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would generate changelog from commits"
    CHANGELOG="[DRY RUN] Sample changelog content"
else
    CHANGELOG=$("$SCRIPT_DIR/generate-changelog.sh")
    if [ -z "$CHANGELOG" ]; then
        echo -e "${RED}✗ Failed to generate changelog${NC}"
        exit 1
    fi
fi
echo ""
echo "Generated changelog:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$CHANGELOG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 4: Get version bump type
if [ -z "$VERSION_TYPE" ]; then
    echo -e "${YELLOW}📦 Step 4: Select version bump type${NC}"
    echo ""
    echo "Current version: $(node -p "require('./packages/extension/package.json').version")"
    echo ""
    echo "Select version bump:"
    echo "  1) patch - Bug fixes and minor changes (0.0.X)"
    echo "  2) minor - New features, backwards compatible (0.X.0)"
    echo "  3) major - Breaking changes (X.0.0)"
    echo ""
    read -p "Enter choice (1-3): " choice

    case $choice in
        1) VERSION_TYPE="patch" ;;
        2) VERSION_TYPE="minor" ;;
        3) VERSION_TYPE="major" ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
fi

echo -e "${GREEN}Selected version bump: $VERSION_TYPE${NC}"
echo ""

# Step 5: Bump versions
echo -e "${YELLOW}⬆️  Step 5: Bumping versions in package.json files...${NC}"

# Get current version from extension package (our main versioned package)
CURRENT_VERSION=$(node -p "require('./packages/extension/package.json').version")

# Calculate new version
NEW_VERSION=$(node -e "
const semver = require('semver');
const current = '$CURRENT_VERSION';
const bump = '$VERSION_TYPE';
console.log(semver.inc(current, bump));
" 2>/dev/null)

# Fallback if semver is not available
if [ -z "$NEW_VERSION" ]; then
    IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"
    case $VERSION_TYPE in
        major) NEW_VERSION="$((major + 1)).0.0" ;;
        minor) NEW_VERSION="$major.$((minor + 1)).0" ;;
        patch) NEW_VERSION="$major.$minor.$((patch + 1))" ;;
    esac
fi

echo "Current version: $CURRENT_VERSION"
echo "New version: $NEW_VERSION"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would update package.json files to version $NEW_VERSION"
else
    # Update all package.json files in packages/*/
    for pkg_file in packages/*/package.json; do
        if [ -f "$pkg_file" ]; then
            node -e "
            const fs = require('fs');
            const path = '$pkg_file';
            const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
            pkg.version = '$NEW_VERSION';
            fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
            "
            echo -e "${GREEN}✓ Updated $pkg_file${NC}"
        fi
    done

    # Update manifest.json if it exists (for browser extension)
    if [ -f "packages/extension/manifest.json" ]; then
        node -e "
        const fs = require('fs');
        const path = './packages/extension/manifest.json';
        const manifest = JSON.parse(fs.readFileSync(path, 'utf8'));
        manifest.version = '$NEW_VERSION';
        fs.writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n');
        "
        echo -e "${GREEN}✓ Updated packages/extension/manifest.json${NC}"
    fi

    # Update web manifest.json if it exists
    if [ -f "packages/web/public/manifest.json" ]; then
        node -e "
        const fs = require('fs');
        const path = './packages/web/public/manifest.json';
        const manifest = JSON.parse(fs.readFileSync(path, 'utf8'));
        manifest.version = '$NEW_VERSION';
        fs.writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n');
        "
        echo -e "${GREEN}✓ Updated packages/web/public/manifest.json${NC}"
    fi
fi
echo ""

# Step 6: Commit version changes
echo -e "${YELLOW}💾 Step 6: Committing version changes...${NC}"
if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would commit with message: 'chore: release v$NEW_VERSION'"
else
    # Add all package.json files
    git add packages/*/package.json

    # Add manifest files if they exist
    if [ -f "packages/extension/manifest.json" ]; then
        git add packages/extension/manifest.json
    fi
    if [ -f "packages/web/public/manifest.json" ]; then
        git add packages/web/public/manifest.json
    fi

    git commit -m "chore: release v$NEW_VERSION"
    echo -e "${GREEN}✓ Version changes committed${NC}"
fi
echo ""

# Step 7: Create and push tag
echo -e "${YELLOW}🏷️  Step 7: Creating git tag...${NC}"
TAG_NAME="v$NEW_VERSION"

if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would create tag: $TAG_NAME"
    echo "[DRY RUN] Would push commits and tags to origin"
else
    git tag -a "$TAG_NAME" -m "Release $TAG_NAME"
    echo -e "${GREEN}✓ Created tag: $TAG_NAME${NC}"

    echo "Pushing commits and tags to origin..."
    git push origin main
    git push origin "$TAG_NAME"
    echo -e "${GREEN}✓ Pushed to remote${NC}"
fi
echo ""

# Step 8: Create GitHub release
echo -e "${YELLOW}🚀 Step 8: Creating GitHub draft release...${NC}"

if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠ GitHub CLI (gh) not found. Skipping GitHub release creation.${NC}"
    echo "Install it from: https://cli.github.com/"
    echo ""
    echo "You can manually create the release at:"
    echo "https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/releases/new"
else
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] Would create draft GitHub release for $TAG_NAME"
    else
        # Save changelog to temp file
        CHANGELOG_FILE=$(mktemp)
        echo "$CHANGELOG" > "$CHANGELOG_FILE"

        gh release create "$TAG_NAME" \
            --draft \
            --title "Release $TAG_NAME" \
            --notes-file "$CHANGELOG_FILE"

        rm "$CHANGELOG_FILE"
        echo -e "${GREEN}✓ Created draft GitHub release${NC}"
        echo ""
        echo "View the draft release at:"
        gh release view "$TAG_NAME" --web
    fi
fi
echo ""

# Success summary
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Release Process Complete!        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the draft GitHub release"
echo "  2. Publish the release (this triggers the GitHub Actions workflow)"
echo "  3. The workflow will automatically:"
echo "     - Publish to npm (if configured)"
echo "     - Publish to Chrome Web Store (if configured)"
echo ""
echo "Release version: $TAG_NAME"
