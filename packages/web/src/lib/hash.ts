export const sha256 = (value: string): Promise<string> =>
  crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then((r) =>
    Array.from(new Uint8Array(r))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  );
