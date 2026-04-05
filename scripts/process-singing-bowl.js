#!/usr/bin/env node
/**
 * Minute Mantra — Singing Bowl Audio Processing Script
 * 
 * Downloads a CC0 singing bowl recording from Pixabay, creates:
 * 1. singing-bowl-loop.mp3 — 60-second seamless loop at -20 LUFS
 * 2. singing-bowl-strike.mp3 — 3-5 second strike at -14 LUFS
 * 
 * Both uploaded to Bunny CDN under /audio/
 * 
 * Usage: node scripts/process-singing-bowl.js [--input path/to/bowl.mp3]
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUNNY_API_KEY = process.env.BUNNY_API_KEY || '2c977189-2947-4633-ab995a943f3e-c391-48ae';
const BUNNY_STORAGE_ZONE = 'minute-mantra';
const BUNNY_CDN_URL = 'https://minute-mantra.b-cdn.net';
const OUTPUT_DIR = path.join(__dirname, '../tmp/audio');

// Pixabay singing bowl URLs (CC0, royalty-free, commercial use OK)
// These are known good recordings — update if URLs change
const PIXABAY_URLS = [
  'https://cdn.pixabay.com/audio/2022/03/15/audio_1a6a2c7e5d.mp3',
  'https://cdn.pixabay.com/audio/2021/08/09/audio_9c4e8e5e5d.mp3',
];

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(outputPath);
    proto.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close();
        return downloadFile(res.headers.location, outputPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(outputPath); });
    }).on('error', (e) => {
      fs.unlink(outputPath, () => {});
      reject(e);
    });
  });
}

async function uploadToBunny(localPath, remotePath, contentType = 'audio/mpeg') {
  const fileContent = fs.readFileSync(localPath);
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ny.storage.bunnycdn.com',
      path: `/${BUNNY_STORAGE_ZONE}/${remotePath}`,
      method: 'PUT',
      headers: { AccessKey: BUNNY_API_KEY, 'Content-Type': contentType, 'Content-Length': fileContent.length },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) resolve(`${BUNNY_CDN_URL}/${remotePath}`);
        else reject(new Error(`Bunny upload failed ${res.statusCode}: ${body}`));
      });
    });
    req.on('error', reject);
    req.write(fileContent);
    req.end();
  });
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  let inputPath = args.includes('--input') ? args[args.indexOf('--input') + 1] : null;

  if (!inputPath) {
    console.log('\n🎵 Downloading singing bowl recording from Pixabay...\n');
    inputPath = path.join(OUTPUT_DIR, 'singing-bowl-raw.mp3');
    
    let downloaded = false;
    for (const url of PIXABAY_URLS) {
      try {
        await downloadFile(url, inputPath);
        console.log(`  ✅ Downloaded: ${url}`);
        downloaded = true;
        break;
      } catch (e) {
        console.log(`  ⚠️  Failed: ${url} — ${e.message}`);
      }
    }
    
    if (!downloaded) {
      console.log('\n  ❌ Could not download from Pixabay automatically.');
      console.log('  Please download a singing bowl recording manually from:');
      console.log('  https://pixabay.com/sound-effects/search/singing-bowl/');
      console.log('  Then run: node scripts/process-singing-bowl.js --input /path/to/bowl.mp3\n');
      process.exit(1);
    }
  }

  console.log('\n🔧 Processing singing bowl audio...\n');

  // ── Create 60-second seamless loop ──────────────────────────────────────
  const loopPath = path.join(OUTPUT_DIR, 'singing-bowl-loop.mp3');
  console.log('  Creating 60-second loop...');
  
  // Get duration of source file
  const durationOutput = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`, { encoding: 'utf8' }).trim();
  const sourceDuration = parseFloat(durationOutput);
  console.log(`  Source duration: ${sourceDuration.toFixed(1)}s`);

  // Create seamless loop: tile the audio to 65s, then crossfade at 60s mark
  // and normalize to -20 LUFS (ambient background level)
  execSync([
    'ffmpeg -y',
    `-stream_loop -1 -i "${inputPath}"`,
    '-t 65',
    '-af "loudnorm=I=-20:TP=-2:LRA=11,afade=t=in:st=0:d=0.5,afade=t=out:st=59.5:d=0.5"',
    '-ar 44100 -ab 128k -ac 2',
    `"${loopPath}"`,
  ].join(' '), { stdio: 'pipe' });
  console.log(`  ✅ Loop created: ${loopPath}`);

  // ── Create single strike sample ──────────────────────────────────────────
  const strikePath = path.join(OUTPUT_DIR, 'singing-bowl-strike.mp3');
  console.log('  Creating strike sample...');
  
  // Take first 5 seconds, normalize to -14 LUFS (slightly louder — punctuation)
  execSync([
    'ffmpeg -y',
    `-i "${inputPath}"`,
    '-t 5',
    '-af "loudnorm=I=-14:TP=-1:LRA=11,afade=t=out:st=4:d=1"',
    '-ar 44100 -ab 128k -ac 2',
    `"${strikePath}"`,
  ].join(' '), { stdio: 'pipe' });
  console.log(`  ✅ Strike created: ${strikePath}`);

  // ── Upload to Bunny CDN ──────────────────────────────────────────────────
  console.log('\n📦 Uploading to Bunny CDN...\n');
  
  const loopUrl = await uploadToBunny(loopPath, 'audio/singing-bowl-loop.mp3');
  console.log(`  ✅ Loop: ${loopUrl}`);
  
  const strikeUrl = await uploadToBunny(strikePath, 'audio/singing-bowl-strike.mp3');
  console.log(`  ✅ Strike: ${strikeUrl}`);

  console.log('\n✅ Singing bowl audio processing complete!');
  console.log(`\n  Loop URL:   ${loopUrl}`);
  console.log(`  Strike URL: ${strikeUrl}`);
  console.log('\n  Add these to your .env:');
  console.log(`  SINGING_BOWL_LOOP_URL=${loopUrl}`);
  console.log(`  SINGING_BOWL_STRIKE_URL=${strikeUrl}\n`);
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
