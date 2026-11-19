import test from "node:test";
import assert from "node:assert/strict";
import { createGame, dispatch } from "../src/core/game.js";
import { createDefaultRules } from "../src/core/rules.js";
import { withHands } from "./helpers.js";

test("Round 1 Truco rejection: ends round with rival win, allows NEXT_ROUND to round 2", () => {
  const rules = createDefaultRules();
  rules.rounds = 3;
  rules.target = 50;
  const game = createGame(rules, 101);
  let state = game.state;

  // Simulate rival chanting truco
  state.phase = "respondCanto";
  state.round.pendingCanto = "truco";
  state.round.rivalCantos.push("truco");

  // Player says NO QUIERO
  const rejected = dispatch(state, { type: "ANSWER_CANTO", wants: false });
  assert.equal(rejected.state.phase, "roundEnded", "Phase must be roundEnded so player can continue to next round");
  assert.equal(rejected.state.roundsCompleted, 1, "Should have 1 round completed");
  assert.equal(rejected.state.roundNumber, 1);

  const roundResolvedEvt = rejected.events.find((e) => e.type === "ROUND_RESOLVED");
  assert.ok(roundResolvedEvt, "ROUND_RESOLVED event must be emitted");
  assert.equal(roundResolvedEvt.winner, "rival", "Winner must be rival");
  assert.equal(roundResolvedEvt.rejected, "truco");

  // Verify that GAME_LOST was NOT emitted because rounds remain (1 of 3 completed)
  const gameLostEvt = rejected.events.find((e) => e.type === "GAME_LOST");
  assert.equal(gameLostEvt, undefined, "GAME_LOST must not be emitted when rounds remain");

  // Player clicks NEXT_ROUND (Continue)
  const nextRound = dispatch(rejected.state, { type: "NEXT_ROUND" });
  assert.ok(
    nextRound.state.phase === "playing" || nextRound.state.phase === "respondCanto",
    "Round 2 must be active (playing or respondCanto if rival opens with truco)"
  );
  assert.equal(nextRound.state.roundNumber, 2, "Round number must be 2");
  assert.equal(nextRound.state.playerHand.length, 3, "Player must receive 3 cards");
});

test("Round 2 Truco rejection: ends round with rival win, allows NEXT_ROUND to round 3", () => {
  const rules = createDefaultRules();
  rules.rounds = 3;
  rules.target = 50;
  const game = createGame(rules, 102);
  let state = game.state;
  state.roundsCompleted = 1;
  state.roundNumber = 2;

  // Rival chants truco in round 2
  state.phase = "respondCanto";
  state.round.pendingCanto = "truco";
  state.round.rivalCantos.push("truco");

  // Player says NO QUIERO
  const rejected = dispatch(state, { type: "ANSWER_CANTO", wants: false });
  assert.equal(rejected.state.phase, "roundEnded");
  assert.equal(rejected.state.roundsCompleted, 2);

  const gameLostEvt = rejected.events.find((e) => e.type === "GAME_LOST");
  assert.equal(gameLostEvt, undefined, "Still 1 round remaining, not lost yet");

  // Next round advances to round 3
  const nextRound = dispatch(rejected.state, { type: "NEXT_ROUND" });
  assert.ok(
    nextRound.state.phase === "playing" || nextRound.state.phase === "respondCanto",
    "Round 3 must be active"
  );
  assert.equal(nextRound.state.roundNumber, 3);
  assert.equal(nextRound.state.playerHand.length, 3);
});

test("Round 3 (final round) Truco rejection with score < target: triggers GAME_LOST and blocks NEXT_ROUND", () => {
  const rules = createDefaultRules();
  rules.rounds = 3;
  rules.target = 50;
  const game = createGame(rules, 103);
  let state = game.state;
  state.roundsCompleted = 2;
  state.roundNumber = 3;
  state.score = 10; // Below target (50)

  // Rival chants truco in round 3
  state.phase = "respondCanto";
  state.round.pendingCanto = "truco";
  state.round.rivalCantos.push("truco");

  // Player says NO QUIERO
  const rejected = dispatch(state, { type: "ANSWER_CANTO", wants: false });
  assert.equal(rejected.state.phase, "lost", "Game phase must be lost on final round defeat");
  assert.equal(rejected.state.roundsCompleted, 3);

  const gameLostEvt = rejected.events.find((e) => e.type === "GAME_LOST");
  assert.ok(gameLostEvt, "GAME_LOST must be emitted on final round failure");

  // Attempting NEXT_ROUND must fail because run is lost
  const nextRound = dispatch(rejected.state, { type: "NEXT_ROUND" });
  assert.equal(nextRound.events[0].type, "ERROR");
  assert.equal(nextRound.events[0].code, "WRONG_PHASE");
});

test("Card-play defeat across rounds 1, 2, and 3: continues on 1 and 2, ends run on 3", () => {
  const rules = createDefaultRules();
  rules.rounds = 3;
  rules.target = 500;
  let state = createGame(rules, 104).state;

  // Round 1: Rival gets strong cards, player gets weak cards
  state = withHands(state, {
    player: ["4-espadas", "4-copas", "4-bastos"],
    rival: ["1-espadas", "1-bastos", "7-espadas"]
  });
  while (state.phase === "playing" || state.phase === "respondCanto") {
    if (state.phase === "respondCanto") {
      state = dispatch(state, { type: "ANSWER_CANTO", wants: true }).state;
      continue;
    }
    state = dispatch(state, { type: "PLAY_CARD", id: state.playerHand[0].id }).state;
  }
  assert.equal(state.phase, "roundEnded", "Round 1 loss must end in roundEnded");
  assert.equal(state.roundsCompleted, 1);

  // Advance to Round 2
  state = dispatch(state, { type: "NEXT_ROUND" }).state;
  assert.equal(state.roundNumber, 2);

  // Round 2: Rival gets strong cards, player gets weak cards
  state = withHands(state, {
    player: ["4-espadas", "4-copas", "4-bastos"],
    rival: ["1-espadas", "1-bastos", "7-espadas"]
  });
  while (state.phase === "playing" || state.phase === "respondCanto") {
    if (state.phase === "respondCanto") {
      state = dispatch(state, { type: "ANSWER_CANTO", wants: true }).state;
      continue;
    }
    state = dispatch(state, { type: "PLAY_CARD", id: state.playerHand[0].id }).state;
  }
  assert.equal(state.phase, "roundEnded", "Round 2 loss must end in roundEnded");
  assert.equal(state.roundsCompleted, 2);

  // Advance to Round 3 (the final round)
  state = dispatch(state, { type: "NEXT_ROUND" }).state;
  assert.equal(state.roundNumber, 3);

  // Round 3: Rival gets strong cards, player gets weak cards
  state = withHands(state, {
    player: ["4-espadas", "4-copas", "4-bastos"],
    rival: ["1-espadas", "1-bastos", "7-espadas"]
  });
  while (state.phase === "playing" || state.phase === "respondCanto") {
    if (state.phase === "respondCanto") {
      state = dispatch(state, { type: "ANSWER_CANTO", wants: true }).state;
      continue;
    }
    state = dispatch(state, { type: "PLAY_CARD", id: state.playerHand[0].id }).state;
  }
  assert.equal(state.phase, "lost", "Round 3 defeat with score < target must end run (phase: lost)");
  assert.equal(state.roundsCompleted, 3);

  // Verify NEXT_ROUND is blocked
  const blocked = dispatch(state, { type: "NEXT_ROUND" });
  assert.equal(blocked.events[0].code, "WRONG_PHASE");
});

test("Player debt limit (-$50) triggers immediate GAME_LOST", () => {
  const rules = createDefaultRules();
  const game = createGame(rules, 105);
  let state = game.state;
  state.money = -50;
  // Trigger finishMatch via reject
  state.phase = "respondCanto";
  state.round.pendingCanto = "truco";
  const result = dispatch(state, { type: "ANSWER_CANTO", wants: false });
  assert.equal(result.state.phase, "lost");
  assert.ok(result.events.some((e) => e.type === "GAME_LOST" && e.reason === "DEBT_LIMIT"));
});
