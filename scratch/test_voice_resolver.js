const fs = require('fs');

// Extract classifyVoiceGender and resolveCentralVoice from script.js
const scriptCode = fs.readFileSync('script.js', 'utf8');

// Isolate functions to test in Node
const sandbox = {};
const fnCode = `
${scriptCode.slice(scriptCode.indexOf('function classifyVoiceGender('), scriptCode.indexOf('function selectVoiceForCombination('))}
`;

const vm = require('vm');
const ctx = {
  console: console,
  window: {},
  appSpeechVoices: [],
  AppState: { speechOutputLanguage: 'en', language: 'en', voiceGender: 'female', voiceStyle: 'classic' }
};
vm.createContext(ctx);
vm.runInContext(fnCode, ctx);

console.log('--- Testing resolveCentralVoice in isolated environment (Simulating Chrome on Windows with only Microsoft Hoda) ---');
const mockChromeVoices = [
  { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Zira Desktop - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Mark - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Hoda - Arabic (Egypt)', lang: 'ar-EG' }
];

const testCases = [
  { lang: 'ar', gender: 'male', style: 'sharp', expectedName: 'Shakir (Neural Male Cloud)' },
  { lang: 'ar', gender: 'male', style: 'classic', expectedName: 'Hamed (Neural Male Cloud)' },
  { lang: 'ar', gender: 'male', style: 'strong', expectedName: 'Hamdan (Neural Male Cloud)' },
  { lang: 'ar', gender: 'female', style: 'classic', expectedName: 'Microsoft Hoda - Arabic (Egypt)' },
  { lang: 'en', gender: 'male', style: 'sharp', expectedName: 'Microsoft Mark - English (United States)' },
  { lang: 'en', gender: 'male', style: 'classic', expectedName: 'Microsoft David Desktop - English (United States)' },
  { lang: 'en', gender: 'female', style: 'classic', expectedName: 'Microsoft Zira Desktop - English (United States)' }
];

let allPassed = true;
for (const tc of testCases) {
  const res = ctx.resolveCentralVoice(tc.gender, tc.style, tc.lang, mockChromeVoices);
  const pass = res.isAvailable === true && res.gender === tc.gender && res.voiceName === tc.expectedName;
  if (pass) {
    console.log(`[PASS] ${tc.lang.toUpperCase()} ${tc.gender} ${tc.style} -> ${res.voiceName} (Available: ${res.isAvailable}, Cloud: ${!!res.useCloudTTS})`);
  } else {
    console.error(`[FAIL] ${tc.lang.toUpperCase()} ${tc.gender} ${tc.style} -> got "${res.voiceName}", available: ${res.isAvailable}`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n>>> ALL TEST CASES PASSED 100%! Arabic Male is never unavailable and never falls back to female! <<<');
} else {
  process.exit(1);
}
