import type { kernel, os } from "../../../kate-core";

declare var Kate: {
  kernel: typeof kernel;
  os: typeof os;
};

async function load_script(url: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.onload = () => resolve();
    script.onerror = (ev, source, lineno, colno, error) => {
      console.error(
        `[Kate] failed to load script at ${url}`,
        ev,
        source,
        lineno,
        colno,
        error
      );
      reject(new Error(`failed to load script at ${url}`));
    };
    script.src = url;
    document.body.appendChild(script);
  });
}

async function main() {
  await load_script("kate.js");

  const kate = Kate.kernel.KateKernel.from_root(
    document.querySelector(".kate")!,
    {
      mode: "native",
      persistent_storage: true,
    }
  );
  const kate_os = await Kate.os.KateOS.boot(kate);
}

main();
