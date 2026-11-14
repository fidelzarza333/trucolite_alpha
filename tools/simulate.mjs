import { createGame, dispatch, cantoAvailable } from "../src/core/game.js";
import { cardPower } from "../src/core/cards.js";
import { envidoTanto } from "../src/core/envido.js";
import { createDefaultRules } from "../src/core/rules.js";
import { pathToFileURL } from "node:url";

function handStrength(cards) {
  if (cards.length === 0) return 0;
  return cards.reduce((sum, card) => sum + cardPower(card) / 14, 0) / cards.length;
}

function chooseCard(state) {
  const cards = state.playerHand.slice().sort((left, right) => cardPower(left) - cardPower(right));
  const rival = state.round.table.rivalCard;
  if (!rival) return cards[0];
  for (let index = 0; index < cards.length; index += 1) {
    if (cardPower(cards[index]) > cardPower(rival)) return cards[index];
  }
  return cards[0];
}

function nextAction(state, bot) {
  if (state.phase === "respondCanto") return { type: "ANSWER_CANTO", wants: true };
  if (bot === "smart" && state.round.playerPlayedCount === 0 && state.discardsRemaining > 0) {
    const weak = state.playerHand.filter((card) => cardPower(card) <= 3).map((card) => card.id);
    if (weak.length > 0) return { type: "DISCARD", ids: weak };
  }
  if (bot === "always") {
    if (cantoAvailable(state, "flor")) return { type: "CANTAR", canto: "flor" };
    if (cantoAvailable(state, "envido")) return { type: "CANTAR", canto: "envido" };
    if (cantoAvailable(state, "truco")) return { type: "CANTAR", canto: "truco" };
    if (cantoAvailable(state, "retruco")) return { type: "CANTAR", canto: "retruco" };
    if (cantoAvailable(state, "valeCuatro")) return { type: "CANTAR", canto: "valeCuatro" };
  }
  if (bot === "smart") {
    if (cantoAvailable(state, "flor")) return { type: "CANTAR", canto: "flor" };
    if (cantoAvailable(state, "envido") && envidoTanto(state.playerHand) >= 27) {
      return { type: "CANTAR", canto: "envido" };
    }
    const strength = handStrength(state.playerHand);
    if (cantoAvailable(state, "truco") && strength >= 0.50) return { type: "CANTAR", canto: "truco" };
    if (cantoAvailable(state, "retruco") && strength >= 0.65) return { type: "CANTAR", canto: "retruco" };
    if (cantoAvailable(state, "valeCuatro") && strength >= 0.80) return { type: "CANTAR", canto: "valeCuatro" };
  }
  return { type: "PLAY_CARD", id: chooseCard(state).id };
}

export function simulateDuel(bot, rules, seed) {
  let state = createGame(rules, seed).state;
  let actionCount = 0;
  let roundsWithCanto = 0;
  let roundsWithReject = 0;
  const cantoRounds = new Set();
  const rejectRounds = new Set();
  while (state.phase === "playing" || state.phase === "roundEnded" || state.phase === "respondCanto") {
    const result = state.phase === "roundEnded"
      ? dispatch(state, { type: "NEXT_ROUND" })
      : dispatch(state, nextAction(state, bot));
    for (let index = 0; index < result.events.length; index += 1) {
      const item = result.events[index];
      if (item.type === "ENVIDO_RESOLVED" || item.type === "FLOR_RESOLVED" || item.type === "CANTO_ANSWERED") {
        cantoRounds.add(state.roundNumber);
      }
      if (item.type === "CANTO_ANSWERED" && !item.wants) rejectRounds.add(state.roundNumber);
    }
    state = result.state;
    actionCount += 1;
    if (actionCount > 200) throw new Error(`${bot} bot exceeded 200 actions at seed ${seed}`);
  }
  roundsWithCanto = cantoRounds.size;
  roundsWithReject = rejectRounds.size;
  return {
    won: state.phase === "shop",
    rounds: state.roundsCompleted,
    score: state.score,
    roundsWithCanto,
    roundsWithReject
  };
}

export function simulateBot(bot, rules, duels) {
  let wins = 0;
  let rounds = 0;
  let score = 0;
  let cantoRounds = 0;
  let rejectRounds = 0;
  for (let seed = 1; seed <= duels; seed += 1) {
    const result = simulateDuel(bot, rules, seed);
    if (result.won) wins += 1;
    rounds += result.rounds;
    score += result.score;
    cantoRounds += result.roundsWithCanto;
    rejectRounds += result.roundsWithReject;
  }
  return {
    bot,
    winRate: (wins / duels) * 100,
    roundsAverage: rounds / duels,
    scoreAverage: score / duels,
    cantoRate: (cantoRounds / rounds) * 100,
    rejectRate: (rejectRounds / rounds) * 100
  };
}

function formatRow(result) {
  return `${result.bot.padEnd(8)} ${result.winRate.toFixed(2).padStart(7)}% ${result.roundsAverage.toFixed(2).padStart(8)} ${result.scoreAverage.toFixed(2).padStart(10)} ${result.cantoRate.toFixed(2).padStart(9)}% ${result.rejectRate.toFixed(2).padStart(10)}%`;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const rules = createDefaultRules();
  const results = ["never", "always", "smart"].map((bot) => simulateBot(bot, rules, 5000));
  console.log("Bot      Win rate  Avg rounds  Avg score  Canto %  Reject %");
  for (let index = 0; index < results.length; index += 1) console.log(formatRow(results[index]));
  console.log("Criteria: A smart 35%-65%; B always <= smart; C never >= 10%");
  console.log(`A ${results[2].winRate >= 35 && results[2].winRate <= 65 ? "PASS" : "FAIL"} · B ${results[1].winRate <= results[2].winRate ? "PASS" : "FAIL"} · C ${results[0].winRate >= 10 ? "PASS" : "FAIL"}`);
}
