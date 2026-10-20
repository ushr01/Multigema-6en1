import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import 'dotenv/config';
import { pool } from './db.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '100kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 40 }));

const sign = (u) => jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Sesión inválida. Iniciá sesión de nuevo.' }); }
};
const admin = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Solo administradores.' });
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  if (e instanceof z.ZodError) return res.status(400).json({ error: e.issues[0].message });
  console.error(e); res.status(500).json({ error: 'Error del servidor.' });
});

app.get('/api/health', (_, res) => res.json({ ok: true }));

const regSchema = z.object({ name: z.string().min(2, 'Ingresá tu nombre'), email: z.string().email('Email inválido'), password: z.string().min(8, 'La contraseña necesita 8 caracteres o más') });
app.post('/api/auth/register', wrap(async (req, res) => {
  const d = regSchema.parse(req.body);
  const [ex] = await pool.query('SELECT id FROM users WHERE email=?', [d.email]);
  if (ex.length) return res.status(409).json({ error: 'Ese email ya tiene cuenta.' });
  const [r] = await pool.query('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)', [d.name, d.email, await bcrypt.hash(d.password, 12)]);
  const user = { id: r.insertId, name: d.name, email: d.email, role: 'user' };
  res.status(201).json({ token: sign(user), user });
}));
app.post('/api/auth/login', wrap(async (req, res) => {
  const d = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
  const [rows] = await pool.query('SELECT * FROM users WHERE email=?', [d.email]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(d.password, u.password_hash))) return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
  res.json({ token: sign(u), user: { id: u.id, name: u.name, email: u.email, role: u.role } });
}));
app.get('/api/me', auth, wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT id,name,email,role FROM users WHERE id=?', [req.user.id]);
  const [subs] = await pool.query('SELECT s.id,s.status,p.name plan FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.user_id=? ORDER BY s.id DESC', [req.user.id]);
  res.json({ user: rows[0], subscriptions: subs });
}));

app.get('/api/categories', wrap(async (_, res) => res.json((await pool.query('SELECT * FROM categories ORDER BY id'))[0])));
app.get('/api/videos', wrap(async (req, res) => {
  const c = req.query.category || null;
  const [rows] = await pool.query(
    `SELECT v.*, c.name category FROM videos v LEFT JOIN categories c ON c.id=v.category_id
     WHERE v.published=1 AND (? IS NULL OR v.category_id=?) ORDER BY v.created_at DESC`, [c, c]);
  res.json(rows);
}));
const videoSchema = z.object({
  title: z.string().min(2), description: z.string().optional().default(''),
  category_id: z.coerce.number().nullable().optional(), thumbnail_url: z.string().url().optional().or(z.literal('')),
  video_url: z.string().url('URL de video inválida'), duration_min: z.coerce.number().int().min(0).default(0), published: z.coerce.number().min(0).max(1).default(1)
});
app.post('/api/videos', auth, admin, wrap(async (req, res) => {
  const v = videoSchema.parse(req.body);
  const [r] = await pool.query('INSERT INTO videos (title,description,category_id,thumbnail_url,video_url,duration_min,published) VALUES (?,?,?,?,?,?,?)',
    [v.title, v.description, v.category_id ?? null, v.thumbnail_url || null, v.video_url, v.duration_min, v.published]);
  res.status(201).json({ id: r.insertId });
}));
app.put('/api/videos/:id', auth, admin, wrap(async (req, res) => {
  const v = videoSchema.parse(req.body);
  await pool.query('UPDATE videos SET title=?,description=?,category_id=?,thumbnail_url=?,video_url=?,duration_min=?,published=? WHERE id=?',
    [v.title, v.description, v.category_id ?? null, v.thumbnail_url || null, v.video_url, v.duration_min, v.published, req.params.id]);
  res.json({ ok: true });
}));
app.delete('/api/videos/:id', auth, admin, wrap(async (req, res) => {
  await pool.query('DELETE FROM videos WHERE id=?', [req.params.id]); res.json({ ok: true });
}));

app.get('/api/plans', wrap(async (_, res) => {
  const [rows] = await pool.query('SELECT * FROM plans ORDER BY price_ars');
  res.json(rows.map((p) => ({ ...p, features: p.features.split('|') })));
}));
app.post('/api/subscribe', auth, wrap(async (req, res) => {
  const { plan_id } = z.object({ plan_id: z.coerce.number() }).parse(req.body);
  await pool.query('INSERT INTO subscriptions (user_id,plan_id) VALUES (?,?)', [req.user.id, plan_id]);
  res.status(201).json({ whatsapp: process.env.WHATSAPP });
}));
app.get('/api/admin/subscriptions', auth, admin, wrap(async (_, res) => {
  const [rows] = await pool.query('SELECT s.id,s.status,s.created_at,u.name,u.email,p.name plan FROM subscriptions s JOIN users u ON u.id=s.user_id JOIN plans p ON p.id=s.plan_id ORDER BY s.id DESC');
  res.json(rows);
}));
app.patch('/api/admin/subscriptions/:id', auth, admin, wrap(async (req, res) => {
  const { status } = z.object({ status: z.enum(['pendiente', 'activa', 'vencida']) }).parse(req.body);
  await pool.query('UPDATE subscriptions SET status=? WHERE id=?', [status, req.params.id]); res.json({ ok: true });
}));
app.post('/api/contact', rateLimit({ windowMs: 60 * 1000, max: 5 }), wrap(async (req, res) => {
  const d = z.object({ name: z.string().min(2), email: z.string().email(), message: z.string().min(5) }).parse(req.body);
  await pool.query('INSERT INTO contacts (name,email,message) VALUES (?,?,?)', [d.name, d.email, d.message]);
  res.status(201).json({ ok: true });
}));

app.listen(process.env.PORT || 4000, () => console.log('API Multigema en puerto', process.env.PORT || 4000));
