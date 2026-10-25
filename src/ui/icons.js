// Machine icons drawn as inline SVG (no image files to license or load).
// They use currentColor, so each card tints its icon with the machine colour.

const wrap = (inner) =>
  `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true" focusable="false">${inner}</svg>`;

export const ICONS = {
  sewing: wrap(`
    <rect x="5" y="37" width="38" height="6" rx="3" fill="currentColor"/>
    <path d="M9 37V17a7 7 0 0 1 7-7h20a3 3 0 0 1 3 3v8h-9v6h-6v20z" fill="currentColor" opacity=".9"/>
    <rect x="31" y="22" width="3" height="15" fill="#fff"/>
    <circle cx="18" cy="17" r="4.5" fill="#fff" opacity=".85"/>
    <circle cx="18" cy="17" r="1.8" fill="currentColor"/>`),

  loom: wrap(`
    <rect x="5" y="6" width="38" height="5" rx="2" fill="currentColor"/>
    <rect x="5" y="37" width="38" height="5" rx="2" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2" opacity=".8">
      <line x1="11" y1="11" x2="11" y2="37"/><line x1="17" y1="11" x2="17" y2="37"/>
      <line x1="23" y1="11" x2="23" y2="37"/><line x1="29" y1="11" x2="29" y2="37"/>
      <line x1="35" y1="11" x2="35" y2="37"/>
    </g>
    <rect x="7" y="20" width="34" height="5" rx="2.5" fill="#fff" stroke="currentColor" stroke-width="2"/>`),

  dyevat: wrap(`
    <path d="M8 18h32l-3 22a4 4 0 0 1-4 3H15a4 4 0 0 1-4-3z" fill="currentColor"/>
    <ellipse cx="24" cy="18" rx="16" ry="5" fill="currentColor" opacity=".55"/>
    <ellipse cx="24" cy="18" rx="12" ry="3" fill="#fff" opacity=".65"/>
    <path d="M24 4c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z" fill="currentColor"/>`),

  button: wrap(`
    <circle cx="24" cy="24" r="18" fill="currentColor"/>
    <circle cx="24" cy="24" r="13" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>
    <circle cx="19" cy="19" r="2.5" fill="#fff"/><circle cx="29" cy="19" r="2.5" fill="#fff"/>
    <circle cx="19" cy="29" r="2.5" fill="#fff"/><circle cx="29" cy="29" r="2.5" fill="#fff"/>`),

  embroidery: wrap(`
    <circle cx="19" cy="29" r="13" fill="#fff" stroke="currentColor" stroke-width="4"/>
    <path d="M13 29c3-6 7-6 10 0s4 3 6 0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M42 5L31 16" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    <path d="M31 16l-3 6 6-3z" fill="currentColor"/>
    <path d="M28 22L24 28" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>`),

  tailorbot: wrap(`
    <line x1="24" y1="4" x2="24" y2="10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <circle cx="24" cy="4" r="2.5" fill="currentColor"/>
    <rect x="9" y="10" width="30" height="22" rx="6" fill="currentColor"/>
    <circle cx="18" cy="21" r="4" fill="#fff"/><circle cx="30" cy="21" r="4" fill="#fff"/>
    <circle cx="18" cy="21" r="1.7" fill="currentColor"/><circle cx="30" cy="21" r="1.7" fill="currentColor"/>
    <rect x="14" y="35" width="20" height="8" rx="3" fill="currentColor" opacity=".85"/>
    <path d="M20 39h8" stroke="#fff" stroke-width="2" stroke-dasharray="3 2"/>`),

  // ---- Toy Shop ----
  teddy: wrap(`
    <circle cx="12" cy="11" r="5.5" fill="currentColor"/><circle cx="36" cy="11" r="5.5" fill="currentColor"/>
    <circle cx="24" cy="24" r="15" fill="currentColor"/>
    <ellipse cx="24" cy="30" rx="7" ry="5.5" fill="#fff" opacity=".85"/>
    <circle cx="18" cy="21" r="2" fill="#fff"/><circle cx="30" cy="21" r="2" fill="#fff"/>
    <ellipse cx="24" cy="28" rx="2.5" ry="1.8" fill="currentColor"/>`),

  blocks: wrap(`
    <rect x="5" y="28" width="17" height="15" rx="2" fill="currentColor"/>
    <rect x="26" y="28" width="17" height="15" rx="2" fill="currentColor" opacity=".7"/>
    <rect x="15" y="9" width="17" height="15" rx="2" fill="currentColor" opacity=".9" transform="rotate(-8 23 16)"/>
    <circle cx="13.5" cy="35.5" r="3" fill="#fff"/><circle cx="34.5" cy="35.5" r="3" fill="#fff" opacity=".8"/>`),

  train: wrap(`
    <rect x="9" y="8" width="8" height="10" rx="1.5" fill="currentColor"/>
    <rect x="6" y="18" width="26" height="17" rx="3" fill="currentColor"/>
    <rect x="32" y="24" width="10" height="11" rx="2" fill="currentColor" opacity=".8"/>
    <rect x="10" y="22" width="6" height="6" fill="#fff"/><rect x="20" y="22" width="6" height="6" fill="#fff"/>
    <circle cx="14" cy="37" r="4.5" fill="currentColor"/><circle cx="27" cy="37" r="4.5" fill="currentColor"/><circle cx="38" cy="37" r="4" fill="currentColor"/>
    <rect x="4" y="42" width="40" height="2.5" rx="1" fill="currentColor" opacity=".6"/>`),

  yoyo: wrap(`
    <path d="M24 3v13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="24" cy="30" r="14" fill="currentColor"/>
    <circle cx="24" cy="30" r="8" fill="#fff" opacity=".85"/>
    <circle cx="24" cy="30" r="3.5" fill="currentColor"/>`),

  musicbox: wrap(`
    <path d="M6 24v-8a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v8z" fill="currentColor" opacity=".7"/>
    <rect x="6" y="22" width="36" height="21" rx="4" fill="currentColor"/>
    <circle cx="24" cy="32" r="6.5" fill="#fff" opacity=".85"/>
    <path d="M22 30v5.5M22 30l5-1.2v4" stroke="currentColor" stroke-width="1.8" fill="none"/>
    <path d="M36 4v8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="34" cy="12" r="3" fill="currentColor"/>`),

  // ---- Gadget Garage ----
  gear: wrap(`
    <g fill="currentColor">
      <rect x="21" y="3" width="6" height="9" rx="1.5"/><rect x="21" y="36" width="6" height="9" rx="1.5"/>
      <rect x="3" y="21" width="9" height="6" rx="1.5"/><rect x="36" y="21" width="9" height="6" rx="1.5"/>
      <rect x="21" y="3" width="6" height="9" rx="1.5" transform="rotate(45 24 24)"/>
      <rect x="21" y="3" width="6" height="9" rx="1.5" transform="rotate(-45 24 24)"/>
      <rect x="21" y="36" width="6" height="9" rx="1.5" transform="rotate(45 24 24)"/>
      <rect x="21" y="36" width="6" height="9" rx="1.5" transform="rotate(-45 24 24)"/>
      <circle cx="24" cy="24" r="15"/>
    </g>
    <circle cx="24" cy="24" r="6" fill="#fff"/>`),

  bulb: wrap(`
    <path d="M24 4a14 14 0 0 0-8 25.5V33h16v-3.5A14 14 0 0 0 24 4z" fill="currentColor"/>
    <rect x="17" y="35" width="14" height="4" rx="2" fill="currentColor" opacity=".8"/>
    <rect x="19" y="41" width="10" height="4" rx="2" fill="currentColor" opacity=".8"/>
    <path d="M19 14a7 7 0 0 1 6-4" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>
    <path d="M20 30l4-8 4 8" stroke="#fff" stroke-width="2" fill="none" stroke-linejoin="round"/>`),

  circuit: wrap(`
    <rect x="8" y="8" width="32" height="32" rx="4" fill="currentColor"/>
    <g stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round">
      <path d="M14 20h8v-6"/><path d="M34 16v8h-8"/><path d="M14 32h10v-4"/><path d="M34 34h-6"/>
    </g>
    <g fill="#fff"><circle cx="22" cy="14" r="2.4"/><circle cx="26" cy="24" r="2.4"/><circle cx="24" cy="28" r="2.4"/><circle cx="28" cy="34" r="2.4"/></g>`),

  radio: wrap(`
    <path d="M30 16L40 4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="5" y="16" width="38" height="27" rx="5" fill="currentColor"/>
    <circle cx="17" cy="29.5" r="7" fill="#fff" opacity=".85"/><circle cx="17" cy="29.5" r="2.5" fill="currentColor"/>
    <rect x="28" y="23" width="10" height="3" rx="1.5" fill="#fff"/><rect x="28" y="29" width="10" height="3" rx="1.5" fill="#fff"/>
    <rect x="28" y="35" width="7" height="3" rx="1.5" fill="#fff"/>`),

  drone: wrap(`
    <path d="M17 24l-8-6M31 24l8-6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="8" cy="16" rx="6.5" ry="2" fill="currentColor" opacity=".7"/><ellipse cx="40" cy="16" rx="6.5" ry="2" fill="currentColor" opacity=".7"/>
    <rect x="16" y="22" width="16" height="11" rx="4.5" fill="currentColor"/>
    <circle cx="24" cy="27.5" r="2.8" fill="#fff"/>
    <path d="M20 36l-2 5M28 36l2 5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`),

  // ---- Candy Kitchen ----
  lolly: wrap(`
    <rect x="22.5" y="28" width="3" height="17" rx="1.5" fill="currentColor" opacity=".7"/>
    <circle cx="24" cy="18" r="14" fill="currentColor"/>
    <circle cx="24" cy="18" r="9" fill="none" stroke="#fff" stroke-width="2.2" opacity=".85"/>
    <circle cx="24" cy="18" r="4" fill="none" stroke="#fff" stroke-width="2.2" opacity=".85"/>`),

  cupcake: wrap(`
    <path d="M10 25h28l-4 18H14z" fill="currentColor" opacity=".75"/>
    <path d="M17 27l2 14M24 27v14M31 27l-2 14" stroke="#fff" stroke-width="1.5" opacity=".7"/>
    <path d="M8 25a8 8 0 0 1 6-8 9 9 0 0 1 20 0 8 8 0 0 1 6 8z" fill="currentColor"/>
    <circle cx="24" cy="8" r="3.5" fill="#fff"/>`),

  candy: wrap(`
    <path d="M3 14l11 10L3 34z" fill="currentColor" opacity=".7"/><path d="M45 14L34 24l11 10z" fill="currentColor" opacity=".7"/>
    <ellipse cx="24" cy="24" rx="15" ry="12" fill="currentColor"/>
    <path d="M14 20q10-7 20 0" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".8"/>`),

  chocolate: wrap(`
    <rect x="9" y="5" width="30" height="38" rx="4" fill="currentColor"/>
    <path d="M9 17h30M9 30h30M19 5v38M29 5v38" stroke="#fff" stroke-width="1.8" opacity=".5"/>
    <rect x="9" y="5" width="30" height="9" rx="4" fill="#fff" opacity=".22"/>`),

  cake: wrap(`
    <rect x="7" y="27" width="34" height="16" rx="3" fill="currentColor"/>
    <rect x="12" y="16" width="24" height="12" rx="3" fill="currentColor" opacity=".8"/>
    <path d="M7 32q4 4 8 0t8 0 8 0 8 0" stroke="#fff" stroke-width="2.2" fill="none" opacity=".85"/>
    <rect x="22.7" y="8" width="2.6" height="8" fill="currentColor"/>
    <path d="M24 2c2.2 2 2.2 4 0 5.5-2.2-1.5-2.2-3.5 0-5.5z" fill="currentColor"/>`),

  lock: wrap(`
    <rect x="11" y="21" width="26" height="20" rx="4" fill="currentColor"/>
    <path d="M16 21v-5a8 8 0 0 1 16 0v5" fill="none" stroke="currentColor" stroke-width="4"/>
    <circle cx="24" cy="31" r="3" fill="#fff"/>`),
};
