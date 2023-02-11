import { EventStream } from "../util/events";

export class KateTimer {
  readonly on_tick = new EventStream<number>();
  private _last_time: number | null = null;
  private _timer_id: number | null = null;
  readonly MAX_FPS = 30;
  readonly ONE_FRAME = Math.ceil(1000 / 30);
  private _fps = 30;

  setup() {
    cancelAnimationFrame(this._timer_id as any);
    this._last_time = null;
    this._timer_id = requestAnimationFrame(this.tick);
  }

  get fps() {
    return this._fps;
  }

  private tick = (time: number) => {
    if (this._last_time == null) {
      this._last_time = time;
      this._fps = this.MAX_FPS;
      this.on_tick.emit(time);
      this._timer_id = requestAnimationFrame(this.tick);
    } else {
      const elapsed = time - this._last_time;
      if (elapsed < this.ONE_FRAME) {
        this._timer_id = requestAnimationFrame(this.tick);
      } else {
        this._last_time = time;
        this._fps = (1000 / elapsed) | 0;
        this.on_tick.emit(time);
        this._timer_id = requestAnimationFrame(this.tick);
      }
    }
  };
}
