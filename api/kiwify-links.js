export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  return res.status(200).json({
    pac: process.env.KIWIFY_LINK_PAC || '',
    pac_upsell: process.env.KIWIFY_LINK_PAC_UPSELL || '',
    sedex: process.env.KIWIFY_LINK_SEDEX || '',
    sedex_upsell: process.env.KIWIFY_LINK_SEDEX_UPSELL || ''
  });
}
