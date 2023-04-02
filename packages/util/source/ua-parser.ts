import { unreachable } from "./assert";

/*
Copyright (c) 2023 Q.
MIT License.

Based on code for ua-parser-js
Copyright © 2012-2023 Faisal Salman <f@faisalman.com>
MIT License.
*/
type RequestField =
  | "architecture"
  | "model"
  | "platform"
  | "platformVersion"
  | "fullVersionList"
  | "bitness"
  | "form-factor"
  | "uaFullVersion"
  | "wow64";
type DetailedUA = {
  architecture: string;
  bitness: string;
  brands: { brand: string; version: string }[];
  fullVersionList: { brand: string; version: string }[];
  mobile: boolean;
  model: string;
  platform: string;
  platformVersion: string;
  uaFullVersion: string;
  wow64: boolean;
};

declare global {
  interface Navigator {
    userAgentData: {
      brands: { brand: string; version: string }[];
      mobile: boolean;
      platform: string;
      getHighEntropyValues(fields: RequestField[]): Promise<DetailedUA>;
    };
  }
}

type Extractor =
  | {
      type: "map";
      name: string;
      index: number;
      transform: (_: string) => any;
    }
  | {
      type: "put";
      name: string;
      value: any;
    };

type Candidate = {
  regex: RegExp[];
  extractors: Extractor[];
};

const re = (regex: RegExp[], extractors: Extractor[]) => {
  return { regex, extractors };
};

const put = (prop: string, value: any) =>
  ({
    type: "put" as const,
    name: prop,
    value,
  } as Extractor);
const map = (
  prop: string,
  index: number,
  transform: (_: string) => any = (x) => x
) =>
  ({
    type: "map" as const,
    name: prop,
    index,
    transform,
  } as Extractor);
const capitalise = (name: string) =>
  name.slice(0, 1).toUpperCase() + name.slice(1);

const regexes = {
  browser: [
    // # Most common
    re(
      [/\b(?:crmo|crios)\/([\w\.]+)/i],
      [map("version", 1), put("name", `Mobile Chrome`)]
    ),
    re(
      [/edg(?:e|ios|a)?\/([\w\.]+)/i],
      [map("version", 1), put("name", "Edge")]
    ),

    // # Presto based
    re(
      [
        /(opera mini)\/([-\w\.]+)/i,
        /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i,
        /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i,
      ],
      [map("name", 1), map("version", 2)]
    ),
    re(
      [/(?:opios)[\/ ]+([\w\.]+)/i],
      [map("version", 1), put("name", `Opera Mini`)]
    ),
    re([/\b(?:opr)\/([\w\.]+)/i], [map("version", 1), put("name", "Opera")]),

    // # Mixed
    re([/(?:kindle)\/([\w\.]+)/i], [put("name", "Kindle"), map("version", 1)]),
    re(
      [/(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i],
      [map("name", 1, capitalise), map("version", 2)]
    ),

    // # Tridgent based
    re(
      [/(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i],
      [map("name", 1), map("version", 2)]
    ),
    re(
      [/(?:ba?idubrowser)[\/ ]?([\w\.]+)/i],
      [put("name", "Baidu Browser"), map("version", 1)]
    ),
    re(
      [/(?:ms|\(ie) ([\w\.]+)/i],
      [put("name", "Internet Explorer"), map("version", 1)]
    ),

    // # Webkit/KHTML based
    re(
      [
        /(flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale(?!.+naver)|qqbrowserlite|qq|duckduckgo)\/([-\w\.]+)/i,
      ],
      [map("name", 1), map("version", 2)]
    ),
    re(
      [/(heytap|ovi)browser\/([\d\.]+)/i],
      [map("name", 1), map("version", 2)]
    ),
    re([/(weibo)__([\d\.]+)/i], [map("name", 1), map("version", 2)]),
    re(
      [/(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i],
      [put("name", "UCBrowser"), map("version", 1)]
    ),
    re(
      [/microm.+\bqbcore\/([\w\.]+)/i, /\bqbcore\/([\w\.]+).+microm/i],
      [
        put("name", "WeChat Desktop for Windows (built-in browser)"),
        map("version", 1),
      ]
    ),
    re(
      [/micromessenger\/([\w\.]+)/i],
      [put("name", "WeChat"), map("version", 1)]
    ),
    re(
      [/konqueror\/([\w\.]+)/i],
      [put("name", "Konqueror"), map("version", 1)]
    ),
    re(
      [/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i],
      [put("name", "IE11"), map("version", 1)]
    ),
    re(
      [/ya(?:search)?browser\/([\w\.]+)/i],
      [put("name", "Yandex"), map("version", 1)]
    ),
    re(
      [/(avast|avg)\/([\w\.]+)/i],
      [map("name", 1, (x) => `${x} Secure Browser`), map("version", 2)]
    ),
    re(
      [/\bfocus\/([\w\.]+)/i],
      [put("name", "Firefox Focus"), map("version", 1)]
    ),
    re([/\bopt\/([\w\.]+)/i], [put("name", "Opera Touch"), map("version", 1)]),
    re(
      [/coc_coc\w+\/([\w\.]+)/i],
      [put("name", "Coc Coc Browser"), map("version", 1)]
    ),
    re([/dolfin\/([\w\.]+)/i], [put("name", "Dolphin"), map("version", 1)]),
    re([/coast\/([\w\.]+)/i], [put("name", "Opera Coast"), map("version", 1)]),
    re(
      [/miuibrowser\/([\w\.]+)/i],
      [put("name", "MIUI Browser"), map("version", 1)]
    ),
    re(
      [/fxios\/([\w\.-]+)/i],
      [put("name", "Firefox for iOS"), map("version", 1)]
    ),
    re([/\bqihu|(qi?ho?o?|360)browser/i], [put("name", "360 Browser")]),
    re(
      [/(oculus|samsung|sailfish|huawei)browser\/([\w\.]+)/i],
      [map("name", 1, (x) => `${capitalise(x)} Browser`), map("version", 2)]
    ),
    re(
      [/(comodo_dragon)\/([\w\.]+)/i],
      [put("name", "Comodo Dragon"), map("version", 2)]
    ),
    re(
      [/(electron)\/([\w\.]+) safari/i],
      [put("name", "Electron"), map("version", 2)]
    ),
    re(
      [/(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i],
      [put("name", "Tesla"), map("version", 1)]
    ),
    re(
      [/m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i],
      [map("name", 1), map("version", 2)]
    ),
    re(
      [/(metasr)[\/ ]?([\w\.]+)/i],
      [put("name", "SouGouBrowser"), map("version", 2)]
    ),
    re([/(lbbrowser)/i], [put("name", "LieBao Browser"), map("version", 1)]),
    re(
      [/\[(linkedin)app\]/i],
      [put("name", "LinkedIn App for iOS & Android"), map("version", 1)]
    ),

    // Web view
    // TODO

    re(
      [/headlesschrome(?:\/([\w\.]+)| )/i],
      [put("name", "Chrome Headless"), map("version", 1)]
    ),
    re(
      [/ wv\).+(chrome)\/([\w\.]+)/i],
      [put("name", "Chrome WebView"), map("version", 2)]
    ),
    re(
      [/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i],
      [put("name", "Android Browser"), map("version", 1)]
    ),
    re(
      [/chrome\/([\w\.]+) mobile/i],
      [put("name", "Chrome Mobile"), map("version", 1)]
    ),

    // TODO
  ],

  cpu: [
    re([/\b(?:(amd|x|x86[-_]?|wow|win)64)\b/i], [put("architecture", "amd64")]),
    re(
      [/(ia32(?=;))/i, /((?:i[346]|x)86)[;\)]/i],
      [put("architecture", "ia32")]
    ),
    re([/\b(aarch64|arm(v?8e?l?|_?64))\b/i], [put("architecture", "arm64")]),
    re([/\b(arm(?:v[67])?ht?n?[fl]p?)\b/i], [put("architecture", "armhf")]),
    // PocketPC mistakenly identified as PowerPC
    re([/windows (ce|mobile); ppc;/i], [put("architecture", "arm")]),
    re(
      [/((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i],
      [put("architecture", "ppc")]
    ),
    re([/(sun4\w)[;\)]/i], [put("architecture", "sparc")]),
    re(
      [
        /((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i,
      ],
      [map("architecture", 1, (x) => x.toLowerCase())]
    ),
  ],

  engine: [
    re(
      [/windows.+ edge\/([\w\.]+)/i],
      [put("name", "Edge HTML"), map("version", 1)]
    ),
    re(
      [/webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i],
      [put("name", "Blink"), map("version", 1)]
    ),
    re([/(presto)\/([\w\.]+)/i], [put("name", "Presto"), map("version", 2)]),
    re(
      [/(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i],
      [map("name", 1), map("version", 2)]
    ),
    re([/ekioh(flow)\/([\w\.]+)/i], [put("name", "Flow"), map("version", 1)]),
    re(
      [/(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i],
      [map("name", 1), map("version", 2)]
    ),
    re(
      [/(icab)[\/ ]([23]\.[\d\.]+)/i],
      [put("name", "iCab"), map("version", 2)]
    ),
    re([/\b(libweb)/i], [put("name", "libweb")]),
    re([/rv\:([\w\.]{1,9})\b.+(gecko)/i], [put("name", "Gecko")]),
  ],

  os: [
    re(
      [/microsoft (windows) (vista|xp)/i],
      [put("name", "Windows"), map("version", 2)]
    ),
    re([/(windows) nt 6\.2; (arm)/i], [put("name", "Windows RT")]),
    re(
      [/(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i],
      [put("name", "Windows Phone"), map("version", 2)]
    ),
    re(
      [/(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i],
      [put("name", "Windows"), map("version", 2)]
    ),
    re(
      [/(win(?=3|9|n)|win 9x )([nt\d\.]+)/i],
      [put("name", "Windows"), map("version", 2)]
    ),

    re(
      [
        /ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i,
        /ios;fbsv\/([\d\.]+)/i,
      ],
      [put("name", "iOS"), map("version", 2)]
    ),
    re([/cfnetwork\/.+darwin/i], [put("name", "iOS")]),

    re([/(mac os x) ?([\w\. ]*)/i], [put("name", "MacOS"), map("version", 2)]),
    re([/(macintosh|mac_powerpc\b)(?!.+haiku)/i], [map("name", 1)]),

    re(
      [/droid ([\w\.]+)\b.+(android[- ]x86|harmonyos)/i],
      [map("name", 2), map("version", 1)]
    ),
    re(
      [
        /(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i,
      ],
      [map("name", 1), map("version", 2)]
    ),
    re([/(blackberry)\w*\/([\w\.]*)/i], [map("name", 1), map("version", 2)]),
    re([/(tizen|kaios)[\/ ]([\w\.]+)/i], [map("name", 1), map("version", 2)]),
    re([/\((series40);/i], [map("name", 1)]),
    re([/\(bb(10);/i], [put("name", "BlackBerry"), put("version", "10")]),
    re(
      [/(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i],
      [map("version", 1), put("name", "Symbian")]
    ),
    re(
      [
        /mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i,
      ],
      [map("version", 2), put("name", "FirefoxOS")]
    ),
    re(
      [/web0s;.+rt(tv)/i, /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i],
      [put("name", "webOS"), map("version", 1)]
    ),
    re(
      [/watch(?: ?os[,\/]|\d,\d\/)([\d\.]+)/i],
      [map("version", 1), put("name", "watchOS")]
    ),
    re(
      [/crkey\/([\d\.]+)/i],
      [put("name", "Google Chromecast"), map("version", 1)]
    ),
    re(
      [/(cros) [\w]+(?:\)| ([\w\.]+)\b)/i],
      [put("name", "Chrome OS"), map("version", 2)]
    ),
    re([/panasonic;(viera)/i], [put("name", "Panasonic Viera")]),
    re([/(netrange)mmh/i], [put("name", "Netrange")]),
    re([/(nettv)\/(\d+\.[\w\.]+)/i], [put("name", "NetTV"), map("version", 2)]),
    re([/(nintendo) (\w+)/i], [map("name", 2, (x) => `Nintendo ${x}`)]),
    re([/(playstation) (\w+)/i], [map("name", 2, (x) => `PlayStation ${x}`)]),
    re(
      [/(xbox); +xbox ([^\);]+)/i],
      [map("name", 2, (x) => `Microsoft Xbox ${x}`)]
    ),
    re(
      [
        /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i,
        /(mint)[\/\(\) ]?(\w*)/i,
        /(mageia|vectorlinux)[; ]/i,
        /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i,
        /(hurd|linux) ?([\w\.]*)/i,
        /(gnu) ?([\w\.]*)/i,
        /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/,
        /(haiku) (\w+)/i,
      ],
      [map("name", 1), map("version", 2)]
    ),
    re([/(sunos) ?([\w\.\d]*)/i], [put("name", "Solaris"), map("version", 2)]),
    re(
      [
        /((?:open)?solaris)[-\/ ]?([\w\.]*)/i,
        /(aix) ((\d)(?=\.|\)| )[\w\.])*/i,
        /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux|serenityos)/i,
        /(unix) ?([\w\.]*)/i,
      ],
      [map("name", 1), map("version", 2)]
    ),
  ],
};

export type UA = {
  browser: { name: string; version?: string };
  cpu: { architecture: string };
  engine: { name: string; version?: string };
  os: { name: string; version?: string };
};

export type UAInfo = {
  browser: { name: string; version?: string }[];
  cpu: { architecture: string; bitness?: string; wow64?: boolean };
  os: { name: string; version?: string };
  device: { model?: string; mobile?: boolean };
};

export async function user_agent_info(): Promise<UAInfo> {
  if (navigator.userAgentData != null) {
    return try_ua_details();
  } else {
    const ua = parse_ua(navigator.userAgent);
    return {
      browser: [ua.browser, ua.engine],
      cpu: { architecture: ua.cpu.architecture },
      os: { name: ua.os.name, version: ua.os.version },
      device: {},
    };
  }
}

async function try_ua_details(): Promise<UAInfo> {
  const ua = navigator.userAgentData;
  const parsed_details = parse_ua(navigator.userAgent);
  const brand_list = (xs: DetailedUA["brands"]) =>
    xs
      .map((x) => ({ name: x.brand, version: x.version }))
      .filter((x) => !(/\bnot/i.test(x.name) && /brand\b/i.test(x.name)));
  try {
    const details = await ua.getHighEntropyValues([
      "fullVersionList",
      "bitness",
      "architecture",
      "platform",
      "platformVersion",
      "wow64",
      "model",
    ]);
    return {
      browser: brand_list(details.fullVersionList ?? details.brands),
      cpu: {
        architecture: details.architecture ?? parsed_details.cpu.architecture,
        bitness: details.bitness,
        wow64: details.wow64,
      },
      device: {
        model: details.model,
        mobile: details.mobile,
      },
      os: {
        name: details.platform ?? parsed_details.os.name,
        version: details.platformVersion ?? parsed_details.os.version,
      },
    };
  } catch (_) {
    return {
      browser: brand_list(ua.brands),
      cpu: {
        architecture: parsed_details.cpu.architecture,
      },
      device: {
        mobile: ua.mobile,
      },
      os: {
        name: ua.platform,
        version: parsed_details.os.version,
      },
    };
  }
}

export function parse_ua(ua: string): UA {
  const result = {
    browser: { name: "unknown" },
    cpu: { architecture: "unknown" },
    engine: { name: "unknown" },
    os: { name: "unknown" },
  };
  for (const [key, candidates] of Object.entries(regexes)) {
    const parsed = parse_with_candidates(candidates, ua);
    if (parsed != null) {
      (result as any)[key] = parsed;
    }
  }
  return result;
}

function parse_with_candidates(candidates: Candidate[], ua: string) {
  for (const candidate of candidates) {
    const result = try_candidate(candidate, ua);
    if (result != null) {
      return result;
    }
  }
  return null;
}

function try_candidate(candidate: Candidate, ua: string) {
  for (const re of candidate.regex) {
    const match = ua.match(re);
    if (match != null) {
      const result: any = Object.create(null);
      for (const extractor of candidate.extractors) {
        extract(result, extractor, match);
      }
      return result;
    }
  }
  return null;
}

function extract(object: any, extractor: Extractor, match: RegExpMatchArray) {
  switch (extractor.type) {
    case "put": {
      object[extractor.name] = extractor.value;
      break;
    }

    case "map": {
      object[extractor.name] = extractor.transform(match[extractor.index]);
      break;
    }

    default:
      throw unreachable(extractor);
  }
}
