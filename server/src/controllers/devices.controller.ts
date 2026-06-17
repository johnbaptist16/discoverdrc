import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export async function registerDevice(req: AuthRequest, res: Response) {
  const { token, platform } = req.body as { token?: string; platform?: string };
  if (!token || !platform) { res.status(400).json({ error: 'token and platform required' }); return; }
  if (!['ios', 'android', 'web'].includes(platform)) { res.status(400).json({ error: 'invalid platform' }); return; }
  try {
    await pool.query(
      `INSERT INTO push_tokens (user_id, token, platform)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, token) DO UPDATE SET updated_at = NOW()`,
      [req.userId, token, platform]
    );
    res.status(201).json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

export async function deregisterDevice(req: AuthRequest, res: Response) {
  const { token } = req.body as { token?: string };
  if (!token) { res.status(400).json({ error: 'token required' }); return; }
  try {
    await pool.query('DELETE FROM push_tokens WHERE user_id = $1 AND token = $2', [req.userId, token]);
    res.status(200).json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}
