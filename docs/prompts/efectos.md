# Prompts de efectos, listos para pegar

En Gemini o Flow: **adjunta una hoja de personaje** (por ejemplo `art/riga/riga.png`) solo como referencia de estilo, pega el bloque y guarda la imagen con el nombre del título en `art/fx/`. Una tira por mensaje. Yo las proceso y las meto en el juego.

Ya hechos y en uso: chispa de golpe (`art/common/hit-spark.jpg`), polvo (`art/common/dust.jpg`) y **los 10 de esta lista** (23 nov, en `art/fx/`; se procesan con `node tools/pixelate.ts art/fx/sprites.json`).

**Lo que no va con imágenes** (queda mejor en código): el haz de KO, la luz de los faroles, las nubes, la cuenta atrás y los iconos de la ruleta de Riga (para no acabar con logos de marcas).

## Prompt base (siempre igual)

```text
Using the attached character sheet ONLY as a style reference (same pixel size, hard square pixels, 16-bit palette, 1-pixel dark outline where it fits), create ONE horizontal sprite strip of a visual EFFECT for a 2D side-view fighting game. No character in the image.

LAYOUT (very important)
- One single row of {N} frames, left to right, evenly spaced, all the same size, the effect centred in each frame.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit pixel art: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no glow halo outside the shape.
- Flat pure magenta #FF00FF background, nothing else: no text, no numbers, no ground, no shadow, no frame borders.
- Bold, readable shapes that still read when small.

EFFECT ({N} frames)
{EFFECT}
```

## Efectos, por prioridad

| Archivo | N | `EFFECT` | Dónde sale |
| --- | --- | --- | --- |
| `art/fx/heavy-spark.jpg` | 4 | A big impact burst for a strong punch: (1) small white-hot star, (2) large jagged star of white and yellow with orange tips and a thin ring around it, (3) the star breaking into flying sparks, the ring wider, (4) a few last sparks. | Golpes fuertes (los flojos usan la chispa actual) |
| `art/fx/ko-burst.jpg` | 5 | A huge explosion when a fighter is knocked out off the screen: (1) bright white flash, (2) big round blast of white, yellow and orange, (3) blast with bold rays shooting outwards, (4) blast breaking up into chunks and smoke, (5) thin smoke ring fading. | KO, junto al haz de color |
| `art/fx/shield.jpg` | 3 | A round protective energy bubble, light cyan-blue with a white rim and a few bright highlights, slightly shimmering: three frames of the same bubble with the highlights moved. | Escudo de todos |
| `art/fx/counter.jpg` | 3 | A defensive barrier of orange light shaped like a raised open hand made of glowing hexagons, pulsing: (1) small, (2) full size, (3) full size with brighter edges. | Contraataque de Claude (Riga) |
| `art/fx/bubble.jpg` | 2 | A small white comic speech bubble with three dark dots inside ("…"), thick dark outline, a little tail at the bottom left; (2) the same bubble slightly squashed. | Ráfaga de ChatGPT (Riga) |
| `art/fx/star.jpg` | 4 | A small four-pointed sparkling star, blue at the tips turning violet in the middle, spinning: four frames of the star rotated 0°, 22°, 45°, 67°. | Estrellas de Gemini (Riga) |
| `art/fx/cursor.jpg` | 2 | A giant white computer mouse pointer (arrow) with a thick dark outline; (2) the same pointer with a small click burst at its tip. | Gancho de Riga |
| `art/fx/bomb.jpg` | 2 | A small round black cartoon bomb with a shiny highlight and a short fuse with a bright spark; (2) the same with the spark bigger. | Bombardeo de Donate |
| `art/fx/smoke-puff.jpg` | 3 | A small round grey puff of cigarette smoke, curling: (1) small, (2) round and full, (3) thinning out into wisps. | Cargas de humo de Robert |
| `art/fx/charge.jpg` | 4 | A ring of white-yellow energy flames rising around where someone stands, seen from the side (flat ellipse at the bottom, flames going up), flickering. | Mientras se carga un fuerte |

Guarda todo en `art/fx/` con esos nombres y súbelo; no hace falta hacerlos todos de golpe.
