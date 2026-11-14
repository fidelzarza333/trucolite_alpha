# 🃏 ESPECIFICACIONES TÉCNICAS: SISTEMA DE COMODINES (JOKERS) DE TRUCOLITE

Este documento detalla la arquitectura, orden de ejecución, fórmulas y catálogo propuesto para la expansión del sistema de comodines en Trucolite v1.

---

## 1. ORDEN DE ACTIVACIÓN Y TIMING EN TIEMPO REAL

En Trucolite, al igual que en Balatro, el orden de los comodines es fundamental. Se evalúan secuencialmente de izquierda a derecha (ranura 1 a ranura 5):

1. **Momento del trigger:** El jugador selecciona una carta y presiona **"JUGAR CARTA ➔"**.
2. **Animación secuencial:** 
   - El sistema recorre las ranuras de comodines activas en orden (0 a 4).
   - Si un comodín cumple con su condición (por carta jugada o carta en mano), se activa con un efecto de escala (`scale(1.08)`), borde dorado y un **badge pop-up flotante** (`.joker-popup-badge`) que muestra el valor aportado:
     - `+X FICHAS` (Azul neón)
     - `+X MULT` (Rojo neón)
     - `×X MULT` (Violeta/Naranja neón)
     - `+$X` (Dorado neón)
   - Cada activación tiene una pausa rítmica de **~320ms** y un sonido con tono ascendente, permitiendo que el jugador sienta el impacto de cada sinergia.
   - Si un comodín no se activa en esa jugada, hay una micro-pausa de **~80ms** para mantener la cadencia del escaneo visual.

---

## 2. COMODINES POSICIONALES (MULTIPLICADOR DE MULT ACUMULADO)

### Regla Fundamental:
> **Un comodín posicional multiplica únicamente el acumulado de MULT aportado por los comodines situados a su izquierda. NO multiplica las Fichas (Chips).**

### Ejemplo de flujo:
Supongamos la siguiente configuración en las 5 ranuras:
- **Ranura 1:** *Pintor Verde* (Si jugás bastos, suma `+0.5` al Mult)
- **Ranura 2:** *Siete Bravo* (Si jugás un 7, suma `+0.5` al Mult)
- **Ranura 3:** *Comodín Común* (`+1.0` al Mult plano)
- **Ranura 4:** *Bastonero* (`+3` Fichas)
- **Ranura 5:** **Comodín Posicional (×2 Mult acumulado)**

**Cálculo:**
1. Mult base de la ronda: `1.0`
2. Ranura 1 (+0.5) + Ranura 2 (+0.5) + Ranura 3 (+1.0) = `+2.0 Mult` acumulado de comodines.
3. Ranura 4: Aporta `+3 Fichas` (las fichas van a su acumulador separado).
4. Ranura 5 (Posicional ×2): Toma el acumulado de `+2.0 Mult` y lo multiplica por 2 = `+4.0 Mult`.
5. Mult final = `1.0 (base) + 4.0 = 5.0 Mult`.
6. Las Fichas permanecen inalteradas por este efecto.

*Estrategia del jugador:* El jugador debe organizar sus comodines colocando los generadores de Mult a la izquierda y los multiplicadores a la derecha para maximizar el puntaje.

---

## 3. COMODINES ACTIVADOS POR CARTAS EN MANO (NO JUGADAS)

### Momento de evaluación:
> **Se evalúan inmediatamente después de que el jugador elige su carta de la baza.**

El jugador tiene 3 cartas en mano en la primera baza. Al jugar una, quedan 2 cartas en mano (`remainingHand`). En la segunda baza queda 1 carta en mano.
Los comodines con triggers `CARD_IN_HAND_SUIT` o `CARD_IN_HAND_RANK` inspeccionan estas cartas no jugadas:
- **Trigger `CARD_IN_HAND_SUIT`:** Se activa si al menos una carta restante en la mano pertenece al palo requerido (ej. "Si tenés una carta de Copas en mano al jugar, sumá +4 Fichas").
- **Trigger `CARD_IN_HAND_RANK`:** Se activa si conservás un rango específico (ej. "Si conservás un As en mano, sumá +0.75 al Mult").

*Profundidad táctica:* Crea el dilema clásico del Truco: ¿Juego mi carta más fuerte ahora para ganar la baza, o la guardo en mano para que mis comodines sigan buffeando las demás cartas?

---

## 4. PROPUESTA DE COMODINES NUEVOS

A continuación se presentan propuestas temáticas y equilibradas para someter a aprobación del jugador:

### 🔄 Categoría A: Comodines de Cambios de Carta (Discards)

| Nombre Propuesto | Rareza | Efecto / Mecánica | Sabor Criollo / Lore |
| :--- | :--- | :--- | :--- |
| **El Barajador** | Común | Otorga **+1 cambio de cartas** al inicio de cada ronda. | *"Nadie corta el mazo como él."* |
| **Manga Ancha** | Poco Común | Otorga **+2 cambios de cartas** por ronda, pero cada cambio cuesta $1 si tenés dinero. | *"Siempre le sobra una carta bajo el poncho."* |
| **Segunda Vuelta** | Poco Común | Cada vez que descartás cartas de Espadas, sumás **+2 Fichas** a la ronda. | *"El descarte también es parte del duelo."* |
| **As en la Manga** | Raro | Si terminás la ronda con **todos los cambios intactos** (0 usados), sumás **+1.5 al Mult**. | *"El verdadero truquero juega con lo que le toca."* |

---

### 💰 Categoría B: Comodines de Dinero y Economía

| Nombre Propuesto | Rareza | Efecto / Mecánica | Sabor Criollo / Lore |
| :--- | :--- | :--- | :--- |
| **El Pulpero** | Común | Al ganar una baza parda (empate), ganás **+$2 inmediatamente**. | *"En la pulpería el fiado no existe."* |
| **Apostador Pesado** | Poco Común | Ganás **+$1 de interés** por cada $5 ahorrados al superar un nivel (hasta un máximo de +$5). | *"Plata llama a plata."* |
| **La Yapa** | Poco Común | Si ganás la ronda en la tercera baza, ganás **+$3 de premio**. | *"Un extra para el que sabe aguantar hasta el final."* |
| **Cobrador de Envido** | Raro | Si ganás el Envido con 30 o más de tanto, ganás **+$4 inmediatamente**. | *"El tanto alto se cobra en mano y en efectivo."* |
| **Pacto del Malevo** | Legendario | Cada baza que gana El Rival te otorga **+$2**, pero cada baza que vos ganás te da **+1 Mult**. | *"A veces perder una batalla financia la guerra."* |

---

### ✖ Categoría C: Comodines Posicionales (Multiplicadores de Mult)

| Nombre Propuesto | Rareza | Efecto / Mecánica | Sabor Criollo / Lore |
| :--- | :--- | :--- | :--- |
| **El Redoblador** | Raro | **Multiplica por ×1.5** todo el Mult acumulado por los comodines a su izquierda. | *"Donde hubo fuego, retruco queda."* |
| **Grito Sagrado** | Legendario | **Multiplica por ×2.0** todo el Mult acumulado por los comodines a su izquierda si cantaste Truco. | *"¡Quiero vale cuatro, carajo!"* |

---

### 🎴 Categoría D: Comodines de Cartas en Mano (In-Hand)

| Nombre Propuesto | Rareza | Efecto / Mecánica | Sabor Criollo / Lore |
| :--- | :--- | :--- | :--- |
| **Espalda Cubierta** | Común | Si conservás al menos una carta de **Espadas en mano**, sumá **+3 Fichas** al jugar. | *"Nunca des la espalda sin un acero cerca."* |
| **Trago Reservado** | Poco Común | Si conservás al menos una carta de **Copas en mano**, sumá **+0.5 al Mult** al jugar. | *"El último trago se disfruta más."* |
| **El Ahorrista** | Poco Común | Si conservás una carta de **Oros en mano**, ganás **+$1** al tirar tu carta. | *"Guardar la moneda para cuando apriete el juego."* |
