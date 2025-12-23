// Vercel Serverless Function - Web scraping için
const axios = require('axios')
const cheerio = require('cheerio')

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { productName, brand, url } = req.body

  if (!productName && !url) {
    return res.status(400).json({ error: 'Product name or URL required' })
  }

  try {
    let targetUrl = url

    // Eğer URL yoksa, Google'da arama yap
    if (!targetUrl) {
      targetUrl = await searchProductUrl(productName, brand)
    }

    if (!targetUrl) {
      return res.status(404).json({ 
        error: 'Product URL not found',
        description: generateFallbackDescription(productName, brand),
        image: ''
      })
    }

    // URL'den içeriği çek
    const { description, image } = await scrapeProductInfo(targetUrl, productName, brand)

    return res.status(200).json({
      success: true,
      url: targetUrl,
      description,
      image
    })
  } catch (error) {
    console.error('Scraping error:', error)
    return res.status(500).json({
      error: error.message,
      description: generateFallbackDescription(productName, brand),
      image: ''
    })
  }
}

/**
 * Google'da ürün URL'ini ara
 */
async function searchProductUrl(productName, brand = '') {
  try {
    const searchQuery = `${brand} ${productName} site:asus.com OR site:${brand?.toLowerCase() || 'manufacturer'}.com`.trim()
    
    // Google Custom Search API kullan (eğer varsa)
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
    const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID

    if (GOOGLE_API_KEY && GOOGLE_SEARCH_ENGINE_ID) {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: GOOGLE_API_KEY,
          cx: GOOGLE_SEARCH_ENGINE_ID,
          q: searchQuery,
          num: 3
        }
      })

      if (response.data.items && response.data.items.length > 0) {
        // ASUS sitesini tercih et
        const asusUrl = response.data.items.find(item => 
          item.link.includes('asus.com')
        )
        return asusUrl ? asusUrl.link : response.data.items[0].link
      }
    }

    // Alternatif: DuckDuckGo veya başka bir arama motoru kullanılabilir
    return null
  } catch (error) {
    console.error('Search error:', error)
    return null
  }
}

/**
 * Ürün sayfasından bilgileri scrape et
 */
async function scrapeProductInfo(url, productName, brand) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    })

    const $ = cheerio.load(response.data)
    let description = ''
    let image = ''

    // ASUS sitesi için özel parsing
    if (url.includes('asus.com')) {
      // Açıklama bulma - önce meta tag'lerden
      description = $('meta[property="og:description"]').attr('content') || 
                   $('meta[name="description"]').attr('content') || ''

      // Eğer meta'dan yoksa, sayfa içeriğinden al
      if (!description || description.length < 50) {
        // ASUS sitesindeki ana açıklama bölümlerini bul
        const mainContent = $('h1, h2').filter((i, el) => {
          const text = $(el).text().toLowerCase()
          return text.includes('harika') || text.includes('genel') || text.includes('bakış')
        }).first()

        if (mainContent.length) {
          // Başlıktan sonraki paragrafları al
          let descParts = []
          mainContent.nextAll('p, div').each((i, elem) => {
            const text = $(elem).text().trim()
            if (text.length > 50 && text.length < 500 && !descParts.includes(text)) {
              descParts.push(text)
              if (descParts.length >= 3) return false
            }
          })
          description = descParts.join(' ').trim()
        }

        // Hala yoksa, tüm paragraflardan en uzun olanı al
        if (!description || description.length < 50) {
          let longestText = ''
          $('p, div[class*="content"], div[class*="description"]').each((i, elem) => {
            const text = $(elem).text().trim()
            // HTML etiketlerini temizle
            const cleanText = text.replace(/\s+/g, ' ').trim()
            if (cleanText.length > longestText.length && cleanText.length > 100 && cleanText.length < 2000) {
              longestText = cleanText
            }
          })
          if (longestText) description = longestText
        }
      }

      // Resim bulma - ASUS sitesi için özel selector'lar
      const imageSelectors = [
        'meta[property="og:image"]',
        'meta[name="og:image"]',
        'img[src*="product" i]',
        'img[alt*="' + productName.substring(0, 20) + '" i]',
        '.product-image img',
        '.main-image img',
        'img[class*="product"]',
        'img[class*="main"]',
        'picture img',
        'img[src*=".jpg"], img[src*=".png"], img[src*=".webp"]'
      ]

      for (const selector of imageSelectors) {
        const element = $(selector).first()
        if (element.length) {
          image = element.attr('content') || 
                 element.attr('src') || 
                 element.attr('data-src') || 
                 element.attr('data-lazy-src') ||
                 element.attr('data-original') || ''
          
          if (image) {
            // Relative URL'leri absolute yap
            if (image.startsWith('/')) {
              const urlObj = new URL(url)
              image = urlObj.origin + image
            } else if (image.startsWith('//')) {
              image = 'https:' + image
            } else if (!image.startsWith('http')) {
              const urlObj = new URL(url)
              image = urlObj.origin + '/' + image
            }
            
            // Küçük resimleri filtrele (genellikle icon'lar)
            if (image && !image.includes('icon') && !image.includes('logo')) {
              break
            } else {
              image = '' // Eğer icon/logosa benziyorsa, devam et
            }
          }
        }
      }
    } else {
      // Genel scraping (diğer siteler için)
      description = $('meta[property="og:description"]').attr('content') || 
                   $('meta[name="description"]').attr('content') || 
                   $('.description, .product-description').first().text() || ''

      image = $('meta[property="og:image"]').attr('content') ||
              $('.product-image img, .main-image img').first().attr('src') || ''
    }

    // Fallback açıklama
    if (!description || description.length < 20) {
      description = generateFallbackDescription(productName, brand)
    }

    // Fallback resim
    if (!image) {
      image = `https://source.unsplash.com/800x600/?${encodeURIComponent(brand + ' ' + productName)}`
    }

    return {
      description: description.trim(),
      image: image.trim()
    }
  } catch (error) {
    console.error('Scraping error:', error)
    return {
      description: generateFallbackDescription(productName, brand),
      image: ''
    }
  }
}

/**
 * Fallback açıklama oluştur
 */
function generateFallbackDescription(productName, brand = '') {
  const brandText = brand ? `${brand} marka ` : ''
  return `${brandText}${productName} - Yüksek kaliteli ve güvenilir ürün. Detaylı bilgi ve özellikler için ürün sayfasını ziyaret edin.`
}

