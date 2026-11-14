import { randomIndex } from "./rng.js";

export const SUITS = ["espadas", "bastos", "oros", "copas"];
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

export function cardId(rank, suit) {
  return `${rank}-${suit}`;
}

export function createCard(rank, suit) {
  return { id: cardId(rank, suit), rank, suit };
}

export function createDeck() {
  const cards = [];
  for (let suitIndex = 0; suitIndex < SUITS.length; suitIndex += 1) {
    for (let rankIndex = 0; rankIndex < RANKS.length; rankIndex += 1) {
      cards.push(createCard(RANKS[rankIndex], SUITS[suitIndex]));
    }
  }
  return cards;
}

export function cardPower(card) {
  if (card.rank === 1 && card.suit === "espadas") return 14;
  if (card.rank === 1 && card.suit === "bastos") return 13;
  if (card.rank === 7 && card.suit === "espadas") return 12;
  if (card.rank === 7 && card.suit === "oros") return 11;
  if (card.rank === 3) return 10;
  if (card.rank === 2) return 9;
  if (card.rank === 1) return 8;
  if (card.rank === 12) return 7;
  if (card.rank === 11) return 6;
  if (card.rank === 10) return 5;
  if (card.rank === 7) return 4;
  if (card.rank === 6) return 3;
  if (card.rank === 5) return 2;
  if (card.rank === 4) return 1;
  return 0;
}

export function shuffleDeck(rngState) {
  const deck = createDeck();
  let state = rngState >>> 0;
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const result = randomIndex(state, index + 1);
    state = result.state;
    const card = deck[index];
    deck[index] = deck[result.index];
    deck[result.index] = card;
  }
  return { deck, rng: state };
}
