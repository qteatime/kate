export class Timer {
  private _last_time: number | null = null;
  private _started = false;

  start() {
    if (this._started) {
      return;
    }
    KateAPI.timer.on_tick.listen(this.update);
  }

  stop() {
    this._last_time = null;
    this._started = false;
    KateAPI.timer.on_tick.remove(this.update);
  }

  update = (time: number) => {
    if (this._last_time == null) {
      this._last_time = time;
    }
    const delta = time - this._last_time;
    this._last_time = time;
    if (!KateAPI.input.is_paused) {
      this.on_tick(delta);
    }
  };

  on_tick(delta: number) {}
}
