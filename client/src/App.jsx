import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { api, saveSession, clearSession, hasSession } from './api.js';

const WA = '541131649850';
const wa = (t) => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const money = (n) => '$' + n.toLocaleString('es-AR');

function Gem({ mx, my }) {
  const rx = useTransform(my, [-1, 1], [14, -14]);
  const ry = useTransform(mx, [-1, 1], [-18, 18]);
  return (
    <motion.div className="gem" style={{ rotateX: rx, rotateY: ry }} animate={{ y: [0, -14, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 200 180" aria-hidden="true">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#58a6ff" /><stop offset="1" stopColor="#8a3dff" /></linearGradient>
          <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d8dee9" /><stop offset="1" stopColor="#6a4bff" /></linearGradient>
        </defs>
        <polygon points="50,10 150,10 195,65 100,170 5,65" fill="url(#g1)" opacity=".92" />
        <polygon points="50,10 100,65 5,65" fill="url(#g2)" opacity=".7" />
        <polygon points="150,10 100,65 195,65" fill="#fff" opacity=".18" />
        <polygon points="5,65 100,65 100,170" fill="#050714" opacity=".28" />
        <polygon points="100,65 195,65 100,170" fill="#8a3dff" opacity=".35" />
      </svg>
    </motion.div>
  );
}

function Hero({ onStart }) {
  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 15 });
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 15 });
  const move = (e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set(((e.clientX - r.left) / r.width) * 2 - 1); my.set(((e.clientY - r.top) / r.height) * 2 - 1); };
  return (
    <header className="hero" onMouseMove={move} id="inicio">
      <div className="stars" aria-hidden="true" />
      <div className="hero-copy">
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}>
          Tu mundo.<br />Todo en una app.
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}>
          Mirá el catálogo completo en tu celular o en tu TV Box. Descargá, ingresá y empezá a ver.
        </motion.p>
        <motion.div className="cta-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <a className="btn primary" href={wa('Hola, quiero probar Multigema las 2 horas.')}>Probar 2 horas gratis</a>
          <button className="btn ghost" onClick={onStart}>Ver catálogo</button>
        </motion.div>
      </div>
      <Gem mx={mx} my={my} />
    </header>
  );
}

function Nav({ user, onAuth, onLogout, onAdmin }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const f = () => setScrolled(window.scrollY > 40); window.addEventListener('scroll', f); return () => window.removeEventListener('scroll', f); }, []);
  return (
    <nav className={'nav' + (scrolled ? ' solid' : '')}>
      <a href="#inicio" className="brand">Multi<b>gema</b></a>
      <div className="links">
        <a href="#catalogo">Catálogo</a><a href="#planes">Planes</a><a href="#instalar">Instalación</a><a href="#faq">Preguntas</a><a href="#contacto">Contacto</a>
      </div>
      <div className="acct">
        {user ? (<>
          {user.role === 'admin' && <button className="btn small ghost" onClick={onAdmin}>Panel</button>}
          <button className="btn small ghost" onClick={onLogout}>Salir ({user.name.split(' ')[0]})</button>
        </>) : <button className="btn small primary" onClick={onAuth}>Ingresar</button>}
      </div>
    </nav>
  );
}

function Catalog() {
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState(null);
  const [videos, setVideos] = useState(null);
  const [open, setOpen] = useState(null);
  useEffect(() => { api('/categories').then(setCats).catch(() => {}); }, []);
  useEffect(() => { setVideos(null); api('/videos' + (cat ? `?category=${cat}` : '')).then(setVideos).catch(() => setVideos([])); }, [cat]);
  const isFile = (u) => /\.(mp4|webm|m3u8)(\?|$)/i.test(u);
  return (
    <section id="catalogo" className="sec">
      <h2>Catálogo</h2>
      <div className="chips" role="tablist">
        <button className={!cat ? 'chip on' : 'chip'} onClick={() => setCat(null)}>Todo</button>
        {cats.map((c) => <button key={c.id} className={cat === c.id ? 'chip on' : 'chip'} onClick={() => setCat(c.id)}>{c.name}</button>)}
      </div>
      {videos === null ? <div className="grid">{[...Array(6)].map((_, i) => <div key={i} className="card skel" />)}</div>
        : videos.length === 0 ? <p className="empty">Todavía no hay videos en esta categoría. Cargalos desde el panel de administración.</p>
        : <motion.div layout className="grid">
          <AnimatePresence>{videos.map((v) => (
            <motion.button layout key={v.id} className="card" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} whileHover={{ y: -6 }} onClick={() => setOpen(v)}>
              <div className="thumb" style={v.thumbnail_url ? { backgroundImage: `url(${v.thumbnail_url})` } : {}}><span className="play">▶</span></div>
              <h3>{v.title}</h3><small>{v.category || 'Sin categoría'}{v.duration_min ? ` · ${v.duration_min} min` : ''}</small>
            </motion.button>))}</AnimatePresence>
        </motion.div>}
      <AnimatePresence>
        {open && (
          <motion.div className="modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.div className="modal player" role="dialog" aria-label={open.title} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}>
              {isFile(open.video_url) ? <video src={open.video_url} controls autoPlay playsInline /> : <iframe src={open.video_url} title={open.title} allow="autoplay; fullscreen" allowFullScreen />}
              <h3>{open.title}</h3><p>{open.description}</p>
              <button className="btn ghost small" onClick={() => setOpen(null)}>Cerrar</button>
            </motion.div>
          </motion.div>)}
      </AnimatePresence>
    </section>
  );
}

function Plans({ user, onAuth }) {
  const [plans, setPlans] = useState([]);
  const [msg, setMsg] = useState('');
  useEffect(() => { api('/plans').then(setPlans).catch(() => {}); }, []);
  const subscribe = async (p) => {
    if (!user) return onAuth();
    try { const r = await api('/subscribe', { method: 'POST', body: { plan_id: p.id } }); setMsg('Pedido registrado. Te abrimos WhatsApp para coordinar el pago.'); window.open(wa(`Hola, me registré en Multigema y quiero activar el plan ${p.name}.`), '_blank'); }
    catch (e) { setMsg(e.message); }
  };
  return (
    <section id="planes" className="sec">
      <h2>Planes</h2>
      <div className="plans">
        {plans.map((p) => (
          <motion.div key={p.id} className={'plan' + (p.highlighted ? ' hl' : '')} whileHover={{ y: -6 }}>
            <h3>{p.name}</h3>
            <div className="price">{money(p.price_ars)}<small> / mes</small></div>
            <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
            <button className="btn primary" onClick={() => subscribe(p)}>Quiero este plan</button>
          </motion.div>))}
      </div>
      <p className="note" role="status">{msg}</p>
    </section>
  );
}

const STEPS = {
  android: ['Abrí el enlace de descarga.', 'Tocá Descargar y luego Instalar.', 'Abrí Multigema Pro V2.', 'Ingresá el usuario y contraseña que te enviamos.'],
  tv: ['Abrí Downloader en tu TV Box.', 'Ingresá el código 5636526.', 'Esperá la descarga y tocá Instalar.', 'Abrí Multigema Pro V2 e ingresá tus datos.']
};
function Install() {
  const [tab, setTab] = useState('android');
  return (
    <section id="instalar" className="sec">
      <h2>Cómo instalar</h2>
      <div className="chips"><button className={tab === 'android' ? 'chip on' : 'chip'} onClick={() => setTab('android')}>Celular Android</button><button className={tab === 'tv' ? 'chip on' : 'chip'} onClick={() => setTab('tv')}>TV Box / Android TV</button></div>
      <AnimatePresence mode="wait">
        <motion.ol key={tab} className="steps" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          {STEPS[tab].map((s) => <li key={s}>{s}</li>)}
        </motion.ol>
      </AnimatePresence>
      <a className="btn primary" href="http://aftv.news/5636526">Descargar Multigema Pro V2</a>
    </section>
  );
}

const FAQ = [['¿Cuánto cuesta?', '$8.000 por mes.'], ['¿Tiene prueba?', 'Sí, 2 horas sin costo. Pedila por WhatsApp.'], ['¿Qué dispositivos soporta?', 'Celular Android y TV Box / Android TV.'], ['¿Cómo recibo mi usuario y contraseña?', 'Te los enviamos nosotros apenas activás tu plan.']];
function Faq() {
  const [i, setI] = useState(null);
  return (
    <section id="faq" className="sec narrow">
      <h2>Preguntas frecuentes</h2>
      {FAQ.map(([q, a], k) => (
        <div key={q} className="qa">
          <button aria-expanded={i === k} onClick={() => setI(i === k ? null : k)}>{q}<span>{i === k ? '−' : '+'}</span></button>
          <AnimatePresence initial={false}>{i === k && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>{a}</motion.p>}</AnimatePresence>
        </div>))}
    </section>
  );
}

function Contact() {
  const [f, setF] = useState({ name: '', email: '', message: '' });
  const [st, setSt] = useState('');
  const send = async (e) => { e.preventDefault(); try { await api('/contact', { method: 'POST', body: f }); setSt('Mensaje enviado. Te respondemos pronto.'); setF({ name: '', email: '', message: '' }); } catch (er) { setSt(er.message); } };
  return (
    <section id="contacto" className="sec narrow">
      <h2>Contacto</h2>
      <form onSubmit={send} className="form">
        <label>Nombre<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label>Email<input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Mensaje<textarea required rows="4" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></label>
        <button className="btn primary">Enviar mensaje</button>
        <p className="note" role="status">{st}</p>
      </form>
      <a className="btn ghost" href={wa('Hola, necesito ayuda con Multigema.')}>Hablar por WhatsApp</a>
    </section>
  );
}

function AuthModal({ onClose, onDone }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async (e) => { e.preventDefault(); setErr(''); try { const r = await api('/auth/' + mode, { method: 'POST', body: f }); saveSession(r.token); onDone(r.user); } catch (x) { setErr(x.message); } };
  return (
    <motion.div className="modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.form className="modal" onSubmit={submit} onClick={(e) => e.stopPropagation()} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h3>{mode === 'login' ? 'Ingresar' : 'Crear cuenta'}</h3>
        {mode === 'register' && <label>Nombre<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>}
        <label>Email<input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Contraseña<input required type="password" minLength={mode === 'register' ? 8 : 1} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn primary">{mode === 'login' ? 'Ingresar' : 'Crear cuenta'}</button>
        <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'No tengo cuenta' : 'Ya tengo cuenta'}</button>
      </motion.form>
    </motion.div>
  );
}

const EMPTY = { title: '', description: '', category_id: '', thumbnail_url: '', video_url: '', duration_min: 0, published: 1 };
function AdminPanel({ onClose }) {
  const [vids, setVids] = useState([]); const [cats, setCats] = useState([]); const [subs, setSubs] = useState([]);
  const [f, setF] = useState(EMPTY); const [editing, setEditing] = useState(null); const [err, setErr] = useState('');
  const load = () => { api('/videos').then(setVids); api('/categories').then(setCats); api('/admin/subscriptions').then(setSubs).catch(() => {}); };
  useEffect(load, []);
  const save = async (e) => { e.preventDefault(); setErr(''); try { const body = { ...f, category_id: f.category_id || null }; await api(editing ? `/videos/${editing}` : '/videos', { method: editing ? 'PUT' : 'POST', body }); setF(EMPTY); setEditing(null); load(); } catch (x) { setErr(x.message); } };
  const del = async (id) => { if (confirm('¿Eliminar este video?')) { await api('/videos/' + id, { method: 'DELETE' }); load(); } };
  const setStatus = async (id, status) => { await api('/admin/subscriptions/' + id, { method: 'PATCH', body: { status } }); load(); };
  return (
    <motion.div className="modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="modal admin">
        <div className="row"><h3>Panel de administración</h3><button className="btn small ghost" onClick={onClose}>Cerrar</button></div>
        <form onSubmit={save} className="form two">
          <input required placeholder="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <select value={f.category_id || ''} onChange={(e) => setF({ ...f, category_id: e.target.value })}><option value="">Sin categoría</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input required placeholder="URL del video (mp4 o embed)" value={f.video_url} onChange={(e) => setF({ ...f, video_url: e.target.value })} />
          <input placeholder="URL de la miniatura" value={f.thumbnail_url || ''} onChange={(e) => setF({ ...f, thumbnail_url: e.target.value })} />
          <input type="number" min="0" placeholder="Duración (min)" value={f.duration_min} onChange={(e) => setF({ ...f, duration_min: e.target.value })} />
          <textarea placeholder="Descripción" value={f.description || ''} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <button className="btn primary">{editing ? 'Guardar cambios' : 'Agregar video'}</button>
          {err && <p className="err">{err}</p>}
        </form>
        <h4>Videos</h4>
        {vids.map((v) => <div className="row item" key={v.id}><span>{v.title}</span><span><button className="link" onClick={() => { setEditing(v.id); setF({ ...v, category_id: v.category_id || '' }); }}>Editar</button> <button className="link" onClick={() => del(v.id)}>Eliminar</button></span></div>)}
        <h4>Suscripciones</h4>
        {subs.map((s) => <div className="row item" key={s.id}><span>{s.name} · {s.plan}</span><select value={s.status} onChange={(e) => setStatus(s.id, e.target.value)}><option>pendiente</option><option>activa</option><option>vencida</option></select></div>)}
      </div>
    </motion.div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [auth, setAuth] = useState(false);
  const [adm, setAdm] = useState(false);
  const cat = useRef(null);
  useEffect(() => { if (hasSession()) api('/me').then((r) => setUser(r.user)).catch(clearSession); }, []);
  return (
    <>
      <Nav user={user} onAuth={() => setAuth(true)} onAdmin={() => setAdm(true)} onLogout={() => { clearSession(); setUser(null); }} />
      <Hero onStart={() => document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' })} />
      <main ref={cat}><Catalog /><Plans user={user} onAuth={() => setAuth(true)} /><Install /><Faq /><Contact /></main>
      <footer className="foot">Multigema · Soporte por <a href={wa('Hola, necesito ayuda con Multigema.')}>WhatsApp</a></footer>
      <AnimatePresence>{auth && <AuthModal onClose={() => setAuth(false)} onDone={(u) => { setUser(u); setAuth(false); }} />}</AnimatePresence>
      <AnimatePresence>{adm && <AdminPanel onClose={() => setAdm(false)} />}</AnimatePresence>
    </>
  );
}
