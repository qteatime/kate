import { CartMeta } from "../cart";
import type { AnyCapability } from "./definitions";
import { grants_from_cartridge } from "./serialisation";

export type RiskCategory = "none" | "low" | "medium" | "high" | "critical";

export function risk_from_cartridge(cart: CartMeta): RiskCategory {
  const capabilities = grants_from_cartridge(cart);
  return capabilities
    .map((x) => x.risk_category())
    .reduce(combine_risk, "none");
}

export function risk_from_grants(grants: AnyCapability[]) {
  return grants.map((x) => x.risk_category()).reduce(combine_risk, "none");
}

export function combine_risk(a: RiskCategory, b: RiskCategory) {
  return compare_risk(a, b) < 0 ? a : b;
}

export function compare_risk(a: RiskCategory, b: RiskCategory) {
  const risks = ["none", "low", "medium", "high", "critical"];
  const aindex = risks.indexOf(a);
  const bindex = risks.indexOf(b);
  return bindex > aindex ? 1 : aindex > bindex ? -1 : 0;
}
