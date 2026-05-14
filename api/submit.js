import { createClient } from "@libsql/client";

export default async function handler(req, res) {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    return res.status(500).json({ error: "Variáveis de ambiente do Turso não configuradas." });
  }

  try {
    const client = createClient({ url, authToken });

    // Cria a tabela de pedidos se ela não existir
    await client.execute(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        protocolo TEXT,
        nome TEXT,
        cpf TEXT,
        telefone TEXT,
        email TEXT,
        endereco TEXT,
        frete_tipo TEXT,
        frete_valor REAL,
        total REAL,
        respostas TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (req.method === 'POST') {
      const order = req.body;

      // Validação básica
      if (!order.name || !order.email || !order.cpf) {
        return res.status(400).json({ error: "Dados incompletos." });
      }

      // Inserção no banco
      const result = await client.execute({
        sql: `INSERT INTO pedidos (
                protocolo, nome, cpf, telefone, email, endereco, frete_tipo, frete_valor, total, respostas
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          order.protocol,
          order.name,
          order.cpf,
          order.phone,
          order.email,
          `${order.address} ${order.complement ? '- ' + order.complement : ''}`,
          order.shipping,
          order.shippingPrice,
          order.total,
          JSON.stringify(order.answers)
        ]
      });

      return res.status(201).json({ 
        success: true, 
        message: "Pedido salvo com sucesso",
        orderId: result.lastInsertRowid.toString() 
      });

    } else if (req.method === 'GET') {
      const result = await client.execute("SELECT * FROM pedidos ORDER BY id DESC");
      return res.status(200).json({ data: result.rows });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });

  } catch (error) {
    console.error("Erro no DB:", error);
    return res.status(500).json({ error: "Erro interno ao processar a requisição." });
  }
}
