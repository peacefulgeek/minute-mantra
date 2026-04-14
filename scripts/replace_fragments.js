const mysql = require('mysql2/promise');

// 29 fragment days to replace
const FRAGMENT_DAYS = [
  41, 43, 53, 54, 55, 129, 130, 131, 132, 133, 134, 135,
  138, 139, 140, 166, 167, 170, 171, 172, 173, 179,
  196, 197, 212, 223, 354, 355, 357
];

// 29 new standalone Sanskrit mantras
// Distribution: 5 Lakshmi, 5 Saraswati, 5 Rama, 4 Skanda/Murugan, 3 Amitabha/Buddhist, 4 Ganesh, 3 Hanuman
const REPLACEMENTS = [
  // === LAKSHMI (vedic_shakti) ===
  {
    day: 41, original_script: 'ॐ श्रीं लक्ष्म्यै नमः', transliteration: 'Om Shrim Lakshmyai Namah',
    english_translation: 'Om, with the seed of abundance, I bow to Lakshmi.',
    tradition: 'vedic_shakti', intention: 'Abundance',
    phonetic_guide: 'OHM shreem LAHKSH-myay nah-MAH',
    audio_filename: 'mantra-041.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Shrim: the seed sound of abundance →',
    context_note: 'Shrim is the bija mantra of Lakshmi — the seed vibration of abundance, beauty, and grace. Combined with her name, it invokes her full blessing.',
    sacred_geometry_type: 'lotus'
  },
  {
    day: 43, original_script: 'ॐ महालक्ष्म्यै नमः', transliteration: 'Om Mahalakshmyai Namah',
    english_translation: 'Om, I bow to the great Lakshmi — the supreme goddess of wealth.',
    tradition: 'vedic_shakti', intention: 'Prosperity',
    phonetic_guide: 'OHM mah-hah-LAHKSH-myay nah-MAH',
    audio_filename: 'mantra-043.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'The eight forms of Lakshmi and what they give →',
    context_note: 'Mahalakshmi — "great Lakshmi" — is the supreme form of the goddess who presides over all eight forms of wealth: material, spiritual, courage, progeny, victory, knowledge, food, and bliss.',
    sacred_geometry_type: 'flower_of_life'
  },
  {
    day: 53, original_script: 'ॐ कमलवासिन्यै नमः', transliteration: 'Om Kamalavासinyai Namah',
    english_translation: 'Om, I bow to the one who dwells in the lotus.',
    tradition: 'vedic_shakti', intention: 'Purity',
    phonetic_guide: 'OHM kah-mah-lah-VAH-sin-yay nah-MAH',
    audio_filename: 'mantra-053.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Why Lakshmi sits on a lotus →',
    context_note: 'Kamalavasini — "dweller in the lotus" — Lakshmi sits on a lotus that rises from muddy water yet remains pure. She teaches that true wealth is untouched by worldly corruption.',
    sacred_geometry_type: 'lotus'
  },
  {
    day: 54, original_script: 'ॐ श्रीं ह्रीं श्रीं लक्ष्मी', transliteration: 'Om Shrim Hrim Shrim Lakshmi',
    english_translation: 'Om — abundance, heart, abundance — Lakshmi.',
    tradition: 'vedic_shakti', intention: 'Heart Wealth',
    phonetic_guide: 'OHM shreem hreem shreem LAHK-shmee',
    audio_filename: 'mantra-054.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'The bija mantras of the heart and wealth →',
    context_note: 'A powerful combination of Lakshmi bija mantras. Shrim invokes abundance; Hrim opens the heart. Together they attract wealth that flows from love.',
    sacred_geometry_type: 'sri_yantra'
  },
  {
    day: 55, original_script: 'ॐ ऐश्वर्यलक्ष्म्यै नमः', transliteration: 'Om Aishwaryalakshmyai Namah',
    english_translation: 'Om, I bow to Lakshmi of sovereignty and divine wealth.',
    tradition: 'vedic_shakti', intention: 'Sovereignty',
    phonetic_guide: 'OHM aysh-wahr-yah-LAHKSH-myay nah-MAH',
    audio_filename: 'mantra-055.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Aishwarya: the wealth that is inner sovereignty →',
    context_note: 'Aishwarya Lakshmi is one of the Ashta Lakshmi — the eight forms. She represents not material wealth but the sovereignty of the self — the wealth of being your own master.',
    sacred_geometry_type: 'flower_of_life'
  },

  // === SARASWATI (vedic_shakti) ===
  {
    day: 129, original_script: 'ॐ सरस्वत्यै नमः', transliteration: 'Om Saraswatyai Namah',
    english_translation: 'Om, I bow to Saraswati — goddess of wisdom, music, and learning.',
    tradition: 'vedic_shakti', intention: 'Wisdom',
    phonetic_guide: 'OHM sah-rahs-WAH-tyay nah-MAH',
    audio_filename: 'mantra-129.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Saraswati: the goddess who flows like a river →',
    context_note: 'Saraswati — "the flowing one" — is the goddess of knowledge, music, art, and speech. She flows like a river through the mind, bringing clarity and creative inspiration.',
    sacred_geometry_type: 'lotus'
  },
  {
    day: 130, original_script: 'ॐ ऐं सरस्वत्यै नमः', transliteration: 'Om Aim Saraswatyai Namah',
    english_translation: 'Om, with the seed of wisdom, I bow to Saraswati.',
    tradition: 'vedic_shakti', intention: 'Learning',
    phonetic_guide: 'OHM AIM sah-rahs-WAH-tyay nah-MAH',
    audio_filename: 'mantra-130.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Aim: the bija mantra that opens the mind →',
    context_note: 'Aim is the bija mantra of Saraswati — the seed sound of knowledge and speech. Chanting it before study or creative work opens the channels of learning.',
    sacred_geometry_type: 'seed_of_life'
  },
  {
    day: 131, original_script: 'ॐ वाग्देव्यै नमः', transliteration: 'Om Vagdevyai Namah',
    english_translation: 'Om, I bow to the goddess of speech.',
    tradition: 'vedic_shakti', intention: 'Expression',
    phonetic_guide: 'OHM vahg-DAY-vyay nah-MAH',
    audio_filename: 'mantra-131.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Sacred speech: how words shape reality →',
    context_note: 'Vagdevi — "goddess of speech" — is Saraswati as the power behind all language. Every word spoken with awareness becomes a creative act.',
    sacred_geometry_type: 'flower_of_life'
  },
  {
    day: 132, original_script: 'ॐ वीणापुस्तकधारिण्यै नमः', transliteration: 'Om Vinapustakadharinyai Namah',
    english_translation: 'Om, I bow to the one who holds the veena and the book.',
    tradition: 'vedic_shakti', intention: 'Art',
    phonetic_guide: 'OHM vee-nah-poos-tah-kah-DHAH-rin-yay nah-MAH',
    audio_filename: 'mantra-132.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'The veena and the book: art and knowledge united →',
    context_note: 'Saraswati holds a veena (stringed instrument) and a book — the union of art and knowledge. True wisdom is both intellectual and creative.',
    sacred_geometry_type: 'lotus'
  },
  {
    day: 133, original_script: 'ॐ हंसवाहिन्यै नमः', transliteration: 'Om Hamsavaहinyai Namah',
    english_translation: 'Om, I bow to the one whose vehicle is the swan.',
    tradition: 'vedic_shakti', intention: 'Discernment',
    phonetic_guide: 'OHM hahm-sah-VAH-hin-yay nah-MAH',
    audio_filename: 'mantra-133.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'The swan: the symbol of spiritual discernment →',
    context_note: 'Saraswati rides a swan — the hamsa — which in legend can separate milk from water. This represents viveka, the power of discernment between the real and the unreal.',
    sacred_geometry_type: 'seed_of_life'
  },

  // === RAMA (vedic_vishnu) ===
  {
    day: 134, original_script: 'ॐ रामाय नमः', transliteration: 'Om Ramaya Namah',
    english_translation: 'Om, I bow to Rama — the embodiment of dharma.',
    tradition: 'vedic_vishnu', intention: 'Righteousness',
    phonetic_guide: 'OHM RAH-mah-yah nah-MAH',
    audio_filename: 'mantra-134.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Rama: the ideal of dharmic living →',
    context_note: 'Rama — the seventh avatar of Vishnu — embodies dharma in human form. His name means "one who delights" and is considered one of the most powerful mantras in existence.',
    sacred_geometry_type: 'flower_of_life'
  },
  {
    day: 135, original_script: 'ॐ सीतारामाय नमः', transliteration: 'Om Sitaramaya Namah',
    english_translation: 'Om, I bow to Sita and Rama — the divine couple.',
    tradition: 'vedic_vishnu', intention: 'Sacred Union',
    phonetic_guide: 'OHM see-tah-RAH-mah-yah nah-MAH',
    audio_filename: 'mantra-135.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Sita and Rama: devotion beyond separation →',
    context_note: 'Sita and Rama together represent the perfect union of shakti and consciousness, devotion and dharma. Their love story is the heart of the Ramayana.',
    sacred_geometry_type: 'lotus'
  },
  {
    day: 138, original_script: 'ॐ दशरथनन्दनाय नमः', transliteration: 'Om Dasharathanandanaya Namah',
    english_translation: 'Om, I bow to the beloved son of Dasharatha.',
    tradition: 'vedic_vishnu', intention: 'Devotion',
    phonetic_guide: 'OHM dah-shah-rah-thah-NAHN-dah-nah-yah nah-MAH',
    audio_filename: 'mantra-138.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'The Ramayana: the world\'s first epic poem →',
    context_note: 'Dasharathanandana — "joy of Dasharatha" — honors Rama as the beloved son. Even God incarnate honored his father and family. Devotion begins at home.',
    sacred_geometry_type: 'flower_of_life'
  },
  {
    day: 139, original_script: 'ॐ रघुनाथाय नमः', transliteration: 'Om Raghunathaya Namah',
    english_translation: 'Om, I bow to the lord of the Raghu dynasty.',
    tradition: 'vedic_vishnu', intention: 'Leadership',
    phonetic_guide: 'OHM rah-ghoo-NAH-thah-yah nah-MAH',
    audio_filename: 'mantra-139.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'The Raghu dynasty: a lineage of dharmic kings →',
    context_note: 'Raghunatha — "lord of the Raghu clan" — honors Rama as the ideal leader who rules with dharma, compassion, and selfless service.',
    sacred_geometry_type: 'seed_of_life'
  },
  {
    day: 140, original_script: 'ॐ रामचन्द्राय नमः', transliteration: 'Om Ramachandraya Namah',
    english_translation: 'Om, I bow to Ramachandra — Rama who is gentle as the moon.',
    tradition: 'vedic_vishnu', intention: 'Gentleness',
    phonetic_guide: 'OHM rah-mah-CHAHN-drah-yah nah-MAH',
    audio_filename: 'mantra-140.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'The moon-like qualities of Rama →',
    context_note: 'Ramachandra — "Rama who is like the moon" — the moon is cool, gentle, and illuminates without burning. Rama\'s strength was always tempered with tenderness.',
    sacred_geometry_type: 'lotus'
  },

  // === SKANDA / MURUGAN (vedic_shiva — son of Shiva) ===
  {
    day: 166, original_script: 'ॐ शरवणभवाय नमः', transliteration: 'Om Sharavanabhavaya Namah',
    english_translation: 'Om, I bow to the one born in the forest of reeds.',
    tradition: 'vedic_shiva', intention: 'Divine Birth',
    phonetic_guide: 'OHM shah-rah-vah-nah-BHAH-vah-yah nah-MAH',
    audio_filename: 'mantra-166.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Skanda: the warrior son of Shiva →',
    context_note: 'Sharavanabhava — "born in the reed forest" — is Skanda/Murugan, the six-faced son of Shiva. Born to defeat the demon Tarakasura, he represents the focused power of divine will.',
    sacred_geometry_type: 'sri_yantra'
  },
  {
    day: 167, original_script: 'ॐ मुरुगाय नमः', transliteration: 'Om Murugaya Namah',
    english_translation: 'Om, I bow to Muruga — the beautiful, divine youth.',
    tradition: 'vedic_shiva', intention: 'Youthfulness',
    phonetic_guide: 'OHM moo-ROO-gah-yah nah-MAH',
    audio_filename: 'mantra-167.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Murugan: the eternally young warrior god →',
    context_note: 'Muruga — "the beautiful one" — is the Tamil name for Skanda. He is the eternally youthful warrior who wields the vel (spear) of wisdom.',
    sacred_geometry_type: 'flower_of_life'
  },
  {
    day: 170, original_script: 'ॐ सुब्रह्मण्याय नमः', transliteration: 'Om Subrahmanyaya Namah',
    english_translation: 'Om, I bow to Subrahmanya — the auspicious one dear to Brahmins.',
    tradition: 'vedic_shiva', intention: 'Sacred Knowledge',
    phonetic_guide: 'OHM soob-rah-MAHN-yah-yah nah-MAH',
    audio_filename: 'mantra-170.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Subrahmanya: the teacher of the Pranava →',
    context_note: 'Subrahmanya — another name for Skanda — is the deity who taught the meaning of Om even to his father Shiva. He represents the highest spiritual knowledge.',
    sacred_geometry_type: 'sri_yantra'
  },
  {
    day: 171, original_script: 'ॐ कार्तिकेयाय नमः', transliteration: 'Om Kartikeyaya Namah',
    english_translation: 'Om, I bow to Kartikeya — the commander of the divine army.',
    tradition: 'vedic_shiva', intention: 'Discipline',
    phonetic_guide: 'OHM kahr-tih-KAY-yah-yah nah-MAH',
    audio_filename: 'mantra-171.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Kartikeya: the six-faced god of war and wisdom →',
    context_note: 'Kartikeya — "son of the Krittikas (Pleiades)" — is the commander of the gods\' army. He represents disciplined focus and the courage to face inner demons.',
    sacred_geometry_type: 'seed_of_life'
  },

  // === AMITABHA / BUDDHIST ===
  {
    day: 172, original_script: 'ॐ भैषज्यगुरु वैडूर्यप्रभाय नमः', transliteration: 'Om Bhaishajyaguru Vaiduryaprabha Namah',
    english_translation: 'Om, I bow to the Medicine Buddha — the lapis lazuli radiance.',
    tradition: 'buddhist', intention: 'Healing',
    phonetic_guide: 'OHM BHY-shah-jyah-GOO-roo vy-DOOR-yah-PRAH-bhah nah-MAH',
    audio_filename: 'mantra-172.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'The Medicine Buddha: healing body, speech, and mind →',
    context_note: 'The Medicine Buddha — Bhaishajyaguru — radiates lapis lazuli light that heals all illness of body, speech, and mind. His practice is one of the most beloved in Mahayana Buddhism.',
    sacred_geometry_type: 'lotus'
  },
  {
    day: 173, original_script: 'ॐ अमिताभाय नमः', transliteration: 'Om Amitabhaya Namah',
    english_translation: 'Om, I bow to Amitabha — the Buddha of infinite light.',
    tradition: 'buddhist', intention: 'Infinite Light',
    phonetic_guide: 'OHM ah-mih-TAH-bhah-yah nah-MAH',
    audio_filename: 'mantra-173.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Amitabha: the Buddha of the Western Pure Land →',
    context_note: 'Amitabha — "infinite light" — is the Buddha of the Western Pure Land. His light reaches all beings without exception. This mantra invokes his boundless compassion.',
    sacred_geometry_type: 'flower_of_life'
  },
  {
    day: 179, original_script: 'ॐ अमितायुस् नमः', transliteration: 'Om Amitayus Namah',
    english_translation: 'Om, I bow to Amitayus — the Buddha of infinite life.',
    tradition: 'buddhist', intention: 'Longevity',
    phonetic_guide: 'OHM ah-mih-TAH-yoos nah-MAH',
    audio_filename: 'mantra-179.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Amitayus: the long-life Buddha practice →',
    context_note: 'Amitayus — "infinite life" — is Amitabha in his longevity aspect. This mantra is chanted for long life, not of the body alone, but of awareness itself.',
    sacred_geometry_type: 'lotus'
  },

  // === GANESH (vedic_ganesha) ===
  {
    day: 196, original_script: 'ॐ लम्बोदराय नमः', transliteration: 'Om Lambodaraya Namah',
    english_translation: 'Om, I bow to the large-bellied one who contains the universe.',
    tradition: 'vedic_ganesha', intention: 'Containment',
    phonetic_guide: 'OHM lahm-BOH-dah-rah-yah nah-MAH',
    audio_filename: 'mantra-196.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Why Ganesha\'s belly holds the entire cosmos →',
    context_note: 'Lambodara — "large belly" — Ganesha\'s belly contains all the universes. Nothing is outside him. This mantra cultivates the ability to hold space for everything.',
    sacred_geometry_type: 'seed_of_life'
  },
  {
    day: 197, original_script: 'ॐ द्विमुखाय नमः', transliteration: 'Om Dvimukhaya Namah',
    english_translation: 'Om, I bow to the two-faced Ganesha who sees both worlds.',
    tradition: 'vedic_ganesha', intention: 'Dual Vision',
    phonetic_guide: 'OHM dvee-MOO-khah-yah nah-MAH',
    audio_filename: 'mantra-197.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'The 32 forms of Ganesha: seeing in all directions →',
    context_note: 'Dvimukha — "two-faced" — is a form of Ganesha who simultaneously sees the material and spiritual worlds. This mantra develops the ability to live in both.',
    sacred_geometry_type: 'seed_of_life'
  },
  {
    day: 212, original_script: 'ॐ सिद्धिविनायकाय नमः', transliteration: 'Om Siddhivinayakaya Namah',
    english_translation: 'Om, I bow to the Ganesha who grants spiritual attainment.',
    tradition: 'vedic_ganesha', intention: 'Attainment',
    phonetic_guide: 'OHM sid-dhih-vih-NAH-yah-kah-yah nah-MAH',
    audio_filename: 'mantra-212.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Siddhi: the supernatural powers of yoga →',
    context_note: 'Siddhivinayaka — "Ganesha of spiritual attainment" — is the form worshipped at the famous Siddhivinayak temple in Mumbai. Siddhi means perfection or supernatural power.',
    sacred_geometry_type: 'sri_yantra'
  },
  {
    day: 223, original_script: 'ॐ एकदन्ताय नमः', transliteration: 'Om Ekadantaya Namah',
    english_translation: 'Om, I bow to the one-tusked one — Ganesha of single-pointed focus.',
    tradition: 'vedic_ganesha', intention: 'Focus',
    phonetic_guide: 'OHM ay-kah-DAHN-tah-yah nah-MAH',
    audio_filename: 'mantra-223.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Why Ganesha broke his own tusk →',
    context_note: 'Ekadanta — "one tusk" — Ganesha broke his own tusk to use as a pen to write the Mahabharata. The single tusk represents ekagrata — single-pointed concentration.',
    sacred_geometry_type: 'seed_of_life'
  },

  // === HANUMAN (vedic_vishnu — devotee of Rama) ===
  {
    day: 354, original_script: 'ॐ हनुमते नमः', transliteration: 'Om Hanumate Namah',
    english_translation: 'Om, I bow to Hanuman — the supreme devotee.',
    tradition: 'vedic_vishnu', intention: 'Devotion',
    phonetic_guide: 'OHM hah-noo-MAH-tay nah-MAH',
    audio_filename: 'mantra-354.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Hanuman: the god who forgot his own divinity →',
    context_note: 'Hanuman — the monkey god — is the greatest devotee of Rama. He forgot his own divine powers until reminded by others. His story teaches that devotion unlocks our hidden strength.',
    sacred_geometry_type: 'flower_of_life'
  },
  {
    day: 355, original_script: 'ॐ आञ्जनेयाय नमः', transliteration: 'Om Anjaneyaya Namah',
    english_translation: 'Om, I bow to the son of Anjana — Hanuman the mighty.',
    tradition: 'vedic_vishnu', intention: 'Strength',
    phonetic_guide: 'OHM ahn-jah-NAY-yah-yah nah-MAH',
    audio_filename: 'mantra-355.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'The leap of faith: Hanuman crosses the ocean →',
    context_note: 'Anjaneya — "son of Anjana" — Hanuman leaped across the ocean to find Sita. When devotion is total, no obstacle is too great. This mantra invokes unstoppable strength.',
    sacred_geometry_type: 'seed_of_life'
  },
  {
    day: 357, original_script: 'ॐ वायुपुत्राय नमः', transliteration: 'Om Vayuputraya Namah',
    english_translation: 'Om, I bow to the son of the wind — Hanuman the swift.',
    tradition: 'vedic_vishnu', intention: 'Speed',
    phonetic_guide: 'OHM vah-yoo-POOT-rah-yah nah-MAH',
    audio_filename: 'mantra-357.mp3', go_deeper_url: 'https://paulwagner.com',
    go_deeper_teaser: 'Vayu: the wind god and father of Hanuman →',
    context_note: 'Vayuputra — "son of the wind" — Hanuman inherited the speed and power of Vayu, the wind god. This mantra invokes swift action and the breath of life itself.',
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

  // Verify fragment days exist
  const [existing] = await conn.query(
    'SELECT day_of_year, transliteration FROM mantras WHERE day_of_year IN (?)',
    [FRAGMENT_DAYS]
  );
  console.log('Found', existing.length, 'fragment entries to replace');

  // Delete fragments
  const [delResult] = await conn.query(
    'DELETE FROM mantras WHERE day_of_year IN (?)',
    [FRAGMENT_DAYS]
  );
  console.log('Deleted', delResult.affectedRows, 'fragments');

  // Insert replacements
  for (const m of REPLACEMENTS) {
    await conn.query(
      `INSERT INTO mantras (day_of_year, original_script, transliteration, english_translation,
        tradition, intention, phonetic_guide, audio_filename, go_deeper_url,
        go_deeper_teaser, context_note, sacred_geometry_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.day, m.original_script, m.transliteration, m.english_translation,
       m.tradition, m.intention, m.phonetic_guide, m.audio_filename, m.go_deeper_url,
       m.go_deeper_teaser, m.context_note, m.sacred_geometry_type]
    );
  }
  console.log('Inserted', REPLACEMENTS.length, 'new mantras');

  // Verify final count
  const [count] = await conn.query('SELECT COUNT(*) as total FROM mantras');
  console.log('Total mantras now:', count[0].total);

  // Verify by tradition
  const [traditions] = await conn.query('SELECT tradition, COUNT(*) as cnt FROM mantras GROUP BY tradition ORDER BY cnt DESC');
  console.log('By tradition:');
  traditions.forEach(t => console.log('  ' + t.tradition + ': ' + t.cnt));

  // Verify no duplicates
  const [dupes] = await conn.query('SELECT transliteration, COUNT(*) as cnt FROM mantras GROUP BY transliteration HAVING cnt > 1');
  if (dupes.length > 0) {
    console.log('WARNING - Duplicates found:');
    dupes.forEach(d => console.log('  ' + d.transliteration + ' (x' + d.cnt + ')'));
  } else {
    console.log('No duplicates - clean!');
  }

  await conn.end();
}

run().catch(e => console.error(e));
