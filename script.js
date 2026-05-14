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
let selectedShipping = null;
let shippingPrices = { standard: 0, express: 0 };

// ===== DOM =====
const $ = (sel) => document.querySelector(sel);
const screens = {
  landing: $('#landing-screen'),
  survey: $('#survey-screen'),
  processing: $('#processing-screen'),
  claim: $('#claim-screen'),
  confirmation: $('#confirmation-screen')
};

// ===== UTILS =====

// CEP prefix → regional freight modifier (R$)
// Based on real Correios zone proximity to SP (main warehouse)
const CEP_REGION_MAP = [
  { prefix: [1, 9], label: 'São Paulo (Capital/Interior)', mod: 0.00 },
  { prefix: [10, 19], label: 'São Paulo (Interior)', mod: 0.50 },
  { prefix: [20, 28], label: 'Rio de Janeiro', mod: 1.50 },
  { prefix: [29, 29], label: 'Espírito Santo', mod: 2.00 },
  { prefix: [30, 39], label: 'Minas Gerais', mod: 1.80 },
  { prefix: [40, 48], label: 'Bahia', mod: 3.50 },
  { prefix: [49, 49], label: 'Sergipe', mod: 3.80 },
  { prefix: [50, 56], label: 'Pernambuco', mod: 4.00 },
  { prefix: [57, 57], label: 'Alagoas', mod: 4.20 },
  { prefix: [58, 58], label: 'Paraíba', mod: 4.30 },
  { prefix: [59, 59], label: 'Rio Grande do Norte', mod: 4.50 },
  { prefix: [60, 63], label: 'Ceará', mod: 4.80 },
  { prefix: [64, 64], label: 'Piauí', mod: 5.00 },
  { prefix: [65, 65], label: 'Maranhão', mod: 5.20 },
  { prefix: [66, 68], label: 'Pará / Amapá', mod: 5.80 },
  { prefix: [69, 69], label: 'Amazonas / Roraima', mod: 6.50 },
  { prefix: [70, 73], label: 'Distrito Federal / Goiás', mod: 3.00 },
  { prefix: [74, 76], label: 'Goiás', mod: 3.20 },
  { prefix: [77, 77], label: 'Tocantins', mod: 4.00 },
  { prefix: [78, 78], label: 'Mato Grosso', mod: 4.50 },
  { prefix: [79, 79], label: 'Mato Grosso do Sul', mod: 3.80 },
  { prefix: [80, 87], label: 'Paraná', mod: 2.00 },
  { prefix: [88, 89], label: 'Santa Catarina', mod: 2.50 },
  { prefix: [90, 99], label: 'Rio Grande do Sul', mod: 3.00 },
];

function getRegionModifier(cepRaw) {
  const prefix = parseInt(cepRaw.substring(0, 2), 10);
  for (const region of CEP_REGION_MAP) {
    const [min, max] = region.prefix;
    if (prefix >= min && prefix <= max) return region.mod;
  }
  return 3.00; // fallback
}

function getOrCreateShippingPrice(cepRaw) {
  const storageKey = 'wepink_shipping_' + (cepRaw || 'default');
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.standard && parsed.express) return parsed;
    } catch (e) { /* regenerate */ }
  }
  const mod = getRegionModifier(cepRaw || '01');
  // Base: R$23 + regional modifier + small jitter (0–2)
  const jitter = Math.random() * 2;
  const rawStandard = 23 + mod + jitter;
  const standard = Math.round(Math.min(rawStandard, 30.00) * 100) / 100;
  const expressExtra = 5 + Math.random() * 4; // SEDEX R$5–9 above PAC
  const express = Math.round(Math.min(standard + expressExtra, 39.90) * 100) / 100;
  const prices = { standard, express, cep: cepRaw };
  localStorage.setItem(storageKey, JSON.stringify(prices));
  return prices;
}

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

  setTimeout(() => {
    currentQ++;
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
    switchScreen('claim');
    initClaimForm();
  }, 3500);
}

// ===== CLAIM FORM =====
function initClaimForm() {
  // Initial price placeholder — will be recalculated with real CEP
  shippingPrices = getOrCreateShippingPrice('01310');
  setupMasks();
  setupCEPSearch();
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
        <div class="skel-radio"></div>
        <div class="skel-info">
          <div class="skel-line skel-line-lg"></div>
          <div class="skel-line skel-line-sm"></div>
        </div>
        <div class="skel-price"></div>
      </div>
      <div class="skeleton-card">
        <div class="skel-radio"></div>
        <div class="skel-info">
          <div class="skel-line skel-line-lg"></div>
          <div class="skel-line skel-line-sm"></div>
        </div>
        <div class="skel-price"></div>
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

  // Reset state
  selectedShipping = null;
  $('#submit-btn').disabled = true;
  const summary = $('#order-summary');
  if (summary) summary.style.display = 'none';

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
    if (!data.logradouro) $('#street').removeAttribute('readonly');
    if (!data.bairro) $('#neighborhood').removeAttribute('readonly');

    status.textContent = `✓ ${data.localidade} - ${data.uf}`;
    status.className = 'field-status success';

    // Recalculate prices for this specific CEP
    shippingPrices = getOrCreateShippingPrice(cep);
    renderShippingOptions();
  } catch (err) {
    status.textContent = 'Erro ao buscar CEP. Tente novamente.';
    status.className = 'field-status error';
  }
}

function renderShippingOptions() {
  // Reset selection when new shipping options are rendered
  selectedShipping = null;
  $('#submit-btn').disabled = true;
  const summary = $('#order-summary');
  if (summary) summary.style.display = 'none';

  const container = $('#shipping-options');
  container.innerHTML = `
    <div class="shipping-card" data-type="standard" id="ship-standard">
      <div class="shipping-radio"><div class="shipping-radio-dot"></div></div>
      <div class="shipping-info">
        <div class="shipping-name">📦 PAC — Econômico</div>
        <div class="shipping-detail">Entrega em 10 a 15 dias úteis</div>
      </div>
      <div class="shipping-price">${formatBRL(shippingPrices.standard)}</div>
    </div>
    <div class="shipping-card" data-type="express" id="ship-express">
      <div class="shipping-radio"><div class="shipping-radio-dot"></div></div>
      <div class="shipping-info">
        <div class="shipping-name">🚀 SEDEX — Rápido</div>
        <div class="shipping-detail">Entrega em 3 a 7 dias úteis</div>
      </div>
      <div class="shipping-price">${formatBRL(shippingPrices.express)}</div>
    </div>
  `;

  container.querySelectorAll('.shipping-card').forEach(card => {
    card.addEventListener('click', () => selectShipping(card.dataset.type));
  });
}

function selectShipping(type) {
  selectedShipping = type;

  document.querySelectorAll('.shipping-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.shipping-card[data-type="${type}"]`).classList.add('selected');

  const price = type === 'express' ? shippingPrices.express : shippingPrices.standard;
  const label = type === 'express' ? 'Frete SEDEX' : 'Frete PAC';

  // Show and update summary
  const summary = $('#order-summary');
  summary.style.display = 'block';
  $('#summary-shipping-label').textContent = label;
  $('#summary-shipping-value').textContent = formatBRL(price);
  $('#summary-total').textContent = formatBRL(price);

  // Enable submit
  $('#submit-btn').disabled = false;
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

  // CPF validation (11 digits)
  const cpfRaw = $('#cpf').value.replace(/\D/g, '');
  if (cpfRaw.length !== 11) {
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

  if (!selectedShipping) valid = false;

  return valid;
}

// ===== EVENT LISTENERS =====

function checkOrderState() {
  const existingOrderStr = localStorage.getItem('wepink_order');
  let alreadyOrdered = false;
  let orderProtocol = null;

  if (existingOrderStr) {
    try {
      const existingOrder = JSON.parse(existingOrderStr);
      if (existingOrder.protocol) {
        alreadyOrdered = true;
        orderProtocol = existingOrder.protocol;
      }
    } catch (e) { }
  }

  const startBtn = $('#start-btn');
  if (!startBtn) return; // Prevent errors if DOM not ready

  if (alreadyOrdered) {
    // Modify Landing Screen
    const infoBadges = document.querySelector('.info-badges');
    if (infoBadges) infoBadges.style.display = 'none';

    document.querySelector('.promo-pill').textContent = "Pedido Recebido";
    document.querySelector('.title').innerHTML = "Acompanhe o seu<br><span class=\"text-gradient\">Kit Premium</span>";
    document.querySelector('.subtitle').textContent = "Você já garantiu seu kit. Clique no botão abaixo para acompanhar o envio do seu pedido.";

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
  } else {
    // Normal Flow
    // Removendo event listeners antigos para evitar duplicidade
    const newBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newBtn, startBtn);

    newBtn.addEventListener('click', () => {
      switchScreen('survey');
      renderQuestion();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkOrderState();
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

    const price = selectedShipping === 'express' ? shippingPrices.express : shippingPrices.standard;
    const shippingLabel = selectedShipping === 'express' ? 'SEDEX' : 'PAC';

    // Save order to localStorage
    const order = {
      protocol: generateProtocol(),
      name: $('#fullname').value,
      cpf: $('#cpf').value,
      phone: $('#phone').value,
      email: $('#email').value,
      address: `${$('#street').value}, ${$('#number').value} - ${$('#neighborhood').value}, ${$('#city').value}/${$('#state').value} - CEP ${$('#cep').value}`,
      complement: $('#complement').value,
      shipping: shippingLabel,
      shippingPrice: price,
      total: price,
      answers: answers,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('wepink_order', JSON.stringify(order));

    try {
      // Send to Vercel API
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
    } catch (err) {
      console.error('Erro ao salvar no banco:', err);
    }

    setTimeout(() => {
      // Fill confirmation
      $('#conf-protocol').textContent = order.protocol;
      $('#conf-name').textContent = order.name;
      $('#conf-address').textContent = `${$('#city').value}/${$('#state').value}`;
      $('#conf-shipping').textContent = `${shippingLabel} — ${formatBRL(price)}`;
      $('#conf-total').textContent = formatBRL(price);

      switchScreen('confirmation');

      // Redireciona para a página de rastreamento após 4 segundos
      setTimeout(() => {
        window.location.href = `/track?p=${encodeURIComponent(order.protocol)}`;
      }, 4000);
    }, 1000);
  });

  // Remove error class on input
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => input.classList.remove('error'));
  });
});
