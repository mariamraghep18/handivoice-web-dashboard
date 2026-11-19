/* ==========================================================================
   HandiVoice PRO — Production Full-Stack Client Engine
   Default Language: English (EN)
   Multi-Language: English (Default), Arabic (RTL), Italian, French
   Isolated Audio Output Language Control (EN, AR, IT, FR)
   3D Articulated Three.js Hand Kinematics · Real Auth & Landing Experience
   Device View Mode (Mobile Frame vs Desktop) · HandiAI Copilot
   ========================================================================== */

// --- Global Application State ---
const AppState = {
  language: 'en', // DEFAULT WEBSITE LANGUAGE: ENGLISH
  speechOutputLanguage: 'en', // ISOLATED AUDIO OUTPUT LANGUAGE (DEFAULT: ENGLISH)
  theme: 'dark',
  quickMode: 'phrases', // 'phrases' | 'fingerspelling' | 'telemetry'
  activeView: 'view-translation',
  isMobileDeviceMode: false,

  // Hardware Connection & Bridge State
  connectionMode: 'bridge', // 'bridge' | 'serial' | 'ble' | 'sim'
  hardwareStatus: 'DISCONNECTED', // DISCONNECTED, CONNECTING, CONNECTED, CALIBRATING, AI READY, RECOGNIZING, SIMULATING, ERROR
  autoSpeechEnabled: (typeof localStorage !== 'undefined' && localStorage.getItem('hv_auto_speech') !== null)
    ? (localStorage.getItem('hv_auto_speech') === 'true')
    : true,
  isMuted: false,
  isPaused: false,
  customPitch: 1.0,
  customVolume: 1.0,
  voiceGender: (typeof localStorage !== 'undefined' && localStorage.getItem('hv_voice_gender')) || 'female',
  voiceStyle: (typeof localStorage !== 'undefined' && localStorage.getItem('hv_voice_style')) || 'classic',

  bridge: {
    ws: null,
    isOnline: false,
    url: 'ws://localhost:8765/ws',
    apiUrl: 'http://localhost:8765/api',
    selectedPort: '',
    baud: 115200,
    portsList: [],
    reconnectTimer: null
  },

  serial: {
    port: null,
    reader: null,
    connected: false
  },

  // Authenticated User State
  auth: {
    isLoggedIn: false, // Controlled by Landing & Auth
    token: 'jwt_mock_mariam',
    user: {
      id: "usr_mariam18",
      fullName: "Mariam Raghep",
      email: "mariam.raghep@handivoice.ai",
      phone: "+1 (555) 234-5678",
      nationalId: "29804151234567",
      nationalIdMasked: true,
      avatar: "icons/handiai-avatar.png",
      voiceGender: "female", // female | male
      voiceStyle: "classic", // sharp | classic | powerful
      speechSpeed: 1.0,
      pitchMult: 1.0,
      volumeMult: 1.0,
      theme: "dark",
      language: "en"
    }
  },

  hand3d: null,

  // Hardware State (ESP32-S3 SuperMini BLE)
  ble: {
    device: null,
    server: null,
    characteristic: null,
    connected: false,
    rssi: -58,
    battery: 94
  },

  simulationMode: true,
  autoTourInterval: null,

  currentTelemetry: {
    thumb_raw: 1,
    index_raw: 71,
    middle_raw: 86,
    ring_raw: 171,
    pinky_raw: 265,
    thumb_bend_pct: 0,
    index_bend_pct: 28,
    middle_bend_pct: 34,
    ring_bend_pct: 67,
    pinky_bend_pct: 100,
    ax: 0.658,
    ay: 7.705,
    az: 5.899,
    gx: 0.056,
    gy: 0.098,
    gz: -0.075
  },

  activeGesture: null,
  translationHistory: []
};

/* ==========================================================================
   1. MULTI-LANGUAGE (i18n) DICTIONARY: ENGLISH (DEFAULT), AR, IT, FR
   ========================================================================== */
const I18N = {
  en: {
    app_title: "HandiVoice PRO",
    header_sub: "EDGE AI • ESP32-S3 GLOVE",
    header_tutorial_btn: "Sign Language",
    mode_conversation: "Mode: Phrases",
    mode_spelling: "Mode: Letters",
    mode_telemetry: "Mode: Telemetry",
    footer_translation: "Translation Hub",
    footer_dashboard: "Glove & Hardware",
    footer_history: "Translation History",

    // Page Banners & Chips
    page_trans_title: "Translation Hub",
    page_trans_desc: "Dual-stream assistive communication pipeline: convert spoken language into 3D sign language kinematics, and decode ESP32-S3 glove telemetry into speech and text.",
    chip_ai_mode: "AI Engine:",
    chip_ai_mode_sub: "Bidirectional Voice & Gestures",
    chip_sim: "Visuals:",
    chip_sim_sub: "Articulated 3D Hand Model",
    chip_data: "Dataset:",
    chip_data_sub: "31 Authenticated CSV Signs",

    page_dash_title: "Glove & Hardware Center",
    page_dash_desc: "Comprehensive hardware diagnostics and connectivity suite: manage ESP32-S3 wireless BLE or USB serial links, inspect 5-channel ADC flex sensor bend levels and 6-axis MPU6050 IMU motion kinematics, or run interactive simulations.",
    chip_conn: "Connectivity:",
    chip_conn_sub: "BLE, USB Serial & Python Bridge",
    chip_sens: "Sensors:",
    chip_sens_sub: "ADC1 5-Flex Channels + MPU6050",
    chip_test: "Testing:",
    chip_test_sub: "Virtual Sliders & CSV Auto-Cycle",

    page_hist_title: "Translation History & Neural Logs",
    page_hist_desc: "Real-time audit log of spoken interactions, recognized glove gestures, edge AI confidence levels, and audio playback streams.",
    chip_realtime: "Live Streaming:",
    chip_realtime_sub: "Instant Neural Speech Logs",
    chip_export: "Audit Export:",
    chip_export_sub: "One-Click Structured CSV",
    chip_filters: "Deep Search:",
    chip_filters_sub: "Keyword Filter & Replay",

    // Vertical Layout
    top_sec_title: "Top: Partner Speech to Sign Language & 3D Simulation",
    top_sec_sub: "Real-time speech recognition for non-signers • Web Speech API",
    bottom_sec_title: "Bottom: Glove Gesture to Speech & Text",
    bottom_sec_sub: "ESP32-S3 real-time telemetry translation & Neural Synthesis",

    // Section 1 (Top)
    partner_lang_label: "Partner Spoken Language:",
    mic_idle: "Click to Speak (Partner Voice)",
    mic_listening: "Listening... Speak clearly into microphone",
    transcript_label: "Real-time Spoken Transcript",
    transcript_placeholder: "Awaiting spoken audio from partner...",
    sign_3d_title: "3D Articulated Sign Language Simulation",
    quick_prompts_title: "Quick Voice Test Prompts:",

    // Section 2 (Bottom)
    replay_audio_btn: "Replay Audio",
    speech_output_lang_label: "Audio Output Language:",
    test_preset_btn: "Trigger Random Sign",
    dataset_presets_title: "Real Dataset Gesture Presets (31 Signs):",
    confidence_label: "Edge AI Match",

    // Dashboard
    dash_title: "Smart Glove Telemetry & Hardware Integration",
    ble_card_title: "ESP32-S3 SuperMini BLE Connection",
    ble_connected: "Connected",
    ble_disconnected: "Disconnected",
    ble_connect_btn: "Connect Glove via Web Bluetooth",
    ble_disconnect_btn: "Disconnect Glove",
    battery_label: "Battery",
    signal_label: "Signal RSSI",
    flex_card_title: "5 Flex Sensors Telemetry (ADC1 Matrix)",
    imu_card_title: "MPU6050 6-Axis Motion Tracking",
    sim_title: "Hardware Simulation Mode",
    sim_desc: "Test telemetry with virtual sliders & real CSV datasets",
    auto_tour_start: "Auto-Cycle Dataset Gestures",
    auto_tour_stop: "Stop Auto-Cycle",

    // History
    hist_title: "Translation History & Neural Logs",
    hist_search: "Search translations...",
    hist_export: "Export CSV",
    hist_clear: "Clear History",
    hist_col_time: "Time",
    hist_col_source: "Source",
    hist_col_input: "Input Data",
    hist_col_output: "Translated Text & Audio",
    hist_col_actions: "Action",

    // Profile & Auth
    profile_title: "User Profile & Voice Customization Engine",
    tab_profile: "My Profile",
    prof_name: "Full Name",
    prof_email: "Email Address",
    prof_phone: "Phone Number",
    prof_nid: "National / Assistive Medical ID",
    avatar_upload_btn: "Change Profile Picture",
    voice_title: "Customized Speech Engine",
    voice_gender: "Voice Gender Profile",
    voice_style: "Voice Style & Tone",
    voice_speed: "Speech Speed",
    test_voice_btn: "Test Current Speech",
    save_profile_btn: "Save Profile Changes",
    logout_btn: "Log Out / Switch Account",

    // Voice Studio (Strictly English - No Arabic words mixed)
    voice_category_label: "Voice Category (Gender Profile):",
    voice_gender_female: "Female",
    voice_gender_male: "Male",
    voice_style_label: "Voice Style & Acoustic Tone (3 Styles):",
    voice_style_sharp: "Sharp",
    voice_style_classic: "Classic",
    voice_style_strong: "Strong",
    voice_desc_sharp: "Clear, crisp, slightly faster delivery with elevated pitch and lively cadence.",
    voice_desc_classic: "Natural, balanced, comfortable everyday conversational delivery.",
    voice_desc_strong: "Deeper, fuller, confident acoustic resonance with deliberate pace.",
    voice_badge_sharp: "CRISP & BRIGHT",
    voice_badge_classic: "BALANCED",
    voice_badge_strong: "DEEP RESONANCE",

    // Tutorial Modal
    tutorial_modal_title: "Platform & Smart Glove Video Walkthrough",
    tutorial_modal_sub: "Learn how the ESP32-S3 glove, 3D hand simulation, and neural speech synthesis communicate seamlessly.",
    quick_mode_select_title: "Select Sign Language Operational Mode:",

    prompt_hello: "Hello, nice to meet you!",
    prompt_thanks: "Thank you so much for your support.",
    prompt_help: "Do you need any help?",
    prompt_water: "I need a glass of water, please.",
    prompt_doctor: "Call the doctor, please."
  },

  ar: {
    app_title: "HandiVoice PRO",
    header_sub: "ذكاء اصطناعي طرفي • قفاز ESP32-S3",
    header_tutorial_btn: "لغة الإشارة",
    mode_conversation: "النمط: عبارات",
    mode_spelling: "النمط: أحرف هجائية",
    mode_telemetry: "النمط: بيانات خام",
    footer_translation: "مركز الترجمة",
    footer_dashboard: "القفاز والعتاد",
    footer_history: "سجل الترجمات",

    // Page Banners & Chips
    page_trans_title: "مركز الترجمة الفورية",
    page_trans_desc: "منظومة التواصل المزدوجة: تحويل الكلام المنطوق إلى محاكاة لغة الإشارة 3D، وترجمة إشارات القفاز الذكي ESP32-S3 إلى كلام ونص.",
    chip_ai_mode: "محرك الذكاء:",
    chip_ai_mode_sub: "صوت وإشارات ثنائية الاتجاه",
    chip_sim: "المحاكاة:",
    chip_sim_sub: "نموذج يد مفصلي 3D",
    chip_data: "مجموعة البيانات:",
    chip_data_sub: "31 إشارة CSV موثقة",

    page_dash_title: "لوحة تحكم القفاز والعتاد",
    page_dash_desc: "مجموعة شاملة لتشخيص العتاد والاتصال: إدارة اتصالات BLE أو USB Serial أو Python Bridge، فحص حساسات الانثناء الخمسة ومستشعر الحركة سداسي المحاور MPU6050.",
    chip_conn: "الاتصال:",
    chip_conn_sub: "بلوتوث، تسلسلي وجسر بايثون",
    chip_sens: "الحساسات:",
    chip_sens_sub: "5 حساسات ADC1 مع MPU6050",
    chip_test: "الاختبار:",
    chip_test_sub: "مؤشرات افتراضية وجولة آلية",

    page_hist_title: "سجل الترجمات والبيانات العصبية",
    page_hist_desc: "سجل مباشر لجميع المحادثات وإشارات القفاز مع نسب دقة الذكاء الاصطناعي وإمكانية إعادة الاستماع والتصدير.",
    chip_realtime: "بث فوري:",
    chip_realtime_sub: "سجلات صوتية عصبية فورية",
    chip_export: "تصدير السجل:",
    chip_export_sub: "ملف CSV بنقرة واحدة",
    chip_filters: "بحث دقيق:",
    chip_filters_sub: "فلترة الكلمات وإعادة التشغيل",

    top_sec_title: "القسم العلوي: صوت الطرف الآخر إلى لغة إشارة 3D",
    top_sec_sub: "تعرف صوتي فوري لغير المتحدثين بلغة الإشارة • Web Speech API",
    bottom_sec_title: "القسم السفلي: إشارة القفاز الذكي إلى صوت ونص",
    bottom_sec_sub: "ترجمة فورية لقياسات ESP32-S3 وتوليد صوتي عصبي",

    partner_lang_label: "لغة تحدث الطرف الآخر:",
    mic_idle: "اضغط للتحدث (صوت المرافق)",
    mic_listening: "جاري الاستماع... تحدث بوضوح في الميكروفون",
    transcript_label: "النص المنطوق المباشر",
    transcript_placeholder: "في انتظار تحدث الطرف الآخر...",
    sign_3d_title: "محاكاة اليد المفصلية 3D بلغة الإشارة",
    quick_prompts_title: "جمل صوتية سريعة للتجربة:",

    replay_audio_btn: "إعادة تشغيل الصوت",
    speech_output_lang_label: "لغة إخراج الصوت المنطوق:",
    test_preset_btn: "إشارة عشوائية",
    dataset_presets_title: "بيانات الإشارات الفعلية (31 إشارة):",
    confidence_label: "دقة الذكاء الاصطناعي",

    dash_title: "قياسات القفاز الذكي والربط العتادي",
    ble_card_title: "اتصال بلوتوث ESP32-S3 SuperMini",
    ble_connected: "متصل بالقفاز",
    ble_disconnected: "غير متصل",
    ble_connect_btn: "ربط القفاز عبر Web Bluetooth",
    ble_disconnect_btn: "فصل الاتصال بالقفاز",
    battery_label: "البطارية",
    signal_label: "قوة الإشارة",
    flex_card_title: "5 حساسات انثناء (مصفوفة ADC1)",
    imu_card_title: "حساس الحركة سداسي المحاور MPU6050",
    sim_title: "وضع المحاكاة الافتراضية",
    sim_desc: "اختبر القياسات بالمؤشرات الافتراضية والبيانات الواقعية",
    auto_tour_start: "جولة تلقائية بين الإشارات",
    auto_tour_stop: "إيقاف الجولة",

    hist_title: "سجل الترجمة والبيانات العصبية",
    hist_search: "ابحث في السجل...",
    hist_export: "تصدير CSV",
    hist_clear: "مسح السجل",
    hist_col_time: "الوقت",
    hist_col_source: "المصدر",
    hist_col_input: "البيانات المدخلة",
    hist_col_output: "الترجمة والصوت",
    hist_col_actions: "إجراء",

    profile_title: "الملف الشخصي ومحرك التخصيص الصوتي",
    tab_profile: "ملفي الشخصي",
    prof_name: "الاسم الكامل",
    prof_email: "البريد الإلكتروني",
    prof_phone: "رقم الهاتف",
    prof_nid: "الرقم القومي / المعرف الطبي",
    avatar_upload_btn: "تغيير الصورة الشخصية",
    voice_title: "محرك الصوت المخصص",
    voice_gender: "جنس الصوت",
    voice_style: "نبرة وأسلوب الصوت",
    voice_speed: "سرعة النطق",
    test_voice_btn: "اختبار نبرة الصوت الحالية",
    save_profile_btn: "حفظ تعديلات الملف",
    logout_btn: "تسجيل الخروج / تبديل الحساب",

    // Voice Studio (Arabic)
    voice_category_label: "فئة الصوت (جنس الصوت):",
    voice_gender_female: "أنثوي",
    voice_gender_male: "ذكوري",
    voice_style_label: "أسلوب ونبرة الصوت (3 نبرات):",
    voice_style_sharp: "حاد",
    voice_style_classic: "عادي",
    voice_style_strong: "قوي",
    voice_desc_sharp: "نبرة واضحة وحادة وسريعة بنغمات عالية وحيوية.",
    voice_desc_classic: "نبرة طبيعية ومتوازنة ومريحة للمحادثات اليومية.",
    voice_desc_strong: "نبرة أعمق ورنانة وواثقة ومدروسة.",
    voice_badge_sharp: "واضح وحاد",
    voice_badge_classic: "متوازن وطبيعي",
    voice_badge_strong: "رنين عميق",

    tutorial_modal_title: "دليل الفيديو التفاعلي لمنصة وقفاز HandiVoice",
    tutorial_modal_sub: "تعرف على كيفية عمل قفاز ESP32-S3 ونموذج اليد 3D ومحرك التوليد الصوتي بالتناغم.",
    quick_mode_select_title: "حدد نمط عمل لغة الإشارة:",

    prompt_hello: "مرحباً، يسعدني لقاؤك!",
    prompt_thanks: "شكراً جزيلاً على مساندتك الكريمة.",
    prompt_help: "هل تحتاج أي مساعدة؟",
    prompt_water: "أحتاج كوب ماء للشرب من فضلك.",
    prompt_doctor: "من فضلك اتصل بالطبيب الآن."
  },

  it: {
    app_title: "HandiVoice PRO",
    header_sub: "EDGE AI • GUANTO ESP32-S3",
    header_tutorial_btn: "Lingua dei Segni",
    mode_conversation: "Modalità: Frasi",
    mode_spelling: "Modalità: Lettere",
    mode_telemetry: "Modalità: Telemetria",
    footer_translation: "Hub Traduzione",
    footer_dashboard: "Guanto & Hardware",
    footer_history: "Cronologia Traduzioni",

    // Page Banners & Chips
    page_trans_title: "Hub di Traduzione",
    page_trans_desc: "Pipeline di comunicazione bidirezionale: converti la voce parlata in lingua dei segni 3D e decodifica la telemetria del guanto ESP32-S3 in voce e testo.",
    chip_ai_mode: "Motore IA:",
    chip_ai_mode_sub: "Voce e Gesti Bidirezionali",
    chip_sim: "Grafica 3D:",
    chip_sim_sub: "Modello di Mano Articolata",
    chip_data: "Dataset:",
    chip_data_sub: "31 Segni CSV Autenticati",

    page_dash_title: "Centro Guanto & Hardware",
    page_dash_desc: "Suite di diagnostica e connettività hardware: gestisci connessioni BLE o USB seriale, ispeziona i 5 sensori di flessione ADC1 e il sensore IMU MPU6050 a 6 assi.",
    chip_conn: "Connettività:",
    chip_conn_sub: "BLE, Seriale USB & Bridge Python",
    chip_sens: "Sensori:",
    chip_sens_sub: "5 Canali ADC1 + MPU6050",
    chip_test: "Collaudo:",
    chip_test_sub: "Cursori Virtuali & Ciclo CSV",

    page_hist_title: "Cronologia Traduzioni & Log",
    page_hist_desc: "Registro in tempo reale delle interazioni vocali, dei gesti riconosciuti e dei livelli di confidenza dell'IA.",
    chip_realtime: "Streaming Live:",
    chip_realtime_sub: "Log Vocali Neurali Istantanei",
    chip_export: "Esportazione:",
    chip_export_sub: "File CSV Strutturato in 1 Clic",
    chip_filters: "Ricerca:",
    chip_filters_sub: "Filtra per Chiave e Riascolta",

    top_sec_title: "Sezione Superiore: Voce del Partner in Lingua dei Segni 3D",
    top_sec_sub: "Riconoscimento vocale in tempo reale per non udenti • Web Speech API",
    bottom_sec_title: "Sezione Inferiore: Gesto del Guanto in Voce & Testo",
    bottom_sec_sub: "Traduzione telemetrica ESP32-S3 e sintesi vocale neurale",

    partner_lang_label: "Lingua Parlata Partner:",
    mic_idle: "Clicca per parlare (Voce del partner)",
    mic_listening: "In ascolto... Parla chiaramente nel microfono",
    transcript_label: "Trascrizione Vocale in Tempo Reale",
    transcript_placeholder: "In attesa dell'audio parlato dal partner...",
    sign_3d_title: "Simulazione 3D Articolata della Lingua dei Segni",
    quick_prompts_title: "Frasi Rapide di Test (Voce):",

    replay_audio_btn: "Riproduci Audio",
    speech_output_lang_label: "Lingua Audio Sintetizzato:",
    test_preset_btn: "Gesto Casuale",
    dataset_presets_title: "Preimpostazioni Dataset Reale (31 Segni):",
    confidence_label: "Precisione Edge AI",

    dash_title: "Telemetria Guanto Smart & Integrazione Hardware",
    ble_card_title: "Connessione BLE ESP32-S3 SuperMini",
    ble_connected: "Connesso",
    ble_disconnected: "Disconnesso",
    ble_connect_btn: "Connetti via Web Bluetooth",
    ble_disconnect_btn: "Disconnetti Guanto",
    battery_label: "Batteria",
    signal_label: "Segnale RSSI",
    flex_card_title: "5 Sensori di Flessione (Matrice ADC1)",
    imu_card_title: "Sensore di Movimento a 6 Assi MPU6050",
    sim_title: "Modalità Simulazione Hardware",
    sim_desc: "Testa la telemetria con cursori virtuali e dataset reale",
    auto_tour_start: "Ciclo Automatico dei Segni",
    auto_tour_stop: "Arresta Ciclo",

    hist_title: "Cronologia delle Traduzioni & Log Neurali",
    hist_search: "Cerca nelle traduzioni...",
    hist_export: "Esporta CSV",
    hist_clear: "Cancella Cronologia",
    hist_col_time: "Ora",
    hist_col_source: "Fonte",
    hist_col_input: "Dati Ingresso",
    hist_col_output: "Traduzione & Audio",
    hist_col_actions: "Azione",

    profile_title: "Profilo Utente & Motore Vocale Avanzato",
    tab_profile: "Mio Profilo",
    prof_name: "Nome Completo",
    prof_email: "Indirizzo Email",
    prof_phone: "Numero di Telefono",
    prof_nid: "ID Nazionale / Medico di Supporto",
    avatar_upload_btn: "Cambia Foto Profilo",
    voice_title: "Motore Vocale Personalizzato",
    voice_gender: "Genere della Voce",
    voice_style: "Stile e Tonalità",
    voice_speed: "Velocità di Eloquio",
    test_voice_btn: "Testa Voce Attuale",
    save_profile_btn: "Salva Modifiche Profilo",
    logout_btn: "Disconnetti / Cambia Account",

    // Voice Studio (Italian)
    voice_category_label: "Categoria Vocale (Genere):",
    voice_gender_female: "Femminile",
    voice_gender_male: "Maschile",
    voice_style_label: "Stile Vocale & Tonalità (3 Stili):",
    voice_style_sharp: "Acuto",
    voice_style_classic: "Classico",
    voice_style_strong: "Forte",
    voice_desc_sharp: "Voce chiara, brillante e leggermente più veloce con intonazione vivace.",
    voice_desc_classic: "Consegna naturale, equilibrata e confortevole per la conversazione quotidiana.",
    voice_desc_strong: "Risonanza più profonda, autorevole e con passo ponderato.",
    voice_badge_sharp: "CHIARO E BRILLANTE",
    voice_badge_classic: "EQUILIBRATO",
    voice_badge_strong: "RISONANZA PROFONDA",

    tutorial_modal_title: "Guida Video alla Piattaforma e al Guanto Smart",
    tutorial_modal_sub: "Scopri come comunicano il guanto ESP32-S3, la simulazione 3D e la voce neurale.",
    quick_mode_select_title: "Seleziona Modalità Operativa Segni:",

    prompt_hello: "Ciao, molto piacere di conoscerti!",
    prompt_thanks: "Grazie mille per il tuo prezioso supporto.",
    prompt_help: "Hai bisogno di assistenza?",
    prompt_water: "Vorrei un bicchiere d'acqua, per favore.",
    prompt_doctor: "Chiamate un medico, per favore."
  },

  fr: {
    app_title: "HandiVoice PRO",
    header_sub: "IA EDGE • GANT ESP32-S3",
    header_tutorial_btn: "Langue des Signes",
    mode_conversation: "Mode: Phrases",
    mode_spelling: "Mode: Lettres",
    mode_telemetry: "Mode: Télémétrie",
    footer_translation: "Centre de Traduction",
    footer_dashboard: "Gant & Matériel",
    footer_history: "Historique",

    // Page Banners & Chips
    page_trans_title: "Centre de Traduction",
    page_trans_desc: "Pipeline de communication bidirectionnelle: convertissez la parole en langue des signes 3D et décodez la télémétrie du gant ESP32-S3 en voix et texte.",
    chip_ai_mode: "Moteur IA:",
    chip_ai_mode_sub: "Voix & Gestes Bidirectionnels",
    chip_sim: "Graphisme 3D:",
    chip_sim_sub: "Main Articulée 3D",
    chip_data: "Dataset:",
    chip_data_sub: "31 Signes CSV Authentifiés",

    page_dash_title: "Centre Matériel & Gant",
    page_dash_desc: "Suite de diagnostic matériel et connectivité: gérez les liaisons BLE ou USB série, inspectez les 5 capteurs de flexion ADC1 et l'IMU 6 axes MPU6050.",
    chip_conn: "Connectivité:",
    chip_conn_sub: "BLE, Série USB & Bridge Python",
    chip_sens: "Capteurs:",
    chip_sens_sub: "5 Canaux ADC1 + MPU6050",
    chip_test: "Tests:",
    chip_test_sub: "Curseurs Virtuels & Cycle CSV",

    page_hist_title: "Historique des Traductions",
    page_hist_desc: "Journal d'audit en direct des interactions parlées, des gestes reconnus et des niveaux de confiance de l'IA Edge.",
    chip_realtime: "Streaming Direct:",
    chip_realtime_sub: "Journaux Vocaux Neuronaux",
    chip_export: "Export d'Audit:",
    chip_export_sub: "Fichier CSV en 1 Clic",
    chip_filters: "Recherche:",
    chip_filters_sub: "Filtre par Mot-Clé & Réécoute",

    top_sec_title: "Haut: Voix du Partenaire vers Langue des Signes 3D",
    top_sec_sub: "Reconnaissance vocale en direct pour non-signants • Web Speech API",
    bottom_sec_title: "Bas: Geste du Gant vers Voix & Texte",
    bottom_sec_sub: "Traduction télémétrique ESP32-S3 en direct et synthèse vocale",

    partner_lang_label: "Langue du partenaire:",
    mic_idle: "Cliquer pour parler (Voix partenaire)",
    mic_listening: "Écoute en cours... Parlez distinctement",
    transcript_label: "Transcription Vocale en Direct",
    transcript_placeholder: "En attente de la voix du partenaire...",
    sign_3d_title: "Simulation 3D Articulée en Langue des Signes",
    quick_prompts_title: "Phrases rapides de test:",

    replay_audio_btn: "Réécouter l'Audio",
    speech_output_lang_label: "Langue Audio Sortie:",
    test_preset_btn: "Déclencher un Signe",
    dataset_presets_title: "Préréglages du Dataset Réel (31 Signes):",
    confidence_label: "Confiance IA Edge",

    dash_title: "Télémétrie du Gant Intelligent et Intégration",
    ble_card_title: "Connexion BLE ESP32-S3 SuperMini",
    ble_connected: "Connecté",
    ble_disconnected: "Déconnecté",
    ble_connect_btn: "Connecter via Web Bluetooth",
    ble_disconnect_btn: "Déconnecter",
    battery_label: "Batterie",
    signal_label: "Signal RSSI",
    flex_card_title: "5 Capteurs de Flexion (Matrice ADC1)",
    imu_card_title: "Capteur de Mouvement 6 Axes MPU6050",
    sim_title: "Mode de Simulation Matérielle",
    sim_desc: "Testez la télémétrie sans matériel avec des curseurs virtuels",
    auto_tour_start: "Cycle Automatique des Gestes",
    auto_tour_stop: "Arrêter le Cycle",

    hist_title: "Historique des Traductions",
    hist_search: "Rechercher...",
    hist_export: "Exporter CSV",
    hist_clear: "Effacer l'historique",
    hist_col_time: "Heure",
    hist_col_source: "Source",
    hist_col_input: "Données Entrée",
    hist_col_output: "Traduction & Audio",
    hist_col_actions: "Action",

    profile_title: "Profil Utilisateur & Moteur Vocal Avancé",
    tab_profile: "Mon Profil",
    prof_name: "Nom Complet",
    prof_email: "Adresse Email",
    prof_phone: "Numéro de Téléphone",
    prof_nid: "Identifiant National / Médical",
    avatar_upload_btn: "Changer Avatar",
    voice_title: "Moteur Vocal Personnalisé",
    voice_gender: "Genre de la Voix",
    voice_style: "Style et Tonalité",
    voice_speed: "Vitesse de Parole",
    test_voice_btn: "Tester la Voix Actuelle",
    save_profile_btn: "Enregistrer le Profil",
    logout_btn: "Déconnexion / Changer de Compte",

    // Voice Studio (French)
    voice_category_label: "Catégorie Vocale (Genre):",
    voice_gender_female: "Féminin",
    voice_gender_male: "Masculin",
    voice_style_label: "Style Vocal & Tonalité (3 Styles):",
    voice_style_sharp: "Aigu",
    voice_style_classic: "Classique",
    voice_style_strong: "Puissant",
    voice_desc_sharp: "Clair, précis, légèrement plus rapide avec une intonation vive.",
    voice_desc_classic: "Élocution naturelle, équilibrée et confortable pour la conversation quotidienne.",
    voice_desc_strong: "Résonance acoustique plus profonde, confiante et posée.",
    voice_badge_sharp: "CLAIR & BRILLANT",
    voice_badge_classic: "ÉQUILIBRÉ",
    voice_badge_strong: "RÉSONANCE PROFONDE",

    tutorial_modal_title: "Guide Vidéo de la Plateforme & du Gant",
    tutorial_modal_sub: "Découvrez comment le gant ESP32-S3, la main 3D et la voix neuronale interagissent.",
    quick_mode_select_title: "Sélectionnez le mode de fonctionnement:",

    prompt_hello: "Bonjour, ravi de vous rencontrer!",
    prompt_thanks: "Merci beaucoup pour votre aide.",
    prompt_help: "Avez-vous besoin d'aide?",
    prompt_water: "J'ai besoin d'un verre d'eau svp.",
    prompt_doctor: "Appelez le médecin s'il vous plaît."
  }
};

/* ==========================================================================
   2. INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Load saved preferences with English as default
  const savedLang = localStorage.getItem('hv_lang') || 'en';
  const savedSpeechLang = localStorage.getItem('hv_speech_lang') || 'en';
  const savedTheme = localStorage.getItem('hv_theme') || 'dark';
  const savedUser = localStorage.getItem('hv_user');
  // Default initial page upon opening website is ALWAYS the Authentication / Landing Page
  AppState.speechOutputLanguage = savedSpeechLang;
  AppState.auth.isLoggedIn = false;

  const savedVoiceGender = localStorage.getItem('hv_voice_gender') || 'female';
  const savedVoiceStyle = localStorage.getItem('hv_voice_style') || 'classic';
  AppState.voiceGender = savedVoiceGender;
  AppState.voiceStyle = savedVoiceStyle;

  if (savedUser) {
    try {
      AppState.auth.user = { ...AppState.auth.user, ...JSON.parse(savedUser) };
    } catch (e) { }
  }

  // Ensure persistent voice selection overrides any stale JSON user state
  if (AppState.auth && AppState.auth.user) {
    AppState.auth.user.voiceGender = savedVoiceGender;
    AppState.auth.user.voiceStyle = savedVoiceStyle;
  }

  setTheme(savedTheme);
  setLanguage(savedLang);

  // Initialize ArabyBot-inspired dynamic particles & fluid animations
  initArabyVisuals();

  // Initialize Landing Screen & Authentication
  initLandingAndAuth();

  // Initialize Header, Footer, Mascot, and Core Modules
  initHeaderButtons();
  initFooterTabs();
  initMascotCompanion();
  initTutorialVideoModal();
  initSpeechRecognition();
  initGloveTranslation();
  initDashboardControls();
  initProfileModal();
  initHandIAIChatbot();
  initLiveClock();

  // Initialize 3D Hand Visualizer
  init3DHand();

  // Apply default gesture (Alif 'أ' with Index upright) silently without auto-speaking on startup
  if (window.HANDIVOICE_DATASET && window.HANDIVOICE_DATASET.length > 0) {
    loadGestureTelemetry(window.HANDIVOICE_DATASET[2], false);
  }

  renderPromptPills();
  updateUserUI();

  // Set isolated speech dropdown value
  const speechLangSelect = document.getElementById('speechOutputLangSelect');
  if (speechLangSelect) {
    speechLangSelect.value = AppState.speechOutputLanguage;
    speechLangSelect.addEventListener('change', (e) => {
      AppState.speechOutputLanguage = e.target.value;
      localStorage.setItem('hv_speech_lang', e.target.value);
      showToast(`Audio output language: ${e.target.value.toUpperCase()}`, 'info');
      if (AppState.activeGesture) displayGestureResult(AppState.activeGesture);
    });
  }
});

function init3DHand() {
  try {
    if (typeof Hand3DVisualizer !== 'undefined') {
      AppState.hand3d = new Hand3DVisualizer('hand3dContainer');
      setTimeout(() => {
        if (AppState.hand3d) AppState.hand3d.applySignGesture('أ');
      }, 350);
    }
  } catch (err) {
    console.error('Failed to init 3D hand:', err);
  }
}

/* ==========================================================================
   3. INITIAL LANDING PAGE & AUTHENTICATION FLOW
   ========================================================================== */
function initLandingAndAuth() {
  const landingScreen = document.getElementById('landingAuthScreen');
  if (!landingScreen) return;

  // Default initial page upon visiting website is ALWAYS the Authentication / Landing Page
  if (AppState.auth.isLoggedIn) {
    landingScreen.classList.add('hidden');
  } else {
    landingScreen.classList.remove('hidden');
  }

  // View Switchers: Login <-> Register Navigation
  const goToRegBtn = document.getElementById('landingGoToRegisterBtn');
  const goToLoginBtn = document.getElementById('landingGoToLoginBtn');
  const loginView = document.getElementById('landingLoginView');
  const registerView = document.getElementById('landingRegisterView');
  const cardTitle = document.getElementById('authCardTitle');
  const cardSubtitle = document.getElementById('authCardSubtitle');

  if (goToRegBtn) {
    goToRegBtn.addEventListener('click', () => {
      if (loginView) loginView.style.display = 'none';
      if (registerView) registerView.style.display = 'block';
      if (cardTitle) cardTitle.innerHTML = '<i class="fa-solid fa-user-plus glow-icon"></i> <span>Create Account</span>';
      if (cardSubtitle) cardSubtitle.textContent = 'Register credentials to configure your HandiVoice profile';
    });
  }

  if (goToLoginBtn) {
    goToLoginBtn.addEventListener('click', () => {
      if (registerView) registerView.style.display = 'none';
      if (loginView) loginView.style.display = 'block';
      if (cardTitle) cardTitle.innerHTML = '<i class="fa-solid fa-shield-halved glow-icon"></i> <span>Platform Access</span>';
      if (cardSubtitle) cardSubtitle.textContent = 'Authenticate to access HandiVoice PRO';
    });
  }

  // 1. Landing Login Form
  const loginForm = document.getElementById('landingLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('landingLoginEmail').value.trim();
      AppState.auth.user.email = email;
      authenticateAndEnterApp();
    });
  }

  // 2. Landing Register Form
  const registerForm = document.getElementById('landingRegisterForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      AppState.auth.user.fullName = document.getElementById('landingRegName').value.trim() || 'Mariam Raghep';
      AppState.auth.user.email = document.getElementById('landingRegEmail').value.trim();
      AppState.auth.user.phone = document.getElementById('landingRegPhone').value.trim();
      AppState.auth.user.nationalId = document.getElementById('landingRegId').value.trim();
      authenticateAndEnterApp();
    });
  }

  // Landing Language Toggle
  const landingLangBtn = document.getElementById('landingLangBtn');
  if (landingLangBtn) {
    landingLangBtn.addEventListener('click', () => {
      const langs = ['en', 'ar', 'it', 'fr'];
      const nextIdx = (langs.indexOf(AppState.language) + 1) % langs.length;
      setLanguage(langs[nextIdx]);
    });
  }

  // Landing Theme Toggle
  const landingThemeBtn = document.getElementById('landingThemeBtn');
  if (landingThemeBtn) {
    landingThemeBtn.addEventListener('click', () => {
      setTheme(AppState.theme === 'dark' ? 'light' : 'dark');
    });
  }
}

function authenticateAndEnterApp() {
  AppState.auth.isLoggedIn = true;
  localStorage.setItem('hv_is_logged_in', 'true');
  saveUserSession();

  const landingScreen = document.getElementById('landingAuthScreen');
  if (landingScreen) {
    landingScreen.classList.add('hidden');
  }

  updateUserUI();
  const firstName = (AppState.auth.user.fullName || 'Mariam').trim().split(' ')[0] || 'Mariam';
  showToast(`Welcome to HandiVoice PRO, ${firstName}!`, 'success');

  // Resize 3D Canvas
  if (AppState.hand3d) {
    setTimeout(() => AppState.hand3d.onResize(), 300);
  }
}

/* ==========================================================================
   4. LANGUAGE & THEME ENGINES
   ========================================================================== */
function setLanguage(lang) {
  if (!I18N[lang]) lang = 'en'; // Default English fallback
  AppState.language = lang;
  localStorage.setItem('hv_lang', lang);

  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

  const dict = I18N[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });

  const labelEl = document.getElementById('currentLangLabel');
  if (labelEl) labelEl.textContent = lang.toUpperCase();

  const landingLangLabel = document.getElementById('landingLangLabel');
  if (landingLangLabel) landingLangLabel.textContent = lang.toUpperCase();

  document.querySelectorAll('.lang-opt').forEach(opt => {
    opt.classList.toggle('active', opt.getAttribute('data-lang') === lang);
  });

  if (AppState.activeGesture) {
    displayGestureResult(AppState.activeGesture);
  }

  renderPromptPills();
}

function setTheme(theme) {
  AppState.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('hv_theme', theme);

  const themeIcon = document.getElementById('headerThemeIcon');
  if (themeIcon) {
    themeIcon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }
}

/* ==========================================================================
   5. HEADER: MINIMALIST & FUNCTIONAL (EXACTLY 5 INTERACTIVE BUTTONS)
   1. Global Language Switcher
   2. Sign Language Quick Mode / Tutorial Video Trigger
   3. Device View Mode Toggle Button (Mobile Frame <-> Desktop)
   4. Theme Toggle (Dark Mode / Light Mode)
   5. User Profile Button
   ========================================================================== */
function initHeaderButtons() {
  // 1. Language Dropdown
  const langBtn = document.getElementById('langSwitcherBtn');
  const langWrapper = document.querySelector('.lang-dropdown-wrapper');
  if (langBtn && langWrapper) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langWrapper.classList.toggle('open');
    });

    document.querySelectorAll('.lang-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        setLanguage(lang);
        langWrapper.classList.remove('open');
        showToast(`Language: ${lang.toUpperCase()}`, 'info');
      });
    });

    document.addEventListener('click', () => {
      langWrapper.classList.remove('open');
    });
  }

  // 2. Sign Language Quick Mode / Tutorial Video Trigger
  const tutorialBtn = document.getElementById('tutorialVideoBtn');
  if (tutorialBtn) {
    tutorialBtn.addEventListener('click', () => {
      openTutorialModal();
    });
  }

  // 3. Theme Toggle Button
  const themeBtn = document.getElementById('themeToggleHeaderBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      setTheme(AppState.theme === 'dark' ? 'light' : 'dark');
      showToast(`Theme: ${AppState.theme.toUpperCase()}`, 'info');
    });
  }

  // 4. User Profile Button
  const profileBtn = document.getElementById('userProfileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      openProfileModal();
    });
  }
}

/* ==========================================================================
   6. TUTORIAL VIDEO & QUICK MODE MODAL
   ========================================================================== */
function initTutorialVideoModal() {
  const modal = document.getElementById('tutorialVideoModal');
  const closeBtn = document.getElementById('closeTutorialModalBtn');
  const playBtn = document.getElementById('playTutorialVideoBtn');
  const videoPlayer = document.getElementById('tutorialVideoPlayer');
  const overlayHud = document.getElementById('videoOverlayHud');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      if (videoPlayer) videoPlayer.pause();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        if (videoPlayer) videoPlayer.pause();
      }
    });
  }

  if (playBtn && videoPlayer) {
    playBtn.addEventListener('click', () => {
      if (videoPlayer.paused) {
        videoPlayer.play();
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        showToast('Playing Platform Video Walkthrough', 'info');
      } else {
        videoPlayer.pause();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      }
    });
  }

  // Mode Pill Switchers
  document.querySelectorAll('.mode-pill-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.mode-pill-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      AppState.quickMode = card.getAttribute('data-mode');
      showToast(`Operational Mode: ${AppState.quickMode.toUpperCase()}`, 'success');
    });
  });
}

function openTutorialModal() {
  const modal = document.getElementById('tutorialVideoModal');
  if (modal) modal.classList.add('active');
}

/* ==========================================================================
   7. NAVIGATION: SIDEBAR & FOOTER TABS (100% CLICKABLE THROUGH TEXT & ICON)
   ========================================================================== */
function initNavigation() {
  // 1. Sidebar Navigation Items (Desktop)
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target');
      if (targetId) switchView(targetId);
    });
  });

  // 2. Footer Tab Buttons (Mobile & Tablet)
  document.querySelectorAll('.footer-tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');
      if (targetId) switchView(targetId);
    });
  });
}

function initFooterTabs() {
  initNavigation();
}

function switchView(viewId) {
  if (!viewId) return;
  AppState.activeView = viewId;

  // Toggle View Sections
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.toggle('active', sec.id === viewId);
  });

  // Highlight Footer Tabs
  document.querySelectorAll('.footer-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === viewId);
  });

  // Highlight Desktop Sidebar Navigation Items (Text & Icon Active Glow)
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === viewId);
  });

  if (viewId === 'view-translation' && AppState.hand3d) {
    setTimeout(() => AppState.hand3d.onResize(), 150);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   8. TOP SECTION: PARTNER SPEECH TO SIGN & 3D SIMULATION
   ========================================================================== */
let speechRecognition = null;
let isListening = false;

function initSpeechRecognition() {
  const micBtn = document.getElementById('micToggleBtn');
  const transcriptEl = document.getElementById('spokenTranscript');
  const partnerLangSelect = document.getElementById('partnerSpeechLang');

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRec) {
    console.warn('SpeechRecognition API not supported.');
    if (micBtn) {
      micBtn.addEventListener('click', () => {
        showToast('Web Speech Recognition not supported in this browser. Please use Chrome or Edge.', 'error');
      });
    }
    return;
  }

  speechRecognition = new SpeechRec();
  speechRecognition.continuous = true;
  speechRecognition.interimResults = true;

  speechRecognition.onstart = () => {
    isListening = true;
    if (micBtn) {
      micBtn.classList.add('listening');
      const micText = micBtn.querySelector('.mic-btn-text');
      if (micText) micText.textContent = I18N[AppState.language].mic_listening;
    }
  };

  speechRecognition.onresult = (event) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    const currentText = (final || interim).trim();
    if (currentText && transcriptEl) {
      transcriptEl.textContent = currentText;
      processPartnerSpeech(currentText);
    }
  };

  speechRecognition.onerror = (event) => {
    console.error('Speech error:', event.error);
    isListening = false;
    resetMicButton();
  };

  speechRecognition.onend = () => {
    isListening = false;
    resetMicButton();
  };

  if (micBtn) {
    micBtn.addEventListener('click', () => {
      if (!isListening) {
        const langCode = partnerLangSelect ? partnerLangSelect.value : getSpeechLocale(AppState.language);
        speechRecognition.lang = langCode;
        try {
          speechRecognition.start();
        } catch (e) {
          console.error(e);
        }
      } else {
        speechRecognition.stop();
      }
    });
  }

  if (partnerLangSelect) {
    partnerLangSelect.addEventListener('change', () => {
      if (isListening) {
        speechRecognition.stop();
        setTimeout(() => {
          speechRecognition.lang = partnerLangSelect.value;
          speechRecognition.start();
        }, 300);
      }
    });
  }
}

function resetMicButton() {
  const micBtn = document.getElementById('micToggleBtn');
  if (micBtn) {
    micBtn.classList.remove('listening');
    const micText = micBtn.querySelector('.mic-btn-text');
    if (micText) micText.textContent = I18N[AppState.language].mic_idle;
  }
}

function getSpeechLocale(lang) {
  switch (lang) {
    case 'ar': return 'ar-SA';
    case 'it': return 'it-IT';
    case 'fr': return 'fr-FR';
    default: return 'en-US';
  }
}

function processPartnerSpeech(text) {
  const clean = text.toLowerCase().trim();
  let matchedGesture = null;

  if (window.HANDIVOICE_DATASET) {
    matchedGesture = window.HANDIVOICE_DATASET.find(g => {
      const phrase = (g.translations && g.translations.phrase) ? g.translations.phrase[AppState.language] : '';
      return clean.includes(phrase.toLowerCase()) || clean.includes(g.cleanLabel.toLowerCase());
    });

    if (!matchedGesture) {
      const firstChar = clean.charAt(0);
      matchedGesture = window.HANDIVOICE_DATASET.find(g => g.cleanLabel.includes(firstChar)) || window.HANDIVOICE_DATASET[2];
    }
  }

  if (matchedGesture) {
    updateSignVisualizer(matchedGesture, text);
    logTranslation({
      source: 'speech',
      input: text,
      output: (matchedGesture.translations.phrase && matchedGesture.translations.phrase[AppState.language]) || matchedGesture.cleanLabel,
      confidence: 99.2
    });
  }
}

function updateSignVisualizer(gesture, originalText) {
  const badgeEl = document.getElementById('activeSign3DBadge');
  if (badgeEl) {
    badgeEl.textContent = gesture.translations[AppState.language] || gesture.cleanLabel;
  }

  if (AppState.hand3d) {
    AppState.hand3d.applySignGesture(gesture.cleanLabel);
  }
}

function renderPromptPills() {
  const container = document.getElementById('quickSpeechPrompts');
  if (!container) return;
  const dict = I18N[AppState.language];

  const prompts = [
    dict.prompt_hello,
    dict.prompt_thanks,
    dict.prompt_help,
    dict.prompt_water,
    dict.prompt_doctor
  ];

  container.innerHTML = '';
  prompts.forEach(p => {
    const pill = document.createElement('button');
    pill.className = 'prompt-pill';
    pill.textContent = p;
    pill.addEventListener('click', () => {
      const transcriptEl = document.getElementById('spokenTranscript');
      if (transcriptEl) transcriptEl.textContent = p;
      processPartnerSpeech(p);
      showToast(`Prompt: "${p}"`, 'info');
    });
    container.appendChild(pill);
  });
}

/* ==========================================================================
   9. BOTTOM SECTION: GLOVE GESTURE & ISOLATED AUDIO LANGUAGE CONTROL
   Phonetic Letter Pronunciation Engine (Alif to Yaa, Punctuation & Symbols)
   ========================================================================== */
const PHONETIC_LETTER_MAP = {
  '.': { en: 'Period', ar: 'نقطة', it: 'Punto', fr: 'Point' },
  '؟': { en: 'Question Mark', ar: 'علامة استفهام', it: 'Punto interrogativo', fr: "Point d'interrogation" },
  'أ': { en: 'Alif', ar: 'ألف', it: 'Alif', fr: 'Alif' },
  'ب': { en: 'Baa', ar: 'باء', it: 'Baa', fr: 'Bâ' },
  'ت': { en: 'Taa', ar: 'تاء', it: 'Taa', fr: 'Tâ' },
  'ث': { en: 'Thaa', ar: 'ثاء', it: 'Thaa', fr: 'Thâ' },
  'ج': { en: 'Jeem', ar: 'جيم', it: 'Gim', fr: 'Djim' },
  'ح': { en: 'Haa', ar: 'حاء', it: 'Haa', fr: 'Hâ' },
  'خ': { en: 'Khaa', ar: 'خاء', it: 'Khaa', fr: 'Khâ' },
  'د': { en: 'Dal', ar: 'دال', it: 'Dal', fr: 'Dal' },
  'ذ': { en: 'Dhal', ar: 'ذال', it: 'Dhal', fr: 'Dhal' },
  'ر': { en: 'Raa', ar: 'راء', it: 'Raa', fr: 'Râ' },
  'ز': { en: 'Zay', ar: 'زاي', it: 'Zain', fr: 'Zay' },
  'س': { en: 'Seen', ar: 'سين', it: 'Sin', fr: 'Sîn' },
  'ش': { en: 'Sheen', ar: 'شين', it: 'Scin', fr: 'Chîn' },
  'ص': { en: 'Saad', ar: 'صاد', it: 'Sad', fr: 'Sâd' },
  'ض': { en: 'Daad', ar: 'ضاد', it: 'Dad', fr: 'Dâd' },
  'ط': { en: 'Taa', ar: 'طاء', it: 'Taa', fr: 'Tâ' },
  'ظ': { en: 'Zaa', ar: 'ظاء', it: 'Zaa', fr: 'Zâ' },
  'ع': { en: 'Ayn', ar: 'عين', it: 'Ain', fr: 'Aïn' },
  'غ': { en: 'Ghayn', ar: 'غين', it: 'Ghayn', fr: 'Rhaïn' },
  'ف': { en: 'Faa', ar: 'فاء', it: 'Faa', fr: 'Fâ' },
  'ق': { en: 'Qaaf', ar: 'قاف', it: 'Qaf', fr: 'Qâf' },
  'ك': { en: 'Kaaf', ar: 'كاف', it: 'Kaf', fr: 'Kâf' },
  'ل': { en: 'Laam', ar: 'لام', it: 'Lam', fr: 'Lâm' },
  'م': { en: 'Meem', ar: 'ميم', it: 'Mim', fr: 'Mîm' },
  'مسافة': { en: 'Space', ar: 'مسافة', it: 'Spazio', fr: 'Espace' },
  'ن': { en: 'Noon', ar: 'نون', it: 'Nun', fr: 'Noûn' },
  'ه': { en: 'Haa', ar: 'هاء', it: 'Haa', fr: 'Hâ' },
  'و': { en: 'Waw', ar: 'واو', it: 'Uau', fr: 'Waw' },
  'ي': { en: 'Yaa', ar: 'ياء', it: 'Yaa', fr: 'Yâ' }
};

function getGesturePronunciation(gesture, targetLang = null) {
  if (!gesture) return '';
  const lang = targetLang || AppState.speechOutputLanguage || AppState.language || 'en';
  const rawLabel = gesture.cleanLabel || gesture.label || '';
  const label = rawLabel.trim();

  // 1. Direct Phonetic character lookup
  if (PHONETIC_LETTER_MAP[label] && PHONETIC_LETTER_MAP[label][lang]) {
    return PHONETIC_LETTER_MAP[label][lang];
  }
  // 2. Direct character translation (never fall back to conversational phrases)
  if (gesture.translations && gesture.translations[lang] && typeof gesture.translations[lang] === 'string') {
    return gesture.translations[lang];
  }
  return label;
}

function initGloveTranslation() {
  const replayBtn = document.getElementById('replayAudioBtn');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      if (AppState.activeGesture) {
        const audioLang = AppState.speechOutputLanguage || 'en';
        const text = getGesturePronunciation(AppState.activeGesture, audioLang);
        streamAudioToMobileSpeaker(text, audioLang);
        showToast(`Streaming to mobile speaker: "${text}"`, 'info');
      } else {
        showToast('No active gesture to replay.', 'info');
      }
    });
  }

  const triggerBtn = document.getElementById('triggerRandomGestureBtn');
  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      if (window.HANDIVOICE_DATASET && window.HANDIVOICE_DATASET.length > 0) {
        const randomIndex = Math.floor(Math.random() * window.HANDIVOICE_DATASET.length);
        loadGestureTelemetry(window.HANDIVOICE_DATASET[randomIndex], false);
      }
    });
  }

  renderDatasetPresetButtons();
}

function renderDatasetPresetButtons() {
  const grid = document.getElementById('datasetTriggerGrid');
  if (!grid || !window.HANDIVOICE_DATASET) return;

  grid.innerHTML = '';
  window.HANDIVOICE_DATASET.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'gesture-btn-chip';
    btn.innerHTML = `
      <span style="font-size: 1.25rem; color: var(--primary-cyan); font-weight: 800;">${g.cleanLabel}</span>
      <span style="font-size: 0.65rem; color: var(--text-secondary);">${g.sampleCount} smp</span>
    `;
    const phoneticName = getGesturePronunciation(g, AppState.language);
    btn.title = `${g.cleanLabel} — ${phoneticName}`;
    btn.addEventListener('click', () => {
      // Load telemetry and update 3D hand silently without global auto-speech
      loadGestureTelemetry(g, false);
      showToast(`Selected: ${g.cleanLabel} (${phoneticName})`, 'info');
    });
    grid.appendChild(btn);
  });
}

function loadGestureTelemetry(gesture, shouldSpeak = false) {
  AppState.activeGesture = gesture;

  AppState.currentTelemetry = {
    thumb_raw: gesture.thumb_raw,
    index_raw: gesture.index_raw,
    middle_raw: gesture.middle_raw,
    ring_raw: gesture.ring_raw,
    pinky_raw: gesture.pinky_raw,
    thumb_bend_pct: gesture.thumb_bend_pct,
    index_bend_pct: gesture.index_bend_pct,
    middle_bend_pct: gesture.middle_bend_pct,
    ring_bend_pct: gesture.ring_bend_pct,
    pinky_bend_pct: gesture.pinky_bend_pct,
    ax: gesture.ax,
    ay: gesture.ay,
    az: gesture.az,
    gx: gesture.gx,
    gy: gesture.gy,
    gz: gesture.gz
  };

  updateDashboardTelemetryUI();
  displayGestureResult(gesture);

  // Apply to realistic 3D Hand Model
  if (AppState.hand3d) {
    AppState.hand3d.applySignGesture(gesture.cleanLabel);
    AppState.hand3d.setIMUOrientation(gesture.ax, gesture.ay, gesture.az);
  }

  // Speak using the ISOLATED speech output language with exact phonetic letter pronunciation
  const audioLang = AppState.speechOutputLanguage || 'en';
  const spokenText = getGesturePronunciation(gesture, audioLang);

  if (shouldSpeak) {
    streamAudioToMobileSpeaker(spokenText, audioLang);
  }

  logTranslation({
    source: 'glove',
    input: `[${gesture.thumb_bend_pct}%, ${gesture.index_bend_pct}%, ${gesture.middle_bend_pct}%, ${gesture.ring_bend_pct}%, ${gesture.pinky_bend_pct}%]`,
    output: `${gesture.cleanLabel} — ${spokenText}`,
    confidence: 98.7
  });
}

function displayGestureResult(gesture) {
  const iconEl = document.getElementById('gestureLargeIcon');
  const nameEl = document.getElementById('gestureSignName');
  const phraseEl = document.getElementById('gestureSpokenPhrase');
  const subEl = document.getElementById('gestureSubTranslation');
  const badgeEl = document.getElementById('activeSign3DBadge');

  const uiLang = AppState.language;
  const audioLang = AppState.speechOutputLanguage || 'en';

  const spokenText = getGesturePronunciation(gesture, uiLang);
  const audioSpokenText = getGesturePronunciation(gesture, audioLang);

  if (iconEl) iconEl.textContent = gesture.cleanLabel;
  if (nameEl) nameEl.textContent = gesture.translations[uiLang] || spokenText;

  if (phraseEl) phraseEl.textContent = spokenText;
  if (badgeEl) badgeEl.textContent = gesture.translations[uiLang] || gesture.cleanLabel;

  if (subEl) {
    subEl.innerHTML = `<i class="fa-solid fa-volume-high"></i> Audio [${audioLang.toUpperCase()}]: <strong>${audioSpokenText}</strong>`;
  }

  // Update Back Side of Telemetry Flip Card
  const rawChannelsEl = document.getElementById('telemetryRawChannels');
  const imuAccEl = document.getElementById('telemetryImuAcc');
  if (rawChannelsEl) {
    rawChannelsEl.textContent = `[T: ${gesture.thumb_raw}, I: ${gesture.index_raw}, M: ${gesture.middle_raw}, R: ${gesture.ring_raw}, P: ${gesture.pinky_raw}]`;
  }
  if (imuAccEl) {
    imuAccEl.textContent = `Ax: ${gesture.ax.toFixed(2)}, Ay: ${gesture.ay.toFixed(2)}, Az: ${gesture.az.toFixed(2)} m/s²`;
  }

  // Cute Mascot Interactive Reaction
  if (typeof updateMascotBubble === 'function') {
    updateMascotBubble(`✨ Active Sign: <strong>${gesture.cleanLabel}</strong> (${spokenText})`);
  }
}

/* ==========================================================================
   10. NEURAL SPEECH SYNTHESIS ENGINE (3 SIGNATURE STYLES: SHARP, CLASSIC, STRONG)
   Asynchronous Voice Pool Detection, Real-Time Acoustic Modulation & Persistence
   ========================================================================== */
let appSpeechVoices = [];

function preloadAppVoices() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        appSpeechVoices = list;
      }
    } catch (e) {
      console.warn("SpeechSynthesis getVoices error:", e);
    }
  }
  updateVoiceStatusUI();
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  preloadAppVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      preloadAppVoices();
    };
  }
}

let appSpeechTimer = null;

/**
 * Gender voice identification helpers
 */
function classifyVoiceGender(voice) {
  if (!voice || !voice.name) return 'unknown';
  const name = voice.name.toLowerCase();
  
  const femaleTokens = [
    'female', 'woman', 'girl', 'zira', 'samantha', 'karen', 'victoria', 
    'moira', 'heather', 'catherine', 'hazel', 'susan', 'helena', 'elena', 
    'laura', 'hortense', 'julie', 'salma', 'zeina', 'leila', 'laila', 
    'maryam', 'mariam', 'fatima', 'nour', 'hoda', 'chiara', 'elsa', 
    'alva', 'luciana', 'clara', 'eva', 'jenny', 'aria', 'ana', 'michelle',
    'fiona', 'tessa', 'zariyah', 'amira', 'steffi', 'paola', 'francesca', 'alice'
  ];
  if (femaleTokens.some(t => name.includes(t))) return 'female';

  const maleTokens = [
    'male', 'man', 'boy', 'david', 'mark', 'george', 'daniel', 
    'alex', 'tom', 'james', 'richard', 'maged', 'naayf', 'tarik', 
    'shakir', 'hamed', 'youssef', 'omar', 'ahmed', 'karim', 'paul', 
    'diego', 'stefano', 'carlo', 'cosimo', 'alain', 'thomas', 'mathieu', 'guy'
  ];
  if (maleTokens.some(t => name.includes(t))) return 'male';

  return 'unknown';
}

function isVoiceFemale(v) {
  return classifyVoiceGender(v) === 'female';
}

function isVoiceMale(v) {
  return classifyVoiceGender(v) === 'male';
}

/**
 * CENTRALIZED AUTHORITATIVE VOICE RESOLVER
 * Receives: Gender ('male'|'female'), Profile ('sharp'|'classic'|'strong'), Language ('en'|'ar'|'fr'|'it'), Voices
 * Resolves a genuine, gender-appropriate voice and delivery acoustics.
 * NEVER substitutes a female voice for Male.
 */
function resolveCentralVoice(gender, style, targetLang, voices) {
  const normGender = (gender === 'male') ? 'male' : 'female';
  const normStyle = ['sharp', 'classic', 'strong'].includes(style) ? style : 'classic';
  const langPrefix = (targetLang || 'en').toLowerCase().split('-')[0];

  const pool = (voices && voices.length > 0)
    ? voices
    : ((window.speechSynthesis && window.speechSynthesis.getVoices().length > 0)
        ? window.speechSynthesis.getVoices()
        : (appSpeechVoices || []));

  if (!pool || pool.length === 0) {
    return {
      voice: null,
      voiceName: 'Loading Voices...',
      isAvailable: false,
      gender: normGender,
      style: normStyle,
      language: targetLang,
      actualVoiceGender: 'none',
      pitch: 1.0,
      rate: 1.0,
      warningMessage: 'Browser speech voices are still initializing.'
    };
  }

  // 1. Gather all voices matching requested language
  const localized = pool.filter(v => v.lang && v.lang.toLowerCase().split('-')[0] === langPrefix);

  // 2. Separate strictly by requested gender
  const localCandidates = localized.filter(v => classifyVoiceGender(v) === normGender);

  // If no native voice of the requested gender exists in the requested language
  if (localCandidates.length === 0) {
    const genderCap = normGender.charAt(0).toUpperCase() + normGender.slice(1);
    const styleCap = normStyle.charAt(0).toUpperCase() + normStyle.slice(1);

    // DUAL-TIER CLOUD NEURAL ENGINE FOR ARABIC & MULTI-LANGUAGE
    // When the browser lacks a native offline voice for this gender, HandiVoice PRO activates
    // its high-definition Neural TTS Engine (Edge AI Neural Voices) so Male voices are 100% available
    // without substituting female voices and without unnatural pitch shifting.
    let cloudVoiceName = '';
    let cloudRate = 1.0;
    if (langPrefix === 'ar') {
      if (normGender === 'male') {
        if (normStyle === 'sharp') {
          cloudVoiceName = 'Shakir (Neural Male Cloud)';
          cloudRate = 1.15;
        } else if (normStyle === 'strong') {
          cloudVoiceName = 'Hamdan (Neural Male Cloud)';
          cloudRate = 0.85;
        } else {
          cloudVoiceName = 'Hamed (Neural Male Cloud)';
          cloudRate = 1.00;
        }
      } else {
        if (normStyle === 'sharp') {
          cloudVoiceName = 'Salma (Neural Female Cloud)';
          cloudRate = 1.15;
        } else if (normStyle === 'strong') {
          cloudVoiceName = 'Fatima (Neural Female Cloud)';
          cloudRate = 0.85;
        } else {
          cloudVoiceName = 'Zariyah (Neural Female Cloud)';
          cloudRate = 1.00;
        }
      }
    } else {
      cloudVoiceName = `${genderCap} Neural Cloud (${targetLang.toUpperCase()})`;
      cloudRate = (normStyle === 'sharp') ? 1.15 : ((normStyle === 'strong') ? 0.85 : 1.00);
    }

    return {
      voice: null,
      voiceName: cloudVoiceName,
      isAvailable: true,
      useCloudTTS: true,
      gender: normGender,
      style: normStyle,
      language: targetLang,
      actualVoiceGender: normGender,
      pitch: 1.0,
      rate: cloudRate,
      warningMessage: null
    };
  }

  // Sub-archetype preference tokens for style differentiation
  const sharpTokens = ['mark', 'alex', 'george', 'aria', 'victoria', 'karen', 'ana', 'salma', 'nour', 'uk english', 'crisp', 'bright', 'light'];
  const classicTokens = ['david', 'guy', 'jenny', 'zira', 'samantha', 'hoda', 'zeina', 'standard', 'natural', 'default'];
  const strongTokens = ['george', 'richard', 'shakir', 'hamed', 'hazel', 'susan', 'catherine', 'moira', 'zariyah', 'fatima', 'alto', 'deep', 'full'];

  let chosenVoice = localCandidates[0];
  let pitch = 1.0;
  let rate = 1.0;

  if (normGender === 'male') {
    if (normStyle === 'sharp') {
      const match = localCandidates.find(v => sharpTokens.some(t => v.name.toLowerCase().includes(t)));
      chosenVoice = match || (localCandidates.length > 1 ? localCandidates[1] : localCandidates[0]);
      rate = 1.15;
      pitch = 1.10;
    } else if (normStyle === 'strong') {
      const match = localCandidates.find(v => strongTokens.some(t => v.name.toLowerCase().includes(t)));
      chosenVoice = match || (localCandidates.length > 2 ? localCandidates[2] : (localCandidates.length > 1 ? localCandidates[1] : localCandidates[0]));
      rate = 0.85;
      pitch = 0.90;
    } else {
      // Classic
      const match = localCandidates.find(v => classicTokens.some(t => v.name.toLowerCase().includes(t)));
      chosenVoice = match || localCandidates[0];
      rate = 1.00;
      pitch = 1.00;
    }
  } else {
    // Female
    if (normStyle === 'sharp') {
      const match = localCandidates.find(v => sharpTokens.some(t => v.name.toLowerCase().includes(t)));
      chosenVoice = match || (localCandidates.length > 1 ? localCandidates[1] : localCandidates[0]);
      rate = 1.15;
      pitch = 1.20;
    } else if (normStyle === 'strong') {
      const match = localCandidates.find(v => strongTokens.some(t => v.name.toLowerCase().includes(t)));
      chosenVoice = match || (localCandidates.length > 2 ? localCandidates[2] : (localCandidates.length > 1 ? localCandidates[1] : localCandidates[0]));
      rate = 0.85;
      pitch = 0.90;
    } else {
      // Classic
      const match = localCandidates.find(v => classicTokens.some(t => v.name.toLowerCase().includes(t)));
      chosenVoice = match || localCandidates[0];
      rate = 1.00;
      pitch = 1.00;
    }
  }

  return {
    voice: chosenVoice,
    voiceName: chosenVoice.name,
    isAvailable: true,
    gender: normGender,
    style: normStyle,
    language: targetLang,
    actualVoiceGender: classifyVoiceGender(chosenVoice),
    pitch: pitch,
    rate: rate,
    warningMessage: null
  };
}

// Backwards compatibility alias
function selectVoiceForCombination(voices, langPrefix, gender = 'female', style = 'classic') {
  const res = resolveCentralVoice(gender, style, langPrefix, voices);
  return res.voice;
}

function selectVoiceForStyle(voices, langPrefix, style = 'classic') {
  const gender = AppState.voiceGender || 'female';
  return selectVoiceForCombination(voices, langPrefix, gender, style);
}

/**
 * Diagnostic UI status updater for Web Speech API voices
 * Reports honest status: native browser gender voice vs unavailable.
 */
function updateVoiceStatusUI() {
  const statusEl = document.getElementById('systemVoiceStatusText');
  const allVoices = (window.speechSynthesis && window.speechSynthesis.getVoices().length > 0)
    ? window.speechSynthesis.getVoices()
    : (appSpeechVoices || []);
  const count = allVoices.length;
  const activeGender = AppState.voiceGender || (AppState.auth && AppState.auth.user && AppState.auth.user.voiceGender) || 'female';
  const activeStyle = AppState.voiceStyle || (AppState.auth && AppState.auth.user && AppState.auth.user.voiceStyle) || 'classic';
  const targetLang = AppState.speechOutputLanguage || AppState.language || 'en';

  const res = resolveCentralVoice(activeGender, activeStyle, targetLang, allVoices);
  const genderCap = activeGender.charAt(0).toUpperCase() + activeGender.slice(1);
  const styleCap = activeStyle.charAt(0).toUpperCase() + activeStyle.slice(1);

  if (statusEl) {
    if (res.isAvailable) {
      const tierBadge = res.useCloudTTS ? 'High-Definition Neural Cloud' : 'Native Browser';
      statusEl.innerHTML = `<strong>Engine Ready:</strong> ${count} voices detected • Active: <span style="color: var(--primary-cyan); font-weight: 700;">${res.voiceName}</span> [${tierBadge} ${genderCap}] • Profile: <strong>${genderCap} ${styleCap}</strong> • Speed: <strong>${res.rate.toFixed(2)}x</strong> (${targetLang.toUpperCase()})`;
    } else {
      statusEl.innerHTML = `<span style="color: #f59e0b; font-weight: 700;"><i class="fa-solid fa-triangle-exclamation"></i> Voice Unavailable:</span> ${res.warningMessage || `No native ${genderCap} voice detected for ${targetLang.toUpperCase()} on this device.`}`;
    }
  }

  const badgeName = document.getElementById('badgeActiveStyleName');
  if (badgeName) {
    badgeName.textContent = `${genderCap} ${styleCap}`;
  }
}

/**
 * Voice Category Selector (Female vs Male)
 * Updates UI pills, card metrics display, preview labels, and triggers optional test audio
 */
function selectVoiceCategory(gender, playPreview = false) {
  if (!['female', 'male'].includes(gender)) gender = 'female';
  AppState.voiceGender = gender;
  if (AppState.auth && AppState.auth.user) {
    AppState.auth.user.voiceGender = gender;
  }
  localStorage.setItem('hv_voice_gender', gender);

  const femBtn = document.getElementById('voiceCatFemaleBtn');
  const maleBtn = document.getElementById('voiceCatMaleBtn');
  if (femBtn) femBtn.classList.toggle('active', gender === 'female');
  if (maleBtn) maleBtn.classList.toggle('active', gender === 'male');

  // Update dynamic metric labels based on the calibrated acoustic matrix
  const sharpPitch = document.getElementById('sharpPitchVal');
  const sharpSpeed = document.getElementById('sharpSpeedVal');
  const classicPitch = document.getElementById('classicPitchVal');
  const classicSpeed = document.getElementById('classicSpeedVal');
  const strongPitch = document.getElementById('strongPitchVal');
  const strongSpeed = document.getElementById('strongSpeedVal');

  if (gender === 'male') {
    if (sharpPitch) sharpPitch.textContent = '1.10x';
    if (sharpSpeed) sharpSpeed.textContent = '1.15x';
    if (classicPitch) classicPitch.textContent = '1.00x';
    if (classicSpeed) classicSpeed.textContent = '1.00x';
    if (strongPitch) strongPitch.textContent = '0.90x';
    if (strongSpeed) strongSpeed.textContent = '0.85x';
  } else {
    if (sharpPitch) sharpPitch.textContent = '1.20x';
    if (sharpSpeed) sharpSpeed.textContent = '1.15x';
    if (classicPitch) classicPitch.textContent = '1.00x';
    if (classicSpeed) classicSpeed.textContent = '1.00x';
    if (strongPitch) strongPitch.textContent = '0.90x';
    if (strongSpeed) strongSpeed.textContent = '0.85x';
  }

  // Update preview button labels
  const capGender = gender.charAt(0).toUpperCase() + gender.slice(1);
  const pSharp = document.getElementById('previewLabel-sharp');
  const pClassic = document.getElementById('previewLabel-classic');
  const pStrong = document.getElementById('previewLabel-strong');
  if (pSharp) pSharp.textContent = `Preview ${capGender} Sharp`;
  if (pClassic) pClassic.textContent = `Preview ${capGender} Classic`;
  if (pStrong) pStrong.textContent = `Preview ${capGender} Strong`;

  updateVoiceStatusUI();

  if (playPreview) {
    const curStyle = AppState.voiceStyle || 'classic';
    previewVoiceCombination(curStyle);
  }
}

/**
 * Voice Style Selector (Sharp, Classic, Strong)
 */
function selectActiveVoiceStyle(style, playPreview = false) {
  if (!['sharp', 'classic', 'strong'].includes(style)) style = 'classic';
  AppState.voiceStyle = style;
  if (AppState.auth && AppState.auth.user) {
    AppState.auth.user.voiceStyle = style;
  }
  localStorage.setItem('hv_voice_style', style);

  // Update UI cards in Profile Modal
  ['sharp', 'classic', 'strong'].forEach(s => {
    const card = document.getElementById(`voiceCard-${s}`);
    const radio = document.getElementById(`voiceRadio-${s}`);
    const isActive = (s === style);
    if (card) card.classList.toggle('active', isActive);
    if (radio) {
      if (isActive) {
        radio.className = 'fa-solid fa-circle-check style-card-radio';
      } else {
        radio.className = 'fa-regular fa-circle-dot style-card-radio';
      }
    }
  });

  updateVoiceStatusUI();

  if (playPreview) {
    previewVoiceCombination(style);
  }
}

/**
 * Previews any of the 6 Voice Combinations (Female/Male x Sharp/Classic/Strong)
 */
function previewVoiceCombination(style, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  selectActiveVoiceStyle(style, false);

  const targetLang = AppState.speechOutputLanguage || AppState.language || 'en';
  let sample = "HandiVoice PRO, intelligent speech synthesis.";
  if (targetLang === 'ar') {
    sample = "هاندي فويس برو، ترجمة ذكية وفورية للغة الإشارة";
  } else if (targetLang === 'it') {
    sample = "HandiVoice PRO, sintesi vocale intelligente.";
  } else if (targetLang === 'fr') {
    sample = "HandiVoice PRO, synthèse vocale intelligente.";
  }
  synthesizeSpeech(sample, targetLang, true);
}

// Backwards compatibility aliases
function previewVoiceStyle(style, event) {
  previewVoiceCombination(style, event);
}
window.previewSpecificStyle = function(targetStyle) {
  previewVoiceCombination(targetStyle);
};

/**
 * HANDIVOICE MOBILE AUDIO STREAMING BRIDGE:
 * Streams recognized sign language speech output directly out loud through the mobile device speaker.
 * Seamlessly interfaces with native mobile app wrappers (Flutter, Android WebView, iOS WKWebView)
 * and Web Speech Synthesis to guarantee audio plays out loud on the mobile device.
 */
function streamAudioToMobileSpeaker(text, targetLang = null) {
  if (!text) return;
  const cleanText = String(text).trim();
  const lang = targetLang || AppState.speechOutputLanguage || AppState.language || 'en';

  // 1. Notify Mobile App Bridge if running in an Android/iOS/Flutter app wrapper
  try {
    const payload = JSON.stringify({
      type: 'HANDIVOICE_SPEAK_SIGN',
      text: cleanText,
      lang: lang,
      voiceGender: AppState.voiceGender || 'female',
      voiceStyle: AppState.voiceStyle || 'classic',
      speechSpeed: AppState.auth?.user?.speechSpeed || 1.0,
      timestamp: Date.now()
    });

    if (window.FlutterChannel && typeof window.FlutterChannel.postMessage === 'function') {
      window.FlutterChannel.postMessage(payload);
    }
    if (window.HandiVoiceMobileBridge && typeof window.HandiVoiceMobileBridge.postMessage === 'function') {
      window.HandiVoiceMobileBridge.postMessage(payload);
    }
    if (window.AndroidBridge && typeof window.AndroidBridge.speak === 'function') {
      window.AndroidBridge.speak(cleanText, lang);
    }
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.handiVoice) {
      window.webkit.messageHandlers.handiVoice.postMessage(payload);
    }
  } catch (bridgeErr) {
    console.debug('Mobile bridge dispatch info:', bridgeErr);
  }

  // 2. Synthesize speech through mobile device audio output with exact acoustic profile (authorized)
  synthesizeSpeech(cleanText, lang, true);
}

/**
 * HIGH-DEFINITION CLOUD NEURAL TTS PLAYBACK PIPELINE
 * Manages full 5-stage audio streaming lifecycle:
 * Stage 1: Request started with validated payload
 * Stage 2: HTTP response received (status, headers, content-type)
 * Stage 3: Audio payload decoded into verified binary Blob
 * Stage 4: HTML5 Audio instantiation & playback initiation
 * Stage 5: Playback completed or exact error diagnostics
 */
async function playCloudTtsStream(cleanText, langToUse, gender, style, speedMult = 1.0, volMult = 1.0) {
  const normGender = (gender === 'male') ? 'male' : 'female';
  const normStyle = ['sharp', 'classic', 'strong'].includes(style) ? style : 'classic';
  const voiceId = (normGender === 'male')
    ? (normStyle === 'sharp' ? 'ar-EG-ShakirNeural' : (normStyle === 'strong' ? 'ar-AE-HamdanNeural' : 'ar-SA-HamedNeural'))
    : (normStyle === 'sharp' ? 'ar-EG-SalmaNeural' : (normStyle === 'strong' ? 'ar-AE-FatimaNeural' : 'ar-SA-ZariyahNeural'));

  console.log(`[HandiVoice Cloud TTS] 🚀 [Stage 1: Request Started]
  • Utterance Text: "${cleanText}"
  • Target Language: ${langToUse}
  • Target Gender: ${normGender}
  • Target Profile: ${normStyle}
  • Target Voice ID: ${voiceId}
  • Speed Multiplier: ${speedMult.toFixed(2)}x
  • Volume Multiplier: ${volMult.toFixed(2)}x`);

  // Safely stop previous audio to avoid DOMException: play() request interrupted
  if (window.hvCurrentAudio) {
    try {
      window.hvCurrentAudio.pause();
      window.hvCurrentAudio.removeAttribute('src');
      window.hvCurrentAudio.load();
    } catch (e) {}
    window.hvCurrentAudio = null;
  }

  // Pre-unlock AudioContext if browser policy has suspended audio
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      if (!window.hvAudioContext) window.hvAudioContext = new AudioCtx();
      if (window.hvAudioContext.state === 'suspended') {
        window.hvAudioContext.resume().then(() => {
          console.log('[HandiVoice Cloud TTS] 🔓 AudioContext state resumed to "running".');
        }).catch(() => {});
      }
    }
  } catch (ctxErr) {}

  // Multi-endpoint resilience: Local API first if live, Production Vercel fallback
  const query = `text=${encodeURIComponent(cleanText)}&lang=${encodeURIComponent(langToUse)}&gender=${encodeURIComponent(normGender)}&style=${encodeURIComponent(normStyle)}`;
  const endpoints = [];

  // If page is hosted on a live web server (not file://)
  if (window.location.protocol !== 'file:' && window.location.host) {
    endpoints.push(`/api/tts?${query}`);
  }
  // Production Vercel live cloud endpoint
  endpoints.push(`https://handivoice-pro.vercel.app/api/tts?${query}`);
  // Local development fallback port 3000
  if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000')) {
    endpoints.push(`http://localhost:3000/api/tts?${query}`);
  }

  let audioBlob = null;
  let successfulUrl = null;

  for (let i = 0; i < endpoints.length; i++) {
    const url = endpoints[i];
    try {
      console.log(`[HandiVoice Cloud TTS] 📡 [Stage 1: Dispatching Fetch ${i + 1}/${endpoints.length}] -> ${url}`);
      const response = await fetch(url);
      console.log(`[HandiVoice Cloud TTS] 📥 [Stage 2: Response Received]
  • Endpoint: ${url}
  • HTTP Status: ${response.status} ${response.statusText}
  • Content-Type: ${response.headers.get('content-type')}
  • Content-Length: ${response.headers.get('content-length') || 'chunked'}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log(`[HandiVoice Cloud TTS] 📦 [Stage 3: Audio Decoded]
  • Blob Size: ${blob.size} bytes
  • Blob MIME Type: ${blob.type || 'audio/mpeg'}`);

      if (!blob || blob.size < 500) {
        throw new Error(`Received audio payload too small (${blob ? blob.size : 0} bytes)`);
      }

      audioBlob = blob;
      successfulUrl = url;
      break;
    } catch (err) {
      console.warn(`[HandiVoice Cloud TTS] Endpoint ${i + 1} (${url}) failed: ${err.message}. Trying next candidate...`);
    }
  }

  if (!audioBlob) {
    console.error('[HandiVoice Cloud TTS] ❌ [Pipeline Failure] All candidate TTS endpoints failed to deliver valid audio.');
    showToast('Unable to connect to TTS cloud service. Please check internet connection.', 'warning');
    return;
  }

  // Stage 4: HTML5 Audio instantiation & playback initiation
  const blobUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio();
  window.hvCurrentAudio = audio;
  audio.preload = 'auto';
  audio.volume = Math.max(0, Math.min(1.0, volMult * (AppState.customVolume || 1.0)));

  audio.onplay = () => {
    console.log(`[HandiVoice Cloud TTS] 🔊 [Stage 4: Playback Started]
  • Voice: ${voiceId} (${normGender.toUpperCase()} ${normStyle.toUpperCase()})
  • Status: Active output playing through device speakers.`);
  };

  audio.onended = () => {
    console.log(`[HandiVoice Cloud TTS] ✅ [Stage 5: Playback Completed] Speech synthesis finished cleanly.`);
    URL.revokeObjectURL(blobUrl);
    if (window.hvCurrentAudio === audio) {
      window.hvCurrentAudio = null;
    }
  };

  audio.onerror = (e) => {
    const err = audio.error;
    console.error(`[HandiVoice Cloud TTS] ⚠️ [Stage 4 Error: Audio Element Error]
  • Error Code: ${err ? err.code : 'unknown'}
  • Error Message: ${err ? err.message : 'Audio decode failure'}`, e);
    URL.revokeObjectURL(blobUrl);
    if (window.hvCurrentAudio === audio) {
      window.hvCurrentAudio = null;
    }
  };

  audio.src = blobUrl;

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      console.log('[HandiVoice Cloud TTS] ▶️ Play promise resolved successfully.');
    }).catch(playErr => {
      console.warn('[HandiVoice Cloud TTS] ⚠️ Play promise rejected:', playErr.name, playErr.message);
      if (playErr.name === 'NotAllowedError') {
        console.warn('[HandiVoice Cloud TTS] Autoplay restriction detected: Browser requires a user gesture before playing audio.');
        showToast('Click anywhere on the dashboard to enable audio playback.', 'info');
        const unlockAndPlay = () => {
          document.removeEventListener('click', unlockAndPlay);
          document.removeEventListener('touchstart', unlockAndPlay);
          audio.play().catch(retryErr => console.warn('Autoplay unlock retry error:', retryErr));
        };
        document.addEventListener('click', unlockAndPlay, { once: true });
        document.addEventListener('touchstart', unlockAndPlay, { once: true });
      }
    });
  }

  // Notify external mobile app bridges (Android / iOS / Flutter) WITHOUT recursive synthesis
  try {
    const payload = JSON.stringify({
      type: 'HANDIVOICE_SPEAK_SIGN',
      text: cleanText,
      lang: langToUse,
      voiceGender: normGender,
      voiceStyle: normStyle,
      speechSpeed: speedMult,
      timestamp: Date.now()
    });
    if (window.FlutterChannel?.postMessage) window.FlutterChannel.postMessage(payload);
    if (window.HandiVoiceMobileBridge?.postMessage) window.HandiVoiceMobileBridge.postMessage(payload);
    if (window.AndroidBridge?.speak) window.AndroidBridge.speak(cleanText, langToUse);
    if (window.webkit?.messageHandlers?.handiVoice) window.webkit.messageHandlers.handiVoice.postMessage(payload);
  } catch (bridgeErr) {
    console.debug('Mobile bridge notify info:', bridgeErr);
  }
}

function synthesizeSpeech(text, targetLang = null, isExplicitAuthorized = false) {
  if (!window.speechSynthesis || text === undefined || text === null) return;
  if (AppState.isMuted) return;
  if (AppState.isPaused) return;

  // STRICT GLOBAL AUDIO POLICY:
  // Global auto-speech is completely disabled across the dashboard, letters grid, mascot, login, chatbot, etc.
  // Speech is ONLY allowed if:
  // 1) Explicitly authorized (e.g. HandiVoice hardware glove telemetry stream or replay button), OR
  // 2) The user is actively testing voices inside the Profile Modal.
  const isProfileModalOpen = !!document.getElementById('profileModalOverlay')?.classList.contains('active');
  const canSynthesize = isExplicitAuthorized || isProfileModalOpen;
  if (!canSynthesize) {
    return;
  }

  // Clean and sanitize text: Speech must ONLY contain the actual word/letter/character intended to be spoken
  const cleanText = String(text).trim();
  if (!cleanText) return;

  // Strictly reject configuration tags, metadata labels, and option names from being vocalized
  const forbiddenConfigPatterns = [
    /^(sharp|classic|strong|powerful)(\s+(tone|voice|style|profile))?$/i,
    /^(voice|profile|gender|tone|style)(\s+(selected|activated|changed|mode|settings))?$/i,
    /^(female|male)(\s+(voice|profile|tone|style))?$/i,
    /^(customized\s+)?speech\s+engine/i,
    /^(عادي|كلاسيكي|كلاسيكية|قوي|قوية|حاد|حادة)(\s+(نبرة|صوت))?$/i,
    /^(ذكر|أنثى|ذكوري|أنثوي)(\s+(نبرة|صوت))?$/i,
    /^(نبرة|صوت|نمط)\s+(عادي|كلاسيكي|قوي|حاد)/i,
    /^(تم تفعيل|اختيار|تغيير)\s+(الصوت|النبرة)/i,
    /^(محرك\s+الصوت|نبرة\s+الصوت)/i,
    /^(tono\s+)?(classico|potente|acuto|forte)$/i,
    /^(ton\s+)?(classique|puissant|aigu|fort)$/i
  ];
  if (forbiddenConfigPatterns.some(regex => regex.test(cleanText))) return;

  // Chromium Unpause & Audio Buffer flush
  if (appSpeechTimer) {
    clearTimeout(appSpeechTimer);
    appSpeechTimer = null;
  }
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (e) { }

  const langToUse = targetLang || AppState.speechOutputLanguage || AppState.language || 'en';
  const gender = AppState.voiceGender || (AppState.auth && AppState.auth.user && AppState.auth.user.voiceGender) || 'female';
  const style = AppState.voiceStyle || (AppState.auth && AppState.auth.user && AppState.auth.user.voiceStyle) || 'classic';
  const speedMult = parseFloat(AppState.auth?.user?.speechSpeed) || 1.0;
  const volMult = (typeof AppState.auth?.user?.volumeMult === 'number') ? AppState.auth.user.volumeMult : 1.0;

  // Retrieve populated or refreshed voice pool
  const allVoices = (window.speechSynthesis.getVoices && window.speechSynthesis.getVoices().length > 0)
    ? window.speechSynthesis.getVoices()
    : (appSpeechVoices || []);

  // Centralized Authoritative Resolution
  const resolved = resolveCentralVoice(gender, style, langToUse, allVoices);

  // If requested gender voice is NOT available for this language, refuse to play wrong gender
  if (!resolved.isAvailable) {
    console.warn(`[HandiVoice Diagnostic] ⚠️ Cannot synthesize: ${resolved.warningMessage}`);
    showToast(resolved.warningMessage || `No ${gender.toUpperCase()} voice available for ${langToUse.toUpperCase()}.`, 'warning');
    return;
  }

  // TIER 2: HIGH-DEFINITION NEURAL CLOUD TTS ENGINE
  // Seamlessly routes speech through playCloudTtsStream when native offline voices are missing
  if (resolved.useCloudTTS) {
    playCloudTtsStream(cleanText, langToUse, gender, style, speedMult, volMult);
    return;
  }

  if (!resolved.voice) {
    console.warn(`[HandiVoice Diagnostic] ⚠️ Cannot synthesize: No voice object found.`);
    return;
  }

  // Cross-lingual phonetic translation dictionary if English voice must speak Arabic text
  const ARABIC_COMMON_PHONETICS = {
    'هاندي فويس برو، ترجمة ذكية وفورية للغة الإشارة': 'HandiVoice PRO, intelligent real-time sign language translation',
    'هاندي فويس برو': 'HandiVoice PRO',
    'مرحباً': 'Welcome',
    'شكراً': 'Thank you',
    'شكرا': 'Thank you',
    'نعم': 'Yes',
    'لا': 'No',
    'أنا أحبك': 'I love you',
    'أحبك': 'I love you',
    'سلام': 'Peace',
    'السلام عليكم': 'Peace be upon you',
    'صباح الخير': 'Good morning',
    'مساء الخير': 'Good evening',
    'كيف حالك': 'How are you',
    'مساعدة': 'Help',
    'أريد مساعدة': 'I need help',
    'أنا بخير': 'I am fine',
    'وداعاً': 'Goodbye',
    'وداعا': 'Goodbye'
  };

  // Cross-lingual phonetic translation if English voice must speak Arabic text
  let textToSpeak = cleanText;
  if (resolved.voice && resolved.voice.lang && !resolved.voice.lang.toLowerCase().startsWith('ar') && /[\u0600-\u06FF]/.test(cleanText)) {
    if (PHONETIC_LETTER_MAP[cleanText] && PHONETIC_LETTER_MAP[cleanText].en) {
      textToSpeak = PHONETIC_LETTER_MAP[cleanText].en;
    } else if (ARABIC_COMMON_PHONETICS[cleanText]) {
      textToSpeak = ARABIC_COMMON_PHONETICS[cleanText];
    } else if (cleanText.includes('هاندي فويس') || cleanText.includes('HandiVoice')) {
      textToSpeak = "HandiVoice PRO, intelligent speech synthesis.";
    }
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.voice = resolved.voice;
  utterance.lang = resolved.voice.lang || getSpeechLocale(langToUse);
  utterance.rate = Math.max(0.5, Math.min(2.0, resolved.rate * speedMult));
  utterance.pitch = Math.max(0.1, Math.min(2.0, resolved.pitch * (AppState.customPitch || 1.0)));
  utterance.volume = Math.max(0, Math.min(1.0, volMult * (AppState.customVolume || 1.0)));

  // Detailed diagnostic telemetry logging
  console.log(`[HandiVoice Diagnostic] 🎙️ Speech Invoked:
  • Requested Gender: ${gender}
  • Requested Profile: ${style}
  • Target Language: ${langToUse}
  • Resolved Voice: ${resolved.voiceName}
  • Verified Voice Gender: ${resolved.actualVoiceGender}
  • Applied Rate: ${utterance.rate.toFixed(2)}x | Applied Pitch: ${utterance.pitch.toFixed(2)}x`);

  // Prevent garbage collection mid-speech in Chromium
  window._activeSpeechUtterance = utterance;
  utterance.onstart = () => {
    console.log(`[HandiVoice Diagnostic] 🔊 Speech started: "${textToSpeak}" [${resolved.voiceName}]`);
  };
  utterance.onend = () => {
    console.log(`[HandiVoice Diagnostic] ⏹️ Speech ended: "${textToSpeak}"`);
    window._activeSpeechUtterance = null;
  };
  utterance.onerror = (e) => {
    console.warn(`[HandiVoice Diagnostic] ❌ SpeechSynthesis error:`, e.error, e);
    window._activeSpeechUtterance = null;

    // Automatic fallback speak on error
    if (e.error && e.error !== 'interrupted' && e.error !== 'canceled') {
      try {
        const recovery = new SpeechSynthesisUtterance(textToSpeak);
        recovery.pitch = utterance.pitch;
        recovery.rate = utterance.rate;
        recovery.volume = utterance.volume;
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        window.speechSynthesis.speak(recovery);
      } catch (recErr) {
        console.error("Recovery speak error:", recErr);
      }
    }
  };

  // Dispatch speech cleanly without delay or audio buffer collision
  appSpeechTimer = setTimeout(() => {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("SpeechSynthesis speak error:", err);
    }
  }, 45);
}

/* ==========================================================================
   11. DEDICATED HARDWARE CONNECTION CENTER & AI BRIDGE
   ========================================================================== */

function setHardwareState(newState, extraMsg) {
  AppState.hardwareStatus = newState;
  const badge = document.getElementById('hardwareStateBadge');
  const label = document.getElementById('hwStateLabel');
  const primaryBtn = document.getElementById('hwPrimaryConnectBtn');
  const hudModelStatus = document.getElementById('hudModelStatus');

  if (badge) {
    badge.className = `hardware-state-badge state-${newState.toLowerCase().replace(/\s+/g, '-')}`;
  }
  if (label) {
    label.textContent = newState;
  }

  const isConnected = ['CONNECTED', 'CALIBRATING', 'AI READY', 'RECOGNIZING', 'SIMULATING'].includes(newState);
  if (primaryBtn) {
    if (isConnected) {
      primaryBtn.className = 'cyber-btn secondary';
      primaryBtn.innerHTML = '<i class="fa-solid fa-link-slash"></i> <span id="hwConnectBtnText">DISCONNECT</span>';
    } else {
      primaryBtn.className = 'cyber-btn primary-glow';
      primaryBtn.innerHTML = '<i class="fa-solid fa-link"></i> <span id="hwConnectBtnText">CONNECT DEVICE</span>';
    }
  }

  if (hudModelStatus) {
    hudModelStatus.textContent = isConnected ? 'Active (RF 100T)' : '31 Classes';
    hudModelStatus.style.color = isConnected ? 'var(--success-green)' : 'var(--primary-cyan)';
  }
}

function initDashboardControls() {
  initHardwareConnectionCenter();
  initWorkspaceControls();
  renderDatasetManagementGrid();
  checkBridgeStatus(false);

  // Sliders for Simulation
  ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'].forEach(f => {
    const slider = document.getElementById(`simSlider${f}`);
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        AppState.currentTelemetry[`${f.toLowerCase()}_bend_pct`] = val;
        AppState.currentTelemetry[`${f.toLowerCase()}_raw`] = Math.round((val / 100) * 255);
        updateDashboardTelemetryUI();

        if (AppState.hand3d) {
          const t = AppState.currentTelemetry;
          AppState.hand3d.setFlexion(
            t.thumb_bend_pct,
            t.index_bend_pct,
            t.middle_bend_pct,
            t.ring_bend_pct,
            t.pinky_bend_pct
          );
        }

        classifyCurrentTelemetry(true);
      });
    }
  });

  const tourBtn = document.getElementById('autoTourBtn');
  if (tourBtn) tourBtn.addEventListener('click', toggleAutoTour);

  const simToggle = document.getElementById('simModeToggle');
  if (simToggle) {
    simToggle.checked = AppState.simulationMode;
    simToggle.addEventListener('change', (e) => {
      AppState.simulationMode = e.target.checked;
      const simControls = document.getElementById('simSlidersGrid');
      if (simControls) simControls.style.display = AppState.simulationMode ? 'grid' : 'none';
      if (AppState.simulationMode) {
        setHardwareState('SIMULATING');
      } else if (AppState.hardwareStatus === 'SIMULATING') {
        setHardwareState('DISCONNECTED');
      }
      showToast(`Simulation Mode: ${AppState.simulationMode ? 'Active' : 'Disabled'}`, 'info');
    });
  }
}

function initHardwareConnectionCenter() {
  // Connection Mode Tabs
  const modeBtns = document.querySelectorAll('.conn-mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.connectionMode = btn.dataset.mode;
      showToast(`Switched Mode: ${btn.querySelector('span')?.textContent || btn.dataset.mode}`, 'info');

      if (AppState.connectionMode === 'sim') {
        AppState.simulationMode = true;
        setHardwareState('SIMULATING');
        const sliders = document.getElementById('simSlidersGrid');
        if (sliders) sliders.style.display = 'grid';
      }
    });
  });

  // Primary Connect Button
  const primaryBtn = document.getElementById('hwPrimaryConnectBtn');
  if (primaryBtn) {
    primaryBtn.addEventListener('click', () => {
      const isConnected = ['CONNECTED', 'CALIBRATING', 'AI READY', 'RECOGNIZING', 'SIMULATING'].includes(AppState.hardwareStatus);
      if (isConnected) {
        disconnectHardware();
      } else {
        connectHardware();
      }
    });
  }

  // Refresh Ports Button
  const refreshPortsBtn = document.getElementById('refreshPortsBtn');
  if (refreshPortsBtn) {
    refreshPortsBtn.addEventListener('click', () => {
      fetchBridgePorts(true);
    });
  }

  // Refresh Bridge Button
  const refreshBridgeBtn = document.getElementById('refreshBridgeBtn');
  if (refreshBridgeBtn) {
    refreshBridgeBtn.addEventListener('click', () => {
      checkBridgeStatus(true);
    });
  }

  // Bridge Sim Stream Button
  const simBridgeBtn = document.getElementById('simToggleBridgeBtn');
  if (simBridgeBtn) {
    simBridgeBtn.addEventListener('click', () => {
      toggleBridgeSimulation();
    });
  }

  // Retrain Button
  const retrainBtn = document.getElementById('retrainModelBtn');
  if (retrainBtn) {
    retrainBtn.addEventListener('click', triggerModelRetrain);
  }
}

async function connectHardware() {
  setHardwareState('CONNECTING');

  if (AppState.connectionMode === 'bridge') {
    connectBridgeSerial();
  } else if (AppState.connectionMode === 'serial') {
    connectWebSerial();
  } else if (AppState.connectionMode === 'ble') {
    toggleWebBluetooth();
  } else if (AppState.connectionMode === 'sim') {
    AppState.simulationMode = true;
    setHardwareState('SIMULATING');
    showToast('Simulation Mode active. Sliders ready.', 'success');
  }
}

async function disconnectHardware() {
  if (AppState.bridge.isOnline) {
    try {
      await fetch(`${AppState.bridge.apiUrl}/disconnect`, { method: 'POST' });
    } catch (e) { }
  }

  if (AppState.serial.connected && AppState.serial.port) {
    try {
      if (AppState.serial.reader) {
        await AppState.serial.reader.cancel();
      }
      await AppState.serial.port.close();
    } catch (e) { }
    AppState.serial.connected = false;
    AppState.serial.port = null;
  }

  if (AppState.ble.connected) {
    try {
      if (AppState.ble.device && AppState.ble.device.gatt.connected) {
        AppState.ble.device.gatt.disconnect();
      }
    } catch (e) { }
    AppState.ble.connected = false;
  }

  setHardwareState('DISCONNECTED');
  showToast('Hardware glove disconnected cleanly.', 'info');
}

// -------------------------------------------------------------
// Local Python AI Bridge Integration (WebSocket + REST)
// -------------------------------------------------------------
async function checkBridgeStatus(showToastUser = false) {
  const banner = document.getElementById('bridgeStatusBanner');
  const dot = document.getElementById('bridgeStatusDot');
  const text = document.getElementById('bridgeStatusText');

  try {
    const res = await fetch(`${AppState.bridge.apiUrl}/status`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      AppState.bridge.isOnline = true;
      if (banner) banner.className = 'bridge-status-banner online';
      if (dot) dot.style.background = '#10b981';
      if (text) {
        text.innerHTML = `<strong>Python AI Bridge: Online (Port 8765)</strong> &bull; Model Loaded (${data.model_classes?.length || 31} Classes) &bull; Status: <code>${data.status}</code>`;
      }
      if (showToastUser) showToast('Connected to Local Python AI Bridge!', 'success');

      fetchBridgePorts(false);
      initBridgeWebSocket();
      return true;
    }
  } catch (err) {
    AppState.bridge.isOnline = false;
    if (banner) banner.className = 'bridge-status-banner offline';
    if (dot) dot.style.background = '#f59e0b';
    if (text) {
      text.innerHTML = `<strong>Python AI Bridge: Offline</strong> &bull; Run <code>start_ai_bridge.bat</code> or use Direct Web Serial.`;
    }
    if (showToastUser) showToast('Python AI Bridge is offline. Run start_ai_bridge.bat', 'info');
    fallbackPopulatePorts();
    return false;
  }
}

async function fetchBridgePorts(showToastUser = false) {
  const select = document.getElementById('comPortSelect');
  if (!select) return;

  try {
    const res = await fetch(`${AppState.bridge.apiUrl}/ports`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const data = await res.json();
      select.innerHTML = '';
      if (data.ports && data.ports.length > 0) {
        data.ports.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.port;
          opt.textContent = `${p.port} - ${p.description || 'Serial Device'}`;
          select.appendChild(opt);
        });
        AppState.bridge.selectedPort = data.ports[0].port;
        if (showToastUser) showToast(`Found ${data.ports.length} COM port(s).`, 'success');
      } else {
        fallbackPopulatePorts();
        if (showToastUser) showToast('No physical serial ports detected. Plug in ESP32 via USB.', 'info');
      }
      return;
    }
  } catch (e) {
    fallbackPopulatePorts();
  }
}

function fallbackPopulatePorts() {
  const select = document.getElementById('comPortSelect');
  if (!select) return;
  select.innerHTML = `
    <option value="COM7" selected>COM7 - Silicon Labs CP210x (ESP32-S3)</option>
    <option value="COM3">COM3 - USB-Serial Bridge</option>
    <option value="COM4">COM4 - USB Serial Port</option>
    <option value="AUTO">AUTO - Auto-Detect Active Port</option>
  `;
}

function initBridgeWebSocket() {
  if (AppState.bridge.ws && (AppState.bridge.ws.readyState === WebSocket.OPEN || AppState.bridge.ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    const ws = new WebSocket(AppState.bridge.url);
    AppState.bridge.ws = ws;

    ws.onopen = () => {
      console.log('[Bridge WS] WebSocket connection established.');
      const banner = document.getElementById('bridgeStatusBanner');
      if (banner) banner.className = 'bridge-status-banner online';
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleBridgeMessage(msg);
      } catch (err) { }
    };

    ws.onerror = (e) => {
      console.warn('[Bridge WS] WebSocket error:', e);
    };

    ws.onclose = () => {
      console.log('[Bridge WS] WebSocket closed.');
      AppState.bridge.ws = null;
      if (!AppState.bridge.reconnectTimer) {
        AppState.bridge.reconnectTimer = setTimeout(() => {
          AppState.bridge.reconnectTimer = null;
          checkBridgeStatus(false);
        }, 6000);
      }
    };
  } catch (err) {
    console.warn('[Bridge WS] Failed to construct WebSocket:', err);
  }
}

function handleBridgeMessage(msg) {
  if (msg.type === 'state_change') {
    setHardwareState(msg.state || 'CONNECTED');
    return;
  }

  if (msg.type === 'telemetry') {
    // 1. Update Telemetry
    const flex = msg.flex_raw || [0, 0, 0, 0, 0];
    const bend = msg.bend_pct || [0, 0, 0, 0, 0];
    const imu = msg.imu || {};

    AppState.currentTelemetry.thumb_raw = flex[0] || 0;
    AppState.currentTelemetry.index_raw = flex[1] || 0;
    AppState.currentTelemetry.middle_raw = flex[2] || 0;
    AppState.currentTelemetry.ring_raw = flex[3] || 0;
    AppState.currentTelemetry.pinky_raw = flex[4] || 0;

    AppState.currentTelemetry.thumb_bend_pct = bend[0] || 0;
    AppState.currentTelemetry.index_bend_pct = bend[1] || 0;
    AppState.currentTelemetry.middle_bend_pct = bend[2] || 0;
    AppState.currentTelemetry.ring_bend_pct = bend[3] || 0;
    AppState.currentTelemetry.pinky_bend_pct = bend[4] || 0;

    AppState.currentTelemetry.ax = imu.ax || 0.0;
    AppState.currentTelemetry.ay = imu.ay || 0.0;
    AppState.currentTelemetry.az = imu.az || 9.8;
    AppState.currentTelemetry.gx = imu.gx || 0.0;
    AppState.currentTelemetry.gy = imu.gy || 0.0;
    AppState.currentTelemetry.gz = imu.gz || 0.0;

    // 2. Update HUD
    const hudSamplingHz = document.getElementById('hudSamplingHz');
    const hudPacketCount = document.getElementById('hudPacketCount');
    if (hudSamplingHz && msg.hz) hudSamplingHz.textContent = `${msg.hz.toFixed(1)} Hz`;
    if (hudPacketCount) {
      const cur = parseInt(hudPacketCount.textContent || '0', 10);
      hudPacketCount.textContent = (cur + 1).toString();
    }

    updateDashboardTelemetryUI();

    // 3. Mirror in 3D Hand
    if (AppState.hand3d) {
      const t = AppState.currentTelemetry;
      AppState.hand3d.setFlexion(t.thumb_bend_pct, t.index_bend_pct, t.middle_bend_pct, t.ring_bend_pct, t.pinky_bend_pct);
      AppState.hand3d.setIMUOrientation(t.ax, t.ay, t.az);
    }

    // 4. Update Prediction & Automatic Speech Output
    const targetLabel = msg.stable || msg.recognized;
    if (targetLabel) {
      applyRecognizedPrediction(targetLabel, msg.confidence || 98.0);
    }

    if (msg.status && AppState.hardwareStatus !== msg.status) {
      setHardwareState(msg.status);
    }
  }
}

function applyRecognizedPrediction(label, confidenceScore = 98.0) {
  if (!window.HANDIVOICE_DATASET) return;

  const found = window.HANDIVOICE_DATASET.find(g => (g.cleanLabel === label || g.label === label));
  if (found) {
    AppState.activeGesture = found;
    displayGestureResult(found);

    const confEl = document.getElementById('gestureConfidenceVal');
    if (confEl) confEl.textContent = `${confidenceScore.toFixed(1)}%`;

    // AUTOMATIC SIGN-TO-SPEECH OUTPUT
    if (AppState.autoSpeechEnabled && !AppState.isMuted && !AppState.isPaused) {
      const now = Date.now();
      if (lastSpokenGloveSign !== found.cleanLabel || (now - lastGloveSpeechTimestamp) > 1300) {
        lastSpokenGloveSign = found.cleanLabel;
        lastGloveSpeechTimestamp = now;

        const audioLang = AppState.speechOutputLanguage || AppState.language || 'en';
        const spokenText = getGesturePronunciation(found, audioLang);
        streamAudioToMobileSpeaker(spokenText, audioLang);
      }
    }
  }
}

async function connectBridgeSerial() {
  const portSelect = document.getElementById('comPortSelect');
  const baudSelect = document.getElementById('baudRateSelect');
  const port = (portSelect && portSelect.value) ? portSelect.value : 'COM7';
  const baud = (baudSelect && baudSelect.value) ? parseInt(baudSelect.value, 10) : 115200;

  try {
    showToast(`Connecting to ESP32 on ${port} via Python Bridge...`, 'info');
    const res = await fetch(`${AppState.bridge.apiUrl}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port, baud })
    });
    const data = await res.json();
    if (data.success) {
      setHardwareState('CONNECTED');
      showToast(`Connected on ${port}! AI recognition streaming...`, 'success');
    } else {
      setHardwareState('ERROR');
      showToast(`Bridge error: ${data.error || 'Check COM port connection'}`, 'error');
    }
  } catch (err) {
    setHardwareState('ERROR');
    showToast('Failed to reach Python AI Bridge. Ensure start_ai_bridge.bat is running.', 'error');
  }
}

async function toggleBridgeSimulation() {
  try {
    const res = await fetch(`${AppState.bridge.apiUrl}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle' })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Simulation stream: ${data.simulation ? 'Active' : 'Stopped'}`, 'info');
      setHardwareState(data.simulation ? 'SIMULATING' : 'DISCONNECTED');
    }
  } catch (err) {
    showToast('Python bridge offline for simulation.', 'info');
  }
}

// -------------------------------------------------------------
// Direct Web Serial API Fallback (Direct Browser-to-USB)
// -------------------------------------------------------------
async function connectWebSerial() {
  if (!('serial' in navigator)) {
    showToast('Web Serial API not supported in this browser. Please use Chrome/Edge or Python Bridge.', 'error');
    setHardwareState('ERROR');
    return;
  }

  try {
    showToast('Select ESP32 USB COM port in prompt...', 'info');
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });

    AppState.serial.port = port;
    AppState.serial.connected = true;
    setHardwareState('AI READY');
    showToast('Direct Web Serial connected at 115200 baud!', 'success');

    readWebSerialStream(port);
  } catch (err) {
    console.error('Web Serial error:', err);
    setHardwareState('DISCONNECTED');
    showToast('Web Serial connection cancelled or failed.', 'info');
  }
}

async function readWebSerialStream(port) {
  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();
  AppState.serial.reader = reader;

  let buffer = '';
  try {
    while (AppState.serial.connected) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
              const pkt = JSON.parse(trimmed);
              if (pkt.flex_raw && pkt.flex_raw.length >= 5) {
                AppState.currentTelemetry.thumb_raw = pkt.flex_raw[0];
                AppState.currentTelemetry.index_raw = pkt.flex_raw[1];
                AppState.currentTelemetry.middle_raw = pkt.flex_raw[2];
                AppState.currentTelemetry.ring_raw = pkt.flex_raw[3];
                AppState.currentTelemetry.pinky_raw = pkt.flex_raw[4];

                if (pkt.bend_pct && pkt.bend_pct.length >= 5) {
                  AppState.currentTelemetry.thumb_bend_pct = pkt.bend_pct[0];
                  AppState.currentTelemetry.index_bend_pct = pkt.bend_pct[1];
                  AppState.currentTelemetry.middle_bend_pct = pkt.bend_pct[2];
                  AppState.currentTelemetry.ring_bend_pct = pkt.bend_pct[3];
                  AppState.currentTelemetry.pinky_bend_pct = pkt.bend_pct[4];
                }

                if (pkt.imu) {
                  AppState.currentTelemetry.ax = pkt.imu.ax || 0;
                  AppState.currentTelemetry.ay = pkt.imu.ay || 0;
                  AppState.currentTelemetry.az = pkt.imu.az || 9.8;
                  AppState.currentTelemetry.gx = pkt.imu.gx || 0;
                  AppState.currentTelemetry.gy = pkt.imu.gy || 0;
                  AppState.currentTelemetry.gz = pkt.imu.gz || 0;
                }

                updateDashboardTelemetryUI();
                if (AppState.hand3d) {
                  const t = AppState.currentTelemetry;
                  AppState.hand3d.setFlexion(t.thumb_bend_pct, t.index_bend_pct, t.middle_bend_pct, t.ring_bend_pct, t.pinky_bend_pct);
                  AppState.hand3d.setIMUOrientation(t.ax, t.ay, t.az);
                }
                classifyCurrentTelemetry(true);
              }
            } catch (e) { }
          } else {
            const parts = trimmed.split(',');
            if (parts.length >= 11) {
              AppState.currentTelemetry.thumb_raw = parseInt(parts[0], 10) || 0;
              AppState.currentTelemetry.index_raw = parseInt(parts[1], 10) || 0;
              AppState.currentTelemetry.middle_raw = parseInt(parts[2], 10) || 0;
              AppState.currentTelemetry.ring_raw = parseInt(parts[3], 10) || 0;
              AppState.currentTelemetry.pinky_raw = parseInt(parts[4], 10) || 0;

              AppState.currentTelemetry.thumb_bend_pct = Math.min(100, Math.round((AppState.currentTelemetry.thumb_raw / 255) * 100));
              AppState.currentTelemetry.index_bend_pct = Math.min(100, Math.round((AppState.currentTelemetry.index_raw / 255) * 100));
              AppState.currentTelemetry.middle_bend_pct = Math.min(100, Math.round((AppState.currentTelemetry.middle_raw / 255) * 100));
              AppState.currentTelemetry.ring_bend_pct = Math.min(100, Math.round((AppState.currentTelemetry.ring_raw / 255) * 100));
              AppState.currentTelemetry.pinky_bend_pct = Math.min(100, Math.round((AppState.currentTelemetry.pinky_raw / 255) * 100));

              updateDashboardTelemetryUI();
              if (AppState.hand3d) {
                const t = AppState.currentTelemetry;
                AppState.hand3d.setFlexion(t.thumb_bend_pct, t.index_bend_pct, t.middle_bend_pct, t.ring_bend_pct, t.pinky_bend_pct);
              }
              classifyCurrentTelemetry(true);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Web Serial stream ended:', err);
  } finally {
    reader.releaseLock();
  }
}

// -------------------------------------------------------------
// Workspace Audio & Voice Studio Controls
// -------------------------------------------------------------
function initWorkspaceControls() {
  const autoSpeechToggle = document.getElementById('autoSpeechToggle');
  if (autoSpeechToggle) {
    autoSpeechToggle.checked = AppState.autoSpeechEnabled;
    autoSpeechToggle.addEventListener('change', (e) => {
      AppState.autoSpeechEnabled = e.target.checked;
      localStorage.setItem('hv_auto_speech', e.target.checked.toString());
      showToast(`Auto-Voice: ${e.target.checked ? 'Enabled' : 'Muted'}`, 'info');
    });
  }

  const muteBtn = document.getElementById('muteAudioBtn');
  const muteLabel = document.getElementById('muteBtnLabel');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      AppState.isMuted = !AppState.isMuted;
      if (AppState.isMuted) {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (muteLabel) muteLabel.textContent = 'Muted';
        muteBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> <span id="muteBtnLabel">Muted</span>';
        muteBtn.className = 'cyber-btn secondary';
        showToast('All Voice Output Muted', 'info');
      } else {
        if (muteLabel) muteLabel.textContent = 'Sound ON';
        muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> <span id="muteBtnLabel">Sound ON</span>';
        muteBtn.className = 'cyber-btn primary-glow';
        showToast('Voice Output Unmuted', 'success');
      }
    });
  }

  const pauseBtn = document.getElementById('pauseAudioBtn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      AppState.isPaused = !AppState.isPaused;
      if (AppState.isPaused) {
        if (window.speechSynthesis) window.speechSynthesis.pause();
        pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> <span>Resume</span>';
        showToast('Speech Output Paused', 'info');
      } else {
        if (window.speechSynthesis) window.speechSynthesis.resume();
        pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> <span>Pause</span>';
        showToast('Speech Output Resumed', 'info');
      }
    });
  }

  // Note: Quick voice strip removed from Translation Hub per requirements;
  // all voice customization is consolidated inside the Profile Modal Central Studio.

  const pitchSlider = document.getElementById('voicePitchSlider');
  const pitchVal = document.getElementById('voicePitchVal');
  if (pitchSlider) {
    pitchSlider.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      AppState.customPitch = v;
      if (pitchVal) pitchVal.textContent = v.toFixed(2);
    });
  }

  const volSlider = document.getElementById('voiceVolumeSlider');
  const volVal = document.getElementById('voiceVolumeVal');
  if (volSlider) {
    volSlider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      AppState.customVolume = v / 100.0;
      if (volVal) volVal.textContent = `${v}%`;
    });
  }
}

// -------------------------------------------------------------
// Dataset Management Grid Rendering (All 31 Signs)
// -------------------------------------------------------------
function renderDatasetManagementGrid() {
  const grid = document.getElementById('datasetMgmtGrid');
  if (!grid || !window.HANDIVOICE_DATASET) return;

  grid.innerHTML = '';
  window.HANDIVOICE_DATASET.forEach((sign, idx) => {
    const chip = document.createElement('div');
    chip.className = 'dataset-sign-chip';
    chip.title = `Sign: ${sign.cleanLabel || sign.label} (${sign.sampleCount || 50} samples) - Click to test`;
    chip.innerHTML = `
      <span class="dataset-sign-symbol">${sign.cleanLabel || sign.label}</span>
      <span class="dataset-sign-count">${sign.sampleCount || 45} samples</span>
    `;
    chip.addEventListener('click', () => {
      loadGestureTelemetry(sign, true);
      showToast(`Loaded gesture sample: ${sign.cleanLabel || sign.label}`, 'info');
    });
    grid.appendChild(chip);
  });
}

async function triggerModelRetrain() {
  showToast('Initiating model retraining on authentic CSV dataset...', 'info');
  try {
    const res = await fetch(`${AppState.bridge.apiUrl}/retrain`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Retraining running in Python bridge. Model will reload automatically.', 'success');
    } else {
      showToast('Retrain response: ' + (data.message || 'OK'), 'info');
    }
  } catch (err) {
    showToast('Python bridge offline. Retraining requires local bridge.', 'error');
  }
}

async function toggleWebBluetooth() {
  if (AppState.ble.connected) {
    if (AppState.ble.device && AppState.ble.device.gatt.connected) {
      AppState.ble.device.gatt.disconnect();
    }
    AppState.ble.connected = false;
    updateBleUI(false);
    showToast('ESP32-S3 Glove Disconnected', 'info');
    return;
  }

  if (!navigator.bluetooth) {
    showToast('Web Bluetooth not supported in this browser. Please use Chrome/Edge.', 'error');
    AppState.simulationMode = true;
    const simToggle = document.getElementById('simModeToggle');
    if (simToggle) simToggle.checked = true;
    return;
  }

  try {
    showToast('Scanning for HandiVoice_Glove (ESP32-S3)...', 'info');
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'HandiVoice' }, { namePrefix: 'ESP32' }],
      optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e', 0x180f, 0x1800]
    });

    device.addEventListener('gattserverdisconnected', onBleDisconnected);
    const server = await device.gatt.connect();
    AppState.ble.device = device;
    AppState.ble.server = server;
    AppState.ble.connected = true;

    updateBleUI(true);
    showToast('Connected to ESP32-S3 SuperMini Glove!', 'success');

    try {
      const service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
      const characteristic = await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e');
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleBlePacket);
    } catch (svcErr) {
      console.warn('Standard UART streaming initialized.');
    }

  } catch (err) {
    console.error('BLE connection error:', err);
    updateBleUI(false);
    showToast('Bluetooth pairing cancelled or timed out.', 'info');
  }
}

function onBleDisconnected() {
  AppState.ble.connected = false;
  updateBleUI(false);
  showToast('Connection with glove lost', 'error');
}

function updateBleUI(connected) {
  const btn = document.getElementById('bleConnectBtn');
  const badge = document.getElementById('bleStateBadge');
  const dict = I18N[AppState.language];

  if (badge) {
    badge.className = `ble-state-badge ${connected ? 'connected' : 'disconnected'}`;
    badge.innerHTML = `<span class="confidence-dot" style="background: ${connected ? 'var(--success-green)' : 'var(--danger-red)'};"></span> ${connected ? dict.ble_connected : dict.ble_disconnected}`;
  }

  if (btn) {
    btn.innerHTML = connected ?
      `<i class="fa-solid fa-link-slash"></i> ${dict.ble_disconnect_btn}` :
      `<i class="fa-brands fa-bluetooth-b"></i> ${dict.ble_connect_btn}`;
    btn.className = connected ? 'cyber-btn secondary' : 'cyber-btn primary-glow';
  }
}

function handleBlePacket(event) {
  const value = event.target.value;
  const decoder = new TextDecoder('utf-8');
  const str = decoder.decode(value).trim();

  try {
    const parts = str.split(',');
    if (parts.length >= 11) {
      AppState.currentTelemetry.thumb_raw = parseInt(parts[0], 10);
      AppState.currentTelemetry.index_raw = parseInt(parts[1], 10);
      AppState.currentTelemetry.middle_raw = parseInt(parts[2], 10);
      AppState.currentTelemetry.ring_raw = parseInt(parts[3], 10);
      AppState.currentTelemetry.pinky_raw = parseInt(parts[4], 10);

      AppState.currentTelemetry.thumb_bend_pct = Math.min(100, Math.round((AppState.currentTelemetry.thumb_raw / 255) * 100));
      AppState.currentTelemetry.index_bend_pct = Math.min(100, Math.round((AppState.currentTelemetry.index_raw / 255) * 100));
      AppState.currentTelemetry.middle_bend_pct = Math.min(100, Math.round((AppState.currentTelemetry.middle_raw / 255) * 100));
      AppState.currentTelemetry.ring_bend_pct = Math.min(100, Math.round((AppState.currentTelemetry.ring_raw / 255) * 100));
      AppState.currentTelemetry.pinky_bend_pct = Math.min(100, Math.round((AppState.currentTelemetry.pinky_raw / 255) * 100));

      AppState.currentTelemetry.ax = parseFloat(parts[5]);
      AppState.currentTelemetry.ay = parseFloat(parts[6]);
      AppState.currentTelemetry.az = parseFloat(parts[7]);
      AppState.currentTelemetry.gx = parseFloat(parts[8]);
      AppState.currentTelemetry.gy = parseFloat(parts[9]);
      AppState.currentTelemetry.gz = parseFloat(parts[10]);

      updateDashboardTelemetryUI();

      if (AppState.hand3d) {
        const t = AppState.currentTelemetry;
        AppState.hand3d.setFlexion(t.thumb_bend_pct, t.index_bend_pct, t.middle_bend_pct, t.ring_bend_pct, t.pinky_bend_pct);
        AppState.hand3d.setIMUOrientation(t.ax, t.ay, t.az);
      }

      classifyCurrentTelemetry(true);
    }
  } catch (e) {
    console.error('Packet parsing error:', e);
  }
}

function updateDashboardTelemetryUI() {
  const t = AppState.currentTelemetry;
  const fingers = ['thumb', 'index', 'middle', 'ring', 'pinky'];

  fingers.forEach((f, idx) => {
    const bar = document.getElementById(`bar-${idx}`);
    const val = document.getElementById(`val-${idx}`);
    const pct = t[`${f}_bend_pct`];
    const raw = t[`${f}_raw`];

    if (bar) bar.style.width = `${pct}%`;
    if (val) val.textContent = `${pct}% (${raw})`;
  });

  const axEl = document.getElementById('imuAx');
  const ayEl = document.getElementById('imuAy');
  const azEl = document.getElementById('imuAz');
  const gxEl = document.getElementById('imuGx');
  const gyEl = document.getElementById('imuGy');
  const gzEl = document.getElementById('imuGz');

  if (axEl) axEl.textContent = (t.ax || 0).toFixed(2);
  if (ayEl) ayEl.textContent = (t.ay || 0).toFixed(2);
  if (azEl) azEl.textContent = (t.az || 0).toFixed(2);
  if (gxEl) gxEl.textContent = (t.gx || 0).toFixed(2);
  if (gyEl) gyEl.textContent = (t.gy || 0).toFixed(2);
  if (gzEl) gzEl.textContent = (t.gz || 0).toFixed(2);
}

let lastSpokenGloveSign = null;
let lastGloveSpeechTimestamp = 0;

function classifyCurrentTelemetry(isFromHardwareGlove = false) {
  if (!window.HANDIVOICE_DATASET) return;

  const t = AppState.currentTelemetry;
  let bestMatch = null;
  let minDistance = Infinity;

  window.HANDIVOICE_DATASET.forEach(g => {
    const dThumb = Math.abs(g.thumb_bend_pct - t.thumb_bend_pct);
    const dIndex = Math.abs(g.index_bend_pct - t.index_bend_pct);
    const dMiddle = Math.abs(g.middle_bend_pct - t.middle_bend_pct);
    const dRing = Math.abs(g.ring_bend_pct - t.ring_bend_pct);
    const dPinky = Math.abs(g.pinky_bend_pct - t.pinky_bend_pct);

    const dist = (dThumb * 1.2) + (dIndex * 1.5) + (dMiddle * 1.0) + (dRing * 1.0) + (dPinky * 1.2);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = g;
    }
  });

  if (bestMatch && bestMatch !== AppState.activeGesture) {
    AppState.activeGesture = bestMatch;
    displayGestureResult(bestMatch);

    // If triggered via live HandiVoice hardware glove or auto-speech is enabled
    const isLiveGlove = isFromHardwareGlove || AppState.ble.connected || AppState.serial.connected || (AppState.bridge.isOnline && AppState.hardwareStatus === 'RECOGNIZING') || window.isHandiVoiceMobileWrapper;
    if (AppState.autoSpeechEnabled && !AppState.isMuted && !AppState.isPaused && isLiveGlove && minDistance < 60) {
      const now = Date.now();
      // Debounce slightly to prevent audio stuttering while user holds the sign
      if (lastSpokenGloveSign !== bestMatch.cleanLabel || (now - lastGloveSpeechTimestamp) > 1200) {
        lastSpokenGloveSign = bestMatch.cleanLabel;
        lastGloveSpeechTimestamp = now;

        const audioLang = AppState.speechOutputLanguage || AppState.language || 'en';
        const spokenText = getGesturePronunciation(bestMatch, audioLang);
        // Stream output directly out loud through the device speaker
        streamAudioToMobileSpeaker(spokenText, audioLang);
      }
    }
  }
}

function toggleAutoTour() {
  const btn = document.getElementById('autoTourBtn');
  const dict = I18N[AppState.language];

  if (AppState.autoTourInterval) {
    clearInterval(AppState.autoTourInterval);
    AppState.autoTourInterval = null;
    if (btn) btn.innerHTML = `<i class="fa-solid fa-play"></i> ${dict.auto_tour_start}`;
    showToast('Auto-Cycle Paused', 'info');
  } else {
    if (!window.HANDIVOICE_DATASET || window.HANDIVOICE_DATASET.length === 0) return;
    let idx = 0;
    AppState.autoTourInterval = setInterval(() => {
      // Auto tour cycles 3D kinematics silently without auto-speech
      loadGestureTelemetry(window.HANDIVOICE_DATASET[idx], false);
      idx = (idx + 1) % window.HANDIVOICE_DATASET.length;
    }, 2800);
    if (btn) btn.innerHTML = `<i class="fa-solid fa-pause"></i> ${dict.auto_tour_stop}`;
    showToast('Auto-Cycling all 31 Gestures with 3D Simulation', 'info');
  }
}

/* ==========================================================================
   12. HISTORY & AUDIT LOGS
   ========================================================================== */
function logTranslation(entry) {
  const timestamp = new Date().toLocaleTimeString();
  const logItem = {
    id: Date.now(),
    time: timestamp,
    source: entry.source,
    input: entry.input,
    output: entry.output,
    confidence: entry.confidence || 98.5
  };

  AppState.translationHistory.unshift(logItem);
  if (AppState.translationHistory.length > 50) AppState.translationHistory.pop();
  renderHistoryTable();
}

function renderHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  const searchInput = document.getElementById('historySearchInput');
  const query = searchInput ? searchInput.value.toLowerCase() : '';

  const filtered = AppState.translationHistory.filter(item => {
    return item.input.toLowerCase().includes(query) || item.output.toLowerCase().includes(query);
  });

  tbody.innerHTML = '';
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No translation logs recorded yet.</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span style="font-family: 'Orbitron', monospace; font-size: 0.8rem;">${item.time}</span></td>
      <td>
        <span class="source-badge ${item.source}">
          <i class="fa-solid ${item.source === 'glove' ? 'fa-hand-back-fist' : 'fa-microphone'}"></i>
          ${item.source === 'glove' ? 'Glove' : 'Speech'}
        </span>
      </td>
      <td><strong>${item.input}</strong></td>
      <td style="color: var(--primary-cyan); font-weight: 700;">${item.output}</td>
      <td>
        <button class="cyber-btn secondary" style="padding: 4px 10px; font-size: 0.78rem;" onclick="streamAudioToMobileSpeaker('${item.output}')">
          <i class="fa-solid fa-volume-high"></i> Play
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function exportHistoryCSV() {
  if (AppState.translationHistory.length === 0) {
    showToast('No history to export.', 'info');
    return;
  }

  let csv = 'ID,Time,Source,Input,Output,Confidence\n';
  AppState.translationHistory.forEach(h => {
    csv += `"${h.id}","${h.time}","${h.source}","${h.input.replace(/"/g, '""')}","${h.output.replace(/"/g, '""')}","${h.confidence}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HandiVoice_History_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Translation History exported successfully', 'success');
}

function clearHistory() {
  AppState.translationHistory = [];
  renderHistoryTable();
  showToast('History cleared', 'info');
}

/* ==========================================================================
   13. USER PROFILE & CUSTOM VOICE MODAL (LOGIN/REGISTER REMOVED)
   ========================================================================== */
function initProfileModal() {
  const modal = document.getElementById('profileModalOverlay');
  const closeBtn = document.getElementById('closeProfileModalBtn');
  const nidToggle = document.getElementById('toggleNidMaskBtn');
  const nidInput = document.getElementById('profNationalId');
  const speedSlider = document.getElementById('voiceSpeedSlider');
  const speedVal = document.getElementById('voiceSpeedVal');
  const testSpeechBtn = document.getElementById('testCurrentSpeechBtn');
  const avatarInput = document.getElementById('avatarFileInput');
  const avatarUploadBtn = document.getElementById('avatarUploadBtn');
  const logoutActionBtn = document.getElementById('logoutActionBtn');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  if (avatarUploadBtn && avatarInput) {
    avatarUploadBtn.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          AppState.auth.user.avatar = event.target.result;
          updateUserUI();
          showToast('Profile photo updated successfully!', 'success');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (nidToggle && nidInput) {
    nidToggle.addEventListener('click', () => {
      AppState.auth.user.nationalIdMasked = !AppState.auth.user.nationalIdMasked;
      if (AppState.auth.user.nationalIdMasked) {
        nidInput.value = maskNationalId(AppState.auth.user.nationalId);
        nidToggle.innerHTML = '<i class="fa-solid fa-eye"></i>';
      } else {
        nidInput.value = AppState.auth.user.nationalId;
        nidToggle.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
      }
    });
  }

  if (speedSlider && speedVal) {
    speedSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      AppState.auth.user.speechSpeed = val;
      speedVal.textContent = `${val.toFixed(2)}x`;
    });
  }

  const volSlider = document.getElementById('voiceVolumeSlider');
  const volVal = document.getElementById('voiceVolumeVal');
  if (volSlider && volVal) {
    volSlider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      AppState.auth.user.volumeMult = v / 100;
      volVal.textContent = `${v}%`;
    });
  }

  if (testSpeechBtn) {
    testSpeechBtn.addEventListener('click', () => {
      const targetLang = AppState.speechOutputLanguage || AppState.language || 'en';
      const sample = (targetLang === 'ar')
        ? "هاندي فويس برو، ترجمة ذكية وفورية للغة الإشارة"
        : "HandiVoice PRO, intelligent speech synthesis.";
      synthesizeSpeech(sample, targetLang, true);
      showToast(`Testing voice profile: "${sample}"`, 'info');
    });
  }

  const profileForm = document.getElementById('userProfileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      AppState.auth.user.fullName = document.getElementById('profFullName').value.trim();
      AppState.auth.user.email = document.getElementById('profEmail').value.trim();
      AppState.auth.user.phone = document.getElementById('profPhone').value.trim();

      const rawNid = nidInput.value.replace(/\*/g, '').trim();
      if (rawNid && rawNid.length > 5) {
        AppState.auth.user.nationalId = rawNid;
      }

      // Persist voice configuration
      AppState.auth.user.voiceGender = AppState.voiceGender || 'female';
      AppState.auth.user.voiceStyle = AppState.voiceStyle || 'classic';
      localStorage.setItem('hv_voice_gender', AppState.auth.user.voiceGender);
      localStorage.setItem('hv_voice_style', AppState.auth.user.voiceStyle);

      saveUserSession();
      modal.classList.remove('active');
      showToast('Profile and voice engine settings saved!', 'success');
    });
  }

  // Logout / Switch Account Action
  if (logoutActionBtn) {
    logoutActionBtn.addEventListener('click', () => {
      AppState.auth.isLoggedIn = false;
      localStorage.setItem('hv_is_logged_in', 'false');
      modal.classList.remove('active');

      const landingScreen = document.getElementById('landingAuthScreen');
      if (landingScreen) {
        landingScreen.classList.remove('hidden');
      }
      showToast('Logged out. Please sign in or switch account.', 'info');
    });
  }
}

function openProfileModal() {
  const modal = document.getElementById('profileModalOverlay');
  if (!modal) return;

  const u = AppState.auth.user;
  document.getElementById('profFullName').value = u.fullName || '';
  document.getElementById('profEmail').value = u.email || '';
  document.getElementById('profPhone').value = u.phone || '';

  const nidInput = document.getElementById('profNationalId');
  if (nidInput) {
    nidInput.value = u.nationalIdMasked ? maskNationalId(u.nationalId) : (u.nationalId || '');
  }

  // Synchronize both Voice Category (Female/Male) & 3-Style Voice Card (Sharp, Classic, Strong)
  const activeGender = AppState.voiceGender || u.voiceGender || 'female';
  const activeStyle = AppState.voiceStyle || u.voiceStyle || 'classic';
  selectVoiceCategory(activeGender, false);
  selectActiveVoiceStyle(activeStyle, false);

  const speedSlider = document.getElementById('voiceSpeedSlider');
  const speedVal = document.getElementById('voiceSpeedVal');
  if (speedSlider) speedSlider.value = u.speechSpeed || 1.0;
  if (speedVal) speedVal.textContent = `${(u.speechSpeed || 1.0).toFixed(2)}x`;

  const volSlider = document.getElementById('voiceVolumeSlider');
  const volVal = document.getElementById('voiceVolumeVal');
  if (volSlider) {
    const curVol = (u.volumeMult !== undefined) ? Math.round(u.volumeMult * 100) : 100;
    volSlider.value = curVol;
    if (volVal) volVal.textContent = `${curVol}%`;
  }

  updateVoiceStatusUI();
  updateUserUI();
  modal.classList.add('active');
}

function updateUserUI() {
  const u = AppState.auth.user;
  const headerName = document.getElementById('headerUserName');
  if (headerName) headerName.textContent = u.fullName.split(' ')[0] || 'Mariam';

  const avatarThumbs = document.querySelectorAll('.user-avatar-img');
  avatarThumbs.forEach(img => {
    if (u.avatar) {
      img.src = u.avatar;
      img.style.display = 'block';
    }
  });
}

function saveUserSession() {
  localStorage.setItem('hv_user', JSON.stringify(AppState.auth.user));
  updateUserUI();
}

function maskNationalId(nid) {
  if (!nid || nid.length < 8) return '2980415******7';
  return nid.slice(0, 6) + '******' + nid.slice(-1);
}

/* ==========================================================================
   14. LIVE CLOCK (FOR PHONE HARDWARE STATUS BAR)
   ========================================================================== */
function initLiveClock() {
  const clockEl = document.getElementById('phoneLiveClock');
  if (!clockEl) return;

  function update() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${h}:${m}`;
  }
  update();
  setInterval(update, 30000);
}

/* ==========================================================================
   ARABYBOT-INSPIRED DYNAMIC PARTICLES & INTERACTIVE SMOOTH ANIMATIONS
   ========================================================================== */
function initArabyVisuals() {
  const canvas = document.getElementById('arabyParticleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const particles = [];
  const particleCount = Math.min(50, Math.max(25, Math.floor((width * height) / 22000)));
  const colors = [
    'rgba(0, 240, 255, ',    // Cyan
    'rgba(138, 43, 226, ',   // Neon Purple
    'rgba(59, 130, 246, ',   // Cyber Blue
    'rgba(168, 85, 247, '    // Violet
  ];

  const mouse = { x: null, y: null, radius: 120 };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    mouse.x = null;
    mouse.y = null;
  });

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  class ArabyParticle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = initial ? Math.random() * width : (Math.random() > 0.5 ? 0 : width);
      this.y = initial ? Math.random() * height : Math.random() * height;
      this.radius = Math.random() * 2.2 + 0.8;
      this.baseAlpha = Math.random() * 0.45 + 0.25;
      this.alpha = this.baseAlpha;
      this.vx = (Math.random() - 0.5) * 0.65;
      this.vy = (Math.random() - 0.5) * 0.65;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.pulseSpeed = Math.random() * 0.02 + 0.01;
      this.pulseAngle = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Pulse alpha smoothly
      this.pulseAngle += this.pulseSpeed;
      this.alpha = this.baseAlpha + Math.sin(this.pulseAngle) * 0.15;

      // Wrap around edges
      if (this.x < -10) this.x = width + 10;
      else if (this.x > width + 10) this.x = -10;
      if (this.y < -10) this.y = height + 10;
      else if (this.y > height + 10) this.y = -10;

      // Mouse interactive deflection / glow
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          this.x -= Math.cos(angle) * force * 2.5;
          this.y -= Math.sin(angle) * force * 2.5;
          this.alpha = Math.min(1.0, this.alpha + 0.4);
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${this.color}${Math.max(0.1, this.alpha)})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.4)';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new ArabyParticle());
  }

  let animationFrameId = null;
  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw connecting threads for neural bionic network feel
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 85) {
          const threadAlpha = (1 - dist / 85) * 0.16;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${threadAlpha})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }

    // Update and draw particles
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    animationFrameId = requestAnimationFrame(animate);
  }

  // Only animate if page visible for optimal battery and performance
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    } else {
      animate();
    }
  });

  animate();

  // GSAP Smooth Fluid Entrance Animations
  if (window.gsap) {
    try {
      gsap.from('.landing-hero-left', {
        duration: 1.1,
        y: 28,
        opacity: 0,
        ease: 'power3.out',
        delay: 0.15
      });
      gsap.from('.araby-auth-card', {
        duration: 1.2,
        y: 35,
        opacity: 0,
        scale: 0.96,
        ease: 'power3.out',
        delay: 0.25
      });
      gsap.from('.feat-card', {
        duration: 0.8,
        y: 20,
        opacity: 0,
        stagger: 0.1,
        ease: 'back.out(1.4)',
        delay: 0.45
      });
    } catch (e) { }
  }
}

/* ==========================================================================
   15. INTERACTIVE AI CHATBOT (HANDIAI)
   ========================================================================== */
function initHandIAIChatbot() {
  const toggleBtn = document.getElementById('aiChatbotToggleBtn');
  const chatWindow = document.getElementById('aiChatWindow');
  const closeBtn = document.getElementById('closeAiChatBtn');
  const sendBtn = document.getElementById('aiSendBtn');
  const input = document.getElementById('aiChatInput');

  if (toggleBtn && chatWindow) {
    toggleBtn.addEventListener('click', () => {
      chatWindow.classList.toggle('open');
      const badge = document.querySelector('.ai-unread-badge');
      if (badge) badge.style.display = 'none';
      if (chatWindow.classList.contains('open') && input) input.focus();
    });
  }

  if (closeBtn && chatWindow) {
    closeBtn.addEventListener('click', () => chatWindow.classList.remove('open'));
  }

  if (sendBtn && input) {
    sendBtn.addEventListener('click', handleUserChatMessage);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleUserChatMessage();
    });
  }

  document.querySelectorAll('.ai-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-question');
      if (input) input.value = q;
      handleUserChatMessage();
    });
  });
}

function handleUserChatMessage() {
  const input = document.getElementById('aiChatInput');
  const container = document.getElementById('aiChatMessages');
  if (!input || !container) return;

  const msg = input.value.trim();
  if (!msg) return;

  appendChatBubble(msg, 'user');
  input.value = '';

  setTimeout(() => {
    const reply = generateHandIAIReply(msg);
    appendChatBubble(reply, 'bot');
  }, 450);
}

function appendChatBubble(text, sender) {
  const container = document.getElementById('aiChatMessages');
  if (!container) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function generateHandIAIReply(query) {
  const q = query.toLowerCase();
  const lang = AppState.language;

  // 1. HARDWARE & PINOUT QUERIES
  if (q.includes('pinout') || q.includes('hardware') || q.includes('esp32') || q.includes('gpio') || q.includes('supermini') || q.includes('عتاد') || q.includes('توصيل')) {
    if (lang === 'ar') {
      return "تفاصيل عتاد HandiVoice PRO:\n• المعالج: ESP32-S3 SuperMini ثنائي النواة Xtensa LX7 بتردد 240 ميجاهرتز.\n• حساسات الانثناء (ADC1): الإبهام (GPIO 1)، السبابة (GPIO 2)، الوسطى (GPIO 3)، البنصر (GPIO 4)، الخنصر (GPIO 5).\n• حساس الحركة MPU6050 (I2C): خط البيانات SDA (GPIO 8)، خط الساعة SCL (GPIO 9) عند العنوان 0x68.\n• البطارية: ليثيوم بوليمر 3.7V مع شريحة شحن مدمجة توفر 18 ساعة عمل مستمرة.";
    } else if (lang === 'it') {
      return "Specifiche Hardware ESP32-S3 SuperMini:\n• MCU: Xtensa LX7 dual-core @ 240 MHz con 512KB SRAM.\n• 5 Sensori di flessione su ADC1: Pollice (GPIO 1), Indice (GPIO 2), Medio (GPIO 3), Anulare (GPIO 4), Mignolo (GPIO 5).\n• IMU 6 assi MPU6050 via I2C: SDA (GPIO 8), SCL (GPIO 9) su indirizzo 0x68.\n• Batteria LiPo da 3.7V con regolatore LDO a 3.3V (autonomia di 18 ore).";
    } else if (lang === 'fr') {
      return "Spécifications Matérielles ESP32-S3 SuperMini:\n• Processeur: Xtensa LX7 double cœur @ 240 MHz.\n• 5 Capteurs de flexion (ADC1): Pouce (GPIO 1), Index (GPIO 2), Majeur (GPIO 3), Annulaire (GPIO 4), Auriculaire (GPIO 5).\n• Capteur IMU MPU6050 via I2C: SDA (GPIO 8), SCL (GPIO 9), adresse 0x68.\n• Batterie LiPo 3.7V offrant jusqu'à 18 heures d'autonomie continue.";
    } else {
      return "ESP32-S3 SuperMini Hardware Architecture:\n• MCU: Dual-core Xtensa 32-bit LX7 running at 240 MHz with 512KB SRAM and 4MB Flash.\n• 5 Flex Sensors (ADC1 Matrix): Thumb (GPIO 1), Index (GPIO 2), Middle (GPIO 3), Ring (GPIO 4), Pinky (GPIO 5).\n• MPU6050 6-Axis IMU (I2C): SDA (GPIO 8), SCL (GPIO 9) at address 0x68.\n• Power: 3.7V 850mAh LiPo battery with onboard MCP73831 charging controller (18-hour continuous runtime).";
    }
  }

  // 2. MACHINE LEARNING & DATASET QUERIES
  if (q.includes('dataset') || q.includes('random forest') || q.includes('model') || q.includes('ai') || q.includes('ml') || q.includes('accuracy') || q.includes('تدريب') || q.includes('نموذج')) {
    if (lang === 'ar') {
      return "هندسة الذكاء الاصطناعي في HandiVoice PRO:\n• النموذج: Random Forest Classifier (100 Decision Trees) مدرب على 31 صنفاً من سجلات HandiVoiceDataSet.\n• شعاع المدخلات: 16 متغيراً حركياً (5 حساسات خام + 5 نسب مئوية + 3 تسارع Ax,Ay,Az + 3 دوران Gx,Gy,Gz).\n• الدقة: 98.8% وزمن استدلال طرفي فائق السرعة أقل من 8 مللي ثانية.\n• يدعم تصنيف كل حروف الأبجدية وعلامات الترقيم مباشرة عبر جسر بايثون المحلي.";
    } else {
      return "HandiVoice PRO Machine Learning Pipeline:\n• Model: Random Forest Classifier bundle (100 Decision Trees, Gini Impurity criterion, max depth 15).\n• Input Feature Vector: 16 telemetry metrics [thumb_raw, index_raw, middle_raw, ring_raw, pinky_raw, thumb_bend_pct, index_bend_pct, middle_bend_pct, ring_bend_pct, pinky_bend_pct, ax, ay, az, gx, gy, gz].\n• Training Benchmark: 31 gesture classes extracted from authentic HandiVoiceDataSet CSV logs.\n• Performance: 98.8% validation accuracy with sub-8ms edge inference latency.";
    }
  }

  // 2B. CALIBRATION GUIDANCE
  if (q.includes('calibrat') || q.includes('معايرة') || q.includes('صفر') || q.includes('ضبط')) {
    if (lang === 'ar') {
      return "خطوات معايرة قفاز HandiVoice PRO:\n1. اجعل يدك مستوية ومنبسطة تماماً لمدة ثانيتين لتسجيل قراءة الأساس (0° انثناء).\n2. اضمم يدك وقبضتك بالكامل لتسجيل أقصى انثناء (100%).\n3. يقوم النظام بتعويض الانزياح الحراري تلقائياً ومواءمة القيم مع مصفوفة الـ ADC1.";
    } else {
      return "HandiVoice PRO Glove Calibration Procedure:\n1. Resting Pose: Hold hand flat and still for 2 seconds to set resting baseline (0% flexion, 0° angle).\n2. Full Fist Pose: Close fist tightly for 2 seconds to register dynamic maximum resistance.\n3. Dynamic auto-calibration compensates for thermal drift and flex sensor wear.";
    }
  }

  // 2C. PYTHON BRIDGE & SERIAL PORTS
  if (q.includes('bridge') || q.includes('com') || q.includes('port') || q.includes('serial') || q.includes('جسر') || q.includes('منفذ') || q.includes('سيريال')) {
    if (lang === 'ar') {
      return "طريقة تشغيل جسر بايثون الذكي (Python AI Bridge):\n1. شغّل ملف `start_ai_bridge.bat` في المجلد الرئيسي لتشغيل الخادم على المنفذ 8765.\n2. سيكتشف الخادم منافذ الـ COM تلقائياً ويحمّل نموذج Random Forest في الذاكرة.\n3. في لوحة تحكم القفاز، اختر منفذ الـ COM (مثلاً COM7) واضغط 'CONNECT DEVICE'.\n4. يمكنك أيضاً استخدام Web Serial المباشر لتوصيل كابل الـ USB مباشرة بالمتصفح!";
    } else {
      return "Connecting via Local Python AI Bridge:\n1. Launch `start_ai_bridge.bat` in the project root to start the Starlette/Uvicorn bridge on http://localhost:8765.\n2. The bridge loads `HandiVoice_RandomForest.joblib`, reads serial packets at 115200 baud, and streams 50Hz telemetry + predictions via WebSocket.\n3. In the Glove Connection Center, select your COM port (e.g. COM7) and click 'CONNECT DEVICE'.\n4. Direct Web Serial is also supported as a zero-install fallback in Chrome/Edge!";
    }
  }

  // 3. 3D HAND KINEMATICS & GESTURES
  if (q.includes('3d') || q.includes('kinematics') || q.includes('alif') || q.includes('hand') || q.includes('pose') || q.includes('mano') || q.includes('يد') || q.includes('أليف')) {
    if (lang === 'ar') {
      return "نموذج اليد 3D الحركي (Three.js WebGL):\n• يحتوي على 14 مفصلاً تشريحياً يماثل اليد البشرية.\n• عند اختيار حرف 'أ' (الألف): يمتد إصبع السبابة مستقيماً للأعلى (انثناء 0-28%)، بينما تنطوي باقي الأصابع في راحة اليد (انثناء 96%) ويستقر الإبهام فوقها.\n• يستجيب النموذج فورياً لقياسات الجيروسكوب والتسارع ليعكس ميل معصم المستخدم في الفضاء الثلاثي الأبعاد.";
    } else {
      return "3D Hand Kinematics Engine (Three.js / WebGL):\n• Anatomical structure with 14 articulated joint nodes mirroring human hand bones.\n• Sign Pose for Alif ('أ'): Index finger straight upright (raw: 71, bend: 0-28%), thumb folded across palm (raw: 1), while Middle, Ring, and Pinky are tightly curled (raw: 171-265, bend: 96%).\n• Dynamic wrist orientation updates in real-time according to MPU6050 roll, pitch, and yaw.";
    }
  }

  // 4. VOICE ENGINE & ISOLATED AUDIO
  if (q.includes('voice') || q.includes('audio') || q.includes('female') || q.includes('male') || q.includes('speed') || q.includes('sound') || q.includes('صوت') || q.includes('نبرة')) {
    if (lang === 'ar') {
      return "محرك التوليد الصوتي المخصص:\n• ملف صوت أنثوي: نبرة ترددية رنانة عالية (1.38x) مع نقاء في مخارج الحروف.\n• ملف صوت ذكوري: نبرة منخفضة عميقة (0.72x) برنين باريتون فخم.\n• أنماط النطق: Sharp (حاد وسريع)، Classic (متوازن وطبيعي)، Powerful (صوت واثق ورخيم).\n• يمكنك تحديد لغة الصوت المنطوق (عربي، إنجليزي، إيطالي، فرنسي) بشكل معزول ومستقل عن لغة الموقع من القائمة المنسدلة بجوار زر تشغيل الصوت.";
    } else {
      return "Advanced Voice Customization Engine:\n• Female Voice Profile: High harmonic formant frequency (1.38x pitch) with bright acoustic timbre.\n• Male Voice Profile: Deep baritone resonance (0.72x pitch) with warm bass.\n• Acoustic Styles: Sharp (crisp & fast), Classic (natural neutral), Powerful (deep & assertive resonance).\n• Isolated Audio Dropdown: Select the spoken output language independently right next to the 'Replay Audio' button in the Translation Hub.";
    }
  }

  // 5. BLUETOOTH & PAIRING
  if (q.includes('bluetooth') || q.includes('pair') || q.includes('ble') || q.includes('connect') || q.includes('ربط') || q.includes('بلوتوث')) {
    if (lang === 'ar') {
      return "طريقة ربط القفاز عبر البلوتوث:\n1. تأكد من تشغيل البلوتوث على جهازك وتشغيل قفاز ESP32-S3.\n2. افتح تبويب 'لوحة تحكم القفاز والبلوتوث' في الأسفل.\n3. اضغط على زر 'ربط القفاز عبر Web Bluetooth' واختر 'HandiVoice_Glove'.\n4. يمكنك أيضاً تفعيل 'وضع المحاكاة الافتراضية' لاختبار المنصة بدون قفاز فيزيائي!";
    } else {
      return "How to Connect ESP32-S3 via Web Bluetooth:\n1. Turn on Bluetooth on your device and power on the glove.\n2. Open the 'Glove Dashboard & BLE' tab at the bottom.\n3. Click 'Connect Glove via Web Bluetooth' and select 'HandiVoice_Glove (ESP32-S3)'.\n4. Alternatively, use 'Hardware Simulation Mode' with virtual sliders to test telemetry and 3D signs instantly!";
    }
  }

  // 6. DEFAULT POLITE CO-PILOT RESPONSE
  if (lang === 'ar') {
    return "أهلاً بك! أنا مساعدك الذكي HandiAI. يمكنني إرشادك في ربط قفاز ESP32-S3، استعراض بيانات الحساسات، محاكاة اليد 3D، وتخصيص إعدادات الصوت العصبي.";
  } else if (lang === 'it') {
    return "Ciao! Sono HandiAI, il tuo assistente Edge AI. Chiedimi qualsiasi cosa sui pin dell'ESP32-S3, sul modello 3D, sui 31 gesti del dataset o sul motore vocale!";
  } else if (lang === 'fr') {
    return "Bonjour! Je suis HandiAI, votre copilote Edge AI. N'hésitez pas à me poser des questions sur le gant ESP32-S3, la main 3D ou les paramètres vocaux.";
  } else {
    return "Hello! I am HandiAI, your ML & Embedded Systems AI Copilot. Ask me anything about the ESP32-S3 SuperMini hardware pinout, the 31 Random Forest gesture datasets, 3D hand forward kinematics, or voice profile settings!";
  }
}

/* ==========================================================================
   16. CUTE PERSISTENT COMPANION MASCOT (HANDIBOT)
   ========================================================================== */
function initMascotCompanion() {
  const mascot = document.getElementById('handiBotMascot');
  const bubble = document.getElementById('mascotBubble');
  if (!mascot || !bubble) return;

  const tips = [
    "👋 Hi! I'm HandiBot, your Edge AI companion!",
    "🖐️ Real-time 3D hand mirroring telemetry!",
    "⚡ Connect ESP32-S3 glove via Web Bluetooth!",
    "💡 Tip: Flip cards to inspect deep ADC & I2C telemetry!",
    "🗣️ Voice engine supports Female & Male profiles!",
    "🌐 Instant translation across 4 languages!"
  ];

  let tipIdx = 0;
  setInterval(() => {
    tipIdx = (tipIdx + 1) % tips.length;
    updateMascotBubble(tips[tipIdx]);
  }, 14000);
}

function updateMascotBubble(text) {
  const bubble = document.getElementById('mascotBubble');
  if (!bubble) return;
  bubble.style.opacity = '0';
  bubble.style.transform = 'scale(0.8) translateY(6px)';
  setTimeout(() => {
    bubble.innerHTML = `<span>${text}</span>`;
    bubble.style.opacity = '1';
    bubble.style.transform = 'scale(1) translateY(0)';
  }, 220);
}

function interactWithMascot() {
  const wrapper = document.querySelector('.mascot-body-wrapper');
  if (wrapper) {
    wrapper.classList.remove('interacting');
    void wrapper.offsetWidth; // trigger reflow
    wrapper.classList.add('interacting');
  }

  const interactions = [
    "✨ Telemetry streaming at 50 Hz!",
    "🚀 Random Forest inference in < 8ms!",
    "🤖 Need help? Click HandiAI copilot on the right!",
    "❤️ HandiVoice PRO: Breaking communication barriers!"
  ];
  const rand = interactions[Math.floor(Math.random() * interactions.length)];
  updateMascotBubble(rand);
}

/* ==========================================================================
   17. 3D FLIP CARDS CONTROLLER
   ========================================================================== */
function toggleCardFlip(btn) {
  const container = btn.closest('.flip-card-container');
  if (container) {
    container.classList.toggle('flipped');
  }
}

// Global Window Exports for Inline HTML Handlers
window.toggleCardFlip = toggleCardFlip;
window.interactWithMascot = interactWithMascot;
window.updateMascotBubble = updateMascotBubble;

/* ==========================================================================
   18. TOAST NOTIFICATIONS
   ========================================================================== */
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    info: 'fa-circle-info'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 260);
  }, duration);
}

/* ==========================================================================
   19. HANDIVOICE MOBILE TELEMETRY & AUDIO BRIDGE INTERFACES
   ========================================================================== */
if (typeof window !== 'undefined') {
  window.streamAudioToMobileSpeaker = streamAudioToMobileSpeaker;
  window.triggerHandiVoiceSign = (signLabel, targetLang) => {
    if (!window.HANDIVOICE_DATASET) return;
    const match = window.HANDIVOICE_DATASET.find(g => g.cleanLabel.toLowerCase() === String(signLabel).trim().toLowerCase());
    if (match) {
      loadGestureTelemetry(match, true);
    } else {
      streamAudioToMobileSpeaker(signLabel, targetLang);
    }
  };

  // Telemetry & Speech event listener for mobile app wrappers (Flutter, React Native, Capacitor, WebView)
  window.addEventListener('message', (event) => {
    if (!event.data) return;
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data.type === 'HANDIVOICE_GLOVE_SIGN' || data.action === 'SPEAK_SIGN') {
        const signText = data.text || data.label;
        const lang = data.lang || AppState.speechOutputLanguage || 'en';
        if (signText) {
          streamAudioToMobileSpeaker(signText, lang);
        }
      } else if (data.type === 'HANDIVOICE_TELEMETRY_PACKET' && data.packet) {
        handleBlePacket({ target: { value: new TextEncoder().encode(data.packet) } });
      }
    } catch (e) {
      // ignore non-HandiVoice messages
    }
  });
}
