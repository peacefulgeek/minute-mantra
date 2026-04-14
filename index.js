require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Railway's proxy so rate limiter works correctly
app.set('trust proxy', 1);

// Security & middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://web.squarecdn.com", "https://sandbox.web.squarecdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://minute-mantra.b-cdn.net", "https://cdn.minutemantra.com"],
      mediaSrc: ["'self'", "https://minute-mantra.b-cdn.net", "https://cdn.minutemantra.com"],
      connectSrc: ["'self'", "https://web.squarecdn.com", "https://minute-mantra.b-cdn.net", "https://cdn.minutemantra.com"],
    },
  },
}));
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://minutemantra.com', 'https://www.minutemantra.com']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mantras', require('./routes/mantras'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/unsubscribe', require('./routes/unsubscribe'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: 'v14-auto-update', timestamp: new Date().toISOString() });
});

// Build version — changes on every deploy, used by PWA auto-update
const BUILD_VERSION = Date.now().toString(36);
app.get('/api/version', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ version: BUILD_VERSION });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(process.cwd(), 'client', 'dist');
  app.use(express.static(clientBuild, {
    maxAge: '1y',
    etag: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// Run DB migrations on startup
const { query } = require('./config/db');
(async () => {
  try {
    await query("ALTER TABLE users MODIFY COLUMN subscription_tier ENUM('free','premium','platinum','gold') DEFAULT 'free'");
    await query("ALTER TABLE users MODIFY COLUMN subscription_plan ENUM('monthly','annual','admin_granted','none') DEFAULT 'none'");
    // Migrate existing platinum users to gold
    await query("UPDATE users SET subscription_tier = 'gold' WHERE subscription_tier = 'platinum'");
    // Add free_mantras_used counter for 3-free-then-paywall
    try {
      await query("ALTER TABLE users ADD COLUMN free_mantras_used INT DEFAULT 0");
      console.log('DB migration: free_mantras_used column added');
    } catch (e) { /* already exists */ }
    // Add role column if it doesn't exist
    try {
      await query("ALTER TABLE users ADD COLUMN role ENUM('user','admin') DEFAULT 'user'");
      console.log('DB migration: role column added');
    } catch (e) {
      // Column already exists — ignore
    }
    // Ensure paul@creativelab.tv is always admin in DB
    await query("UPDATE users SET role = 'admin' WHERE email = 'paul@creativelab.tv'");
    console.log('DB migration: subscription ENUMs and role column updated');

    // One-time migration: update audio_filename to new naming convention (001_Om_Namah_Shivaya_.wav)
    const [mantras] = await require('./config/db').getPool().query('SELECT id, day_of_year, transliteration FROM mantras ORDER BY day_of_year');
    let audioUpdated = 0;
    for (const m of mantras) {
      const dayStr = String(m.day_of_year).padStart(3, '0');
      const nameSlug = m.transliteration
        .replace(/[\u2014\u2013:;,.\'\"\u201C\u201D\u2018\u2019!?()]/g, '')
        .trim()
        .substring(0, 20)
        .replace(/\s+/g, '_')
        .replace(/_+$/, '');
      const newFilename = `${dayStr}_${nameSlug}_.wav`;
      if (m.audio_filename !== newFilename) {
        await query('UPDATE mantras SET audio_filename = ? WHERE id = ?', [newFilename, m.id]);
        audioUpdated++;
      }
    }
    if (audioUpdated > 0) console.log(`DB migration: updated ${audioUpdated} audio filenames to new convention`);
  } catch (err) {
    // Ignore if already migrated or table doesn't exist yet
    console.log('DB migration note:', err.message);
  }
})();

// Start cron jobs
const { startScheduler } = require('./services/scheduler');
startScheduler();

app.listen(PORT, () => {
  console.log(`Minute Mantra server v13-gold-tier running on port ${PORT}`);
});

module.exports = app;

