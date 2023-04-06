void (async function () {
  "strict mode";
  const global_eval = eval;
  const code = await fetch("kate.js").then((x) => x.text());
  global_eval(code);

  const kate = Kate.kernel.KateKernel.from_root(
    document.querySelector(".kate"),
    {
      mode: "native",
      persistent_storage: true,
    }
  );
  const kate_os = await Kate.os.KateOS.boot(kate);
})();
