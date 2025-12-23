// Development için mock API (Vercel Serverless Function olmadan test için)
// Bu dosya sadece development için kullanılır, production'da api/scrape.js kullanılır

export default async function handler(req, res) {
  // Development'ta direkt scraping yapamayız (CORS), bu yüzden mock data döndürüyoruz
  // Production'da Vercel Serverless Function kullanılacak
  
  const { productName, brand, url } = req.body

  // Mock response - gerçek scraping için Vercel'de deploy edilmesi gerekir
  return res.status(200).json({
    success: true,
    url: url || `https://www.${brand?.toLowerCase() || 'asus'}.com/search?q=${encodeURIComponent(productName)}`,
    description: `${brand || ''} ${productName} - Yüksek kaliteli ve güvenilir ürün. Detaylı bilgi ve özellikler için ürün sayfasını ziyaret edin.`,
    image: `https://source.unsplash.com/800x600/?${encodeURIComponent(brand + ' ' + productName)}`
  })
}

