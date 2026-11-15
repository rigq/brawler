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

## 2. Cliente en Netlify (gratis)

El repo trae `netlify.toml` (comando, carpeta publicada y Node 24), así que basta con:

1. netlify.com → *Add new site* → *Import an existing project* → GitHub → `rigq/brawler`.
2. Dejar lo que propone (lo lee del `netlify.toml`) y *Deploy*. Cada push a `main` vuelve a publicar.
3. **Sin servidor** (de momento): se publican Local y Entrenamiento; Online sale en gris ("próximamente").
4. **Con servidor**: en *Site configuration → Environment variables*, `VITE_SERVER_URL=https://brawler-xxxx.fly.dev` (la del paso 1; el SDK pasa solo a `wss://`) y volver a desplegar. Online se activa solo.

## Jugar online en clase sin desplegar (red local)

En el PC de Riga: `npm run dev:server` y `npm run dev`. Los demás abren la dirección de la línea **Network** que imprime Vite (`http://192.168.x.x:5173`); Online funciona porque el cliente busca el servidor en esa misma IP. Si Windows pregunta, permitir Node en redes privadas. Ojo: algunas redes de centros aíslan los equipos entre sí y no se ven; entonces, compartir conexión desde un móvil.

## 3. Comprobar

1. Abre `https://<tu-cliente>/?online` → debe salir el código de sala.
2. Pasa el enlace `?online=CÓDIGO` a alguien **en otra casa** (por Discord vale) y jugad una partida entera.
3. Mira los logs del servidor (`fly logs`): `created`, `joined as P1/P2`, `match started`.

## Pendiente tras el primer deploy

- L4: ping en pantalla.
- Imagen para la vista previa del enlace en Discord (`og:image`, necesita la URL final).
