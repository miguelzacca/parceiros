import { createClient } from "@libsql/client";

// Mapa de status → rótulo exibível + cor
const STATUS_MAP = {
  em_processamento: {
    label: "Em Processamento",
    desc:  "Seu pedido foi recebido e está sendo preparado.",
    step:  1
  },
  enviado: {
    label: "Enviado",
    desc:  "Seu pedido foi despachado e está a caminho.",
    step:  2
  },
  em_transito: {
    label: "Em Trânsito",
    desc:  "Seu pedido está em rota de entrega.",
    step:  3
  },
  entregue: {
    label: "Entregue",
    desc:  "Seu pedido foi entregue com sucesso. Aproveite!",
    step:  4
  },
  cancelado: {
    label: "Cancelado",
    desc:  "Este pedido foi cancelado. Entre em contato com o suporte.",
    step:  0
  }
};

function formatBR(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { protocolo } = req.query;
  if (!protocolo) return res.status(400).json({ error: "Protocolo não informado." });

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return res.status(500).json({ error: "Configuração de banco ausente." });

  const client = createClient({ url, authToken });

  try {
    if (req.method === 'GET') {
      const result = await client.execute({
        sql: `SELECT protocolo, nome, email, frete_tipo, frete_valor, total,
                     status, prazo_entrega, data_criacao
              FROM pedidos WHERE protocolo = ?`,
        args: [protocolo.toUpperCase()]
      });

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Pedido não encontrado. Verifique o código de protocolo." });
      }

      const row = result.rows[0];
      const statusInfo = STATUS_MAP[row.status] ?? { label: row.status, desc: "", step: 0 };

      return res.status(200).json({
        protocolo:    row.protocolo,
        nome:         row.nome,
        email:        row.email,
        frete_tipo:   row.frete_tipo,
        frete_valor:  row.frete_valor,
        total:        row.total,
        status:       row.status,
        status_label: statusInfo.label,
        status_desc:  statusInfo.desc,
        status_step:  statusInfo.step,
        prazo_entrega:          row.prazo_entrega,
        prazo_entrega_formatado: formatBR(row.prazo_entrega),
        data_criacao:           row.data_criacao,
        data_criacao_formatada: formatBR(row.data_criacao)
      });

    } else if (req.method === 'PATCH') {
      // Endpoint administrativo (protegido por senha simples via header)
      const adminKey = req.headers['x-admin-key'];
      if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: "Não autorizado." });
      }

      const { status } = req.body ?? {};
      if (!status || !STATUS_MAP[status]) {
        return res.status(400).json({
          error: "Status inválido.",
          valores_validos: Object.keys(STATUS_MAP)
        });
      }

      const updated = await client.execute({
        sql: "UPDATE pedidos SET status = ? WHERE protocolo = ?",
        args: [status, protocolo.toUpperCase()]
      });

      if (updated.rowsAffected === 0) {
        return res.status(404).json({ error: "Pedido não encontrado." });
      }

      return res.status(200).json({ success: true, protocolo: protocolo.toUpperCase(), novo_status: status });
    }

    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).json({ error: `Método ${req.method} não permitido.` });

  } catch (error) {
    console.error("[order] Erro:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
}
