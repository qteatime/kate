import { from_bytes, mb } from "../../../utils";
import * as UI from "../../ui";

export class SceneStorageSettings extends UI.SimpleScene {
  icon = "hard-drive";
  title = ["Storage"];

  async body() {
    const estimates = await this.os.storage_manager.estimate();

    return [
      UI.section({
        title: `Storage summary (${from_bytes(estimates.totals.quota)})`,
        contents: [
          UI.stack_bar({
            total: estimates.totals.quota,
            minimum_component_size: 0.005,
            free: {
              title: "Free",
              display_value: from_bytes(
                estimates.totals.quota -
                  (estimates.totals.applications +
                    estimates.totals.media +
                    estimates.totals.save_data +
                    estimates.totals.system)
              ),
            },
            components: [
              {
                title: "System",
                value: estimates.totals.system,
                display_value: from_bytes(estimates.totals.system),
              },
              {
                title: "Media",
                value: estimates.totals.media,
                display_value: from_bytes(estimates.totals.media),
              },
              {
                title: "Cartridges",
                value: estimates.totals.applications,
                display_value: from_bytes(estimates.totals.applications),
              },
              {
                title: "Saves",
                value: estimates.totals.save_data,
                display_value: from_bytes(estimates.totals.save_data),
              },
            ],
          }),
        ],
      }),
    ];
  }
}
