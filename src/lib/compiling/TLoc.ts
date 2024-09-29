/** 80**************************************************************************
 * @module lib/compiling/TLoc
 * @license BSD-3-Clause
 ******************************************************************************/

import type { loff_t } from "../alias.ts";
import { Loc } from "./Loc.ts";
import { TLine } from "./TLine.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class TLoc extends Loc {
  override get line() {
    return this.line_$ as TLine;
  }

  /**
   * @headconst @param line_x
   * @const @param loff_x
   */
  constructor(line_x: TLine, loff_x?: loff_t) {
    super(line_x, loff_x);
  }

  override dup() {
    return new TLoc(this.line, this.loff_$);
  }
}
/*80--------------------------------------------------------------------------*/
