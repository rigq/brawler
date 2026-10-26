# Planning — Brawler web online

Oct 26, 2026 · @Fabrizio Riga

## Estado del proyecto

Se actualiza al cerrar cada sesión. Lo más reciente, arriba.

### Hecho

- **F0.2 (26 oct)** — `shared/src/constants.ts` (reloj de simulación, tamaño del mundo, suelo). `FixedStepAccumulator` convierte frames de duración variable en pasos fijos de 60 Hz, con tope de 250 ms por frame. `World` mínimo con `tick` y `stepWorld()`. `GameScene` simula con el acumulador, dibuja el suelo y muestra un HUD (FPS, Hz de simulación medidos, tick). Comprobado: 600 pasos en 10 s a 30, 60 y 144 FPS; en el navegador, sim 60.0 Hz.
- **F0.1 (26 oct)** — Monorepo con npm workspaces (`shared`, `client`, `server`). Cliente Vite + Phaser 3 con `GameScene` vacía (1280×720, escala FIT) que importa `GAME_TITLE` de `shared`. Servidor de prueba que corre `.ts` directamente con Node 24. Repo en https://github.com/rigq/brawler.

### Decisiones

- **Phaser 3.90**, no Phaser 4 (npm instala la 4 por defecto): el stack dice Phaser 3 y casi toda la documentación y ejemplos son de la 3.
- **Sin paso de compilación para `shared` ni `server`**: todo el TS es "borrable" (`erasableSyntaxOnly`), Vite lo empaqueta en el cliente y Node 24 lo ejecuta directo en el servidor. Imports relativos con extensión `.ts`. Nada de `enum` ni `namespace`.
- `tsconfig.base.json` común en modo `strict` + `noUncheckedIndexedAccess`; cada paquete extiende y elige sus `lib`/`types` (`shared` sin DOM ni Node, para que no se cuele nada impuro).
- **Unidades del mundo = píxeles del canvas** (1280×720) y segundos. Las velocidades en `constants.ts` serán px/s y se multiplican por `FIXED_DT`.
- **El acumulador no lee ningún reloj**: el cliente le pasa el `delta` de Phaser y el servidor (F3) le pasará el suyo. Así la lógica de `shared` sigue siendo pura.
- **Render sin interpolar por ahora.** `accumulator.alpha` ya existe; se usará cuando haya cosas que se muevan (F1.1).
- Dependencias: `typescript` (raíz), `phaser` + `vite` (cliente), `@types/node` (servidor, solo tipos).
- Fecha del MVP: **14 de marzo de 2027** (la de CLAUDE.md manda si hay discrepancia).
- `CLAUDE.md` vive en la raíz del repo; `docs/NOTAS.md` guarda estado y planning.

### Bugs conocidos

- `npm run build` avisa de que el bundle pesa ~1,2 MB (casi todo es Phaser). No es un fallo; se mira en F5 si hace falta.

### Siguiente tarea

- F1.1 Cuadrado que corre y salta, colisión con el suelo.

### Pendientes v2

Ideas que surgen durante las sesiones y quedan fuera de la tarea actual o del MVP.

- (F5) Separar Phaser en su propio chunk para quitar el aviso de tamaño del build.

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
