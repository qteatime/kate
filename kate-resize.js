void (async function () {
  const kate_body = document.querySelector(".kate-body");
  const kate_engraving = document.querySelector(".kate-engraving");

  function on_screen_size() {
    const kw = 1310;
    const iw = window.innerWidth;
    const ih = window.innerHeight;
    let zoom = iw / kw;
    if (kw > iw) {
      kate_body.style.zoom = `${zoom}`;
    } else {
      zoom = 1;
      kate_body.style.zoom = "1";
    }
    kate_body.setAttribute("data-zoom", zoom);
    kate_body.style.left = `${Math.round(
      (iw - kate_body.offsetWidth * zoom) / 2
    )}px`;
    kate_body.style.top = `${Math.round(
      (ih - kate_body.offsetHeight * zoom) / 2
    )}px`;
    window.scrollTo({ left: 0, top: 0 });
    document.body.scroll({ left: 0, top: 0 });
  }

  async function to_fullscreen() {
    try {
      await document.body.requestFullscreen({ navigationUI: "hide" });
      await screen.orientation.lock("landscape");
    } catch (error) {
      console.log("[Kate] orientation lock or fullscreen not supported");
    }
  }

  window.addEventListener("resize", () => on_screen_size());
  on_screen_size();
  window.addEventListener("load", () => on_screen_size());

  kate_engraving.addEventListener("click", to_fullscreen);
})();
