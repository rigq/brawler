# Controles

Los dos juegos de teclas de P1 funcionan siempre: el de **J K L** para jugar solo u online, y el de **C V B** para cuando dos personas comparten teclado.

## Teclado y mando

| Acción | P1 | P1 (teclado compartido) | P2 | Mando (Xbox) |
| --- | --- | --- | --- | --- |
| Moverse | A / D | A / D | ← / → | Stick izquierdo o cruceta |
| Arriba / abajo (dirección del ataque) | W / S | W / S | ↑ / ↓ | Stick o cruceta |
| Saltar | Espacio | Espacio | M (o 0 numérico) | A |
| Ataque ligero | J | C | `,` (o 1 del teclado numérico) | X |
| Ataque fuerte (mantener para cargar) | K | V | `.` (o 2 numérico) | B |
| Escudo / esquiva | L | B o Shift | `-` (o `/`, 3 numérico) | LB, RB, LT o RT |
| Especial | I | X | N (o 4 numérico) | Y |
| Provocar (quieto en el suelo, ~1 s vulnerable) | O | O | 5 numérico | View / Select |

## Movimientos

| Qué | Cómo |
| --- | --- |
| Salto corto | Toque rápido de saltar |
| Doble salto (2 en el aire) | Saltar otra vez en el aire |
| Caída rápida | Abajo cuando ya caes |
| Bajar de una plataforma | Abajo encima de ella |
| Escudo | Mantener escudo en el suelo |
| Rodar | Escudo + izquierda/derecha |
| Esquiva en el sitio | Escudo + abajo |
| Esquiva aérea (8 direcciones) | Escudo en el aire (+ dirección) |
| Salir del escudo sin espera | Saltar |

## Ataques

| Qué | Cómo |
| --- | --- |
| Jab (hasta 3 golpes) | Ligero sin dirección en el suelo; vuelve a pulsar para encadenar |
| Golpe lateral / arriba / abajo | Ligero + dirección en el suelo |
| Aéreos | Ligero en el aire: sin dirección (neutral), hacia donde miras (adelante), al revés (atrás), arriba o abajo |
| Pesados (se cargan en el suelo) | Fuerte + lado, arriba o abajo |
| Recovery (volver al escenario) | Especial + arriba, una vez hasta tocar suelo (cada personaje a su manera). **Manteniendo izquierda o derecha sale en diagonal hacia ese lado.** Además, **fuerte + arriba en el aire** da un segundo impulso (una vez por salto) |
| Agarre | **U**, o escudo + ligero (también con el escudo levantado). Mando: RB |
| Especial neutral | Especial (sin arriba) |
| Especial arriba | Especial + arriba: en casi todos es su forma de volver al escenario. El paracaídas de Donate se suelta con salto o escudo, y con especial suelta bombas (3 por paracaídas) |
| Especiales que se cargan (mantener) | Cañonazo de Donate (más grande), remate de Samu (más rápido y recto, también en el aire), ruleta de Riga (Claude → ChatGPT → Gemini → Alucinación) |
| Lanzar | Con el rival agarrado: adelante, atrás, **arriba** (mata por arriba a % alto) o **abajo** (lo deja delante para seguir el combo); ligero = adelante |

En el aire no te giras: "adelante" y "atrás" dependen de hacia dónde mirabas al saltar.

## Colgado del borde

| Qué | Cómo |
| --- | --- |
| Subir | Hacia el escenario |
| Saltar | Saltar |
| Subir atacando | Ligero o fuerte |
| Rodar hacia dentro | Escudo |
| Soltarse | Abajo o alejarse del escenario |

## Teclas del juego

| Tecla | Qué hace |
| --- | --- |
| H | Abre o cierra el panel de controles (arriba a la derecha) |
| F1 | Muestra hurtboxes (verde) y hitboxes (rojo) |
| Enter, R o Start | Revancha (partida local, al terminar) |
| Esc | Pausa (online: menú): continuar, cambiar personaje, controles, sonido o salir |
| R | Reiniciar (entrenamiento) |
| 8 | El muñeco se cubre o deja de cubrirse (entrenamiento) |
| 9 / 0 | −10 % / +10 % al muñeco (entrenamiento) |

## Direcciones (hasta que haya menú)

| Dirección | Modo |
| --- | --- |
| http://localhost:5173 | 1 contra 1 en el mismo teclado |
| `?training` | Entrenamiento contra un muñeco |
| `?p1=samu&p2=chachin` | Elegir personajes: `donate`, `robert`, `samu`, `chachin` (sin elegir: Donate contra Robert). Online los elige quien crea la sala: `?online&p1=donate&p2=donate` |
| `?online` | Crear sala online (comparte el enlace `?online=CÓDIGO`) |

W y ↑ son solo dirección: no saltan. Así W + J siempre es el golpe arriba en el suelo, aunque pulses W un poco antes (antes saltabas y salía el aéreo arriba).
