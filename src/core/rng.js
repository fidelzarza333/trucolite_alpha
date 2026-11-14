export function normalizeSeed(seed) {
  if (!Number.isInteger(seed)) return null;
  return seed >>> 0;
}

export function nextRandom(rngState) {
  const state = (rngState + 0x6D2B79F5) >>> 0;
  let value = state;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  value = (value ^ (value >>> 14)) >>> 0;
  return { value: value / 4294967296, state };
}

export function randomIndex(rngState, length) {
  if (!Number.isInteger(length) || length < 1) return { index: -1, state: rngState };
  const result = nextRandom(rngState);
  return { index: Math.floor(result.value * length), state: result.state };
}
