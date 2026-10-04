import crypto from 'crypto';
import mongoose, { Schema, Document } from 'mongoose';
import { isConnectedToMongo } from '../config/database.js';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'viewer';
  lastLogin?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    role: { type: String, default: 'admin' },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

const JWT_SECRET = process.env.JWT_SECRET || 'wifi-sentinel-master-secret-key-2026!';

class AuthService {
  private inMemoryAdmin = {
    username: 'admin',
    passwordHash: '',
    salt: '',
    role: 'admin',
    lastLogin: new Date(),
  };

  constructor() {
    // Initialize default admin with password 'sentinel2026!'
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.hashPassword('sentinel2026!', salt);
    this.inMemoryAdmin.salt = salt;
    this.inMemoryAdmin.passwordHash = hash;

    this.initDatabaseAdmin().catch(() => {});
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  private async initDatabaseAdmin() {
    if (isConnectedToMongo) {
      try {
        const existing = await UserModel.findOne({ username: 'admin' });
        if (!existing) {
          await UserModel.create({
            username: 'admin',
            passwordHash: this.inMemoryAdmin.passwordHash,
            salt: this.inMemoryAdmin.salt,
            role: 'admin',
          });
        }
      } catch {
        // ignore
      }
    }
  }

  public async login(username: string, password: string): Promise<{ token: string; user: { username: string; role: string } } | null> {
    const cleanUser = (username || '').trim().toLowerCase();
    let account = null;

    if (isConnectedToMongo) {
      try {
        account = await UserModel.findOne({ username: cleanUser });
      } catch {
        // fallback to memory
      }
    }

    if (!account && cleanUser === this.inMemoryAdmin.username) {
      account = this.inMemoryAdmin;
    }

    if (!account) return null;

    const testHash = this.hashPassword(password, account.salt);
    if (testHash !== account.passwordHash) {
      return null;
    }

    // Generate lightweight cryptographically signed token: Base64(payload).Signature
    const payload = {
      username: account.username,
      role: account.role || 'admin',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadB64).digest('base64url');
    const token = `${payloadB64}.${signature}`;

    if (isConnectedToMongo && (account as any).save) {
      account.lastLogin = new Date();
      (account as any).save().catch(() => {});
    }

    return {
      token,
      user: {
        username: account.username,
        role: account.role || 'admin',
      },
    };
  }

  public verifyToken(token: string): { username: string; role: string } | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payloadB64).digest('base64url');

    if (signature !== expectedSig) return null;

    try {
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
      if (payload.exp && Date.now() > payload.exp) {
        return null;
      }
      return { username: payload.username, role: payload.role };
    } catch {
      return null;
    }
  }

  public async changePassword(username: string, oldPass: string, newPass: string): Promise<boolean> {
    const verified = await this.login(username, oldPass);
    if (!verified) return false;

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = this.hashPassword(newPass, newSalt);

    if (username.toLowerCase() === 'admin') {
      this.inMemoryAdmin.salt = newSalt;
      this.inMemoryAdmin.passwordHash = newHash;
    }

    if (isConnectedToMongo) {
      try {
        await UserModel.findOneAndUpdate(
          { username: username.toLowerCase() },
          { $set: { passwordHash: newHash, salt: newSalt } },
          { upsert: true }
        );
      } catch {
        // fallback to memory
      }
    }

    return true;
  }
}

export const authService = new AuthService();
