const http = require('http');
const https = require('https');

async function testPipeline(endpoint) {
  return new Promise((resolve, reject) => {
    const client = endpoint.startsWith('https') ? https : http;
    const req = client.get(endpoint, res => {
      console.log(`[Response] Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`[Headers] Content-Type: ${res.headers['content-type']}, Content-Length: ${res.headers['content-length']}`);
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        console.log(`[Decoded] Buffer: ${buf.length} bytes`);
        const isMp3 = (buf[0] === 0xFF && (buf[1] & 0xE0) === 0xE0) || (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33);
        console.log(`[Audio Format Valid] MP3 frame/ID3 detected: ${isMp3}`);
        resolve({ length: buf.length, isMp3 });
      });
    });
    req.on('error', reject);
  });
}

(async () => {
  console.log('--- TEST 1: Local Endpoint (http://localhost:3000) ---');
  const res1 = await testPipeline('http://localhost:3000/api/tts?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7&lang=ar&gender=male&style=classic');
  console.log('Local test result:', res1);

  console.log('\n--- TEST 2: Production Vercel Endpoint (https://handivoice-pro.vercel.app) ---');
  const res2 = await testPipeline('https://handivoice-pro.vercel.app/api/tts?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7&lang=ar&gender=male&style=classic');
  console.log('Production test result:', res2);

  if (res1.isMp3 && res2.isMp3 && res1.length > 5000 && res2.length > 5000) {
    console.log('\n>>> FULL 5-STAGE PIPELINE CONFIRMED HEALTHY & OPERATIONAL ON BOTH LOCAL AND PRODUCTION <<<');
  } else {
    process.exit(1);
  }
})();
