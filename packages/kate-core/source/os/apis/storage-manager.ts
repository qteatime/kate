import { foldl } from "../../utils";
import * as Db from "../../data";
import type { KateOS } from "../os";

type ApplicationVersion = {
  version_id: string | null;
  cartridge_in_bytes: number;
  usage: {
    data_in_bytes: number;
    buckets: number;
    entries: number;
  };
  quota: {
    data_in_bytes: number;
    buckets: number;
    entries: number;
  };
};

type Application = {
  id: string;
  title: string;
  icon_url: string;
  media_usage: {
    size_in_bytes: number;
    count: number;
  };
  versions: ApplicationVersion[];
};

export class KateStorageManager {
  constructor(readonly os: KateOS) {}

  async storage_summary() {
    const estimate = await navigator.storage.estimate();
    return {
      quota: estimate.quota ?? null,
      usage: estimate.usage ?? 0,
    };
  }

  async estimate_media() {
    return this.os.capture.usage_estimates();
  }

  async estimate_save_data() {
    return this.os.object_store.usage_estimates();
  }

  async estimate_applications() {
    return this.os.cart_manager.usage_estimates();
  }

  async estimate() {
    const media = await this.estimate_media();
    const save_data = await this.estimate_save_data();
    const applications = await this.estimate_applications();
    const device = await this.storage_summary();

    const media_usage = foldl(media.values(), 0, (total, x) => total + x.size);
    const save_data_usage = foldl(
      save_data.values(),
      0,
      (total, quotas) =>
        total + quotas.reduce((x, quota) => x + quota.current_size_in_bytes, 0)
    );
    const applications_usage = foldl(
      applications.values(),
      0,
      (total, versions) =>
        total + versions.reduce((x, version) => x + version.size, 0)
    );

    const totals = {
      quota: device.quota ?? device.usage,
      system:
        device.usage - (media_usage + save_data_usage + applications_usage),
      media: media_usage,
      save_data: save_data_usage,
      applications: applications_usage,
    };

    const cartridges = new Map<string, Application>();
    for (const [id, app_versions] of applications.entries()) {
      const media_usage = media.get(id) ?? { count: 0, size: 0 };
      const save_data_usage = save_data.get(id) ?? [];
      const save_versions = new Map<string, Db.CartridgeQuota>(
        save_data_usage.map((x) => [x.version_id, x])
      );
      const current_version: (typeof app_versions)[0] | null =
        app_versions.find((x) => x.status === "active") ??
        app_versions[0] ??
        null;

      const versions = new Map<string, ApplicationVersion>();
      for (const version of app_versions) {
        const save_data_version = save_versions.get(version.version) ?? null;

        versions.set(version.version, {
          version_id: version.version,
          cartridge_in_bytes: version.size,
          usage: {
            data_in_bytes: save_data_version?.current_size_in_bytes ?? 0,
            buckets: save_data_version?.current_buckets_in_storage ?? 0,
            entries: save_data_version?.current_items_in_storage ?? 0,
          },
          quota: {
            data_in_bytes: save_data_version?.maximum_size_in_bytes ?? 0,
            buckets: save_data_version?.maximum_buckets_in_storage ?? 0,
            entries: save_data_version?.maximum_items_in_storage ?? 0,
          },
        });
      }

      cartridges.set(id, {
        id: id,
        icon_url: current_version?.thumbnail_url ?? null,
        media_usage: {
          size_in_bytes: media_usage.size,
          count: media_usage.count,
        },
        title: current_version?.meta.metadata.game.title ?? id,
        versions: [...versions.values()],
      });
    }

    return { totals, cartridges };
  }
}
