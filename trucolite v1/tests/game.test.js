import test from "node:test";
import assert from "node:assert/strict";
import { dispatch, createGame, cantoAvailable } from "../src/core/game.js";
import { cardPower } from "../src/core/cards.js";
import { scoreRound, getRoundWinner } from "../src/core/scoring.js";
import { createDefaultRules } from "../src/core/rules.js";
import { OFFICIAL_ITEMS, PROTOTYPE_ITEMS } from "../src/core/items.js";
import { cardModifierSummary, getRoundOutcome } from "../src/ui/render.js";
import { deepFreeze, withHands, allCardIds } from "./helpers.js";
import { fileURLToPath } from "node:url";

function trick(winner, leader) {
  return { winner, leader, playerCard: { id: "1-espadas" }, rivalCard: { id: "2-espadas" } };
}

test("round outcome announcement is scoped to the finished round", () => {
  const resolved = {
    type: "ROUND_RESOLVED",
    roundNumber: 2,
    winner: "rival",
    score: 8
  };
  assert.equal(getRoundOutcome([resolved], { phase: "playing", roundNumber: 2 }), null);
  assert.equal(getRoundOutcome([resolved], { phase: "roundEnded", roundNumber: 2 }), resolved);
  assert.equal(getRoundOutcome([resolved], { phase: "shop", roundNumber: 2 }), resolved);
  assert.equal(getRoundOutcome([resolved], { phase: "roundEnded", roundNumber: 3 }), null);
});

test("card tooltip totals matching upgrades and suit/rank joker effects", () => {
  const card = { id: "7-bastos", rank: 7, suit: "bastos" };
  const state = {
    rules: { chipsPerTrick: 3 },
    cardUpgrades: [
      { cardId: card.id, itemId: "carta-brillo-cobre" },
      { cardId: card.id, itemId: "carta-tinta-de-canto" },
      { cardId: card.id, itemId: "carta-cara-acunada" }
    ],
    officialItems: OFFICIAL_ITEMS,
    jokers: [
      OFFICIAL_ITEMS.find((item) => item.id === "comodin-bastos-fichas"),
      OFFICIAL_ITEMS.find((item) => item.id === "comodin-bastos-dinero")
    ]
  };
  assert.deepEqual(cardModifierSummary(card, state), [
    "Fuerza de baza: 4 (no suma directamente al puntaje)",
    "Puntaje base: +3 fichas por baza ganada (suman si ganás la ronda)",
    "Modificador: +5 fichas (si ganás la ronda)",
    "Modificador: +0.25 al multiplicador",
    "Dinero: +$3 al resolver la ronda, aunque la pierdas",
    "Mejora Brillo de cobre: La carta marcada suma +2 fichas cuando la jugás.",
    "Mejora Tinta de canto: La carta marcada suma +0,25 al multiplicador cuando la jugás.",
    "Mejora Cara acuñada: Ganás +$1 cada vez que jugás la carta marcada.",
    "Comodín Bastonero: Si jugás una carta de bastos, suma +3 fichas a la ronda.",
    "Comodín Mercader de bastos: Si jugás una carta de bastos, ganás +$2."
  ]);
});

test("round winner follows the complete truco precedence table", () => {
  const groups = [
    { sequences: ["JJJ", "JJR", "JRJ", "RJJ", "JJT", "JTJ", "TJJ", "JTT", "TJT", "TTJ", "JRT", "JTR", "TJR"], winner: "player" },
    { sequences: ["RJT", "RTJ", "TRJ", "RRR", "RRJ", "RJR", "JRR"], winner: "rival" }
  ];
  for (const group of groups) {
    for (const sequence of group.sequences) {
      const tricks = Array.from(sequence, (char) => trick(char === "J" ? "player" : char === "R" ? "rival" : "tie", "player"));
      assert.equal(getRoundWinner(tricks, "player"), group.winner, sequence);
    }
  }
  assert.equal(getRoundWinner(["tie", "tie", "tie"].map((item) => trick(item, "rival")), "rival"), "rival");
  assert.equal(getRoundWinner(["tie", "tie", "tie"].map((item) => trick(item, "player")), "player"), "player");
});

test("dispatch is pure, serializable, and deterministic for repeated action logs", () => {
  const initial = createGame(undefined, 343).state;
  const frozen = deepFreeze(initial);
  const action = { type: "PLAY_CARD", id: frozen.playerHand[0].id };
  assert.doesNotThrow(() => dispatch(frozen, action));
  assert.deepEqual(initial, frozen);
  assert.deepEqual(JSON.parse(JSON.stringify(initial)), initial);
  const run = () => {
    let state = createGame(undefined, 898).state;
    for (let count = 0; count < 10 && state.phase === "playing"; count += 1) {
      const result = dispatch(state, { type: "PLAY_CARD", id: state.playerHand[0].id });
      state = result.state;
    }
    return JSON.stringify(state);
  };
  assert.equal(run(), run());
});

test("core modules avoid browser, clock, and unseeded randomness tokens", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const root = fileURLToPath(new URL("../src/core/", import.meta.url));
  const files = fs.readdirSync(root).filter((name) => name.endsWith(".js"));
  const forbidden = ["window", "document", "localStorage", "Math.random", "Date", "setTimeout", "crypto"];
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    for (const token of forbidden) assert.equal(source.includes(token), false, `${file} contains ${token}`);
  }
});

test("discard window, cost, replacement order, and card uniqueness", () => {
  for (let seed = 1; seed <= 1000; seed += 1) {
    const initial = createGame(undefined, seed).state;
    const selected = initial.playerHand[0].id;
    const result = dispatch(initial, { type: "DISCARD", ids: [selected] });
    assert.equal(result.state.playerHand.length, 3);
    assert.equal(result.state.discardsRemaining, initial.discardsRemaining - 1);
    assert.equal(result.state.playerHand.some((card) => card.id === selected), false);
    const ids = allCardIds(result.state);
    assert.equal(new Set(ids).size, ids.length, `seed ${seed}`);
  }
  let state = createGame(undefined, 4).state;
  const selected = state.playerHand[0].id;
  state = dispatch(state, { type: "PLAY_CARD", id: selected }).state;
  assert.equal(dispatch(state, { type: "DISCARD", ids: [state.playerHand[0].id] }).events[0].code, "DISCARD_WINDOW_CLOSED");
  state = createGame({ discards: 0 }, 5).state;
  assert.equal(dispatch(state, { type: "DISCARD", ids: [state.playerHand[0].id] }).events[0].code, "NO_DISCARDS_LEFT");
});

test("mano alternates and rival leads visibly after NEXT_ROUND", () => {
  let state = createGame({
    rounds: 3,
    rivalThreshold: { truco: 1, retruco: 1, valeCuatro: 1 }
  }, 3).state;
  state = withHands(state, {
    player: ["4-espadas", "5-bastos", "6-oros"],
    rival: ["3-copas", "2-oros", "1-copas"],
    mano: "player"
  });
  state.rules.rivalThreshold = { truco: 10, retruco: 10, valeCuatro: 10 };
  let played = dispatch(state, { type: "PLAY_CARD", id: "4-espadas" });
  assert.equal(played.events.filter((item) => item.type === "RIVAL_PLAYED").length, 2);
  assert.equal(played.events[0].leader, false);
  assert.equal(played.events[2].leader, true);
  state = played.state;
  assert.equal(state.round.leader, "rival");
  assert.notEqual(state.round.table.rivalCard, null);
  state = dispatch(state, { type: "PLAY_CARD", id: state.playerHand[0].id }).state;
  state = dispatch(state, { type: "PLAY_CARD", id: state.playerHand[0].id }).state;
  while (state.phase === "playing") {
    state = dispatch(state, { type: "PLAY_CARD", id: state.playerHand[0].id }).state;
  }
  assert.equal(state.phase, "roundEnded");
  const next = dispatch(state, { type: "NEXT_ROUND" });
  assert.equal(next.state.mano, "rival");
  assert.equal(next.events.some((item) => item.type === "RIVAL_PLAYED" && item.leader), true);
  assert.notEqual(next.state.round.table.rivalCard, null);
});

test("the winner leads next and a parda preserves the previous leader", () => {
  let state = withHands(createGame(undefined, 14).state, {
    player: ["1-espadas", "5-bastos", "6-oros"],
    rival: ["1-bastos", "3-copas", "4-oros"]
  });
  state = dispatch(state, { type: "PLAY_CARD", id: "1-espadas" }).state;
  assert.equal(state.round.tricks[0].winner, "player");
  assert.equal(state.round.leader, "player");
  assert.equal(state.round.table.rivalCard, null);

  state = withHands(createGame(undefined, 15).state, {
    player: ["3-espadas", "4-oros", "5-oros"],
    rival: ["3-bastos", "3-oros", "3-copas"]
  });
  state = dispatch(state, { type: "PLAY_CARD", id: "3-espadas" }).state;
  assert.equal(state.round.tricks[0].winner, "tie");
  assert.equal(state.round.tricks[0].leader, "player");
  assert.equal(state.round.leader, "player");
});

test("cantos follow order, availability, responses, and reject rewards", () => {
  const rules = createDefaultRules();
  rules.rivalThreshold = { truco: 1, retruco: 1, valeCuatro: 1 };
  let state = createGame(rules, 6).state;
  const florHand = withHands(state, {
    player: ["1-espadas", "5-espadas", "7-espadas"],
    rival: ["4-oros", "5-oros", "6-oros"],
    deck: ["1-bastos", "2-bastos", "3-bastos"]
  });
  assert.equal(cantoAvailable(florHand, "envido"), false);
  assert.equal(cantoAvailable(florHand, "flor"), true);
  let result = dispatch(florHand, { type: "CANTAR", canto: "flor" });
  assert.equal(result.events[0].type, "FLOR_RESOLVED");
  assert.equal(dispatch(florHand, { type: "CANTAR", canto: "retruco" }).events[0].code, "CANTO_ORDER");

  state = createGame(rules, 7).state;
  result = dispatch(state, { type: "CANTAR", canto: "retruco" });
  assert.equal(result.events[0].code, "CANTO_ORDER");
  let rejection = null;
  for (let seed = 1; seed < 100; seed += 1) {
    state = createGame(rules, seed).state;
    result = dispatch(state, { type: "CANTAR", canto: "truco" });
    if (result.events.some((item) => item.type === "CANTO_ANSWERED" && !item.wants)) {
      rejection = result;
      break;
    }
  }
  assert.ok(rejection);
  assert.equal(rejection.state.roundsCompleted, 1);
  assert.equal(rejection.state.score, rules.cantos.truco.rejectReward);
  assert.equal(rejection.events.some((item) => item.type === "ROUND_RESOLVED"), true);
  state = createGame(undefined, 88).state;
  state = dispatch(state, { type: "PLAY_CARD", id: state.playerHand[0].id }).state;
  assert.equal(cantoAvailable(state, "envido"), false);
  assert.equal(dispatch(state, { type: "CANTAR", canto: "envido" }).events[0].code, "CANTO_NOT_AVAILABLE");
});

test("the accepted canto chain and all reject rewards follow their levels", () => {
  const acceptingRules = createDefaultRules();
  acceptingRules.rivalThreshold = { truco: 0, retruco: 0, valeCuatro: 0 };
  let state = withHands(createGame(acceptingRules, 49).state, {
    player: ["4-oros", "5-oros", "6-oros"],
    rival: ["1-espadas", "1-bastos", "7-espadas"]
  });
  for (const [canto, level] of [["truco", 1], ["retruco", 2], ["valeCuatro", 3]]) {
    const result = dispatch(state, { type: "CANTAR", canto });
    assert.equal(result.events[0].type, "CANTO_ANSWERED");
    assert.equal(result.events[0].wants, true);
    state = result.state;
    assert.equal(state.round.trucoLevel, level);
    if (level === 1) {
      assert.equal(dispatch(state, { type: "CANTAR", canto: "truco" }).events[0].code, "CANTO_ORDER");
    }
  }

  const rejectingRules = createDefaultRules();
  rejectingRules.rivalThreshold = { truco: 1, retruco: 1, valeCuatro: 1 };
  for (const [canto, level, reward] of [
    ["truco", 0, 3], ["retruco", 1, 6], ["valeCuatro", 2, 9]
  ]) {
    state = withHands(createGame(rejectingRules, 55).state, {
      player: ["1-espadas", "1-bastos", "7-espadas"],
      rival: ["4-espadas", "5-espadas", "6-espadas"]
    });
    state.round.trucoLevel = level;
    const result = dispatch(state, { type: "CANTAR", canto });
    assert.equal(result.events[0].type, "CANTO_ANSWERED");
    assert.equal(result.events[0].wants, false);
    assert.equal(result.state.score, reward);
    const resolved = result.events.find((item) => item.type === "ROUND_RESOLVED");
    assert.equal(resolved.earned, 0);
    assert.equal(resolved.rejectReward, reward);
  }
});

test("envido tie is decided by mano and rival tanto uses the dealt hand", () => {
  const cards = {
    player: ["7-espadas", "6-espadas", "1-copas"],
    rival: ["7-bastos", "6-bastos", "1-oros"]
  };
  let state = withHands(createGame(undefined, 18).state, cards);
  state.rules.rivalThreshold = { truco: 10, retruco: 10, valeCuatro: 10 };
  let result = dispatch(state, { type: "CANTAR", canto: "envido" });
  assert.equal(result.events[0].playerTanto, 33);
  assert.equal(result.events[0].rivalTanto, 33);
  assert.equal(result.events[0].winner, "player");
  state = withHands(createGame(undefined, 19).state, { ...cards, mano: "rival" });
  state.rules.rivalThreshold = { truco: 10, retruco: 10, valeCuatro: 10 };
  state.round.table.rivalCard = state.rivalHand.shift();
  result = dispatch(state, { type: "CANTAR", canto: "envido" });
  assert.equal(result.events[0].playerTanto, 33);
  assert.equal(result.events[0].rivalTanto, 33);
  assert.equal(result.events[0].winner, "rival");
});

test("scoring formulas, penalties, rejects, and joker effect pipeline", () => {
  const rules = createDefaultRules();
  const baseRound = {
    tricks: [trick("player", "player"), trick("player", "player"), trick("rival", "player")],
    envido: "none", flor: "none", trucoLevel: 0
  };
  const base = (round, effects, winner) => scoreRound({ rules, round, mano: "player", score: 0, winner }, effects);
  assert.equal(base(baseRound, []).earned, 6);
  assert.equal(base({ ...baseRound, envido: "won" }, []).earned, 12);
  assert.equal(base({ ...baseRound, flor: "won", tricks: [trick("player"), trick("player"), trick("player")] }, []).earned, 27);
  for (const entry of [
    { level: 1, earned: 12 }, { level: 2, earned: 18 }, { level: 3, earned: 24 }
  ]) {
    assert.equal(base({ ...baseRound, trucoLevel: entry.level }, []).earned, entry.earned);
  }
  const threeWon = { ...baseRound, tricks: [trick("player"), trick("player"), trick("player")] };
  assert.equal(base({ ...threeWon, envido: "won", trucoLevel: 3 }, []).earned, 72);
  let lost = base({ ...baseRound, trucoLevel: 2 }, [], "rival");
  assert.equal(lost.score, 0);
  const score20 = scoreRound({ rules, round: { ...baseRound, trucoLevel: 2 }, mano: "player", score: 20, winner: "rival" }, []);
  assert.equal(score20.score, 14);
  const score4 = scoreRound({ rules, round: { ...baseRound, trucoLevel: 2 }, mano: "player", score: 4, winner: "rival" }, []);
  assert.equal(score4.score, 0);
  const lostEnvido = scoreRound({
    rules,
    round: { ...baseRound, envido: "lost" },
    mano: "player",
    score: 0,
    winner: "player"
  }, []);
  assert.equal(lostEnvido.score, 4);
  assert.equal(lostEnvido.lossEnvido, 2);
  const effects = [
    { stage: "chips", op: "add", value: 4 },
    { stage: "mult", op: "add", value: 2 },
    { stage: "xmult", op: "mul", value: 1.5 }
  ];
  assert.equal(base(baseRound, effects).earned, 45);
  assert.equal(base({ ...baseRound, trucoLevel: 1 }, effects).earned, 90);
});

test("game ends on target or exhausted rounds; next round phase is guarded", () => {
  let state = withHands(createGame({ target: 1, rounds: 1 }, 20).state, {
    player: ["1-espadas", "1-bastos", "7-espadas"],
    rival: ["4-espadas", "5-espadas", "6-espadas"]
  });
  state.rules.rivalThreshold = { truco: 10, retruco: 10, valeCuatro: 10 };
  while (state.phase === "playing") {
    state = dispatch(state, { type: "PLAY_CARD", id: state.playerHand[0].id }).state;
  }
  assert.equal(state.phase, "shop");
  assert.equal(state.level, 1);
  assert.equal(state.levelTarget, 1);
  assert.equal(state.money, 5);
  assert.equal(state.shopOffers.length, 3);
  assert.equal(dispatch(state, { type: "NEXT_ROUND" }).events[0].code, "WRONG_PHASE");
  const nextLevel = dispatch(state, { type: "NEXT_LEVEL" });
  assert.equal(nextLevel.state.level, 2);
  assert.equal(nextLevel.state.levelTarget, 2);
  assert.equal(nextLevel.state.score, 0);
  assert.equal(nextLevel.state.money, 5);
  state = withHands(createGame({ target: 9999, rounds: 1 }, 21).state, {
    player: ["4-espadas", "5-espadas", "6-espadas"],
    rival: ["1-espadas", "1-bastos", "7-espadas"]
  });
  state.rules.rivalThreshold = { truco: 10, retruco: 10, valeCuatro: 10 };
  while (state.phase === "playing") {
    state = dispatch(state, { type: "PLAY_CARD", id: state.playerHand[0].id }).state;
  }
  assert.equal(state.phase, "lost");
  assert.equal(cardPower({ rank: 1, suit: "espadas" }), 14);
});

test("level targets rise by 1.5x and run resources persist between levels", () => {
  let state = createGame({ target: 20 }, 22).state;
  state.phase = "shop";
  state.money = 5;
  state.cardUpgrades = [{ cardId: "7-bastos", itemId: "fixture-upgrade" }];
  state.jokers = [{ id: "fixture-joker" }];
  state.shopOffers = ["fixture-offer"];
  state = dispatch(state, { type: "NEXT_LEVEL" }).state;
  assert.equal(state.levelTarget, 30);
  assert.equal(state.money, 5);
  assert.equal(state.cardUpgrades.length, 1);
  assert.equal(state.jokers.length, 1);
  state.phase = "shop";
  state = dispatch(state, { type: "NEXT_LEVEL" }).state;
  assert.equal(state.levelTarget, 45);
});

test("shop offers approved items and blocks unapproved purchases", () => {
  let state = withHands(createGame({ target: 1, rounds: 1 }, 1).state, {
    player: ["1-espadas", "1-bastos", "7-espadas"],
    rival: ["4-espadas", "5-espadas", "6-espadas"]
  });
  state.rules.rivalThreshold = { truco: 10, retruco: 10, valeCuatro: 10 };
  while (state.phase === "playing") {
    state = dispatch(state, { type: "PLAY_CARD", id: state.playerHand[0].id }).state;
  }
  assert.equal(state.phase, "shop");
  assert.equal(state.money, 5);
  assert.equal(state.shopOffers.length, 3);
  assert.equal(new Set(state.shopOffers).size, 3);
  assert.ok(state.shopOffers.every((id) => OFFICIAL_ITEMS.some((item) => item.id === id)));
  assert.equal(PROTOTYPE_ITEMS.length, 0);
  state.officialItems = [];
  const purchase = dispatch(state, { type: "BUY_ITEM", itemId: state.shopOffers[0] });
  assert.equal(purchase.events[0].code, "ITEM_NOT_APPROVED");
  assert.equal(purchase.state, state);
});

test("the approved catalog is buyable and uses the chosen joker names", () => {
  let state = createGame(undefined, 25).state;
  state.phase = "shop";
  state.money = 10;
  state.shopOffers = ["carta-brillo-cobre"];
  const purchase = dispatch(state, {
    type: "BUY_ITEM",
    itemId: "carta-brillo-cobre",
    cardId: "7-bastos"
  });
  assert.equal(purchase.events[0].type, "ITEM_PURCHASED");
  assert.equal(purchase.state.money, 8);
  assert.deepEqual(purchase.state.cardUpgrades, [
    { cardId: "7-bastos", itemId: "carta-brillo-cobre" }
  ]);
  assert.equal(OFFICIAL_ITEMS.length, 33);
  assert.equal(OFFICIAL_ITEMS.find((item) => item.id === "comodin-bastos-fichas").name, "Bastonero");
  assert.equal(OFFICIAL_ITEMS.find((item) => item.id === "comodin-rival-pierde-mult").name, "La última palabra");
  assert.equal(OFFICIAL_ITEMS.find((item) => item.id === "comodin-rival-pierde-dinero").name, "La revancha");
});

test("joker inventory is capped at five and sells for half the original price", () => {
  const jokers = OFFICIAL_ITEMS.filter((item) => item.kind === "joker");
  let state = createGame(undefined, 26).state;
  state.phase = "shop";
  state.money = 1;
  state.jokers = jokers.slice(0, 5);
  state.shopOffers = ["comodin-truco-ganado-fichas"];

  const blocked = dispatch(state, { type: "BUY_ITEM", itemId: "comodin-truco-ganado-fichas" });
  assert.equal(blocked.events[0].code, "JOKER_LIMIT_REACHED");
  assert.equal(blocked.state, state);

  const sold = dispatch(state, { type: "SELL_JOKER", itemId: "comodin-bastos-dinero" });
  assert.equal(sold.events[0].type, "JOKER_SOLD");
  assert.equal(sold.events[0].refund, 3.5);
  assert.equal(sold.state.money, 4.5);
  assert.equal(sold.state.jokers.length, 4);
  assert.equal(state.jokers.length, 5);

  const bought = dispatch(sold.state, { type: "BUY_ITEM", itemId: "comodin-truco-ganado-fichas" });
  assert.equal(bought.events[0].type, "ITEM_PURCHASED");
  assert.equal(bought.state.money, 2.5);
  assert.equal(bought.state.jokers.length, 5);

  const unownedSale = dispatch(bought.state, { type: "SELL_JOKER", itemId: "comodin-bastos-dinero" });
  assert.equal(unownedSale.events[0].code, "JOKER_NOT_OWNED");
});

test("the Rival can initiate a canto and the player can accept or refuse it", () => {
  let state = createGame({ rounds: 4 }, 8).state;
  state.rules.rivalThreshold = { truco: -1, retruco: -1, valeCuatro: -1 };
  state.phase = "roundEnded";
  state.roundsCompleted = 1;
  let result = dispatch(state, { type: "NEXT_ROUND" });
  assert.equal(result.state.phase, "respondCanto");
  assert.equal(result.events.some((item) => item.type === "CANTO_REQUESTED" && item.caller === "rival"), true);
  assert.equal(dispatch(result.state, { type: "PLAY_CARD", id: result.state.playerHand[0].id }).events[0].code, "WRONG_PHASE");
  const refused = dispatch(result.state, { type: "ANSWER_CANTO", wants: false });
  assert.equal(refused.state.phase, "roundEnded");
  assert.equal(refused.state.score, 0);
  assert.equal(refused.events.some((item) => item.type === "ROUND_RESOLVED" && item.rivalRejectReward === 3), true);

  state = createGame({ rounds: 4 }, 9).state;
  state.rules.rivalThreshold = { truco: -1, retruco: -1, valeCuatro: -1 };
  state.phase = "roundEnded";
  state.roundsCompleted = 1;
  result = dispatch(state, { type: "NEXT_ROUND" });
  const accepted = dispatch(result.state, { type: "ANSWER_CANTO", wants: true });
  assert.equal(accepted.state.phase, "playing");
  assert.deepEqual(accepted.state.round.rivalCantos, ["truco"]);
  assert.notEqual(accepted.state.round.table.rivalCard, null);
});

test("approved item purchase and card/joker triggers feed scoring and money", () => {
  const upgrade = OFFICIAL_ITEMS.find((item) => item.id === "carta-brillo-cobre");
  const suitJoker = OFFICIAL_ITEMS.find((item) => item.id === "comodin-bastos-fichas");
  const moneyJoker = {
    id: "fixture-money-joker",
    kind: "joker",
    rarity: "comun",
    trigger: { type: "CARD_SUIT_PLAYED", suit: "bastos" },
    effect: { stage: "money", op: "add", value: 2 }
  };
  const playerCantoJoker = {
    id: "fixture-player-canto-joker",
    kind: "joker",
    rarity: "comun",
    trigger: { type: "PLAYER_WINS_CANTO", canto: "truco" },
    effect: { stage: "chips", op: "add", value: 4 }
  };
  const rivalCantoJoker = {
    id: "fixture-rival-canto-joker",
    kind: "joker",
    rarity: "comun",
    trigger: { type: "RIVAL_CANTO_LOST", canto: "truco" },
    effect: { stage: "chips", op: "add", value: 5 }
  };
  let state = createGame({ target: 9999, rounds: 4 }, 15).state;
  state.phase = "shop";
  state.money = 15;
  state.officialItems = [upgrade, suitJoker, moneyJoker, playerCantoJoker, rivalCantoJoker];
  state.shopOffers = [upgrade.id, suitJoker.id, moneyJoker.id, playerCantoJoker.id, rivalCantoJoker.id];
  let result = dispatch(state, { type: "BUY_ITEM", itemId: upgrade.id, cardId: "7-bastos" });
  assert.equal(result.state.money, 13);
  assert.deepEqual(result.state.cardUpgrades, [{ cardId: "7-bastos", itemId: upgrade.id }]);
  result = dispatch(result.state, { type: "BUY_ITEM", itemId: suitJoker.id });
  assert.equal(result.state.money, 11);
  result = dispatch(result.state, { type: "BUY_ITEM", itemId: moneyJoker.id });
  result = dispatch(result.state, { type: "BUY_ITEM", itemId: playerCantoJoker.id });
  result = dispatch(result.state, { type: "BUY_ITEM", itemId: rivalCantoJoker.id });
  state = result.state;
  assert.equal(state.money, 5);
  state.phase = "playing";
  state.mano = "player";
  state.round = {
    rivalDealt: [{ id: "4-copas", rank: 4, suit: "copas" }],
    leader: "player",
    table: { playerCard: null, rivalCard: null },
    tricks: [
      trick("player", "player"),
      trick("player", "player")
    ],
    playerPlayedCount: 2,
    trucoLevel: 0,
    envido: "none",
    flor: "none",
    pendingCanto: null,
    rivalCantos: ["truco"],
    playerCantos: ["truco"],
    winner: null
  };
  state.round.trucoLevel = 1;
  state.playerHand = [{ id: "7-bastos", rank: 7, suit: "bastos" }];
  state.rivalHand = [{ id: "4-copas", rank: 4, suit: "copas" }];
  state.round.tricks = [
    { ...trick("player", "player"), playerCard: { id: "5-oros", rank: 5, suit: "oros" }, rivalCard: { id: "4-espadas", rank: 4, suit: "espadas" } },
    { ...trick("player", "player"), playerCard: { id: "6-oros", rank: 6, suit: "oros" }, rivalCard: { id: "5-espadas", rank: 5, suit: "espadas" } }
  ];
  result = dispatch(state, { type: "PLAY_CARD", id: "7-bastos" });
  assert.equal(result.state.score, 46);
  assert.equal(result.state.money, 7);
  assert.equal(result.events.find((item) => item.type === "ROUND_RESOLVED").moneyEarned, 2);
});

test("a bot-like complete level resolves without errors in fewer than 200 actions", () => {
  let state = createGame(undefined, 402).state;
  let actions = 0;
  while (["playing", "roundEnded", "respondCanto"].includes(state.phase) && actions < 200) {
    if (state.phase === "roundEnded") {
      state = dispatch(state, { type: "NEXT_ROUND" }).state;
    } else {
      const action = state.phase === "respondCanto"
        ? { type: "ANSWER_CANTO", wants: true }
        : state.playerHand.length
        ? { type: "PLAY_CARD", id: state.playerHand[0].id }
        : { type: "CANTAR", canto: "truco" };
      const result = dispatch(state, action);
      assert.equal(result.events.some((item) => item.type === "ERROR"), false);
      state = result.state;
    }
    actions += 1;
  }
  assert.ok(["shop", "lost"].includes(state.phase));
  assert.ok(actions < 200);
});
