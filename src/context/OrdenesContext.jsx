import { createContext, useContext, useState } from 'react'

const OrdenesContext = createContext(null)

export function OrdenesProvider({ children }) {
  const [ordenes, setOrdenes] = useState([])

  const agregarOrden = (orden) => {
    setOrdenes(prev => [{ ...orden, estado:'pendiente', timestamp: Date.now() }, ...prev])
  }

  const marcarListo = (num) => {
    setOrdenes(prev => prev.map(o => o.num === num ? { ...o, estado:'listo' } : o))
  }

  return (
    <OrdenesContext.Provider value={{ ordenes, agregarOrden, marcarListo }}>
      {children}
    </OrdenesContext.Provider>
  )
}

export function useOrdenes() {
  return useContext(OrdenesContext)
}