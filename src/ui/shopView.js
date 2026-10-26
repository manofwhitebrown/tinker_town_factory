import { GEM_SHOP, SHIELD } from '../data/meta.js';
import { formatDuration } from '../core/format.js';
import { gemShopLevel } from '../systems/economy.js';
import { gemItemCost } from '../systems/meta.js';
import { h, setText, setDisabled } from './dom.js';

export function createShopView({ game, actions }) {
  const gemsBig = h('div', { class: 'big' });
  const rows = {};
  const shop = h('section', { class: 'panel' },
    h('h2', {}, 'Gem shop'),
    h('p', { class: 'lede' }, 'Gems come from daily rewards, quests and achievements.'),
    gemsBig);

  for (const item of GEM_SHOP) {
    const r = {};
    r.name = h('span', { class: 'up-name' }, item.name);
    r.lvl = h('span', { class: 'up-lvl' });
    r.desc = h('div', { class: 'up-desc' });
    r.btn = h('button', { class: 'up-buy', type: 'button', onclick: () => actions.buyGem(item.id) });
    r.root = h('div', { class: 'up' },
      h('div', { class: 'up-text' }, h('div', { class: 'up-head' }, r.name, r.lvl), r.desc), r.btn);
    rows[item.id] = r;
    shop.append(r.root);
  }

  const el = h('div', { class: 'view' }, shop);

  function render() {
    const s = game.state;
    setText(gemsBig, `${s.gems} ◆`);
    for (const item of GEM_SHOP) {
      const r = rows[item.id];
      const cost = gemItemCost(s, item.id);
      if (item.kind === 'permanent') {
        const lvl = gemShopLevel(s, item.id);
        setText(r.lvl, `Lv ${lvl}/${item.max}`);
        setText(r.desc, cost === null
          ? `${item.describe(lvl)} (max)`
          : `${item.describe(lvl)} → ${item.describe(lvl + 1)}`);
        setText(r.btn, cost === null ? 'Maxed' : `${cost} ◆`);
      } else {
        const left = item.id === 'boost' ? s.buffs.boost : 0;
        setText(r.lvl, item.id === 'shield' ? `${s.daily.shields || 0}/${SHIELD.max} held` : left > 0 ? `${formatDuration(left)} left` : '');
        setText(r.desc, item.describe());
        setText(r.btn, cost === null ? 'Full' : `${cost} ◆`);
      }
      setDisabled(r.btn, cost === null || s.gems < cost);
    }
  }

  return { el, render };
}
