import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes recommended for GCM

/**
 * Derives a 32-byte Buffer from the WHATSAPP_TOKEN_ENCRYPTION_KEY environment variable.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    // If not set, use a fallback derived from JWT_SECRET or warn
    const fallback = process.env.JWT_SECRET || "zaanway_fallback_secure_32_bytes_key!";
    return crypto.createHash("sha256").update(fallback).digest();
  }

  // If secret is already a 64-char hex string (32 bytes)
  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, "hex");
  }

  // Otherwise SHA-256 hash it to guarantee exactly 32 bytes
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext string (such as a WhatsApp access token) at rest.
 * Output format: `enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>`
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return "";

  // Never re-encrypt if already formatted as encrypted token
  if (plainText.startsWith("enc:v1:")) {
    return plainText;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `enc:v1:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted token string.
 * Gracefully handles unencrypted legacy tokens if any existed prior to migration.
 */
export function decryptToken(cipherText: string): string {
  if (!cipherText) return "";

  // If it's a legacy unencrypted token or mock token
  if (!cipherText.startsWith("enc:v1:")) {
    return cipherText;
  }

  try {
    const parts = cipherText.split(":");
    if (parts.length !== 5) {
      throw new Error("Invalid encrypted token format");
    }

    const [, , ivHex, tagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(tagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    // Redact secret details in logs
    console.error("[SECURITY] Failed to decrypt WhatsApp access token.");
    throw new Error("Failed to decrypt access token. Check encryption key.");
  }
}
