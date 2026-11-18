# CLAUDE.md — Los Vatos (brawler web online)

## Qué es
**Los Vatos**: juego de lucha 2D estilo Brawlhalla, jugable en navegador y online 1v1, con personajes inspirados en compañeros de clase. Proyecto personal y pieza de portfolio de Riga (2.º DAW). MVP público antes del **14 de marzo de 2027**.

## Cómo trabajamos
- **Se avanza tarea a tarea** del plan (ver "Plan" abajo), en orden. Cuando Riga dice "sigue", encadena la siguiente tarea al terminar la actual.
- Antes de tocar código, explica en **3 líneas** qué vas a cambiar y en qué archivos.
- Al terminar, di **cómo probarlo** (comando + qué debo ver en el navegador).
- Si surge algo fuera de la tarea, apúntalo en `docs/NOTAS.md` → "Pendientes v2". No lo hagas.
- Explícame **1 concepto nuevo por sesión** (físicas, netcode, etc.) en lenguaje claro. Quiero entender el código, no solo tenerlo.
- Al cerrar cada tarea, actualiza `docs/NOTAS.md` (hecho, decisiones, bugs conocidos, siguiente tarea).
- **Commit al final del día**, uno con todo lo del día, cuando Riga lo pida. No commitear ni hacer push después de cada tarea.
- **Los commits van directo a `main`** (decidido el 15 nov): sin ramas ni pull requests. Antes de subir: `npm run typecheck`, `npm test` y `npm run build` en verde.
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
- Hitboxes/hurtboxes rectangulares (AABB). Modo debug con tecla `F1` que las dibuje. El cuerpo mide lo que el dibujo de pie (72 px; Robert 74, Chachin 30×54) y las cajas de ataque se escriben para un cuerpo de referencia de 40×60 que `buildCharacter` adapta a cada uno.
- Interfaz (menús, selección, pausa, HUD) en **HTML/CSS sobre el lienzo** (`client/src/ui/shell/`, `ui/hud/`), no en Phaser: texto nítido y fácil de animar. `app/App.ts` es la máquina de pantallas; las partidas son escenas que se añaden al empezar y se quitan al salir.
- Online, el jugador viaja partido en bloques de campos (`PLAYER_PARTS` en `shared/net/protocol.ts`): un esquema de Colyseus admite 63 campos como mucho. Añadir campos a `Player` no requiere tocar nada más.
- Cambios en `shared` → `npm test`. El test de determinismo falla si se cuela algo aleatorio, de reloj o dependiente del orden.

## Online (fase F3)
- Servidor autoritativo con Colyseus a 60 Hz; difusión de estado a 60 Hz (antes 30).
- Cliente: predicción del jugador propio + reconciliación suave; rival interpolado con retraso adaptable (`net/InterpDelay.ts`: 34–120 ms según la conexión; ~34 en red local).
- Salas con código de 4 letras. Gestionar desconexión sin romper la partida del otro.

## Convenciones
- Archivos pequeños y con una responsabilidad. Funciones cortas.
- Sin dependencias nuevas sin preguntarme antes (di cuál y por qué).
- Nada de assets, nombres ni sonidos de Brawlhalla u otros juegos. Placeholders: rectángulos de colores.
- Un commit por día de trabajo, con Conventional Commits y el resumen de las tareas en el cuerpo: `feat: add movement (F1.1–F1.3)`.

## Comandos
- `npm install` — instalar todo
- `npm run dev` — cliente (http://localhost:5173: menú principal → selección de personaje → partida; Esc pausa). Escucha también en la red local (`vite --host`): la línea "Network" que imprime es la dirección para otros PCs de la misma red
- `npm run dev:server` — servidor Colyseus en local (puerto 2567; Node 24 ejecuta `.ts` directamente)
- Atajos de desarrollo (se saltan los menús): `?local`, `?training` (R reinicia, 8 escudo del muñeco, 9/0 cambian su %), `?online` (crea sala), con `?p1=samu&p2=chachin`
- `node tools/pixelate.ts art/<personaje>/sprites.json` — limpia los sprites generados con IA y los deja en `packages/client/public/sprites/` (JPG: Windows lo lee solo; Linux/Mac necesitan ImageMagick). Con `art/<personaje>/anim/sprites.json` el personaje usa sus animaciones sin tocar código
- Online (necesita `npm run dev:server`): Online → Crear sala; el enlace `?online=CÓDIGO` lleva a la selección de personaje y entra en esa sala. Cada jugador elige su personaje
- `&lag=150` — (solo desarrollo) simula 150 ms de lag en los mensajes enviados
- `npm run build` — build de producción del cliente (incluye typecheck)
- `npm run typecheck` — comprobar tipos en los tres paquetes (tests incluidos)
- `npm test` — tests con `node:test` (determinismo, reglas, proyectiles, red); el CI de GitHub pasa typecheck + tests + build en cada push
- `node tools/ko-percent.ts` — a qué % muere cada personaje (golpe fuerte lateral y arriba desde el borde, sin intentar volver y volviendo como un jugador). Usarlo antes y después de tocar gravedad, velocidades, knockback o límites
- `docs/DEPLOY.md` — cómo desplegar (L3): `Dockerfile` del servidor, `VITE_SERVER_URL` para el cliente

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
- (F3.6 y F3.7 pasan al bloque L, al final: primero el juego local completo)

> Replanificado el 29 oct: vamos adelantados, así que antes de desplegar se pule el juego en local.

**G · Sensación de golpe** (nov)
- [x] G1 Hitstop: los dos se congelan unos ticks al conectar (en `shared`, escala con el daño)
- [x] G2 Screen shake, chispas de impacto, estela al salir lanzado
- [x] G3 Modo entrenamiento: muñeco, reset de %, contador y daño de combo

**C · Moveset y combos** (nov – dic)
- [x] C1 Jab de 1–3 golpes (ligero neutro) y ataque en carrera propio
- [x] C2 Aéreos propios: neutral, adelante, atrás, arriba, abajo
- [x] C3 Ajustar hitstun: combos reales a % bajo, escapables a % alto
- [x] C4 Coyote time, jump buffer y aterrizaje lento de la esquiva aérea

**E · Defensa y bordes** (dic)
- [x] E1 Escudo (L mantenido en suelo) que se encoge y se rompe; L + dirección = rodar
- [x] E2 Agarre (L + J) y 2 lanzamientos
- [x] E3 Agarre al borde con invulnerabilidad una vez hasta tocar suelo; subir, saltar, atacar o rodar
- [ ] E4 Paredes laterales para saltar (aparcado: se hará más adelante, cambia el mapa)

**P · Personajes** (dic – ene)
- [x] P1 Personajes por datos (peso, velocidad, daño, alcance, ataques) y knockback con peso: `(b + s·p·d/10) · 100/peso`
- [x] P2 Botón de especial (I / N); Donate y Robert con especial neutral y arriba
- [x] P3 Samu y Chachin con especial neutral y arriba (el especial arriba es la recovery de todos, dirigible; desde el 18 nov ↑+K en el aire da un segundo impulso)

**D · Diseño gráfico** (ene)
- [ ] D1 Animaciones pixel art por personaje (26 tiras, `docs/PROMPTS_ANIMACIONES.md`): Donate ✔ · Robert ✔ · Samu ✔ (falta `throw`) · Chachin ✔
- [ ] D2 Efectos: polvo al aterrizar/dash, ~~arco de los golpes~~ (hecho 18 nov), destello de KO
- [ ] D3 Escenario vivo (nubes, faroles que parpadean)

**I · Interfaz** (feb)
- [x] I1 Menú principal (Local / Entrenamiento / Online / Controles)
- [x] I2 Selección de personaje para 2 jugadores
- [x] I3 HUD nuevo (retrato, vidas en iconos, % que tiembla) y pausa con Esc
- [ ] I4 Sonidos sintetizados con Web Audio, música y volumen

**L · Pulido y lanzamiento** (feb – 14 mar)
- [ ] L1 Playtest con 6–8 compañeros
- [ ] L2 Corregir los 5 fallos principales
- [ ] L3 Deploy (cliente Netlify/Vercel, servidor Fly.io/Hetzner) — antes F3.6. Preparado en `docs/DEPLOY.md`; faltan las cuentas
- [ ] L4 Ping en pantalla y ajustes de red — antes F3.7
- [ ] L5 README con GIF, enlace en el portfolio

## Referencia de jugabilidad
`docs/JUGABILIDAD.md` (documento de Riga): **la base es Smash** (moveset por huecos, especiales como poderes, escudo · agarre · ataque, bordes) y de Brawlhalla solo lo que simplifica (enfriamiento de esquiva, stats simples, paredes, partidas a 3 vidas). Se inspira, no se copia: ni nombres, ni assets, ni valores exactos.

Tabla completa de controles: `docs/CONTROLES.md`. Resumen (P1 / P2): salto Espacio / M · ataque J / `,` · fuerte K / `.` (mantener carga; brilla y parpadea al máximo) · escudo-esquiva L / `-` · agarre U o L+J / `-`+`,` · especial I / N (con arriba: especial arriba) · dash doble toque de dirección · con escudo: lado rueda, abajo esquiva.

## Fuera del MVP (no hacer)
Armas recogibles, 2v2/4 jugadores, matchmaking aleatorio, ranking, cuentas, rollback netcode, móvil. También v2: especiales lateral y abajo (v1.1), desgaste de ataques, rage, DI, chase dodge, súper final.
