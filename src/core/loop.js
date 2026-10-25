// Fixed-timestep game loop. The simulation always advances in equal steps
// (deterministic, easy to test); rendering happens once per animation frame.

export class Loop {
  constructor({ step = 1 / 30, maxFrame = 0.25, update, render }) {
    this.step = step;
    this.maxFrame = maxFrame;
    this.update = update;
    this.render = render;
    this.acc = 0;
    this.running = false;
    this.last = 0;
    this.raf = 0;
  }

  /** Feed real elapsed seconds. Runs 0..n fixed updates, then one render. */
  advance(dt) {
    dt = Math.min(Math.max(dt, 0), this.maxFrame);
    this.acc += dt;
    while (this.acc >= this.step - 1e-9) {
      this.update(this.step);
      this.acc -= this.step;
    }
    if (this.acc < 0) this.acc = 0;
    if (this.render) this.render();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const frame = (t) => {
      if (!this.running) return;
      this.advance((t - this.last) / 1000);
      this.last = t;
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  /** Call when the tab becomes visible again so no stale time is counted. */
  resetClock() {
    this.last = performance.now();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}
