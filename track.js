const $ = id => document.getElementById(id);

function formatBRL(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

function renderStepper(step) {
  if (step === 0) {
    [1, 2, 3, 4].forEach(i => $('s' + i).classList.remove('done', 'active'));
    $('step-progress').style.width = '0%';
    return;
  }
  const pct = { 1: '0%', 2: '33%', 3: '66%', 4: '100%' }[step] ?? '0%';
  $('step-progress').style.width = pct;
  [1, 2, 3, 4].forEach(i => {
    const el = $('s' + i);
    el.classList.remove('done', 'active');
    if (i < step) el.classList.add('done');
    if (i === step) el.classList.add('active');
  });
}

function showPaymentPending() {
  const card = $('result-card');
  card.classList.add('show');
  $('status-badge-wrap').innerHTML = `
    <span class="status-badge pending-payment">
      <span class="badge-dot"></span>
      Aguardando Pagamento...
    </span>`;
  renderStepper(0);
  $('prazo-date').textContent = '—';
  $('prazo-sub').textContent = 'O prazo será calculado após a confirmação do pagamento';
  $('status-desc').textContent = 'Estamos aguardando a confirmação do seu pagamento. Isso pode levar alguns instantes.';

  const payBtn = $('pay-now-btn');
  if (payBtn) {
    const stored = localStorage.getItem('wepink_order');
    if (stored) {
      try {
        const order = JSON.parse(stored);
        if (order.paymentUrl) {
          payBtn.style.display = 'block';
          payBtn.href = order.paymentUrl;
        } else {
          payBtn.style.display = 'none';
        }
      } catch(e) { payBtn.style.display = 'none'; }
    } else {
      payBtn.style.display = 'none';
    }
  }
}

function showPaymentApproved(data) {
  const card = $('result-card');
  card.classList.add('show');

  $('status-badge-wrap').innerHTML = `
    <span class="status-badge approved">
      <span class="badge-dot"></span>
      Pagamento Aprovado ✓
    </span>`;

  renderStepper(data.status_step || 1);

  $('prazo-date').textContent = data.prazo_entrega_formatado ?? '—';
  if (data.frete_tipo && data.frete_tipo.toUpperCase().includes('SEDEX')) {
    $('prazo-sub').textContent = 'Até 20 dias úteis a partir da confirmação';
  } else {
    $('prazo-sub').textContent = 'Até 30 dias úteis a partir da confirmação';
  }

  $('r-protocolo').textContent = data.protocolo;
  $('r-data').textContent = data.data_criacao_formatada ?? '—';
  $('r-nome').textContent = data.nome ?? '—';
  $('r-frete').textContent = data.frete_tipo ?? '—';
  $('r-total').textContent = data.total ? formatBRL(data.total) : '—';

  $('status-desc').textContent = data.status_desc ?? 'Seu pedido foi confirmado e está sendo preparado.';

  const payBtn = $('pay-now-btn');
  if (payBtn) payBtn.style.display = 'none';
}

async function search(proto) {
  const protocol = proto || $('protocol-input').value.trim().toUpperCase();
  const btn = $('search-btn');
  const errEl = $('search-error');

  errEl.classList.remove('show');
  $('result-card').classList.remove('show');

  if (!protocol) {
    errEl.textContent = 'Digite o código de protocolo.';
    errEl.classList.add('show');
    return null;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const res = await fetch(`/api/order/${encodeURIComponent(protocol)}`);
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error ?? 'Pedido não encontrado.';
      errEl.classList.add('show');
      return null;
    }

    return data;

  } catch (err) {
    errEl.textContent = 'Erro de conexão. Tente novamente.';
    errEl.classList.add('show');
    return null;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Buscar';
  }
}

function renderResult(data) {
  if (data.payment_status === 'pending') {
    showPaymentPending();
    $('r-protocolo').textContent = data.protocolo;
    $('r-data').textContent = data.data_criacao_formatada ?? '—';
    $('r-nome').textContent = data.nome ?? '—';
    $('r-frete').textContent = data.frete_tipo ?? '—';
    $('r-total').textContent = data.total ? formatBRL(data.total) : '—';
    return;
  }

  // Badge
  $('status-badge-wrap').innerHTML = `
    <span class="status-badge ${data.status}">
      <span class="badge-dot"></span>
      ${data.status_label}
    </span>`;

  renderStepper(data.status_step);

  $('prazo-date').textContent = data.prazo_entrega_formatado ?? '—';
  if (data.frete_tipo && data.frete_tipo.toUpperCase().includes('SEDEX')) {
    $('prazo-sub').textContent = 'Até 20 dias úteis a partir da confirmação';
  } else {
    $('prazo-sub').textContent = 'Até 30 dias úteis a partir da confirmação';
  }

  $('r-protocolo').textContent = data.protocolo;
  $('r-data').textContent = data.data_criacao_formatada ?? '—';
  $('r-nome').textContent = data.nome ?? '—';
  $('r-frete').textContent = data.frete_tipo ?? '—';
  $('r-total').textContent = data.total ? formatBRL(data.total) : '—';

  $('status-desc').textContent = data.status_desc ?? '';
  $('result-card').classList.add('show');

  const payBtn = $('pay-now-btn');
  if (payBtn) payBtn.style.display = 'none';
}

// Poll for payment approval (Kiwify webhook may take a few seconds)
async function pollForApproval(protocol, maxAttempts = 20) {
  const statusMsg = $('status-desc');
  let attempt = 0;

  showPaymentPending();
  $('protocol-input').value = protocol;

  // Fill basic info from localStorage while waiting
  const stored = localStorage.getItem('wepink_order');
  if (stored) {
    try {
      const order = JSON.parse(stored);
      $('r-protocolo').textContent = order.protocol;
      $('r-nome').textContent = order.name ?? '—';
      $('r-frete').textContent = order.shipping ?? '—';
      $('r-total').textContent = order.total ? formatBRL(order.total) : '—';
    } catch(e) {}
  }

  const poll = async () => {
    attempt++;
    statusMsg.textContent = `Verificando pagamento... (tentativa ${attempt}/${maxAttempts})`;

    const data = await search(protocol);
    if (!data) {
      if (attempt < maxAttempts) {
        setTimeout(poll, 3000);
      } else {
        statusMsg.textContent = 'Não foi possível confirmar o pagamento. Se você já pagou, aguarde alguns minutos e atualize a página.';
      }
      return;
    }

    if (data.payment_status === 'approved') {
      // Payment confirmed!
      showPaymentApproved(data);

      // Update localStorage
      const storedOrder = localStorage.getItem('wepink_order');
      if (storedOrder) {
        try {
          const order = JSON.parse(storedOrder);
          order.paymentStatus = 'approved';
          localStorage.setItem('wepink_order', JSON.stringify(order));
        } catch(e) {}
      }
      return;
    }

    // Still pending
    if (attempt < maxAttempts) {
      setTimeout(poll, 3000);
    } else {
      statusMsg.textContent = 'Pagamento ainda não confirmado. Se você já pagou, aguarde alguns minutos e atualize a página.';
    }
  };

  poll();
}

// ===== MAIN FLOW =====
$('search-btn').addEventListener('click', async () => {
  const data = await search();
  if (data) {
    if (data.payment_status === 'pending') pollForApproval(data.protocolo);
    else renderResult(data);
  }
});

$('protocol-input').addEventListener('keydown', async e => {
  if (e.key === 'Enter') {
    const data = await search();
    if (data) {
      if (data.payment_status === 'pending') pollForApproval(data.protocolo);
      else renderResult(data);
    }
  }
});

// Check URL params first
const params = new URLSearchParams(window.location.search);
const urlProtocol = params.get('p');

if (urlProtocol) {
  // Came from direct link with protocol
  $('protocol-input').value = urlProtocol;
  (async () => {
    const data = await search(urlProtocol);
    if (data) {
      if (data.payment_status === 'pending') pollForApproval(urlProtocol);
      else renderResult(data);
    }
  })();
} else {
  // No URL params — likely returning from Kiwify payment redirect
  const stored = localStorage.getItem('wepink_order');
  if (stored) {
    try {
      const order = JSON.parse(stored);
      if (order.protocol && order.paymentStatus === 'pending') {
        // Start polling for payment confirmation
        pollForApproval(order.protocol);
      } else if (order.protocol && order.paymentStatus === 'approved') {
        // Already approved, just show the result
        $('protocol-input').value = order.protocol;
        (async () => {
          const data = await search(order.protocol);
          if (data) renderResult(data);
        })();
      }
    } catch(e) {
      console.error('Error parsing stored order:', e);
    }
  }
}
