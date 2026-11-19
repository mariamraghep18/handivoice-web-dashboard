/**
 * HandiVoice PRO - Node.js Express Backend
 * Edge AI Sign Language Translation Glove Server
 * Authentication & Dynamic Profile System · Real Telemetry Datasets · ML Classification
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Static file serving with explicit, strict MIME types
app.use(express.static(__dirname, {
  extensions: ['html', 'htm'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
  }
}));

app.use(express.static(process.cwd(), {
  extensions: ['html', 'htm'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
  }
}));

function findAssetFile(filename) {
  const candidates = [
    path.join(__dirname, filename),
    path.join(process.cwd(), filename),
    path.join(__dirname, '..', filename)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// Explicit bulletproof handlers for core assets
app.get('/styles.css', (req, res) => {
  const file = findAssetFile('styles.css');
  if (file) {
    res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    return res.sendFile(file);
  }
  res.status(404).type('text/plain').send('styles.css not found');
});

app.get('/script.js', (req, res) => {
  const file = findAssetFile('script.js');
  if (file) {
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    return res.sendFile(file);
  }
  res.status(404).type('text/plain').send('script.js not found');
});

app.get('/hand-3d.js', (req, res) => {
  const file = findAssetFile('hand-3d.js');
  if (file) {
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    return res.sendFile(file);
  }
  res.status(404).type('text/plain').send('hand-3d.js not found');
});

app.get('/dataset-telemetry.js', (req, res) => {
  const file = findAssetFile('dataset-telemetry.js');
  if (file) {
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    return res.sendFile(file);
  }
  res.status(404).type('text/plain').send('dataset-telemetry.js not found');
});

app.get('/manifest.json', (req, res) => {
  const file = findAssetFile('manifest.json');
  if (file) {
    res.setHeader('Content-Type', 'application/manifest+json; charset=UTF-8');
    return res.sendFile(file);
  }
  res.status(404).type('text/plain').send('manifest.json not found');
});

// Load precomputed dataset telemetry
let datasetSummary = [];
const datasetPath = path.join(__dirname, 'data', 'telemetry_dataset.json');
if (fs.existsSync(datasetPath)) {
  try {
    datasetSummary = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    console.log(`[HandiVoice PRO] Loaded ${datasetSummary.length} gestures from telemetry dataset.`);
  } catch (err) {
    console.error('[HandiVoice PRO] Error reading telemetry dataset:', err);
  }
}

// In-Memory Database for Users & Auth (Persistent per session)
const usersDb = [
  {
    id: "usr_mariam18",
    fullName: "Mariam Raghep",
    email: "mariam.raghep@handivoice.ai",
    phone: "+20 102 345 6789",
    nationalId: "29804151234567",
    passwordHash: hashPassword("HandiVoice2026!"),
    avatar: "icons/handiai-avatar.png",
    voiceGender: "female",
    voiceStyle: "classic",
    speechSpeed: 1.0,
    theme: "dark",
    language: "en",
    createdAt: new Date().toISOString()
  }
];

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd || '').digest('hex');
}

/* ==========================================================================
   REST API: AUTHENTICATION & PROFILE SYSTEM
   ========================================================================== */

// 1. User Registration
app.post('/api/auth/register', (req, res) => {
  const { fullName, email, phone, nationalId, password } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ success: false, error: 'Full name, email, and password are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = usersDb.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    fullName: fullName.trim(),
    email: normalizedEmail,
    phone: phone ? phone.trim() : '',
    nationalId: nationalId ? nationalId.trim() : '29800000000000',
    passwordHash: hashPassword(password),
    avatar: '',
    voiceGender: 'female',
    voiceStyle: 'classic',
    speechSpeed: 1.0,
    theme: 'dark',
    language: 'en',
    createdAt: new Date().toISOString()
  };

  usersDb.push(newUser);

  const safeUser = sanitizeUser(newUser);
  res.json({
    success: true,
    message: 'Registration successful! Welcome to HandiVoice PRO.',
    user: safeUser,
    token: 'jwt_mock_' + newUser.id + '_' + Date.now()
  });
});

// 2. User Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const inputHash = hashPassword(password);

  const user = usersDb.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user || user.passwordHash !== inputHash) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  res.json({
    success: true,
    message: 'Welcome back!',
    user: sanitizeUser(user),
    token: 'jwt_mock_' + user.id + '_' + Date.now()
  });
});

// 3. Update User Profile & Avatar
app.put('/api/auth/profile', (req, res) => {
  const { email, fullName, phone, nationalId, avatar, voiceGender, voiceStyle, speechSpeed, theme, language } = req.body;

  const user = usersDb.find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim()) || usersDb[0];

  if (fullName) user.fullName = fullName.trim();
  if (phone) user.phone = phone.trim();
  if (nationalId && !nationalId.includes('*')) user.nationalId = nationalId.trim();
  if (avatar) user.avatar = avatar;
  if (voiceGender) user.voiceGender = voiceGender;
  if (voiceStyle) user.voiceStyle = voiceStyle;
  if (speechSpeed !== undefined) user.speechSpeed = parseFloat(speechSpeed) || 1.0;
  if (theme) user.theme = theme;
  if (language) user.language = language;

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: sanitizeUser(user)
  });
});

function sanitizeUser(user) {
  const nid = user.nationalId || '';
  const maskedNid = nid.length > 7 ? nid.slice(0, 6) + '******' + nid.slice(-1) : nid;
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    nationalId: user.nationalId,
    nationalIdMasked: maskedNid,
    avatar: user.avatar,
    voiceGender: user.voiceGender,
    voiceStyle: user.voiceStyle,
    speechSpeed: user.speechSpeed,
    theme: user.theme,
    language: user.language
  };
}

/* ==========================================================================
   REST API: TELEMETRY & ML CLASSIFICATION
   ========================================================================== */

/* ==========================================================================
   REST API: NEURAL TEXT-TO-SPEECH (TTS) HYBRID CLOUD FALLBACK
   Authentic Male & Female Neural Voices for Arabic and Multi-Language
   ========================================================================== */

const ARABIC_NEURAL_VOICES = {
  male: {
    sharp: { voice: 'ar-EG-ShakirNeural', rate: '+15%' },
    classic: { voice: 'ar-SA-HamedNeural', rate: '+0%' },
    strong: { voice: 'ar-AE-HamdanNeural', rate: '-15%' }
  },
  female: {
    sharp: { voice: 'ar-EG-SalmaNeural', rate: '+15%' },
    classic: { voice: 'ar-SA-ZariyahNeural', rate: '+0%' },
    strong: { voice: 'ar-AE-FatimaNeural', rate: '-15%' }
  }
};

const MULTI_LANG_NEURAL_VOICES = {
  en: {
    male: {
      sharp: { voice: 'en-US-ChristopherNeural', rate: '+15%' },
      classic: { voice: 'en-US-GuyNeural', rate: '+0%' },
      strong: { voice: 'en-US-EricNeural', rate: '-15%' }
    },
    female: {
      sharp: { voice: 'en-US-AriaNeural', rate: '+15%' },
      classic: { voice: 'en-US-JennyNeural', rate: '+0%' },
      strong: { voice: 'en-US-MichelleNeural', rate: '-15%' }
    }
  },
  fr: {
    male: {
      sharp: { voice: 'fr-FR-HenriNeural', rate: '+15%' },
      classic: { voice: 'fr-FR-ClaudeNeural', rate: '+0%' },
      strong: { voice: 'fr-FR-AlainNeural', rate: '-15%' }
    },
    female: {
      sharp: { voice: 'fr-FR-DeniseNeural', rate: '+15%' },
      classic: { voice: 'fr-FR-BrigitteNeural', rate: '+0%' },
      strong: { voice: 'fr-FR-CelesteNeural', rate: '-15%' }
    }
  },
  it: {
    male: {
      sharp: { voice: 'it-IT-DiegoNeural', rate: '+15%' },
      classic: { voice: 'it-IT-GiuseppeNeural', rate: '+0%' },
      strong: { voice: 'it-IT-IsaccoNeural', rate: '-15%' }
    },
    female: {
      sharp: { voice: 'it-IT-ElsaNeural', rate: '+15%' },
      classic: { voice: 'it-IT-IsabellaNeural', rate: '+0%' },
      strong: { voice: 'it-IT-PalmiraNeural', rate: '-15%' }
    }
  }
};

app.get('/api/tts', async (req, res) => {
  try {
    const text = (req.query.text || '').trim();
    if (!text) {
      return res.status(400).send('Text parameter is required.');
    }
    const lang = (req.query.lang || 'ar').toLowerCase().split('-')[0];
    const gender = (req.query.gender || 'male').toLowerCase() === 'female' ? 'female' : 'male';
    const style = ['sharp', 'classic', 'strong'].includes(req.query.style) ? req.query.style : 'classic';

    let voiceConfig;
    if (lang === 'ar') {
      voiceConfig = ARABIC_NEURAL_VOICES[gender][style];
    } else if (MULTI_LANG_NEURAL_VOICES[lang]) {
      voiceConfig = MULTI_LANG_NEURAL_VOICES[lang][gender][style];
    } else {
      voiceConfig = MULTI_LANG_NEURAL_VOICES.en[gender][style];
    }

    const { EdgeTTS } = require('@andresaya/edge-tts');
    const tts = new EdgeTTS();
    const result = await tts.generate(text, voiceConfig.voice, { rate: voiceConfig.rate });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(result.audio);
  } catch (err) {
    console.error('[HandiVoice Cloud TTS Error]:', err.message);
    res.status(500).json({ error: 'TTS Synthesis failed: ' + err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'HandiVoice PRO Edge AI Platform',
    version: '2.5.0',
    hardware: {
      mcu: 'ESP32-S3 SuperMini',
      cpu: 'Xtensa Dual-Core 32-bit LX7 @ 240 MHz',
      connectivity: 'Bluetooth 5.0 LE (Web Bluetooth API) / UART Serial',
      sensors: {
        flex: '5x High-Resolution Bend Sensors (Thumb, Index, Middle, Ring, Pinky on ADC1)',
        imu: 'MPU6050 6-Axis Motion Tracking (Ax, Ay, Az, Gx, Gy, Gz on I2C GPIO 8/9)'
      }
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/dataset', (req, res) => {
  res.json({
    success: true,
    count: datasetSummary.length,
    gestures: datasetSummary
  });
});

app.post('/api/classify', (req, res) => {
  const { flex_raw, imu } = req.body;
  if (!flex_raw || !Array.isArray(flex_raw) || flex_raw.length < 5) {
    return res.status(400).json({ error: 'Missing flex_raw array with 5 channels' });
  }

  const thumb = flex_raw[0] || 0;
  const index = flex_raw[1] || 0;
  const middle = flex_raw[2] || 0;
  const ring = flex_raw[3] || 0;
  const pinky = flex_raw[4] || 0;

  const ax = imu ? (imu.ax || 0) : 0;
  const ay = imu ? (imu.ay || 0) : 0;
  const az = imu ? (imu.az || 0) : 0;

  const scored = datasetSummary.map(g => {
    const df1 = Math.pow((thumb - g.thumb_raw) / 255, 2);
    const df2 = Math.pow((index - g.index_raw) / 255, 2);
    const df3 = Math.pow((middle - g.middle_raw) / 255, 2);
    const df4 = Math.pow((ring - g.ring_raw) / 255, 2);
    const df5 = Math.pow((pinky - g.pinky_raw) / 255, 2);

    const dImu = Math.pow((ax - g.ax) / 10, 2) + Math.pow((ay - g.ay) / 10, 2);
    const dist = Math.sqrt(df1 + df2 + df3 + df4 + df5 + 0.3 * dImu);

    return { gesture: g, distance: dist };
  });

  scored.sort((a, b) => a.distance - b.distance);
  const top = scored[0];
  const maxPossible = Math.sqrt(5 + 2);
  const confidence = Math.max(0.70, Math.min(0.995, 1 - (top.distance / maxPossible)));

  res.json({
    success: true,
    predicted_label: top.gesture.label,
    clean_label: top.gesture.cleanLabel,
    confidence: +(confidence * 100).toFixed(1),
    translations: top.gesture.translations,
    telemetry: {
      flex_raw: [thumb, index, middle, ring, pinky],
      imu: { ax, ay, az }
    }
  });
});

// Single Page Application Fallback (only for HTML routes, never for assets)
app.get('*', (req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).type('text/plain').send(`Asset not found: ${req.path}`);
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[HandiVoice PRO] Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
