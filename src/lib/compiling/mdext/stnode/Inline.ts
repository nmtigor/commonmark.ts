/** 80**************************************************************************
 * @module lib/compiling/mdext/stnode/Inline
 * @license BSD-3-Clause
 ******************************************************************************/

import type { uint } from "@fe-lib/alias.ts";
import type { Loc } from "../../Loc.ts";
import { SortedSnt_id } from "../../Snt.ts";
import type { MdextTk } from "../../Token.ts";
import { MdextSN } from "../MdextSN.ts";
/*80--------------------------------------------------------------------------*/

export abstract class Inline extends MdextSN {
  /**
   * @primaryconst
   * @headconst @param loc_x
   */
  abstract tokenAt(loc_x: Loc): MdextTk;
  /*49|||||||||||||||||||||||||||||||||||||||||||*/

  override gathrUnrelSnt(
    drtStrtLoc_x: Loc,
    drtStopLoc_x: Loc,
    unrelSnt_sa_x: SortedSnt_id,
  ): uint {
    let ret = 0;
    if (
      this.sntStopLoc.posSE(drtStrtLoc_x) || this.sntStrtLoc.posGE(drtStopLoc_x)
    ) {
      unrelSnt_sa_x.add(this);
      ret = 1;
    }
    return ret;
  }
}
/*80--------------------------------------------------------------------------*/
