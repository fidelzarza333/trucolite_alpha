export const ITEM_PRICES = {
  comun: 2,
  pocoComun: 4,
  raro: 7,
  legendario: 10
};

export const RARITY_WEIGHTS = [
  { rarity: "comun", weight: 70 },
  { rarity: "pocoComun", weight: 20 },
  { rarity: "raro", weight: 8 },
  { rarity: "legendario", weight: 2 }
];

export const OFFICIAL_ITEMS = [
  {
    id: "carta-brillo-cobre", name: "Brillo de cobre", kind: "cardUpgrade", rarity: "comun",
    description: "La carta marcada suma +2 fichas cuando la jugás.",
    effect: { stage: "chips", op: "add", value: 2 }
  },
  {
    id: "carta-filo-reforzado", name: "Filo reforzado", kind: "cardUpgrade", rarity: "raro",
    description: "La carta marcada suma +5 fichas cuando la jugás.",
    effect: { stage: "chips", op: "add", value: 5 }
  },
  {
    id: "carta-tinta-de-canto", name: "Tinta de canto", kind: "cardUpgrade", rarity: "pocoComun",
    description: "La carta marcada suma +0,25 al multiplicador cuando la jugás.",
    effect: { stage: "mult", op: "add", value: 0.25 }
  },
  {
    id: "carta-firma-de-as", name: "Firma de as", kind: "cardUpgrade", rarity: "raro",
    description: "La carta marcada suma +0,5 al multiplicador cuando la jugás.",
    effect: { stage: "mult", op: "add", value: 0.5 }
  },
  {
    id: "carta-cara-acunada", name: "Cara acuñada", kind: "cardUpgrade", rarity: "pocoComun",
    description: "Ganás +$1 cada vez que jugás la carta marcada.",
    effect: { stage: "money", op: "add", value: 1 }
  },
  {
    id: "carta-sello-de-oro", name: "Sello de oro", kind: "cardUpgrade", rarity: "raro",
    description: "Ganás +$2 cada vez que jugás la carta marcada.",
    effect: { stage: "money", op: "add", value: 2 }
  },
  {
    id: "comodin-bastos-fichas", name: "Bastonero", kind: "joker", rarity: "comun",
    trigger: { type: "CARD_SUIT_PLAYED", suit: "bastos" },
    description: "Si jugás una carta de bastos, suma +3 fichas a la ronda.",
    effect: { stage: "chips", op: "add", value: 3 }
  },
  {
    id: "comodin-bastos-mult", name: "Pintor verde", kind: "joker", rarity: "pocoComun",
    trigger: { type: "CARD_SUIT_PLAYED", suit: "bastos" },
    description: "Si jugás una carta de bastos, suma +0,5 al multiplicador.",
    effect: { stage: "mult", op: "add", value: 0.5 }
  },
  {
    id: "comodin-bastos-dinero", name: "Mercader de bastos", kind: "joker", rarity: "raro",
    trigger: { type: "CARD_SUIT_PLAYED", suit: "bastos" },
    description: "Si jugás una carta de bastos, ganás +$2.",
    effect: { stage: "money", op: "add", value: 2 }
  },
  {
    id: "comodin-siete-fichas", name: "Séptima", kind: "joker", rarity: "comun",
    trigger: { type: "CARD_RANK_PLAYED", rank: 7 },
    description: "Si jugás un 7, suma +3 fichas a la ronda.",
    effect: { stage: "chips", op: "add", value: 3 }
  },
  {
    id: "comodin-siete-mult", name: "Siete bravo", kind: "joker", rarity: "pocoComun",
    trigger: { type: "CARD_RANK_PLAYED", rank: 7 },
    description: "Si jugás un 7, suma +0,5 al multiplicador.",
    effect: { stage: "mult", op: "add", value: 0.5 }
  },
  {
    id: "comodin-siete-dinero", name: "Suerte del siete", kind: "joker", rarity: "raro",
    trigger: { type: "CARD_RANK_PLAYED", rank: 7 },
    description: "Si jugás un 7, ganás +$2.",
    effect: { stage: "money", op: "add", value: 2 }
  },
  {
    id: "comodin-truco-ganado-fichas", name: "Retruquero", kind: "joker", rarity: "comun",
    trigger: { type: "PLAYER_WINS_CANTO", canto: "truco" },
    description: "Si cantás Truco y ganás la ronda, suma +4 fichas.",
    effect: { stage: "chips", op: "add", value: 4 }
  },
  {
    id: "comodin-truco-ganado-mult", name: "Voz del cantor", kind: "joker", rarity: "pocoComun",
    trigger: { type: "PLAYER_WINS_CANTO", canto: "truco" },
    description: "Si cantás Truco y ganás la ronda, suma +0,5 al multiplicador.",
    effect: { stage: "mult", op: "add", value: 0.5 }
  },
  {
    id: "comodin-truco-ganado-dinero", name: "Pozo del truco", kind: "joker", rarity: "raro",
    trigger: { type: "PLAYER_WINS_CANTO", canto: "truco" },
    description: "Si cantás Truco y ganás la ronda, ganás +$2.",
    effect: { stage: "money", op: "add", value: 2 }
  },
  {
    id: "comodin-rival-pierde-fichas", name: "Contracanto", kind: "joker", rarity: "pocoComun",
    trigger: { type: "RIVAL_CANTO_LOST", canto: "truco" },
    description: "Si El Rival canta Truco y pierde la ronda, suma +5 fichas.",
    effect: { stage: "chips", op: "add", value: 5 }
  },
  {
    id: "comodin-rival-pierde-mult", name: "La última palabra", kind: "joker", rarity: "raro",
    trigger: { type: "RIVAL_CANTO_LOST", canto: "truco" },
    description: "Si El Rival canta Truco y pierde la ronda, suma +0,75 al multiplicador.",
    effect: { stage: "mult", op: "add", value: 0.75 }
  },
  {
    id: "comodin-rival-pierde-dinero", name: "La revancha", kind: "joker", rarity: "legendario",
    trigger: { type: "RIVAL_CANTO_LOST", canto: "truco" },
    description: "Si El Rival canta Truco y pierde la ronda, ganás +$3.",
    effect: { stage: "money", op: "add", value: 3 }
  },
  {
    id: "comodin-barajador", name: "Barajador", kind: "joker", rarity: "comun",
    trigger: { type: "PASSIVE_DISCARD_BONUS" },
    description: "Te otorga +1 descarte adicional por ronda.",
    effect: { stage: "passive", op: "add_discard", value: 1 }
  },
  {
    id: "comodin-granaderos", name: "Granaderos", kind: "joker", rarity: "pocoComun",
    trigger: { type: "DISCARD_SUITS", suits: ["espadas", "bastos"] },
    description: "Al descartar cartas de Espadas o Bastos, sumás +2 Fichas a la ronda por cada una.",
    effect: { stage: "chips_on_discard", value: 2 }
  },
  {
    id: "comodin-as-en-la-manga", name: "As en la Manga", kind: "joker", rarity: "raro",
    trigger: { type: "ZERO_DISCARDS_USED" },
    description: "Si ganás la ronda sin haber usado ningún descarte en ella, sumás +1,5 al Mult.",
    effect: { stage: "mult", op: "add", value: 1.5 }
  },
  {
    id: "comodin-pulpero", name: "Pulpero", kind: "joker", rarity: "comun",
    trigger: { type: "TRICK_TIE" },
    description: "Si hay al menos una baza empatada (parda), ganás +$2 inmediatamente.",
    effect: { stage: "money", op: "add", value: 2 }
  },
  {
    id: "comodin-la-yapa", name: "La Yapa", kind: "joker", rarity: "pocoComun",
    trigger: { type: "ROUND_WON_TRICK_3" },
    description: "Si ganás la ronda definiéndola en la tercera baza, ganás +$3 de premio.",
    effect: { stage: "money", op: "add", value: 3 }
  },
  {
    id: "comodin-envidioso", name: "Envidioso", kind: "joker", rarity: "raro",
    trigger: { type: "ENVIDO_WON_30" },
    description: "Si ganás el Envido con 30 o más de tanto, ganás +$4 al instante.",
    effect: { stage: "money", op: "add", value: 4 }
  },
  {
    id: "comodin-pacto-del-malevo", name: "Pacto del Malevo", kind: "joker", rarity: "legendario",
    trigger: { type: "CARD_SUITS_PLAYED", suits: ["espadas", "bastos"] },
    description: "Cada baza que gana El Rival con Espada o Basto te da +$2; cada baza que ganás vos con Espada o Basto te da +1 Mult.",
    effect: { stage: "pacto_malevo", value: 2 }
  },
  {
    id: "comodin-redoblador", name: "Redoblador", kind: "joker", rarity: "raro",
    trigger: { type: "POSITIONAL_MULT" },
    description: "Multiplica por ×1,5 todo el Mult acumulado por los comodines a su izquierda.",
    effect: { stage: "positional_mult", op: "multiply", value: 1.5 }
  },
  {
    id: "comodin-grito-sagrado", name: "Grito Sagrado", kind: "joker", rarity: "legendario",
    trigger: { type: "POSITIONAL_MULT_CANTO", canto: "truco" },
    description: "Si cantás Truco o más y ganás la mano, multiplica por ×2,0 el Mult acumulado a tu izquierda.",
    effect: { stage: "positional_mult", op: "multiply", value: 2.0 }
  },
  {
    id: "comodin-espalda-cubierta", name: "Espalda Cubierta", kind: "joker", rarity: "comun",
    trigger: { type: "CARDS_IN_HAND_COUNT_SUIT", suit: "espadas" },
    description: "Por cada carta de Espadas que conserves en mano al cerrar la baza, sumás +3 Fichas.",
    effect: { stage: "chips_per_card_in_hand", suit: "espadas", value: 3 }
  },
  {
    id: "comodin-vino-tinto", name: "Vino Tinto", kind: "joker", rarity: "pocoComun",
    trigger: { type: "CARDS_IN_HAND_COUNT_SUIT", suit: "copas" },
    description: "Por cada carta de Copas que conserves en mano al cerrar la baza, sumás +0,5 al Mult.",
    effect: { stage: "mult_per_card_in_hand", suit: "copas", value: 0.5 }
  },
  {
    id: "comodin-plazo-fijo", name: "Plazo Fijo", kind: "joker", rarity: "raro",
    trigger: { type: "MONEY_INTEREST", step: 5 },
    description: "Por cada $5 de dinero reservado en tu banco, sumás +1,5 al multiplicador.",
    effect: { stage: "mult_money_interest", step: 5, value: 1.5 }
  },
  {
    id: "comodin-tarjeta-sube", name: "Tarjeta SUBE", kind: "joker", rarity: "legendario",
    trigger: { type: "SCALING_CANTO_WINS" },
    description: "Por cada canto ganado acumula +1 ficha permanente; al activarse te entrega todo lo acumulado.",
    effect: { stage: "scaling_chips", value: 1 }
  },
  {
    id: "comodin-riqueza", name: "Riqueza", kind: "joker", rarity: "pocoComun",
    trigger: { type: "DISCARD_SUITS", suits: ["copas", "oro"] },
    description: "Al descartar cartas de Copas u Oro, sumás +2 Fichas a la ronda por cada una.",
    effect: { stage: "chips_on_discard", value: 2 }
  },
  {
    id: "comodin-pecador", name: "Pecador", kind: "joker", rarity: "legendario",
    trigger: { type: "SCALING_DISCARD_RANK", rank: 12 },
    description: "Al descartar un Rey (12), acumula +0,1 al multiplicador permanente y lo entrega en cada ronda.",
    effect: { stage: "scaling_mult", value: 0.1 }
  }
];

export const PROTOTYPE_ITEMS = [];

export const EXPANDED_ITEMS = [];

export const FULL_CATALOG = [...OFFICIAL_ITEMS];

export function itemById(items, id) {
  if (Array.isArray(items)) {
    for (let index = 0; index < items.length; index += 1) {
      if (items[index].id === id) return items[index];
    }
    return null;
  }
  for (let index = 0; index < FULL_CATALOG.length; index += 1) {
    if (FULL_CATALOG[index].id === id) return FULL_CATALOG[index];
  }
  return null;
}

export function offerPool() {
  return OFFICIAL_ITEMS;
}

export function isOfficialItem(id) {
  return itemById(OFFICIAL_ITEMS, id) !== null;
}
