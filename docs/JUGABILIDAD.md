# Smash Bros (+ lo mejor de Brawlhalla) — jugabilidad y combate

Oct 28, 2026 · @Fabrizio Riga

## Resumen

La base es **Smash Bros**, porque cada personaje de clase tendrá sus propios poderes. De Brawlhalla solo tomamos lo que mejor funciona y menos cuesta: esquivas con enfriamiento, stats simples por personaje y volver al escenario más fácil.

En Smash no se gana bajando una vida a cero, sino **sacando al rival del escenario**. Los pilares:

1. **Daño % → knockback.** El daño no mata; hace que salgas volando más lejos.
2. **Movimiento aéreo rico.** Salto corto, doble salto, recovery y caída rápida.
3. **Moveset único por personaje.** Ataques normales con la misma estructura para todos y 4 especiales que son sus poderes.
4. **Defensa en triángulo.** El ataque gana al agarre, el agarre gana al escudo y el escudo gana al ataque.
5. **Frame data.** Arranque, golpe activo y recuperación de cada ataque: ahí vive el balance.
6. **Bordes.** Volver al escenario y negárselo al rival es donde se cierran las vidas.

## Movimiento

El movimiento es la mitad del juego: decide quién llega antes al rival y quién vuelve al escenario. Los dos juegos priorizan control en el aire sobre realismo.

- **Saltos múltiples.** Salto + salto(s) aéreo(s).&#32;
- **Recovery.** Un movimiento especial para volver al escenario tras gastar los saltos. Si lo gastas, quedas vulnerable hasta tocar suelo.
- **Caída rápida.** Pulsar abajo en el aire acelera la caída; sirve para aterrizar antes y presionar.
- **Dash.** En suelo: arranque rápido en una dirección.&#32;
- **Plataformas atravesables.** Se cruzan desde abajo y se bajan con abajo; crean rutas y escapes.
- **Control aéreo total.** Puedes cambiar de dirección en el aire en cualquier momento. Sin esto, el juego se siente torpe.

**Propio de Smash, también entra:**

- **Salto corto.** Tocar salto en vez de mantenerlo da un salto bajo; permite atacar en el aire a ras de suelo. Es la base del juego ofensivo.
- **Esquiva aérea con aterrizaje lento.** Si aterrizas esquivando, quedas unos frames vendido.
- **Agarre al borde.** Al llegar al borde te cuelgas automáticamente, con un momento breve de invulnerabilidad.

## Combate

El corazón es la relación daño → knockback: cada golpe suma daño y cada golpe posterior lanza más lejos. Smash muestra el daño como porcentaje; Brawlhalla lo enseña con el color del indicador (blanco hacia rojo oscuro).

**Fórmula de knockback de Smash (Melee en adelante)**

```latex
KB = \left( \left( \frac{p}{10} + \frac{p \cdot d}{20} \right) \cdot \frac{200}{w + 100} \cdot 1.4 + 18 \right) \cdot s + b
```

Donde p = daño del objetivo tras el golpe, d = daño del ataque, w = peso del objetivo, s = crecimiento de knockback / 100 y b = knockback base ([SmashWiki vía EventHubs](https://www.eventhubs.com/news/2018/jun/25/knockback-will-work-differently-super-smash-bros-ultimate-almost-hitting-balloon)). Lo útil para ti: dos parámetros por ataque (base y crecimiento) y uno por personaje (peso) bastan para dar identidad.

**Hitstun.** Tras recibir un golpe no puedes actuar durante unos frames, más cuanto más fuerte es el golpe. Es lo que permite los combos: si el siguiente golpe llega antes de que acabe, es un combo garantizado.

**DI (influencia direccional).** En Smash, el que recibe puede inclinar el stick para cambiar el ángulo de salida y sobrevivir más. Da agencia al defensor.

**Moveset de Smash**

Todos los personajes tienen los mismos huecos; lo que cambia es qué hace cada ataque.

| Grupo | Ataques | Para qué |
| --- | --- | --- |
| Jab | Combo rápido de 1–3 golpes | Cortar la presión del rival |
| Tilts | Lateral, arriba, abajo | Rápidos y de poco riesgo: espaciar y combear |
| Ataque en carrera | 1 | Castigar desde lejos |
| Smash attacks | Lateral, arriba, abajo (cargables) | Lentos y fuertes: rematar |
| Aéreos | Neutral, delante, atrás, arriba, abajo | Combos en el aire y edgeguard |
| Agarre y lanzamientos | Agarre + 4 lanzamientos | Superar al escudo |
| Especiales | Neutral, lateral, arriba, abajo | **Los poderes del personaje**; el de arriba es su recovery |

**Desgaste (stale moves).** Repetir el mismo ataque reduce su daño y knockback; premia variar en vez de abusar de un golpe.

**Rage.** En Smash 4 y Ultimate, tus golpes lanzan algo más cuanto más daño llevas, entre 35% y 150% ([calculadora](https://west-games.com/smash-bros-knockback-calculator/)). Da opciones de remontada.

**Frame data.** Cada ataque tiene tres fases: arranque (startup), golpe activo y recuperación. Un arranque rápido gana intercambios; una recuperación larga deja castigarte si fallas. Este equilibrio es el balance del juego.

## Poderes de los personajes

Cada personaje de clase tiene 4 especiales, uno por dirección. Para que funcionen, cada uno debe resolver un problema distinto del combate, no solo hacer daño.

| Especial | Problema que resuelve | Ejemplos de poder |
| --- | --- | --- |
| Neutral | Controlar la distancia | Proyectil, carga de energía, trampa en el suelo |
| Lateral | Acercarse o sorprender | Embestida, teletransporte corto, látigo |
| Arriba | Volver al escenario | Supersalto, vuelo breve, gancho al borde |
| Abajo | Defender o cambiar el ritmo | Contraataque, escudo propio, mejora temporal |

**Arquetipos para 4 personajes**

| Arquetipo | Stats | Estilo |
| --- | --- | --- |
| Rushdown | Rápido, ligero | Pega mucho y de cerca; muere pronto |
| Pesado | Lento, pesado, golpes fuertes | Aguanta hasta altos %; fácil de combear |
| Zoner | Media velocidad | Proyectiles que mantienen al rival lejos |
| Equilibrado | Todo medio | Fácil de aprender; sirve de referencia para balancear |

**Reglas para diseñar poderes**

- Cada poder tiene una debilidad clara: arranque lento, recuperación larga o enfriamiento.
- El especial de arriba siempre devuelve al escenario, aunque sea mal.
- Nada que inmovilice mucho tiempo ni golpee toda la pantalla: frustra más de lo que divierte.
- El especial final tipo Final Smash queda para v2.

**Alcance realista:** 4 personajes × 4 especiales son 16 poderes con sus animaciones. Para el MVP yo haría **2 especiales por personaje** (neutral y arriba) y añadiría lateral y abajo después. Así la fase F4 pasa de 3 a unas 4 semanas, en vez de comerse el lanzamiento.

## Defensa

La defensa tiene que existir, pero siempre con un coste. Si defender sale gratis, las partidas se eternizan.

**Smash: triángulo ataque · escudo · agarre.** El escudo bloquea ataques pero se rompe si lo usas demasiado. El agarre atraviesa el escudo. El ataque gana al agarre. Además hay esquivas en el sitio, direccionales y aéreas.

- **Escudo.** Se encoge mientras lo mantienes y al recibir golpes; si se rompe, quedas aturdido unos segundos. Salir del escudo tiene unos frames de retraso, que es donde se castiga.
- **Agarre y lanzamientos.** Atraviesan el escudo. Desde el agarre eliges uno de 4 lanzamientos para colocar al rival.
- **Esquivas.** En el sitio, rodando a los lados y en el aire. Tienen recuperación: esquivar a lo loco se castiga.

**Lo mejor de Brawlhalla aquí: enfriamiento de esquiva.** En Brawlhalla, tras esquivar no puedes volver a hacerlo durante 60 frames (1 s) en suelo o 163 frames (2,7 s) en el aire ([wiki](https://brawlhalla.wiki.gg/wiki/Movement)). Es más fácil de programar y de entender que la penalización por repetir de Smash, y evita partidas de esquivas eternas.

**Chase dodge (opcional).** Tras acertar un golpe, una esquiva rápida hacia el rival para seguir el combo. Premia atacar; pruébalo tras el playtest.

## Escenario y vidas

El escenario es parte del combate: los bordes son donde se ganan las partidas.

- **Zonas de muerte (blast zones).** Límites invisibles a los lados, arriba y abajo. Cruzarlos = perder una vida.
- **Vidas (stocks).** El formato competitivo habitual es de pocas vidas, unas 3 por jugador. Partidas cortas, de 3 a 5 minutos.
- **Edgeguard.** Salir a por el rival mientras intenta volver. Es el momento de más tensión y donde se cierran muchas vidas.
- **Reaparición.** El que muere vuelve con unos segundos de invulnerabilidad para que no lo maten al aparecer.
- **Mapa competitivo.** Una plataforma principal y 1–3 flotantes. Sin trampas ni elementos aleatorios. Los objetos y mapas caóticos van aparte, como modo casual.

**Borde al estilo Smash.** Colgado del borde puedes subir, saltar, atacar o rodar, y cada opción se puede leer. Para evitar abusos, la invulnerabilidad del borde solo se da una vez hasta tocar suelo.

**Lo mejor de Brawlhalla aquí:** paredes en los laterales a las que agarrarse para saltar. Hacen la vuelta más generosa, que para jugadores nuevos de clase es mejor que el borde técnico de Smash.

## Qué tomamos de Brawlhalla

Smash es la base; de Brawlhalla solo entra lo que simplifica o hace el juego más accesible.

| De Brawlhalla | ¿Entra? | Motivo |
| --- | --- | --- |
| Enfriamiento de esquiva | Sí | Fácil de programar y de entender |
| Stats simples por personaje (fuerza, destreza, defensa, velocidad) ([patch 2.7](https://www.brawlhalla.com/news/2-7-patch-notes)) | Sí, como peso, velocidad, daño y alcance | Balancear tocando números, no código |
| Paredes para volver al escenario | Sí | Más amable para jugadores nuevos |
| Sensación más flotante | Sí, algo | Más accesible que el Smash competitivo |
| Partidas cortas a 3 vidas | Sí | Encaja con jugar entre clases |
| Chase dodge | Quizá, tras el playtest | Premia atacar, pero añade complejidad |
| Armas compartidas entre personajes | No | Choca con los poderes únicos |
| Gravity cancel | No | Complejo; no aporta a tu idea |
| Sin escudo ni agarre | No | El triángulo de Smash da más profundidad |

## Qué copiar en tu brawler

Moveset y defensa de Smash, con los poderes como especiales, más el enfriamiento de esquiva y los stats de Brawlhalla. El orden de construcción sigue tu planning, con dos cambios: F2 suma escudo y agarre, y F4 pasa a unas 4 semanas.

| Mecánica | Decisión | Fase del plan |
| --- | --- | --- |
| Salto corto, doble salto, caída rápida, control aéreo | Sí | F1 |
| Esquiva en el sitio, rodar y aérea, con enfriamiento | Sí | F1.4 |
| Agarre al borde (y paredes laterales) | Sí, versión simple | F1–F2 |
| Jab, 3 tilts, 3 aéreos, 1 smash attack | Sí, ampliable a 5 aéreos y 3 smash | F2.1–F2.2 |
| Knockback = base + crecimiento × daño, dividido por peso | Sí, simplificado | F2.3 |
| Hitstun que crece con el knockback | Sí; sin él no hay combos | F2.3 |
| Escudo que se rompe + agarre + 2 lanzamientos | Sí | F2 (+1 semana) |
| Zonas de muerte, 3 vidas, invulnerabilidad al reaparecer | Sí | F2.4 |
| Especiales neutral y arriba por personaje | Sí | F4 |
| Especiales lateral y abajo | Después del MVP | v1.1 |
| Desgaste de ataques, rage, DI, chase dodge | No en MVP | v2 |
| Final Smash | No en MVP | v2 |

**Fórmula recomendada para empezar**

```latex
KB = \left( b + s \cdot \frac{p \cdot d}{10} \right) \cdot \frac{100}{w}
```

Con p = daño acumulado tras el golpe, d = daño del ataque, b = base, s = crecimiento y w = peso del personaje (100 = medio). Todos los valores van en el archivo de constantes, para afinarlos jugando.

**Para tus 4 personajes:** un arquetipo distinto por persona (rushdown, pesado, zoner, equilibrado), stats al estilo Brawlhalla y 2 poderes cada uno en el MVP. Eso basta para que se sientan diferentes sin disparar el trabajo.

## Fuentes

- [EventHubs — fórmula de knockback de Smash](https://www.eventhubs.com/news/2018/jun/25/knockback-will-work-differently-super-smash-bros-ultimate-almost-hitting-balloon)
- [SmashWiki — Weight](https://www.ssbwiki.com/Mass)
- [Calculadora de knockback de Smash (rage)](https://west-games.com/smash-bros-knockback-calculator/)
- [Brawlhalla Wiki — Movement](https://brawlhalla.wiki.gg/wiki/Movement)
- [Brawlhalla — Patch 2.7 (stats de leyendas)](https://www.brawlhalla.com/news/2-7-patch-notes)

Los valores de frames de Brawlhalla cambian con los parches; tómalos como orden de magnitud, no como cifras exactas para copiar.
