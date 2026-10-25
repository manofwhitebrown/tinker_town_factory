import { MACHINES, MACHINE_BY_ID } from '../data/machines.js';
import { BUY_MODES } from '../core/state.js';
import { formatNumber, formatDuration } from '../core/format.js';
import {
  incomePerSecond, isUnlocked, isVisible, machineCost, machineOutput, nextMilestone, resolveBuyCount,
} from '../systems/economy.js';
import { ICONS } from './icons.js';

/** Tiny DOM helper: h('div', {class: 'x', onclick: fn}, child, ...) */
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null) el.append(kid);
  return el;
}

function setText(el, text) {
  if (el._t !== text) { el.textContent = text; el._t = text; }
}
function setDisabled(el, value) {
  if (el.disabled !== value) el.disabled = value;
}

const MODE_LABEL = { 1: '×1', 10: '×10', max: 'Max' };

/**
 * game:    { state }  (a holder, so the state can be swapped on import/reset)
 * actions: { tap(id), buy(id), setBuyMode(mode), exportSave(), importSave(), resetSave(), cheat(n) }
 */
export function createUI(root, game, actions, { debug = false } = {}) {
  let els = null;
  let toastTimer = 0;

  function build() {
    root.replaceChildren();
    els = { cards: {}, modes: {} };

    els.coins = h('div', { class: 'coins', 'aria-live': 'off' }, '0');
    els.rate = h('div', { class: 'rate', hidden: true });
    const top = h('header', { class: 'top' },
      h('div', { class: 'brand' }, 'Tinker Town Factory'),
      h('div', { class: 'coins-row' }, els.coins, els.rate));

    const modeRow = h('div', { class: 'buymodes' }, h('span', { class: 'label' }, 'Buy amount'));
    for (const mode of BUY_MODES) {
      const b = h('button', {
        class: 'mode', type: 'button', 'aria-pressed': 'false',
        onclick: () => actions.setBuyMode(mode),
      }, MODE_LABEL[mode]);
      els.modes[mode] = b;
      modeRow.append(b);
    }

    const list = h('section', { class: 'machines', 'aria-label': 'Machines' });
    for (const def of MACHINES) {
      const c = { floats: 0, pv: '' };
      c.icon = h('div', { class: 'icon', html: ICONS[def.icon] || '' });
      c.name = h('span', { class: 'name' });
      c.level = h('span', { class: 'level' });
      c.sub = h('div', { class: 'sub' });
      c.fill = h('i');
      c.thread = h('div', { class: 'thread' }, c.fill);
      c.hint = h('div', { class: 'hint' });
      c.tap = h('button', {
        class: 'tap', type: 'button',
        onclick: () => actions.tap(def.id),
      }, c.icon, h('div', { class: 'title' }, c.name, c.level), c.sub, h('div', {}, c.thread, c.hint));
      // keep the layout in the 3-row grid
      c.tap.children[3].style.gridColumn = '2';

      c.bLabel = h('span', { class: 'b-label' });
      c.bCost = h('span', { class: 'b-cost' });
      c.buy = h('button', { class: 'buy', type: 'button', onclick: () => actions.buy(def.id) }, c.bLabel, c.bCost);

      c.root = h('article', { class: 'card', style: `--accent:${def.color}`, hidden: true }, c.tap, c.buy);
      els.cards[def.id] = c;
      list.append(c.root);
    }

    const foot = h('div', { class: 'foot' },
      h('button', { type: 'button', onclick: () => actions.exportSave() }, 'Copy save code'),
      h('button', { type: 'button', onclick: () => actions.importSave() }, 'Load save code'),
      h('button', { type: 'button', onclick: () => actions.resetSave() }, 'Start over'));
    if (debug) {
      for (const [label, n] of [['+1K', 1e3], ['+1M', 1e6], ['+1B', 1e9], ['+1T', 1e12]]) {
        foot.append(h('button', { class: 'dev', type: 'button', onclick: () => actions.cheat(n) }, label));
      }
    }

    root.append(h('main', { class: 'app' }, top, modeRow, list, foot,
      h('div', { class: 'version' }, 'v0.1 · parts 0–2')));
    els.toastHost = root;
  }

  function render() {
    const s = game.state;
    setText(els.coins, formatNumber(s.coins));

    const ips = incomePerSecond(s);
    els.rate.hidden = ips <= 0;
    if (ips > 0) setText(els.rate, `+${formatNumber(ips)}/s`);

    for (const mode of BUY_MODES) {
      const on = String(s.settings.buyMode) === String(mode) ? 'true' : 'false';
      if (els.modes[mode].getAttribute('aria-pressed') !== on) els.modes[mode].setAttribute('aria-pressed', on);
    }

    MACHINES.forEach((def, i) => {
      const c = els.cards[def.id];
      const visible = isVisible(s, def.id);
      if (c.root.hidden === visible) c.root.hidden = !visible;
      if (!visible) return;

      const m = s.machines[def.id];
      const unlocked = isUnlocked(s, def.id);
      c.root.classList.toggle('locked', !unlocked);

      if (!unlocked) {
        setText(c.name, '???');
        setText(c.level, '');
        setText(c.sub, `Build the ${MACHINES[i - 1].name} first`);
        setText(c.hint, '');
        if (c.icon._k !== 'lock') { c.icon.innerHTML = ICONS.lock; c.icon._k = 'lock'; }
        setDisabled(c.tap, true);
        c.buy.hidden = true;
        return;
      }

      c.buy.hidden = false;
      setDisabled(c.tap, false);
      if (c.icon._k !== def.icon) { c.icon.innerHTML = ICONS[def.icon] || ''; c.icon._k = def.icon; }

      const owned = m.level >= 1;
      setText(c.name, def.name);
      setText(c.level, owned ? `Lv ${m.level}` : 'Not built');

      const out = owned ? machineOutput(def, m.level, s) : def.baseOutput;
      const ms = owned ? nextMilestone(m.level) : null;
      setText(c.sub, `+${formatNumber(out)} per ${formatDuration(def.cycleTime)}` + (ms ? ` · ×2 at Lv ${ms}` : ''));
      setText(c.hint, !owned ? 'Build one to start' : m.running ? 'Working…' : m.auto ? '' : 'Tap to run');

      const p = owned && m.running ? Math.min(1, m.progress / def.cycleTime) : 0;
      const pv = p.toFixed(3);
      if (c.pv !== pv) {
        c.fill.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(1)}% 0 0)`;
        c.pv = pv;
      }

      const mode = s.settings.buyMode;
      const count = resolveBuyCount(s, def, mode);
      const shown = mode === 'max' ? Math.max(count, 1) : mode;
      setText(c.bLabel, `${owned ? 'Buy' : 'Build'} ×${shown}`);
      setText(c.bCost, formatNumber(machineCost(def, m.level, shown)));
      setDisabled(c.buy, count < 1);
    });
  }

  function onProduce(id, amount) {
    const c = els && els.cards[id];
    if (!c || c.root.hidden || c.floats >= 4) return;
    const f = h('span', { class: 'float' }, `+${formatNumber(amount)}`);
    c.root.append(f);
    c.floats++;
    setTimeout(() => { f.remove(); c.floats--; }, 900);
  }

  function toast(message) {
    let t = root.querySelector('.toast');
    if (!t) { t = h('div', { class: 'toast', role: 'status' }); root.append(t); }
    t.textContent = message;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  build();
  render();
  return { render, onProduce, toast, rebuild: () => { build(); render(); } };
}
