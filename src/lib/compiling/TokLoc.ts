/** 80**************************************************************************
 * @module lib/compiling/TokLoc
 * @license BSD-3-Clause
 ******************************************************************************/

import type { lnum_t, loff_t } from "../alias.ts";
import type { Tok } from "./alias.ts";
import { Loc } from "./Loc.ts";
import type { TokBufr } from "./TokBufr.ts";
import type { TokLine } from "./TokLine.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class TokLoc<T extends Tok> extends Loc {
  override get line() {
    return this.line_$ as TokLine<T>;
  }
  override get bufr() {
    return this.line.bufr;
  }

  constructor(line_x: TokLine<T>, loff_x?: loff_t) {
    super(line_x, loff_x);
  }
  /**
   * @headconst @param bufr_x
   * @const @param lidx_x
   * @const @param loff_x
   */
  static override create<U extends Tok>(
    bufr_x: TokBufr<U>,
    lidx_x: lnum_t,
    loff_x?: loff_t,
  ) {
    return new TokLoc<U>(bufr_x.line(lidx_x), loff_x);
  }

  override dup() {
    return new TokLoc<T>(this.line_$ as TokLine<T>, this.loff_$);
  }

  override usingDup(): TokLoc<T> {
    return super.usingDup() as TokLoc<T>;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/
}
/*80--------------------------------------------------------------------------*/
