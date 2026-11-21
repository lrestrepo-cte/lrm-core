import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import Rastreo, { tokenDesdeHash } from './pages/Rastreo.jsx'
import { OrdenesProvider } from './context/OrdenesContext.jsx'

// Portal público de rastreo (#/rastreo/<código>): no pide usuario ni carga el resto de la app
const token = tokenDesdeHash()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {token ? <Rastreo token={token} /> : (
      <OrdenesProvider>
        <App />
      </OrdenesProvider>
    )}
  </StrictMode>,
)