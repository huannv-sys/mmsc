/**
 * Dịch vụ quản lý bảo mật mật khẩu và mã hóa
 * Cung cấp các chức năng mã hóa mật khẩu, xác thực, và tạo mã token
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Cấu hình
const SALT_ROUNDS = 12; // Độ phức tạp của salt
const TOKEN_EXPIRES = '24h'; // Thời gian hết hạn token
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'; // Thuật toán mã hóa
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

/**
 * Mã hóa mật khẩu sử dụng bcrypt
 * @param password Mật khẩu cần mã hóa
 * @returns Chuỗi đã mã hóa
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Xác thực mật khẩu
 * @param password Mật khẩu đầu vào cần kiểm tra
 * @param hashedPassword Mật khẩu đã được mã hóa
 * @returns True nếu mật khẩu khớp
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Tạo JWT token
 * @param payload Dữ liệu cần mã hóa trong token
 * @param expiresIn Thời gian hết hạn (mặc định 24h)
 * @returns JWT token
 */
export function generateToken(payload: any, expiresIn: string = TOKEN_EXPIRES): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Xác thực JWT token
 * @param token JWT token cần xác thực
 * @returns Dữ liệu đã giải mã hoặc null nếu token không hợp lệ
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Tạo mã xác thực dùng một lần (OTP)
 * @param length Độ dài mã OTP (mặc định 6)
 * @returns Mã OTP
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
}

/**
 * Mã hóa dữ liệu nhạy cảm
 * @param text Văn bản cần mã hóa
 * @param key Khóa mã hóa (tùy chọn, mặc định sử dụng JWT_SECRET)
 * @returns Dữ liệu đã mã hóa dạng {iv, content, authTag}
 */
export function encryptData(text: string, key: string = JWT_SECRET): { iv: string; content: string; authTag: string } {
  // Đảm bảo độ dài khóa đúng 32 bytes
  const derivedKey = crypto.createHash('sha256').update(key).digest();
  
  // Tạo iv (initialization vector)
  const iv = crypto.randomBytes(16);
  
  // Tạo cipher
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, derivedKey, iv);
  
  // Mã hóa dữ liệu
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Lấy authentication tag để xác thực khi giải mã
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    iv: iv.toString('hex'),
    content: encrypted,
    authTag: authTag
  };
}

/**
 * Giải mã dữ liệu nhạy cảm
 * @param encrypted Dữ liệu đã mã hóa {iv, content, authTag}
 * @param key Khóa mã hóa (tùy chọn, mặc định sử dụng JWT_SECRET)
 * @returns Dữ liệu đã giải mã
 */
export function decryptData(
  encrypted: { iv: string; content: string; authTag: string },
  key: string = JWT_SECRET
): string {
  try {
    // Đảm bảo độ dài khóa đúng 32 bytes
    const derivedKey = crypto.createHash('sha256').update(key).digest();
    
    // Chuyển đổi iv từ hex sang buffer
    const iv = Buffer.from(encrypted.iv, 'hex');
    
    // Tạo decipher
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, derivedKey, iv);
    
    // Thiết lập authentication tag
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
    
    // Giải mã dữ liệu
    let decrypted = decipher.update(encrypted.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Lỗi khi giải mã dữ liệu:', error);
    throw new Error('Không thể giải mã dữ liệu');
  }
}

/**
 * Tạo mã API key có thời hạn
 * @param userId ID người dùng sở hữu key
 * @param expiresIn Thời gian hết hạn (mặc định 30 ngày)
 * @returns API key và thông tin
 */
export function generateApiKey(userId: number, expiresIn: string = '30d'): { apiKey: string; expiresAt: Date } {
  // Tạo dữ liệu ngẫu nhiên cho API key
  const randomPart = crypto.randomBytes(24).toString('hex');
  
  // Tạo timestamp hết hạn
  const payload = { userId, type: 'api_key', random: randomPart };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
  
  // Tính toán thời gian hết hạn
  const tokenData = jwt.decode(token) as any;
  const expiresAt = new Date(tokenData.exp * 1000);
  
  // Kết hợp userId và randomPart để tạo API key
  const apiKey = `${userId}.${randomPart}`;
  
  return { apiKey, expiresAt };
}

/**
 * Xác thực API key
 * @param apiKey API key cần xác thực
 * @returns Dữ liệu người dùng hoặc null nếu không hợp lệ
 */
export function verifyApiKey(apiKey: string): { userId: number } | null {
  try {
    const parts = apiKey.split('.');
    if (parts.length !== 2) return null;
    
    const userId = parseInt(parts[0], 10);
    const randomPart = parts[1];
    
    // Tạo lại payload ban đầu
    const payload = { userId, type: 'api_key', random: randomPart };
    
    // Tạo lại token và xác thực
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '0' });
    const isValid = jwt.verify(token, JWT_SECRET) !== null;
    
    return isValid ? { userId } : null;
  } catch (error) {
    return null;
  }
}