const { EdgeTTS } = require('@andresaya/edge-tts');
const fs = require('fs');

async function testAll() {
  const tts = new EdgeTTS();
  const testPhrase = 'هاندي فويس برو، ترجمة ذكية وفورية للغة الإشارة';

  const voices = [
    { id: 'ar-EG-ShakirNeural', gender: 'Male', style: 'Sharp', rate: '+15%' },
    { id: 'ar-SA-HamedNeural', gender: 'Male', style: 'Classic', rate: '+0%' },
    { id: 'ar-AE-HamdanNeural', gender: 'Male', style: 'Strong', rate: '-15%' },
    { id: 'ar-EG-SalmaNeural', gender: 'Female', style: 'Sharp', rate: '+15%' },
    { id: 'ar-SA-ZariyahNeural', gender: 'Female', style: 'Classic', rate: '+0%' },
    { id: 'ar-AE-FatimaNeural', gender: 'Female', style: 'Strong', rate: '-15%' },
  ];

  console.log('--- Testing All 6 Arabic Neural Voice Profiles ---');
  for (const v of voices) {
    try {
      const res = await tts.generate(testPhrase, v.id, { rate: v.rate });
      console.log(`[PASS] ${v.gender} ${v.style} (${v.id}, rate: ${v.rate}) -> ${res.audio.length} bytes (duration: ${res.duration}ms)`);
    } catch (e) {
      console.error(`[FAIL] ${v.gender} ${v.style} (${v.id}):`, e.message);
    }
  }
}

testAll();
