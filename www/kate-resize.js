void (async function() {
  const kate_body = document.querySelector(".kate-body");

  function on_screen_size() {
    const kw = 1310;
    const iw = window.innerWidth;
    if (kw > iw) {
      kate_body.style.zoom = `${iw/kw}`;
    } else {
      kate_body.style.zoom = "1";
    }
  }

  window.addEventListener("resize", () => on_screen_size());
  on_screen_size();
})();