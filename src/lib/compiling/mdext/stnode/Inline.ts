/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Inline
 * @license BSD-3-Clause
 ******************************************************************************/

import type { Loc } from "../../Loc.ts";
import { MdextSN } from "../../Stnode.ts";
import type { MdextTk } from "../../Token.ts";
/*80--------------------------------------------------------------------------*/

export abstract class Inline extends MdextSN {
  /**
   * @primaryconst
   * @headconst @param loc_x
   */
  abstract tokenAt(loc_x: Loc): MdextTk;
}
/*80--------------------------------------------------------------------------*/
