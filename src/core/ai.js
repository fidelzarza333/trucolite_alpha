import { cardPower } from "./cards.js";
import { randomIndex } from "./rng.js";

export function chooseRivalResponse(cards, playerCard) {
  let chosen = cards[0];
  for (let index = 1; index < cards.length; index += 1) {
    const card = cards[index];
    const cardWins = cardPower(card) > cardPower(playerCard);
    const chosenWins = cardPower(chosen) > cardPower(playerCard);
    if ((cardWins && !chosenWins) || (cardWins === chosenWins && cardPower(card) < cardPower(chosen))) {
      chosen = card;
    }
  }
  return chosen;
}

export function chooseRivalLead(cards, rng) {
  const result = randomIndex(rng, cards.length);
  return { card: cards[result.index], rng: result.state };
}

export function decideCanto(state, canto, rng) {
  const level = canto === "truco" ? "truco" : canto === "retruco" ? "retruco" : "valeCuatro";
  const rivalWins = state.round.tricks.filter((trick) => trick.winner === "rival").length;
  const playerWins = state.round.tricks.filter((trick) => trick.winner === "player").length;
  let sum = 0;
  for (let index = 0; index < state.rivalHand.length; index += 1) {
    sum += cardPower(state.rivalHand[index]) / 14;
  }
  const strength = state.rivalHand.length === 0 ? 0 : sum / state.rivalHand.length;
  const noise = randomIndex(rng, 300001);
  const uniformNoise = noise.index / 1000000 - 0.15;
  const adjusted = strength + 0.15 * rivalWins - 0.15 * playerWins + uniformNoise;
  return {
    wants: adjusted >= state.rules.rivalThreshold[level],
    rng: noise.state,
    level,
    strength: adjusted
  };
}
