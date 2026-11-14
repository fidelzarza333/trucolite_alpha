import test from "node:test";
import assert from "node:assert/strict";
import { cardPower, createDeck, shuffleDeck } from "../src/core/cards.js";
import { envidoTanto, florTanto, hasFlor } from "../src/core/envido.js";
import { nextRandom } from "../src/core/rng.js";

function card(id) {
  const parts = id.split("-");
  return { id, rank: Number(parts[0]), suit: parts[1] };
}

test("deck contains 40 unique cards and 10 per suit", () => {
  const deck = createDeck();
  assert.equal(deck.length, 40);
  assert.equal(new Set(deck.map((item) => item.id)).size, 40);
  for (const suit of ["espadas", "bastos", "oros", "copas"]) {
    assert.equal(deck.filter((item) => item.suit === suit).length, 10);
  }
});

test("all 40 cards have the specified hierarchy", () => {
  const expected = new Map([
    ["1-espadas", 14], ["1-bastos", 13], ["7-espadas", 12], ["7-oros", 11],
    ["3-espadas", 10], ["3-bastos", 10], ["3-oros", 10], ["3-copas", 10],
    ["2-espadas", 9], ["2-bastos", 9], ["2-oros", 9], ["2-copas", 9],
    ["1-copas", 8], ["1-oros", 8],
    ["12-espadas", 7], ["12-bastos", 7], ["12-oros", 7], ["12-copas", 7],
    ["11-espadas", 6], ["11-bastos", 6], ["11-oros", 6], ["11-copas", 6],
    ["10-espadas", 5], ["10-bastos", 5], ["10-oros", 5], ["10-copas", 5],
    ["7-copas", 4], ["7-bastos", 4],
    ["6-espadas", 3], ["6-bastos", 3], ["6-oros", 3], ["6-copas", 3],
    ["5-espadas", 2], ["5-bastos", 2], ["5-oros", 2], ["5-copas", 2],
    ["4-espadas", 1], ["4-bastos", 1], ["4-oros", 1], ["4-copas", 1]
  ]);
  assert.equal(expected.size, 40);
  for (const item of createDeck()) assert.equal(cardPower(item), expected.get(item.id), item.id);
  assert.equal(cardPower(card("3-espadas")), cardPower(card("3-copas")));
  for (const item of createDeck()) {
    if (item.id !== "1-espadas") assert.ok(cardPower(card("1-espadas")) > cardPower(item));
  }
});

test("envido and flor examples match the specification", () => {
  const cases = [
    { hand: ["7-espadas", "6-espadas", "1-copas"], tanto: 33, flor: false, florValue: 0 },
    { hand: ["12-oros", "11-oros", "10-oros"], tanto: 20, flor: true, florValue: 20 },
    { hand: ["7-espadas", "7-oros", "7-copas"], tanto: 7, flor: false, florValue: 0 },
    { hand: ["12-copas", "11-oros", "10-bastos"], tanto: 0, flor: false, florValue: 0 },
    { hand: ["1-espadas", "5-espadas", "7-espadas"], tanto: 32, flor: true, florValue: 33 },
    { hand: ["5-oros", "4-copas", "3-bastos"], tanto: 5, flor: false, florValue: 0 }
  ];
  for (const entry of cases) {
    const hand = entry.hand.map(card);
    assert.equal(envidoTanto(hand), entry.tanto, entry.hand.join(","));
    assert.equal(hasFlor(hand), entry.flor, entry.hand.join(","));
    assert.equal(florTanto(hand), entry.florValue, entry.hand.join(","));
  }
});

test("seeded shuffle repeats, differs by seed, and advances RNG", () => {
  assert.deepEqual(shuffleDeck(123).deck, shuffleDeck(123).deck);
  assert.notDeepEqual(shuffleDeck(123).deck, shuffleDeck(124).deck);
  const first = nextRandom(123);
  const second = nextRandom(first.state);
  assert.notEqual(first.state, 123);
  assert.notEqual(second.value, first.value);
});
