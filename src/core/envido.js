const SUITS = ["espadas", "bastos", "oros", "copas"];

export function envidoValue(card) {
  return card.rank >= 10 ? 0 : card.rank;
}

export function envidoTanto(cards) {
  let best = 0;
  for (let suitIndex = 0; suitIndex < SUITS.length; suitIndex += 1) {
    const values = [];
    for (let cardIndex = 0; cardIndex < cards.length; cardIndex += 1) {
      if (cards[cardIndex].suit === SUITS[suitIndex]) values.push(envidoValue(cards[cardIndex]));
    }
    if (values.length >= 2) {
      values.sort((left, right) => right - left);
      best = Math.max(best, 20 + values[0] + values[1]);
    } else if (values.length === 1) {
      best = Math.max(best, values[0]);
    }
  }
  return best;
}

export function hasFlor(cards) {
  return cards.length === 3
    && cards[0].suit === cards[1].suit
    && cards[1].suit === cards[2].suit;
}

export function florTanto(cards) {
  if (!hasFlor(cards)) return 0;
  return 20 + envidoValue(cards[0]) + envidoValue(cards[1]) + envidoValue(cards[2]);
}
