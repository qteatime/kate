interface IRenderable {
  render(ctx: CanvasRenderingContext2D): void;
}

export class Container {
  public visible = true;

  private items: IRenderable[] = [];

  add(item: IRenderable) {
    this.items.push(item);
  }

  remove(item: IRenderable) {
    this.items = this.items.filter((x) => x !== item);
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.visible) {
      for (const item of this.items) {
        item.render(ctx);
      }
    }
  }
}

export class Text {
  public visible = true;
  public x = 0;
  public y = 0;

  constructor(
    public value: string,
    readonly options: {
      font?: string;
      fill?: string;
      stroke?: string;
      align?: CanvasTextAlign;
      baseline?: CanvasTextBaseline;
      width?: number;
    }
  ) {}

  move(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.visible) {
      ctx.save();
      ctx.font = this.options.font ?? "16px sans-serif";
      ctx.fillStyle = this.options.fill ?? "";
      ctx.strokeStyle = this.options.stroke ?? "";
      ctx.textAlign = this.options.align ?? "left";
      ctx.textBaseline = this.options.baseline ?? "top";
      if (this.options.fill != null) {
        ctx.fillText(this.value, this.x, this.y, this.options.width);
      }
      if (this.options.stroke != null) {
        ctx.strokeText(this.value, this.x, this.y, this.options.width);
      }
      ctx.restore();
    }
  }
}

export class Sprite {
  public visible = true;
  public x = 0;
  public y = 0;

  constructor(readonly texture: Texture) {}

  move(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.visible) {
      ctx.drawImage(this.texture.base, this.x, this.y);
    }
  }
}

export class Texture {
  constructor(readonly base: CanvasImageSource) {}

  static async from_path(path: string) {
    return new Texture(await load_image(path));
  }
}

async function load_image(path: string) {
  const url = await KateAPI.cart_fs.get_file_url(path);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("failed to load " + path));
    img.src = url;
  });
}
