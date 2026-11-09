import { describe, it, expect } from 'vitest';
import {
  reasoning, perceptual, number, numberAnswer, word, spatial,
  REASONING_FORMS, DIMENSIONS, WORD_PAIRS, WORD_DISTRACTORS, SHAPES
} from '../src/generators.js';

const RUNS = 2000;

describe('reasoning', () => {
  const d = DIMENSIONS[0];
  const expected = [
    'Tom is heavier than Sam.',
    'Sam is lighter than Tom.',
    'Sam is not as heavy as Tom.',
    'Tom is not as light as Sam.',
    'Sam is not heavier than Tom.',
    'Tom is not lighter than Sam.',
    'Sam is surpassed in weight by Tom.',
    'Tom is not surpassed in weight by Sam.',
    'It is not true that Sam is heavier than Tom.',
    'It is not true that Tom is not heavier than Sam.'
  ];

  it('renders every form so that Tom is the heavier one', () => {
    REASONING_FORMS.forEach((f, i) => expect(f.make('Tom', 'Sam', d)).toBe(expected[i]));
  });

  it('always answers with the right person', () => {
    for (let i = 0; i < RUNS; i++) {
      const item = reasoning();
      const { w, l, d } = item.meta;
      expect(w).not.toBe(l);
      expect(item.options.sort()).toEqual([w, l].sort());
      const askMore = item.question === `Who is ${d.more}?`;
      expect(item.answer).toBe(askMore ? w : l);
    }
  });
});

describe('perceptual', () => {
  it('counts matching columns correctly', () => {
    for (let i = 0; i < RUNS; i++) {
      const item = perceptual();
      const matches = item.columns.filter(([u, l]) => u.toLowerCase() === l).length;
      expect(item.answer).toBe(String(matches));
      expect(item.options).toContain(item.answer);
    }
  });
});

describe('number', () => {
  it('applies the rule to known cases', () => {
    expect(numberAnswer([5, 12, 30])).toBe(30);
    expect(numberAnswer([3, 9, 11])).toBe(3);
    expect(numberAnswer([2, 6, 10])).toBeNull();
  });

  it('never produces ties or duplicates', () => {
    for (let i = 0; i < RUNS; i++) {
      const item = number();
      expect(new Set(item.numbers).size).toBe(3);
      const [lo, mid, hi] = item.numbers.slice().sort((a, b) => a - b);
      expect(hi - mid).not.toBe(mid - lo);
      const expected = hi - mid > mid - lo ? hi : lo;
      expect(item.answer).toBe(String(expected));
    }
  });
});

describe('word bank', () => {
  it('has at least 200 pairs', () => {
    expect(WORD_PAIRS.length).toBeGreaterThanOrEqual(200);
  });

  it('has no distractor that also appears in a pair', () => {
    const inPairs = new Set(WORD_PAIRS.flat());
    WORD_DISTRACTORS.forEach((d) => expect(inPairs.has(d), d).toBe(false));
  });

  it('has no pair made of the same word twice', () => {
    WORD_PAIRS.forEach(([a, b]) => expect(a).not.toBe(b));
  });

  it('always answers with the distractor', () => {
    for (let i = 0; i < RUNS; i++) {
      const item = word();
      expect(new Set(item.options).size).toBe(3);
      expect(WORD_DISTRACTORS).toContain(item.answer);
      expect(item.options.filter((o) => WORD_DISTRACTORS.includes(o)).length).toBe(1);
    }
  });
});

describe('spatial', () => {
  it('counts pairs with matching mirror state', () => {
    for (let i = 0; i < RUNS; i++) {
      const item = spatial();
      const matches = item.pairs.filter(([a, b]) => a.mirrored === b.mirrored).length;
      expect(item.answer).toBe(String(matches));
      item.pairs.forEach(([a, b]) => {
        expect(a.shape).toBe(b.shape);
        expect(a.shape).toBeLessThan(SHAPES.length);
        expect(a.rotation % 45).toBe(0);
      });
    }
  });
});
