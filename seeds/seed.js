#!/usr/bin/env node
/**
 * Minute Mantra — Database Seed Script
 * Inserts all 365 mantras into the database.
 * Run: node seeds/seed.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const part1 = require('./mantras-part1');
const part2 = require('./mantras-part2');
const part3 = require('./mantras-part3');
const part4 = require('./mantras-part4');

const ALL_MANTRAS = [...part1, ...part2, ...part3, ...part4];

async function seed() {
  console.log(`\n🕉  Minute Mantra Seed Script`);
  console.log(`📿 Total mantras to seed: ${ALL_MANTRAS.length}\n`);

  // Validate no duplicate day_of_year
  const days = ALL_MANTRAS.map(m => m.day_of_year);
  const dupes = days.filter((d, i) => days.indexOf(d) !== i);
  if (dupes.length > 0) {
    console.error('❌ Duplicate day_of_year found:', dupes);
    process.exit(1);
  }

  // Validate all days 1-365 present
  const missing = [];
  for (let i = 1; i <= 365; i++) {
    if (!days.includes(i)) missing.push(i);
  }
  if (missing.length > 0) {
    console.error('❌ Missing days:', missing);
    process.exit(1);
  }

  console.log('✅ Validation passed: all 365 days present, no duplicates\n');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'minute_mantra',
    multipleStatements: true,
  });

  try {
    // Create table if not exists
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS mantras (
        id INT AUTO_INCREMENT PRIMARY KEY,
        day_of_year SMALLINT UNSIGNED NOT NULL UNIQUE,
        original_script TEXT NOT NULL,
        transliteration VARCHAR(500) NOT NULL,
        english_translation TEXT NOT NULL,
        tradition ENUM('vedic_shiva','vedic_vishnu','vedic_shakti','vedic_ganesha','vedic_solar','buddhist','sikh','universal') NOT NULL,
        intention VARCHAR(100),
        phonetic_guide VARCHAR(500),
        sacred_geometry_type ENUM('sri_yantra','lotus','flower_of_life','seed_of_life') NOT NULL DEFAULT 'lotus',
        context_note TEXT,
        go_deeper_teaser VARCHAR(300),
        audio_url VARCHAR(500),
        hero_image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tradition (tradition),
        INDEX idx_day (day_of_year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('📋 Table ready. Inserting mantras...\n');

    let inserted = 0;
    let updated = 0;

    for (const m of ALL_MANTRAS) {
      const [rows] = await conn.execute(
        'SELECT id FROM mantras WHERE day_of_year = ?',
        [m.day_of_year]
      );

      if (rows.length > 0) {
        await conn.execute(
          `UPDATE mantras SET
            original_script = ?,
            transliteration = ?,
            english_translation = ?,
            tradition = ?,
            intention = ?,
            phonetic_guide = ?,
            sacred_geometry_type = ?,
            context_note = ?,
            go_deeper_teaser = ?
          WHERE day_of_year = ?`,
          [
            m.original_script,
            m.transliteration,
            m.english_translation,
            m.tradition,
            m.intention || null,
            m.phonetic_guide || null,
            m.sacred_geometry_type || 'lotus',
            m.context_note || null,
            m.go_deeper_teaser || null,
            m.day_of_year,
          ]
        );
        updated++;
      } else {
        await conn.execute(
          `INSERT INTO mantras (
            day_of_year, original_script, transliteration, english_translation,
            tradition, intention, phonetic_guide, sacred_geometry_type,
            context_note, go_deeper_teaser
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            m.day_of_year,
            m.original_script,
            m.transliteration,
            m.english_translation,
            m.tradition,
            m.intention || null,
            m.phonetic_guide || null,
            m.sacred_geometry_type || 'lotus',
            m.context_note || null,
            m.go_deeper_teaser || null,
          ]
        );
        inserted++;
      }

      if ((inserted + updated) % 50 === 0) {
        process.stdout.write(`  Progress: ${inserted + updated}/365...\r`);
      }
    }

    console.log(`\n✅ Done! Inserted: ${inserted}, Updated: ${updated}\n`);

    // Print tradition breakdown
    const [rows] = await conn.execute(
      'SELECT tradition, COUNT(*) as count FROM mantras GROUP BY tradition ORDER BY tradition'
    );
    console.log('📊 Tradition breakdown:');
    rows.forEach(r => console.log(`   ${r.tradition.padEnd(20)} ${r.count} mantras`));
    console.log('');

  } finally {
    await conn.end();
  }
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
