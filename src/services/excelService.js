import * as XLSX from 'xlsx'

export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Hem raw (sayısal) hem de formatted (string) verileri al
        const jsonDataRaw = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: '' })
        const jsonDataFormatted = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' })
        
        // İki veriyi birleştir (raw sayısal değerleri tercih et, yoksa formatted kullan)
        const jsonData = jsonDataRaw.map((row, index) => {
          const formattedRow = jsonDataFormatted[index] || {}
          const mergedRow = { ...formattedRow }
          
          // Sayısal değerleri raw'dan al
          Object.keys(row).forEach(key => {
            if (typeof row[key] === 'number' && !isNaN(row[key])) {
              mergedRow[key] = row[key]
            } else if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
              mergedRow[key] = row[key]
            }
          })
          
          return mergedRow
        })
        
        resolve(jsonData)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = (error) => reject(error)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Fiyat değerini parse et (TL, ₺, virgül, nokta gibi karakterleri temizle)
 * @param {any} value - Fiyat değeri
 * @returns {number} Parse edilmiş fiyat
 */
const parsePrice = (value) => {
  // Null, undefined veya boş string kontrolü
  if (value === null || value === undefined || value === '') return 0
  
  // String'e çevir
  let priceStr = String(value).trim()
  
  // Boşsa 0 döndür
  if (!priceStr || priceStr === '' || priceStr === '-' || priceStr === 'null' || priceStr === 'undefined') return 0
  
  // Eğer zaten sayı ise direkt döndür
  if (typeof value === 'number' && !isNaN(value)) {
    return value
  }
  
  // TL, ₺, $, € gibi para birimlerini kaldır
  priceStr = priceStr.replace(/[₺$€£TLtl]/g, '')
  
  // Boşlukları kaldır
  priceStr = priceStr.replace(/\s/g, '')
  
  // Türkçe format: 1.234,56 -> 1234.56
  // Eğer son virgülden önce 2 haneli sayı varsa (kuruş), virgülü noktaya çevir
  const commaIndex = priceStr.lastIndexOf(',')
  const dotIndex = priceStr.lastIndexOf('.')
  
  if (commaIndex > dotIndex) {
    // Virgül noktadan sonra geliyorsa (Türkçe format: 1.234,56)
    // Noktaları kaldır, virgülü noktaya çevir
    priceStr = priceStr.replace(/\./g, '').replace(',', '.')
  } else if (dotIndex > commaIndex) {
    // Nokta virgülden sonra geliyorsa (İngilizce format: 1,234.56)
    // Virgülleri kaldır
    priceStr = priceStr.replace(/,/g, '')
  } else if (commaIndex !== -1) {
    // Sadece virgül varsa, noktaya çevir (kuruş için)
    const afterComma = priceStr.substring(commaIndex + 1)
    if (afterComma.length <= 2) {
      // Kuruş formatı (123,45)
      priceStr = priceStr.replace(',', '.')
    } else {
      // Binlik ayırıcı (1,234)
      priceStr = priceStr.replace(/,/g, '')
    }
  }
  
  // Sadece sayı, nokta ve eksi işaretini bırak
  priceStr = priceStr.replace(/[^\d.-]/g, '')
  
  // Parse et
  const parsed = parseFloat(priceStr)
  
  // NaN veya geçersizse 0 döndür
  return isNaN(parsed) ? 0 : parsed
}

export const mapExcelColumns = (excelData) => {
  if (!excelData || excelData.length === 0) return []
  
  // İlk satırdan sütun isimlerini al
  const columns = Object.keys(excelData[0])
  
  // Debug: Kolon isimlerini logla
  console.log('Excel kolonları:', columns)
  
  return excelData.map((row, index) => {
    const product = {}
    
    // Yaygın sütun isimlerini eşleştir
    columns.forEach(col => {
      const colLower = col.toLowerCase().trim()
      
      // Ürün adı
      if ((colLower.includes('ürün') && (colLower.includes('ad') || colLower.includes('isim'))) || 
          colLower.includes('name') || 
          colLower.includes('title') ||
          colLower === 'ürün' ||
          colLower === 'product') {
        product.name = row[col] || ''
      } 
      // SKU
      else if (colLower.includes('kod') || 
               colLower.includes('sku') || 
               colLower.includes('barkod') ||
               colLower === 'kod' ||
               colLower === 'sku') {
        product.sku = row[col] || ''
      } 
      // FİYAT - sadece "fiyat" içeriyorsa
      else if (colLower.includes('fiyat') || 
               colLower.includes('price') ||
               colLower === 'fiyat' ||
               colLower === 'price') {
        const priceValue = row[col]
        
        // Eğer zaten sayı ise direkt kullan
        if (typeof priceValue === 'number' && !isNaN(priceValue)) {
          product.price = priceValue
        } else {
          // String ise parse et
          const parsedPrice = parsePrice(priceValue)
          product.price = parsedPrice
        }
        
        // Debug için (production'da kaldırılabilir)
        if (index === 0) {
          console.log(`Fiyat kolonu bulundu: "${col}" = "${priceValue}" (${typeof priceValue}) -> ${product.price}`)
        }
      } 
      // Stok
      else if (colLower.includes('stok') || 
               colLower.includes('stock') || 
               colLower.includes('quantity') ||
               colLower === 'stok' ||
               colLower === 'stock') {
        product.stock = parseInt(row[col]) || 0
      } 
      // Açıklama
      else if (colLower.includes('açıklama') || 
               colLower.includes('description') || 
               colLower.includes('desc') ||
               colLower === 'açıklama' ||
               colLower === 'description') {
        product.description = row[col] || ''
      } 
      // Kategori
      else if (colLower.includes('kategori') || 
               colLower.includes('category') ||
               colLower === 'kategori' ||
               colLower === 'category') {
        product.category = row[col] || ''
      } 
      // Resim
      else if (colLower.includes('resim') || 
               colLower.includes('image') || 
               colLower.includes('foto') ||
               colLower === 'resim' ||
               colLower === 'image') {
        product.image = row[col] || ''
      } 
      // Marka
      else if (colLower.includes('marka') || 
               colLower.includes('brand') ||
               colLower === 'marka' ||
               colLower === 'brand') {
        product.brand = row[col] || ''
      }
    })
    
    // Debug: İlk ürün için log
    if (index === 0) {
      console.log('İlk ürün parse edildi:', product)
    }
    
    // Eğer name yoksa, ilk sütunu name olarak kullan
    if (!product.name && columns.length > 0) {
      product.name = row[columns[0]] || `Ürün ${index + 1}`
    }
    
    // Eğer SKU yoksa, name'den oluştur
    if (!product.sku && product.name) {
      product.sku = product.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }
    
    return product
  })
}

