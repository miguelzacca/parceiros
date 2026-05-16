import { createClient } from "@libsql/client";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // A Perfect Pay envia os dados do webhook no body.
  const payload = req.body;
  console.log('[Perfect Pay Webhook] Recebido:', JSON.stringify(payload));

  // Identificar o status (cada gateway tem sua estrutura. Na Perfect Pay costuma ser transaction.status ou sale_status)
  // O formato pode variar, vamos cobrir os mais comuns:
  const status = payload.transaction_status || payload.sale_status || payload.status;
  
  // Identificar o protocolo (que passamos no metadata durante a criação do checkout)
  const metadata = payload.metadata || payload.custom_data || {};
  const protocolo = metadata.protocol || payload.reference || payload.id;

  if (!protocolo) {
    return res.status(400).json({ error: 'Protocolo não encontrado no payload.' });
  }

  // Verifica se o pagamento foi aprovado
  // Perfect Pay usa 'approved', 'paid', 'Aprovada', 'Paid'
  const isApproved = ['approved', 'paid', 'aprovada'].includes((status || '').toString().toLowerCase());

  if (isApproved) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) {
      console.error('[Perfect Pay Webhook] Variáveis do Turso ausentes.');
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    const client = createClient({ url, authToken });

    try {
      // Gera um código de rastreio fictício
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let trackingCode = 'WP';
      for (let i = 0; i < 9; i++) trackingCode += chars.charAt(Math.floor(Math.random() * chars.length));
      trackingCode += 'BR';

      // Atualiza o banco
      const result = await client.execute({
        sql: `UPDATE pedidos 
              SET status = 'enviado', 
                  payment_status = 'approved',
                  tracking_code = ?
              WHERE protocolo = ? AND payment_status != 'approved'`,
        args: [trackingCode, protocolo]
      });

      if (result.rowsAffected > 0) {
        console.log(`[Perfect Pay Webhook] Pedido ${protocolo} aprovado e atualizado com sucesso.`);
      } else {
        console.log(`[Perfect Pay Webhook] Pedido ${protocolo} já estava aprovado ou não encontrado.`);
      }
      
      return res.status(200).json({ success: true, message: 'Webhook processado com sucesso' });

    } catch (error) {
      console.error('[Perfect Pay Webhook] Erro ao atualizar BD:', error);
      return res.status(500).json({ error: 'Erro interno ao processar webhook' });
    }
  }

  return res.status(200).json({ success: true, message: 'Webhook ignorado (status não aprovado)' });
}
