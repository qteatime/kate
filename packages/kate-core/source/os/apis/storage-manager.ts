import {
  foldl,
  make_empty_thumbnail,
  make_thumbnail_from_bytes,
  mb,
} from "../../utils";
import * as Db from "../../data";
import type { KateOS } from "../os";
import { KateObjectStore } from "./object-store";
import { Cart, CartMeta } from "../../cart";

export type AppStorageDetails = {
  id: string;
  title: string;
  icon_url: string | null;
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
  static MINIMUM_FREE_SPACE = mb(256);
  static ALERT_USAGE_PERCENT = 0.8;
  private _setup: boolean = false;

  constructor(readonly os: KateOS) {}

  setup() {
    if (this._setup) {
      throw new Error(`setup() called twice`);
    }
    this._setup = true;
    this.os.events.on_cart_changed.listen(() => this.check_storage_health());
    setInterval(() => this.check_storage_health(), 1_000 * 60 * 30);
    this.check_storage_health();
  }

  async storage_summary() {
    const estimate = (await navigator.storage?.estimate?.()) ?? {
      quota: null,
      usage: null,
    };
    return {
      quota: estimate.quota ?? null,
      usage: estimate.usage ?? null,
      reserved: KateStorageManager.MINIMUM_FREE_SPACE,
    };
  }

  async can_fit(size: number) {
    const estimate = await this.storage_summary();
    if (estimate.quota == null || estimate.usage == null) {
      return true;
    } else {
      return (
        estimate.usage + size <
        estimate.quota - KateStorageManager.MINIMUM_FREE_SPACE
      );
    }
  }

  async check_storage_health() {
    const estimate = await this.storage_summary();
    if (estimate.quota == null || estimate.usage == null) {
      return;
    }
    const usage =
      estimate.usage / (estimate.quota - KateStorageManager.MINIMUM_FREE_SPACE);
    if (
      usage >= KateStorageManager.ALERT_USAGE_PERCENT &&
      !this.os.kernel.console.is_resource_taken("low-storage")
    ) {
      await this.os.notifications.push_transient(
        "kate:storage-manager",
        "Low storage space",
        `Your device is running out of storage space. Kate may not be fully operational.`
      );
      this.os.kernel.console.take_resource("low-storage");
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

  async try_estimate_live_cartridge(
    cart: CartMeta
  ): Promise<AppStorageDetails> {
    const { cartridges } = await this.estimate();
    const maybe_cart = cartridges.get(cart.id) ?? null;
    const media = await this.estimate_media();
    const cart_media = media.get(cart.id) ?? {
      size: 0,
      count: 0,
    };
    const saves = (await this.estimate_save_data()).get(cart.id) ?? [];
    const save_versions = new Map<string, Db.CartridgeQuota>(
      saves.map((x) => [x.version_id, x])
    );
    const unversioned =
      save_versions.get(KateObjectStore.UNVERSIONED_KEY) ?? null;
    const versioned = save_versions.get(cart.version) ?? null;

    const thumbnail = await make_empty_thumbnail(1, 1);
    return {
      id: cart.id,
      title: cart.metadata.presentation.title,
      icon_url: thumbnail,
      version_id: cart.version,
      status: "active",
      dates: {
        last_used: null,
        play_time: null,
        installed: new Date(),
        last_modified: new Date(),
      },
      usage: {
        cartridge_size_in_bytes: maybe_cart?.usage.cartridge_size_in_bytes ?? 0,
        media: {
          size_in_bytes: cart_media.size,
          count: cart_media.count,
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
    };
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
      get used() {
        return device.usage ?? this.user;
      },
      get system() {
        return device.usage == null ? 0 : device.usage - this.user;
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
        title: app.meta.metadata.presentation.title,
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
