(function () {
  const COLS = 8;
  const ROWS = 11;

  const idleFrames = [
    [0, 0, 1680],
    [0, 1, 660],
    [0, 2, 660],
    [0, 3, 840],
    [0, 4, 840],
    [0, 5, 1920],
  ];

  function rowFrames(row, count, duration, lastDuration) {
    return Array.from({ length: count }, (_, column) => [
      row,
      column,
      column === count - 1 ? lastDuration : duration,
    ]);
  }

  const states = {
    idle: { label: "待机", frames: idleFrames },
    "running-right": {
      label: "向右跑",
      frames: rowFrames(1, 8, 120, 220),
    },
    "running-left": {
      label: "向左跑",
      frames: rowFrames(2, 8, 120, 220),
    },
    waving: { label: "挥手", frames: rowFrames(3, 4, 140, 280) },
    jumping: { label: "跳跃", frames: rowFrames(4, 5, 140, 280) },
    failed: { label: "失败", frames: rowFrames(5, 8, 140, 240) },
    waiting: { label: "等待", frames: rowFrames(6, 6, 150, 260) },
    running: { label: "工作中", frames: rowFrames(7, 6, 120, 220) },
    review: { label: "审查", frames: rowFrames(8, 6, 150, 280) },
  };

  class SpritePlayer {
    constructor(element) {
      this.element = element;
      this.state = "idle";
      this.frameIndex = 0;
      this.timer = null;
      this.paused = false;
      this.renderFrame();
      this.schedule();
    }

    setState(nextState) {
      if (!states[nextState]) return;
      this.state = nextState;
      this.frameIndex = 0;
      this.restart();
    }

    setPaused(paused) {
      this.paused = Boolean(paused);
      this.restart();
    }

    restart() {
      if (this.timer) window.clearTimeout(this.timer);
      this.timer = null;
      this.renderFrame();
      this.schedule();
    }

    schedule() {
      if (this.paused) return;
      const frame = states[this.state].frames[this.frameIndex];
      this.timer = window.setTimeout(() => {
        this.frameIndex = (this.frameIndex + 1) % states[this.state].frames.length;
        this.renderFrame();
        this.schedule();
      }, frame[2]);
    }

    renderFrame() {
      const [row, column] = states[this.state].frames[this.frameIndex];
      this.element.style.backgroundPosition = `${(column / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`;
      this.element.dataset.state = this.state;
      this.element.dataset.frame = String(this.frameIndex + 1);
    }

    destroy() {
      if (this.timer) window.clearTimeout(this.timer);
    }
  }

  window.PetSprite = { COLS, ROWS, states, SpritePlayer };
})();
