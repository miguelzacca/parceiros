import { createClient } from "@libsql/client";

// Calcula prazo de N dias úteis a partir de hoje (exclui sáb. e dom.)
function addBusinessDays(date, days) {
  let count = 0;
  const current = new Date(date);
  while (count < days) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return current.toISOString();
}

export default async function handler(req, res) {
  // CORS (facilita testes locais)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    return res.status(500).json({ error: "Variáveis de ambiente do Turso não configuradas." });
  }

  const client = createClient({ url, authToken });

  // Inicializa schema
  await client.execute(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      protocolo     TEXT    UNIQUE NOT NULL,
      nome          TEXT    NOT NULL,
      cpf           TEXT    NOT NULL,
      telefone      TEXT,
      email         TEXT    NOT NULL,
      endereco      TEXT,
      frete_tipo    TEXT,
      frete_valor   REAL,
      total         REAL,
      respostas     TEXT,
      status        TEXT    NOT NULL DEFAULT 'em_processamento',
      prazo_entrega TEXT,
      payment_status TEXT   DEFAULT 'pending',
      tracking_code  TEXT,
      kiwify_order_id TEXT,
      data_criacao  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Tenta adicionar as colunas novas caso a tabela já existisse de uma versão anterior
  try { await client.execute("ALTER TABLE pedidos ADD COLUMN status TEXT NOT NULL DEFAULT 'em_processamento'"); } catch (e) { }
  try { await client.execute("ALTER TABLE pedidos ADD COLUMN prazo_entrega TEXT"); } catch (e) { }
  try { await client.execute("ALTER TABLE pedidos ADD COLUMN payment_status TEXT DEFAULT 'pending'"); } catch (e) { }
  try { await client.execute("ALTER TABLE pedidos ADD COLUMN tracking_code TEXT"); } catch (e) { }
  try { await client.execute("ALTER TABLE pedidos ADD COLUMN kiwify_order_id TEXT"); } catch (e) { }
  try { await client.execute("ALTER TABLE pedidos ADD COLUMN produto_nome TEXT"); } catch (e) { }
  try { await client.execute("ALTER TABLE pedidos ADD COLUMN produto_preco REAL"); } catch (e) { }
  try { await client.execute("ALTER TABLE pedidos ADD COLUMN pix_code TEXT"); } catch (e) { }
  try { await client.execute("ALTER TABLE pedidos ADD COLUMN qr_code TEXT"); } catch (e) { }

  try {
    if (req.method === 'POST') {
      const order = req.body;

      if (!order.protocol || !order.name || !order.email || !order.cpf) {
        return res.status(400).json({ error: "Dados incompletos: protocol, name, email e cpf são obrigatórios." });
      }

      let diasPrazo = 30; // PAC por padrão ou fallback
      if (order.shipping && order.shipping.toUpperCase().includes('SEDEX')) {
        diasPrazo = 20; // SEDEX mais rápido
      }
      const prazoEntrega = addBusinessDays(new Date(), diasPrazo);

      let checkoutUrl = '';

      const tag = process.env.INFINITEPAY_TAG || 'miguel-zacca';
      const host = req.headers.host || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';

      try {
        const items = [
          {
            quantity: 1,
            price: Math.round((order.productPrice || order.total) * 100),
            description: order.productName || 'Produto Premium'
          }
        ];

        if (order.upsellPrice > 0) {
          items.push({
            quantity: 1,
            price: Math.round(order.upsellPrice * 100),
            description: "Sorteio PIX R$ 1.000"
          });
        }

        if (order.shippingPrice > 0) {
          items.push({
            quantity: 1,
            price: Math.round(order.shippingPrice * 100),
            description: order.shipping || "Frete"
          });
        }

        const ipRes = await fetch('https://api.checkout.infinitepay.io/links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            handle: tag,
            redirect_url: `${protocol}://${host}/track?p=${order.protocol}`,
            webhook_url: `${protocol}://${host}/api/infinitepay-webhook`,
            order_nsu: order.protocol,
            items: items
          })
        });

        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.url) {
            checkoutUrl = ipData.url;
          }
        } else {
          const errMsg = await ipRes.text();
          console.error("Erro InfinitePay API:", errMsg);
          return res.status(400).json({ error: "Erro ao gerar link de pagamento. Verifique a tag InfinitePay configurada e tente novamente." });
        }
      } catch (err) { 
        console.error("Erro requisição InfinitePay:", err); 
        return res.status(500).json({ error: "Serviço de pagamento indisponível no momento. Tente novamente." });
      }

      if (!checkoutUrl) {
        return res.status(400).json({ error: "Falha ao obter URL de checkout." });
      }

      await client.execute({
        sql: `INSERT INTO pedidos
                (protocolo, nome, cpf, telefone, email, endereco, frete_tipo, frete_valor, total, respostas, status, prazo_entrega, produto_nome, produto_preco)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'em_processamento', ?, ?, ?)`,
        args: [
          order.protocol,
          order.name,
          order.cpf,
          order.phone ?? null,
          order.email,
          order.address ? `${order.address}${order.complement ? ' - ' + order.complement : ''}` : null,
          order.shipping ?? null,
          order.shippingPrice ?? null,
          order.total ?? null,
          JSON.stringify(order.answers ?? []),
          prazoEntrega,
          order.productName ?? null,
          order.productPrice ?? null
        ]
      });

      return res.status(201).json({
        success: true,
        protocol: order.protocol,
        prazo_entrega: prazoEntrega,
        paymentUrl: checkoutUrl,
        message: "Pedido registrado com sucesso."
      });

    } else if (req.method === 'GET') {
      const result = await client.execute(
        "SELECT id, protocolo, nome, email, frete_tipo, frete_valor, total, status, prazo_entrega, data_criacao FROM pedidos ORDER BY id DESC"
      );
      return res.status(200).json({ data: result.rows });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Método ${req.method} não permitido.` });

  } catch (error) {
    console.error("[submit] Erro:", error);
    if (error.message?.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "Protocolo duplicado." });
    }
    return res.status(500).json({ error: "Erro interno ao processar a requisição." });
  }
}
