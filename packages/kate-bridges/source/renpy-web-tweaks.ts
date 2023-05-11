declare var VERSION: { major: number; minor: number };

void (function () {
  function hide_hamburger_menu() {
    switch (VERSION.major) {
      case 7:
      case 8: {
        const css = document.createElement("style");
        css.textContent = `
        #ContextContainer {
          display: none !important;
        }
        `;
        document.head.appendChild(css);
        break;
      }

      default:
        console.warn(`Unsupported Ren'Py version ${VERSION.major}`);
    }
  }

  hide_hamburger_menu();
})();
