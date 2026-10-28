# CLAUDE.md — Brawler web online

## Qué es
Juego de lucha 2D estilo Brawlhalla, jugable en navegador y online 1v1, con personajes inspirados en compañeros de clase. Proyecto personal y pieza de portfolio de Riga (2.º DAW). MVP público antes del **14 de marzo de 2027**.

## Cómo trabajamos
- **Se avanza tarea a tarea** del plan (ver "Plan" abajo), en orden. Cuando Riga dice "sigue", encadena la siguiente tarea al terminar la actual.
- Antes de tocar código, explica en **3 líneas** qué vas a cambiar y en qué archivos.
- Al terminar, di **cómo probarlo** (comando + qué debo ver en el navegador).
- Si surge algo fuera de la tarea, apúntalo en `docs/NOTAS.md` → "Pendientes v2". No lo hagas.
- Explícame **1 concepto nuevo por sesión** (físicas, netcode, etc.) en lenguaje claro. Quiero entender el código, no solo tenerlo.
- Al cerrar cada tarea, actualiza `docs/NOTAS.md` (hecho, decisiones, bugs conocidos, siguiente tarea).
- **Commit al final del día**, uno con todo lo del día, cuando Riga lo pida. No commitear ni hacer push después de cada tarea.
- Responde en español. Código, nombres de variables y commits en inglés.

## Stack
- **TypeScript** en todo (modo `strict`).
- **Cliente:** Phaser 3 + Vite.
- **Servidor:** Colyseus (Node.js), WebSocket.
- **Lógica compartida:** paquete `shared` con físicas y combate propios (NO usar Arcade Physics de Phaser para la lógica de juego).
- Monorepo con npm workspaces.

```
brawler/
  packages/
    shared/   # constantes, físicas, combate, tipos de input
    client/   # Phaser: escenas, render, input, red
    server/   # Colyseus: salas, bucle autoritativo
  docs/
    NOTAS.md  # estado del proyecto, decisiones, pendientes
  CLAUDE.md
```

## Reglas de arquitectura
- **Paso fijo a 60 Hz** para la simulación; el render va aparte (interpola).
- La lógica de juego en `shared` debe ser **pura y determinista**: sin `Math.random()` sin semilla, sin `Date.now()`, sin acceso a Phaser ni al DOM.
- La simulación recibe **inputs** (no posiciones). El cliente nunca decide si un golpe acierta en online: decide el servidor.
- **Todos los números ajustables** (gravedad, velocidades, knockback, frames de ataque) en `shared/src/constants.ts`. Nada de números mágicos sueltos.
- Personajes definidos **por datos** (`shared/src/characters/*.ts`), no con clases distintas por personaje.
- Hitboxes/hurtboxes rectangulares (AABB). Modo debug con tecla `F1` que las dibuje.

## Online (fase F3)
- Servidor autoritativo con Colyseus a 60 Hz; difusión de estado a 20–30 Hz.
- Cliente: predicción del jugador propio + reconciliación suave; rival interpolado ~100 ms.
- Salas con código de 4 letras. Gestionar desconexión sin romper la partida del otro.

## Convenciones
- Archivos pequeños y con una responsabilidad. Funciones cortas.
- Sin dependencias nuevas sin preguntarme antes (di cuál y por qué).
- Nada de assets, nombres ni sonidos de Brawlhalla u otros juegos. Placeholders: rectángulos de colores.
- Un commit por día de trabajo, con Conventional Commits y el resumen de las tareas en el cuerpo: `feat: add movement (F1.1–F1.3)`.

## Comandos
- `npm install` — instalar todo
- `npm run dev` — cliente en local (http://localhost:5173; partida local a 2 jugadores)
- `npm run dev:server` — servidor Colyseus en local (puerto 2567; Node 24 ejecuta `.ts` directamente)
- http://localhost:5173/?online — crea una sala online (necesita el servidor); comparte el enlace `?online=CÓDIGO` que aparece
- `&lag=150` — (solo desarrollo) simula 150 ms de lag en los mensajes enviados
- `npm run build` — build de producción del cliente (incluye typecheck)
- `npm run typecheck` — comprobar tipos en los tres paquetes

## Plan (marcar al completar)
**F0 · Setup** (2–8 nov)
- [x] F0.1 Monorepo + Vite + Phaser con escena vacía
- [x] F0.2 constants.ts, bucle de paso fijo 60 Hz, NOTAS.md

**F1 · Movimiento local** (9–29 nov)
- [x] F1.1 Correr, saltar, colisión con suelo
- [x] F1.2 Plataformas atravesables desde abajo
- [x] F1.3 Doble salto y caída rápida
- [x] F1.4 Dash y esquiva con cooldown
- [x] F1.5 Segundo jugador en el mismo teclado
- [x] F1.6 Cámara que encuadra a ambos

**F2 · Combate local** (30 nov – 13 dic) → Hito: 1v1 local jugable
- [x] F2.1 Hitboxes/hurtboxes, ataque ligero en 3 direcciones
- [x] F2.2 Ataque pesado con carga
- [x] F2.3 Daño acumulado, knockback escalado, hitstun
- [x] F2.4 Zona de muerte, 3 vidas, respawn con invulnerabilidad
- [x] F2.5 Pantalla de victoria y revancha

**Colchón Navidad** (14 dic – 3 ene)

**F3 · Online 1v1** (4–31 ene)
- [x] F3.1 Sala Colyseus, dos navegadores ven el mismo mapa
- [x] F3.2 Inputs al servidor, simulación con `shared`, difusión de estado
- [x] F3.3 Predicción + reconciliación
- [x] F3.4 Interpolación del rival
- [x] F3.5 Salas con código, desconexiones
- [ ] F3.6 Deploy (cliente Netlify/Vercel, servidor Fly.io/Hetzner)
- [ ] F3.7 Ping en pantalla y ajustes

**F4 · Personajes** (1–21 feb)
- [ ] F4.1 Sistema de personajes por datos
- [ ] F4.2 Personajes 1 y 2
- [ ] F4.3 Personajes 3 y 4
- [ ] F4.4 Sprites y animaciones
- [ ] F4.5 Selección de personaje

**F5 · Pulido y lanzamiento** (22 feb – 14 mar)
- [ ] F5.1 Menú, sonidos, música
- [ ] F5.2 Screen shake, partículas, hitstop
- [ ] F5.3 Playtest con 6–8 compañeros
- [ ] F5.4 Corregir los 5 fallos principales
- [ ] F5.5 README con GIF, enlace en el portfolio

## Fuera del MVP (no hacer)
Armas recogibles, 2v2/4 jugadores, matchmaking aleatorio, ranking, cuentas, rollback netcode, móvil.
