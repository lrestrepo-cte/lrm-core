// @ts-nocheck
import { useState } from 'react'

const ZONAS = {
  marquesina: {
    title: 'Marquesina metálica — Letrero ZABÚ',
    color: '#C9A84C',
    body: 'Material: Acero inoxidable dorado satinado · Letras corporeas con iluminación LED interna · Dimensiones: 3200×400mm\n\nMantenimiento: Limpiar con paño seco mensualmente. Revisar conexiones LED cada 3 meses. No usar productos abrasivos sobre el acabado dorado. Verificar tornillería de fijación cada 6 meses.',
  },
  coccion: {
    title: 'Zona de cocción — 1200mm de ancho',
    color: '#E24B4A',
    body: 'Equipos: Plancha de cocción 3000W · Freidora doble · Baño maría/calentador 1200W · Campana extractora 150W\n\nProtocolo higiene: Limpiar plancha con raspador al final de cada turno. Cambiar aceite freidora cada 2 días de operación. Revisar filtros de campana semanalmente. Temperatura máx operación: 180°C plancha.',
  },
  preparacion: {
    title: 'Zona de preparación y armado — 1600mm',
    color: '#378ADD',
    body: 'Equipos: Mesón inox AISI 304 · Recipientes GN para toppings · Dispensadores Cream Code calibrados a 35g\n\nProtocolo: Lavar y sanitizar recipientes GN antes de cada turno. Calibrar dispensador cada 50 porciones. Temperatura de trabajo máx 25°C. Renovar toppings cada 2 horas de operación.',
  },
  refrigeracion: {
    title: 'Zona de refrigeración — 700mm',
    color: '#1D9E75',
    body: 'Equipo: Nevera exhibidora 2 puertas · 200W · Temperatura: 2–8°C\n\nMantenimiento: Limpiar serpentines mensualmente. Revisar sellos de puertas semanalmente. Descongelar y limpiar interior cada 15 días. Nunca abrir más de 30 segundos durante operación.',
  },
  meson: {
    title: 'Mesón de atención — Acero inoxidable AISI 304',
    color: '#aaaaaa',
    body: 'Dimensiones: 3500×900mm · Calibre 16 (1.5mm) · Acabado satinado\n\nMantenimiento: Limpiar con solución sanitizante antes y después de cada turno. No cortar directamente sobre el mesón. Secar completamente para evitar manchas de agua. Revisar tornillería de soporte mensualmente.',
  },
  gas: {
    title: 'Sistema de gas — Cilindro y conexiones',
    color: '#BA7517',
    body: 'Cilindro estándar con accesorios · Encendido eléctrico (circuito C6, 50W)\n\nSeguridad: Cerrar válvula al finalizar cada turno. Revisar mangueras y conexiones diariamente con agua jabonosa. Reemplazar mangueras cada 6 meses. Extintor a máximo 2m. Ventilación obligatoria durante operación.',
  },
  lavamanos: {
    title: 'Lavamanos — Instalación sanitaria',
    color: '#7F77DD',
    body: 'Acero inoxidable AISI 304 · Bomba de agua 120W · Agua fría y caliente\n\nProtocolo higiene: Lavado de manos obligatorio al iniciar turno, cada 30 min de operación y después de manipular dinero. Revisar conexiones hidráulicas semanalmente. Limpiar y sanitizar el área diariamente.',
  },
  ruedas: {
    title: 'Ruedas giratorias con freno Ø100mm',
    color: '#555555',
    body: '4 unidades · Capacidad 300kg/u · Acero y poliuretano · Freno de seguridad en las 4 ruedas\n\nMantenimiento: Lubricar rodamientos cada 2 meses. Verificar frenos antes de cada desplazamiento. Reemplazar si presentan desgaste visible. Capacidad total del carrito: 1200kg.',
  },
  paneles: {
    title: 'Paneles desmontables — Sistema de cierre',
    color: '#639922',
    body: '4 paneles en lámina galvanizada CAL.18 · Cierres rápidos tipo leva · Instalación/retiro en menos de 2 minutos\n\nMantenimiento: Verificar cierres semanalmente. Lubricar pasadores mensualmente. Almacenar en compartimento trasero. Revisar sellado perimetral para evitar humedad interior.',
  },
  led: {
    title: 'Iluminación LED perimetral',
    color: '#FFB800',
    body: 'LED cálido 3000K · 12V DC · Tira perimetral inferior + barra de trabajo + focos marquesina\n\nMantenimiento: Verificar sellado contra humedad mensualmente. Revisar conexiones cada 3 meses. Reemplazar tiras cada 12–18 meses. No exponer a agua directa. Limpieza con paño seco.',
  },
}

export default function ZabuCarrito() {
  const [modo, setModo] = useState('abierto')
  const [zonaActiva, setZonaActiva] = useState(null)

  const MODOS = [
    { id:'abierto',   label:'Abierto',   emoji:'🟢' },
    { id:'cerrado',   label:'Cerrado',   emoji:'🔒' },
    { id:'despiece',  label:'Despiece',  emoji:'🔩' },
  ]

  const FICHAS = [
    { id:'marquesina', label:'Marquesina',  emoji:'🏷', color:'#C9A84C' },
    { id:'led',        label:'LED',          emoji:'💡', color:'#FFB800' },
    { id:'coccion',    label:'Cocción',      emoji:'🔥', color:'#E24B4A' },
    { id:'preparacion',label:'Preparación', emoji:'🍽', color:'#378ADD' },
    { id:'refrigeracion',label:'Nevera',    emoji:'❄️', color:'#1D9E75' },
    { id:'meson',      label:'Mesón',        emoji:'⬛', color:'#aaaaaa' },
    { id:'gas',        label:'Gas',           emoji:'🟡', color:'#BA7517' },
    { id:'lavamanos',  label:'Lavamanos',    emoji:'💧', color:'#7F77DD' },
    { id:'ruedas',     label:'Ruedas',       emoji:'⚙️', color:'#555555' },
    { id:'paneles',    label:'Paneles',      emoji:'🚪', color:'#639922' },
  ]

  return (
    <>
      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Ancho total',    val:'3.500 mm', sub:'incluyendo marquesina' },
          { label:'Profundidad',    val:'800 mm',   sub:'con paneles cerrados' },
          { label:'Altura total',   val:'2.350 mm', sub:'marquesina incluida' },
          { label:'Carga máxima',   val:'1.200 kg', sub:'4 ruedas × 300kg/u' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{ color:'var(--gold)', fontSize:18 }}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-accent" style={{ background:'var(--gold)' }} />
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap:16 }}>

        {/* Panel izquierdo — modelo 3D + modos */}
        <div className="panel" style={{ padding:0, overflow:'hidden' }}>
          {/* Selector de modo */}
          <div style={{ display:'flex', gap:8, padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
            {MODOS.map(m => (
              <button key={m.id} onClick={() => setModo(m.id)}
                style={{ flex:1, padding:'8px 0', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700,
                  border:`1.5px solid ${modo===m.id?'var(--gold-border)':'var(--border)'}`,
                  background: modo===m.id?'rgba(201,168,76,0.12)':'rgba(255,255,255,0.03)',
                  color: modo===m.id?'var(--gold)':'var(--text3)', fontFamily:'inherit' }}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>

          {/* Modelo 3D embebido */}
          <div style={{ position:'relative', background:'#080808', height:320 }}>
            <canvas id="zabu-cv" style={{ display:'block', width:'100%', height:'100%' }}></canvas>
            <div style={{ position:'absolute', bottom:8, right:10, fontSize:9, color:'#333' }}>
              Arrastra · Scroll zoom
            </div>
          </div>

          {/* Zonas clicables */}
          <div style={{ padding:'12px 14px', borderTop:'1px solid var(--border)' }}>
            <div style={{ fontSize:9, color:'var(--text4)', letterSpacing:1, marginBottom:8 }}>TOCA UNA ZONA PARA VER DETALLES</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {FICHAS.map(f => (
                <div key={f.id} onClick={() => setZonaActiva(zonaActiva===f.id ? null : f.id)}
                  style={{ padding:'5px 10px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:600,
                    border:`1px solid ${zonaActiva===f.id ? f.color+'88' : 'var(--border)'}`,
                    background: zonaActiva===f.id ? f.color+'18' : 'rgba(255,255,255,0.03)',
                    color: zonaActiva===f.id ? f.color : 'var(--text3)' }}>
                  {f.emoji} {f.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel derecho — info de zona */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {zonaActiva && ZONAS[zonaActiva] ? (
            <div className="panel">
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:ZONAS[zonaActiva].color, flexShrink:0 }} />
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{ZONAS[zonaActiva].title}</div>
              </div>
              {ZONAS[zonaActiva].body.split('\n\n').map((p, i) => (
                <div key={i} style={{ fontSize:12, color: i===0?'var(--text2)':'var(--text3)', lineHeight:1.7, marginBottom:10, padding: i===1?'10px 12px':0, background: i===1?'rgba(255,255,255,0.03)':undefined, borderRadius: i===1?8:0, borderLeft: i===1?`3px solid ${ZONAS[zonaActiva].color}44`:undefined }}>
                  {p}
                </div>
              ))}
            </div>
          ) : (
            <div className="panel" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:180 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🚀</div>
                <div style={{ fontSize:13, color:'var(--text3)' }}>Selecciona una zona del carrito</div>
                <div style={{ fontSize:11, color:'var(--text4)', marginTop:4 }}>para ver especificaciones y protocolos</div>
              </div>
            </div>
          )}

          {/* Especificaciones generales */}
          <div className="panel">
            <div className="panel-title">Especificaciones generales</div>
            {[
              { label:'Estructura',    val:'Tubo acero al carbón ASTM A500 Grado B' },
              { label:'Acabado ext.',  val:'Pintura electrostática negra mate' },
              { label:'Logo y letras', val:'Acero inoxidable dorado satinado' },
              { label:'Paneles',       val:'Lámina galvanizada CAL.18 · 1.2mm' },
              { label:'Iluminación',   val:'LED cálido 3000K · 12V/24V' },
              { label:'Eléctrico',     val:'110V-60Hz · 6.132W · 55.79A' },
              { label:'Fabricación',   val:'25–30 días hábiles desde aprobación' },
              { label:'Garantía',      val:'Estructura 1 año · Equipos 6 meses' },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:11, color:'var(--text3)', flexShrink:0, marginRight:12 }}>{item.label}</span>
                <span style={{ fontSize:11, color:'var(--text2)', textAlign:'right' }}>{item.val}</span>
              </div>
            ))}
            <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(201,168,76,0.06)', borderRadius:8, border:'1px solid rgba(201,168,76,0.2)' }}>
              <div style={{ fontSize:10, color:'var(--gold)', fontWeight:700 }}>INVERSIÓN ESTIMADA</div>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--gold)', marginTop:2 }}>$11.605.000 COP</div>
              <div style={{ fontSize:10, color:'var(--text4)', marginTop:2 }}>Incluye fabricación, equipos e instalación · CZ-CE-01</div>
            </div>
          </div>
        </div>
      </div>

      {/* Script Three.js */}
      <script dangerouslySetInnerHTML={{__html:`
        (function() {
          if(window.__zabuCarritoLoaded) { initCarrito(); return; }
          var s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
          s.onload = function() { window.__zabuCarritoLoaded = true; initCarrito(); };
          document.head.appendChild(s);
        })();

        window.__zabuMode = '${modo}';

        function initCarrito() {
          var cv = document.getElementById('zabu-cv');
          if(!cv || cv.__init) return;
          cv.__init = true;
          var W = cv.parentElement.clientWidth, H = 320;
          var renderer = new THREE.WebGLRenderer({canvas:cv,antialias:true});
          renderer.setPixelRatio(window.devicePixelRatio||1);
          renderer.setSize(W,H);
          renderer.setClearColor(0x080808);
          renderer.shadowMap.enabled = true;
          var scene = new THREE.Scene();
          var cam = new THREE.PerspectiveCamera(38,W/H,0.01,50);
          cam.position.set(3.5,2.2,4.8); cam.lookAt(0,0.5,0);
          scene.add(new THREE.AmbientLight(0xfff8e7,0.28));
          var sun=new THREE.DirectionalLight(0xffffff,1.1); sun.position.set(5,7,4); sun.castShadow=true; scene.add(sun);
          var rim=new THREE.DirectionalLight(0xC9A84C,0.45); rim.position.set(-4,2,-3); scene.add(rim);
          var ledPt=new THREE.PointLight(0xFFAA22,2.0,4); ledPt.position.set(0,-0.38,0.56); scene.add(ledPt);
          function bx(w,h,d,c,r,m){var mat=new THREE.MeshStandardMaterial({color:c,roughness:r||0.8,metalness:m||0.2});return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);}
          function cy(r,h,s,c,ro,m){var mat=new THREE.MeshStandardMaterial({color:c,roughness:ro||0.4,metalness:m||0.8});return new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,s),mat);}
          var root=new THREE.Group();
          root.position.y=-1.175;
          var CW=3.5,CD=0.8,hSign=0.4,hWork=1.05,hBase=0.9,hCnt=0.1;
          function a(o,x,y,z){o.position.set(x||0,y||0,z||0);o.castShadow=true;root.add(o);return o;}
          a(bx(CW,hCnt,CD,0xb0b0b0,0.2,0.95),0,hCnt/2,0);
          a(bx(CW,hBase,CD,0x101010),0,hCnt+hBase/2,0);
          a(bx(CW,0.03,CD*1.04,0xb0b0b0,0.2,0.95),0,hCnt+hBase+0.015,0);
          a(bx(CW,hWork,0.04,0x181818),0,hCnt+hBase+hWork/2,-CD/2+0.02);
          a(bx(CW,hWork,0.04,0x181818),0,hCnt+hBase+hWork/2,CD/2-0.02);
          a(bx(CW+0.08,hSign,CD+0.08,0x101010),0,hCnt+hBase+hWork+hSign/2,0);
          var sPlate=bx(CW*0.78,hSign*0.52,0.04,0x0d0d0d,0.9,0.1);
          a(sPlate,0,hCnt+hBase+hWork+hSign*0.52,CD/2+0.045);
          var ledMat=new THREE.MeshStandardMaterial({color:0xFFEE88,emissive:0xFFBB00,emissiveIntensity:1.1,roughness:0.05});
          var ledB=new THREE.Mesh(new THREE.BoxGeometry(CW*0.92,0.015,0.025),ledMat);
          a(ledB,0,hCnt+0.018,CD/2+0.005);
          var goldMat=new THREE.MeshStandardMaterial({color:0xC9A84C,roughness:0.28,metalness:0.92});
          var edgeMat=new THREE.MeshStandardMaterial({color:0xC9A84C,roughness:0.2,metalness:0.9,emissive:0xC9A84C,emissiveIntensity:0.12});
          a(new THREE.Mesh(new THREE.BoxGeometry(CW,0.025,0.022),goldMat),0,hCnt+hBase+0.012,CD/2+0.012);
          [CD/2,-CD/2].forEach(function(z){
            a(new THREE.Mesh(new THREE.BoxGeometry(CW+0.08,0.014,0.014),edgeMat),0,hCnt+hBase+hWork,z);
            a(new THREE.Mesh(new THREE.BoxGeometry(CW+0.08,0.014,0.014),edgeMat),0,hCnt+hBase+hWork+hSign,z);
          });
          [-0.52,-0.2,0.12,0.44].forEach(function(lx){a(new THREE.Mesh(new THREE.BoxGeometry(0.22,0.17,0.06),goldMat),lx,hCnt+hBase+hWork+hSign*0.52,CD/2+0.06);});
          [-1.2,-0.6,0,0.6,1.2].forEach(function(lx){var f=new THREE.Mesh(new THREE.SphereGeometry(0.032,8,6),ledMat);a(f,lx,hCnt+hBase+hWork+0.07,CD/2-0.06);});
          var gRing=new THREE.Mesh(new THREE.TorusGeometry(0.18,0.012,12,48),goldMat);gRing.rotation.x=Math.PI/2;a(gRing,0,hCnt+hBase*0.55,CD/2+0.015);
          a(cy(0.09,0.46,16,0xCCBB44,0.35,0.75),CW/2-0.12,hCnt+hBase+0.25,-CD/2+0.15);
          var wMat=new THREE.MeshStandardMaterial({color:0x181818,roughness:0.9,metalness:0.25});
          var hMat=new THREE.MeshStandardMaterial({color:0x888888,roughness:0.35,metalness:0.85});
          [[-CW/2+0.18,CD/2-0.12],[CW/2-0.18,CD/2-0.12],[-CW/2+0.18,-CD/2+0.12],[CW/2-0.18,-CD/2+0.12]].forEach(function(pos){
            var wg=new THREE.Group(); wg.position.set(pos[0],hCnt-0.025,pos[1]);
            var t=new THREE.Mesh(new THREE.CylinderGeometry(0.072,0.072,0.058,20),wMat);t.rotation.z=Math.PI/2;wg.add(t);
            var h=new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.065,12),hMat);h.rotation.z=Math.PI/2;wg.add(h);
            root.add(wg);
          });
          var glMat=new THREE.MeshStandardMaterial({color:0x1a3344,roughness:0.05,metalness:0.1,transparent:true,opacity:0.42});
          var fridgeMat=new THREE.MeshStandardMaterial({color:0x181818,roughness:0.75,metalness:0.25});
          var fW=0.62,fH=hWork*0.93,fD=CD*0.82;
          var fg=new THREE.Group();
          fg.add(new THREE.Mesh(new THREE.BoxGeometry(fW,fH,fD),fridgeMat));
          var fd=new THREE.Mesh(new THREE.BoxGeometry(fW*0.86,fH*0.9,0.03),glMat);fd.position.set(0,fH/2,fD/2+0.018);fg.add(fd);
          fg.position.set(CW/2-fW/2-0.02,hCnt+hBase,0);
          root.add(fg);
          a(bx(0.48,0.04,0.45,0xb0b0b0,0.2,0.95),-CW/2+0.43,hCnt+hBase+0.04,-0.05);
          a(bx(0.32,0.28,0.38,0xb0b0b0,0.2,0.95),-CW/2+1.05,hCnt+hBase+0.17,-0.05);
          a(bx(0.62,0.14,0.52,0xb0b0b0,0.2,0.95),-CW/2+0.8,hCnt+hBase+hWork-0.09,-0.05);
          a(cy(0.07,0.22,12,0xb0b0b0,0.2,0.95),-CW/2+0.8,hCnt+hBase+hWork+0.04,-0.05);
          var pFront=new THREE.Group();
          var pf=new THREE.Mesh(new THREE.BoxGeometry(CW,hBase+hWork-0.04,0.024),new THREE.MeshStandardMaterial({color:0x101010,roughness:0.85,metalness:0.3}));
          pf.position.set(0,hCnt+(hBase+hWork)/2-0.02,CD/2+0.016);pFront.add(pf);root.add(pFront);
          var pLeft=new THREE.Group();var pl=new THREE.Mesh(new THREE.BoxGeometry(0.024,hBase+hWork-0.04,CD),new THREE.MeshStandardMaterial({color:0x101010,roughness:0.85,metalness:0.3}));pl.position.set(-CW/2-0.016,hCnt+(hBase+hWork)/2-0.02,0);pLeft.add(pl);root.add(pLeft);
          var pRight=new THREE.Group();var pr=new THREE.Mesh(new THREE.BoxGeometry(0.024,hBase+hWork-0.04,CD),new THREE.MeshStandardMaterial({color:0x101010,roughness:0.85,metalness:0.3}));pr.position.set(CW/2+0.016,hCnt+(hBase+hWork)/2-0.02,0);pRight.add(pr);root.add(pRight);
          scene.add(root);
          var flr=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.MeshStandardMaterial({color:0x0b0b0b,roughness:1.0}));
          flr.rotation.x=-Math.PI/2;flr.position.y=-1.185;flr.receiveShadow=true;scene.add(flr);
          var rotY=0.35,rotX=-0.1,zoom=1,dragging=false,px=0,py=0,t=0;
          cv.addEventListener('mousedown',function(e){dragging=true;px=e.clientX;py=e.clientY;});
          window.addEventListener('mouseup',function(){dragging=false;});
          cv.addEventListener('mousemove',function(e){if(!dragging)return;rotY+=(e.clientX-px)*0.007;rotX=Math.max(-0.38,Math.min(0.28,rotX+(e.clientY-py)*0.006));px=e.clientX;py=e.clientY;});
          cv.addEventListener('wheel',function(e){zoom=Math.max(0.4,Math.min(2.5,zoom+e.deltaY*0.001));e.preventDefault();},{passive:false});
          var tX=0,tY=0;
          cv.addEventListener('touchstart',function(e){tX=e.touches[0].clientX;tY=e.touches[0].clientY;e.preventDefault();},{passive:false});
          cv.addEventListener('touchmove',function(e){rotY+=(e.touches[0].clientX-tX)*0.007;rotX=Math.max(-0.38,Math.min(0.28,rotX+(e.touches[0].clientY-tY)*0.006));tX=e.touches[0].clientX;tY=e.touches[0].clientY;e.preventDefault();},{passive:false});
          function loop(){
            requestAnimationFrame(loop);t+=0.016;
            var m=window.__zabuMode||'abierto';
            if(m==='abierto'){pFront.visible=false;pLeft.visible=false;pRight.visible=false;}
            else if(m==='cerrado'){pFront.visible=true;pFront.position.set(0,0,0);pLeft.visible=true;pLeft.position.set(0,0,0);pRight.visible=true;pRight.position.set(0,0,0);}
            else{pFront.visible=true;pLeft.visible=true;pRight.visible=true;var s=0.55+Math.sin(t*0.6)*0.1;pFront.position.set(0,0,s+CD/2+0.1);pLeft.position.set(-s-CW/2-0.1,0,0);pRight.position.set(s+CW/2+0.1,0,0);}
            ledPt.intensity=1.8+Math.sin(t*2.2)*0.25;
            var r=5.2*zoom;
            cam.position.x=Math.sin(rotY)*r*Math.cos(rotX);
            cam.position.y=Math.sin(rotX)*r+0.5;
            cam.position.z=Math.cos(rotY)*r*Math.cos(rotX);
            cam.lookAt(0,0.4,0);
            renderer.render(scene,cam);
          }
          loop();
        }
      `}} />
    </>
  )
}
