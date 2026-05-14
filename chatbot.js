(function () {
  // Inject HTML
  const chatHtml = `
    <!-- Botão flutuante -->
    <div class="wpk-chat-btn" id="wpk-chat-btn">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
    </div>

    <!-- Janela de Chat -->
    <div class="wpk-chat-window" id="wpk-chat-window">
      <div class="wpk-chat-header">
        <div class="wpk-chat-header-info">
          <div class="wpk-chat-avatar">👩🏼‍💻</div>
          <div>
            <div class="wpk-chat-title">Assistente Wepink</div>
            <div class="wpk-chat-status">Online agora</div>
          </div>
        </div>
        <button class="wpk-chat-close" id="wpk-chat-close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="wpk-chat-messages" id="wpk-chat-messages">
        <!-- Messages go here -->
      </div>

      <div class="wpk-chat-input-area">
        <input type="text" id="wpk-chat-input" class="wpk-input" placeholder="Digite sua dúvida..." autocomplete="off">
        <button id="wpk-chat-send" class="wpk-send-btn">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = chatHtml;
  document.body.appendChild(div);

  // Flow Data
  const flows = {
    start: {
      msg: "Olá! Sou a assistente virtual da Wepink 💖. Como posso ajudar você hoje?",
      opts: [
        { label: "Onde está meu pedido?", target: "rastreio" },
        { label: "A promoção é verdadeira?", target: "promocao" },
        { label: "Quanto tempo demora?", target: "frete_e_prazo" },
        { label: "Falar com suporte", target: "suporte" }
      ]
    },
    rastreio: {
      msg: "Para rastrear seu pedido, você precisa ter o código de Protocolo (aquele que começa com WPK-...).",
      opts: [
        { label: "Já tenho o código!", target: "rastreio_tem_codigo" },
        { label: "Onde acho esse código?", target: "rastreio_nao_tem" },
        { label: "Voltar", target: "start" }
      ]
    },
    rastreio_tem_codigo: {
      msg: "Ótimo! Você pode verificar o status exato e o prazo de entrega na nossa página de rastreamento.",
      opts: [
        { label: "👉 Acessar Página de Rastreio", action: () => window.location.href = '/track.html' },
        { label: "Voltar ao Início", target: "start" }
      ]
    },
    rastreio_nao_tem: {
      msg: "O seu código de protocolo foi exibido na tela final assim que você concluiu o cadastro. Ele também é enviado automaticamente para o seu e-mail cadastrado! Procure por Wepink na sua caixa de entrada.",
      opts: [
        { label: "Voltar ao Início", target: "start" }
      ]
    },
    promocao: {
      msg: "Sim, é 100% oficial! 🎉 Estamos distribuindo nossos Kits Premium gratuitamente para coletar a opinião de clientes reais por meio dessa pesquisa de mercado. Você não paga nada pelos produtos, apenas o frete de envio da transportadora.",
      opts: [
        { label: "Como funciona o frete?", target: "frete_e_prazo" },
        { label: "Voltar", target: "start" }
      ]
    },
    frete_e_prazo: {
      msg: "O frete é fixo: PAC (Econômico) por R$ 23,00 com entrega em 20-30 dias úteis, ou SEDEX (Rápido) por R$ 27,00 com entrega em 14-20 dias úteis. Os envios são feitos via Correios. Assim que for despachado, você recebe o código de rastreio!",
      opts: [
        { label: "Voltar ao Início", target: "start" }
      ]
    },
    suporte: {
      msg: "No momento, nossos atendentes ao vivo estão indisponíveis por este canal. Mas estamos super prontos para te ajudar via e-mail! Envie sua dúvida para: suporte@wepink.com.br",
      opts: [
        { label: "Voltar", target: "start" }
      ]
    },
    fallback: {
      msg: "Não entendi muito bem. 😅 Como sou uma assistente virtual automatizada, consigo te ajudar melhor se você clicar em uma das opções abaixo:",
      opts: [
        { label: "Ver Opções Iniciais", target: "start" }
      ]
    }
  };

  // State
  const btn = document.getElementById('wpk-chat-btn');
  const win = document.getElementById('wpk-chat-window');
  const closeBtn = document.getElementById('wpk-chat-close');
  const msgContainer = document.getElementById('wpk-chat-messages');
  const input = document.getElementById('wpk-chat-input');
  const sendBtn = document.getElementById('wpk-chat-send');

  let isOpen = false;
  let hasStarted = false;

  // Keyword Intent Recognition
  const intents = [
    { keys: ['pedido', 'rastreio', 'rastrear', 'cade', 'cadê', 'onde'], target: 'rastreio' },
    { keys: ['golpe', 'mentira', 'verdade', 'oficial', 'falso', 'promoção', 'promocao'], target: 'promocao' },
    { keys: ['frete', 'tempo', 'demora', 'chega', 'dias', 'prazo'], target: 'frete_e_prazo' },
    { keys: ['humano', 'atendente', 'falar', 'contato', 'email', 'e-mail', 'suporte'], target: 'suporte' },
    { keys: ['oi', 'ola', 'olá', 'menu', 'inicio', 'início'], target: 'start' }
  ];

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      win.classList.add('open');
      if (!hasStarted) {
        hasStarted = true;
        renderFlow('start');
      }
    } else {
      win.classList.remove('open');
    }
  }

  btn.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  function scrollToBottom() {
    setTimeout(() => {
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }, 50);
  }

  function showTyping() {
    return new Promise(resolve => {
      const id = 'typing-' + Date.now();
      const html = `
        <div class="wpk-msg wpk-msg-bot" id="${id}">
          <div class="wpk-typing">
            <div class="wpk-dot"></div>
            <div class="wpk-dot"></div>
            <div class="wpk-dot"></div>
          </div>
        </div>
      `;
      msgContainer.insertAdjacentHTML('beforeend', html);
      scrollToBottom();
      setTimeout(() => {
        document.getElementById(id).remove();
        resolve();
      }, 1000 + Math.random() * 800); // 1 to 1.8 seconds typing delay
    });
  }

  function appendUserMsg(text) {
    const html = `
      <div class="wpk-msg wpk-msg-user">
        <div class="wpk-bubble">${text}</div>
      </div>
    `;
    msgContainer.insertAdjacentHTML('beforeend', html);
    scrollToBottom();

    // Clear existing options from view to prevent clicking old options
    document.querySelectorAll('.wpk-options').forEach(el => el.remove());
  }

  async function renderFlow(stateKey) {
    const state = flows[stateKey];
    if (!state) return;

    await showTyping();

    const msgHtml = `
      <div class="wpk-msg wpk-msg-bot">
        <div class="wpk-bubble">${state.msg}</div>
      </div>
    `;
    msgContainer.insertAdjacentHTML('beforeend', msgHtml);

    if (state.opts && state.opts.length > 0) {
      const optsDiv = document.createElement('div');
      optsDiv.className = 'wpk-options';

      state.opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'wpk-option-btn';
        btn.textContent = opt.label;
        btn.onclick = () => {
          appendUserMsg(opt.label);
          if (opt.action) {
            opt.action();
          } else if (opt.target) {
            renderFlow(opt.target);
          }
        };
        optsDiv.appendChild(btn);
      });

      msgContainer.appendChild(optsDiv);
    }

    scrollToBottom();
  }

  function processUserInput(text) {
    if (!text.trim()) return;
    appendUserMsg(text);
    input.value = '';

    const lower = text.toLowerCase();
    let foundTarget = 'fallback';

    for (const intent of intents) {
      if (intent.keys.some(k => lower.includes(k))) {
        foundTarget = intent.target;
        break;
      }
    }

    renderFlow(foundTarget);
  }

  sendBtn.addEventListener('click', () => processUserInput(input.value));
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') processUserInput(input.value);
  });

})();
