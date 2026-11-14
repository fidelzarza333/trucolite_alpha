# Trucolite · especificación implementada

## Reglas y unidades

- Mazo español de 40 cartas: 1–7, 10, 11 y 12 en espadas, bastos, oros y copas.
- La jerarquía y el valor de envido son los establecidos en `PROMPT_trucolite_fase1.md`.
- Cada ronda reparte tres cartas por lado. El primer mano es el jugador; luego alternan.
- Una baza empatada conserva el liderazgo. La ronda se decide por bazas ganadas, primera baza no empatada y, si las tres son pardas, el mano.
- La seed y el RNG del juego son uint32. El mezclado y las elecciones aleatorias usan mulberry32.
- Los índices de arrays del núcleo son **0-based**; el port a Lua debe sumar 1.

## Progresión de la run

- Cada nivel es un duelo de hasta `rules.rounds` rondas.
- `levelTarget = ceil(rules.target × 1,5^(level - 1))`. La interfaz permite configurar `rules.target`, que por defecto es 20.
- Al alcanzar la meta, la fase pasa a `shop`, el jugador recibe $5 y se generan tres ofertas reproducibles.
- Al agotarse las rondas sin alcanzar la meta, la fase pasa a `lost` y termina la run.
- `NEXT_LEVEL` reinicia puntaje, número de ronda, contador de rondas y cambios disponibles; conserva dinero, mejoras y comodines.
- Rarezas y precios: Común $2, Poco común $4, Raro $7, Legendario $10. Probabilidades por oferta: 70% / 20% / 8% / 2%, normalizadas a las rarezas con objetos disponibles.
- Se pueden comprar varias ofertas con el dinero disponible. Las mejoras de carta requieren elegir una carta del mazo; los comodines se aplican a toda la run.
- Se pueden almacenar hasta cinco comodines. `SELL_JOKER` vende un comodín propio en cualquier fase y devuelve exactamente la mitad de su precio original; los precios impares pueden producir dinero fraccionario. La tienda también ofrece acceso al inventario para vender y hacer espacio sin cerrar la tienda.
- Las cartas mejoradas muestran sellos de rareza en la esquina: Común azul, Poco común verde, Raro rojo y Legendario amarillo. Los comodines propios se muestran en el inventario, con su valor de venta.
- `OFFICIAL_ITEMS` contiene los 18 objetos aprobados y comprables. `PROTOTYPE_ITEMS` está vacío. El catálogo está en [ITEMS.md](./ITEMS.md).

## Estado

`createGame(rules, seed)` devuelve `{ state, events }`. El estado contiene:

- `rules`, `seed`, `rng`, `phase`, `score`, `level`, `levelTarget`, `money`, `roundNumber`, `roundsCompleted`, `discardsRemaining`, `mano`.
- `deck`, `playerHand`, `rivalHand`, `jokers`, `cardUpgrades`, `officialItems` y `shopOffers`.
- `round.rivalDealt`, `round.leader`, `round.table`, `round.tricks`, `round.playerPlayedCount`, `round.trucoLevel`, `round.envido`, `round.flor`, `round.pendingCanto`, `round.rivalCantos`, `round.playerCantos` y `round.winner`.
- `round.table` usa `playerCard` y `rivalCard`, cada uno `null` o una carta `{ id, rank, suit }`.
- Ganadores de baza: `player`, `rival` o `tie`. Fases: `playing`, `respondCanto`, `roundEnded`, `shop` o `lost`.
- `round.envido` y `round.flor`: `none`, `won` o `lost`.
- El estado contiene solo datos serializables a JSON. `dispatch` no modifica el objeto recibido.

## Acciones

- `{ type: "PLAY_CARD", id }`: juega una carta propia; El Rival responde automáticamente o deja su carta visible si lideraba.
- `{ type: "DISCARD", ids }`: cambia de una a tres cartas en una acción antes de la primera carta del jugador. Las cartas descartadas vuelven al fondo del mazo después de robar.
- `{ type: "CANTAR", canto }`: `envido`, `flor`, `truco`, `retruco` o `valeCuatro`. Los cantos de Envido/Flor se resuelven al instante; El Rival responde al Truco.
- `{ type: "ANSWER_CANTO", wants }`: responde `true` (quiero) o `false` (no quiero) a un canto de Truco iniciado por El Rival.
- `{ type: "NEXT_ROUND" }`: válido solo en `roundEnded`; alterna el mano y reparte la siguiente ronda.
- `{ type: "BUY_ITEM", itemId, cardId? }`: compra solo una oferta presente y aprobada; `cardId` es obligatorio para mejoras de carta.
- `{ type: "SELL_JOKER", itemId }`: vende un comodín propio por la mitad de su precio de catálogo.
- `{ type: "NEXT_LEVEL" }`: válido solo en `shop`; aumenta la meta, conserva recursos de run y reparte la primera ronda del nivel siguiente.

Acción inválida: devuelve el mismo estado y un evento `ERROR` con código. Códigos: `WRONG_PHASE`, `CARD_NOT_IN_HAND`, `DISCARD_WINDOW_CLOSED`, `NO_DISCARDS_LEFT`, `CANTO_NOT_AVAILABLE`, `CANTO_ORDER`, `ITEM_NOT_AVAILABLE`, `ITEM_NOT_APPROVED`, `INSUFFICIENT_MONEY`, `CARD_NOT_IN_DECK`, `JOKER_LIMIT_REACHED`, `JOKER_NOT_OWNED`, `UNKNOWN_ACTION`. Una configuración inválida de `createGame` devuelve `state: null` y `INVALID_GAME_CONFIGURATION`.

## Puntuación y objetos

- Se conserva la fórmula de Fase 1: `chips × mult × xmult`.
- Las mejoras de carta activan sus efectos cuando se juega la carta marcada.
- Los comodines responden a cartas jugadas por palo/rango, a cantos de Truco ganados por el jugador o a cantos de Truco del Rival aceptados que terminan en victoria del jugador.
- Los efectos de dinero se suman al resolver la ronda en la que disparan.
- Los objetos oficiales, rarezas, precios y efectos se describen en `ITEMS.md`.

## Eventos

`ROUND_DEALT`, `RIVAL_PLAYED`, `CARDS_DISCARDED`, `ENVIDO_RESOLVED`, `FLOR_RESOLVED`, `CANTO_REQUESTED`, `CANTO_ANSWERED`, `TRICK_RESOLVED`, `ROUND_RESOLVED`, `LEVEL_WON`, `SHOP_OPENED`, `ITEM_PURCHASED`, `JOKER_SOLD`, `GAME_WON`, `GAME_LOST`, `ERROR`.

`ROUND_RESOLVED` contiene ganador, bazas por lado, `chips`, `mult`, `xmult`, `earned`, dinero ganado y penalidades `lossTruco`, `lossEnvido`, `lossFlor`. En un rechazo incluye la recompensa o penalidad de rechazo por separado de `earned`.

## Rival

- Si el jugador abre, El Rival juega la carta de menor fuerza que le gane; si no hay una, la de menor fuerza disponible.
- Si El Rival abre una baza, elige al azar una carta restante con mulberry32 y la deja visible.
- Responde quiero/no quiero comparando el promedio de fuerza de cartas no jugadas, el ajuste por bazas y ruido uniforme en [-0.15, 0.15] con el umbral del nivel.
- El Rival puede iniciar Truco en su turno de liderazgo; la decisión usa la misma lógica determinista de fuerza y umbrales.

## Interfaz

- La mesa y las cartas tienen animaciones breves; `prefers-reduced-motion` reduce las animaciones y transiciones.
- La tienda y las ofertas oficiales son accesibles desde teclado; las mejoras requieren seleccionar una carta antes de comprar.
- Una tabla junto al tablero muestra la fuerza Truco de cada valor y palo especial; aclara que la fuerza decide bazas y no suma tantos directamente.
- Al pasar el puntero o enfocar una carta propia, se muestra su fuerza, fichas base por baza ganada y modificadores activos para esa carta, aclarando cuándo se convierten en puntaje o dinero. Jugarla anima su recorrido hacia la mesa.
- Al resolver cada ronda, aparece un anuncio grande y explícito desde la perspectiva del jugador: “¡GANASTE LA RONDA!” o “PERDISTE LA RONDA”; desaparece al comenzar la siguiente.

## Compatibilidad del port

El núcleo no depende del navegador ni de Node.js. El estado no usa clases, `Set`, `Map`, prototipos especiales, funciones ni `undefined`. Las funciones trabajan con argumentos y valores de retorno explícitos.
