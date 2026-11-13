# Prompts para las animaciones

Cómo generar las tiras de animación de los cuatro personajes con la IA de imágenes (Gemini), en el mismo estilo que sus hojas de referencia.

## Cómo pedirlas

1. **Adjunta siempre la hoja de referencia del personaje**:
   - Donate: `art/donate/donate.webp`
   - Robert: `art/robert/robert.png`
   - Samu: `art/samu/samu.jpg`
   - Chachin: `art/chachin/chachin.png`
2. **Una animación por mensaje.** Pega el prompt base y, debajo, el bloque `CHARACTER` del personaje y el bloque `ANIMATION` que toque.
3. **Si un fotograma sale con otra cara, otra ropa u otro tamaño, repite la tira entera** antes de cambiar el texto. Mezclar fotogramas de dos generaciones se nota.
4. **Guárdalas como `art/<personaje>/anim/<nombre>.jpg`**, con el nombre de la tabla (por ejemplo `art/samu/anim/run.jpg`). Así sé qué es cada una sin abrirla, y las proceso con `tools/pixelate.ts`.

## Prompt base (siempre igual)

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of {N} frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
{CHARACTER}

ANIMATION ({N} frames)
{ANIMATION}
```

## Bloques `CHARACTER`

**Donate**
```text
Donate: average build, red military beret with a small gold badge, dark navy puffer jacket over a grey hoodie, a small gold medal on the jacket, dark jeans, light sneakers, short brown hair and light stubble. A bit absent-minded but confident.
```

**Robert**
```text
Robert: big, round, heavy body with short thick legs, buzz-cut hair, black sweatshirt with a faint print, a small black crossbody bag, olive cargo trousers, black sneakers, a cigarette in the corner of his mouth. Tough, slow and heavy: his moves are slow but powerful, with weight in every pose.
```

**Samu**
```text
Samu: athletic, wavy brown hair, navy T-shirt with a red lanyard, beige trousers, white sneakers, and a big blue backpack full of weights on his back (a dumbbell sticks out of the top). Volleyball player: sporty, jumpy moves; the heavy backpack makes him lean forward a little.
```

**Chachin**
```text
Chachin: the smallest fighter, short and skinny, black bowl-cut hair, light grey zip hoodie over a dark T-shirt, black trousers, dark sneakers. Hyperactive and loud: twitchy, exaggerated, fast moves, mouth often open.
```

## Bloques `ANIMATION`, por orden de prioridad

Con el **lote 1** el juego ya se siente vivo: andar, saltar y recibir golpes. Después vamos de más a menos visible.

### Lote 1 · Moverse

| Archivo | N | `ANIMATION` |
| --- | --- | --- |
| `idle.jpg` | 4 | Idle fighting stance, ready to fight, a subtle breathing loop (frame 4 flows back into frame 1). |
| `run.jpg` | 6 | Fast running cycle, leaning forward, arms pumping, loopable. |
| `jump.jpg` | 2 | Jump: (1) crouched take-off, knees bent, (2) rising in the air, knees tucked, arms up. |
| `fall.jpg` | 2 | Falling: (1) at the top of the jump, (2) falling down, legs stretched to land, arms out for balance. |
| `hurt.jpg` | 2 | Getting hit: (1) recoiling backwards, eyes shut, (2) knocked back, body bent, limbs flailing. |

### Lote 2 · Golpes ligeros (J)

| Archivo | N | `ANIMATION` |
| --- | --- | --- |
| `jab.jpg` | 3 | Quick straight punch forward: (1) fist pulled back, (2) arm fully extended forward, (3) back to guard. |
| `light-side.jpg` | 3 | Fast forward kick at waist height: (1) knee up, (2) leg fully extended forward, (3) recovering. |
| `light-up.jpg` | 3 | Upward swipe: (1) crouched, arm down, (2) arm swinging in an arc above the head, (3) arm up high. |
| `light-down.jpg` | 3 | Low sweep: (1) crouching, (2) leg sweeping forward along the floor, (3) still low, recovering. |
| `dash-attack.jpg` | 3 | Running attack: (1) running lunge, (2) shoulder or flying kick charging forward, body almost horizontal, (3) stumbling to a stop. |

### Lote 3 · Aéreos (J en el aire)

| Archivo | N | `ANIMATION` |
| --- | --- | --- |
| `air-neutral.jpg` | 3 | Mid-air spin kick: (1) curled up, (2) legs and arms spread out spinning, (3) curling back. |
| `air-forward.jpg` | 3 | Mid-air forward strike: (1) arm pulled back, (2) big forward punch or swing, (3) follow-through. |
| `air-back.jpg` | 3 | Mid-air back kick: (1) looking over the shoulder, (2) powerful kick straight BEHIND him (to the left), still facing right, (3) leg coming back. |
| `air-up.jpg` | 3 | Mid-air upward kick: (1) body tucked, (2) flip kick straight up, legs above the head, (3) coming out of the flip. |
| `air-down.jpg` | 3 | Mid-air downward stomp: (1) knees up, (2) both feet slamming straight down, (3) legs still down. |

### Lote 4 · Golpes fuertes (K, se cargan)

| Archivo | N | `ANIMATION` |
| --- | --- | --- |
| `heavy-side.jpg` | 4 | Big charged forward punch: (1) charging, body wound back, fist glowing with effort (no glow effect, just the pose), (2) stepping forward, (3) huge punch fully extended, (4) recovering, off balance. |
| `heavy-up.jpg` | 4 | Big charged uppercut: (1) crouched low charging, (2) starting to rise, (3) huge uppercut with the arm straight up above the head, (4) landing back. |
| `heavy-down.jpg` | 4 | Big charged ground slam to both sides: (1) charging, arms raised, (2) jumping slightly, (3) smashing both fists into the ground, arms wide, (4) getting up. |

### Lote 5 · Defensa, agarres y borde

| Archivo | N | `ANIMATION` |
| --- | --- | --- |
| `shield.jpg` | 1 | Guard pose: crouched slightly, both forearms crossed in front of the face, braced. |
| `roll.jpg` | 4 | Roll forward on the ground: (1) ducking, (2) curled into a ball, (3) ball rolling, (4) coming out of the roll crouched. |
| `dodge.jpg` | 2 | Dodging: (1) leaning back to avoid a hit, (2) twisting sideways. Also used for the air dodge. |
| `grab.jpg` | 2 | Grab: (1) reaching forward with both hands, (2) holding something in front of him with both hands. |
| `throw.jpg` | 2 | Throw: (1) swinging both arms forward, (2) arms extended after throwing. |
| `ledge.jpg` | 1 | Hanging from a ledge on his right: both hands up holding the edge, body hanging below, legs dangling. |

### Lote 6 · Especiales (I + dirección)

| Personaje | Archivo | N | `ANIMATION` |
| --- | --- | --- | --- |
| Donate | `special-neutral.jpg` | 2 | Giving an order to fire: (1) arm raised, shouting, (2) arm pointing forward, shouting "fire!" (no text). |
| Donate | `special-up.jpg` | 2 | (1) Launched straight up, arms and legs stretched, surprised face, (2) hanging from parachute straps (no parachute drawn), legs dangling. |
| Robert | `special-neutral.jpg` | 2 | Smoking: (1) taking a drag from the cigarette, (2) blowing a big puff forward, cheeks puffed (no smoke drawn). |
| Robert | `special-up.jpg` | 2 | (1) Being boosted up, arms up, (2) rising in the air, heavy body, legs together. |
| Samu | `special-neutral.jpg` | 3 | Volleyball spike: (1) arm pulled back high above the head, (2) slamming the arm down hard, (3) follow-through. |
| Samu | `special-up.jpg` | 2 | Concentrating: (1) eyes closed, hands together, (2) arms spread, body glowing pose (no glow drawn). |
| Chachin | `special-neutral.jpg` | 3 | Screaming: (1) taking a deep breath, (2) screaming with the mouth wide open, fists clenched, leaning back, (3) still screaming, trembling. |
| Chachin | `special-up.jpg` | 2 | Screaming downwards while shooting up: (1) looking down, mouth wide open, (2) flying up, arms stretched upwards. |

## Total

| Lote | Tiras por personaje | Para los cuatro |
| --- | --- | --- |
| 1 · Moverse | 5 | 20 |
| 2 · Golpes ligeros | 5 | 20 |
| 3 · Aéreos | 5 | 20 |
| 4 · Golpes fuertes | 3 | 12 |
| 5 · Defensa | 6 | 24 |
| 6 · Especiales | 2 | 8 |
| **Total** | **26** | **104** |

Si te quedas sin generaciones, el juego aprovecha lo que haya: lo que falte usa la pose más parecida (por ejemplo, `jab` para los golpes que aún no tengan tira, o `fall` para la esquiva aérea).
