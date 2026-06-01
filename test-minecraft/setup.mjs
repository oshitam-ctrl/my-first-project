// Preload: register the 'three' stub loader and install minimal DOM/window
// globals so main.js can evaluate + run one frame headlessly.
import { register } from 'node:module';
register('./start.loader.mjs', import.meta.url);

function fakeCtx() {
  return new Proxy({
    imageSmoothingEnabled: false, fillStyle: '', strokeStyle: '', lineWidth: 1,
    getImageData: () => ({ data: [100, 110, 90, 255] }),
  }, { get(t, p) { return p in t ? t[p] : () => {}; }, set(t, p, v) { t[p] = v; return true; } });
}

function fakeEl(tag = 'div') {
  const e = {
    tagName: tag, style: {}, title: '', value: 0, checked: false, textContent: '',
    width: 128, height: 64, children: [],
    classList: { toggle() {}, add() {}, remove() {} },
    addEventListener() {}, removeEventListener() {}, appendChild(c) { e.children.push(c); return c; },
    remove() {}, focus() {}, setPointerCapture() {}, releasePointerCapture() {},
    requestPointerLock() {}, getContext() { return fakeCtx(); },
    setAttribute() {}, getBoundingClientRect() { return { left: 0, top: 0, width: 128, height: 64 }; },
  };
  Object.defineProperty(e, 'innerHTML', { get() { return ''; }, set() { e.children.length = 0; } });
  return e;
}

const body = fakeEl('body');
const elCache = {};
const documentStub = {
  body,
  hidden: false,
  pointerLockElement: null,
  getElementById(id) { return (elCache[id] ||= fakeEl()); },
  createElement(tag) { return fakeEl(tag); },
  addEventListener() {}, removeEventListener() {},
};

const windowStub = {
  devicePixelRatio: 2, innerWidth: 1280, innerHeight: 720,
  addEventListener() {}, removeEventListener() {},
  location: { href: 'https://host/minecraft', origin: 'https://host', pathname: '/minecraft', search: '', hash: '' },
  history: { replaceState() {}, pushState() {} },
  visualViewport: null,
  AudioContext: undefined, webkitAudioContext: undefined,
  navigator: { maxTouchPoints: 0, userAgent: 'node' },
};

globalThis.window = windowStub;
globalThis.document = documentStub;
globalThis.location = windowStub.location;
globalThis.history = windowStub.history;
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.requestAnimationFrame = () => 0; // run the loop body exactly once
globalThis.cancelAnimationFrame = () => {};
globalThis.confirm = () => true;
if (!globalThis.performance) globalThis.performance = { now: () => Date.now() };
