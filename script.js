/* ═══════════════════════════════════════════════════════════════
   STYLESENSE – Main Script
   ═══════════════════════════════════════════════════════════════ */

/* Sections are inlined in index.html — no fetch needed */

function initAll() {
  initNavbar();
  initParallax();
  initUpload();
  initFaceAnalysis();
  initDashboard();
  initChatbot();
  initAnimations();
  initActiveNav();
}

/* ── Navbar ── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
  }

  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger && hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ── Active Nav Highlight ── */
function initActiveNav() {
  const sections = SECTIONS.map(id => document.getElementById(id)).filter(Boolean);
  const links = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => observer.observe(s));
}

/* ── Parallax ── */
function initParallax() {
  const layer1 = document.querySelector('.layer-1');
  const layer2 = document.querySelector('.layer-2');
  const heroVisual = document.querySelector('.hero-visual');

  if (!layer1) return;

  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    if (layer1) layer1.style.transform = `translate(${x * 12}px, ${y * 8}px)`;
    if (layer2) layer2.style.transform = `translate(${x * 6}px, ${y * 4}px)`;
    if (heroVisual) heroVisual.style.transform = `translate(${x * -4}px, ${y * -3}px)`;
  });

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (layer1) layer1.style.transform = `translateY(${scrollY * 0.15}px)`;
    if (layer2) layer2.style.transform = `translateY(${scrollY * 0.08}px)`;
  });
}

/* ── Scroll Reveal Animations ── */
function initAnimations() {
  const revealEls = document.querySelectorAll(
    '.feature-card, .result-card, .dash-card, .pipe-step, .section-header'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  /* Animate confidence bars when visible */
  const bars = document.querySelectorAll('.bar-fill');
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target.dataset.width || '0%';
        entry.target.style.width = target;
        barObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  bars.forEach(bar => {
    const w = bar.style.width;
    bar.dataset.width = w;
    bar.style.width = '0%';
    barObserver.observe(bar);
  });
}

/* ── Upload / Analyze ── */
function initUpload() {
  const zone       = document.getElementById('uploadZone');
  const fileInput  = document.getElementById('imageInput');
  const previewWrap    = document.getElementById('previewWrap');
  const previewImg     = document.getElementById('previewImg');
  const uploadIconWrap = document.getElementById('uploadIconWrap');
  const analyzeBtn     = document.getElementById('analyzeBtn');
  const removeBtn      = document.getElementById('removeImgBtn');
  const idlePanel      = document.getElementById('idlePanel');
  const processingPanel = document.getElementById('processingPanel');
  const resultsPanel   = document.getElementById('resultsPanel');
  const optTabs = document.querySelectorAll('.opt-tab');

  if (!zone) { console.error('uploadZone not found'); return; }
  if (!fileInput) { console.error('imageInput not found'); return; }
  if (!analyzeBtn) { console.error('analyzeBtn not found'); return; }
  console.log('initUpload OK — zone, fileInput, analyzeBtn all found');

  let currentFile = null;

  /* Open file picker when zone is clicked (but not on child button clicks) */
  zone.addEventListener('click', e => {
    if (e.target.closest('.remove-img-btn')) return;
    fileInput.click();
  });

  /* File selected via picker */
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

  /* Drag & drop */
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  });

  function handleFile(file) {
    currentFile = file;
    const url = URL.createObjectURL(file);
    if (previewImg) { previewImg.src = url; }
    if (previewWrap) { previewWrap.style.display = 'block'; }
    if (uploadIconWrap) { uploadIconWrap.style.display = 'none'; }
    analyzeBtn.dataset.ready = 'true';
    analyzeBtn.style.opacity = '1';
    analyzeBtn.style.cursor = 'pointer';
    console.log('File loaded:', file.name, file.type, file.size);
  }

  /* Remove image */
  if (removeBtn) removeBtn.addEventListener('click', e => {
    e.stopPropagation();
    currentFile = null;
    if (previewImg) previewImg.src = '';
    if (previewWrap) previewWrap.style.display = 'none';
    if (uploadIconWrap) uploadIconWrap.style.display = 'block';
    analyzeBtn.dataset.ready = 'false';
    analyzeBtn.style.opacity = '.45';
    analyzeBtn.style.cursor = 'not-allowed';
    fileInput.value = '';
  });

  /* Option tabs */
  optTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const group = tab.closest('.option-tabs');
      group.querySelectorAll('.opt-tab').forEach(t => t.classList.remove('tab-active'));
      tab.classList.add('tab-active');
    });
  });

  /* Analyze button */
  analyzeBtn.addEventListener('click', () => {
    console.log('Analyze clicked, ready:', analyzeBtn.dataset.ready, 'file:', currentFile?.name);
    if (analyzeBtn.dataset.ready !== 'true' || !currentFile) {
      zone.style.borderColor = 'rgba(239,68,68,0.6)';
      setTimeout(() => { zone.style.borderColor = ''; }, 1200);
      return;
    }
    runAnalysis();
  });

  function showPanel(name) {
    const panels = { idle: idlePanel, processing: processingPanel, results: resultsPanel };
    Object.entries(panels).forEach(([key, el]) => {
      if (!el) return;
      el.setAttribute('hidden', '');
      el.style.setProperty('display', 'none', 'important');
    });
    const target = panels[name];
    if (target) {
      target.removeAttribute('hidden');
      const disp = name === 'results' ? 'block' : 'flex';
      target.style.setProperty('display', disp, 'important');
      console.log('showPanel:', name, '→', disp, target);
    }
  }

  const STEPS = [
    'Uploading image to server...',
    'Running skin tone detection (HuggingFace)...',
    'Analyzing style with Gemini Vision...',
    'Generating recommendations (Groq LLaMA 3.3)...',
    'Compiling results...'
  ];

  async function runAnalysis() {
    if (!currentFile) return;
    console.log('runAnalysis start');

    /* Show processing panel first, then wait a frame so it renders */
    showPanel('processing');
    await delay(50);

    /* Query step elements AFTER panel is visible */
    const stepEls = Array.from(processingPanel
      ? processingPanel.querySelectorAll('.proc-step')
      : document.querySelectorAll('.proc-step'));
    console.log('stepEls found:', stepEls.length);

    /* Fire API call immediately in parallel */
    const formData = new FormData();
    formData.append('file', currentFile);
    console.log('Sending to API:', currentFile.name, currentFile.size, 'bytes');

    const apiPromise = fetch('http://localhost:8000/analyze', { method: 'POST', body: formData })
      .then(res => {
        console.log('API response status:', res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => { console.log('API data:', data); return data; })
      .catch(err => {
        console.warn('API failed, using mock:', err.message);
        return null;
      });

    /* Animate steps while API runs */
    for (let i = 0; i < STEPS.length; i++) {
      stepEls.forEach((el, j) => {
        el.classList.remove('active', 'done');
        if (j < i) el.classList.add('done');
        if (j === i) el.classList.add('active');
      });
      await delay(700 + Math.random() * 300);
    }

    /* Wait for API */
    const data = await apiPromise;
    stepEls.forEach(el => el.classList.add('done'));
    await delay(300);

    console.log('Populating results with:', data);
    populateResults(data || getMockResults());
    showPanel('results');
    console.log('runAnalysis complete');
  }

  function populateResults(data) {
    const grid = document.getElementById('resultsGrid');
    if (!grid) return;
    const items = [
      { label: 'Skin Tone', value: data.skin_tone || 'Warm Medium', sub: 'Detected via OpenCV' },
      { label: 'Face Shape', value: data.face_shape || 'Oval', sub: 'Gemini Vision analysis' },
      { label: 'Style Profile', value: data.style_profile || 'Smart Casual', sub: 'AI-generated' },
      { label: 'Season Palette', value: data.season || 'Autumn/Winter', sub: 'Color theory match' },
      { label: 'Key Colors', value: data.colors || 'Earth tones, Navy, Burgundy', sub: 'Recommended palette' },
      { label: 'Recommendation', value: data.recommendation || 'Structured blazers, slim trousers', sub: 'Groq LLaMA 3.3' },
    ];
    grid.innerHTML = items.map(item => `
      <div class="result-item">
        <div class="result-item-label">${item.label}</div>
        <div class="result-item-value">${item.value}</div>
        <div class="result-item-sub">${item.sub}</div>
      </div>
    `).join('');
    const reanalyzeBtn = document.getElementById('reanalyzeBtn');
    if (reanalyzeBtn) reanalyzeBtn.addEventListener('click', () => {
      currentFile = null;
      if (previewImg) previewImg.src = '';
      if (previewWrap) previewWrap.style.display = 'none';
      if (uploadIconWrap) uploadIconWrap.style.display = 'block';
      if (analyzeBtn) analyzeBtn.disabled = true;
      if (fileInput) fileInput.value = '';
      showPanel('idle');
    });
  }

  function getMockResults() {
    return {
      skin_tone: 'Warm Medium', face_shape: 'Oval',
      style_profile: 'Smart Casual', season: 'Autumn/Winter',
      colors: 'Earth tones, Navy, Burgundy',
      recommendation: 'Structured blazers, slim trousers, leather accessories'
    };
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ── Face Analysis Section ── */
function initFaceAnalysis() {
  const swatches = document.querySelectorAll('.skin-swatch');
  swatches.forEach(sw => {
    sw.addEventListener('click', () => {
      swatches.forEach(s => s.classList.remove('swatch-active'));
      sw.classList.add('swatch-active');
    });
  });

  const styleTags = document.querySelectorAll('.style-tag');
  styleTags.forEach(tag => {
    tag.addEventListener('click', () => tag.classList.toggle('tag-active'));
  });

  const cardBtns = document.querySelectorAll('.card-btn');
  cardBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      scrollToSection('analyze');
    });
  });
}

/* ── Dashboard ── */
function initDashboard() {
  /* Hair style selector */
  const hairItems = document.querySelectorAll('.hair-item');
  hairItems.forEach(item => {
    item.addEventListener('click', () => {
      hairItems.forEach(h => h.classList.remove('hair-active'));
      item.classList.add('hair-active');
      const style = item.dataset.style || 'Classic';
      const outfitName = document.querySelector('.outfit-name');
      if (outfitName) outfitName.textContent = `Urban ${style} Look`;
    });
  });

  /* Accessory items */
  const accItems = document.querySelectorAll('.acc-item');
  accItems.forEach(item => {
    item.addEventListener('click', () => {
      item.style.borderColor = 'var(--blue-s)';
      item.style.background = 'var(--glass-l)';
      setTimeout(() => {
        item.style.borderColor = '';
        item.style.background = '';
      }, 600);
    });
  });

  /* Color palette swatches */
  const cpSwatches = document.querySelectorAll('.cp-swatch');
  cpSwatches.forEach(sw => {
    sw.addEventListener('click', () => {
      cpSwatches.forEach(s => s.style.borderColor = 'transparent');
      sw.style.borderColor = 'rgba(255,255,255,0.6)';
    });
  });

  /* Outfit action buttons */
  const outfitBtns = document.querySelectorAll('.outfit-btn');
  outfitBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('primary-btn')) {
        scrollToSection('analyze');
      }
    });
  });

  /* Season items */
  const seasonItems = document.querySelectorAll('.season-item');
  seasonItems.forEach(item => {
    item.addEventListener('click', () => {
      seasonItems.forEach(s => s.classList.remove('active-season'));
      item.classList.add('active-season');
    });
  });
}

/* ── Chatbot ── */
function initChatbot() {
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const messagesEl = document.getElementById('chatMessages');
  const voiceBtn = document.getElementById('voiceBtn');
  const orbCore = document.querySelector('.orb-core');
  const orbStatus = document.querySelector('.orb-status span:last-child');
  const chips = document.querySelectorAll('.chip');

  if (!chatInput) return;

  const BACKEND = 'http://localhost:8000';

  /* Send on Enter (Shift+Enter = newline) */
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  if (sendBtn) sendBtn.addEventListener('click', sendMessage);

  /* Quick chips */
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chatInput.value = chip.textContent.trim();
      sendMessage();
    });
  });

  /* Orb click = focus input */
  if (orbCore) orbCore.addEventListener('click', () => chatInput.focus());

  /* Voice button (Web Speech API) */
  if (voiceBtn && 'webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    voiceBtn.addEventListener('click', () => {
      voiceBtn.classList.toggle('listening');
      if (voiceBtn.classList.contains('listening')) {
        recognition.start();
        if (orbStatus) orbStatus.textContent = 'Listening...';
      } else {
        recognition.stop();
        if (orbStatus) orbStatus.textContent = 'Online & Ready';
      }
    });

    recognition.onresult = e => {
      chatInput.value = e.results[0][0].transcript;
      voiceBtn.classList.remove('listening');
      if (orbStatus) orbStatus.textContent = 'Online & Ready';
      sendMessage();
    };

    recognition.onerror = () => {
      voiceBtn.classList.remove('listening');
      if (orbStatus) orbStatus.textContent = 'Online & Ready';
    };
  } else if (voiceBtn) {
    voiceBtn.title = 'Voice input not supported in this browser';
    voiceBtn.style.opacity = '0.4';
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    if (sendBtn) sendBtn.disabled = true;

    appendMessage('user', text);
    const typingId = appendTyping();

    try {
      const res = await fetch(`${BACKEND}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      removeTyping(typingId);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      appendMessage('ai', data.response || data.message || 'No response received.');
    } catch {
      removeTyping(typingId);
      appendMessage('ai', getMockResponse(text));
    }

    if (sendBtn) sendBtn.disabled = false;
    chatInput.focus();
  }

  function appendMessage(role, text) {
    if (!messagesEl) return;
    const isAI = role === 'ai';
    const div = document.createElement('div');
    div.className = `chat-msg ${isAI ? 'ai-msg' : 'user-msg'}`;
    div.innerHTML = `
      ${isAI ? `<div class="msg-avatar"><div class="msg-avatar-orb"></div></div>` : ''}
      <div class="msg-bubble"><p>${escapeHtml(text)}</p></div>
      ${!isAI ? `<div class="msg-avatar" style="background:linear-gradient(135deg,#4A5578,#8B9CC8)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>` : ''}
    `;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendTyping() {
    if (!messagesEl) return null;
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.className = 'chat-msg ai-msg';
    div.id = id;
    div.innerHTML = `
      <div class="msg-avatar"><div class="msg-avatar-orb"></div></div>
      <div class="msg-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return id;
  }

  function removeTyping(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function getMockResponse(msg) {
    const lower = msg.toLowerCase();
    if (lower.includes('skin') || lower.includes('tone'))
      return 'Based on warm undertones, I recommend earth tones — terracotta, camel, and warm burgundy. These shades will complement your complexion beautifully.';
    if (lower.includes('outfit') || lower.includes('wear') || lower.includes('style'))
      return 'For a smart-casual look, try a structured navy blazer with slim chinos and white Oxford shirt. Add leather loafers for a polished finish. This combination scores 94/100 on our trend index!';
    if (lower.includes('hair') || lower.includes('hairstyle'))
      return 'For an oval face shape, most hairstyles work well. I suggest a textured crop or side-swept style to add dimension. Avoid very flat styles that can make the face appear longer.';
    if (lower.includes('color') || lower.includes('palette'))
      return 'Your seasonal color palette is Autumn — rich, warm, and earthy. Key colors: burnt orange, forest green, camel, chocolate brown, and deep burgundy. Avoid cool pastels and icy tones.';
    if (lower.includes('trend') || lower.includes('fashion'))
      return 'Current top trends for your profile: (1) Quiet Luxury — minimal, high-quality basics. (2) Earthy tones with texture. (3) Oversized tailoring. (4) Leather accessories as statement pieces.';
    return 'I\'m StyleSense AI, powered by Groq LLaMA 3.3. I can help with outfit recommendations, color analysis, face shape styling, and trend insights. What would you like to explore?';
  }
}

/* ── Counter Animation ── */
function animateCounters() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current >= 1000000
        ? (current / 1000000).toFixed(1) + 'M'
        : current >= 1000
        ? (current / 1000).toFixed(0) + 'K'
        : Math.floor(current).toString();
    }, 16);
  });
}

/* Trigger counter when hero is visible */
function initCounters() {
  const heroStats = document.querySelector('.hero-stats');
  if (!heroStats) return;
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      animateCounters();
      observer.disconnect();
    }
  }, { threshold: 0.5 });
  observer.observe(heroStats);
}

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', () => {
  initAll();
  initCounters();
  console.log('StyleSense fully initialised');
});
