const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');

function generateSecMsGec() {
  const WIN_EPOCH = 11644473600;
  const S_TO_NS = 1e9;
  let ticks = Date.now() / 1000 + WIN_EPOCH;
  ticks -= ticks % 300;
  const strToHash = Math.floor(ticks * S_TO_NS).toString();
  return crypto.createHash('sha256').update(strToHash).digest('hex').toUpperCase();
}

function testEdgeTTS(text, voice = 'ar-SA-HamedNeural', pitch = '+0Hz', rate = '+0%') {
  return new Promise((resolve, reject) => {
    const connId = crypto.randomUUID().replace(/-/g, '');
    const secMsGec = generateSecMsGec();
    console.log('Using Sec-MS-GEC:', secMsGec);

    const ws = new WebSocket(
      'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&Sec-MS-GEC=' + secMsGec + '&Sec-MS-GEC-Version=1-131.0.2903.86&ConnectionId=' + connId,
      {
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
          'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold'
        }
      }
    );

    const audioChunks = [];
    let isDone = false;

    ws.on('open', () => {
      console.log('WS connected successfully to Edge TTS!');
      const configMsg = 'Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}';
      ws.send(configMsg);

      const reqId = crypto.randomUUID().replace(/-/g, '');
      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ar-SA'><voice name='${voice}'><prosody pitch='${pitch}' rate='${rate}'>${text}</prosody></voice></speak>`;
      const ssmlMsg = `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
      ws.send(ssmlMsg);
    });

    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        const headerLen = data.readUInt16BE(0);
        const audioData = data.subarray(headerLen + 2);
        if (audioData.length > 0) {
          audioChunks.push(audioData);
        }
      } else {
        const textMsg = data.toString('utf8');
        if (textMsg.includes('Path:turn.end')) {
          console.log('Turn complete! Total chunks:', audioChunks.length);
          isDone = true;
          ws.close();
          const fullAudio = Buffer.concat(audioChunks);
          resolve(fullAudio);
        }
      }
    });

    ws.on('error', err => {
      console.error('WS error:', err);
      reject(err);
    });

    ws.on('close', () => {
      if (!isDone && audioChunks.length > 0) {
        resolve(Buffer.concat(audioChunks));
      }
    });

    setTimeout(() => {
      if (!isDone) {
        ws.terminate();
        if (audioChunks.length > 0) resolve(Buffer.concat(audioChunks));
        else reject(new Error('Timeout waiting for TTS synthesis'));
      }
    }, 10000);
  });
}

(async () => {
  try {
    const text = 'هاندي فويس برو، ترجمة ذكية وفورية للغة الإشارة';
    console.log('Synthesizing with ar-SA-HamedNeural (Male Classic)...');
    const buf = await testEdgeTTS(text, 'ar-SA-HamedNeural');
    console.log('SUCCESS! Audio buffer length:', buf.length, 'bytes');
    if (!fs.existsSync('scratch')) fs.mkdirSync('scratch');
    fs.writeFileSync('scratch/test_hamed.mp3', buf);
    console.log('Written to scratch/test_hamed.mp3 successfully!');
  } catch (err) {
    console.error('Test failed:', err);
  }
})();
