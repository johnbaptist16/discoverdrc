-- Seed: 12 businesses across the 4 new Explorer scopes

DO $$
DECLARE
  owner_id        UUID;
  cat_livraison   INT;
  cat_experiences INT;
  cat_marche      INT;
  cat_immobilier  INT;
BEGIN
  SELECT id INTO owner_id FROM users LIMIT 1;

  SELECT id INTO cat_livraison   FROM categories WHERE slug = 'livraison';
  SELECT id INTO cat_experiences FROM categories WHERE slug = 'experiences';
  SELECT id INTO cat_marche      FROM categories WHERE slug = 'marche';
  SELECT id INTO cat_immobilier  FROM categories WHERE slug = 'immobilier';

  -- ── LIVRAISON ──────────────────────────────────────────────────────────────

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours, latitude, longitude)
  VALUES (owner_id, cat_livraison,
    'YumDRC Kinshasa',
    'Livraison de repas à domicile en 30 min. Restaurants partenaires : congolais, libanais, chinois, pizza. Paiement Mobile Money ou cash.',
    'Avenue du 30 Juin 22, Gombe',
    'Gombe',
    '+243810112233', '+243810112233', TRUE,
    '{"mon":"10h–23h","tue":"10h–23h","wed":"10h–23h","thu":"10h–23h","fri":"10h–00h","sat":"10h–00h","sun":"11h–22h"}',
    -4.3200, 15.3160);

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_livraison,
    'Ndakissa Express',
    'Épicerie et pharmacie livrées en moins de 45 min. Eau, alimentation, médicaments sans ordonnance, articles ménagers. 0 frais de livraison > 10$.',
    'Avenue Kasa-Vubu 88, Kalamu',
    'Kalamu',
    '+243821334400', '+243821334400', FALSE,
    '{"mon":"07h–22h","tue":"07h–22h","wed":"07h–22h","thu":"07h–22h","fri":"07h–22h","sat":"07h–22h","sun":"08h–20h"}');

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_livraison,
    'BioKin Livraison',
    'Fruits et légumes frais du marché livrés chaque matin. Commandez avant 18h pour livraison le lendemain dès 7h. Abonnement hebdomadaire disponible.',
    'Marché de Limete, Avenue Commerce 4',
    'Limete',
    '+243832556622', NULL, FALSE,
    '{"mon":"07h–13h","tue":"07h–13h","wed":"07h–13h","thu":"07h–13h","fri":"07h–13h","sat":"07h–14h","sun":"fermé"}');

  -- ── EXPÉRIENCES ────────────────────────────────────────────────────────────

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours, latitude, longitude)
  VALUES (owner_id, cat_experiences,
    'Congo Safari & Treks',
    'Agence de tourisme spécialisée en safaris, trekking gorilles au Virunga, descente du fleuve Congo et tours culturels à Kinshasa. Guide certifié ICCN.',
    'Avenue Roi Baudouin 14, Gombe',
    'Gombe',
    '+243897445500', '+243897445500', TRUE,
    '{"mon":"08h–18h","tue":"08h–18h","wed":"08h–18h","thu":"08h–18h","fri":"08h–18h","sat":"09h–16h","sun":"10h–14h"}',
    -4.3185, 15.3140);

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours, latitude, longitude)
  VALUES (owner_id, cat_experiences,
    'Musée National de Kinshasa',
    'Musée national de la République Démocratique du Congo. Collections d''art kuba, masques, instruments de musique et objets historiques. Visites guidées en FR/EN/LN.',
    'Avenue du 24 Novembre, Lingwala',
    'Lingwala',
    '+243998112233', '+243998112233', TRUE,
    '{"mon":"fermé","tue":"09h–17h","wed":"09h–17h","thu":"09h–17h","fri":"09h–17h","sat":"09h–17h","sun":"10h–16h"}',
    -4.3155, 15.3090);

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_experiences,
    'Fleuve Congo Live Music',
    'Bar-restaurant avec scène musicale en bord du fleuve Congo. Concerts de rumba, soukous et jazz congolais les vendredi et samedi soir. Coucher de soleil à couper le souffle.',
    'Avenue des Nations Unies 5, Kintambo',
    'Kintambo',
    '+243843778800', '+243843778800', FALSE,
    '{"mon":"12h–23h","tue":"12h–23h","wed":"12h–23h","thu":"12h–23h","fri":"12h–02h","sat":"12h–02h","sun":"12h–22h"}');

  -- ── MARCHÉ ─────────────────────────────────────────────────────────────────

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours, latitude, longitude)
  VALUES (owner_id, cat_marche,
    'Marché Central de Gombe',
    'Stands de produits frais, épices, textiles et électronique. Plus de 200 commerçants. Meilleur marché pour les prix en gros. Négociation acceptée.',
    'Avenue du Marché Central, Gombe',
    'Gombe',
    '+243810223300', NULL, TRUE,
    '{"mon":"06h–19h","tue":"06h–19h","wed":"06h–19h","thu":"06h–19h","fri":"06h–20h","sat":"06h–20h","sun":"07h–17h"}',
    -4.3220, 15.3175);

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_marche,
    'Grossiste Alimentaire Matete',
    'Vente en gros de riz, farine, huile, sucre et produits secs. Prix usine. Commandes min. 50 kg. Livraison sur Kinshasa pour commandes > 200 USD.',
    'Avenue Kasa-Vubu 456, Matete',
    'Matete',
    '+243876112200', '+243876112200', FALSE,
    '{"mon":"07h–17h","tue":"07h–17h","wed":"07h–17h","thu":"07h–17h","fri":"07h–17h","sat":"07h–15h","sun":"fermé"}');

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_marche,
    'Artisanat Congo Boutique',
    'Sculpture sur bois, masques traditionnels, pagnes wax, bijoux en cuivre et en bronze. Idéal pour cadeaux et souvenirs. Export disponible.',
    'Avenue Victoire 67, Kintambo',
    'Kintambo',
    '+243854334400', NULL, TRUE,
    '{"mon":"09h–18h","tue":"09h–18h","wed":"09h–18h","thu":"09h–18h","fri":"09h–18h","sat":"09h–18h","sun":"10h–16h"}');

  -- ── IMMOBILIER ─────────────────────────────────────────────────────────────

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours, latitude, longitude)
  VALUES (owner_id, cat_immobilier,
    'Gombe Premium Properties',
    'Agence immobilière spécialisée dans les appartements et villas de standing à Gombe et Ngaliema. Location, vente, gestion locative. Partenaire des expatriés et ambassades.',
    'Avenue Roi Baudouin 8, Gombe',
    'Gombe',
    '+243997556600', '+243997556600', TRUE,
    '{"mon":"08h–17h","tue":"08h–17h","wed":"08h–17h","thu":"08h–17h","fri":"08h–17h","sat":"09h–14h","sun":"fermé"}',
    -4.3180, 15.3135);

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_immobilier,
    'KIN Locations Directes',
    'Location d''appartements et maisons sans frais d''agence. Gombe, Ngaliema, Limete, Kintambo. Studios dès 300 USD/mois. Visite sur rendez-vous WhatsApp.',
    'Avenue du Commerce 34, Ngaliema',
    'Ngaliema',
    '+243808778800', '+243808778800', FALSE,
    '{"mon":"08h–19h","tue":"08h–19h","wed":"08h–19h","thu":"08h–19h","fri":"08h–19h","sat":"09h–17h","sun":"10h–14h"}');

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_immobilier,
    'Immo Social Kinshasa',
    'Logements abordables à louer pour étudiants et jeunes travailleurs. Chambres meublées dès 80 USD/mois, appartements dès 150 USD. Kalamu, Limete, Matete.',
    'Avenue Lumumba 123, Kalamu',
    'Kalamu',
    '+243832990011', NULL, FALSE,
    '{"mon":"08h–18h","tue":"08h–18h","wed":"08h–18h","thu":"08h–18h","fri":"08h–18h","sat":"09h–15h","sun":"fermé"}');

END $$;
