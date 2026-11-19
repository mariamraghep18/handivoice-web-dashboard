const { EdgeTTS } = require('@andresaya/edge-tts');
const fs = require('fs');

async function run() {
  try {
    const tts = new EdgeTTS();
    console.log('Synthesizing with ar-SA-HamedNeural (Male Classic)...');
    const { audio } = await tts.generate('هاندي فويس برو، ترجمة ذكية وفورية للغة الإشارة', 'ar-SA-HamedNeural');
    const buf = Buffer.from(await audio.arrayBuffer());
    console.log('SUCCESS! Synthesized buffer length:', buf.length, 'bytes');
    fs.writeFileSync('scratch/test_andresaya_hamed.mp3', buf);
    console.log('Saved scratch/test_andresaya_hamed.mp3');

    console.log('Synthesizing with ar-EG-ShakirNeural (Male Sharp)...');
    const resShakir = await tts.generate('هاندي فويس برو، ترجمة ذكية وفورية للغة الإشارة', 'ar-EG-ShakirNeural', { rate: '+15%' });
    const bufShakir = Buffer.from(await resShakir.audio.arrayBuffer());
    console.log('SUCCESS! Shakir buffer length:', bufShakir.length, 'bytes');

    console.log('Synthesizing with ar-AE-HamdanNeural (Male Strong)...');
    const resHamdan = await tts.generate('هاندي فويس برو، ترجمة ذكية وفورية للغة الإشارة', 'ar-AE-HamdanNeural', { rate: '-15%' });
    const bufHamdan = Buffer.from(await resHamdan.audio.arrayBuffer());
    console.log('SUCCESS! Hamdan buffer length:', bufHamdan.length, 'bytes');
  } catch (e) {
    console.error('Error running test:', e);
  }
}

run();
