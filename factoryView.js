import { MACHINES, WINGS } from '../data/machines.js';
import { BUY_MODES } from '../core/state.js';
import { formatNumber, formatDuration } from '../core/format.js';
import {
  cycleTimeOf, incomePerSecond, isUnlocked, isVisible, machineCost, machineOutput, nextMilestone, resolveBuyCount,
} from '../systems/economy.js';
import { nextGoal } from '../systems/goals.js';
import { ICONS } from './icons.js';
import { h, setText, setDisabled, setAttr } from './dom.js';

// Colorblind-safe accents (Okabe-Ito, darkened for contrast on light cards). Used when that setting is on.
const CB_COLORS = ['#0072b2', '#d55e00', '#007a5a', '#b24a86', '#8a6200', '#3f6fb0'];

const MODE_LABEL = { 1: '×1', 10: '×10', max: 'Max' };

export function createFactoryView({ game, actions }) {
  const chips = {};
  const modes = {};
  const cards = {};

  const wingRow = h('div', { class: 'wings', 'aria-label': 'Factory wings' });
  for (const w of WINGS) {
    const sub = h('span', { class: 'chip-sub' });
    const btn = h('button', { class: 'chip', type: 'button', onclick: () => actions.setWing(w.id) },
      h('span', { class: 'chip-name' }, w.short), sub);
    chips[w.id] = { btn, sub };
    wingRow.append(btn);
  }

  const modeRow = h('div', { class: 'buymodes' }, h('span', { class: 'label' }, 'Buy amount'));
  for (const mode of BUY_MODES) {
    const b = h('button', {
      class: 'mode', type: 'button', 'aria-pressed': 'false', onclick: () => actions.setBuyMode(mode),
    }, MODE_LABEL[mode]);
    modes[mode] = b;
    modeRow.append(b);
  }

  const list = h('section', { class: 'machines', 'aria-label': 'Machines' });
  MACHINES.forEach((def, idx) => {
    const c = { floats: 0, pv: '' };
    c.icon = h('div', { class: 'icon' });
    c.name = h('span', { class: 'name' });
    c.level = h('span', { class: 'level' });
    c.sub = h('div', { class: 'sub' });
    c.fill = h('i');
    c.thread = h('div', { class: 'thread' }, c.fill);
    c.hint = h('div', { class: 'hint' });
    c.tap = h('button', { class: 'tap', type: 'button', onclick: () => actions.tap(def.id) },
      c.icon,
      h('div', { class: 'title' }, c.name, c.level),
      c.sub,
      h('div', {}, c.thread, c.hint));

    c.bLabel = h('span', { class: 'b-label' });
    c.bCost = h('span', { class: 'b-cost' });
    c.buy = h('button', { class: 'buy', type: 'button', onclick: () => actions.buy(def.id) }, c.bLabel, c.bCost);

    c.autoLabel = h('span');
    c.autobar = h('button', { class: 'autobar', type: 'button', hidden: true, onclick: () => actions.buyAuto(def.id) },
      c.autoLabel);

    c.root = h('article', { class: 'card', style: `--base:${def.color};--cb:${CB_COLORS[idx % CB_COLORS.length]}`, hidden: true },
      h('div', { class: 'main' }, c.tap, c.buy), c.autobar);
    cards[def.id] = c;
    list.append(c.root);
  });

  const goalText = h('span', { class: 'goal-text' });
  const goalFill = h('i');
  const goal = h('div', { class: 'goal', hidden: true }, goalText, h('div', { class: 'bar' }, goalFill));

  const el = h('div', { class: 'view' }, goal, wingRow, modeRow, list);

  function render() {
    const s = game.state;
    const wingId = s.settings.wing;

    const g = nextGoal(s);
    goal.hidden = !g;
    if (g) {
      const ips = incomePerSecond(s);
      const eta = ips > 0 && g.have < g.need ? ` · about ${formatDuration(Math.max(1, (g.need - g.have) / ips))} at your pace` : '';
      setText(goalText, `Next goal: ${g.label} (${formatNumber(g.have)} / ${formatNumber(g.need)})${eta}`);
      const w = `${(g.fraction * 100).toFixed(1)}%`;
      if (goalFill._w !== w) { goalFill.style.width = w; goalFill._w = w; }
    }

    for (const w of WINGS) {
      const open = !!s.wings[w.id];
      const { btn, sub } = chips[w.id];
      setAttr(btn, 'aria-pressed', w.id === wingId ? 'true' : 'false');
      btn.classList.toggle('locked', !open);
      setDisabled(btn, !open);
      setText(sub, open ? '' : `at ${formatNumber(w.unlockAt)} earned`);
    }

    for (const mode of BUY_MODES) {
      setAttr(modes[mode], 'aria-pressed', String(s.settings.buyMode) === String(mode) ? 'true' : 'false');
    }

    MACHINES.forEach((def, i) => {
      const c = cards[def.id];
      const visible = def.wing === wingId && isVisible(s, def.id);
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
        c.autobar.hidden = true;
        c.root.classList.remove('auto');
        return;
      }

      c.buy.hidden = false;
      if (c.icon._k !== def.icon) { c.icon.innerHTML = ICONS[def.icon] || ''; c.icon._k = def.icon; }

      const owned = m.level >= 1;
      const auto = m.auto;
      const ct = cycleTimeOf(def, s);
      c.root.classList.toggle('auto', auto);
      c.root.classList.toggle('running', m.running || auto);
      setDisabled(c.tap, !owned || auto);

      setText(c.name, def.name);
      setText(c.level, owned ? `Lv ${m.level}` : 'Not built');

      const out = owned ? machineOutput(def, m.level, s) : def.baseOutput;
      const ms = owned ? nextMilestone(m.level) : null;
      setText(c.sub, `+${formatNumber(out)} per ${formatDuration(ct)}` + (ms ? ` · ×2 at Lv ${ms}` : ''));
      setText(c.hint, !owned ? 'Build one to start' : auto ? 'Running on its own' : m.running ? 'Working…' : 'Tap to run');

      const p = owned && m.running ? Math.min(1, m.progress / ct) : 0;
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

      const showAuto = owned && !auto;
      c.autobar.hidden = !showAuto;
      if (showAuto) {
        setText(c.autoLabel, `Automate · ${formatNumber(def.autoCost)} coins`);
        setDisabled(c.autobar, s.coins < def.autoCost);
      }
    });
  }

  /** Floating "+N" when a machine finishes a cycle. */
  function onProduce(id, amount) {
    const c = cards[id];
    if (!c || c.root.hidden || c.floats >= 4) return;
    const f = h('span', { class: 'float' }, `+${formatNumber(amount)}`);
    c.root.append(f);
    c.floats++;
    setTimeout(() => { f.remove(); c.floats--; }, 900);
  }

  /** Pulse a card (and optionally its buy / automate button) for the tutorial. */
  let hl = '';
  function setHighlight(id, part) {
    const key = id ? `${id}:${part || ''}` : '';
    if (key === hl) return;
    hl = key;
    for (const def of MACHINES) {
      const c = cards[def.id];
      const on = def.id === id;
      c.tap.classList.toggle('hl', on && !part);
      c.buy.classList.toggle('hl', on && part === 'buy');
      c.autobar.classList.toggle('hl', on && part === 'auto');
    }
  }

  const cardEl = (id) => (cards[id] ? cards[id].root : null);

  return { el, render, onProduce, setHighlight, cardEl };
}
