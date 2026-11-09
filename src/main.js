import './styles.css';
import { GENERATORS, SHAPES } from './generators.js';
import { SECTIONS, PRESETS, PRACTICE_ITEMS, sectionSeconds } from './config.js';
import { loadHistory, saveAttempt, clearHistory, loadSettings, saveSettings, scoreSection } from './history.js';

const app = document.getElementById('app');
const live = document.getElementById('live');

const state = {
  settings: loadSettings(),
  queue: [],
  index: 0,
  results: {},
  item: null,
  phase: 0,
  mode: 'timed',
  practiceLeft: 0,
  timerId: null,
  endsAt: 0,
  onKey: null
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const announce = (msg) => { live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 50); };

document.addEventListener('keydown', (e) => {
  if (state.onKey && !e.metaKey && !e.ctrlKey && !e.altKey) state.onKey(e);
});

function render(html, focusSelector) {
  state.onKey = null;
  app.innerHTML = html;
  const target = focusSelector && app.querySelector(focusSelector);
  if (target) target.focus();
}

function stopTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
}

/* Home */

function home() {
  stopTimer();
  const s = state.settings;
  const presetOptions = Object.entries(PRESETS)
    .map(([k, p]) => `<option value="${k}" ${k === s.preset ? 'selected' : ''}>${esc(p.label)}</option>`).join('');
  const sectionButtons = SECTIONS
    .map((sec, i) => `<button data-section="${i}">${esc(sec.name)}</button>`).join('');
  render(`
    <h1 tabindex="-1">GIA-style practice test</h1>
    <p class="muted">Five timed sections in the format of the Thomas GIA. Work quickly and accurately. During a timed section you get no feedback, and every answer moves you to the next item.</p>
    <div class="field">
      <label for="preset">Length</label>
      <select id="preset">${presetOptions}</select>
    </div>
    <div class="field">
      <label class="check"><input type="checkbox" id="practice" ${s.practice ? 'checked' : ''}> Practice items with feedback before each section</label>
    </div>
    <div class="row" style="margin-bottom:1.5rem">
      <button class="primary" id="start">Start full test</button>
      <button id="history">View history</button>
    </div>
    <h2>Practise one section</h2>
    <div class="row">${sectionButtons}</div>
    <p class="disclaimer">This is an independent practice tool. It does not use Thomas International's items or norms, and its scores are raw practice scores, not GIA results.</p>
  `, 'h1');
  const persist = () => {
    state.settings = { preset: app.querySelector('#preset').value, practice: app.querySelector('#practice').checked };
    saveSettings(state.settings);
  };
  app.querySelector('#preset').onchange = persist;
  app.querySelector('#practice').onchange = persist;
  app.querySelector('#start').onclick = () => begin(SECTIONS.map((_, i) => i));
  app.querySelector('#history').onclick = showHistory;
  app.querySelectorAll('[data-section]').forEach((b) => {
    b.onclick = () => begin([Number(b.dataset.section)]);
  });
}

function begin(queue) {
  state.queue = queue;
  state.index = 0;
  state.results = {};
  sectionIntro();
}

const currentSection = () => SECTIONS[state.queue[state.index]];

/* Section intro */

function sectionIntro() {
  stopTimer();
  const sec = currentSection();
  const secs = sectionSeconds(sec, state.settings.preset);
  const total = state.queue.length;
  const practice = state.settings.practice;
  render(`
    <div class="meta"><span>Section ${state.index + 1} of ${total}</span><span>${fmt(secs)}</span></div>
    <h2 tabindex="-1">${esc(sec.name)}</h2>
    <p>${esc(sec.instructions)}</p>
    <p class="muted">${esc(sec.example)}</p>
    <div class="row">
      ${practice ? `<button class="primary" id="practise">Try ${PRACTICE_ITEMS} practice items</button><button id="go">Skip to timed section</button>` : `<button class="primary" id="go">Begin timed section</button>`}
    </div>
    <p class="small" style="margin-top:1rem">Keyboard: press the number on the answer you want. Where the answers are words or larger numbers, press the small number in the corner of the option. Press Enter to move on from a reasoning statement.</p>
  `, 'h2');
  if (practice) app.querySelector('#practise').onclick = startPractice;
  app.querySelector('#go').onclick = startTimed;
}

/* Practice */

function startPractice() {
  state.mode = 'practice';
  state.practiceLeft = PRACTICE_ITEMS;
  nextItem();
}

function practiceDone() {
  render(`
    <h2 tabindex="-1">Practice done</h2>
    <p>The timed section starts when you are ready. From now on there is no feedback.</p>
    <div class="row"><button class="primary" id="go">Begin timed section</button><button id="again">More practice</button></div>
  `, 'h2');
  app.querySelector('#go').onclick = startTimed;
  app.querySelector('#again').onclick = startPractice;
}

/* Timed */

function startTimed() {
  const sec = currentSection();
  state.mode = 'timed';
  state.results[sec.key] = { correct: 0, attempted: 0 };
  const secs = sectionSeconds(sec, state.settings.preset);
  state.endsAt = Date.now() + secs * 1000;
  const announced = new Set();
  state.timerId = setInterval(() => {
    const left = remaining();
    const el = document.getElementById('timer');
    if (el) el.textContent = fmt(left);
    [60, 30, 10].forEach((m) => {
      if (left === m && !announced.has(m) && secs > m) { announced.add(m); announce(`${m} seconds left`); }
    });
    if (left <= 0) endSection();
  }, 250);
  nextItem();
}

const remaining = () => Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));

function endSection() {
  stopTimer();
  announce('Time is up');
  state.index++;
  if (state.index < state.queue.length) sectionIntro();
  else results();
}

/* Items */

function nextItem() {
  state.item = GENERATORS[currentSection().key]();
  state.phase = 0;
  drawItem();
}

function header() {
  const sec = currentSection();
  const right = state.mode === 'practice'
    ? `<span class="badge">Practice ${PRACTICE_ITEMS - state.practiceLeft + 1} of ${PRACTICE_ITEMS}</span>`
    : `<span class="timer" id="timer" aria-label="Time left">${fmt(remaining())}</span>`;
  return `<div class="meta"><span>${esc(sec.name)}</span>${right}</div>`;
}

function figure({ shape, rotation, mirrored }) {
  const t = `rotate(${rotation} 50 50)${mirrored ? ' translate(100 0) scale(-1 1)' : ''}`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><path transform="${t}" d="${SHAPES[shape]}"/></svg>`;
}

function itemBody(item) {
  switch (item.type) {
    case 'reasoning':
      return `<p class="big" id="prompt">${esc(item.question)}</p>`;
    case 'perceptual':
      return `<div class="letters" aria-hidden="true">${item.columns.map(([u, l]) => `<div><span>${u}</span><span>${l}</span></div>`).join('')}</div>
        <p class="sr-only" id="prompt">Columns: ${item.columns.map(([u, l]) => `${u} over ${l}`).join(', ')}.</p>
        <p class="hint">How many columns match?</p>`;
    case 'number':
      return `<p class="numbers" id="prompt">${item.numbers.map((n) => `<span>${n}</span>`).join('')}</p>
        <p class="hint">Highest or lowest: which is further from the middle number?</p>`;
    case 'word':
      return `<p class="big muted" id="prompt" style="font-size:16px">Which word is the odd one out?</p>`;
    case 'spatial':
      return `<div class="figures">${item.pairs.map((p) => `<div class="figure-pair">${figure(p[0])}${figure(p[1])}</div>`).join('')}</div>
        <p class="hint" id="prompt">How many pairs match?</p>`;
    default:
      return '';
  }
}

function drawItem() {
  const item = state.item;
  if (item.type === 'reasoning' && state.phase === 0) {
    render(`${header()}<p class="big">${esc(item.statement)}</p>
      <button class="primary" id="next" style="width:100%">Next <span class="small" style="color:inherit">(Enter)</span></button>`, '#next');
    const go = () => { state.phase = 1; drawItem(); };
    app.querySelector('#next').onclick = go;
    state.onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    return;
  }
  const digitLabels = item.options.every((o) => /^\d$/.test(o));
  const opts = item.options.map((o, i) => `<button data-o="${esc(o)}">${digitLabels ? '' : `<kbd aria-hidden="true">${i + 1}</kbd>`}${esc(o)}</button>`).join('');
  render(`${header()}${itemBody(item)}<div class="options" role="group" aria-labelledby="prompt">${opts}</div>`, '.options button');
  const buttons = [...app.querySelectorAll('[data-o]')];
  buttons.forEach((b) => { b.onclick = () => answer(b.dataset.o); });
  state.onKey = (e) => {
    if (digitLabels) {
      if (item.options.includes(e.key)) { e.preventDefault(); answer(e.key); }
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= buttons.length) { e.preventDefault(); answer(buttons[n - 1].dataset.o); }
  };
}

function answer(choice) {
  const item = state.item;
  const correct = choice === item.answer;
  if (state.mode === 'timed') {
    if (remaining() <= 0) return;
    const r = state.results[currentSection().key];
    r.attempted++;
    if (correct) r.correct++;
    nextItem();
    return;
  }
  state.onKey = null;
  app.querySelectorAll('[data-o]').forEach((b) => { b.disabled = true; });
  const fb = document.createElement('div');
  fb.className = `feedback ${correct ? 'ok' : 'no'}`;
  fb.setAttribute('role', 'status');
  fb.innerHTML = `${correct ? 'Correct.' : `Not quite. The answer is ${esc(item.answer)}.`} ${esc(explain(item))}`;
  const btn = document.createElement('button');
  btn.className = 'primary';
  btn.style.marginTop = '1rem';
  btn.textContent = 'Continue';
  app.append(fb, btn);
  btn.focus();
  btn.onclick = () => {
    state.practiceLeft--;
    if (state.practiceLeft > 0) nextItem();
    else practiceDone();
  };
}

function explain(item) {
  switch (item.type) {
    case 'reasoning': {
      const { w, l, d } = item.meta;
      return `"${item.statement}" means ${w} is ${d.more} and ${l} is ${d.less}.`;
    }
    case 'perceptual': {
      const m = item.columns.filter(([u, l]) => u.toLowerCase() === l).map(([u]) => u);
      return m.length ? `Matching columns: ${m.join(', ')}.` : 'No column matches.';
    }
    case 'number': {
      const [lo, mid, hi] = item.numbers.slice().sort((a, b) => a - b);
      return `The middle is ${mid}. ${lo} is ${mid - lo} away and ${hi} is ${hi - mid} away.`;
    }
    case 'word':
      return `${item.meta.pair[0]} and ${item.meta.pair[1]} are related.`;
    case 'spatial': {
      const desc = item.pairs.map(([a, b], i) => `${i === 0 ? 'Top' : 'Bottom'} pair ${a.mirrored === b.mirrored ? 'matches' : 'is mirrored'}`);
      return `${desc.join('. ')}.`;
    }
    default:
      return '';
  }
}

/* Results */

function results() {
  const sections = state.queue.map((i) => {
    const sec = SECTIONS[i];
    return { key: sec.key, name: sec.name, seconds: sectionSeconds(sec, state.settings.preset), ...scoreSection(state.results[sec.key], sec.penalty) };
  });
  const totals = sections.reduce((t, s) => ({ c: t.c + s.correct, a: t.a + s.attempted, adj: t.adj + s.adjusted }), { c: 0, a: 0, adj: 0 });
  saveAttempt({ date: new Date().toISOString(), preset: state.settings.preset, sections });
  const rows = sections.map((s) => `<tr><td>${esc(s.name)}</td><td class="num">${s.correct}/${s.attempted}</td><td class="num">${s.accuracy}%</td><td class="num">${s.adjusted}</td></tr>`).join('');
  render(`
    <h2 tabindex="-1">Results</h2>
    <div class="stats">
      <div class="stat"><div class="label">Correct</div><div class="value">${totals.c}</div></div>
      <div class="stat"><div class="label">Accuracy</div><div class="value">${totals.a ? Math.round((totals.c / totals.a) * 100) : 0}%</div></div>
    </div>
    <table>
      <thead><tr><th>Section</th><th class="num">Correct</th><th class="num">Accuracy</th><th class="num">Adjusted</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="small">Adjusted subtracts a penalty for each wrong answer (1 for reasoning, 0.25 for perceptual speed, 0.5 for the rest), matching how prep providers describe official scoring. Guessing lowers this score.</p>
    <div class="row"><button class="primary" id="home">Back to start</button><button id="history">View history</button></div>
    <p class="disclaimer">These are raw practice scores. They are not official GIA results and do not map to Thomas International norms or percentiles.</p>
  `, 'h2');
  app.querySelector('#home').onclick = home;
  app.querySelector('#history').onclick = showHistory;
}

/* History */

function sparkline(values) {
  if (values.length < 2) return '';
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [Math.round((i / (values.length - 1)) * 290) + 5, Math.round(43 - (v / max) * 38)]);
  return `<svg class="spark" viewBox="0 0 300 48" preserveAspectRatio="none" aria-hidden="true">
    <polyline points="${pts.map((p) => p.join(',')).join(' ')}"/>
    ${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</svg>`;
}

function showHistory() {
  const all = loadHistory();
  const perSection = SECTIONS.map((sec) => {
    const runs = all.flatMap((a) => a.sections.filter((s) => s.key === sec.key));
    const rate = runs.map((s) => Math.round((s.correct / (s.seconds / 60)) * 10) / 10);
    const best = rate.length ? Math.max(...rate) : null;
    const last = runs.at(-1);
    return { sec, runs, rate, best, last };
  });
  const sectionBlocks = perSection.map(({ sec, runs, rate, best, last }) => runs.length ? `
    <h2>${esc(sec.name)}</h2>
    <p class="small">${runs.length} run${runs.length === 1 ? '' : 's'}. Last ${last.correct}/${last.attempted} (${last.accuracy}%). Best ${best} correct per minute.</p>
    ${sparkline(rate.slice(-15))}
    <p class="sr-only">Correct per minute over recent runs: ${rate.slice(-15).join(', ')}.</p>` : '').join('');
  const recent = all.slice(-10).reverse().map((a) => {
    const c = a.sections.reduce((t, s) => t + s.correct, 0);
    const at = a.sections.reduce((t, s) => t + s.attempted, 0);
    const d = new Date(a.date);
    const name = a.sections.length === 1 ? a.sections[0].name : 'Full test';
    return `<tr><td>${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td>${esc(name)}</td><td class="num">${c}/${at}</td><td class="num">${at ? Math.round((c / at) * 100) : 0}%</td></tr>`;
  }).join('');
  render(`
    <h1 tabindex="-1">History</h1>
    ${all.length ? `
      <p class="muted">The trend lines show correct answers per minute, so runs of different lengths compare fairly. History stays in this browser only.</p>
      ${sectionBlocks}
      <h2>Recent attempts</h2>
      <table><thead><tr><th>Date</th><th>Test</th><th class="num">Correct</th><th class="num">Accuracy</th></tr></thead><tbody>${recent}</tbody></table>
      <div class="row"><button class="primary" id="home">Back to start</button><button id="clear">Clear history</button></div>
    ` : `<p class="muted">No attempts yet. Your results appear here after each test.</p><button class="primary" id="home">Back to start</button>`}
  `, 'h1');
  app.querySelector('#home').onclick = home;
  const clear = app.querySelector('#clear');
  if (clear) clear.onclick = () => {
    if (clear.dataset.confirm) { clearHistory(); showHistory(); return; }
    clear.dataset.confirm = '1';
    clear.textContent = 'Tap again to clear';
  };
}

home();
