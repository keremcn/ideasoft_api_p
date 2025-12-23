import { useState } from 'react'
import ProductImporter from './components/ProductImporter'
import './App.css'

function App() {
  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🚀 Ideasoft Ürün Aktarıcı</h1>
          <p>Excel dosyanızdan ürünleri Ideasoft mağazanıza aktarın</p>
        </header>
        <ProductImporter />
      </div>
    </div>
  )
}

export default App

