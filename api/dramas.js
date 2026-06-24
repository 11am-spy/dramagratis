export default async function handler(req, res) {
  // Mengizinkan Front-End dari mana saja untuk mengakses API ini (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Menembak Jikan API untuk mengambil daftar anime top saat ini
    const response = await fetch('https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=25');
    const result = await response.json();

    // Kirim datanya ke Front-End websitemu
    res.status(200).json(result.data || []);
  } catch (error) {
    console.error("Error Jikan API:", error);
    res.status(500).json({ error: "Gagal mengambil data anime dari server publik." });
  }
}
