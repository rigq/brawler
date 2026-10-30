# Planning — Brawler web online

Oct 26, 2026 · @Fabrizio Riga

## Estado del proyecto

Se actualiza al cerrar cada sesión. Lo más reciente, arriba.

### Hecho

- **P1 Personajes por datos (30 oct)** — `shared/src/characters/`: un archivo por personaje con stats de 1 a 5 (velocidad, peso, daño, alcance; suman 12) y `attacks` para cambiar ataques concretos. `buildCharacter` los convierte en números: la velocidad multiplica carrera y dash, el daño y el alcance se aplican a toda la tabla, y el alcance estira la hitbox desde el centro del cuerpo. `Player` gana `characterId` y `attackData(player, id)` lee el ataque del personaje. Knockback con la fórmula del plan: `(kbBase + kbScale × p × d / 10) × 100 / peso`; los `kbScale` se convirtieron para mantener el ajuste. Cuatro personajes **provisionales**, uno por arquetipo: `balanced` (3-3-3-3), `rushdown` (5-1-3-3), `heavy` (1-5-4-2) y `zoner` (3-2-3-4). `?p1=heavy&p2=rushdown` los elige en local. Con `balanced` no cambia nada: regresiones, combos y KO iguales. Comprobado con scripts, navegador y sala online (59 campos sincronizados). Medido con el rival-bot, pesado cargado desde el borde: KO a 25 % `rushdown`, 30 % `zoner`, 45 % `balanced`, 55 % `heavy`.
- **E3 Agarre al borde (30 oct)** — `sim/ledge.ts`. Caer junto al borde de un sólido te cuelga automáticamente (`LEDGE_GRAB_*`), salvo en hitstun o manteniendo abajo o la dirección contraria al escenario. Devuelve saltos, esquiva y recovery, y da `LEDGE_INVULN_TICKS` de invulnerabilidad una sola vez hasta tocar suelo. Opciones (pulsación nueva): hacia el escenario sube (con 8 ticks de lag), salto salta (`fullJump`: nunca se recorta), J/K suben atacando, L rueda hacia dentro, abajo o alejarse suelta (`LEDGE_REGRAB_TICKS` sin poder reagarrarse). A los 4 s te sueltas solo. 27 pruebas por script y navegador.
- **E2 Agarre y lanzamientos (30 oct)** — `combat/grabs.ts`. L + J en el suelo, o J con el escudo levantado, es `grab`: atraviesa el escudo, no hace daño y falla caro (32 ticks). Cualquier golpe sobre el agarrador en ese tick lo cancela, incluido otro agarre. Mientras sujetas (`GRAB_HOLD_TICKS`, 1,5 s) una dirección lanza hacia ahí y J lanza adelante: `throwForward` (8 %, sube, permite perseguir) y `throwBack` (10 %, más plano y fuerte). Si no eliges, sueltas y te quedas `GRAB_RELEASE_LAG_TICKS` sin actuar. 16 pruebas por script y navegador.
- **E1 Escudo, rodar y dash con doble toque (30 oct)** — `sim/shield.ts`. L mantenido en el suelo levanta el escudo: bloquea todo sin daño ni lanzamiento, se gasta con el tiempo (5,5 s) y con cada golpe (`SHIELD_DAMAGE_MULT`), te empuja y te deja unos ticks atascado. Si se rompe, 2,5 s aturdido (destello blanco) y vuelve al 40 %. Se regenera bajado. Salir cuesta `SHIELD_DROP_LAG_TICKS`, salvo saltando. Con escudo: lado = rodar (173 px, invulnerable menos los 5 últimos ticks), abajo = esquiva en el sitio. L + dirección desde parado rueda directamente. El **dash pasa a doble toque** de dirección (`DASH_TAP_WINDOW_TICKS`). L en el aire sigue siendo la esquiva aérea. `landingLagTicks` pasa a llamarse `lagTicks` y `PlayerView` dibuja el escudo como una burbuja que encoge. Tecla **8** en entrenamiento: el muñeco se cubre. 28 pruebas por script, navegador y una sala online real (el servidor procesa el escudo y sincroniza los campos nuevos; solo con un cliente conectado).
- **C4 Coyote time, jump buffer y aterrizaje de esquiva (30 oct)** — Cierra el bloque C. `coyoteTicks`: tras salir del suelo, el salto de suelo sigue disponible 5 ticks en el aire (`COYOTE_TICKS`) y no gasta salto aéreo; bajar de una plataforma con S y recibir un golpe lo anulan. `jumpBufferTicks`: un salto pulsado hasta 6 ticks antes de poder saltar en el suelo (`JUMP_BUFFER_TICKS`) sale en cuanto se puede, también tras un lag o un ataque; si ya soltaste, sale salto corto. Aterrizar durante la esquiva aérea deja `AIR_DODGE_LANDING_LAG` (10) ticks sin actuar, con el mismo `landingLagTicks` de los aéreos. Comprobado con 14 pruebas por script y en el navegador (lag de 10 ticks y salto después). Sin regresiones en combos, % de KO ni jab.
- **C3 Ajuste de hitstun y combos (30 oct)** — Antes ningún golpe enlazaba con otro. Cambios: hitstun `16 + velocidad × 0.006` (antes `6 + × 0.012`), `lightUp` con 7 ticks de recuperación y `lightDown` con 8, y lag de aterrizaje de aéreos a 4–6 (`airDown` 10). Protección antiinfinitos: `comboHits` en `Player`; cada golpe ya recibido en el combo quita `HITSTUN_COMBO_DECAY_TICKS` (2) de hitstun, con mínimo `HITSTUN_MIN_TICKS` (6). Medido con un buscador de combos que prueba tiempos, saltos y persecución: con golpes ligeros hay enlaces a 0–60 %; a 90 % solo desde `lightDown`; a 120 % o más, ninguno. Los pesados, `jab3` y el ataque en carrera no enlazan a nada: son remates. Repetir un mismo golpe da como mucho 4 aciertos (jab incluido). Los % de KO no cambian respecto al commit anterior, medidos con el mismo rival. El jab sigue siendo 3/3 a 0, 60 y 120 %. Comprobado con scripts y en el navegador (`lightUp` deja 18 ticks de hitstun).
- **C2 Aéreos propios (30 oct)** — J en el aire usa 5 ataques nuevos en `ATTACKS`: `airNeutral` (rápido y largo, alrededor del cuerpo), `airForward` (alcance), `airBack` (el más fuerte de los laterales), `airUp` (malabares) y `airDown` (spike lento que lanza hacia abajo). Adelante y atrás dependen de hacia dónde miras. Tocar suelo durante un aéreo lo corta y deja `landingLag` ticks sin poder actuar (6–12; campo `landingLagTicks` en `Player`, visible como `LAG` en el HUD de depuración). Comprobado con scripts (cada aéreo acierta y lanza en su dirección, también mirando a la izquierda; el spike lanza hacia abajo; el lag bloquea el salto) y en el navegador (`airForward` y lag de 9).
- **C1 Jab en cadena y ataque en carrera (29 oct)** — Los ataques pasan a una sola tabla `ATTACKS` con id (`jab1`–`jab3`, `dash`, `lightSide/Up/Down`, `heavySide/Up/Down`) y tipo `AttackData` (con `heavy` para los cargables). `Player` cambia `attackDir`/`attackStrength` por `attackId` y gana `attackQueued`. **Jab**: J sin dirección en el suelo; volver a pulsar J durante el golpe encadena `chainTo` a partir de `chainFrom` (jab1 → jab2 → jab3, 3+3+5 = 11 %). Knockback bajo y constante (kbScale 1) para que sea combo real a cualquier %: medido 3/3 golpes a 0, 60 y 120 %. **Ataque en carrera** (`dash`): J durante un dash; conserva la velocidad del dash y patina frenando (`DASH_ATTACK_FRICTION`, ~170 px), lanza hacia arriba y tiene 20 ticks de recuperación (castigable si falla). El inicio del ataque ya termina el dash él mismo (`startAttack` → `endDodge`). Comprobado con scripts y en el navegador (modo entrenamiento: "3 golpes · 11 %").
- **G3 Modo entrenamiento (29 oct)** — `?training` en la URL. `GameScene` recibe un modo (`'versus' | 'training'`); en entrenamiento, `TrainingMode` ajusta el mundo entre pasos sin tocar la simulación: P2 es un muñeco sin input, vidas infinitas (nunca sale la pantalla de victoria), **R** reinicia, **9 / 0** quitan/ponen 10 % al muñeco. `ComboTracker` cuenta combos reales: un golpe alarga el combo solo si el muñeco seguía en hitstun o hitstop al empezar ese tick. `TrainingHud` (arriba a la derecha) muestra el combo actual (atenuado cuando termina), el mejor y las teclas. `HitEffects` ahora exige el destello de golpe, así cambiar el % con 9/0 no saca chispas. Comprobado con scripts (el contador sube con hitstun largo forzado) y en el navegador.
- **G2 Temblor, chispas y estela (29 oct)** — `render/HitEffects.ts` detecta los golpes viendo subir el % de cada jugador (vale igual en local y online) y dibuja chispas (rayos y un anillo, en mezcla aditiva, más grandes cuanto más daño) en el lado por el que llegó el golpe, y una estela de "fantasmas" del color del jugador mientras vuela en hitstun a más de `TRAIL_MIN_SPEED`. `MatchView` hace temblar solo la cámara del mundo (la de UI no) durante el hitstop + `SHAKE_EXTRA_MS`, con intensidad según el daño. La víctima vibra ±`HITSTOP_JITTER_PX` mientras está congelada. Números en `constants.ts` (sección "Hit effects", solo render). Comprobado en el navegador avanzando el juego fotograma a fotograma.
- **G1 Hitstop (29 oct)** — Al conectar un golpe, atacante y víctima se congelan `HITSTOP_BASE_TICKS + daño × HITSTOP_TICKS_PER_DAMAGE` ticks (tope `HITSTOP_MAX_TICKS`): jab 5 ticks (~83 ms), pesado sin cargar 7, pesado cargado 9. Campo `hitstopTicks` en `Player`; `stepPlayer` no avanza nada mientras dura (posición, velocidad, fases del ataque, hitstun) y el lanzamiento sale después con la velocidad guardada. Sincronizado en online automáticamente (`PLAYER_FIELDS`) y respetado por el `Predictor`. Comprobado con script (ligero y pesado: la víctima no se mueve durante la pausa y luego sale con la misma velocidad) y en el navegador.
- **Más espacio para volver y golpes menos letales (28 oct)**. Primero se ensanchó la isla a 1800 px por un malentendido; se deshizo: la isla vuelve a ser la de 1200 px con 3 plataformas. Lo que se pedía era que "de un puñetazo tengas más espacio para volver". Medido antes de cambiar: un pesado cargado junto al borde mataba al **60 %** y uno sin cargar al **90 %**, y por encima de ~600 px de vuelo la víctima no podía volver (caía por abajo) aunque usara saltos, esquiva y recovery. Cambios: **zonas de muerte** a 1000 px de cada lado (x -960–2240), 1100 px sobre el suelo y 760 por debajo (antes 600 / ~1080 / 460); **vuelo más corto**: `HITSTUN_DRAG` 900 → 1500 y `kbScale` de los pesados 13/12/12 → 10/9/9; cámara: `CAMERA_MIN_ZOOM` 0,45 y límites 3200 × 2060. Resultado medido (sin KO, la víctima siempre vuelve): junto al borde, pesado cargado mata desde el **90 %**, sin cargar desde el **150 %**, el ligero nunca; desde el centro, cargado desde el **150 %** y sin cargar no mata ni al 180 %. La decoración ya escala con el ancho de la isla (profundidad de la roca, número de piedras; faroles en los extremos).
- **Mapa más grande y con diseño: "templo flotante de noche" (28 oct)**, a petición de Riga (adelanta un poco de arte respecto al plan, pero sin imágenes: todo son formas dibujadas con código). Geometría en `constants.ts`: isla de 1200 px centrada en x = 640, dos plataformas laterales a 140 px del suelo y una central 130 px más arriba (todas a un salto), spawns sobre las laterales, zonas de muerte a 600 px de cada borde, `CAMERA_MIN_ZOOM` 0,6 y límites de cámara más amplios. Visual (`client/render`): `Backdrop.ts` (cielo con degradado, ~140 estrellas, luna con halo, resplandor de horizonte y dos capas de montañas con parallax gracias a `scrollFactor`), `StageView.ts` (isla con hierba, piedras y parte inferior de roca acabada en punta; plataformas de madera con juntas y cuerdas; dos faroles con brillo en mezcla aditiva) y colores del tema en `palette.ts` (`THEME`). Decoración con semilla fija (`seededRandom`): se ve igual en cada carga. Comprobado con script (spawns sobre las plataformas, subir del suelo a una lateral y de ahí a la central con un salto, bajar con S, caerse por el borde cuesta una vida) y en el navegador (vista normal y alejada a zoom 0,63).
- **Ajustes tras el primer playtest (28 oct)**, a propuesta de un amigo experto en Brawlhalla: (1) **atacar en movimiento**: en el suelo sigues corriendo al 70 % (`ATTACK_MOVE_SPEED_MULT`) mientras atacas o cargas, sin poder girarte; y atacar durante un dash lo corta y conserva su impulso (dash-attack). (2) **Recovery más fácil**: `AIR_JUMPS` pasa de 1 a 2, y el **pesado hacia arriba en el aire es la "recovery"**: impulso de `RECOVERY_SPEED` (≈ 250 px) una vez por cada vez en el aire, que se recarga al aterrizar o al recibir un golpe (`recoveryAvailable`). Los pesados en el aire salen sin carga. (3) **Controles de P1: J ligero, K pesado, L esquivar**; C/V/B/Shift siguen valiendo para jugar dos en un teclado. Además, `npm run dev` usa `vite --host` para poder jugar en red local. Comprobado con scripts (atacar corriendo, cargar andando sin girarse, dash-attack, 2 saltos aéreos, recovery de ~243 px solo una vez por cada vez en el aire, pesado en el suelo que sigue cargando, determinismo) y en el navegador (J/K/L y dash-attack). Las pruebas antiguas que fallan son justo las de las reglas cambiadas (1 salto aéreo, frenar al atacar).
- **F3.5 (28 oct)** — Salas con código de 4 letras y gestión de desconexiones. Servidor: el `roomId` es un código de 4 letras sin I, L ni O (`rooms/roomCodes.ts`, únicos en el proceso) y la sala es privada (solo se entra con el código). Fases (`phase`): **waiting** (menos de 2 jugadores; calentamiento con vidas infinitas) → **playing** (empieza al sentarse el segundo, con jugadores nuevos y el `tick` siguiendo) → **over** (`winner`, `endReason` `ko`/`forfeit`) → **playing** otra vez cuando los dos piden revancha (mensaje `rematch`, `rematchVotes`). Si un jugador se cae (`onDrop`), la partida se **pausa** y se le guarda el sitio `RECONNECT_GRACE_SECONDS` (20 s, `allowReconnection`, `away[slot]`); si vuelve (`onReconnect`) sigue; si no (`onLeave`), el otro gana por abandono y la sala espera a otro rival con el mismo código. Cliente: **`?online`** crea una sala y pone el código en la barra de direcciones; **`?online=ABCD`** se une (acepta minúsculas); mensajes de código no válido, sala inexistente o llena, "Esperando rival… comparte el código o este enlace", "El rival se ha desconectado. Esperando a que vuelva…", "Conexión perdida. Reconectando…" (el SDK reconecta solo) y "Desconectado". Mientras la partida está pausada, el cliente no envía inputs ni predice. El resultado online lo decide el servidor (`MatchView.render` acepta `result`), con aviso de revancha según los votos ("¡Tu rival quiere la revancha!", "Esperando al rival…") o "El rival se ha ido". Comprobado con clientes de Node (crear y unirse por código, código inexistente, caída con reconexión automática y pausa, fin por KOs, revancha con un voto que no basta y dos que sí, abandono tras los 20 s, nuevo rival con el mismo código) y en el navegador (código en la URL, resultado y revancha contra un cliente de Node, códigos erróneos, "Reconectando…" al parar el servidor).
- **F3.4 (28 oct)** — Interpolación del rival a ~100 ms. `client/src/net/ServerClock.ts` estima el tick actual del servidor como un número continuo: avanza con el tiempo local y se acerca un 10 % (`SERVER_CLOCK_CORRECTION`) a cada tick recibido, o salta si se desvía más de `SERVER_CLOCK_SNAP_TICKS`. `client/src/net/SnapshotBuffer.ts` guarda ~1 s de estados (`SNAPSHOT_BUFFER_MS`) y dibuja a los demás jugadores en "tick estimado − `INTERP_DELAY_MS` (100 ms)": todos los campos del estado anterior y x/y mezclados hacia el siguiente. Sin extrapolar (si falta el siguiente, se mantiene el último) y sin mezclar teletransportes (> 160 px: reaparición). Tu jugador sigue predicho (F3.3). Comprobado con un script (estados a 30 Hz con 50 ms ± 15 ms de llegada, render a 144 Hz): sin interpolar el rival se congela en 912 frames y salta 10 px; con interpolación, 0 frames congelados y pasos uniformes (desviación 0,12 px), unos 146 ms por detrás; las reapariciones saltan sin estela. En el navegador, con un cliente de Node moviendo al rival: el estado crudo cambia solo en 157 de 354 frames, el interpolado se mueve en todos salvo en los cambios de sentido.
- **F3.3 (28 oct)** — Predicción del jugador propio y corrección suave. Servidor: el estado lleva `acks[slot]`, el último `seq` de input procesado de cada jugador. Cliente: `net/Predictor.ts` aplica cada input propio en local al instante (`stepPlayer`) y lo guarda como pendiente; al llegar un estado nuevo, copia el jugador del servidor, descarta los inputs con `seq ≤ ack` y vuelve a aplicar los pendientes. `net/Smoother.ts` dibuja la diferencia de una corrección como un desplazamiento que se desvanece (`RECONCILE_SMOOTH_MS` 80) o salta directamente si supera `RECONCILE_SNAP_DISTANCE` (160 px: KO, reaparición, golpe fuerte). El rival se dibuja tal cual lo manda el servidor (F3.4 lo suavizará). Herramienta de desarrollo: **`?online&lag=150`** retrasa los mensajes salientes 150 ms (`net/FakeLag.ts`; ignorada en producción). Comprobado con un script con servidor y red simulados (10 ticks de retraso por sentido): sin sorpresas, la predicción coincide con el servidor al píxel (0 px de corrección); un golpe imprevisto produce una corrección y después vuelve a ser exacta; ~21 inputs pendientes = un viaje de ida y vuelta. En el navegador con 150 ms de lag: tu jugador se mueve 2 frames después de pulsar mientras el servidor aún no; al soltar, predicción y servidor coinciden exactamente.
- **F3.2 (28 oct)** — Los clientes envían inputs y el servidor simula y difunde el estado. Cliente: en cada tick de 60 Hz (mismo `FixedStepAccumulator` que el servidor) envía un mensaje `input` con `{ seq, input }`; online controlas un jugador con cualquier mitad del teclado o el primer mando. Servidor (`MatchRoom`): valida cada mensaje (`parseInputMessage`: lo que no sea `true` cuenta como no pulsado), lo encola por jugador (`InputQueue`, descarta duplicados y guarda como mucho `INPUT_BUFFER_MAX`), ejecuta `stepWorld` de `shared` a 60 Hz con un input por jugador y tick, y copia el `World` al estado sincronizado, que Colyseus envía a 30 Hz (`PATCH_RATE_HZ`). El estado lleva **todos** los campos de cada `Player` (esquema generado a partir de `createPlayer`, así nunca se desincronizan), el `tick` y los asientos (`seats`). Límite de `MAX_MESSAGES_PER_SECOND` (120) por cliente. Si un cliente deja de enviar, su último input se repite solo `INPUT_HOLD_MAX_TICKS` (10) y luego cuenta como nada pulsado. Quien ocupa un hueco empieza de cero. Cliente: `MatchView` (sacado de `GameScene`) dibuja cualquier `World`; la partida local la usa con su simulación y la online con un `World` espejo que copia el estado del servidor cada frame. Comprobado con un script de Node que hace de dos clientes (misma sala, servidor a 59,8 Hz, patches a ~28 Hz, solo se mueve quien pulsa, los dos clientes ven el mismo estado, mensajes basura ignorados, cliente silencioso que se para, hueco reutilizado que empieza limpio) y en el navegador con dos pestañas (P1 se mueve en una y la otra lo ve en el mismo tick). Modo local comprobado tras la refactorización.
- **F3.1 (28 oct)** — Servidor Colyseus con una sala; dos navegadores ven el mismo mapa. Dependencias nuevas (aprobadas): servidor `@colyseus/core`, `@colyseus/ws-transport`, `@colyseus/schema` (0.18 / schema 5); cliente `@colyseus/sdk` (0.18, sucesor de `colyseus.js`). Servidor: `MatchState` con `schema()` + `t.*` (sin decoradores, así Node lo sigue ejecutando sin compilar), `MatchRoom` con 2 plazas que asigna el hueco libre más bajo (P1/P2) y coloca a cada jugador en su spawn, y `index.ts` escuchando en `SERVER_PORT` (2567). `shared/src/net/protocol.ts`: nombre de la sala (`MATCH_ROOM`) y forma del estado de red (`NetPlayer`, `NetMatchState`), solo tipos. Cliente: con **`?online`** en la URL se abre `OnlineScene`, que se conecta (al mismo host que la página, o `VITE_SERVER_URL`), entra en la sala, dibuja el escenario desde `shared` y los jugadores desde el estado sincronizado (el propio, con borde blanco) y muestra "Sala X · Eres Pn · Jugadores n/2". El escenario se dibuja con `drawStage` (compartido con la partida local) y los colores están en `render/palette.ts`. Comprobado con dos pestañas: misma sala, cada una ve "Eres P1"/"Eres P2"; al cerrar una y abrir otra, el hueco se reutiliza; sin servidor, aparece el mensaje de error.
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
- **Controles (28 oct): cada jugador usa una mitad del teclado.** Revancha: Enter, R o Start (solo con el resultado en pantalla). P1: A/D moverse, W o Espacio saltar, S abajo, **J** (o C) ataque ligero, **K** (o V) pesado, **L** (o B, Shift) esquivar/dash. C/V/B existen para cuando dos comparten teclado (J/K/L quedan bajo la mano de P2). P2: flechas (↑ también salta), **-** (o `/` en teclado inglés, o 3 del teclado numérico) esquivar, **,** (o 1 del teclado numérico) ligero, **.** (o 2) pesado. Mando: X ligero, B o Y pesado. **F1**: modo debug. La esquiva de P1 pasó de L a B porque, con dos personas en un teclado, la mano izquierda de P2 queda sobre J/K/L.
- **Los jugadores se atraviesan** (no chocan entre sí), como en los brawlers de plataformas. Solo interactuarán con golpes (F2).
- **El mando se combina con el teclado** en vez de sustituirlo: no hace falta ningún menú para elegir. El mando i controla al jugador i. Zona muerta del stick: 0,5 (dato de cliente, no de la simulación, por eso está en `GamepadInput.ts`).
- **La cámara es solo visual** y vive en el cliente: puede usar `Math.exp`, decimales y el tiempo real de render sin romper el determinismo. Sus constantes están en `constants.ts` (sección "Camera", marcada como solo render) para que todo lo ajustable siga en un único sitio.
- **Suavizado exponencial dependiente del tiempo** (`1 - exp(-delta / CAMERA_SMOOTH_MS)`) en lugar de un "lerp 0.1 por frame", que iría el doble de rápido a 120 FPS que a 60.
- **Dos cámaras**: la principal (mundo, sigue y hace zoom) ignora el HUD; la de UI (fija) ignora el mundo. Todo objeto nuevo del mundo debe añadirse a la lista que ignora la cámara de UI, y todo objeto de UI a la que ignora la principal.
- **Golpes en dos fases** (`resolveHits`): primero se buscan todos los golpes del tick y después se aplican. Así el resultado no depende de qué jugador se procesa primero, y si ambos aciertan a la vez, los dos golpes cuentan.
- **Hurtbox = caja del cuerpo** por ahora (`hurtbox()`); F4 podrá definir hurtboxes por personaje.
- **Atacar compromete**: sin salto, esquiva ni giro hasta que acaba la recuperación. Solo se puede elegir dirección al empezar. (Desde el 28 oct sí puedes seguir moviéndote mientras atacas, más despacio.)
- **La carga no cambia el alcance ni la velocidad del pesado**, solo cuánto has cargado (`attackChargeTicks`), que F2.3 usará para escalar daño y knockback. Mantener cargado es un riesgo: eres vulnerable y el rival te ve venir.
- **Cómo ajustar lo letal que es un golpe** (28 oct): no basta con alejar las zonas de muerte. Si un golpe te lanza más lejos de lo que tu recovery alcanza (~600 px con 2 saltos, esquiva aérea y ↑+pesado), mueres igual, solo que por abajo. Las palancas son: distancia de las zonas (`BLAST_ZONE`), cuánto escala con el daño (`kbScale`) y lo rápido que se frena el vuelo (`HITSTUN_DRAG`). Medir con una tabla de "% en que mata" antes y después de tocar.
- **Fórmula de knockback lineal**: `velocidad = kbBase + kbScale × daño_tras_el_golpe`. Sencilla de razonar y de ajustar; en F4 el peso del personaje la dividirá. A 0 % un ligero lanza a ~360 px/s; a 100 %, a ~1060 px/s.
- **Dirección de knockback como vector (x, y), no como ángulo**: `Math.sin` y `Math.cos` no son deterministas entre motores. Se normaliza con `Math.sqrt`, que sí lo es. La x apunta siempre "lejos del atacante" (según los centros), así un golpe por detrás empuja hacia atrás.
- **Los golpes guardan una "foto" del ataque** (`AttackSnapshot`) en el momento de detectarse. Así, en un intercambio, el segundo golpe se aplica aunque el primero ya haya cancelado el ataque de quien lo dio.
- **Recibir un golpe devuelve el salto y la esquiva aéreos**: siempre tienes opción de volver al escenario.
- **"Activo" (`isActive`) = tiene vidas y no está esperando a reaparecer.** Solo los jugadores activos se simulan, golpean, reciben golpes, se dibujan y salen en cámara. Mientras espera, el jugador conserva su posición de KO; `teleportPlayer` lo lleva al spawn al reaparecer.
- **La invulnerabilidad al reaparecer se pierde al atacar**, para que sirva para volver a la pelea y no para atacar sin riesgo. Esquivar no la quita.
- **Datos de ataque en `constants.ts`** hasta F4.1, cuando pasarán a los archivos de cada personaje.
- **El overlay de F1 dibuja la posición de la simulación** (sin interpolar), para que lo que ves sea exactamente lo que se comprueba. A más de 60 FPS puede ir 1 frame por detrás del cuerpo dibujado.
- En desarrollo, `__world` y `__game` están en la consola del navegador para inspeccionar el estado.
- Dependencias: `typescript` (raíz), `phaser` + `vite` + `@colyseus/sdk` (cliente), `@colyseus/core` + `@colyseus/ws-transport` + `@colyseus/schema` + `@types/node` (servidor).
- **Colyseus por piezas, no el paquete `colyseus`**: el "todo en uno" arrastra Redis, monitor, auth y playground, que no usamos. `@colyseus/core` exporta `defineServer`, `defineRoom` y `Room`.
- **El estado de red se define en el servidor (`schema()`) y en `shared` solo como interfaz** (`NetMatchState`), para que `shared` siga sin dependencias. El cliente no usa `Callbacks` del SDK (exigen el esquema real); en cada frame lee `room.state` y sincroniza las vistas.
- **Posiciones en `float64`** en el esquema: `float32` perdería precisión y en F3.3 la reconciliación compara posiciones exactas.
- **Modo online con `?online` (crear) y `?online=CÓDIGO` (unirse) en la URL** hasta que exista el menú (F5.1). El enlace con el código es lo que se comparte.
- **`npm run dev` usa `vite --host`** (28 oct): sin eso Vite solo acepta conexiones de localhost y otro PC de la clase no puede abrir la página. Para jugar en red local: la IP es la de la línea "Network" de Vite; si Windows marca la Wi-Fi como red **Pública**, su cortafuegos bloquea las conexiones entrantes a los puertos 5173 y 2567 y hay que permitirlas (lo hace Riga, no Claude). Algunas Wi-Fi de centros aíslan a los dispositivos entre sí; plan B: un hotspot del móvil o el modo local en un teclado.
- **El código de sala es el propio `roomId` de Colyseus** (se puede asignar en `onCreate`), así `joinById(código)` funciona sin tablas extra.
- **Pausa mientras alguien reconecta**: nadie pierde vidas por un corte de red. El `tick` del servidor se congela; al volver, el reloj del cliente salta y la predicción se corrige.
- **El `tick` nunca vuelve a 0** al empezar una partida o una revancha: la interpolación y la reconciliación del cliente dependen de que solo suba.
- **El calentamiento (waiting) tiene vidas infinitas** y no puede terminar la partida: sirve para practicar mientras llega el rival.
- **La reconexión automática del SDK solo actúa si la sala lleva ≥ 5 s abierta** (`minUptime` por defecto); si alguien se cae antes, se le guarda el sitio igualmente 20 s, pero tendría que recargar.
- **Un input por tick con número de secuencia** (no "enviar solo cuando cambia"): es lo que necesita la reconciliación de F3.3, en la que el servidor dirá "he procesado hasta el input N" (`InputQueue.lastProcessedSeq` ya lo guarda).
- **Cola de inputs propia, no la de Colyseus.** La 0.18 trae un sistema de inputs con acuses y un bucle de paso fijo (`setFixedTimestep`, `this.inputs`, y `Predict`/`Reconciler` en el SDK). Lo hacemos a mano (~100 líneas) para que la simulación siga siendo la de `shared` con su propio acumulador y para entender el netcode. Si algo se complica, es la alternativa. Nota: el campo no puede llamarse `inputs` en la sala porque choca con el de Colyseus.
- **Se sincroniza el `Player` completo**, no solo la posición: lo necesita el cliente para dibujar (ataques, esquivas, daño) y para re-simular su jugador en F3.3.
- **`MatchView` dibuja cualquier `World`** sin saber de dónde viene (simulación local o espejo del servidor).
- **Solo se predice el movimiento propio** (`stepPlayer`), no los golpes ni los KOs: el cliente nunca decide si un golpe acierta. Tus ataques sí se ven al instante (son estado del jugador), pero el daño y el knockback llegan con el servidor. Mientras estás fuera de juego (esperando para reaparecer) no se predice nada.
- **La reconciliación se hace una vez por estado nuevo** (cuando cambia `state.tick`), no cada frame.
- **El rival se interpola sobre la línea de tiempo del servidor (ticks), no sobre la hora de llegada de los paquetes**: así la irregularidad de la red no se convierte en tirones. Precio: el rival se ve ~100 ms + latencia en el pasado, mientras tu jugador está en el presente. Un golpe puede parecer acertar o fallar por poco en tu pantalla, pero decide el servidor. (Las técnicas para compensarlo, como el "lag compensation", quedan fuera del MVP.)
- **La corrección suave es solo visual** (desplazamiento al dibujar); la simulación usa siempre la posición corregida.
- Fecha del MVP: **14 de marzo de 2027** (la de CLAUDE.md manda si hay discrepancia).
- `CLAUDE.md` vive en la raíz del repo; `docs/NOTAS.md` guarda estado y planning.
- **Hitstop en la simulación, no solo visual**: congelar solo el dibujo haría que la víctima saliera volando "por detrás" de lo que ves y desincronizaría el online. En `shared` es determinista y lo ven igual cliente y servidor. Se congelan los dos (atacante también) para que el golpe "pese" y dé tiempo a leer qué ha pasado; en un intercambio cada uno se queda con la pausa más larga.
- **Referencia de jugabilidad (29 oct)**: `docs/JUGABILIDAD.md`, base Smash + lo más simple de Brawlhalla. Cambios al plan: nuevo bloque E (escudo, agarre, borde, paredes) antes de personajes; C pasa a moveset por huecos (jab 1–3, ataque en carrera, 5 aéreos); la DI sale de C4 (v2); P1 cambia la fórmula a `(b + s·p·d/10) · 100/peso`; botón de especial nuevo (I / M) con 2 especiales por personaje (neutral y arriba; el de arriba es la recovery y sustituye a ↑+K). L mantenido en suelo = escudo y agarre = L+J, para no gastar más teclas.
- **Los efectos detectan golpes por la subida del % con destello**, no con eventos de la simulación: así `shared` no sabe nada de efectos y el online no necesita mensajes nuevos.
- **El entrenamiento es un modo de `GameScene`, no una escena aparte**: comparte todo (input, vista, bucle) y solo añade reglas entre pasos (`TrainingMode`). Las reglas de entrenamiento viven en el cliente porque no hay servidor que las necesite. Hasta el menú (I1) se entra con `?training`.
- **Combo "real" = sin ni un tick libre**: el criterio se mira al empezar el tick del golpe (hitstun o hitstop > 0), no al final, porque `stepPlayer` descuenta el hitstun antes de resolver los golpes.
- **Efectos dibujados con un `Graphics` que se redibuja cada frame** (con edad y desvanecimiento calculados a mano) en vez de crear objetos o tweens por chispa: no hay que registrar objetos nuevos en la cámara de UI y no se acumula basura.
- **Una tabla de ataques por id en vez de "ligero/pesado × dirección"**: el moveset de Smash tiene huecos que no son direcciones (jab 1–3, ataque en carrera, aéreos adelante/atrás). Con ids, añadir un ataque es añadir una entrada; P1 hará una tabla así por personaje.
- **El jab encadena aunque falle** (como en Smash): el siguiente golpe sale si vuelves a pulsar J, acierte o no. Pulsar tarde también encadena, pero entonces ya no es combo (el contador lo muestra).
- **Ataque en carrera solo desde el dash** (L + dirección y luego J), no corriendo normal: correr + J sigue siendo el ataque lateral. Así hay dos opciones distintas en vez de que una tape a la otra.
- **En el aire ya no te giras** (como en Smash): la orientación solo cambia en el suelo. Sin esto, al pulsar atrás te girarías y no existiría el aéreo de atrás. Excepción: los pesados en el aire sí te giran al empezar.
- **El lag de aterrizaje va en los datos de cada aéreo** (`landingLag`), y no es un valor global: así el riesgo forma parte del balance de cada ataque. Los pesados en el aire no lo tienen: siguen su animación al aterrizar. C4 reutilizará `landingLagTicks` para la esquiva aérea.
- **Por qué hitstun con base alta y poca pendiente**: el combo depende de ventaja de frames y de distancia. La distancia crece mucho más rápido que el hitstun al subir el %, así que con mucho daño el rival sale lejos y no se le alcanza, aunque técnicamente aún esté aturdido.
- **Antiinfinitos por decaimiento de hitstun, no por limitar golpes**: es una regla única que vale para cualquier combo presente o futuro (incluidos los especiales), en vez de buscar y parchear cada bucle. `comboHits` solo se reinicia en un tick libre: si se reiniciara en el último tick de hitstun, un golpe que entra justo ahí contaría como el primero (fue un bug real, encontrado al trazar una cadena de 8 golpes).
- **Medir la letalidad con un rival que intenta volver**: un muñeco quieto muere con cualquier empujón fuera de la isla. El bot de C3 es torpe (por eso da KO antes que las medidas del 28 oct): vale para comparar antes y después, no como cifra absoluta.
- **El salto guardado solo se usa en el suelo**: con saltos aéreos disponibles, pulsar en el aire gasta uno al momento, como siempre. El buffer no retrasa ningún salto que ya se podía hacer; solo rescata los que se habrían perdido.
- **Dash con doble toque** (decidido por Riga, 30 oct): L queda solo para defensa. Con "toque corto de L" el escudo habría tardado unos ticks en salir, y eso es lo peor para defenderse. La detección va en `shared` a partir de los inputs, así que es determinista y funciona igual online.
- **El escudo no es una esquiva sino un estado aparte** (`shielding`), y bloquea por todos los lados. Solo la burbuja encoge: la zona protegida no cambia con la vida del escudo.
- **El agarre va en la tabla `ATTACKS`** con sus fases y su hitbox, así hereda el dibujo, F1 y la detección. Los lanzamientos solo usan daño y knockback.
- **Los lanzamientos colocan al rival en el lado del lanzamiento** y reutilizan `applyKnockback`, que siempre lanza lejos del atacante. No hace falta lógica nueva.
- **Quien sujeta mueve al sujetado** en `resolveGrabs`, tras los golpes: `stepPlayer` solo conoce a un jugador, y el agarre es lo primero que une a dos.
- **El borde solo existe en `solids`**: las plataformas de madera no se agarran. No se comparte ni se roba el borde: si está ocupado, los dos pueden colgarse.
- **Stats en la escala 1–5 de la tabla de personajes**, no números reales: se balancea con una sola regla (suman 12) y el peso de un punto se ajusta una vez en `constants.ts`.
- **Peso de 80 a 120, no de 70 a 130**: con el rango amplio, el ligero moría al 15 % y el medio al 45 %.
- **Fórmula con `d` (daño del ataque) en el crecimiento**: así el stat de daño también aumenta el lanzamiento, sin tocar cada ataque. `kbScale` se recalculó como `kbScale antiguo × 10 / daño`.
- **Las stats se aplican tras los cambios de ataque del personaje**: un `attacks` escribe el valor base, y luego daño y alcance lo escalan.
- **Replanificación (29 oct)**: el despliegue (F3.6–F3.7) pasa al final (L3–L4). Antes se completa el juego en local, en bloques: G sensación de golpe → C combos → P personajes → D gráficos → I interfaz → L pulido y lanzamiento. La sensación de golpe va primero porque sin ella no se notan los combos, y el modo entrenamiento (G3) sirve para ajustar todo lo demás. Coyote time y jump buffer suben de Pendientes v2 a C4.

### Bugs conocidos

- `npm run build` avisa de que el bundle pesa ~1,2 MB (casi todo es Phaser). No es un fallo; se mira en F5 si hace falta.
- **El mando llega 1 frame tarde (~16 ms)**: Phaser actualiza el estado del mando después de que `GameScene.update` lea los controles. El teclado no tiene este retraso. Es imperceptible; se puede corregir leyendo el mando en el evento `preupdate` de la escena si alguna vez molesta.
- **Si el servidor se queda sin inputs tuyos unos ticks (red irregular), repite el último** y tu predicción puede desviarse un poco; se corrige suavemente con el siguiente estado.
- **Si el servidor se reinicia, las salas abiertas se pierden** (viven en memoria): los clientes muestran "Reconectando…" y, al agotar los reintentos, "Desconectado"; hay que crear sala nueva. Normal para el MVP.
- **Durante el calentamiento (esperando rival), el hueco vacío es un muñeco quieto** al que se puede pegar; no cuenta para nada porque la partida empieza de cero al llegar el rival.
- **Los scripts de prueba temporales de F1–F2 usan coordenadas del mapa antiguo** (x 240–1040, spawns 420/820) y algunos casos ya no cuadran. No son fallos del juego; razón de más para el pendiente de pasar las pruebas a `node:test` usando las constantes en vez de números fijos.
- **El modo `--watch` del servidor puede quedarse parado** si se guarda un archivo a medias ("Failed running… Waiting for file changes"): basta con guardar otra vez o reiniciar `npm run dev:server`.
- El bundle del cliente pasa de ~1,2 MB a ~1,4 MB con el SDK de Colyseus (sigue siendo casi todo Phaser).
- `npm install` avisa de que no ejecuta el script de `msgpackr-extract` (acelerador nativo opcional); msgpackr funciona igual con su versión en JavaScript.
- **Online, tu propio golpe se nota un instante más tarde**: el cliente no predice golpes, así que tu hitstop llega con el estado del servidor y la predicción te devuelve unos píxeles atrás (corrección suave). Con lag alto puede verse un pequeño tirón al acertar.
- **El navegador integrado de Claude a veces limita el juego a ~1 FPS** (requestAnimationFrame estrangulado); en las pruebas se avanza a mano con `__game.step(time, 16.67)`. No pasa en un navegador normal.
- **`Player` tiene 59 campos sincronizados y `@colyseus/schema` admite 63 por clase** (`MAX_FIELDS` en su código). Si se pasa, el servidor falla al arrancar con un error claro. Quedan 4: P2 debe gastarlos con cuidado o dejar de sincronizar los que el cliente no necesita.
- **En online todos juegan con `balanced`**: la sala no sabe elegir personaje hasta I2.
- **Agarre, lanzamientos y borde no se han probado online con dos jugadores**, solo en local. En el agarre el jugador sujetado lo mueve el servidor y puede verse alguna corrección de posición con lag.
- **El mando no se ha probado con uno físico**, solo simulado desde la consola. Probar con un mando real cuando haya uno a mano.

### Siguiente tarea

- Pendiente de F1: validar su criterio ("moverte 5 minutos seguidos es divertido sin pegarse") jugando a dos.
- Validar el hito de F2 ("una partida 1v1 local completa con alguien de clase, y quiere repetir") y el criterio de F1 (moverse es divertido). Ajustar constantes según lo que se note.
- **P2 Botón de especial y personajes 1 y 2** (bloques G → C → E → P → D → I → L en CLAUDE.md). **Necesita de Riga** la tabla "Personajes de clase": apodo, arquetipo, rasgo visual e idea de poder, con permiso si el juego es público. Sustituirán a los personajes provisionales de P1. E4 (paredes) queda aparcado: Riga lo deja para más adelante (30 oct).
- Antes de D1: confirmar el estilo gráfico (propuesta: muñecos articulados dibujados con formas en código; alternativa: pixel art a mano).
- L3 (antes F3.6) Desplegar servidor y cliente; prueba con alguien en otra casa. **Necesita decisiones y cuentas tuyas**: hosting del cliente (Netlify o Vercel) y del servidor (Fly.io o VPS Hetzner), que exigen crear cuenta y, en el caso del servidor, posiblemente pago. El cliente necesitará `VITE_SERVER_URL` apuntando al servidor (`wss://…`).

### Pendientes v2

Ideas que surgen durante las sesiones y quedan fuera de la tarea actual o del MVP.

- Que el escudo gastado deje partes del cuerpo sin cubrir, como en Smash (hoy encoge solo el dibujo).
- Golpear al rival sujetado antes de lanzarlo, y que el sujetado pueda soltarse machacando botones.
- (F5) Separar Phaser en su propio chunk para quitar el aviso de tamaño del build.
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
