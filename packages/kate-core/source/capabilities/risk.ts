/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
 */

import { CartMeta } from "../cart";
import type { AnyCapability } from "./definitions";
import { grants_from_cartridge } from "./serialisation";

export type RiskCategory = "none" | "low" | "medium" | "high" | "critical";

export function risk_from_cartridge(cart: CartMeta): RiskCategory {
  const capabilities = grants_from_cartridge(cart);
  return capabilities.map((x) => x.risk_category()).reduce(combine_risk, "none");
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
