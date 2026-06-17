import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

export async function register(req: Request, res: Response) {
  const { phone, display_name, password } = req.body;

  if (!phone || !display_name || !password) {
    res.status(400).json({ error: 'phone, display_name and password are required' });
    return;
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Phone number already registered' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (phone, display_name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, phone, display_name, role, created_at`,
      [phone, display_name, password_hash]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 },
      process.env.JWT_SECRET as string
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function login(req: Request, res: Response) {
  const { phone, password } = req.body;

  if (!phone || !password) {
    res.status(400).json({ error: 'phone and password are required' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id, phone, display_name, role, password_hash FROM users WHERE phone = $1',
      [phone]
    );

    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: 'Invalid phone or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid phone or password' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 },
      process.env.JWT_SECRET as string
    );

    const { password_hash: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function me(req: Request, res: Response) {
  const userId = (req as any).userId;
  try {
    const result = await pool.query(
      'SELECT id, phone, email, display_name, role, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
