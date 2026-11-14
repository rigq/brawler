# Arte

Imágenes originales generadas con IA (Gemini) a partir de fotos de los compañeros, con su permiso.
No se cargan en el juego: `tools/pixelate.ts` las limpia y deja los sprites en `packages/client/public/sprites/`.

```
node tools/pixelate.ts art/<carpeta>/sprites.json
```

Cada `sprites.json` dice de qué imagen sale cada sprite, cuántos fotogramas tiene (o dónde empieza y acaba cada uno) y qué tamaño tiene en el juego (1 píxel de arte = 1 px del mundo).

| Carpeta | Imagen | Qué es | Sprite | Se usa |
| --- | --- | --- | --- | --- |
| `donate/` | `donate.webp` | Hoja de Donate con boina y medalla | `donate.png` (sacado a mano desde el navegador: la herramienta no lee `.webp`) | Sí |
| | `tank.png` | Tanque con su padre (3) | `tank.png` | Sí, especial neutral |
| | `shell.png` | Proyectil (2) | `shell.png` | Sí |
| | `explosion.png` | Explosión (4) | `explosion.png` | Sí |
| | `parachute.png` | Paracaídas (2) | `parachute.png` | Sí, especial arriba |
| | `donate-no-beret.png` | Primera hoja, sin boina | — | Referencia |
| `robert/` | `robert.png` | Hoja de Robert | `robert.png` | Sí |
| | `smoke.jpg` | Nube de humo (5) | `smoke.png` | Sí, especial neutral |
| | `rapper.jpg` | Colega rapero (3) | `rapper.png` | Sí, especial arriba |
| | `knife.jpg` | Navaja | `knife.png` | v1.1: especial lateral |
| `samu/` | `samu.jpg` | Hoja de Samu con la mochila de pesas | `samu.png` | Sí |
| | `samu-no-backpack.png` | Primera hoja, sin mochila | — | Referencia |
| | `ball.jpg` | Pelota girando (4; la fila de abajo salió mal y no se usa) | `ball.png` | Sí, especial neutral |
| | `ball-trail.jpg` | Estela de la pelota (2) | `ball-trail.png` | Pendiente |
| | `flag.jpg` | Bandera ondeando (4) | `flag.png` | Sí, su checkpoint |
| | `flag-plant.jpg` | Bandera plantándose (3) | `flag-plant.png` | Sí |
| | `teleport.jpg` | Teletransporte (5) | `teleport.png` | Sí, especial arriba |
| `chachin/` | `chachin.png` | Hoja de Chachin | `chachin.png` | Sí |
| | `scream.jpg` | Onda del grito (4) | `scream.png` | Sí, especial neutral |
| | `scream-rocket.jpg` | Grito-cohete (3) | `scream-rocket.png` | Sí, especial arriba |
| | `dizzy.jpg` | Estrellitas de aturdido (4) | `dizzy.png` | Sí, sobre cualquiera aturdido sin salir volando |
| `common/` | `hit-spark.jpg` | Chispa de golpe (3) | `hit-spark.png` | Pendiente (D2) |
| | `dust.jpg` | Polvo (4) | `dust.png` | Pendiente (D2) |

## Animaciones (`<personaje>/anim/`)

Nombres de `docs/PROMPTS_ANIMACIONES.md`. Se procesan con `node tools/pixelate.ts art/<personaje>/anim/sprites.json`, que deja las tiras en `sprites/<personaje>/anim/` y sus tamaños en `packages/client/src/render/anims/<personaje>.json`. `standing` es lo que mide el personaje de pie en esa imagen (en píxeles de la imagen): si una animación sale más grande o más pequeña que las demás, se ajusta ese número.

**Donate**: las 26 tiras (13 nov), todas en el juego; `air-neutral-alt` es una versión de sobra que no se usa.

| Ojo con | Qué pasa |
| --- | --- |
| `run.jpg` | 7 fotogramas en dos filas (4 + 3), no en una |
| `shield.jpg` | 4 fotogramas (subir guardia, mantener, bajar); el 3.º es la pose de escudo |
| `light-side.jpg` | La patada va hacia atrás (izquierda) en el fotograma 2 |
| `air-back.jpg` | El fotograma 3 patea hacia delante |
| `air-forward.jpg`, `air-neutral-alt.jpg` | Piernas fantasma semitransparentes debajo: hay que recortarlas |
| `air-neutral.jpg` / `air-neutral-alt.jpg` | Dos versiones del mismo aéreo; la limpia es `air-neutral` |
| `light-up.jpg` | El arco de estela del fotograma 2 se quita al procesar; queda una motita junto al puño |
| `ledge.jpg` | Colgado de una barra dibujada (no del borde) |

**Robert**: 25 tiras en el juego (14 nov); faltan un `idle` de verdad y repetir `run`. Llegaron como `robert_ (1…27).jpg` y se renombraron mirando cada una; `robert_ (24)` era una copia exacta de la 23 y se borró. `heavy-up`, `light-down` y `air-down` se rehicieron después (llegaron por el chat). El `standing` de cada tira se midió: en las poses de pie, el fotograma más alto; en el resto, por el área de la sudadera negra (crece con la escala al cuadrado), calibrada con las de pie (±7 %), o a mano si no cuadraba.

| Ojo con | Qué pasa |
| --- | --- |
| `heavy-up.jpg` | El 2.º fotograma lleva estela de movimiento (Gemini la pinta semitransparente sobre el magenta y queda un halo morado). Se sustituye por una copia del 1.º (`columns` repetida); el uppercut sigue siendo el 3.º |
| `air-back-alt.jpg` | Aéreo de sobra (era `robert_ (3)`, parece un primer intento de `air-down`), no se usa |
| `run.jpg`, `heavy-side.jpg`, `heavy-down.jpg`, `light-down.jpg` | Fotogramas solapados: columnas a mano y `cleanMinShare` 0.25 para quitar trozos del vecino |
| `heavy-side.jpg` | Cabezas fantasma encima: se recortan con `rows` |
| `heavy-down.jpg` | El puño del 3.er fotograma sale algo recortado (más allá entra la bota del 4.º) |
| `run.jpg` | **Repetir**: no es un ciclo de carrera (dos fotogramas con las rodillas recogidas, como saltando; la cabeza sube y baja; capucha solo en dos) |
| `idle` | **Falta**: lo que parecía el idle era una pose de guardia con los puños delante (`guard-unused.jpg`). Mientras, se ve la pose fija |
| `ledge.jpg` | Colgado de una barra, como Donate |

**Al pedir tiras a Gemini:** añadir "no motion blur, no speed lines, no afterimages" al prompt; la estela es lo que más estropea.

**Falta por generar:** las tiras de animación de Samu y Chachin (de pie, correr, saltar, caer, golpes, recibir, escudo, rodar, borde) y el efecto de corte de la navaja (v1.1).
