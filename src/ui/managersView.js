import { PRESTIGE, UPGRADES } from '../data/prestige.js';
import { formatNumber } from '../core/format.js';
import { upgradeLevel } from '../systems/economy.js';
import { coinsForNextPoint, pendingPoints, upgradeCost } from '../systems/prestige.js';
import { h, setText, setDisabled } from './dom.js';

export function createManagersView({ game, actions }) {
  const big = h('div', { class: 'big' });
  const stats = h('div', { class: 'stat-line' });
  const hint = h('div', { class: 'hint-line' });
  const go = h('button', { class: 'primary', type: 'button', onclick: () => actions.prestige() }, 'Reopen the factory');

  const prestigePanel = h('section', { class: 'panel' },
    h('h2', {}, 'Managers'),
    h('p', { class: 'lede' },
      'Close the factory and hire managers. Coins and machines reset. Managers, upgrades, open wings and your lifetime total stay.'),
    big, stats, go, hint);

  const rows = {};
  const shop = h('section', { class: 'panel' }, h('h2', {}, 'Manager upgrades'));
  for (const u of UPGRADES) {
    const r = {};
    r.name = h('span', { class: 'up-name' }, u.name);
    r.lvl = h('span', { class: 'up-lvl' });
    r.desc = h('div', { class: 'up-desc' });
    r.btn = h('button', { class: 'up-buy', type: 'button', onclick: () => actions.upgrade(u.id) });
    r.root = h('div', { class: 'up' },
      h('div', { class: 'up-text' }, h('div', { class: 'up-head' }, r.name, r.lvl), r.desc), r.btn);
    rows[u.id] = r;
    shop.append(r.root);
  }

  const el = h('div', { class: 'view' }, prestigePanel, shop);

  function render() {
    const s = game.state;
    const pending = pendingPoints(s);
    const p = s.prestige;

    setText(big, `+${formatNumber(pending)} ${pending === 1 ? 'manager' : 'managers'}`);
    setText(stats, `${formatNumber(p.points)} to spend · ${formatNumber(p.totalPoints)} hired · +${Math.round(p.totalPoints * PRESTIGE.bonusPerPoint * 100)}% income`);
    setText(go, pending >= 1 ? `Reopen the factory (+${formatNumber(pending)})` : 'Reopen the factory');
    setDisabled(go, pending < 1);
    setText(hint, pending < 1
      ? `Earn ${formatNumber(PRESTIGE.divisor)} coins in one run to hire your first manager. This run: ${formatNumber(s.runCoins)}.`
      : `Next manager at ${formatNumber(coinsForNextPoint(s))} coins this run (now ${formatNumber(s.runCoins)}).`);

    for (const u of UPGRADES) {
      const r = rows[u.id];
      const lvl = upgradeLevel(s, u.id);
      const cost = upgradeCost(s, u.id);
      setText(r.lvl, `Lv ${lvl}/${u.max}`);
      setText(r.desc, cost === null
        ? `${u.describe(lvl, formatNumber)} (max)`
        : `${u.describe(lvl, formatNumber)} → ${u.describe(lvl + 1, formatNumber)}`);
      setText(r.btn, cost === null ? 'Maxed' : `${formatNumber(cost)} mgr`);
      setDisabled(r.btn, cost === null || p.points < cost);
    }
  }

  return { el, render };
}
