function applyStage(base, effects, stage) {
  let value = base;
  for (let index = 0; index < effects.length; index += 1) {
    const effect = effects[index];
    if (effect.stage !== stage) continue;
    if (effect.op === "add") value += effect.value;
    if (effect.op === "mul") value *= effect.value;
  }
  return value;
}

export function scoreRound(ctx, effects) {
  const activeEffects = effects || [];
  const playerTricks = ctx.round.tricks.filter((trick) => trick.winner === "player").length;
  const rivalTricks = ctx.round.tricks.filter((trick) => trick.winner === "rival").length;
  const winner = ctx.winner || getRoundWinner(ctx.round.tricks, ctx.mano);
  const chipsBase = playerTricks * ctx.rules.chipsPerTrick;
  const chips = applyStage(chipsBase, activeEffects, "chips");
  const multBase = 1
    + (ctx.round.envido === "won" ? ctx.rules.cantos.envido.addMult : 0)
    + (ctx.round.flor === "won" ? ctx.rules.cantos.flor.addMult : 0);
  const mult = applyStage(multBase, activeEffects, "mult");
  const levelName = ctx.round.trucoLevel === 1
    ? "truco"
    : ctx.round.trucoLevel === 2 ? "retruco" : ctx.round.trucoLevel === 3 ? "valeCuatro" : null;
  const xmultBase = levelName ? ctx.rules.cantos[levelName].xMult : 1;
  const xmult = applyStage(xmultBase, activeEffects, "xmult");
  const earned = winner === "player" ? Math.floor(chips * mult * xmult) : 0;
  const lossTruco = winner === "rival" && levelName ? ctx.rules.cantos[levelName].lossPenalty : 0;
  const lossEnvido = ctx.round.envido === "lost" ? ctx.rules.cantos.envido.lossPenalty : 0;
  const lossFlor = ctx.round.flor === "lost" ? ctx.rules.cantos.flor.lossPenalty : 0;
  const score = Math.max(0, ctx.score + earned - lossTruco - lossEnvido - lossFlor);
  return {
    winner,
    playerTricks,
    rivalTricks,
    chips,
    mult,
    xmult,
    earned,
    lossTruco,
    lossEnvido,
    lossFlor,
    score
  };
}

export function getRoundWinner(tricks, mano) {
  let playerWins = 0;
  let rivalWins = 0;
  let firstDecisive = null;
  for (let index = 0; index < tricks.length; index += 1) {
    const winner = tricks[index].winner;
    if (winner === "player") playerWins += 1;
    if (winner === "rival") rivalWins += 1;
    if (firstDecisive === null && winner !== "tie") firstDecisive = winner;
  }
  if (playerWins > rivalWins) return "player";
  if (rivalWins > playerWins) return "rival";
  if (firstDecisive) return firstDecisive;
  return mano;
}
