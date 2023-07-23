import type { KateOS } from "../os";
import * as UI from "../ui";

export class KateBrowser {
  private pending_request: boolean = false;
  readonly SUPPORTED_PROTOCOLS = ["http:", "https:"];

  constructor(readonly os: KateOS) {}

  async open(requestee: string, url: URL) {
    if (this.pending_request) {
      console.error(
        `Blocked ${requestee} from opening URL ${url}: a request is already pending`
      );
      return;
    }
    if (!this.SUPPORTED_PROTOCOLS.includes(url.protocol)) {
      console.error(
        `Blocked ${requestee} from opening URL with unsupported protocol ${url}`
      );
      return;
    }
    if (url.username !== "" || url.password !== "") {
      console.error(
        `Blocked ${requestee} from opening URL with authentication details ${url}`
      );
      return;
    }

    this.pending_request = true;
    const ok = await this.os.dialog.confirm("kate:browser", {
      title: "Navigate outside of Kate?",
      message: UI.stack([
        UI.paragraph([
          UI.strong([UI.mono_text([requestee])]),
          " wants to open:",
        ]),
        UI.h("div", { class: "kate-ui-highlight-url", title: url.toString() }, [
          shorten(url),
        ]),
      ]),
      dangerous: true,
      cancel: "Cancel",
      ok: "Continue to website",
    });
    this.pending_request = false;

    if (!ok) {
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function shorten(url: URL) {
  const MAX_LENGTH = 100;
  const MAX_DOMAIN = 70;
  const MAX_REST = 10;

  switch (url.protocol) {
    case "http:":
    case "https:": {
      const domain = shorten_mid(url.hostname, MAX_DOMAIN);
      const port = url.port ? UI.mono_text([`:${url.port}`]) : null;
      const protocol =
        url.protocol === "http:" ? UI.mono_text(["http://"]) : "";
      return UI.flow([
        protocol,
        domain,
        port,
        shorten_end(url.pathname, MAX_REST),
        shorten_end(url.search, MAX_REST),
        shorten_end(url.hash, MAX_REST),
      ]);
    }

    case "mailto:": {
      return shorten_end(url.href, MAX_LENGTH);
    }

    default:
      throw new Error(`Unsupported protocol ${url.protocol}`);
  }
}

function shorten_end(text: string, max: number) {
  const chars = [...text];
  if (chars.length > max) {
    return UI.flow([
      UI.mono_text([chars.slice(0, max).join("")]),
      UI.chip([`...${chars.length - max} characters omitted`]),
    ]);
  } else {
    return UI.mono_text([text]);
  }
}

function shorten_mid(text: string, max: number) {
  const chars = [...text];
  if (chars.length > max) {
    const mid = Math.floor(max / 2);
    return UI.flow([
      UI.mono_text([chars.slice(0, mid).join("")]),
      UI.chip([`...${chars.length - max} characters omitted...`]),
      UI.mono_text([chars.slice(chars.length - mid).join("")]),
    ]);
  } else {
    return UI.mono_text([text]);
  }
}
