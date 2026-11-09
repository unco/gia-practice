// Section timings in seconds. The full preset approximates the published GIA format
// (each section runs roughly 2 to 4 minutes, about 15 to 20 minutes in total).
// Penalties per wrong answer are the values prep providers report for official scoring,
// and are used here only for the adjusted practice score.
export const SECTIONS = [
  {
    key: 'reasoning',
    name: 'Reasoning',
    seconds: 240,
    penalty: 1,
    instructions: 'You see a statement comparing two people. Read it, then tap Next. The statement disappears and a question about it appears. Tap the right name.',
    example: 'Example: "Sam is not as heavy as Tom." Who is lighter? Sam.'
  },
  {
    key: 'perceptual',
    name: 'Perceptual speed',
    seconds: 240,
    penalty: 0.25,
    instructions: 'You see four columns, each with an uppercase letter above a lowercase letter. Count how many columns show the same letter, ignoring case.',
    example: 'Example: E over e, K over b, R over r, N over m. Two columns match.'
  },
  {
    key: 'number',
    name: 'Number speed and accuracy',
    seconds: 120,
    penalty: 0.5,
    instructions: 'You see three numbers. Find the highest and the lowest, then tap whichever of those two is further from the middle number.',
    example: 'Example: 5, 12, 30. The middle is 12, 5 is 7 away and 30 is 18 away, so tap 30.'
  },
  {
    key: 'word',
    name: 'Word meaning',
    seconds: 180,
    penalty: 0.5,
    instructions: 'You see three words. Two are related, either because they mean the same thing or because they are opposites. Tap the odd one out.',
    example: 'Example: up, down, street. Up and down are opposites, so tap street.'
  },
  {
    key: 'spatial',
    name: 'Spatial visualisation',
    seconds: 180,
    penalty: 0.5,
    instructions: 'You see two pairs of figures. A pair matches if one figure is the other turned around. A pair does not match if one figure is a mirror image. Count the matching pairs.',
    example: 'Example: if the top pair is the same figure rotated and the bottom pair is mirrored, the answer is 1.'
  }
];

export const PRESETS = {
  full: { label: 'Full length (about 16 minutes)', scale: 1 },
  short: { label: 'Short (1 minute per section)', fixed: 60 },
  half: { label: 'Half length (about 8 minutes)', scale: 0.5 }
};

export const PRACTICE_ITEMS = 3;

export function sectionSeconds(section, presetKey) {
  const p = PRESETS[presetKey] || PRESETS.full;
  return p.fixed ?? Math.round(section.seconds * p.scale);
}
