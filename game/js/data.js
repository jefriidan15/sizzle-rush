// Sizzle Rush — data.js
// One job: every constant the game runs on — ingredients, recipes, the
// kitchen layout, timings and scoring. No drawing, no input, no sound.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 104;

export const SHIFT_SECONDS = 180;
export const WIN_TARGET_SCORE = 600;

// --- Ingredients -----------------------------------------------------------
export const INGREDIENTS = {
  tomato: { name: 'Tomato', color: '#e23b2e', dark: '#a82318', chop: true, grill: false, shape: 'round' },
  lettuce: { name: 'Lettuce', color: '#58b368', dark: '#2f7d3d', chop: true, grill: false, shape: 'leaf' },
  cheese: { name: 'Cheese', color: '#ffc93c', dark: '#e0a100', chop: false, grill: false, shape: 'square' },
  patty: { name: 'Patty', color: '#7a4a21', dark: '#4e2c10', chop: false, grill: true, shape: 'round' },
  bun: { name: 'Bun', color: '#f0b45a', dark: '#c98a2e', chop: false, grill: false, shape: 'dome' },
  onion: { name: 'Onion', color: '#e8d8f0', dark: '#b48cc9', chop: true, grill: false, shape: 'rings' },
};

// Prep states an ingredient can be in while carried or on a station.
export const PREP = { RAW: 'raw', CHOPPED: 'chopped', COOKED: 'cooked', BURNT: 'burnt' };

// --- Recipes ---------------------------------------------------------------
// Each step is one ingredient in the order it must be plated.
export const RECIPES = [
  {
    id: 'classic',
    name: 'Classic Burger',
    price: 100,
    steps: [
      { kind: 'bun', prep: 'raw' },
      { kind: 'patty', prep: 'cooked' },
      { kind: 'lettuce', prep: 'chopped' },
      { kind: 'tomato', prep: 'chopped' },
    ],
  },
  {
    id: 'melt',
    name: 'Cheese Melt',
    price: 90,
    steps: [
      { kind: 'bun', prep: 'raw' },
      { kind: 'patty', prep: 'cooked' },
      { kind: 'cheese', prep: 'raw' },
    ],
  },
  {
    id: 'salad',
    name: 'Garden Salad',
    price: 80,
    steps: [
      { kind: 'lettuce', prep: 'chopped' },
      { kind: 'tomato', prep: 'chopped' },
      { kind: 'onion', prep: 'chopped' },
    ],
  },
  {
    id: 'onionstack',
    name: 'Onion Stack',
    price: 110,
    steps: [
      { kind: 'bun', prep: 'raw' },
      { kind: 'patty', prep: 'cooked' },
      { kind: 'onion', prep: 'chopped' },
      { kind: 'cheese', prep: 'raw' },
    ],
  },
  {
    id: 'double',
    name: 'Double Trouble',
    price: 140,
    steps: [
      { kind: 'bun', prep: 'raw' },
      { kind: 'patty', prep: 'cooked' },
      { kind: 'cheese', prep: 'raw' },
      { kind: 'patty', prep: 'cooked' },
      { kind: 'tomato', prep: 'chopped' },
    ],
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) ?? RECIPES[0];
}

// --- Timings ---------------------------------------------------------------
export const TIMING = {
  chopSeconds: 1.4,
  grillCookSeconds: 6,
  grillReadySeconds: 5, // after this the patty burns
  orderPatienceStart: 80,
  orderPatienceMin: 48,
  spawnIntervalStart: 15,
  spawnIntervalMin: 9,
  maxActiveOrders: 4,
  chefSpeed: 270,
};

// --- Scoring ---------------------------------------------------------------
export const SCORING = {
  expiredOrder: -25,
  wrongDish: -20,
  binPlate: 0,
  tipMax: 50,
  comboStep: 0.25, // +25% per combo level
  comboCap: 2.5,
};

// --- Kitchen layout --------------------------------------------------------
// All coordinates are in canvas space (1280x720). The top band (y 150..214)
// is the counter row; the plating counter and bin are low counters the chef
// walks around; the serving window sits on the right wall.
export const STATIONS = {
  crates: [
    { kind: 'tomato', x: 56, y: 150, w: 96, h: 64, label: 'Tomato' },
    { kind: 'lettuce', x: 160, y: 150, w: 96, h: 64, label: 'Lettuce' },
    { kind: 'cheese', x: 264, y: 150, w: 96, h: 64, label: 'Cheese' },
    { kind: 'patty', x: 368, y: 150, w: 96, h: 64, label: 'Patty' },
    { kind: 'bun', x: 472, y: 150, w: 96, h: 64, label: 'Bun' },
    { kind: 'onion', x: 576, y: 150, w: 96, h: 64, label: 'Onion' },
  ],
  board: { x: 700, y: 150, w: 150, h: 64, label: 'Chopping Board' },
  grill: { x: 886, y: 150, w: 250, h: 64, label: 'Grill', slots: 2 },
  plating: { x: 470, y: 566, w: 340, h: 74, label: 'Plating Counter', slots: 2 },
  window: { x: 1140, y: 380, w: 100, h: 150, label: 'Serving Window' },
  bin: { x: 60, y: 566, w: 110, h: 74, label: 'Bin' },
};

// Rectangles the chef cannot walk through (counters + walls).
export const SOLIDS = [
  { x: 40, y: 150, w: 1096, h: 64 }, // top counter band (crates + board + grill)
  { x: 470, y: 566, w: 340, h: 74 }, // plating counter
  { x: 60, y: 566, w: 110, h: 74 }, // bin
  { x: 1140, y: 380, w: 100, h: 150 }, // serving window counter
];

// Walkable bounds for the chef's centre.
export const WALK = { x0: 46, y0: 132, x1: 1234, y1: 694 };
