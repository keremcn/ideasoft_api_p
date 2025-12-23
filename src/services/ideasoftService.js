import axios from 'axios'

// Ideasoft API base URL - OAuth2 token ile kullanılır
const IDEASOFT_API_BASE = 'https://api.ideasoft.com.tr/api/v1'

/**
 * Ideasoft API'ye ürün oluşturur
 * @param {Object} product - Ürün bilgileri
 * @param {string} accessToken - OAuth2 access token
 * @param {string} shopId - Mağaza ID
 * @returns {Promise<Object>} İşlem sonucu
 */
export const createIdeasoftProduct = async (product, accessToken, shopId) => {
  try {
    // Ideasoft API formatına göre ürün objesi oluştur
    // Ideasoft API dokümantasyonuna göre formatı ayarlayın
    const ideasoftProduct = {
      name: product.name,
      sku: product.sku || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      price: product.price || 0,
      stock: product.stock || 0,
      status: 'passive', // Pasif olarak ekle
      description: product.description || '',
      images: product.image ? [{ url: product.image, isPrimary: true }] : [],
      category: product.category || '',
      brand: product.brand || ''
    }

    const response = await axios.post(
      `${IDEASOFT_API_BASE}/shops/${shopId}/products`,
      ideasoftProduct,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    )

    return { success: true, data: response.data }
  } catch (error) {
    console.error('Ideasoft API Error:', error)
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message ||
                        'Bilinmeyen bir hata oluştu'
    return {
      success: false,
      error: errorMessage,
      statusCode: error.response?.status
    }
  }
}

/**
 * Toplu ürün oluşturma
 * @param {Array} products - Ürün listesi
 * @param {string} accessToken - OAuth2 access token
 * @param {string} shopId - Mağaza ID
 * @param {Function} onProgress - İlerleme callback fonksiyonu
 * @returns {Promise<Array>} İşlem sonuçları
 */
export const bulkCreateProducts = async (products, accessToken, shopId, onProgress) => {
  const results = []
  const total = products.length

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const result = await createIdeasoftProduct(product, accessToken, shopId)
    results.push({ ...result, product: product.name, index: i + 1 })
    
    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        product: product.name,
        success: result.success,
        error: result.error
      })
    }

    // API rate limit için kısa bekleme (Ideasoft API limitlerine göre ayarlayın)
    if (i < products.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return results
}

/**
 * OAuth2 token almak için (isteğe bağlı - kullanıcı token'ı manuel girebilir)
 * @param {string} clientId - Client ID
 * @param {string} clientSecret - Client Secret
 * @returns {Promise<string>} Access token
 */
export const getAccessToken = async (clientId, clientSecret) => {
  try {
    // Ideasoft API'ye doğrudan istek at
    const response = await axios.post(
      'https://api.ideasoft.com.tr/oauth/token',
      {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    )

    if (response.data && response.data.access_token) {
      return response.data.access_token
    } else {
      throw new Error('Token alınamadı: Geçersiz yanıt')
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error_description || 
                        error.response?.data?.error || 
                        error.response?.data?.message ||
                        error.message || 
                        'Token alınamadı'
    throw new Error(errorMessage)
  }
}

