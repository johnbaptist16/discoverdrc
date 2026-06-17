CREATE TABLE products (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID          NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name         VARCHAR(200)  NOT NULL,
  description  TEXT,
  price        DECIMAL(12,2),
  price_usd    DECIMAL(10,2),
  currency     VARCHAR(5)    NOT NULL DEFAULT 'CDF' CHECK (currency IN ('CDF', 'USD')),
  image_url    TEXT,
  video_url    TEXT,
  is_available BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order   INT           NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_business  ON products(business_id);
CREATE INDEX idx_products_available ON products(is_available) WHERE is_available = TRUE;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
