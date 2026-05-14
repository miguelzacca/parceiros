export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  return res.status(200).json({
    pac: process.env.KIWIFY_LINK_PAC || 'https://pay.kiwify.com.br/5qlfdJs',
    pac_upsell: process.env.KIWIFY_LINK_PAC_UPSELL || 'https://pay.kiwify.com.br/DldXfPz',
    sedex: process.env.KIWIFY_LINK_SEDEX || 'https://pay.kiwify.com.br/Sux8XpU',
    sedex_upsell: process.env.KIWIFY_LINK_SEDEX_UPSELL || 'https://pay.kiwify.com.br/R769Ad0'
  });
}
