import { Widget } from "../../../packages/kate-domui/build/widget";
import { sleep } from "../../util/build/promise";

export type Animation = (node: Widget) => Promise<void>;

export function css(
  frames: Keyframe[],
  options: KeyframeAnimationOptions = {}
) {
  return async (node: Widget) => {
    await node.live_node.animate(frames, {
      duration: options.duration ?? 0,
      fill: options.fill ?? "forwards",
      easing: options.easing ?? "linear",
      direction: options.direction ?? "normal",
      delay: options.delay ?? 0,
      iterationStart: options.iterationStart ?? 0,
      iterations: options.iterations ?? 1,
    });
  };
}

export function sequence(animations: Animation[]) {
  return async (node: Widget) => {
    for (const animation of animations) {
      await animation(node);
    }
  };
}

export function parallel(animations: Animation[]) {
  return async (node: Widget) => {
    return await Promise.all(animations.map((f) => f(node)));
  };
}

export function wait(delay_ms: number) {
  return async (_: Widget) => {
    return await sleep(delay_ms);
  };
}

export function scale(
  x: number,
  y: number,
  options: KeyframeAnimationOptions = {}
) {
  return css([{ scale: `${x} ${y}` }], options);
}

export function translate(
  x: number,
  y: number,
  options: KeyframeAnimationOptions = {}
) {
  return css([{ translate: `${x}px ${y}px` }], options);
}

export function rotate(deg: number, options: KeyframeAnimationOptions = {}) {
  return css([{ rotate: `${deg}deg` }], options);
}

export function opacity(n: number, options: KeyframeAnimationOptions = {}) {
  return css([{ opacity: n }], options);
}

export function width(n: number, options: KeyframeAnimationOptions = {}) {
  return css([{ width: `${n}px` }], options);
}

export function height(n: number, options: KeyframeAnimationOptions = {}) {
  return css([{ height: `${n}px` }], options);
}

export function fade_in(options: KeyframeAnimationOptions = {}) {
  return css([{ opacity: 0 }, { opacity: 1 }], options);
}

export function fade_out(options: KeyframeAnimationOptions = {}) {
  return css([{ opacity: 1 }, { opacity: 0 }], options);
}

export function flip(invert: boolean, options: KeyframeAnimationOptions = {}) {
  const scale = invert ? -1 : 1;
  return css([{ transform: `scaleX(${scale})` }], options);
}
