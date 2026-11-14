import { createGame, dispatch, cantoAvailable } from "../core/game.js";
import { createDeck, cardPower } from "../core/cards.js";
import { ITEM_PRICES, itemById, FULL_CATALOG } from "../core/items.js";
import { createDefaultRules, mergeRules, validateRules } from "../core/rules.js";
import { formatEvent, formatMoney, renderGame, triggerToast, cardName } from "./render.js";
import { envidoTanto } from "../core/envido.js";

const elements = {
  score: document.querySelector("#scoreValue"),
  goal: document.querySelector("#scoreGoal"),
  progress: document.querySelector("#progressFill"),
  levelValue: document.querySelector("#levelValue"),
  anteValue: document.querySelector("#anteValue"),
  chipsDisplay: document.querySelector("#chipsDisplay"),
  multDisplay: document.querySelector("#multDisplay"),
  trucoStatus: document.querySelector("#trucoStatus"),
  discardsDisplay: document.querySelector("#discardsDisplay"),
  tricksDisplay: document.querySelector("#tricksDisplay"),
  playerMoney: document.querySelector("#playerMoney"),
  deckCounter: document.querySelector("#deckCounter"),
  deckPileButton: document.querySelector("#deckPileButton"),
  opponentCards: document.querySelector("#opponentCards"),
  playerCards: document.querySelector("#playerCards"),
  jokerCount: document.querySelector("#jokerCount"),
  jokerList: document.querySelector("#jokerList"),
  cardTooltip: document.querySelector("#cardTooltip"),
  chipsPerTrickValue: document.querySelector("#chipsPerTrickValue"),
  trickRow: document.querySelector("#trickRow"),
  trickHeading: document.querySelector("#trickHeading"),
  trickCaption: document.querySelector("#trickCaption"),
  message: document.querySelector("#tableMessage"),
  roundOutcome: document.querySelector("#roundOutcome"),
  roundOutcomeTitle: document.querySelector("#roundOutcomeTitle"),
  roundOutcomeDetails: document.querySelector("#roundOutcomeDetails"),
  opponentState: document.querySelector("#opponentState"),
  playerState: document.querySelector("#playerState"),
  history: document.querySelector("#historyList"),
  action: document.querySelector("#actionButton"),
  note: document.querySelector("#controlNote"),
  next: document.querySelector("#nextRoundButton"),
  playMode: document.querySelector("#playModeButton"),
  discardMode: document.querySelector("#discardModeButton"),
  restart: document.querySelector("#restartButton"),
  gameError: document.querySelector("#gameError"),
  cantoResponse: document.querySelector("#cantoResponse"),
  cantoQuestion: document.querySelector("#cantoQuestion"),
  cantoWant: document.querySelector("#cantoWantButton"),
  cantoReject: document.querySelector("#cantoRejectButton"),
  showTanto: document.querySelector("#showTantoButton"),
  viewDeck: document.querySelector("#viewDeckButton"),
  deckDialog: document.querySelector("#deckDialog"),
  closeDeck: document.querySelector("#closeDeckButton"),
  deckGrid: document.querySelector("#deckGrid"),
  toggleRules: document.querySelector("#toggleRulesButton"),
  rulesDialog: document.querySelector("#rulesDialog"),
  closeRules: document.querySelector("#closeRulesButton"),
  menuAudio: document.querySelector("#menuAudio"),

  // In-Board Outcome Overlay (Centered inside felt table)
  outcomeOverlay: document.querySelector("#outcomeOverlay"),
  outcomeDialog: document.querySelector("#outcomeOverlay"), // Fallback reference
  outcomeBadge: document.querySelector("#outcomeBadge"),
  outcomeTitle: document.querySelector("#outcomeTitle"),
  outcomeBody: document.querySelector("#outcomeBody"),
  outcomeContinue: document.querySelector("#outcomeContinueButton"),
  outcomeRestart: document.querySelector("#outcomeRestartButton"),
  outcomeLeaderboardBox: document.querySelector("#outcomeLeaderboardBox"),
  leaderboardNameInput: document.querySelector("#leaderboardNameInput"),
  saveRecordBtn: document.querySelector("#saveRecordBtn"),
  recordSavedMsg: document.querySelector("#recordSavedMsg"),

  // Leaderboard / Hall of Fame
  leaderboardDialog: document.querySelector("#leaderboardDialog"),
  leaderboardTableContainer: document.querySelector("#leaderboardTableContainer"),
  openLeaderboardButton: document.querySelector("#openLeaderboardButton"),
  introLeaderboardBtn: document.querySelector("#introLeaderboardBtn"),
  closeLeaderboardButton: document.querySelector("#closeLeaderboardButton"),
  closeLeaderboardButton2: document.querySelector("#closeLeaderboardButton2"),
  clearLeaderboardButton: document.querySelector("#clearLeaderboardButton"),

  // Views
  gameTableView: document.querySelector("#gameTableView"),
  shopTableView: document.querySelector("#shopTableView"),

  // Inline Shop elements
  shopLevel: document.querySelector("#shopLevel"),
  shopMoney: document.querySelector("#shopMoney"),
  shopIntro: document.querySelector("#shopIntro"),
  shopOffers: document.querySelector("#shopOffers"),
  shopReroll: document.querySelector("#shopRerollButton"),
  nextLevel: document.querySelector("#nextLevelButton"),

  cantos: {
    envido: document.querySelector("#envidoButton"),
    flor: document.querySelector("#florButton"),
    truco: document.querySelector("#trucoButton"),
    retruco: document.querySelector("#retrucoButton"),
    valeCuatro: document.querySelector("#valeCuatroButton")
  }
};

const tutorial = {
  dialog: document.querySelector("#tutorialDialog"),
  lead: document.querySelector("#tutorialLead"),
  open: document.querySelector("#tutorialOpenButton"),
  start: document.querySelector("#tutorialStartButton"),
  close: document.querySelector("#tutorialCloseButton")
};

const ui = {
  mode: "play",
  selectedIds: new Set(),
  events: [],
  message: "",
  tone: ""
};
let state = null;
let isCardAnimating = false;

function readNumber(id, minimum, maximum, integer) {
  const input = document.querySelector(`#${id}`);
  if (!input) return null;
  const raw = input.value.trim();
  const value = Number(raw);
  if (raw === "" || !Number.isFinite(value) || (integer && !Number.isInteger(value))
    || value < minimum || value > maximum) {
    return null;
  }
  return value;
}

function readConfiguration() {
  const target = readNumber("targetInput", 1, 9999, true);
  const rounds = readNumber("roundsInput", 1, 20, true);
  const discards = readNumber("discardsInput", 0, 20, true);
  const chipsPerTrick = readNumber("chipsInput", 0, 100, true);
  const integerFields = [
    ["envidoPenaltyInput", 0, 999],
    ["florPenaltyInput", 0, 999],
    ["trucoPenaltyInput", 0, 999],
    ["trucoRewardInput", 0, 999],
    ["retrucoPenaltyInput", 0, 999],
    ["retrucoRewardInput", 0, 999],
    ["valeCuatroPenaltyInput", 0, 999],
    ["valeCuatroRewardInput", 0, 999]
  ];
  const values = {};
  const errors = [];
  const basics = { target, rounds, discards, chipsPerTrick };
  for (const [key, value] of Object.entries(basics)) {
    if (value === null) errors.push(key);
  }
  for (let index = 0; index < integerFields.length; index += 1) {
    const [id, minimum, maximum] = integerFields[index];
    values[id] = readNumber(id, minimum, maximum, true);
    if (values[id] === null) errors.push(id);
  }
  const thresholds = {
    truco: readNumber("trucoThresholdInput", 0, 1, false),
    retruco: readNumber("retrucoThresholdInput", 0, 1, false),
    valeCuatro: readNumber("valeCuatroThresholdInput", 0, 1, false)
  };
  for (const [key, value] of Object.entries(thresholds)) {
    if (value === null) errors.push(`${key} threshold`);
  }
  const seedInput = document.querySelector("#seedInput");
  const rawSeed = seedInput ? seedInput.value.trim() : "";
  let seed;
  if (rawSeed === "") {
    const seedBuffer = new Uint32Array(1);
    crypto.getRandomValues(seedBuffer);
    seed = seedBuffer[0];
    if (seedInput) seedInput.value = String(seed);
  } else {
    seed = Number(rawSeed);
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) errors.push("seed");
  }
  if (errors.length > 0) return { error: `Revisá los valores inválidos: ${errors.join(", ")}.` };
  const defaults = createDefaultRules();
  const rules = mergeRules({
    target,
    rounds,
    discards,
    chipsPerTrick,
    cantos: {
      envido: { lossPenalty: values.envidoPenaltyInput },
      flor: { lossPenalty: values.florPenaltyInput },
      truco: { lossPenalty: values.trucoPenaltyInput, rejectReward: values.trucoRewardInput },
      retruco: { lossPenalty: values.retrucoPenaltyInput, rejectReward: values.retrucoRewardInput },
      valeCuatro: { lossPenalty: values.valeCuatroPenaltyInput, rejectReward: values.valeCuatroRewardInput }
    },
    rivalThreshold: thresholds
  });
  const validation = validateRules(rules);
  if (!validation.valid) return { error: `Reglas inválidas: ${validation.errors.join(", ")}.` };
  if (defaults.cardsPerRound !== 3) return { error: "La cantidad de cartas por ronda debe ser 3." };
  return { rules, seed };
}

function showError(message) {
  if (elements.gameError) {
    elements.gameError.textContent = message;
    elements.gameError.dataset.tone = "lose";
  }
  ui.message = message;
  ui.tone = "lose";
  triggerToast(message, "lose");
  if (state) renderGame(elements, state, { ...ui, cantoAvailable });
  tutorial.lead.textContent = message;
}

// ========================================================
// SOUND EFFECTS SYSTEM (SFX)
// ========================================================
const SFX = {
  ctx: null,
  buffers: {},
  isInitialized: false,
  _masterVol: 0.55,     // global SFX volume, overridden by settings slider
  sources: {
    card: ["assets/audio/SFX/card_slide.wav"],
    button: [
      "assets/audio/SFX/button.mp3",
      "assets/audio/SFX/button_click.wav",
      "assets/audio/SFX/button.wav"
    ],
    info: ["assets/audio/SFX/info_msg.mp3"],
    lose: ["assets/audio/SFX/lose.mp3"],
    win: ["assets/audio/SFX/win.mp3"],
    money: ["assets/audio/SFX/money.mp3"]
  },

  getContext() {
    if (typeof window === "undefined") return null;
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  },

  async loadCandidate(name, urls) {
    const ctx = this.getContext();
    if (!ctx) return;
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const arrayBuf = await res.arrayBuffer();
        this.buffers[name] = await ctx.decodeAudioData(arrayBuf);
        return;
      } catch (e) {
        // Try next candidate
      }
    }
  },

  init() {
    if (this.isInitialized) {
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    this.isInitialized = true;
    this.getContext();
    for (const [name, urls] of Object.entries(this.sources)) {
      this.loadCandidate(name, urls);
    }
  },

  play(type, { volume = 0.55, pitch = 1.0, pitchVariation = 0.04 } = {}) {
    const scaledVol = volume * (this._masterVol / 0.55);
    const ctx = this.getContext();
    const buffer = this.buffers[type];

    if (!ctx || !buffer) {
      try {
        const fallbackUrl = this.sources[type]?.[0] || this.sources.card[0];
        const audio = new Audio(fallbackUrl);
        audio.volume = Math.min(1, Math.max(0, scaledVol));
        audio.play().catch(() => {});
      } catch (e) {}
      return;
    }

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const variation = (Math.random() - 0.5) * pitchVariation;
      source.playbackRate.value = Math.max(0.2, pitch + variation);

      const gain = ctx.createGain();
      gain.gain.value = Math.min(1, Math.max(0, scaledVol));

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
    } catch (e) {}
  },

  playCard() {
    this.play("card", { volume: 0.65, pitch: 1.0, pitchVariation: 0.08 });
  },

  playButton() {
    this.play("button", { volume: 0.5, pitch: 1.05, pitchVariation: 0.04 });
  },

  playInfo() {
    this.play("info", { volume: 0.6, pitch: 1.0, pitchVariation: 0.0 });
  },

  playLose() {
    this.play("lose", { volume: 0.65, pitch: 1.0, pitchVariation: 0.0 });
  },

  playWin() {
    this.play("win", { volume: 0.65, pitch: 1.0, pitchVariation: 0.0 });
  },

  playMoney() {
    this.play("money", { volume: 0.65, pitch: 1.0, pitchVariation: 0.05 });
  }
};

function notify(message, tone = "info") {
  triggerToast(message, tone);
  if (tone === "win") SFX.playWin();
  else if (tone === "lose") SFX.playLose();
  else if (tone === "gold") SFX.playMoney();
  else SFX.playInfo();
}

let isPacing = false;

function getDelay(ms) {
  const reduceMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const quality = document.body.dataset.animQuality || "high";
  if (reduceMotion || quality === "low") return 40;
  if (quality === "medium") return Math.round(ms * 0.65);
  return ms;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, getDelay(ms)));

function startMatch({ forceNewSeed = false } = {}) {
  const seedInput = document.querySelector("#seedInput");
  if (forceNewSeed && seedInput) {
    seedInput.value = ""; // Clear to force a brand new random seed!
  }
  const configuration = readConfiguration();
  if (configuration.error) {
    showError(configuration.error);
    return false;
  }
  const created = createGame(configuration.rules, configuration.seed, { catalog: FULL_CATALOG });
  if (!created.state) {
    showError(formatEvent(created.events[0]));
    return false;
  }
  state = created.state;
  ui.mode = "play";
  ui.selectedIds.clear();
  ui.events = created.events.slice();
  ui.message = "Run iniciada. Elegí tu primera carta.";
  ui.tone = "";
  if (elements.gameError) elements.gameError.textContent = "";
  tutorial.lead.textContent = "Superá el puntaje objetivo de cada nivel. Las metas aumentan al avanzar; cada victoria te da dinero y abre la tienda.";
  renderGame(elements, state, { ...ui, cantoAvailable });
  renderJokerCollection();
  renderShop();
  notify("¡Run iniciada! Buena suerte", "info");
  return true;
}

// In-Board Outcome Overlay (Centered inside felt table)
function showOutcomeModal(type, eventData, options = {}) {
  const overlay = elements.outcomeOverlay;
  if (!overlay) return;
  const badge = elements.outcomeBadge;
  const title = elements.outcomeTitle;
  const body = elements.outcomeBody;
  const continueBtn = elements.outcomeContinue;
  const restartBtn = elements.outcomeRestart;
  const lbBox = elements.outcomeLeaderboardBox;

  overlay.dataset.result = type;
  overlay.dataset.nextAction = options.nextAction || "";

  if (lbBox) lbBox.hidden = true;
  if (elements.recordSavedMsg) elements.recordSavedMsg.style.display = "none";

  if (type === "levelwon") {
    badge.textContent = "¡NIVEL SUPERADO!";
    title.textContent = `NIVEL ${eventData.level} COMPLETADO`;
    body.innerHTML = `
      <div class="outcome-breakdown-row"><span>Tantos obtenidos en la ronda:</span><strong>+${eventData.earned || 0}</strong></div>
      <div class="outcome-breakdown-row"><span>Puntaje total alcanzado:</span><strong>${eventData.score} / ${eventData.target}</strong></div>
      <div class="outcome-breakdown-row"><span>Premio del nivel:</span><strong>+$${eventData.reward}</strong></div>
      <p style="margin: 10px 0 0; color: #55efc4; font-weight: 700; font-size: 13px;">¡Tienda en mesa desbloqueada! Comprá mejoras y comodines para potenciar tu run.</p>
    `;
    if (continueBtn) {
      continueBtn.hidden = false;
      continueBtn.textContent = "IR A LA TIENDA ➔";
    }
    if (restartBtn) restartBtn.hidden = true;
    overlay.dataset.nextAction = "shop";
    SFX.playWin();
  } else if (type === "gameover") {
    badge.textContent = "RUN TERMINADA";
    title.textContent = "DERROTA";
    body.innerHTML = `
      <div class="outcome-breakdown-row"><span>Nivel alcanzado:</span><strong>Nivel ${eventData.level}</strong></div>
      <div class="outcome-breakdown-row"><span>Puntaje final acumulado:</span><strong>${eventData.score} / ${state ? state.levelTarget : 0}</strong></div>
      <div class="outcome-breakdown-row"><span>Seed de la run:</span><strong>${state ? state.seed : "-"}</strong></div>
      <p style="margin: 8px 0 0; color: #ff7675; font-size: 12px;">Te quedaste sin rondas disponibles para alcanzar el objetivo de tantos.</p>
    `;
    if (continueBtn) continueBtn.hidden = true;
    if (restartBtn) {
      restartBtn.hidden = false;
      restartBtn.textContent = "REINICIAR RUN (NUEVA SEED) 🔄";
    }
    if (lbBox) {
      lbBox.hidden = false;
      const savedTag = localStorage.getItem("trucolite_player_tag") || "";
      if (elements.leaderboardNameInput) elements.leaderboardNameInput.value = savedTag;
    }
    overlay.dataset.nextAction = "restart";
    SFX.playLose();
  } else if (type === "win") {
    badge.textContent = "RONDA GANADA";
    title.textContent = "¡VICTORIA EN LA RONDA!";
    const tricksText = `${eventData.playerTricks || 0} a ${eventData.rivalTricks || 0}`;
    body.innerHTML = `
      <div class="outcome-breakdown-row"><span>Bazas ganadas:</span><strong>${tricksText}</strong></div>
      <div class="outcome-breakdown-row"><span>Fórmula:</span><strong>${eventData.chips} Fichas × ${eventData.mult} Mult × ${eventData.xmult} xMult</strong></div>
      <div class="outcome-breakdown-row"><span>Tantos ganados:</span><strong>+${eventData.earned}</strong></div>
      <div class="outcome-breakdown-row"><span>Puntaje actual:</span><strong>${eventData.score} / ${state ? state.levelTarget : 0}</strong></div>
      ${eventData.moneyEarned ? `<div class="outcome-breakdown-row"><span>Dinero extra:</span><strong>+$${eventData.moneyEarned}</strong></div>` : ""}
    `;
    if (continueBtn) {
      continueBtn.hidden = false;
      continueBtn.textContent = "SIGUIENTE RONDA ➔";
    }
    if (restartBtn) restartBtn.hidden = true;
    overlay.dataset.nextAction = "nextRound";
    SFX.playWin();
  } else {
    badge.textContent = "RONDA PERDIDA";
    title.textContent = "EL RIVAL GANÓ LA RONDA";
    const remaining = state ? Math.max(0, state.rules.rounds - state.roundsCompleted) : 0;
    body.innerHTML = `
      <div class="outcome-breakdown-row"><span>Bazas obtenidas:</span><strong>${eventData.playerTricks || 0} de 3</strong></div>
      <div class="outcome-breakdown-row"><span>Bazas del Rival:</span><strong>${eventData.rivalTricks || 0} de 3</strong></div>
      <div class="outcome-breakdown-row"><span>Puntaje del nivel:</span><strong>${eventData.score} / ${state ? state.levelTarget : 0}</strong></div>
      <div class="outcome-breakdown-row"><span>Rondas restantes:</span><strong>${remaining}</strong></div>
    `;
    if (continueBtn) {
      continueBtn.hidden = false;
      continueBtn.textContent = "CONTINUAR ➔";
    }
    if (restartBtn) restartBtn.hidden = true;
    overlay.dataset.nextAction = "nextRound";
    SFX.playLose();
  }

  overlay.hidden = false;
}

// Animate Jokers Activation in real-time (~300ms timing per joker)
async function animateJokersActivation(playedCard, remainingHand) {
  if (!state || !state.jokers || state.jokers.length === 0) return;
  const container = elements.jokerList;
  if (!container) return;

  for (let i = 0; i < state.jokers.length; i += 1) {
    const joker = state.jokers[i];
    const jokerCardEl = container.children[i];
    if (!jokerCardEl || !jokerCardEl.classList.contains("joker-card")) continue;

    let triggers = false;
    let labelText = "";
    let badgeClass = "";

    if (joker.trigger.type === "CARD_SUIT_PLAYED" && playedCard.suit === joker.trigger.suit) {
      triggers = true;
    } else if (joker.trigger.type === "CARD_RANK_PLAYED" && playedCard.rank === joker.trigger.rank) {
      triggers = true;
    } else if (joker.trigger.type === "CARD_IN_HAND_SUIT" && remainingHand.some((c) => c.suit === joker.trigger.suit)) {
      triggers = true;
    } else if (joker.trigger.type === "CARD_IN_HAND_RANK" && remainingHand.some((c) => c.rank === joker.trigger.rank)) {
      triggers = true;
    } else if (joker.effect.stage === "positional_mult") {
      triggers = true;
    } else if (joker.effect.stage === "pacto_malevo") {
      // Pacto del Malevo se resuelve al finalizar la ronda, no se anima por carta jugada
      triggers = false;
    }

    if (triggers) {
      if (joker.effect.stage === "chips") {
        labelText = `+${joker.effect.value} FICHAS`;
        badgeClass = "joker-popup-chips";
      } else if (joker.effect.stage === "mult") {
        labelText = `+${joker.effect.value} MULT`;
        badgeClass = "joker-popup-mult";
      } else if (joker.effect.stage === "money") {
        labelText = `+$${joker.effect.value}`;
        badgeClass = "joker-popup-money";
      } else if (joker.effect.stage === "positional_mult") {
        labelText = `×${joker.effect.value} MULT`;
        badgeClass = "joker-popup-xmult";
      } else {
        labelText = "¡ACTIVO!";
        badgeClass = "joker-popup-mult";
      }

      jokerCardEl.classList.add("is-activating");
      const badge = document.createElement("div");
      badge.className = `joker-popup-badge ${badgeClass}`;
      badge.textContent = labelText;
      jokerCardEl.append(badge);

      SFX.play("card", { pitch: 1.1 + i * 0.1 });
      await delay(320);

      jokerCardEl.classList.remove("is-activating");
      setTimeout(() => badge.remove(), 850);
    } else {
      await delay(80);
    }
  }
}

async function handlePlayCardWithPacing(action) {
  isPacing = true;
  elements.playerCards.inert = true;
  elements.action.disabled = true;
  for (const btn of Object.values(elements.cantos)) btn.disabled = true;

  try {
    const prevState = JSON.parse(JSON.stringify(state));
    const rivalWasLeading = prevState.round.table.rivalCard !== null;
    const playerCard = prevState.playerHand.find((c) => c.id === action.id);
    const remainingHand = prevState.playerHand.filter((c) => c.id !== action.id);

    const result = dispatch(state, action);
    const errors = result.events.filter((item) => item.type === "ERROR");
    if (errors.length > 0) {
      ui.events.push(...errors);
      ui.message = formatEvent(errors[0]);
      ui.tone = "lose";
      notify(ui.message, "lose");
      return;
    }

    const events = result.events;
    const finalState = result.state;
    ui.selectedIds.clear();

    const rivalResponseEvt = events.find((e) => e.type === "RIVAL_PLAYED" && !e.leader);
    const trickResolvedEvt = events.find((e) => e.type === "TRICK_RESOLVED");
    const roundResolvedEvt = events.find((e) => e.type === "ROUND_RESOLVED");
    const levelWonEvt = events.find((e) => e.type === "LEVEL_WON");
    const gameLostEvt = events.find((e) => e.type === "GAME_LOST");
    const rivalNextLeadEvt = events.find((e) => e.type === "RIVAL_PLAYED" && e.leader);

    // STAGE 1: Player's card lands on table
    const stage1State = JSON.parse(JSON.stringify(prevState));
    stage1State.playerHand = stage1State.playerHand.filter((c) => c.id !== action.id);
    stage1State.round.table.playerCard = playerCard;

    if (!rivalWasLeading) {
      // Player leads: show player card, rival thinking
      ui.message = "El Rival pensando...";
      ui.tone = "";
      renderGame(elements, stage1State, { ...ui, cantoAvailable });
      await delay(500);

      // Real-time Jokers activation animation
      await animateJokersActivation(playerCard, remainingHand);

      // STAGE 2: Rival responds with their card
      if (rivalResponseEvt) {
        SFX.playCard();
        stage1State.round.table.rivalCard = rivalResponseEvt.card;
        stage1State.rivalHand.pop();
        ui.message = `El Rival responde con ${cardName(rivalResponseEvt.card)}.`;
        renderGame(elements, stage1State, { ...ui, cantoAvailable });
        await delay(500);
      }
    } else {
      // Rival had already led: show player's card alongside rival's card
      stage1State.round.table.rivalCard = prevState.round.table.rivalCard;
      ui.message = `Jugaste ${cardName(playerCard)}.`;
      renderGame(elements, stage1State, { ...ui, cantoAvailable });
      await delay(450);

      // Real-time Jokers activation animation
      await animateJokersActivation(playerCard, remainingHand);
    }

    // STAGE 3: Trick is evaluated
    if (trickResolvedEvt) {
      const stage2State = JSON.parse(JSON.stringify(stage1State));
      stage2State.round.tricks.push(trickResolvedEvt);
      stage2State.round.table = { playerCard: null, rivalCard: null };

      if (trickResolvedEvt.winner === "player") {
        ui.message = "¡Tu baza!";
        ui.tone = "win";
      } else if (trickResolvedEvt.winner === "rival") {
        ui.message = "Baza para El Rival.";
        ui.tone = "lose";
      } else {
        ui.message = "Baza parda (empate).";
        ui.tone = "";
      }
      renderGame(elements, stage2State, { ...ui, cantoAvailable });
      await delay(550);
    }

    // STAGE 4: Round Resolution (if round ended)
    if (roundResolvedEvt) {
      state = finalState;
      ui.events.push(...events);

      if (levelWonEvt) {
        ui.message = `¡NIVEL ${levelWonEvt.level} SUPERADO! Meta alcanzada.`;
        ui.tone = "win";
        renderGame(elements, state, { ...ui, cantoAvailable });
        await delay(400);
        showOutcomeModal("levelwon", { ...roundResolvedEvt, ...levelWonEvt });
      } else if (gameLostEvt) {
        ui.message = `Run terminada en el nivel ${gameLostEvt.level}.`;
        ui.tone = "lose";
        renderGame(elements, state, { ...ui, cantoAvailable });
        await delay(400);
        showOutcomeModal("gameover", gameLostEvt);
      } else if (roundResolvedEvt.winner === "player") {
        ui.message = `¡Ronda ganada! +${roundResolvedEvt.earned} tantos.`;
        ui.tone = "win";
        renderGame(elements, state, { ...ui, cantoAvailable });
        await delay(400);
        showOutcomeModal("win", roundResolvedEvt);
      } else {
        ui.message = "Ronda perdida ante El Rival.";
        ui.tone = "lose";
        renderGame(elements, state, { ...ui, cantoAvailable });
        await delay(400);
        showOutcomeModal("lose", roundResolvedEvt);
      }
      return;
    }

    // STAGE 5: If round continues and rival leads the next trick
    if (rivalNextLeadEvt) {
      await delay(450);
      SFX.playCard();
      state = finalState;
      ui.events.push(...events);
      ui.message = `El Rival abre con ${cardName(rivalNextLeadEvt.card)}.`;
      ui.tone = "";
      renderGame(elements, state, { ...ui, cantoAvailable });
      return;
    }

    // Normal continuation
    state = finalState;
    ui.events.push(...events);
    ui.message = "Tu turno para abrir la baza.";
    ui.tone = "";
  } finally {
    isPacing = false;
    elements.playerCards.inert = false;
    renderGame(elements, state, { ...ui, cantoAvailable });
    renderJokerCollection();
  }
}

async function handleCantarWithPacing(action) {
  isPacing = true;
  elements.playerCards.inert = true;
  elements.action.disabled = true;
  for (const btn of Object.values(elements.cantos)) btn.disabled = true;

  try {
    const cantoUpper = action.canto.toUpperCase();
    const isInstantCanto = cantoUpper === "ENVIDO" || cantoUpper === "FLOR";

    if (isInstantCanto) {
      ui.message = `Cantaste ${cantoUpper}... resolviendo...`;
    } else {
      ui.message = `Cantaste ${cantoUpper}... El Rival pensando...`;
    }
    ui.tone = "";
    renderGame(elements, state, { ...ui, cantoAvailable });
    await delay(isInstantCanto ? 200 : 550);

    const result = dispatch(state, action);
    const errors = result.events.filter((item) => item.type === "ERROR");
    if (errors.length > 0) {
      ui.events.push(...errors);
      ui.message = formatEvent(errors[0]);
      ui.tone = "lose";
      notify(ui.message, "lose");
      return;
    }

    state = result.state;
    ui.events.push(...result.events);

    const answeredEvt = result.events.find((e) => e.type === "CANTO_ANSWERED" && e.caller !== "rival");
    const roundResolvedEvt = result.events.find((e) => e.type === "ROUND_RESOLVED");
    const levelWonEvt = result.events.find((e) => e.type === "LEVEL_WON");
    const gameLostEvt = result.events.find((e) => e.type === "GAME_LOST");

    if (answeredEvt) {
      if (answeredEvt.wants) {
        SFX.playButton();
        notify(`${cantoUpper}: El Rival dijo ¡QUIERO!`, "win");
        ui.message = `${cantoUpper}: El Rival dijo ¡QUIERO!`;
        ui.tone = "win";
      } else {
        SFX.playWin();
        notify(`${cantoUpper}: El Rival dijo NO QUIERO`, "win");
        ui.message = `${cantoUpper}: El Rival dijo NO QUIERO. ¡Te anotás los tantos!`;
        ui.tone = "win";
      }
      renderGame(elements, state, { ...ui, cantoAvailable });
    }

    if (roundResolvedEvt) {
      await delay(500);
      if (levelWonEvt) {
        showOutcomeModal("levelwon", { ...roundResolvedEvt, ...levelWonEvt });
      } else if (gameLostEvt) {
        showOutcomeModal("gameover", gameLostEvt);
      } else if (roundResolvedEvt.winner === "player") {
        showOutcomeModal("win", roundResolvedEvt);
      } else {
        showOutcomeModal("lose", roundResolvedEvt);
      }
    }
  } finally {
    isPacing = false;
    elements.playerCards.inert = false;
    renderGame(elements, state, { ...ui, cantoAvailable });
    renderJokerCollection();
  }
}

async function applyAction(action) {
  if (!state || isCardAnimating || isPacing) return;
  elements.cardTooltip.hidden = true;

  if (action.type === "PLAY_CARD") {
    await handlePlayCardWithPacing(action);
    return;
  }

  if (action.type === "CANTAR") {
    await handleCantarWithPacing(action);
    return;
  }

  const result = dispatch(state, action);
  const errors = result.events.filter((item) => item.type === "ERROR");
  if (errors.length > 0) {
    ui.events.push(...errors);
    ui.message = formatEvent(errors[0]);
    ui.tone = "lose";
    notify(ui.message, "lose");
  } else {
    state = result.state;
    ui.events.push(...result.events);
    const lastEvent = result.events[result.events.length - 1];
    if (lastEvent) {
      ui.message = formatEvent(lastEvent);
      ui.tone = lastEvent.type === "GAME_WON" || (lastEvent.type === "ROUND_RESOLVED" && lastEvent.winner === "player")
        ? "win"
        : lastEvent.type === "GAME_LOST" || (lastEvent.type === "ROUND_RESOLVED" && lastEvent.winner === "rival")
          ? "lose" : "";

      if (lastEvent.type === "LEVEL_WON") {
        notify(`¡NIVEL ${lastEvent.level} SUPERADO! +$${lastEvent.reward}`, "gold");
      } else if (lastEvent.type === "ROUND_RESOLVED") {
        if (lastEvent.winner === "player") {
          notify(`¡Ronda ganada! +${lastEvent.earned} tantos`, "win");
        } else {
          notify("Ronda perdida ante El Rival", "lose");
        }
      } else if (lastEvent.type === "ENVIDO_RESOLVED") {
        notify(`Envido: ${lastEvent.winner === "player" ? "¡Ganaste!" : "Ganó El Rival"} (${lastEvent.playerTanto} vs ${lastEvent.rivalTanto})`, lastEvent.winner === "player" ? "win" : "lose");
      } else if (lastEvent.type === "CANTO_ANSWERED" && lastEvent.caller !== "rival") {
        notify(`${lastEvent.canto.toUpperCase()}: El Rival dijo ${lastEvent.wants ? "¡QUIERO!" : "NO QUIERO"}`, lastEvent.wants ? "win" : "info");
      }
    }
    if (action.type === "DISCARD") {
      ui.selectedIds.clear();
      SFX.playCard();
    }
    if (action.type === "BUY_ITEM") {
      SFX.playCard();
    }
    if (action.type === "SELL_JOKER") {
      SFX.playMoney();
    }
    if (state.phase !== "playing") ui.selectedIds.clear();

    // BGM Zone Transitions
    if (lastEvent) {
      if (lastEvent.type === "GAME_LOST") {
        BGM.setZone("muted");
      } else if (lastEvent.type === "LEVEL_WON") {
        BGM.setZone("reverb");
      } else if (lastEvent.type === "NEXT_LEVEL" || action.type === "NEXT_LEVEL") {
        BGM.setZone("main");
      } else if (lastEvent.type === "GAME_WON") {
        BGM.setZone("reverb");
      }
    }
  }
  renderGame(elements, state, { ...ui, cantoAvailable });
  renderJokerCollection();
  renderShop();
}

function renderJokerCollection() {
  if (!state) return;
  elements.jokerCount.textContent = `${state.jokers.length} / 5 SLOTS`;
  elements.jokerList.replaceChildren();

  // Exactly 5 vertical slots in Balatro style
  for (let slotIndex = 0; slotIndex < 5; slotIndex += 1) {
    const joker = state.jokers[slotIndex];
    if (joker) {
      const card = document.createElement("article");
      card.className = `joker-card joker-card-${joker.rarity}`;
      card.dataset.jokerId = joker.id;

      const refund = ITEM_PRICES[joker.rarity] / 2;

      // Header with rarity
      const header = document.createElement("div");
      header.className = "joker-header";
      const rarityBadge = document.createElement("span");
      rarityBadge.className = "joker-rarity-badge";
      rarityBadge.textContent = joker.rarity.replace("pocoComun", "poco común").toUpperCase();
      header.append(rarityBadge);

      // Center vertical body with joker name
      const body = document.createElement("div");
      body.className = "joker-placeholder-body";
      const icon = document.createElement("div");
      icon.className = "joker-card-icon";
      icon.textContent = "🃏";
      const nameText = document.createElement("div");
      nameText.className = "joker-name-text";
      nameText.textContent = joker.name;
      body.append(icon, nameText);

      // Bottom bar with sell button
      const footer = document.createElement("div");
      footer.className = "joker-footer";
      const sellBtn = document.createElement("button");
      sellBtn.className = "button button-sell arcade-btn";
      sellBtn.type = "button";
      sellBtn.textContent = `Vender $${formatMoney(refund)}`;
      sellBtn.setAttribute("aria-label", `Vender ${joker.name} por $${formatMoney(refund)}`);
      sellBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        applyAction({ type: "SELL_JOKER", itemId: joker.id });
      });
      footer.append(sellBtn);

      card.append(header, body, footer);
      card.title = `${joker.name}: ${joker.description}`;
      card.addEventListener("click", () => {
        triggerToast(`${joker.name}: ${joker.description}`, "gold");
      });
      elements.jokerList.append(card);
    } else {
      // Empty slot placeholder
      const emptySlot = document.createElement("div");
      emptySlot.className = "joker-slot-empty";
      emptySlot.innerHTML = `<span class="empty-slot-plus">+</span><span class="empty-slot-label">COMODÍN</span><span class="empty-slot-sub">${slotIndex + 1}/5</span>`;
      elements.jokerList.append(emptySlot);
    }
  }
}

function renderShop() {
  if (!state || state.phase !== "shop") {
    if (elements.shopTableView) {
      elements.shopTableView.classList.add("is-hidden");
      elements.shopTableView.classList.remove("fade-in");
    }
    if (elements.gameTableView) {
      elements.gameTableView.classList.remove("is-hidden");
    }
    return;
  }

  // Switch to inline shop view smoothly
  if (elements.gameTableView) {
    elements.gameTableView.classList.add("is-hidden");
  }
  if (elements.shopTableView) {
    elements.shopTableView.classList.remove("is-hidden");
    elements.shopTableView.classList.add("fade-in");
  }

  if (elements.shopLevel) elements.shopLevel.textContent = String(state.level);
  if (elements.shopMoney) elements.shopMoney.textContent = `$${formatMoney(state.money)}`;
  if (elements.shopReroll) {
    elements.shopReroll.disabled = state.money < 5;
  }

  elements.shopOffers.replaceChildren();
  for (let index = 0; index < state.shopOffers.length; index += 1) {
    const itemId = state.shopOffers[index];
    const item = itemById(state.officialItems, itemId);
    if (!item) continue;

    const wrapper = document.createElement("article");
    wrapper.className = "shop-offer-wrapper";

    // Top price badge
    const priceBadge = document.createElement("div");
    priceBadge.className = "shop-price-tag";
    priceBadge.textContent = `$${ITEM_PRICES[item.rarity]}`;
    wrapper.append(priceBadge);

    // Card element
    const card = document.createElement("div");
    card.className = `shop-item-card shop-card-${item.rarity}`;
    card.dataset.rarity = item.rarity;

    const rarity = document.createElement("span");
    rarity.className = "shop-rarity";
    rarity.textContent = item.rarity.replace("pocoComun", "poco común").toUpperCase();
    card.append(rarity);

    if (item.kind === "joker") {
      card.classList.add("shop-item-joker", `joker-card-${item.rarity}`);
      const body = document.createElement("div");
      body.className = "joker-placeholder-body";
      const icon = document.createElement("div");
      icon.className = "joker-card-icon";
      icon.textContent = "🃏";
      const nameText = document.createElement("div");
      nameText.className = "joker-name-text";
      nameText.textContent = item.name;
      body.append(icon, nameText);
      card.append(body);
    } else {
      const title = document.createElement("h3");
      title.className = "shop-item-title";
      title.textContent = item.name;
      card.append(title);
    }

    const description = document.createElement("p");
    description.className = "shop-description";
    description.textContent = item.description;
    card.append(description);

    if (item.kind === "cardUpgrade") {
      const select = document.createElement("select");
      select.className = "shop-card-select";
      select.setAttribute("aria-label", `Carta para ${item.name}`);
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Elegí una carta del mazo";
      select.append(placeholder);
      for (const deckCard of createDeck()) {
        const option = document.createElement("option");
        option.value = deckCard.id;
        option.textContent = `${deckCard.rank} de ${deckCard.suit}`;
        select.append(option);
      }
      card.append(select);

      const buyButton = document.createElement("button");
      buyButton.className = "button button-primary arcade-btn shop-buy-btn";
      buyButton.type = "button";
      buyButton.textContent = "COMPRAR MEJORA";
      buyButton.disabled = state.money < ITEM_PRICES[item.rarity];
      buyButton.addEventListener("click", () => {
        if (!select.value) {
          triggerToast("Elegí una carta del mazo primero", "info");
          return;
        }
        applyAction({ type: "BUY_ITEM", itemId, cardId: select.value });
      });
      card.append(buyButton);
    } else if (item.kind === "joker") {
      const buyButton = document.createElement("button");
      buyButton.className = "button button-primary arcade-btn shop-buy-btn";
      buyButton.type = "button";
      buyButton.textContent = "COMPRAR COMODÍN";
      buyButton.disabled = state.money < ITEM_PRICES[item.rarity] || state.jokers.length >= 5;
      if (state.jokers.length >= 5) buyButton.title = "Vendé un comodín arriba para liberar espacio.";
      buyButton.addEventListener("click", () => applyAction({ type: "BUY_ITEM", itemId }));
      card.append(buyButton);
    }

    wrapper.append(card);
    elements.shopOffers.append(wrapper);
  }

  if (state.jokers.length >= 5) {
    elements.shopIntro.textContent = "Tenés 5 comodines (máximo). Hacé clic en 'Vender' en cualquier comodín de la barra superior para hacer lugar.";
  } else {
    elements.shopIntro.textContent = "¡Ganaste el nivel y recibiste $5! Comprá mejoras o comodines para potenciar tu run.";
  }
}

function showCardTooltip(button) {
  const lines = button.dataset.cardTooltip.split("\n");
  elements.cardTooltip.replaceChildren();
  const title = document.createElement("strong");
  title.textContent = button.getAttribute("aria-label").split(". ")[0];
  elements.cardTooltip.append(title);
  for (const line of lines) {
    const detail = document.createElement("p");
    detail.textContent = line;
    elements.cardTooltip.append(detail);
  }
  elements.cardTooltip.hidden = false;
  const cardRect = button.getBoundingClientRect();
  const tooltipRect = elements.cardTooltip.getBoundingClientRect();
  const left = Math.max(10, Math.min(
    cardRect.left + (cardRect.width - tooltipRect.width) / 2,
    window.innerWidth - tooltipRect.width - 10
  ));
  const above = cardRect.top - tooltipRect.height - 8;
  const top = above >= 8 ? above : Math.min(window.innerHeight - tooltipRect.height - 8, cardRect.bottom + 8);
  elements.cardTooltip.style.left = `${left}px`;
  elements.cardTooltip.style.top = `${Math.max(8, top)}px`;
}

async function playSelectedCard() {
  const id = Array.from(ui.selectedIds)[0];
  if (!id || !state || ui.mode !== "play" || isCardAnimating || isPacing) return;
  const cardButton = Array.from(elements.playerCards.querySelectorAll("[data-card-id]"))
    .find((button) => button.dataset.cardId === id);
  const targetSlot = elements.trickRow.querySelector(`.trick-slot:nth-child(${state.round.tricks.length + 1})`);
  if (!cardButton || !targetSlot || typeof cardButton.animate !== "function") {
    await applyAction({ type: "PLAY_CARD", id });
    return;
  }
  const source = cardButton.getBoundingClientRect();
  const target = targetSlot.getBoundingClientRect();
  const flight = cardButton.cloneNode(true);
  flight.classList.remove("is-selected");
  flight.classList.add("card-flight");
  flight.setAttribute("aria-hidden", "true");
  flight.tabIndex = -1;
  flight.style.left = `${source.left}px`;
  flight.style.top = `${source.top}px`;
  flight.style.width = `${source.width}px`;
  flight.style.height = `${source.height}px`;
  const deltaX = target.left + target.width / 2 - (source.left + source.width / 2);
  const deltaY = target.top + target.height / 2 - (source.top + source.height / 2);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animQ = document.body.dataset.animQuality || "high";
  const animDuration = animQ === "low" || reduceMotion ? 1 : animQ === "medium" ? 180 : 360;
  isCardAnimating = true;
  elements.playerCards.inert = true;
  elements.action.disabled = true;
  cardButton.style.visibility = "hidden";
  document.body.append(flight);
  SFX.playCard();
  try {
    await flight.animate([
      { transform: "translate(0, 0) scale(1) rotate(0)", opacity: 1 },
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.58) rotate(4deg)`, opacity: 0.88 }
    ], { duration: animDuration, easing: "cubic-bezier(.2,.8,.25,1)", fill: "forwards" }).finished;
  } finally {
    flight.remove();
    cardButton.style.visibility = "";
    elements.playerCards.inert = false;
    isCardAnimating = false;
  }
  await applyAction({ type: "PLAY_CARD", id });
}

function updateSelection(button) {
  if (isPacing || (ui.mode === "discard" && (state.round.playerPlayedCount > 0 || state.discardsRemaining <= 0))) return;
  SFX.playCard();
  const id = button.dataset.cardId;
  if (ui.mode === "play") {
    if (ui.selectedIds.has(id)) ui.selectedIds.clear();
    else {
      ui.selectedIds.clear();
      ui.selectedIds.add(id);
    }
  } else if (ui.selectedIds.has(id)) {
    ui.selectedIds.delete(id);
  } else {
    ui.selectedIds.add(id);
  }
  button.classList.toggle("is-selected", ui.selectedIds.has(id));
  button.setAttribute("aria-pressed", String(ui.selectedIds.has(id)));
  elements.action.disabled = ui.selectedIds.size === 0;
  if (ui.mode === "discard" && state.discardsRemaining <= 0) elements.action.disabled = true;
}

// Truco power tier names (rank 14 = strongest, rank 1 = weakest)
const POWER_TIER_NAMES = {
  14: "1º · El Macho (1♠)",
  13: "2º · El Bastón (1♣)",
  12: "3º · La Espadilla (7♠)",
  11: "4º · El Siete Bravo (7♦)",
  10: "5º · Tres (todos)",
  9:  "6º · Dos (todos)",
  8:  "7º · 1 de Copas/Oros",
  7:  "8º · Reyes (12)",
  6:  "9º · Caballos (11)",
  5:  "10º · Sotas (10)",
  4:  "11º · 7 de Copas/Bastos",
  3:  "12º · Seis (todos)",
  2:  "13º · Cinco (todos)",
  1:  "14º · Cuatro (todos) — menor"
};

let deckSortMode = "power"; // "power" | "suit"

function renderDeckViewer(sortMode) {
  if (!state || !elements.deckGrid) return;
  if (sortMode !== undefined) deckSortMode = sortMode;
  elements.deckGrid.replaceChildren();

  const fullDeck = createDeck();
  const playerHandIds = new Set(state.playerHand.map((c) => c.id));
  const playedIds = new Set(state.round.tricks.map((t) => t.playerCard.id));

  // Sort
  let sorted;
  if (deckSortMode === "power") {
    sorted = fullDeck.slice().sort((a, b) => cardPower(b) - cardPower(a));
  } else {
    const SUIT_ORDER = ["espadas", "bastos", "oros", "copas"];
    sorted = fullDeck.slice().sort((a, b) => {
      const si = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
      if (si !== 0) return si;
      return a.rank - b.rank;
    });
  }

  // Insert tier separators when sorting by power
  let lastTier = null;

  for (const card of sorted) {
    const power = cardPower(card);
    const inHand = playerHandIds.has(card.id);
    const wasPlayed = playedIds.has(card.id);

    // Power-tier separator label
    if (deckSortMode === "power" && power !== lastTier) {
      lastTier = power;
      const sep = document.createElement("div");
      sep.className = "deck-tier-sep";
      sep.textContent = POWER_TIER_NAMES[power] || `Poder ${power}`;
      elements.deckGrid.append(sep);
    }

    const cardEl = document.createElement("div");
    cardEl.className = "deck-card-item";
    if (inHand) cardEl.classList.add("is-in-hand");
    else if (wasPlayed) cardEl.classList.add("is-played");
    else cardEl.classList.add("is-in-deck");

    // Tooltip on hover
    const upgrades = state
      ? (state.cardUpgrades || [])
        .filter((u) => u.cardId === card.id)
        .map((u) => (state.officialItems || []).find((it) => it.id === u.itemId))
        .filter(Boolean)
      : [];
    const statusText = inHand ? "En mano" : wasPlayed ? "Jugada" : "En mazo";
    const upgradeText = upgrades.length > 0
      ? `\nMejoras: ${upgrades.map((u) => u.name).join(", ")}`
      : "";
    cardEl.title = `${cardName(card)}\nFuerza de baza: ${power} / 14 · ${POWER_TIER_NAMES[power] || ""}\n${statusText}${upgradeText}`;

    const img = document.createElement("img");
    img.src = `assets/cards/${card.id}.png`;
    img.alt = cardName(card);
    img.className = "deck-card-scan";
    img.loading = "lazy";

    const label = document.createElement("div");
    label.className = "deck-card-label";

    const powerSpan = document.createElement("span");
    powerSpan.className = "deck-card-power";
    if (deckSortMode === "power") {
      powerSpan.textContent = `⚔ ${power}/14`;
    } else {
      powerSpan.textContent = cardName(card);
    }

    const statusSpan = document.createElement("span");
    statusSpan.className = "deck-card-status";
    statusSpan.textContent = statusText;

    label.append(powerSpan, statusSpan);
    cardEl.append(img, label);
    elements.deckGrid.append(cardEl);
  }

  // Update button states
  const powerBtn = document.querySelector("#deckSortPowerBtn");
  const suitBtn = document.querySelector("#deckSortSuitBtn");
  const hintEl = document.querySelector("#deckSortHint");
  if (powerBtn) {
    powerBtn.className = deckSortMode === "power"
      ? "button arcade-btn button-primary"
      : "button button-quiet arcade-btn";
    powerBtn.setAttribute("aria-pressed", String(deckSortMode === "power"));
  }
  if (suitBtn) {
    suitBtn.className = deckSortMode === "suit"
      ? "button arcade-btn button-primary"
      : "button button-quiet arcade-btn";
    suitBtn.setAttribute("aria-pressed", String(deckSortMode === "suit"));
  }
  if (hintEl) {
    hintEl.textContent = deckSortMode === "power"
      ? "14 rangos de Truco · De mayor a menor poder · Hover para detalles"
      : "Por palo (Espadas, Bastos, Oros, Copas) · Hover para detalles";
  }
}

// Event Listeners
document.addEventListener("click", (e) => {
  SFX.init();
  const btn = e.target.closest("button, [role='button'], input[type='button'], summary");
  if (btn && !btn.hasAttribute("data-card-id")) {
    SFX.playButton();
  }
}, { capture: true, passive: true });

elements.restart.addEventListener("click", () => startMatch({ forceNewSeed: true }));
elements.action.addEventListener("click", () => {
  if (ui.mode === "discard") {
    applyAction({ type: "DISCARD", ids: Array.from(ui.selectedIds) });
  } else {
    playSelectedCard();
  }
});
elements.next.addEventListener("click", () => applyAction({ type: "NEXT_ROUND" }));
elements.cantoWant.addEventListener("click", () => applyAction({ type: "ANSWER_CANTO", wants: true }));
elements.cantoReject.addEventListener("click", () => applyAction({ type: "ANSWER_CANTO", wants: false }));
elements.nextLevel.addEventListener("click", () => {
  if (elements.shopTableView) {
    elements.shopTableView.classList.add("is-hidden");
    elements.shopTableView.classList.remove("fade-in");
  }
  if (elements.gameTableView) {
    elements.gameTableView.classList.remove("is-hidden");
    elements.gameTableView.classList.add("fade-in");
  }
  BGM.setZone("main");
  applyAction({ type: "NEXT_LEVEL" });
});

if (elements.shopReroll) {
  elements.shopReroll.addEventListener("click", () => {
    applyAction({ type: "REROLL_SHOP" });
    notify("¡Ofertas renovadas!", "gold");
  });
}
elements.playMode.addEventListener("click", () => {
  ui.mode = "play";
  ui.selectedIds.clear();
  if (state) renderGame(elements, state, { ...ui, cantoAvailable });
});
elements.discardMode.addEventListener("click", () => {
  ui.mode = "discard";
  ui.selectedIds.clear();
  if (state) renderGame(elements, state, { ...ui, cantoAvailable });
});
elements.playerCards.addEventListener("click", (event) => {
  const button = event.target.closest("[data-card-id]");
  if (!button || !state || state.phase !== "playing") return;
  updateSelection(button);
});
elements.playerCards.addEventListener("pointerover", (event) => {
  const button = event.target.closest("[data-card-tooltip]");
  if (button && elements.playerCards.contains(button)) showCardTooltip(button);
});
elements.playerCards.addEventListener("pointerout", (event) => {
  const button = event.target.closest("[data-card-tooltip]");
  if (button && !button.contains(event.relatedTarget)) elements.cardTooltip.hidden = true;
});
elements.playerCards.addEventListener("focusin", (event) => {
  const button = event.target.closest("[data-card-tooltip]");
  if (button) showCardTooltip(button);
});
elements.playerCards.addEventListener("focusout", () => {
  elements.cardTooltip.hidden = true;
});

// "Ver Tanto" action
if (elements.showTanto) {
  elements.showTanto.addEventListener("click", () => {
    if (!state || state.playerHand.length === 0) return;
    const tanto = envidoTanto(state.playerHand);
    notify(`¡Tanto calculado: ${tanto} de Envido!`, "info");
  });
}

// In-Board Outcome Overlay actions
if (elements.outcomeContinue) {
  elements.outcomeContinue.addEventListener("click", () => {
    if (elements.outcomeOverlay) elements.outcomeOverlay.hidden = true;
    SFX.playButton();
    const nextAction = elements.outcomeOverlay?.dataset.nextAction;
    if (nextAction === "shop") {
      SFX.playMoney();
      renderShop();
      BGM.setZone("reverb");
    } else if (nextAction === "nextRound") {
      applyAction({ type: "NEXT_ROUND" });
    }
  });
}

if (elements.outcomeRestart) {
  elements.outcomeRestart.addEventListener("click", () => {
    if (elements.outcomeOverlay) elements.outcomeOverlay.hidden = true;
    SFX.playButton();
    startMatch({ forceNewSeed: true });
  });
}

// ========================================================
// HALL OF FAME / LEADERBOARD (LOCALSTORAGE PERSISTENCE)
// ========================================================
function getLeaderboard() {
  try {
    const raw = localStorage.getItem("trucolite_hall_of_fame");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveToLeaderboard(tag, level, score, seed) {
  const cleanTag = (tag || "CRIOLLO").trim().toUpperCase().slice(0, 5) || "TRUCO";
  try { localStorage.setItem("trucolite_player_tag", cleanTag); } catch (e) {}

  const records = getLeaderboard();
  const newEntry = {
    id: Date.now(),
    tag: cleanTag,
    level: level || 1,
    score: score || 0,
    seed: seed || "ALEATORIA",
    date: new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })
  };
  records.push(newEntry);
  // Sort: Level desc, then score desc
  records.sort((a, b) => (b.level - a.level) || (b.score - a.score));
  const top10 = records.slice(0, 10);
  try {
    localStorage.setItem("trucolite_hall_of_fame", JSON.stringify(top10));
  } catch (e) {}
  return top10;
}

function renderLeaderboardTable() {
  if (!elements.leaderboardTableContainer) return;
  const records = getLeaderboard();
  if (records.length === 0) {
    elements.leaderboardTableContainer.innerHTML = `
      <div style="text-align: center; padding: 24px 10px; color: var(--text-dim); font-size: 12px;">
        <div style="font-size: 28px; margin-bottom: 6px;">🎴</div>
        Todavía no hay récords guardados.<br>
        ¡Completá o terminá una run para inscribir tu nombre en el Salón de la Fama!
      </div>
    `;
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  const rows = records.map((rec, index) => {
    const medal = medals[index] || `#${index + 1}`;
    const rankClass = index === 0 ? "leaderboard-rank-1" : index === 1 ? "leaderboard-rank-2" : index === 2 ? "leaderboard-rank-3" : "";
    return `
      <tr>
        <td class="leaderboard-rank ${rankClass}" style="text-align: center;">${medal}</td>
        <td class="leaderboard-tag">${rec.tag}</td>
        <td style="color: #feca57; font-weight: 700;">NIVEL ${rec.level}</td>
        <td style="font-weight: 700;">${rec.score} pts</td>
        <td style="color: var(--text-dim); font-size: 10px;">${rec.seed}</td>
        <td style="color: var(--text-dim); font-size: 10px;">${rec.date}</td>
      </tr>
    `;
  }).join("");

  elements.leaderboardTableContainer.innerHTML = `
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th style="width: 44px; text-align: center;">PUESTO</th>
          <th>JUGADOR</th>
          <th>NIVEL</th>
          <th>PUNTAJE</th>
          <th>SEED</th>
          <th>FECHA</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// Save record button in outcome overlay
if (elements.saveRecordBtn) {
  elements.saveRecordBtn.addEventListener("click", () => {
    const tag = elements.leaderboardNameInput?.value || "CRACK";
    const level = state ? state.level : 1;
    const score = state ? state.score : 0;
    const seed = state ? state.seed : "";
    saveToLeaderboard(tag, level, score, seed);
    SFX.playMoney();
    if (elements.recordSavedMsg) {
      elements.recordSavedMsg.style.display = "block";
    }
    if (elements.saveRecordBtn) {
      elements.saveRecordBtn.disabled = true;
      elements.saveRecordBtn.textContent = "✓ GUARDADO";
    }
  });
}

// Leaderboard modal toggles
if (elements.openLeaderboardButton && elements.leaderboardDialog) {
  elements.openLeaderboardButton.addEventListener("click", () => {
    renderLeaderboardTable();
    elements.leaderboardDialog.showModal();
  });
}
if (elements.introLeaderboardBtn && elements.leaderboardDialog) {
  elements.introLeaderboardBtn.addEventListener("click", () => {
    renderLeaderboardTable();
    elements.leaderboardDialog.showModal();
  });
}
if (elements.closeLeaderboardButton && elements.leaderboardDialog) {
  elements.closeLeaderboardButton.addEventListener("click", () => elements.leaderboardDialog.close());
}
if (elements.closeLeaderboardButton2 && elements.leaderboardDialog) {
  elements.closeLeaderboardButton2.addEventListener("click", () => elements.leaderboardDialog.close());
}
if (elements.clearLeaderboardButton) {
  elements.clearLeaderboardButton.addEventListener("click", () => {
    if (confirm("¿Estás seguro de que querés borrar todos los récords locales?")) {
      try { localStorage.removeItem("trucolite_hall_of_fame"); } catch (e) {}
      renderLeaderboardTable();
      notify("Historial de récords limpiado", "info");
    }
  });
}

// "Ver Mazo" dialog action
if (elements.viewDeck && elements.deckDialog) {
  elements.viewDeck.addEventListener("click", () => {
    renderDeckViewer(deckSortMode);
    elements.deckDialog.showModal();
  });
}
if (elements.deckPileButton && elements.deckDialog) {
  elements.deckPileButton.addEventListener("click", () => {
    renderDeckViewer(deckSortMode);
    elements.deckDialog.showModal();
  });
}
if (elements.closeDeck && elements.deckDialog) {
  elements.closeDeck.addEventListener("click", () => {
    elements.deckDialog.close();
  });
}

// Deck sort buttons
(function initDeckSortButtons() {
  const powerBtn = document.querySelector("#deckSortPowerBtn");
  const suitBtn = document.querySelector("#deckSortSuitBtn");
  if (powerBtn) {
    powerBtn.addEventListener("click", () => {
      SFX.playButton();
      renderDeckViewer("power");
    });
  }
  if (suitBtn) {
    suitBtn.addEventListener("click", () => {
      SFX.playButton();
      renderDeckViewer("suit");
    });
  }
})();

// "Reglas" toggle action
if (elements.toggleRules && elements.rulesDialog) {
  elements.toggleRules.addEventListener("click", () => {
    elements.rulesDialog.showModal();
  });
}
if (elements.closeRules && elements.rulesDialog) {
  elements.closeRules.addEventListener("click", () => {
    elements.rulesDialog.close();
  });
}

// Audio fade helper with smooth easing
function fadeAudio(audio, targetVolume, durationMs, onComplete) {
  if (!audio) return;
  const startVolume = audio.volume;
  const delta = targetVolume - startVolume;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    audio.volume = Math.max(0, Math.min(1, startVolume + delta * ease));
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      audio.volume = Math.max(0, Math.min(1, targetVolume));
      if (onComplete) onComplete();
    }
  }

  requestAnimationFrame(step);
}

// ========================================================
// ALTERNATING 2-TRACK MAIN THEME (main.mp3 <-> main2.mp3)
// ========================================================

const BGM = (() => {
  const MUSIC_VOL = 0.35; // base music volume (lowered decibels by default)
  const playlist = ["assets/audio/main.mp3", "assets/audio/main2.mp3"];
  let trackIndex = 0;
  let el = null;
  let isRunning = false;
  let masterVol = MUSIC_VOL;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function rampTo(target, durationMs, cb) {
    if (!el) return;
    const start = el.volume;
    const delta = target - start;
    const t0 = performance.now();
    function step(now) {
      const p = Math.min(1, (now - t0) / durationMs);
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      el.volume = clamp(start + delta * ease, 0, 1);
      if (p < 1) requestAnimationFrame(step);
      else { el.volume = clamp(target, 0, 1); if (cb) cb(); }
    }
    requestAnimationFrame(step);
  }

  function init() {
    if (el) return el;
    el = document.createElement("audio");
    el.src = playlist[trackIndex];
    el.loop = false; // Alternates tracks when each ends
    el.preload = "auto";
    el.volume = 0;
    el.dataset.bgmLayer = "main";
    el.addEventListener("ended", () => {
      trackIndex = (trackIndex + 1) % playlist.length;
      el.src = playlist[trackIndex];
      el.volume = masterVol;
      el.play().catch(() => {});
    });
    document.body.appendChild(el);
    return el;
  }

  function start(vol) {
    if (typeof vol === "number") masterVol = clamp(vol, 0, 1);
    if (isRunning) return;
    isRunning = true;
    init();
    el.volume = 0;
    el.play().then(() => {
      rampTo(masterVol, 1500);
    }).catch(() => {});
  }

  function stop(durationMs = 800) {
    if (!el) return;
    rampTo(0, durationMs, () => { el.pause(); });
    isRunning = false;
  }

  function setVolume(vol) {
    masterVol = clamp(vol, 0, 1);
    if (el) rampTo(masterVol, 300);
  }

  function setZone() {
    // 2-track alternating playlist mode
  }

  return { init, start, stop, setZone, setVolume, getActiveRole: () => "main", getEl: () => el };
})();

for (const [canto, button] of Object.entries(elements.cantos)) {
  button.addEventListener("click", () => applyAction({ type: "CANTAR", canto }));
}
tutorial.start.addEventListener("click", () => {
  const started = startMatch();
  if (started || !state) tutorial.dialog.close();
});
tutorial.close.addEventListener("click", () => tutorial.dialog.close());
tutorial.open.addEventListener("click", () => {
  tutorial.start.hidden = Boolean(state);
  tutorial.close.hidden = !state;
  tutorial.dialog.showModal();
});
tutorial.dialog.addEventListener("cancel", (event) => {
  if (!state) event.preventDefault();
});

// Tutorial tabs: Reglas del Truco / Modo Trucolite
(function initTutorialTabs() {
  const tabTruco = document.querySelector("#tabTrucoBtn");
  const tabRoguelite = document.querySelector("#tabRogueliteBtn");
  const panelTruco = document.querySelector("#tutorialTrucoPanel");
  const panelRoguelite = document.querySelector("#tutorialRoguelitePanel");
  if (!tabTruco || !tabRoguelite || !panelTruco || !panelRoguelite) return;

  function switchTab(active) {
    if (active === "truco") {
      panelTruco.hidden = false;
      panelRoguelite.hidden = true;
      tabTruco.className = "button arcade-btn button-primary";
      tabTruco.setAttribute("aria-pressed", "true");
      tabRoguelite.className = "button button-quiet arcade-btn";
      tabRoguelite.setAttribute("aria-pressed", "false");
    } else {
      panelTruco.hidden = true;
      panelRoguelite.hidden = false;
      tabTruco.className = "button button-quiet arcade-btn";
      tabTruco.setAttribute("aria-pressed", "false");
      tabRoguelite.className = "button arcade-btn button-primary";
      tabRoguelite.setAttribute("aria-pressed", "true");
    }
  }

  tabTruco.addEventListener("click", () => { SFX.playButton(); switchTab("truco"); });
  tabRoguelite.addEventListener("click", () => { SFX.playButton(); switchTab("roguelite"); });
  // Default: show truco tab
  switchTab("truco");
})();

// Pitch-Black Cinematic Intro Menu
const intro = {
  menu: document.querySelector("#introMenu"),
  prompt: document.querySelector("#introStartPrompt"),
  titleContainer: document.querySelector("#introTitleContainer"),
  playGameBtn: document.querySelector("#introPlayGameBtn"),
  tutorialBtn: document.querySelector("#introTutorialBtn"),
  deckBtn: document.querySelector("#introDeckBtn")
};

let introStarted = false;

if (intro.menu) {
  // Click anywhere on the pitch black screen to fade in menu.mp3 and reveal the title with PUM
  intro.menu.addEventListener("click", (e) => {
    if (e.target.closest("#introTitleContainer")) return;

    if (!introStarted) {
      introStarted = true;
      if (intro.prompt) {
        intro.prompt.style.display = "none";
      }

      if (elements.menuAudio) {
        elements.menuAudio.currentTime = 0;
        elements.menuAudio.volume = 0;
        elements.menuAudio.play().then(() => {
          fadeAudio(elements.menuAudio, 0.75, 2500);
        }).catch(() => {
          // Handled
        });
      }

      // After 450ms, PUM! Reveal title and JUGAR button with impact animation
      setTimeout(() => {
        if (intro.titleContainer) {
          intro.titleContainer.hidden = false;
        }
      }, 450);
    }
  });
}

if (intro.playGameBtn) {
  intro.playGameBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    // 1. Smoothly fade out menu track and completely remove it
    if (elements.menuAudio) {
      fadeAudio(elements.menuAudio, 0, 700, () => {
        elements.menuAudio.pause();
        elements.menuAudio.currentTime = 0;
        elements.menuAudio.remove();
        elements.menuAudio = null;
      });
    }

    // 2. Hide and dissolve the pitch-black intro overlay
    if (intro.menu) {
      intro.menu.classList.add("is-hidden");
      setTimeout(() => { intro.menu.remove(); }, 850);
    }

    // 3. Start the alternating BGM system (main.mp3 <-> main2.mp3)
    BGM.init();
    BGM.start();

    // 4. Start the game match
    if (!state) { startMatch({ forceNewSeed: true }); }

    notify("¡Bienvenido a Trucolite! Buena partida", "info");
  });
}

if (intro.tutorialBtn) {
  intro.tutorialBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    tutorial.start.hidden = Boolean(state);
    tutorial.close.hidden = !state;
    tutorial.dialog.showModal();
  });
}

if (intro.deckBtn) {
  intro.deckBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    renderDeckViewer();
    elements.deckDialog.showModal();
  });
}

elements.action.disabled = true;
elements.next.disabled = true;
elements.playMode.disabled = true;
elements.discardMode.disabled = true;
for (const button of Object.values(elements.cantos)) button.disabled = true;

// If intro menu is present, don't popup the tutorial modal automatically
if (!intro.menu) {
  tutorial.dialog.showModal();
}

// ========================================================
// BALATRO-STYLE 3D PARALLAX MOUSE TRACKING
// ========================================================
let parallaxEnabled = true;

function initParallaxTracking() {
  if (typeof window === "undefined" || !window.matchMedia) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const appContainer = document.querySelector(".app-container");
  const introHero = document.querySelector(".intro-hero-stage");
  const introCards = document.querySelector(".intro-cards-fan");

  let targetNormX = 0;
  let targetNormY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;
  let currentShiftX = 0;
  let currentShiftY = 0;

  window.addEventListener("mousemove", (e) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    targetNormX = Math.max(-1, Math.min(1, (e.clientX / w - 0.5) * 2));
    targetNormY = Math.max(-1, Math.min(1, (e.clientY / h - 0.5) * 2));
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    targetNormX = 0;
    targetNormY = 0;
  }, { passive: true });

  function renderParallax() {
    if (!parallaxEnabled) {
      currentTiltX += (0 - currentTiltX) * 0.1;
      currentTiltY += (0 - currentTiltY) * 0.1;
      currentShiftX += (0 - currentShiftX) * 0.1;
      currentShiftY += (0 - currentShiftY) * 0.1;
    } else {
      currentTiltX += (-targetNormY * 2.2 - currentTiltX) * 0.08;
      currentTiltY += (targetNormX * 2.2 - currentTiltY) * 0.08;
      currentShiftX += (targetNormX * 5 - currentShiftX) * 0.08;
      currentShiftY += (targetNormY * 5 - currentShiftY) * 0.08;
    }

    if (appContainer) {
      appContainer.style.transform = `perspective(1200px) rotateX(${currentTiltX.toFixed(3)}deg) rotateY(${currentTiltY.toFixed(3)}deg) translate3d(${currentShiftX.toFixed(2)}px, ${currentShiftY.toFixed(2)}px, 0)`;
    }

    if (introHero) {
      const heroTiltX = parallaxEnabled ? -targetNormY * 3.5 : 0;
      const heroTiltY = parallaxEnabled ? targetNormX * 3.5 : 0;
      introHero.style.transform = `perspective(800px) rotateX(${heroTiltX.toFixed(2)}deg) rotateY(${heroTiltY.toFixed(2)}deg)`;
    }

    if (introCards) {
      const cardShiftX = parallaxEnabled ? -targetNormX * 14 : 0;
      const cardShiftY = parallaxEnabled ? -targetNormY * 9 : 0;
      introCards.style.transform = `translate3d(${cardShiftX.toFixed(2)}px, ${cardShiftY.toFixed(2)}px, 0)`;
    }

    requestAnimationFrame(renderParallax);
  }

  requestAnimationFrame(renderParallax);
}

initParallaxTracking();

// ========================================================
// SETTINGS DIALOG
// ========================================================
(function initSettings() {
  const settingsDialog  = document.querySelector("#settingsDialog");
  const openSettingsBtn = document.querySelector("#openSettingsButton");
  const closeSettingsBtn = document.querySelector("#closeSettingsButton");

  const musicVolSlider  = document.querySelector("#settingsMusicVol");
  const musicVolVal     = document.querySelector("#settingsMusicVolVal");
  const sfxVolSlider    = document.querySelector("#settingsSfxVol");
  const sfxVolVal       = document.querySelector("#settingsSfxVolVal");
  const parallaxCheck   = document.querySelector("#settingsParallax");
  const bgAnimCheck     = document.querySelector("#settingsBgAnim");
  const crtCheck        = document.querySelector("#settingsCrt");
  const reduceMotion    = document.querySelector("#settingsReduceMotion");
  const fontSizeSel     = document.querySelector("#settingsFontSize");
  const bgmWidget       = document.querySelector("#bgmWidget");
  const bgmToggleBtn    = document.querySelector("#bgmToggle");
  const bgmVolSlider    = document.querySelector("#bgmVolume");
  const bgmZoneBadge    = document.querySelector("#bgmZoneBadge");
  const crtOverlay      = document.querySelector(".crt-overlay");

  // Keep sidebar volume slider in sync with settings slider
  function syncMusicVol(val) {
    const v = Number(val);
    if (musicVolVal) musicVolVal.textContent = `${v}%`;
    if (bgmVolSlider) bgmVolSlider.value = v;
    BGM.setVolume(v / 100);
  }

  if (musicVolSlider) {
    musicVolSlider.addEventListener("input", (e) => syncMusicVol(e.target.value));
  }
  if (bgmVolSlider) {
    bgmVolSlider.addEventListener("input", (e) => {
      if (musicVolSlider) musicVolSlider.value = e.target.value;
      syncMusicVol(e.target.value);
    });
  }

  if (sfxVolSlider) {
    sfxVolSlider.addEventListener("input", (e) => {
      const v = Number(e.target.value);
      if (sfxVolVal) sfxVolVal.textContent = `${v}%`;
      SFX._masterVol = v / 100;
    });
  }

  // BGM pause/resume in sidebar
  let bgmPaused = false;
  if (bgmToggleBtn) {
    bgmToggleBtn.addEventListener("click", () => {
      bgmPaused = !bgmPaused;
      const layers = document.querySelectorAll("audio[data-bgm-layer]");
      if (bgmPaused) {
        layers.forEach(el => el.pause());
        bgmToggleBtn.innerHTML = "<span>▶</span> REANUDAR";
        bgmToggleBtn.classList.remove("playing");
      } else {
        layers.forEach(el => el.play().catch(() => {}));
        bgmToggleBtn.innerHTML = "<span>⏸</span> PAUSAR";
        bgmToggleBtn.classList.add("playing");
      }
    });
  }

  // Parallax toggle
  if (parallaxCheck) {
    parallaxCheck.addEventListener("change", () => {
      parallaxEnabled = parallaxCheck.checked;
    });
  }

  // Background animation toggle
  if (bgAnimCheck) {
    bgAnimCheck.addEventListener("change", () => {
      const bodyEl = document.body;
      const tableEl = document.querySelector(".felt-table");
      const paused = !bgAnimCheck.checked;
      if (bodyEl) bodyEl.style.animationPlayState = paused ? "paused" : "running";
      if (tableEl) tableEl.style.animationPlayState = paused ? "paused" : "running";
    });
  }

  // CRT overlay toggle
  if (crtCheck && crtOverlay) {
    crtCheck.addEventListener("change", () => {
      crtOverlay.style.display = crtCheck.checked ? "" : "none";
    });
  }

  // Reduce motion toggle
  if (reduceMotion) {
    reduceMotion.addEventListener("change", () => {
      if (reduceMotion.checked && parallaxCheck) {
        parallaxCheck.checked = false;
        parallaxEnabled = false;
      }
    });
  }

  // Font size toggle
  const fontSizeMap = { small: "11px", normal: "13px", large: "16px" };
  if (fontSizeSel) {
    fontSizeSel.addEventListener("change", () => {
      document.body.style.fontSize = fontSizeMap[fontSizeSel.value] || "13px";
    });
  }

  // BGM status badge updater
  function updateZoneBadge() {
    if (bgmZoneBadge) {
      bgmZoneBadge.textContent = "● MÚSICA";
    }
  }
  updateZoneBadge();

  // ========================================================
  // ANIMATION RESOLUTION / QUALITY (HIGH / MEDIUM / LOW)
  // ========================================================
  const animQualitySel = document.querySelector("#settingsAnimQuality");
  function setAnimQuality(quality) {
    document.body.dataset.animQuality = quality;
    try { localStorage.setItem("trucolite_anim_quality", quality); } catch (e) {}
    if (animQualitySel) animQualitySel.value = quality;

    const bodyEl = document.body;
    const tableEl = document.querySelector(".felt-table");

    if (quality === "low") {
      parallaxEnabled = false;
      if (parallaxCheck) parallaxCheck.checked = false;
      if (bodyEl) bodyEl.style.animationPlayState = "paused";
      if (tableEl) tableEl.style.animationPlayState = "paused";
      if (crtCheck) { crtCheck.checked = false; if (crtOverlay) crtOverlay.style.display = "none"; }
    } else if (quality === "medium") {
      parallaxEnabled = true;
      if (parallaxCheck) parallaxCheck.checked = true;
      if (bodyEl) bodyEl.style.animationPlayState = "running";
      if (tableEl) tableEl.style.animationPlayState = "running";
    } else {
      parallaxEnabled = true;
      if (parallaxCheck) parallaxCheck.checked = true;
      if (bodyEl) bodyEl.style.animationPlayState = "running";
      if (tableEl) tableEl.style.animationPlayState = "running";
      if (crtCheck && crtCheck.checked && crtOverlay) crtOverlay.style.display = "";
    }
  }

  if (animQualitySel) {
    animQualitySel.addEventListener("change", (e) => setAnimQuality(e.target.value));
    const savedQuality = localStorage.getItem("trucolite_anim_quality") || "high";
    setAnimQuality(savedQuality);
  }

  // ========================================================
  // I18N / MULTI-LANGUAGE SYSTEM (ES / EN)
  // ========================================================
  const I18N = {
    es: {
      settings_title: "⚙ CONFIGURACIÓN",
      settings_audio: "Audio",
      settings_music: "🎵 Música",
      settings_sfx: "🔊 Efectos (SFX)",
      settings_visual: "Visual",
      settings_parallax: "🖱 Parallax (movimiento de cámara)",
      settings_bg_anim: "🌀 Fondo animado",
      settings_crt: "📺 Efecto CRT (scanlines)",
      settings_anim_quality: "⚡ Resolución de animaciones",
      anim_high: "Alta (60 FPS + Brillo)",
      anim_medium: "Media (Ágil)",
      anim_low: "Baja (Instantánea)",
      settings_access: "Accesibilidad",
      settings_reduce_motion: "♿ Reducir movimiento",
      settings_font_size: "🔤 Tamaño de texto",
      font_small: "Pequeño",
      font_normal: "Normal",
      font_large: "Grande",
      settings_language: "Idioma / Language",
      settings_lang_label: "🌐 Idioma",
      settings_close: "CERRAR",
      play_mode: "Modo Jugar",
      discard_mode: "Modo Cambiar",
      btn_play_card: "JUGAR CARTA ➔",
      btn_see_tanto: "VER TANTO",
      btn_next_round: "SIGUIENTE RONDA ➔",
      btn_view_deck: "VER MAZO",
      btn_how_to_play: "CÓMO JUGAR",
      btn_records: "🏆 RÉCORDS",
      btn_rules: "REGLAS",
      btn_config: "⚙ CONFIG",
      btn_restart: "REINICIAR"
    },
    en: {
      settings_title: "⚙ SETTINGS",
      settings_audio: "Audio",
      settings_music: "🎵 Music",
      settings_sfx: "🔊 Effects (SFX)",
      settings_visual: "Visual",
      settings_parallax: "🖱 Parallax (Camera Tilt)",
      settings_bg_anim: "🌀 Animated Background",
      settings_crt: "📺 CRT Scanlines Effect",
      settings_anim_quality: "⚡ Animation Quality",
      anim_high: "High (60 FPS + Glow)",
      anim_medium: "Medium (Snappy)",
      anim_low: "Low (Instant / Fast)",
      settings_access: "Accessibility",
      settings_reduce_motion: "♿ Reduce Motion",
      settings_font_size: "🔤 Font Size",
      font_small: "Small",
      font_normal: "Normal",
      font_large: "Large",
      settings_language: "Language / Idioma",
      settings_lang_label: "🌐 Language",
      settings_close: "CLOSE",
      play_mode: "Play Mode",
      discard_mode: "Discard Mode",
      btn_play_card: "PLAY CARD ➔",
      btn_see_tanto: "SHOW TANTO",
      btn_next_round: "NEXT ROUND ➔",
      btn_view_deck: "VIEW DECK",
      btn_how_to_play: "HOW TO PLAY",
      btn_records: "🏆 RECORDS",
      btn_rules: "RULES",
      btn_config: "⚙ SETTINGS",
      btn_restart: "RESTART"
    }
  };

  const langSel = document.querySelector("#settingsLang");
  function setLanguage(lang) {
    const dict = I18N[lang] || I18N.es;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (dict[key]) {
        if (el.tagName === "INPUT" && el.type === "button") el.value = dict[key];
        else el.textContent = dict[key];
      }
    });

    if (elements.playMode) elements.playMode.textContent = dict.play_mode;
    if (elements.discardMode) elements.discardMode.textContent = dict.discard_mode;
    if (elements.showTanto) elements.showTanto.textContent = dict.btn_see_tanto;
    if (elements.action && !elements.action.dataset.customText) {
      elements.action.textContent = ui.mode === "discard" ? dict.discard_mode : dict.btn_play_card;
    }
    if (elements.next) elements.next.textContent = dict.btn_next_round;
    if (elements.viewDeck) elements.viewDeck.textContent = dict.btn_view_deck;
    if (elements.toggleRules) elements.toggleRules.textContent = dict.btn_rules;
    if (elements.restart) elements.restart.textContent = dict.btn_restart;
    if (elements.openLeaderboardButton) elements.openLeaderboardButton.textContent = dict.btn_records;
    if (elements.introLeaderboardBtn) elements.introLeaderboardBtn.textContent = dict.btn_records;
    const openSet = document.querySelector("#openSettingsButton");
    if (openSet) openSet.textContent = dict.btn_config;
    const tutOpen = document.querySelector("#tutorialOpenButton");
    if (tutOpen) tutOpen.textContent = dict.btn_how_to_play;

    try { localStorage.setItem("trucolite_lang", lang); } catch (e) {}
    if (langSel) langSel.value = lang;
  }

  if (langSel) {
    langSel.addEventListener("change", (e) => setLanguage(e.target.value));
    const savedLang = localStorage.getItem("trucolite_lang") || "es";
    setLanguage(savedLang);
  }

  if (openSettingsBtn && settingsDialog) {
    openSettingsBtn.addEventListener("click", () => settingsDialog.showModal());
  }
  if (closeSettingsBtn && settingsDialog) {
    closeSettingsBtn.addEventListener("click", () => settingsDialog.close());
  }
})();
