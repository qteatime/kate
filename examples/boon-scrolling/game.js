(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Db = exports.content = void 0;
exports.content = [
    {
        name: "Kitty Cute",
        user: "@kitty_cute_girl",
        text: `My cats are the cutest thing. Look at these adorable furballs. UGHH!`,
    },
    {
        name: "Beary 🐻",
        user: "@beary",
        text: `It has been forever ahaha`,
    },
    {
        name: "One, Two, Three",
        user: "@one23",
        text: "We recorded a new MV!",
    },
    {
        name: "Alice is not dead",
        user: "@that_alice",
        text: `Happy birthday to me! I went home after so long and got to cuddle Petra a lot <3`,
    },
];
class Db {
    candidates = exports.content.slice();
    pick_one() {
        if (this.candidates.length === 0) {
            this.candidates = exports.content.slice();
        }
        const item = Math.floor(Math.random() * this.candidates.length);
        const result = this.candidates[item];
        this.candidates.splice(item, 1);
        return result;
    }
}
exports.Db = Db;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const build_1 = require("../../../packages/kate-domui/build");
const promise_1 = require("../../../packages/util/build/promise");
const db_1 = require("./db");
const { Box, Text, Icon, Keymap } = build_1.widget;
const root = document.querySelector("#game");
const ui = build_1.KateUI.from_root(root);
function show(scene) {
    const result = (0, promise_1.defer)();
    ui.clear();
    const widget = scene(result);
    ui.draw(widget);
    return [widget, result.promise];
}
function dismiss(x, value) {
    return async () => {
        x.resolve(value);
        return false;
    };
}
async function main() {
    const [main_widget, main_screen_dismiss] = show(screen_main);
    await main_screen_dismiss;
    await main_widget.live_node.animate([{ opacity: 1 }, { opacity: 0 }], 1000);
    const data = new db_1.Db();
    while (true) {
        const content = data.pick_one();
        const [widget, promise] = show(card(content));
        const result = await promise;
        const node = widget.live_node.select(result === "like" ? ".button-like" : ".button-share");
        const alternate = widget.live_node.select(result === "like" ? ".button-share" : ".button-like");
        await Promise.all([
            alternate.animate([
                {
                    color: "var(--dark)",
                    background: "var(--light)",
                    opacity: 0.4,
                },
            ], {
                duration: 100,
                fill: "forwards",
            }),
            node.animate([{ background: "var(--accent)" }], {
                duration: 250,
                fill: "forwards",
            }),
            node
                .select(".kate-icon")
                .animate([
                { transform: "rotate(0deg) scale(1.0)" },
                { transform: "rotate(-5deg) scale(1.5)" },
                { transform: "rotate(0deg) scale(1.0)", offset: 0.8 },
            ], {
                duration: 250,
                fill: "forwards",
            }),
        ]);
        await widget.live_node.animate([{ transform: "translateY(-480px)", opacity: 0 }], 400);
    }
}
function screen_main(result) {
    return new Box("div", "screen-main", [
        new Box("h1", "title", [new Text("Boon-scrolling")]),
        new Box("div", "subtitle", [new Text("A tiny, endless si(lly)mulation")]),
        new Box("div", "divider", []),
        new Box("div", "paragraph", [
            new Text(`
        You're sitting on the sofa, bored and overwhelmed. Life has been
        a bit too much for you lately.
      `),
        ]),
        new Box("div", "paragraph", [
            new Text(`
        You pick up your phone and open the usual application.
        The short messages show up in the screen.
      `),
        ]),
        new Box("div", "status-bar", [new Icon("o"), new Text("Start")]),
        new Keymap({ o: dismiss(result, null) }),
    ]);
}
function card({ name, user, text, }) {
    return (result) => {
        return new Box("div", "screen-card", [
            new Box("div", "card-header", [
                new Box("div", "card-display-name", [new Text(name)]),
                new Box("div", "card-user-name", [new Text(user)]),
            ]),
            new Box("div", "card-text", [new Text(text)]),
            new Box("div", "card-actions", [
                new Box("div", "card-button button-like", [
                    new Icon("ltrigger"),
                    new Text("Like"),
                ]),
                new Box("div", "card-button button-share", [
                    new Text("Share"),
                    new Icon("rtrigger"),
                ]),
            ]),
            new Keymap({
                ltrigger: dismiss(result, "like"),
                rtrigger: dismiss(result, "share"),
            }),
        ]);
    };
}
main();

},{"../../../packages/kate-domui/build":4,"../../../packages/util/build/promise":10,"./db":1}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assets = void 0;
exports.assets = {
    "kate-domui.css": ":root {\r\n  --button-o: url(\"data:image/png;base64,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\");\r\n  --button-x: url(\"data:image/png;base64,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\");\r\n  --button-up: url(\"data:image/png;base64,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\");\r\n  --button-right: url(\"data:image/png;base64,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\");\r\n  --button-down: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAG3RFWHRTb2Z0d2FyZQBDZWxzeXMgU3R1ZGlvIFRvb2zBp+F8AAAJSUlEQVR42u3da4jldR3H8c/s11u6GAYZSmhZSmRChWmlT1TMjOwCFt3oBpEidFmNSHoWPlEzurBFT1yLojKoDFG7+CjX1KiIpHBTytaiKOwymrvub6YH84e2rXV2d+bM+V9eL1jcGWfmnPPf/7zZPfv/nF1YXl4OME0LAgACAAgAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAIAACAAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgACIAAgAIAAAAIACAAgADPWWjssyUVJHk3yhyRHJjkiyeFJjklydPe+I7u3j+r+XyXZ1P1Y7t4+ont7Iclh3U1U9/NNe33O5u5jKknb68cTSZa6r7+ru80n97qd3d37dnW3teTjB/XxRyc5rvvvEd15szvJ37rz71/d19vTnQ/pfr7cvX939/6FvW67dbf5RJLHutvaleTx7u0nu8/bleTE7vbvqKo9AvCfCJyd5Lokp3e/MEd235wL3Q8YmuXuR+u++XcnuT/JR6rqHr8D+N8IvDjJd5M827nDCO1McklV/dwfAfYfgSuS3ND9LgDGYneSD1fVVs8BrB6Bm5Nc6pxhRL5ZVW/q253q7d8CtNZ2JHm+84YR2FFVp/XxjvU5ACck+U1Wnq2FoXosyalV9UcBOPgIvD/J5+NvARim5SSXVdUX+3oHe38hUGvtW0ne4FxigL5dVW/s8x0cxJWArbUHk5zifGJAHqqq5/X9Tg4lAJuS/D0rV+9B3y0meXpVLQnA+kXg/CTfy8rVgdDbUzXJq6rqziHc2UGNgVpr1yS52jlGj11TVR8fyp0d3BqwtXZnkvOcZ/TQnVV1wZDu8CDnwK213yY52flGj/yuqp4ztDs91AA8M8lD8aQg/bCY5LlV9RcB2LgIvDXJl+NJQeZ8KiZ5R1V9bYh3ftCvCNRa25rkcucgc7S1qq4Y6p0f/EuCtda2J3mF85A52F5V5wz5AYwhAAtJHo4XEWFj/T7JyVW1LADzj8AZSe5J8jTnJRtgV5Izq+qXQ38go3lV4Nba+5J8ISsvBAmz0vuF3yQD0EXgliSXOEeZoR9U1YVjeTCj+3cBWmsPJDnVecos/txfVSeN6QGNMQAnZOWll49zvrKOFpO8oKoeEYD+R+D1Sb4RryzM+ngyyaVVdcvYHtho/2mw1trVST4RTwqyNktJPlZV147xwY363wZsrd2Y5N3OYdbgpqoa7Tk0+n8ctLV2V5JXOo85BPdW1dljfoBTCMAxSX4dVwpycB5OcnpVLQrA8CNwVpIfxnyYA7OY5NVVddfYH+gkAtBF4LIkn4v5ME9tT5KPVtUNU3iwkwlAF4GbkrzTOc5TuLGq3juVBzupAHQRuDvJy53n/B93VdW5U3rAUwzAsVm5UtCTguxtZ1au9HtMAMYfgXOT3BZPCrJiMckFVXXv1B74JAPQReBDSa5Lcpjzf9Jakg9U1dYpPvjJBqCLwLYk7/I9MGmjvtJPAFaPwD1JzvJ9MEk/rqpJv56kALS2OStPCp7k+2FSdiZ5YVX9UwCm/ofA1s5Jcns8KTgVk7nSTwAOPAJbklwbVwqO3Z4kV1bVZxwKAdg3AubD4zfpJ/0EYPUImA+P1+jnvQKw9gCYD4/TJOa9ArA+ETAfHpfFJBdX1Y8cCgE40AiYD4/DpOa9ArC+ETAfHr5JzXsFYP0jYD48XJOb9wrA+gfAfHiYJjnvFYDZRMB8eFgmO+8VgNlFwHx4IL9UmfC8VwBmG4FtMR/uO1f6CcBMI2A+3F93V5WrOAVgpgEwH+4n814B2LAImA/3i3mvAGx4BMyH+8G8VwDmFgHz4fnzpJ8AzDUC5sPzY94rAHMPgPnwfJj3CkBvImA+vLHMewWgdxEwH94Y5r0C0NsImA/PnnmvAPQ6AubDs7O9qs5xGASgzwEwH54N814BGEwEzIfX12KS86vqPodCAIYSAfPhdTqUMe8VgIFGYFvMh9fKlX4CMOgImA8fOvNeARh8AMyHD415rwCMJgLmwwfHvFcARhcB8+EDY94rAKONgPnw6jzpJwCjjoD58P6Z9wrA6AOwOcmv4krBfZn3CsBkImA+/N/MewVgchG4PMln40lB814BmGwEzIfNewVg4hGY8nzYvFcAJh+Aqc6HzXsFgC4CU5sPm/cKAPtE4INJrs/458PmvQLAfiKwLeOfD7vSTwB4igiMeT5s3isArBKAsc6HzXsFgAOMwNjmw+a9AsBBRmAs82HzXgHgECMwhvnwl6rK6yIKAIcYgSHPh817BYA1BmCo82HzXgFgnSIwtPmwea8AsM4RGMp82LxXAJhRBIYwHzbvFQBmGIE+z4fNewWAGQegr/Nh814BYIMi0Lf5sHmvALDBEejLfNi8VwCYUwS2Zf7z4W1V9R6/GgLAfCIwz/mwea8AMOcAzGs+bN4rAPQkAucm+X6SozboJh9PcmFVbXf0BYB+ROCqrMyHF2Z8U0tJtlTVpx11AaBfEbg1yWtmfDM3V9WbHW0BoJ8ReDDJKTP68vdX1YscZQGgvwE4PsmOJMeu85f+a5JTquofjrIA0O8InJfkjiSHr9OX3J3kPE/6CQDDicCWrFwpuNYnBZeSXFVVn3JUBYBhReArSd62xi/z1ap6u6MpAAwzAvclOfMQP/0nVfUyR1EAGHYE/pTk+IP8tD9X1bMcPQFg+AF4RpJHcuBXCj6R5MSqetTREwDGEYHXJvlOkk2rfOhSktdV1a2OmgAwrghcn+TKVT7sk1V1laMlAIwzArcnuWg///v2qrrYURIAxh2BnyZ5yT7v/llVvdTREQCmEYEHkpzavbmjqk5zVASA6QRgc5JfdG+e4dV8BYDpReAtSZar6uuOhgAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAgAAAAgAIACAAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAAACAAgAIACAAACz9290qe5MA2HyIAAAAABJRU5ErkJggg==\");\r\n  --button-left: url(\"data:image/png;base64,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\");\r\n}\r\n\r\n* {\r\n  padding: 0;\r\n  margin: 0;\r\n  outline: none;\r\n  border: none;\r\n  font-size: 100%;\r\n  font-style: inherit;\r\n  font-weight: inherit;\r\n  box-sizing: border-box;\r\n}\r\n\r\n.kate-ui-screen {\r\n  width: 800px;\r\n  height: 480px;\r\n  position: relative;\r\n}\r\n\r\n.kate-icon {\r\n  width: 1em;\r\n  height: 1em;\r\n  font-size: 1em;\r\n  color: #4f4f4f;\r\n}\r\n\r\n.kate-icon-light::before {\r\n  filter: invert(1);\r\n}\r\n\r\n.kate-icon[data-name=\"up\"]::before,\r\n.kate-icon[data-name=\"right\"]::before,\r\n.kate-icon[data-name=\"down\"]::before,\r\n.kate-icon[data-name=\"left\"]::before {\r\n  content: \"\";\r\n  width: 1em;\r\n  height: 1em;\r\n  display: block;\r\n  background-position: center center;\r\n  background-repeat: no-repeat;\r\n  background-size: 100% 100%;\r\n}\r\n\r\n.kate-icon[data-name=\"up\"]::before {\r\n  background-image: var(--button-up);\r\n}\r\n\r\n.kate-icon[data-name=\"right\"]::before {\r\n  background-image: var(--button-right);\r\n}\r\n\r\n.kate-icon[data-name=\"down\"]::before {\r\n  background-image: var(--button-down);\r\n}\r\n\r\n.kate-icon[data-name=\"left\"]::before {\r\n  background-image: var(--button-left);\r\n}\r\n\r\n.kate-icon[data-name=\"x\"],\r\n.kate-icon[data-name=\"o\"] {\r\n  background: #4f4f4f;\r\n  border-radius: 100%;\r\n  display: flex;\r\n  justify-content: center;\r\n  align-items: center;\r\n}\r\n\r\n.kate-icon[data-name=\"x\"]::before,\r\n.kate-icon[data-name=\"o\"]::before {\r\n  content: \"\";\r\n  display: block;\r\n  width: 0.8em;\r\n  height: 0.8em;\r\n  background-position: center center;\r\n  background-repeat: no-repeat;\r\n  background-size: 100% 100%;\r\n}\r\n\r\n.kate-icon[data-name=\"x\"]::before {\r\n  background-image: var(--button-x);\r\n}\r\n\r\n.kate-icon[data-name=\"o\"]::before {\r\n  background-image: var(--button-o);\r\n}\r\n\r\n.kate-icon[data-name=\"ltrigger\"],\r\n.kate-icon[data-name=\"rtrigger\"] {\r\n  background: #4f4f4f;\r\n  width: 1.5em;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n}\r\n\r\n.kate-icon[data-name=\"ltrigger\"]::before,\r\n.kate-icon[data-name=\"rtrigger\"]::before {\r\n  font-size: 0.6em;\r\n  font-weight: bold;\r\n  font-family: var(--font-family-sans);\r\n  color: #fafafa;\r\n}\r\n\r\n.kate-icon[data-name=\"ltrigger\"] {\r\n  border-top-left-radius: 0.5em;\r\n}\r\n\r\n.kate-icon[data-name=\"ltrigger\"]::before {\r\n  content: \"L\";\r\n}\r\n\r\n.kate-icon[data-name=\"rtrigger\"] {\r\n  border-top-right-radius: 0.5em;\r\n}\r\n\r\n.kate-icon[data-name=\"rtrigger\"]::before {\r\n  content: \"R\";\r\n}\r\n\r\n.kate-icon[data-name=\"menu\"] {\r\n  border: 1px solid #4f4f4f;\r\n  height: 0.3em;\r\n  border-radius: 0.5em;\r\n  width: 1em;\r\n  transform: rotate(27deg);\r\n}\r\n\r\n.kate-icon[data-name=\"capture\"] {\r\n  background: #4f4f4f;\r\n  height: 0.3em;\r\n  border-radius: 0.5em;\r\n  width: 1em;\r\n  transform: rotate(-27deg);\r\n}\r\n"
};

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.widget = exports.Observable = exports.KateUI = void 0;
var ui_1 = require("./ui");
Object.defineProperty(exports, "KateUI", { enumerable: true, get: function () { return ui_1.KateUI; } });
var observable_1 = require("./observable");
Object.defineProperty(exports, "Observable", { enumerable: true, get: function () { return observable_1.Observable; } });
exports.widget = require("./widget");

},{"./observable":5,"./ui":7,"./widget":8}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Observable = void 0;
const events_1 = require("../../util/build/events");
class Observable {
    _value;
    stream = new events_1.EventStream();
    constructor(_value) {
        this._value = _value;
    }
    get value() {
        return this._value;
    }
    set value(value) {
        this.stream.emit(value);
        this._value = value;
    }
    dispose() { }
    map(fn) {
        const result = new Observable(fn(this.value));
        const handler = this.stream.listen((value) => {
            result.value = fn(value);
        });
        result.dispose = () => {
            this.stream.remove(handler);
        };
        return result;
    }
    filter(fn, initial_value) {
        const initial = fn(this.value) ? this.value : initial_value;
        const result = new Observable(initial);
        const handler = this.stream.listen((value) => {
            if (fn(value)) {
                this.value = value;
            }
        });
        result.dispose = () => {
            this.stream.remove(handler);
        };
        return result;
    }
    fold(fn, initial) {
        let current = initial;
        const result = new Observable(initial);
        const handler = this.stream.listen((value) => {
            result.value = current = fn(current, value);
        });
        result.dispose = () => {
            this.stream.remove(handler);
        };
        return result;
    }
}
exports.Observable = Observable;

},{"../../util/build/events":9}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveNodeSet = exports.LiveNode = void 0;
class LiveNode {
    node;
    constructor(node) {
        this.node = node;
    }
    async animate(keyframes, options) {
        const animation = this.node.animate(keyframes, options);
        return new Promise((resolve, reject) => {
            animation.onfinish = () => resolve();
            animation.oncancel = () => reject();
        });
    }
    select(query) {
        return new LiveNodeSet(Array.from(this.node.querySelectorAll(query)));
    }
}
exports.LiveNode = LiveNode;
class LiveNodeSet {
    nodes;
    constructor(nodes) {
        this.nodes = nodes;
    }
    async animate(keyframes, options) {
        return Promise.all(this.nodes.map((x) => new LiveNode(x).animate(keyframes, options)));
    }
    select(query) {
        const items = this.nodes.flatMap((x) => new LiveNode(x).select(query).nodes);
        return new LiveNodeSet(items);
    }
}
exports.LiveNodeSet = LiveNodeSet;

},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateUI = void 0;
const assets_1 = require("./assets");
const widget_1 = require("./widget");
class KateUI {
    docroot;
    root;
    children = [];
    focus_target = new Set();
    current_focus = null;
    constructor(docroot, root) {
        this.docroot = docroot;
        this.root = root;
    }
    static from_root(root) {
        const ui_root = document.createElement("div");
        ui_root.className = "kate-ui-root";
        const css = new widget_1.Css(assets_1.assets["kate-domui.css"]).render();
        ui_root.appendChild(css);
        const screen = document.createElement("div");
        screen.className = "kate-ui-screen";
        ui_root.appendChild(screen);
        root.appendChild(ui_root);
        return new KateUI(ui_root, screen);
    }
    clear() {
        for (const child of this.children) {
            child.detach();
        }
        this.root.textContent = "";
    }
    draw(widget) {
        this.children.push(widget);
        widget.attach(this.root, this);
    }
    add_css(code) {
        const element = new widget_1.Css(code).render();
        this.docroot.appendChild(element);
    }
    remove_focusable(widget) {
        this.focus_target.delete(widget);
        if (this.current_focus == widget) {
            widget.set_focused(false);
            this.current_focus = null;
        }
    }
    add_focusable(widget) {
        this.focus_target.add(widget);
        if (this.current_focus == null) {
            widget.set_focused(true);
            this.current_focus = widget;
        }
    }
}
exports.KateUI = KateUI;

},{"./assets":3,"./widget":8}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Css = exports.Dynamic = exports.Keymap = exports.FocusTarget = exports.Fragment = exports.Icon = exports.Image = exports.Box = exports.Text = exports.Widget = exports.h = void 0;
const transform_1 = require("./transform");
function h(tag, attrs, children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        element.setAttribute(key, value);
    }
    for (const child of children) {
        element.appendChild(child);
    }
    return element;
}
exports.h = h;
class Widget {
    raw_node = null;
    is_focusable = false;
    ui = null;
    on_attached() { }
    on_detached() { }
    on_focus() { }
    on_blur() { }
    get live_node() {
        if (this.raw_node instanceof HTMLElement) {
            return new transform_1.LiveNode(this.raw_node);
        }
        else {
            throw new Error(`Invalid type: not an HTMLElement`);
        }
    }
    attach(parent, ui) {
        this.ui = ui;
        if (this.raw_node == null) {
            this.raw_node = this.render();
        }
        const node = this.raw_node;
        if (node != null) {
            parent.appendChild(node);
        }
        this.on_attached();
    }
    detach() {
        if (this.raw_node != null) {
            this.raw_node.parentNode?.removeChild(this.raw_node);
            this.raw_node = null;
        }
        this.on_detached();
        this.ui = null;
    }
    set_focused(focused) {
        if (this.raw_node instanceof HTMLElement) {
            if (focused) {
                this.raw_node.classList.add("kate-focus");
                this.on_focus();
            }
            else {
                this.raw_node.classList.remove("kate-focus");
                this.on_blur();
            }
        }
    }
}
exports.Widget = Widget;
class Text extends Widget {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    render() {
        return document.createTextNode(this.value);
    }
}
exports.Text = Text;
class Box extends Widget {
    tag;
    class_names;
    children;
    constructor(tag, class_names, children) {
        super();
        this.tag = tag;
        this.class_names = class_names;
        this.children = children;
    }
    attach(parent, ui) {
        super.attach(parent, ui);
        for (const child of this.children) {
            child.on_attached();
        }
    }
    detach() {
        for (const child of this.children) {
            child.on_detached();
        }
        super.detach();
    }
    render() {
        const element = document.createElement(this.tag);
        element.className = this.class_names;
        for (const child of this.children) {
            const node = child.render();
            if (node != null) {
                element.appendChild(node);
            }
        }
        return element;
    }
}
exports.Box = Box;
class Image extends Widget {
    url;
    constructor(url) {
        super();
        this.url = url;
    }
    render() {
        const element = document.createElement("img");
        element.src = this.url;
        return element;
    }
}
exports.Image = Image;
class Icon extends Widget {
    type;
    constructor(type) {
        super();
        this.type = type;
    }
    render() {
        switch (this.type) {
            case "up":
            case "down":
            case "right":
            case "left":
                return h("div", { class: "kate-icon kate-icon-light", "data-name": this.type }, []);
            case "ltrigger":
            case "rtrigger":
            case "menu":
            case "capture":
                return h("div", { class: "kate-icon", "data-name": this.type }, []);
            case "x":
                return h("div", { class: "kate-icon", "data-name": this.type }, []);
            case "o":
                return h("div", { class: "kate-icon", "data-name": this.type }, []);
        }
    }
}
exports.Icon = Icon;
class Fragment extends Widget {
    children;
    constructor(children) {
        super();
        this.children = children;
    }
    attach(parent, ui) {
        super.attach(parent, ui);
        for (const child of this.children) {
            child.on_attached();
        }
    }
    detach() {
        for (const child of this.children) {
            child.on_detached();
        }
        super.detach();
    }
    render() {
        const fragment = document.createDocumentFragment();
        for (const child of this.children) {
            const node = child.render();
            if (node != null) {
                fragment.appendChild(node);
            }
        }
        return fragment;
    }
}
exports.Fragment = Fragment;
class FocusTarget extends Widget {
    child;
    focused;
    on;
    is_focused = false;
    constructor(child, focused, on) {
        super();
        this.child = child;
        this.focused = focused;
        this.on = on;
    }
    attach(parent, ui) {
        super.attach(parent, ui);
        this.child.on_attached();
        this.ui?.add_focusable(this);
        this.focused.stream.listen(this.update_focus);
        this.update_focus(this.focused.value);
    }
    detach() {
        this.child.on_detached();
        super.detach();
        this.focused.stream.remove(this.update_focus);
        this.ui?.remove_focusable(this);
    }
    render() {
        return new Box("div", "kate-focus-target", [this.child]).render();
    }
    update_focus = (value) => {
        if (value === this.is_focused) {
            return;
        }
        if (value) {
            this.on_focus();
        }
        else {
            this.on_blur();
        }
    };
    on_focus() {
        this.is_focused = true;
        this.on.focus.call(this);
    }
    on_blur() {
        this.is_focused = false;
        this.on.blur.call(this);
    }
}
exports.FocusTarget = FocusTarget;
class Keymap extends Widget {
    mapping;
    active = true;
    constructor(mapping) {
        super();
        this.mapping = mapping;
    }
    render() {
        return null;
    }
    on_attached() {
        KateAPI.timer.on_tick.listen(this.handle_input);
    }
    on_detached() {
        KateAPI.timer.on_tick.remove(this.handle_input);
    }
    handle_input = async () => {
        if (!this.active) {
            return;
        }
        for (const [key, handler] of Object.entries(this.mapping)) {
            if (KateAPI.input.is_down(key)) {
                this.active = false;
                this.active = await handler();
                break;
            }
        }
    };
}
exports.Keymap = Keymap;
class Dynamic extends Widget {
    value;
    current = null;
    constructor(value) {
        super();
        this.value = value;
    }
    attach(parent, ui) {
        super.attach(parent, ui);
        this.current?.on_attached();
    }
    detach() {
        this.current?.on_detached();
        super.detach();
    }
    render() {
        const element = document.createElement("div");
        element.className = "kate-dynamic";
        return element;
    }
    on_attached() {
        this.value.stream.listen(this.on_update);
    }
    on_detached() {
        this.value.stream.remove(this.on_update);
    }
    get canvas() {
        return this.raw_node;
    }
    on_update = (value) => {
        this.current?.on_detached();
        this.canvas.textContent = "";
        const node = value.render();
        if (node != null) {
            this.canvas.appendChild(node);
        }
        value.on_attached();
        this.current = value;
    };
}
exports.Dynamic = Dynamic;
class Css extends Widget {
    code;
    constructor(code) {
        super();
        this.code = code;
    }
    render() {
        const style = document.createElement("style");
        style.textContent = this.code;
        return style;
    }
}
exports.Css = Css;

},{"./transform":6}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStream = void 0;
class EventStream {
    subscribers = [];
    on_dispose = () => { };
    listen(fn) {
        this.remove(fn);
        this.subscribers.push(fn);
        return fn;
    }
    remove(fn) {
        this.subscribers = this.subscribers.filter((x) => x !== fn);
        return this;
    }
    emit(ev) {
        for (const fn of this.subscribers) {
            fn(ev);
        }
    }
    dispose() {
        this.on_dispose();
    }
    filter(fn) {
        const stream = new EventStream();
        const subscriber = this.listen((ev) => {
            if (fn(ev)) {
                stream.emit(ev);
            }
        });
        stream.on_dispose = () => {
            this.remove(subscriber);
        };
        return stream;
    }
    map(fn) {
        const stream = new EventStream();
        const subscriber = this.listen((ev) => {
            stream.emit(fn(ev));
        });
        stream.on_dispose = () => {
            this.remove(subscriber);
        };
        return stream;
    }
}
exports.EventStream = EventStream;

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defer = void 0;
function defer() {
    const p = Object.create(null);
    p.promise = new Promise((resolve, reject) => {
        p.resolve = resolve;
        p.reject = reject;
    });
    return p;
}
exports.defer = defer;

},{}]},{},[2]);
