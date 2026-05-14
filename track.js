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

async function search() {
  const raw = $('protocol-input').value.trim().toUpperCase();
  const btn = $('search-btn');
  const errEl = $('search-error');

  errEl.classList.remove('show');
  $('result-card').classList.remove('show');

  if (!raw) {
    errEl.textContent = 'Digite o código de protocolo.';
    errEl.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const res = await fetch(`/api/order/${encodeURIComponent(raw)}`);
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error ?? 'Pedido não encontrado.';
      errEl.classList.add('show');
      return;
    }

    // Badge
    $('status-badge-wrap').innerHTML = `
      <span class="status-badge ${data.status}">
        <span class="badge-dot"></span>
        ${data.status_label}
      </span>`;

    // Stepper
    renderStepper(data.status_step);

    // Prazo
    $('prazo-date').textContent = data.prazo_entrega_formatado ?? '—';

    // Info
    $('r-protocolo').textContent = data.protocolo;
    $('r-data').textContent = data.data_criacao_formatada ?? '—';
    $('r-nome').textContent = data.nome ?? '—';
    $('r-frete').textContent = data.frete_tipo ?? '—';
    $('r-total').textContent = data.total ? formatBRL(data.total) : '—';

    // Desc
    $('status-desc').textContent = data.status_desc ?? '';

    $('result-card').classList.add('show');

  } catch (err) {
    errEl.textContent = 'Erro de conexão. Tente novamente.';
    errEl.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Buscar';
  }
}

$('search-btn').addEventListener('click', search);
$('protocol-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') search();
});

// Auto-preenche se vier protocolo na URL: ?p=WPK-XXXXXXXX
// Auto-preenche se vier protocolo na URL: ?p=WPK-XXXXXXXX
const params = new URLSearchParams(window.location.search);
const p = params.get('p');
if (p) {
  $('protocol-input').value = p;
  search();
}
