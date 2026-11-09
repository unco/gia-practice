# GIA-style practice test

A static, browser-based practice test in the format of the Thomas International General Intelligence Assessment (GIA). It is for one person to practise the five question formats before taking the real test. It does not use Thomas's proprietary items or norms, and it must never claim to produce official scores.

## Layout

- `src/generators.js` holds the item generators for all five sections plus the spatial SVG shapes. Every generator returns `{ type, options, answer }` plus type-specific fields.
- `src/data/words.json` is the word bank (synonym pairs, opposite pairs and unrelated distractors).
- `src/config.js` holds section names, instructions, timings, penalties and length presets.
- `src/history.js` handles localStorage for attempts and settings, with every access wrapped in try/catch.
- `src/main.js` holds the UI, a hand-written state machine (home, section intro, practice, timed, results, history).
- `tests/generators.test.js` contains generator tests. Run them with `npm test`.

## Section rules

1. Reasoning. A statement compares two people. The person taps Next, the statement disappears, and a question appears with both names as options. Forms range from plain comparatives to negations, passive phrasing and double negatives (`REASONING_FORMS`).
2. Perceptual speed. Four columns, each with an uppercase letter over a lowercase letter. The person counts how many columns are the same letter (0 to 4).
3. Number speed and accuracy. Three numbers. The person finds the highest and the lowest, then picks whichever of those two is further from the middle number. Generate no ties.
4. Word meaning. Three words, two related (synonyms or opposites). The person picks the odd one out.
5. Spatial visualisation. Two pairs of figures. A pair matches if one figure is the other rotated, and does not match if one is mirrored. The person counts matching pairs (0 to 2). Shapes must have no mirror symmetry.

During a timed section there is no feedback, and each answer moves straight to the next item. The optional practice block (3 items) does give feedback.

## Rules for changes

- Keep it a static site with no backend, deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.
- Plain JavaScript with Vite. Add no framework unless it clearly earns its place.
- Every generator change needs a test proving that the answer is computed correctly and that no item is ambiguous.
- New word bank entries must pass the bank tests (no distractor appears in a pair) and should have exactly one defensible odd one out.
- Every results screen must state that the scores are raw practice scores and not official GIA results.
- Mobile first, keyboard operable (number keys answer, Enter advances), WCAG AA contrast in light and dark mode.
