import { Observable, widget } from "../../../packages/kate-domui/build";
import { Widget } from "../../../packages/kate-domui/build/widget";
import { MarkedText, TypeWriterText } from "../../kate-domui/build/type-writer";
const {
  Box,
  Text,
  Image,
  Icon,
  Keymap,
  Space,
  KeyEventMap,
  Dynamic,
  WithAttrs,
} = widget;

type ToWidget = Widget | string;

export function to_widget(x: ToWidget) {
  if (typeof x === "string") {
    return new Text(x);
  } else {
    return x;
  }
}

export function div(classes: string, children: ToWidget[]) {
  return new Box("div", classes, children.map(to_widget));
}

export function bold(children: ToWidget[]) {
  return new Box("strong", "text-bold", children.map(to_widget));
}

export function italic(children: ToWidget[]) {
  return new Box("em", "text-italic", children.map(to_widget));
}

export function title(children: ToWidget[]) {
  return new Box("h2", "text-title", children.map(to_widget));
}

export function subtitle(children: ToWidget[]) {
  return new Box("h3", "text-subtitle", children.map(to_widget));
}

export function paragraph(children: ToWidget[]) {
  return new Box("p", "text-paragraph", children.map(to_widget));
}

export function space(size_px: number) {
  return new Space(size_px);
}

export function img(url: string) {
  return new Image(url);
}

export function icon(name: KateTypes.InputKey) {
  return new Icon(name);
}

export function keymap(
  mapping: Partial<Record<KateTypes.InputKey, () => Promise<boolean>>>
) {
  return new Keymap(mapping);
}

export function keyevent(
  mapping: Partial<Record<KateTypes.ExtendedInputKey, () => Promise<boolean>>>
) {
  return new KeyEventMap(mapping);
}

export function hbox(
  gap: "none" | "half" | "1x" | "1_5x" | "2x",
  children: ToWidget[]
) {
  return div(`layout-hbox gap-${gap}`, children);
}

export function vbox(
  gap: "none" | "half" | "1x" | "1_5x" | "2x",
  children: ToWidget[]
) {
  return div(`layout-vbox gap-${gap}`, children);
}

export function dynamic(value: Observable<Widget>) {
  return new Dynamic(value);
}

export function with_attrs(
  attrs: {
    [key: string]: string | Observable<string>;
  },
  child: ToWidget
) {
  return new WithAttrs(attrs, to_widget(child));
}

export function type_text(text: MarkedText[], speed_ms: number) {
  return new TypeWriterText(text, speed_ms);
}
