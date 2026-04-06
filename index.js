require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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
  res.json({ status: 'ok', version: 'v2-csp-fix', timestamp: new Date().toISOString() });
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

// Start cron jobs
const { startScheduler } = require('./services/scheduler');
startScheduler();

app.listen(PORT, () => {
  console.log(`Minute Mantra server running on port ${PORT}`);
});

module.exports = app;
// deploy trigger Mon Apr  6 17:13:07 EDT 2026
