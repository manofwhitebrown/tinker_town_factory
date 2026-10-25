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

  lock: wrap(`
    <rect x="11" y="21" width="26" height="20" rx="4" fill="currentColor"/>
    <path d="M16 21v-5a8 8 0 0 1 16 0v5" fill="none" stroke="currentColor" stroke-width="4"/>
    <circle cx="24" cy="31" r="3" fill="#fff"/>`),
};
