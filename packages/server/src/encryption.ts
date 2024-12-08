import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const normalizeKey = (key: string): Buffer => {
  const buffer = Buffer.alloc(16);
  Buffer.from(key).copy(buffer);
  return buffer;
};

export const encrypt = async (content: string, key: string): Promise<string> => {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-128-cbc', normalizeKey(key), iv);
  let encrypted = cipher.update(content, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return `${iv.toString('base64')}:${encrypted}`;
};

export const decrypt = async (encryptedContentWithIv: string, key: string): Promise<string> => {
  const [ivBase64, encryptedContent] = encryptedContentWithIv.split(':');
  const iv = Buffer.from(ivBase64, 'base64');
  const decipher = createDecipheriv('aes-128-cbc', normalizeKey(key), iv);
  let decrypted = decipher.update(encryptedContent, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
