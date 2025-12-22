# Release System Setup Guide

This guide will help you configure the automated release system for crypt.fyi.

## Quick Start

```bash
# 1. Install GitHub CLI (if not already installed)
brew install gh  # macOS
# or download from https://cli.github.com/

# 2. Authenticate with GitHub
gh auth login

# 3. (Optional) Install LLM CLI for AI-generated changelogs
pip install llm

# 4. Test the release script
yarn release:dry-run

# 5. Configure GitHub secrets (see below)
```

## GitHub Secrets Configuration

### Step 1: Configure npm Token (for npm publishing)

1. Go to https://www.npmjs.com/settings/[your-username]/tokens
2. Click "Generate New Token" → "Classic Token"
3. Select "Automation" type
4. Give it a name like "crypt.fyi-release"
5. Copy the token

Add to GitHub:
```bash
gh secret set NPM_TOKEN
# Paste your token when prompted
```

Or via GitHub UI:
1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: [paste your token]

### Step 2: Configure Chrome Web Store Credentials

#### Get Chrome Web Store API Credentials

1. **Create a Google Cloud Project**
   - Go to https://console.cloud.google.com/
   - Create a new project (or select existing)
   - Note your project ID

2. **Enable Chrome Web Store API**
   - In the Google Cloud Console, go to "APIs & Services" → "Library"
   - Search for "Chrome Web Store API"
   - Click "Enable"

3. **Create OAuth2 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "crypt.fyi release automation"
   - Authorized redirect URIs: `http://localhost:8080`
   - Click "Create"
   - Copy the **Client ID** and **Client Secret**

4. **Get Your Extension ID**
   - Go to https://chrome.google.com/webstore/devconsole
   - Click on your extension
   - The extension ID is in the URL or in the extension details

5. **Get Refresh Token**

   Use this Node.js script to get a refresh token:

   ```javascript
   // save as get-refresh-token.js
   const http = require('http');
   const url = require('url');
   const open = require('open');

   const CLIENT_ID = 'your-client-id';
   const CLIENT_SECRET = 'your-client-secret';
   const REDIRECT_URI = 'http://localhost:8080';

   const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
     `client_id=${CLIENT_ID}&` +
     `redirect_uri=${REDIRECT_URI}&` +
     `response_type=code&` +
     `scope=https://www.googleapis.com/auth/chromewebstore&` +
     `access_type=offline&` +
     `prompt=consent`;

   const server = http.createServer(async (req, res) => {
     const query = url.parse(req.url, true).query;

     if (query.code) {
       // Exchange code for tokens
       const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
         method: 'POST',
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
         body: new URLSearchParams({
           code: query.code,
           client_id: CLIENT_ID,
           client_secret: CLIENT_SECRET,
           redirect_uri: REDIRECT_URI,
           grant_type: 'authorization_code',
         }),
       });

       const tokens = await tokenResponse.json();

       res.writeHead(200, { 'Content-Type': 'text/html' });
       res.end('<h1>Success!</h1><p>Check your console for the refresh token.</p>');

       console.log('\n=== REFRESH TOKEN ===');
       console.log(tokens.refresh_token);
       console.log('=====================\n');

       server.close();
     }
   });

   server.listen(8080, () => {
     console.log('Opening browser for authentication...');
     open(authUrl);
   });
   ```

   Run it:
   ```bash
   node get-refresh-token.js
   ```

#### Add Secrets to GitHub

```bash
# Add all Chrome Web Store secrets
gh secret set CHROME_EXTENSION_ID
# Enter your extension ID

gh secret set CHROME_CLIENT_ID
# Enter your OAuth client ID

gh secret set CHROME_CLIENT_SECRET
# Enter your OAuth client secret

gh secret set CHROME_REFRESH_TOKEN
# Enter your refresh token
```

Or via GitHub UI (Settings → Secrets and variables → Actions):
- `CHROME_EXTENSION_ID`
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`

## Verify Setup

### Test Release Script Locally

```bash
# Dry run to test without making changes
yarn release:dry-run

# Test validation
yarn validate

# Test changelog generation
yarn changelog
```

### Test GitHub Actions

1. Create a test release:
   ```bash
   git tag v0.0.0-test
   git push origin v0.0.0-test
   gh release create v0.0.0-test --draft --notes "Test release"
   ```

2. Publish the draft release on GitHub

3. Watch the Actions tab to see the workflow run

4. Clean up:
   ```bash
   gh release delete v0.0.0-test --yes
   git push origin :refs/tags/v0.0.0-test
   git tag -d v0.0.0-test
   ```

## Optional: LLM Configuration

For better changelog generation, install and configure the LLM CLI:

```bash
# Install
pip install llm

# Configure with your preferred AI model
# For OpenAI:
llm keys set openai
# Enter your API key

# Test it
echo "test" | llm -m gpt-4o "Say hello"

# Or use Claude:
llm keys set claude
# Enter your Anthropic API key

# Test with Claude
echo "test" | llm -m claude-3.5-sonnet "Say hello"
```

The release script will automatically use LLM if available. You can specify the model:

```bash
LLM_MODEL=claude-3.5-sonnet yarn release
```

## Package Configuration

### For npm Publishing

Make sure packages you want to publish are **not** marked as private:

Edit each package's `package.json`:

```json
{
  "name": "@crypt.fyi/core",
  "version": "0.0.14",
  "private": false,  // Set to false to publish
  // ...
}
```

### For Chrome Extension

Make sure your extension manifest is valid:

```json
// packages/extension/manifest.json
{
  "manifest_version": 3,
  "name": "crypt.fyi",
  "version": "0.0.14",  // Will be auto-updated by release script
  // ...
}
```

## Troubleshooting

### "gh: command not found"

Install GitHub CLI:
```bash
brew install gh  # macOS
# or see https://cli.github.com/
```

### "llm: command not found"

LLM is optional. Install with:
```bash
pip install llm
```

Or the release will use a fallback changelog format.

### "Not authenticated with GitHub"

```bash
gh auth login
```

### Secrets not working in GitHub Actions

1. Verify secrets are set:
   ```bash
   gh secret list
   ```

2. Check that secret names match exactly (case-sensitive)

3. Re-set the secret if needed:
   ```bash
   gh secret set SECRET_NAME
   ```

### Chrome Web Store API errors

- Check that all four secrets are set correctly
- Verify the extension ID matches
- Ensure the OAuth credentials have the correct scopes
- Test credentials manually with curl:
  ```bash
  curl -H "Authorization: Bearer $ACCESS_TOKEN" \
       "https://www.googleapis.com/chromewebstore/v1.1/items/$EXTENSION_ID"
  ```

## Next Steps

Once everything is configured:

1. Make your changes
2. Commit them
3. Run `yarn release`
4. Review and publish the draft release on GitHub
5. GitHub Actions will handle the rest!

See `RELEASE.md` for detailed release process documentation.
