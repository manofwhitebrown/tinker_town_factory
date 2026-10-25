// Number + time formatting for idle-game sized values.

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

function trimmed(value, decimals) {
  let s = value.toFixed(decimals);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s;
}

/** 1234 -> "1.23K", 5.6e12 -> "5.6T", 1e40 -> "1e40" */
export function formatNumber(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0';
  if (n === Infinity) return '∞';
  if (n === -Infinity) return '-∞';
  const sign = n < 0 ? '-' : '';
  n = Math.abs(n);

  if (n < 1000) {
    const r = Math.round(n * 10) / 10;
    if (r < 1000) return sign + String(r);
  }

  let tier = Math.floor(Math.log10(n) / 3);
  if (n / 10 ** (tier * 3) < 1) tier -= 1;
  if (n / 10 ** (tier * 3) >= 1000) tier += 1;

  while (tier < SUFFIXES.length) {
    const scaled = n / 10 ** (tier * 3);
    const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
    const text = trimmed(scaled, decimals);
    if (parseFloat(text) >= 1000) { tier += 1; continue; } // rounded up, e.g. 999.9K
    return sign + text + SUFFIXES[tier];
  }

  const [mant, exp] = n.toExponential(2).split('e');
  return sign + trimmed(parseFloat(mant), 2) + 'e' + exp.replace('+', '');
}

/** 0.6 -> "0.6s", 75 -> "1m 15s", 3700 -> "1h 1m" */
export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0s';
  if (seconds < 10) return `${Math.round(seconds * 10) / 10}s`;
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}
