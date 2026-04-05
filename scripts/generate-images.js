#!/usr/bin/env node
/**
 * Minute Mantra — Hero Image Generation + Bunny CDN Upload Script
 * 
 * Generates tradition-specific hero images using AI, compresses to WebP,
 * and uploads to Bunny CDN at minute-mantra.b-cdn.net/images/
 * 
 * Usage:
 *   node scripts/generate-images.js [--tradition vedic_shiva] [--day 1]
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mysql = require('mysql2/promise');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BUNNY_API_KEY = process.env.BUNNY_API_KEY || '2c977189-2947-4633-ab995a943f3e-c391-48ae';
const BUNNY_STORAGE_ZONE = 'minute-mantra';
const BUNNY_CDN_URL = 'https://minute-mantra.b-cdn.net';
const OUTPUT_DIR = path.join(__dirname, '../tmp/images');

// ── Tradition → image prompt templates ──────────────────────────────────────
const TRADITION_PROMPTS = {
  vedic_shiva: (m) => `Sacred Hindu art, Shiva deity, ${m.intention} theme, deep indigo and silver colors, sacred geometry, mandala background, photorealistic spiritual illustration, no text`,
  vedic_vishnu: (m) => `Sacred Hindu art, Vishnu deity, ${m.intention} theme, golden and blue colors, lotus flowers, sacred geometry, photorealistic spiritual illustration, no text`,
  vedic_shakti: (m) => `Sacred Hindu art, Devi goddess, ${m.intention} theme, crimson and gold colors, yantra geometry, divine feminine energy, photorealistic spiritual illustration, no text`,
  vedic_ganesha: (m) => `Sacred Hindu art, Ganesha deity, ${m.intention} theme, orange and gold colors, sacred geometry, elephant head, photorealistic spiritual illustration, no text`,
  vedic_solar: (m) => `Sacred Hindu art, Surya sun deity, ${m.intention} theme, golden sunrise colors, solar rays, sacred geometry, photorealistic spiritual illustration, no text`,
  buddhist: (m) => `Tibetan Buddhist thangka art style, ${m.intention} theme, lotus flowers, gold and jewel tones, sacred geometry, serene meditation atmosphere, photorealistic spiritual illustration, no text`,
  sikh: (m) => `Sikh spiritual art, Ik Onkar symbol, ${m.intention} theme, golden and blue colors, Harmandir Sahib architecture, sacred geometry, photorealistic spiritual illustration, no text`,
  universal: (m) => `Universal spiritual art, ${m.intention} theme, sacred geometry, cosmic consciousness, rainbow light, lotus, photorealistic spiritual illustration, no text`,
};

// ── Generate image via OpenAI DALL-E 3 ──────────────────────────────────────
async function generateImage(prompt, outputPath) {
  const body = JSON.stringify({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    response_format: 'url',
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          const imageUrl = parsed.data[0].url;
          // Download the image
          downloadFile(imageUrl, outputPath).then(resolve).catch(reject);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\nResponse: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : require('http');
    const file = fs.createWriteStream(outputPath);
    proto.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(outputPath); });
    }).on('error', (e) => {
      fs.unlink(outputPath, () => {});
      reject(e);
    });
  });
}

// ── Compress PNG to WebP ─────────────────────────────────────────────────────
function compressToWebP(inputPath, outputPath) {
  // Convert to WebP at quality 82, resize to 800x800 for mobile
  execSync(`ffmpeg -y -i "${inputPath}" -vf "scale=800:800:force_original_aspect_ratio=decrease,pad=800:800:(ow-iw)/2:(oh-ih)/2" -quality 82 "${outputPath}"`, { stdio: 'pipe' });
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
        'Content-Type': 'image/webp',
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

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dayFilter = args.includes('--day') ? parseInt(args[args.indexOf('--day') + 1]) : null;
  const traditionFilter = args.includes('--tradition') ? args[args.indexOf('--tradition') + 1] : null;

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'minute_mantra',
  });

  try {
    let query = 'SELECT * FROM mantras WHERE hero_image_url IS NULL';
    const params = [];

    if (dayFilter) { query += ' AND day_of_year = ?'; params.push(dayFilter); }
    if (traditionFilter) { query += ' AND tradition = ?'; params.push(traditionFilter); }
    query += ' ORDER BY day_of_year';

    const [mantras] = await conn.execute(query, params);
    console.log(`\n🖼  Generating images for ${mantras.length} mantras...\n`);

    for (const mantra of mantras) {
      const promptFn = TRADITION_PROMPTS[mantra.tradition] || TRADITION_PROMPTS.universal;
      const prompt = promptFn(mantra);
      const rawPath = path.join(OUTPUT_DIR, `day-${mantra.day_of_year}-raw.png`);
      const webpPath = path.join(OUTPUT_DIR, `day-${mantra.day_of_year}.webp`);
      const remotePath = `images/day-${mantra.day_of_year}.webp`;

      process.stdout.write(`  Day ${String(mantra.day_of_year).padStart(3)}: ${mantra.transliteration.substring(0, 35).padEnd(35)}`);

      try {
        await generateImage(prompt, rawPath);
        compressToWebP(rawPath, webpPath);
        const cdnUrl = await uploadToBunny(webpPath, remotePath);

        await conn.execute(
          'UPDATE mantras SET hero_image_url = ? WHERE id = ?',
          [cdnUrl, mantra.id]
        );

        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
        if (fs.existsSync(webpPath)) fs.unlinkSync(webpPath);

        console.log(` ✅`);
        await new Promise(r => setTimeout(r, 1200)); // Rate limit

      } catch (e) {
        console.log(` ❌ ${e.message}`);
      }
    }

    console.log('\n✅ Image generation complete!\n');

  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
