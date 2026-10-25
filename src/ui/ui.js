import { WING_BY_ID, MACHINE_BY_ID } from '../data/machines.js';
import { TUTORIAL_STEPS } from '../data/tutorial.js';
import { formatNumber, formatDuration } from '../core/format.js';
import { incomePerSecond } from '../systems/economy.js';
import { canPrestige } from '../systems/prestige.js';
import { claimableQuests, dailyStatus } from '../systems/meta.js';
import { currentStep, tutorialActive } from '../systems/tutorial.js';
import { h, setText, setAttr } from './dom.js';
import { createFx } from './fx.js';
import { createFactoryView } from './factoryView.js';
import { createGuideView } from './guideView.js';
import { createManagersView } from './managersView.js';
import { createMoreView } from './moreView.js';
import { createRewardsView } from './rewardsView.js';
import { createShopView } from './shopView.js';

const TABS = [
  { id: 'factory', label: 'Factory' },
  { id: 'managers', label: 'Managers' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'shop', label: 'Shop' },
  { id: 'guide', label: 'Guide' },
  { id: 'more', label: 'Settings' },
];

const SPEAKER_ON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const SPEAKER_OFF = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';

const calmOS = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/**
 * game:    { state }  (a holder, so the state can be swapped on import/reset)
 * actions: see main.js
 * audio:   from src/audio/audio.js (optional)
 */
export function createUI(root, game, actions, { debug = false, audio = null } = {}) {
  let tab = 'factory';
  let app, coinsEl, gemsEl, rateEl, muteBtn, coach, coachText, coachNext, views, navBtns, managersDot, rewardsDot;
  let wingShown = '';
  let settingsKey = '';
  const fx = createFx(document.body, () => !game.state.settings.reduceMotion && !calmOS());

  // ---------- toasts: shown one after another so none get lost ----------
  const toastQueue = [];
  let toastBusy = false;
  function pumpToast() {
    if (toastBusy || !toastQueue.length) return;
    let t = root.querySelector('.toast');
    if (!t) { t = h('div', { class: 'toast', role: 'status' }); root.append(t); }
    t.textContent = toastQueue.shift();
    t.hidden = false;
    toastBusy = true;
    setTimeout(() => {
      t.hidden = true;
      toastBusy = false;
      setTimeout(pumpToast, 120);
    }, toastQueue.length ? 1500 : 2400);
  }
  function toast(message) {
    if (toastQueue.includes(message)) return;
    if (toastQueue.length >= 4) toastQueue.shift();
    toastQueue.push(message);
    pumpToast();
  }

  // ---------- build ----------
  function build() {
    root.replaceChildren();
    views = {
      factory: createFactoryView({ game, actions }),
      managers: createManagersView({ game, actions }),
      rewards: createRewardsView({ game, actions }),
      shop: createShopView({ game, actions }),
      guide: createGuideView(),
      more: createMoreView({ game, actions }),
    };

    coinsEl = h('div', { class: 'coins' }, '0');
    rateEl = h('div', { class: 'rate', hidden: true });
    gemsEl = h('div', { class: 'gems', 'aria-label': 'Gems' }, '0 ◆');
    muteBtn = h('button', { class: 'mute', type: 'button', onclick: () => actions.toggleMute() });
    const top = h('header', { class: 'top' },
      h('div', { class: 'brand-row' }, h('div', { class: 'brand' }, 'Tinker Town Factory'), muteBtn),
      h('div', { class: 'coins-row' }, coinsEl, rateEl, gemsEl));

    coachText = h('p', { class: 'coach-text' });
    coachNext = h('button', { class: 'coach-btn', type: 'button', onclick: () => actions.tutorialNext() }, 'Got it');
    coach = h('div', { class: 'coach', role: 'status', hidden: true },
      coachText,
      h('div', { class: 'coach-actions' },
        coachNext,
        h('button', { class: 'coach-skip', type: 'button', onclick: () => actions.tutorialSkip() }, 'Skip tutorial')));

    const content = h('div', { class: 'content' }, coach);
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
    settingsKey = '';
    muteBtn._k = '';
  }

  function select(id) {
    tab = id;
    for (const t of TABS) views[t.id].el.hidden = t.id !== id;
    if (actions.visitTab) actions.visitTab(id);
    render();
    window.scrollTo(0, 0);
  }

  /** Mirror the player's accessibility choices onto <html> so CSS can react. */
  function applySettings(st) {
    const key = [st.largeText, st.colorblind, st.reduceMotion].join('|');
    if (key === settingsKey) return;
    settingsKey = key;
    const el = document.documentElement;
    el.toggleAttribute('data-large', !!st.largeText);
    el.toggleAttribute('data-cb', !!st.colorblind);
    el.toggleAttribute('data-calm', !!st.reduceMotion);
    wingShown = ''; // paper colour depends on colorblind mode
    if (st.reduceMotion) fx.clear();
  }

  function render() {
    const s = game.state;
    const st = s.settings;
    applySettings(st);

    setText(coinsEl, formatNumber(s.coins));
    const ips = incomePerSecond(s);
    rateEl.hidden = ips <= 0;
    if (ips > 0) setText(rateEl, `+${formatNumber(ips)}/s`);

    const muted = !!st.muted;
    const mk = muted ? 'off' : 'on';
    if (muteBtn._k !== mk) {
      muteBtn.innerHTML = muted ? SPEAKER_OFF : SPEAKER_ON;
      muteBtn.setAttribute('aria-label', muted ? 'Sound is off. Turn sound on' : 'Sound is on. Mute sound');
      muteBtn._k = mk;
    }

    const wing = WING_BY_ID[st.wing];
    const paperKey = st.colorblind ? 'cb' : wing && wing.id;
    if (wing && wingShown !== paperKey) {
      app.style.setProperty('--paper', st.colorblind ? '#eef0f3' : wing.paper);
      wingShown = paperKey;
    }

    for (const t of TABS) setAttr(navBtns[t.id], 'aria-current', t.id === tab ? 'page' : 'false');
    managersDot.hidden = !canPrestige(s);
    setText(gemsEl, `${s.gems} ◆`);
    rewardsDot.hidden = !(dailyStatus(s).claimable || claimableQuests(s) > 0);

    // tutorial banner + pulsing target
    const step = tutorialActive(s) ? currentStep(s) : null;
    coach.hidden = !step;
    let target = null;
    if (step) {
      const n = TUTORIAL_STEPS.indexOf(step) + 1;
      setText(coachText, `${n}/${TUTORIAL_STEPS.length}  ${step.text}`);
      coachNext.hidden = !step.manual;
      target = step.target || null;
    }
    views.factory.setHighlight(tab === 'factory' && target ? target.machine || null : null, target && target.part);
    for (const t of TABS) navBtns[t.id].classList.toggle('hl', !!(target && target.tab === t.id && tab !== t.id));

    views[tab].render();
  }

  // ---------- feedback: sound + particles + little pops ----------
  const play = (name) => { if (audio) audio.play(name); };

  /** kind: tap | buy | auto | claim | gem | achievement | prestige | wing | produce */
  function feedback(kind, id) {
    const card = id ? views.factory.cardEl(id) : null;
    switch (kind) {
      case 'tap':
        play('tap'); fx.coinsAt(card, 3); pop(card); break;
      case 'buy':
        play('buy'); fx.coinsAt(card, 6); pop(card); break;
      case 'auto':
        play('auto'); fx.coinsAt(card, 10); pop(card); break;
      case 'produce':
        play('coin');
        if (card && !game.state.machines[id].auto) fx.coinsAt(card, 4);
        break;
      case 'claim':
        play('claim'); fx.confetti(40); break;
      case 'gem':
        play('gem'); break;
      case 'achievement':
        play('achievement'); fx.confetti(60); break;
      case 'prestige':
        play('prestige'); fx.confetti(110); break;
      case 'wing':
        play('wing'); fx.confetti(80); break;
      default: break;
    }
  }

  function pop(el) {
    if (!el || game.state.settings.reduceMotion) return;
    el.classList.remove('pop');
    void el.offsetWidth; // restart the animation
    el.classList.add('pop');
  }

  function onProduce(id, amount) {
    if (tab === 'factory') views.factory.onProduce(id, amount);
    feedback('produce', id);
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
  return {
    render, onProduce, toast, showWelcome, feedback,
    rebuild: () => { build(); render(); },
    get tab() { return tab; },
  };
}
