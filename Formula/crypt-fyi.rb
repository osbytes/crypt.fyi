# Homebrew formula for the crypt.fyi CLI (`cfyi`), installed from the npm package.
# url and sha256 are bumped by the `homebrew` job in .github/workflows/release.yml
# after each @crypt.fyi/cli publish.
class CryptFyi < Formula
  desc "Zero-knowledge, end-to-end encrypted secret sharing CLI"
  homepage "https://crypt.fyi"
  url "https://registry.npmjs.org/@crypt.fyi/cli/-/cli-0.2.0.tgz"
  sha256 "960382854b6e7a9918af208702e220e5a980a35806ad87e932c818c8704377b5"
  license "Apache-2.0"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec.glob("bin/*")
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/cfyi --version")
    assert_match "Encrypt and share a secret", shell_output("#{bin}/cfyi --help")
    # Exercises argument validation without touching the network.
    output = shell_output("#{bin}/cfyi encrypt secret --file #{testpath}/missing 2>&1", 1)
    assert_match "Cannot provide both content and file", output
  end
end
