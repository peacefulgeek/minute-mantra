/**
 * EMAIL MODULE - Using SMTP2GO HTTP API (same pattern as BlendedSoul)
 * No nodemailer — uses fetch() to call SMTP2GO REST API directly
 */
const fs = require('fs');
const path = require('path');

function getEmailConfig() {
  return {
    apiKey: process.env.SMTP_API || '',
    from: process.env.SMTP_FROM_ADDRESS || 'noreply@minutemantra.com',
    fromName: process.env.SMTP_FROM_NAME || 'Minute Mantra',
    appUrl: process.env.APP_URL || 'https://minutemantra.com',
  };
}

async function sendEmail(to, subject, html, text) {
  const config = getEmailConfig();

  if (!config.apiKey) {
    console.error('[Email] SMTP_API not configured');
    throw new Error('Email API key not configured');
  }

  console.log(`[Email] Sending to ${to} via SMTP2GO API...`);

  try {
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: config.apiKey,
        to: [to],
        sender: `${config.fromName} <${config.from}>`,
        subject: subject,
        html_body: html,
        text_body: text || subject,
      }),
    });

    const result = await response.json();

    if (result.data?.succeeded > 0) {
      console.log('[Email] Sent successfully via SMTP2GO API');
      return true;
    } else {
      console.error('[Email] SMTP2GO API error:', JSON.stringify(result));
      throw new Error(result.data?.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    throw error;
  }
}

// Load the morning email template (fresh read each time for hot-reload in dev)
function loadTemplate() {
  const templatePath = path.join(__dirname, '../templates/morning-mantra.html');
  return fs.readFileSync(templatePath, 'utf8');
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

  if (mantra.go_deeper_url) {
    html = html.replace(/\{\{#if go_deeper_url\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    html = html.replace(/\{\{#if go_deeper_url\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

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
  const appUrl = process.env.APP_URL || 'https://minutemantra.com';
  const unsubscribeUrl = `${appUrl}/api/unsubscribe/${user.unsubscribe_token}`;
  const html = getMorningEmailHtml(mantra, unsubscribeUrl);

  return sendEmail(
    user.email,
    `Your mantra today: ${mantra.transliteration}`,
    html,
    `Your mantra today: ${mantra.transliteration}\n\n${mantra.english_translation}`
  );
}

async function sendPasswordResetEmail(email, token) {
  const appUrl = process.env.APP_URL || 'https://minutemantra.com';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset your Minute Mantra password</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#fffaf3;border-radius:16px;border:1px solid rgba(184,134,11,0.15);overflow:hidden;">
        <tr><td style="padding:40px;text-align:center;">
          <img src="https://minute-mantra.b-cdn.net/icons/icon-192.png" alt="Minute Mantra" width="48" height="48" style="display:block;margin:0 auto 16px;border-radius:10px;">
          <h2 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;color:#5a3e28;font-weight:normal;">Reset Your Password</h2>
          <p style="margin:0 0 28px;font-size:15px;color:#7a6050;line-height:1.6;">Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#b8860b,#d4a017);color:#fffaf3;text-decoration:none;padding:14px 32px;border-radius:30px;font-family:Georgia,serif;font-size:16px;font-weight:bold;">Reset Password</a>
          <p style="margin:28px 0 0;font-size:13px;color:#9a8c7e;">If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail(
    email,
    'Reset your Minute Mantra password',
    html,
    `Reset your password: ${resetUrl}`
  );
}

async function sendMagicLinkEmail(email, magicUrl, isNew) {
  const subject = isNew
    ? 'Welcome to Minute Mantra — enter your practice'
    : 'Your Minute Mantra magic link';

  const headline = isNew ? 'Welcome to Minute Mantra' : 'Enter your practice';
  const body = isNew
    ? 'Your account is ready. Click the link below to begin your daily mantra practice.'
    : 'Click the link below to sign in. This link expires in 15 minutes.';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#fffaf3;border-radius:16px;border:1px solid rgba(184,134,11,0.15);overflow:hidden;">
        <tr><td style="padding:48px 40px;text-align:center;">
          <img src="https://minute-mantra.b-cdn.net/icons/icon-192.png" alt="Minute Mantra" width="56" height="56" style="display:block;margin:0 auto 16px;border-radius:12px;">
          <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;color:#5a3e28;font-weight:normal;">${headline}</h2>
          <p style="margin:0 0 32px;font-size:15px;color:#7a6050;line-height:1.7;">${body}</p>
          <a href="${magicUrl}" style="display:inline-block;background:linear-gradient(135deg,#b8860b,#d4a017);color:#fffaf3;text-decoration:none;padding:16px 40px;border-radius:50px;font-family:Georgia,serif;font-size:15px;font-weight:bold;letter-spacing:0.1em;">ENTER YOUR PRACTICE</a>
          <p style="margin:32px 0 0;font-size:12px;color:#9a8c7e;">This link expires in 15 minutes and can only be used once.<br>If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail(
    email,
    subject,
    html,
    `${headline}\n\n${body}\n\nClick here: ${magicUrl}`
  );
}

module.exports = { sendMorningEmail, sendPasswordResetEmail, sendMagicLinkEmail };
