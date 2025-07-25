import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Registrace
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Kontrola existence uživatele
    const db = await getDatabase();
    const existingUser = await db.get(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'Uživatel s tímto emailem již existuje' });
    }

    // Hash hesla
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Vytvoření uživatele
    const result = await db.run(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, passwordHash, 'reader']
    );

    const userId = result.lastID;

    // Generování JWT tokenu
    const token = jwt.sign(
      { userId, email, role: 'reader' },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Uživatel vytvořen úspěšně',
      token,
      user: { id: userId, email, role: 'reader' }
    });
  } catch (error) {
    console.error('Chyba při registraci:', error);
    res.status(500).json({ error: 'Interní chyba serveru' });
  }
});

// Přihlášení
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Najít uživatele
    const db = await getDatabase();
    const user = await db.get(
      'SELECT id, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Neplatné přihlašovací údaje' });
    }

    // Ověření hesla
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Neplatné přihlašovací údaje' });
    }

    // Generování JWT tokenu
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Přihlášení úspěšné',
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Chyba při přihlášení:', error);
    res.status(500).json({ error: 'Interní chyba serveru' });
  }
});

// Ověření tokenu
router.get('/verify', authenticateToken, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;