type Vendor = {
  devices: { [key: string]: Device | null };
};
type Device = string;
type Map = { [key: string]: Vendor | null };

export const id_mapping: Map = {
  "057e": {
    // Nintendo
    devices: {
      "2006": "Joy-Con (L)",
      "2007": "Joy-Con (R)",
      "2009": "Switch Pro Controller",
      "200e": "Joy-Con (L + R)",
    },
  },
  "054c": {
    // Sony
    devices: {
      "0ce6": "DualSense Wireless Controller",
    },
  },
  "045e": {
    // Microsoft/generic controllers
    devices: {
      "0b13": "XBox Wireless Controller",
      "02e0": "8BitDo SN30 pro",
    },
  },
};

export function vendor(x: string) {
  const m = x.match(/\bvendor:\s*([0-9a-f]+)/i);
  if (m != null) {
    return m[1].toLowerCase();
  } else {
    return null;
  }
}

export function product(x: string) {
  const m = x.match(/\bproduct:\s*([0-9a-f]+)/i);
  if (m != null) {
    return m[1].toLowerCase();
  } else {
    return null;
  }
}

export function friendly_product(x: string) {
  const vendor_id = vendor(x);
  const product_id = product(x);
  if (vendor_id == null || product_id == null) {
    return null;
  } else {
    const details = id_mapping[vendor_id];
    return details?.devices[product_id] ?? null;
  }
}

export function friendly_gamepad_id(x: string) {
  return friendly_product(x) ?? x.replace(/(.*?)\(.*/, (_, name) => name);
}
