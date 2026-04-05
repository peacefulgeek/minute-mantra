#!/usr/bin/env node
/**
 * Minute Mantra — ElevenLabs Audio Generation Script
 * 
 * QUALITY STRATEGY:
 * 1. Uses ElevenLabs Multilingual v2 model (best for Sanskrit/Pali/Gurmukhi)
 * 2. Tests 3 voices on a Sanskrit benchmark phrase first, picks the best
 * 3. Post-processes with ffmpeg: loudnorm -16 LUFS, silence trim
 * 4. Failed files are logged to audio-review-failures.txt (ship silence, not wrong audio)
 * 5. All files uploaded to Bunny CDN as compressed WebP-equivalent (MP3 128kbps)
 * 
 * Usage:
 *   ELEVENLABS_API_KEY=xxx node scripts/generate-audio.js [--day 1] [--tradition vedic_shiva] [--test-voices]
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const mysql = require('mysql2/promise');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const BUNNY_API_KEY = process.env.BUNNY_API_KEY || '2c977189-2947-4633-ab995a943f3e-c391-48ae';
const BUNNY_STORAGE_ZONE = 'minute-mantra';
const BUNNY_CDN_URL = 'https://minute-mantra.b-cdn.net';
const OUTPUT_DIR = path.join(__dirname, '../tmp/audio');
const FAILURES_LOG = path.join(__dirname, '../audio-review-failures.txt');

// ── Voice candidates for Sanskrit/multilingual content ──────────────────────
// These are ElevenLabs voice IDs known to handle Sanskrit well.
// Run with --test-voices to benchmark and pick the best.
const VOICE_CANDIDATES = {
  // Deep, resonant male voices — best for Sanskrit mantras
  primary: 'pNInz6obpgDQGcFmaJgB',      // Adam — deep, clear
  secondary: 'VR6AewLTigWG4xSOukaG',    // Arnold — powerful
  tertiary: 'ErXwobaYiN019PkySvjV',     // Antoni — warm
  // Fallback for Gurmukhi (Sikh mantras)
  gurmukhi: 'pNInz6obpgDQGcFmaJgB',
};

// Tradition → voice mapping
const TRADITION_VOICE = {
  vedic_shiva: VOICE_CANDIDATES.primary,
  vedic_vishnu: VOICE_CANDIDATES.primary,
  vedic_shakti: VOICE_CANDIDATES.primary,
  vedic_ganesha: VOICE_CANDIDATES.primary,
  vedic_solar: VOICE_CANDIDATES.primary,
  buddhist: VOICE_CANDIDATES.secondary,
  sikh: VOICE_CANDIDATES.gurmukhi,
  universal: VOICE_CANDIDATES.primary,
};

// ── ElevenLabs API call ──────────────────────────────────────────────────────
async function generateAudio(text, voiceId, outputPath) {
  if (!API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not set. Add it to .env');
  }

  const body = JSON.stringify({
    text: text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.75,
      similarity_boost: 0.85,
      style: 0.2,
      use_speaker_boost: true,
    },
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${voiceId}`,
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errBody = '';
        res.on('data', d => errBody += d);
        res.on('end', () => reject(new Error(`ElevenLabs API error ${res.statusCode}: ${errBody}`)));
        return;
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(outputPath, buffer);
        resolve(outputPath);
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Post-process with ffmpeg ─────────────────────────────────────────────────
function postProcess(inputPath, outputPath) {
  // loudnorm to -16 LUFS, trim silence, encode as 128kbps MP3
  const cmd = [
    'ffmpeg -y',
    `-i "${inputPath}"`,
    '-af "silenceremove=start_periods=1:start_silence=0.3:start_threshold=-50dB,',
    'silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-50dB,',
    'loudnorm=I=-16:TP=-1.5:LRA=11"',
    '-ar 44100 -ab 128k -f mp3',
    `"${outputPath}"`,
  ].join(' ').replace(/\n/g, '');

  execSync(cmd, { stdio: 'pipe' });
}

// ── Upload to Bunny CDN ──────────────────────────────────────────────────────
async function uploadToBunny(localPath, remotePath) {
  const fileContent = fs.readFileSync(localPath);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ny.storage.bunnycdn.com',
      path: `/${BUNNY_STORAGE_ZONE}/${remotePath}`,
      method: 'PUT',
      headers: {
        AccessKey: BUNNY_API_KEY,
        'Content-Type': 'audio/mpeg',
        'Content-Length': fileContent.length,
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 201 || res.statusCode === 200) {
        resolve(`${BUNNY_CDN_URL}/${remotePath}`);
      } else {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => reject(new Error(`Bunny upload failed ${res.statusCode}: ${body}`)));
      }
    });

    req.on('error', reject);
    req.write(fileContent);
    req.end();
  });
}

// ── Build the text to speak ──────────────────────────────────────────────────
function buildSpeechText(mantra) {
  // For Sikh mantras, use transliteration (Gurmukhi script not supported)
  // For all others, try original script first, fall back to transliteration
  const isSikh = mantra.tradition === 'sikh';
  
  // ElevenLabs handles Devanagari well with multilingual v2
  // For Gurmukhi, use transliteration
  const primaryText = isSikh ? mantra.transliteration : mantra.original_script;
  
  // Build the full spoken text:
  // 1. Transliteration (spoken slowly)
  // 2. Brief pause
  // 3. English meaning
  // 4. Brief pause  
  // 5. Transliteration again (for repetition)
  return `${primaryText}. ... ${mantra.english_translation}. ... ${primaryText}.`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dayFilter = args.includes('--day') ? parseInt(args[args.indexOf('--day') + 1]) : null;
  const traditionFilter = args.includes('--tradition') ? args[args.indexOf('--tradition') + 1] : null;
  const testVoices = args.includes('--test-voices');
  const dryRun = args.includes('--dry-run');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  if (testVoices) {
    console.log('\n🎙  Testing voices on Sanskrit benchmark...\n');
    const benchmark = 'ॐ नमः शिवाय। Om Namah Shivaya. I bow to Shiva.';
    for (const [name, voiceId] of Object.entries(VOICE_CANDIDATES)) {
      const outPath = path.join(OUTPUT_DIR, `voice-test-${name}.mp3`);
      console.log(`  Testing ${name} (${voiceId})...`);
      try {
        await generateAudio(benchmark, voiceId, outPath);
        console.log(`  ✅ Saved: ${outPath}`);
      } catch (e) {
        console.log(`  ❌ Failed: ${e.message}`);
      }
    }
    console.log('\nListen to the test files and update TRADITION_VOICE mapping.\n');
    return;
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'minute_mantra',
  });

  try {
    let query = 'SELECT * FROM mantras WHERE audio_url IS NULL';
    const params = [];

    if (dayFilter) {
      query += ' AND day_of_year = ?';
      params.push(dayFilter);
    }
    if (traditionFilter) {
      query += ' AND tradition = ?';
      params.push(traditionFilter);
    }

    query += ' ORDER BY day_of_year';

    const [mantras] = await conn.execute(query, params);
    console.log(`\n🎙  Generating audio for ${mantras.length} mantras...\n`);

    const failures = [];

    for (const mantra of mantras) {
      const voiceId = TRADITION_VOICE[mantra.tradition] || VOICE_CANDIDATES.primary;
      const speechText = buildSpeechText(mantra);
      const rawPath = path.join(OUTPUT_DIR, `day-${mantra.day_of_year}-raw.mp3`);
      const finalPath = path.join(OUTPUT_DIR, `day-${mantra.day_of_year}.mp3`);
      const remotePath = `audio/day-${mantra.day_of_year}.mp3`;

      process.stdout.write(`  Day ${String(mantra.day_of_year).padStart(3)}: ${mantra.transliteration.substring(0, 40).padEnd(40)}`);

      if (dryRun) {
        console.log(' [DRY RUN]');
        continue;
      }

      let attempts = 0;
      let success = false;

      while (attempts < 3 && !success) {
        attempts++;
        try {
          // Generate
          await generateAudio(speechText, voiceId, rawPath);
          
          // Post-process
          postProcess(rawPath, finalPath);
          
          // Upload
          const cdnUrl = await uploadToBunny(finalPath, remotePath);
          
          // Update DB
          await conn.execute(
            'UPDATE mantras SET audio_url = ? WHERE id = ?',
            [cdnUrl, mantra.id]
          );

          // Cleanup temp files
          if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
          if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);

          console.log(` ✅ ${cdnUrl}`);
          success = true;

          // Rate limit: 2 req/sec max on ElevenLabs free tier
          await new Promise(r => setTimeout(r, 600));

        } catch (e) {
          if (attempts < 3) {
            process.stdout.write(` [retry ${attempts}]`);
            await new Promise(r => setTimeout(r, 2000));
          } else {
            console.log(` ❌ FAILED after 3 attempts: ${e.message}`);
            failures.push({ day: mantra.day_of_year, transliteration: mantra.transliteration, error: e.message });
          }
        }
      }
    }

    if (failures.length > 0) {
      const failureText = failures.map(f => 
        `Day ${f.day}: ${f.transliteration}\n  Error: ${f.error}`
      ).join('\n\n');
      fs.writeFileSync(FAILURES_LOG, `Audio Generation Failures\n${'='.repeat(40)}\n\n${failureText}\n`);
      console.log(`\n⚠️  ${failures.length} failures logged to: ${FAILURES_LOG}`);
      console.log('   These mantras will show no audio in the app (silence is better than wrong audio).\n');
    }

    console.log('\n✅ Audio generation complete!\n');

  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
