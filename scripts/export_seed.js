const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
  const conn = await mysql.createConnection({
    host: 'maglev.proxy.rlwy.net',
    port: 57722,
    user: 'root',
    password: 'REDACTED',
    database: 'railway',
  });

  const [rows] = await conn.query('SELECT * FROM mantras ORDER BY day_of_year');
  
  let sql = '-- Minute Mantra — 365 Mantra Records\n';
  sql += '-- Exported from Railway MySQL production database\n\n';
  sql += 'INSERT INTO mantras\n';
  sql += '  (day_of_year, original_script, transliteration, english_translation,\n';
  sql += '   tradition, intention, phonetic_guide, audio_filename, go_deeper_url,\n';
  sql += '   go_deeper_teaser, context_note, sacred_geometry_type)\nVALUES\n';

  rows.forEach((r, i) => {
    const esc = (s) => (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const line = `  (${r.day_of_year}, '${esc(r.original_script)}', '${esc(r.transliteration)}', '${esc(r.english_translation)}', '${esc(r.tradition)}', '${esc(r.intention)}', '${esc(r.phonetic_guide)}', '${esc(r.audio_filename)}', '${esc(r.go_deeper_url)}', '${esc(r.go_deeper_teaser)}', '${esc(r.context_note)}', '${esc(r.sacred_geometry_type)}')`;
    sql += line + (i < rows.length - 1 ? ',\n' : ';\n');
  });

  fs.writeFileSync('seeds/mantras.sql', sql);
  console.log('Exported ' + rows.length + ' mantras to seeds/mantras.sql');
  await conn.end();
}

run().catch(console.error);
