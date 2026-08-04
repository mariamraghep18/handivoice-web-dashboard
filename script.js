/* ==========================================================================
   HandiVoice PRO — site script
   Sections: Knowledge base · Toasts · Mobile nav · Cart · Checkout ·
             AI chat · Dashboard live simulation · Contact form
   ========================================================================== */

// --- Knowledge Base for AI Chat ---
const PROJECT_KNOWLEDGE = {
  name: "HandiVoice PRO",
  desc: "قفاز ذكي تحكمي ينقل حركة اليد لترجمة لغة الإشارة إلى صوت منطوق عبر الذكاء الاصطناعي ومعالج ESP32 وحساسات انثناء Flex Sensors.",
  specs: "يحتوي على 5 حساسات انثناء عالية الدقة، اتصال البلوتوث BLE، بطارية يدوم عملها لـ 18 ساعة، مع ترجمة فورية باللغتين العربية والإنجليزية.",
  prices: "القفاز الكامل بسعر 2499 جنيه، طقم الحساسات البديلة 450 جنيه، والبطارية مع الشاحن السريع 320 جنيه."
};

/* ==========================================================================
   Toast notifications (replaces alert())
   ========================================================================== */
function showToast(message, type = 'info', duration = 3200) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ==========================================================================
   Mobile navigation drawer
   ========================================================================== */
function initMobileNav() {
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.querySelector('.main-nav');
  const navOverlay = document.getElementById('navOverlay');
  if (!navToggle || !mainNav) return;

  const closeNav = () => {
    mainNav.classList.remove('open');
    navOverlay?.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
  };

  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navOverlay?.classList.toggle('active', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  });

  navOverlay?.addEventListener('click', closeNav);
  mainNav.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', closeNav));
}

/* ==========================================================================
   Shopping Cart System (with quantities)
   ========================================================================== */
let cart = [];
let cartIdCounter = 1;

function addToCart(title, price) {
  const existing = cart.find(item => item.title === title);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: cartIdCounter++, title, price, qty: 1 });
  }
  updateCartUI();
  showToast(`تمت إضافة "${title}" إلى سلة المشتريات`, 'success');
}

function changeCartQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  updateCartUI();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCartUI();
  showToast('تم حذف المنتج من السلة', 'error');
}

function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  const list = document.getElementById('cartItemsList');
  const totalElem = document.getElementById('cartTotal');

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  if (badge) badge.innerText = totalQty;
  if (!list || !totalElem) return;

  if (cart.length === 0) {
    list.innerHTML = `<li class="empty-msg">السلة فارغة حالياً.. قم بإضافة منتجات من الأعلى.</li>`;
    totalElem.innerText = `0 EGP`;
    return;
  }

  let total = 0;
  list.innerHTML = cart.map(item => {
    total += item.price * item.qty;
    return `
      <li>
        <div class="cart-item-info">
          <span>${item.title}</span>
          <small>${item.price} EGP × ${item.qty}</small>
        </div>
        <div class="cart-item-actions">
          <button type="button" class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="تقليل الكمية">−</button>
          <span class="qty-val">${item.qty}</span>
          <button type="button" class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="زيادة الكمية">+</button>
          <button type="button" class="remove-btn" data-action="remove" data-id="${item.id}" aria-label="حذف المنتج"><i class="fa-solid fa-trash"></i></button>
        </div>
        <strong>${item.price * item.qty} EGP</strong>
      </li>
    `;
  }).join('');

  totalElem.innerText = `${total} EGP`;
}

function initCartControls() {
  const list = document.getElementById('cartItemsList');
  if (!list) return;
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === 'inc') changeCartQty(id, 1);
    else if (btn.dataset.action === 'dec') changeCartQty(id, -1);
    else if (btn.dataset.action === 'remove') removeFromCart(id);
  });
}

function handleCheckout(e) {
  e.preventDefault();
  if (cart.length === 0) {
    showToast('سلة المشتريات فارغة! يرجى إضافة منتج واحد على الأقل.', 'error');
    return;
  }
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  if (!/^01[0-9]{9}$/.test(phone)) {
    showToast('من فضلك أدخل رقم هاتف مصري صحيح (11 رقم).', 'error');
    return;
  }
  showToast(`شكراً لك يا ${name}! تم إرسال طلب الشراء بنجاح وسيتواصل معك فريق الدعم لتأكيد الشحن.`, 'success', 4000);
  cart = [];
  updateCartUI();
  document.getElementById('checkoutForm').reset();
}

/* ==========================================================================
   Contact form
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const msgInput = document.getElementById('contactMessage');
  const counter = document.getElementById('msgCounter');

  if (msgInput && counter) {
    const updateCounter = () => { counter.innerText = `${msgInput.value.length} / 500`; };
    msgInput.addEventListener('input', updateCounter);
    updateCounter();
  }

  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('contactEmail');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailPattern.test(email.value.trim())) {
      showToast('من فضلك أدخل بريد إلكتروني صحيح.', 'error');
      email.focus();
      return;
    }
    showToast('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.', 'success', 4000);
    form.reset();
    if (counter) counter.innerText = '0 / 500';
  });
}

/* ==========================================================================
   Help page — live search across troubleshooting + FAQ
   ========================================================================== */
function initHelpSearch() {
  const input = document.getElementById('helpSearch');
  if (!input) return;
  const items = [...document.querySelectorAll('.ts-item'), ...document.querySelectorAll('.faq-item')];

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let visibleCount = 0;
    items.forEach(item => {
      const match = item.innerText.toLowerCase().includes(q);
      item.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });
    const noResults = document.getElementById('noResultsMsg');
    if (noResults) noResults.classList.toggle('visible', visibleCount === 0 && q !== '');
  });
}

/* ==========================================================================
   Floating AI Support Chat
   ========================================================================== */
function toggleAIChat() {
  const popup = document.getElementById('aiPopup');
  if (popup) popup.classList.toggle('active');
}

function appendChatMessage(role, html) {
  const messagesBox = document.getElementById('chatMessages');
  if (!messagesBox) return;
  const iconClass = role === 'user' ? 'fa-user user-icon' : 'fa-robot bot-icon';
  const wrapper = document.createElement('div');
  wrapper.className = `chat-msg ${role}`;
  wrapper.innerHTML = `<i class="fa-solid ${iconClass}"></i><div class="msg-bubble">${html}</div>`;
  messagesBox.appendChild(wrapper);
  messagesBox.scrollTop = messagesBox.scrollHeight;
  return wrapper;
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const messagesBox = document.getElementById('chatMessages');
  if (!input || !messagesBox || !input.value.trim()) return;

  const userText = input.value.trim();
  appendChatMessage('user', userText);
  input.value = '';

  const typingEl = document.createElement('div');
  typingEl.className = 'chat-msg bot';
  typingEl.innerHTML = `<i class="fa-solid fa-robot bot-icon"></i><div class="msg-bubble"><span class="typing-dots"><span></span><span></span><span></span></span></div>`;
  messagesBox.appendChild(typingEl);
  messagesBox.scrollTop = messagesBox.scrollHeight;

  setTimeout(() => {
    typingEl.remove();
    let reply = "أنا مساعد HandiVoice PRO الذكي. كيف يمكنني مساعدتك في القفاز، الشراء، أو حل الأعطال؟";
    const lower = userText.toLowerCase();

    if (lower.includes('فكرة') || lower.includes('مشروع') || lower.includes('شرح') || lower.includes('هو ايه')) {
      reply = `${PROJECT_KNOWLEDGE.name}: ${PROJECT_KNOWLEDGE.desc}`;
    } else if (lower.includes('سعر') || lower.includes('تكلفة') || lower.includes('بكام') || lower.includes('ثمن')) {
      reply = `قائمة الأسعار: ${PROJECT_KNOWLEDGE.prices}`;
    } else if (lower.includes('مواصفات') || lower.includes('بطارية') || lower.includes('حساس') || lower.includes('بلوتوث')) {
      reply = PROJECT_KNOWLEDGE.specs;
    } else if (lower.includes('اشتري') || lower.includes('طلب') || lower.includes('شراء') || lower.includes('سلة')) {
      reply = "إدخلي صفحة (المتجر)، اضغطي على إضافة للسلة للمنتج المطلوب، ثم اكملي اسمك وعنوانك في أسفل الصفحة لتأكيد الشراء!";
    } else if (lower.includes('مرحبا') || lower.includes('سلام') || lower.includes('اهلين')) {
      reply = "أهلاً بك! أنا هنا لمساعدتك في أي استفسار خاص بمشروع القفاز الذكي HandiVoice PRO.";
    }

    appendChatMessage('bot', reply);
  }, 700);
}

/* ==========================================================================
   Dashboard — connection flow + manual phrase translation
   Picking a phrase and pressing "ترجم الإشارة" updates the sensor chart,
   the finger widget, and speaks the result — all driven by the same pick.
   ========================================================================== */
const SIGN_PHRASES = [
  { ar: 'مرحباً بك',    en: 'Hello there',          angles: [15, 20, 15, 10, 10] },
  { ar: 'شكراً جزيلاً',  en: 'Thank you very much',  angles: [80, 90, 85, 88, 82] },
  { ar: 'أنا بخير',      en: "I'm doing well",       angles: [20, 85, 90, 15, 10] },
  { ar: 'من فضلك',       en: 'Please',                angles: [70, 75, 70, 65, 60] },
  { ar: 'نعم، موافق',    en: 'Yes, agreed',          angles: [10, 95, 100, 90, 85] },
  { ar: 'أحتاج مساعدة',  en: 'I need help',          angles: [90, 10, 90, 90, 90] },
  { ar: 'إلى اللقاء',    en: 'Goodbye',               angles: [5, 5, 5, 5, 5] }
];

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
function toArabicDigits(num) {
  return String(num).split('').map(ch => ARABIC_DIGITS[ch] ?? ch).join('');
}

let transCountValue = 14;
let isGloveConnected = false;

function speakText(text, lang) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
}

function addHistoryEntry(text) {
  const ul = document.getElementById('historyUl');
  if (!ul) return;
  const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const li = document.createElement('li');
  li.innerHTML = `<span class="time">${time}</span><span class="text">${text}</span>`;
  ul.prepend(li);
  while (ul.children.length > 8) ul.removeChild(ul.lastChild);
}

function incrementTransCount() {
  const el = document.getElementById('transCount');
  transCountValue += 1;
  if (el) el.innerText = toArabicDigits(transCountValue);
}

/** Updates the sensor chart + finger widget to match one specific sign, then speaks it. */
function renderSignTranslation(phrase) {
  phrase.angles.forEach((angle, i) => {
    const bar = document.getElementById(`bar-${i}`);
    const valEl = document.getElementById(`val-${i}`);
    if (bar) bar.style.width = `${Math.min(angle, 100)}%`;
    if (valEl) valEl.innerText = `${angle}°`;

    const bent = angle > 50;
    const fbox = document.getElementById(`fbox-${i}`);
    const ftxt = document.getElementById(`ftxt-${i}`);
    if (fbox) fbox.classList.toggle('active', bent);
    if (ftxt) ftxt.innerText = bent ? 'مثني' : 'مفرود';
  });

  const lang = document.getElementById('langSelect')?.value || 'ar-SA';
  const text = lang.startsWith('en') ? phrase.en : phrase.ar;

  const outputEl = document.getElementById('translatedText');
  if (outputEl) outputEl.innerText = text;

  speakText(text, lang);
  addHistoryEntry(text);
  incrementTransCount();
}

function initDashboardControls() {
  const connectBtn = document.getElementById('connectBtn');
  if (connectBtn) {
    connectBtn.addEventListener('click', () => {
      // فحص ما إذا كان المستخدم يفتح من الموبايل
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        showToast('عذراً، خاصية البلوتوث المباشر لا تعمل من متصفح الموبايل. يُرجى فتح الموقع من اللابتوب للتحكم بالقفاز.', 'error', 5000);
        return;
      }

      connectBtn.disabled = true;
      connectBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري البحث عن القفاز...`;
      setTimeout(() => {
        connectBtn.style.background = "rgba(0, 255, 136, 0.2)";
        connectBtn.style.borderColor = "#00ff88";
        connectBtn.innerHTML = `<i class="fa-solid fa-link"></i> القفاز متصل (HandiVoice-BLE)`;
        isGloveConnected = true;
        showToast('تم الاتصال بالقفاز بنجاح — اختاري إشارة من القايمة وترجميها', 'success');
      }, 1500);
    });
  }

  // باقي الكود الخاص بالترجمة والأزرار كما هو...
  const translateBtn = document.getElementById('translateBtn');
  if (translateBtn) {
    translateBtn.addEventListener('click', () => {
      // إذا كان من الموبايل ولم يتصل، نسمح له بتجربة العرض التوضيحي (Simulation) لتظهر الواجهة تعمل معه
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (!isGloveConnected && !isMobile) {
        showToast('اربطي القفاز الأول قبل الترجمة.', 'error');
        return;
      }
      const select = document.getElementById('phraseSelect');
      const phrase = SIGN_PHRASES[Number(select?.value || 0)];
      renderSignTranslation(phrase);
    });
  }

  const speakBtn = document.getElementById('speakBtn');
  if (speakBtn) {
    speakBtn.addEventListener('click', () => {
      const text = document.getElementById('translatedText')?.innerText;
      const lang = document.getElementById('langSelect')?.value || 'ar-SA';
      if (text && text !== 'في انتظار الإشارة...') {
        speakText(text, lang);
      } else {
        showToast('لا توجد ترجمة لإعادة نطقها بعد.', 'error');
      }
    });
  }
}
  const translateBtn = document.getElementById('translateBtn');
  if (translateBtn) {
    translateBtn.addEventListener('click', () => {
      if (!isGloveConnected) {
        showToast('اربطي القفاز الأول قبل الترجمة.', 'error');
        return;
      }
      const select = document.getElementById('phraseSelect');
      const phrase = SIGN_PHRASES[Number(select?.value || 0)];
      renderSignTranslation(phrase);
    });
  }

  const speakBtn = document.getElementById('speakBtn');
  if (speakBtn) {
    speakBtn.addEventListener('click', () => {
      const text = document.getElementById('translatedText')?.innerText;
      const lang = document.getElementById('langSelect')?.value || 'ar-SA';
      if (text && text !== 'في انتظار الإشارة...') {
        speakText(text, lang);
      } else {
        showToast('لا توجد ترجمة لإعادة نطقها بعد.', 'error');
      }
    });
  }


/* ==========================================================================
   Init
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initCartControls();
  updateCartUI();
  initContactForm();
  initHelpSearch();
  initDashboardControls();
});
