export class LiveNode {
  constructor(readonly node: HTMLElement) {}

  async animate(
    keyframes: Keyframe[],
    options: number | KeyframeAnimationOptions
  ) {
    const animation = this.node.animate(keyframes, options);
    return new Promise<void>((resolve, reject) => {
      animation.onfinish = () => resolve();
      animation.oncancel = () => reject();
    });
  }

  select(query: string) {
    return new LiveNodeSet(Array.from(this.node.querySelectorAll(query)));
  }
}

export class LiveNodeSet {
  constructor(readonly nodes: HTMLElement[]) {}

  async animate(
    keyframes: Keyframe[],
    options: number | KeyframeAnimationOptions
  ) {
    return Promise.all(
      this.nodes.map((x) => new LiveNode(x).animate(keyframes, options))
    );
  }

  select(query: string) {
    const items = this.nodes.flatMap(
      (x) => new LiveNode(x).select(query).nodes
    );
    return new LiveNodeSet(items);
  }
}
