import { WING_BY_ID } from '../data/machines.js';
import { formatNumber, formatDuration } from '../core/format.js';
import { incomePerSecond } from '../systems/economy.js';
import { canPrestige } from '../systems/prestige.js';
import { claimableQuests, dailyStatus } from '../systems/meta.js';
import { h, setText, setAttr } from './dom.js';
import { createFactoryView } from './factoryView.js';
import { createManagersView } from './managersView.js';
import { createMoreView } from './moreView.js';
import { createRewardsView } from './rewardsView.js';
import { createShopView } from './shopView.js';

const TABS = [
  { id: 'factory', label: 'Factory' },
  { id: 'managers', label: 'Managers' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'shop', label: 'Shop' },
  { id: 'more', label: 'More' },
];

/**
 * game:    { state }  (a holder, so the state can be swapped on import/reset)
 * actions: see main.js
 */
export function createUI(root, game, actions, { debug = false } = {}) {
  let tab = 'factory';
  let app, coinsEl, gemsEl, rateEl, views, navBtns, managersDot, rewardsDot, wingShown = '';
  let toastTimer = 0;

  function build() {
    root.replaceChildren();
    views = {
      factory: createFactoryView({ game, actions }),
      managers: createManagersView({ game, actions }),
      rewards: createRewardsView({ game, actions }),
      shop: createShopView({ game, actions }),
      more: createMoreView({ game, actions, debug }),
    };

    coinsEl = h('div', { class: 'coins' }, '0');
    rateEl = h('div', { class: 'rate', hidden: true });
    gemsEl = h('div', { class: 'gems', 'aria-label': 'Gems' }, '0 ◆');
    const top = h('header', { class: 'top' },
      h('div', { class: 'brand' }, 'Tinker Town Factory'),
      h('div', { class: 'coins-row' }, coinsEl, rateEl, gemsEl));

    const content = h('div', { class: 'content' });
    for (const t of TABS) { views[t.id].el.hidden = t.id !== tab; content.append(views[t.id].el); }

    managersDot = h('i', { class: 'dot', hidden: true });
    rewardsDot = h('i', { class: 'dot', hidden: true });
    navBtns = {};
    const nav = h('nav', { class: 'nav', 'aria-label': 'Sections' });
    for (const t of TABS) {
      const b = h('button', { type: 'button', class: 'nav-btn', onclick: () => select(t.id) }, t.label);
      if (t.id === 'managers') b.append(managersDot);
      if (t.id === 'rewards') b.append(rewardsDot);
      navBtns[t.id] = b;
      nav.append(b);
    }

    app = h('main', { class: 'app' }, top, content, nav);
    root.append(app);
    wingShown = '';
  }

  function select(id) {
    tab = id;
    for (const t of TABS) views[t.id].el.hidden = t.id !== id;
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    const s = game.state;
    setText(coinsEl, formatNumber(s.coins));
    const ips = incomePerSecond(s);
    rateEl.hidden = ips <= 0;
    if (ips > 0) setText(rateEl, `+${formatNumber(ips)}/s`);

    const wing = WING_BY_ID[s.settings.wing];
    if (wing && wingShown !== wing.id) {
      app.style.setProperty('--paper', wing.paper);
      wingShown = wing.id;
    }

    for (const t of TABS) setAttr(navBtns[t.id], 'aria-current', t.id === tab ? 'page' : 'false');
    managersDot.hidden = !canPrestige(s);
    setText(gemsEl, `${s.gems} ◆`);
    rewardsDot.hidden = !(dailyStatus(s).claimable || claimableQuests(s) > 0);

    views[tab].render();
  }

  function onProduce(id, amount) {
    if (tab === 'factory') views.factory.onProduce(id, amount);
  }

  function toast(message) {
    let t = root.querySelector('.toast');
    if (!t) { t = h('div', { class: 'toast', role: 'status' }); root.append(t); }
    t.textContent = message;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  /** "While you were away" dialog. */
  function showWelcome(away, capSeconds) {
    const existing = root.querySelector('.modal');
    if (existing) existing.remove();
    const close = () => modal.remove();
    const btn = h('button', { class: 'primary', type: 'button', onclick: close }, 'Nice');
    const modal = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'wb-title' },
      h('div', { class: 'modal-card' },
        h('h2', { id: 'wb-title' }, 'Welcome back'),
        h('p', {}, `You were away for ${formatDuration(away.rawSeconds)}.`),
        h('div', { class: 'big' }, `+${formatNumber(away.coins)}`),
        h('p', { class: 'lede' }, away.capped
          ? `Your machines work for up to ${formatDuration(capSeconds)} while you are away.`
          : 'Your automated machines kept working while you were gone.'),
        btn));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    root.append(modal);
    btn.focus();
  }

  build();
  render();
  return { render, onProduce, toast, showWelcome, rebuild: () => { build(); render(); } };
}
