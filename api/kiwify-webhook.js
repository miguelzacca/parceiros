import { createClient } from "@libsql/client";
import { createHmac } from "crypto";

function verifySignature(body, signature, secret) {
  if (!secret || !signature) return true; // skip if not configured
  const hmac = createHmac('sha1', secret);
  hmac.update(JSON.stringify(body));
  const expected = hmac.digest('hex');
  return signature === expected;
}

// Generate a fake but realistic-looking tracking code
function generateTrackingCode(shippingType) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  // Correios format: XX123456789BR
  let code = '';
  for (let i = 0; i < 2; i++) code += chars[Math.floor(Math.random() * chars.length)];
  for (let i = 0; i < 9; i++) code += nums[Math.floor(Math.random() * nums.length)];
  code += 'BR';
  return code;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Kiwify-Signature');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.KIWIFY_WEBHOOK_SECRET;
  const signature = req.headers['x-kiwify-signature'] || req.headers['signature'];

  // Verify webhook signature
  if (secret && secret !== 'seu_webhook_secret_aqui') {
    if (!verifySignature(req.body, signature, secret)) {
      console.error('[kiwify-webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const event = req.body;
  console.log('[kiwify-webhook] Received event:', JSON.stringify(event).substring(0, 500));

  // Kiwify sends different event types
  // order_status can be: "paid", "refunded", "chargedback", "waiting_payment", etc.
  const orderStatus = event.order_status || event.subscription_status;
  const customerEmail = event.Customer?.email || event.customer?.email || '';
  const customerName = event.Customer?.full_name || event.customer?.full_name || '';

  if (!customerEmail) {
    console.error('[kiwify-webhook] No customer email in event');
    return res.status(200).json({ received: true, warning: 'no_email' });
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const client = createClient({ url, authToken });

  // Ensure columns exist
  try { await client.execute("ALTER TABLE pedidos ADD COLUMN payment_status TEXT DEFAULT 'pending'"); } catch(e) {}
  try { await client.execute("ALTER TABLE pedidos ADD COLUMN tracking_code TEXT"); } catch(e) {}
  try { await client.execute("ALTER TABLE pedidos ADD COLUMN kiwify_order_id TEXT"); } catch(e) {}

  try {
    if (orderStatus === 'paid') {
      // Find the order by email (most recent pending one)
      const result = await client.execute({
        sql: `SELECT protocolo, frete_tipo FROM pedidos 
              WHERE email = ? AND (payment_status = 'pending' OR payment_status IS NULL)
              ORDER BY id DESC LIMIT 1`,
        args: [customerEmail]
      });

      if (result.rows.length === 0) {
        console.log('[kiwify-webhook] No pending order found for:', customerEmail);
        return res.status(200).json({ received: true, warning: 'no_pending_order' });
      }

      const row = result.rows[0];
      const trackingCode = generateTrackingCode(row.frete_tipo);
      const kiwifyOrderId = event.order_id || event.subscription_id || '';

      // Update order: mark as paid, generate tracking code, update status
      await client.execute({
        sql: `UPDATE pedidos 
              SET payment_status = 'approved', 
                  tracking_code = ?,
                  kiwify_order_id = ?,
                  status = 'em_processamento'
              WHERE protocolo = ?`,
        args: [trackingCode, kiwifyOrderId, row.protocolo]
      });

      console.log(`[kiwify-webhook] Order ${row.protocolo} approved. Tracking: ${trackingCode}`);
      return res.status(200).json({ 
        received: true, 
        protocolo: row.protocolo, 
        tracking_code: trackingCode 
      });

    } else if (orderStatus === 'refunded' || orderStatus === 'chargedback') {
      await client.execute({
        sql: `UPDATE pedidos SET payment_status = ?, status = 'cancelado' 
              WHERE email = ? AND payment_status = 'approved' 
              ORDER BY id DESC LIMIT 1`,
        args: [orderStatus, customerEmail]
      });
      console.log(`[kiwify-webhook] Order for ${customerEmail} marked as ${orderStatus}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('[kiwify-webhook] Error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}
