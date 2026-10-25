/** Tiny DOM helper: h('div', {class: 'x', onclick: fn}, child, ...) */
export function h(tag, props = {}, ...kids) {
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

/** Only touch the DOM when a value actually changed (called every frame). */
export function setText(el, text) {
  if (el._t !== text) { el.textContent = text; el._t = text; }
}
export function setDisabled(el, value) {
  if (el.disabled !== value) el.disabled = value;
}
export function setAttr(el, name, value) {
  if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}
