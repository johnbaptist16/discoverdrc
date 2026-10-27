// Loads the demo businesses (migrations/seed_*.sql).
// The seeds attach listings to the FIRST registered user, so sign up once in the app first.
// Run on the server: node dist/scripts/seed.js
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM users');
  if (rows[0].n === 0) {
    console.error('No users yet: register one account in the app, then run this again.');
    process.exit(1);
  }

  const dir = path.join(__dirname, '..', '..', 'migrations');
  const files = fs.readdirSync(dir).filter(f => /^seed_.*\.sql$/.test(f)).sort();
  for (const file of files) {
    console.log(`seed  ${file}`);
    await pool.query(fs.readFileSync(path.join(dir, file), 'utf8'));
  }
  await pool.end();
  console.log('seed complete');
}

seed().catch(err => { console.error(err); process.exit(1); });
