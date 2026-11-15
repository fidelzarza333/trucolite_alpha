import { cardPower, createDeck, shuffleDeck } from "./cards.js";
import { envidoTanto, florTanto, hasFlor } from "./envido.js";
import { chooseRivalLead, chooseRivalResponse, decideCanto } from "./ai.js";
import { getRoundWinner, scoreRound } from "./scoring.js";
import { mergeRules, validateRules } from "./rules.js";
import { normalizeSeed, randomIndex } from "./rng.js";
import {
  ITEM_PRICES,
  OFFICIAL_ITEMS,
  RARITY_WEIGHTS,
  itemById
} from "./items.js";

function copyState(state) {
  return JSON.parse(JSON.stringify(state));
}

function cardFromId(id) {
  const parts = id.split("-");
  const rank = Number(parts[0]);
  const suit = parts[1];
  const deck = createDeck();
  for (let index = 0; index < deck.length; index += 1) {
    if (deck[index].rank === rank && deck[index].suit === suit) return deck[index];
  }
  return null;
}

function event(type, properties) {
  return { type, ...properties };
}

function pickShopOffers(state) {
  const pool = state.officialItems;
  const available = pool.slice();
  const offers = [];
  while (offers.length < 3 && available.length > 0) {
    const presentWeights = RARITY_WEIGHTS.filter((entry) => available.some((item) => item.rarity === entry.rarity));
    const totalWeight = presentWeights.reduce((sum, entry) => sum + entry.weight, 0);
    const weightRoll = randomIndex(state.rng, totalWeight);
    state.rng = weightRoll.state;
    let roll = weightRoll.index;
    let rarity = presentWeights[presentWeights.length - 1].rarity;
    for (let index = 0; index < presentWeights.length; index += 1) {
      if (roll < presentWeights[index].weight) {
        rarity = presentWeights[index].rarity;
        break;
      }
      roll -= presentWeights[index].weight;
    }
    const rarityItems = available.filter((item) => item.rarity === rarity);
    const itemRoll = randomIndex(state.rng, rarityItems.length);
    state.rng = itemRoll.state;
    const selected = rarityItems[itemRoll.index];
    offers.push(selected.id);
    const removeIndex = available.findIndex((item) => item.id === selected.id);
    available.splice(removeIndex, 1);
  }
  return offers;
}

function playRivalCard(state, events) {
  if (state.rivalHand.length === 0) return;
  const result = chooseRivalLead(state.rivalHand, state.rng);
  state.rng = result.rng;
  const index = state.rivalHand.findIndex((card) => card.id === result.card.id);
  state.rivalHand.splice(index, 1);
  state.round.table.rivalCard = result.card;
  events.push(event("RIVAL_PLAYED", { card: result.card, leader: true }));
}

function prepareRivalTurn(state, events) {
  if (state.rivalHand.length === 0) return;
  const nextLevel = state.round.trucoLevel;
  const canto = nextLevel === 0 ? "truco" : nextLevel === 1 ? "retruco" : nextLevel === 2 ? "valeCuatro" : null;
  if (canto) {
    const answer = decideCanto(state, canto, state.rng);
    state.rng = answer.rng;
    if (answer.wants) {
      state.phase = "respondCanto";
      state.round.pendingCanto = canto;
      events.push(event("CANTO_REQUESTED", { caller: "rival", canto }));
      return;
    }
  }
  playRivalCard(state, events);
}

function dealRound(state, mano, events) {
  const result = shuffleDeck(state.rng);
  state.rng = result.rng;
  const deck = result.deck;
  state.playerHand = deck.splice(0, state.rules.cardsPerRound);
  state.rivalHand = deck.splice(0, state.rules.cardsPerRound);
  state.deck = deck;
  state.mano = mano;
  state.round = {
    rivalDealt: state.rivalHand.slice(),
    leader: mano,
    table: { playerCard: null, rivalCard: null },
    tricks: [],
    playerPlayedCount: 0,
    trucoLevel: 0,
    envido: "none",
    flor: "none",
    pendingCanto: null,
    rivalCantos: [],
    playerCantos: [],
    winner: null,
    discardsUsedInRound: 0,
    extraChipsFromDiscard: 0,
    lastPlayerEnvidoTanto: 0
  };
  events.push(event("ROUND_DEALT", { roundNumber: state.roundNumber, mano }));
  if (mano === "rival") {
    prepareRivalTurn(state, events);
  }
}

function trickCounts(round, player) {
  return round.tricks.filter((trick) => trick.winner === player).length;
}

function finishMatch(state, events) {
  if (state.score >= state.levelTarget) {
    state.phase = "shop";
    state.money += 5;
    state.shopOffers = pickShopOffers(state);
    events.push(event("LEVEL_WON", {
      level: state.level,
      score: state.score,
      target: state.levelTarget,
      reward: 5,
      money: state.money
    }));
    events.push(event("SHOP_OPENED", {
      level: state.level,
      offers: state.shopOffers.slice(),
      money: state.money
    }));
  } else if (state.roundsCompleted >= state.rules.rounds) {
    state.phase = "lost";
    events.push(event("GAME_LOST", { level: state.level, score: state.score }));
  } else {
    state.phase = "roundEnded";
  }
}

function playedPlayerCards(round) {
  return round.tricks.map((trick) => trick.playerCard);
}

function effectMatchesTrigger(trigger, state, cards) {
  if (trigger.type === "CARD_SUIT_PLAYED") {
    return cards.some((card) => card.suit === trigger.suit);
  }
  if (trigger.type === "CARD_SUITS_PLAYED") {
    return cards.some((card) => trigger.suits.includes(card.suit));
  }
  if (trigger.type === "CARD_RANK_PLAYED") {
    return cards.some((card) => card.rank === trigger.rank);
  }
  if (trigger.type === "CARD_IN_HAND_SUIT") {
    return state.playerHand.some((card) => card.suit === trigger.suit);
  }
  if (trigger.type === "CARD_IN_HAND_RANK") {
    return state.playerHand.some((card) => card.rank === trigger.rank);
  }
  if (trigger.type === "CARDS_IN_HAND_COUNT_SUIT") {
    return state.playerHand.some((card) => card.suit === trigger.suit);
  }
  if (trigger.type === "POSITIONAL_MULT") {
    return true;
  }
  if (trigger.type === "POSITIONAL_MULT_CANTO") {
    return state.round.winner === "player"
      && state.round.playerCantos.some((c) => ["truco", "retruco", "valeCuatro"].includes(c));
  }
  if (trigger.type === "ZERO_DISCARDS_USED") {
    return state.round.winner === "player" && (state.round.discardsUsedInRound || 0) === 0;
  }
  if (trigger.type === "TRICK_TIE") {
    return state.round.tricks.some((trick) => trick.winner === "tie");
  }
  if (trigger.type === "ROUND_WON_TRICK_3") {
    return state.round.winner === "player" && state.round.tricks.length === 3;
  }
  if (trigger.type === "ENVIDO_WON_30") {
    return state.round.envido === "won" && (state.round.lastPlayerEnvidoTanto >= 30);
  }
  if (trigger.type === "MONEY_INTEREST") {
    return state.money >= trigger.step;
  }
  if (trigger.type === "SCALING_CANTO_WINS") {
    return state.round.playerCantos.length > 0 || state.round.envido === "won" || state.round.flor === "won";
  }
  if (trigger.type === "SCALING_DISCARD_RANK") {
    return true;
  }
  if (trigger.type === "PLAYER_WINS_CANTO") {
    if (trigger.canto === "envido") return state.round.envido === "won";
    if (trigger.canto === "flor") return state.round.flor === "won";
    return state.round.playerCantos.includes(trigger.canto) && state.round.winner === "player";
  }
  if (trigger.type === "RIVAL_CANTO_LOST") {
    const cantoCalled = state.round.rivalCantos.includes(trigger.canto);
    return cantoCalled && state.round.winner === "player";
  }
  return false;
}

function trickUsesSuit(trick, suit) {
  return trick.playerCard && trick.playerCard.suit === suit;
}

export function getRoundEffects(state) {
  const effects = [];
  const cards = playedPlayerCards(state.round);
  let moneyEarned = 0;
  for (let cardIndex = 0; cardIndex < cards.length; cardIndex += 1) {
    const upgrades = state.cardUpgrades.filter((entry) => entry.cardId === cards[cardIndex].id);
    for (let upgradeIndex = 0; upgradeIndex < upgrades.length; upgradeIndex += 1) {
      const item = itemById(state.officialItems, upgrades[upgradeIndex].itemId);
      if (item.effect.stage === "money") moneyEarned += item.effect.value;
      else effects.push(item.effect);
    }
  }
  if (state.round.extraChipsFromDiscard > 0) {
    effects.push({ stage: "chips", op: "add", value: state.round.extraChipsFromDiscard });
  }
  for (let jokerIndex = 0; jokerIndex < state.jokers.length; jokerIndex += 1) {
    const joker = state.jokers[jokerIndex];

    // Pacto del Malevo evalúa baza por baza, no por carta jugada
    if (joker.effect.stage === "pacto_malevo") {
      const suits = joker.trigger && joker.trigger.suits ? joker.trigger.suits : [];
      for (const trick of state.round.tricks) {
        if (!trick.playerCard || !trick.rivalCard) continue;
        if (trick.winner === "player" && suits.includes(trick.playerCard.suit)) {
          effects.push({ stage: "mult", op: "add", value: joker.effect.multValue || 2 });
        }
        if (trick.winner === "rival" && suits.includes(trick.rivalCard.suit)) {
          moneyEarned += joker.effect.value || 3;
        }
      }
      continue;
    }

    if (joker.trigger && joker.trigger.type === "CARD_SUIT_PLAYED") {
      const matchCount = cards.filter((c) => c.suit === joker.trigger.suit).length;
      for (let k = 0; k < matchCount; k += 1) {
        if (joker.effect.stage === "money") moneyEarned += joker.effect.value;
        else effects.push(joker.effect);
      }
      continue;
    }

    if (joker.trigger && joker.trigger.type === "CARD_RANK_PLAYED") {
      const matchCount = cards.filter((c) => c.rank === joker.trigger.rank).length;
      for (let k = 0; k < matchCount; k += 1) {
        if (joker.effect.stage === "money") moneyEarned += joker.effect.value;
        else effects.push(joker.effect);
      }
      continue;
    }

    if (joker.trigger && joker.trigger.type === "CARD_SUITS_PLAYED") {
      const matchCount = cards.filter((c) => joker.trigger.suits.includes(c.suit)).length;
      for (let k = 0; k < matchCount; k += 1) {
        if (joker.effect.stage === "money") moneyEarned += joker.effect.value;
        else effects.push(joker.effect);
      }
      continue;
    }

    if (!effectMatchesTrigger(joker.trigger, state, cards)) continue;
    if (joker.effect.stage === "money") {
      moneyEarned += joker.effect.value;
    } else if (joker.effect.stage === "composite") {
      if (joker.effect.chips) effects.push({ stage: "chips", op: "add", value: joker.effect.chips });
      if (joker.effect.mult) effects.push({ stage: "mult", op: "add", value: joker.effect.mult });
    } else if (joker.effect.stage === "chips_per_card_in_hand") {
      const count = state.playerHand.filter((card) => card.suit === joker.effect.suit).length;
      if (count > 0) effects.push({ stage: "chips", op: "add", value: count * joker.effect.value });
    } else if (joker.effect.stage === "mult_per_card_in_hand") {
      const count = state.playerHand.filter((card) => card.suit === joker.effect.suit).length;
      if (count > 0) effects.push({ stage: "mult", op: "add", value: count * joker.effect.value });
    } else if (joker.effect.stage === "mult_money_interest") {
      const multGain = Math.floor(state.money / joker.effect.step) * joker.effect.value;
      if (multGain > 0) effects.push({ stage: "mult", op: "add", value: multGain });
    } else if (joker.effect.stage === "scaling_chips") {
      if ((joker.accumulatedChips || 0) > 0) {
        effects.push({ stage: "chips", op: "add", value: joker.accumulatedChips });
      }
    } else if (joker.effect.stage === "scaling_mult") {
      if ((joker.accumulatedMult || 0) > 0) {
        effects.push({ stage: "mult", op: "add", value: joker.accumulatedMult });
      }
    } else if (joker.effect.stage === "positional_mult") {
      for (let eIdx = 0; eIdx < effects.length; eIdx += 1) {
        if (effects[eIdx].stage === "mult") {
          effects[eIdx] = { ...effects[eIdx], value: effects[eIdx].value * joker.effect.value };
        }
      }
    } else {
      effects.push(joker.effect);
    }
  }
  return { effects, moneyEarned };
}

function resolveRound(state, events, forcedWinner) {
  state.round.winner = forcedWinner || getRoundWinner(state.round.tricks, state.mano);
  const roundEffects = getRoundEffects(state);
  const result = scoreRound({
    rules: state.rules,
    round: state.round,
    mano: state.mano,
    score: state.score,
    winner: state.round.winner
  }, roundEffects.effects);
  state.score = result.score;
  state.money += roundEffects.moneyEarned;
  state.roundsCompleted += 1;
  state.phase = "roundEnded";
  if (state.round.winner === "player") {
    for (let index = 0; index < state.round.rivalCantos.length; index += 1) {
      events.push(event("RIVAL_CANTO_LOST", { canto: state.round.rivalCantos[index] }));
    }
  }
  events.push(event("ROUND_RESOLVED", {
    ...result,
    moneyEarned: roundEffects.moneyEarned,
    money: state.money,
    score: state.score,
    roundNumber: state.roundNumber,
    roundsCompleted: state.roundsCompleted
  }));
  finishMatch(state, events);
}

function rejectCanto(state, canto, events) {
  const reward = state.rules.cantos[canto].rejectReward;
  const lossEnvido = state.round.envido === "lost" ? state.rules.cantos.envido.lossPenalty : 0;
  const lossFlor = state.round.flor === "lost" ? state.rules.cantos.flor.lossPenalty : 0;
  state.roundsCompleted += 1;
  state.score = Math.max(0, state.score + reward - lossEnvido - lossFlor);
  state.phase = "roundEnded";
  events.push(event("ROUND_RESOLVED", {
    winner: "player",
    playerTricks: trickCounts(state.round, "player"),
    rivalTricks: trickCounts(state.round, "rival"),
    chips: 0,
    mult: 1,
    xmult: 1,
    earned: 0,
    rejectReward: reward,
    lossTruco: 0,
    lossEnvido,
    lossFlor,
    score: state.score,
    roundNumber: state.roundNumber,
    roundsCompleted: state.roundsCompleted,
    rejected: canto
  }));
  finishMatch(state, events);
}

function rejectRivalCanto(state, canto, events) {
  const reward = state.rules.cantos[canto].rejectReward;
  const lossEnvido = 0;
  const lossFlor = 0;
  state.roundsCompleted += 1;
  // Feedback de testers: perder o rechazar no resta puntos
  state.score = state.score;
  state.phase = "roundEnded";
  events.push(event("ROUND_RESOLVED", {
    winner: "rival",
    playerTricks: trickCounts(state.round, "player"),
    rivalTricks: trickCounts(state.round, "rival"),
    chips: 0,
    mult: 1,
    xmult: 1,
    earned: 0,
    rivalRejectReward: reward,
    lossTruco: 0,
    lossEnvido,
    lossFlor,
    moneyEarned: 0,
    money: state.money,
    score: state.score,
    roundNumber: state.roundNumber,
    roundsCompleted: state.roundsCompleted,
    rejected: canto
  }));
  finishMatch(state, events);
}

function error(state, code) {
  return { state, events: [event("ERROR", { code })] };
}

function isPlayerTurn(state) {
  return state.round.table.rivalCard !== null || state.round.leader === "player";
}

function playCard(state, action, events) {
  if (state.phase !== "playing") return error(state, "WRONG_PHASE");
  const playerIndex = state.playerHand.findIndex((card) => card.id === action.id);
  if (playerIndex < 0) return error(state, "CARD_NOT_IN_HAND");
  if (!isPlayerTurn(state)) return error(state, "WRONG_PHASE");
  const next = copyState(state);
  const nextEvents = [];
  const selectedIndex = next.playerHand.findIndex((card) => card.id === action.id);
  const playerCard = next.playerHand.splice(selectedIndex, 1)[0];
  next.round.table.playerCard = playerCard;
  next.round.playerPlayedCount += 1;
  if (next.round.table.rivalCard === null) {
    const rivalCard = chooseRivalResponse(next.rivalHand, playerCard);
    const rivalIndex = next.rivalHand.findIndex((card) => card.id === rivalCard.id);
    next.rivalHand.splice(rivalIndex, 1);
    next.round.table.rivalCard = rivalCard;
    nextEvents.push(event("RIVAL_PLAYED", { card: rivalCard, leader: false }));
  }
  const rivalCard = next.round.table.rivalCard;
  const playerPower = cardPower(playerCard);
  const rivalPower = cardPower(rivalCard);
  const winner = playerPower > rivalPower ? "player" : playerPower < rivalPower ? "rival" : "tie";
  const leader = next.round.leader;
  const trick = { leader, playerCard, rivalCard, winner };
  next.round.tricks.push(trick);
  next.round.table = { playerCard: null, rivalCard: null };
  nextEvents.push(event("TRICK_RESOLVED", { ...trick, trickNumber: next.round.tricks.length }));
  if (next.round.tricks.length === next.rules.cardsPerRound) {
    resolveRound(next, nextEvents);
  } else {
    next.round.leader = winner === "tie" ? leader : winner;
    if (next.round.leader === "rival") prepareRivalTurn(next, nextEvents);
  }
  return { state: next, events: nextEvents };
}

function discard(state, action) {
  if (state.phase !== "playing" || state.round.playerPlayedCount > 0) {
    return error(state, "DISCARD_WINDOW_CLOSED");
  }
  if (state.discardsRemaining <= 0) return error(state, "NO_DISCARDS_LEFT");
  if (!Array.isArray(action.ids) || action.ids.length < 1 || action.ids.length > 3) {
    return error(state, "CARD_NOT_IN_HAND");
  }
  const uniqueIds = [];
  for (let index = 0; index < action.ids.length; index += 1) {
    if (!uniqueIds.includes(action.ids[index])) uniqueIds.push(action.ids[index]);
  }
  for (let index = 0; index < uniqueIds.length; index += 1) {
    if (!state.playerHand.some((card) => card.id === uniqueIds[index])) return error(state, "CARD_NOT_IN_HAND");
  }
  const next = copyState(state);
  const discarded = next.playerHand.filter((card) => uniqueIds.includes(card.id));
  next.playerHand = next.playerHand.filter((card) => !uniqueIds.includes(card.id));
  for (let index = 0; index < discarded.length; index += 1) {
    const draw = randomIndex(next.rng, next.deck.length);
    next.rng = draw.state;
    next.playerHand.push(next.deck.splice(draw.index, 1)[0]);
  }
  next.deck.push(...discarded);
  next.discardsRemaining -= 1;
  next.round.discardsUsedInRound = (next.round.discardsUsedInRound || 0) + 1;
  for (let j = 0; j < next.jokers.length; j += 1) {
    const joker = next.jokers[j];
    if (joker.trigger && joker.trigger.type === "DISCARD_SUITS") {
      const matchCount = discarded.filter((c) => joker.trigger.suits.includes(c.suit)).length;
      if (matchCount > 0) {
        next.round.extraChipsFromDiscard = (next.round.extraChipsFromDiscard || 0) + matchCount * (joker.effect.value || 2);
      }
    }
    if (joker.trigger && joker.trigger.type === "SCALING_DISCARD_RANK") {
      const rankCount = discarded.filter((c) => c.rank === joker.trigger.rank).length;
      if (rankCount > 0) {
        joker.accumulatedMult = (joker.accumulatedMult || 0) + rankCount * (joker.effect.value || 0.2);
      }
    }
  }
  return {
    state: next,
    events: [event("CARDS_DISCARDED", {
      discarded: discarded.map((card) => card.id),
      drawn: next.playerHand.slice(-discarded.length).map((card) => card.id),
      discardsRemaining: next.discardsRemaining
    })]
  };
}

function canCall(state, canto) {
  const round = state.round;
  if (state.phase !== "playing" || !isPlayerTurn(state)) return false;
  if (canto === "envido") {
    return round.playerPlayedCount === 0 && round.envido === "none"
      && round.flor === "none" && !hasFlor(state.playerHand);
  }
  if (canto === "flor") {
    return round.playerPlayedCount === 0 && round.envido === "none"
      && round.flor === "none" && hasFlor(state.playerHand);
  }
  if (canto === "truco") return round.trucoLevel === 0;
  if (canto === "retruco") return round.trucoLevel === 1;
  if (canto === "valeCuatro") return round.trucoLevel === 2;
  return false;
}

export function cantoAvailable(state, canto) {
  return canCall(state, canto);
}

function callCanto(state, action) {
  const canto = action.canto;
  const validCantos = ["envido", "flor", "truco", "retruco", "valeCuatro"];
  if (!validCantos.includes(canto)) return error(state, "CANTO_NOT_AVAILABLE");
  if (state.phase !== "playing" || !isPlayerTurn(state)) return error(state, "CANTO_NOT_AVAILABLE");
  if ((canto === "truco" && state.round.trucoLevel !== 0)
    || (canto === "retruco" && state.round.trucoLevel !== 1)
    || (canto === "valeCuatro" && state.round.trucoLevel !== 2)) {
    return error(state, "CANTO_ORDER");
  }
  if (!canCall(state, canto)) return error(state, "CANTO_NOT_AVAILABLE");
  const next = copyState(state);
  const events = [];
  if (canto === "envido") {
    const playerTanto = envidoTanto(next.playerHand);
    const rivalTanto = envidoTanto(next.round.rivalDealt);
    const playerWins = playerTanto > rivalTanto || (playerTanto === rivalTanto && next.mano === "player");
    next.round.envido = playerWins ? "won" : "lost";
    next.round.lastPlayerEnvidoTanto = playerTanto;
    if (playerWins) {
      next.money += 1;
      next.round.playerCantos.push(canto);
      for (let j = 0; j < next.jokers.length; j += 1) {
        if (next.jokers[j].trigger && next.jokers[j].trigger.type === "SCALING_CANTO_WINS") {
          next.jokers[j].accumulatedChips = (next.jokers[j].accumulatedChips || 0) + (next.jokers[j].effect.value || 5);
        }
      }
    } else {
      next.money = Math.max(0, next.money - 1);
    }
    events.push(event("ENVIDO_RESOLVED", { playerTanto, rivalTanto, winner: playerWins ? "player" : "rival", moneyDelta: playerWins ? 1 : -1 }));
    // Si El Rival es el líder y aún no jugó su carta, la juega tras resolver el canto
    if (next.round.leader === "rival" && next.round.table.rivalCard === null) {
      playRivalCard(next, events);
    }
    return { state: next, events };
  }
  if (canto === "flor") {
    const playerTanto = florTanto(next.playerHand);
    const rivalHasFlor = hasFlor(next.round.rivalDealt);
    const rivalTanto = rivalHasFlor ? florTanto(next.round.rivalDealt) : 0;
    const playerWins = !rivalHasFlor || playerTanto > rivalTanto
      || (playerTanto === rivalTanto && next.mano === "player");
    next.round.flor = playerWins ? "won" : "lost";
    if (playerWins) {
      next.money += 1;
      next.round.playerCantos.push(canto);
      for (let j = 0; j < next.jokers.length; j += 1) {
        if (next.jokers[j].trigger && next.jokers[j].trigger.type === "SCALING_CANTO_WINS") {
          next.jokers[j].accumulatedChips = (next.jokers[j].accumulatedChips || 0) + (next.jokers[j].effect.value || 5);
        }
      }
    } else {
      next.money = Math.max(0, next.money - 1);
    }
    events.push(event("FLOR_RESOLVED", { playerTanto, rivalTanto, rivalHasFlor, winner: playerWins ? "player" : "rival", moneyDelta: playerWins ? 1 : -1 }));
    // Si El Rival es el líder y aún no jugó su carta, la juega tras resolver el canto
    if (next.round.leader === "rival" && next.round.table.rivalCard === null) {
      playRivalCard(next, events);
    }
    return { state: next, events };
  }
  const answer = decideCanto(next, canto, next.rng);
  next.rng = answer.rng;
  events.push(event("CANTO_ANSWERED", { canto, wants: answer.wants, level: answer.level }));
  if (answer.wants) {
    next.round.trucoLevel = canto === "truco" ? 1 : canto === "retruco" ? 2 : 3;
    next.round.playerCantos.push(canto);
    return { state: next, events };
  }
  rejectCanto(next, canto, events);
  return { state: next, events };
}

function answerCanto(state, action) {
  if (state.phase !== "respondCanto" || !state.round.pendingCanto) return error(state, "WRONG_PHASE");
  if (typeof action.wants !== "boolean") return error(state, "CANTO_NOT_AVAILABLE");
  const next = copyState(state);
  const canto = next.round.pendingCanto;
  next.round.pendingCanto = null;
  const events = [event("CANTO_ANSWERED", {
    caller: "rival",
    canto,
    wants: action.wants
  })];
  if (!action.wants) {
    rejectRivalCanto(next, canto, events);
    return { state: next, events };
  }
  next.round.trucoLevel = canto === "truco" ? 1 : canto === "retruco" ? 2 : 3;
  next.round.rivalCantos.push(canto);
  next.phase = "playing";
  playRivalCard(next, events);
  return { state: next, events };
}

function buyItem(state, action) {
  if (state.phase !== "shop") return error(state, "WRONG_PHASE");
  if (!state.shopOffers.includes(action.itemId)) return error(state, "ITEM_NOT_AVAILABLE");
  const item = itemById(state.officialItems, action.itemId);
  if (!item) return error(state, "ITEM_NOT_APPROVED");
  if (item.kind === "joker" && state.jokers.length >= 5) return error(state, "JOKER_LIMIT_REACHED");
  const price = ITEM_PRICES[item.rarity];
  if (!Number.isFinite(price)) return error(state, "ITEM_NOT_AVAILABLE");
  if (state.money < price) return error(state, "INSUFFICIENT_MONEY");
  if (item.kind === "cardUpgrade") {
    if (!createDeck().some((card) => card.id === action.cardId)) {
      return error(state, "CARD_NOT_IN_DECK");
    }
  }
  const next = copyState(state);
  next.money -= price;
  next.shopOffers = next.shopOffers.filter((id) => id !== item.id);
  if (item.kind === "cardUpgrade") {
    next.cardUpgrades.push({ cardId: action.cardId, itemId: item.id });
  } else if (item.kind === "joker") {
    next.jokers.push(item);
    if (item.id === "comodin-barajador") {
      next.discardsRemaining += 1;
    }
  } else {
    return error(state, "ITEM_NOT_AVAILABLE");
  }
  return {
    state: next,
    events: [event("ITEM_PURCHASED", {
      itemId: item.id,
      name: item.name,
      cardId: action.cardId || null,
      price,
      money: next.money
    })]
  };
}

function sellJoker(state, action) {
  const jokerIndex = state.jokers.findIndex((joker) => joker.id === action.itemId);
  if (jokerIndex < 0) return error(state, "JOKER_NOT_OWNED");
  const joker = state.jokers[jokerIndex];
  const originalPrice = ITEM_PRICES[joker.rarity];
  if (!Number.isFinite(originalPrice)) return error(state, "ITEM_NOT_AVAILABLE");
  const refund = originalPrice / 2;
  const next = copyState(state);
  next.jokers.splice(jokerIndex, 1);
  next.money += refund;
  return {
    state: next,
    events: [event("JOKER_SOLD", {
      itemId: joker.id,
      name: joker.name,
      refund,
      money: next.money
    })]
  };
}

export function createGame(rules, seed, options = {}) {
  const finalRules = mergeRules(rules);
  const validation = validateRules(finalRules);
  const normalizedSeed = normalizeSeed(seed);
  if (!validation.valid || normalizedSeed === null) {
    return {
      state: null,
      events: [event("ERROR", {
        code: "INVALID_GAME_CONFIGURATION",
        details: validation.errors.concat(normalizedSeed === null ? ["seed"] : [])
      })]
    };
  }
  const itemCatalog = (options && options.catalog) ? options.catalog : OFFICIAL_ITEMS;
  const state = {
    rules: finalRules,
    seed: normalizedSeed,
    rng: normalizedSeed,
    phase: "playing",
    score: 0,
    level: 1,
    levelTarget: finalRules.target,
    money: 0,
    roundNumber: 1,
    roundsCompleted: 0,
    discardsRemaining: finalRules.discards,
    shopOffers: [],
    officialItems: itemCatalog.map((item) => JSON.parse(JSON.stringify(item))),
    cardUpgrades: [],
    jokers: [],
    mano: "player",
    deck: [],
    playerHand: [],
    rivalHand: [],
    round: null
  };
  const events = [];
  dealRound(state, "player", events);
  return { state, events };
}

export function dispatch(state, action) {
  if (!state || !action || typeof action.type !== "string") return error(state, "UNKNOWN_ACTION");
  if (action.type === "PLAY_CARD") return playCard(state, action, []);
  if (action.type === "DISCARD") return discard(state, action);
  if (action.type === "CANTAR") return callCanto(state, action);
  if (action.type === "ANSWER_CANTO") return answerCanto(state, action);
  if (action.type === "BUY_ITEM") return buyItem(state, action);
  if (action.type === "SELL_JOKER") return sellJoker(state, action);
  if (action.type === "MOVE_JOKER") {
    const { fromIndex, toIndex } = action;
    if (typeof fromIndex !== "number" || typeof toIndex !== "number") return error(state, "INVALID_JOKER_INDEX");
    if (fromIndex < 0 || fromIndex >= state.jokers.length || toIndex < 0 || toIndex >= state.jokers.length) {
      return error(state, "INVALID_JOKER_INDEX");
    }
    const next = copyState(state);
    const itemA = next.jokers[fromIndex];
    const itemB = next.jokers[toIndex];
    next.jokers[fromIndex] = itemB;
    next.jokers[toIndex] = itemA;
    return {
      state: next,
      events: [event("JOKER_MOVED", { fromIndex, toIndex, joker: itemA.name })]
    };
  }
  if (action.type === "REROLL_SHOP") {
    if (state.phase !== "shop") return error(state, "WRONG_PHASE");
    const REROLL_COST = 5;
    if (state.money < REROLL_COST) return error(state, "INSUFFICIENT_FUNDS");
    const next = copyState(state);
    next.money -= REROLL_COST;
    next.shopOffers = pickShopOffers(next);
    return {
      state: next,
      events: [event("SHOP_REROLLED", { cost: REROLL_COST, offers: next.shopOffers.slice() })]
    };
  }
  if (action.type === "NEXT_LEVEL") {
    if (state.phase !== "shop") return error(state, "WRONG_PHASE");
    const next = copyState(state);
    next.level += 1;
    next.levelTarget = Math.ceil(next.rules.target * Math.pow(1.5, next.level - 1));
    next.score = 0;
    next.roundNumber = 1;
    next.roundsCompleted = 0;
    const bonusDiscards = (next.jokers || []).filter((j) => j.id === "comodin-barajador").length;
    next.discardsRemaining = next.rules.discards + bonusDiscards;
    next.phase = "playing";
    next.mano = next.mano === "player" ? "rival" : "player";
    next.shopOffers = [];
    const events = [];
    dealRound(next, next.mano, events);
    return { state: next, events };
  }
  if (action.type === "NEXT_ROUND") {
    if (state.phase !== "roundEnded") return error(state, "WRONG_PHASE");
    const next = copyState(state);
    next.roundNumber += 1;
    next.mano = next.mano === "player" ? "rival" : "player";
    next.phase = "playing";
    const events = [];
    dealRound(next, next.mano, events);
    return { state: next, events };
  }
  return error(state, "UNKNOWN_ACTION");
}

export function cardForId(id) {
  return cardFromId(id);
}
