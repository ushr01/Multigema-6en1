# Multigema

React + Vite (cliente), Node + Express (API), MySQL 8 (base de datos).

## Con Docker (recomendado, hosting en un VPS)
1. `cp .env.example .env` y cambiá las claves.
2. `docker compose up -d --build`
3. Creá el admin: `docker compose exec api npm run seed`
4. Abrí `http://IP_DEL_SERVIDOR`. Ingresá con el admin y cargá videos desde "Panel".

## Desarrollo local
- MySQL: importá `database/schema.sql`.
- `cd server && cp ../.env.example .env && npm i && npm run seed && npm run dev`
- `cd client && npm i && npm run dev` (proxy a la API en :4000)

## Hosting
Cualquier VPS con Docker (Hetzner, DigitalOcean, Contabo) sirve. Para HTTPS poné Caddy o Cloudflare delante.
Los videos se cargan por URL: usá contenido propio o con licencia.
