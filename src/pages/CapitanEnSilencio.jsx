// Capitán en Silencio — espacio personal, aparte de MySpace.
// Primera versión: la estructura del espacio. Cada sección se activa al construirla.

const SECCIONES = [
  { id:'calendario', nombre:'Calendario de contenido', desc:'Episodios, publicaciones y fechas de estreno',   icono:'📅' },
  { id:'musica',     nombre:'Música y guiones',        desc:'Canciones de Suno, letras y guiones de cada episodio', icono:'🎙️' },
  { id:'pauta',      nombre:'Presupuesto y pauta',     desc:'Inversión en Meta, TikTok y YouTube',            icono:'📣' },
  { id:'metricas',   nombre:'Métricas',                desc:'Vistas, seguidores y crecimiento por red',       icono:'📈' },
]

export default function CapitanEnSilencio() {
  const acento = '#3FB68B'
  return (
    <div style={{ maxWidth:820 }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, letterSpacing:3, color:acento, fontWeight:700, marginBottom:6 }}>ESPACIO PERSONAL</div>
        <div style={{ fontSize:26, fontWeight:800, color:'var(--text)', letterSpacing:-0.5 }}>Capitán en Silencio</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginTop:6, maxWidth:560, lineHeight:1.6 }}>
          La serie animada de fútbol y fe. Aquí va todo lo de la cuenta: lo que se publica, la música, la pauta y cómo va creciendo.
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:12 }}>
        {SECCIONES.map(s => (
          <div key={s.id} className="panel" style={{ border:`1px solid ${acento}26` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:24 }}>{s.icono}</div>
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'rgba(255,255,255,0.05)', color:'var(--text4)', border:'0.5px solid var(--border)' }}>En construcción</span>
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{s.nombre}</div>
            <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}