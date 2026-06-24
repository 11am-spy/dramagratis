export default async function handler(req, res) {
  // Pengaturan keamanan (CORS Headers) agar Front-End Vercel bisa mengaksesnya
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { keyword, page, size } = req.query;
    
    // Data API Key dari screenshot RapidAPI kamu kemarin
    const RAPIDAPI_KEY = 'b8ad68c092mshdb00e516b8d148cp19c7cejsn7fe5c2a0bf25';
    const RAPIDAPI_HOST = 'short-drama-pro.p.rapidapi.com';
    const targetUrl = new URL('https://short-drama-pro.p.rapidapi.com/starshort/api/v1/dramas/search');
    
    // Oper parameter pencarian/pagination dari Front-End jika ada
    if (keyword) targetUrl.searchParams.set('keyword', keyword);
    if (page) targetUrl.searchParams.set('page', page);
    targetUrl.searchParams.set('size', size || '30'); // Default ambil 30 data

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `RapidAPI error dengan status ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error pada serverless Vercel' });
  }
}

