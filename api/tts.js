const { EdgeTTS } = require('@andresaya/edge-tts');

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

module.exports = async (req, res) => {
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
};
