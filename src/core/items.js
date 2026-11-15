export const ITEM_PRICES = {
  comun: 2,
  pocoComun: 4,
  raro: 7,
  legendario: 10
};

export const RARITY_WEIGHTS = [
  { rarity: "comun", weight: 60 },
  { rarity: "pocoComun", weight: 25 },
  { rarity: "raro", weight: 11 },
  { rarity: "legendario", weight: 4 }
];

export const OFFICIAL_ITEMS = [
  {
    id: "carta-brillo-cobre", name: "Brillo de cobre", kind: "cardUpgrade", rarity: "comun",
    description: "La carta marcada suma +8 fichas cuando la jugás.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips", op: "add", value: 8 }
  },
  {
    id: "carta-filo-reforzado", name: "Filo reforzado", kind: "cardUpgrade", rarity: "raro",
    description: "La carta marcada suma +18 fichas cuando la jugás.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips", op: "add", value: 18 }
  },
  {
    id: "carta-tinta-de-canto", name: "Tinta de canto", kind: "cardUpgrade", rarity: "pocoComun",
    description: "La carta marcada suma +2 al multiplicador cuando la jugás.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult", op: "add", value: 2 }
  },
  {
    id: "carta-firma-de-as", name: "Firma de as", kind: "cardUpgrade", rarity: "raro",
    description: "La carta marcada suma +4 al multiplicador cuando la jugás.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult", op: "add", value: 4 }
  },
  {
    id: "carta-cara-acunada", name: "Cara acuñada", kind: "cardUpgrade", rarity: "pocoComun",
    description: "Ganás +$2 cada vez que jugás la carta marcada.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 2 }
  },
  {
    id: "carta-sello-de-oro", name: "Sello de oro", kind: "cardUpgrade", rarity: "raro",
    description: "Ganás +$4 cada vez que jugás la carta marcada.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 4 }
  },
  {
    id: "comodin-bastos-fichas", name: "Bastonero", kind: "joker", rarity: "comun",
    trigger: { type: "CARD_SUIT_PLAYED", suit: "bastos" },
    description: "Por cada carta de bastos jugada, suma +10 fichas a la ronda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips", op: "add", value: 10 }
  },
  {
    id: "comodin-bastos-mult", name: "Pintor verde", kind: "joker", rarity: "pocoComun",
    trigger: { type: "CARD_SUIT_PLAYED", suit: "bastos" },
    description: "Por cada carta de bastos jugada, suma +3 al multiplicador.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult", op: "add", value: 3 }
  },
  {
    id: "comodin-bastos-dinero", name: "Mercader de bastos", kind: "joker", rarity: "raro",
    trigger: { type: "CARD_SUIT_PLAYED", suit: "bastos" },
    description: "Por cada carta de bastos jugada, ganás +$3 al instante.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 3 }
  },
  {
    id: "comodin-siete-fichas", name: "Séptima", kind: "joker", rarity: "comun",
    trigger: { type: "CARD_RANK_PLAYED", rank: 7 },
    description: "Por cada 7 jugado, suma +12 fichas a la ronda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips", op: "add", value: 12 }
  },
  {
    id: "comodin-siete-mult", name: "Siete bravo", kind: "joker", rarity: "pocoComun",
    trigger: { type: "CARD_RANK_PLAYED", rank: 7 },
    description: "Por cada 7 jugado, suma +4 al multiplicador de la ronda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult", op: "add", value: 4 }
  },
  {
    id: "comodin-siete-dinero", name: "Suerte del siete", kind: "joker", rarity: "raro",
    trigger: { type: "CARD_RANK_PLAYED", rank: 7 },
    description: "Por cada 7 jugado, ganás +$3 al instante.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 3 }
  },
  {
    id: "comodin-truco-ganado-fichas", name: "Retruquero", kind: "joker", rarity: "comun",
    trigger: { type: "PLAYER_WINS_CANTO", canto: "truco" },
    description: "Si cantás Truco y ganás la ronda, suma +20 fichas.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips", op: "add", value: 20 }
  },
  {
    id: "comodin-truco-ganado-mult", name: "Voz del cantor", kind: "joker", rarity: "pocoComun",
    trigger: { type: "PLAYER_WINS_CANTO", canto: "truco" },
    description: "Si cantás Truco y ganás la ronda, suma +6 al multiplicador.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult", op: "add", value: 6 }
  },
  {
    id: "comodin-truco-ganado-dinero", name: "Pozo del truco", kind: "joker", rarity: "raro",
    trigger: { type: "PLAYER_WINS_CANTO", canto: "truco" },
    description: "Si cantás Truco y ganás la ronda, ganás +$4 de premio.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 4 }
  },
  {
    id: "comodin-rival-pierde-fichas", name: "Contracanto", kind: "joker", rarity: "pocoComun",
    trigger: { type: "RIVAL_CANTO_LOST", canto: "truco" },
    description: "Si El Rival canta Truco y pierde la ronda, suma +25 fichas.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips", op: "add", value: 25 }
  },
  {
    id: "comodin-rival-pierde-mult", name: "La última palabra", kind: "joker", rarity: "raro",
    trigger: { type: "RIVAL_CANTO_LOST", canto: "truco" },
    description: "Si El Rival canta Truco y pierde la ronda, suma +8 al mult.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult", op: "add", value: 8 }
  },
  {
    id: "comodin-rival-pierde-dinero", name: "La revancha", kind: "joker", rarity: "legendario",
    trigger: { type: "RIVAL_CANTO_LOST", canto: "truco" },
    description: "Si El Rival canta Truco y pierde la ronda, ganás +$5.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 5 }
  },
  {
    id: "comodin-barajador", name: "Barajador", kind: "joker", rarity: "comun",
    trigger: { type: "PASSIVE_DISCARD_BONUS" },
    description: "Te otorga +2 descartes adicionales por cada ronda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "add_discard", value: 2 }
  },
  {
    id: "comodin-granaderos", name: "Granaderos", kind: "joker", rarity: "pocoComun",
    trigger: { type: "DISCARD_SUITS", suits: ["espadas", "bastos"] },
    description: "Por cada carta de Espadas o Bastos descartada, sumás +6 Fichas.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips_on_discard", value: 6 }
  },
  {
    id: "comodin-as-en-la-manga", name: "As en la Manga", kind: "joker", rarity: "raro",
    trigger: { type: "ZERO_DISCARDS_USED" },
    description: "Si ganás la ronda sin usar ningún descarte, sumás +6 al Mult.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult", op: "add", value: 6 }
  },
  {
    id: "comodin-pulpero", name: "Pulpero", kind: "joker", rarity: "comun",
    trigger: { type: "TRICK_TIE" },
    description: "Si hay al menos una baza empatada (parda), ganás +$3 al instante.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 3 }
  },
  {
    id: "comodin-la-yapa", name: "La Yapa", kind: "joker", rarity: "pocoComun",
    trigger: { type: "ROUND_WON_TRICK_3" },
    description: "Si ganás la ronda definiéndola en la 3ª baza, ganás +$4 extra.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 4 }
  },
  {
    id: "comodin-envidioso", name: "Envidioso", kind: "joker", rarity: "raro",
    trigger: { type: "ENVIDO_WON_30" },
    description: "Si ganás el Envido con 30 o más de tanto, ganás +$5 al instante.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 5 }
  },
  {
    id: "comodin-pacto-del-malevo", name: "Pacto del Malevo", kind: "joker", rarity: "legendario",
    trigger: { type: "CARD_SUITS_PLAYED", suits: ["espadas", "bastos"] },
    description: "Cada baza que gana Rival con Espada/Basto da +$3; tuya da +2 Mult.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "pacto_malevo", value: 3, multValue: 2 }
  },
  {
    id: "comodin-redoblador", name: "Redoblador", kind: "joker", rarity: "raro",
    trigger: { type: "POSITIONAL_MULT" },
    description: "Multiplica por ×2,0 todo el Mult acumulado por comodines a su izquierda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "positional_mult", op: "multiply", value: 2.0 }
  },
  {
    id: "comodin-grito-sagrado", name: "Grito Sagrado", kind: "joker", rarity: "legendario",
    trigger: { type: "POSITIONAL_MULT_CANTO", canto: "truco" },
    description: "Si cantás Truco o más y ganás la mano, multiplica por ×3,0 el Mult a tu izquierda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "positional_mult", op: "multiply", value: 3.0 }
  },
  {
    id: "comodin-espalda-cubierta", name: "Espalda Cubierta", kind: "joker", rarity: "comun",
    trigger: { type: "CARDS_IN_HAND_COUNT_SUIT", suit: "espadas" },
    description: "Por cada carta de Espadas retenida en mano al cerrar baza, sumás +8 Fichas.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips_per_card_in_hand", suit: "espadas", value: 8 }
  },
  {
    id: "comodin-vino-tinto", name: "Vino Tinto", kind: "joker", rarity: "pocoComun",
    trigger: { type: "CARDS_IN_HAND_COUNT_SUIT", suit: "copas" },
    description: "Por cada carta de Copas retenida en mano al cerrar baza, sumás +3 al Mult.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult_per_card_in_hand", suit: "copas", value: 3 }
  },
  {
    id: "comodin-plazo-fijo", name: "Plazo Fijo", kind: "joker", rarity: "raro",
    trigger: { type: "MONEY_INTEREST", step: 5 },
    description: "Por cada $5 ahorrados en tu banco, sumás +3 al multiplicador.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult_money_interest", step: 5, value: 3 }
  },
  {
    id: "comodin-tarjeta-sube", name: "Tarjeta SUBE", kind: "joker", rarity: "legendario",
    trigger: { type: "SCALING_CANTO_WINS" },
    description: "Por cada canto ganado acumula +5 fichas permanentes para todas las rondas.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "scaling_chips", value: 5 }
  },
  {
    id: "comodin-riqueza", name: "Riqueza", kind: "joker", rarity: "pocoComun",
    trigger: { type: "DISCARD_SUITS", suits: ["copas", "oro"] },
    description: "Al descartar cartas de Copas u Oro, sumás +6 Fichas a la ronda por cada una.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips_on_discard", value: 6 }
  },
  {
    id: "comodin-pecador", name: "Pecador", kind: "joker", rarity: "legendario",
    trigger: { type: "SCALING_DISCARD_RANK", rank: 12 },
    description: "Al descartar un Rey (12), acumula +1,0 al mult permanente en cada ronda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "scaling_mult", value: 1.0 }
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
