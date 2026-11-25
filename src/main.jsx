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
// La app de clientes es otra app instalada: abre con ?app=clientes y siempre vuelve al portal
const appClientes = new URLSearchParams(window.location.search).get('app') === 'clientes'
let recordadaClientes = false
try { recordadaClientes = esAppInstalada() && localStorage.getItem('lrm_app') === 'clientes' } catch { /* sin almacenamiento */ }
if ((appClientes || recordadaClientes) && !/^#\/(clientes|rastreo)/.test(window.location.hash)) window.location.hash = '#/clientes'
else if (esAppInstalada() && !/^#\/(lrm-trade|rastreo|clientes)/.test(window.location.hash)) window.location.hash = '#/lrm-trade'
// En el portal, el "Agregar a inicio" instala la app de clientes (no la de LRM Trade)
if (/^#\/clientes\b/.test(window.location.hash)) {
  document.querySelector('link[rel="manifest"]')?.setAttribute('href', '/manifest-clientes.webmanifest')
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', 'LRM Clientes')
  try { if (esAppInstalada()) localStorage.setItem('lrm_app', 'clientes') } catch { /* sin almacenamiento */ }
}

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