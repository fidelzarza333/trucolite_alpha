import { cardPower } from "../core/cards.js";
import { getRoundEffects } from "../core/game.js";

const SUIT_NAMES = {
  espadas: "Espadas",
  bastos: "Bastos",
  oros: "Oros",
  copas: "Copas"
};

export const POWER_TIER_NAMES = {
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

const SUIT_ICONS = {
  espadas: "⚔️",
  bastos: "🌿",
  oros: "🪙",
  copas: "🍷"
};

export const CANTO_NAMES = {
  envido: "Envido",
  flor: "Flor",
  truco: "Truco",
  retruco: "Retruco",
  valeCuatro: "Vale cuatro"
};

export function triggerToast(message, tone = "info") {
  const container = document.querySelector("#toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  const toneClass = tone === "win" ? "toast-win" : tone === "lose" ? "toast-lose" : tone === "gold" ? "toast-gold" : "toast-info";
  toast.className = `toast-banner ${toneClass}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2200);
}

export function cardName(card) {
  if (!card) return "";
  return `${card.rank} de ${SUIT_NAMES[card.suit] || card.suit}`;
}

export function formatMoney(value) {
  if (value < 0) {
    const abs = Math.abs(value);
    return "-" + (Number.isInteger(abs) ? String(abs) : abs.toFixed(2).replace(".", ","));
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(".", ",");
}

function cardFace(card) {
  if (!card) return null;
  const face = document.createElement("div");
  face.className = "playing-card";
  face.dataset.suit = card.suit;
  face.dataset.suitSymbol = SUIT_ICONS[card.suit] || "";
  face.setAttribute("role", "img");
  face.setAttribute("aria-label", cardName(card));
  const image = document.createElement("img");
  image.className = "card-scan";
  image.src = `assets/cards/${card.id}.png`;
  image.alt = "";
  image.draggable = false;
  const fallback = document.createElement("span");
  fallback.className = "card-fallback";
  fallback.innerHTML = `
    <div class="card-fallback-rank">${card.rank}</div>
    <div class="card-fallback-icon">${SUIT_ICONS[card.suit] || ""}</div>
    <div class="card-fallback-suit">${SUIT_NAMES[card.suit]}</div>
  `;
  fallback.hidden = true;
  image.addEventListener("error", () => {
    image.hidden = true;
    fallback.hidden = false;
  }, { once: true });
  face.append(image, fallback);
  return face;
}

function addUpgradeSeals(cardElement, card, state) {
  const upgrades = state.cardUpgrades
    .filter((entry) => entry.cardId === card.id)
    .map((entry) => state.officialItems.find((item) => item.id === entry.itemId))
    .filter(Boolean);
  if (upgrades.length === 0) return;
  const seals = document.createElement("span");
  seals.className = "card-upgrade-seals";
  seals.setAttribute("aria-label", `Mejoras: ${upgrades.map((item) => `${item.name}, ${item.rarity}`).join("; ")}`);
  for (const item of upgrades) {
    const seal = document.createElement("span");
    seal.className = "card-upgrade-seal";
    seal.dataset.rarity = item.rarity;
    seal.title = `${item.name} · ${item.rarity}`;
    seal.setAttribute("aria-hidden", "true");
    seals.append(seal);
  }
  cardElement.append(seals);
}

export function cardModifierSummary(card, state) {
  const chips = [];
  const mults = [];
  const money = [];
  const modifierDetails = [];
  const addEffect = (effect) => {
    if (effect.stage === "chips") chips.push(effect.value);
    if (effect.stage === "mult") mults.push(effect.value);
    if (effect.stage === "money") money.push(effect.value);
  };
  for (const upgrade of state.cardUpgrades) {
    if (upgrade.cardId !== card.id) continue;
    const item = state.officialItems.find((entry) => entry.id === upgrade.itemId);
    if (item) {
      addEffect(item.effect);
      modifierDetails.push(`Mejora ${item.name}: ${item.description}`);
    }
  }
  for (const joker of state.jokers) {
    const matchesSuit = joker.trigger.type === "CARD_SUIT_PLAYED" && joker.trigger.suit === card.suit;
    const matchesRank = joker.trigger.type === "CARD_RANK_PLAYED" && joker.trigger.rank === card.rank;
    if (matchesSuit || matchesRank) {
      addEffect(joker.effect);
      modifierDetails.push(`Comodín ${joker.name}: ${joker.description}`);
    }
  }
  const sum = (values) => values.reduce((total, value) => total + value, 0);
  const fmt = (value) => Number(value.toFixed(2)).toString();
  const power = cardPower(card);
  const totalChips = sum(chips);
  const totalMult = sum(mults);

  let realScoreText = `Puntaje real = ${power}`;
  if (totalChips > 0 && totalMult > 0) {
    realScoreText = `Puntaje real = ${power} + ${fmt(totalChips)} chips + ${fmt(totalMult)} mult`;
  } else if (totalChips > 0) {
    realScoreText = `Puntaje real = ${power} + ${fmt(totalChips)} chips`;
  } else if (totalMult > 0) {
    realScoreText = `Puntaje real = ${power} + ${fmt(totalMult)} mult`;
  }

  const lines = [
    `Fuerza de baza: ${power}`,
    realScoreText,
    `Puntaje base: +${state.rules.chipsPerTrick} fichas por baza ganada`
  ];
  if (chips.length) lines.push(`Modificador: +${fmt(totalChips)} fichas`);
  if (mults.length) lines.push(`Modificador: +${fmt(totalMult)} al multiplicador`);
  if (money.length) lines.push(`Dinero: +$${fmt(sum(money))}`);
  lines.push(...modifierDetails);
  return lines;
}

function playerCardButton(card, selected, state) {
  const button = document.createElement("button");
  button.className = "playing-card";
  button.type = "button";
  button.dataset.cardId = card.id;
  button.dataset.suit = card.suit;
  button.dataset.suitSymbol = SUIT_ICONS[card.suit] || "";
  const summary = cardModifierSummary(card, state);
  button.dataset.cardTooltip = summary.join("\n");
  button.setAttribute("aria-label", `${cardName(card)}. ${summary.join(". ")}`);
  const upgrades = state.cardUpgrades
    .filter((entry) => entry.cardId === card.id)
    .map((entry) => state.officialItems.find((item) => item.id === entry.itemId))
    .filter(Boolean);
  if (upgrades.length) {
    button.dataset.upgradeRarities = upgrades.map((item) => item.rarity).join(",");
    button.dataset.upgradeSignature = upgrades.map((item) => item.id).join("|");
    button.setAttribute("aria-description", `Mejoras: ${upgrades.map((item) => `${item.name}, ${item.rarity}`).join("; ")}`);
  } else {
    button.dataset.upgradeSignature = "";
  }
  button.setAttribute("aria-pressed", String(selected));
  button.classList.toggle("is-selected", selected);
  const image = document.createElement("img");
  image.className = "card-scan";
  image.src = `assets/cards/${card.id}.png`;
  image.alt = "";
  image.draggable = false;
  const fallback = document.createElement("span");
  fallback.className = "card-fallback";
  fallback.innerHTML = `
    <div class="card-fallback-rank">${card.rank}</div>
    <div class="card-fallback-icon">${SUIT_ICONS[card.suit] || ""}</div>
    <div class="card-fallback-suit">${SUIT_NAMES[card.suit]}</div>
  `;
  fallback.hidden = true;
  image.addEventListener("error", () => {
    image.hidden = true;
    fallback.hidden = false;
  }, { once: true });
  button.append(image, fallback);
  addUpgradeSeals(button, card, state);

  return button;
}

function renderPlayerCards(element, state, selectedIds) {
  const currentIds = Array.from(element.querySelectorAll("[data-card-id]"), (button) => button.dataset.cardId);
  const nextIds = state.playerHand.map((card) => card.id);
  const upgradesChanged = state.playerHand.some((card, index) => {
    const button = element.querySelectorAll("[data-card-id]")[index];
    if (!button) return true;
    const signature = state.cardUpgrades
      .filter((entry) => entry.cardId === card.id)
      .map((entry) => entry.itemId)
      .join("|");
    return button.dataset.upgradeSignature !== signature;
  });
  if (upgradesChanged || currentIds.length !== nextIds.length || currentIds.some((id, index) => id !== nextIds[index])) {
    element.replaceChildren(...state.playerHand.map((card) => playerCardButton(card, selectedIds.has(card.id), state)));
  } else {
    for (const button of element.querySelectorAll("[data-card-id]")) {
      const selected = selectedIds.has(button.dataset.cardId);
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    }
  }
  if (state.playerHand.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-card";
    empty.textContent = "Sin cartas";
    element.replaceChildren(empty);
  }
}

function renderOpponentCards(element, state) {
  element.replaceChildren();
  for (let index = 0; index < state.rivalHand.length; index += 1) {
    const back = document.createElement("div");
    back.className = "card-back";
    back.setAttribute("aria-label", "Carta oculta del Rival");
    const img = document.createElement("img");
    img.className = "card-scan";
    img.src = "assets/cards/reverso.png";
    img.alt = "";
    img.draggable = false;
    back.append(img);
    element.append(back);
  }
  if (state.rivalHand.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-card";
    empty.textContent = "Sin cartas";
    element.append(empty);
  }
}

function renderTricks(element, state) {
  const slots = [];
  for (let index = 0; index < state.rules.cardsPerRound; index += 1) {
    const slot = document.createElement("div");
    slot.className = "trick-slot";
    slot.id = `bazaSlot-${index + 1}`;
    const trick = state.round.tricks[index];
    let playerCard = trick ? trick.playerCard : null;
    let rivalCard = trick ? trick.rivalCard : null;
    if (!trick && index === state.round.tricks.length) {
      playerCard = state.round.table.playerCard;
      rivalCard = state.round.table.rivalCard;
    }
    if (playerCard || rivalCard) {
      const pair = document.createElement("div");
      pair.className = "trick-pair";
      if (playerCard) {
        const face = cardFace(playerCard);
        addUpgradeSeals(face, playerCard, state);
        const summary = cardModifierSummary(playerCard, state);
        face.dataset.cardTooltip = summary.join("\n");
        face.setAttribute("aria-label", `${cardName(playerCard)}. ${summary.join(". ")}`);
        pair.append(face);
      }
      if (rivalCard) {
        const face = cardFace(rivalCard);
        const power = cardPower(rivalCard);
        const hierName = POWER_TIER_NAMES[power] || `${power}/14`;
        const rivalSummary = [
          `Carta de El Rival: ${cardName(rivalCard)}`,
          `Fuerza de baza: ${power} / 14 (${hierName})`,
          `Puntaje real = ${power}`
        ];
        face.dataset.cardTooltip = rivalSummary.join("\n");
        face.setAttribute("aria-label", `Carta de El Rival: ${cardName(rivalCard)}. Fuerza de baza: ${power}. Puntaje real = ${power}.`);
        pair.append(face);
      }
      slot.append(pair);
      const label = document.createElement("span");
      label.className = "trick-slot-badge";
      label.textContent = trick
        ? trick.winner === "tie" ? "Parda" : trick.winner === "player" ? "Tu baza" : "Rival"
        : "En juego";
      slot.append(label);
      slot.classList.add("has-cards");
    } else {
      const numberSpan = document.createElement("span");
      numberSpan.className = "trick-slot-title";
      numberSpan.textContent = `${index + 1}`;
      const placeholder = document.createElement("span");
      placeholder.className = "trick-slot-placeholder";
      placeholder.textContent = `${index + 1}ª`;
      slot.append(numberSpan, placeholder);
    }
    slots.push(slot);
  }
  element.replaceChildren(...slots);
}

export function formatEvent(item) {
  if (item.type === "ROUND_DEALT") {
    return `Ronda ${item.roundNumber} · mano: ${item.mano === "player" ? "vos" : "El Rival"}.`;
  }
  if (item.type === "RIVAL_PLAYED") {
    return item.leader ? `El Rival abre con ${cardName(item.card)}.` : `El Rival responde con ${cardName(item.card)}.`;
  }
  if (item.type === "CARDS_DISCARDED") {
    return `Cambiaste ${item.discarded.length} carta${item.discarded.length === 1 ? "" : "s"}.`;
  }
  if (item.type === "ENVIDO_RESOLVED") {
    const moneyStr = item.moneyDelta > 0 ? " (+$" + item.moneyDelta + ")" : (item.moneyDelta < 0 ? " (-$" + Math.abs(item.moneyDelta) + ")" : "");
    return `Envido: vos ${item.playerTanto}, Rival ${item.rivalTanto}. ${item.winner === "player" ? "Ganaste" : "Ganó el Rival"}${moneyStr}.`;
  }
  if (item.type === "FLOR_RESOLVED") {
    return `Flor: vos ${item.playerTanto}, Rival ${item.rivalHasFlor ? item.rivalTanto : "sin flor"}. ${item.winner === "player" ? "Ganaste." : "Ganó el Rival."}`;
  }
  if (item.type === "CANTO_ANSWERED") {
    const speaker = item.caller === "rival" ? "Vos" : "El Rival";
    return `${CANTO_NAMES[item.canto]}: ${speaker} dice ${item.wants ? "quiero" : "no quiero"}.`;
  }
  if (item.type === "CANTO_REQUESTED") {
    return `El Rival canta ${CANTO_NAMES[item.canto]}. Respondé quiero o no quiero.`;
  }
  if (item.type === "RIVAL_CANTO_LOST") {
    return `El Rival pierde el canto ${CANTO_NAMES[item.canto]}.`;
  }
  if (item.type === "TRICK_RESOLVED") {
    const winner = item.winner === "tie" ? "parda" : item.winner === "player" ? "baza para vos" : "baza para El Rival";
    return `Tu ${cardName(item.playerCard)} contra ${cardName(item.rivalCard)}: ${winner}.`;
  }
  if (item.type === "ROUND_RESOLVED") {
    const reward = item.rejectReward === undefined ? "" : ` Recompensa no quiero: +${item.rejectReward}.`;
    const rivalReward = item.rivalRejectReward === undefined ? "" : ` Recompensa del Rival: ${item.rivalRejectReward}.`;
    const money = item.moneyEarned ? ` Dinero por efectos: +$${item.moneyEarned}.` : "";
    return `Ronda: ${item.chips} × ${item.mult} × ${item.xmult} = ${item.earned}.${reward}${rivalReward} Penalidades: Truco ${item.lossTruco}, Envido ${item.lossEnvido}, Flor ${item.lossFlor}.${money} Puntaje ${item.score}.`;
  }
  if (item.type === "LEVEL_WON") return `¡Nivel ${item.level} superado! Premio: +$${item.reward}. Meta del próximo nivel ×1,5.`;
  if (item.type === "SHOP_OPENED") return `Tienda abierta · dinero disponible: $${item.money}.`;
  if (item.type === "SHOP_REROLLED") return `Renovaste la tienda por $${item.cost}.`;
  if (item.type === "ITEM_PURCHASED") return `Compraste ${item.name} por $${item.price}.`;
  if (item.type === "JOKER_SOLD") return `Vendiste ${item.name} por $${formatMoney(item.refund)}.`;
  if (item.type === "GAME_LOST") return `Run terminada en el nivel ${item.level}. Puntaje final: ${item.score}.`;
  if (item.type === "GAME_WON") return `¡Run completada! Puntaje: ${item.score}.`;
  if (item.type === "ERROR") return `Acción inválida: ${item.code}.`;
  return item.type;
}

export function getRoundOutcome(events, state) {
  if (!["roundEnded", "shop", "lost"].includes(state.phase)) return null;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const item = events[index];
    if (item.type === "ROUND_RESOLVED" && item.roundNumber === state.roundNumber) return item;
  }
  return null;
}

export function renderGame(elements, state, ui) {
  elements.score.textContent = String(state.score);
  elements.goal.textContent = String(state.levelTarget);
  if (elements.chipsPerTrickValue) {
    elements.chipsPerTrickValue.textContent = String(state.rules.chipsPerTrick);
  }
  elements.progress.style.width = `${Math.min(100, (state.score / state.levelTarget) * 100)}%`;

  // === NEW: Big round counter in sidebar ===
  const roundCurrent = document.querySelector("#roundDisplayCurrent");
  const roundTotal = document.querySelector("#roundDisplayTotal");
  const roundPipsEl = document.querySelector("#roundPips");
  if (roundCurrent) roundCurrent.textContent = String(state.roundNumber);
  if (roundTotal) roundTotal.textContent = String(state.rules.rounds);
  if (roundPipsEl) {
    roundPipsEl.replaceChildren();
    for (let i = 1; i <= state.rules.rounds; i += 1) {
      const pip = document.createElement("span");
      pip.className = "round-pip";
      if (i < state.roundNumber) pip.classList.add("done");
      else if (i === state.roundNumber) pip.classList.add("current");
      roundPipsEl.append(pip);
    }
  }

  // Balatro Chips & Mult HUD calculation
  const inShop = state.phase === "shop";
  const playerTricks = inShop ? 0 : state.round.tricks.filter((t) => t.winner === "player").length;
  let activeChips = inShop ? 0 : playerTricks * state.rules.chipsPerTrick;
  let activeMult = 1
    + (!inShop && state.round.envido === "won" ? state.rules.cantos.envido.addMult : 0)
    + (!inShop && state.round.flor === "won" ? state.rules.cantos.flor.addMult : 0);

  // Truco level mult
  const trucoLvl = inShop ? 0 : state.round.trucoLevel;
  const trucoMultiplier = trucoLvl === 1 ? 2 : trucoLvl === 2 ? 3 : trucoLvl === 3 ? 4 : 1;

  // Calculamos los efectos activos en tiempo real (jokers, mejoras, descartes) solo si estamos en ronda activa
  if (!inShop) {
    const roundEffects = getRoundEffects(state);
    for (let eIdx = 0; eIdx < roundEffects.effects.length; eIdx += 1) {
      const eff = roundEffects.effects[eIdx];
      if (eff.stage === "chips") {
        if (eff.op === "add" || !eff.op) activeChips += eff.value;
        if (eff.op === "mul") activeChips *= eff.value;
      } else if (eff.stage === "mult") {
        if (eff.op === "add" || !eff.op) activeMult += eff.value;
        if (eff.op === "mul") activeMult *= eff.value;
      }
    }
  } else {
    if (state.tangoMult && state.tangoMult > 0) {
      activeMult += state.tangoMult;
    }
  }

  if (elements.chipsDisplay) {
    elements.chipsDisplay.textContent = String(activeChips);
  }
  if (elements.multDisplay) {
    elements.multDisplay.textContent = `X${activeMult.toFixed(1)}`;
  }
  if (elements.trucoStatus) {
    const label = trucoLvl === 0 ? "NORMAL (x1)" : trucoLvl === 1 ? "TRUCO (x2)" : trucoLvl === 2 ? "RETRUCO (x3)" : "VALE 4 (x4)";
    elements.trucoStatus.textContent = label;
  }
  if (elements.discardsDisplay) {
    elements.discardsDisplay.textContent = String(state.discardsRemaining);
  }
  if (elements.tricksDisplay) {
    elements.tricksDisplay.textContent = `${playerTricks} / 3`;
  }
  if (elements.playerMoney) {
    if (state.money < 0) {
      elements.playerMoney.textContent = `-$${formatMoney(Math.abs(state.money))}`;
      elements.playerMoney.style.color = "#ff7675";
      elements.playerMoney.title = "En deuda. Si llegás a -$50 perdés la partida.";
    } else {
      elements.playerMoney.textContent = `$${formatMoney(state.money)}`;
      elements.playerMoney.style.color = "#feca57";
      elements.playerMoney.title = "";
    }
  }
  if (elements.levelValue) {
    elements.levelValue.textContent = String(state.level);
  }
  if (elements.anteValue) {
    elements.anteValue.textContent = `${Math.min(8, Math.ceil(state.level / 3))} / 8`;
  }
  if (elements.deckCounter) {
    const totalDeck = 40;
    const inPlayCount = state.playerHand.length + state.rivalHand.length
      + (state.round.tricks.length * 2)
      + (state.round.table.playerCard ? 1 : 0)
      + (state.round.table.rivalCard ? 1 : 0);
    const inDeckCount = Math.max(0, totalDeck - inPlayCount);
    elements.deckCounter.textContent = `${inDeckCount} / ${totalDeck}`;
  }

  renderOpponentCards(elements.opponentCards, state);
  renderPlayerCards(elements.playerCards, state, ui.selectedIds);
  renderTricks(elements.trickRow, state);
  elements.message.textContent = ui.message;
  elements.message.dataset.tone = ui.tone;
  const outcome = getRoundOutcome(ui.events, state);
  elements.roundOutcome.hidden = outcome === null;
  if (outcome) {
    const won = outcome.winner === "player";
    elements.roundOutcome.dataset.result = won ? "win" : "lose";
    elements.roundOutcomeTitle.textContent = won ? "¡GANASTE LA RONDA!" : "PERDISTE LA RONDA";
    elements.roundOutcomeDetails.textContent = won
      ? `Le ganaste a El Rival. Puntaje del nivel: ${outcome.score}.`
      : `El Rival ganó esta ronda. Puntaje del nivel: ${outcome.score}.`;
  }
  if (state.phase === "playing") {
    elements.opponentState.textContent = state.round.table.rivalCard ? "Jugó · tu turno" : "Esperando tu jugada";
    elements.playerState.textContent = `Tu turno · descartes: ${state.discardsRemaining}`;
  } else if (state.phase === "respondCanto") {
    elements.opponentState.textContent = "Cantó · espera tu respuesta";
    elements.playerState.textContent = "Respondé al canto";
  } else if (state.phase === "roundEnded") {
    elements.opponentState.textContent = "Ronda terminada";
    elements.playerState.textContent = "Ronda resuelta";
  } else if (state.phase === "shop") {
    elements.opponentState.textContent = "Nivel superado";
    elements.playerState.textContent = `Dinero: $${formatMoney(state.money)}`;
  } else {
    elements.opponentState.textContent = "Run terminada";
    elements.playerState.textContent = "Derrota";
  }
  if (elements.playMode) elements.playMode.setAttribute("aria-pressed", String(ui.mode === "play"));
  if (elements.discardMode) elements.discardMode.setAttribute("aria-pressed", String(ui.mode === "discard"));
  if (elements.action) elements.action.textContent = "JUGAR CARTA ➔";
  if (elements.discardButton) elements.discardButton.textContent = `DESCARTAR (${state.discardsRemaining}) ➔`;

  const hasSelection = ui.selectedIds.size > 0;
  const discardOpen = state.phase === "playing" && state.round.playerPlayedCount === 0 && state.discardsRemaining > 0;
  
  if (elements.action) {
    elements.action.disabled = state.phase !== "playing" || ui.selectedIds.size !== 1;
  }
  if (elements.discardButton) {
    elements.discardButton.disabled = !discardOpen || !hasSelection;
  }
  if (elements.playMode) elements.playMode.disabled = state.phase !== "playing";
  if (elements.discardMode) elements.discardMode.disabled = !discardOpen;
  if (elements.next) {
    elements.next.classList.remove("is-visible");
    elements.next.disabled = true;
    elements.next.style.display = "none";
  }
  elements.cantoResponse.hidden = state.phase !== "respondCanto";
  elements.cantoQuestion.textContent = state.phase === "respondCanto"
    ? `El Rival cantó ${CANTO_NAMES[state.round.pendingCanto]}.` : "";
  elements.cantoWant.disabled = state.phase !== "respondCanto";
  elements.cantoReject.disabled = state.phase !== "respondCanto";
  for (const canto of Object.keys(CANTO_NAMES)) {
    elements.cantos[canto].disabled = !ui.cantoAvailable(state, canto);
    elements.cantos[canto].setAttribute("aria-pressed", String(
      canto === "envido" ? state.round.envido !== "none"
        : canto === "flor" ? state.round.flor !== "none"
          : state.round.trucoLevel >= (canto === "truco" ? 1 : canto === "retruco" ? 2 : 3)
    ));
  }
  elements.note.textContent = state.phase === "playing"
    ? "Seleccioná 1 carta para jugarla, o de 1 a 3 para descartar."
    : state.phase === "respondCanto" ? "El Rival espera tu respuesta."
      : state.phase === "roundEnded" ? "La ronda terminó. Avanzá para continuar el nivel."
        : state.phase === "shop" ? "Revisá la tienda; podés comprar las ofertas aprobadas."
          : "Run terminada. Iniciá un nuevo duelo para volver a jugar.";
  elements.history.replaceChildren(...ui.events.map((item) => {
    const entry = document.createElement("span");
    entry.className = "history-item";
    entry.textContent = formatEvent(item);
    return entry;
  }));
}
