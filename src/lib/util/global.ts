/** 80**************************************************************************
 * Util for global (besides others)
 *
 * @module lib/util/global
 * @license BSD-3-Clause
 ******************************************************************************/

import type { uint } from "../alias.ts";
/*80--------------------------------------------------------------------------*/

const space_a_: (string | undefined)[] = [];
export const space = (n_: uint) => {
  if (space_a_[n_] === undefined) {
    space_a_[n_] = new Array(n_).fill(" ").join("");
  }
  return space_a_[n_]!;
};
/*80--------------------------------------------------------------------------*/
