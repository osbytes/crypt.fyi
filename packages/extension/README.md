# Crypt.fyi Browser Extension

This browser extension allows you to quickly encrypt and share text selections using crypt.fyi.

## Features

- Right-click context menu integration
- Secure encryption using crypt.fyi's encryption standards
- Automatic clipboard copying of encrypted URLs
- Desktop notifications for successful encryption and errors

## Development

1. Install dependencies:

```bash
yarn install
```

2. Start the development server:

```bash
yarn dev
```

3. Load the extension in your browser:
   - Chrome/Edge:
     1. Go to `chrome://extensions`
     2. Enable "Developer mode"
     3. Click "Load unpacked"
     4. Select the `dist` directory
   - Firefox:
     1. Go to `about:debugging`
     2. Click "This Firefox"
     3. Click "Load Temporary Add-on"
     4. Select any file in the `dist` directory

## Building

To build the extension for production:

```bash
yarn build
```

The built extension will be in the `dist` directory.

## Usage

1. Select any text on a webpage
2. Right-click and select "Encrypt with crypt.fyi"
3. The encrypted URL will be automatically copied to your clipboard
4. Share the URL with your recipient

## Security

- All encryption is performed locally in your browser
- The encrypted content is sent to crypt.fyi servers
- URLs are automatically set to burn after reading
- Default TTL is 30 minutes

## License

Same as the main crypt.fyi project
