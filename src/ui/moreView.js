import { h, setText } from './dom.js';
import { formatDuration, formatNumber } from '../core/format.js';
import { CREDIT } from './guideView.js';

const TOGGLES = [
  ['muted', 'Mute all sound', 'Silences sound effects and music.'],
  ['sfx', 'Sound effects', 'Taps, purchases and rewards.'],
  ['music', 'Music', 'A soft background tune.'],
  ['largeText', 'Large text', 'Bigger words and numbers.'],
  ['colorblind', 'Colorblind-friendly', 'Safer machine colors and a plain background.'],
  ['reduceMotion', 'Reduce motion', 'Turns off particles and wiggles.'],
];

export function createMoreView({ game, actions }) {
  const switches = {};
  const settings = h('section', { class: 'panel' }, h('h2', {}, 'Settings'));
  for (const [key, name, desc] of TOGGLES) {
    const btn = h('button', {
      class: 'switch', type: 'button', role: 'switch', 'aria-checked': 'false', 'aria-label': name,
      onclick: () => actions.setSetting(key, !game.state.settings[key]),
    }, h('i'));
    switches[key] = btn;
    settings.append(h('div', { class: 'up' },
      h('div', { class: 'up-text' }, h('div', { class: 'up-name' }, name), h('div', { class: 'up-desc' }, desc)), btn));
  }
  settings.append(h('div', { class: 'foot', style: 'margin-top:12px' },
    h('button', { type: 'button', onclick: () => actions.tutorialReplay() }, 'Replay tutorial')));

  const stats = h('div', { class: 'stat-block' });
  const save = h('section', { class: 'panel' },
    h('h2', {}, 'Your save'),
    h('p', { class: 'lede' }, 'Progress saves on this device automatically. Copy a save code to back it up or move it to another device.'),
    h('div', { class: 'foot' },
      h('button', { type: 'button', onclick: () => actions.exportSave() }, 'Copy save code'),
      h('button', { type: 'button', onclick: () => actions.importSave() }, 'Load save code'),
      h('button', { type: 'button', onclick: () => actions.resetSave() }, 'Start over')));

  const panels = [settings, h('section', { class: 'panel' }, h('h2', {}, 'Stats'), stats), save];

  // ---- cheats: hidden behind a password ----
  const pass = h('input', {
    class: 'text-input', type: 'password', placeholder: 'Password', 'aria-label': 'Cheat password',
    autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false',
    onkeydown: (e) => { if (e.key === 'Enter') submit(); },
  });
  function submit() {
    const ok = actions.unlockCheats(pass.value);
    if (ok) pass.value = '';
  }
  const lockedBox = h('div', {},
    h('p', { class: 'lede' }, 'Enter the password to unlock the cheat buttons.'),
    h('div', { class: 'pass-row' }, pass,
      h('button', { class: 'pass-go', type: 'button', onclick: submit }, 'Unlock')));

  const dev = h('div', { class: 'foot' });
  const coinCheats = [['+1K', 1e3], ['+1M', 1e6], ['+1B', 1e9], ['+1T', 1e12], ['+1Qa', 1e15], ['+1Sx', 1e21],
    ['+1Dc', 1e33], ['+1e40', 1e40]];
  for (const [label, n] of coinCheats) {
    dev.append(h('button', { class: 'dev', type: 'button', onclick: () => actions.cheat(n) }, label));
  }
  for (const [label, sec] of [['Away 1h', 3600], ['Away 12h', 12 * 3600]]) {
    dev.append(h('button', { class: 'dev', type: 'button', onclick: () => actions.cheatAway(sec) }, label));
  }
  dev.append(h('button', { class: 'dev', type: 'button', onclick: () => actions.cheatPoints(10) }, '+10 managers'));
  dev.append(h('button', { class: 'dev', type: 'button', onclick: () => actions.cheatGems(20) }, '+20 gems'));
  dev.append(h('button', { class: 'dev', type: 'button', onclick: () => actions.cheatGems(500) }, '+500 gems'));
  dev.append(h('button', { class: 'dev', type: 'button', onclick: () => actions.cheatWings() }, 'Open all wings'));
  dev.append(h('button', { class: 'dev', type: 'button', onclick: () => actions.cheatAutomate() }, 'Automate all'));
  const openBox = h('div', {}, h('p', { class: 'lede' }, 'Cheats are unlocked. These change your save for real.'), dev,
    h('div', { class: 'foot', style: 'margin-top:12px' },
      h('button', { type: 'button', onclick: () => actions.lockCheats() }, 'Lock cheats')));

  const cheatTitle = h('h2', {}, 'Cheats');
  panels.push(h('section', { class: 'panel' }, cheatTitle, lockedBox, openBox));
  panels.push(h('div', { class: 'version' }, 'Tinker Town Factory v0.6'));
  panels.push(h('div', { class: 'credit' }, h('b', {}, 'Tinker Town Factory'), h('span', {}, `A game by ${CREDIT}.`)));

  const el = h('div', { class: 'view' }, ...panels);

  function render() {
    const s = game.state;
    const cheatsOn = actions.cheatsUnlocked();
    lockedBox.hidden = cheatsOn;
    openBox.hidden = !cheatsOn;
    for (const [key] of TOGGLES) {
      const on = String(!!s.settings[key]);
      if (switches[key].getAttribute('aria-checked') !== on) switches[key].setAttribute('aria-checked', on);
    }
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
