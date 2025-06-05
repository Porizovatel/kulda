import Dexie, { Table } from 'dexie';
import { UserRole } from '../types';

export interface LocalUser {
  id?: number;
  email: string;
  password: string; // V produkci by mělo být hashované
  role: UserRole;
  createdAt: Date;
}

export interface Session {
  id?: number;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

class LocalDatabase extends Dexie {
  users!: Table<LocalUser>;
  sessions!: Table<Session>;

  constructor() {
    super('KuLiChLocalDB');
    
    this.version(1).stores({
      users: '++id, email, role, createdAt',
      sessions: '++id, userId, token, expiresAt, createdAt'
    });
  }

  async createUser(email: string, password: string, role: UserRole = 'reader'): Promise<LocalUser> {
    console.log('Creating user:', { email, role });
    
    // Kontrola, zda uživatel již existuje
    const existingUser = await this.users.where('email').equals(email).first();
    if (existingUser) {
      throw new Error('Uživatel s tímto emailem již existuje');
    }

    const newUser: LocalUser = {
      email,
      password, // V produkci by mělo být hashované pomocí bcrypt
      role,
      createdAt: new Date()
    };

    const id = await this.users.add(newUser);
    return { ...newUser, id };
  }

  async authenticateUser(email: string, password: string): Promise<LocalUser | null> {
    console.log('Authenticating user:', email);
    
    const user = await this.users.where('email').equals(email).first();
    
    if (!user) {
      console.log('User not found');
      return null;
    }

    // V produkci by zde bylo porovnání hashe
    if (user.password !== password) {
      console.log('Invalid password');
      return null;
    }

    console.log('User authenticated successfully');
    return user;
  }

  async createSession(userId: number): Promise<string> {
    console.log('Creating session for user:', userId);
    
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Platnost 7 dní

    const session: Session = {
      userId,
      token,
      expiresAt,
      createdAt: new Date()
    };

    await this.sessions.add(session);
    return token;
  }

  async validateSession(token: string): Promise<LocalUser | null> {
    console.log('Validating session token');
    
    const session = await this.sessions.where('token').equals(token).first();
    
    if (!session) {
      console.log('Session not found');
      return null;
    }

    if (new Date() > session.expiresAt) {
      console.log('Session expired');
      await this.sessions.delete(session.id!);
      return null;
    }

    const user = await this.users.get(session.userId);
    if (!user) {
      console.log('User not found for session');
      return null;
    }

    console.log('Session validated successfully');
    return user;
  }

  async destroySession(token: string): Promise<void> {
    console.log('Destroying session');
    await this.sessions.where('token').equals(token).delete();
  }

  async updateUserRole(userId: number, role: UserRole): Promise<void> {
    console.log('Updating user role:', { userId, role });
    await this.users.update(userId, { role });
  }

  async getAllUsers(): Promise<LocalUser[]> {
    return await this.users.orderBy('createdAt').reverse().toArray();
  }

  private generateToken(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  async cleanExpiredSessions(): Promise<void> {
    const now = new Date();
    await this.sessions.where('expiresAt').below(now).delete();
  }
}

export const localDb = new LocalDatabase();
export default localDb;