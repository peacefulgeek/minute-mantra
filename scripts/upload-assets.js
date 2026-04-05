#!/usr/bin/env node
/**
 * Minute Mantra — Upload Static Assets to Bunny CDN
 * Uploads icons, images, and any other static assets.
 * Run: node scripts/upload-assets.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BUNNY_API_KEY = process.env.BUNNY_API_KEY || '2c977189-2947-4633-ab995a943f3e-c391-48ae';
const BUNNY_STORAGE_ZONE = 'minute-mantra';
const BUNNY_CDN_URL = 'https://minute-mantra.b-cdn.net';

async function uploadFile(localPath, remotePath, contentType) {
  const fileContent = fs.readFileSync(localPath);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ny.storage.bunnycdn.com',
      path: `/${BUNNY_STORAGE_ZONE}/${remotePath}`,
      method: 'PUT',
      headers: {
        AccessKey: BUNNY_API_KEY,
        'Content-Type': contentType,
        'Content-Length': fileContent.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          resolve(`${BUNNY_CDN_URL}/${remotePath}`);
        } else {
          reject(new Error(`Upload failed ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(fileContent);
    req.end();
  });
}

const ASSETS = [
  // Icons
  { local: 'tmp/icons/icon-192.png', remote: 'icons/icon-192.png', type: 'image/png' },
  { local: 'tmp/icons/icon-512.png', remote: 'icons/icon-512.png', type: 'image/png' },
  { local: 'tmp/icons/icon-maskable-512.png', remote: 'icons/icon-maskable-512.png', type: 'image/png' },
  // Images
  { local: 'tmp/images/og-image.png', remote: 'images/og-image.png', type: 'image/png' },
  { local: 'tmp/images/logo.webp', remote: 'images/logo.webp', type: 'image/webp' },
];

async function main() {
  console.log('\n📦 Uploading assets to Bunny CDN...\n');
  
  for (const asset of ASSETS) {
    const localPath = path.join(__dirname, '..', asset.local);
    if (!fs.existsSync(localPath)) {
      console.log(`  ⚠️  Skipping (not found): ${asset.local}`);
      continue;
    }
    
    process.stdout.write(`  ${asset.remote.padEnd(45)}`);
    try {
      const url = await uploadFile(localPath, asset.remote, asset.type);
      console.log(`✅ ${url}`);
    } catch (e) {
      console.log(`❌ ${e.message}`);
    }
  }
  
  console.log('\n✅ Asset upload complete!\n');
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
