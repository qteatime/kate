export {};

type SystemInfo = {
  app: {
    wrapper: string;
    version: string;
  };
  engine: {
    name: string;
    version: string;
  }[];
  memory: {
    total: number;
    free: number;
  };
  os: {
    name: string;
    platform: NodeJS.Platform;
    version: string;
    extended_version: string;
    arm64_translation: boolean;
    architecture: string;
  };
  cpu: {
    logical_cores: number;
    model: string;
    speed: number;
    endianness: "BE" | "LE";
  };
};

declare global {
  var KateNative: {
    is_native: boolean;
    get_system_information(): Promise<SystemInfo>;
    resize(size: { width: number; height: number }): Promise<void>;
    toggle_fullscreen(flag: boolean): Promise<void>;
  } | null;
}
