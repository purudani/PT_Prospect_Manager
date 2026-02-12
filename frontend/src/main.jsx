import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ProspectsProvider } from './context/ProspectsContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProspectsProvider>
      <App />
    </ProspectsProvider>
  </StrictMode>,
)
