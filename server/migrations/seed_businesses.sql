-- Seed: 25 Kinshasa businesses across all categories and communes
-- Uses the existing first user as owner for all seeded listings

DO $$
DECLARE
  owner_id UUID;
  cat_restaurant  INT;
  cat_pharmacie   INT;
  cat_supermarche INT;
  cat_salon       INT;
  cat_garage      INT;
  cat_banque      INT;
  cat_hotel       INT;
  cat_clinique    INT;
BEGIN
  SELECT id INTO owner_id FROM users LIMIT 1;

  SELECT id INTO cat_restaurant  FROM categories WHERE slug = 'restaurant';
  SELECT id INTO cat_pharmacie   FROM categories WHERE slug = 'pharmacie';
  SELECT id INTO cat_supermarche FROM categories WHERE slug = 'supermarche';
  SELECT id INTO cat_salon       FROM categories WHERE slug = 'salon';
  SELECT id INTO cat_garage      FROM categories WHERE slug = 'garage';
  SELECT id INTO cat_banque      FROM categories WHERE slug = 'banque';
  SELECT id INTO cat_hotel       FROM categories WHERE slug = 'hotel';
  SELECT id INTO cat_clinique    FROM categories WHERE slug = 'clinique';

  -- ── RESTAURANTS ────────────────────────────────────────────────────────────

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours, latitude, longitude)
  VALUES (owner_id, cat_restaurant,
    'Chez Mama Weza',
    'Cuisine congolaise authentique. Spécialités : poulet moambe, fufu de manioc, saka-saka. Cadre familial et accueil chaleureux.',
    'Avenue Kasa-Vubu 14, Marché de Gombe',
    'Gombe',
    '+243814567890', '+243814567890', TRUE,
    '{"mon":"07h–21h","tue":"07h–21h","wed":"07h–21h","thu":"07h–21h","fri":"07h–22h","sat":"08h–22h","sun":"09h–20h"}',
    -4.3228, 15.3222);

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours, latitude, longitude)
  VALUES (owner_id, cat_restaurant,
    'Restaurant Le Ndako',
    'Restaurant haut de gamme au cœur de Gombe. Cuisine congolaise revisitée et plats internationaux. Terrasse avec vue sur le fleuve Congo.',
    'Boulevard du 30 Juin 88, Gombe',
    'Gombe',
    '+243897123456', '+243897123456', TRUE,
    '{"mon":"12h–23h","tue":"12h–23h","wed":"12h–23h","thu":"12h–23h","fri":"12h–00h","sat":"12h–00h","sun":"12h–22h"}',
    -4.3195, 15.3180);

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_restaurant,
    'Matonge Palace',
    'Le rendez-vous des amateurs de cuisine congolaise à Kalamu. Grillades, brochettes, bières fraîches. Ambiance musicale le week-end.',
    'Avenue Kasa-Vubu 203, Matonge',
    'Kalamu',
    '+243820345678', '+243820345678', FALSE,
    '{"mon":"11h–23h","tue":"11h–23h","wed":"11h–23h","thu":"11h–23h","fri":"11h–01h","sat":"11h–01h","sun":"12h–22h"}');

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_restaurant,
    'Boulangerie Café Victoire',
    'Boulangerie-pâtisserie et café. Croissants frais, pains artisanaux, sandwichs et jus naturels. Petit-déjeuner et brunch le dimanche.',
    'Avenue de la Victoire 45, Lingwala',
    'Lingwala',
    '+243851234567', NULL, FALSE,
    '{"mon":"06h–20h","tue":"06h–20h","wed":"06h–20h","thu":"06h–20h","fri":"06h–20h","sat":"06h–20h","sun":"07h–14h"}');

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_restaurant,
    'Chez Tantine Bolingo',
    'Cuisine de rue et plats à emporter. Liboke de poisson, pondu, makemba. Prix accessibles. Ouvert tôt le matin pour le petit-déjeuner.',
    'Marché de Limete, Avenue Kintambo 7',
    'Limete',
    '+243832109876', NULL, FALSE,
    '{"mon":"06h–19h","tue":"06h–19h","wed":"06h–19h","thu":"06h–19h","fri":"06h–20h","sat":"06h–20h","sun":"fermé"}');

  -- ── PHARMACIES ─────────────────────────────────────────────────────────────

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours, latitude, longitude)
  VALUES (owner_id, cat_pharmacie,
    'Pharmacie Centrale de Gombe',
    'Pharmacie agréée avec large gamme de médicaments, parapharmacie et conseils pharmaceutiques. Délivrance sur ordonnance et en libre accès.',
    'Avenue Colonel Lukusa 12, Gombe',
    'Gombe',
    '+243897654321', '+243897654321', TRUE,
    '{"mon":"08h–21h","tue":"08h–21h","wed":"08h–21h","thu":"08h–21h","fri":"08h–21h","sat":"08h–20h","sun":"09h–17h"}',
    -4.3210, 15.3165);

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_pharmacie,
    'Pharmacie Bon Samaritain',
    'Pharmacie de quartier ouverte 7j/7. Médicaments génériques et de marque. Service de garde la nuit sur appel WhatsApp.',
    'Avenue Bokasa 34, Ngaliema',
    'Ngaliema',
    '+243815678901', '+243815678901', FALSE,
    '{"mon":"08h–22h","tue":"08h–22h","wed":"08h–22h","thu":"08h–22h","fri":"08h–22h","sat":"08h–22h","sun":"09h–20h"}');

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_pharmacie,
    'Pharmacie Sainte-Famille',
    'Pharmacie catholique à Lingwala. Médicaments, matériel médical, produits bébé. Personnel qualifié et prix raisonnables.',
    'Avenue Sainte-Famille 8, Lingwala',
    'Lingwala',
    '+243826789012', NULL, TRUE,
    '{"mon":"08h–20h","tue":"08h–20h","wed":"08h–20h","thu":"08h–20h","fri":"08h–20h","sat":"08h–18h","sun":"09h–13h"}');

  -- ── SUPERMARCHÉS ───────────────────────────────────────────────────────────

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours, latitude, longitude)
  VALUES (owner_id, cat_supermarche,
    'Supermarché La Galerie',
    'Grand supermarché au cœur de Gombe. Épicerie, boucherie, fromagerie, vins et spiritueux. Livraison à domicile disponible.',
    'Avenue du Marché 1, La Galerie',
    'Gombe',
    '+243897001122', '+243897001122', TRUE,
    '{"mon":"09h–21h","tue":"09h–21h","wed":"09h–21h","thu":"09h–21h","fri":"09h–22h","sat":"09h–22h","sun":"10h–20h"}',
    -4.3201, 15.3155);

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_supermarche,
    'Shop & Save Limete',
    'Supermarché de quartier avec produits locaux et importés. Fruits et légumes frais tous les jours. Prix compétitifs.',
    'Boulevard Lumumba 156, Limete',
    'Limete',
    '+243821334455', '+243821334455', FALSE,
    '{"mon":"08h–21h","tue":"08h–21h","wed":"08h–21h","thu":"08h–21h","fri":"08h–22h","sat":"08h–22h","sun":"09h–19h"}');

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_supermarche,
    'Marché Express Ngaliema',
    'Épicerie express ouverte tard. Produits du quotidien, eau minérale, boissons, snacks. Commande WhatsApp avec livraison rapide.',
    'Avenue des Cliniques 78, Ngaliema',
    'Ngaliema',
    '+243832556677', NULL, FALSE,
    '{"mon":"07h–23h","tue":"07h–23h","wed":"07h–23h","thu":"07h–23h","fri":"07h–23h","sat":"07h–23h","sun":"08h–23h"}');

  -- ── SALONS DE BEAUTÉ ───────────────────────────────────────────────────────

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_salon,
    'Salon Élégance by Mama Fatou',
    'Salon de coiffure et beauté pour femmes. Tresses, tissage, défrisage, manucure et pédicure. Rendez-vous sur WhatsApp recommandé.',
    'Avenue Kalembe-Lembe 23, Kalamu',
    'Kalamu',
    '+243843778899', '+243843778899', FALSE,
    '{"mon":"08h–19h","tue":"08h–19h","wed":"08h–19h","thu":"08h–19h","fri":"08h–20h","sat":"08h–20h","sun":"fermé"}');

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_salon,
    'Beauty Studio Kinshasa',
    'Studio beauté tendance à Gombe. Soins du visage, épilation, maquillage professionnel. Équipe formée à Paris et Bruxelles.',
    'Avenue Roi Baudouin 55, Gombe',
    'Gombe',
    '+243897223344', NULL, TRUE,
    '{"mon":"09h–19h","tue":"09h–19h","wed":"09h–19h","thu":"09h–19h","fri":"09h–20h","sat":"09h–20h","sun":"10h–16h"}');

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_salon,
    'Barbershop Prestige',
    'Barbier masculin moderne. Coupes tendance, tailles de barbe, soins du visage pour hommes. Ambiance détendue et musique congolaise.',
    'Avenue du Commerce 112, Kintambo',
    'Kintambo',
    '+243854990011', NULL, FALSE,
    '{"mon":"09h–20h","tue":"09h–20h","wed":"09h–20h","thu":"09h–20h","fri":"09h–21h","sat":"08h–21h","sun":"09h–17h"}');

  -- ── GARAGES / AUTO ─────────────────────────────────────────────────────────

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_garage,
    'Garage Mvita Motors',
    'Garage agréé Toyota et Mitsubishi. Vidange, freins, suspension, électricité auto. Pièces d''origine importées. Devis gratuit.',
    'Avenue du Port 34, Barumbu',
    'Barumbu',
    '+243865112233', '+243865112233', TRUE,
    '{"mon":"07h–18h","tue":"07h–18h","wed":"07h–18h","thu":"07h–18h","fri":"07h–18h","sat":"07h–15h","sun":"fermé"}');

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_garage,
    'Auto Mécanique Express Limete',
    'Mécanique générale, climatisation auto, pneumatiques. Intervention rapide. Service de dépannage sur route disponible.',
    'Boulevard Lumumba 89, Limete',
    'Limete',
    '+243876334455', '+243876334455', FALSE,
    '{"mon":"07h–19h","tue":"07h–19h","wed":"07h–19h","thu":"07h–19h","fri":"07h–19h","sat":"07h–17h","sun":"08h–13h"}');

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_garage,
    'Centre Auto Ngaliema',
    'Vente et montage de pneus toutes marques. Équilibrage, géométrie, lavage auto intérieur et extérieur. Parking sécurisé.',
    'Avenue des Palmiers 67, Ngaliema',
    'Ngaliema',
    '+243887556677', NULL, FALSE,
    '{"mon":"08h–18h","tue":"08h–18h","wed":"08h–18h","thu":"08h–18h","fri":"08h–18h","sat":"08h–16h","sun":"fermé"}');

  -- ── BANQUES / FINANCE ──────────────────────────────────────────────────────

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours, latitude, longitude)
  VALUES (owner_id, cat_banque,
    'Rawbank Gombe',
    'Agence bancaire Rawbank. Comptes courants et épargne, crédits, Western Union, change de devises. Application mobile disponible.',
    'Avenue Colonel Ebeya 3, Gombe',
    'Gombe',
    '+243997778899', '+243997778899', TRUE,
    '{"mon":"08h–16h","tue":"08h–16h","wed":"08h–16h","thu":"08h–16h","fri":"08h–15h","sat":"08h–12h","sun":"fermé"}',
    -4.3188, 15.3142);

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_banque,
    'Bureau de Change Forex Kinshasa',
    'Bureau de change agréé par la BCC. Meilleur taux USD/CDF, EUR, GBP, CNY. Transactions rapides et sécurisées. Reçu fiscal fourni.',
    'Avenue du 30 Juin 44, Gombe',
    'Gombe',
    '+243808990011', '+243808990011', TRUE,
    '{"mon":"08h–18h","tue":"08h–18h","wed":"08h–18h","thu":"08h–18h","fri":"08h–18h","sat":"09h–16h","sun":"fermé"}');

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_banque,
    'Mobile Money Mama Banga',
    'Agent M-Pesa et Airtel Money agréé. Dépôts, retraits, transferts, paiements de factures. Sans frais de compte. Ouvert tous les jours.',
    'Avenue Victoire 102, Kalamu',
    'Kalamu',
    '+243819001122', NULL, FALSE,
    '{"mon":"07h–21h","tue":"07h–21h","wed":"07h–21h","thu":"07h–21h","fri":"07h–21h","sat":"07h–21h","sun":"08h–18h"}');

  -- ── HÔTELS ─────────────────────────────────────────────────────────────────

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours, latitude, longitude)
  VALUES (owner_id, cat_hotel,
    'Hôtel Memling Kinshasa',
    'Hôtel 4 étoiles en plein centre de Gombe. Chambres climatisées, restaurant gastronomique, piscine, salle de conférence, wifi haut débit.',
    'Avenue du Tchad 5, Gombe',
    'Gombe',
    '+243997112233', '+243997112233', TRUE,
    '{"mon":"00h–24h","tue":"00h–24h","wed":"00h–24h","thu":"00h–24h","fri":"00h–24h","sat":"00h–24h","sun":"00h–24h"}',
    -4.3174, 15.3128);

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_hotel,
    'Résidence La Colombe',
    'Maison d''hôtes confortable et abordable à Lingwala. Chambres avec climatisation, petit-déjeuner inclus, parking sécurisé.',
    'Avenue Libération 29, Lingwala',
    'Lingwala',
    '+243828334455', '+243828334455', FALSE,
    '{"mon":"00h–24h","tue":"00h–24h","wed":"00h–24h","thu":"00h–24h","fri":"00h–24h","sat":"00h–24h","sun":"00h–24h"}');

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_hotel,
    'Auberge du Fleuve',
    'Auberge familiale avec vue sur le fleuve Congo. 12 chambres, restaurant, terrasse panoramique. Idéal pour voyageurs et travailleurs humanitaires.',
    'Avenue des Nations Unies 78, Kintambo',
    'Kintambo',
    '+243839556677', NULL, FALSE,
    '{"mon":"00h–24h","tue":"00h–24h","wed":"00h–24h","thu":"00h–24h","fri":"00h–24h","sat":"00h–24h","sun":"00h–24h"}');

  -- ── CLINIQUES ──────────────────────────────────────────────────────────────

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours, latitude, longitude)
  VALUES (owner_id, cat_clinique,
    'Clinique Ngaliema',
    'Clinique privée de référence à Kinshasa. Médecine générale, pédiatrie, gynécologie, radiologie, laboratoire d''analyses. Urgences 24h/24.',
    'Avenue des Cliniques 2, Ngaliema',
    'Ngaliema',
    '+243997334455', '+243997334455', TRUE,
    '{"mon":"00h–24h","tue":"00h–24h","wed":"00h–24h","thu":"00h–24h","fri":"00h–24h","sat":"00h–24h","sun":"00h–24h"}',
    -4.3412, 15.2971);

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_clinique,
    'Cabinet Médical Dr. Mbaya',
    'Médecin généraliste. Consultations sur rendez-vous ou en urgence. Spécialités : médecine interne, hypertension, diabète.',
    'Avenue Bokasa 12, Gombe',
    'Gombe',
    '+243808556677', '+243808556677', TRUE,
    '{"mon":"08h–18h","tue":"08h–18h","wed":"08h–18h","thu":"08h–18h","fri":"08h–18h","sat":"09h–13h","sun":"fermé"}');

  INSERT INTO businesses (owner_id, category_id, name, description, address, commune, whatsapp_number, phone_number, is_verified, opening_hours)
  VALUES (owner_id, cat_clinique,
    'Centre de Santé Bonne Espérance',
    'Centre de santé communautaire à Kalamu. Consultations à prix accessibles, vaccinations, planning familial, soins infirmiers.',
    'Avenue Kasa-Vubu 345, Kalamu',
    'Kalamu',
    '+243820778899', NULL, FALSE,
    '{"mon":"07h–17h","tue":"07h–17h","wed":"07h–17h","thu":"07h–17h","fri":"07h–17h","sat":"07h–14h","sun":"fermé"}');

END $$;
