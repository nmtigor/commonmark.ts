/** 80**************************************************************************
 * @module lib/compiling/TokLine
 * @license BSD-3-Clause
 ******************************************************************************/

import type { Tok } from "./alias.ts";
import type { BaseTok } from "./BaseTok.ts";
import { Line } from "./Line.ts";
import type { MdextTok } from "./mdext/MdextTok.ts";
import type { PlainTok } from "./plain/PlainTok.ts";
import type { SetTok } from "./set/SetTok.ts";
import type { TokBufr } from "./TokBufr.ts";
/*80--------------------------------------------------------------------------*/

/** @final */
export class TokLine<T extends Tok = BaseTok> extends Line {
  override get bufr() {
    return this.bufr$ as TokBufr<T> | undefined;
  }

  override get prevLine() {
    return this.prevLine$ as TokLine<T> | undefined;
  }
  override get nextLine() {
    return this.nextLine$ as TokLine<T> | undefined;
  }

  // override linkPrev_$( ret_x:TokLine<T> ):TokLine<T> { return <TokLine<T>>super.linkPrev_$(ret_x); }
  // override linkNext_$( ret_x:TokLine<T> ):TokLine<T> { return <TokLine<T>>super.linkNext_$(ret_x); }

  protected constructor(bufr_x: TokBufr<T>) {
    super(bufr_x);
  }
  /**
   * @package
   * @headconst @param bufr_x
   * @const @param text_x
   */
  static override create<T extends Tok>(bufr_x: TokBufr<T>, text_x?: string) {
    return new TokLine(bufr_x).resetText_$(text_x);
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  // /**
  //  * @param {const } loff_x
  //  */
  // calc_lcol$_( loff_x:loff_t ):lcol_t
  // {
  //   if( loff_x === 0 ) return 0;
  //   if( loff_x === this.#anchr.loff ) return this.#anchr.lcol_1;

  //   // this.#anchr.set( this, loff_x,  )
  //   return 0;
  // }

  // /**
  //  * in( edtr_x.bufr === this.bufr)`
  //  * @headconst @param edtr_x
  //  */
  // getELineIn(edtr_x: EdtrScrolr<T>): ELine<T> {
  //   return edtr_x.eline_m.get(this)!;
  // }
}

export type PlainLine = TokLine<PlainTok>;
export type SetLine = TokLine<SetTok>;
export type MdextLine = TokLine<MdextTok>;
/*80--------------------------------------------------------------------------*/
