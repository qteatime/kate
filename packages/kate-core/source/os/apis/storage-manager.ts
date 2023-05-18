import { foldl, mb } from "../../utils";
import * as Db from "../../data";
import type { KateOS } from "../os";
import { KateObjectStore } from "./object-store";

export type AppStorageDetails = {
  id: string;
  title: string;
  icon_url: string;
  version_id: string;
  status: Db.CartridgeStatus;
  dates: {
    last_used: Date | null;
    play_time: number | null;
    installed: Date;
    last_modified: Date;
  };
  usage: {
    cartridge_size_in_bytes: number;
    media: {
      size_in_bytes: number;
      count: number;
    };
    data: {
      size_in_bytes: number;
      buckets: number;
      entries: number;
    };
    shared_data: {
      size_in_bytes: number;
      buckets: number;
      entries: number;
    };
    total_in_bytes: number;
  };
  quota: {
    data: {
      size_in_bytes: number;
      buckets: number;
      entries: number;
    };
    shared_data: {
      size_in_bytes: number;
      buckets: number;
      entries: number;
    };
  };
};

export class KateStorageManager {
  static SYSTEM_PADDING = mb(256);

  constructor(readonly os: KateOS) {}

  async storage_summary() {
    const estimate = await navigator.storage.estimate();
    return {
      quota: estimate.quota ?? null,
      usage: estimate.usage ?? 0,
      reserved: KateStorageManager.SYSTEM_PADDING,
    };
  }

  async can_fit(size: number) {
    const estimate = await this.storage_summary();
    if (estimate.quota == null) {
      return true;
    } else {
      return (
        estimate.usage + size <
        estimate.quota - KateStorageManager.SYSTEM_PADDING
      );
    }
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

  async try_estimate_cartridge(cart_id: string) {
    const estimate = await this.estimate();
    return estimate.cartridges.get(cart_id) ?? null;
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
      (total, app) => total + app.size
    );

    const totals = {
      quota: device.quota ? device.quota - device.reserved : device.usage,
      media: media_usage,
      save_data: save_data_usage,
      applications: applications_usage,
      used: device.usage,
      get system() {
        return device.usage - this.user;
      },
      get user() {
        return this.media + this.save_data + this.applications;
      },
    };

    const cartridges = new Map<string, AppStorageDetails>();
    for (const [id, app] of applications.entries()) {
      const habits = await this.os.play_habits.try_get(id);
      const media_usage = media.get(id) ?? { count: 0, size: 0 };
      const save_data_usage = save_data.get(id) ?? [];
      const save_versions = new Map<string, Db.CartridgeQuota>(
        save_data_usage.map((x) => [x.version_id, x])
      );
      const unversioned =
        save_versions.get(KateObjectStore.UNVERSIONED_KEY) ?? null;
      const versioned = save_versions.get(app.version_id) ?? null;

      cartridges.set(id, {
        id: id,
        title: app.meta.metadata.game.title,
        icon_url: app.thumbnail_url,
        version_id: app.version_id,
        status: app.status,
        dates: {
          last_used: habits?.last_played ?? null,
          play_time: habits?.play_time ?? null,
          installed: app.meta.installed_at,
          last_modified: app.meta.updated_at,
        },
        usage: {
          cartridge_size_in_bytes: app.size,
          media: {
            size_in_bytes: media_usage.size,
            count: media_usage.count,
          },
          data: {
            size_in_bytes: versioned?.current_size_in_bytes ?? 0,
            buckets: versioned?.current_buckets_in_storage ?? 0,
            entries: versioned?.current_items_in_storage ?? 0,
          },
          shared_data: {
            size_in_bytes: unversioned?.current_size_in_bytes ?? 0,
            buckets: unversioned?.current_buckets_in_storage ?? 0,
            entries: unversioned?.current_items_in_storage ?? 0,
          },
          get total_in_bytes(): number {
            return (
              this.cartridge_size_in_bytes +
              this.media.size_in_bytes +
              this.data.size_in_bytes +
              this.shared_data.size_in_bytes
            );
          },
        },
        quota: {
          data: {
            size_in_bytes: versioned?.maximum_size_in_bytes ?? 0,
            buckets: versioned?.maximum_buckets_in_storage ?? 0,
            entries: versioned?.maximum_items_in_storage ?? 0,
          },
          shared_data: {
            size_in_bytes: unversioned?.maximum_size_in_bytes ?? 0,
            buckets: unversioned?.maximum_buckets_in_storage ?? 0,
            entries: unversioned?.maximum_items_in_storage ?? 0,
          },
        },
      });
    }

    return { totals, cartridges };
  }
}
