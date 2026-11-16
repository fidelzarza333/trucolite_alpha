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
    id: "comodin-bastos-fichas", name: "Bastonero", emoji: "🪵", kind: "joker", rarity: "comun",
    trigger: { type: "CARD_SUIT_PLAYED", suit: "bastos" },
    description: "Por cada carta de bastos jugada, suma +10 fichas a la ronda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips", op: "add", value: 10 }
  },
  {
    id: "comodin-bastos-mult", name: "Pintor verde", emoji: "🎨", kind: "joker", rarity: "pocoComun",
    trigger: { type: "CARD_SUIT_PLAYED", suit: "bastos" },
    description: "Por cada carta de bastos jugada, suma +3 al multiplicador.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult", op: "add", value: 3 }
  },
  {
    id: "comodin-bastos-dinero", name: "Mercader de bastos", emoji: "💰", kind: "joker", rarity: "raro",
    trigger: { type: "CARD_SUIT_PLAYED", suit: "bastos" },
    description: "Por cada carta de bastos jugada, ganás +$3 al instante.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 3 }
  },
  {
    id: "comodin-siete-fichas", name: "Séptima", emoji: "7️⃣", kind: "joker", rarity: "comun",
    trigger: { type: "CARD_RANK_PLAYED", rank: 7 },
    description: "Por cada 7 jugado, suma +12 fichas a la ronda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips", op: "add", value: 12 }
  },
  {
    id: "comodin-siete-mult", name: "Siete bravo", emoji: "⚔️", kind: "joker", rarity: "pocoComun",
    trigger: { type: "CARD_RANK_PLAYED", rank: 7 },
    description: "Por cada 7 jugado, suma +4 al multiplicador de la ronda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult", op: "add", value: 4 }
  },
  {
    id: "comodin-siete-dinero", name: "Suerte del siete", emoji: "🍀", kind: "joker", rarity: "raro",
    trigger: { type: "CARD_RANK_PLAYED", rank: 7 },
    description: "Por cada 7 jugado, ganás +$3 al instante.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 3 }
  },
  {
    id: "comodin-truco-ganado-fichas", name: "Retruquero", emoji: "📣", kind: "joker", rarity: "comun",
    trigger: { type: "PLAYER_WINS_CANTO", canto: "truco" },
    description: "Si cantás Truco y ganás la ronda, suma +20 fichas.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips", op: "add", value: 20 }
  },
  {
    id: "comodin-truco-ganado-mult", name: "Voz del cantor", emoji: "🎤", kind: "joker", rarity: "pocoComun",
    trigger: { type: "PLAYER_WINS_CANTO", canto: "truco" },
    description: "Si cantás Truco y ganás la ronda, suma +6 al multiplicador.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult", op: "add", value: 6 }
  },
  {
    id: "comodin-truco-ganado-dinero", name: "Pozo del truco", emoji: "🏆", kind: "joker", rarity: "raro",
    trigger: { type: "PLAYER_WINS_CANTO", canto: "truco" },
    description: "Si cantás Truco y ganás la ronda, ganás +$4 de premio.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 4 }
  },
  {
    id: "comodin-rival-pierde-fichas", name: "Contracanto", emoji: "🛡️", kind: "joker", rarity: "pocoComun",
    trigger: { type: "RIVAL_CANTO_LOST", canto: "truco" },
    description: "Si El Rival canta Truco y pierde la ronda, suma +25 fichas.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips", op: "add", value: 25 }
  },
  {
    id: "comodin-rival-pierde-mult", name: "La última palabra", emoji: "💬", kind: "joker", rarity: "raro",
    trigger: { type: "RIVAL_CANTO_LOST", canto: "truco" },
    description: "Si El Rival canta Truco y pierde la ronda, suma +8 al mult.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult", op: "add", value: 8 }
  },
  {
    id: "comodin-rival-pierde-dinero", name: "La revancha", emoji: "💸", kind: "joker", rarity: "legendario",
    trigger: { type: "RIVAL_CANTO_LOST", canto: "truco" },
    description: "Si El Rival canta Truco y pierde la ronda, ganás +$5.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 5 }
  },
  {
    id: "comodin-barajador", name: "Barajador", emoji: "🔄", kind: "joker", rarity: "comun",
    trigger: { type: "PASSIVE_DISCARD_BONUS" },
    description: "Te otorga +2 descartes adicionales por cada ronda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "add_discard", value: 2 }
  },
  {
    id: "comodin-granaderos", name: "Granaderos", emoji: "💥", kind: "joker", rarity: "pocoComun",
    trigger: { type: "DISCARD_SUITS", suits: ["espadas", "bastos"] },
    description: "Por cada carta de Espadas o Bastos descartada, sumás +6 Fichas.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips_on_discard", value: 6 }
  },
  {
    id: "comodin-as-en-la-manga", name: "As en la Manga", emoji: "🃏", kind: "joker", rarity: "raro",
    trigger: { type: "ZERO_DISCARDS_USED" },
    description: "Si ganás la ronda sin usar ningún descarte, sumás +6 al Mult.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult", op: "add", value: 6 }
  },
  {
    id: "comodin-pulpero", name: "Pulpero", emoji: "🐙", kind: "joker", rarity: "comun",
    trigger: { type: "TRICK_TIE" },
    description: "Si hay al menos una baza empatada (parda), ganás +$3 al instante.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 3 }
  },
  {
    id: "comodin-la-yapa", name: "La Yapa", emoji: "🎁", kind: "joker", rarity: "pocoComun",
    trigger: { type: "ROUND_WON_TRICK_3" },
    description: "Si ganás la ronda definiéndola en la 3ª baza, ganás +$4 extra.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 4 }
  },
  {
    id: "comodin-envidioso", name: "Envidioso", emoji: "😤", kind: "joker", rarity: "raro",
    trigger: { type: "ENVIDO_WON_30" },
    description: "Si ganás el Envido con 30 o más de tanto, ganás +$5 al instante.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "money", op: "add", value: 5 }
  },
  {
    id: "comodin-pacto-del-malevo", name: "Pacto del Malevo", emoji: "😈", kind: "joker", rarity: "legendario",
    trigger: { type: "CARD_SUITS_PLAYED", suits: ["espadas", "bastos"] },
    description: "Cada baza que gana Rival con Espada/Basto da +$3; tuya da +2 Mult.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "pacto_malevo", value: 3, multValue: 2 }
  },
  {
    id: "comodin-redoblador", name: "Redoblador", emoji: "✖️", kind: "joker", rarity: "raro",
    trigger: { type: "POSITIONAL_MULT" },
    description: "Multiplica por ×2,0 todo el Mult acumulado por comodines a su izquierda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "positional_mult", op: "multiply", value: 2.0 }
  },
  {
    id: "comodin-grito-sagrado", name: "Grito Sagrado", emoji: "📢", kind: "joker", rarity: "legendario",
    trigger: { type: "POSITIONAL_MULT_CANTO", canto: "truco" },
    description: "Si cantás Truco o más y ganás la mano, multiplica por ×3,0 el Mult a tu izquierda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "positional_mult", op: "multiply", value: 3.0 }
  },
  {
    id: "comodin-espalda-cubierta", name: "Espalda Cubierta", emoji: "🛡️", kind: "joker", rarity: "comun",
    trigger: { type: "CARDS_IN_HAND_COUNT_SUIT", suit: "espadas" },
    description: "Por cada carta de Espadas retenida en mano al cerrar baza, sumás +8 Fichas.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips_per_card_in_hand", suit: "espadas", value: 8 }
  },
  {
    id: "comodin-vino-tinto", name: "Vino Tinto", emoji: "🍷", kind: "joker", rarity: "pocoComun",
    trigger: { type: "CARDS_IN_HAND_COUNT_SUIT", suit: "copas" },
    description: "Por cada carta de Copas retenida en mano al cerrar baza, sumás +3 al Mult.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult_per_card_in_hand", suit: "copas", value: 3 }
  },
  {
    id: "comodin-plazo-fijo", name: "Plazo Fijo", emoji: "🏦", kind: "joker", rarity: "raro",
    trigger: { type: "MONEY_INTEREST", step: 5 },
    description: "Por cada $5 ahorrados en tu banco, sumás +3 al multiplicador.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult_money_interest", step: 5, value: 3 }
  },
  {
    id: "comodin-tarjeta-sube", name: "Tarjeta SUBE", emoji: "🚇", kind: "joker", rarity: "legendario",
    trigger: { type: "SCALING_CANTO_WINS" },
    description: "Por cada canto ganado acumula +5 fichas permanentes para todas las rondas.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "scaling_chips", value: 5 }
  },
  {
    id: "comodin-riqueza", name: "Riqueza", emoji: "💎", kind: "joker", rarity: "pocoComun",
    trigger: { type: "DISCARD_SUITS", suits: ["copas", "oro"] },
    description: "Al descartar cartas de Copas u Oro, sumás +6 Fichas a la ronda por cada una.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "chips_on_discard", value: 6 }
  },
  {
    id: "comodin-pecador", name: "Pecador", emoji: "👿", kind: "joker", rarity: "legendario",
    trigger: { type: "SCALING_DISCARD_RANK", rank: 12 },
    description: "Al descartar un Rey (12), acumula +1,0 al mult permanente en cada ronda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "scaling_mult", value: 1.0 }
  },
  {
    id: "comodin-por-una-cabeza", name: "Por Una Cabeza", emoji: "🐎", kind: "joker", rarity: "legendario",
    description: "+1 Ronda por nivel (se aplica al comprar).",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "add_rounds", value: 1 }
  },
  {
    id: "comodin-libertador", name: "Libertador", emoji: "🗽", kind: "joker", rarity: "raro",
    trigger: { type: "CARD_RANK_SUIT_PLAYED", rank: 1, suit: "espadas" },
    description: "Al jugar el 1 de espada, multiplica x2 el mult de comodines a su izquierda y ganás +5$.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "composite", mult: 2, money: 5 }
  },
  {
    id: "comodin-todo-o-nada", name: "Todo o Nada", emoji: "🎲", kind: "joker", rarity: "raro",
    description: "En la primera ronda del nivel, si descartás dos cartas y te quedás con la de menor fuerza, +15 fichas y +5 mult.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "todo_o_nada" }
  },
  {
    id: "comodin-milagro", name: "Milagro", emoji: "✨", kind: "joker", rarity: "legendario",
    description: "Al alcanzar el 50% del puntaje del nivel, completás el nivel y este comodín se vende automáticamente.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "miracle" }
  },
  {
    id: "comodin-uno", name: "UNO!", emoji: "1️⃣", kind: "joker", rarity: "raro",
    trigger: { type: "CARD_RANK_PLAYED", rank: 1 },
    description: "Al jugar cualquier carta de 1, obtenés +10 fichas y +5 mult.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "composite", chips: 10, mult: 5 }
  },
  {
    id: "comodin-chacabuco", name: "Chacabuco-card Ultra Premium Deluxe", emoji: "💳", kind: "joker", rarity: "legendario",
    description: "Al vender este comodín, ganás la ronda automáticamente.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "chacabuco" }
  },
  {
    id: "comodin-letra-chica", name: "Letra Chica", emoji: "📝", kind: "joker", rarity: "pocoComun",
    description: "Al ganar una baza +1 chip, al perder una baza -1 chip. Al ganar un canto se agregan todos los chips acumulados.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "letra_chica", value: 1 }
  },
  {
    id: "comodin-mate", name: "Mate", emoji: "🧉", kind: "joker", rarity: "legendario",
    description: "Multiplica por 3x todo el mult de comodines a su izquierda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "positional_mult", op: "multiply", value: 3.0 }
  },
  {
    id: "comodin-pomberito", name: "Pomberito", emoji: "🐷", kind: "joker", rarity: "comun",
    description: "Al perder una baza -1$, al ganar una baza +1$.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "pomberito", value: 1 }
  },
  {
    id: "comodin-jacaranda", name: "Jacarandá", emoji: "🌸", kind: "joker", rarity: "raro",
    description: "+1$ al final de cada ronda. +1$ extra si cantás Vale 4 y ganás. Acumula y se suma al dinero al terminar la ronda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "jacaranda", value: 1 }
  },
  {
    id: "comodin-banco", name: "Banco", emoji: "🏛️", kind: "joker", rarity: "raro",
    trigger: { type: "MONEY_INTEREST", step: 5 },
    description: "Por cada 5$ ahorrados en tu banco, sumás +5 al multiplicador.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "mult_money_interest", step: 5, value: 5 }
  },
  {
    id: "comodin-envido-vago", name: "Envido Vago", emoji: "🤷", kind: "joker", rarity: "comun",
    description: "Al cantar Envido y perder, no perdés dinero.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "envido_vago" }
  },
  {
    id: "comodin-siete-vida", name: "Siete de Vida", emoji: "❤️", kind: "joker", rarity: "pocoComun",
    description: "Al jugar un 7, si perdés la baza, esa baza queda parda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "siete_vida", value: 1 }
  },
  {
    id: "comodin-mazo-infinito", name: "Mazo Infinito", emoji: "♾️", kind: "joker", rarity: "raro",
    description: "+1 carta extra en mano cada ronda (se aplica al comprar, para rondas futuras).",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "mazo_infinito", value: 1 }
  },
  {
    id: "comodin-doble-oportunidad", name: "Doble Oportunidad", emoji: "🔄", kind: "joker", rarity: "raro",
    description: "Si rechazás un canto del rival, podés volver a cantarlo esa ronda. (Placeholder: requiere rework de rejectRivalCanto).",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "doble_oportunidad" }
  },
  {
    id: "comodin-tango", name: "Tango", emoji: "💃", kind: "joker", rarity: "legendario",
    description: "Al ganar 3 bazas seguidas en una ronda, ×2 mult permanente para todas las rondas siguientes.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "tango", value: 2 }
  },
  {
    id: "comodin-milonga", name: "Milonga", emoji: "🎶", kind: "joker", rarity: "pocoComun",
    description: "Al cantar Flor y perder, ganás +$2 de consuelo.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "milonga", value: 2 }
  },
  {
    id: "comodin-revancha", name: "La Revancha", emoji: "⚔️", kind: "joker", rarity: "raro",
    description: "Al perder una ronda, el próximo envido que ganes vale el doble.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "revancha" }
  },
  {
    id: "comodin-triqui-traka", name: "Triqui-Traka", emoji: "🔢", kind: "joker", rarity: "legendario",
    description: "Aumenta el límite de jokers de 5 a 7.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "triqui_traka" }
  },
  {
    id: "comodin-descuento", name: "Descuento", emoji: "🏷️", kind: "joker", rarity: "pocoComun",
    description: "Todas las ofertas de la tienda cuestan $1 menos.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "descuento", value: 1 }
  },
  {
    id: "comodin-coleccionista", name: "Coleccionista", emoji: "📚", kind: "joker", rarity: "raro",
    description: "El primer reroll de tienda por nivel es gratis.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "coleccionista" }
  },
  {
    id: "comodin-as-copas", name: "As de Copas", emoji: "🏆", kind: "joker", rarity: "raro",
    trigger: { type: "CARD_RANK_SUIT_PLAYED", rank: 1, suit: "copas" },
    description: "Al jugar el 1 de copas, +5 chips y +2 mult.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "composite", chips: 5, mult: 2 }
  },
  {
    id: "comodin-rey-oro", name: "Rey de Oro", emoji: "👑", kind: "joker", rarity: "pocoComun",
    trigger: { type: "CARD_RANK_SUIT_PLAYED", rank: 12, suit: "oros" },
    description: "Al jugar el 12 de oros, ganás +1 descarte adicional esa ronda.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "rey_oro", value: 1 }
  },
  {
    id: "comodin-mano-firme", name: "Mano Firme", emoji: "✊", kind: "joker", rarity: "pocoComun",
    description: "Si sos el mano, tus cartas tienen +1 de fuerza en la primera baza.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "mano_firme", value: 1 }
  },
  {
    id: "comodin-negocio", name: "Negocio", emoji: "🤝", kind: "joker", rarity: "legendario",
    description: "Vender cualquier joker devuelve el 75% de su precio en vez del 50%.",
    shortDescription: "Lorem ipsum",
    effect: { stage: "passive", op: "negocio" }
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
