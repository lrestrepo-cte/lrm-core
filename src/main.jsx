import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import Rastreo, { tokenDesdeHash } from './pages/Rastreo.jsx'
import PortalCliente from './pages/PortalCliente.jsx'
import { OrdenesProvider } from './context/OrdenesContext.jsx'

// Páginas públicas que no cargan el resto de la app:
//   #/rastreo/<código>  → link de rastreo sin clave
//   #/clientes          → portal de clientes con usuario y clave
// App instalada en el celular (pantalla completa): es solo LRM Trade Consulting
export const esAppInstalada = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)
if (esAppInstalada() && !/^#\/(lrm-trade|rastreo|clientes)/.test(window.location.hash)) window.location.hash = '#/lrm-trade'

// Para el botón "Instalar app": Chrome/Android avisa que se puede instalar
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.__lrmInstalar = e; window.dispatchEvent(new Event('lrm-instalable')) })
if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))

const token = tokenDesdeHash()
const portal = /^#\/clientes\b/.test(window.location.hash)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {token ? <Rastreo token={token} /> : portal ? <PortalCliente /> : (
      <OrdenesProvider>
        <App />
      </OrdenesProvider>
    )}
  </StrictMode>,
)