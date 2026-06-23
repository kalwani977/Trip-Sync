import crypto from "crypto";

const algorithm = "aes-256-cbc";

// Fallback to JWT_PASSWORD if ENCRYPTION_KEY is not set
const getSecretKey = () => {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_PASSWORD || "fallback_secret_key_32_chars_min";
  // Ensure the secret is exactly 32 bytes for aes-256-cbc
  return crypto.createHash('sha256').update(String(secret)).digest('base64').substring(0, 32);
};

export const encryptToken = (tokenObj) => {
  if (!tokenObj) return null;
  
  // If already encrypted, don't encrypt again
  if (tokenObj.encryptedData) return tokenObj;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, getSecretKey(), iv);
  const text = JSON.stringify(tokenObj);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return as an object so it matches Mongoose { type: Object } schema
  return { encryptedData: `${iv.toString('hex')}:${encrypted}` };
};

export const decryptToken = (tokenObj) => {
  if (!tokenObj) return null;
  
  // If not encrypted, return as is (fallback for old plaintext tokens)
  if (!tokenObj.encryptedData) return tokenObj;
  
  try {
    const parts = tokenObj.encryptedData.split(':');
    if (parts.length !== 2) return null;

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(algorithm, getSecretKey(), iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    console.error("Token decryption failed", err);
    return null;
  }
};
