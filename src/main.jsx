import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import { OrdenesProvider } from './context/OrdenesContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OrdenesProvider>
      <App />
    </OrdenesProvider>
  </StrictMode>,
)