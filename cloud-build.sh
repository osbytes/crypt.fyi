#!/bin/bash

# Cloud build script for Docker images
# Usage: ./cloud-build.sh [API_URL] [VERSION]
# Example: ./cloud-build.sh https://api.crypt.fyi v1.0.0
#
# Password policy is compiled into the web bundle, so it is set here at build
# time via the environment:
#   REQUIRE_PASSWORD=true PASSWORD_MIN_LENGTH=8 ./cloud-build.sh https://api.example.com v1.0.0

set -e

# Configuration
BUILDER="cloud-socjedi-socjedi-cloud-builder-001"
REGISTRY="socjedi"
PLATFORMS="linux/amd64,linux/arm64"

# Arguments with defaults
API_URL="${1:-https://api.crypt.fyi}"
VERSION="${2:-latest}"
REQUIRE_PASSWORD="${REQUIRE_PASSWORD:-false}"
PASSWORD_MIN_LENGTH="${PASSWORD_MIN_LENGTH:-5}"
# Inline threshold by default; raise where object storage is enabled.
MAX_FILE_SIZE="${MAX_FILE_SIZE:-131072}"
APP_NAME="${APP_NAME:-CyberForce Crypt}"

echo "========================================="
echo "Cloud Build Configuration"
echo "========================================="
echo "Builder:   $BUILDER"
echo "Registry:  $REGISTRY"
echo "Platforms: $PLATFORMS"
echo "API URL:   $API_URL"
echo "Password:  required=$REQUIRE_PASSWORD min=$PASSWORD_MIN_LENGTH"
echo "Tags:      $VERSION, latest"
echo "========================================="
echo ""

# Build and push server image
echo "Building and pushing server image..."
docker buildx build \
  --builder "$BUILDER" \
  --platform "$PLATFORMS" \
  -f Dockerfile.server \
  -t "$REGISTRY/crypt-server:$VERSION" \
  -t "$REGISTRY/crypt-server:latest" \
  --push .

echo ""
echo "Server image pushed: $REGISTRY/crypt-server:$VERSION, $REGISTRY/crypt-server:latest"
echo ""

# Build and push web image
echo "Building and pushing web image..."
docker buildx build \
  --builder "$BUILDER" \
  --platform "$PLATFORMS" \
  -f Dockerfile.web \
  --build-arg VITE_API_URL="$API_URL" \
  --build-arg VITE_REQUIRE_PASSWORD="$REQUIRE_PASSWORD" \
  --build-arg VITE_PASSWORD_MIN_LENGTH="$PASSWORD_MIN_LENGTH" \
  --build-arg VITE_MAX_FILE_SIZE="$MAX_FILE_SIZE" \
  --build-arg VITE_APP_NAME="$APP_NAME" \
  -t "$REGISTRY/crypt-web:$VERSION" \
  -t "$REGISTRY/crypt-web:latest" \
  --push .

echo ""
echo "Web image pushed: $REGISTRY/crypt-web:$VERSION, $REGISTRY/crypt-web:latest"
echo ""

echo "========================================="
echo "Build complete!"
echo "========================================="
echo "Images pushed:"
echo "  - $REGISTRY/crypt-server:$VERSION"
echo "  - $REGISTRY/crypt-server:latest"
echo "  - $REGISTRY/crypt-web:$VERSION"
echo "  - $REGISTRY/crypt-web:latest"
echo "========================================="
