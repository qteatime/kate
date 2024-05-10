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
