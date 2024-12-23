/** 80**************************************************************************
 * @module lib/compiling/mdext/MdextSN
 * @license BSD-3-Clause
 ******************************************************************************/

import type { uint } from "@fe-lib/alias.ts";
import type { Loc } from "../Loc.ts";
import type { SortedSnt_id } from "../Snt.ts";
import { type SortedStnod_id, Stnode } from "../Stnode.ts";
import type { MdextLexr } from "./MdextLexr.ts";
import type { MdextTok } from "./MdextTok.ts";
/*80--------------------------------------------------------------------------*/

export abstract class MdextSN extends Stnode<MdextTok> {
  /**
   * @primaryconst @param _drtStrtLoc_x
   * @primaryconst @param _drtStopLoc_x
   * @out @param _unrelSnt_sa_x
   * @primaryconst @param _unrelSn_sa_x
   * @return count of what's gathered
   */
  gathrUnrelSnt(
    _drtStrtLoc_x: Loc,
    _drtStopLoc_x: Loc,
    _unrelSnt_sa_x: SortedSnt_id,
    _unrelSn_sa_x?: SortedStnod_id,
  ): uint {
    return 0;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /**
   * @headconst @param _lexr_x
   */
  _toHTML(_lexr_x: MdextLexr): string {
    return "";
  }
}
/*80--------------------------------------------------------------------------*/
