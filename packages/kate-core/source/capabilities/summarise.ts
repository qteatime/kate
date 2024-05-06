/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { CartMeta } from "../cart";
import type { AnyCapability, CategorySummary } from "./definitions";
import { RiskCategory, compare_risk } from "./risk";
import { grants_from_cartridge } from "./serialisation";

type RiskSummary = {
  acceptable: CategorySummary[];
  to_review: AnyCapability[];
};

export function summarise_from_cartridge(cart: CartMeta, max_risk: RiskCategory): RiskSummary {
  const categories = new Map<string, AnyCapability>();
  const grants0 = grants_from_cartridge(cart).filter((x) => !x.is_contextual);
  const summarised = grants0.filter((x) => compare_risk(x.base_risk, max_risk) < 0);
  const to_review = grants0.filter((x) => compare_risk(x.base_risk, max_risk) >= 0);

  for (const grant of summarised) {
    const grant_summary = grant.summary!;

    const old = categories.get(grant_summary.category);
    if (old) {
      categories.set(grant_summary.category, grant_summary.combine(old));
    } else {
      categories.set(grant_summary.category, grant);
    }
  }

  return {
    acceptable: [...categories.values()].map((x) => x.summary!),
    to_review: to_review,
  };
}
