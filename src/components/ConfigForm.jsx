import { useState } from 'react'
import { getAccessToken } from '../services/ideasoftService'
import './ConfigForm.css'

const ConfigForm = ({ config, onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    apiKey: config.apiKey || '',
    shopId: config.shopId || '',
    enrichData: config.enrichData !== undefined ? config.enrichData : true
  })
  
  const [tokenForm, setTokenForm] = useState({
    clientId: '',
    clientSecret: ''
  })
  const [loadingToken, setLoadingToken] = useState(false)
  const [tokenError, setTokenError] = useState('')

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }

  const handleTokenFormChange = (field, value) => {
    setTokenForm({
      ...tokenForm,
      [field]: value
    })
    setTokenError('')
  }

  const handleGetToken = async () => {
    if (!tokenForm.clientId || !tokenForm.clientSecret) {
      setTokenError('Lütfen Client ID ve Client Secret giriniz!')
      return
    }

    setLoadingToken(true)
    setTokenError('')

    try {
      const accessToken = await getAccessToken(tokenForm.clientId, tokenForm.clientSecret)
      setFormData({
        ...formData,
        apiKey: accessToken
      })
      setTokenError('')
      alert('Token başarıyla alındı!')
    } catch (error) {
      setTokenError(error.message || 'Token alınamadı. Lütfen bilgilerinizi kontrol edin.')
      console.error('Token alma hatası:', error)
    } finally {
      setLoadingToken(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.apiKey || !formData.shopId) {
      alert('Lütfen tüm alanları doldurun!')
      return
    }
    onSubmit(formData)
  }

  return (
    <div className="config-form-container">
      <form onSubmit={handleSubmit} className="config-form">
        <div className="form-group">
          <label htmlFor="apiKey">
            Ideasoft Access Token <span className="required">*</span>
          </label>
          <div className="token-input-group">
            <input
              type="text"
              id="apiKey"
              value={formData.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder="OAuth2 Access Token'ınızı girin veya aşağıdan alın"
              className="form-input"
              required
            />
          </div>
          <small className="form-hint">
            Token'ı manuel girebilir veya Client ID ve Client Secret ile otomatik alabilirsiniz.
          </small>
        </div>

        {/* Token Alma Bölümü */}
        <div className="token-section">
          <div className="token-section-header">
            <h4>🔑 Token Otomatik Alma</h4>
            <p>Client ID ve Client Secret ile token alın</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="clientId">
              Client ID
            </label>
            <input
              type="text"
              id="clientId"
              value={tokenForm.clientId}
              onChange={(e) => handleTokenFormChange('clientId', e.target.value)}
              placeholder="Client ID'nizi girin"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="clientSecret">
              Client Secret
            </label>
            <input
              type="password"
              id="clientSecret"
              value={tokenForm.clientSecret}
              onChange={(e) => handleTokenFormChange('clientSecret', e.target.value)}
              placeholder="Client Secret'ınızı girin"
              className="form-input"
            />
          </div>

          {tokenError && (
            <div className="error-message">
              ⚠️ {tokenError}
            </div>
          )}

          <button
            type="button"
            onClick={handleGetToken}
            className="btn btn-token"
            disabled={loadingToken}
          >
            {loadingToken ? 'Token Alınıyor...' : '🔑 Token Al'}
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="shopId">
            Shop ID <span className="required">*</span>
          </label>
          <input
            type="text"
            id="shopId"
            value={formData.shopId}
            onChange={(e) => handleChange('shopId', e.target.value)}
            placeholder="Mağaza ID'nizi girin"
            className="form-input"
            required
          />
          <small className="form-hint">
            Ideasoft mağaza ID'niz
          </small>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.enrichData}
              onChange={(e) => handleChange('enrichData', e.target.checked)}
              className="checkbox-input"
            />
            <span>Eksik bilgileri otomatik olarak Google'dan ara ve ekle</span>
          </label>
          <small className="form-hint">
            Açıklama ve resim gibi eksik bilgiler otomatik olarak doldurulacak
          </small>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onBack} className="btn btn-secondary">
            ← Geri
          </button>
          <button type="submit" className="btn btn-primary">
            Devam Et →
          </button>
        </div>
      </form>

      <div className="config-info">
        <h3>💡 Bilgi</h3>
        <ul>
          <li>Access Token ve Shop ID bilgileriniz sadece tarayıcınızda saklanır</li>
          <li>Ürünler <strong>pasif</strong> durumda eklenecektir</li>
          <li>Eksik bilgiler otomatik olarak Google'dan doldurulabilir</li>
          <li>İşlem sırasında ilerlemeyi takip edebilirsiniz</li>
          <li>Ideasoft API dokümantasyonu: <a href="https://www.ideasoft.com.tr/yardim/api-kullanimi/" target="_blank" rel="noopener noreferrer">API Kullanımı</a></li>
        </ul>
      </div>
    </div>
  )
}

export default ConfigForm

