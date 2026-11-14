import { cardForId } from "../src/core/game.js";
import { createDeck } from "../src/core/cards.js";

export function withHands(state, setup) {
  const next = JSON.parse(JSON.stringify(state));
  next.playerHand = setup.player.map(cardForId);
  next.rivalHand = setup.rival.map(cardForId);
  if (setup.deck) {
    next.deck = setup.deck.map(cardForId);
  } else {
    const used = new Set(setup.player.concat(setup.rival));
    next.deck = createDeck().filter((card) => !used.has(card.id));
  }
  next.mano = setup.mano || "player";
  next.round = {
    rivalDealt: next.rivalHand.slice(),
    leader: next.mano,
    table: { playerCard: null, rivalCard: null },
    tricks: [],
    playerPlayedCount: 0,
    trucoLevel: 0,
    envido: "none",
    flor: "none",
    pendingCanto: null,
    rivalCantos: [],
    playerCantos: [],
    winner: null
  };
  return next;
}

export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(value[key]);
  }
  return value;
}

export function allCardIds(state) {
  const ids = state.deck.map((card) => card.id)
    .concat(state.playerHand.map((card) => card.id))
    .concat(state.rivalHand.map((card) => card.id));
  for (const trick of state.round.tricks) {
    ids.push(trick.playerCard.id, trick.rivalCard.id);
  }
  if (state.round.table.playerCard) ids.push(state.round.table.playerCard.id);
  if (state.round.table.rivalCard) ids.push(state.round.table.rivalCard.id);
  return ids;
}
