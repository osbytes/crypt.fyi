#!/bin/sh
# Runs from the nginx image's /docker-entrypoint.d/ before templates are rendered.
# API_URL is interpolated into a JavaScript string (/config.js) and the CSP header,
# so reject anything beyond a plain http(s) URL rather than trying to escape it.
set -eu

if [ -z "${API_URL:-}" ]; then
  exit 0
fi

if ! printf '%s' "$API_URL" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/[A-Za-z0-9._~/-]*)?$'; then
  echo "$0: API_URL must be a plain http(s) URL such as https://api.example.com (got: $API_URL)" >&2
  exit 1
fi
