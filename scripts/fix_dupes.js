const mysql = require('mysql2/promise');

// Replace the 5 duplicates we just created (keep the originals that were already in DB)
// Days to fix: 130, 223, 196, 212, 354
const FIXES = [
  {
    day: 130, // was dupe of day 95 Om Aim Saraswatyai Namah
    original_script: 'ॐ शारदायै नमः',
    transliteration: 'Om Sharadayai Namah',
    english_translation: 'Om, I bow to Sharada — Saraswati as the goddess of autumn and learning.',
    tradition: 'vedic_shakti', intention: 'Clarity',
    phonetic_guide: 'OHM SHAH-rah-dah-yay nah-MAH',
    audio_filename: 'mantra-130.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Sharada: the autumn goddess of clear knowledge →',
    context_note: 'Sharada — "the autumnal one" — is Saraswati as worshipped in Kashmir. Autumn is the season of clarity, when the sky is clearest and knowledge shines brightest.',
    sacred_geometry_type: 'lotus'
  },
  {
    day: 196, // was dupe of day 118 Om Lambodaraya Namah
    original_script: 'ॐ विकटाय नमः',
    transliteration: 'Om Vikataya Namah',
    english_translation: 'Om, I bow to Vikata — the unusual, extraordinary Ganesha.',
    tradition: 'vedic_ganesha', intention: 'Uniqueness',
    phonetic_guide: 'OHM vih-KAH-tah-yah nah-MAH',
    audio_filename: 'mantra-196.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Vikata: embracing what makes you different →',
    context_note: 'Vikata — "the unusual one" — is one of the twelve names of Ganesha. With an elephant head on a human body, Ganesha is the most unusual of all gods — and the most beloved. Uniqueness is divine.',
    sacred_geometry_type: 'seed_of_life'
  },
  {
    day: 212, // was dupe of day 122 Om Siddhivinayakaya Namah
    original_script: 'ॐ धूम्रवर्णाय नमः',
    transliteration: 'Om Dhumravarnaya Namah',
    english_translation: 'Om, I bow to the smoke-colored Ganesha who absorbs all negativity.',
    tradition: 'vedic_ganesha', intention: 'Purification',
    phonetic_guide: 'OHM DHOOM-rah-VAHR-nah-yah nah-MAH',
    audio_filename: 'mantra-212.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'The smoke-colored Ganesha: absorbing darkness →',
    context_note: 'Dhumravarna — "smoke-colored" — is Ganesha in his form that absorbs and neutralizes negative energies. Like smoke rising from a sacred fire, he transforms impurity into offering.',
    sacred_geometry_type: 'sri_yantra'
  },
  {
    day: 223, // was dupe of day 117 Om Ekadantaya Namah
    original_script: 'ॐ कपिलाय नमः',
    transliteration: 'Om Kapilaya Namah',
    english_translation: 'Om, I bow to Kapila — the tawny-colored Ganesha of cosmic knowledge.',
    tradition: 'vedic_ganesha', intention: 'Cosmic Knowledge',
    phonetic_guide: 'OHM kah-PIH-lah-yah nah-MAH',
    audio_filename: 'mantra-223.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Kapila: the sage who founded Sankhya philosophy →',
    context_note: 'Kapila — "the tawny one" — is one of the twelve names of Ganesha. Kapila was also the name of the great sage who founded Sankhya philosophy, the science of cosmic enumeration.',
    sacred_geometry_type: 'seed_of_life'
  },
  {
    day: 354, // was dupe of day 300 Om Hanumate Namah
    original_script: 'ॐ महावीराय नमः',
    transliteration: 'Om Mahaviraya Hanumante Namah',
    english_translation: 'Om, I bow to the great hero Hanuman.',
    tradition: 'vedic_vishnu', intention: 'Heroism',
    phonetic_guide: 'OHM mah-hah-VEE-rah-yah hah-noo-MAHN-tay nah-MAH',
    audio_filename: 'mantra-354.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Mahavira: the great hero within you →',
    context_note: 'Mahavira — "great hero" — Hanuman is the supreme example of heroism born from devotion. His strength came not from ego but from love for Rama. True heroism is selfless service.',
    sacred_geometry_type: 'flower_of_life'
  },
];

async function run() {
  const conn = await mysql.createConnection({
    host: 'maglev.proxy.rlwy.net',
    port: 57722,
    user: 'root',
    password: 'REDACTED',
    database: 'railway',
  });

  for (const m of FIXES) {
    const [result] = await conn.query(
      `UPDATE mantras SET 
        original_script = ?, transliteration = ?, english_translation = ?,
        tradition = ?, intention = ?, phonetic_guide = ?, audio_filename = ?,
        go_deeper_url = ?, go_deeper_teaser = ?, context_note = ?, sacred_geometry_type = ?
       WHERE day_of_year = ?`,
      [m.original_script, m.transliteration, m.english_translation,
       m.tradition, m.intention, m.phonetic_guide, m.audio_filename,
       m.go_deeper_url, m.go_deeper_teaser, m.context_note, m.sacred_geometry_type,
       m.day]
    );
    console.log('Updated day ' + m.day + ': ' + m.transliteration + ' (' + result.affectedRows + ' row)');
  }

  // Verify no more duplicates
  const [dupes] = await conn.query('SELECT transliteration, COUNT(*) as cnt FROM mantras GROUP BY transliteration HAVING cnt > 1');
  if (dupes.length > 0) {
    console.log('\nWARNING - Still duplicates:');
    dupes.forEach(d => console.log('  ' + d.transliteration + ' (x' + d.cnt + ')'));
  } else {
    console.log('\nAll duplicates fixed! No duplicates remain.');
  }

  const [count] = await conn.query('SELECT COUNT(*) as total FROM mantras');
  console.log('Total mantras:', count[0].total);

  await conn.end();
}

run().catch(e => console.error(e));
