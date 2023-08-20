import * as Db from "../../../data";
import * as Cart from "../../../cart";
import { Observable } from "../../../utils";
import { Security } from "../../apis";
import { CartChangeReason, KateOS } from "../../os";
import * as Capability from "../../../capabilities";
import * as UI from "../../ui";

type Risk = {
  cart: Db.CartMeta;
  grants: Capability.AnyCapability[];
  risk: Capability.RiskCategory;
  potential_risk: Capability.RiskCategory;
};

export class ScenePermissions extends UI.SimpleScene {
  icon = "key";
  title = ["Permissions"];

  on_attached(): void {
    super.on_attached();
    this.os.events.on_cart_changed.listen(this.reload);
  }

  on_detached(): void {
    super.on_detached();
    this.os.events.on_cart_changed.listen(this.reload);
  }

  reload = async (x: { id: string; reason: CartChangeReason }) => {
    const body = await this.body();
    const container = this.canvas.querySelector(".kate-os-screen-body")!;
    container.textContent = "";
    container.append(UI.fragment(body));
  };

  async body() {
    const cartridges0 = await this.os.cart_manager.list_all();
    const cartridges1 = await Promise.all(
      cartridges0.map(async (x) => {
        const grants = await this.os.capability_supervisor.all_grants(x.id);
        const risk = Capability.risk_from_grants(grants);
        return {
          cart: x,
          grants,
          risk,
          potential_risk: Capability.risk_from_cartridge(x),
        };
      })
    );
    const cartridges = cartridges1.sort((a, b) =>
      Capability.compare_risk(a.risk, b.risk)
    );
    const security = new Observable(this.os.settings.get("security"));

    return [
      UI.section({
        title: "Risk profile",
        contents: [
          "We'll use this to make permission popups more relevant to you.",
          UI.vspace(8),
          UI.link_card(this.os, {
            arrow: "pencil",
            click_label: "Change",
            title: "Prompt me for features with this risk:",
            description: `
              We'll ask permission for higher risk features, and just summarise
              others when you install/update a cartridge.
            `,
            value: UI.dynamic(security.map<UI.Widgetable>((x) => x.prompt_for)),
            on_click: () => {
              this.select_prompt_for(security);
            },
          }),
        ],
      }),

      ...cartridges.map((x) => this.render_cartridge_summary(x)),
    ];
  }

  render_cartridge_summary(x: Risk) {
    return UI.link_card(this.os, {
      icon: x.cart.thumbnail_dataurl
        ? UI.image(x.cart.thumbnail_dataurl)
        : UI.no_thumbnail(),
      title: x.cart.metadata.presentation.title,
      click_label: "Details",
      value: x.risk,
      description: `Potential risk: ${x.potential_risk} | Current risk: ${x.risk}`,
      on_click: () => {
        const scene = new SceneCartridgePermissions(this.os, x.cart);
        scene.on_close.listen(() => this.refresh());
        this.os.push_scene(scene);
      },
    });
  }

  async select_prompt_for(current: Observable<Security>) {
    const result = await this.os.dialog.pop_menu(
      "kate:settings",
      "Prompt me features at least:",
      [
        { label: "Low risk", value: "low" as const },
        { label: "Medium risk", value: "medium" as const },
        { label: "High risk", value: "high" as const },
        { label: "Critical risk", value: "critical" as const },
      ],
      null
    );
    if (result == null) {
      return;
    }

    this.set_security(current, { prompt_for: result });
  }

  async set_security(
    current: Observable<Security>,
    changes: Partial<Security>
  ) {
    current.value = { ...current.value, ...changes };
    await this.os.settings.update("security", (_) => current.value);
    await this.os.audit_supervisor.log("kate:settings", {
      resources: ["kate:settings"],
      risk: "high",
      type: "kate.settings.security.updated",
      message: `Updated security settings`,
      extra: changes,
    });
  }
}

export class SceneCartridgePermissions extends UI.SimpleScene {
  icon = "key";
  get title() {
    return [this.cart.metadata.presentation.title];
  }

  constructor(readonly os: KateOS, readonly cart: Cart.CartMeta) {
    super(os);
  }

  async body() {
    const grants0 = await this.os.capability_supervisor.all_grants(
      this.cart.id
    );
    const grants = grants0.sort((a, b) =>
      Capability.compare_risk(a.risk_category(), b.risk_category())
    );

    return [
      UI.hbox(0.5, [
        UI.mono_text([this.cart.id]),
        UI.meta_text(["|"]),
        UI.mono_text([`v${this.cart.version}`]),
      ]),
      UI.vspace(16),

      ...grants.map((x) => this.render_grant(x)),
    ];
  }

  render_grant(x: Capability.AnyCapability) {
    if (x instanceof Capability.SwitchCapability) {
      return UI.toggle_cell(this.os, {
        title: x.title,
        description: x.description,
        value: x.grant_configuration,
        on_changed: (new_value) => {
          this.grant_switch(x, new_value);
        },
      });
    } else {
      throw new Error(`Invalid capability: ${x.type}`);
    }
  }

  async grant_switch(x: Capability.AnySwitchCapability, value: boolean) {
    x.update(value);
    await this.os.capability_supervisor.update_grant(this.cart.id, x);
    await this.os.audit_supervisor.log("kate:settings", {
      resources: ["kate:permissions"],
      risk: x.risk_category(),
      type: "kate.security.permissions.updated",
      message: `Updated security permissions for ${this.cart.id}`,
      extra: { cartridge: this.cart.id, permission: x.type, granted: value },
    });
  }
}
