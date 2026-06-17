import { Request, Response } from 'express';
import { pool } from '../config/db';

export async function adminListBusinesses(req: Request, res: Response) {
  try {
    const { rows } = await pool.query(`
      SELECT b.id, b.name, b.commune, b.is_verified, b.is_active,
             b.created_at, c.name_fr AS category,
             u.display_name AS owner, u.phone AS owner_phone,
             ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
             COUNT(r.id)::int AS review_count,
             b.view_count, b.whatsapp_clicks
      FROM businesses b
      JOIN categories c ON c.id = b.category_id
      JOIN users u ON u.id = b.owner_id
      LEFT JOIN reviews r ON r.business_id = b.id
      GROUP BY b.id, c.name_fr, u.display_name, u.phone
      ORDER BY b.created_at DESC
    `);
    const [stats] = (await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_active)::int            AS total,
        COUNT(*) FILTER (WHERE is_verified AND is_active)::int AS verified,
        COUNT(*) FILTER (WHERE NOT is_verified AND is_active)::int AS pending,
        COUNT(*) FILTER (WHERE NOT is_active)::int        AS inactive
      FROM businesses
    `)).rows;
    res.json({ businesses: rows, stats });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

export async function adminPatchBusiness(req: Request, res: Response) {
  const { id } = req.params;
  const { is_verified, is_active } = req.body as { is_verified?: boolean; is_active?: boolean };
  const fields: string[] = [];
  const vals: unknown[] = [];
  if (is_verified !== undefined) { fields.push(`is_verified = $${fields.length + 1}`); vals.push(is_verified); }
  if (is_active  !== undefined) { fields.push(`is_active = $${fields.length + 1}`);   vals.push(is_active); }
  if (!fields.length) { res.status(400).json({ error: 'Nothing to update' }); return; }
  vals.push(id);
  try {
    await pool.query(
      `UPDATE businesses SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${vals.length}`,
      vals
    );
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}
