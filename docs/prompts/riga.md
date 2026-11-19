# Prompts de Riga, listos para pegar

Cada bloque es un prompt completo. En Gemini: **adjunta `art/riga/riga.png`**, pega el bloque y guarda la imagen con el nombre del título. Una tira por mensaje; si un fotograma sale con otra cara, otra ropa u otro tamaño, repite la tira entera.

Orden recomendado: lote 1 primero (con él ya te mueves por el juego), después golpes, aéreos, fuertes, defensa y especiales.

## Lote 1 · Moverse

### 1. `art/riga/anim/idle.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 6 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (6 frames)
Idle with a habit: he checks his AI on a laptop. (1) standing relaxed, hands empty, weight on one leg, (2) pulling a slim dark grey laptop out from behind his back, (3) holding it open on one forearm, looking at the screen, (4) typing fast with the other hand, focused, (5) smirking at the screen, pleased with the answer, (6) snapping it shut and tucking it behind his back, hands empty again (flows into frame 1). The feet do not move.
```

### 2. `art/riga/anim/run.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 6 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (6 frames)
Running cycle of a tall guy: long, confident strides, slightly leaning forward, arms swinging loosely, a bit of swagger. Loopable: legs alternate (left leg forward, passing, right leg forward, passing…), one foot always touching or nearly touching the ground, the head at the same height in every frame. A run, NOT a hop: never both knees tucked up together. Hands empty.
```

### 3. `art/riga/anim/jump.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 2 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (2 frames)
Jump: (1) crouched take-off, long legs bent, arms down, (2) rising in the air, knees tucked, one arm raised, cocky face.
```

### 4. `art/riga/anim/fall.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 2 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (2 frames)
Falling: (1) at the top of the jump, relaxed, (2) falling down, long legs stretched to land, arms out for balance.
```

### 5. `art/riga/anim/hurt.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 2 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (2 frames)
Getting hit: (1) recoiling backwards, eyes shut, teeth clenched, (2) knocked back, tall body bent, long limbs flailing.
```

## Lote 2 · Golpes ligeros (J)

### 6. `art/riga/anim/jab.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 3 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (3 frames)
Quick straight punch with his long arm: (1) fist pulled back at the chest, (2) arm FULLY extended straight forward at shoulder height, (3) back to guard. In the strike frame the fist or foot is FULLY extended, as far from his body as possible (his reach is his strength).
```

### 7. `art/riga/anim/light-side.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 3 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (3 frames)
Long front kick at waist height: (1) knee raised in front of him, (2) his long leg FULLY extended straight forward, sole of the boot facing the enemy, (3) leg coming back down. In the strike frame the fist or foot is FULLY extended, as far from his body as possible (his reach is his strength). Everything goes FORWARD, to the RIGHT, the way he faces. Never backwards.
```

### 8. `art/riga/anim/light-up.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 3 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (3 frames)
Upward swipe: (1) slightly crouched, arm down at his side, (2) arm swinging in a big arc in front of him, (3) arm stretched straight up above his head, open hand high (he is tall: the highest reach of the cast). In the strike frame the fist or foot is FULLY extended, as far from his body as possible (his reach is his strength).
```

### 9. `art/riga/anim/light-down.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 3 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (3 frames)
Low sweep: (1) crouching down, (2) one long leg sweeping forward along the floor, fully stretched, (3) still crouched low, recovering. In the strike frame the fist or foot is FULLY extended, as far from his body as possible (his reach is his strength). Everything goes FORWARD, to the RIGHT, the way he faces. Never backwards.
```

## Lote 3 · Aéreos (J en el aire)

### 10. `art/riga/anim/air-neutral.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 3 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (3 frames)
Mid-air spin kick: (1) curled up, (2) long arms and legs spread out wide, spinning, (3) curling back.
```

### 11. `art/riga/anim/air-forward.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 3 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (3 frames)
Mid-air forward strike: (1) arm pulled back over his shoulder, (2) big forward hammer punch, arm FULLY extended forward and slightly down, (3) follow-through. In the strike frame the fist or foot is FULLY extended, as far from his body as possible (his reach is his strength). Everything goes FORWARD, to the RIGHT, the way he faces. Never backwards.
```

### 12. `art/riga/anim/air-back.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 3 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (3 frames)
Mid-air back kick: (1) looking over his shoulder, (2) powerful kick straight BEHIND him (to the left), the long leg fully stretched, still facing right, (3) leg coming back.
```

### 13. `art/riga/anim/air-up.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 3 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (3 frames)
Mid-air upward kick: (1) body tucked, (2) flip kick straight up, long legs above his head, (3) coming out of the flip. In the strike frame the fist or foot is FULLY extended, as far from his body as possible (his reach is his strength).
```

### 14. `art/riga/anim/air-down.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 3 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (3 frames)
Mid-air downward stomp: (1) knees up to the chest, (2) both heavy boots slamming straight down, legs fully stretched below him, (3) legs still down. In the strike frame the fist or foot is FULLY extended, as far from his body as possible (his reach is his strength).
```

## Lote 4 · Golpes fuertes (K, se cargan)

### 15. `art/riga/anim/heavy-side.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 4 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (4 frames)
Big charged forward punch: (1) charging, body twisted and wound back, fist behind his head (no glow drawn), (2) stepping forward with his front foot, (3) huge haymaker, the long arm FULLY extended forward, whole body behind it, (4) recovering, off balance. In the strike frame the fist or foot is FULLY extended, as far from his body as possible (his reach is his strength). Everything goes FORWARD, to the RIGHT, the way he faces. Never backwards.
```

### 16. `art/riga/anim/heavy-up.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 4 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (4 frames)
Big charged uppercut: (1) crouched low charging, fist near the floor, (2) starting to rise, (3) huge uppercut, arm straight up above his head, standing on his toes (very high reach), (4) landing back. In the strike frame the fist or foot is FULLY extended, as far from his body as possible (his reach is his strength).
```

### 17. `art/riga/anim/heavy-down.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 4 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (4 frames)
Big charged ground slam to both sides: (1) charging, both fists raised above his head, (2) jumping slightly, (3) smashing both fists into the ground in front of him, arms wide, (4) getting up.
```

## Lote 5 · Defensa, agarres y borde

### 18. `art/riga/anim/shield.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 1 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (1 frames)
Guard pose: crouched slightly, both forearms crossed in front of the face, braced.
```

### 19. `art/riga/anim/roll.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 4 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (4 frames)
Roll forward on the ground: (1) ducking, (2) curled into a ball, (3) ball rolling, (4) coming out of the roll crouched.
```

### 20. `art/riga/anim/dodge.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 2 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (2 frames)
Dodging: (1) leaning back to avoid a hit, (2) twisting sideways, cocky face. Also used for the air dodge.
```

### 21. `art/riga/anim/grab.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 2 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (2 frames)
Grab: (1) reaching FORWARD with both long arms fully stretched, (2) holding something in front of him with both hands. Everything goes FORWARD, to the RIGHT, the way he faces. Never backwards.
```

### 22. `art/riga/anim/throw.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 2 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (2 frames)
Throw: (1) swinging both arms forward from behind, (2) arms extended forward after throwing, smirking. Everything goes FORWARD, to the RIGHT, the way he faces. Never backwards.
```

### 23. `art/riga/anim/ledge.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 1 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (1 frames)
Hanging from a ledge on his right: both hands up holding the edge, long body hanging below, legs dangling.
```

## Lote 6 · Especiales (I)

### 24. `art/riga/anim/special-neutral.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 3 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (3 frames)
Summoning an AI from his laptop: (1) pulling a slim dark grey laptop out from behind his back, (2) holding it open in front of him with one hand, typing a prompt with the other, (3) turning the open laptop towards the enemy with both hands, arms stretched forward, as if the attack comes out of the screen (no effect drawn).
```

### 25. `art/riga/anim/special-up.jpg`

```text
Using the attached character sheet as the EXACT reference — same face, hair, outfit, accessories, body proportions, palette, 1-pixel dark outline and pixel size; do not redesign anything — create ONE horizontal animation strip of this character for a 2D side-view platform fighting game.

LAYOUT (very important)
- One single row of 2 frames, left to right, evenly spaced, all the same size. No second row.
- Side view, the character FACING RIGHT in every frame.
- Same scale as the side view on the reference sheet in every frame.
- The feet rest on the same invisible ground line in every frame (unless the move is in the air), and the middle of the body stays at the same horizontal spot inside its frame: arms, legs and weapons may reach out, the body does not slide.
- Leave clear empty space between frames so they never touch.

STYLE
- 16-bit era pixel art like the reference: hard square pixels on one exact grid, no anti-aliasing, no blur, no gradients, no motion blur, no glow.
- NO speed lines, NO afterimages, NO ghost copies of limbs or heads: every pixel is either the character or flat magenta.
- Flat pure magenta #FF00FF background, nothing else on it: no ground, no shadow, no speed lines, no text, no numbers, no frame borders.
- Clear, readable key poses with strong silhouettes; exaggerate anticipation and follow-through like a fighting game.

CHARACTER
Riga: the tallest fighter, a tall young man with a normal build (no belly, no visible muscles), long arms and legs. Messy spiky black hair, tan-brown skin, big dark eyes, calm confident half-smile. Black hooded hardshell jacket, zipped up, with a small orange starburst symbol on the left chest; very baggy medium-blue jeans; chunky wheat-coloured lace-up work boots. A cocky, laid-back tech guy who solves everything with AI. His hands are EMPTY: no laptop, no phone, no bag, unless the animation below asks for one.

ANIMATION (2 frames)
Emergency prompt to get back to the stage: (1) in the air, typing on an open laptop held in one hand, the other arm stretched up and forward, (2) being pulled up and forward by his raised arm, body stretched, legs dangling, laptop closed under his arm (no cursor, rope or effect drawn).
```
