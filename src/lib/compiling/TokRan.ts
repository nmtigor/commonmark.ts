/** 80**************************************************************************
 * @module lib/compiling/TokRan
 * @license BSD-3-Clause
 ******************************************************************************/

import { Ran } from "./Ran.ts";
import type { Ranval } from "./Ranval.ts";
import type { TokBufr } from "./TokBufr.ts";
import { TokLoc } from "./TokLoc.ts";
import type { Tok } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class TokRan<T extends Tok> extends Ran {
  override get strtLoc() {
    return this.strtLoc$ as TokLoc<T>;
  }
  override get stopLoc() {
    return this.stopLoc$ as TokLoc<T>;
  }
  override get frstLine() {
    return this.strtLoc.line;
  }
  override get lastLine() {
    return this.stopLoc.line;
  }

  /**
   * @headconst @param loc_x [COPIED]
   * @param loc_1_x [COPIED]
   */
  constructor(loc_x: TokLoc<T>, loc_1_x?: TokLoc<T>) {
    super(loc_x, loc_1_x);
  }
  /**
   * @headconst @param bufr_x
   * @const @param rv_x
   */
  static override create<U extends Tok>(bufr_x: TokBufr<U>, rv_x: Ranval) {
    return new TokRan(
      TokLoc.create(bufr_x, rv_x.anchrLidx, rv_x.anchrLoff),
      TokLoc.create(bufr_x, rv_x.focusLidx, rv_x.focusLoff),
    );
  }

  override dup() {
    return new TokRan<T>(this.strtLoc.dup(), this.stopLoc.dup());
  }
}
/*80--------------------------------------------------------------------------*/
