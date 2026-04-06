const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// Load and cache the morning email template
let _templateCache = null;
function loadTemplate() {
  if (!_templateCache) {
    const templatePath = path.join(__dirname, 'templates/morning-mantra.html');
    _templateCache = fs.readFileSync(templatePath, 'utf8');
  }
  return _templateCache;
}

const TRADITION_DISPLAY = {
  vedic_shiva: 'Vedic / Shaivite',
  vedic_vishnu: 'Vedic / Vaishnava',
  vedic_shakti: 'Vedic / Shakta',
  vedic_ganesha: 'Vedic / Ganapatya',
  vedic_solar: 'Vedic / Saura',
  buddhist: 'Buddhist',
  sikh: 'Sikh / Gurbani',
  universal: 'Universal',
};

function getMorningEmailHtml(mantra, unsubscribeUrl) {
  const appUrl = process.env.APP_URL || 'https://minutemantra.com';
  const address = process.env.COMPANY_ADDRESS || 'Creative Lab Agency LLC, Wyoming';

  let html = loadTemplate();

  // Replace {{#if go_deeper_url}} ... {{/if}} blocks
  if (mantra.go_deeper_url) {
    html = html.replace(/\{\{#if go_deeper_url\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    html = html.replace(/\{\{#if go_deeper_url\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  // Replace all template variables
  html = html
    .replace(/\{\{transliteration\}\}/g, mantra.transliteration || '')
    .replace(/\{\{original_script\}\}/g, mantra.original_script || '')
    .replace(/\{\{english_translation\}\}/g, mantra.english_translation || '')
    .replace(/\{\{phonetic_guide\}\}/g, mantra.phonetic_guide || '')
    .replace(/\{\{tradition_display\}\}/g, TRADITION_DISPLAY[mantra.tradition] || mantra.tradition)
    .replace(/\{\{intention\}\}/g, mantra.intention || '')
    .replace(/\{\{context_note\}\}/g, mantra.context_note || '')
    .replace(/\{\{go_deeper_teaser\}\}/g, mantra.go_deeper_teaser || '')
    .replace(/\{\{go_deeper_url\}\}/g, mantra.go_deeper_url || appUrl)
    .replace(/\{\{app_url\}\}/g, appUrl)
    .replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl)
    .replace(/\{\{company_address\}\}/g, address);

  return html;
}

async function sendMorningEmail(user, mantra) {
  const t = getTransporter();
  const appUrl = process.env.APP_URL || 'https://minutemantra.com';
  const unsubscribeUrl = `${appUrl}/api/unsubscribe/${user.unsubscribe_token}`;

  await t.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || 'Minute Mantra'}" <${process.env.SMTP_FROM_ADDRESS || 'mantra@minutemantra.com'}>`,
    to: user.email,
    subject: `Your mantra today: ${mantra.transliteration}`,
    html: getMorningEmailHtml(mantra, unsubscribeUrl),
    list: {
      unsubscribe: { url: unsubscribeUrl, comment: 'Unsubscribe from morning mantras' },
    },
  });
}

async function sendPasswordResetEmail(email, token) {
  const t = getTransporter();
  const appUrl = process.env.APP_URL || 'https://minutemantra.com';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  await t.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || 'Minute Mantra'}" <${process.env.SMTP_FROM_ADDRESS || 'mantra@minutemantra.com'}>`,
    to: email,
    subject: 'Reset your Minute Mantra password',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset your Minute Mantra password</title>
</head>
<body style="margin:0;padding:0;background-color:#fdf8f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf8f0;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#fffaf3;border-radius:12px;border:1px solid rgba(184,134,11,0.2);overflow:hidden;">
        <tr><td style="padding:40px;text-align:center;">
          <h2 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;color:#b8860b;">Reset Your Password</h2>
          <p style="margin:0 0 28px;font-size:15px;color:#7a5c3e;line-height:1.6;">Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background-color:#b8860b;color:#fffaf3;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:Georgia,serif;font-size:16px;font-weight:bold;">Reset Password</a>
          <p style="margin:28px 0 0;font-size:13px;color:#9a8c7e;">If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

async function sendMagicLinkEmail(email, magicUrl, isNew) {
  const t = getTransporter();
  const subject = isNew
    ? 'Welcome to Minute Mantra — enter your practice'
    : 'Your Minute Mantra magic link';

  const headline = isNew ? 'Welcome to Minute Mantra' : 'Enter your practice';
  const body = isNew
    ? 'Your account is ready. Click the link below to begin your daily mantra practice.'
    : 'Click the link below to sign in. This link expires in 15 minutes.';

  await t.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || 'Minute Mantra'}" <${process.env.SMTP_FROM_ADDRESS || 'mantra@minutemantra.com'}>`,
    to: email,
    subject,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#fdf8f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf8f0;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#fffaf3;border-radius:16px;border:1px solid rgba(184,134,11,0.2);overflow:hidden;">
        <tr><td style="padding:48px 40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">ॐ</div>
          <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;color:#5a3e28;font-weight:normal;">${headline}</h2>
          <p style="margin:0 0 32px;font-size:15px;color:#7a5c3e;line-height:1.7;">${body}</p>
          <a href="${magicUrl}" style="display:inline-block;background:linear-gradient(135deg,#b8860b,#d4a017);color:#fffaf3;text-decoration:none;padding:16px 40px;border-radius:50px;font-family:Georgia,serif;font-size:15px;font-weight:bold;letter-spacing:0.1em;">ENTER YOUR PRACTICE</a>
          <p style="margin:32px 0 0;font-size:12px;color:#9a8c7e;">This link expires in 15 minutes and can only be used once.<br>If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

module.exports = { sendMorningEmail, sendPasswordResetEmail, sendMagicLinkEmail };
