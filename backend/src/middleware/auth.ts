import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'admin' | 'manager' | 'reader';
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Přístupový token je vyžadován' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Ověření existence uživatele v databázi
    const db = await getDatabase();
    const user = await db.get(
      'SELECT id, email, role FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Neplatný token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Neplatný nebo vypršelý token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Uživatel není přihlášen' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' });
    }
    
    next();
  };
};