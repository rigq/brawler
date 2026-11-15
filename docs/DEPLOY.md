# Deploy (L3)

Dos piezas: el **cliente** (archivos estáticos, gratis) y el **servidor** (Colyseus, un proceso Node siempre encendido).
Lo que ya está preparado en el repo:

- `Dockerfile` en la raíz: imagen del servidor con Node 24 y solo sus dependencias (sin Phaser). Escucha en `PORT` (por defecto 2567).
- El cliente lee `VITE_SERVER_URL` al compilar. Sin ella, busca el servidor en el mismo host y puerto 2567 (vale para LAN, no para internet).
- CI en GitHub (`.github/workflows/ci.yml`): typecheck, tests y build en cada push.

## 1. Servidor en Fly.io (recomendado para empezar)

Necesita cuenta y tarjeta (con 1 máquina pequeña suele quedarse en 0–5 €/mes; revisa precios actuales al crearla).

1. Instala `flyctl` y entra: `fly auth login`.
2. Desde la raíz del repo: `fly launch --no-deploy` → detecta el `Dockerfile`. Elige región **Madrid (mad)**.
3. En el `fly.toml` generado:
   - `internal_port = 2567`
   - **Una sola máquina** y sin apagado automático (`auto_stop_machines = "off"`, `min_machines_running = 1`): las salas viven en memoria; si la máquina se apaga o hay dos, las salas se pierden o no se encuentran.
4. `fly deploy`. Te da una URL tipo `https://brawler-xxxx.fly.dev`.

Alternativa: un VPS de Hetzner (~4–5 €/mes) con Docker: `docker build -t brawler-server . && docker run -d -p 2567:2567 --restart unless-stopped brawler-server`, y delante un proxy con HTTPS (Caddy lo hace solo). Más control, más trabajo.

## 2. Cliente en Netlify o Vercel (gratis)

- Directorio base: raíz del repo · Comando: `npm run build` · Carpeta publicada: `packages/client/dist`
- Variable de entorno: `VITE_SERVER_URL=https://brawler-xxxx.fly.dev` (la del paso anterior; el SDK pasa solo a `wss://`).

## 3. Comprobar

1. Abre `https://<tu-cliente>/?online` → debe salir el código de sala.
2. Pasa el enlace `?online=CÓDIGO` a alguien **en otra casa** (por Discord vale) y jugad una partida entera.
3. Mira los logs del servidor (`fly logs`): `created`, `joined as P1/P2`, `match started`.

## Pendiente tras el primer deploy

- L4: ping en pantalla.
- Imagen para la vista previa del enlace en Discord (`og:image`, necesita la URL final).
