import { useState } from 'react'
import { readExcelFile, mapExcelColumns } from '../services/excelService'
import { enrichProducts } from '../services/googleService'
import { bulkCreateProducts } from '../services/ideasoftService'
import ProductTable from './ProductTable'
import ConfigForm from './ConfigForm'
import './ProductImporter.css'

const ProductImporter = () => {
  const [step, setStep] = useState(1) // 1: Upload, 2: Review, 3: Config, 4: Import
  const [products, setProducts] = useState([])
  const [originalProducts, setOriginalProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [config, setConfig] = useState({
    apiKey: '',
    shopId: '',
    enrichData: true
  })
  const [results, setResults] = useState(null)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setLoading(true)
    try {
      const excelData = await readExcelFile(file)
      const mappedProducts = mapExcelColumns(excelData)
      setOriginalProducts(mappedProducts)
      setProducts(mappedProducts)
      setStep(2)
    } catch (error) {
      alert('Excel dosyası okunurken hata oluştu: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrichData = async () => {
    setLoading(true)
    setProgress({ current: 0, total: products.length, message: 'Veriler zenginleştiriliyor...' })
    
    try {
      const enriched = await enrichProducts([...products], (prog) => {
        setProgress(prog)
      })
      setProducts(enriched)
      alert('Veriler başarıyla zenginleştirildi!')
    } catch (error) {
      alert('Veri zenginleştirme hatası: ' + error.message)
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const handleNext = () => {
    if (step === 2) {
      setStep(3)
    }
  }

  const handleConfigSubmit = (newConfig) => {
    setConfig(newConfig)
    setStep(4)
  }

  const handleImport = async () => {
    if (!config.apiKey || !config.shopId) {
      alert('Lütfen API Key ve Shop ID giriniz!')
      return
    }

    setLoading(true)
    setProgress({ current: 0, total: products.length, message: 'Ürünler aktarılıyor...' })

    try {
      const importResults = await bulkCreateProducts(
        products,
        config.apiKey,
        config.shopId,
        (prog) => {
          setProgress(prog)
        }
      )

      const successCount = importResults.filter(r => r.success).length
      const failCount = importResults.filter(r => !r.success).length

      setResults({
        total: importResults.length,
        success: successCount,
        failed: failCount,
        details: importResults
      })

      alert(`${successCount} ürün başarıyla aktarıldı, ${failCount} ürün başarısız oldu.`)
    } catch (error) {
      alert('Aktarım hatası: ' + error.message)
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const handleReset = () => {
    setStep(1)
    setProducts([])
    setOriginalProducts([])
    setResults(null)
    setProgress(null)
  }

  const handleProductUpdate = (index, updatedProduct) => {
    const newProducts = [...products]
    newProducts[index] = updatedProduct
    setProducts(newProducts)
  }

  return (
    <div className="product-importer">
      {/* Progress Bar */}
      {loading && progress && (
        <div className="progress-overlay">
          <div className="progress-card">
            <h3>{progress.message || 'İşlem devam ediyor...'}</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
            <p>{progress.current} / {progress.total}</p>
            {progress.product && <p className="current-product">{progress.product}</p>}
          </div>
        </div>
      )}

      {/* Step 1: File Upload */}
      {step === 1 && (
        <div className="step-container">
          <div className="upload-area">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              id="file-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="upload-button">
              <span className="upload-icon">📁</span>
              <span>Excel Dosyası Seç</span>
            </label>
            <p className="upload-hint">.xlsx veya .xls formatında dosya yükleyin</p>
          </div>
        </div>
      )}

      {/* Step 2: Review Products */}
      {step === 2 && (
        <div className="step-container">
          <div className="step-header">
            <h2>Ürünleri İncele ve Düzenle</h2>
            <p>{products.length} ürün bulundu</p>
          </div>
          
          <div className="action-buttons">
            <button onClick={handleEnrichData} className="btn btn-primary" disabled={loading}>
              {loading ? 'Zenginleştiriliyor...' : '🔍 Eksik Bilgileri Google\'dan Ara'}
            </button>
            <button onClick={handleNext} className="btn btn-success">
              Devam Et →
            </button>
          </div>

          <ProductTable 
            products={products} 
            onProductUpdate={handleProductUpdate}
          />
        </div>
      )}

      {/* Step 3: Configuration */}
      {step === 3 && (
        <div className="step-container">
          <div className="step-header">
            <h2>Ideasoft Ayarları</h2>
            <p>API bilgilerinizi girin</p>
          </div>
          
          <ConfigForm 
            config={config}
            onSubmit={handleConfigSubmit}
            onBack={() => setStep(2)}
          />
        </div>
      )}

      {/* Step 4: Import */}
      {step === 4 && (
        <div className="step-container">
          <div className="step-header">
            <h2>Ürünleri Aktar</h2>
            <p>{products.length} ürün hazır</p>
          </div>

          {!results ? (
            <div className="import-section">
              <div className="import-summary">
                <h3>Özet</h3>
                <ul>
                  <li>Toplam Ürün: {products.length}</li>
                  <li>Durum: Pasif olarak eklenecek</li>
                  <li>API Key: {config.apiKey.substring(0, 10)}...</li>
                  <li>Shop ID: {config.shopId}</li>
                </ul>
              </div>

              <div className="action-buttons">
                <button onClick={() => setStep(3)} className="btn btn-secondary">
                  ← Geri
                </button>
                <button onClick={handleImport} className="btn btn-primary" disabled={loading}>
                  {loading ? 'Aktarılıyor...' : '🚀 Ürünleri Aktar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="results-section">
              <h3>Sonuçlar</h3>
              <div className="results-stats">
                <div className="stat-card success">
                  <h4>Başarılı</h4>
                  <p>{results.success}</p>
                </div>
                <div className="stat-card failed">
                  <h4>Başarısız</h4>
                  <p>{results.failed}</p>
                </div>
                <div className="stat-card total">
                  <h4>Toplam</h4>
                  <p>{results.total}</p>
                </div>
              </div>

              <div className="action-buttons">
                <button onClick={handleReset} className="btn btn-primary">
                  Yeni Aktarım Başlat
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductImporter

