import { AuditMessage, AuditResource } from "../../../data";
import {
  Observable,
  fine_grained_relative_date,
  unreachable,
} from "../../../utils";
import type { KateOS } from "../../os";
import * as UI from "../../ui";

export class SceneAuditLog extends UI.SimpleScene {
  icon = "eye";
  title = ["Audit log"];

  async body() {
    const data = await this.os.audit_supervisor.read_recent();

    return [log_view(this.os, data, { page_size: 100 })];
  }
}

function log_view(
  os: KateOS,
  data: { total: number; logs: AuditMessage[] },
  options: { page_size: number }
) {
  let page = new Observable(0);
  const current = page.map((page) => {
    const start = page * options.page_size;
    const logs = data.logs.slice(start, start + options.page_size);
    const has_next = data.logs.length > start + options.page_size;
    const has_prev = start > 0;
    return { start, logs, has_next, has_prev };
  });
  const message = current.map<UI.Widgetable>(
    (x) =>
      `Displaying ${x.start + 1} to ${x.start + x.logs.length} (of ${
        data.total
      })`
  );

  function render_resource(x: AuditResource) {
    switch (x) {
      case "error":
        return UI.fa_icon("circle-xmark");
      case "kate:capture":
        return UI.fa_icon("camera");
      case "kate:cartridge":
        return UI.fa_icon("ghost");
      case "kate:habits":
        return UI.fa_icon("calendar");
      case "kate:permissions":
        return UI.fa_icon("key");
      case "kate:settings":
        return UI.fa_icon("gear");
      case "kate:storage":
        return UI.fa_icon("hard-drive");
      case "kate:version":
        return UI.fa_icon("rotate");
      case "navigate":
        return UI.fa_icon("globe");
      default:
        throw unreachable(x, "audit resource");
    }
  }

  function render_entry(x: AuditMessage) {
    return UI.interactive(
      os,
      UI.h("div", { class: "kate-ui-logview-entry", "data-risk": x.risk }, [
        UI.h("div", { class: "kate-ui-logview-entry-heading" }, [
          UI.h(
            "div",
            { class: "kate-ui-logview-process", title: x.process_id },
            [x.process_id]
          ),
          UI.h(
            "div",
            { class: "kate-ui-logview-date", title: x.time.toISOString() },
            [fine_grained_relative_date(x.time)]
          ),
          UI.h("div", { class: "kate-ui-logview-resources" }, [
            ...[...x.resources.values()].map(render_resource),
          ]),
        ]),
        UI.h("div", { class: "kate-ui-logview-entry-message" }, [x.message]),
        UI.when(x.extra != null, [
          UI.h("div", { class: "kate-ui-logview-extra" }, [
            JSON.stringify(x.extra, null, 2),
          ]),
        ]),
      ]),
      []
    );
  }
  const table = current.map<UI.Widgetable>((x) => {
    return UI.h("div", { class: "kate-ui-logview-data" }, [
      ...x.logs.map(render_entry),
    ]);
  });

  return UI.h("div", { class: "kate-ui-logview" }, [
    UI.h("div", { class: "kate-ui-logview-meta-heading" }, [
      UI.dynamic(message),
    ]),
    UI.dynamic(table),
    UI.h("div", { class: "kate-ui-logview-pagination" }, [
      UI.dynamic(
        current.map<UI.Widgetable>((x) => {
          return UI.fragment([
            UI.when(x.has_prev, [
              UI.text_button(os, "Previous page", {
                on_click: () => {
                  page.value = page.value - 1;
                },
              }),
            ]),
            UI.when(x.has_next, [
              UI.text_button(os, "Next page", {
                on_click: () => {
                  page.value = page.value + 1;
                },
              }),
            ]),
          ]);
        })
      ),
    ]),
  ]);
}
