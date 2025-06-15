/** 80**************************************************************************
 * @module lib/compiling/RanFac_
 * @license BSD-3-Clause
 ******************************************************************************/

import type { loff_t, uint } from "../alias.ts";
import { Factory } from "../util/Factory.ts";
import type { Tok } from "./alias.ts";
import type { Bufr } from "./Bufr.ts";
import { Loc } from "./Loc.ts";
import { Ran } from "./Ran.ts";
import { TokLine } from "./TokLine.ts";
import type { TokLoc } from "./TokLoc.ts";
import type { TokRan } from "./TokRan.ts";
/*80--------------------------------------------------------------------------*/

class RanFac_ extends Factory<Ran> {
  #bufr!: Bufr;
  /** @borrow @const @param _x */
  setBufr(_x: Bufr): this {
    this.#bufr = _x;
    return this;
  }
  /*64||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

  /** @implement */
  protected createVal$() {
    // /*#static*/ if (PRF) {
    //   console.log(
    //     `%c# of cached Ran instances: ${this.val_a$.length + 1}`,
    //     `color:${LOG_cssc.performance}`,
    //   );
    // }
    return new Ran(new Loc(this.#bufr.frstLine_$, 0));
  }

  protected override reuseVal$(i_x: uint) {
    return this.get(i_x).reset_Ran(this.#bufr);
  }

  /**
   * `in( line_x.bufr)`
   * @borrow @cosnt @param line_x
   * @cosnt @param loff_x
   */
  byTok<T extends Tok>(line_x: TokLine<T>, loff_x?: loff_t): TokRan<T> {
    const ret = this.setBufr(line_x.bufr!)
      .oneMore() as TokRan<T>;
    ret.stopLoc.set_Loc(line_x, loff_x);
    return ret.collapse();
  }
  /**
   * `in( loc_x.bufr)`
   * @borrow @cosnt @param loc_x
   * @borrow @cosnt @param loc_1_x
   */
  byTokLoc<T extends Tok>(loc_x: TokLoc<T>, loc_1_x?: TokLoc<T>): TokRan<T> {
    const ret = this.setBufr(loc_x.bufr!).oneMore() as TokRan<T>;
    ret.strtLoc.become_Loc(loc_x);
    ret.stopLoc.become_Loc(loc_1_x ?? loc_x);
    return ret.ord();
  }
  /**
   * `in( ran_x.bufr)`
   * @borrow @cosnt @param ran_x
   */
  byTokRan<T extends Tok>(ran_x: TokRan<T>): TokRan<T> {
    return this
      .setBufr(ran_x.bufr!)
      .oneMore()
      .become_Ran(ran_x) as TokRan<T>;
  }
}
export const g_ran_fac = new RanFac_();
/*80--------------------------------------------------------------------------*/
