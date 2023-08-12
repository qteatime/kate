import { AuditMessage, AuditResource } from "../../../data";
import {
  Observable,
  fine_grained_relative_date,
  unreachable,
} from "../../../utils";
import { Audit } from "../../apis";
import type { KateOS } from "../../os";
import * as UI from "../../ui";

function format_retention(days: number) {
  if (!Number.isFinite(days)) {
    return "forever";
  } else if (days === 365) {
    return "1 year";
  } else if (days >= 365) {
    const years = Math.floor(days / 365);
    return `${years} years`;
  } else {
    return `${days} days`;
  }
}

export class SceneAudit extends UI.SimpleScene {
  icon = "eye";
  title = ["Audit"];

  body() {
    const config = new Observable(this.os.settings.get("audit"));

    return [
      UI.link_card(this.os, {
        arrow: "pencil",
        click_label: "Change",
        title: `Log retention period`,
        description: `Log entries older than this will be removed automatically to save storage space.`,
        value: UI.dynamic(
          config.map<UI.Widgetable>((x) =>
            format_retention(x.log_retention_days)
          )
        ),
        on_click: () => {
          this.select_retention_days(config);
        },
      }),

      UI.vspace(32),

      UI.link_card(this.os, {
        icon: "eye",
        title: "Audit log",
        description:
          "See all actions taken on your behalf and any errors that happened.",
        on_click: () => {
          this.os.push_scene(new SceneAuditLog(this.os));
        },
      }),
    ];
  }

  async select_retention_days(current: Observable<Audit>) {
    const result = await this.os.dialog.pop_menu(
      "kate:settings",
      "Keep logs for at least:",
      [
        { label: "30 days", value: 30 },
        { label: "90 days", value: 90 },
        { label: "1 year", value: 365 },
        { label: "3 years", value: 365 * 3 },
        { label: "forever", value: Infinity },
      ],
      null
    );

    if (result == null) {
      return;
    }

    current.value = { ...current.value, log_retention_days: result };
    await this.os.settings.update("audit", (_) => current.value);
    await this.os.audit_supervisor.log("kate:settings", {
      resources: ["kate:settings"],
      risk: "high",
      type: "kate.settings.audit.updated",
      message: `Updated log retention to ${format_retention(result)}`,
      extra: { log_retention_days: result },
    });
  }
}

export class SceneAuditLog extends UI.SimpleScene {
  icon = "eye";
  title = ["Audit log"];
  page = new Observable(0);
  PAGE_SIZE = 100;

  async body() {
    const data = await this.os.audit_supervisor.read_recent();

    return [this.log_view(data)];
  }

  log_view(data: { total: number; logs: AuditMessage[] }) {
    const page = this.page;
    const page_size = this.PAGE_SIZE;

    const current = page.map((page) => {
      const start = page * page_size;
      const logs = data.logs.slice(start, start + page_size);
      const has_next = data.logs.length > start + page_size;
      const has_prev = start > 0;
      return { start, logs, has_next, has_prev };
    });

    const message = current.map<UI.Widgetable>(
      (x) =>
        `Displaying ${x.start + 1} to ${x.start + x.logs.length} (of ${
          data.total
        })`
    );

    const table = current.map<UI.Widgetable>((x) => {
      return UI.h("div", { class: "kate-ui-logview-data" }, [
        ...x.logs.map((a) => this.render_entry(a)),
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
                UI.text_button(this.os, "Previous page", {
                  on_click: () => {
                    page.value = page.value - 1;
                  },
                }),
              ]),
              UI.when(x.has_next, [
                UI.text_button(this.os, "Next page", {
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

  render_entry(x: AuditMessage) {
    return UI.interactive(
      this.os,
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
      [
        {
          key: ["o"],
          label: "View",
          on_click: true,
          handler: () => {
            this.os.push_scene(new SceneAuditEntry(this.os, this, x));
          },
        },
      ]
    );
  }
}

export class SceneAuditEntry extends UI.SimpleScene {
  icon = "eye";
  title = ["Audit log"];

  readonly actions: UI.Action[] = [
    {
      key: ["x"],
      label: "Return",
      handler: () => this.on_return(),
    },
    {
      key: ["menu"],
      label: "Options",
      handler: () => this.on_options(),
    },
  ];

  constructor(
    os: KateOS,
    readonly logview: SceneAuditLog,
    readonly entry: AuditMessage
  ) {
    super(os);
  }

  async body() {
    const x = this.entry;

    return [
      UI.scroll([
        UI.h("div", { class: "kate-ui-audit-entry" }, [
          UI.h(
            "div",
            { class: "kate-ui-logview-entry-heading", "data-risk": x.risk },
            [
              UI.h(
                "div",
                { class: "kate-ui-logview-process", title: x.process_id },
                [x.process_id]
              ),
              UI.h("div", { class: "kate-ui-logview-risk" }, [
                `(${x.risk} risk)`,
              ]),
              UI.h(
                "div",
                { class: "kate-ui-logview-date", title: x.time.toISOString() },
                [fine_grained_relative_date(x.time)]
              ),
              UI.h("div", { class: "kate-ui-logview-resources" }, [
                ...[...x.resources.values()].map(render_resource),
              ]),
            ]
          ),
          UI.h("div", { class: "kate-ui-audit-entry-message" }, [x.message]),
          UI.h("div", { class: "kate-ui-audit-entry-extra" }, [
            JSON.stringify(x.extra, null, 2),
          ]),
        ]),
      ]),
    ];
  }

  async on_options() {
    const result = await this.os.dialog.pop_menu(
      "kate:audit",
      "",
      [
        {
          label: "Delete",
          value: "delete" as const,
        },
      ],
      null
    );
    switch (result) {
      case "delete": {
        await this.os.audit_supervisor.remove(this.entry.id);
        await this.logview.refresh();
        this.os.pop_scene(this);
        break;
      }
      case null: {
        break;
      }
      default:
        throw unreachable(result);
    }
  }
}

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
    case "kate:ui":
      return UI.fa_icon("window-maximize");
    case "kate:audit":
      return UI.fa_icon("eye");
    case "navigate":
      return UI.fa_icon("globe");
    case "device-fs":
      return UI.fa_icon("laptop-file");
    default:
      throw unreachable(x, "audit resource");
  }
}
