import axios from 'axios'

// Production'da Vercel API route'u, development'ta mock
const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:3000/api' 
  : (import.meta.env.VITE_API_BASE || '/api')

/**
 * Ürün bilgilerini web scraping ile topla
 * @param {string} productName - Ürün adı
 * @param {string} brand - Marka
 * @param {string} url - Ürün URL'i (opsiyonel)
 * @returns {Promise<Object>} Açıklama ve resim URL'i
 */
export const scrapeProductInfo = async (productName, brand = '', url = '') => {
  try {
    // Önce Google'da ürünü ara ve URL bul
    let productUrl = url
    
    if (!productUrl) {
      productUrl = await findProductUrl(productName, brand)
    }

    // Eğer URL bulunduysa, scraping yap
    if (productUrl) {
      try {
        const response = await axios.post(`${API_BASE}/scrape`, {
          productName,
          brand,
          url: productUrl
        }, {
          timeout: 15000 // 15 saniye timeout
        })

        if (response.data && response.data.success) {
          return {
            description: response.data.description || '',
            image: response.data.image || '',
            url: response.data.url || productUrl
          }
        }
      } catch (apiError) {
        // API hatası durumunda (development'ta olabilir), direkt URL'den scraping yapmayı dene
        console.warn('API scraping failed, trying direct approach:', apiError.message)
        
        // Development'ta API route çalışmayabilir, bu durumda fallback kullan
        if (import.meta.env.DEV) {
          console.info('Development mode: Scraping API not available. Use Vercel CLI for local testing or deploy to test scraping.')
        }
      }
    }

    // Fallback: Basit açıklama ve resim
    return {
      description: generateFallbackDescription(productName, brand),
      image: await getFallbackImage(productName, brand),
      url: productUrl || ''
    }
  } catch (error) {
    console.error('Scraping error:', error)
    return {
      description: generateFallbackDescription(productName, brand),
      image: await getFallbackImage(productName, brand),
      url: ''
    }
  }
}

/**
 * Google'da ürün URL'ini bul
 */
async function findProductUrl(productName, brand = '') {
  try {
    const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
    const GOOGLE_SEARCH_ENGINE_ID = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID

    if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      return null
    }

    // Marka sitesini tercih et
    const brandDomain = brand ? `${brand.toLowerCase()}.com` : ''
    const searchQuery = brandDomain 
      ? `${brand} ${productName} site:${brandDomain}`
      : `${brand} ${productName}`

    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_SEARCH_ENGINE_ID,
        q: searchQuery,
        num: 5
      }
    })

    if (response.data.items && response.data.items.length > 0) {
      // Marka sitesini tercih et
      const brandUrl = response.data.items.find(item => 
        brand && item.link.toLowerCase().includes(brand.toLowerCase())
      )
      
      return brandUrl ? brandUrl.link : response.data.items[0].link
    }

    return null
  } catch (error) {
    console.error('Google search error:', error)
    return null
  }
}

/**
 * Fallback açıklama oluştur
 */
function generateFallbackDescription(productName, brand = '') {
  const brandText = brand ? `${brand} marka ` : ''
  return `${brandText}${productName} - Yüksek kaliteli ve güvenilir ürün. Detaylı bilgi ve özellikler için ürün sayfasını ziyaret edin.`
}

/**
 * Fallback resim URL'i al
 */
async function getFallbackImage(productName, brand = '') {
  try {
    const searchQuery = encodeURIComponent(`${brand} ${productName}`.trim())
    return `https://source.unsplash.com/800x600/?${searchQuery}`
  } catch (error) {
    return ''
  }
}

