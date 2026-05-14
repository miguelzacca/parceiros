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
      data_criacao  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Tenta adicionar as colunas novas caso a tabela já existisse de uma versão anterior
  try { await client.execute("ALTER TABLE pedidos ADD COLUMN status TEXT NOT NULL DEFAULT 'em_processamento'"); } catch(e) {}
  try { await client.execute("ALTER TABLE pedidos ADD COLUMN prazo_entrega TEXT"); } catch(e) {}

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

      await client.execute({
        sql: `INSERT INTO pedidos
                (protocolo, nome, cpf, telefone, email, endereco, frete_tipo, frete_valor, total, respostas, status, prazo_entrega)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'em_processamento', ?)`,
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
          prazoEntrega
        ]
      });

      return res.status(201).json({
        success: true,
        protocol: order.protocol,
        prazo_entrega: prazoEntrega,
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
