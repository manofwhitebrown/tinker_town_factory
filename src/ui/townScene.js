import { WINGS } from '../data/machines.js';
import { busyWings, sunPosition, townPhase } from '../systems/townclock.js';
import { h } from './dom.js';

// One building per wing. Each is drawn in a 50-wide slot, its base on the ground line (y = 86).
// Colors come from --b (set per building); windows use --win so they light up at night.
const BUILDINGS = {
  cloth: { color: '#d6455d', smoke: [40.5, 34], art: `
    <polygon class="body" points="6,56 6,46 16,56 16,46 26,56 26,46 36,56 36,46 44,56 44,86 6,86"/>
    <rect class="body" x="37" y="36" width="6" height="22"/>
    <rect class="win" x="10" y="64" width="6" height="6"/><rect class="win" x="22" y="64" width="6" height="6"/><rect class="win" x="34" y="64" width="6" height="6"/>` },
  toys: { color: '#e0592a', smoke: [37.5, 42], art: `
    <rect class="body" x="6" y="60" width="38" height="26"/>
    <polygon class="body" points="3,60 25,38 47,60"/>
    <rect class="body" x="33" y="44" width="5" height="12"/>
    <rect class="win" x="11" y="66" width="8" height="8"/><rect class="win" x="30" y="66" width="8" height="8"/>
    <rect class="body" x="20" y="48" width="9" height="9"/>` },
  gadgets: { color: '#55688a', smoke: [42, 46], art: `
    <rect class="body" x="4" y="62" width="42" height="24"/>
    <rect class="body" x="2" y="58" width="46" height="5"/>
    <rect class="body" x="40" y="48" width="4" height="11"/>
    <circle class="body" cx="22" cy="49" r="7"/><circle class="win" cx="22" cy="49" r="2.5"/>
    <rect class="win" x="13" y="70" width="24" height="16"/>` },
  candy: { color: '#e0457b', smoke: [38, 44], art: `
    <rect class="body" x="8" y="58" width="34" height="28"/>
    <polygon class="body" points="5,58 25,40 45,58"/>
    <rect class="body" x="34" y="46" width="5" height="10"/>
    <circle class="body" cx="25" cy="38" r="3.5"/>
    <rect class="win" x="13" y="66" width="8" height="8"/><rect class="win" x="29" y="66" width="8" height="8"/>` },
  clock: { color: '#8a5a2b', art: `
    <rect class="body" x="14" y="34" width="22" height="52"/>
    <polygon class="body" points="11,34 25,18 39,34"/>
    <circle cx="25" cy="46" r="8" fill="#fff" stroke="var(--ink)" stroke-width="1.5"/>
    <path d="M25 46v-5M25 46l4 2" stroke="var(--ink)" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <rect class="win" x="21" y="62" width="8" height="8"/>` },
  sky: { color: '#1f78b4', art: `
    <rect class="body" x="8" y="72" width="34" height="14"/>
    <path d="M25 72V40" stroke="var(--ink)" stroke-width="2"/>
    <g class="balloon"><ellipse class="body" cx="25" cy="30" rx="12" ry="14"/><path d="M15 38L22 50M35 38L28 50" stroke="var(--ink)" stroke-width="1"/><rect class="body" x="21" y="49" width="8" height="5"/></g>
    <rect class="win" x="14" y="76" width="7" height="6"/><rect class="win" x="29" y="76" width="7" height="6"/>` },
  star: { color: '#7b4fc9', art: `
    <rect class="body" x="10" y="62" width="30" height="24"/>
    <path class="body" d="M10 62A15 15 0 0 1 40 62Z"/>
    <path d="M25 48v14" stroke="var(--b2)" stroke-width="4"/>
    <path d="M30 52l12-10" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>
    <circle class="spark" cx="44" cy="38" r="2"/><rect class="win" x="21" y="70" width="8" height="16"/>` },
};

const STARS = [[24, 14], [58, 28], [96, 10], [140, 22], [188, 12], [226, 30], [262, 16], [300, 34], [340, 12], [118, 36]];

function buildSvg() {
  let slots = '';
  WINGS.forEach((w, i) => {
    const b = BUILDINGS[w.id];
    const puffs = b.smoke
      ? [0, 1, 2].map((k) => `<circle class="puff" cx="${b.smoke[0]}" cy="${b.smoke[1]}" r="3" style="animation-delay:${k * 1.1}s"/>`).join('')
      : '';
    slots += `<g class="bld locked" data-wing="${w.id}" role="button" tabindex="-1" aria-label="${w.name}" transform="translate(${5 + i * 50},0)" style="--b:${b.color}">
      <title>${w.name}</title>${b.art}${puffs}<path class="pin" d="M25 10l-5-7h10z"/></g>`;
  });
  const stars = STARS.map(([x, y], i) => `<circle class="star" cx="${x}" cy="${y}" r="1.2" style="animation-delay:${(i % 5) * 0.4}s"/>`).join('');
  return `<svg viewBox="0 0 360 100" preserveAspectRatio="xMidYMax slice" aria-label="Tinker Town skyline">
    <defs><linearGradient id="townSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sky1)"/><stop offset="1" style="stop-color:var(--sky2)"/></linearGradient></defs>
    <rect width="360" height="100" fill="url(#townSky)"/>
    ${stars}
    <circle class="sun" r="8"/>
    <g class="moon"><circle cx="312" cy="22" r="8"/><circle cx="316" cy="19" r="7" style="fill:var(--sky1)"/></g>
    <g class="cloud"><ellipse cx="60" cy="24" rx="16" ry="5"/><ellipse cx="72" cy="20" rx="10" ry="5"/></g>
    <g class="cloud slow"><ellipse cx="220" cy="34" rx="14" ry="4"/><ellipse cx="230" cy="31" rx="9" ry="4"/></g>
    <rect class="ground" y="86" width="360" height="14"/>
    ${slots}
    <g class="walker"><rect x="0" y="76" width="9" height="8" rx="2.5" fill="#fff" stroke="var(--ink)" stroke-width="1.4"/><circle cx="2.8" cy="79.5" r="1" fill="var(--ink)"/><circle cx="6.2" cy="79.5" r="1" fill="var(--ink)"/><path d="M2 84v2M7 84v2" stroke="var(--ink)" stroke-width="1.4"/><path d="M4.5 76v-3" stroke="var(--ink)" stroke-width="1.2"/><circle cx="4.5" cy="72.6" r="1.1" fill="var(--coin)"/></g>
  </svg>`;
}

/**
 * The little living town at the top of the Factory. It reflects your game:
 * a building for each open wing, chimney smoke where machines run on their own,
 * the real time of day outside, and a Tinker Bot strolling along. Tap a building to visit that wing.
 */
export function createTownScene({ onPick }) {
  const el = h('div', { class: 'town', 'data-phase': 'day', html: buildSvg() });
  const bld = {};
  for (const w of WINGS) bld[w.id] = el.querySelector(`[data-wing="${w.id}"]`);
  const sun = el.querySelector('.sun');

  const pick = (target) => {
    const g = target.closest && target.closest('[data-wing]');
    if (g && !g.classList.contains('locked')) onPick(g.dataset.wing);
  };
  // Stop a tap from leaving a focus box on the building (keyboard users still get one via Tab).
  el.addEventListener('mousedown', (e) => e.preventDefault());
  el.addEventListener('click', (e) => pick(e.target));
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e.target); }
  });

  let last = '';
  function update(state, now, wingId) {
    const hour = new Date(now).getHours();
    const busy = busyWings(state);
    const sig = [townPhase(hour), hour, wingId, WINGS.map((w) => (state.wings[w.id] ? 1 : 0) + (busy[w.id] ? 'b' : '')).join(',')].join('|');
    if (sig === last) return;
    last = sig;
    el.dataset.phase = townPhase(hour);
    const p = sunPosition(hour);
    sun.setAttribute('cx', p.x);
    sun.setAttribute('cy', p.y);
    for (const w of WINGS) {
      const g = bld[w.id];
      const open = !!state.wings[w.id];
      g.classList.toggle('locked', !open);
      g.classList.toggle('busy', open && busy[w.id]);
      g.classList.toggle('sel', open && w.id === wingId);
      g.setAttribute('tabindex', open ? '0' : '-1');
    }
  }

  return { el, update };
}
