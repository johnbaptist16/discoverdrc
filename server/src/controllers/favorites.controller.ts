import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export async function addFavorite(req: AuthRequest, res: Response) {
  const { id: businessId } = req.params;
  try {
    await pool.query(
      'INSERT INTO favorites (user_id, business_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.userId, businessId]
    );
    res.status(201).json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

export async function removeFavorite(req: AuthRequest, res: Response) {
  const { id: businessId } = req.params;
  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND business_id = $2',
      [req.userId, businessId]
    );
    res.status(200).json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

export async function listFavorites(req: AuthRequest, res: Response) {
  try {
    const { rows } = await pool.query(
      `SELECT b.id, b.name, b.description, b.address, b.commune, b.whatsapp_number,
              b.phone_number, b.logo_url, b.cover_url, b.latitude, b.longitude,
              b.view_count, b.whatsapp_clicks, b.email, b.opening_hours, b.social_links,
              b.is_verified, c.slug AS category_slug, c.name_fr AS category_name,
              ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
              COUNT(r.id)::int AS review_count
       FROM favorites f
       JOIN businesses b ON b.id = f.business_id
       JOIN categories c ON c.id = b.category_id
       LEFT JOIN reviews r ON r.business_id = b.id
       WHERE f.user_id = $1 AND b.is_active = TRUE
       GROUP BY b.id, c.slug, c.name_fr
       ORDER BY MAX(f.created_at) DESC`,
      [req.userId]
    );
    res.json({
      businesses: rows.map(r => ({ ...r, avg_rating: r.avg_rating ? Number(r.avg_rating) : null })),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}
