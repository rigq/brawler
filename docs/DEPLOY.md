# Deploy (L3)

Dos piezas: el **cliente** (archivos estáticos, gratis) y el **servidor** (Colyseus, un proceso Node siempre encendido).
Lo que ya está preparado en el repo:

- `Dockerfile` en la raíz: imagen del servidor con Node 24 y solo sus dependencias (sin Phaser). Escucha en `PORT` (por defecto 2567).
- El cliente lee `VITE_SERVER_URL` al compilar. Sin ella, busca el servidor en el mismo host y puerto 2567 (vale para LAN, no para internet).
- CI en GitHub (`.github/workflows/ci.yml`): typecheck, tests y build en cada push.

## 1. Servidor en Fly.io

Ya está configurado en `fly.toml` (app `los-vatos`, París: Madrid ya no admite máquinas nuevas, **una sola máquina siempre encendida**: las salas viven en memoria). Una máquina `shared-cpu-1x` de 256 MB cuesta unos 2 €/mes (revisa los precios al crearla; Fly pide tarjeta).

En el PC, desde la carpeta del repo (PowerShell):

1. Instalar `flyctl` (una vez): `iwr https://fly.io/install.ps1 -useb | iex` y cerrar y abrir la terminal.
2. `fly auth login` (abre el navegador).
3. `fly apps create los-vatos` — si dice que el nombre está cogido, usa otro (p. ej. `los-vatos-daw`) y cámbialo en `fly.toml` (línea `app`) y en `netlify.toml` (`VITE_SERVER_URL`).
4. `fly deploy --ha=false` (`--ha=false`: una máquina, no dos). Tarda 2–3 min la primera vez.
5. Comprobar: `fly logs` debe decir `listening on port 2567`.

Para subir cambios del servidor más adelante: `git pull` y `fly deploy --ha=false`.

Alternativa: un VPS de Hetzner (~4–5 €/mes) con Docker: `docker build -t brawler-server . && docker run -d -p 2567:2567 --restart unless-stopped brawler-server`, y delante un proxy con HTTPS (Caddy lo hace solo). Más control, más trabajo.

## 2. Cliente en Netlify (gratis)

Ya está configurado en `netlify.toml` (comando, carpeta, Node 24 y la dirección del servidor).

1. Netlify → **Add new site → Import an existing project → GitHub** → elige `brawler`.
2. Deja todo como lo rellena (lo lee de `netlify.toml`) y **Deploy**.
3. Cada `git push` a `main` vuelve a publicar solo. En **Site configuration → Change site name** puedes ponerle un nombre bonito (`los-vatos.netlify.app` si está libre).

## 3. Comprobar

1. Abre `https://<tu-cliente>/?online` → debe salir el código de sala.
2. Pasa el enlace `?online=CÓDIGO` a alguien **en otra casa** (por Discord vale) y jugad una partida entera.
3. Mira los logs del servidor (`fly logs`): `created`, `joined as P1/P2`, `match started`.

## Pendiente tras el primer deploy

- L4: ping en pantalla.
- Imagen para la vista previa del enlace en Discord (`og:image`, necesita la URL final).
