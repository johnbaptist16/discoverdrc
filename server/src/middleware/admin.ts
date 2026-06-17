import { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) { res.status(503).json({ error: 'Admin not configured' }); return; }
  const auth = req.headers['x-admin-secret'] as string | undefined;
  if (auth !== secret) { res.status(401).json({ error: 'Unauthorized' }); return; }
  next();
}
