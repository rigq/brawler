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

**Robert**: las 26 tiras en el juego (completo el 15 nov). Llegaron como `robert_ (1…27).jpg` y se renombraron mirando cada una; `robert_ (24)` era una copia exacta de la 23 y se borró. `heavy-up`, `light-down` y `air-down` se rehicieron después (llegaron por el chat). El `standing` de cada tira se midió: en las poses de pie, el fotograma más alto; en el resto, por el área de la sudadera negra (crece con la escala al cuadrado), calibrada con las de pie (±7 %), o a mano si no cuadraba.

| Ojo con | Qué pasa |
| --- | --- |
| `heavy-up.jpg` | El 2.º fotograma lleva estela de movimiento (Gemini la pinta semitransparente sobre el magenta y queda un halo morado). Se sustituye por una copia del 1.º (`columns` repetida); el uppercut sigue siendo el 3.º |
| `air-back-alt.jpg` | Aéreo de sobra (era `robert_ (3)`, parece un primer intento de `air-down`), no se usa |
| `run.jpg`, `heavy-side.jpg`, `heavy-down.jpg`, `light-down.jpg` | Fotogramas solapados: columnas a mano y `cleanMinShare` 0.25 para quitar trozos del vecino |
| `heavy-side.jpg` | Cabezas fantasma encima: se recortan con `rows` |
| `heavy-down.jpg` | El puño del 3.er fotograma sale algo recortado (más allá entra la bota del 4.º) |
| `run.png` | Montada a partir de `run-v3.jpg` (Gemini, 15 nov): zancada, paso, **zancada con los tonos de las piernas intercambiados** (la pierna adelantada pasa a ser la oscura, la lejana, así que se lee como la zancada contraria) y paso. En `run-v3` los fotogramas 3–5 repetían la misma zancada |
| `run-v1.jpg`, `run-v2.png` | Intentos anteriores, no se usan (v1 a saltos; v2 con la misma pose en los 4 fotogramas) |
| `idle.jpg` | La calada (subida por Riga, 8 fotogramas). Se usan los 7 de perfil: el 1.º está de frente. Lleva línea de suelo (se recorta con `rows`) y `clean: false` para no perder el humo. En el juego: primera calada 1 s después de pararse y luego una cada ~2,5 s (`idleRestMs`) |
| `guard-unused.jpg` | Pose de guardia que se tomó por idle; no se usa |
| `ledge.jpg` | Colgado de una barra, como Donate |

**Al pedir tiras a Gemini:** añadir "no motion blur, no speed lines, no afterimages" al prompt; la estela es lo que más estropea.

**Samu**: 25 de 26 tiras en el juego (15 nov); falta `dodge` (usa `fall`). Llegaron como `samu_ (1…25).jpg`; renombradas mirando cada una. Columnas sacadas de las manchas conectadas de cada imagen y `standing` estimado con la misma pose de Robert, revisado a escala de juego.

| Ojo con | Qué pasa |
| --- | --- |
| `run.jpg` | Estela de movimiento en 5 de 7 fotogramas. `run-built.png` = zancada (1.º) → en el aire (7.º) → zancada con tonos de pierna intercambiados → en el aire. El beige separa peor las piernas que el oliva de Robert: se nota poco. **Mejor repetir** (una zancada y un paso, sin estela) |
| `heavy-side.jpg`, `heavy-down.jpg` | El 2.º fotograma sale duplicado (estela): se sustituye por el 1.º |
| `light-up.jpg` | Arcos azules de barrido en los fotogramas 2 y 3; se dejan (se leen como el arco del golpe) |
| `special-up.jpg` | Línea de suelo: se recorta con `rows` |
| `ledge.jpg` | 2 fotogramas; se usa el 1.º |
| `roll.jpg` | Algo de estela morada en los fotogramas 2 y 3 |

**Chachin**: las 26 tiras en el juego (15 nov). Llegaron como `chachin_ (n).webp` (reducidas a 1024 px) y algunos `.jpg` a tamaño original; ojo: **el `.jpg` y el `.webp` con el mismo número no siempre eran la misma imagen** ((1).jpg era el agarre y (1).webp el salto; (2).jpg el escudo y (2).webp la carrera). Los `.webp` se pasaron a PNG con el nombre de la animación; `(19)` era copia exacta de `(17)`.

| Ojo con | Qué pasa |
| --- | --- |
| `idle-flip.png` | El mortal, montado con `build-idle-flip.py` desde los 8 fotogramas sueltos de `idle-src/` (Riga los pidió uno a uno). El script pone todos sobre el mismo suelo (Gemini lo subió 160 px desde el 5.º), fija a mano la altura del salto (fotogramas 4–6) y devuelve la piel a su tono (se iba poniendo roja). Se procesa con `alignY: "ground"` para que conserve la altura en el aire |
| `idle` fotograma 8 | Hace una peineta |
| `light-up.png` | El arco rosa del barrido se va al limpiar (lo toma por fondo) |
| `ledge.png` | 2 fotogramas (colgado mirando el móvil); se usa el 1.º |
| `run.png` | 9 fotogramas pequeños (la imagen era de 1024 px), pero es un ciclo de verdad |

**Pendiente:** `dodge` de Samu y, si se quiere, repetir su `run`. (de pie, correr, saltar, caer, golpes, recibir, escudo, rodar, borde) y el efecto de corte de la navaja (v1.1).
