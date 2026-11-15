# Balance

Se simularon 5000 niveles por bot, usando seeds 1–5000 y `tools/simulate.mjs`. Cada nivel usa la meta inicial predeterminada de 20. El simulador resuelve un nivel aislado y no compra ni activa objetos de tienda.

| Bot | Niveles superados | Rondas promedio | Puntaje promedio | Niveles con canto | Rechazos |
|---|---:|---:|---:|---:|---:|
| never | 48.50% | 3.53 | 16.27 | 80.13% | 0.00% |
| always | 37.50% | 3.71 | 17.75 | 100.00% | 76.01% |
| smart | 58.88% | 3.14 | 20.84 | 98.70% | 39.82% |

## Valores y criterios

- Meta base: **20**.
- Meta por nivel: `ceil(meta inicial × 1,5^(nivel - 1))` (20, 30, 45, 68…).
- Rondas disponibles por nivel: 4.
- Premio por nivel: $5.
- Precios por rareza: $2 / $4 / $7 / $10.
- Peso de rareza por oferta: 60% / 25% / 11% / 4% (aumento de frecuencia para rarezas mayores).
- **Sistema de combate**: Perder rondas o cantos ya no quita puntos acumulados al jugador, reduciendo la penalización por riesgo.
- **Utilidad de Flor y Envido**: Cantar y ganar Envido o Flor premia con +$1 a la economía del jugador (-$1 si pierde).
- **Rebalanceo de Comodines (Jokers)**: Se multiplicó el impacto numérico de todos los comodines (+10 a +25 fichas, +3 a +8 mult) y se potenció la escala progresiva (Tarjeta SUBE +5 fichas/canto, Pecador +1,0 mult/rey descartado).
