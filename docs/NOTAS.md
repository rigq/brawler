# Planning — Brawler web online

Oct 26, 2026 · @Fabrizio Riga

## Estado del proyecto

Se actualiza al cerrar cada sesión. Lo más reciente, arriba.

### Hecho

- **F2.5 (28 oct)** — Pantalla de victoria y revancha. `client/src/ui/ResultOverlay.ts`: cuando `matchResult()` indica fin de partida, tras 0,9 s (para ver el KO) cubre la pantalla con "GANA P1/P2" en el color del ganador o "EMPATE", y "Revancha: Enter, R o Start". `client/src/input/RematchInput.ts`: Enter, R o Start de cualquier mando; solo cuenta con el resultado en pantalla. La revancha crea un `World` nuevo sin reiniciar la escena (vistas, cámara y marcadores dibujan el mundo que se les pasa cada frame). Comprobado en el navegador: R ignorada en mitad de la partida, "GANA P2" tras perder P1 su última vida, y Enter empieza una partida nueva con 3 vidas y 0 %. **Con esto termina la fase F2: 1v1 local jugable.**
- **F2.4 (28 oct)** — Vidas y reaparición. `shared/src/sim/stocks.ts`: cada jugador tiene `STOCKS` (3) vidas. Salir de la zona de muerte (`BLAST_ZONE`, desde F2.3) resta una vida; con vidas restantes, el jugador queda fuera de juego `RESPAWN_DELAY_TICKS` (1 s): no se simula, no golpea ni puede ser golpeado. Después reaparece en su spawn con 0 % y `RESPAWN_INVULN_TICKS` (2 s) de invulnerabilidad, que se acaba antes si ataca. Sin vidas queda fuera de la partida. `matchResult()` dice si la partida ha terminado y quién gana (o empate si las últimas vidas se pierden en el mismo tick), para la pantalla de F2.5. Cliente: el jugador fuera de juego no se dibuja ni lo sigue la cámara; parpadea mientras es invulnerable; bajo el % aparecen las vidas (●●○) u "OUT". Comprobado con script (15 casos: vida perdida, espera, reaparición a 0 % e invulnerable, invulnerabilidad que bloquea golpes y se pierde al atacar, eliminación tras 3 KOs, ganador, empate, jugador en espera no golpeable, determinismo en 8000 pasos) y en el navegador.
- **F2.3 (28 oct)** — Daño acumulado, knockback que crece con el daño y hitstun. Cada ataque en `constants.ts` gana `damage`, `kbBase`, `kbScale` y dirección `kbX/kbY`. `shared/src/combat/knockback.ts`: suma el daño (el pesado cargado hace hasta +40 %, `HEAVY_CHARGE_BONUS`), lanza a una velocidad de `kbBase + kbScale × daño` (como máximo `KNOCKBACK_MAX_SPEED` 3600) alejándose del atacante, aplica hitstun (`HITSTUN_BASE_TICKS` + velocidad × `HITSTUN_TICKS_PER_SPEED`), interrumpe el ataque o el dash del golpeado y le devuelve el salto y la esquiva aéreos. Durante el hitstun no hay control y la velocidad horizontal se frena con `HITSTUN_DRAG`. **Zonas de muerte en los 4 lados** (`BLAST_ZONE`, sustituye a `FALL_RESET_Y`): al salir, reapareces en tu spawn con 0 % (las vidas llegan en F2.4). Cliente: `DamageHud` con el % de cada jugador abajo, de blanco a amarillo y a rojo hasta 150 %, y "STUN" en el HUD de debug. Comprobado con script (18 casos: daño, dirección, más daño = más lejos y más hitstun, sin control durante el hitstun, bonificación por carga, interrupción, intercambio de golpes, golpe por detrás, KO lateral con reaparición a 0 %, tope de velocidad, determinismo en 6000 pasos) y en el navegador (6 % → 12 % → 18 %, knockback 300 → 338 → 377 px/s).
- **F2.2 (28 oct)** — Ataque pesado con carga. Nuevo input `heavy` (P1 **V**, P2 **.** o 2 del teclado numérico, mando **B/Y**). `HEAVY_ATTACKS` en constantes: lateral (alcance 92 px frente a 52 del ligero), arriba (arco amplio) y abajo (barrido a ambos lados), más lentos (arranque 10–12, recuperación 22–26 ticks). Fase nueva **`charge`**: mientras mantienes el botón cargas hasta `HEAVY_MAX_CHARGE_TICKS` (36 ≈ 0,6 s); al soltar, o al llegar al máximo, empieza el arranque en ese mismo tick. `attackCharge()` da la carga de 0 a 1 para que F2.3 escale el daño. Mientras cargas eres vulnerable y estás comprometido (sin esquiva, salto ni giro; en el suelo frenas). Cliente: barra blanca de carga sobre la cabeza, golpe pesado más opaco y HUD con fuerza y carga. Comprobado con script (12 casos: pulsación corta, mantener y soltar, disparo automático a carga máxima, alcance del pesado donde el ligero falla, pesado abajo golpea por detrás, compromiso, ligero ignorado durante la carga, determinismo) y en el navegador.
- **F2.1 (28 oct)** — Ataque ligero en 3 direcciones con hitboxes y hurtboxes. Nuevo input `light` (P1 **C**, P2 **,** o 1 del teclado numérico, mando **X**). El jugador gana `facing` (cambia con la dirección al moverse, al hacer dash o al empezar un ataque). `shared/src/combat/attacks.ts`: fases arranque → activo → recuperación, dirección (↑ = arriba, ↓ = abajo, si no lateral) y hitbox espejada según `facing`; los datos de `LIGHT_ATTACKS` están en `constants.ts`. `shared/src/combat/hits.ts`: tras mover a todos, cada hitbox activa que toca la hurtbox de un rival cuenta como golpe (una vez por ataque y rival, `attackHitMask`); las esquivas lo evitan y dos ataques simultáneos se cambian golpe. Por ahora un golpe solo hace destellar en blanco al rival (`hitFlashTicks`); daño y knockback llegan en F2.3. Mientras atacas no puedes saltar, esquivar ni girarte; en el suelo frenas y en el aire conservas el control. Cliente: "ojo" que indica hacia dónde mira cada jugador, el golpe dibujado mientras está activo, destello y modo debug con **F1** (`DebugOverlay`: hurtboxes en verde, hitboxes en rojo, tenues fuera de la fase activa). También corregido: `dropTicks` no descontaba durante esquivas o ataques. Comprobado con script (17 casos: fases y duración, un golpe por ataque en su primer tick activo, `facing`, alcance, golpe hacia arriba, esquiva, intercambio de golpes, compromiso, control aéreo, determinismo en 4000 pasos) y en el navegador (golpe que falla por 1 px a 53 px de distancia, golpe que acierta a 44 px con destello, F1 sin abrir la ayuda del navegador).
- **F1.6 (28 oct)** — Cámara que encuadra a ambos jugadores: `client/src/render/CameraRig.ts` calcula cada frame el rectángulo que contiene a los dos (posiciones interpoladas, `PlayerView.drawnBounds`), le añade margen (`CAMERA_PADDING_X/Y`), elige el zoom que cabe (entre `CAMERA_MIN_ZOOM` 0,75 y `CAMERA_MAX_ZOOM` 1,35) y se mueve con suavizado exponencial (`CAMERA_SMOOTH_MS` 140). Nunca muestra fuera de `CAMERA_BOUNDS`. El HUD va en una segunda cámara fija, así que no se mueve ni hace zoom. Comprobado en el navegador: zoom 1,28 en los spawns, 1,35 juntos, se aleja siguiendo a un jugador que cae (siempre visible) y vuelve suavemente tras la reaparición. **Con esto termina la fase F1.**
- **F1.5 (28 oct)** — Dos jugadores en el mismo teclado. `SPAWNS` (uno por jugador, encima de cada plataforma) sustituye a `SPAWN_P1`; `createWorld()` crea un jugador por spawn y cada uno reaparece en el suyo. Los jugadores se atraviesan. Cliente: interfaz `InputSource`, `CombinedInput` (combina fuentes: un botón cuenta si cualquiera lo pulsa), `P2_BINDINGS` (flechas; esquiva con `-`, `/` o 3 del teclado numérico) y `GamepadInput` opcional (mando 1 → P1, mando 2 → P2; stick o cruceta para moverse, A para saltar, LB/RB/LT/RT para esquivar). P2 se dibuja en azul y el HUD muestra una línea por jugador. Comprobado con script (inputs independientes, se atraviesan, cada uno reaparece en su spawn, determinismo con 2 jugadores) y en el navegador con teclas reales de los dos jugadores y con un mando simulado.
- **F1.4 (26 oct)** — Nuevo input `dodge` (P1: **L** o **Shift**) y `shared/src/sim/dodge.ts`. En el suelo con dirección: **dash** (1000 px/s durante 10 ticks ≈ 167 px; enfriamiento 30 ticks). En el suelo sin dirección: **esquiva en el sitio** (18 ticks, invulnerable). En el aire: **esquiva aérea** en 8 direcciones (750 px/s durante 14 ticks, sin gravedad, invulnerable, una por salto; al acabar conserva el 35 % de la velocidad). Las esquivas tienen un enfriamiento de 54 ticks. Saltar en mitad del dash conserva su velocidad ("dash jump"). Una esquiva aérea hacia abajo termina al aterrizar. Feedback provisional: semitransparente si eres invulnerable, más claro durante el dash. Comprobado con script (23 casos, incluido el determinismo en 3000 pasos) y en el navegador con teclas reales.
- **F1.3 (26 oct)** — Doble salto: `AIR_JUMPS` = 1 salto aéreo (`DOUBLE_JUMP_SPEED` 820, ~140 px), se recarga al aterrizar y se conserva si sales andando de un borde. Caída rápida: mantener S en el aire una vez pasado el punto más alto fija `vy` = `FAST_FALL_SPEED` (1600) hasta aterrizar o hacer el salto aéreo. HUD con saltos aéreos y "FAST FALL". Comprobado con script (altura simple 161 px / doble 294 px, sin tercer salto, S subiendo no hace nada, la caída rápida aterriza en 7 pasos frente a 22) y en el navegador.
- **F1.2 (26 oct)** — Dos plataformas flotantes de un solo sentido (`PLATFORMS` en constantes, `world.platforms`). Se atraviesan saltando desde abajo y se aterriza encima; con S sobre una plataforma la ignoras durante `DROP_THROUGH_TICKS` (12 ticks ≈ 0,2 s) y caes. `Body` gana `onPlatform` y el jugador `dropTicks`. Comprobado con script (subir atravesando, quedarse encima, bajar con S, S en suelo sólido no hace nada, salir por el borde) y en el navegador.
- **F1.1 (26 oct)** — Jugador (cuadrado naranja 40×60) que corre con A/D y salta con W o Espacio. En `shared`: `PlayerInput` (lo único que ve la simulación), `Rect` + `overlaps`, `moveAndCollide` (resuelve X y luego Y contra `world.solids`), `stepPlayer` (aceleración/fricción en suelo y aire, salto con corte si sueltas pronto, gravedad con velocidad máxima de caída). Si caes fuera, reapareces en el spawn (provisional hasta F2.4). Cliente: `KeyboardInput`, `PlayerView` dibujado con interpolación (`alpha`) y HUD con vx/vy/grounded. Comprobado con script (aterrizaje, velocidad máx., frenada, salto ~161 px, salto corto ~42 px, sin rebote al mantener salto, pared lateral, techo, reaparición, determinismo en 2000 pasos) y en el navegador.
- **F0.2 (26 oct)** — `shared/src/constants.ts` (reloj de simulación, tamaño del mundo, suelo). `FixedStepAccumulator` convierte frames de duración variable en pasos fijos de 60 Hz, con tope de 250 ms por frame. `World` mínimo con `tick` y `stepWorld()`. `GameScene` simula con el acumulador, dibuja el suelo y muestra un HUD (FPS, Hz de simulación medidos, tick). Comprobado: 600 pasos en 10 s a 30, 60 y 144 FPS; en el navegador, sim 60.0 Hz.
- **F0.1 (26 oct)** — Monorepo con npm workspaces (`shared`, `client`, `server`). Cliente Vite + Phaser 3 con `GameScene` vacía (1280×720, escala FIT) que importa `GAME_TITLE` de `shared`. Servidor de prueba que corre `.ts` directamente con Node 24. Repo en https://github.com/rigq/brawler.

### Decisiones

- **Phaser 3.90**, no Phaser 4 (npm instala la 4 por defecto): el stack dice Phaser 3 y casi toda la documentación y ejemplos son de la 3.
- **Sin paso de compilación para `shared` ni `server`**: todo el TS es "borrable" (`erasableSyntaxOnly`), Vite lo empaqueta en el cliente y Node 24 lo ejecuta directo en el servidor. Imports relativos con extensión `.ts`. Nada de `enum` ni `namespace`.
- `tsconfig.base.json` común en modo `strict` + `noUncheckedIndexedAccess`; cada paquete extiende y elige sus `lib`/`types` (`shared` sin DOM ni Node, para que no se cuele nada impuro).
- **Unidades del mundo = píxeles del canvas** (1280×720) y segundos. Las velocidades en `constants.ts` serán px/s y se multiplican por `FIXED_DT`.
- **El acumulador no lee ningún reloj**: el cliente le pasa el `delta` de Phaser y el servidor (F3) le pasará el suyo. Así la lógica de `shared` sigue siendo pura.
- **Render interpolado**: cada jugador guarda `prevX/prevY` y el cliente dibuja entre la posición anterior y la actual según `accumulator.alpha`. La física va a 60 Hz pero se ve suave a 144 Hz.
- **Input muestreado una vez por frame de render** y reutilizado para todos los pasos de ese frame. En online (F3) se cambiará por un input por tick.
- **El salto se detecta por flanco** (pulsado ahora y no en el paso anterior, `jumpHeld`): mantener el botón no encadena saltos.
- **Colisión por ejes separados** (primero X, luego Y). Sencillo y sin atravesar nada mientras un paso mueva menos que el alto del jugador más el grosor de la plataforma (60 + 16 px). Lo más rápido ahora es la caída rápida: ~27 px/paso.
- **Caída rápida tipo "snap"**: no acelera poco a poco, salta directamente a 1600 px/s. Se activa solo con `vy ≥ 0`, para que pulsar S mientras subes no corte el salto. Si bajas de una plataforma manteniendo S, entras en caída rápida directamente.
- **Plataformas de un solo sentido**: solo frenan si caes (`vy > 0`) y en el paso anterior tus pies estaban por encima de su borde superior. Están a 130 px del suelo, al alcance de un salto simple (~160 px).
- **Bajar de plataforma = mantener S estando encima.** Por eso la caída rápida de F1.3 (también con S) solo actuará en el aire.
- **Mientras dura un dash o una esquiva, ella controla el movimiento**: no hay carrera, salto normal, bajada de plataforma ni caída rápida. Solo el salto cancela el dash. Estado plano (`dodgeKind`, `dodgeTicks`, `dodgeDirX/Y`…) en lugar de objetos anidados, para que sea fácil de sincronizar en F3.
- **El dash no es invulnerable**; la esquiva en el sitio y la aérea sí (`isInvulnerable()`, que usará el combate en F2).
- **Nada de `Math.hypot`, `Math.sin` ni funciones similares en la simulación**: JS no garantiza el mismo resultado al último decimal en todos los motores (Node y cada navegador), y eso rompería el determinismo online. Las diagonales usan la constante `Math.SQRT1_2`. Sumar, restar, multiplicar, dividir y `Math.sqrt` sí son exactos.
- **Controles (28 oct): cada jugador usa una mitad del teclado.** Revancha: Enter, R o Start (solo con el resultado en pantalla). P1: A/D moverse, W o Espacio saltar, S abajo, **B** o Shift esquivar/dash, **C** ataque ligero, **V** pesado. P2: flechas (↑ también salta), **-** (o `/` en teclado inglés, o 3 del teclado numérico) esquivar, **,** (o 1 del teclado numérico) ligero, **.** (o 2) pesado. Mando: X ligero, B o Y pesado. **F1**: modo debug. La esquiva de P1 pasó de L a B porque, con dos personas en un teclado, la mano izquierda de P2 queda sobre J/K/L.
- **Los jugadores se atraviesan** (no chocan entre sí), como en los brawlers de plataformas. Solo interactuarán con golpes (F2).
- **El mando se combina con el teclado** en vez de sustituirlo: no hace falta ningún menú para elegir. El mando i controla al jugador i. Zona muerta del stick: 0,5 (dato de cliente, no de la simulación, por eso está en `GamepadInput.ts`).
- **La cámara es solo visual** y vive en el cliente: puede usar `Math.exp`, decimales y el tiempo real de render sin romper el determinismo. Sus constantes están en `constants.ts` (sección "Camera", marcada como solo render) para que todo lo ajustable siga en un único sitio.
- **Suavizado exponencial dependiente del tiempo** (`1 - exp(-delta / CAMERA_SMOOTH_MS)`) en lugar de un "lerp 0.1 por frame", que iría el doble de rápido a 120 FPS que a 60.
- **Dos cámaras**: la principal (mundo, sigue y hace zoom) ignora el HUD; la de UI (fija) ignora el mundo. Todo objeto nuevo del mundo debe añadirse a la lista que ignora la cámara de UI, y todo objeto de UI a la que ignora la principal.
- **Golpes en dos fases** (`resolveHits`): primero se buscan todos los golpes del tick y después se aplican. Así el resultado no depende de qué jugador se procesa primero, y si ambos aciertan a la vez, los dos golpes cuentan.
- **Hurtbox = caja del cuerpo** por ahora (`hurtbox()`); F4 podrá definir hurtboxes por personaje.
- **Atacar compromete**: sin salto, esquiva ni giro hasta que acaba la recuperación. Solo se puede elegir dirección al empezar.
- **La carga no cambia el alcance ni la velocidad del pesado**, solo cuánto has cargado (`attackChargeTicks`), que F2.3 usará para escalar daño y knockback. Mantener cargado es un riesgo: eres vulnerable y el rival te ve venir.
- **Fórmula de knockback lineal**: `velocidad = kbBase + kbScale × daño_tras_el_golpe`. Sencilla de razonar y de ajustar; en F4 el peso del personaje la dividirá. A 0 % un ligero lanza a ~360 px/s; a 100 %, a ~1060 px/s.
- **Dirección de knockback como vector (x, y), no como ángulo**: `Math.sin` y `Math.cos` no son deterministas entre motores. Se normaliza con `Math.sqrt`, que sí lo es. La x apunta siempre "lejos del atacante" (según los centros), así un golpe por detrás empuja hacia atrás.
- **Los golpes guardan una "foto" del ataque** (`AttackSnapshot`) en el momento de detectarse. Así, en un intercambio, el segundo golpe se aplica aunque el primero ya haya cancelado el ataque de quien lo dio.
- **Recibir un golpe devuelve el salto y la esquiva aéreos**: siempre tienes opción de volver al escenario.
- **"Activo" (`isActive`) = tiene vidas y no está esperando a reaparecer.** Solo los jugadores activos se simulan, golpean, reciben golpes, se dibujan y salen en cámara. Mientras espera, el jugador conserva su posición de KO; `teleportPlayer` lo lleva al spawn al reaparecer.
- **La invulnerabilidad al reaparecer se pierde al atacar**, para que sirva para volver a la pelea y no para atacar sin riesgo. Esquivar no la quita.
- **Datos de ataque en `constants.ts`** hasta F4.1, cuando pasarán a los archivos de cada personaje.
- **El overlay de F1 dibuja la posición de la simulación** (sin interpolar), para que lo que ves sea exactamente lo que se comprueba. A más de 60 FPS puede ir 1 frame por detrás del cuerpo dibujado.
- En desarrollo, `__world` y `__game` están en la consola del navegador para inspeccionar el estado.
- Dependencias: `typescript` (raíz), `phaser` + `vite` (cliente), `@types/node` (servidor, solo tipos).
- Fecha del MVP: **14 de marzo de 2027** (la de CLAUDE.md manda si hay discrepancia).
- `CLAUDE.md` vive en la raíz del repo; `docs/NOTAS.md` guarda estado y planning.

### Bugs conocidos

- `npm run build` avisa de que el bundle pesa ~1,2 MB (casi todo es Phaser). No es un fallo; se mira en F5 si hace falta.
- **El mando llega 1 frame tarde (~16 ms)**: Phaser actualiza el estado del mando después de que `GameScene.update` lea los controles. El teclado no tiene este retraso. Es imperceptible; se puede corregir leyendo el mando en el evento `preupdate` de la escena si alguna vez molesta.
- **El mando no se ha probado con uno físico**, solo simulado desde la consola. Probar con un mando real cuando haya uno a mano.

### Siguiente tarea

- Pendiente de F1: validar su criterio ("moverte 5 minutos seguidos es divertido sin pegarse") jugando a dos.
- Validar el hito de F2 ("una partida 1v1 local completa con alguien de clase, y quiere repetir") y el criterio de F1 (moverse es divertido). Ajustar constantes según lo que se note.
- F3.1 Servidor Colyseus con una sala; dos navegadores ven el mismo mapa. **Necesita aprobar dependencias nuevas**: `colyseus` (servidor) y `colyseus.js` (cliente). Ojo: `@colyseus/schema` suele usarse con decoradores (`@type`), que **no son TypeScript "borrable"** y Node no puede ejecutarlos sin compilar. Usar la forma sin decoradores (`defineTypes`/`schema()`), o añadir un paso de build al servidor.

### Pendientes v2

Ideas que surgen durante las sesiones y quedan fuera de la tarea actual o del MVP.

- (F5) Separar Phaser en su propio chunk para quitar el aviso de tamaño del build.
- (F1, si el control se siente duro) "Coyote time" (poder saltar unos frames después de salir del borde) y "jump buffer" (recordar el salto pulsado justo antes de tocar suelo).
- Convertir los scripts de prueba de la física (hasta ahora temporales) en tests de verdad con `node:test`, que viene con Node 24 y no añade dependencias: `npm test` en `shared`. Sirve para detectar regresiones cuando se ajusten las constantes.
- (F5 o después del lanzamiento) **Versión de escritorio (.exe)** empaquetando el cliente web, sin reescribir el juego. Opción preferida: **Tauri** (~5–10 MB, usa el WebView2 de Windows); alternativa: Electron (~100 MB). Son dependencias nuevas: preguntar antes. Para no tener que firmar el ejecutable, publicar en **itch.io** la versión web jugable más la descarga. Decidido el 28 oct: la web sigue siendo la versión principal (portfolio, cero instalación, encaja con DAW).

---

## Resumen y alcance

Objetivo: un brawler 2D estilo Brawlhalla, jugable en el navegador y online 1v1 con amigos, con personajes de clase. MVP público antes del 15 de marzo de 2027, para enseñarlo en las prácticas. Ritmo previsto: unas 5 h/semana en 2 sesiones de 2–2,5 h.

**Entra en el MVP**

- Movimiento: correr, saltar, doble salto, dash, esquiva, caída rápida.
- Combate: ataque ligero y pesado en 3 direcciones, daño acumulado que aumenta el knockback, 3 vidas por jugador.
- 1 mapa con plataforma principal y 2 flotantes.
- 4 personajes de clase con stats y 1 especial cada uno.
- Online 1v1 por salas con código, y modo local 2 jugadores en un teclado.
- Menú, selección de personaje y pantalla de resultado.

**Queda fuera (v2, si apetece)**

- Armas que se recogen del suelo, 2v2 y 4 jugadores, matchmaking aleatorio, ranking, cuentas de usuario, rollback netcode, móvil.

**Regla de oro:** nada de arte bonito hasta que el 1v1 local con cuadrados se sienta bien.

## Stack y arquitectura

Todo en TypeScript, en un solo repositorio con tres paquetes: cliente, servidor y lógica compartida. La lógica de físicas y combate va en `shared` para que cliente y servidor calculen exactamente lo mismo.

| Pieza | Tecnología | Por qué |
| --- | --- | --- |
| Juego (cliente) | Phaser 3 + TypeScript + Vite | Sprites, input y bucle de juego resueltos; recarga al instante |
| Físicas | Propias, en `shared` | Arcade de Phaser no es determinista; para online hace falta tu propio paso fijo a 60 Hz |
| Servidor de salas | Colyseus (Node.js) | Salas, códigos de sala y sincronización de estado listos |
| Red | WebSocket (lo trae Colyseus) | Suficiente para 1v1 en España |
| Hosting cliente | Netlify o Vercel | Gratis |
| Hosting servidor | Fly.io o VPS Hetzner | 0–6 €/mes |
| Control de versiones | Git + GitHub | Commit por tarea; el repo es parte del portfolio |

**Modelo de red:** el servidor manda (autoritativo) y simula a 60 Hz. Cada cliente envía solo sus inputs. El cliente predice su propio personaje y corrige si el servidor dice otra cosa. El rival se dibuja con unos 100 ms de interpolación.

**Estructura del repo**

```
brawler/
  packages/
    shared/    # constantes, físicas, combate, tipos de input
    client/    # Phaser: escenas, sprites, input, red
    server/    # Colyseus: salas, bucle autoritativo
  docs/
    NOTAS.md   # contexto para Claude y decisiones tomadas
```

## Cómo trabajar con Claude

Una sesión = una tarea de la sección de fases. Claude escribe y cambia el código directamente en la carpeta del proyecto. Tú pruebas en el navegador y decides.

**Preparación (una vez)**

1. Crea la carpeta `brawler` en tu ordenador.
2. En la app de escritorio de Claude, conéctala con "Añadir carpeta" del menú "+".
3. Pega este planning en `docs/NOTAS.md` o enlázalo, para que cada sesión arranque con contexto.

**Prompt de inicio de sesión**

```
Proyecto brawler (lee docs/NOTAS.md).
Hoy: tarea [F1.3 — doble salto y caída rápida].
Hecho cuando: [criterio de la tarea].
Antes de tocar código, dime en 3 líneas qué vas a cambiar.
Al acabar: cómo lo pruebo, y actualiza NOTAS.md.
```

**Prompt de cierre**

```
Resume en NOTAS.md: qué se hizo, decisiones, bugs conocidos,
y la siguiente tarea. Propón el mensaje de commit.
```

**Reglas**

- Una tarea por sesión. Si surge otra cosa, va a NOTAS.md como pendiente.
- Pruebas en el navegador antes de cerrar. Si no funciona, no se marca.
- Commit al final de cada tarea.
- Pide que te explique 1 cosa nueva por sesión (netcode, físicas…). Es lo que luego cuentas en la entrevista de prácticas.
- Los números del juego (velocidad, gravedad, knockback) viven en un solo archivo de constantes, para ajustarlos sin tocar código.

## Calendario

Empiezas el 2 de noviembre; el 1v1 local tiene que estar jugable el 13 de diciembre y el lanzamiento público el 14 de marzo.

&#91;embedded content: calendario · 6 fases y 2 hitos\]

Las tres semanas de Navidad son colchón: absorben exámenes y retrasos sin mover la fecha final. Si una fase se pasa más de una semana, se recorta alcance, no sueño.

## Fases y tareas

Cada tarea cabe en una sesión de 2–2,5 h. Cada fase termina con un criterio de hecho; si no se cumple, no se pasa a la siguiente.

### F0 · Setup (1 semana)

- [ ] F0.1 Repo en GitHub con los tres paquetes, Vite + Phaser arrancando una escena vacía.
- [ ] F0.2 Archivo de constantes, bucle de paso fijo a 60 Hz en `shared`, NOTAS.md inicial.

Hecho cuando: `npm run dev` abre una pantalla con un suelo y un FPS visible.

### F1 · Movimiento local (3 semanas)

- [ ] F1.1 Cuadrado que corre y salta, colisión con el suelo.
- [ ] F1.2 Plataformas flotantes atravesables desde abajo y bajada con flecha abajo.
- [ ] F1.3 Doble salto y caída rápida.
- [ ] F1.4 Dash en el suelo y esquiva en el aire (con enfriamiento).
- [ ] F1.5 Segundo jugador en el mismo teclado (WASD y flechas) y mando opcional.
- [ ] F1.6 Cámara que encuadra a los dos jugadores.

Hecho cuando: moverte 5 minutos seguidos es divertido sin pegarse.

### F2 · Combate local (2 semanas)

- [ ] F2.1 Hitboxes y hurtboxes; ataque ligero en 3 direcciones.
- [ ] F2.2 Ataque pesado con carga corta y más alcance.
- [ ] F2.3 Daño acumulado y knockback que crece con el daño; hitstun.
- [ ] F2.4 Zona de muerte, 3 vidas, reaparición con invulnerabilidad breve.
- [ ] F2.5 Pantalla de victoria y revancha.

Hecho cuando: una partida 1v1 local completa con alguien de clase, y quiere repetir.

### F3 · Online 1v1 (4 semanas)

- [ ] F3.1 Servidor Colyseus con una sala; dos navegadores ven el mismo mapa.
- [ ] F3.2 Los clientes envían inputs; el servidor simula con la lógica de `shared` y difunde el estado.
- [ ] F3.3 Predicción del jugador propio y corrección suave.
- [ ] F3.4 Interpolación del rival a unos 100 ms.
- [ ] F3.5 Crear sala con código de 4 letras y unirse; gestión de desconexión.
- [ ] F3.6 Desplegar servidor y cliente; prueba con alguien en otra casa.
- [ ] F3.7 Medir ping en pantalla y ajustar.

Hecho cuando: una partida online entera sin teletransportes visibles.

### F4 · Personajes de clase (3 semanas)

- [ ] F4.1 Sistema de personajes por datos (un archivo por personaje).
- [ ] F4.2 Personajes 1 y 2 con stats y especial.
- [ ] F4.3 Personajes 3 y 4.
- [ ] F4.4 Sprites y animaciones básicas (IA o pixel art), sustituyendo cuadrados.
- [ ] F4.5 Pantalla de selección de personaje.

Hecho cuando: 4 personajes con estilos de juego claramente distintos.

### F5 · Pulido y lanzamiento (3 semanas)

- [ ] F5.1 Menú principal, sonidos de golpe y música.
- [ ] F5.2 Efectos: temblor de pantalla, partículas, pausa de impacto.
- [ ] F5.3 Ronda de pruebas con 6–8 compañeros y lista de fallos.
- [ ] F5.4 Corregir los 5 fallos más votados.
- [ ] F5.5 README con GIF, enlace jugable en el portfolio, vídeo corto.

Hecho cuando: enlace público que funciona y está en tu portfolio.

## Personajes de clase

Cada personaje es un archivo de datos con estos campos; el estilo de juego sale de combinar stats, no de código nuevo. Rellena la tabla con 4 compañeros (con su permiso si el juego será público).

| Personaje | Arquetipo | Velocidad (1–5) | Peso (1–5) | Daño (1–5) | Alcance (1–5) | Especial | Inspirado en |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ejemplo: "El Becario" | Rápido y ligero | 5 | 1 | 2 | 2 | Dash doble que atraviesa al rival | — |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |

Arquetipos que cubren bien un plantel de 4: rápido y ligero, tanque pesado, zona a distancia y equilibrado. Los puntos de cada personaje deberían sumar parecido (unos 12) para que nadie quede roto.

## Riesgos, costes y seguimiento

Coste total estimado hasta el lanzamiento: 0–25 € (servidor unos meses y, opcional, un dominio).

| Riesgo | Señal | Qué hacer |
| --- | --- | --- |
| El online se atasca | F3 pasa de 5 semanas | Dejar el modo local como versión pública y seguir con F4 |
| Alcance que crece | Tareas nuevas que no están en este plan | Apuntarlas en NOTAS.md como v2, no hacerlas |
| Compite con proyectos que dan dinero | Dos semanas seguidas sin sesión, o quitando horas de clientes | Bajar a 1 sesión/semana y mover la fecha, no forzar |
| Uso de caras de compañeros | Juego público | Pedir permiso por escrito (un mensaje vale) |
| Assets con copyright | Sprites, sonidos o nombres de Brawlhalla | Solo mecánicas propias; assets propios o con licencia libre |

**Revisión de los domingos (5 minutos)**

- [ ] ¿Cuántas sesiones hice esta semana? Objetivo: 2.
- [ ] ¿Qué tareas quedaron marcadas?
- [ ] ¿Voy en fecha con la fase actual?
- [ ] ¿Qué tarea toca en la próxima sesión?
