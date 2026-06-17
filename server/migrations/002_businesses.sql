CREATE TABLE categories (
  id       SERIAL      PRIMARY KEY,
  slug     VARCHAR(50) UNIQUE NOT NULL,
  name_fr  VARCHAR(100) NOT NULL,
  name_ln  VARCHAR(100)
);

INSERT INTO categories (slug, name_fr, name_ln) VALUES
  ('restaurant',  'Restaurant',       'Ndako ya bilei'),
  ('pharmacie',   'Pharmacie',        'Ndako ya nkisi'),
  ('supermarche', 'Supermarché',      NULL),
  ('salon',       'Salon de beauté',  NULL),
  ('garage',      'Garage / Auto',    NULL),
  ('banque',      'Banque / Finance', NULL),
  ('hotel',       'Hôtel',            NULL),
  ('clinique',    'Clinique',         NULL);

CREATE TABLE businesses (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id     INT          NOT NULL REFERENCES categories(id),
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  address         TEXT         NOT NULL,
  commune         VARCHAR(100) NOT NULL,
  latitude        DECIMAL(9,6),
  longitude       DECIMAL(9,6),
  whatsapp_number VARCHAR(20)  NOT NULL,
  phone_number    VARCHAR(20),
  logo_url        TEXT,
  cover_url       TEXT,
  is_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  opening_hours   JSONB,
  social_links    JSONB,
  view_count      INT          NOT NULL DEFAULT 0,
  whatsapp_clicks INT          NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_businesses_commune  ON businesses(commune);
CREATE INDEX idx_businesses_category ON businesses(category_id);
CREATE INDEX idx_businesses_owner    ON businesses(owner_id);
CREATE INDEX idx_businesses_location ON businesses(latitude, longitude);
CREATE INDEX idx_businesses_active   ON businesses(is_active) WHERE is_active = TRUE;

ALTER TABLE businesses ADD COLUMN search_vector TSVECTOR;
CREATE INDEX idx_businesses_fts ON businesses USING GIN(search_vector);

CREATE OR REPLACE FUNCTION update_business_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('french',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.commune, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_search_vector_update
  BEFORE INSERT OR UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_business_search_vector();

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
