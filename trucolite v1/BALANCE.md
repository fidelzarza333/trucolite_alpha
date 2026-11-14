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
- Peso de rareza por oferta: 70% / 20% / 8% / 2%.

Los criterios se conservan como referencia para una sola meta: smart entre 35% y 65%, always no supera smart, never al menos 10%. En esta simulación, los tres se cumplen para un nivel. La probabilidad de completar una run de varios niveles todavía no está medida; requiere aprobar objetos y balancear la economía/progresión.
