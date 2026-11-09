import words from './data/words.json';

export const randInt = (n, rng = Math.random) => Math.floor(rng() * n);
export const shuffle = (arr, rng = Math.random) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1, rng);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pick = (arr, rng) => arr[randInt(arr.length, rng)];

export const NAMES = ['Tom', 'Sam', 'Ana', 'Raj', 'Eva', 'Leo', 'Mia', 'Jon', 'Ida', 'Max', 'Zoe', 'Ben'];

export const DIMENSIONS = [
  { more: 'heavier', less: 'lighter', moreBase: 'heavy', lessBase: 'light', noun: 'weight' },
  { more: 'taller', less: 'shorter', moreBase: 'tall', lessBase: 'short', noun: 'height' },
  { more: 'older', less: 'younger', moreBase: 'old', lessBase: 'young', noun: 'age' },
  { more: 'faster', less: 'slower', moreBase: 'fast', lessBase: 'slow', noun: 'speed' },
  { more: 'richer', less: 'poorer', moreBase: 'rich', lessBase: 'poor', noun: 'wealth' }
];

// Each form takes the person who has more of the quality (w) and the one who has less (l).
// Level 1 forms are plain, level 2 add a negation, level 3 add passive phrasing or a double negative.
export const REASONING_FORMS = [
  { level: 1, make: (w, l, d) => `${w} is ${d.more} than ${l}.` },
  { level: 1, make: (w, l, d) => `${l} is ${d.less} than ${w}.` },
  { level: 2, make: (w, l, d) => `${l} is not as ${d.moreBase} as ${w}.` },
  { level: 2, make: (w, l, d) => `${w} is not as ${d.lessBase} as ${l}.` },
  { level: 2, make: (w, l, d) => `${l} is not ${d.more} than ${w}.` },
  { level: 2, make: (w, l, d) => `${w} is not ${d.less} than ${l}.` },
  { level: 3, make: (w, l, d) => `${l} is surpassed in ${d.noun} by ${w}.` },
  { level: 3, make: (w, l, d) => `${w} is not surpassed in ${d.noun} by ${l}.` },
  { level: 3, make: (w, l, d) => `It is not true that ${l} is ${d.more} than ${w}.` },
  { level: 3, make: (w, l, d) => `It is not true that ${w} is not ${d.more} than ${l}.` }
];

export function reasoning(rng = Math.random) {
  const [w, l] = shuffle(NAMES, rng);
  const d = pick(DIMENSIONS, rng);
  const form = pick(REASONING_FORMS, rng);
  const askMore = rng() < 0.5;
  return {
    type: 'reasoning',
    statement: form.make(w, l, d),
    question: `Who is ${askMore ? d.more : d.less}?`,
    options: shuffle([w, l], rng),
    answer: askMore ? w : l,
    meta: { w, l, d, level: form.level }
  };
}

const LETTERS = 'ABDEFGHJKMNQRT'.split('');

export function perceptual(rng = Math.random) {
  let count = 0;
  const columns = [];
  for (let i = 0; i < 4; i++) {
    const upper = pick(LETTERS, rng);
    let lower = upper.toLowerCase();
    if (rng() < 0.5) {
      let other;
      do { other = pick(LETTERS, rng); } while (other === upper);
      lower = other.toLowerCase();
    } else {
      count++;
    }
    columns.push([upper, lower]);
  }
  return { type: 'perceptual', columns, options: ['0', '1', '2', '3', '4'], answer: String(count) };
}

export function numberAnswer(nums) {
  const [lo, mid, hi] = nums.slice().sort((a, b) => a - b);
  if (hi - mid === mid - lo) return null;
  return hi - mid > mid - lo ? hi : lo;
}

export function number(rng = Math.random, max = 40) {
  let nums;
  do {
    const s = new Set();
    while (s.size < 3) s.add(randInt(max, rng) + 1);
    nums = [...s];
  } while (numberAnswer(nums) === null);
  nums = shuffle(nums, rng);
  return { type: 'number', numbers: nums, options: nums.map(String), answer: String(numberAnswer(nums)) };
}

export const WORD_PAIRS = [...words.pairs, ...words.opposites];
export const WORD_DISTRACTORS = words.distractors;

export function word(rng = Math.random) {
  const pair = pick(WORD_PAIRS, rng);
  const odd = pick(WORD_DISTRACTORS, rng);
  return { type: 'word', options: shuffle([pair[0], pair[1], odd], rng), answer: odd, meta: { pair } };
}

// Asymmetric figures drawn in a 100x100 box centred on 50,50. None has a mirror axis,
// so a mirrored copy can never be rotated back onto the original.
export const SHAPES = [
  'M30 15 H60 Q78 15 78 33 Q78 50 60 50 H48 L76 85 H62 L36 52 V85 H30 Z M36 22 V44 H58 Q70 44 70 33 Q70 22 58 22 Z',
  'M30 15 H75 V25 H40 V45 H68 V55 H40 V85 H30 Z',
  'M25 85 V15 H35 V55 L70 20 L77 27 L43 61 H75 V71 H35 V85 Z',
  'M30 15 H70 L60 32 L70 50 H40 V85 H30 Z',
  'M20 70 L50 15 L60 20 L38 62 H80 V75 H25 Z'
];

export function spatial(rng = Math.random) {
  let count = 0;
  const pairs = [];
  for (let i = 0; i < 2; i++) {
    const shape = randInt(SHAPES.length, rng);
    const mirroredA = rng() < 0.5;
    const mirroredB = rng() < 0.5;
    if (mirroredA === mirroredB) count++;
    pairs.push([
      { shape, rotation: randInt(8, rng) * 45, mirrored: mirroredA },
      { shape, rotation: randInt(8, rng) * 45, mirrored: mirroredB }
    ]);
  }
  return { type: 'spatial', pairs, options: ['0', '1', '2'], answer: String(count) };
}

export const GENERATORS = { reasoning, perceptual, number, word, spatial };
