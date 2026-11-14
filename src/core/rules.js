export const DEFAULT_RULES = {
  target: 20,
  rounds: 4,
  cardsPerRound: 3,
  discards: 3,
  chipsPerTrick: 3,
  cantos: {
    envido: { addMult: 1, lossPenalty: 2 },
    flor: { addMult: 2, lossPenalty: 2 },
    truco: { xMult: 2, lossPenalty: 3, rejectReward: 3 },
    retruco: { xMult: 3, lossPenalty: 6, rejectReward: 6 },
    valeCuatro: { xMult: 4, lossPenalty: 9, rejectReward: 9 }
  },
  rivalThreshold: { truco: 0.35, retruco: 0.45, valeCuatro: 0.55 }
};

export function createDefaultRules() {
  return JSON.parse(JSON.stringify(DEFAULT_RULES));
}

export function mergeRules(overrides) {
  const rules = createDefaultRules();
  if (!overrides || typeof overrides !== "object") return rules;
  const scalarKeys = ["target", "rounds", "cardsPerRound", "discards", "chipsPerTrick"];
  for (let index = 0; index < scalarKeys.length; index += 1) {
    const key = scalarKeys[index];
    if (overrides[key] !== undefined) rules[key] = overrides[key];
  }
  const cantoNames = ["envido", "flor", "truco", "retruco", "valeCuatro"];
  for (let index = 0; index < cantoNames.length; index += 1) {
    const key = cantoNames[index];
    if (overrides.cantos && overrides.cantos[key]) {
      rules.cantos[key] = { ...rules.cantos[key], ...overrides.cantos[key] };
    }
  }
  if (overrides.rivalThreshold) {
    rules.rivalThreshold = { ...rules.rivalThreshold, ...overrides.rivalThreshold };
  }
  return rules;
}

export function validateRules(rules) {
  const errors = [];
  if (!rules || typeof rules !== "object") return { valid: false, errors: ["rules"] };
  if (!Number.isInteger(rules.target) || rules.target < 1) errors.push("target");
  if (!Number.isInteger(rules.rounds) || rules.rounds < 1) errors.push("rounds");
  if (rules.cardsPerRound !== 3) errors.push("cardsPerRound");
  if (!Number.isInteger(rules.discards) || rules.discards < 0) errors.push("discards");
  if (!Number.isInteger(rules.chipsPerTrick) || rules.chipsPerTrick < 0) errors.push("chipsPerTrick");
  const names = ["envido", "flor", "truco", "retruco", "valeCuatro"];
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    const canto = rules.cantos && rules.cantos[name];
    if (!canto) {
      errors.push(`cantos.${name}`);
      continue;
    }
    const properties = index < 2
      ? ["addMult", "lossPenalty"]
      : ["xMult", "lossPenalty", "rejectReward"];
    for (let propertyIndex = 0; propertyIndex < properties.length; propertyIndex += 1) {
      const property = properties[propertyIndex];
      if (!Number.isFinite(canto[property]) || canto[property] < 0) {
        errors.push(`cantos.${name}.${property}`);
      }
    }
  }
  const thresholds = ["truco", "retruco", "valeCuatro"];
  for (let index = 0; index < thresholds.length; index += 1) {
    const threshold = rules.rivalThreshold && rules.rivalThreshold[thresholds[index]];
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
      errors.push(`rivalThreshold.${thresholds[index]}`);
    }
  }
  return { valid: errors.length === 0, errors };
}
