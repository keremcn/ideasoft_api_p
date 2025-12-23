import { useState } from 'react'
import './ProductTable.css'

const ProductTable = ({ products, onProductUpdate }) => {
  const [editingIndex, setEditingIndex] = useState(null)
  const [editedProduct, setEditedProduct] = useState(null)

  const handleEdit = (index) => {
    setEditingIndex(index)
    setEditedProduct({ ...products[index] })
  }

  const handleSave = (index) => {
    if (editedProduct) {
      onProductUpdate(index, editedProduct)
    }
    setEditingIndex(null)
    setEditedProduct(null)
  }

  const handleCancel = () => {
    setEditingIndex(null)
    setEditedProduct(null)
  }

  const handleChange = (field, value) => {
    setEditedProduct({
      ...editedProduct,
      [field]: value
    })
  }

  if (products.length === 0) {
    return <div className="no-products">Henüz ürün bulunmuyor.</div>
  }

  return (
    <div className="product-table-container">
      <div className="table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th>Ürün Adı</th>
              <th>SKU</th>
              <th>Fiyat</th>
              <th>Stok</th>
              <th>Açıklama</th>
              <th>Resim</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                {editingIndex === index ? (
                  <>
                    <td>
                      <input
                        type="text"
                        value={editedProduct.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="table-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedProduct.sku || ''}
                        onChange={(e) => handleChange('sku', e.target.value)}
                        className="table-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editedProduct.price || 0}
                        onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                        className="table-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editedProduct.stock || 0}
                        onChange={(e) => handleChange('stock', parseInt(e.target.value))}
                        className="table-input"
                      />
                    </td>
                    <td>
                      <textarea
                        value={editedProduct.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="table-textarea"
                        rows="2"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedProduct.image || ''}
                        onChange={(e) => handleChange('image', e.target.value)}
                        className="table-input"
                        placeholder="URL"
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => handleSave(index)}
                        className="btn-icon save"
                        title="Kaydet"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancel}
                        className="btn-icon cancel"
                        title="İptal"
                      >
                        ✕
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{product.name || '-'}</td>
                    <td>{product.sku || '-'}</td>
                    <td>
                      {product.price !== undefined && product.price !== null && product.price !== 0 
                        ? `₺${Number(product.price).toFixed(2)}` 
                        : '-'}
                    </td>
                    <td>{product.stock || 0}</td>
                    <td className="description-cell">
                      {product.description ? (
                        <span title={product.description}>
                          {product.description.length > 50
                            ? product.description.substring(0, 50) + '...'
                            : product.description}
                        </span>
                      ) : (
                        <span className="missing">Eksik</span>
                      )}
                    </td>
                    <td>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="product-thumbnail"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <span className="missing">Eksik</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleEdit(index)}
                        className="btn-icon edit"
                        title="Düzenle"
                      >
                        ✏️
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ProductTable

