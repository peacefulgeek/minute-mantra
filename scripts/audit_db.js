const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: 'maglev.proxy.rlwy.net',
    port: 57722,
    user: 'root',
    password: 'REDACTED',
    database: 'railway',
  });

  // Find mantras where original_script looks English (no Unicode chars above 255)
  const [all] = await conn.query('SELECT day_of_year, original_script, transliteration, tradition, intention, english_translation FROM mantras ORDER BY day_of_year');
  
  console.log('Total mantras:', all.length);
  console.log('');
  
  // English mantras (ASCII only in original_script)
  const english = all.filter(m => {
    return [...m.original_script].every(c => c.charCodeAt(0) < 256);
  });
  console.log('=== ENGLISH-LANGUAGE MANTRAS ===');
  console.log('Count:', english.length);
  english.forEach(m => {
    console.log(`  Day ${m.day_of_year}: [${m.tradition}] "${m.original_script}" (${m.intention})`);
  });
  
  console.log('');
  
  // Duplicates by transliteration
  const seen = {};
  const dupes = [];
  all.forEach(m => {
    if (seen[m.transliteration]) {
      dupes.push({ day: m.day_of_year, translit: m.transliteration, firstDay: seen[m.transliteration] });
    } else {
      seen[m.transliteration] = m.day_of_year;
    }
  });
  console.log('=== DUPLICATES ===');
  console.log('Count:', dupes.length);
  dupes.forEach(d => {
    console.log(`  Day ${d.day}: "${d.translit}" (first seen day ${d.firstDay})`);
  });
  
  console.log('');
  
  // Long prayers (transliteration > 60 chars)
  const long = all.filter(m => m.transliteration.length > 60);
  console.log('=== LONG TRANSLITERATIONS (>60 chars) ===');
  console.log('Count:', long.length);
  long.forEach(m => {
    console.log(`  Day ${m.day_of_year}: "${m.transliteration}" (${m.transliteration.length} chars)`);
  });
  
  console.log('');
  
  // Check for fragment keywords in context
  const [withContext] = await conn.query('SELECT day_of_year, transliteration, context_note FROM mantras ORDER BY day_of_year');
  const fragments = withContext.filter(m => {
    const ctx = (m.context_note || '').toLowerCase();
    return ctx.includes('line of the') || ctx.includes('second line') || ctx.includes('third line') || 
           ctx.includes('final line') || ctx.includes('opening of the') || ctx.includes('concluding line') ||
           ctx.includes('first two lines') || ctx.includes('final two lines');
  });
  console.log('=== PRAYER FRAGMENTS (based on context_note) ===');
  console.log('Count:', fragments.length);
  fragments.forEach(m => {
    console.log(`  Day ${m.day_of_year}: "${m.transliteration}"`);
  });

  await conn.end();
}

check().catch(e => console.error(e));
