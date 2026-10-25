import { ACHIEVEMENTS, DAILY, QUEST_BONUS_GEMS, QUEST_TYPES } from '../data/meta.js';
import { formatNumber } from '../core/format.js';
import { dailyReward, dailyStatus, questDone, rewardSlot } from '../systems/meta.js';
import { h, setText, setDisabled, setAttr } from './dom.js';

const gemText = (n) => `${n} ${n === 1 ? 'gem' : 'gems'}`;

export function createRewardsView({ game, actions }) {
  // ---- daily ----
  const days = DAILY.rewards.map((r, i) => {
    const label = h('span', { class: 'day-n' }, `Day ${i + 1}`);
    const prize = h('span', { class: 'day-p' });
    const cell = h('div', { class: 'day' }, label, prize);
    return { cell, prize };
  });
  const streakLine = h('div', { class: 'stat-line' });
  const claim = h('button', { class: 'primary', type: 'button', onclick: () => actions.claimDaily() }, 'Claim');
  const dailyPanel = h('section', { class: 'panel' },
    h('h2', {}, 'Daily reward'),
    h('p', { class: 'lede' }, 'Come back every day to keep your streak going. Miss a day and it starts over.'),
    h('div', { class: 'days' }, ...days.map((d) => d.cell)),
    streakLine, claim);

  // ---- quests ----
  const questRows = Array.from({ length: 3 }, (_, i) => {
    const r = {};
    r.text = h('div', { class: 'up-name' });
    r.fill = h('i');
    r.bar = h('div', { class: 'bar' }, r.fill);
    r.num = h('div', { class: 'up-desc' });
    r.btn = h('button', { class: 'up-buy', type: 'button', onclick: () => actions.claimQuest(i) });
    r.root = h('div', { class: 'up', hidden: true }, h('div', { class: 'up-text' }, r.text, r.bar, r.num), r.btn);
    return r;
  });
  const questNote = h('p', { class: 'hint-line' });
  const questPanel = h('section', { class: 'panel' },
    h('h2', {}, 'Daily quests'),
    h('p', { class: 'lede' }, 'New quests every day at midnight.'),
    ...questRows.map((r) => r.root), questNote);

  // ---- achievements ----
  const achTitle = h('h2', {}, 'Achievements');
  const achRows = {};
  const achList = h('div', { class: 'ach-list' });
  for (const a of ACHIEVEMENTS) {
    const name = h('div', { class: 'up-name' }, a.name);
    const desc = h('div', { class: 'up-desc' }, a.desc);
    const reward = h('div', { class: 'ach-gems' }, `${a.gems} ◆`);
    const root = h('div', { class: 'ach' }, h('div', { class: 'up-text' }, name, desc), reward);
    achRows[a.id] = root;
    achList.append(root);
  }
  const achPanel = h('section', { class: 'panel' }, achTitle, achList);

  const el = h('div', { class: 'view' }, dailyPanel, questPanel, achPanel);

  function render() {
    const s = game.state;
    const now = Date.now();

    // daily
    const st = dailyStatus(s, now);
    const slot = rewardSlot(st.streak);
    // If the streak will reset, "today" is slot 0; once claimed, today's slot is the one just earned.
    const shown = st.claimable ? slot : rewardSlot(s.daily.streak);
    days.forEach((d, i) => {
      const r = DAILY.rewards[i];
      const done = st.claimable ? i < slot && st.streak > 1 : i <= shown;
      const text = done ? '✓' : r.gems ? `${r.gems} ◆` : `${r.coinMinutes}m`; // check mark = not just colour
      setText(d.prize, text);
      d.cell.classList.toggle('done', done);
      d.cell.classList.toggle('today', st.claimable && i === slot);
    });
    const reward = dailyReward(s, st.streak);
    setText(claim, st.claimable
      ? `Claim ${formatNumber(reward.coins)} coins${reward.gems ? ` + ${gemText(reward.gems)}` : ''}`
      : st.clockBehind ? 'Your device date is behind your last claim' : 'Claimed today, come back tomorrow');
    setDisabled(claim, !st.claimable);
    setText(streakLine, st.claimable && st.streak === 1 && s.daily.streak > 0
      ? 'Your streak was broken. Claim to start a new one.'
      : `Streak: ${st.claimable ? st.streak - 1 : st.streak} ${(st.claimable ? st.streak - 1 : st.streak) === 1 ? 'day' : 'days'}`);

    // quests
    const list = s.quests.list;
    questRows.forEach((r, i) => {
      const q = list[i];
      r.root.hidden = !q;
      if (!q) return;
      const def = QUEST_TYPES[q.type];
      setText(r.text, def.label(q.type === 'earn' ? q.target : formatNumber(q.target), formatNumber));
      const p = Math.min(1, q.progress / q.target);
      const w = `${(p * 100).toFixed(1)}%`;
      if (r.fill._w !== w) { r.fill.style.width = w; r.fill._w = w; }
      setAttr(r.bar, 'aria-label', `${Math.round(p * 100)} percent`);
      setText(r.num, `${formatNumber(q.progress)} / ${formatNumber(q.target)}`);
      const done = questDone(q);
      setText(r.btn, q.claimed ? 'Done' : done ? `Claim ${q.gems} ◆` : `${q.gems} ◆`);
      setDisabled(r.btn, q.claimed || !done);
    });
    const left = list.filter((q) => !q.claimed).length;
    setText(questNote, s.quests.bonusClaimed
      ? `All quests finished. Bonus ${QUEST_BONUS_GEMS} ◆ collected.`
      : `Finish all of them for a bonus of ${QUEST_BONUS_GEMS} ◆. ${left} left.`);

    // achievements
    let got = 0;
    for (const a of ACHIEVEMENTS) {
      const on = !!s.achievements[a.id];
      if (on) got++;
      achRows[a.id].classList.toggle('got', on);
    }
    setText(achTitle, `Achievements ${got}/${ACHIEVEMENTS.length}`);
  }

  return { el, render };
}
