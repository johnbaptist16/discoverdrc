import { Request, Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { sendPushToUser } from '../utils/push';

export async function listBusinesses(req: Request, res: Response) {
  const { commune, category, search, limit = '20', offset = '0' } = req.query;

  try {
    const conditions: string[] = ['b.is_active = TRUE'];
    const params: unknown[] = [];
    let i = 1;

    if (commune) {
      conditions.push(`b.commune = $${i++}`);
      params.push(commune);
    }
    if (category) {
      conditions.push(`c.slug = $${i++}`);
      params.push(category);
    }
    if (search) {
      conditions.push(`b.search_vector @@ plainto_tsquery('french', $${i++})`);
      params.push(search);
    }

    const where = conditions.join(' AND ');
    params.push(Number(limit), Number(offset));

    const result = await pool.query(
      `SELECT
         b.id, b.name, b.description, b.address, b.commune,
         b.whatsapp_number, b.phone_number, b.email, b.logo_url, b.cover_url,
         b.latitude, b.longitude, b.view_count, b.whatsapp_clicks,
         b.opening_hours, b.social_links, b.is_verified,
         c.slug AS category_slug, c.name_fr AS category_name
       FROM businesses b
       JOIN categories c ON c.id = b.category_id
       WHERE ${where}
       ORDER BY b.is_verified DESC, b.whatsapp_clicks DESC
       LIMIT $${i++} OFFSET $${i++}`,
      params
    );

    res.json({ businesses: result.rows, count: result.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getBusiness(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
         b.id, b.name, b.description, b.address, b.commune,
         b.whatsapp_number, b.phone_number, b.email, b.logo_url, b.cover_url,
         b.latitude, b.longitude, b.view_count, b.whatsapp_clicks,
         b.opening_hours, b.social_links, b.is_verified,
         c.slug AS category_slug, c.name_fr AS category_name,
         u.display_name AS owner_name,
         ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
         COUNT(r.id)::int AS review_count
       FROM businesses b
       JOIN categories c ON c.id = b.category_id
       JOIN users u ON u.id = b.owner_id
       LEFT JOIN reviews r ON r.business_id = b.id
       WHERE b.id = $1 AND b.is_active = TRUE
       GROUP BY b.id, c.slug, c.name_fr, u.display_name`,
      [id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    // Increment view count without blocking the response
    pool.query('UPDATE businesses SET view_count = view_count + 1 WHERE id = $1', [id]);

    const products = await pool.query(
      `SELECT id, name, description, price, price_usd, currency, image_url, video_url
       FROM products
       WHERE business_id = $1 AND is_available = TRUE
       ORDER BY sort_order`,
      [id]
    );

    res.json({ business: result.rows[0], products: products.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createBusiness(req: AuthRequest, res: Response) {
  const {
    name, description, category_id, address, commune,
    whatsapp_number, phone_number, latitude, longitude,
    opening_hours, social_links,
  } = req.body;

  if (!name || !category_id || !address || !commune || !whatsapp_number) {
    res.status(400).json({ error: 'name, category_id, address, commune and whatsapp_number are required' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO businesses
         (owner_id, name, description, category_id, address, commune,
          whatsapp_number, phone_number, latitude, longitude, opening_hours, social_links)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, name, commune, whatsapp_number, is_verified, created_at`,
      [
        req.userId, name, description ?? null, category_id, address, commune,
        whatsapp_number, phone_number ?? null,
        latitude ?? null, longitude ?? null,
        opening_hours ? JSON.stringify(opening_hours) : null,
        social_links ? JSON.stringify(social_links) : null,
      ]
    );

    res.status(201).json({ business: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function trackWhatsAppClick(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE businesses
       SET whatsapp_clicks = whatsapp_clicks + 1
       WHERE id = $1 AND is_active = TRUE
       RETURNING whatsapp_number, name`,
      [id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    const { whatsapp_number, name } = result.rows[0];
    const waLink = `https://wa.me/${whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${name}, je vous contacte via DiscoverDRC.`)}`;

    res.json({ whatsapp_url: waLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createProduct(req: AuthRequest, res: Response) {
  const { id: businessId } = req.params;
  const { name, description, price, price_usd, currency, image_url, video_url } = req.body;

  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  try {
    const ownerCheck = await pool.query(
      'SELECT id FROM businesses WHERE id = $1 AND owner_id = $2 AND is_active = TRUE',
      [businessId, req.userId]
    );
    if (!ownerCheck.rows[0]) {
      res.status(403).json({ error: 'Not authorized or business not found' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO products (business_id, name, description, price, price_usd, currency, image_url, video_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, name, description, price, price_usd, currency, image_url, video_url`,
      [businessId, name, description ?? null, price ?? null, price_usd ?? null,
       currency ?? 'CDF', image_url ?? null, video_url ?? null]
    );

    res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function listCategories(_req: Request, res: Response) {
  try {
    const result = await pool.query('SELECT id, slug, name_fr, name_ln FROM categories ORDER BY name_fr');
    res.json({ categories: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createReview(req: AuthRequest, res: Response) {
  const { id: businessId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'rating must be between 1 and 5' });
    return;
  }

  try {
    const [reviewResult, bizResult] = await Promise.all([
      pool.query(
        `INSERT INTO reviews (business_id, user_id, rating, comment)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (business_id, user_id)
         DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = NOW()
         RETURNING id, rating, comment, created_at`,
        [businessId, req.userId, rating, comment ?? null]
      ),
      pool.query<{ owner_id: string; name: string; display_name: string }>(
        `SELECT b.owner_id, b.name, u.display_name
         FROM businesses b JOIN users u ON u.id = $2
         WHERE b.id = $1`,
        [businessId, req.userId]
      ),
    ]);

    res.status(201).json({ review: reviewResult.rows[0] });

    // Fire-and-forget push to business owner (different user only)
    const biz = bizResult.rows[0];
    if (biz && biz.owner_id !== req.userId) {
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      sendPushToUser(biz.owner_id, {
        title: `Nouvel avis sur ${biz.name}`,
        body: `${biz.display_name} a laissé ${stars}${comment ? ` · "${comment.slice(0, 60)}"` : ''}`,
        data: { businessId: businessId as string },
      }).catch(console.error);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function listMyBusinesses(req: AuthRequest, res: Response) {
  try {
    const { rows } = await pool.query(
      `SELECT b.id, b.name, b.description, b.address, b.commune, b.whatsapp_number,
              b.phone_number, b.opening_hours, b.is_verified, b.view_count, b.whatsapp_clicks,
              c.slug AS category_slug, c.name_fr AS category_name,
              ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
              COUNT(r.id)::int AS review_count
       FROM businesses b
       JOIN categories c ON c.id = b.category_id
       LEFT JOIN reviews r ON r.business_id = b.id
       WHERE b.owner_id = $1 AND b.is_active = TRUE
       GROUP BY b.id, c.slug, c.name_fr
       ORDER BY b.created_at DESC`,
      [req.userId]
    );
    res.json({ businesses: rows.map(r => ({ ...r, avg_rating: r.avg_rating ? Number(r.avg_rating) : null })) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

export async function updateBusiness(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name, description, address, commune, whatsapp_number, phone_number, opening_hours, cover_url, logo_url } = req.body;

  const allowed = { name, description, address, commune, whatsapp_number, phone_number, opening_hours, cover_url, logo_url };
  const fields = Object.entries(allowed).filter(([, v]) => v !== undefined);
  if (!fields.length) { res.status(400).json({ error: 'No fields to update' }); return; }

  const sets = fields.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const vals = [...fields.map(([, v]) => v), id, req.userId];

  try {
    const { rowCount } = await pool.query(
      `UPDATE businesses SET ${sets}, updated_at = NOW()
       WHERE id = $${fields.length + 1} AND owner_id = $${fields.length + 2} AND is_active = TRUE
       RETURNING id`,
      vals
    );
    if (!rowCount) { res.status(404).json({ error: 'Business not found or not yours' }); return; }
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

export async function listReviews(req: Request, res: Response) {
  const { id: businessId } = req.params;

  try {
    const rows = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.display_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.business_id = $1
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [businessId]
    );

    const stats = await pool.query(
      `SELECT ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*)::int AS review_count
       FROM reviews WHERE business_id = $1`,
      [businessId]
    );

    res.json({
      reviews: rows.rows,
      avg_rating: stats.rows[0].avg_rating ? Number(stats.rows[0].avg_rating) : null,
      review_count: Number(stats.rows[0].review_count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
