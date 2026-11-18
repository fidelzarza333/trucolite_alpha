import { createGame, dispatch, cantoAvailable, pickShopOffers } from "../core/game.js";
import { createDeck, cardPower } from "../core/cards.js";
import { ITEM_PRICES, itemById, FULL_CATALOG } from "../core/items.js";
import { createDefaultRules, mergeRules, validateRules } from "../core/rules.js";
import { formatEvent, formatMoney, renderGame, triggerToast, cardName } from "./render.js";
import { envidoTanto } from "../core/envido.js";

// Safe local storage helper for sandboxed iframes (e.g. itch.io)
const storage = {
  get(key, fallback = null) {
    try {
      if (typeof window === "undefined" || !window.localStorage) return fallback;
      const v = window.localStorage.getItem(key);
      return v !== null && v !== undefined ? v : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, val) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, String(val));
      }
    } catch {}
  },
  remove(key) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}
  }
};

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
  discardButton: document.querySelector("#discardActionButton"),
  returnToMenuBtn: document.querySelector("#returnToMenuBtn"),
  introResumeGameBtn: document.querySelector("#introResumeGameBtn"),
  introInteractiveTourBtn: document.querySelector("#introInteractiveTourBtn"),
  tourPopover: document.querySelector("#tourPopover"),
  tourStepBadge: document.querySelector("#tourStepBadge"),
  tourTitle: document.querySelector("#tourTitle"),
  tourDesc: document.querySelector("#tourDesc"),
  tourPrevBtn: document.querySelector("#tourPrevBtn"),
  tourNextBtn: document.querySelector("#tourNextBtn"),
  tourCloseBtn: document.querySelector("#tourCloseBtn"),
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
  shopUpgradesOffers: document.querySelector("#shopUpgradesOffers"),
  shopUpgradesSection: document.querySelector("#shopUpgradesSection"),
  shopReroll: document.querySelector("#shopRerollButton"),
  nextLevel: document.querySelector("#nextLevelButton"),

  // Credits & Debug
  creditsDialog: document.querySelector("#creditsDialog"),
  introCreditsBtn: document.querySelector("#introCreditsBtn"),
  openCreditsButton: document.querySelector("#openCreditsButton"),
  closeCreditsButton: document.querySelector("#closeCreditsButton"),
  openDebugButton: document.querySelector("#openDebugButton"),

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
    button: ["assets/audio/SFX/button.mp3"],
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
      restartBtn.textContent = "REINICIAR RUN (NUEVA SEED)";
    }
    if (lbBox) {
      lbBox.hidden = false;
      const savedTag = storage.get("trucolite_player_tag", "");
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
    const slotEl = container.children[i];
    const jokerCardEl = slotEl?.querySelector?.(".joker-card") || slotEl;
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

    const instantCantoEvt = result.events.find((e) => e.type === "ENVIDO_RESOLVED" || e.type === "FLOR_RESOLVED");
    if (instantCantoEvt) {
      const cantoName = instantCantoEvt.type === "ENVIDO_RESOLVED" ? "Envido" : "Flor";
      const winnerLabel = instantCantoEvt.winner === "player" ? "¡Ganaste!" : "Ganó El Rival";
      ui.message = `${cantoName}: ${winnerLabel} (${instantCantoEvt.playerTanto} vs ${instantCantoEvt.rivalTanto})`;
      ui.tone = instantCantoEvt.winner === "player" ? "win" : "lose";
      notify(`${cantoName}: ${winnerLabel} (${instantCantoEvt.playerTanto} vs ${instantCantoEvt.rivalTanto})`, instantCantoEvt.winner === "player" ? "win" : "lose");
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

  // Exactly 5 vertical slots in Balatro style with external action controls below
  for (let slotIndex = 0; slotIndex < 5; slotIndex += 1) {
    const joker = state.jokers[slotIndex];
    const slotWrapper = document.createElement("div");
    slotWrapper.className = "joker-slot-unit";

    if (joker) {
      const card = document.createElement("article");
      card.className = `joker-card joker-card-${joker.rarity}`;
      card.dataset.jokerId = joker.id;

      // Tooltip matching the exact card design: title, description, and custom description
      card.dataset.cardTooltip = `${joker.description}\n${joker.shortDescription || "Lorem ipsum"}`;
      card.setAttribute("aria-label", joker.name);

      const refund = ITEM_PRICES[joker.rarity] / 2;

      // Header with name and rarity badge
      const header = document.createElement("div");
      header.className = "joker-header";

      const nameText = document.createElement("span");
      nameText.className = "joker-title-text";
      nameText.textContent = (joker.emoji ? joker.emoji + " " : "") + joker.name;

      const rarityBadge = document.createElement("span");
      rarityBadge.className = "joker-rarity-badge";
      rarityBadge.textContent = joker.rarity.replace("pocoComun", "P.COM").toUpperCase();

      header.append(nameText, rarityBadge);

      // Center body with artwork filling the full card body cleanly
      const body = document.createElement("div");
      body.className = "joker-art-container";
      const artEmoji = document.createElement("div");
      artEmoji.className = "joker-art-emoji";
      artEmoji.textContent = joker.emoji || "🃏";
      artEmoji.setAttribute("aria-label", joker.name);
      body.append(artEmoji);

      // Card only holds header and artwork - NO buttons inside!
      card.append(header, body);
      slotWrapper.append(card);

      // Controls placed OUTSIDE the card, directly underneath
      const controls = document.createElement("div");
      controls.className = "joker-controls-outside";

      const sellBtn = document.createElement("button");
      sellBtn.className = "button button-sell arcade-btn";
      sellBtn.type = "button";
      sellBtn.textContent = `Vender $${formatMoney(refund)}`;
      sellBtn.setAttribute("aria-label", `Vender ${joker.name} por $${formatMoney(refund)}`);
      sellBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        applyAction({ type: "SELL_JOKER", itemId: joker.id });
      });

      const moveControls = document.createElement("div");
      moveControls.className = "joker-move-controls";

      const leftBtn = document.createElement("button");
      leftBtn.className = "joker-move-btn arcade-btn";
      leftBtn.type = "button";
      leftBtn.innerHTML = "◀";
      leftBtn.title = "Mover a la izquierda";
      leftBtn.disabled = slotIndex === 0;
      leftBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        applyAction({ type: "MOVE_JOKER", fromIndex: slotIndex, toIndex: slotIndex - 1 });
      });

      const rightBtn = document.createElement("button");
      rightBtn.className = "joker-move-btn arcade-btn";
      rightBtn.type = "button";
      rightBtn.innerHTML = "▶";
      rightBtn.title = "Mover a la derecha";
      rightBtn.disabled = slotIndex >= state.jokers.length - 1;
      rightBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        applyAction({ type: "MOVE_JOKER", fromIndex: slotIndex, toIndex: slotIndex + 1 });
      });

      moveControls.append(leftBtn, rightBtn);
      controls.append(sellBtn, moveControls);
      slotWrapper.append(controls);
    } else {
      // Empty slot placeholder
      const emptySlot = document.createElement("div");
      emptySlot.className = "joker-slot-empty";
      emptySlot.innerHTML = `<span class="empty-slot-plus">+</span><span class="empty-slot-label">COMODÍN</span><span class="empty-slot-sub">${slotIndex + 1}/5</span>`;

      const placeholder = document.createElement("div");
      placeholder.className = "joker-controls-placeholder";

      slotWrapper.append(emptySlot, placeholder);
    }
    elements.jokerList.append(slotWrapper);
  }
}

let pendingUpgradeItem = null;
let deckUpgradeMode = false;

function openDeckForUpgrade(item) {
  pendingUpgradeItem = item;
  deckUpgradeMode = true;
  const title = document.querySelector("#deckDialogTitle");
  if (title) {
    title.textContent = `APLICAR: ${item.name.toUpperCase()} ($${ITEM_PRICES[item.rarity]}) · Hacé clic en la carta a mejorar`;
    title.style.color = "#55efc4";
  }
  renderDeckViewer();
  if (elements.deckDialog) {
    elements.deckDialog.showModal();
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

  // 1. OFERTAS DE JOKERS (3 arriba)
  let jokerOfferIds = state.shopJokerOffers || [];
  if (jokerOfferIds.length === 0 && state.shopOffers) {
    jokerOfferIds = state.shopOffers.filter((id) => {
      const item = itemById(state.officialItems, id);
      return item && item.kind === "joker";
    });
  }

  elements.shopOffers.replaceChildren();
  for (let index = 0; index < jokerOfferIds.length; index += 1) {
    const itemId = jokerOfferIds[index];
    const item = itemById(state.officialItems, itemId);
    if (!item) continue;

    const wrapper = document.createElement("article");
    wrapper.className = "shop-offer-wrapper";

    const card = document.createElement("div");
    card.className = `shop-item-card shop-card-${item.rarity} shop-item-joker joker-card-${item.rarity}`;
    card.dataset.rarity = item.rarity;

    // 1. Rareza: texto chico, en el color del borde, arriba
    const rarity = document.createElement("span");
    rarity.className = "shop-rarity";
    rarity.textContent = item.rarity.replace("pocoComun", "poco común").toUpperCase();

    // 2. Zona de arte: ocupa ~50% de la altura, ícono/arte grande y centrado
    const body = document.createElement("div");
    body.className = "joker-art-container";
    const artEmoji = document.createElement("div");
    artEmoji.className = "joker-art-emoji";
    artEmoji.textContent = item.emoji || "🃏";
    artEmoji.setAttribute("aria-label", item.name);
    body.append(artEmoji);

    // 3. Nombre: grande, centrado, sin repetir el ícono junto al nombre
    const title = document.createElement("h3");
    title.className = "shop-item-title";
    title.textContent = item.name;

    // 4. Efecto: tamaño legible, centrado, máx. 3-4 líneas
    const description = document.createElement("p");
    description.className = "shop-description";
    description.textContent = item.description;

    card.append(rarity, body, title, description);

    // Debajo de cada carta, botón de ancho completo con precio incluido: "COMPRAR · $4"
    const price = ITEM_PRICES[item.rarity];
    const hasEnoughMoney = state.money >= price;
    const maxJokers = state.jokers.some((j) => j.id === "comodin-triqui-traka") ? 7 : 5;
    const isJokerLimitReached = state.jokers.length >= maxJokers;
    const isDisabled = !hasEnoughMoney || isJokerLimitReached;

    const buyButton = document.createElement("button");
    buyButton.className = `button arcade-btn shop-buy-btn${!hasEnoughMoney ? " is-insufficient" : ""}`;
    buyButton.type = "button";
    buyButton.disabled = isDisabled;

    const buyText = document.createElement("span");
    buyText.className = "shop-buy-text";
    buyText.textContent = "COMPRAR";

    const buySep = document.createElement("span");
    buySep.className = "shop-buy-sep";
    buySep.textContent = "·";

    const buyPrice = document.createElement("span");
    buyPrice.className = "shop-buy-price";
    buyPrice.textContent = `$${price}`;

    buyButton.append(buyText, buySep, buyPrice);

    if (isJokerLimitReached) {
      buyButton.title = "Vendé un comodín en la barra superior para liberar espacio.";
    }
    buyButton.addEventListener("click", () => applyAction({ type: "BUY_ITEM", itemId }));

    wrapper.append(card, buyButton);
    elements.shopOffers.append(wrapper);
  }

  // 2. OFERTAS DE MEJORAS DE CARTA (2 abajo)
  let upgradeOfferIds = state.shopUpgradeOffers || [];
  if (upgradeOfferIds.length === 0 && state.shopOffers) {
    upgradeOfferIds = state.shopOffers.filter((id) => {
      const item = itemById(state.officialItems, id);
      return item && item.kind === "cardUpgrade";
    });
  }

  if (elements.shopUpgradesSection) {
    elements.shopUpgradesSection.style.display = "";
  }

  if (elements.shopUpgradesOffers) {
    elements.shopUpgradesOffers.replaceChildren();
    if (upgradeOfferIds.length === 0) {
      const emptyNote = document.createElement("div");
      emptyNote.className = "shop-empty-msg";
      emptyNote.textContent = "No hay mejoras disponibles esta ronda.";
      elements.shopUpgradesOffers.append(emptyNote);
    } else {
      for (let index = 0; index < upgradeOfferIds.length; index += 1) {
        const itemId = upgradeOfferIds[index];
        const item = itemById(state.officialItems, itemId);
        if (!item) continue;

        const wrapper = document.createElement("article");
        wrapper.className = "shop-offer-wrapper";

        const card = document.createElement("div");
        card.className = `shop-item-card shop-card-${item.rarity} shop-item-upgrade`;
        card.dataset.rarity = item.rarity;

        // 1. Rareza: texto chico, en el color del borde, arriba
        const rarity = document.createElement("span");
        rarity.className = "shop-rarity";
        rarity.textContent = `MEJORA · ${item.rarity.replace("pocoComun", "poco común").toUpperCase()}`;

        // 2. Zona de arte: ocupa ~50% de la altura, ícono/arte grande y centrado
        const body = document.createElement("div");
        body.className = "joker-art-container";
        const artEmoji = document.createElement("div");
        artEmoji.className = "joker-art-emoji";
        const upgradeEmoji = item.emoji || (item.effect?.stage === "money" ? "💰" : item.effect?.stage === "mult" ? "✨" : "🎴");
        artEmoji.textContent = upgradeEmoji;
        artEmoji.setAttribute("aria-label", item.name);
        body.append(artEmoji);

        // 3. Nombre: grande, centrado, sin repetir el ícono junto al nombre
        const title = document.createElement("h3");
        title.className = "shop-item-title";
        title.textContent = item.name;

        // 4. Efecto: tamaño legible, centrado, máx. 3-4 líneas
        const description = document.createElement("p");
        description.className = "shop-description";
        description.textContent = item.description;

        card.append(rarity, body, title, description);

        // Debajo de cada carta, botón de ancho completo con precio incluido
        const price = ITEM_PRICES[item.rarity];
        const hasEnoughMoney = state.money >= price;

        const chooseCardBtn = document.createElement("button");
        chooseCardBtn.className = `button arcade-btn shop-buy-btn${!hasEnoughMoney ? " is-insufficient" : ""}`;
        chooseCardBtn.type = "button";
        chooseCardBtn.disabled = !hasEnoughMoney;

        const buyText = document.createElement("span");
        buyText.className = "shop-buy-text";
        buyText.textContent = "COMPRAR";

        const buySep = document.createElement("span");
        buySep.className = "shop-buy-sep";
        buySep.textContent = "·";

        const buyPrice = document.createElement("span");
        buyPrice.className = "shop-buy-price";
        buyPrice.textContent = `$${price}`;

        chooseCardBtn.append(buyText, buySep, buyPrice);
        chooseCardBtn.addEventListener("click", () => {
          openDeckForUpgrade(item);
        });

        wrapper.append(card, chooseCardBtn);
        elements.shopUpgradesOffers.append(wrapper);
      }
    }
  }

  if (state.jokers.length >= 5) {
    elements.shopIntro.textContent = "Tenés 5 comodines (máximo). Hacé clic en 'Vender' en cualquier comodín de la barra superior para hacer lugar.";
  } else {
    elements.shopIntro.textContent = "¡Ganaste el nivel y recibiste $5! Comprá comodines arriba o aplicá mejoras a tus cartas abajo.";
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
  if (isPacing || !state || state.phase !== "playing") return;
  SFX.playCard();
  const id = button.dataset.cardId;
  if (ui.selectedIds.has(id)) {
    ui.selectedIds.delete(id);
  } else {
    ui.selectedIds.add(id);
  }
  button.classList.toggle("is-selected", ui.selectedIds.has(id));
  button.setAttribute("aria-pressed", String(ui.selectedIds.has(id)));

  const count = ui.selectedIds.size;
  const discardOpen = state.round.playerPlayedCount === 0 && state.discardsRemaining > 0;
  const isTurn = state.round.table.rivalCard !== null || state.round.leader === "player";

  if (elements.action) {
    elements.action.disabled = count !== 1 || !isTurn;
  }
  if (elements.discardButton) {
    elements.discardButton.disabled = count === 0 || !discardOpen;
  }
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

    if (deckUpgradeMode && pendingUpgradeItem) {
      cardEl.classList.add("deck-card-upgrade-target");
      cardEl.title = `Clic para aplicar mejora: ${pendingUpgradeItem.name}\n${cardEl.title}`;
      cardEl.addEventListener("click", () => {
        const cName = cardName(card);
        const itemToApply = pendingUpgradeItem;
        pendingUpgradeItem = null;
        deckUpgradeMode = false;
        const title = document.querySelector("#deckDialogTitle");
        if (title) {
          title.textContent = "MAZO COMPLETO (40 CARTAS)";
          title.style.color = "var(--blue)";
        }
        elements.deckDialog.close();
        applyAction({ type: "BUY_ITEM", itemId: itemToApply.id, cardId: card.id });
        triggerToast(`¡"${itemToApply.name}" aplicada a ${cName}!`, "gold");
      });
    }

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
  playSelectedCard();
});
if (elements.discardButton) {
  elements.discardButton.addEventListener("click", () => {
    if (ui.selectedIds.size > 0) {
      applyAction({ type: "DISCARD", ids: Array.from(ui.selectedIds) });
    }
  });
}
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

// Tooltip for cards on table (including rival cards)
elements.trickRow.addEventListener("pointerover", (event) => {
  const card = event.target.closest("[data-card-tooltip]");
  if (card && elements.trickRow.contains(card)) showCardTooltip(card);
});
elements.trickRow.addEventListener("pointerout", (event) => {
  const card = event.target.closest("[data-card-tooltip]");
  if (card && !card.contains(event.relatedTarget)) elements.cardTooltip.hidden = true;
});


// Tooltip for Jokers matching exact playing cards design
elements.jokerList.addEventListener("pointerover", (event) => {
  const card = event.target.closest("[data-card-tooltip]");
  if (card && elements.jokerList.contains(card)) showCardTooltip(card);
});
elements.jokerList.addEventListener("pointerout", (event) => {
  const card = event.target.closest("[data-card-tooltip]");
  if (card && !card.contains(event.relatedTarget)) elements.cardTooltip.hidden = true;
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
  const raw = storage.get("trucolite_hall_of_fame");
  try {
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveToLeaderboard(tag, level, score, seed) {
  const cleanTag = (tag || "CRIOLLO").trim().toUpperCase().slice(0, 5) || "TRUCO";
  storage.set("trucolite_player_tag", cleanTag);

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
  storage.set("trucolite_hall_of_fame", JSON.stringify(top10));
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
let clearLeaderboardPending = false;
let clearLeaderboardTimer = null;
if (elements.clearLeaderboardButton) {
  elements.clearLeaderboardButton.addEventListener("click", () => {
    if (!clearLeaderboardPending) {
      clearLeaderboardPending = true;
      elements.clearLeaderboardButton.textContent = "¿CONFIRMAR BORRADO?";
      clearLeaderboardTimer = setTimeout(() => {
        clearLeaderboardPending = false;
        elements.clearLeaderboardButton.textContent = "BORRAR HISTORIAL";
      }, 3500);
      return;
    }
    clearLeaderboardPending = false;
    clearTimeout(clearLeaderboardTimer);
    elements.clearLeaderboardButton.textContent = "BORRAR HISTORIAL";
    storage.remove("trucolite_hall_of_fame");
    renderLeaderboardTable();
    notify("Historial de récords limpiado", "info");
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
    deckUpgradeMode = false;
    pendingUpgradeItem = null;
    const title = document.querySelector("#deckDialogTitle");
    if (title) {
      title.textContent = "MAZO COMPLETO (40 CARTAS)";
      title.style.color = "var(--blue)";
    }
    elements.deckDialog.close();
  });
  elements.deckDialog.addEventListener("cancel", () => {
    deckUpgradeMode = false;
    pendingUpgradeItem = null;
    const title = document.querySelector("#deckDialogTitle");
    if (title) {
      title.textContent = "MAZO COMPLETO (40 CARTAS)";
      title.style.color = "var(--blue)";
    }
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
// ALTERNATING 3-TRACK MAIN THEME (main.mp3 <-> main2.mp3 <-> main3.mp3)
// ========================================================

const BGM = (() => {
  const MUSIC_VOL = 0.35; // base music volume (lowered decibels by default)
  const playlist = ["assets/audio/main.mp3", "assets/audio/main2.mp3", "assets/audio/main3.mp3"];
  let trackIndex = 0;
  let el = null;
  let isRunning = false;
  let isUserPaused = false;
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

  function playTrack(idx) {
    if (!el || !isRunning || isUserPaused) return;
    trackIndex = ((idx % playlist.length) + playlist.length) % playlist.length;
    const nextSrc = playlist[trackIndex];
    if (el.src !== nextSrc && !el.src.endsWith(nextSrc)) {
      el.src = nextSrc;
    }
    el.currentTime = 0;
    el.volume = masterVol;

    const promise = el.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // Wait for canplay event if resource is loading
        const onCanPlay = () => {
          el.removeEventListener("canplay", onCanPlay);
          if (isRunning && !isUserPaused) {
            el.play().catch(() => {});
          }
        };
        el.addEventListener("canplay", onCanPlay, { once: true });

        // Safety fallback timeout in case canplay is missed
        setTimeout(() => {
          if (isRunning && !isUserPaused && el.paused) {
            el.play().catch(() => {});
          }
        }, 400);
      });
    }
  }

  function init() {
    if (el) return el;
    el = document.createElement("audio");
    el.src = playlist[trackIndex];
    el.loop = false; // Alternates tracks smoothly via ended event & watchdog
    el.preload = "auto";
    el.volume = 0;
    el.dataset.bgmLayer = "main";

    // Advance seamlessly when each track finishes
    el.addEventListener("ended", () => {
      if (isRunning && !isUserPaused) {
        playTrack(trackIndex + 1);
      }
    });

    // In case of load/decode error, recover by advancing to next track
    el.addEventListener("error", (e) => {
      console.warn("BGM track load error on", playlist[trackIndex], e);
      if (isRunning && !isUserPaused) {
        setTimeout(() => {
          playTrack(trackIndex + 1);
        }, 500);
      }
    });

    document.body.appendChild(el);
    return el;
  }

  function start(vol) {
    if (typeof vol === "number") masterVol = clamp(vol, 0, 1);
    isUserPaused = false;
    isRunning = true;
    init();

    if (el.paused) {
      el.volume = 0;
      const promise = el.play();
      if (promise !== undefined) {
        promise.then(() => {
          rampTo(masterVol, 1500);
        }).catch(() => {
          // If autoplay is blocked before interaction, retry on first interaction
          const resumeOnInteract = () => {
            window.removeEventListener("click", resumeOnInteract);
            window.removeEventListener("keydown", resumeOnInteract);
            if (isRunning && !isUserPaused && el.paused) {
              el.play().then(() => rampTo(masterVol, 1500)).catch(() => {});
            }
          };
          window.addEventListener("click", resumeOnInteract, { once: true });
          window.addEventListener("keydown", resumeOnInteract, { once: true });
        });
      }
    } else {
      rampTo(masterVol, 500);
    }
  }

  function pause() {
    isUserPaused = true;
    if (el) el.pause();
  }

  function resume() {
    isUserPaused = false;
    isRunning = true;
    if (el) {
      el.play().then(() => rampTo(masterVol, 500)).catch(() => {});
    } else {
      start();
    }
  }

  function toggle() {
    if (isUserPaused || (el && el.paused)) {
      resume();
      return true; // is now playing
    } else {
      pause();
      return false; // is now paused
    }
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
    // Alternating playlist mode
  }

  // Active watchdog: guarantees BGM never stalls or cuts off unexpectedly during game or tutorial
  setInterval(() => {
    if (isRunning && !isUserPaused && el) {
      if (el.paused) {
        if (el.ended) {
          playTrack(trackIndex + 1);
        } else if (!document.hidden) {
          el.play().catch(() => {
            if (el.readyState === 0) {
              playTrack(trackIndex);
            }
          });
        }
      }
    }
  }, 2500);

  return { init, start, stop, pause, resume, toggle, playTrack, setZone, setVolume, getActiveRole: () => "main", getEl: () => el };
})();

// Safe stop & fade for the intro menu audio track
function stopMenuAudio() {
  if (elements.menuAudio) {
    const audio = elements.menuAudio;
    elements.menuAudio = null;
    fadeAudio(audio, 0, 400, () => {
      audio.pause();
      audio.currentTime = 0;
      audio.remove();
    });
  }
}

if (elements.menuAudio) {
  elements.menuAudio.loop = true;
  elements.menuAudio.addEventListener("ended", () => {
    if (elements.menuAudio) {
      elements.menuAudio.currentTime = 0;
      elements.menuAudio.play().catch(() => {});
    }
  });
}

for (const [canto, button] of Object.entries(elements.cantos)) {
  button.addEventListener("click", () => applyAction({ type: "CANTAR", canto }));
}
tutorial.start.addEventListener("click", () => {
  stopMenuAudio();
  if (intro.menu) intro.menu.classList.add("is-hidden");
  BGM.start();
  const started = startMatch();
  if (started || !state) tutorial.dialog.close();
});
tutorial.close.addEventListener("click", () => tutorial.dialog.close());
tutorial.open.addEventListener("click", () => {
  stopMenuAudio();
  BGM.start();
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


// ========================================================
// INTERACTIVE GUIDED TOUR
// ========================================================
const tourSteps = [
  {
    target: ".score-target-box",
    title: "1. OBJETIVO Y ANTES",
    desc: "Tu objetivo es alcanzar el puntaje requerido antes de agotar las rondas del nivel. Cada victoria te da dinero y sube el ante."
  },
  {
    target: ".chips-mult-grid",
    title: "2. FICHAS × MULTIPLICADOR",
    desc: "Los puntos se calculan como Fichas × Mult × xMult de Truco. ¡Tus comodines y cantos aumentan estos valores en tiempo real!"
  },
  {
    target: ".jokers-section",
    title: "3. COMODINES (JOKERS)",
    desc: "Podés tener hasta 5 comodines con sinergias rotas. Usá las flechas ◀ ▶ para ordenarlos y potenciar sus efectos posicionales."
  },
  {
    target: ".bazas-felt-container",
    title: "4. LA MESA DE BAZAS",
    desc: "Cada ronda se disputa a 3 bazas. Pasá el ratón sobre cualquier carta jugada (propia o del Rival) para inspeccionar su fuerza de Truco."
  },
  {
    target: ".cantos-bar",
    title: "5. CANTOS CRIOLLOS",
    desc: "Cantá Envido o Flor antes de tirar tu primera carta para ganar dinero ($1) y mult. Cantá Truco para multiplicar la apuesta."
  },
  {
    target: ".bottom-section",
    title: "6. TUS CARTAS Y ACCIONES",
    desc: "Seleccioná 1 carta para jugarla en la baza, o seleccioná de 1 a 3 para descartar y robar cartas nuevas del mazo."
  },
  {
    target: "#deckPileButton",
    title: "7. EL MAZO COMPLETO",
    desc: "Tocá la pila del mazo en cualquier momento para ver todas las 40 cartas y cuáles faltan por salir ordenadas por poder."
  }
];

let tourCurrentIndex = 0;

function showTourStep(index) {
  if (index < 0 || index >= tourSteps.length) {
    endTour();
    return;
  }
  tourCurrentIndex = index;
  const step = tourSteps[index];

  // Remove previous highlights
  document.querySelectorAll(".tour-highlight").forEach(el => el.classList.remove("tour-highlight"));

  const targetEl = document.querySelector(step.target);
  if (targetEl) {
    targetEl.classList.add("tour-highlight");
    targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  if (elements.tourStepBadge) elements.tourStepBadge.textContent = `PASO ${index + 1} / ${tourSteps.length}`;
  if (elements.tourTitle) elements.tourTitle.textContent = step.title;
  if (elements.tourDesc) elements.tourDesc.textContent = step.desc;

  if (elements.tourPrevBtn) {
    elements.tourPrevBtn.disabled = index === 0;
  }
  if (elements.tourNextBtn) {
    elements.tourNextBtn.textContent = index === tourSteps.length - 1 ? "FINALIZAR ✓" : "SIGUIENTE ▶";
  }

  if (elements.tourPopover) {
    elements.tourPopover.hidden = false;
    // Position popover conveniently
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const popoverRect = elements.tourPopover.getBoundingClientRect();
      let top = rect.bottom + 10;
      if (top + popoverRect.height > window.innerHeight - 10) {
        top = Math.max(10, rect.top - popoverRect.height - 10);
      }
      let left = Math.max(10, Math.min(rect.left, window.innerWidth - 370));
      elements.tourPopover.style.top = `${top}px`;
      elements.tourPopover.style.left = `${left}px`;
    }
  }
}

function startTour() {
  stopMenuAudio();
  BGM.start();
  if (!state) {
    startMatch();
  }
  if (intro.menu) intro.menu.classList.add("is-hidden");
  showTourStep(0);
}

function endTour() {
  document.querySelectorAll(".tour-highlight").forEach(el => el.classList.remove("tour-highlight"));
  if (elements.tourPopover) elements.tourPopover.hidden = true;
  storage.set("trucolite_tutorial_seen", "true");
}

if (elements.tourNextBtn) {
  elements.tourNextBtn.addEventListener("click", () => {
    if (tourCurrentIndex >= tourSteps.length - 1) endTour();
    else showTourStep(tourCurrentIndex + 1);
  });
}
if (elements.tourPrevBtn) {
  elements.tourPrevBtn.addEventListener("click", () => {
    if (tourCurrentIndex > 0) showTourStep(tourCurrentIndex - 1);
  });
}
if (elements.tourCloseBtn) {
  elements.tourCloseBtn.addEventListener("click", () => endTour());
}

if (elements.introInteractiveTourBtn) {
  elements.introInteractiveTourBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startTour();
  });
}

// Return to menu button logic
if (elements.returnToMenuBtn) {
  elements.returnToMenuBtn.addEventListener("click", () => {
    if (intro.menu) {
      intro.menu.classList.remove("is-hidden");
      intro.menu.style.display = "flex";
      if (elements.introResumeGameBtn) {
        elements.introResumeGameBtn.style.display = "inline-flex";
      }
    }
  });
}
if (elements.introResumeGameBtn) {
  elements.introResumeGameBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (intro.menu) {
      intro.menu.classList.add("is-hidden");
    }
  });
}

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
    stopMenuAudio();

    // 2. Hide the intro overlay (keep in DOM so player can return)
    if (intro.menu) {
      intro.menu.classList.add("is-hidden");
    }

    // 3. Start the alternating BGM system (main.mp3 <-> main2.mp3 <-> main3.mp3)
    BGM.start();

    // 4. Start the game match
    if (!state) { startMatch({ forceNewSeed: true }); }

    notify("¡Bienvenido a Trucolite! Buena partida", "info");
  });
}

if (intro.tutorialBtn) {
  intro.tutorialBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    stopMenuAudio();
    BGM.start();
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

// If intro menu is not present, start main BGM and show tutorial modal
if (!intro.menu) {
  stopMenuAudio();
  BGM.start();
  tutorial.dialog.showModal();
}

// ========================================================
// BALATRO-STYLE 3D PARALLAX MOUSE TRACKING (GPU-OPTIMIZED)
// ========================================================
let parallaxEnabled = true;
let wakeParallax = () => {};

function initParallaxTracking() {
  if (typeof window === "undefined" || !window.matchMedia) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const tiltTarget = document.querySelector(".table-main") || document.querySelector(".app-container");
  const introHero = document.querySelector(".intro-hero-stage");
  const introCards = document.querySelector(".intro-cards-fan");
  const introMenu = document.querySelector("#introMenu");

  let targetNormX = 0;
  let targetNormY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;
  let currentShiftX = 0;
  let currentShiftY = 0;
  let isTicking = false;

  function renderParallax() {
    const targetTiltX = parallaxEnabled ? -targetNormY * 2.2 : 0;
    const targetTiltY = parallaxEnabled ? targetNormX * 2.2 : 0;
    const targetShiftX = parallaxEnabled ? targetNormX * 5 : 0;
    const targetShiftY = parallaxEnabled ? targetNormY * 5 : 0;

    currentTiltX += (targetTiltX - currentTiltX) * 0.12;
    currentTiltY += (targetTiltY - currentTiltY) * 0.12;
    currentShiftX += (targetShiftX - currentShiftX) * 0.12;
    currentShiftY += (targetShiftY - currentShiftY) * 0.12;

    const delta = Math.abs(targetTiltX - currentTiltX) + 
                  Math.abs(targetTiltY - currentTiltY) + 
                  Math.abs(targetShiftX - currentShiftX) + 
                  Math.abs(targetShiftY - currentShiftY);

    if (delta < 0.008) {
      currentTiltX = targetTiltX;
      currentTiltY = targetTiltY;
      currentShiftX = targetShiftX;
      currentShiftY = targetShiftY;
    }

    if (tiltTarget) {
      if (currentTiltX === 0 && currentTiltY === 0 && currentShiftX === 0 && currentShiftY === 0) {
        tiltTarget.style.transform = "";
      } else {
        tiltTarget.style.transform = `perspective(1200px) rotateX(${currentTiltX.toFixed(2)}deg) rotateY(${currentTiltY.toFixed(2)}deg) translate3d(${currentShiftX.toFixed(1)}px, ${currentShiftY.toFixed(1)}px, 0)`;
      }
    }

    // Only update intro elements when intro menu is actually visible
    if (introMenu && !introMenu.classList.contains("is-hidden")) {
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
    }

    if (delta >= 0.008) {
      requestAnimationFrame(renderParallax);
    } else {
      isTicking = false;
    }
  }

  function requestTick() {
    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(renderParallax);
    }
  }

  wakeParallax = () => {
    targetNormX = 0;
    targetNormY = 0;
    requestTick();
  };

  window.addEventListener("mousemove", (e) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    targetNormX = Math.max(-1, Math.min(1, (e.clientX / w - 0.5) * 2));
    targetNormY = Math.max(-1, Math.min(1, (e.clientY / h - 0.5) * 2));
    requestTick();
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    targetNormX = 0;
    targetNormY = 0;
    requestTick();
  }, { passive: true });

  requestTick();
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
  if (bgmToggleBtn) {
    bgmToggleBtn.addEventListener("click", () => {
      const isPlaying = BGM.toggle();
      if (!isPlaying) {
        bgmToggleBtn.innerHTML = "REANUDAR";
        bgmToggleBtn.classList.remove("playing");
      } else {
        bgmToggleBtn.innerHTML = "PAUSAR";
        bgmToggleBtn.classList.add("playing");
      }
    });
  }

  // Parallax toggle
  if (parallaxCheck) {
    parallaxCheck.addEventListener("change", () => {
      parallaxEnabled = parallaxCheck.checked;
      wakeParallax();
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
        wakeParallax();
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
    storage.set("trucolite_anim_quality", quality);
    if (animQualitySel) animQualitySel.value = quality;

    const bodyEl = document.body;
    const tableEl = document.querySelector(".felt-table");

    if (quality === "low") {
      parallaxEnabled = false;
      if (parallaxCheck) parallaxCheck.checked = false;
      if (bodyEl) bodyEl.style.animationPlayState = "paused";
      if (tableEl) tableEl.style.animationPlayState = "paused";
      if (crtCheck) { crtCheck.checked = false; if (crtOverlay) crtOverlay.style.display = "none"; }
      wakeParallax();
    } else if (quality === "medium") {
      parallaxEnabled = true;
      if (parallaxCheck) parallaxCheck.checked = true;
      if (bodyEl) bodyEl.style.animationPlayState = "running";
      if (tableEl) tableEl.style.animationPlayState = "running";
      wakeParallax();
    } else {
      parallaxEnabled = true;
      if (parallaxCheck) parallaxCheck.checked = true;
      if (bodyEl) bodyEl.style.animationPlayState = "running";
      if (tableEl) tableEl.style.animationPlayState = "running";
      if (crtCheck && crtCheck.checked && crtOverlay) crtOverlay.style.display = "";
      wakeParallax();
    }
  }

  if (animQualitySel) {
    animQualitySel.addEventListener("change", (e) => setAnimQuality(e.target.value));
    const savedQuality = storage.get("trucolite_anim_quality", "high");
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
      btn_records: "RÉCORDS",
      btn_rules: "REGLAS",
      btn_config: "CONFIG",
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
      btn_records: "RECORDS",
      btn_rules: "RULES",
      btn_config: "SETTINGS",
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

    storage.set("trucolite_lang", lang);
    if (langSel) langSel.value = lang;
  }

  if (langSel) {
    langSel.addEventListener("change", (e) => setLanguage(e.target.value));
    const savedLang = storage.get("trucolite_lang", "es");
    setLanguage(savedLang);
  }

  if (openSettingsBtn && settingsDialog) {
    openSettingsBtn.addEventListener("click", () => settingsDialog.showModal());
  }
  if (closeSettingsBtn && settingsDialog) {
    closeSettingsBtn.addEventListener("click", () => settingsDialog.close());
  }

  // ========================================================
  // CRÉDITOS DIALOG
  // ========================================================
  const creditsDialog = document.querySelector("#creditsDialog");
  const introCreditsBtn = document.querySelector("#introCreditsBtn");
  const openCreditsBtn = document.querySelector("#openCreditsButton");
  const closeCreditsBtn = document.querySelector("#closeCreditsButton");

  function openCreditsModal(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (creditsDialog) {
      creditsDialog.showModal();
      SFX.playButton();
    }
  }

  if (introCreditsBtn) introCreditsBtn.addEventListener("click", openCreditsModal);
  if (openCreditsBtn) openCreditsBtn.addEventListener("click", openCreditsModal);
  if (closeCreditsBtn && creditsDialog) {
    closeCreditsBtn.addEventListener("click", () => {
      creditsDialog.close();
      SFX.playButton();
    });
  }

  // ========================================================
  // PANEL DEBUG (Ctrl + Shift + D o botón 🔧 DEBUG)
  // ========================================================
  const JOKER_CATALOG = FULL_CATALOG.filter((item) => item.kind === "joker");
  let debugOpen = false;

  function injectDebugPanel() {
    if (document.getElementById("trucolite-debug-panel")) return;
    const style = document.createElement("style");
    style.textContent = `
      #trucolite-debug-panel {
        position: fixed; top: 6vh; left: 5vw; width: 90vw; max-width: 580px; max-height: 88vh;
        z-index: 10000; background: #0f151f; border: 2px solid #ff9f43;
        border-radius: 12px; color: #fff; font-family: var(--font-small, system-ui, sans-serif);
        padding: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.85), 0 0 20px rgba(255, 159, 67, 0.25);
        overflow-y: auto;
      }
      #trucolite-debug-panel.hidden { display: none !important; }
      #trucolite-debug-panel h2 { margin: 0 0 4px 0; font-size: 18px; color: #ff9f43; display: flex; justify-content: space-between; align-items: center; }
      #trucolite-debug-panel h3 { margin: 12px 0 6px 0; font-size: 12px; color: #feca57; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 3px; }
      #trucolite-debug-panel .debug-section { background: rgba(0, 0, 0, 0.35); border: 1px solid #233142; border-radius: 6px; padding: 10px; margin-bottom: 10px; }
      #trucolite-debug-panel .joker-list { display: flex; flex-direction: column; gap: 4px; max-height: 180px; overflow-y: auto; border: 1px solid #233142; border-radius: 6px; padding: 6px; background: #090e14; }
      #trucolite-debug-panel .joker-row { display: flex; align-items: center; gap: 6px; padding: 4px; border-bottom: 1px solid #1a2330; font-size: 11px; }
      #trucolite-debug-panel .joker-row:last-child { border-bottom: none; }
      #trucolite-debug-panel .joker-name { flex: 1; font-weight: 700; color: #fff; }
      #trucolite-debug-panel .joker-rarity { font-size: 9px; padding: 1px 5px; border-radius: 3px; background: #233142; white-space: nowrap; color: #a5b4fc; text-transform: uppercase; }
      #trucolite-debug-panel .joker-desc { font-size: 10px; color: #94a3b8; margin-left: 4px; flex: 2; }
      #trucolite-debug-panel .joker-add { background: #ff9f43; color: #000; border: none; border-radius: 4px; padding: 3px 8px; font-weight: 700; cursor: pointer; font-size: 11px; white-space: nowrap; }
      #trucolite-debug-panel .joker-add:hover { background: #fff; }
      #trucolite-debug-panel .debug-grid-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      #trucolite-debug-panel .debug-field { margin: 4px 0; display: flex; flex-direction: column; gap: 3px; }
      #trucolite-debug-panel .debug-field label { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
      #trucolite-debug-panel select, #trucolite-debug-panel input { background: #090e14; border: 1px solid #334454; color: #fff; padding: 5px 8px; border-radius: 4px; font-size: 11px; }
      #trucolite-debug-panel .debug-btn { background: #ff9f43; color: #000; border: none; border-radius: 4px; padding: 6px 12px; font-weight: 700; cursor: pointer; font-size: 11px; }
      #trucolite-debug-panel .debug-btn:hover { background: #fff; }
      #trucolite-debug-panel .debug-btn-secondary { background: #233142; color: #cbd5e1; border: 1px solid #334454; border-radius: 4px; padding: 5px 10px; font-weight: 700; cursor: pointer; font-size: 10px; }
      #trucolite-debug-panel .debug-btn-secondary:hover { background: #334454; color: #fff; }
      #trucolite-debug-panel .debug-btn-danger { background: #e84118; color: #fff; border: none; border-radius: 4px; padding: 5px 10px; font-weight: 700; cursor: pointer; font-size: 10px; }
      #trucolite-debug-panel .debug-btn-danger:hover { background: #c23616; }
      #trucolite-debug-panel .preset-btn-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
      #trucolite-debug-panel .debug-close-btn { background: transparent; border: 1px solid #ff9f43; color: #ff9f43; border-radius: 4px; padding: 2px 8px; font-size: 12px; cursor: pointer; }
      #trucolite-debug-panel .debug-close-btn:hover { background: #ff9f43; color: #000; }
    `;
    document.head.appendChild(style);

    const panel = document.createElement("div");
    panel.id = "trucolite-debug-panel";
    panel.className = "hidden";
    panel.innerHTML = `
      <h2>
        <span>🔧 PANEL DEBUG (TESTING DE COMODINES)</span>
        <button id="debug-close-top" class="debug-close-btn">✕</button>
      </h2>
      <div style="font-size: 10px; color: #94a3b8; margin-bottom: 10px;">Atajo: Ctrl + Shift + D · Útil para probar cada joker sin esperar suerte</div>

      <!-- 1. CAMBIAR MANO DEL JUGADOR -->
      <div class="debug-section">
        <h3>🃏 FORZAR CARTAS EN MANO (JUGADOR)</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
          <div class="debug-field">
            <label>Carta 1:</label>
            <select id="debug-card-1"></select>
          </div>
          <div class="debug-field">
            <label>Carta 2:</label>
            <select id="debug-card-2"></select>
          </div>
          <div class="debug-field">
            <label>Carta 3:</label>
            <select id="debug-card-3"></select>
          </div>
        </div>
        <button id="debug-apply-hand" class="debug-btn" style="margin-top: 8px; width: 100%;">APLICAR MANO SELECCIONADA ➔</button>
        <div class="preset-btn-row">
          <button class="debug-btn-secondary" data-preset="machos">1♠ 1♣ 7♠ (Machos)</button>
          <button class="debug-btn-secondary" data-preset="bastos">1♣ 7♣ 3♣ (Bastos)</button>
          <button class="debug-btn-secondary" data-preset="sietes">7♠ 7♦ 7♥ (Sietes)</button>
          <button class="debug-btn-secondary" data-preset="copas">1♥ 7♥ 12♥ (Copas)</button>
          <button class="debug-btn-secondary" data-preset="envido33">7♠ 6♠ 1♠ (Envido 33)</button>
          <button class="debug-btn-secondary" data-preset="reyes">12♠ 12♦ 12♣ (Pecador)</button>
        </div>
      </div>

      <!-- 2. GESTIÓN DE COMODINES -->
      <div class="debug-section">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="border: none; margin: 0; padding: 0;">🃏 EQUIPAR JOKERS (${JOKER_CATALOG.length} DISPONIBLES)</h3>
          <button id="debug-clear-jokers" class="debug-btn-danger">VACIAR JOKERS</button>
        </div>
        <div style="margin: 6px 0;">
          <input type="text" id="debug-joker-search" placeholder="🔍 Buscar comodín por nombre o efecto..." style="width: 100%;" />
        </div>
        <div class="joker-list" id="debug-joker-list"></div>
      </div>

      <!-- 3. ECONOMÍA Y VARIABLES DE PARTIDA -->
      <div class="debug-section">
        <h3>💰 ECONOMÍA Y ESTADO DE RONDA</h3>
        <div class="debug-grid-fields">
          <div class="debug-field">
            <label>Dinero ($<span id="debug-money-display">0</span>):</label>
            <div style="display: flex; gap: 4px;">
              <input type="number" id="debug-money-input" placeholder="Monto" style="flex: 1;" />
              <button id="debug-set-money" class="debug-btn">SET</button>
            </div>
          </div>
          <div class="debug-field">
            <label>Score (<span id="debug-score-display">0</span>):</label>
            <div style="display: flex; gap: 4px;">
              <input type="number" id="debug-score-input" placeholder="Nuevo score" style="flex: 1;" />
              <button id="debug-set-score" class="debug-btn">SET</button>
            </div>
          </div>
          <div class="debug-field">
            <label>Descartes restantes:</label>
            <div style="display: flex; gap: 4px;">
              <input type="number" id="debug-discards-input" placeholder="0 - 10" style="flex: 1;" />
              <button id="debug-set-discards" class="debug-btn">SET</button>
            </div>
          </div>
          <div class="debug-field">
            <label>Quién es Mano:</label>
            <div style="display: flex; gap: 4px;">
              <button id="debug-mano-player" class="debug-btn-secondary" style="flex: 1;">Jugador</button>
              <button id="debug-mano-rival" class="debug-btn-secondary" style="flex: 1;">Rival</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. ACCIONES RÁPIDAS -->
      <div class="debug-section" style="margin-bottom: 0;">
        <h3>⚡ ACCIONES RÁPIDAS</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <button id="debug-force-shop" class="debug-btn" style="background: #10ac84; color: #fff;">ABRIR TIENDA (NUEVA)</button>
          <button id="debug-rival-truco" class="debug-btn-secondary">RIVAL CANTA TRUCO</button>
        </div>
      </div>
      <button id="debug-close-bottom" class="debug-btn-secondary" style="margin-top: 10px; width: 100%;">CERRAR PANEL DEBUG</button>
    `;
    document.body.appendChild(panel);

    // Poblar selects de cartas
    const allCards = createDeck();
    const suitsAbbr = { espadas: "Esp", bastos: "Bas", oros: "Oro", copas: "Cop" };
    ["debug-card-1", "debug-card-2", "debug-card-3"].forEach((id, index) => {
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.replaceChildren();
      allCards.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.rank} de ${suitsAbbr[c.suit] || c.suit}`;
        sel.appendChild(opt);
      });
      if (sel.options[index]) sel.selectedIndex = index;
    });

    // Listeners cerrar
    const closeFn = () => { debugOpen = false; panel.classList.add("hidden"); };
    document.getElementById("debug-close-top")?.addEventListener("click", closeFn);
    document.getElementById("debug-close-bottom")?.addEventListener("click", closeFn);

    // Botón aplicar mano personalizada
    document.getElementById("debug-apply-hand")?.addEventListener("click", () => {
      if (!state) return;
      const c1 = document.getElementById("debug-card-1")?.value;
      const c2 = document.getElementById("debug-card-2")?.value;
      const c3 = document.getElementById("debug-card-3")?.value;
      const deck = createDeck();
      const newHand = [c1, c2, c3].map((id) => deck.find((c) => c.id === id)).filter(Boolean);
      if (newHand.length > 0) {
        state.playerHand = newHand;
        ui.selectedIds.clear();
        ui.message = `Mano forzada: ${newHand.map(cardName).join(", ")}`;
        ui.tone = "win";
        renderGame(elements, state, { ...ui, cantoAvailable });
        triggerToast("¡Mano actualizada con éxito!", "win");
      }
    });

    // Presets rápidos de mano
    panel.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!state) return;
        const preset = btn.dataset.preset;
        let cardIds = ["1-espadas", "1-bastos", "7-espadas"];
        if (preset === "bastos") cardIds = ["1-bastos", "7-bastos", "3-bastos"];
        else if (preset === "sietes") cardIds = ["7-espadas", "7-oros", "7-copas"];
        else if (preset === "copas") cardIds = ["1-copas", "7-copas", "12-copas"];
        else if (preset === "envido33") cardIds = ["7-espadas", "6-espadas", "1-espadas"];
        else if (preset === "reyes") cardIds = ["12-espadas", "12-oros", "12-bastos"];

        const sel1 = document.getElementById("debug-card-1");
        const sel2 = document.getElementById("debug-card-2");
        const sel3 = document.getElementById("debug-card-3");
        if (sel1) sel1.value = cardIds[0];
        if (sel2) sel2.value = cardIds[1];
        if (sel3) sel3.value = cardIds[2];

        const deck = createDeck();
        state.playerHand = cardIds.map((id) => deck.find((c) => c.id === id)).filter(Boolean);
        ui.selectedIds.clear();
        ui.message = `Preset ${btn.textContent.trim()} aplicado.`;
        ui.tone = "win";
        renderGame(elements, state, { ...ui, cantoAvailable });
        triggerToast(`Preset aplicado: ${cardIds.join(", ")}`, "win");
      });
    });

    // Vaciar jokers
    document.getElementById("debug-clear-jokers")?.addEventListener("click", () => {
      if (!state) return;
      state.jokers = [];
      ui.message = "Inventario de jokers vaciado para pruebas.";
      renderGame(elements, state, { ...ui, cantoAvailable });
      renderJokerCollection();
      triggerToast("Jokers vaciados", "info");
    });

    // Filtro buscador de jokers
    document.getElementById("debug-joker-search")?.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      panel.querySelectorAll(".joker-row").forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? "flex" : "none";
      });
    });

    // Modificar Dinero
    document.getElementById("debug-set-money")?.addEventListener("click", () => {
      const input = document.getElementById("debug-money-input");
      const value = Number(input.value);
      if (!Number.isFinite(value) || value < 0) return;
      if (state) {
        state.money = value;
        document.getElementById("debug-money-display").textContent = formatMoney(state.money);
        renderGame(elements, state, { ...ui, cantoAvailable });
        input.value = "";
        triggerToast(`Dinero seteado a $${value}`, "gold");
      }
    });

    // Modificar Score
    document.getElementById("debug-set-score")?.addEventListener("click", () => {
      const input = document.getElementById("debug-score-input");
      const value = Number(input.value);
      if (!Number.isFinite(value) || value < 0) return;
      if (state) {
        state.score = value;
        document.getElementById("debug-score-display").textContent = String(state.score);
        renderGame(elements, state, { ...ui, cantoAvailable });
        input.value = "";
        triggerToast(`Score seteado a ${value}`, "win");
      }
    });

    // Modificar Descartes
    document.getElementById("debug-set-discards")?.addEventListener("click", () => {
      const input = document.getElementById("debug-discards-input");
      const value = Number(input.value);
      if (!Number.isFinite(value) || value < 0) return;
      if (state) {
        state.discardsRemaining = value;
        renderGame(elements, state, { ...ui, cantoAvailable });
        input.value = "";
        triggerToast(`Descartes restantes: ${value}`, "info");
      }
    });

    // Forzar mano Jugador / Rival
    document.getElementById("debug-mano-player")?.addEventListener("click", () => {
      if (!state) return;
      state.mano = "player";
      state.round.leader = "player";
      renderGame(elements, state, { ...ui, cantoAvailable });
      triggerToast("Sos Mano (jugador)", "win");
    });
    document.getElementById("debug-mano-rival")?.addEventListener("click", () => {
      if (!state) return;
      state.mano = "rival";
      renderGame(elements, state, { ...ui, cantoAvailable });
      triggerToast("El Rival es Mano", "info");
    });

    // Forzar Tienda
    document.getElementById("debug-force-shop")?.addEventListener("click", () => {
      if (!state) return;
      state.phase = "shop";
      state.shopOffers = pickShopOffers(state);
      state.shopJokerOffers = state.shopOffers.slice();
      state.shopUpgradeOffers = pickShopOffersForKind(state, "cardUpgrade", 2);
      state.money = Math.max(state.money, 15);
      renderGame(elements, state, { ...ui, cantoAvailable });
      renderShop();
      closeFn();
      triggerToast("Tienda abierta con $15+ para testear", "gold");
    });

    // Rival canta truco
    document.getElementById("debug-rival-truco")?.addEventListener("click", () => {
      if (!state || state.phase !== "playing") return;
      state.phase = "respondCanto";
      state.round.pendingCanto = "truco";
      state.round.rivalCantos.push("truco");
      renderGame(elements, state, { ...ui, cantoAvailable });
      closeFn();
      triggerToast("¡El Rival cantó TRUCO! Respondé Quiero o No Quiero", "lose");
    });
  }

  function renderDebugPanel() {
    const list = document.getElementById("debug-joker-list");
    if (!list) return;
    list.replaceChildren();
    for (const joker of JOKER_CATALOG) {
      const row = document.createElement("div");
      row.className = "joker-row";
      const rarityBadge = document.createElement("span");
      rarityBadge.className = "joker-rarity";
      rarityBadge.textContent = joker.rarity;
      const name = document.createElement("span");
      name.className = "joker-name";
      name.textContent = (joker.emoji ? joker.emoji + " " : "") + joker.name;
      const desc = document.createElement("span");
      desc.className = "joker-desc";
      desc.textContent = joker.description;
      const btn = document.createElement("button");
      btn.className = "joker-add";
      btn.textContent = "+ Equipar";
      btn.addEventListener("click", () => {
        if (!state) return;
        const copy = JSON.parse(JSON.stringify(joker));
        state.jokers.push(copy);
        if (copy.id === "comodin-barajador") state.discardsRemaining += 2;
        if (copy.id === "comodin-por-una-cabeza") state.rules.rounds += 1;
        if (copy.id === "comodin-mazo-infinito") state.rules.cardsPerRound += 1;
        ui.message = `Debug: joker "${joker.name}" equipado.`;
        ui.tone = "win";
        renderGame(elements, state, { ...ui, cantoAvailable });
        renderJokerCollection();
        triggerToast(`Equipado: ${joker.name}`, "win");
      });
      row.append(rarityBadge, name, desc, btn);
      list.appendChild(row);
    }
    const moneyDisplay = document.getElementById("debug-money-display");
    if (moneyDisplay && state) moneyDisplay.textContent = formatMoney(state.money);
    const scoreDisplay = document.getElementById("debug-score-display");
    if (scoreDisplay && state) scoreDisplay.textContent = String(state.score);
    const discardsInput = document.getElementById("debug-discards-input");
    if (discardsInput && state) discardsInput.value = state.discardsRemaining;
  }

  function toggleDebugPanel() {
    const panel = document.getElementById("trucolite-debug-panel");
    if (!panel) {
      injectDebugPanel();
    }
    debugOpen = !debugOpen;
    const panelEl = document.getElementById("trucolite-debug-panel");
    if (debugOpen) {
      panelEl.classList.remove("hidden");
      renderDebugPanel();
    } else {
      panelEl.classList.add("hidden");
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === "D") {
      e.preventDefault();
      toggleDebugPanel();
    }
  });

  const openDebugBtn = document.querySelector("#openDebugButton");
  if (openDebugBtn) {
    openDebugBtn.addEventListener("click", () => {
      toggleDebugPanel();
    });
  }

  injectDebugPanel();
})();
