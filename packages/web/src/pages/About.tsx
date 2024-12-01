import { IconLock, IconShare, IconFlame } from "@tabler/icons-react";

export function About() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">About PhemVault</h1>
      
      {/* Introduction Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">What is PhemVault?</h2>
        <p className="text-lg mb-4">
          PhemVault is a secure, ephemeral secret-sharing platform that enables you to share sensitive information safely. 
          Whether it's passwords, API keys, or confidential messages, PhemVault ensures your data remains private and 
          automatically disappears after being accessed.
        </p>
      </section>

      {/* How it Works - User Friendly */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <IconLock className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">1. Encrypt</h3>
            <p>Your secret is encrypted right in your browser before it ever leaves your device. Only people with the special link can decrypt it.</p>
          </div>
          <div className="p-6 border rounded-lg">
            <IconShare className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">2. Share</h3>
            <p>Share the secure link with your intended recipient. The link contains everything needed to decrypt the message.</p>
          </div>
          <div className="p-6 border rounded-lg">
            <IconFlame className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">3. Self-Destruct</h3>
            <p>Once accessed, the secret is permanently deleted from our servers. No traces left behind.</p>
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Security Implementation</h2>
        <div className="space-y-6">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">End-to-End Encryption</h3>
            <p className="mb-2">All secrets are encrypted using AES-256-GCM encryption in your browser before transmission. The encryption key never leaves your device, ensuring true end-to-end encryption.</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Encryption key is derived from a cryptographically secure random generation</li>
              <li>Key derivation uses PBKDF2 with SHA-256</li>
              <li>Each secret has a unique initialization vector (IV)</li>
            </ul>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Zero-Knowledge Architecture</h3>
            <p className="mb-2">Our servers never see your unencrypted data. We employ a zero-knowledge architecture where:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>All encryption/decryption happens client-side</li>
              <li>Servers only store encrypted data</li>
              <li>Encryption keys are transmitted via URL fragments, which never reach our servers</li>
            </ul>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Data Protection</h3>
            <p className="mb-2">Multiple layers of security ensure your data remains protected:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>TLS encryption for all API communications</li>
              <li>Automatic secret destruction after access</li>
              <li>No server-side logging of sensitive data</li>
              <li>Optional password protection for additional security</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Open Source */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Open Source</h2>
        <p className="text-lg">
          PhemVault is open source and auditable. You can review our code, contribute, or report security issues on{" "}
          <a 
            href="https://github.com/dillonstreator/phemvault" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GitHub
          </a>.
        </p>
      </section>
    </div>
  );
}
