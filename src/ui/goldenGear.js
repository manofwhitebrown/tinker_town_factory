import { h } from './dom.js';

const GEAR = `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
  <g fill="#f2b134" stroke="#b9780b" stroke-width="2" stroke-linejoin="round">
    <path d="M21 4h6l1.2 5.1a15 15 0 0 1 4.3 1.8l4.5-2.8 4.2 4.2-2.8 4.5a15 15 0 0 1 1.8 4.3L44 22v6l-5.1 1.2a15 15 0 0 1-1.8 4.3l2.8 4.5-4.2 4.2-4.5-2.8a15 15 0 0 1-4.3 1.8L27 44h-6l-1.2-5.1a15 15 0 0 1-4.3-1.8l-4.5 2.8-4.2-4.2 2.8-4.5a15 15 0 0 1-1.8-4.3L4 28v-6l5.1-1.2a15 15 0 0 1 1.8-4.3L8.1 12l4.2-4.2 4.5 2.8a15 15 0 0 1 4.3-1.8z"/>
    <circle cx="24" cy="25" r="8" fill="#fff3c4"/>
  </g>
</svg>`;

/** The floating Golden Gear button. Shown and hidden by the game loop. */
export function createGoldenGear(onCollect) {
  const el = h('button', {
    class: 'golden', type: 'button', hidden: true, html: GEAR,
    'aria-label': 'Golden Gear. Tap to collect a bonus',
    onclick: () => onCollect(),
  });
  return {
    el,
    show() {
      // Random spot, away from the header and the bottom bar.
      el.style.left = `${8 + Math.random() * 74}%`;
      el.style.top = `${24 + Math.random() * 44}%`;
      el.hidden = false;
    },
    hide() { el.hidden = true; },
  };
}
