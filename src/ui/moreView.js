import { h, setText } from './dom.js';
import { formatDuration, formatNumber } from '../core/format.js';

export function createMoreView({ game, actions, debug }) {
  const stats = h('div', { class: 'stat-block' });
  const save = h('section', { class: 'panel' },
    h('h2', {}, 'Your save'),
    h('p', { class: 'lede' }, 'Progress saves on this device automatically. Copy a save code to back it up or move it to another device.'),
    h('div', { class: 'foot' },
      h('button', { type: 'button', onclick: () => actions.exportSave() }, 'Copy save code'),
      h('button', { type: 'button', onclick: () => actions.importSave() }, 'Load save code'),
      h('button', { type: 'button', onclick: () => actions.resetSave() }, 'Start over')));

  const panels = [h('section', { class: 'panel' }, h('h2', {}, 'Stats'), stats), save];

  if (debug) {
    const dev = h('div', { class: 'foot' });
    for (const [label, n] of [['+1K', 1e3], ['+1M', 1e6], ['+1B', 1e9], ['+1T', 1e12], ['+1Qa', 1e15], ['+1Sx', 1e21]]) {
      dev.append(h('button', { class: 'dev', type: 'button', onclick: () => actions.cheat(n) }, label));
    }
    for (const [label, sec] of [['Away 1h', 3600], ['Away 12h', 12 * 3600]]) {
      dev.append(h('button', { class: 'dev', type: 'button', onclick: () => actions.cheatAway(sec) }, label));
    }
    dev.append(h('button', { class: 'dev', type: 'button', onclick: () => actions.cheatPoints(10) }, '+10 managers'));
    dev.append(h('button', { class: 'dev', type: 'button', onclick: () => actions.cheatGems(20) }, '+20 gems'));
    panels.push(h('section', { class: 'panel' }, h('h2', {}, 'Debug'), dev));
  }
  panels.push(h('div', { class: 'version' }, 'Tinker Town Factory v0.3 · parts 0–6'));

  const el = h('div', { class: 'view' }, ...panels);

  function render() {
    const s = game.state;
    const line = (a, b) => h('div', { class: 'stat-row' }, h('span', {}, a), h('b', {}, b));
    const key = [s.lifetimeCoins, s.stats.taps, s.prestige.count, Math.floor(s.stats.playSeconds / 10), s.stats.offlineCoins].join('|');
    if (stats._k === key) return;
    stats._k = key;
    stats.replaceChildren(
      line('Earned in total', formatNumber(s.lifetimeCoins)),
      line('Earned while away', formatNumber(s.stats.offlineCoins)),
      line('Times prestiged', String(s.prestige.count)),
      line('Taps', formatNumber(s.stats.taps)),
      line('Time played', formatDuration(s.stats.playSeconds)));
  }

  return { el, render };
}
